# 🔗 Frontend Integration Guide

## วิธีเชื่อม Frontend React กับ Backend API

### 1. สร้าง API Service Layer

สร้างไฟล์ `src/services/api.ts` ใน frontend:

```typescript
const API_BASE_URL = 'http://localhost:3089/api';

// User API
export const userAPI = {
  getAll: () => fetch(`${API_BASE_URL}/users`).then(r => r.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/users/${id}`).then(r => r.json()),
  create: (data: any) => 
    fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  update: (id: string, data: any) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  delete: (id: string) =>
    fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }).then(r => r.json())
};

// Sport Type API
export const sportTypeAPI = {
  getAll: () => fetch(`${API_BASE_URL}/sport-types`).then(r => r.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/sport-types/${id}`).then(r => r.json()),
  create: (data: any) =>
    fetch(`${API_BASE_URL}/sport-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
};

// Facility API
export const facilityAPI = {
  getAll: () => fetch(`${API_BASE_URL}/facilities`).then(r => r.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/facilities/${id}`).then(r => r.json()),
  getBySportType: (sportTypeId: string) =>
    fetch(`${API_BASE_URL}/facilities/by-sport/${sportTypeId}`).then(r => r.json())
};

// Reservation API
export const reservationAPI = {
  getAll: () => fetch(`${API_BASE_URL}/reservations`).then(r => r.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/reservations/${id}`).then(r => r.json()),
  create: (data: any) =>
    fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  updateStatus: (id: string, status: string) =>
    fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(r => r.json()),
  getUserReservations: (userId: string) =>
    fetch(`${API_BASE_URL}/reservations/user/${userId}`).then(r => r.json()),
  getFacilityReservations: (facilityId: string, date: string) =>
    fetch(`${API_BASE_URL}/reservations/facility/${facilityId}/date/${date}`).then(r => r.json())
};

// Queue API
export const queueAPI = {
  join: (data: any) =>
    fetch(`${API_BASE_URL}/queues/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  getByReservation: (reservationId: string) =>
    fetch(`${API_BASE_URL}/queues/reservation/${reservationId}`).then(r => r.json()),
  confirm: (queueId: string) =>
    fetch(`${API_BASE_URL}/queues/${queueId}/confirm`, { method: 'PUT' }).then(r => r.json()),
  cancel: (queueId: string) =>
    fetch(`${API_BASE_URL}/queues/${queueId}/cancel`, { method: 'PUT' }).then(r => r.json())
};

// CheckIn API
export const checkinAPI = {
  checkin: (data: any) =>
    fetch(`${API_BASE_URL}/checkins/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  checkout: (checkinId: string) =>
    fetch(`${API_BASE_URL}/checkins/${checkinId}/checkout`, { method: 'PUT' }).then(r => r.json()),
  getTodayByFacility: (facilityId: string) =>
    fetch(`${API_BASE_URL}/checkins/facility/${facilityId}/today`).then(r => r.json())
};

// Cancellation API
export const cancellationAPI = {
  request: (data: any) =>
    fetch(`${API_BASE_URL}/cancellations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  approve: (cancellationId: string, approvedBy: string) =>
    fetch(`${API_BASE_URL}/cancellations/${cancellationId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy })
    }).then(r => r.json()),
  reject: (cancellationId: string, approvedBy: string) =>
    fetch(`${API_BASE_URL}/cancellations/${cancellationId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy })
    }).then(r => r.json()),
  getPending: () =>
    fetch(`${API_BASE_URL}/cancellations/status/pending`).then(r => r.json())
};
```

### 2. สร้าง React Hook สำหรับ API Calls

สร้างไฟล์ `src/hooks/useApi.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useApi<T>(apiCall: () => Promise<{ success: boolean; data: T }>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiCall();
        if (response.success) {
          setData(response.data);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
```

### 3. ตัวอย่าง Component - Show Facilities

```typescript
import React from 'react';
import { facilityAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

export function FacilityList() {
  const { data: response, loading, error } = useApi(() => 
    facilityAPI.getAll()
  );

  const facilities = response?.data || [];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Facilities</h1>
      {facilities.map((facility: any) => (
        <div key={facility._id}>
          <h3>{facility.name}</h3>
          <p>Location: {facility.location}</p>
          <p>Price: {facility.pricePerHour} THB/hour</p>
          <p>Capacity: {facility.maxCapacity}</p>
        </div>
      ))}
    </div>
  );
}
```

### 4. ตัวอย่าง Component - Create Reservation

```typescript
import React, { useState } from 'react';
import { reservationAPI } from '../services/api';

export function CreateReservation({ userId, facilityId, sportTypeId }: any) {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    playerCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await reservationAPI.create({
        userId,
        facilityId,
        sportTypeId,
        ...formData
      });

      if (response.success) {
        setSuccess(true);
        setFormData({ date: '', startTime: '', endTime: '', playerCount: 0 });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />
      <input
        type="time"
        value={formData.startTime}
        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        required
      />
      <input
        type="time"
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        required
      />
      <input
        type="number"
        value={formData.playerCount}
        onChange={(e) => setFormData({ ...formData, playerCount: parseInt(e.target.value) })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Reservation'}
      </button>
      {success && <p>Reservation created successfully!</p>}
    </form>
  );
}
```

### 5. Environment Configuration

สร้าง `.env.local` ใน frontend:

```
VITE_API_URL=http://localhost:3089/api
```

และใช้ใน code:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3089/api';
```

### 6. Error Handling & Interceptor

สร้าง `src/services/apiClient.ts`:

```typescript
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3089/api'}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}
```

---

## 🔗 Connection Points

### User Dashboard
```
GET /users/:id → Load user profile
GET /reservations/user/:userId → Load user's reservations
GET /queues/user/:userId/reservation/:reservationId → Check queue position
```

### Facility Staff Dashboard
```
GET /reservations/facility/:facilityId/date/:date → Today's bookings
GET /checkins/facility/:facilityId/today → Today's check-ins
POST /checkins/checkin → Record check-in
PUT /checkins/:id/checkout → Record check-out
```

### Admin Dashboard
```
GET /users → All users
GET /facilities → All facilities
GET /reservations → All reservations
GET /cancellations/status/pending → Pending cancellations
PUT /cancellations/:id/approve → Approve cancellation
```

### Booking Flow
```
1. GET /facilities → Show available facilities
2. GET /sport-types → Show sport types
3. POST /reservations → Create booking
4. POST /queues/join → Join queue (if applicable)
5. PUT /reservations/:id → Confirm booking
6. POST /checkins/checkin → Check-in day of event
```

---

## 🧪 Testing Integration

```typescript
// Test API connection
async function testConnection() {
  try {
    const response = await fetch('http://localhost:3089/api/health');
    const data = await response.json();
    console.log('✅ API Connected:', data);
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
  }
}

testConnection();
```

---

## ⚠️ CORS Setup (if needed)

Server already has CORS enabled, but if issues occur, update `server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
```

---

## 📱 Ready for Integration!

Frontend is now ready to connect to Backend APIs. Start with:
1. Fetching and displaying data
2. Creating new records
3. Updating status
4. User interactions

---

**Last Updated:** February 22, 2026
