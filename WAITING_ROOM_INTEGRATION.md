# 🔗 Integration Guide - Waiting Room to Dashboard

## เชื่อมต่อ Waiting Room Pages ในระบบ Dashboard

### 📍 ตำแหน่งที่ต้องเพิ่ม

เปิดไฟล์ `frontend/src/app/components/UserDashboard.tsx` และเพิ่มส่วนต่อไปนี้:

---

## 1️⃣ Import Components

```typescript
import BookingPage from "./user/BookingPage";
import JoinWaitingRoomPage from "./user/JoinWaitingRoomPage";  // NEW
```

---

## 2️⃣ Add State for Tab Navigation

ในส่วน `useState` ของ UserDashboard:

```typescript
const [activeTab, setActiveTab] = useState<
  "dashboard" | "booking" | "join-booking" | "my-bookings" | "profile" | "help"
>("dashboard");
```

---

## 3️⃣ Add Navigation Buttons

ในส่วน UI ที่แสดง tabs/navigation:

```tsx
<div className="flex gap-2 mb-4 flex-wrap">
  <Button
    onClick={() => setActiveTab("dashboard")}
    variant={activeTab === "dashboard" ? "default" : "outline"}
  >
    หน้าแรก
  </Button>
  
  <Button
    onClick={() => setActiveTab("booking")}
    variant={activeTab === "booking" ? "default" : "outline"}
  >
    📅 สร้างการจอง
  </Button>

  <Button
    onClick={() => setActiveTab("join-booking")}
    variant={activeTab === "join-booking" ? "default" : "outline"}
  >
    👥 เข้าร่วมการจอง (NEW)
  </Button>

  <Button
    onClick={() => setActiveTab("my-bookings")}
    variant={activeTab === "my-bookings" ? "default" : "outline"}
  >
    📋 การจองของฉัน
  </Button>

  <Button
    onClick={() => setActiveTab("profile")}
    variant={activeTab === "profile" ? "default" : "outline"}
  >
    👤 โปรไฟล์
  </Button>

  <Button
    onClick={() => setActiveTab("help")}
    variant={activeTab === "help" ? "default" : "outline"}
  >
    ❓ ช่วยเหลือ
  </Button>
</div>
```

---

## 4️⃣ Add Conditional Rendering

ในส่วน return / JSX:

```tsx
{activeTab === "dashboard" && (
  // Existing dashboard content
  <div>แสดงสารสนเทศผู้ใช้</div>
)}

{activeTab === "booking" && (
  <BookingPage user={user} />
)}

{activeTab === "join-booking" && (
  <JoinWaitingRoomPage user={user} />  {/* NEW */}
)}

{activeTab === "my-bookings" && (
  // Existing my bookings content
  <div>แสดงการจองทั้งหมด</div>
)}

{activeTab === "profile" && (
  // Existing profile content
  <div>แสดงโปรไฟล์</div>
)}

{activeTab === "help" && (
  // Existing help content
  <div>แสดงข้อมูลช่วยเหลือ</div>
)}
```

---

## 📋 Complete Example Structure

```tsx
// frontend/src/app/components/UserDashboard.tsx

import React, { useState } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import BookingPage from "./user/BookingPage";
import JoinWaitingRoomPage from "./user/JoinWaitingRoomPage";  // ADD THIS
// ... other imports

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "booking" | "join-booking" | "my-bookings" | "profile" | "help"
  >("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            ยินดีต้อนรับ, {user.firstName}!
          </h1>
          <Button onClick={onLogout} variant="outline">
            ออกจากระบบ
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap bg-white p-4 rounded-lg shadow">
          <Button
            onClick={() => setActiveTab("dashboard")}
            variant={activeTab === "dashboard" ? "default" : "outline"}
          >
            🏠 หน้าแรก
          </Button>

          <Button
            onClick={() => setActiveTab("booking")}
            variant={activeTab === "booking" ? "default" : "outline"}
          >
            📅 สร้างการจอง
          </Button>

          <Button
            onClick={() => setActiveTab("join-booking")}
            variant={activeTab === "join-booking" ? "default" : "outline"}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            👥 เข้าร่วมการจอง
          </Button>

          <Button
            onClick={() => setActiveTab("my-bookings")}
            variant={activeTab === "my-bookings" ? "default" : "outline"}
          >
            📋 การจองของฉัน
          </Button>

          <Button
            onClick={() => setActiveTab("profile")}
            variant={activeTab === "profile" ? "default" : "outline"}
          >
            👤 โปรไฟล์
          </Button>

          <Button
            onClick={() => setActiveTab("help")}
            variant={activeTab === "help" ? "default" : "outline"}
          >
            ❓ ช่วยเหลือ
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Existing dashboard cards */}
            </div>
          )}

          {activeTab === "booking" && <BookingPage user={user} />}

          {activeTab === "join-booking" && <JoinWaitingRoomPage user={user} />}

          {activeTab === "my-bookings" && (
            <div>
              {/* Existing my bookings component */}
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              {/* Existing profile component */}
            </div>
          )}

          {activeTab === "help" && (
            <div>
              {/* Existing help component */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## ✨ Alternative: Sidebar Navigation

ถ้าต้องการเพิ่ม sidebar menu แบบ modern:

```tsx
<div className="flex gap-6">
  {/* Sidebar */}
  <aside className="w-64 bg-white rounded-lg shadow p-4">
    <nav className="space-y-2">
      <NavItem
        icon="🏠"
        label="หน้าแรก"
        active={activeTab === "dashboard"}
        onClick={() => setActiveTab("dashboard")}
      />
      <NavItem
        icon="📅"
        label="สร้างการจอง"
        active={activeTab === "booking"}
        onClick={() => setActiveTab("booking")}
      />
      <NavItem
        icon="👥"
        label="เข้าร่วมการจอง"
        active={activeTab === "join-booking"}
        onClick={() => setActiveTab("join-booking")}
        badge="NEW"
      />
      <NavItem
        icon="📋"
        label="การจองของฉัน"
        active={activeTab === "my-bookings"}
        onClick={() => setActiveTab("my-bookings")}
      />
      <NavItem
        icon="👤"
        label="โปรไฟล์"
        active={activeTab === "profile"}
        onClick={() => setActiveTab("profile")}
      />
      <NavItem
        icon="❓"
        label="ช่วยเหลือ"
        active={activeTab === "help"}
        onClick={() => setActiveTab("help")}
      />
    </nav>
  </aside>

  {/* Main Content */}
  <main className="flex-1">
    {/* Content based on activeTab */}
  </main>
</div>
```

---

## 🎨 Styling Tips

### Badge for "NEW"
```tsx
<span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
  NEW
</span>
```

### Active State Color
```tsx
className={`px-4 py-2 rounded transition-all ${
  activeTab === "join-booking"
    ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
}`}
```

---

## 📱 Mobile Responsive

ถ้า dashboard มีหลายหน้า ให้ใช้ tabs scrollable บน mobile:

```tsx
<div className="overflow-x-auto">
  <div className="flex gap-2 min-w-max">
    {/* Tab buttons */}
  </div>
</div>
```

---

## 🔗 Component Props Reference

### BookingPage
```typescript
interface BookingPageProps {
  user: User;  // Current logged-in user
}
```

### JoinWaitingRoomPage
```typescript
interface JoinWaitingRoomPageProps {
  user: User;  // Current logged-in user
}
```

---

## 🚀 Next Steps

1. ✅ Update `UserDashboard.tsx` with tabs
2. ✅ Test navigation between tabs
3. ✅ Test creating booking in Tab
4. ✅ Test joining booking in Tab
5. ✅ Deploy!

---

## 🧪 Quick Test

```bash
# 1. Server running
node server.js

# 2. Frontend running
cd frontend
npm run dev

# 3. Login as user

# 4. Click "สร้างการจอง" tab
# 5. Create booking

# 6. Click "เข้าร่วมการจอง" tab
# 7. Search or select booking

# 8. Join booking → confirm
```

---

Done! ระบบ Waiting Room พร้อมใช้งาน! 🎉

