const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

// Rutas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);

// ✅ NUEVAS RUTAS - Requieren autenticación
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile/username", authMiddleware, authController.updateUsername);
router.put("/profile/image", authMiddleware, authController.updateProfileImage);
router.get("/favorites", authMiddleware, authController.getFavoriteBooks);
router.get(
  "/reading-history",
  authMiddleware,
  authController.getReadingHistory
);

module.exports = router;
