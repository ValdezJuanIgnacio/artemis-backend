const mysql = require("mysql2/promise");
require("dotenv").config();

// Configuración del pool de conexiones optimizada para Clever Cloud
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Configuraciones adicionales para producción
  connectTimeout: 10000,
  timezone: "+00:00",
});

// Verificar conexión al iniciar
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Conexión exitosa a MySQL en Clever Cloud");
    console.log(`📊 Host: ${process.env.DB_HOST}`);
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Error al conectar con MySQL:", err.message);
    console.error(
      "Verifica tus credenciales de Clever Cloud en el archivo .env"
    );
  });

module.exports = pool;
