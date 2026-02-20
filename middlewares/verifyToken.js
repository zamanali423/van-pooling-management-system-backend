const jwt = require("jsonwebtoken");
const { pool } = require("../utils/dbConnection");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const result = await pool.query(
      "SELECT id, role, full_name, phone, email, profile_photo, is_verified, created_at FROM users WHERE id=$1 LIMIT 1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];
    req.user = user;
    next();
  } catch (error) {
    console.error("VerifyToken Error:", error.message);

    return res.status(500).json({
      message: "Token verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = verifyToken;
