import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ScanLine,
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { th } from "date-fns/locale";
import { reservationAPI } from "../../../services/api";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  checkedIn: boolean;
  checkedInAt?: Date;
}

interface Booking {
  id: string;
  bookingCode: string;
  facilityName: string;
  sportTypeName: string;
  date: Date;
  timeSlot: string;
  requiredPlayers: number;
  players: Player[];
  status: "waiting" | "in-progress" | "completed" | "no-show";
  reservationId?: string;
}

export default function CheckInManagement() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [activeDay, setActiveDay] = useState("day1");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  // Fetch reservations on mount
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching reservations...");
        
        const response = await reservationAPI.getAll();
        console.log("✅ API Response:", response);
        
        if (!response.success) {
          console.warn("❌ API returned success=false:", response.message);
          toast.error(`API Error: ${response.message}`);
          setAllBookings([]);
          return;
        }
        
        if (!response.data) {
          console.warn("❌ API returned no data");
          toast.warning("No data returned from server");
          setAllBookings([]);
          return;
        }
        
        if (!Array.isArray(response.data)) {
          console.warn("❌ Response data is not array:", typeof response.data);
          toast.error("Invalid data format from server");
          setAllBookings([]);
          return;
        }
        
        console.log(`📊 Total reservations from API: ${response.data.length}`);
        
        if (response.data.length === 0) {
          console.warn("⚠️  No reservations in database");
          toast.info("ไม่มีข้อมูลการจองในระบบ");
          setAllBookings([]);
          return;
        }
        
        // Reset today to start of day
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const endOfDay3 = addDays(new Date(), 2);
        endOfDay3.setHours(23, 59, 59, 999);
        
        console.log(`📅 Filtering range: ${startOfToday.toISOString()} to ${endOfDay3.toISOString()}`);
        
        // Transform reservations to bookings
        const bookings: Booking[] = response.data
          .filter((res: any) => {
            // Parse the date properly - handle both ISO and local date strings
            let resDate: Date;
            if (typeof res.date === 'string') {
              resDate = new Date(res.date);
            } else {
              resDate = new Date(res.date);
            }
            
            // Convert UTC to local date for comparison
            const localResDate = new Date(resDate.getTime() - resDate.getTimezoneOffset() * 60000);
            localResDate.setHours(0, 0, 0, 0);
            
            const isInRange = localResDate >= startOfToday && localResDate <= endOfDay3;
            console.log(`  📆 ${res._id}: UTC(${resDate.toISOString()}) -> Local(${localResDate.toISOString()}) -> ${isInRange ? '✓ Include' : '✗ Skip'}`);
            
            return isInRange;
          })
          .map((res: any) => {
            const resDate = new Date(res.date);
            const timeSlot = `${res.startTime || "??"} - ${res.endTime || "??"}`;
            
            // Ensure players array exists
            let playersList: Player[] = [];
            
            if (res.players && Array.isArray(res.players) && res.players.length > 0) {
              playersList = res.players.map((p: any, idx: number) => ({
                id: p._id || `player-${idx}`,
                firstName: p.firstName || "Unknown",
                lastName: p.lastName || "User",
                studentId: p.studentId || p.barcode || "",
                checkedIn: false,
                checkedInAt: undefined,
              }));
            } else if (res.userId) {
              playersList = [
                {
                  id: res.userId?._id || res.userId,
                  firstName: res.userId?.firstName || "Unknown",
                  lastName: res.userId?.lastName || "User",
                  studentId: res.userId?.studentId || res.userId?.barcode || "",
                  checkedIn: false,
                  checkedInAt: undefined,
                }
              ];
            }
            
            return {
              id: res._id,
              bookingCode: res.reservationNo || res._id.substring(0, 8),
              facilityName: res.facilityId?.name || "Unknown Facility",
              sportTypeName: res.sportTypeId?.name || "Unknown Sport",
              date: resDate,
              timeSlot: timeSlot,
              requiredPlayers: res.playerCount || playersList.length || 1,
              players: playersList,
              status: (res.status || "waiting") as any,
              reservationId: res._id,
            };
          });

        console.log(`✨ Final bookings count: ${bookings.length}`);
        if (bookings.length > 0) {
          console.log("📋 Sample booking:", bookings[0]);
        }
        
        setAllBookings(bookings);
        
        if (bookings.length === 0) {
          toast.info("ไม่พบข้อมูลการจองในวันนี้");
        }
      } catch (err: any) {
        console.error("❌ Error fetching reservations:", err);
        toast.error(`ข้อผิดพลาด: ${err.message}`);
        setAllBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Get bookings by date
  const getBookingsForDate = (date: Date) => {
    return allBookings.filter((booking) => {
      return format(booking.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
  };

  const day1Bookings = getBookingsForDate(today);
  const day2Bookings = getBookingsForDate(tomorrow);
  const day3Bookings = getBookingsForDate(dayAfterTomorrow);

  const handleScan = (studentId: string) => {
    if (!selectedBooking) return;

    const playerIndex = selectedBooking.players.findIndex(
      (p) => p.studentId === studentId
    );

    if (playerIndex === -1) {
      toast.error("ไม่พบรหัสนิสิตนี้ในรายการจอง");
      return;
    }

    if (selectedBooking.players[playerIndex].checkedIn) {
      toast.error("เช็คอินแล้ว!");
      return;
    }

    // Update check-in status
    const updatedBookings = allBookings.map((booking) => {
      if (booking.id === selectedBooking.id) {
        const updatedPlayers = [...booking.players];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          checkedIn: true,
          checkedInAt: new Date(),
        };
        return { ...booking, players: updatedPlayers };
      }
      return booking;
    });

    setAllBookings(updatedBookings);
    setSelectedBooking({
      ...selectedBooking,
      players: updatedBookings.find((b) => b.id === selectedBooking.id)!.players,
    });
    setScanInput("");
    toast.success(
      `เช็คอินสำเร็จ: ${selectedBooking.players[playerIndex].firstName} ${selectedBooking.players[playerIndex].lastName}`
    );
  };

  const handleManualCheckIn = (playerId: string) => {
    if (!selectedBooking) return;

    const playerIndex = selectedBooking.players.findIndex(
      (p) => p.id === playerId
    );

    if (playerIndex === -1) return;

    const updatedBookings = allBookings.map((booking) => {
      if (booking.id === selectedBooking.id) {
        const updatedPlayers = [...booking.players];
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          checkedIn: !updatedPlayers[playerIndex].checkedIn,
          checkedInAt: updatedPlayers[playerIndex].checkedIn
            ? undefined
            : new Date(),
        };
        return { ...booking, players: updatedPlayers };
      }
      return booking;
    });

    setAllBookings(updatedBookings);
    setSelectedBooking({
      ...selectedBooking,
      players: updatedBookings.find((b) => b.id === selectedBooking.id)!.players,
    });
    
    const player = selectedBooking.players[playerIndex];
    if (!player.checkedIn) {
      toast.success(`เช็คอินสำเร็จ: ${player.firstName} ${player.lastName}`);
    } else {
      toast.info(`ยกเลิกเช็คอิน: ${player.firstName} ${player.lastName}`);
    }
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleBackToList = () => {
    setSelectedBooking(null);
    setScanInput("");
  };

  const renderBookingCard = (booking: Booking) => {
    const checkedInCount = booking.players.filter((p) => p.checkedIn).length;
    const totalPlayers = booking.requiredPlayers;
    const progress = (checkedInCount / totalPlayers) * 100;
    const isComplete = progress === 100;

    return (
      <Card
        className="p-5 border-2 border-teal-100 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => handleSelectBooking(booking)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold px-3 py-1">
                {booking.bookingCode}
              </Badge>
              <Badge variant="outline" className="border-teal-300 text-teal-700 font-medium">
                {booking.sportTypeName}
              </Badge>
            </div>
            <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2 group-hover:text-teal-600 transition-colors">
              <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="truncate">{booking.facilityName}</span>
            </h4>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="font-medium">{booking.timeSlot}</span>
            </p>
          </div>
          
          {/* Status Circle */}
          <div className="text-center shrink-0">
            <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center ${
              isComplete 
                ? "border-green-500 bg-green-50" 
                : "border-teal-500 bg-teal-50"
            }`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isComplete ? "text-green-600" : "text-teal-600"}`}>
                  {checkedInCount}
                </div>
                <div className="text-xs text-gray-600">/{totalPlayers}</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 font-medium">เช็คอินแล้ว</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">ความคืบหน้า</span>
            <span className={`font-bold ${isComplete ? "text-green-600" : "text-teal-600"}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isComplete
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-teal-500 to-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Badge */}
        {isComplete && (
          <div className="mt-4 flex items-center justify-center gap-2 p-2 bg-green-50 border-2 border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-bold text-green-700">เช็คอินครบทุกคนแล้ว</p>
          </div>
        )}
      </Card>
    );
  };

  const renderBookingsList = (bookings: Booking[], date: Date) => {
    if (bookings.length === 0) {
      return (
        <Card className="p-16 border-2 border-dashed border-gray-300 text-center bg-gray-50">
          <CalendarIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">
            ไม่มีการจองในวันนี้
          </h3>
          <p className="text-gray-400 font-medium">
            {format(date, "d MMMM yyyy", { locale: th })}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-teal-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-600" />
              การจองทั้งหมด
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(date, "วันEEEEที่ d MMMM yyyy", { locale: th })}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white text-base px-4 py-2">
            {bookings.length} รายการ
          </Badge>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {bookings.map((booking) => (
            <div key={booking.id}>
              {renderBookingCard(booking)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show booking details if selected
  if (selectedBooking) {
    const checkedInCount = selectedBooking.players.filter((p) => p.checkedIn).length;
    const totalPlayers = selectedBooking.requiredPlayers;
    const allCheckedIn = checkedInCount === totalPlayers && totalPlayers > 0;

    return (
      <div className="space-y-6">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-teal-100">
          <Button
            onClick={handleBackToList}
            variant="outline"
            size="lg"
            className="border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับ
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800">เช็คอินหน้างาน</h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedBooking.facilityName} • {selectedBooking.sportTypeName}
            </p>
          </div>
        </div>

        {/* Booking Info Card */}
        <Card className="p-6 border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-blue-50">
          <div className="flex items-center justify-between gap-6 mb-5">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {selectedBooking.facilityName}
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center gap-2 text-base">
                  <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold">
                    {selectedBooking.bookingCode}
                  </Badge>
                  <span className="text-gray-500">|</span>
                  <Badge variant="outline" className="border-teal-300 text-teal-700 font-medium">
                    {selectedBooking.sportTypeName}
                  </Badge>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-teal-600" />
                  <span className="font-medium">
                    {format(selectedBooking.date, "วันEEEEที่ d MMMM yyyy", { locale: th })}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-lg">{selectedBooking.timeSlot}</span>
                </p>
              </div>
            </div>
            
            {/* Progress Circle Large */}
            <div className="text-center shrink-0">
              <div className={`relative w-32 h-32 rounded-full border-8 flex items-center justify-center shadow-lg ${
                allCheckedIn 
                  ? "border-green-500 bg-green-50" 
                  : "border-teal-500 bg-white"
              }`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${allCheckedIn ? "text-green-600" : "text-teal-600"}`}>
                    {checkedInCount}
                  </div>
                  <div className="text-lg text-gray-600">/{totalPlayers}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-bold">เช็คอินแล้ว</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-bold">ความคืบหน้าการเช็คอิน</span>
              <span className={`font-bold text-lg ${allCheckedIn ? "text-green-600" : "text-teal-600"}`}>
                {Math.round((checkedInCount / totalPlayers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  allCheckedIn
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-teal-500 to-blue-500"
                }`}
                style={{ width: `${(checkedInCount / totalPlayers) * 100}%` }}
              />
            </div>
          </div>

          {/* Complete Status */}
          {allCheckedIn && (
            <div className="mt-5 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-800 text-lg">✅ เช็คอินครบทุกคนแล้ว!</p>
                <p className="text-sm text-green-700">
                  สามารถเริ่มการเล่นได้ทันที
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Scan Input */}
        <Card className="p-6 border-2 border-blue-100 bg-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">สแกนบาร์โค้ดนิสิต</h3>
              <p className="text-sm text-gray-600">กรอกหรือสแกนบาร์โค้ด 14 หลัก</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="บาร์โค้ดนิสิต (14 หลัก)"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && scanInput.length === 14) {
                  handleScan(scanInput);
                }
              }}
              maxLength={14}
              className="flex-1 border-2 border-blue-300 focus:border-blue-500 font-mono text-lg h-12"
            />
            <Button
              onClick={() => scanInput.length === 14 && handleScan(scanInput)}
              disabled={scanInput.length !== 14}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              ตรวจสอบ
            </Button>
          </div>
        </Card>

        {/* Players List */}
        <Card className="p-6 border-2 border-teal-100">
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-teal-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-xl">
                  รายชื่อผู้เล่นทั้งหมด
                </h3>
                <p className="text-sm text-gray-600">
                  จำนวน {selectedBooking.requiredPlayers} คน
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-teal-600">
                {checkedInCount}/{totalPlayers}
              </p>
              <p className="text-xs text-gray-600">เช็คอินแล้ว</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectedBooking.players.map((player, index) => (
              <div
                key={player.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  player.checkedIn
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm"
                    : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Number Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-md ${
                        player.checkedIn
                          ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                          : "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    
                    {/* Player Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-base truncate">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {player.studentId}
                      </p>
                      {player.checkedInAt && (
                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(player.checkedInAt), "HH:mm:ss")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {player.checkedIn ? (
                      <>
                        <Badge className="bg-green-500 text-white px-3 py-1">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          เช็คอินแล้ว
                        </Badge>
                        <Button
                          onClick={() => handleManualCheckIn(player.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="border-orange-400 text-orange-700 px-3 py-1 font-medium">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          รอเช็คอิน
                        </Badge>
                        <Button
                          onClick={() => handleManualCheckIn(player.id)}
                          size="sm"
                          className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-1" />
                          เช็คอิน
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Show bookings list
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">เช็คอินหน้างาน</h2>
        <p className="text-sm text-gray-600 mt-1">
          เลือกวันที่และการจองเพื่อเริ่มเช็คอินผู้เล่น
        </p>
      </div>

      {loading ? (
        <Card className="p-16 border-2 border-dashed border-gray-300 text-center bg-gray-50">
          <Loader2 className="w-20 h-20 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            กำลังโหลดข้อมูล...
          </h3>
          <p className="text-gray-500">
            กรุณารอสักครู่ระหว่างกำลังดึงข้อมูลการจอง
          </p>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Tabs value={activeDay} onValueChange={setActiveDay} className="space-y-6">
            <TabsList className="bg-white border-2 border-teal-100 p-1 grid grid-cols-3">
              <TabsTrigger
                value="day1"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">วันที่ {format(today, "d", { locale: th })}</span>
                  <span className="text-xs">{format(today, "MMM", { locale: th })}</span>
                  <Badge variant="outline" className="mt-1 border-teal-500 text-teal-700">
                    {day1Bookings.length} รายการ
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="day2"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">วันที่ {format(tomorrow, "d", { locale: th })}</span>
                  <span className="text-xs">{format(tomorrow, "MMM", { locale: th })}</span>
                  <Badge variant="outline" className="mt-1 border-teal-500 text-teal-700">
                    {day2Bookings.length} รายการ
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="day3"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">วันที่ {format(dayAfterTomorrow, "d", { locale: th })}</span>
                  <span className="text-xs">{format(dayAfterTomorrow, "MMM", { locale: th })}</span>
                  <Badge variant="outline" className="mt-1 border-teal-500 text-teal-700">
                    {day3Bookings.length} รายการ
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="day1" className="mt-6">
              {renderBookingsList(day1Bookings, today)}
            </TabsContent>

            <TabsContent value="day2" className="mt-6">
              {renderBookingsList(day2Bookings, tomorrow)}
            </TabsContent>

            <TabsContent value="day3" className="mt-6">
              {renderBookingsList(day3Bookings, dayAfterTomorrow)}
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="p-6 border-2 border-blue-100 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-3 text-lg">
                  💡 วิธีใช้งาน
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">1.</span>
                    <span>เลือกวันที่ต้องการดูการจอง (แสดง 3 วัน)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">2.</span>
                    <span>คลิกที่การจองที่ต้องการเช็คอิน</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">3.</span>
                    <span>สแกนบาร์โค้ดนิสิต 14 หลัก หรือกดปุ่มเช็คอินแบบ Manual</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold shrink-0">4.</span>
                    <span>ติดตามสถานะการเช็คอินแบบเรียลไทม์</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
