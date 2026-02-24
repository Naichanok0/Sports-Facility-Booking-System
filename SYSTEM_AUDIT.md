# 📊 SYSTEM AUDIT REPORT - Sports Facility Booking System

## 🔴 ส่วนที่ยังเป็น Hardcoded Data (ต้องแก้)

### 1. **StandbyQueuePage.tsx** ⚠️ CRITICAL
- **ปัญหา**: `mockFacilities` hardcoded, `sportTypes` hardcoded, `queueList` hardcoded
- **ตำแหน่ง**: `frontend/src/app/components/user/StandbyQueuePage.tsx`
- **ต้องการ API**:
  - `facilityAPI.getAll()` - ดึงรายชื่อสนาม
  - `sportTypeAPI.getAll()` - ดึงประเภทกีฬา
  - `queueAPI.getAll()` หรือ `queueAPI.getByStatus('waiting')` - ดึงคิว

### 2. **JoinBookingPage.tsx** ⚠️ CRITICAL
- **ปัญหา**: `mockBookings` hardcoded
- **ตำแหน่ง**: `frontend/src/app/components/user/JoinBookingPage.tsx`
- **ต้องการ API**:
  - `reservationAPI.getAvailable()` หรือ `reservationAPI.getByStatus('confirmed')` - ดึงการจองที่ยังไม่เต็ม
  - ต้องการ join/share feature API

### 3. **TodayBookings.tsx** ⚠️ CRITICAL
- **ปัญหา**: `mockTodayBookings` hardcoded
- **ตำแหน่ง**: `frontend/src/app/components/facility-staff/TodayBookings.tsx`
- **ต้องการ API**:
  - `reservationAPI.getTodayByFacility(facilityId)` - ดึงการจองวันนี้
  - `checkinAPI.getTodayByFacility(facilityId)` - ดึง check-in วันนี้

### 4. **ReportsDashboard.tsx** ⚠️ HIGH
- **ปัญหา**: `bookingData` hardcoded, กราฟทั้งหมดใช้ mock data
- **ตำแหน่ง**: `frontend/src/app/components/admin/ReportsDashboard.tsx`
- **ต้องการ API**:
  - `reservationAPI.getStatistics(dateRange)` - ดึงสถิติการจอง
  - `userAPI.getStatistics(dateRange)` - ดึงสถิติผู้ใช้
  - `facilityAPI.getUtilization(dateRange)` - ดึงอัตราการใช้งาน

---

## 🟡 ส่วนที่ Partially Connected (ต้องปรับปรุง)

### 1. **CheckInManagement.tsx** 🔧 MOSTLY DONE
- ✅ ดึงสนามจาก API
- ✅ ดึง check-in จาก API
- ❌ `mockFacilities` ยังใช้ (backup data เมื่อ API fail)
- **สถานะ**: 80% เสร็จ - ลบ `mockFacilities` ออก, ใช้ API response

### 2. **BookingPage.tsx** 🔧 MOSTLY DONE
- ✅ ดึงสนามจาก API
- ✅ ดึงชนิดกีฬาจาก API
- ❌ `timeSlots` ยังเป็น mock (random generation)
- **ต้องการ**: API endpoint `/api/reservations/available-slots/{facilityId}?date={date}`
- **สถานะ**: 70% เสร็จ

### 3. **FacilityStatus.tsx** ✅ DONE
- ✅ ดึงสนามจาก API
- ✅ Toggle status เรียก API update
- **สถานะ**: 100% เสร็จ

### 4. **BookingMonitor.tsx** ✅ DONE
- ✅ ดึงการจองจาก API
- ✅ ดึงผู้ใช้จาก API
- **สถานะ**: 100% เสร็จ

---

## 🟢 ส่วนที่เสร็จสมบูรณ์ (API Ready)

### ✅ Components
1. **LoginPage.tsx** - API login + demo fallback ✅
2. **RegisterPage.tsx** - API register ✅
3. **FacilityManagement.tsx** - API CRUD ✅
4. **SportTypeManagement.tsx** - API CRUD ✅
5. **CheckInManagement.tsx** - 80% (ลบ mock facilities)
6. **BookingMonitor.tsx** - 100% ✅
7. **FacilityStatus.tsx** - 100% ✅

### ✅ Backend APIs Available
- `POST /api/users/login` - Login ✅
- `POST /api/users` - Register ✅
- `GET /api/users` - List users ✅
- `GET /api/facilities` - List facilities ✅
- `POST /api/facilities` - Create facility ✅
- `PUT /api/facilities/:id` - Update facility ✅
- `DELETE /api/facilities/:id` - Delete facility ✅
- `GET /api/sport-types` - List sport types ✅
- `POST /api/sport-types` - Create sport type ✅
- `PUT /api/sport-types/:id` - Update sport type ✅
- `DELETE /api/sport-types/:id` - Delete sport type ✅
- `GET /api/reservations` - List reservations ✅
- `GET /api/check-ins` - List check-ins ✅

---

## 🟠 Backend APIs ต้องเพิ่มเติม

### Priority 1 (สำคัญมาก)
1. `GET /api/reservations/available-slots` - Get available time slots
   - Query: `?facilityId=XXX&date=YYYY-MM-DD`
   - Response: Array of time slots with availability

2. `GET /api/reservations/today` - Get today's bookings
   - Query: `?facilityId=XXX` (optional)
   - Response: Array of reservations for today

3. `GET /api/reservations/statistics` - Get booking statistics
   - Query: `?startDate=XXX&endDate=XXX`
   - Response: { total, completed, cancelled, noShow, ... }

4. `GET /api/reservations/available` - Get available bookings to join
   - Query: `?sportTypeId=XXX&status=confirmed`
   - Response: Array of bookings that need more players

5. `POST /api/reservations/:id/join` - Join existing booking
   - Body: { userId, ... }
   - Response: { success, reservationId, ... }

### Priority 2 (สำคัญ)
6. `GET /api/queues` - List waiting queues
   - Query: `?status=waiting`
   - Response: Array of queue entries

7. `GET /api/statistics/facilities` - Get facility utilization
   - Query: `?startDate=XXX&endDate=XXX`
   - Response: Facility usage statistics

8. `GET /api/statistics/users` - Get user statistics
   - Query: `?startDate=XXX&endDate=XXX`
   - Response: User booking patterns

---

## 📋 ACTION PLAN (ลำดับความสำคัญ)

### Phase 1 - Delete Hardcoded Data (1 hour) 🔴 URGENT
1. ลบ `mockFacilities` จาก CheckInManagement.tsx
2. ลบ `mockBookings` จาก JoinBookingPage.tsx
3. ลบ `mockTodayBookings` จาก TodayBookings.tsx
4. ลบ `bookingData` จาก ReportsDashboard.tsx

### Phase 2 - Add Missing APIs (2-3 hours) 🟠 HIGH
1. Backend: Create all 8 missing endpoints
2. Frontend: Update service layer (api.ts)
3. Add loading/error states for all pages

### Phase 3 - Connect Pages to APIs (2 hours) 🟡 MEDIUM
1. StandbyQueuePage - Connect to queue API
2. JoinBookingPage - Connect to available bookings API
3. TodayBookings - Connect to today bookings API
4. ReportsDashboard - Connect to statistics API
5. BookingPage - Connect to available slots API

### Phase 4 - Testing & Bug Fixes (1-2 hours) 🟢 READY
1. Test all pages with real data
2. Fix edge cases and error handling
3. Performance optimization

---

## 💾 Database Status

### Collections Ready ✅
- users ✅
- facilities ✅
- sport_types ✅
- reservations ✅
- check_ins ✅
- queues ✅
- cancellations ✅

### Indexes Created ✅
All necessary indexes configured

---

## 🔗 Service Layer Status

**File**: `frontend/src/services/api.ts`

### ✅ Ready
- userAPI (login, register, getAll, etc.)
- facilityAPI (CRUD)
- sportTypeAPI (CRUD)
- reservationAPI (basic getAll)
- checkinAPI (basic getAll)

### ❌ Need Implementation
- queueAPI (new)
- reservationAPI.getAvailableSlots()
- reservationAPI.getToday()
- reservationAPI.getAvailable()
- reservationAPI.join()
- statisticsAPI (new)

---

## 🚀 Summary

**ทั้งระบบ**: 65% เสร็จสมบูรณ์

- ✅ Backend: 70% (14/20 endpoints)
- ✅ Frontend: 60% (7/11 pages)
- 🟡 Remaining: 5 pages + 6 API endpoints

**Timeline**: 4-6 ชั่วโมงให้สำเร็จทั้งระบบ

**ถัดไป**: ลบ hardcoded data ทั้งหมด → เพิ่ม missing APIs → เชื่อมหน้าต่างๆ

