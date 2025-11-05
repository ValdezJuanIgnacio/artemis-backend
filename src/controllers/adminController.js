// ==========================================
// ADMIN CONTROLLER
// Controlador para funciones de administrador
// ==========================================

const db = require("../config/database");

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// Obtener todos los usuarios (para admin)
exports.getAllUsers = async (req, res) => {
  try {
    console.log("👥 Admin obteniendo lista de usuarios");

    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.is_librarian,
        u.profile_image_url,
        u.created_at,
        COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) as total_books,
        COUNT(DISTINCT c.id) as total_chapters,
        COUNT(DISTINCT l.id) as total_likes
      FROM users u
      LEFT JOIN books b ON b.writer_id = u.id
      LEFT JOIN chapters c ON c.book_id = b.id
      LEFT JOIN likes l ON l.book_id = b.id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    console.log(`✅ ${users.length} usuarios encontrados`);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("❌ Error obteniendo usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

// Obtener perfil completo de un usuario (para admin)
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("👤 Admin obteniendo perfil del usuario:", userId);

    // Obtener datos del usuario
    const [users] = await db.query(
      `SELECT 
        id, username, email, role, is_librarian, 
        profile_image_url, created_at
      FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = users[0];

    // Obtener libros publicados del usuario
    const [books] = await db.query(
      `SELECT 
        b.*,
        COUNT(DISTINCT c.id) as chapter_count,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT bv.user_id) as view_count
      FROM books b
      LEFT JOIN chapters c ON c.book_id = b.id
      LEFT JOIN likes l ON l.book_id = b.id
      LEFT JOIN book_views bv ON bv.book_id = b.id
      WHERE b.writer_id = ? AND b.status = 'published'
      GROUP BY b.id
      ORDER BY b.created_at DESC`,
      [userId]
    );

    // Obtener estadísticas solo de libros publicados
    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) as total_books,
        COUNT(DISTINCT c.id) as total_chapters,
        COUNT(DISTINCT l.id) as total_likes,
        COUNT(DISTINCT bv.user_id) as total_views,
        COUNT(DISTINCT com.id) as total_comments
      FROM users u
      LEFT JOIN books b ON b.writer_id = u.id AND b.status = 'published'
      LEFT JOIN chapters c ON c.book_id = b.id
      LEFT JOIN likes l ON l.book_id = b.id
      LEFT JOIN book_views bv ON bv.book_id = b.id
      LEFT JOIN comments com ON com.book_id = b.id
      WHERE u.id = ?`,
      [userId]
    );

    console.log("✅ Perfil de usuario obtenido");

    res.json({
      success: true,
      data: {
        user,
        books,
        stats: stats[0],
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
};

// Eliminar usuario (y todo su contenido)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    console.log(`🗑️ Admin ${adminId} eliminando usuario ${userId}`);

    // Verificar que el usuario existe y no es admin
    const [users] = await db.query("SELECT role FROM users WHERE id = ?", [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (users[0].role === "admin") {
      return res.status(403).json({
        success: false,
        message: "No se puede eliminar a un administrador",
      });
    }

    // Eliminar usuario (CASCADE eliminará sus libros, capítulos, etc.)
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)",
      [adminId, "delete_user", userId, `Usuario eliminado por admin ${adminId}`]
    );

    console.log("✅ Usuario eliminado exitosamente");

    res.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error eliminando usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
      error: error.message,
    });
  }
};

// Promover usuario a bibliotecario
exports.promoteToLibrarian = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    console.log(
      `📚 Admin ${adminId} promoviendo usuario ${userId} a bibliotecario`
    );

    await db.query("UPDATE users SET is_librarian = TRUE WHERE id = ?", [
      userId,
    ]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)",
      [
        adminId,
        "promote_librarian",
        userId,
        `Usuario promovido a bibliotecario`,
      ]
    );

    console.log("✅ Usuario promovido a bibliotecario");

    res.json({
      success: true,
      message: "Usuario promovido a bibliotecario correctamente",
    });
  } catch (error) {
    console.error("❌ Error promoviendo usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al promover usuario",
      error: error.message,
    });
  }
};

// Quitar rol de bibliotecario
exports.demoteFromLibrarian = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    console.log(
      `📚 Admin ${adminId} quitando rol de bibliotecario a usuario ${userId}`
    );

    await db.query("UPDATE users SET is_librarian = FALSE WHERE id = ?", [
      userId,
    ]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)",
      [adminId, "demote_librarian", userId, `Rol de bibliotecario removido`]
    );

    console.log("✅ Rol de bibliotecario removido");

    res.json({
      success: true,
      message: "Rol de bibliotecario removido correctamente",
    });
  } catch (error) {
    console.error("❌ Error quitando rol:", error);
    res.status(500).json({
      success: false,
      message: "Error al quitar rol de bibliotecario",
      error: error.message,
    });
  }
};

// ==========================================
// GESTIÓN DE LIBROS Y CAPÍTULOS
// ==========================================

// Eliminar libro (admin)
exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const adminId = req.user.id;

    console.log(`🗑️ Admin ${adminId} eliminando libro ${bookId}`);

    // Obtener info del libro antes de eliminar
    const [books] = await db.query(
      "SELECT writer_id, title FROM books WHERE id = ?",
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Libro no encontrado",
      });
    }

    // Eliminar libro
    await db.query("DELETE FROM books WHERE id = ?", [bookId]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_book_id, target_user_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        adminId,
        "delete_book",
        bookId,
        books[0].writer_id,
        `Libro "${books[0].title}" eliminado`,
      ]
    );

    console.log("✅ Libro eliminado exitosamente");

    res.json({
      success: true,
      message: "Libro eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error eliminando libro:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar libro",
      error: error.message,
    });
  }
};

// Eliminar capítulo (admin)
exports.deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const adminId = req.user.id;

    console.log(`🗑️ Admin ${adminId} eliminando capítulo ${chapterId}`);

    // Obtener info del capítulo antes de eliminar
    const [chapters] = await db.query(
      `SELECT c.title, b.writer_id 
       FROM chapters c 
       JOIN books b ON c.book_id = b.id 
       WHERE c.id = ?`,
      [chapterId]
    );

    if (chapters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Capítulo no encontrado",
      });
    }

    // Eliminar capítulo
    await db.query("DELETE FROM chapters WHERE id = ?", [chapterId]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, target_chapter_id, target_user_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        adminId,
        "delete_chapter",
        chapterId,
        chapters[0].writer_id,
        `Capítulo "${chapters[0].title}" eliminado`,
      ]
    );

    console.log("✅ Capítulo eliminado exitosamente");

    res.json({
      success: true,
      message: "Capítulo eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error eliminando capítulo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar capítulo",
      error: error.message,
    });
  }
};

// ==========================================
// GESTIÓN DE REPORTES
// ==========================================

// Obtener todos los reportes pendientes
exports.getPendingReports = async (req, res) => {
  try {
    console.log("📋 Obteniendo reportes pendientes");

    const [reports] = await db.query(`
      SELECT 
        cr.*,
        u.username as reporter_name,
        u.email as reporter_email,
        b.title as book_title,
        b.writer_id,
        w.username as writer_name,
        c.title as chapter_title
      FROM content_reports cr
      LEFT JOIN users u ON cr.reporter_id = u.id
      LEFT JOIN books b ON cr.book_id = b.id
      LEFT JOIN users w ON b.writer_id = w.id
      LEFT JOIN chapters c ON cr.chapter_id = c.id
      WHERE cr.status = 'pending'
      ORDER BY cr.created_at DESC
    `);

    console.log(`✅ ${reports.length} reportes pendientes encontrados`);

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

// Obtener notificaciones del admin
exports.getAdminNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;

    console.log("🔔 Obteniendo notificaciones del admin:", adminId);

    const [notifications] = await db.query(
      `
      SELECT 
        an.*,
        cr.report_type,
        cr.reason,
        u.username as reporter_name,
        b.title as book_title,
        c.title as chapter_title
      FROM admin_notifications an
      JOIN content_reports cr ON an.report_id = cr.id
      LEFT JOIN users u ON cr.reporter_id = u.id
      LEFT JOIN books b ON cr.book_id = b.id
      LEFT JOIN chapters c ON cr.chapter_id = c.id
      WHERE an.admin_id = ?
      ORDER BY an.created_at DESC
      LIMIT 50
    `,
      [adminId]
    );

    // Contar notificaciones no leídas
    const [unreadCount] = await db.query(
      "SELECT COUNT(*) as count FROM admin_notifications WHERE admin_id = ? AND is_read = FALSE",
      [adminId]
    );

    console.log(`✅ ${notifications.length} notificaciones obtenidas`);

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount[0].count,
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo notificaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener notificaciones",
      error: error.message,
    });
  }
};

// Marcar notificación como leída
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const adminId = req.user.id;

    console.log(`✅ Marcando notificación ${notificationId} como leída`);

    await db.query(
      "UPDATE admin_notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND admin_id = ?",
      [notificationId, adminId]
    );

    res.json({
      success: true,
      message: "Notificación marcada como leída",
    });
  } catch (error) {
    console.error("❌ Error marcando notificación:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar notificación",
      error: error.message,
    });
  }
};

// ✅ NUEVA FUNCIÓN: Marcar reporte como "visto" - lo elimina del reporte del bibliotecario y del admin
exports.markReportAsSeen = async (req, res) => {
  try {
    const { reportId } = req.params;
    const adminId = req.user.id;

    console.log(`👁️ Admin ${adminId} marcando reporte ${reportId} como visto`);

    // Verificar que el reporte existe
    const [reports] = await db.query(
      "SELECT * FROM content_reports WHERE id = ?",
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      });
    }

    // Actualizar estado del reporte a "reviewed" (revisado/visto)
    await db.query(
      "UPDATE content_reports SET status = 'reviewed', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [adminId, reportId]
    );

    // Eliminar notificaciones asociadas al reporte para todos los admins
    await db.query("DELETE FROM admin_notifications WHERE report_id = ?", [
      reportId,
    ]);

    // Registrar en logs
    await db.query(
      "INSERT INTO admin_logs (admin_id, action_type, details) VALUES (?, ?, ?)",
      [adminId, "mark_report_seen", `Reporte #${reportId} marcado como visto`]
    );

    console.log("✅ Reporte marcado como visto correctamente");

    res.json({
      success: true,
      message: "Reporte marcado como visto correctamente",
    });
  } catch (error) {
    console.error("❌ Error marcando reporte como visto:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar reporte como visto",
      error: error.message,
    });
  }
};

// Revisar reporte (aprobar o rechazar)
exports.reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, admin_notes } = req.body; // action: 'dismiss' o 'delete_content'
    const adminId = req.user.id;

    console.log(`🔍 Admin ${adminId} revisando reporte ${reportId}`);

    // Obtener info del reporte
    const [reports] = await db.query(
      "SELECT * FROM content_reports WHERE id = ?",
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      });
    }

    const report = reports[0];

    if (action === "delete_content") {
      // Eliminar el contenido reportado
      if (report.report_type === "inappropriate_book") {
        await db.query("DELETE FROM books WHERE id = ?", [report.book_id]);

        // Log de admin
        await db.query(
          "INSERT INTO admin_logs (admin_id, action_type, target_book_id, details) VALUES (?, ?, ?, ?)",
          [
            adminId,
            "delete_book",
            report.book_id,
            `Libro eliminado por reporte #${reportId}`,
          ]
        );
      } else if (report.report_type === "inappropriate_chapter") {
        await db.query("DELETE FROM chapters WHERE id = ?", [
          report.chapter_id,
        ]);

        // Log de admin
        await db.query(
          "INSERT INTO admin_logs (admin_id, action_type, target_chapter_id, details) VALUES (?, ?, ?, ?)",
          [
            adminId,
            "delete_chapter",
            report.chapter_id,
            `Capítulo eliminado por reporte #${reportId}`,
          ]
        );
      }
    }

    // Actualizar estado del reporte
    await db.query(
      "UPDATE content_reports SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [
        action === "dismiss" ? "dismissed" : "reviewed",
        admin_notes,
        adminId,
        reportId,
      ]
    );

    // Eliminar notificaciones asociadas
    await db.query("DELETE FROM admin_notifications WHERE report_id = ?", [
      reportId,
    ]);

    console.log("✅ Reporte revisado exitosamente");

    res.json({
      success: true,
      message: "Reporte revisado correctamente",
    });
  } catch (error) {
    console.error("❌ Error revisando reporte:", error);
    res.status(500).json({
      success: false,
      message: "Error al revisar reporte",
      error: error.message,
    });
  }
};

// Obtener logs de actividad del admin
exports.getAdminLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    console.log("📜 Obteniendo logs de actividad");

    const [logs] = await db.query(
      `
      SELECT 
        al.*,
        u.username as admin_name,
        tu.username as target_user_name,
        b.title as target_book_title,
        c.title as target_chapter_title
      FROM admin_logs al
      LEFT JOIN users u ON al.admin_id = u.id
      LEFT JOIN users tu ON al.target_user_id = tu.id
      LEFT JOIN books b ON al.target_book_id = b.id
      LEFT JOIN chapters c ON al.target_chapter_id = c.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `,
      [parseInt(limit)]
    );

    console.log(`✅ ${logs.length} logs obtenidos`);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("❌ Error obteniendo logs:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener logs",
      error: error.message,
    });
  }
};

module.exports = exports;