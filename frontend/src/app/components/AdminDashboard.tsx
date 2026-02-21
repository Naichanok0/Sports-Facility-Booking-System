import { useState } from "react";
import { User, SportType, Facility, Booking } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, Settings, BarChart3, CalendarDays, ShieldAlert } from "lucide-react";
import FacilityManagement from "./admin/FacilityManagement";
import SportTypeManagement from "./admin/SportTypeManagement";
import BookingMonitor from "./admin/BookingMonitor";
import UserPenalties from "./admin/UserPenalties";
import ReportsDashboard from "./admin/ReportsDashboard";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("facilities");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-teal-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ระบบจัดการสนามกีฬา - ผู้ดูแลระบบ
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border-2 border-teal-100 p-1">
            <TabsTrigger value="facilities" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              จัดการสนาม
            </TabsTrigger>
            <TabsTrigger value="sports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <CalendarDays className="w-4 h-4 mr-2" />
              ชนิดกีฬา
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <CalendarDays className="w-4 h-4 mr-2" />
              ตรวจสอบการจอง
            </TabsTrigger>
            <TabsTrigger value="penalties" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <ShieldAlert className="w-4 h-4 mr-2" />
              บทลงโทษ
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              รายงาน
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facilities">
            <FacilityManagement />
          </TabsContent>

          <TabsContent value="sports">
            <SportTypeManagement />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingMonitor />
          </TabsContent>

          <TabsContent value="penalties">
            <UserPenalties />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}