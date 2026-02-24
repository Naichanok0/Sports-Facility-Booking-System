import { useState } from "react";
import { User } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, QrCode, Calendar, CheckCircle } from "lucide-react";
import { MobileNav } from "./ui/MobileNav";
import { MobileTabs } from "./ui/MobileTabs";
import CheckInManagement from "./facility-staff/CheckInManagement";
import TodayBookings from "./facility-staff/TodayBookings";
import FacilityStatus from "./facility-staff/FacilityStatus";

interface FacilityStaffDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function FacilityStaffDashboard({
  user,
  onLogout,
}: FacilityStaffDashboardProps) {
  const [activeTab, setActiveTab] = useState("checkin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <MobileNav
        title="ระบบจัดการสนามกีฬา"
        subtitle={`ผู้ดูแลสนาม - ${user.firstName} ${user.lastName}`}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4">
          <MobileTabs
            tabs={[
              { value: "checkin", label: "เช็คอิน", icon: <QrCode className="w-4 h-4" /> },
              { value: "today", label: "การจองวันนี้", icon: <Calendar className="w-4 h-4" /> },
              { value: "facilities", label: "สถานะสนาม", icon: <CheckCircle className="w-4 h-4" /> },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          >
            {activeTab === "checkin" && <CheckInManagement />}
            {activeTab === "today" && <TodayBookings />}
            {activeTab === "facilities" && <FacilityStatus />}
          </MobileTabs>
        </div>
      </div>
    </div>
  );
}