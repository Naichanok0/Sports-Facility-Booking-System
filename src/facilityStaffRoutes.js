// src/facilityStaffRoutes.js - Facility Staff Management
const express = require('express');
const Reservation = require('./models/Reservation');
const CheckIn = require('./models/CheckIn');
const Facility = require('./models/Facility');
const User = require('./models/User');
const { authRequired, roleRequired } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// Middleware: Only facility-staff and admin can access
const facilityStaffOnly = roleRequired(['facility-staff', 'admin']);

// ========== GET: ดูการจองวันนี้ ==========
router.get('/today-bookings', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const { facilityId } = req.query;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filter = {
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checked-in', 'pending'] }
    };

    if (facilityId) {
      filter.facilityId = facilityId;
    }

    const bookings = await Reservation.find(filter)
      .populate('userId', 'firstName lastName studentId barcode phone')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ startTime: 1 });

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

// ========== GET: ดูสถานะสนาม ==========
router.get('/facility-status/:facilityId', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.facilityId)
      .populate('sportTypeId', 'name');

    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    // Get current/upcoming bookings
    const now = new Date();
    const currentBooking = await Reservation.findOne({
      facilityId: req.params.facilityId,
      date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      startTime: { $lte: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') },
      endTime: { $gte: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') },
      status: { $in: ['confirmed', 'checked-in'] }
    })
    .populate('userId', 'firstName lastName');

    const upcomingBookings = await Reservation.find({
      facilityId: req.params.facilityId,
      date: { $gte: new Date() },
      status: { $in: ['confirmed', 'pending'] }
    })
    .sort({ date: 1, startTime: 1 })
    .limit(5)
    .populate('userId', 'firstName lastName');

    res.json({
      success: true,
      facility,
      currentBooking,
      upcomingBookings,
      status: currentBooking ? 'occupied' : 'available'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Check-in ผู้ใช้ (Barcode) ==========
router.post('/check-in', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const { reservationId, barcode, method } = req.body;

    if (!reservationId || !method) {
      return res.status(400).json({ 
        success: false, 
        error: 'reservationId and method required' 
      });
    }

    const reservation = await Reservation.findById(reservationId)
      .populate('userId', 'barcode firstName lastName');

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Verify barcode if provided
    if (method === 'barcode' && barcode) {
      if (reservation.userId.barcode !== barcode) {
        return res.status(400).json({ 
          success: false, 
          error: 'Barcode does not match' 
        });
      }
    }

    // Check if already checked in
    if (reservation.status === 'checked-in') {
      return res.status(400).json({ 
        success: false, 
        error: 'Already checked in' 
      });
    }

    // Update reservation status
    reservation.status = 'checked-in';
    reservation.checkInTime = new Date();
    reservation.checkInMethod = method;
    reservation.checkedInBy = req.user._id;
    await reservation.save();

    // Create CheckIn record
    const checkIn = await CheckIn.create({
      reservationId: reservation._id,
      userId: reservation.userId._id,
      facilityId: reservation.facilityId,
      method,
      checkedInBy: req.user._id
    });

    logger.info(`Check-in for reservation ${reservationId} by ${req.user._id}`);

    res.json({
      success: true,
      message: 'Check-in successful',
      checkIn,
      reservation
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูการ Check-in ==========
router.get('/check-ins', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const { facilityId, date, limit = 50 } = req.query;

    let filter = {};

    if (facilityId) {
      filter.facilityId = facilityId;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.checkInTime = { $gte: startDate, $lt: endDate };
    }

    const checkIns = await CheckIn.find(filter)
      .populate('userId', 'firstName lastName studentId barcode')
      .populate('facilityId', 'name')
      .populate('checkedInBy', 'firstName lastName')
      .sort({ checkInTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: checkIns.length,
      checkIns
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Mark as No-Show ==========
router.post('/mark-no-show/:reservationId', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId)
      .populate('userId');

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Check if already completed or cancelled
    if (['completed', 'cancelled', 'no-show'].includes(reservation.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot mark this booking as no-show' 
      });
    }

    // Update reservation
    reservation.status = 'no-show';
    await reservation.save();

    // Increment no-show count for user
    const user = reservation.userId;
    user.noShowCount = (user.noShowCount || 0) + 1;

    // Auto-ban if too many no-shows
    if (user.noShowCount >= 3) {
      user.isBanned = true;
      user.bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Ban for 7 days
      logger.warn(`User ${user._id} auto-banned for ${user.noShowCount} no-shows`);
    }

    await user.save();

    logger.info(`Marked as no-show: ${req.params.reservationId}`);

    res.json({
      success: true,
      message: 'Marked as no-show',
      reservation,
      user
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Complete Booking ==========
router.post('/complete-booking/:reservationId', authRequired, facilityStaffOnly, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Already completed' 
      });
    }

    reservation.status = 'completed';
    await reservation.save();

    logger.info(`Booking completed: ${req.params.reservationId}`);

    res.json({
      success: true,
      message: 'Booking completed',
      reservation
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
