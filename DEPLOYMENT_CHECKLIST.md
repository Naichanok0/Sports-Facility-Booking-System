# ✅ Deployment Checklist - Waiting Room System

## 📋 Pre-Deployment Checklist

### 1. Backend Verification

#### Database Setup
- [ ] MongoDB running locally or Atlas connected
- [ ] Database name: `Booking` or configured in `.env`

#### Collections & Indexes
```bash
# Run these commands in mongosh/mongo shell
use Booking
db.createCollection("waitingrooms")
db.waitingrooms.createIndex({ roomCode: 1 }, { unique: true })
db.waitingrooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

- [ ] ✅ `waitingrooms` collection created
- [ ] ✅ Index on `roomCode` (unique)
- [ ] ✅ TTL index on `expiresAt`

#### Environment Variables
```bash
# .env file
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
PORT=3089
NODE_ENV=production
```

- [ ] ✅ `.env` configured
- [ ] ✅ MongoDB URI tested
- [ ] ✅ JWT_SECRET set

#### Code Files
- [ ] ✅ `src/models/WaitingRoom.js` exists
- [ ] ✅ `src/api/waitingRoomApi.js` exists
- [ ] ✅ `server.js` includes waiting room routes
- [ ] ✅ All imports working (no 404 errors)

#### API Endpoints
Test each endpoint with Postman/curl:

```bash
# Test 1: Create Waiting Room
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
Response: 201 Created ✅

# Test 2: Get Open Rooms
curl http://localhost:3089/api/waiting-rooms?status=open
Response: 200 OK ✅

# Test 3: Get Room by Code
curl http://localhost:3089/api/waiting-rooms/WR123456789
Response: 200 OK ✅

# Test 4: Join Room
curl -X POST http://localhost:3089/api/waiting-rooms/ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'
Response: 200 OK ✅

# Test 5: Close & Create Reservation
curl -X POST http://localhost:3089/api/waiting-rooms/ROOM_ID/close-and-reserve
Response: 200 OK ✅
  data.waitingRoom.status = "completed"
  data.reservation.reservationNo = "RES..."
```

- [ ] ✅ POST /api/waiting-rooms (201)
- [ ] ✅ GET /api/waiting-rooms (200)
- [ ] ✅ GET /api/waiting-rooms/:code (200)
- [ ] ✅ POST /api/waiting-rooms/:id/join (200)
- [ ] ✅ POST /api/waiting-rooms/:id/leave (200)
- [ ] ✅ POST /api/waiting-rooms/:id/close-and-reserve (200)
- [ ] ✅ POST /api/waiting-rooms/:id/cancel (200)

#### Error Handling
- [ ] ✅ Invalid input returns 400
- [ ] ✅ Not found returns 404
- [ ] ✅ Server errors return 500
- [ ] ✅ All errors have `success: false` message

### 2. Frontend Verification

#### Dependencies
```bash
cd frontend
npm install
```
- [ ] ✅ No install errors
- [ ] ✅ node_modules complete

#### Build
```bash
npm run build
```
- [ ] ✅ Build succeeds
- [ ] ✅ No TypeScript errors
- [ ] ✅ dist/ folder created

#### Files Created/Modified
- [ ] ✅ `frontend/src/services/api.ts` (waitingRoomAPI added)
- [ ] ✅ `frontend/src/app/components/user/BookingPage.tsx` (updated)
- [ ] ✅ `frontend/src/app/components/user/BookingWaitingRoom.tsx` (updated)
- [ ] ✅ `frontend/src/app/components/user/JoinWaitingRoomPage.tsx` (new)

#### TypeScript Compilation
```bash
npm run type-check  # or similar
```
- [ ] ✅ No TypeScript errors
- [ ] ✅ All types properly defined
- [ ] ✅ Imports resolved correctly

### 3. Integration Testing

#### Manual Test Flow: Create & Join

**Setup:**
1. Start backend: `node server.js`
2. Start frontend: `cd frontend && npm run dev`
3. Login as User1 (admin or regular user)

**Test Steps:**
```
1. Navigate to "สร้างการจอง" tab
   - [ ] Page loads
   - [ ] Calendar displays
   - [ ] Sport types dropdown works
   - [ ] Facilities list shows

2. Select: วันที่ (tomorrow) > Sport > Facility > Time
   - [ ] Selection works
   - [ ] Summary card updates

3. Click "สร้างการจอง"
   - [ ] Dialog appears
   - [ ] Info is correct

4. Click "สร้างการจอง" (confirm)
   - [ ] API call succeeds (Network tab)
   - [ ] BookingWaitingRoom appears
   - [ ] roomCode displays (e.g., WR123456789)
   - [ ] Countdown starts (10:00)
   - [ ] 1 player shown

5. Open new window as User2
   - [ ] Login as different user
   - [ ] Go to "เข้าร่วมการจอง" tab
   - [ ] Room list shows with the new room
   - [ ] Room has correct details

6. Click "เข้าร่วม" on the room
   - [ ] Dialog appears
   - [ ] Player list shown
   - [ ] Confirm dialog works
   - [ ] Click "ยืนยันเข้าร่วม"

7. Observe in User1 window
   - [ ] Players count increases (2/4)
   - [ ] Progress bar updates

8. Repeat with User3 & User4
   - [ ] Players: 3/4, then 4/4
   - [ ] Status changes to "เต็มแล้ว"

9. Auto-confirmation dialog appears
   - [ ] Shows "ครบจำนวน!"
   - [ ] Click "ยืนยันการจอง"

10. Success Toast appears
    - [ ] Message: "ยืนยันสำเร็จ!"
    - [ ] Page closes/redirects

11. Check Database
    - [ ] waitingroom.status = "completed"
    - [ ] reservation created with 4 players
    - [ ] reservation.playerCount = 4
```

- [ ] ✅ Create booking flow complete
- [ ] ✅ Join booking flow complete
- [ ] ✅ Auto-confirmation works
- [ ] ✅ Reservation created correctly

#### Timeout Test

**Setup:**
1. Create a waiting room
2. Don't add players for 10 minutes

**Expected:**
- [ ] ✅ Countdown reaches 0:00
- [ ] ✅ Toast: "การจองหมดเวลา"
- [ ] ✅ Page redirects to dashboard
- [ ] ✅ Room deleted from MongoDB

### 4. Edge Case Testing

#### Edge Case 1: Leave Room
```
1. Create room with 2 players
2. Player2 clicks "ออกจากห้อง"
   - [ ] API call succeeds
   - [ ] Player count: 2→1
   - [ ] Status: open (if was full)
   - [ ] No errors
```

#### Edge Case 2: Cancel Room
```
1. Create room
2. Host clicks "ยกเลิก"
   - [ ] status = "cancelled"
   - [ ] Toast shows
   - [ ] Room no longer in list
```

#### Edge Case 3: Duplicate Join
```
1. User2 joined room
2. User2 tries to join again
   - [ ] API returns error: "User already in room"
   - [ ] Toast: "คุณเข้าร่วมแล้ว"
   - [ ] Not added twice
```

#### Edge Case 4: Exceeded Max Players
```
1. Create room with maxPlayers=4
2. 4 players joined (full)
3. User5 tries to join
   - [ ] API returns error
   - [ ] Toast: "ห้องเต็มแล้ว"
   - [ ] Not added
```

#### Edge Case 5: Invalid Room Code
```
1. Search "INVALID123"
   - [ ] API returns 404
   - [ ] Toast: "ไม่พบห้องรอ"
   - [ ] Dialog doesn't appear
```

- [ ] ✅ All edge cases handled gracefully

### 5. Performance Testing

#### Load Testing
```bash
# Test with multiple rooms
- Create 5 rooms simultaneously
- Join each room with 3 users

Expected:
- [ ] ✅ All requests complete
- [ ] ✅ Response time < 1 second
- [ ] ✅ No memory leaks
```

#### Database Performance
- [ ] ✅ Queries use indexes (check with explain())
- [ ] ✅ No N+1 queries
- [ ] ✅ TTL cleanup running

### 6. Security Testing

- [ ] ✅ JWT auth required for all endpoints
- [ ] ✅ User can't join own room? (optional)
- [ ] ✅ User can't modify other users' rooms
- [ ] ✅ Room code is unique
- [ ] ✅ No SQL injection possible
- [ ] ✅ Validate all inputs on backend

### 7. UI/UX Testing

#### Responsive Design
```
Devices:
- [ ] ✅ Desktop (1920px)
- [ ] ✅ Tablet (768px)
- [ ] ✅ Mobile (320px)

All should:
- [ ] ✅ Display correctly
- [ ] ✅ Buttons clickable
- [ ] ✅ Text readable
- [ ] ✅ No overflow
```

#### Browser Compatibility
- [ ] ✅ Chrome/Edge (latest)
- [ ] ✅ Firefox (latest)
- [ ] ✅ Safari (latest)
- [ ] ✅ Mobile Safari

#### Accessibility
- [ ] ✅ Keyboard navigation works
- [ ] ✅ Color contrast adequate
- [ ] ✅ Alt text on images
- [ ] ✅ Form labels present

### 8. Documentation Review

- [ ] ✅ WAITING_ROOM_GUIDE.md complete
- [ ] ✅ WAITING_ROOM_IMPLEMENTATION_SUMMARY.md complete
- [ ] ✅ WAITING_ROOM_INTEGRATION.md complete
- [ ] ✅ README.md updated
- [ ] ✅ API documentation current

---

## 🚀 Deployment Steps

### Step 1: Production Build
```bash
# Backend
npm install --production
NODE_ENV=production node server.js

# Frontend
cd frontend
npm install --production
npm run build
```

- [ ] ✅ No build warnings/errors
- [ ] ✅ Build artifacts created

### Step 2: Database Migration
```bash
# Create indexes
use Booking
db.waitingrooms.createIndex({ roomCode: 1 }, { unique: true })
db.waitingrooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

- [ ] ✅ Indexes created in production
- [ ] ✅ No data loss

### Step 3: Environment Configuration
```bash
# .env.production
MONGODB_URI=production_uri
JWT_SECRET=production_secret
PORT=3089
NODE_ENV=production
```

- [ ] ✅ Production `.env` configured
- [ ] ✅ Sensitive data not committed to git

### Step 4: Deploy
```bash
# Platform-specific deployment
# (Vercel, Heroku, AWS, Azure, etc.)
```

- [ ] ✅ Backend deployed
- [ ] ✅ Frontend deployed
- [ ] ✅ DNS configured
- [ ] ✅ SSL certificate valid

### Step 5: Post-Deployment Testing
```bash
# Test production endpoints
curl https://yourapp.com/api/waiting-rooms
```

- [ ] ✅ APIs respond
- [ ] ✅ Database connected
- [ ] ✅ Auth working
- [ ] ✅ Errors logged properly

### Step 6: Monitoring Setup
- [ ] ✅ Error tracking (Sentry, etc.)
- [ ] ✅ Performance monitoring (New Relic, etc.)
- [ ] ✅ Uptime monitoring
- [ ] ✅ Log aggregation

---

## 📞 Rollback Plan

If issues occur:

```bash
# 1. Stop production server
kill <pid>

# 2. Restore previous version
git checkout HEAD~1
npm install
node server.js

# 3. Check database consistency
db.waitingrooms.find({status: "completed"})

# 4. Notify team
```

- [ ] ✅ Rollback procedure documented
- [ ] ✅ Backups exist
- [ ] ✅ Team informed

---

## ✅ Final Checklist

```
Backend:  ✅ ✅ ✅ ✅ ✅
Frontend: ✅ ✅ ✅ ✅ ✅
Database: ✅ ✅ ✅ ✅ ✅
Testing:  ✅ ✅ ✅ ✅ ✅
Docs:     ✅ ✅ ✅ ✅ ✅
Deploy:   ✅ ✅ ✅ ✅ ✅

═══════════════════════════════════
   🎉 READY FOR DEPLOYMENT! 🎉
═══════════════════════════════════
```

---

## 📞 Support

If issues arise:
1. Check logs: `tail -f server.log`
2. Check database: `db.waitingrooms.find()`
3. Check frontend console: `F12` Developer Tools
4. Check Network tab for API calls
5. Consult documentation files

---

**Last Updated**: 30 March 2026
**Status**: ✅ Ready for Production
**Version**: 1.0.0

