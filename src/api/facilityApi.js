const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const logger = require('../logger');

// ✅ GET all facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true })
      .populate('sportTypeId', 'name description');
    
    res.json({
      success: true,
      message: 'Facilities retrieved successfully',
      data: facilities,
      count: facilities.length
    });
  } catch (error) {
    logger.error('Error fetching facilities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facilities',
      error: error.message
    });
  }
});

// ✅ GET facility by ID
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .populate('sportTypeId', 'name description');
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Facility retrieved successfully',
      data: facility
    });
  } catch (error) {
    logger.error('Error fetching facility:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facility',
      error: error.message
    });
  }
});

// ✅ CREATE new facility
router.post('/', async (req, res) => {
  try {
    const { name, location, sportTypeId, capacity, status, description } = req.body;

    logger.info('Creating facility with data:', { name, location, sportTypeId, capacity, status, description });

    if (!name || !sportTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, sportTypeId'
      });
    }

    const newFacility = new Facility({
      name,
      location,
      sportTypeId,
      capacity: capacity || 10,
      status: status || 'available',
      description,
      isActive: true
    });

    const savedFacility = await newFacility.save();
    await savedFacility.populate('sportTypeId', 'name description');

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      data: savedFacility
    });
  } catch (error) {
    logger.error('Error creating facility:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating facility',
      error: error.message
    });
  }
});

// ✅ UPDATE facility
router.put('/:id', async (req, res) => {
  try {
    const { name, location, sportTypeId, capacity, status, description, isActive } = req.body;

    const updatedFacility = await Facility.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        sportTypeId,
        capacity,
        status,
        description,
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('sportTypeId', 'name description');

    if (!updatedFacility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      message: 'Facility updated successfully',
      data: updatedFacility
    });
  } catch (error) {
    logger.error('Error updating facility:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating facility',
      error: error.message
    });
  }
});

// ✅ DELETE facility
router.delete('/:id', async (req, res) => {
  try {
    const deletedFacility = await Facility.findByIdAndDelete(req.params.id);
    if (!deletedFacility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      message: 'Facility deleted successfully',
      data: deletedFacility
    });
  } catch (error) {
    logger.error('Error deleting facility:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting facility',
      error: error.message
    });
  }
});

// ✅ GET facilities by sport type
router.get('/by-sport/:sportTypeId', async (req, res) => {
  try {
    const facilities = await Facility.find({
      sportTypeId: req.params.sportTypeId,
      isActive: true
    }).populate('sportTypeId', 'name description');

    res.json({
      success: true,
      message: 'Facilities retrieved successfully',
      data: facilities,
      count: facilities.length
    });
  } catch (error) {
    logger.error('Error fetching facilities by sport type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facilities by sport type',
      error: error.message
    });
  }
});

module.exports = router;
