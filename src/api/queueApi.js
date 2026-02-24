const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const Reservation = require('../models/Reservation');
const logger = require('../logger');

// ✅ GET all queue entries
router.get('/', async (req, res) => {
  try {
    const queues = await Queue.find()
      .populate('reservationId', 'reservationNo date startTime endTime')
      .populate('userId', 'firstName lastName barcode')
      .populate('facilityId', 'name')
      .sort({ position: 1 });
    
    res.json({
      success: true,
      message: 'Queue entries retrieved successfully',
      data: queues,
      count: queues.length
    });
  } catch (error) {
    logger.error('Error fetching queue entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queue entries',
      error: error.message
    });
  }
});

// ✅ GET queue by reservation
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const queues = await Queue.find({ reservationId: req.params.reservationId })
      .populate('userId', 'firstName lastName barcode phone')
      .populate('facilityId', 'name')
      .sort({ position: 1 });
    
    if (!queues || queues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No queue entries found for this reservation'
      });
    }
    
    res.json({
      success: true,
      message: 'Queue entries retrieved successfully',
      data: queues,
      count: queues.length
    });
  } catch (error) {
    logger.error('Error fetching queue entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queue entries',
      error: error.message
    });
  }
});

// ✅ JOIN queue
router.post('/join', async (req, res) => {
  try {
    const { reservationId, userId, facilityId, playerName, playerBarcode } = req.body;

    if (!reservationId || !userId || !facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user is already in queue
    const existingEntry = await Queue.findOne({ reservationId, userId });
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'User is already in this queue'
      });
    }

    // Get next position
    const lastEntry = await Queue.findOne({ reservationId }).sort({ position: -1 });
    const nextPosition = lastEntry ? lastEntry.position + 1 : 1;

    const newQueueEntry = new Queue({
      reservationId,
      userId,
      facilityId,
      position: nextPosition,
      status: 'waiting',
      playerName,
      playerBarcode,
      joinedAt: new Date()
    });

    const savedEntry = await newQueueEntry.save();
    await savedEntry.populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'facilityId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Joined queue successfully',
      data: savedEntry
    });
  } catch (error) {
    logger.error('Error joining queue:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining queue',
      error: error.message
    });
  }
});

// ✅ CONFIRM queue entry
router.put('/:id/confirm', async (req, res) => {
  try {
    const updatedEntry = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        status: 'confirmed',
        confirmedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'facilityId', select: 'name' }
    ]);

    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Queue entry confirmed successfully',
      data: updatedEntry
    });
  } catch (error) {
    logger.error('Error confirming queue entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming queue entry',
      error: error.message
    });
  }
});

// ✅ CANCEL queue entry
router.put('/:id/cancel', async (req, res) => {
  try {
    const entry = await Queue.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    // Reorder remaining queue
    const remainingQueue = await Queue.find({
      reservationId: entry.reservationId,
      status: { $ne: 'cancelled' }
    }).sort({ position: 1 });

    for (let i = 0; i < remainingQueue.length; i++) {
      await Queue.findByIdAndUpdate(remainingQueue[i]._id, { position: i + 1 });
    }

    res.json({
      success: true,
      message: 'Queue entry cancelled successfully',
      data: entry
    });
  } catch (error) {
    logger.error('Error cancelling queue entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling queue entry',
      error: error.message
    });
  }
});

// ✅ LEAVE queue
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Queue.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    // Reorder remaining queue
    const remainingQueue = await Queue.find({
      reservationId: entry.reservationId
    }).sort({ position: 1 });

    for (let i = 0; i < remainingQueue.length; i++) {
      await Queue.findByIdAndUpdate(remainingQueue[i]._id, { position: i + 1 });
    }

    res.json({
      success: true,
      message: 'Removed from queue successfully',
      data: entry
    });
  } catch (error) {
    logger.error('Error removing from queue:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from queue',
      error: error.message
    });
  }
});

// ✅ GET queue position for user
router.get('/user/:userId/reservation/:reservationId', async (req, res) => {
  try {
    const entry = await Queue.findOne({
      userId: req.params.userId,
      reservationId: req.params.reservationId
    }).populate('facilityId', 'name');

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'User not in queue'
      });
    }

    res.json({
      success: true,
      message: 'Queue entry retrieved successfully',
      data: entry
    });
  } catch (error) {
    logger.error('Error fetching queue entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queue entry',
      error: error.message
    });
  }
});

module.exports = router;
