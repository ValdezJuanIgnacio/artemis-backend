const express = require("express");
const router = express.Router();
const booksController = require("../controllers/booksController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// IMPORTANTE: Rutas específicas deben ir ANTES de las rutas con parámetros

// Obtener solo libros publicados (PÚBLICA)
router.get("/published", booksController.getPublishedBooks);

// Obtener libros del usuario autenticado
router.get("/my-books", authMiddleware, booksController.getMyBooks);

// ✅ NUEVA RUTA - Descargar capítulo individual como PDF
router.get(
  "/:bookId/chapter/:chapterId/download-pdf",
  authMiddleware,
  booksController.downloadChapterPDF
);

// NUEVA RUTA - Registrar visualización de un libro
router.post("/:id/view", authMiddleware, booksController.registerView);

// NUEVA RUTA - Obtener estadísticas de visualizaciones
router.get("/:id/views", booksController.getBookViewStats);

// Descargar libro como PDF
router.get("/:id/download-pdf", authMiddleware, booksController.downloadPDF);

// Rutas generales
router.get("/", booksController.getAllBooks);
router.get("/:id", booksController.getBookById);

// Crear libro
router.post(
  "/",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  booksController.createBook
);

// Actualizar libro
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  booksController.updateBook
);

// Eliminar libro
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  booksController.deleteBook
);

// Enviar libro para revisión
router.post(
  "/:id/submit",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  booksController.submitBook
);

// Publicar libro
router.post(
  "/:id/publish",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  booksController.publishBook
);

module.exports = router;
