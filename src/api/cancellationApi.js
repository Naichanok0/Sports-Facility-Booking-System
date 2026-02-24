const express = require('express');
const router = express.Router();
const Cancellation = require('../models/Cancellation');
const Reservation = require('../models/Reservation');
const logger = require('../logger');

// ✅ REQUEST cancellation
router.post('/', async (req, res) => {
  try {
    const { reservationId, userId, facilityId, reason, refundAmount } = req.body;

    if (!reservationId || !userId || !facilityId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if cancellation request already exists
    const existingCancellation = await Cancellation.findOne({
      reservationId,
      status: 'pending'
    });

    if (existingCancellation) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation request already pending'
      });
    }

    const newCancellation = new Cancellation({
      reservationId,
      userId,
      facilityId,
      reason,
      refundAmount,
      status: 'pending'
    });

    const savedCancellation = await newCancellation.save();
    await savedCancellation.populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'facilityId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Cancellation request submitted successfully',
      data: savedCancellation
    });
  } catch (error) {
    logger.error('Error requesting cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting cancellation',
      error: error.message
    });
  }
});

// ✅ GET all cancellations
router.get('/', async (req, res) => {
  try {
    const cancellations = await Cancellation.find()
      .populate('userId', 'firstName lastName barcode')
      .populate('facilityId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Cancellations retrieved successfully',
      data: cancellations,
      count: cancellations.length
    });
  } catch (error) {
    logger.error('Error fetching cancellations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cancellations',
      error: error.message
    });
  }
});

// ✅ GET cancellation by ID
router.get('/:id', async (req, res) => {
  try {
    const cancellation = await Cancellation.findById(req.params.id)
      .populate('userId', 'firstName lastName barcode phone')
      .populate('facilityId', 'name location')
      .populate('approvedBy', 'firstName lastName');

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation not found'
      });
    }

    res.json({
      success: true,
      message: 'Cancellation retrieved successfully',
      data: cancellation
    });
  } catch (error) {
    logger.error('Error fetching cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cancellation',
      error: error.message
    });
  }
});

// ✅ APPROVE cancellation
router.put('/:id/approve', async (req, res) => {
  try {
    const { approvedBy, notes } = req.body;

    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Approver information is required'
      });
    }

    const cancellation = await Cancellation.findById(req.params.id);

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation not found'
      });
    }

    const updatedCancellation = await Cancellation.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        notes
      },
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    // Update reservation status to cancelled
    await Reservation.findByIdAndUpdate(
      cancellation.reservationId,
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      message: 'Cancellation approved successfully',
      data: updatedCancellation
    });
  } catch (error) {
    logger.error('Error approving cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving cancellation',
      error: error.message
    });
  }
});

// ✅ REJECT cancellation
router.put('/:id/reject', async (req, res) => {
  try {
    const { approvedBy, notes } = req.body;

    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Approver information is required'
      });
    }

    const updatedCancellation = await Cancellation.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        notes
      },
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName barcode' },
      { path: 'approvedBy', select: 'firstName lastName' }
    ]);

    if (!updatedCancellation) {
      return res.status(404).json({
        success: false,
        message: 'Cancellation not found'
      });
    }

    res.json({
      success: true,
      message: 'Cancellation rejected successfully',
      data: updatedCancellation
    });
  } catch (error) {
    logger.error('Error rejecting cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting cancellation',
      error: error.message
    });
  }
});

// ✅ GET pending cancellations
router.get('/status/pending', async (req, res) => {
  try {
    const cancellations = await Cancellation.find({ status: 'pending' })
      .populate('userId', 'firstName lastName barcode')
      .populate('facilityId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Pending cancellations retrieved successfully',
      data: cancellations,
      count: cancellations.length
    });
  } catch (error) {
    logger.error('Error fetching pending cancellations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending cancellations',
      error: error.message
    });
  }
});

// ✅ GET user's cancellations
router.get('/user/:userId', async (req, res) => {
  try {
    const cancellations = await Cancellation.find({ userId: req.params.userId })
      .populate('facilityId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'User cancellations retrieved successfully',
      data: cancellations,
      count: cancellations.length
    });
  } catch (error) {
    logger.error('Error fetching user cancellations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user cancellations',
      error: error.message
    });
  }
});

module.exports = router;
