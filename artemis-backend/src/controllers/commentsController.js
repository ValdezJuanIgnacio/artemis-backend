const pool = require("../config/database");

// Obtener comentarios de un libro
exports.getBookComments = async (req, res) => {
  try {
    const { bookId } = req.params;

    console.log("💬 Obteniendo comentarios del libro:", bookId);

    // Query más simple sin filtrar por parent_id
    const [comments] = await pool.query(
      `SELECT 
        c.*, 
        u.username, 
        u.username as author_name,
        u.profile_image_url as user_profile_image
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.book_id = ?
      ORDER BY c.created_at DESC`,
      [bookId]
    );

    console.log("✅ Comentarios encontrados:", comments.length);

    // Filtrar comentarios principales en JavaScript para evitar problemas con nombres de columnas
    const mainComments = comments.filter(
      (c) => !c.parent_id && !c.parent_comment_id
    );

    res.json(mainComments);
  } catch (error) {
    console.error("❌ Error en getBookComments:", error);
    console.error("Error completo:", JSON.stringify(error, null, 2));
    console.error("SQL Message:", error.sqlMessage);
    console.error("SQL:", error.sql);
    res.status(500).json({
      success: false,
      message: "Error retrieving book comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      sqlError:
        process.env.NODE_ENV === "development" ? error.sqlMessage : undefined,
    });
  }
};

// Obtener comentarios de un capítulo
exports.getChapterComments = async (req, res) => {
  try {
    const { chapterId } = req.params;

    console.log("💬 Obteniendo comentarios del capítulo:", chapterId);

    const [comments] = await pool.query(
      `SELECT 
        c.*, 
        u.username,
        u.username as author_name,
        u.profile_image_url as user_profile_image
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.chapter_id = ?
      ORDER BY c.created_at DESC`,
      [chapterId]
    );

    console.log("✅ Comentarios encontrados:", comments.length);

    // Filtrar comentarios principales en JavaScript
    const mainComments = comments.filter(
      (c) => !c.parent_id && !c.parent_comment_id
    );

    res.json(mainComments);
  } catch (error) {
    console.error("❌ Error en getChapterComments:", error);
    console.error("SQL Message:", error.sqlMessage);
    res.status(500).json({
      success: false,
      message: "Error retrieving chapter comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener respuestas a un comentario
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    console.log("💬 Obteniendo respuestas del comentario:", commentId);

    // Intentar con ambos nombres de columna
    const [replies] = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.username as author_name,
        u.profile_image_url as user_profile_image
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_comment_id = ? OR c.parent_id = ?
       ORDER BY c.created_at ASC`,
      [commentId, commentId]
    );

    console.log("✅ Respuestas encontradas:", replies.length);

    res.json({
      success: true,
      data: replies,
    });
  } catch (error) {
    console.error("❌ Error en getCommentReplies:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving comment replies",
    });
  }
};

// Crear un nuevo comentario
exports.createComment = async (req, res) => {
  try {
    const {
      bookId,
      book_id,
      chapterId,
      chapter_id,
      content,
      parent_id,
      parent_comment_id,
    } = req.body;
    const userId = req.user.id;

    const finalBookId = bookId || book_id;
    const finalChapterId = chapterId || chapter_id;
    const finalParentId = parent_id || parent_comment_id;

    console.log("💬 Creando comentario - Usuario:", userId);
    console.log("Datos:", {
      finalBookId,
      finalChapterId,
      finalParentId,
      contentLength: content?.length,
    });

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    if (!finalBookId && !finalChapterId) {
      return res.status(400).json({
        success: false,
        message: "Either bookId or chapterId is required",
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment is too long (max 1000 characters)",
      });
    }

    // Intentar insertar con el nombre de columna correcto
    let result;
    try {
      // Primero intentar con parent_comment_id
      [result] = await pool.query(
        `INSERT INTO comments (user_id, book_id, chapter_id, parent_comment_id, content)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          finalBookId || null,
          finalChapterId || null,
          finalParentId || null,
          content,
        ]
      );
    } catch (insertError) {
      if (insertError.code === "ER_BAD_FIELD_ERROR") {
        // Si falla, intentar con parent_id
        console.log(
          "⚠️ Intentando con parent_id en lugar de parent_comment_id"
        );
        [result] = await pool.query(
          `INSERT INTO comments (user_id, book_id, chapter_id, parent_id, content)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            finalBookId || null,
            finalChapterId || null,
            finalParentId || null,
            content,
          ]
        );
      } else {
        throw insertError;
      }
    }

    console.log("✅ Comentario creado con ID:", result.insertId);

    const [newComment] = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.username as author_name,
        u.profile_image_url as user_profile_image
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newComment[0],
      message: "Comment created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating comment:", error);
    console.error("SQL Message:", error.sqlMessage);
    res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      sqlError:
        process.env.NODE_ENV === "development" ? error.sqlMessage : undefined,
    });
  }
};

// Responder a un comentario
exports.replyToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    console.log("↩️ Respondiendo a comentario:", commentId);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const [parentComment] = await pool.query(
      "SELECT * FROM comments WHERE id = ?",
      [commentId]
    );

    if (parentComment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent comment not found",
      });
    }

    // Intentar con parent_comment_id primero, luego con parent_id
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO comments (user_id, book_id, chapter_id, parent_comment_id, content)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          parentComment[0].book_id,
          parentComment[0].chapter_id,
          commentId,
          content,
        ]
      );
    } catch (insertError) {
      if (insertError.code === "ER_BAD_FIELD_ERROR") {
        [result] = await pool.query(
          `INSERT INTO comments (user_id, book_id, chapter_id, parent_id, content)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            parentComment[0].book_id,
            parentComment[0].chapter_id,
            commentId,
            content,
          ]
        );
      } else {
        throw insertError;
      }
    }

    const [newReply] = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.username as author_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    console.log("✅ Respuesta creada");

    res.json({
      success: true,
      data: newReply[0],
      message: "Reply added successfully",
    });
  } catch (error) {
    console.error("❌ Error replying to comment:", error);
    res.status(500).json({
      success: false,
      message: "Error replying to comment",
    });
  }
};

// Actualizar un comentario
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    console.log("✏️ Actualizando comentario:", id);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const [comment] = await pool.query("SELECT * FROM comments WHERE id = ?", [
      id,
    ]);

    if (comment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [
      content,
      id,
    ]);

    const [updatedComment] = await pool.query(
      `SELECT c.*, u.username, u.username as author_name
       FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [id]
    );

    console.log("✅ Comentario actualizado");

    res.json({
      success: true,
      data: updatedComment[0],
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating comment",
    });
  }
};

// Eliminar un comentario
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("🗑️ Eliminando comentario:", id);

    const [comment] = await pool.query("SELECT * FROM comments WHERE id = ?", [
      id,
    ]);

    if (comment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Intentar eliminar con ambos nombres de columna
    try {
      await pool.query(
        "DELETE FROM comments WHERE id = ? OR parent_comment_id = ?",
        [id, id]
      );
    } catch (deleteError) {
      if (deleteError.code === "ER_BAD_FIELD_ERROR") {
        await pool.query("DELETE FROM comments WHERE id = ? OR parent_id = ?", [
          id,
          id,
        ]);
      } else {
        throw deleteError;
      }
    }

    console.log("✅ Comentario eliminado");

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting comment",
    });
  }
};

module.exports = exports;
