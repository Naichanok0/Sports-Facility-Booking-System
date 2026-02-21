import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UserPlus, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { User } from "../../App";
import BookingWaitingRoom from "./BookingWaitingRoom";

interface JoinBookingPageProps {
  user: User;
  onBack: () => void;
  onJoinSuccess: (bookingCode: string, playerInfo: {
    firstName: string;
    lastName: string;
    studentId: string;
  }) => void;
}

// Mock booking data for demo
const mockBookings = [
  {
    bookingCode: "BK123456",
    facilityName: "สนามฟุตบอล 1",
    sportTypeName: "ฟุตบอล",
    date: "22 กุมภาพันธ์ 2026",
    timeSlot: "14:00 - 16:00",
    requiredPlayers: 10,
  },
  {
    bookingCode: "BK789012",
    facilityName: "สนามบาสเกตบอล A",
    sportTypeName: "บาสเกตบอล",
    date: "22 กุมภาพันธ์ 2026",
    timeSlot: "16:00 - 18:00",
    requiredPlayers: 10,
  },
];

export default function JoinBookingPage({ user, onBack, onJoinSuccess }: JoinBookingPageProps) {
  const [bookingCode, setBookingCode] = useState("");
  const [playerInfo, setPlayerInfo] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
  });
  const [step, setStep] = useState<"code" | "info" | "waiting">("code");
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null);

  const handleCodeSubmit = () => {
    if (!bookingCode.trim()) {
      toast.error("กรุณากรอกรหัสจอง");
      return;
    }

    // Validate booking code format (BK + 6 digits)
    if (!/^BK\d{6}$/.test(bookingCode)) {
      toast.error("รูปแบบรหัสจองไม่ถูกต้อง (ตัวอย่าง: BK123456)");
      return;
    }

    // Find booking
    const booking = mockBookings.find(b => b.bookingCode === bookingCode);
    if (!booking) {
      toast.error("ไม่พบรหัสจองนี้ในระบบ");
      return;
    }

    setSelectedBooking(booking);
    toast.success("พบการจอง! กรุณากรอกข้อมูลของคุณ");
    setStep("info");
  };

  const handleInfoSubmit = () => {
    if (!playerInfo.firstName || !playerInfo.lastName || !playerInfo.studentId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (playerInfo.studentId.length !== 14) {
      toast.error("บาร์โค้ดนิสิตต้องมี 14 หลัก");
      return;
    }

    // Join the waiting room
    setStep("waiting");
    toast.success("เข้าร่วมการจองสำเร็จ!");
  };

  const handleBackToCode = () => {
    setStep("code");
    setSelectedBooking(null);
    setPlayerInfo({ firstName: "", lastName: "", studentId: "" });
  };

  const handleWaitingRoomComplete = () => {
    onJoinSuccess(bookingCode, playerInfo);
  };

  const handleWaitingRoomExpired = () => {
    toast.error("การจองหมดเวลา");
    handleBackToCode();
  };

  // Show waiting room if joined
  if (step === "waiting" && selectedBooking) {
    return (
      <BookingWaitingRoom
        bookingCode={selectedBooking.bookingCode}
        facilityName={selectedBooking.facilityName}
        sportTypeName={selectedBooking.sportTypeName}
        date={selectedBooking.date}
        timeSlot={selectedBooking.timeSlot}
        requiredPlayers={selectedBooking.requiredPlayers}
        currentUser={{
          ...user,
          firstName: playerInfo.firstName,
          lastName: playerInfo.lastName,
          studentId: playerInfo.studentId,
        }}
        onComplete={handleWaitingRoomComplete}
        onExpired={handleWaitingRoomExpired}
        isJoining={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={step === "info" ? () => setStep("code") : onBack}
          variant="outline"
          size="icon"
          className="border-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">เข้าร่วมการจอง</h2>
      </div>

      <div className="max-w-md mx-auto">
        {step === "code" ? (
          <Card className="p-6 border-2 border-teal-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                กรอกรหัสจอง
              </h3>
              <p className="text-sm text-gray-600">
                ใส่รหัสจองที่ได้รับจากเพื่อน
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">รหัสจอง *</Label>
                <Input
                  placeholder="BK123456"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="mt-1 text-center text-2xl font-bold tracking-widest border-teal-200 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  รูปแบบ: BK + ตัวเลข 6 หลัก
                </p>
              </div>

              <Button
                onClick={handleCodeSubmit}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                ค้นหาการจอง
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>💡 วิธีการเข้าร่วม:</strong>
              </p>
              <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                <li>ขอรหัสจองจากเพื่อนที่เป็นผู้จอง</li>
                <li>กรอกรหัสจองในช่องด้านบน</li>
                <li>กรอกข้อมูลส่วนตัวของคุณ</li>
                <li>เข้าร่วมการจองสำเร็จ!</li>
              </ol>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border-2 border-teal-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                กรอกข้อมูลของคุณ
              </h3>
              <p className="text-sm text-gray-600">
                รหัสจอง: <span className="font-bold text-teal-600">{bookingCode}</span>
              </p>
              <p className="text-sm text-gray-600">
                {selectedBooking?.facilityName} • {selectedBooking?.timeSlot}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">ชื่อ *</Label>
                <Input
                  placeholder="ชื่อ"
                  value={playerInfo.firstName}
                  onChange={(e) =>
                    setPlayerInfo({ ...playerInfo, firstName: e.target.value })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label className="text-gray-700">นามสกุล *</Label>
                <Input
                  placeholder="นามสกุล"
                  value={playerInfo.lastName}
                  onChange={(e) =>
                    setPlayerInfo({ ...playerInfo, lastName: e.target.value })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label className="text-gray-700">บาร์โค้ดนิสิต *</Label>
                <Input
                  placeholder="บาร์โค้ดนิสิต 14 หลัก"
                  value={playerInfo.studentId}
                  onChange={(e) =>
                    setPlayerInfo({ ...playerInfo, studentId: e.target.value })
                  }
                  maxLength={14}
                  className="mt-1 border-teal-200 focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleBackToCode}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับ
                </Button>
                <Button
                  onClick={handleInfoSubmit}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  เข้าร่วม
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>⚠️ หมายเหตุ:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>ข้อมูลต้องตรงกับบัตรนิสิตของคุณ</li>
                <li>จำเป็นต้องนำบัตรนิสิตมาแสดงในวันใช้งาน</li>
                <li>การจองมีเวลาจำกัด กรุณารีบกรอกข้อมูล</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
