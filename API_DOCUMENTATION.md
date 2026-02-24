# 📚 API Documentation - Sports Facility Booking System

**Version:** 1.0.0  
**Base URL:** `http://localhost:3089/api`  
**Updated:** 22 มีนาคม 2026

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Bookings](#bookings)
4. [Queue Management](#queue-management)
5. [Facility Staff](#facility-staff)
6. [Admin](#admin)
7. [Error Responses](#error-responses)

---

## 🔐 Authentication

### POST /auth/register
ลงทะเบียนบัญชีผู้ใช้ใหม่

**Request:**
```json
{
  "username": "somchai",
  "email": "somchai@example.com",
  "password": "SecurePass123",
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "studentId": "6612345678",
  "phone": "081-234-5678",
  "faculty": "วิศวกรรมศาสตร์",
  "barcode": "1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "somchai",
    "email": "somchai@example.com",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "studentId": "6612345678",
    "role": "user"
  }
}
```

---

### POST /auth/login
เข้าสู่ระบบ

**Request:**
```json
{
  "username": "somchai",
  "password": "SecurePass123"
}
```
*Note: username สามารถเป็น username หรือ studentId ได้*

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "somchai",
    "email": "somchai@example.com",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "studentId": "6612345678",
    "barcode": "1234567890",
    "phone": "081-234-5678",
    "faculty": "วิศวกรรมศาสตร์",
    "role": "user",
    "isBanned": false,
    "noShowCount": 0
  }
}
```

---

### POST /auth/forgot-password
ขอลิงก์รีเซ็ตรหัสผ่าน

**Request:**
```json
{
  "email": "somchai@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email"
}
```

---

### POST /auth/reset-password
รีเซ็ตรหัสผ่าน

**Request:**
```json
{
  "email": "somchai@example.com",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

### POST /auth/change-password
เปลี่ยนรหัสผ่าน (ต้อง login)

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password has been changed successfully"
}
```

---

### GET /auth/me
ดูข้อมูล user ปัจจุบัน

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "somchai",
    "email": "somchai@example.com",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "studentId": "6612345678",
    "barcode": "1234567890",
    "phone": "081-234-5678",
    "faculty": "วิศวกรรมศาสตร์",
    "role": "user",
    "isBanned": false,
    "bannedUntil": null,
    "noShowCount": 0,
    "createdAt": "2026-03-22T10:00:00Z"
  }
}
```

---

### POST /auth/logout
ออกจากระบบ

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Profile

### GET /user/profile
ดูข้อมูลส่วนตัว

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": { /* User data */ }
}
```

---

### PUT /user/profile
อัพเดตข้อมูลส่วนตัว

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "phone": "081-234-5678",
  "faculty": "วิศวกรรมศาสตร์"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* Updated user data */ }
}
```

---

### GET /user/penalties
ดูปรับโทษของฉัน

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "noShowCount": 1,
  "totalPenalties": 500,
  "penalties": [
    {
      "id": "507f1f77bcf86cd799439011",
      "date": "2026-03-20",
      "startTime": "14:00",
      "facilityId": { "name": "สนามฟุตบอล 1", "location": "อาคาร A" },
      "status": "cancelled",
      "penaltyAmount": 500,
      "reason": "Late cancellation"
    }
  ]
}
```

---

### GET /user/stats
ดูสถิติของฉัน

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalBookings": 10,
    "completed": 8,
    "cancelled": 1,
    "noShow": 0,
    "checkedIn": 1,
    "pending": 0,
    "confirmed": 5,
    "noShowCount": 0,
    "isBanned": false,
    "bannedUntil": null
  }
}
```

---

## 📅 Bookings

### GET /sports
ดูประเภทกีฬาทั้งหมด

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "ฟุตบอล",
    "description": "Football sport",
    "icon": "⚽",
    "isActive": true
  }
]
```

---

### GET /facilities
ดูสนามกีฬา

**Query Parameters:**
- `sportId` (optional): กรองตามประเภทกีฬา

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "สนามฟุตบอล 1",
    "location": "อาคาร A",
    "maxCapacity": 22,
    "sportTypeId": { "name": "ฟุตบอล" },
    "status": "available",
    "description": "Professional football field"
  }
]
```

---

### GET /availability
ดูเวลาว่างของสนาม

**Query Parameters:**
- `facilityId` (required): ID ของสนาม
- `date` (required): วันที่ (YYYY-MM-DD)

**Response (200):**
```json
{
  "facility": { /* Facility data */ },
  "bookedSlots": [
    {
      "start": "08:00",
      "end": "10:00"
    }
  ]
}
```

---

### POST /reservations
จองสนาม

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "facilityId": "507f1f77bcf86cd799439011",
  "sportTypeId": "507f1f77bcf86cd799439012",
  "date": "2026-03-25",
  "startTime": "14:00",
  "endTime": "16:00",
  "playerCount": 10,
  "notes": "Some notes"
}
```

**Response (200):**
```json
{
  "success": true,
  "reservationNo": "RES-20260322-5678",
  "message": "Booking created successfully"
}
```

---

### GET /user/bookings
ดูประวัติการจองของฉัน

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): confirmed, cancelled, completed, etc.
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "bookings": [ /* Booking data */ ]
}
```

---

### GET /user/bookings/:reservationId
ดูรายละเอียดการจองเดียว

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "booking": { /* Booking details */ }
}
```

---

### POST /user/bookings/:reservationId/cancel
ยกเลิกการจอง

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reason": "Unable to attend"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": { /* Updated booking */ }
}
```

---

## 🚪 Queue Management

### GET /queue/reservations/:reservationId
ดูคิวของการจองเดียว

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "reservation": { /* Reservation data */ },
  "queue": [
    {
      "id": "507f1f77bcf86cd799439011",
      "position": 1,
      "status": "approved",
      "userId": { "firstName": "สมชาย", "lastName": "ใจดี" },
      "joinedAt": "2026-03-22T10:00:00Z",
      "approvedAt": "2026-03-22T10:05:00Z"
    }
  ],
  "totalApproved": 1,
  "totalWaiting": 2,
  "playerCount": 11
}
```

---

### POST /queue/join/:reservationId
เข้าร่วมคิว

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "playerName": "สมชาย ใจดี",
  "playerBarcode": "1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Joined queue successfully",
  "queueEntry": { /* Queue entry data */ },
  "position": 3
}
```

---

### GET /queue/my-queues
ดูคิวของฉัน

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "queues": [ /* Queue entries */ ]
}
```

---

### GET /queue/my-status/:reservationId
ดูสถานะคิวของฉัน

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "inQueue": true,
  "position": 2,
  "peopleAhead": 1,
  "queueEntry": { /* Queue entry data */ }
}
```

---

### POST /queue/cancel/:queueId
ยกเลิกการเข้าร่วมคิว

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cancelled queue entry",
  "queueEntry": { /* Updated queue entry */ }
}
```

---

## 🏢 Facility Staff

*Requires role: facility-staff or admin*

### GET /facility-staff/today-bookings
ดูการจองวันนี้

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `facilityId` (optional): กรองตามสนาม

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "bookings": [ /* Today's bookings */ ]
}
```

---

### GET /facility-staff/facility-status/:facilityId
ดูสถานะสนาม

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "facility": { /* Facility data */ },
  "status": "occupied",
  "currentBooking": { /* Current booking */ },
  "upcomingBookings": [ /* Upcoming bookings */ ]
}
```

---

### POST /facility-staff/check-in
Check-in ผู้ใช้

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reservationId": "507f1f77bcf86cd799439011",
  "barcode": "1234567890",
  "method": "barcode"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "checkIn": { /* Check-in data */ },
  "reservation": { /* Updated reservation */ }
}
```

---

### POST /facility-staff/mark-no-show/:reservationId
ทำเครื่องหมาย No-Show

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Marked as no-show",
  "reservation": { /* Updated reservation */ }
}
```

---

### POST /facility-staff/complete-booking/:reservationId
เสร็จสิ้นการจอง

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking completed",
  "reservation": { /* Updated reservation */ }
}
```

---

## ⚙️ Admin

*Requires role: admin*

### GET /admin/reservations
ดูการจองทั้งหมด

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): pending, confirmed, cancelled, etc.
- `date` (optional): YYYY-MM-DD

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "reservationNo": "RES-20260322-1234",
    "status": "confirmed",
    "userId": { "firstName": "สมชาย" },
    "facilityId": { "name": "สนามฟุตบอล 1" },
    "date": "2026-03-25",
    "startTime": "14:00"
  }
]
```

---

### POST /admin/cancel-reservation
ยกเลิกการจอง + ตั้งค่าปรับ

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "reservationId": "507f1f77bcf86cd799439011",
  "reason": "User request",
  "penaltyAmount": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cancelled successfully",
  "cancellation": { /* Cancellation data */ }
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Missing or invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🔑 Token Format

Token should be sent in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token contains:
- `_id`: User ID
- `username`: Username
- `role`: User role (user, facility-staff, admin)
- `studentId`: Student ID
- `iat`: Issued at
- `exp`: Expiration time (7 days)

---

## 📝 Status Values

### Reservation Status
- `pending` - รอการยืนยัน
- `confirmed` - ยืนยันแล้ว
- `checked-in` - Check-in แล้ว
- `completed` - เสร็จสิ้น
- `cancelled` - ยกเลิก
- `no-show` - ไม่มาแสดงตัว

### Queue Status
- `waiting` - รอการอนุมัติ
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธ
- `cancelled` - ยกเลิก

---

**Last Updated:** 22 มีนาคม 2026  
**Maintainer:** Development Team
