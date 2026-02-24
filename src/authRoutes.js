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
    const { username, email, password, firstName, lastName, studentId, phone, faculty, barcode } = req.body;

    if (!username || !password || !email || !studentId) {
      return res.status(400).json({ 
        success: false,
        error: 'username, password, email, studentId required' 
      });
    }

    // ตรวจสอบ username ซ้ำ
    const existing = await User.findOne({ 
      $or: [{ username }, { email }, { studentId }] 
    });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: 'Username, email, or studentId already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // สร้าง User
    const user = await User.create({
      username,
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      studentId,
      phone: phone || '',
      faculty: faculty || '',
      barcode: barcode || '',
      role: 'user'
    });

    // สร้าง Token
    const token = signToken({ 
      _id: user._id, 
      username: user.username, 
      role: user.role,
      studentId: user.studentId
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: เข้าสู่ระบบ ==========
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'username and password required' });
    }

    // ค้นหา User (supports both username and studentId)
    const user = await User.findOne({ 
      $or: [{ username }, { studentId: username }]
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if user is banned
    if (user.isBanned && user.bannedUntil && user.bannedUntil > new Date()) {
      return res.status(403).json({ 
        success: false, 
        error: `Account banned until ${user.bannedUntil.toISOString()}`
      });
    }

    // ตรวจสอบ Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // สร้าง Token
    const token = signToken({ 
      _id: user._id, 
      username: user.username, 
      role: user.role,
      studentId: user.studentId
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        barcode: user.barcode,
        phone: user.phone,
        faculty: user.faculty,
        role: user.role,
        isBanned: user.isBanned,
        bannedUntil: user.bannedUntil,
        noShowCount: user.noShowCount
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ข้อมูลผู้ใช้ปัจจุบัน ==========
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Forgot Password - ส่งลิงก์รีเซ็ต ==========
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return generic message for security
      return res.json({ 
        success: true, 
        message: 'If email exists, password reset link has been sent' 
      });
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    logger.info(`Password reset requested for ${email}`);

    res.json({ 
      success: true, 
      message: 'Password reset link has been sent to your email' 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Reset Password ==========
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email and new password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    user.passwordHash = passwordHash;
    await user.save();

    logger.info(`Password reset for ${email}`);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Change Password (Authenticated) ==========
router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    user.passwordHash = passwordHash;
    await user.save();

    logger.info(`Password changed for user ${user._id}`);

    res.json({ 
      success: true, 
      message: 'Password has been changed successfully' 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Logout ==========
router.post('/logout', authRequired, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just acknowledge the logout
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
