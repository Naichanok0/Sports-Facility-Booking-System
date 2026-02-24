// scripts/create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const logger = require('../src/logger');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5
    });
    logger.info('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      logger.warn('⚠️ Admin account already exists');
      console.log('Existing Admin:', existingAdmin);
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@university.ac.th',
      passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบ',
      phone: '081-000-0000',
      role: 'admin',
      studentId: '6600000001',
      barcode: '00000000000001',
      faculty: 'กองกีฬา',
      isActive: true,
      noShowCount: 0,
      isBanned: false
    };

    const admin = new User(adminData);
    const savedAdmin = await admin.save();

    const response = savedAdmin.toObject();
    delete response.passwordHash;

    logger.info('✅ Admin account created successfully');
    console.log('\n========== ADMIN ACCOUNT CREATED ==========');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@university.ac.th');
    console.log('Role: admin');
    console.log('==========================================\n');
    console.log('Data:', response);

    await mongoose.connection.close();
  } catch (error) {
    logger.error('❌ Error creating admin:', error);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
