const express = require("express");
const router = express.Router();
const interactionsController = require("../controllers/interactionsController");
const { authMiddleware } = require("../middleware/auth");

// Todas las rutas de interacciones requieren autenticación

// Obtener interacciones del usuario para un libro
router.get(
  "/book/:bookId",
  authMiddleware,
  interactionsController.getUserInteractions
);

// Likes
router.post("/like", authMiddleware, interactionsController.addLike);
router.delete(
  "/like/:bookId",
  authMiddleware,
  interactionsController.removeLike
);

// Dislikes
router.post("/dislike", authMiddleware, interactionsController.addDislike);
router.delete(
  "/dislike/:bookId",
  authMiddleware,
  interactionsController.removeDislike
);

// Marcar como leído
router.post("/read", authMiddleware, interactionsController.markAsRead);
router.delete(
  "/read/:bookId",
  authMiddleware,
  interactionsController.unmarkAsRead
);

// Estadísticas de un libro (pública)
router.get("/stats/:bookId", interactionsController.getBookStats);

module.exports = router;
