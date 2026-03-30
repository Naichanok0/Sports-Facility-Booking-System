# ✅ Waiting Room System - การดำเนินการเสร็จสิ้น

## 📦 ส่วนประกอบที่สร้างเสร็จ

### 1. **Backend - Models & APIs**

#### ✅ `src/models/WaitingRoom.js`
- Schema สำหรับห้องรอ (waitingrooms collection)
- TTL Index - ลบอัตโนมัติหลัง 10 นาที
- Virtual fields: `currentPlayers`, `availableSlots`
- Pre-save hook สำหรับสร้าง `roomCode` และ update status

#### ✅ `src/api/waitingRoomApi.js`
7 endpoints หลัก:
1. `POST /api/waiting-rooms` - สร้างห้องรอ
2. `GET /api/waiting-rooms` - ดูห้องรอ (กรองตามสถานะ, สนาม, วันที่)
3. `GET /api/waiting-rooms/:idOrCode` - ดูรายละเอียดห้อง
4. `POST /api/waiting-rooms/:id/join` - เข้าร่วมห้อง
5. `POST /api/waiting-rooms/:id/leave` - ออกจากห้อง
6. `POST /api/waiting-rooms/:id/close-and-reserve` - ปิดห้องและสร้าง Reservation
7. `POST /api/waiting-rooms/:id/cancel` - ยกเลิกห้อง

#### ✅ `server.js`
- เพิ่ม route: `app.use('/api/waiting-rooms', require('./src/api/waitingRoomApi'));`

### 2. **Frontend - Components & Services**

#### ✅ `frontend/src/services/api.ts`
```typescript
export const waitingRoomAPI = {
  create(data),          // สร้างห้องรอ
  getAll(query),         // ดูห้องรอเปิด
  getById(idOrCode),     // ดูห้องตามรหัสหรือ ID
  join(id, userId),      // เข้าร่วม
  leave(id, userId),     // ออกจาก
  closeAndReserve(id),   // ปิดและสร้าง reservation
  cancel(id)             // ยกเลิก
}
```

#### ✅ `frontend/src/app/components/user/BookingPage.tsx`
- ผู้ใช้เลือก วันที่ > ประเภท > สนาม > เวลา
- กดปุ่ม "สร้างการจอง" → เรียก `waitingRoomAPI.create()`
- แสดง `<BookingWaitingRoom>` component

#### ✅ `frontend/src/app/components/user/BookingWaitingRoom.tsx`
- Countdown 10 นาที ⏱️
- แสดงรหัสจอง + ปุ่มแชร์ (Copy/Share)
- รายชื่อผู้เล่น (progress bar)
- เมื่อครบจำนวน → เรียก `waitingRoomAPI.closeAndReserve()`
- ข้อมูลทั้งหมดเข้า `reservations` table

#### ✅ `frontend/src/app/components/user/JoinWaitingRoomPage.tsx` (NEW)
- ค้นหารหัสจอง (input + search button)
- แสดงรายชื่อห้องเปิด (live list + refresh ทุก 5 วินาที)
- แสดงห้องเต็มแล้ว (gray out)
- เข้าร่วม → เรียก `waitingRoomAPI.join()`
- หลังเข้าร่วม → แสดง `<BookingWaitingRoom>` (isJoining=true)

### 3. **Database**

#### Collections Created
- **waitingrooms** - ห้องรอที่สร้างจากการจอง
- **reservations** - การจองสิ้นสุดที่บันทึกจากห้องรอ

#### TTL Configuration
- `expiresAt` field ใน waitingrooms
- MongoDB อัตโนมัติลบ document เมื่อหมดเวลา

---

## 🔄 Workflow - ขั้นตอนการทำงาน

### Case 1: ผู้จองสร้างการจอง (Host)

```
[BookingPage]
   ↓ เลือก วันที่ + สนาม + เวลา
   ↓ กด "สร้างการจอง"
   ↓ API: POST /api/waiting-rooms
   ↓ Backend สร้าง document ใน waitingrooms + ผู้จองเป็น player แรก
   ↓
[BookingWaitingRoom] - ภาพสด
   - นับถอยหลัง 10 นาที ⏱️
   - รหัสจอง WR123456789
   - รายชื่อผู้เล่น (1/4)
   - ปุ่มแชร์ + เพิ่มผู้เล่น(demo)
   ↓ โอน URL/รหัส ให้เพื่อน
   ↓ เพื่อนค้นหา + เข้าร่วม
   ↓ เมื่อครบ → ยืนยันอัตโนมัติ
   ↓
[API: POST /api/waiting-rooms/:id/close-and-reserve]
   - waitingroom status = 'completed'
   - สร้าง reservation ใหม่ (userId=host, players=[...])
   - บันทึก reservationId ลง waitingroom
   ↓
[Success Toast] "ยืนยันการจองสำเร็จ!"
   ↓ ปิดหน้า Waiting Room
   ↓ กลับไป Dashboard
```

### Case 2: สมาชิกอื่นเข้าร่วม (Guest)

```
[JoinWaitingRoomPage]
   ↓ ใส่รหัสจอง หรือเลือกจากรายชื่อเปิด
   ↓ API: GET /api/waiting-rooms/:roomCode
   ↓ แสดง dialog ยืนยัน
   ↓ กด "เข้าร่วม"
   ↓ API: POST /api/waiting-rooms/:id/join (userId=current)
   ↓ Backend: เพิ่ม user ลง players array
   ↓
[BookingWaitingRoom] - isJoining=true
   - นับถอยหลัง (ร่วมกับ host)
   - รายชื่อผู้เล่น (2/4)
   - ไม่ปุ่มแชร์ (เพื่อไม่ส่งออก)
   - ดูผู้เล่นเพิ่มเติม
   ↓ รอให้ครบ 4 คน
   ↓ Host ยืนยัน → ข้อมูลเข้า reservations
   ↓ เพื่อนดำเนินการต่อตามปกติ
```

---

## 🎯 Key Features

| Feature | Status | ไฟล์ |
|---------|--------|------|
| สร้างห้องรอ | ✅ | BookingPage.tsx |
| Countdown 10 นาที | ✅ | BookingWaitingRoom.tsx |
| รหัสจอง + Copy/Share | ✅ | BookingWaitingRoom.tsx |
| รายชื่อผู้เล่น + Progress | ✅ | BookingWaitingRoom.tsx |
| ค้นหารหัสจอง | ✅ | JoinWaitingRoomPage.tsx |
| ดูห้องเปิด (live list) | ✅ | JoinWaitingRoomPage.tsx |
| เข้าร่วมห้อง | ✅ | JoinWaitingRoomPage.tsx |
| ปิดห้อง + สร้าง Reservation | ✅ | waitingRoomApi.js |
| TTL 10 นาที (auto delete) | ✅ | WaitingRoom.js |
| Auto-confirm เมื่อครบ | ✅ | BookingWaitingRoom.tsx |

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│  BookingPage│ เลือกวันที่/สนาม/เวลา
└──────┬──────┘
       │
       └──→ POST /api/waiting-rooms
            │
            ↓
       ┌──────────────────┐
       │  WaitingRoom Doc │
       ├──────────────────┤
       │ roomCode: WR123  │
       │ host: user1      │ ← ผู้จอง
       │ players: [user1] │
       │ maxPlayers: 4    │
       │ expiresAt: +10m  │
       │ status: 'open'   │
       └──────┬───────────┘
              │
              ├─→ Share/Copy to Friends
              │
              └─→ GET /api/waiting-rooms (list open rooms)
                  │
                  ↓
           ┌────────────────────┐
           │ JoinWaitingRoomPage│ ← User2, User3 เห็นห้อง
           └────┬───────────────┘
                │
                └──→ POST .../join (user2)
                     POST .../join (user3)
                     POST .../join (user4)
                │
                ↓
           ┌──────────────────────┐
           │  Players = [1,2,3,4] │
           │  Status = 'full'     │
           └────┬─────────────────┘
                │
                └──→ POST .../close-and-reserve
                     │
                     ├─ waitingroom.status = 'completed'
                     ├─ Create Reservation
                     │  ├─ userId: host
                     │  ├─ players: [user1,2,3,4]
                     │  ├─ facilityId, sportTypeId
                     │  └─ date, startTime, endTime
                     │
                     └─ Success! → /reservations
```

---

## 🧪 Testing Checklist

### Manual Tests
- [ ] สร้างการจองได้ (BookingPage)
- [ ] รหัสจองถูกสร้าง (WR...)
- [ ] Countdown นับถอยหลัง 10 นาที
- [ ] Copy รหัสจองได้
- [ ] Share ข้อความได้
- [ ] ดูห้องเปิดในรายชื่อ
- [ ] ค้นหารหัสจองได้
- [ ] เข้าร่วมห้องสำเร็จ
- [ ] เมื่อครบ → Dialog ยืนยัน
- [ ] หลังยืนยัน → Reservation ถูกสร้าง
- [ ] Reservation มีผู้เล่นทั้งหมด 4 คน

### API Tests (Postman)
```
POST /api/waiting-rooms
├─ status: 201
└─ data.roomCode: "WR..."

GET /api/waiting-rooms?status=open
├─ status: 200
└─ data: [{ roomCode, players, ... }]

POST /api/waiting-rooms/:id/join
├─ status: 200
└─ data.players.length: 2

POST /api/waiting-rooms/:id/close-and-reserve
├─ status: 200
└─ data.reservation.playerCount: 4
```

### Edge Cases
- [ ] หมดเวลา 10 นาที → TTL ลบ document
- [ ] ออกจากห้อง → players.length ลด, status update
- [ ] ยกเลิกห้อง → status = 'cancelled'
- [ ] หลายห้องพร้อมกัน → ไม่ conflict

---

## 📁 Files Created/Modified

### Created Files
- ✅ `src/models/WaitingRoom.js`
- ✅ `src/api/waitingRoomApi.js`
- ✅ `frontend/src/app/components/user/JoinWaitingRoomPage.tsx`
- ✅ `WAITING_ROOM_GUIDE.md`

### Modified Files
- ✅ `server.js` - เพิ่ม waiting room routes
- ✅ `frontend/src/services/api.ts` - เพิ่ม waitingRoomAPI
- ✅ `frontend/src/app/components/user/BookingPage.tsx` - integrate API
- ✅ `frontend/src/app/components/user/BookingWaitingRoom.tsx` - integrate API

---

## 🚀 How to Use

### 1. Start Server
```bash
cd Sports-Facility-Booking-System
node server.js
```

### 2. Create Booking
```
UI: BookingPage
├─ Select: Date → Sport → Facility → Time
├─ Click: "สร้างการจอง"
├─ See: Waiting Room with roomCode
└─ Share: roomCode to friends
```

### 3. Join Booking
```
UI: JoinWaitingRoomPage
├─ Option A: Search roomCode
├─ Option B: Select from list
├─ Click: "เข้าร่วม"
└─ Wait: Until full or timeout
```

### 4. Auto-Confirm
```
When players are full:
├─ Dialog: "ครบจำนวนแล้ว!"
├─ Click: "ยืนยันการจอง"
├─ System: Creates Reservation
└─ Toast: "ยืนยันสำเร็จ!"
```

---

## 📝 Notes

- ⏱️ TTL = 10 นาที (configurable ใน WaitingRoom.js)
- 🔄 List refreshes ทุก 5 วินาที
- 👥 Max players = configurable ใน POST request
- 🎫 Reservation auto-created with all players
- ✅ All validation done on backend

---

## 🎓 Summary

ระบบ Waiting Room เสร็จสมบูรณ์ครอบคลุม:
1. **Create Waiting Room** - ผู้จองสร้าง + รับรหัส
2. **10-Minute Countdown** - Auto-delete หลังหมดเวลา
3. **Share & Join** - เพื่อนค้นหาและเข้าร่วม
4. **Auto-Confirm** - เมื่อครบจำนวน
5. **Create Reservation** - บันทึกข้อมูลเข้า DB

พร้อมใช้งานแล้ว! 🎉

