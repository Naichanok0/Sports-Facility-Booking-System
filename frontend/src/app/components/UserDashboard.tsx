import { useState } from "react";
import { User } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, Calendar, History, User as UserIcon, UserPlus, TrendingUp } from "lucide-react";
import BookingPage from "./user/BookingPage";
import BookingHistory from "./user/BookingHistory";
import ProfilePage from "./user/ProfilePage";
import JoinBookingPage from "./user/JoinBookingPage";
import StandbyQueuePage from "./user/StandbyQueuePage";

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState("booking");

  const handleJoinSuccess = (bookingCode: string, playerInfo: any) => {
    // In real app, this would send data to backend
    console.log("Joined booking:", bookingCode, playerInfo);
    setActiveTab("history");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-teal-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              ระบบจองสนามกีฬา
            </h1>
            <p className="text-sm text-gray-600">
              ยินดีต้อนรับ, {user.firstName} {user.lastName}
            </p>
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
            <TabsTrigger value="booking" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              จองสนาม
            </TabsTrigger>
            <TabsTrigger value="join" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              เข้าร่วมการจอง
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              ประวัติการจอง
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <UserIcon className="w-4 h-4 mr-2" />
              ข้อมูลส่วนตัว
            </TabsTrigger>
            <TabsTrigger value="standby" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              คิวสำรอง
            </TabsTrigger>
          </TabsList>

          <TabsContent value="booking">
            <BookingPage user={user} />
          </TabsContent>

          <TabsContent value="join">
            <JoinBookingPage 
              user={user}
              onBack={() => setActiveTab("booking")} 
              onJoinSuccess={handleJoinSuccess}
            />
          </TabsContent>

          <TabsContent value="history">
            <BookingHistory user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfilePage user={user} />
          </TabsContent>

          <TabsContent value="standby">
            <StandbyQueuePage user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}