const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const Reservation = require('../models/Reservation');
const logger = require('../logger');

// ✅ CHECK IN user
router.post('/checkin', async (req, res) => {
  try {
    const { reservationId, userId, facilityId, staffId } = req.body;

    if (!reservationId || !userId || !facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if already checked in
    const existingCheckIn = await CheckIn.findOne({
      reservationId,
      status: 'checked-in'
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'User already checked in for this reservation'
      });
    }

    const newCheckIn = new CheckIn({
      reservationId,
      userId,
      facilityId,
      staffId,
      checkInTime: new Date(),
      status: 'checked-in'
    });

    const savedCheckIn = await newCheckIn.save();

    // Update reservation status
    await Reservation.findByIdAndUpdate(reservationId, { status: 'checked-in' });

    await savedCheckIn.populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'facilityId', select: 'name' },
      { path: 'staffId', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Check in successful',
      data: savedCheckIn
    });
  } catch (error) {
    logger.error('Error during check in:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check in',
      error: error.message
    });
  }
});

// ✅ CHECK OUT user
router.put('/:id/checkout', async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'Check in record not found'
      });
    }

    if (checkIn.status === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: 'Already checked out'
      });
    }

    const updatedCheckIn = await CheckIn.findByIdAndUpdate(
      req.params.id,
      {
        checkOutTime: new Date(),
        status: 'checked-out'
      },
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'facilityId', select: 'name' }
    ]);

    // Update reservation status
    await Reservation.findByIdAndUpdate(checkIn.reservationId, { status: 'completed' });

    res.json({
      success: true,
      message: 'Check out successful',
      data: updatedCheckIn
    });
  } catch (error) {
    logger.error('Error during check out:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check out',
      error: error.message
    });
  }
});

// ✅ GET all check-ins
router.get('/', async (req, res) => {
  try {
    const checkIns = await CheckIn.find()
      .populate('userId', 'firstName lastName barcode')
      .populate('facilityId', 'name location')
      .populate('staffId', 'firstName lastName')
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      message: 'Check in records retrieved successfully',
      data: checkIns,
      count: checkIns.length
    });
  } catch (error) {
    logger.error('Error fetching check in records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching check in records',
      error: error.message
    });
  }
});

// ✅ GET check-in by ID
router.get('/:id', async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('userId', 'firstName lastName barcode phone')
      .populate('facilityId', 'name location')
      .populate('staffId', 'firstName lastName');

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'Check in record not found'
      });
    }

    res.json({
      success: true,
      message: 'Check in record retrieved successfully',
      data: checkIn
    });
  } catch (error) {
    logger.error('Error fetching check in record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching check in record',
      error: error.message
    });
  }
});

// ✅ GET check-ins by facility for today
router.get('/facility/:facilityId/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIns = await CheckIn.find({
      facilityId: req.params.facilityId,
      checkInTime: { $gte: today, $lt: tomorrow }
    })
      .populate('userId', 'firstName lastName barcode')
      .populate('staffId', 'firstName lastName')
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      message: 'Today check in records retrieved successfully',
      data: checkIns,
      count: checkIns.length
    });
  } catch (error) {
    logger.error('Error fetching today check in records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today check in records',
      error: error.message
    });
  }
});

// ✅ GET check-in by reservation
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({ reservationId: req.params.reservationId })
      .populate('userId', 'firstName lastName barcode')
      .populate('facilityId', 'name location')
      .populate('staffId', 'firstName lastName');

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'No check in record found for this reservation'
      });
    }

    res.json({
      success: true,
      message: 'Check in record retrieved successfully',
      data: checkIn
    });
  } catch (error) {
    logger.error('Error fetching check in record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching check in record',
      error: error.message
    });
  }
});

module.exports = router;
