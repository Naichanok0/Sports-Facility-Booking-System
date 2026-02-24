# 🎯 Quick Reference Guide

**Sports Facility Booking System - Backend & Frontend Integration**

---

## 📁 File Structure

```
src/
├── models/
│   ├── User.js ✅ UPDATED
│   ├── Reservation.js ✅ UPDATED
│   ├── CheckIn.js ✅ NEW
│   ├── Queue.js ✅ NEW
│   ├── Facility.js
│   ├── SportType.js
│   └── Cancellation.js
├── authRoutes.js ✅ UPDATED (7 endpoints)
├── userRoutes.js ✅ NEW (7 endpoints)
├── facilityStaffRoutes.js ✅ NEW (6 endpoints)
├── queueRoutes.js ✅ NEW (8 endpoints)
├── routes.js (existing)
├── admin.js (existing)
├── auth.js ✅ UPDATED
├── db.js
└── logger.js

server.js ✅ UPDATED (added new routes)

Documentation/
├── ANALYSIS_AND_IMPROVEMENTS.md ✅
├── API_DOCUMENTATION.md ✅
├── IMPLEMENTATION_GUIDE.md ✅
├── BACKEND_IMPROVEMENTS_SUMMARY.md ✅
└── QUICK_REFERENCE.md (this file)
```

---

## 🔌 API Endpoints Quick Reference

### 🔐 Auth (`/api/auth`)
```
POST /register           - สมัครสมาชิก
POST /login              - เข้าสู่ระบบ
POST /forgot-password    - ลืมรหัสผ่าน
POST /reset-password     - รีเซ็ตรหัสผ่าน
POST /change-password    - เปลี่ยนรหัสผ่าน
GET  /me                 - ดูข้อมูลปัจจุบัน
POST /logout             - ออกจากระบบ
```

### 👤 User (`/api/user`)
```
GET  /profile            - ดูข้อมูลส่วนตัว
PUT  /profile            - อัพเดตข้อมูล
GET  /penalties          - ดูปรับโทษ
GET  /bookings           - ดูประวัติการจอง
GET  /bookings/:id       - ดูรายละเอียดการจอง
POST /bookings/:id/cancel - ยกเลิกการจอง
GET  /stats              - ดูสถิติ
```

### 📅 Booking (`/api`)
```
GET  /sports             - ดูประเภทกีฬา
GET  /facilities         - ดูสนาม
GET  /availability       - ดูเวลาว่าง
POST /reservations       - จองสนาม
GET  /my/reservations    - ดูการจองของฉัน
DELETE /reservations/:id - ยกเลิกการจอง
```

### 🚪 Queue (`/api/queue`)
```
GET  /reservations/:id   - ดูคิว
POST /join/:id           - เข้าร่วมคิว
GET  /my-queues          - ดูคิวของฉัน
GET  /my-status/:id      - ดูสถานะของฉัน
POST /cancel/:queueId    - ยกเลิกคิว
POST /approve/:queueId   - อนุมัติ (staff/admin)
POST /reject/:queueId    - ปฏิเสธ (staff/admin)
GET  /stats              - สถิติ (admin)
```

### 🏢 Facility Staff (`/api/facility-staff`)
```
GET  /today-bookings           - ดูการจองวันนี้
GET  /facility-status/:id      - ดูสถานะสนาม
POST /check-in                 - Check-in
GET  /check-ins                - ดูการ check-in
POST /mark-no-show/:id         - Mark no-show
POST /complete-booking/:id     - เสร็จสิ้นการจอง
```

### ⚙️ Admin (`/api/admin`)
```
GET  /reservations             - ดูการจองทั้งหมด
POST /cancel-reservation       - ยกเลิกการจอง
POST /facilities               - สร้างสนาม
GET  /facilities               - ดูสนามทั้งหมด
... (existing endpoints)
```

---

## 🎭 User Roles & Permissions

| Feature | User | Staff | Admin |
|---------|------|-------|-------|
| View Sports | ✅ | ✅ | ✅ |
| View Facilities | ✅ | ✅ | ✅ |
| Book Facility | ✅ | ✅ | ✅ |
| View Own Bookings | ✅ | ✅ | ✅ |
| Cancel Own Booking | ✅ | ✅ | ✅ |
| Join Queue | ✅ | ✅ | ✅ |
| Check-in | ❌ | ✅ | ✅ |
| Mark No-Show | ❌ | ✅ | ✅ |
| View All Bookings | ❌ | ❌ | ✅ |
| Manage Facilities | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## 💾 Database Schemas at a Glance

### User
```javascript
{
  username: String,
  email: String,
  passwordHash: String,
  firstName: String,
  lastName: String,
  studentId: String,
  barcode: String,
  phone: String,
  faculty: String,
  role: 'user' | 'facility-staff' | 'admin',
  isBanned: Boolean,
  bannedUntil: Date,
  noShowCount: Number
}
```

### Reservation
```javascript
{
  reservationNo: String,
  userId: ObjectId,
  facilityId: ObjectId,
  sportTypeId: ObjectId,
  date: Date,
  startTime: String,
  endTime: String,
  playerCount: Number,
  status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show',
  checkInTime: Date,
  checkInMethod: 'barcode' | 'manual' | 'qr-code',
  checkedInBy: ObjectId,
  penaltyAmount: Number
}
```

### Queue
```javascript
{
  reservationId: ObjectId,
  userId: ObjectId,
  facilityId: ObjectId,
  position: Number,
  status: 'waiting' | 'approved' | 'rejected' | 'cancelled',
  joinedAt: Date,
  approvedAt: Date
}
```

### CheckIn
```javascript
{
  reservationId: ObjectId,
  userId: ObjectId,
  facilityId: ObjectId,
  checkInTime: Date,
  method: 'barcode' | 'manual' | 'qr-code',
  checkedInBy: ObjectId
}
```

---

## 🚀 Quick Start

### 1. Setup Backend
```bash
# Install dependencies
npm install

# Setup .env
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb://localhost:27017/sports-facility
PORT=3089

# Start server
npm start
```

### 2. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
VITE_API_URL=http://localhost:3089/api

# Start dev server
npm run dev
```

### 3. Create Initial Data
```bash
# Login as admin (from mock data in LoginPage)
# Then use admin endpoints to create:
# - Sports types
# - Facilities
# - Users
```

---

## 🔑 Authentication Flow

```
1. User submits login form
   ↓
2. POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Returns JWT token + user data
   ↓
5. Frontend stores token in localStorage
   ↓
6. All subsequent requests include:
   Authorization: Bearer {token}
   ↓
7. Backend middleware (authRequired) verifies token
   ↓
8. Request proceeds or returns 401
```

### Token Structure
```javascript
{
  _id: "user_id",
  username: "somchai",
  role: "user",
  studentId: "6612345678",
  iat: 1679536800,
  exp: 1680141600
}
```

---

## 📊 Status Values

### Reservation Status
| Status | Meaning |
|--------|---------|
| pending | รอการยืนยัน |
| confirmed | ยืนยันแล้ว |
| checked-in | Check-in แล้ว |
| completed | เสร็จสิ้น |
| cancelled | ยกเลิก |
| no-show | ไม่มาแสดงตัว |

### Queue Status
| Status | Meaning |
|--------|---------|
| waiting | รอการอนุมัติ |
| approved | อนุมัติแล้ว |
| rejected | ปฏิเสธ |
| cancelled | ยกเลิก |

---

## 🧪 Testing with Curl

### Login
```bash
curl -X POST http://localhost:3089/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"somchai","password":"admin123"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3089/api/user/profile \
  -H "Authorization: Bearer {token}"
```

### Create Booking
```bash
curl -X POST http://localhost:3089/api/reservations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId":"...",
    "sportTypeId":"...",
    "date":"2026-03-25",
    "startTime":"14:00",
    "endTime":"16:00",
    "playerCount":10
  }'
```

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Check token in localStorage |
| 403 Forbidden | Insufficient permissions | Check user role |
| 404 Not Found | Wrong endpoint | Check API documentation |
| 500 Server Error | Backend crash | Check backend logs |
| CORS Error | Frontend URL not allowed | Check server CORS config |
| Cannot connect | Backend not running | Start server: `npm start` |

---

## 📱 Frontend Component - API Mapping

```
LoginPage
└── POST /auth/login

RegisterPage
└── POST /auth/register

ProfilePage
├── GET /user/profile
├── PUT /user/profile
├── POST /auth/change-password
└── GET /user/stats

BookingPage
├── GET /sports
├── GET /facilities
├── GET /availability
└── POST /reservations

BookingHistory
└── GET /user/bookings

BookingWaitingRoom
├── GET /queue/reservations/:id
├── POST /queue/join/:id
└── GET /queue/my-status/:id

CheckInManagement
├── POST /facility-staff/check-in
├── GET /facility-staff/today-bookings
└── POST /facility-staff/mark-no-show/:id

BookingMonitor (Admin)
├── GET /admin/reservations
└── POST /admin/cancel-reservation

UserPenalties (Admin)
└── GET /user/penalties
```

---

## 📈 Performance Tips

1. **Use Query Parameters for Filtering**
   ```
   GET /user/bookings?status=confirmed&startDate=2026-03-01
   ```

2. **Pagination** (when implemented)
   ```
   GET /admin/reservations?page=1&limit=20
   ```

3. **Index Usage**
   - All frequently queried fields have indexes
   - Check MongoDB for index usage

4. **Caching**
   - Sports & Facilities can be cached (change rarely)
   - User bookings should be fetched fresh

---

## 🔐 Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT token based auth
- ✅ Role-based access control
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ⏳ Input validation (TODO)
- ⏳ Email verification (TODO)

---

## 📞 Troubleshooting

### Backend won't start
```bash
# Check node version (requires v14+)
node --version

# Check port is free
netstat -an | findstr :3089

# Check MongoDB connection
# Set MONGODB_URI correctly in .env
```

### Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:3089/health

# Check CORS is enabled
# Check VITE_API_URL is correct
```

### Database connection failed
```bash
# Check MongoDB is running
# Check MONGODB_URI format
# Check credentials if using auth
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| API_DOCUMENTATION.md | Complete API reference |
| IMPLEMENTATION_GUIDE.md | Step-by-step integration guide |
| ANALYSIS_AND_IMPROVEMENTS.md | Problem analysis & solutions |
| BACKEND_IMPROVEMENTS_SUMMARY.md | What was changed & why |
| QUICK_REFERENCE.md | This file |

---

## ✨ Summary

**Backend Status:** ✅ Complete  
**Total APIs:** 33 endpoints  
**Models:** 7 fully configured  
**Frontend Ready:** Yes, all APIs available  
**Estimated Integration:** 1-2 weeks  

Ready to integrate frontend with backend! 🚀

---

**Last Updated:** 22 มีนาคม 2026  
**Version:** 1.0.0
