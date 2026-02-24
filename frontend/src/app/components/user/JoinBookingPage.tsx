import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UserPlus, ArrowLeft, Search, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { User } from "../../App";
import BookingWaitingRoom from "./BookingWaitingRoom";
import { reservationAPI } from "../../../services/api";

interface JoinBookingPageProps {
  user: User;
  onBack: () => void;
  onJoinSuccess: (bookingCode: string, playerInfo: {
    firstName: string;
    lastName: string;
    studentId: string;
  }) => void;
}

interface AvailableBooking {
  _id: string;
  facilityName: string;
  sportTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredPlayers: number;
  currentPlayers: number;
  availableSlots: number;
  createdBy: string;
}

export default function JoinBookingPage({
  user,
  onBack,
  onJoinSuccess,
}: JoinBookingPageProps) {
  const [bookings, setBookings] = useState<AvailableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState("");
  const [searchingCode, setSearchingCode] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    studentId: user.studentId || "",
  });
  const [step, setStep] = useState<"list" | "info" | "waiting">("list");
  const [selectedBooking, setSelectedBooking] = useState<AvailableBooking | null>(null);

  // Fetch available bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await reservationAPI.getAvailable();
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.error || "Failed to fetch available bookings");
        }

        setBookings(response.data);

        if (response.data.length === 0) {
          toast.info("ยังไม่มีการจองที่รอผู้เข้าร่วม");
        }
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        const errorMsg = err.message || "Failed to load available bookings";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleSelectBooking = (booking: AvailableBooking) => {
    setSelectedBooking(booking);
    setPlayerInfo({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      studentId: user.studentId || "",
    });
    setStep("info");
    toast.success("เลือกการจองสำเร็จ");
  };

  const handleInfoSubmit = () => {
    // Validation
    if (!playerInfo.firstName.trim()) {
      toast.error("กรุณากรอกชื่อจริง");
      return;
    }

    if (!playerInfo.lastName.trim()) {
      toast.error("กรุณากรอกนามสกุล");
      return;
    }

    if (!playerInfo.studentId.trim()) {
      toast.error("กรุณากรอกรหัสนักเรียน");
      return;
    }

    if (!selectedBooking) {
      toast.error("ไม่พบข้อมูลการจอง");
      return;
    }

    // Move to waiting room
    setStep("waiting");
  };

  const handleBackToList = () => {
    setStep("list");
    setSelectedBooking(null);
  };

  const handleSearchByCode = async () => {
    if (!bookingCode.trim()) {
      toast.error("กรุณากรอกรหัสห้อง");
      return;
    }

    try {
      setSearchingCode(true);
      // Try to find booking by code from the available bookings
      // In real app, you'd make an API call to search by code
      const foundBooking = bookings.find(b => 
        b._id.toLowerCase().includes(bookingCode.toLowerCase())
      );

      if (foundBooking) {
        handleSelectBooking(foundBooking);
        setBookingCode("");
        toast.success("พบการจองแล้ว!");
      } else {
        toast.error("ไม่พบรหัสห้องดังกล่าว");
      }
    } catch (err: any) {
      console.error("Error searching by code:", err);
      toast.error("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setSearchingCode(false);
    }
  };

  const handleWaitingRoomComplete = () => {
    if (selectedBooking) {
      toast.success("เข้าร่วมการจองสำเร็จ!");
      onJoinSuccess(selectedBooking._id, playerInfo);
    }
  };

  const handleWaitingRoomExpired = () => {
    toast.error("การจองหมดเวลา");
    handleBackToList();
  };

  // Show waiting room when in waiting step
  if (step === "waiting" && selectedBooking) {
    return (
      <BookingWaitingRoom
        bookingCode={selectedBooking._id}
        facilityId={selectedBooking._id || ""}
        facilityName={selectedBooking.facilityName}
        sportTypeId={selectedBooking._id || ""}
        sportTypeName={selectedBooking.sportTypeName}
        date={selectedBooking.date}
        timeSlot={`${selectedBooking.startTime} - ${selectedBooking.endTime}`}
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
          onClick={step === "info" ? handleBackToList : onBack}
          variant="outline"
          size="icon"
          className="border-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">เข้าร่วมการจอง</h2>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Error Alert */}
        {error && (
          <Card className="p-4 bg-red-50 border-2 border-red-200 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </Card>
        )}

        {step === "list" ? (
          <>
            {/* Header Card */}
            <Card className="p-6 border-2 border-teal-100 mb-6 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  การจองที่รอผู้เข้าร่วม
                </h3>
                <p className="text-sm text-gray-600">
                  เลือกการจองที่คุณต้องการเข้าร่วม
                </p>
              </div>
            </Card>

            {/* Search by Code Section */}
            <Card className="p-6 border-2 border-orange-100 mb-6 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full mb-3">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-800">ใส่รหัสเข้าห้อง</h4>
                <p className="text-xs text-gray-600 mt-1">มีรหัสห้องแล้ว? ใส่รหัสโดยตรง</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="เช่น BK805957"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchByCode()}
                  maxLength={20}
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 font-bold text-center text-lg tracking-wider"
                />
                <Button
                  onClick={handleSearchByCode}
                  disabled={searchingCode || !bookingCode.trim()}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white whitespace-nowrap"
                >
                  {searchingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ค้นหา...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      ค้นหา
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Loading State */}
            {loading ? (
              <Card className="p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              </Card>
            ) : bookings.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">
                  ยังไม่มีการจองที่รอผู้เข้าร่วม
                </p>
                <p className="text-sm text-gray-500 mt-2">ลองเข้ามาใหม่ในภายหลัง</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card
                    key={booking._id}
                    className="p-4 border-2 border-teal-100 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => handleSelectBooking(booking)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800 truncate">
                            {booking.facilityName}
                          </h4>
                          {booking.availableSlots <= 1 && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
                              เหลือน้อย
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.sportTypeName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {booking.date}
                        </p>
                        <p className="text-sm font-semibold text-teal-600 mt-1">
                          🕐 {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-3xl font-bold text-teal-600">
                          {booking.availableSlots}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">ที่ว่าง</p>
                        <p className="text-xs text-gray-500 mt-2">
                          👥 {booking.currentPlayers}/{booking.requiredPlayers}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-6 border-2 border-teal-100">
            {/* Info Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-3">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                ยืนยันข้อมูลของคุณ
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {selectedBooking?.facilityName}
              </p>
              <p className="text-xs text-gray-500">
                {selectedBooking?.startTime} - {selectedBooking?.endTime}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  ชื่อจริง *
                </Label>
                <Input
                  type="text"
                  placeholder="ชื่อจริง"
                  value={playerInfo.firstName}
                  onChange={(e) =>
                    setPlayerInfo({
                      ...playerInfo,
                      firstName: e.target.value,
                    })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  นามสกุล *
                </Label>
                <Input
                  type="text"
                  placeholder="นามสกุล"
                  value={playerInfo.lastName}
                  onChange={(e) =>
                    setPlayerInfo({
                      ...playerInfo,
                      lastName: e.target.value,
                    })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  รหัสนักเรียน *
                </Label>
                <Input
                  type="text"
                  placeholder="เช่น 6710612345"
                  value={playerInfo.studentId}
                  onChange={(e) =>
                    setPlayerInfo({
                      ...playerInfo,
                      studentId: e.target.value,
                    })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500 focus:ring-teal-500 font-mono"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                ✓ สรุปข้อมูลการจอง
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>สถานที่:</strong> {selectedBooking?.facilityName}
                </p>
                <p>
                  <strong>กีฬา:</strong> {selectedBooking?.sportTypeName}
                </p>
                <p>
                  <strong>วันที่:</strong> {selectedBooking?.date}
                </p>
                <p>
                  <strong>เวลา:</strong> {selectedBooking?.startTime} -{" "}
                  {selectedBooking?.endTime}
                </p>
                <p>
                  <strong>จำนวนผู้เล่น:</strong> {selectedBooking?.requiredPlayers}{" "}
                  คน
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับไปเลือก
              </Button>
              <Button
                onClick={handleInfoSubmit}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                ยืนยันการเข้าร่วม
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
