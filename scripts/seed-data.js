/**
 * Seed Data Script
 * เพื่อสร้างข้อมูลตัวอย่างในฐานข้อมูล MongoDB
 * 
 * วิธีใช้: node scripts/seed-data.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3089/api';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}

// Main seed function
async function seedDatabase() {
  try {
    console.log('🌱 เริ่มการสร้างข้อมูลตัวอย่าง...\n');

    // 0. Create Users
    console.log('👥 กำลังสร้างผู้ใช้งาน...');
    const crypto = require('crypto');
    
    const users = [
      {
        username: '6630202414',
        email: 'naichanok5678@gmail.com',
        passwordHash: crypto.createHash('sha256').update('user123').digest('hex'),
        firstName: 'Naichanok',
        lastName: 'lamthog',
        studentId: '6630202414',
        barcode: '20066302414',
        phone: '0658480696',
        faculty: 'วิทยาศาสตร์',
        role: 'user',
        isActive: true,
        isBanned: false,
        noShowCount: 0
      },
      {
        username: '6611112222',
        email: 'admin@university.ac.th',
        passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        studentId: '6611112222',
        barcode: '20066111112',
        phone: '081-234-5678',
        faculty: 'วิศวกรรมศาสตร์',
        role: 'admin',
        isActive: true,
        isBanned: false,
        noShowCount: 0
      },
      {
        username: '6622223333',
        email: 'staff@university.ac.th',
        passwordHash: crypto.createHash('sha256').update('staff123').digest('hex'),
        firstName: 'สมศักดิ์',
        lastName: 'ดูแลดี',
        studentId: '6622223333',
        barcode: '20066222223',
        phone: '092-111-2222',
        faculty: 'กองกีฬา',
        role: 'facility-staff',
        isActive: true,
        isBanned: false,
        noShowCount: 0
      },
    ];

    let userIds = [];
    for (const user of users) {
      const result = await apiCall('POST', '/users', user);
      userIds.push(result.data._id);
      console.log(`  ✓ ${user.firstName} ${user.lastName} (${user.role})`);
    }

    // 1. Create Sport Types
    console.log('\n📋 กำลังสร้างชนิดกีฬา...');
    const sportTypes = [
      { name: 'ฟุตบอล', description: 'กีฬาฟุตบอล 11 คน', requiredPlayers: 11 },
      { name: 'บาสเกตบอล', description: 'กีฬาบาสเกตบอล 5 คน', requiredPlayers: 5 },
      { name: 'แบดมินตัน', description: 'กีฬาแบดมินตัน 2 คน', requiredPlayers: 2 },
      { name: 'วอลเลย์บอล', description: 'กีฬาวอลเลย์บอล 6 คน', requiredPlayers: 6 },
      { name: 'เทนนิส', description: 'กีฬาเทนนิส 2 คน', requiredPlayers: 2 },
      { name: 'ตะกร้อ', description: 'กีฬาตะกร้อ 3 คน', requiredPlayers: 3 },
      { name: 'ฮอกกี้', description: 'กีฬาฮอกกี้ 6 คน', requiredPlayers: 6 },
    ];

    let sportTypeIds = [];
    for (const sport of sportTypes) {
      const result = await apiCall('POST', '/sport-types', sport);
      sportTypeIds.push(result.data._id);
      console.log(`  ✓ ${sport.name}`);
    }

    // 2. Create Facilities
    console.log('\n🏟️  กำลังสร้างสนาม...');
    const facilities = [
      { 
        name: 'สนามฟุตบอล 1', 
        sportTypeId: sportTypeIds[0], 
        sportTypeName: 'ฟุตบอล',
        location: 'ตึก A',
        capacity: 50,
        requiredPlayers: 11 
      },
      { 
        name: 'สนามฟุตบอล 2', 
        sportTypeId: sportTypeIds[0], 
        sportTypeName: 'ฟุตบอล',
        location: 'ตึก A',
        capacity: 50,
        requiredPlayers: 11 
      },
      { 
        name: 'สนามบาสเกตบอล A', 
        sportTypeId: sportTypeIds[1], 
        sportTypeName: 'บาสเกตบอล',
        location: 'ตึก B',
        capacity: 30,
        requiredPlayers: 5 
      },
      { 
        name: 'สนามบาสเกตบอล B', 
        sportTypeId: sportTypeIds[1], 
        sportTypeName: 'บาสเกตบอล',
        location: 'ตึก B',
        capacity: 30,
        requiredPlayers: 5 
      },
      { 
        name: 'คอร์ทแบดมินตัน 1', 
        sportTypeId: sportTypeIds[2], 
        sportTypeName: 'แบดมินตัน',
        location: 'ตึก C',
        capacity: 20,
        requiredPlayers: 2 
      },
      { 
        name: 'คอร์ทแบดมินตัน 2', 
        sportTypeId: sportTypeIds[2], 
        sportTypeName: 'แบดมินตัน',
        location: 'ตึก C',
        capacity: 20,
        requiredPlayers: 2 
      },
      { 
        name: 'คอร์ทแบดมินตัน 3', 
        sportTypeId: sportTypeIds[2], 
        sportTypeName: 'แบดมินตัน',
        location: 'ตึก C',
        capacity: 20,
        requiredPlayers: 2 
      },
      { 
        name: 'สนามวอลเลย์บอล', 
        sportTypeId: sportTypeIds[3], 
        sportTypeName: 'วอลเลย์บอล',
        location: 'ตึก D',
        capacity: 25,
        requiredPlayers: 6 
      },
      { 
        name: 'คอร์ทเทนนิส 1', 
        sportTypeId: sportTypeIds[4], 
        sportTypeName: 'เทนนิส',
        location: 'ตึก E',
        capacity: 10,
        requiredPlayers: 2 
      },
      { 
        name: 'คอร์ทเทนนิส 2', 
        sportTypeId: sportTypeIds[4], 
        sportTypeName: 'เทนนิส',
        location: 'ตึก E',
        capacity: 10,
        requiredPlayers: 2 
      },
    ];

    let facilityIds = [];
    for (const facility of facilities) {
      const result = await apiCall('POST', '/facilities', facility);
      facilityIds.push(result.data._id);
      console.log(`  ✓ ${facility.name}`);
    }

    // 3. Create Reservations
    console.log('\n📅 กำลังสร้างการจอง...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const reservations = [
      {
        facilityId: facilityIds[0],
        facilityName: 'สนามฟุตบอล 1',
        sportTypeId: sportTypeIds[0],
        sportTypeName: 'ฟุตบอล',
        userId: userIds[0], // Use first user from seed
        userName: users[0].firstName + ' ' + users[0].lastName,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        playerCount: 11,
        status: 'confirmed',
        notes: 'การจองทดสอบ'
      },
      {
        facilityId: facilityIds[2],
        facilityName: 'สนามบาสเกตบอล A',
        sportTypeId: sportTypeIds[1],
        sportTypeName: 'บาสเกตบอล',
        userId: userIds[0],
        userName: users[0].firstName + ' ' + users[0].lastName,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '16:00',
        playerCount: 5,
        status: 'confirmed',
        notes: 'การจองทดสอบ'
      },
      {
        facilityId: facilityIds[4],
        facilityName: 'คอร์ทแบดมินตัน 1',
        sportTypeId: sportTypeIds[2],
        sportTypeName: 'แบดมินตัน',
        userId: userIds[0],
        userName: users[0].firstName + ' ' + users[0].lastName,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '16:00',
        endTime: '18:00',
        playerCount: 2,
        status: 'confirmed',
        notes: 'การจองทดสอบ'
      },
      {
        facilityId: facilityIds[1],
        facilityName: 'สนามฟุตบอล 2',
        sportTypeId: sportTypeIds[0],
        sportTypeName: 'ฟุตบอล',
        userId: userIds[2], // Use facility-staff user
        userName: users[2].firstName + ' ' + users[2].lastName,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        playerCount: 9,
        status: 'confirmed',
        notes: 'การจองทดสอบ'
      },
      {
        facilityId: facilityIds[7],
        facilityName: 'สนามวอลเลย์บอล',
        sportTypeId: sportTypeIds[3],
        sportTypeName: 'วอลเลย์บอล',
        userId: userIds[2],
        userName: users[2].firstName + ' ' + users[2].lastName,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        playerCount: 6,
        status: 'pending',
        notes: 'การจองทดสอบ'
      },
    ];

    let reservationIds = [];
    for (const reservation of reservations) {
      const result = await apiCall('POST', '/reservations', reservation);
      reservationIds.push(result.data._id);
      console.log(`  ✓ ${reservation.facilityName} - ${reservation.startTime}-${reservation.endTime}`);
    }

    // 4. Create Queues
    console.log('\n👥 กำลังสร้างคิว...');
    
    const queues = [
      {
        reservationId: reservationIds[0],
        facilityId: facilityIds[0],
        facilityName: 'สนามฟุตบอล 1',
        sportTypeName: 'ฟุตบอล',
        queueNumber: 1,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        requiredPlayers: 11,
        players: [
          {
            userId: '507f1f77bcf86cd799439011',
            firstName: 'Demo',
            lastName: 'User',
            studentId: 'STD001'
          }
        ],
        status: 'active'
      },
      {
        reservationId: reservationIds[1],
        facilityId: facilityIds[2],
        facilityName: 'สนามบาสเกตบอล A',
        sportTypeName: 'บาสเกตบอล',
        queueNumber: 1,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '16:00',
        requiredPlayers: 5,
        players: [
          {
            userId: '507f1f77bcf86cd799439011',
            firstName: 'Demo',
            lastName: 'User',
            studentId: 'STD001'
          }
        ],
        status: 'active'
      },
    ];

    for (const queue of queues) {
      const result = await apiCall('POST', '/queues/join', queue);
      console.log(`  ✓ ${queue.facilityName} - Queue ${queue.queueNumber}`);
    }

    // 5. Create Check-ins
    console.log('\n✅ กำลังสร้างการ Check-in...');
    
    const checkins = [
      {
        reservationId: reservationIds[0],
        facilityId: facilityIds[0],
        facilityName: 'สนามฟุตบอล 1',
        userId: '507f1f77bcf86cd799439011',
        userName: 'Demo User',
        checkInTime: new Date().toISOString(),
        status: 'checked-in'
      },
      {
        reservationId: reservationIds[2],
        facilityId: facilityIds[4],
        facilityName: 'คอร์ทแบดมินตัน 1',
        userId: '507f1f77bcf86cd799439011',
        userName: 'Demo User',
        checkInTime: new Date().toISOString(),
        status: 'checked-in'
      },
    ];

    for (const checkin of checkins) {
      const result = await apiCall('POST', '/checkins/checkin', checkin);
      console.log(`  ✓ ${checkin.facilityName}`);
    }

    console.log('\n✨ เสร็จสิ้นการสร้างข้อมูล!\n');
    console.log('📊 สรุป:');
    console.log(`  - ผู้ใช้งาน: ${users.length}`);
    console.log(`  - ชนิดกีฬา: ${sportTypes.length}`);
    console.log(`  - สนาม: ${facilities.length}`);
    console.log(`  - การจอง: ${reservations.length}`);
    console.log(`  - คิว: ${queues.length}`);
    console.log(`  - Check-in: ${checkins.length}`);
    console.log('\n💡 ข้อเสนอแนะ:');
    console.log('  - ไปที่ http://localhost:5173 เพื่อดูข้อมูลในหน้า Admin Dashboard');
    console.log('  - ลงชื่อเข้าใช้ด้วยข้อมูลผู้ใช้ดังนี้:');
    console.log('    1. User: studentId = 6630202414, password = user123');
    console.log('    2. Admin: studentId = 6611112222, password = admin123');
    console.log('    3. Staff: studentId = 6622223333, password = staff123');
    console.log('  - ลองทำการจองใหม่ผ่านระบบ');
    console.log('');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().catch(console.error);
