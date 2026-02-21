import { useState } from "react";
import { User } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, QrCode, Calendar, CheckCircle } from "lucide-react";
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
      <header className="bg-white shadow-md border-b-2 border-teal-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ระบบจัดการสนามกีฬา - ผู้ดูแลสนาม
            </h1>
            <p className="text-sm text-gray-600">ยินดีต้อนรับ, {user.firstName} {user.lastName}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="bg-white border-2 border-teal-100 p-1">
            <TabsTrigger
              value="checkin"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <QrCode className="w-4 h-4 mr-2" />
              เช็คอิน
            </TabsTrigger>
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              การจองวันนี้
            </TabsTrigger>
            <TabsTrigger
              value="facilities"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              สถานะสนาม
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin">
            <CheckInManagement />
          </TabsContent>

          <TabsContent value="today">
            <TodayBookings />
          </TabsContent>

          <TabsContent value="facilities">
            <FacilityStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}