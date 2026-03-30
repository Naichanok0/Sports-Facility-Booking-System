# 🎯 Waiting Room System - Quick Start Guide

## 📖 ค่อนข้างสั้น คู่มือเริ่มต้นใช้งาน

### What is Waiting Room?

ระบบ "ห้องรอสมาชิกมาคบหน่อย" - ช่วยให้:
- ผู้จอง: สร้างการจองแล้วเชิญเพื่อนมาคบ (countdown 10 นาที)
- สมาชิก: ค้นหาและเข้าร่วมการจองที่เปิดอยู่
- ระบบ: อัตโนมัติสร้าง Reservation เมื่อครบจำนวน

---

## 🚀 Quick Start (5 minutes)

### 1. Start Backend
```bash
cd Sports-Facility-Booking-System
node server.js
```
Expected: `✅ Connected to MongoDB` + `🚀 API running on port 3089`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Expected: `✅ http://localhost:5173`

### 3. Test It!
```
1. Login as user
2. Go to "สร้างการจอง" → Create booking
3. Get roomCode (e.g., WR123456789)
4. Open new window → "เข้าร่วมการจอง"
5. Search roomCode → Join
6. When full → Auto-confirm
✅ Done!
```

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| **WAITING_ROOM_GUIDE.md** | 📖 Complete user guide + API reference |
| **WAITING_ROOM_IMPLEMENTATION_SUMMARY.md** | 🏗️ What was built |
| **WAITING_ROOM_INTEGRATION.md** | 🔗 How to add to Dashboard |
| **DEPLOYMENT_CHECKLIST.md** | ✅ Pre-deployment checklist |
| **README_WAITING_ROOM.md** | ← You are here |

---

## 🎬 Workflow Overview

```
┌─────────────────┐          ┌──────────────────┐
│  User1 Creates  │          │  User2-4 Join    │
│  Booking        │          │  Booking         │
└────────┬────────┘          └────────┬─────────┘
         │                            │
         └───────────┬────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Waiting Room       │
          │  Countdown 10 min   │
          │  Players 4/4        │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  Auto-Confirm       │
          │  Create Reservation │
          │  4 Players Saved    │
          └─────────────────────┘
```

---

## 🗄️ Database

### Collections
- **waitingrooms** - ห้องรอชั่วคราว (Auto-delete หลัง 10 นาที)
- **reservations** - การจองถาวร (บันทึกจากห้องรอ)

### Create Indexes
```bash
mongosh
use Booking
db.waitingrooms.createIndex({ roomCode: 1 }, { unique: true })
db.waitingrooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## 🔌 API Endpoints (7 total)

```
POST   /api/waiting-rooms                    สร้างห้องรอ
GET    /api/waiting-rooms                    ดูห้องเปิด
GET    /api/waiting-rooms/:code              ดูรายละเอียด
POST   /api/waiting-rooms/:id/join           เข้าร่วม
POST   /api/waiting-rooms/:id/leave          ออกจาก
POST   /api/waiting-rooms/:id/close-and-reserve  ปิด+สร้าง Res
POST   /api/waiting-rooms/:id/cancel         ยกเลิก
```

All endpoints return JSON with `{ success, message, data }`

---

## 📱 Frontend Components

### 3 New/Updated Components

1. **BookingPage.tsx** - ผู้ใช้สร้างการจอง
2. **BookingWaitingRoom.tsx** - ห้องรอ + countdown
3. **JoinWaitingRoomPage.tsx** - สมาชิกเข้าร่วม ← NEW

### How to Add to Dashboard
```typescript
// Edit: UserDashboard.tsx
import JoinWaitingRoomPage from "./user/JoinWaitingRoomPage";

// Add state
const [activeTab, setActiveTab] = useState("dashboard");

// Add button
<Button onClick={() => setActiveTab("join-booking")}>
  👥 เข้าร่วมการจอง
</Button>

// Render component
{activeTab === "join-booking" && <JoinWaitingRoomPage user={user} />}
```

See: **WAITING_ROOM_INTEGRATION.md** for full details

---

## ✅ Checklist

Before deploying:

```
Backend:
- [ ] Models created (WaitingRoom.js)
- [ ] APIs created (waitingRoomApi.js)
- [ ] Server configured (server.js)
- [ ] Database indexes created

Frontend:
- [ ] Services added (api.ts)
- [ ] Components created (3 files)
- [ ] No TypeScript errors
- [ ] Builds successfully

Database:
- [ ] MongoDB running
- [ ] waitingrooms collection exists
- [ ] TTL index configured

Testing:
- [ ] Create booking works
- [ ] Join booking works
- [ ] Auto-confirm works
- [ ] Reservation created
- [ ] Timeout works (10 min)
```

See: **DEPLOYMENT_CHECKLIST.md** for full checklist

---

## 🐛 Troubleshooting

### Issue: `Cannot find module 'WaitingRoom'`
**Solution:** Check `src/models/WaitingRoom.js` exists + import path correct

### Issue: `API returns 404`
**Solution:** Check `server.js` has line:
```javascript
app.use('/api/waiting-rooms', require('./src/api/waitingRoomApi'));
```

### Issue: `TTL not deleting documents`
**Solution:** Create index:
```bash
db.waitingrooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Issue: `Frontend shows blank page`
**Solution:** Check browser console (F12) for errors

### Issue: `Timeout after 10 minutes not working`
**Solution:** Check:
1. expiresAt field set correctly
2. TTL index created
3. MongoDB daemon running

---

## 🧪 Quick Test

### Manual API Test
```bash
# Create room
curl -X POST http://localhost:3089/api/waiting-rooms \
  -H "Content-Type: application/json" \
  -d '{
    "host": "USER_ID",
    "facilityId": "FACILITY_ID",
    "sportTypeId": "SPORTTYPE_ID",
    "date": "2026-04-01",
    "startTime": "18:00",
    "endTime": "20:00",
    "maxPlayers": 4
  }'

# List open rooms
curl http://localhost:3089/api/waiting-rooms?status=open

# Join room
curl -X POST http://localhost:3089/api/waiting-rooms/{roomId}/join \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Close and create reservation
curl -X POST http://localhost:3089/api/waiting-rooms/{roomId}/close-and-reserve
```

---

## 📊 Database Schema (Quick View)

### waitingrooms
```javascript
{
  roomCode: "WR123456789",           // Unique
  host: ObjectId,                    // ผู้จอง
  facilityId, sportTypeId,           // สนาม + ประเภท
  date, startTime, endTime,          // เวลา
  maxPlayers: 4,                     // จำนวนคน
  players: [{userId, firstName, ...}],
  status: "open|full|completed|...", // สถานะ
  expiresAt: Date,                   // TTL 10 นาที
  createdAt, updatedAt               // timestamps
}
```

### reservations (after close-and-reserve)
```javascript
{
  reservationNo: "RES123456789",
  userId: HostId,                    // ผู้จอง
  facilityId, sportTypeId,
  date, startTime, endTime,
  playerCount: 4,                    // ทั้งหมด
  players: [{userId, firstName, ...}], // ทุกคนที่เข้าร่วม
  status: "confirmed",
  createdAt, updatedAt
}
```

---

## 🎓 Key Features

✅ **10-Minute Countdown** - Auto-expire & delete  
✅ **Copy/Share Booking Code** - Easy sharing  
✅ **Live Room List** - Real-time refresh  
✅ **Auto-Confirmation** - When players full  
✅ **Multi-Player Support** - All stored in reservation  
✅ **Full Validation** - Input checking on backend  
✅ **Error Handling** - Graceful error messages  
✅ **Responsive Design** - Mobile-friendly  

---

## 🚀 Next Steps

1. ✅ Review documentation files
2. ✅ Run deployment checklist
3. ✅ Test all features
4. ✅ Integrate into Dashboard (optional)
5. ✅ Deploy to production
6. ✅ Monitor & maintain

---

## 📞 Files Reference

```
src/models/
├── WaitingRoom.js ..................... Mongoose schema

src/api/
├── waitingRoomApi.js .................. 7 API endpoints

frontend/src/
├── services/api.ts .................... waitingRoomAPI functions
└── app/components/user/
    ├── BookingPage.tsx ................ Create booking (updated)
    ├── BookingWaitingRoom.tsx ......... Waiting room (updated)
    └── JoinWaitingRoomPage.tsx ........ Join booking (NEW)

Documentation/
├── WAITING_ROOM_GUIDE.md ............. Full guide
├── WAITING_ROOM_INTEGRATION.md ....... Dashboard integration
├── WAITING_ROOM_IMPLEMENTATION_SUMMARY.md
├── DEPLOYMENT_CHECKLIST.md ........... Pre-deploy checklist
└── README_WAITING_ROOM.md ............ This file
```

---

## 💬 Summary

**What:** Waiting Room system for group bookings  
**How:** Create → Share → Join → Auto-confirm → Save reservation  
**Why:** Better UX for group sports activities  
**When:** Deploy after testing  
**Where:** Integrated in Dashboard  

**Status:** ✅ **READY TO USE!** 🎉

---

**Last Updated:** 30 March 2026  
**Version:** 1.0.0  
**Maintainer:** Your Team  

---

## 🔗 Quick Links

- [Complete Guide →](./WAITING_ROOM_GUIDE.md)
- [Integration →](./WAITING_ROOM_INTEGRATION.md)
- [Deployment →](./DEPLOYMENT_CHECKLIST.md)
- [Summary →](./WAITING_ROOM_IMPLEMENTATION_SUMMARY.md)

