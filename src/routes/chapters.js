const express = require("express");
const router = express.Router();
const chaptersController = require("../controllers/chaptersController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// IMPORTANTE: Esta ruta debe ir ANTES para evitar conflictos
router.get(
  "/book/:bookId",
  authMiddleware,
  chaptersController.getChaptersByBookId
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  chaptersController.createChapter
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  chaptersController.updateChapter
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("writer", "admin"),
  chaptersController.deleteChapter
);

module.exports = router;
