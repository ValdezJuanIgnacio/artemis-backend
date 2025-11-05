const express = require("express");
const router = express.Router();
const commentsController = require("../controllers/commentsController"); // ✅ Sin 's' extra
const { authMiddleware } = require("../middleware/auth");

// Obtener comentarios (públicas)
router.get("/book/:bookId", commentsController.getBookComments);
router.get("/chapter/:chapterId", commentsController.getChapterComments);
router.get("/:commentId/replies", commentsController.getCommentReplies);

// Crear comentario (requiere autenticación)
router.post("/", authMiddleware, commentsController.createComment);

// Responder a un comentario
router.post(
  "/:commentId/reply",
  authMiddleware,
  commentsController.replyToComment
);

// Actualizar comentario (requiere autenticación)
router.put("/:id", authMiddleware, commentsController.updateComment);

// Eliminar comentario (requiere autenticación)
router.delete("/:id", authMiddleware, commentsController.deleteComment);

module.exports = router;
