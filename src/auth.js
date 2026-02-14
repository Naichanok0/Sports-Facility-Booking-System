const jwt = require('jsonwebtoken');
require('dotenv').config();

/* ---------- สร้าง JWT Token ---------- */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* ---------- Middleware ตรวจ token (สำหรับผู้ใช้ทั่วไป) ---------- */
function authRequired(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ---------- ✅ Middleware ตรวจสิทธิ์เฉพาะ admin ---------- */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
}

module.exports = { signToken, authRequired, adminOnly };