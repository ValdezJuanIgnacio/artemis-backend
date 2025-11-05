const pool = require("../config/database");

// Obtener interacciones del usuario para un libro específico
exports.getUserInteractions = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(
      `🔎 getUserInteractions called for bookId=${bookId} userId=${userId}`
    );

    // Obtener todas las interacciones (likes, dislikes, read status)
    const [likes] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    const [dislikes] = await pool.query(
      "SELECT * FROM dislikes WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    // Consultar la tabla de historial de lectura (reading_history) y considerar solo completados
    const [readStatus] = await pool.query(
      "SELECT * FROM reading_history WHERE user_id = ? AND book_id = ? AND completed = 1",
      [userId, bookId]
    );

    res.json({
      success: true,
      data: {
        liked: likes.length > 0,
        disliked: dislikes.length > 0,
        read: readStatus.length > 0,
      },
    });
  } catch (error) {
    console.error("Error getting user interactions:", error);
    // Provide more details in development to help debugging
    const devMessage =
      process.env.NODE_ENV === "development"
        ? error.message || error
        : "Error retrieving user interactions";
    if (error.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: devMessage,
    });
  }
};

// Agregar un like a un libro
exports.addLike = async (req, res) => {
  try {
    // ✅ FIX: Leer book_id del body (como lo envía el frontend)
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("👍 Agregando like - book_id:", book_id, "userId:", userId);

    // Validar que book_id existe
    if (!book_id) {
      console.error("❌ book_id is missing from request body");
      return res.status(400).json({
        success: false,
        message: "book_id is required",
      });
    }

    // Verificar si ya existe un like
    const [existing] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? AND book_id = ?",
      [userId, book_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already liked this book",
      });
    }

    // Remover dislike si existe
    await pool.query("DELETE FROM dislikes WHERE user_id = ? AND book_id = ?", [
      userId,
      book_id,
    ]);

    // Agregar el like
    await pool.query("INSERT INTO likes (user_id, book_id) VALUES (?, ?)", [
      userId,
      book_id,
    ]);

    console.log("✅ Like agregado exitosamente");

    res.json({
      success: true,
      message: "Like added successfully",
    });
  } catch (error) {
    console.error("Error adding like:", error);
    console.error("Stack trace:", error.stack);
    const devMessage =
      process.env.NODE_ENV === "development"
        ? `Error adding like: ${error.message}`
        : "Error adding like";
    res.status(500).json({
      success: false,
      message: devMessage,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Remover un like de un libro
exports.removeLike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log("👎 Removiendo like - bookId:", bookId, "userId:", userId);

    // Verificar si existe el like
    const [existing] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Like not found",
      });
    }

    // Remover el like
    await pool.query("DELETE FROM likes WHERE user_id = ? AND book_id = ?", [
      userId,
      bookId,
    ]);

    console.log("✅ Like removido exitosamente");

    res.json({
      success: true,
      message: "Like removed successfully",
    });
  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({
      success: false,
      message: "Error removing like",
    });
  }
};

// Agregar un dislike a un libro
exports.addDislike = async (req, res) => {
  try {
    // ✅ FIX: Leer book_id del body (como lo envía el frontend)
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("👎 Agregando dislike - book_id:", book_id, "userId:", userId);

    // Validar que book_id existe
    if (!book_id) {
      console.error("❌ book_id is missing from request body");
      return res.status(400).json({
        success: false,
        message: "book_id is required",
      });
    }

    // Verificar si ya existe un dislike
    const [existing] = await pool.query(
      "SELECT * FROM dislikes WHERE user_id = ? AND book_id = ?",
      [userId, book_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already disliked this book",
      });
    }

    // Remover like si existe
    await pool.query("DELETE FROM likes WHERE user_id = ? AND book_id = ?", [
      userId,
      book_id,
    ]);

    // Agregar el dislike
    await pool.query("INSERT INTO dislikes (user_id, book_id) VALUES (?, ?)", [
      userId,
      book_id,
    ]);

    console.log("✅ Dislike agregado exitosamente");

    res.json({
      success: true,
      message: "Dislike added successfully",
    });
  } catch (error) {
    console.error("Error adding dislike:", error);
    console.error("Stack trace:", error.stack);
    const devMessage =
      process.env.NODE_ENV === "development"
        ? `Error adding dislike: ${error.message}`
        : "Error adding dislike";
    res.status(500).json({
      success: false,
      message: devMessage,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Remover un dislike de un libro
exports.removeDislike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log("👍 Removiendo dislike - bookId:", bookId, "userId:", userId);

    // Verificar si existe el dislike
    const [existing] = await pool.query(
      "SELECT * FROM dislikes WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dislike not found",
      });
    }

    // Remover el dislike
    await pool.query("DELETE FROM dislikes WHERE user_id = ? AND book_id = ?", [
      userId,
      bookId,
    ]);

    console.log("✅ Dislike removido exitosamente");

    res.json({
      success: true,
      message: "Dislike removed successfully",
    });
  } catch (error) {
    console.error("Error removing dislike:", error);
    res.status(500).json({
      success: false,
      message: "Error removing dislike",
    });
  }
};

// Marcar un libro como leído
exports.markAsRead = async (req, res) => {
  try {
    // ✅ FIX: Leer book_id del body (como lo envía el frontend)
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("✔ Marcando como leído - book_id:", book_id, "userId:", userId);

    // Validar que book_id existe
    if (!book_id) {
      console.error("❌ book_id is missing from request body");
      return res.status(400).json({
        success: false,
        message: "book_id is required",
      });
    }

    // Verificar si ya está marcado como leído
    const [existing] = await pool.query(
      "SELECT * FROM reading_history WHERE user_id = ? AND book_id = ? AND completed = 1",
      [userId, book_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Book is already marked as read",
      });
    }

    // Marcar como leído (insertar o actualizar registro en reading_history)
    await pool.query(
      `INSERT INTO reading_history (user_id, book_id, completed, completed_at)
       VALUES (?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE completed = 1, completed_at = NOW()`,
      [userId, book_id]
    );

    console.log("✅ Marcado como leído exitosamente");

    res.json({
      success: true,
      message: "Book marked as read successfully",
    });
  } catch (error) {
    console.error("Error marking book as read:", error);
    console.error("Stack trace:", error.stack);
    const devMessage =
      process.env.NODE_ENV === "development"
        ? `Error marking book as read: ${error.message}`
        : "Error marking book as read";
    res.status(500).json({
      success: false,
      message: devMessage,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Desmarcar un libro como leído
exports.unmarkAsRead = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(
      "✗ Desmarcando como leído - bookId:",
      bookId,
      "userId:",
      userId
    );

    // Verificar si está marcado como leído
    const [existing] = await pool.query(
      "SELECT * FROM reading_history WHERE user_id = ? AND book_id = ? AND completed = 1",
      [userId, bookId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book is not marked as read",
      });
    }

    // Desmarcar como leído (eliminar del historial o marcar completed = 0)
    await pool.query(
      "DELETE FROM reading_history WHERE user_id = ? AND book_id = ?",
      [userId, bookId]
    );

    console.log("✅ Desmarcado como leído exitosamente");

    res.json({
      success: true,
      message: "Book unmarked as read successfully",
    });
  } catch (error) {
    console.error("Error unmarking book as read:", error);
    res.status(500).json({
      success: false,
      message: "Error unmarking book as read",
    });
  }
};

// Obtener estadísticas de un libro
exports.getBookStats = async (req, res) => {
  try {
    const { bookId } = req.params;

    console.log("📊 Obteniendo estadísticas del libro:", bookId);

    // Contar likes, dislikes y lecturas
    const [likesResult] = await pool.query(
      "SELECT COUNT(*) as count FROM likes WHERE book_id = ?",
      [bookId]
    );

    const [dislikesResult] = await pool.query(
      "SELECT COUNT(*) as count FROM dislikes WHERE book_id = ?",
      [bookId]
    );

    const [readsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM reading_history WHERE book_id = ? AND completed = 1",
      [bookId]
    );

    const stats = {
      likes_count: likesResult[0].count,
      dislikes_count: dislikesResult[0].count,
      reads_count: readsResult[0].count,
    };

    console.log("✅ Estadísticas obtenidas:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting book stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving book statistics",
    });
  }
};

module.exports = exports;
