const jwt = require("jsonwebtoken");

// Middleware de autenticación básico
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error en autenticación",
    });
  }
};

// Middleware de roles - permite múltiples roles
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(
          ", "
        )}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware específico para admin
const adminMiddleware = (req, res, next) => {
  return roleMiddleware("admin")(req, res, next);
};

// Middleware específico para writer
const writerMiddleware = (req, res, next) => {
  return roleMiddleware("writer", "admin")(req, res, next);
};

// Middleware específico para librarian
const librarianMiddleware = (req, res, next) => {
  return roleMiddleware("librarian", "admin")(req, res, next);
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  adminMiddleware,
  writerMiddleware,
  librarianMiddleware,
};
