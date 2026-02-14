// src/admin.js - MongoDB Version (Sports Facility)
const express = require('express');
const Reservation = require('./models/Reservation');
const Cancellation = require('./models/Cancellation');
const Facility = require('./models/Facility');
const SportType = require('./models/SportType');
const { authRequired, adminOnly } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// ========== Admin: ดูทั้งหมด Reservations ==========
router.get('/reservations', authRequired, adminOnly, async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) filter.bookingDate = new Date(date);

    const reservations = await Reservation.find(filter)
      .populate('userId', 'username email')
      .populate('facilityId', 'name')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: ยกเลิกการจอง + ตั้งค่าปรับ ==========
router.post('/cancel-reservation', authRequired, adminOnly, async (req, res) => {
  try {
    const { reservationId, reason, penaltyAmount } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'ไม่พบการจอง' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'การจองนี้ยกเลิกไปแล้ว' });
    }

    // Update Reservation
    reservation.status = 'cancelled';
    reservation.cancelledBy = 'admin';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = reason;
    reservation.penaltyAmount = penaltyAmount || 0;
    await reservation.save();

    // บันทึก Cancellation
    const cancellation = await Cancellation.create({
      reservationId,
      userId: reservation.userId,
      cancelledBy: 'admin',
      reason,
      penaltyApplied: penaltyAmount || 0,
      penaltyReason: reason,
      status: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date()
    });

    res.json({ success: true, message: 'ยกเลิกการจองแล้ว', cancellation });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: สร้างสนามใหม่ ==========
router.post('/facilities', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, location, sportTypeId, maxCapacity, openTime, closeTime, notes } = req.body;

    const facility = await Facility.create({
      name,
      location,
      sportTypeId,
      maxCapacity,
      operatingHours: { openTime, closeTime },
      notes,
      updatedBy: req.user._id
    });

    res.json({ success: true, facility });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: ดูสนามทั้งหมด ==========
router.get('/facilities', authRequired, adminOnly, async (req, res) => {
  try {
    const facilities = await Facility.find()
      .populate('sportTypeId', 'name icon')
      .sort({ name: 1 });

    res.json(facilities);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: อัปเดตสนาม ==========
router.put('/facilities/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, location, maxCapacity, openTime, closeTime, notes } = req.body;

    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        maxCapacity,
        operatingHours: { openTime, closeTime },
        notes,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, facility });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: ลบสนาม ==========
router.delete('/facilities/:id', authRequired, adminOnly, async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'ลบสนามแล้ว' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: สร้างประเภทกีฬา ==========
router.post('/sports-types', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const sportType = await SportType.create({
      name,
      description,
      icon,
      updatedBy: req.user._id
    });

    res.json({ success: true, sportType });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: ดูประเภทกีฬาทั้งหมด ==========
router.get('/sports-types', authRequired, adminOnly, async (req, res) => {
  try {
    const sportTypes = await SportType.find().sort({ name: 1 });
    res.json(sportTypes);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: อัปเดตประเภทกีฬา ==========
router.put('/sports-types/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const sportType = await SportType.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        icon,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, sportType });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Admin: ลบประเภทกีฬา ==========
router.delete('/sports-types/:id', authRequired, adminOnly, async (req, res) => {
  try {
    await SportType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'ลบประเภทกีฬาแล้ว' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
