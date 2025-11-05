const express = require("express");
const cors = require("cors");

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// Rutas de prueba
app.get("/api/health", (req, res) => {
  console.log("✅ Health check solicitado");
  res.json({
    status: "OK",
    message: "Test server en puerto 3000",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/books/published", (req, res) => {
  console.log("✅ Books solicitados");
  res.json({
    success: true,
    books: [
      {
        id: 1,
        title: "Libro de prueba",
        author: "Test Author",
      },
    ],
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🧪 SERVIDOR DE PRUEBA EN PUERTO 3000`);
  console.log(`${"=".repeat(50)}\n`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`\nPrueba:`);
  console.log(`  http://localhost:${PORT}/api/health`);
  console.log(`  http://localhost:${PORT}/api/books/published`);
  console.log(`\n${"=".repeat(50)}\n`);
});
