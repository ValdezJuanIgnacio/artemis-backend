const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { authMiddleware } = require("../middleware/auth");

// Subir portada de libro
router.post(
  "/cover",
  authMiddleware,
  upload.single("cover"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se subió ningún archivo",
        });
      }

      // Construir URL completa de la imagen
      const protocol = req.protocol;
      const host = req.get("host");
      const imageUrl = `${protocol}://${host}/uploads/covers/${req.file.filename}`;

      console.log("✅ Imagen subida exitosamente:", req.file.filename);

      res.json({
        success: true,
        message: "Imagen subida correctamente",
        url: imageUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Error al subir la imagen",
        error: error.message,
      });
    }
  }
);

module.exports = router;
