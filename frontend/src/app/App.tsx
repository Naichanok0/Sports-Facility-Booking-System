import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import FacilityStaffDashboard from "./components/FacilityStaffDashboard";

export interface User {
  id: string;
  barcode: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  faculty: string;
  role: "admin" | "user" | "facility-staff";
  isBanned: boolean;
  bannedUntil?: Date;
  noShowCount?: number;
  password?: string; // For demo only, should be hashed in production
}

export interface SportType {
  id: string;
  name: string;
  duration: number; // minutes per session
  minPlayers: number;
  checkInWindow: number; // minutes before session starts
  cancelWindow: number; // hours before session starts
  description: string;
}

export interface Facility {
  id: string;
  name: string;
  sportTypeId: string;
  status: "available" | "maintenance";
  description: string;
  capacity: number;
  location: string;
}

export interface Booking {
  id: string;
  facilityId: string;
  facilityName?: string;
  userId: string;
  userName?: string;
  userBarcode?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "no-show" | "completed" | "checked-in";
  checkInTime?: string;
  createdAt: Date;
  cancelledAt?: Date;
  playerCount?: number;
}

export interface CheckIn {
  id: string;
  bookingId: string;
  userId: string;
  checkInTime: Date;
  method: "barcode" | "manual";
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {!currentUser ? (
        <LoginPage onLogin={setCurrentUser} />
      ) : currentUser.role === "admin" ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === "facility-staff" ? (
        <FacilityStaffDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={currentUser} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}