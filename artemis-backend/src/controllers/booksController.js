const db = require("../config/database");

exports.getAllBooks = async (req, res) => {
  try {
    const [books] = await db.query(`
      SELECT b.*, u.username as writer_name 
      FROM books b 
      JOIN users u ON b.writer_id = u.id 
      WHERE b.status = 'published'
      ORDER BY b.published_at DESC
    `);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtener solo libros publicados con estadísticas
exports.getPublishedBooks = async (req, res) => {
  try {
    console.log("📚 Obteniendo libros publicados con estadísticas");

    const [books] = await db.query(`
      SELECT 
        b.*, 
        u.username as writer_name,
        u.profile_image_url as writer_profile_image,
        (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as like_count,
        (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislike_count,
        (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comment_count,
        (SELECT COUNT(DISTINCT user_id) FROM book_views WHERE book_id = b.id) as view_count
      FROM books b 
      JOIN users u ON b.writer_id = u.id 
      WHERE b.status = 'published'
      ORDER BY b.published_at DESC
    `);

    console.log("✅ Libros publicados encontrados:", books.length);
    res.json(books);
  } catch (error) {
    console.error("❌ Error en getPublishedBooks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtener libros del usuario autenticado
exports.getMyBooks = async (req, res) => {
  try {
    console.log("📚 Obteniendo libros del usuario:", req.user.id);

    const [books] = await db.query(
      `
      SELECT b.*, u.username as writer_name 
      FROM books b 
      JOIN users u ON b.writer_id = u.id 
      WHERE b.writer_id = ?
      ORDER BY b.created_at DESC
    `,
      [req.user.id]
    );

    console.log("✅ Libros encontrados:", books.length);
    res.json(books);
  } catch (error) {
    console.error("❌ Error en getMyBooks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ACTUALIZADO - Obtener libro por ID con visualizaciones y capítulos
exports.getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    console.log("📖 Obteniendo libro con ID:", bookId);

    // Obtener información del libro con estadísticas
    const [books] = await db.query(
      `
      SELECT 
        b.*, 
        u.username as writer_name,
        u.profile_image_url as writer_profile_image,
        (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as like_count,
        (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislike_count,
        (SELECT COUNT(DISTINCT user_id) FROM book_views WHERE book_id = b.id) as view_count,
        (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comment_count
      FROM books b 
      JOIN users u ON b.writer_id = u.id 
      WHERE b.id = ?
    `,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // Si el libro es de tipo in_app, obtener capítulos
    if (book.type === "in_app") {
      const [chapters] = await db.query(
        `SELECT 
          id,
          chapter_number,
          title,
          content,
          created_at,
          updated_at
        FROM chapters 
        WHERE book_id = ? 
        ORDER BY chapter_number ASC`,
        [bookId]
      );
      book.chapters = chapters;
      console.log("📑 Capítulos encontrados:", chapters.length);
    }

    console.log("✅ Libro obtenido exitosamente");
    res.json(book);
  } catch (error) {
    console.error("❌ Error en getBookById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// NUEVA FUNCIÓN - Registrar visualización de un libro
exports.registerView = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.user.id;

    console.log(
      "👁️ Registrando visualización - Libro:",
      bookId,
      "Usuario:",
      userId
    );

    // Verificar que el libro existe y está publicado
    const [books] = await db.query(
      "SELECT id, status FROM books WHERE id = ? AND status = 'published'",
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({
        message: "Book not found or not published",
      });
    }

    // Insertar o actualizar la visualización (INSERT IGNORE no genera error si ya existe)
    await db.query(
      `INSERT INTO book_views (book_id, user_id, viewed_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE viewed_at = NOW()`,
      [bookId, userId]
    );

    // Obtener el contador actualizado
    const [viewCount] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM book_views WHERE book_id = ?",
      [bookId]
    );

    console.log(
      "✅ Visualización registrada. Total de vistas únicas:",
      viewCount[0].count
    );

    res.json({
      success: true,
      message: "View registered successfully",
      view_count: viewCount[0].count,
    });
  } catch (error) {
    console.error("❌ Error en registerView:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// NUEVA FUNCIÓN - Obtener estadísticas de visualizaciones de un libro
exports.getBookViewStats = async (req, res) => {
  try {
    const bookId = req.params.id;

    console.log(
      "📊 Obteniendo estadísticas de visualizaciones del libro:",
      bookId
    );

    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT user_id) as unique_views,
        COUNT(*) as total_views,
        MAX(viewed_at) as last_view
      FROM book_views 
      WHERE book_id = ?`,
      [bookId]
    );

    console.log("✅ Estadísticas obtenidas:", stats[0]);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("❌ Error en getBookViewStats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, genre, synopsis, cover_image_url, type } = req.body;
    const writer_id = req.user.id;

    console.log("📗 Creando libro para usuario:", writer_id);

    const [result] = await db.query(
      "INSERT INTO books (writer_id, title, genre, synopsis, cover_image_url, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        writer_id,
        title,
        genre,
        synopsis,
        cover_image_url,
        type || "in_app",
        "draft",
      ]
    );

    console.log("✅ Libro creado con ID:", result.insertId);

    res.status(201).json({
      message: "Book created successfully",
      bookId: result.insertId,
      id: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error creando libro:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { title, genre, synopsis, cover_image_url, status } = req.body;
    const bookId = req.params.id;

    // Verificar que el libro pertenece al usuario o es admin
    const [books] = await db.query("SELECT * FROM books WHERE id = ?", [
      bookId,
    ]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (books[0].writer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Construir query dinámicamente según los campos proporcionados
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (genre !== undefined) {
      updates.push("genre = ?");
      values.push(genre);
    }
    if (synopsis !== undefined) {
      updates.push("synopsis = ?");
      values.push(synopsis);
    }
    if (cover_image_url !== undefined) {
      updates.push("cover_image_url = ?");
      values.push(cover_image_url);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    values.push(bookId);

    await db.query(
      `UPDATE books SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ message: "Book updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    const [books] = await db.query("SELECT * FROM books WHERE id = ?", [
      bookId,
    ]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (books[0].writer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await db.query("DELETE FROM books WHERE id = ?", [bookId]);
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.submitBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    const [books] = await db.query("SELECT * FROM books WHERE id = ?", [
      bookId,
    ]);
    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (books[0].writer_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await db.query("UPDATE books SET status = ? WHERE id = ?", [
      "submitted",
      bookId,
    ]);
    res.json({ message: "Book submitted for review" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.publishBook = async (req, res) => {
  try {
    console.log("📚 Iniciando proceso de publicación...");
    const bookId = req.params.id;

    const [books] = await db.query(`SELECT * FROM books WHERE id = ?`, [
      bookId,
    ]);

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Libro no encontrado",
      });
    }

    const book = books[0];

    if (book.writer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para publicar este libro",
      });
    }

    if (!book.title || !book.genre || !book.synopsis) {
      return res.status(400).json({
        success: false,
        message:
          "El libro debe tener título, género y sinopsis antes de ser publicado",
        missingFields: {
          title: !book.title,
          genre: !book.genre,
          synopsis: !book.synopsis,
        },
      });
    }

    const [chapters] = await db.query(
      "SELECT id, title, content FROM chapters WHERE book_id = ?",
      [bookId]
    );

    if (chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El libro debe tener al menos un capítulo para ser publicado",
      });
    }

    const chaptersWithoutContent = chapters.filter(
      (chapter) => !chapter.content || chapter.content.trim().length === 0
    );

    if (chaptersWithoutContent.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Todos los capítulos deben tener contenido",
        emptyChapters: chaptersWithoutContent.map((c) => ({
          id: c.id,
          title: c.title,
        })),
      });
    }

    await db.query(
      "UPDATE books SET status = ?, published_at = NOW() WHERE id = ?",
      ["published", bookId]
    );

    console.log("✅ Libro publicado exitosamente");
    res.json({
      success: true,
      message: "Libro publicado exitosamente",
      publishedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error publicando libro:", error);
    res.status(500).json({
      success: false,
      message: "Error al publicar el libro",
      error: error.message,
    });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const bookId = req.params.id;

    const [books] = await db.query(
      `SELECT b.*, u.username as writer_name 
       FROM books b 
       JOIN users u ON b.writer_id = u.id 
       WHERE b.id = ?`,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    const [chapters] = await db.query(
      "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number",
      [bookId]
    );

    res.json({
      message: "PDF generation would happen here",
      book,
      chapters,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NUEVA FUNCIÓN - Descargar capítulo individual como PDF
exports.downloadChapterPDF = async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;

    console.log(
      "📥 Generando PDF para capítulo:",
      chapterId,
      "del libro:",
      bookId
    );

    // Obtener información del libro
    const [books] = await db.query(
      `SELECT b.*, u.username as writer_name 
       FROM books b 
       JOIN users u ON b.writer_id = u.id 
       WHERE b.id = ?`,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = books[0];

    // Obtener el capítulo específico
    const [chapters] = await db.query(
      "SELECT * FROM chapters WHERE id = ? AND book_id = ?",
      [chapterId, bookId]
    );

    if (chapters.length === 0) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapter = chapters[0];

    // Generar el PDF con PDFKit
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Configurar headers para descarga
    const filename = `${book.title.replace(/[^a-z0-9]/gi, "_")}_Capitulo_${
      chapter.chapter_number
    }.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe el PDF directamente a la respuesta
    doc.pipe(res);

    // Agregar contenido al PDF

    // Título del libro
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(book.title, { align: "center" });

    doc.moveDown(0.5);

    // Autor
    doc
      .fontSize(14)
      .font("Helvetica")
      .text(`Por ${book.writer_name}`, { align: "center" });

    doc.moveDown(2);

    // Número y título del capítulo
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`Capítulo ${chapter.chapter_number}`, { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(chapter.title, { align: "center" });

    doc.moveDown(2);

    // Contenido del capítulo
    // Limpiar el contenido de HTML si es necesario
    let content = chapter.content;

    // Remover etiquetas HTML básicas
    content = content.replace(/<br\s*\/?>/gi, "\n");
    content = content.replace(/<\/p>/gi, "\n\n");
    content = content.replace(/<p>/gi, "");
    content = content.replace(/<[^>]*>/g, "");

    // Decodificar entidades HTML
    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/&amp;/g, "&");
    content = content.replace(/&lt;/g, "<");
    content = content.replace(/&gt;/g, ">");
    content = content.replace(/&quot;/g, '"');

    // Agregar el contenido con formato de libro
    doc.fontSize(12).font("Helvetica").text(content, {
      align: "justify",
      lineGap: 5,
    });

    // Agregar pie de página
    doc.moveDown(3);
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text(`Generado desde Artemis - ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

    // Finalizar el PDF
    doc.end();

    console.log("✅ PDF generado exitosamente");
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;
