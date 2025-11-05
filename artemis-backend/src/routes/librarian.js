// ==========================================
// LIBRARIAN ROUTES
// routes/librarian.js
// ==========================================

const express = require("express");
const router = express.Router();
const librarianController = require("../controllers/librarianController");
const { authMiddleware } = require("../middleware/auth");

// Middleware: Requiere autenticación
router.use(authMiddleware);

// Middleware: Verificar que es bibliotecario
const isLibrarian = async (req, res, next) => {
  const db = require("../config/database");
  const [user] = await db.query(
    "SELECT is_librarian, role FROM users WHERE id = ?",
    [req.user.id]
  );

  if (!user[0].is_librarian && user[0].role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos de bibliotecario",
    });
  }

  next();
};

router.use(isLibrarian);

// ==========================================
// REPORTES
// ==========================================

// Crear reporte de contenido inapropiado
router.post("/reports", librarianController.createReport);

// Obtener mis reportes
router.get("/reports", librarianController.getMyReports);

// Obtener estadísticas
router.get("/stats", librarianController.getLibrarianStats);

// Eliminar reporte propio
router.delete("/reports/:reportId", librarianController.deleteReport);

// ==========================================
// REVISAR CONTENIDO
// ==========================================

// Obtener libros para revisar
router.get("/books", librarianController.getBooksToReview);

// Obtener capítulos de un libro
router.get("/books/:bookId/chapters", librarianController.getBookChapters);

module.exports = router;
