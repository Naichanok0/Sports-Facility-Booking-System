const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../logger');

// ✅ GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// ✅ GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// ✅ CREATE new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, role, studentId, barcode, faculty } = req.body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !phone || !password || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password, firstName, lastName, phone, studentId'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { studentId }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, or student ID already exists'
      });
    }

    // Simple password hashing (in production, use bcrypt)
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = new User({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: role || 'user',
      studentId,
      barcode,
      faculty,
      isActive: true,
      noShowCount: 0,
      isBanned: false
    });

    const savedUser = await newUser.save();
    
    // Don't return password hash
    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// ✅ UPDATE user
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, faculty, isActive, noShowCount, isBanned, banReason } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        phone,
        faculty,
        isActive,
        noShowCount,
        isBanned,
        banReason,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// ✅ DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// ✅ GET user by username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// ✅ POST login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username (studentId) or email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { studentId: username }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if banned
    if (user.isBanned && user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account banned until ${user.bannedUntil}`
      });
    }

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    // Convert MongoDB _id to id for frontend
    userResponse.id = userResponse._id;

    res.json({
      success: true,
      message: 'Login successful',
      data: userResponse
    });
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

module.exports = router;
