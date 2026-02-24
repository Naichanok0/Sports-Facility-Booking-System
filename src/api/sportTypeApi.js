const express = require('express');
const router = express.Router();
const SportType = require('../models/SportType');
const logger = require('../logger');

// ✅ GET all sport types
router.get('/', async (req, res) => {
  try {
    const sportTypes = await SportType.find({ isActive: true });
    res.json({
      success: true,
      message: 'Sport types retrieved successfully',
      data: sportTypes,
      count: sportTypes.length
    });
  } catch (error) {
    logger.error('Error fetching sport types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sport types',
      error: error.message
    });
  }
});

// ✅ GET sport type by ID
router.get('/:id', async (req, res) => {
  try {
    const sportType = await SportType.findById(req.params.id);
    if (!sportType) {
      return res.status(404).json({
        success: false,
        message: 'Sport type not found'
      });
    }
    res.json({
      success: true,
      message: 'Sport type retrieved successfully',
      data: sportType
    });
  } catch (error) {
    logger.error('Error fetching sport type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sport type',
      error: error.message
    });
  }
});

// ✅ CREATE new sport type
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, duration, minPlayers } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Sport type name is required'
      });
    }

    // Check if sport type already exists
    const existingSportType = await SportType.findOne({ name });
    if (existingSportType) {
      return res.status(400).json({
        success: false,
        message: 'Sport type already exists'
      });
    }

    const newSportType = new SportType({
      name,
      description,
      icon,
      duration: duration || 60,
      minPlayers: minPlayers || 2,
      isActive: true
    });

    const savedSportType = await newSportType.save();
    res.status(201).json({
      success: true,
      message: 'Sport type created successfully',
      data: savedSportType
    });
  } catch (error) {
    logger.error('Error creating sport type:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sport type',
      error: error.message
    });
  }
});

// ✅ UPDATE sport type
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, duration, minPlayers, isActive } = req.body;

    const updatedSportType = await SportType.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        icon,
        duration,
        minPlayers,
        isActive
      },
      { new: true }
    );

    if (!updatedSportType) {
      return res.status(404).json({
        success: false,
        message: 'Sport type not found'
      });
    }

    res.json({
      success: true,
      message: 'Sport type updated successfully',
      data: updatedSportType
    });
  } catch (error) {
    logger.error('Error updating sport type:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sport type',
      error: error.message
    });
  }
});

// ✅ DELETE sport type
router.delete('/:id', async (req, res) => {
  try {
    const deletedSportType = await SportType.findByIdAndDelete(req.params.id);
    if (!deletedSportType) {
      return res.status(404).json({
        success: false,
        message: 'Sport type not found'
      });
    }

    res.json({
      success: true,
      message: 'Sport type deleted successfully',
      data: deletedSportType
    });
  } catch (error) {
    logger.error('Error deleting sport type:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sport type',
      error: error.message
    });
  }
});

module.exports = router;
