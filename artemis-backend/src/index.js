const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ==========================================
// IMPORTS DE RUTAS
// ==========================================
const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const chaptersRoutes = require("./routes/chapters");
const interactionsRoutes = require("./routes/interactions");
const commentsRoutes = require("./routes/comments");
const adminRoutes = require("./routes/admin");
const librarianRoutes = require("./routes/librarian");
const uploadRoutes = require("./routes/upload");

const app = express();

// ==========================================
// CONFIGURACIÓN CORS - VERSIÓN SIMPLIFICADA
// ==========================================
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos
app.use("/uploads", express.static("uploads"));

// ==========================================
// ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/chapters", chaptersRoutes);
app.use("/api/interactions", interactionsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/librarian", librarianRoutes);
app.use("/api/upload", uploadRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Artemis API is running",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// ==========================================
// ROOT
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "Artemis API Server",
    version: "2.0.0",
    endpoints: [
      "/api/health",
      "/api/auth",
      "/api/books",
      "/api/chapters",
      "/api/interactions",
      "/api/comments",
      "/api/admin",
      "/api/librarian",
      "/api/upload",
    ],
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Artemis API Server`);
  console.log(`${"=".repeat(50)}\n`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ CORS: Enabled for all origins`);
  console.log(`\n${"=".repeat(50)}\n`);
});
