// src/api/statisticsApi.js
const Reservation = require('../models/Reservation');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Facility = require('../models/Facility');
const logger = require('../logger');

// GET /api/statistics/bookings
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
async function getBookingStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all reservations in date range
    const reservations = await Reservation.find({
      date: {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    }).populate('userId facilityId');

    // Calculate statistics
    const stats = {
      total: reservations.length,
      completed: reservations.filter(r => r.status === 'completed').length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      noShow: reservations.filter(r => r.status === 'no-show').length,
      checkedIn: reservations.filter(r => r.status === 'checked-in').length,
    };

    // Group by day
    const byDay = {};
    reservations.forEach(res => {
      const day = res.date;
      if (!byDay[day]) {
        byDay[day] = { date: day, bookings: 0, completed: 0, noShow: 0, cancelled: 0 };
      }
      byDay[day].bookings++;
      if (res.status === 'completed') byDay[day].completed++;
      if (res.status === 'no-show') byDay[day].noShow++;
      if (res.status === 'cancelled') byDay[day].cancelled++;
    });

    // Group by facility
    const byFacility = {};
    reservations.forEach(res => {
      const facId = res.facilityId?._id?.toString() || 'unknown';
      const facName = res.facilityId?.name || 'Unknown';
      if (!byFacility[facId]) {
        byFacility[facId] = { 
          facilityId: facId, 
          facilityName: facName, 
          bookings: 0, 
          utilization: 0 
        };
      }
      byFacility[facId].bookings++;
    });

    logger.info('Booking statistics fetched', { startDate, endDate, total: stats.total });

    res.json({
      success: true,
      data: {
        ...stats,
        byDay: Object.values(byDay).sort((a, b) => new Date(a.date) - new Date(b.date)),
        byFacility: Object.values(byFacility)
      }
    });
  } catch (error) {
    logger.error('Error fetching booking statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
}

// GET /api/statistics/facilities
async function getFacilityStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all facilities
    const facilities = await Facility.find({ isActive: true }).populate('sportTypeId');

    // Get reservations in date range
    const reservations = await Reservation.find({
      date: {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    });

    // Calculate stats per facility
    const facilityStats = facilities.map(facility => {
      const facReservations = reservations.filter(
        r => r.facilityId?.toString() === facility._id.toString()
      );

      const completed = facReservations.filter(r => r.status === 'completed').length;
      const cancelled = facReservations.filter(r => r.status === 'cancelled').length;
      const noShow = facReservations.filter(r => r.status === 'no-show').length;

      return {
        facilityId: facility._id,
        facilityName: facility.name,
        sportTypeName: facility.sportTypeId?.name || 'Unknown',
        totalBookings: facReservations.length,
        completed,
        cancelled,
        noShow,
        utilizationRate: facReservations.length > 0 ? 
          Math.round((completed / facReservations.length) * 100) : 0,
        averagePlayersPerSession: facReservations.length > 0 ?
          Math.round(facReservations.reduce((sum, r) => sum + (r.confirmedPlayers?.length || 1), 0) / facReservations.length) : 0
      };
    });

    logger.info('Facility statistics fetched');

    res.json({
      success: true,
      data: facilityStats
    });
  } catch (error) {
    logger.error('Error fetching facility statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch facility statistics'
    });
  }
}

// GET /api/statistics/users
async function getUserStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // User counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // User booking patterns
    const reservations = await Reservation.find({
      date: {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    }).populate('userId');

    // Group by user
    const userBookings = {};
    reservations.forEach(res => {
      const userId = res.userId?._id?.toString() || 'unknown';
      const userName = res.userId ? `${res.userId.firstName} ${res.userId.lastName}` : 'Unknown';
      if (!userBookings[userId]) {
        userBookings[userId] = { userId, userName, bookings: 0 };
      }
      userBookings[userId].bookings++;
    });

    const topUsers = Object.values(userBookings)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    // Bookings by day of week
    const bookingsByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    reservations.forEach(res => {
      const date = new Date(res.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      bookingsByDay[dayName]++;
    });

    logger.info('User statistics fetched');

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        averageBookingsPerUser: totalUsers > 0 ? 
          Math.round((reservations.length / totalUsers) * 100) / 100 : 0,
        topUsers,
        bookingsByDay: Object.entries(bookingsByDay).map(([day, count]) => ({ day, count }))
      }
    });
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user statistics'
    });
  }
}

module.exports = {
  getBookingStatistics,
  getFacilityStatistics,
  getUserStatistics
};
