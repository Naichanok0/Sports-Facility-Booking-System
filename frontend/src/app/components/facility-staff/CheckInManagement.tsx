import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ScanLine,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { checkinAPI, facilityAPI } from "../../../services/api";

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
  timeSlot: string;
  requiredPlayers: number;
  players: Player[];
  status: "waiting" | "in-progress" | "completed" | "no-show";
}

export default function CheckInManagement() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const response = await facilityAPI.getAll();
        if (response.success && response.data && Array.isArray(response.data)) {
          setFacilities(response.data);
          // Set first facility as default
          if (response.data.length > 0) {
            setSelectedFacility(response.data[0]._id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching facilities:", err);
        toast.error("ไม่สามารถโหลดสนามกีฬาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  // Fetch check-ins for selected facility
  useEffect(() => {
    const fetchCheckIns = async () => {
      if (!selectedFacility) return;
      try {
        const response = await checkinAPI.getTodayByFacility(selectedFacility);
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform check-in data to booking format
          const transformedBookings: Booking[] = (response.data || []).map((checkin: any) => ({
            id: checkin.reservationId,
            bookingCode: checkin._id,
            facilityName: selectedFacility,
            sportTypeName: checkin.sportType,
            timeSlot: `${checkin.startTime} - ${checkin.endTime}`,
            requiredPlayers: 1,
            players: [
              {
                id: checkin.userId,
                firstName: checkin.firstName || "Unknown",
                lastName: checkin.lastName || "User",
                studentId: checkin.studentId || "",
                checkedIn: checkin.checkedIn || false,
                checkedInAt: checkin.checkInTime,
              },
            ],
            status: (checkin.checkedIn ? "in-progress" : "waiting") as "waiting" | "in-progress" | "completed" | "no-show",
          }));
          setBookings(transformedBookings);
        }
      } catch (err: any) {
        console.error("Error fetching check-ins:", err);
      }
    };

    fetchCheckIns();
  }, [selectedFacility]);

  const selectedBooking = bookings.find(
    (b) => b.facilityName === selectedFacility
  );

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
    const updatedBookings = bookings.map((booking) => {
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

    setBookings(updatedBookings);
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

    const updatedBookings = bookings.map((booking) => {
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

    setBookings(updatedBookings);
    
    const player = selectedBooking.players[playerIndex];
    if (!player.checkedIn) {
      toast.success(`เช็คอินสำเร็จ: ${player.firstName} ${player.lastName}`);
    } else {
      toast.info(`ยกเลิกเช็คอิน: ${player.firstName} ${player.lastName}`);
    }
  };

  const checkedInCount = selectedBooking?.players.filter((p) => p.checkedIn).length || 0;
  const totalPlayers = selectedBooking?.requiredPlayers || 0;
  const allCheckedIn = checkedInCount === totalPlayers && totalPlayers > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">เช็คอินหน้างาน</h2>

      {/* Facility Selection */}
      <Card className="p-5 border-2 border-teal-50">
        <Label className="text-gray-700 font-medium mb-2 block">
          เลือกสนามกีฬา
        </Label>
        <Select value={selectedFacility} onValueChange={setSelectedFacility}>
          <SelectTrigger className="border-teal-200 focus:border-teal-500">
            <SelectValue placeholder="กรุณาเลือกสนาม..." />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((facility: any) => (
              <SelectItem key={facility._id} value={facility._id || ""}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedBooking ? (
        <>
          {/* Booking Info */}
          <Card className="p-5 border-2 border-teal-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedBooking.facilityName}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedBooking.sportTypeName} • {selectedBooking.timeSlot}
                </p>
                <p className="text-sm text-gray-600">
                  รหัสจอง: <span className="font-bold text-teal-600">{selectedBooking.bookingCode}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-teal-600">
                  {checkedInCount}/{totalPlayers}
                </div>
                <p className="text-sm text-gray-600">เช็คอินแล้ว</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  allCheckedIn
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-teal-500 to-blue-500"
                }`}
                style={{ width: `${(checkedInCount / totalPlayers) * 100}%` }}
              />
            </div>

            {allCheckedIn && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">เช็คอินครบทุกคนแล้ว!</p>
                  <p className="text-sm text-green-700">
                    สามารถเริ่มการเล่นได้ทันที
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Scan Input */}
          <Card className="p-5 border-2 border-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <ScanLine className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">สแกนบาร์โค้ดนิสิต</h3>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="กรอกหรือสแกนบาร์โค้ดนิสิต (14 หลัก)"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && scanInput.length === 14) {
                    handleScan(scanInput);
                  }
                }}
                maxLength={14}
                className="flex-1 border-blue-200 focus:border-blue-500 font-mono text-lg"
              />
              <Button
                onClick={() => scanInput.length === 14 && handleScan(scanInput)}
                disabled={scanInput.length !== 14}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                ตรวจสอบ
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 ให้นิสิตนำบัตรนิสิตมาสแกนหรือกรอกบาร์โค้ด 14 หลัก
            </p>
          </Card>

          {/* Players List */}
          <Card className="p-5 border-2 border-teal-50">
            <h3 className="font-bold text-gray-800 mb-4">
              รายชื่อผู้เล่นทั้งหมด ({selectedBooking.requiredPlayers} คน)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedBooking.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    player.checkedIn
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          player.checkedIn
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-sm text-gray-600 font-mono">
                          {player.studentId}
                        </p>
                        {player.checkedInAt && (
                          <p className="text-xs text-green-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(player.checkedInAt).toLocaleTimeString("th-TH")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {player.checkedIn ? (
                        <>
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            เช็คอินแล้ว
                          </Badge>
                          <Button
                            onClick={() => handleManualCheckIn(player.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            รอเช็คอิน
                          </Badge>
                          <Button
                            onClick={() => handleManualCheckIn(player.id)}
                            size="sm"
                            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 border-2 border-dashed border-gray-300 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            กรุณาเลือกสนามกีฬา
          </h3>
          <p className="text-gray-500">
            เลือกสนามที่ต้องการเช็คอินผู้เล่นจากด้านบน
          </p>
        </Card>
      )}
    </div>
  );
}
