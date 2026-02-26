import { useState } from "react";
import { User, SportType, Facility, Booking } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, Settings, BarChart3, CalendarDays, ShieldAlert, Users } from "lucide-react";
import { MobileNav } from "./ui/MobileNav";
import { MobileTabs } from "./ui/MobileTabs";
import FacilityManagement from "./admin/FacilityManagement";
import SportTypeManagement from "./admin/SportTypeManagement";
import BookingMonitor from "./admin/BookingMonitor";
import UserPenalties from "./admin/UserPenalties";
import UserManagement from "./admin/UserManagement";
import ReportsDashboard from "./admin/ReportsDashboard";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("facilities");

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <MobileNav
        title="ระบบจัดการสนามกีฬา"
        subtitle={`ผู้ดูแลระบบ - ${user.firstName} ${user.lastName}`}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4">
          <MobileTabs
            tabs={[
              { value: "facilities", label: "จัดการสนาม", icon: <Settings className="w-4 h-4" /> },
              { value: "sports", label: "ชนิดกีฬา", icon: <CalendarDays className="w-4 h-4" /> },
              { value: "bookings", label: "ตรวจสอบการจอง", icon: <CalendarDays className="w-4 h-4" /> },
              { value: "users", label: "จัดการผู้ใช้", icon: <Users className="w-4 h-4" /> },
              { value: "penalties", label: "บทลงโทษ", icon: <ShieldAlert className="w-4 h-4" /> },
              { value: "reports", label: "รายงาน", icon: <BarChart3 className="w-4 h-4" /> },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          >
            {activeTab === "facilities" && <FacilityManagement />}
            {activeTab === "sports" && <SportTypeManagement />}
            {activeTab === "bookings" && <BookingMonitor />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "penalties" && <UserPenalties />}
            {activeTab === "reports" && <ReportsDashboard />}
          </MobileTabs>
        </div>
      </div>
    </div>
  );
}