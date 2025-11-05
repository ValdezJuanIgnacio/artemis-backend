// ==========================================
// AUTH CONTROLLER - MEJORADO CON VALIDACIONES
// ==========================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// âœ… MEJORADO: Registro con validaciones y mensajes especÃ­ficos
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validar que todos los campos estÃ¡n presentes
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos son requeridos",
        field: !username ? "username" : !email ? "email" : "password",
      });
    }

    // Validar username
    if (username.length < 3) {
      return res.status(400).json({
        message: "El nombre de usuario debe tener al menos 3 caracteres",
        field: "username",
      });
    }

    // Validar que el username no sea solo nÃºmeros
    if (/^\d+$/.test(username)) {
      return res.status(400).json({
        message: "El nombre de usuario no puede contener solo nÃºmeros",
        field: "username",
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Por favor ingresa un correo electrÃ³nico vÃ¡lido",
        field: "email",
      });
    }

    // Validar contraseÃ±a
    if (password.length < 6) {
      return res.status(400).json({
        message: "La contraseÃ±a debe tener al menos 6 caracteres",
        field: "password",
      });
    }

    if (password.length > 20) {
      return res.status(400).json({
        message: "La contraseÃ±a no puede tener mÃ¡s de 20 caracteres",
        field: "password",
      });
    }

    // Verificar si el usuario ya existe por email
    const [existingEmail] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        message: "Este correo electrÃ³nico ya estÃ¡ registrado",
        field: "email",
      });
    }

    // Verificar si el usuario ya existe por username
    const [existingUsername] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        message: "Este nombre de usuario ya existe",
        field: "username",
      });
    }

    // Hash de la contraseÃ±a
    const password_hash = await bcrypt.hash(password, 10);

    // El rol siempre es 'writer' por defecto
    const userRole = role || "writer";

    // Insertar usuario
    const [result] = await db.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [username, email, password_hash, userRole]
    );

    const token = generateToken({
      id: result.insertId,
      email,
      role: userRole,
    });

    console.log("âœ… Usuario registrado exitosamente:", email);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: userRole,
        is_librarian: false,
      },
    });
  } catch (error) {
    console.error("âŒ Error en registro:", error);
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// âœ… MEJORADO: Login con mensajes especÃ­ficos
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseÃ±a son requeridos",
      });
    }

    // Buscar usuario
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // Usuario no encontrado
    if (users.length === 0) {
      console.log("âŒ Email no encontrado:", email);
      return res.status(401).json({
        message: "Este correo no estÃ¡ registrado",
        field: "email",
      });
    }

    const user = users[0];

    // Verificar contraseÃ±a
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log("âŒ ContraseÃ±a incorrecta para:", email);
      return res.status(401).json({
        message: "La contraseÃ±a es incorrecta",
        field: "password",
      });
    }

    const token = generateToken(user);

    console.log("âœ… Login exitoso:", email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_librarian: user.is_librarian || false,
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error("âŒ Error en login:", error);
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// âœ… Google Auth
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, username, profileImage } = req.body;

    // Buscar usuario por google_id o email
    let [users] = await db.query(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [googleId, email]
    );

    let user;
    if (users.length === 0) {
      // Crear nuevo usuario como 'writer'
      const [result] = await db.query(
        "INSERT INTO users (username, email, google_id, profile_image_url, role) VALUES (?, ?, ?, ?, ?)",
        [username, email, googleId, profileImage, "writer"]
      );
      user = {
        id: result.insertId,
        username,
        email,
        role: "writer",
        is_librarian: false,
      };
    } else {
      user = users[0];
      // Actualizar google_id si no existe
      if (!user.google_id) {
        await db.query("UPDATE users SET google_id = ? WHERE id = ?", [
          googleId,
          user.id,
        ]);
      }
    }

    const token = generateToken(user);

    res.json({
      message: "Google authentication successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_librarian: user.is_librarian || false,
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error("âŒ Error en Google auth:", error);
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// âœ… Get Profile - Solo libros publicados
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("ðŸ‘¤ Obteniendo perfil del usuario:", userId);

    const [users] = await db.query(
      "SELECT id, username, email, role, is_librarian, profile_image_url, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Si es escritor o admin, obtener estadÃ­sticas SOLO de libros publicados
    if (user.role === "writer" || user.role === "admin") {
      const [stats] = await db.query(
        `SELECT 
          COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) as books_count,
          COUNT(DISTINCT bv.user_id) as total_views,
          COUNT(DISTINCT l.user_id) as total_likes
        FROM users u
        LEFT JOIN books b ON b.writer_id = u.id AND b.status = 'published'
        LEFT JOIN book_views bv ON bv.book_id = b.id
        LEFT JOIN likes l ON l.book_id = b.id
        WHERE u.id = ?`,
        [userId]
      );

      user.stats = stats[0];
    }

    console.log("âœ… Perfil obtenido exitosamente");
    res.json({ success: true, user });
  } catch (error) {
    console.error("âŒ Error obteniendo perfil:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    console.log("âœï¸ Actualizando username del usuario:", userId);

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (username.length > 50) {
      return res
        .status(400)
        .json({ message: "Username is too long (max 50 characters)" });
    }

    await db.query("UPDATE users SET username = ? WHERE id = ?", [
      username.trim(),
      userId,
    ]);

    console.log("âœ… Username actualizado exitosamente");
    res.json({
      success: true,
      message: "Username updated successfully",
      username: username.trim(),
    });
  } catch (error) {
    console.error("âŒ Error actualizando username:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile_image_url } = req.body;

    console.log("ðŸ–¼ï¸ Actualizando foto de perfil del usuario:", userId);

    if (!profile_image_url) {
      return res.status(400).json({ message: "Profile image URL is required" });
    }

    await db.query("UPDATE users SET profile_image_url = ? WHERE id = ?", [
      profile_image_url,
      userId,
    ]);

    console.log("âœ… Foto de perfil actualizada");
    res.json({
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    console.error("âŒ Error actualizando imagen:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getFavoriteBooks = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("ðŸ’š Obteniendo favoritos del usuario:", userId);

    const [favorites] = await db.query(
      `SELECT b.*, u.username as writer_name,
        COUNT(DISTINCT l.user_id) as like_count,
        COUNT(DISTINCT bv.user_id) as view_count
      FROM likes l
      JOIN books b ON l.book_id = b.id
      JOIN users u ON b.writer_id = u.id
      LEFT JOIN likes l2 ON l2.book_id = b.id
      LEFT JOIN book_views bv ON bv.book_id = b.id
      WHERE l.user_id = ?
      GROUP BY b.id
      ORDER BY l.created_at DESC`,
      [userId]
    );

    console.log(`âœ… ${favorites.length} favoritos encontrados`);

    res.json({
      success: true,
      books: favorites,
    });
  } catch (error) {
    console.error("âŒ Error obteniendo favoritos:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("📚 Obteniendo historial de lectura:", userId);

    const [history] = await db.query(
      `SELECT 
        b.id,
        b.title,
        b.synopsis,
        b.genre,
        b.cover_image_url,
        b.status,
        b.created_at,
        b.writer_id,
        u.username as writer_name,
        rh.completed,
        rh.progress,
        rh.started_at,
        rh.completed_at,
        rh.last_read_at as last_read,
        COUNT(DISTINCT l.user_id) as like_count,
        COUNT(DISTINCT bv.user_id) as view_count
      FROM reading_history rh
      JOIN books b ON rh.book_id = b.id
      JOIN users u ON b.writer_id = u.id
      LEFT JOIN likes l ON l.book_id = b.id
      LEFT JOIN book_views bv ON bv.book_id = b.id
      WHERE rh.user_id = ?
      GROUP BY b.id, b.title, b.synopsis, b.genre, b.cover_image_url, 
               b.status, b.created_at, b.writer_id, u.username, 
               rh.completed, rh.progress, rh.started_at, rh.completed_at, rh.last_read_at
      ORDER BY rh.last_read_at DESC`,
      [userId]
    );

    console.log(`✅ ${history.length} libros en historial`);

    res.json({
      success: true,
      books: history,
    });
  } catch (error) {
    console.error("❌ Error obteniendo historial:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
