// ==========================================
// ADMIN ROUTES
// routes/admin.js
// ==========================================

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// Middleware: Solo admins pueden acceder a estas rutas
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// Obtener todos los usuarios
router.get("/users", adminController.getAllUsers);

// ✅ IMPORTANTE: Esta ruta debe ir ANTES de /users/:userId para evitar conflictos
// Obtener perfil completo de un usuario (incluye libros y estadísticas)
router.get("/users/:userId/profile", adminController.getUserProfile);

// Promover usuario a bibliotecario
router.post(
  "/users/:userId/promote-librarian",
  adminController.promoteToLibrarian
);

// Quitar rol de bibliotecario
router.post(
  "/users/:userId/demote-librarian",
  adminController.demoteFromLibrarian
);

// Eliminar usuario
router.delete("/users/:userId", adminController.deleteUser);

// ==========================================
// GESTIÓN DE CONTENIDO
// ==========================================

// Eliminar libro
router.delete("/books/:bookId", adminController.deleteBook);

// Eliminar capítulo
router.delete("/chapters/:chapterId", adminController.deleteChapter);

// ==========================================
// GESTIÓN DE REPORTES
// ==========================================

// Obtener reportes pendientes
router.get("/reports/pending", adminController.getPendingReports);

// Obtener notificaciones del admin
router.get("/notifications", adminController.getAdminNotifications);

// Marcar notificación como leída
router.put(
  "/notifications/:notificationId/read",
  adminController.markNotificationRead
);

// ✅ NUEVA RUTA: Marcar reporte como "visto"
router.post("/reports/:reportId/mark-seen", adminController.markReportAsSeen);

// Revisar reporte (aprobar/rechazar)
router.post("/reports/:reportId/review", adminController.reviewReport);

// Obtener logs de actividad
router.get("/logs", adminController.getAdminLogs);

module.exports = router;