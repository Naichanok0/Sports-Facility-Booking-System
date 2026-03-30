const express = require('express');
const router = express.Router();
const WaitingRoom = require('../models/WaitingRoom');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const logger = require('../logger');

// ✅ CREATE waiting room (when user clicks "Create Booking")
router.post('/', async (req, res) => {
  try {
    console.log('📌 [POST /waiting-rooms] Request received');
    console.log('📌 Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      host, 
      facilityId, 
      sportTypeId, 
      date, 
      startTime, 
      endTime, 
      maxPlayers = 6, 
      name, 
      notes 
    } = req.body;

    // Validate required fields
    if (!host || !facilityId || !sportTypeId || !date || !startTime) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (host, facilityId, sportTypeId, date, startTime)' 
      });
    }

    console.log('✅ Step 1: Fields validated');
    
    // Get host info
    console.log('🔍 Looking up User:', host);
    const hostUser = await User.findById(host).select('firstName lastName studentId');
    console.log('✅ Step 2: User found:', hostUser ? hostUser._id : 'NOT FOUND');
    
    if (!hostUser) {
      console.log('❌ Host user not found');
      return res.status(404).json({ success: false, message: 'Host user not found' });
    }

    // Auto-expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log('✅ Step 3: ExpiresAt set to', expiresAt);

    // Generate room code
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.floor(Math.random() * 900 + 100);
    const roomCode = `WR${ts}${rnd}`;
    console.log('✅ Step 3b: Generated roomCode:', roomCode);

    const roomData = {
      host,
      facilityId,
      sportTypeId,
      date: new Date(date),
      startTime,
      endTime: endTime || null,
      maxPlayers,
      name,
      notes,
      expiresAt,
      roomCode,  // Add this
      // Add host as first player
      players: [{
        userId: host,
        firstName: hostUser.firstName,
        lastName: hostUser.lastName,
        studentId: hostUser.studentId,
        joinedAt: new Date()
      }]
    };
    
    console.log('📝 Room data prepared:', JSON.stringify(roomData, null, 2));

    const room = new WaitingRoom(roomData);
    console.log('✅ Step 4: WaitingRoom instance created');

    const saved = await room.save();
    console.log('✅ Step 5: Room saved to DB:', saved._id);
    
    console.log('🔄 Step 6: Fetching populated room data');
    const populated = await WaitingRoom.findById(saved._id)
      .populate('host', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name');

    console.log('✅ Step 7: Room data populated');

    res.status(201).json({ 
      success: true, 
      message: 'Waiting room created successfully',
      data: populated 
    });
  } catch (error) {
    const errorMsg = error?.message || JSON.stringify(error);
    console.error('❌ ERROR in POST /waiting-rooms:', errorMsg);
    console.error('📋 Error name:', error?.name);
    console.error('📋 Error code:', error?.code);
    console.error('📋 Full error:', error);
    console.error('📋 Stack:', error?.stack);
    logger.error('Error creating waiting room:', errorMsg);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating waiting room', 
      error: errorMsg
    });
  }
});

// ✅ GET all open waiting rooms (for joining)
router.get('/', async (req, res) => {
  try {
    const { facilityId, sportTypeId, date, status = 'open', limit = 50, skip = 0 } = req.query;
    
    const query = { status: { $in: status.split(',') } };
    if (facilityId) query.facilityId = facilityId;
    if (sportTypeId) query.sportTypeId = sportTypeId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const rooms = await WaitingRoom.find(query)
      .populate('host', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await WaitingRoom.countDocuments(query);

    res.json({ 
      success: true, 
      message: 'Waiting rooms retrieved successfully',
      data: rooms, 
      count: rooms.length,
      total
    });
  } catch (error) {
    logger.error('Error listing waiting rooms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error listing waiting rooms', 
      error: error.message 
    });
  }
});

// ✅ GET waiting room by ID or roomCode
router.get('/:idOrCode', async (req, res) => {
  try {
    const { idOrCode } = req.params;
    let room;

    // Try to find by MongoDB ObjectId first
    if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      room = await WaitingRoom.findById(idOrCode);
    }

    // If not found, try by roomCode
    if (!room) {
      room = await WaitingRoom.findOne({ roomCode: idOrCode });
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Waiting room not found' });
    }

    await room.populate([
      { path: 'host', select: 'firstName lastName studentId' },
      { path: 'facilityId', select: 'name location' },
      { path: 'sportTypeId', select: 'name' },
      { path: 'players.userId', select: 'firstName lastName studentId barcode' }
    ]);

    res.json({ success: true, data: room });
  } catch (error) {
    logger.error('Error fetching waiting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching waiting room', 
      error: error.message 
    });
  }
});

// ✅ JOIN a waiting room
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const room = await WaitingRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Waiting room not found' });
    }

    // Check if room is still open
    if (room.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot join room (status: ${room.status})` 
      });
    }

    // Check if user already in room
    const alreadyJoined = room.players.some(p => String(p.userId) === String(userId));
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'User already in this room' });
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      room.status = 'full';
      await room.save();
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    // Get user info
    const user = await User.findById(userId).select('firstName lastName studentId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add player to room
    room.players.push({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId,
      joinedAt: new Date()
    });

    // Update status if room is now full
    if (room.players.length >= room.maxPlayers) {
      room.status = 'full';
    }

    await room.save();

    const updated = await WaitingRoom.findById(id)
      .populate('host', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name');

    res.json({ 
      success: true, 
      message: 'Joined waiting room successfully',
      data: updated 
    });
  } catch (error) {
    logger.error('Error joining waiting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error joining waiting room', 
      error: error.message 
    });
  }
});

// ✅ LEAVE a waiting room
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const room = await WaitingRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Waiting room not found' });
    }

    const playerCountBefore = room.players.length;
    room.players = room.players.filter(p => String(p.userId) !== String(userId));

    if (room.players.length === playerCountBefore) {
      return res.status(400).json({ success: false, message: 'User was not in room' });
    }

    // If no players left, close the room
    if (room.players.length === 0) {
      room.status = 'closed';
    } else if (room.status === 'full' && room.players.length < room.maxPlayers) {
      room.status = 'open';
    }

    await room.save();

    const updated = await WaitingRoom.findById(id)
      .populate('host', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name')
      .populate('players.userId', 'firstName lastName studentId');

    res.json({ 
      success: true, 
      message: 'Left waiting room successfully',
      data: updated 
    });
  } catch (error) {
    logger.error('Error leaving waiting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error leaving waiting room', 
      error: error.message 
    });
  }
});

// ✅ CLOSE waiting room and create reservation with all players
router.post('/:id/close-and-reserve', async (req, res) => {
  try {
    console.log('📌 [POST /close-and-reserve] Request received');
    console.log('📌 Room ID:', req.params.id);
    
    const { id } = req.params;

    const room = await WaitingRoom.findById(id);
    console.log('✅ Room found:', room ? room._id : 'NOT FOUND');
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Waiting room not found' });
    }

    if (room.players.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot create reservation with no players' });
    }

    // Calculate duration
    const [startHour, startMin] = room.startTime.split(':').map(Number);
    let endHour = startHour + 2, endMin = 0; // Default 2-hour slot
    
    if (room.endTime) {
      const parts = room.endTime.split(':');
      if (parts.length >= 2) {
        endHour = parseInt(parts[0]);
        endMin = parseInt(parts[1]);
      }
    }

    const durationHours = (endHour - startHour) + (endMin - startMin) / 60;

    // Generate reservation number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reservationNo = `RES${timestamp}${random}`;

    console.log('📝 Creating reservation:', {
      reservationNo,
      userId: room.host,
      playerCount: room.players.length,
      durationHours
    });

    // Create reservation with host as primary user
    const reservation = new Reservation({
      reservationNo,
      userId: room.host,
      facilityId: room.facilityId,
      sportTypeId: room.sportTypeId,
      date: room.date,
      startTime: room.startTime,
      endTime: room.endTime || `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
      durationHours,
      playerCount: room.players.length,
      status: 'confirmed',
      notes: room.notes || `Created from waiting room ${room.roomCode}`,
      players: room.players.map(p => ({
        userId: String(p.userId),
        firstName: p.firstName,
        lastName: p.lastName,
        studentId: p.studentId
      })),
      confirmedAt: new Date()
    });

    console.log('✅ Reservation object created');
    console.log('📋 Reservation data:', JSON.stringify(reservation.toObject(), null, 2));

    let savedReservation;
    try {
      savedReservation = await reservation.save();
      console.log('✅ Reservation saved:', savedReservation._id);
    } catch (saveError) {
      console.error('❌ Error saving reservation:', saveError.message);
      console.error('📋 Validation errors:', saveError.errors);
      throw saveError;
    }

    // Update waiting room
    try {
      const updatedRoom = await WaitingRoom.findByIdAndUpdate(
        room._id,
        {
          status: 'completed',
          reservationId: savedReservation._id
        },
        { new: true }
      );
      console.log('✅ Waiting room updated:', updatedRoom._id);
    } catch (updateError) {
      console.error('❌ Error updating waiting room:', updateError.message);
      // Continue anyway since reservation was already created
    }

    // Populate and return reservation
    const populatedReservation = await Reservation.findById(savedReservation._id)
      .populate('userId', 'firstName lastName studentId')
      .populate('facilityId', 'name location')
      .populate('sportTypeId', 'name');

    console.log('✅ Reservation populated and returned');

    res.json({
      success: true,
      message: 'Waiting room closed and reservation created successfully',
      data: {
        waitingRoom: room,
        reservation: populatedReservation
      }
    });
  } catch (error) {
    const errorMsg = error?.message || JSON.stringify(error);
    console.error('❌ ERROR in POST /close-and-reserve:', errorMsg);
    console.error('📋 Error details:', error);
    console.error('📋 Stack:', error?.stack);
    logger.error('Error closing waiting room and creating reservation:', errorMsg);
    res.status(500).json({
      success: false,
      message: 'Error closing waiting room and creating reservation',
      error: errorMsg
    });
  }
});

// ✅ CANCEL waiting room
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await WaitingRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Waiting room not found' });
    }

    room.status = 'cancelled';
    await room.save();

    res.json({ 
      success: true, 
      message: 'Waiting room cancelled successfully',
      data: room 
    });
  } catch (error) {
    logger.error('Error cancelling waiting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling waiting room', 
      error: error.message 
    });
  }
});

module.exports = router;
