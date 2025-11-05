const db = require("../config/database");

// Obtener todas las interacciones del usuario para un libro
exports.getUserInteractions = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(
      "📊 Obteniendo interacciones para libro:",
      bookId,
      "usuario:",
      userId
    );

    // Verificar like
    const [likes] = await db.query(
      "SELECT id FROM likes WHERE book_id = ? AND user_id = ?",
      [bookId, userId]
    );

    // Verificar dislike
    const [dislikes] = await db.query(
      "SELECT id FROM dislikes WHERE book_id = ? AND user_id = ?",
      [bookId, userId]
    );

    // Verificar si está marcado como leído
    const [readHistory] = await db.query(
      "SELECT id FROM reading_history WHERE book_id = ? AND user_id = ? AND completed = 1",
      [bookId, userId]
    );

    res.json({
      liked: likes.length > 0,
      disliked: dislikes.length > 0,
      read: readHistory.length > 0,
    });
  } catch (error) {
    console.error("❌ Error en getUserInteractions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Agregar like
exports.addLike = async (req, res) => {
  try {
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("👍 Agregando like - Libro:", book_id, "Usuario:", userId);

    // Remover dislike si existe
    await db.query("DELETE FROM dislikes WHERE book_id = ? AND user_id = ?", [
      book_id,
      userId,
    ]);

    // Agregar like (ignorar si ya existe)
    await db.query(
      "INSERT IGNORE INTO likes (book_id, user_id) VALUES (?, ?)",
      [book_id, userId]
    );

    console.log("✅ Like agregado");
    res.json({ message: "Like added successfully" });
  } catch (error) {
    console.error("❌ Error en addLike:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remover like
exports.removeLike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log("👎 Removiendo like - Libro:", bookId, "Usuario:", userId);

    await db.query("DELETE FROM likes WHERE book_id = ? AND user_id = ?", [
      bookId,
      userId,
    ]);

    console.log("✅ Like removido");
    res.json({ message: "Like removed successfully" });
  } catch (error) {
    console.error("❌ Error en removeLike:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Agregar dislike
exports.addDislike = async (req, res) => {
  try {
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("👎 Agregando dislike - Libro:", book_id, "Usuario:", userId);

    // Remover like si existe
    await db.query("DELETE FROM likes WHERE book_id = ? AND user_id = ?", [
      book_id,
      userId,
    ]);

    // Agregar dislike (ignorar si ya existe)
    await db.query(
      "INSERT IGNORE INTO dislikes (book_id, user_id) VALUES (?, ?)",
      [book_id, userId]
    );

    console.log("✅ Dislike agregado");
    res.json({ message: "Dislike added successfully" });
  } catch (error) {
    console.error("❌ Error en addDislike:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remover dislike
exports.removeDislike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log("👍 Removiendo dislike - Libro:", bookId, "Usuario:", userId);

    await db.query("DELETE FROM dislikes WHERE book_id = ? AND user_id = ?", [
      bookId,
      userId,
    ]);

    console.log("✅ Dislike removido");
    res.json({ message: "Dislike removed successfully" });
  } catch (error) {
    console.error("❌ Error en removeDislike:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Marcar como leído
exports.markAsRead = async (req, res) => {
  try {
    const { book_id } = req.body;
    const userId = req.user.id;

    console.log("✓ Marcando como leído - Libro:", book_id, "Usuario:", userId);

    await db.query(
      `INSERT INTO reading_history (book_id, user_id, completed, completed_at) 
       VALUES (?, ?, 1, NOW()) 
       ON DUPLICATE KEY UPDATE completed = 1, completed_at = NOW()`,
      [book_id, userId]
    );

    console.log("✅ Marcado como leído");
    res.json({ message: "Marked as read successfully" });
  } catch (error) {
    console.error("❌ Error en markAsRead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Desmarcar como leído
exports.unmarkAsRead = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(
      "✗ Desmarcando como leído - Libro:",
      bookId,
      "Usuario:",
      userId
    );

    await db.query(
      "DELETE FROM reading_history WHERE book_id = ? AND user_id = ?",
      [bookId, userId]
    );

    console.log("✅ Desmarcado como leído");
    res.json({ message: "Unmarked as read successfully" });
  } catch (error) {
    console.error("❌ Error en unmarkAsRead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtener estadísticas de un libro
exports.getBookStats = async (req, res) => {
  try {
    const { bookId } = req.params;

    const [stats] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM likes WHERE book_id = ?) as like_count,
        (SELECT COUNT(*) FROM dislikes WHERE book_id = ?) as dislike_count,
        (SELECT COUNT(*) FROM reading_history WHERE book_id = ? AND completed = 1) as read_count,
        (SELECT COUNT(*) FROM comments WHERE book_id = ?) as comment_count
      `,
      [bookId, bookId, bookId, bookId]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error("❌ Error en getBookStats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;
