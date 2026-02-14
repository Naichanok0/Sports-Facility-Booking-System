// src/authRoutes.js - Auth endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { signToken, authRequired } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// ========== POST: ลงทะเบียน ==========
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, studentID, phone } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'username, password, email required' });
    }

    // ตรวจสอบ username ซ้ำ
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // สร้าง User
    const user = await User.create({
      username,
      email,
      passwordHash,
      fullName,
      studentID,
      phone,
      role: 'citizen'
    });

    // สร้าง Token
    const token = signToken({ 
      _id: user._id, 
      username: user.username, 
      role: user.role 
    });

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== POST: เข้าสู่ระบบ ==========
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    // ค้นหา User
    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ตรวจสอบ Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // สร้าง Token
    const token = signToken({ 
      _id: user._id, 
      username: user.username, 
      role: user.role 
    });

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET: ข้อมูลผู้ใช้ปัจจุบัน ==========
router.get('/me', authRequired, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
