// src/queueRoutes.js - Queue/Waiting Room Management
const express = require('express');
const Queue = require('./models/Queue');
const Reservation = require('./models/Reservation');
const User = require('./models/User');
const { authRequired, roleRequired } = require('./auth');
const logger = require('./logger');

const router = express.Router();

// ========== GET: ดูคิวของการจองเดียว ==========
router.get('/reservations/:reservationId', authRequired, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId)
      .populate('facilityId', 'name')
      .populate('sportTypeId', 'name');

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const queue = await Queue.find({
      reservationId: req.params.reservationId,
      status: { $in: ['waiting', 'approved'] }
    })
    .populate('userId', 'firstName lastName studentId barcode')
    .sort({ position: 1 });

    // Get current player count from approved queue members
    const approvedCount = queue.filter(q => q.status === 'approved').length;

    res.json({
      success: true,
      reservation,
      queue,
      totalApproved: approvedCount,
      totalWaiting: queue.filter(q => q.status === 'waiting').length,
      playerCount: (reservation.playerCount || 0) + approvedCount
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: เข้าร่วมคิว ==========
router.post('/join/:reservationId', authRequired, async (req, res) => {
  try {
    const { playerName, playerBarcode } = req.body;

    const reservation = await Reservation.findById(req.params.reservationId);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Check if user is already in queue
    const existing = await Queue.findOne({
      reservationId: req.params.reservationId,
      userId: req.user._id,
      status: { $ne: 'rejected' }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already in queue' 
      });
    }

    // Get current position
    const maxPosition = await Queue.findOne({
      reservationId: req.params.reservationId
    }).sort({ position: -1 });

    const position = (maxPosition?.position || 0) + 1;

    // Create queue entry
    const queueEntry = await Queue.create({
      reservationId: req.params.reservationId,
      userId: req.user._id,
      facilityId: reservation.facilityId,
      position,
      playerName: playerName || req.user.firstName + ' ' + req.user.lastName,
      playerBarcode: playerBarcode || req.user.barcode,
      status: 'waiting'
    });

    logger.info(`User ${req.user._id} joined queue for reservation ${req.params.reservationId}`);

    res.json({
      success: true,
      message: 'Joined queue successfully',
      queueEntry,
      position
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Approve Queue Member ==========
router.post('/approve/:queueId', authRequired, roleRequired(['admin', 'facility-staff']), async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.queueId)
      .populate('userId', 'firstName lastName');

    if (!queueEntry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    queueEntry.status = 'approved';
    queueEntry.approvedAt = new Date();
    await queueEntry.save();

    logger.info(`Approved queue entry ${req.params.queueId}`);

    res.json({
      success: true,
      message: 'Queue member approved',
      queueEntry
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Reject Queue Member ==========
router.post('/reject/:queueId', authRequired, roleRequired(['admin', 'facility-staff']), async (req, res) => {
  try {
    const { reason } = req.body;

    const queueEntry = await Queue.findById(req.params.queueId);
    if (!queueEntry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    queueEntry.status = 'rejected';
    queueEntry.rejectionReason = reason || 'Rejected by staff';
    await queueEntry.save();

    logger.info(`Rejected queue entry ${req.params.queueId}`);

    res.json({
      success: true,
      message: 'Queue member rejected',
      queueEntry
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== POST: Cancel Queue Entry ==========
router.post('/cancel/:queueId', authRequired, async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.queueId);

    if (!queueEntry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    // Check if user owns this queue entry
    if (queueEntry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    queueEntry.status = 'cancelled';
    await queueEntry.save();

    logger.info(`User cancelled queue entry ${req.params.queueId}`);

    res.json({
      success: true,
      message: 'Cancelled queue entry',
      queueEntry
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูคิวของฉัน ==========
router.get('/my-queues', authRequired, async (req, res) => {
  try {
    const queues = await Queue.find({
      userId: req.user._id,
      status: { $in: ['waiting', 'approved'] }
    })
    .populate('reservationId', 'date startTime endTime')
    .populate('facilityId', 'name')
    .sort({ joinedAt: -1 });

    res.json({
      success: true,
      count: queues.length,
      queues
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูสถานะคิวของฉัน ==========
router.get('/my-status/:reservationId', authRequired, async (req, res) => {
  try {
    const queueEntry = await Queue.findOne({
      reservationId: req.params.reservationId,
      userId: req.user._id
    })
    .populate('reservationId')
    .populate('facilityId', 'name');

    if (!queueEntry) {
      return res.status(404).json({ 
        success: true, 
        inQueue: false,
        message: 'Not in queue' 
      });
    }

    // Get all people ahead in queue
    const peopleAhead = await Queue.countDocuments({
      reservationId: req.params.reservationId,
      position: { $lt: queueEntry.position },
      status: { $in: ['waiting', 'approved'] }
    });

    res.json({
      success: true,
      inQueue: true,
      queueEntry,
      position: queueEntry.position,
      peopleAhead
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET: ดูสถิติคิว (Admin) ==========
router.get('/stats', authRequired, roleRequired(['admin']), async (req, res) => {
  try {
    const total = await Queue.countDocuments();
    const waiting = await Queue.countDocuments({ status: 'waiting' });
    const approved = await Queue.countDocuments({ status: 'approved' });
    const rejected = await Queue.countDocuments({ status: 'rejected' });
    const cancelled = await Queue.countDocuments({ status: 'cancelled' });

    res.json({
      success: true,
      stats: {
        total,
        waiting,
        approved,
        rejected,
        cancelled
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
