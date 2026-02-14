// src/routes.js - MongoDB Version
const express = require('express');
const Reservation = require('./models/Reservation');
const Facility = require('./models/Facility');
const SportType = require('./models/SportType');
const { authRequired } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// ========== GET: ดูประเภทกีฬา ==========
router.get('/sports', async (req, res) => {
  try {
    const sports = await SportType.find({ isActive: true });
    res.json(sports);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET: ดูสนามตามประเภทกีฬา ==========
router.get('/facilities', async (req, res) => {
  try {
    const { sportId } = req.query;
    const filter = { isActive: true };
    if (sportId) filter.sportTypeId = sportId;
    
    const facilities = await Facility.find(filter)
      .populate('sportTypeId', 'name icon');
    res.json(facilities);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET: ดูเวลาว่างของสนาม ==========
router.get('/availability', async (req, res) => {
  try {
    const { facilityId, date } = req.query;
    
    if (!facilityId || !date) {
      return res.status(400).json({ error: 'facilityId and date required' });
    }

    const bookingDate = new Date(date);
    
    // ดึง Reservations ที่ Confirmed ในวันนั้น
    const booked = await Reservation.find({
      facilityId,
      bookingDate,
      status: 'confirmed'
    });

    const facility = await Facility.findById(facilityId);
    
    res.json({
      facility,
      bookedSlots: booked.map(r => ({
        start: r.startTime,
        end: r.endTime
      }))
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== POST: จองสนาม ==========
router.post('/reservations', authRequired, async (req, res) => {
  try {
    const { facilityId, sportTypeId, bookingDate, startTime, endTime, durationHours, numPlayers, notes } = req.body;

    // ตรวจสอบว่ามีการจองซ้ำในช่วงเวลานั้น
    const conflict = await Reservation.findOne({
      facilityId,
      bookingDate: new Date(bookingDate),
      startTime,
      status: 'confirmed'
    });

    if (conflict) {
      return res.status(400).json({ error: 'ช่วงเวลานี้มีการจองแล้ว' });
    }

    // ตรวจสอบ Max capacity
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: 'สนามไม่พบ' });
    }
    
    if (numPlayers > facility.maxCapacity) {
      return res.status(400).json({ error: `เกินจำนวนคน สูงสุด ${facility.maxCapacity} คน` });
    }

    // สร้าง Reservation
    const reservationNo = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    const reservation = await Reservation.create({
      reservationNo,
      userId: req.user._id,
      facilityId,
      sportTypeId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      durationHours,
      numPlayers,
      notes,
      status: 'confirmed',
      confirmedAt: new Date()
    });

    res.json({
      success: true,
      reservationNo: reservation.reservationNo,
      message: 'จองสำเร็จ'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET: ดูการจองของฉัน ==========
router.get('/my/reservations', authRequired, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ bookingDate: -1 });

    res.json(reservations);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ========== DELETE: ยกเลิกการจอง ==========
router.delete('/reservations/:reservationId', authRequired, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'ไม่พบการจอง' });
    }

    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'ไม่สามารถยกเลิกการจองของคนอื่นได้' });
    }

    reservation.status = 'cancelled';
    reservation.cancelledBy = 'user';
    reservation.cancelledAt = new Date();
    await reservation.save();

    res.json({ success: true, message: 'ยกเลิกการจองแล้ว' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
