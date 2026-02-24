# 🚀 Implementation Guide - Frontend API Integration

**วันที่:** 22 มีนาคม 2026  
**เป้าหมาย:** เชื่อมต่อ Frontend Components กับ Backend APIs

---

## 📋 Frontend Components ที่ต้อง Update

### 1. LoginPage.tsx
**ปัจจุบัน:** ใช้ Mock data  
**ต้อง:** เรียก API `/api/auth/login`

```tsx
// Before: Mock data
const user = registeredUsers.find((u) => u.studentId === studentId);

// After: API call
const response = await fetch('http://localhost:3089/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: studentId, password })
});
const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.token);
  onLogin(data.user);
}
```

---

### 2. RegisterPage.tsx
**ปัจจุบัน:** ไม่ชัดเจน  
**ต้อง:** เรียก API `/api/auth/register`

```tsx
const response = await fetch('http://localhost:3089/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: formData.username,
    email: formData.email,
    password: formData.password,
    firstName: formData.firstName,
    lastName: formData.lastName,
    studentId: formData.studentId,
    phone: formData.phone,
    faculty: formData.faculty
  })
});
```

---

### 3. ForgotPasswordPage.tsx
**ปัจจุบัน:** ไม่ชัดเจน  
**ต้อง:** เรียก API `/api/auth/forgot-password`

```tsx
const response = await fetch('http://localhost:3089/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});
```

---

### 4. ProfilePage.tsx
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก APIs:
- `GET /api/user/profile` - ดูข้อมูล
- `PUT /api/user/profile` - อัพเดตข้อมูล
- `POST /api/auth/change-password` - เปลี่ยนรหัสผ่าน
- `GET /api/user/stats` - ดูสถิติ
- `GET /api/user/penalties` - ดูปรับโทษ

---

### 5. BookingPage.tsx
**ปัจจุบัน:** ใช้ Mock data  
**ต้อง:** เรียก APIs:
- `GET /api/sports` - ดูประเภทกีฬา
- `GET /api/facilities` - ดูสนาม
- `GET /api/availability?facilityId=...&date=...` - ดูเวลาว่าง
- `POST /api/reservations` - จองสนาม

---

### 6. BookingHistory.tsx
**ปัจจุบัน:** ไม่ชัดเจน  
**ต้อง:** เรียก API `/api/user/bookings`

```tsx
const response = await fetch('http://localhost:3089/api/user/bookings', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### 7. BookingWaitingRoom.tsx
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก APIs:
- `GET /api/queue/reservations/:id` - ดูคิว
- `POST /api/queue/join/:id` - เข้าร่วมคิว
- `GET /api/queue/my-status/:id` - ดูสถานะของฉัน

---

### 8. JoinBookingPage.tsx
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก APIs:
- `POST /api/queue/join/:reservationId` - เข้าร่วมคิว

---

### 9. StandbyQueuePage.tsx
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก APIs:
- `GET /api/queue/my-queues` - ดูคิวของฉัน
- `GET /api/queue/my-status/:id` - ดูสถานะคิว
- `POST /api/queue/cancel/:queueId` - ยกเลิกคิว

---

### 10. CheckInManagement.tsx (Facility Staff)
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก APIs:
- `POST /api/facility-staff/check-in` - Check-in
- `GET /api/facility-staff/today-bookings` - ดูการจองวันนี้
- `POST /api/facility-staff/mark-no-show/:id` - Mark no-show

---

### 11. TodayBookings.tsx (Facility Staff)
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก API `/api/facility-staff/today-bookings`

---

### 12. FacilityStatus.tsx (Facility Staff)
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก API `/api/facility-staff/facility-status/:facilityId`

---

### 13. BookingMonitor.tsx (Admin)
**ปัจจุบัน:** ไม่ชัดเจน  
**ต้อง:** เรียก APIs:
- `GET /api/admin/reservations` - ดูการจองทั้งหมด
- `POST /api/admin/cancel-reservation` - ยกเลิกการจอง

---

### 14. UserPenalties.tsx (Admin)
**ปัจจุบัน:** ไม่มี API  
**ต้อง:** เรียก API `/api/admin/reservations?status=cancelled`

---

## 🔧 Environment Configuration

สร้างไฟล์ `frontend/.env` หรือ `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3089/api
VITE_APP_NAME=Sports Facility Booking
VITE_APP_VERSION=1.0.0
```

ใช้ใน frontend:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3089/api';
```

---

## 📝 API Client Utility

สร้างไฟล์ `frontend/src/utils/api.ts`:

```typescript
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3089/api';

export async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      const error = await response.json();
      throw new Error(error.error || 'API error');
    }

    return await response.json();
  } catch (error) {
    toast.error(error.message);
    throw error;
  }
}
```

---

## 🎯 Priority Checklist

### Phase 1: Core Auth (Week 1)
- [ ] Update LoginPage to use `/api/auth/login`
- [ ] Update RegisterPage to use `/api/auth/register`
- [ ] Update ForgotPasswordPage
- [ ] Store token in localStorage
- [ ] Add logout functionality

### Phase 2: Booking System (Week 2)
- [ ] Update BookingPage with real data
- [ ] Implement facility/sport filtering
- [ ] Implement availability checking
- [ ] Implement booking creation
- [ ] Update BookingHistory

### Phase 3: Queue System (Week 2-3)
- [ ] Implement BookingWaitingRoom
- [ ] Implement JoinBookingPage
- [ ] Implement StandbyQueuePage
- [ ] Add real-time queue updates (optional)

### Phase 4: User Features (Week 3)
- [ ] Implement ProfilePage (view + edit)
- [ ] Implement change password
- [ ] Implement user penalties view
- [ ] Implement booking cancellation

### Phase 5: Facility Staff (Week 4)
- [ ] Implement CheckInManagement
- [ ] Implement TodayBookings
- [ ] Implement FacilityStatus
- [ ] Add no-show marking

### Phase 6: Admin Dashboard (Week 4-5)
- [ ] Implement BookingMonitor
- [ ] Implement UserPenalties management
- [ ] Implement facility management
- [ ] Add reporting

---

## 🧪 Testing

### Manual Testing Checklist

```
Auth
- [ ] Register new user
- [ ] Login with credentials
- [ ] Forgot password flow
- [ ] Change password
- [ ] Logout

Booking
- [ ] View sports and facilities
- [ ] Check availability
- [ ] Create booking
- [ ] View booking history
- [ ] Cancel booking

Queue
- [ ] Join queue
- [ ] View queue position
- [ ] Cancel queue entry

Facility Staff
- [ ] View today's bookings
- [ ] Check-in user
- [ ] Mark no-show
- [ ] View facility status

Admin
- [ ] View all bookings
- [ ] Cancel booking
- [ ] View penalties
- [ ] Manage users
```

---

## 🚀 Deployment Steps

1. **Setup MongoDB URI** in `.env`
2. **Setup JWT_SECRET** in `.env`
3. **Build frontend:** `cd frontend && npm run build`
4. **Start backend:** `npm start` (PORT=3089)
5. **Serve frontend:** Static files from `frontend/dist`

---

## 📞 Support & Troubleshooting

### Common Issues

**CORS Error**
- Check server CORS configuration
- Ensure `http://localhost:3000` is allowed

**401 Unauthorized**
- Token might be expired
- Re-login required

**404 Not Found**
- Check API endpoint URL
- Verify MongoDB data exists

**Network Error**
- Check backend is running
- Check correct PORT (3089)

---

**Created:** 22 มีนาคม 2026  
**Status:** Ready for Implementation
