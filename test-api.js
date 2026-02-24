#!/usr/bin/env node

/**
 * Quick API Test Script
 * Tests all endpoints without needing Postman
 */

const http = require('http');

const BASE_URL = 'http://localhost:3089/api';

// Test data
const testData = {
  user: {
    username: 'testuser123',
    email: 'testuser@test.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '0812345678',
    role: 'user',
    studentId: '6501999',
    barcode: '6501999',
    faculty: 'Testing'
  },
  sportType: {
    name: 'Test Sport',
    description: 'Test Sport Description'
  },
  facility: {
    name: 'Test Facility',
    location: 'Test Location',
    maxCapacity: 20,
    pricePerHour: 100
  }
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(`✅ Health: ${health.status === 200 ? 'OK' : 'FAILED'}\n`);

    // Test 2: Get All Users
    console.log('2️⃣ Testing GET /users...');
    const users = await makeRequest('GET', '/users');
    console.log(`✅ Get Users: ${users.status === 200 ? 'OK' : 'FAILED'}`);
    console.log(`   Count: ${users.data.count || 'N/A'}\n`);

    // Test 3: Create User
    console.log('3️⃣ Testing POST /users (Create)...');
    const createUser = await makeRequest('POST', '/users', testData.user);
    console.log(`✅ Create User: ${createUser.status === 201 ? 'OK' : 'FAILED'}`);
    const userId = createUser.data.data?._id;
    console.log(`   User ID: ${userId || 'N/A'}\n`);

    // Test 4: Get Sport Types
    console.log('4️⃣ Testing GET /sport-types...');
    const sportTypes = await makeRequest('GET', '/sport-types');
    console.log(`✅ Get Sport Types: ${sportTypes.status === 200 ? 'OK' : 'FAILED'}`);
    console.log(`   Count: ${sportTypes.data.count || 'N/A'}\n`);

    // Test 5: Create Sport Type
    console.log('5️⃣ Testing POST /sport-types (Create)...');
    const createSportType = await makeRequest('POST', '/sport-types', testData.sportType);
    console.log(`✅ Create Sport Type: ${createSportType.status === 201 ? 'OK' : 'FAILED'}`);
    const sportTypeId = createSportType.data.data?._id;
    console.log(`   Sport Type ID: ${sportTypeId || 'N/A'}\n`);

    // Test 6: Get Facilities
    console.log('6️⃣ Testing GET /facilities...');
    const facilities = await makeRequest('GET', '/facilities');
    console.log(`✅ Get Facilities: ${facilities.status === 200 ? 'OK' : 'FAILED'}`);
    console.log(`   Count: ${facilities.data.count || 'N/A'}\n`);

    // Test 7: Create Facility
    if (sportTypeId) {
      console.log('7️⃣ Testing POST /facilities (Create)...');
      const facilityData = { ...testData.facility, sportTypeId };
      const createFacility = await makeRequest('POST', '/facilities', facilityData);
      console.log(`✅ Create Facility: ${createFacility.status === 201 ? 'OK' : 'FAILED'}`);
      const facilityId = createFacility.data.data?._id;
      console.log(`   Facility ID: ${facilityId || 'N/A'}\n`);

      // Test 8: Create Reservation
      if (userId && facilityId) {
        console.log('8️⃣ Testing POST /reservations (Create)...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const reservationData = {
          userId,
          facilityId,
          sportTypeId,
          date: tomorrow.toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '16:00',
          playerCount: 10
        };
        const createReservation = await makeRequest('POST', '/reservations', reservationData);
        console.log(`✅ Create Reservation: ${createReservation.status === 201 ? 'OK' : 'FAILED'}`);
        const reservationId = createReservation.data.data?._id;
        console.log(`   Reservation ID: ${reservationId || 'N/A'}\n`);

        // Test 9: Get Reservations
        console.log('9️⃣ Testing GET /reservations...');
        const allReservations = await makeRequest('GET', '/reservations');
        console.log(`✅ Get Reservations: ${allReservations.status === 200 ? 'OK' : 'FAILED'}`);
        console.log(`   Count: ${allReservations.data.count || 'N/A'}\n`);
      }
    }

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('\n⚠️ Make sure the server is running on http://localhost:3089');
  }
}

// Run tests
runTests();
