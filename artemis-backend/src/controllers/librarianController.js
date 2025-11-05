// ==========================================
// LIBRARIAN CONTROLLER
// Controlador para funciones de bibliotecario
// ==========================================

const db = require("../config/database");

// ==========================================
// REPORTES DE CONTENIDO
// ==========================================

// Crear reporte de contenido inapropiado
exports.createReport = async (req, res) => {
  try {
    const { bookId, chapterId, report_type, reason } = req.body;
    const reporterId = req.user.id;

    console.log(`📢 Bibliotecario ${reporterId} creando reporte`);
    console.log("Tipo:", report_type, "Libro:", bookId, "Capítulo:", chapterId);

    // Validar que el usuario es bibliotecario
    const [user] = await db.query(
      "SELECT is_librarian FROM users WHERE id = ?",
      [reporterId]
    );

    if (!user[0].is_librarian) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos de bibliotecario",
      });
    }

    // Validar datos
    if (!report_type || !reason) {
      return res.status(400).json({
        success: false,
        message: "Tipo de reporte y razón son requeridos",
      });
    }

    if (report_type === "inappropriate_book" && !bookId) {
      return res.status(400).json({
        success: false,
        message: "ID del libro es requerido para reportar un libro",
      });
    }

    if (report_type === "inappropriate_chapter" && (!bookId || !chapterId)) {
      return res.status(400).json({
        success: false,
        message: "ID del libro y capítulo son requeridos",
      });
    }

    // Verificar que el contenido existe
    if (report_type === "inappropriate_book") {
      const [books] = await db.query("SELECT id FROM books WHERE id = ?", [
        bookId,
      ]);
      if (books.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Libro no encontrado",
        });
      }
    } else if (report_type === "inappropriate_chapter") {
      const [chapters] = await db.query(
        "SELECT id FROM chapters WHERE id = ? AND book_id = ?",
        [chapterId, bookId]
      );
      if (chapters.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Capítulo no encontrado",
        });
      }
    }

    // Crear reporte
    const [result] = await db.query(
      `INSERT INTO content_reports 
       (reporter_id, book_id, chapter_id, report_type, reason) 
       VALUES (?, ?, ?, ?, ?)`,
      [reporterId, bookId || null, chapterId || null, report_type, reason]
    );

    const reportId = result.insertId;

    // Notificar a todos los admins
    const [admins] = await db.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    for (const admin of admins) {
      await db.query(
        `INSERT INTO admin_notifications 
         (admin_id, report_id, notification_type) 
         VALUES (?, ?, 'new_report')`,
        [admin.id, reportId]
      );
    }

    console.log(`✅ Reporte #${reportId} creado y admins notificados`);

    res.json({
      success: true,
      message: "Reporte enviado correctamente",
      reportId: reportId,
    });
  } catch (error) {
    console.error("❌ Error creando reporte:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear reporte",
      error: error.message,
    });
  }
};

// Obtener reportes del bibliotecario
exports.getMyReports = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { status } = req.query; // 'pending', 'reviewed', 'dismissed', o 'all'

    console.log(`📋 Obteniendo reportes del bibliotecario ${reporterId}`);

    let query = `
      SELECT 
        cr.*,
        b.title as book_title,
        b.writer_id,
        w.username as writer_name,
        c.title as chapter_title,
        a.username as reviewed_by_name
      FROM content_reports cr
      LEFT JOIN books b ON cr.book_id = b.id
      LEFT JOIN users w ON b.writer_id = w.id
      LEFT JOIN chapters c ON cr.chapter_id = c.id
      LEFT JOIN users a ON cr.reviewed_by = a.id
      WHERE cr.reporter_id = ?
    `;

    const params = [reporterId];

    if (status && status !== "all") {
      query += " AND cr.status = ?";
      params.push(status);
    }

    query += " ORDER BY cr.created_at DESC";

    const [reports] = await db.query(query, params);

    console.log(`✅ ${reports.length} reportes encontrados`);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reportes",
      error: error.message,
    });
  }
};

// Obtener estadísticas del bibliotecario
exports.getLibrarianStats = async (req, res) => {
  try {
    const librarianId = req.user.id;

    console.log(`📊 Obteniendo estadísticas del bibliotecario ${librarianId}`);

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_reports,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed_reports
      FROM content_reports
      WHERE reporter_id = ?`,
      [librarianId]
    );

    console.log("✅ Estadísticas obtenidas");

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};

// Eliminar reporte propio (solo si está pendiente)
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const librarianId = req.user.id;

    console.log(
      `🗑️ Bibliotecario ${librarianId} eliminando reporte ${reportId}`
    );

    // Verificar que el reporte existe y es del bibliotecario
    const [reports] = await db.query(
      "SELECT status FROM content_reports WHERE id = ? AND reporter_id = ?",
      [reportId, librarianId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado o no tienes permisos",
      });
    }

    if (reports[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden eliminar reportes pendientes",
      });
    }

    // ✅ Eliminar notificaciones asociadas al reporte para todos los admins
    await db.query("DELETE FROM admin_notifications WHERE report_id = ?", [
      reportId,
    ]);

    // Eliminar reporte
    await db.query("DELETE FROM content_reports WHERE id = ?", [reportId]);

    console.log(
      "✅ Reporte y notificaciones a admins eliminados correctamente"
    );

    res.json({
      success: true,
      message: "Reporte eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error eliminando reporte:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar reporte",
      error: error.message,
    });
  }
};

// Obtener libros para revisar (todos los libros publicados)
exports.getBooksToReview = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📚 Obteniendo libros para revisar (página ${page})`);

    let query = `
      SELECT 
        b.*,
        u.username as writer_name,
        COUNT(DISTINCT c.id) as chapter_count,
        COUNT(DISTINCT cr.id) as report_count
      FROM books b
      LEFT JOIN users u ON b.writer_id = u.id
      LEFT JOIN chapters c ON c.book_id = b.id
      LEFT JOIN content_reports cr ON cr.book_id = b.id AND cr.status = 'pending'
      WHERE b.status = 'published'
    `;

    const params = [];

    if (search) {
      query += " AND (b.title LIKE ? OR u.username LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " GROUP BY b.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [books] = await db.query(query, params);

    // Contar total
    let countQuery = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM books b
      LEFT JOIN users u ON b.writer_id = u.id
      WHERE b.status = 'published'
    `;

    if (search) {
      countQuery += " AND (b.title LIKE ? OR u.username LIKE ?)";
    }

    const [countResult] = await db.query(
      countQuery,
      search ? [`%${search}%`, `%${search}%`] : []
    );

    console.log(`✅ ${books.length} libros encontrados`);

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo libros:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener libros",
      error: error.message,
    });
  }
};

// Obtener capítulos de un libro para revisar
exports.getBookChapters = async (req, res) => {
  try {
    const { bookId } = req.params;

    console.log(`📖 Obteniendo capítulos del libro ${bookId}`);

    const [chapters] = await db.query(
      `SELECT 
        c.*,
        COUNT(DISTINCT cr.id) as report_count
      FROM chapters c
      LEFT JOIN content_reports cr ON cr.chapter_id = c.id AND cr.status = 'pending'
      WHERE c.book_id = ?
      GROUP BY c.id
      ORDER BY c.chapter_number ASC`,
      [bookId]
    );

    console.log(`✅ ${chapters.length} capítulos encontrados`);

    res.json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    console.error("❌ Error obteniendo capítulos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener capítulos",
      error: error.message,
    });
  }
};

module.exports = exports;