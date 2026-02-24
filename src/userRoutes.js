// src/userRoutes.js - User Profile & Settings
const express = require('express');
const User = require('./models/User');
const Reservation = require('./models/Reservation');
const Cancellation = require('./models/Cancellation');
const { authRequired } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// ========== GET: ดูข้อมูลส่วนตัวของฉัน ==========
router.get('/profile', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== PUT: อัพเดตข้อมูลส่วนตัว ==========
router.put('/profile', authRequired, async (req, res) => {
  try {
    const { firstName, lastName, phone, faculty } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update allowed fields only
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (faculty) user.faculty = faculty;

    user.updatedAt = new Date();
    await user.save();

    logger.info(`Profile updated for user ${user._id}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูปรับโทษของฉัน ==========
router.get('/penalties', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get all cancelled/no-show bookings with penalties
    const penalties = await Reservation.find({
      userId: req.user._id,
      $or: [
        { status: 'cancelled', penaltyAmount: { $gt: 0 } },
        { status: 'no-show' }
      ]
    })
    .populate('facilityId', 'name location')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      noShowCount: user.noShowCount,
      totalPenalties: penalties.reduce((sum, p) => sum + (p.penaltyAmount || 0), 0),
      penalties
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูประวัติการจอง ==========
router.get('/bookings', authRequired, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let filter = { userId: req.user._id };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const bookings = await Reservation.find(filter)
      .populate('facilityId', 'name location sportTypeId')
      .populate('sportTypeId', 'name')
      .populate('facilityId.sportTypeId', 'name')
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูรายละเอียดการจองเดียว ==========
router.get('/bookings/:reservationId', authRequired, async (req, res) => {
  try {
    const booking = await Reservation.findById(req.params.reservationId)
      .populate('userId', 'firstName lastName studentId barcode')
      .populate('facilityId', 'name location description')
      .populate('sportTypeId', 'name description')
      .populate('checkedInBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Check if user has permission to view this booking
    if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: ยกเลิกการจอง ==========
router.post('/bookings/:reservationId/cancel', authRequired, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Reservation.findById(req.params.reservationId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Check if user has permission
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Check if already cancelled or completed
    if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot cancel booking with status: ${booking.status}` 
      });
    }

    // Check if cancellation is within allowed window
    const bookingTime = new Date(booking.date + ' ' + booking.startTime);
    const hoursUntilBooking = (bookingTime - new Date()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel within 1 hour of booking start time' 
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledBy = 'user';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'User cancelled';
    await booking.save();

    logger.info(`Booking ${booking._id} cancelled by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูสถิติของฉัน ==========
router.get('/stats', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const bookings = await Reservation.find({ userId: req.user._id });
    
    const stats = {
      totalBookings: bookings.length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      noShow: bookings.filter(b => b.status === 'no-show').length,
      checkedIn: bookings.filter(b => b.status === 'checked-in').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      noShowCount: user.noShowCount,
      isBanned: user.isBanned,
      bannedUntil: user.bannedUntil
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
