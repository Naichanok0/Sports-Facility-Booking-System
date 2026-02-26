import { useState } from "react";
import { User } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { LogOut, Calendar, History, User as UserIcon, UserPlus, TrendingUp } from "lucide-react";
import { MobileNav } from "./ui/MobileNav";
import { MobileTabs } from "./ui/MobileTabs";
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <MobileNav
        title="ระบบจองสนามกีฬา"
        subtitle={`ยินดีต้อนรับ, ${user.firstName} ${user.lastName}`}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4">
          <MobileTabs
            tabs={[
              { value: "booking", label: "จองสนาม", icon: <Calendar className="w-4 h-4" /> },
              { value: "join", label: "เข้าร่วมการจอง", icon: <UserPlus className="w-4 h-4" /> },
              { value: "history", label: "ประวัติการจอง", icon: <History className="w-4 h-4" /> },
              { value: "profile", label: "ข้อมูลส่วนตัว", icon: <UserIcon className="w-4 h-4" /> },
              { value: "standby", label: "คิวสำรอง", icon: <TrendingUp className="w-4 h-4" /> },
            ]}
            value={activeTab}
            onValueChange={setActiveTab}
          >
            {activeTab === "booking" && <BookingPage user={user} />}
            {activeTab === "join" && (
              <JoinBookingPage 
                user={user}
                onBack={() => setActiveTab("booking")} 
                onJoinSuccess={handleJoinSuccess}
              />
            )}
            {activeTab === "history" && <BookingHistory user={user} />}
            {activeTab === "profile" && <ProfilePage user={user} />}
            {activeTab === "standby" && <StandbyQueuePage user={user} />}
          </MobileTabs>
        </div>
      </div>
    </div>
  );
}