const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const logger = require('../logger');

// ✅ Generate Reservation Number
function generateReservationNo() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RES${timestamp}${random}`;
}

// ✅ GET all reservations
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('userId', 'firstName lastName studentId barcode')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    logger.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
});

// ✅ GET reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'firstName lastName studentId barcode phone')
      .populate('facilityId', 'name location pricePerHour')
      .populate('sportTypeId', 'name description');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reservation retrieved successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error fetching reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation',
      error: error.message
    });
  }
});

// ✅ CREATE new reservation
router.post('/', async (req, res) => {
  try {
    const { userId, facilityId, sportTypeId, date, startTime, endTime, playerCount, notes } = req.body;

    if (!userId || !facilityId || !sportTypeId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationHours = (endHour - startHour) + (endMin - startMin) / 60;

    const newReservation = new Reservation({
      reservationNo: generateReservationNo(),
      userId,
      facilityId,
      sportTypeId,
      date: new Date(date),
      startTime,
      endTime,
      durationHours,
      playerCount: playerCount || 0,
      status: 'pending',
      notes
    });

    const savedReservation = await newReservation.save();
    await savedReservation.populate([
      { path: 'userId', select: 'firstName lastName studentId barcode' },
      { path: 'facilityId', select: 'name location pricePerHour' },
      { path: 'sportTypeId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: savedReservation
    });
  } catch (error) {
    logger.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reservation',
      error: error.message
    });
  }
});

// ✅ UPDATE reservation status
router.put('/:id', async (req, res) => {
  try {
    const { status, playerCount, notes } = req.body;

    const updateData = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (playerCount) updateData.playerCount = playerCount;
    if (notes) updateData.notes = notes;

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName studentId barcode' },
      { path: 'facilityId', select: 'name location' },
      { path: 'sportTypeId', select: 'name' }
    ]);

    if (!updatedReservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: updatedReservation
    });
  } catch (error) {
    logger.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reservation',
      error: error.message
    });
  }
});

// ✅ CANCEL reservation
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        updatedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName studentId' },
      { path: 'facilityId', select: 'name' }
    ]);

    if (!updatedReservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: updatedReservation
    });
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation',
      error: error.message
    });
  }
});

// ✅ GET user's reservations
router.get('/user/:userId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.userId })
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      message: 'User reservations retrieved successfully',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    logger.error('Error fetching user reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reservations',
      error: error.message
    });
  }
});

// ✅ GET facility's reservations for a specific date
router.get('/facility/:facilityId/date/:date', async (req, res) => {
  try {
    const startDate = new Date(req.params.date);
    const endDate = new Date(req.params.date);
    endDate.setDate(endDate.getDate() + 1);

    const reservations = await Reservation.find({
      facilityId: req.params.facilityId,
      date: { $gte: startDate, $lt: endDate }
    })
      .populate('userId', 'firstName lastName barcode')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      message: 'Facility reservations retrieved successfully',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    logger.error('Error fetching facility reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facility reservations',
      error: error.message
    });
  }
});

module.exports = router;
