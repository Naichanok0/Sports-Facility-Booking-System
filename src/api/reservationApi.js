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
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    const reservations = await Reservation.find()
      .populate('userId', 'firstName lastName studentId barcode')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Reservation.countDocuments();
    
    res.json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: reservations,
      count: reservations.length,
      total: total,
      limit: limit,
      skip: skip
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
    const { 
      userId, 
      facilityId, 
      sportTypeId, 
      date, 
      startTime, 
      endTime, 
      playerCount = 1, 
      notes = "",
      bookingCode,
      players,
      facilityName,    // Accept these from frontend as fallback
      sportTypeName,   // Accept these from frontend as fallback
      status = 'confirmed'
    } = req.body;

    // Validate required fields
    if (!userId || !facilityId || !sportTypeId || !date || !startTime || !endTime) {
      console.error('Missing fields:', { userId, facilityId, sportTypeId, date, startTime, endTime });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        received: { userId: !!userId, facilityId: !!facilityId, sportTypeId: !!sportTypeId, date: !!date, startTime: !!startTime, endTime: !!endTime }
      });
    }

    // Calculate duration
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationHours = (endHour - startHour) + (endMin - startMin) / 60;

    // Parse date safely
    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: e.message
      });
    }

    const newReservation = new Reservation({
      reservationNo: bookingCode || generateReservationNo(),
      userId,
      facilityId,
      sportTypeId,
      date: parsedDate,
      startTime,
      endTime,
      durationHours,
      playerCount: playerCount || 1,
      status: status,
      notes,
      players: players || []
    });

    const savedReservation = await newReservation.save();
    
    // Try to populate references
    let populatedReservation = savedReservation;
    try {
      populatedReservation = await Reservation.findById(savedReservation._id).populate([
        { path: 'userId', select: 'firstName lastName studentId barcode' },
        { path: 'facilityId', select: 'name location pricePerHour' },
        { path: 'sportTypeId', select: 'name' }
      ]);
    } catch (popErr) {
      // If population fails, continue with original
      logger.warn('Population failed for reservation:', popErr.message);
    }

    // Convert to object and ensure we have facility/sport names
    let responseData = populatedReservation?.toObject?.() || savedReservation.toObject();
    
    // If populate didn't fill in names, use the fallback names from request
    if (!responseData.facilityId?.name && facilityName) {
      if (typeof responseData.facilityId === 'string' || typeof responseData.facilityId === 'object' && !responseData.facilityId.name) {
        responseData.facilityId = { 
          _id: responseData.facilityId?._id || responseData.facilityId, 
          name: facilityName 
        };
      }
    }
    
    if (!responseData.sportTypeId?.name && sportTypeName) {
      if (typeof responseData.sportTypeId === 'string' || typeof responseData.sportTypeId === 'object' && !responseData.sportTypeId.name) {
        responseData.sportTypeId = { 
          _id: responseData.sportTypeId?._id || responseData.sportTypeId, 
          name: sportTypeName 
        };
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: responseData
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

// ✅ DELETE reservation permanently
router.delete('/:id', async (req, res) => {
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!deletedReservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      message: 'Reservation deleted successfully',
      data: deletedReservation
    });
  } catch (error) {
    logger.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reservation',
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

// ✅ GET available time slots for a facility on a specific date
router.get('/available-slots/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date query parameter is required (YYYY-MM-DD)'
      });
    }

    // Get all reservations for this facility on this date
    const reservations = await Reservation.find({
      facilityId,
      date,
      status: { $in: ['confirmed', 'checked-in', 'completed'] }
    }).sort({ startTime: 1 });

    // Generate time slots (08:00 to 18:00, 2-hour slots)
    const timeSlots = [];
    const hours = [
      { start: '08:00', end: '10:00' },
      { start: '10:00', end: '12:00' },
      { start: '12:00', end: '14:00' },
      { start: '14:00', end: '16:00' },
      { start: '16:00', end: '18:00' }
    ];

    hours.forEach(slot => {
      // Check if slot has any reservations
      const reserved = reservations.filter(res =>
        (res.startTime <= slot.start && res.endTime > slot.start) ||
        (res.startTime < slot.end && res.endTime >= slot.end) ||
        (res.startTime >= slot.start && res.endTime <= slot.end)
      );

      timeSlots.push({
        start: slot.start,
        end: slot.end,
        available: reserved.length === 0,
        reserved: reserved.length
      });
    });

    logger.info(`Available slots retrieved for facility ${facilityId} on ${date}`);

    res.json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: timeSlots
    });
  } catch (error) {
    logger.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
});

// ✅ GET available bookings (that need more players)
router.get('/available/bookings', async (req, res) => {
  try {
    const { status = 'confirmed', date } = req.query;

    let query = { status };
    
    // If date provided, filter for future dates
    if (date) {
      query.date = { $gte: date };
    } else {
      // Default: future bookings only
      const today = new Date().toISOString().split('T')[0];
      query.date = { $gte: today };
    }

    const bookings = await Reservation.find(query)
      .populate('userId', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name minPlayers')
      .sort({ date: 1, startTime: 1 });

    // Filter bookings that need more players
    const availableBookings = bookings.map(booking => {
      const requiredPlayers = booking.sportTypeId?.minPlayers || booking.requiredPlayers || 2;
      const currentPlayers = booking.confirmedPlayers?.length || 1;
      return {
        _id: booking._id,
        facilityId: booking.facilityId._id,
        facilityName: booking.facilityName || booking.facilityId.name,
        sportTypeId: booking.sportTypeId._id,
        sportTypeName: booking.sportTypeId.name,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        requiredPlayers,
        currentPlayers,
        availableSlots: Math.max(0, requiredPlayers - currentPlayers),
        createdBy: booking.userId.firstName + ' ' + booking.userId.lastName,
        status: booking.status
      };
    }).filter(b => b.availableSlots > 0);

    logger.info(`Available bookings retrieved, count: ${availableBookings.length}`);

    res.json({
      success: true,
      message: 'Available bookings retrieved successfully',
      data: availableBookings,
      count: availableBookings.length
    });
  } catch (error) {
    logger.error('Error fetching available bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available bookings',
      error: error.message
    });
  }
});

module.exports = router;
