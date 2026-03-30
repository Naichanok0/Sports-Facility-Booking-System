# ระบบ Waiting Room - คู่มือการใช้งาน

## 📋 ภาพรวม

ระบบ Waiting Room ช่วยให้ผู้ใช้สามารถ:
1. **สร้างการจอง** - ผู้จองเป็น host และสร้างห้องรอในระบบ
2. **รับรหัสจอง** - ได้รับรหัสห้องรอพร้อม countdown 10 นาที
3. **เชิญเพื่อน** - แชร์รหัสจองให้เพื่อนเข้าร่วม
4. **รอกลุ่มลูก** - เมื่อครบจำนวนคน → ข้อมูลจะถูกบันทึกเข้า reservations table

---

## 🔄 ขั้นตอนการทำงาน

### Step 1: สร้างการจอง (BookingPage)
```
ผู้ใช้เลือก:
├─ วันที่
├─ ประเภทกีฬา
├─ สนาม
└─ เวลา

    ↓ กดปุ่ม "สร้างการจอง"
    
    ✓ เรียก API: POST /api/waiting-rooms
    ✓ ข้อมูลเข้า Collection: waitingrooms
    ✓ สร้าง roomCode (เช่น WR123456789)
    ✓ ผู้จองเป็น host และผู้เล่นคนแรก
```

### Step 2: ห้องรอ (BookingWaitingRoom) - Countdown 10 นาที
```
หน้าแสดง:
├─ รหัสจอง (สามารถคัดลอก/แชร์)
├─ รายละเอียดการจอง (สนาม, วันที่, เวลา)
├─ รายชื่อผู้เล่น (ตัวเลขแสดงความคืบหน้า)
└─ นับถอยหลัง 10 นาที ⏱️

ฟังก์ชัน:
├─ แชร์รหัสจอง → เพื่อนค้นหาจอง (ส่วนที่ 3)
├─ เพิ่มผู้เล่น (Demo) → เพิ่มรายชื่อสำหรับทดสอบ
└─ อัตโนมัติยืนยัน → เมื่อครบ requiredPlayers คน
```

### Step 3: หน้าค้นหาและเข้าร่วมจอง (Join Waiting Room)
```
สมาชิกคนอื่นสามารถ:
├─ ค้นหารหัสจอง หรือ
├─ ดูรายชื่อห้องรอเปิดอยู่
└─ กดปุ่ม "เข้าร่วม"

    ↓ กรอกข้อมูล (ชื่อ, นามสกุล, บาร์โค้ด)
    
    ✓ เรียก API: POST /api/waiting-rooms/:id/join
    ✓ เพิ่มผู้เล่นลงใน players array
    ✓ อัปเดตสถานะห้อง (open/full)
```

### Step 4: ปิดห้องและสร้าง Reservation
```
เมื่อครบจำนวนผู้เล่น:

    ✓ โปรแกรมแสดง Dialog ยืนยัน
    ✓ เรียก API: POST /api/waiting-rooms/:id/close-and-reserve
    
    ↓ Backend ทำ:
    ├─ หยุด countdown
    ├─ เปลี่ยนสถานะ waitingroom → completed
    ├─ สร้าง Reservation ใหม่
    │  └─ userId: host
    │  └─ facilityId, sportTypeId จากห้องรอ
    │  └─ date, startTime, endTime
    │  └─ playerCount, players[] ทั้งหมด
    └─ บันทึกรหัส reservationId ลง waitingroom
    
    ✓ แสดง Success Toast
    ✓ ปิดหน้า Waiting Room
```

---

## 🗄️ Database Schema

### Collection: `waitingrooms`
```javascript
{
  _id: ObjectId,
  roomCode: String (unique),           // เช่น "WR123456789"
  host: ObjectId (ref: User),          // ผู้จองที่ 1
  facilityId: ObjectId (ref: Facility),
  sportTypeId: ObjectId (ref: SportType),
  
  // Booking Details
  date: Date,
  startTime: String,                   // "18:00"
  endTime: String,                     // "20:00"
  maxPlayers: Number,                  // เช่น 4
  
  // Players
  players: [{
    userId: ObjectId (ref: User),
    firstName: String,
    lastName: String,
    studentId: String,
    joinedAt: Date
  }],
  
  // Status
  status: String,                      // 'open'|'full'|'closed'|'cancelled'|'completed'
  notes: String,
  
  // Expiry
  expiresAt: Date,                     // TTL 10 นาที (อัตโนมัติลบเมื่อหมดเวลา)
  
  // Link to created reservation
  reservationId: ObjectId (ref: Reservation),
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

### Collection: `reservations` (บันทึกจากห้องรอ)
```javascript
{
  _id: ObjectId,
  reservationNo: String (unique),      // "RES123456789"
  userId: ObjectId (ref: User),        // host
  facilityId: ObjectId (ref: Facility),
  sportTypeId: ObjectId (ref: SportType),
  
  date: Date,
  startTime: String,
  endTime: String,
  durationHours: Number,
  playerCount: Number,                 // จำนวนผู้เล่นทั้งหมด
  
  status: String,                      // 'confirmed', 'checked-in', 'completed', 'cancelled'
  
  players: [{
    userId: ObjectId,
    firstName: String,
    lastName: String,
    studentId: String,
    joinedAt: Date
  }],
  
  notes: String
}
```

---

## 🔌 API Endpoints

### Waiting Room API

| Method | Endpoint | ฟังก์ชัน |
|--------|----------|---------|
| **POST** | `/api/waiting-rooms` | สร้างห้องรอ |
| **GET** | `/api/waiting-rooms` | ดูห้องรอเปิดอยู่ |
| **GET** | `/api/waiting-rooms/:idOrCode` | ดูรายละเอียดห้องรอ |
| **POST** | `/api/waiting-rooms/:id/join` | เข้าร่วมห้องรอ |
| **POST** | `/api/waiting-rooms/:id/leave` | ออกจากห้องรอ |
| **POST** | `/api/waiting-rooms/:id/close-and-reserve` | ปิดห้องและสร้าง reservation |
| **POST** | `/api/waiting-rooms/:id/cancel` | ยกเลิกห้องรอ |

### Request/Response Examples

#### 1. สร้างห้องรอ
```bash
POST /api/waiting-rooms
{
  "host": "60a7f2c9e3b1f9a1d2e6b3a4",
  "facilityId": "60a7f2c9e3b1f9a1d2e6b3a5",
  "sportTypeId": "60a7f2c9e3b1f9a1d2e6b3a6",
  "date": "2026-04-01",
  "startTime": "18:00",
  "endTime": "20:00",
  "maxPlayers": 4,
  "name": "บอลชายหาด"
}

Response:
{
  "success": true,
  "message": "Waiting room created successfully",
  "data": {
    "_id": "...",
    "roomCode": "WR123456789",
    "host": {...},
    "players": [...],
    "status": "open",
    "expiresAt": "2026-04-01T18:10:00Z"
  }
}
```

#### 2. เข้าร่วมห้องรอ
```bash
POST /api/waiting-rooms/60a7f2c9e3b1f9a1d2e6b3a4/join
{
  "userId": "60a7f2c9e3b1f9a1d2e6b3b0"
}

Response:
{
  "success": true,
  "message": "Joined waiting room successfully",
  "data": {
    "roomCode": "WR123456789",
    "players": [
      { "userId": "...", "firstName": "..." },
      { "userId": "60a7f2c9e3b1f9a1d2e6b3b0", "firstName": "..." }
    ],
    "status": "open"
  }
}
```

#### 3. ปิดห้องและสร้าง Reservation
```bash
POST /api/waiting-rooms/60a7f2c9e3b1f9a1d2e6b3a4/close-and-reserve

Response:
{
  "success": true,
  "message": "Waiting room closed and reservation created successfully",
  "data": {
    "waitingRoom": {
      "status": "completed",
      "reservationId": "..."
    },
    "reservation": {
      "_id": "...",
      "reservationNo": "RES123456789",
      "playerCount": 4,
      "players": [...]
    }
  }
}
```

---

## 🎯 Frontend Components

### 1. **BookingPage.tsx**
- ผู้ใช้เลือก วันที่ > ประเภท > สนาม > เวลา
- กดสร้างการจอง → เรียก `waitingRoomAPI.create()`
- แสดง `BookingWaitingRoom` component

### 2. **BookingWaitingRoom.tsx** 
- แสดงห้องรอ + countdown 10 นาที
- ปุ่มแชร์รหัสจอง
- เพิ่มผู้เล่น (ตอนนี้เป็น demo, เดี๋ยวเปลี่ยนเป็น API)
- เมื่อครบ → เรียก `waitingRoomAPI.closeAndReserve()`

### 3. **JoinWaitingRoomPage.tsx** (ที่จะสร้าง)
- ค้นหารหัสจอง / ดูห้องเปิด
- เข้าร่วม → เรียก `waitingRoomAPI.join()`
- ดูรายชื่อผู้เล่นแบบ real-time

---

## 🧪 Testing

### Postman Collection
ใช้ request ตามที่อยู่ในไฟล์ `Postman_Collection.json`

### Manual Testing
```bash
# 1. สร้างห้องรอ
POST http://localhost:3089/api/waiting-rooms
Body: { host: "...", facilityId: "...", ... }

# 2. ดูห้องรอ
GET http://localhost:3089/api/waiting-rooms?status=open

# 3. เข้าร่วม
POST http://localhost:3089/api/waiting-rooms/{roomId}/join
Body: { userId: "..." }

# 4. ปิดห้อง
POST http://localhost:3089/api/waiting-rooms/{roomId}/close-and-reserve
```

---

## ⚙️ Config ที่สำคัญ

### Waiting Room Expiry
```javascript
// server.js MongoDB
// TTL Index ใน waitingrooms collection
expiresAt: Date (default: Date.now() + 10 minutes)

// MongoDB จะอัตโนมัติลบ document ที่ expiresAt < now
```

### Max Players Validation
```javascript
// Backend auto-checks
if (room.players.length >= room.maxPlayers) {
  room.status = 'full';
}
```

---

## ❓ FAQ

**Q1: ถ้าหมดเวลา 10 นาทีแล้วยังไม่ครบคน จะเกิดอะไร?**
> MongoDB TTL index จะอัตโนมัติลบ document ใน waitingrooms collection
> Frontend countdown หมด → เรียก `onExpired()` → ปิดหน้า Waiting Room

**Q2: สามารถยกเลิกห้องรอได้หรือ?**
> ได้ - เรียก `POST /api/waiting-rooms/:id/cancel` เปลี่ยนสถานะเป็น 'cancelled'

**Q3: ถ้า host ออกจากห้อง จะเกิดอะไร?**
> Backend ตรวจสอบ - ถ้า players.length === 0 → เปลี่ยนสถานะเป็น 'closed'

**Q4: เมื่อสร้าง Reservation จาก Waiting Room ผู้ใช้ที่ join ต้องกด confirm หรือเปล่า?**
> ไม่ต้อง - ระบบอัตโนมัติสร้าง Reservation เมื่อครบจำนวนคน host ยืนยันเพียงครั้งเดียว

---

## 📝 Notes

- ⏱️ TTL expiration สำหรับ `expiresAt` = 10 นาที
- 🔄 Players array ถูกเพิ่มลง reservation ทั้งหมด
- ✅ Status flow: `open` → `full` → `completed` หรือ `cancelled`
- 🎫 ReservationNo ถูกสร้างแบบ random `RES${timestamp}${random}`

