import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Users,
  Clock,
  MapPin,
  Search,
  LogIn,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { User } from "../../App";
import { waitingRoomAPI } from "../../../services/api";
import BookingWaitingRoom from "./BookingWaitingRoom";

interface WaitingRoom {
  _id: string;
  roomCode: string;
  host: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  facilityId: {
    _id: string;
    name: string;
    location: string;
  };
  sportTypeId: {
    _id: string;
    name: string;
  };
  date: Date;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  players: Array<{
    userId: string;
    firstName: string;
    lastName: string;
  }>;
  status: string;
  expiresAt: Date;
}

interface JoinWaitingRoomPageProps {
  user: User;
}

export default function JoinWaitingRoomPage({ user }: JoinWaitingRoomPageProps) {
  const [searchCode, setSearchCode] = useState("");
  const [rooms, setRooms] = useState<WaitingRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<WaitingRoom | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<WaitingRoom | null>(null);

  // Fetch open waiting rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await waitingRoomAPI.getAll("status=open&limit=20");
        if (response.success && Array.isArray(response.data)) {
          setRooms(response.data);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      toast.error("กรุณากรอกรหัสจอง");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const response = await waitingRoomAPI.getById(searchCode.trim());

      if (response.success && response.data) {
        setSelectedRoom(response.data as WaitingRoom);
        setShowJoinDialog(true);
      } else {
        toast.error("ไม่พบห้องรอ");
      }
    } catch (error: any) {
      console.error("Error searching room:", error);
      toast.error("ไม่พบห้องรอ");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedRoom) return;

    try {
      setIsJoining(true);
      const response = await waitingRoomAPI.join(selectedRoom._id, user.id);

      if (response.success) {
        toast.success("เข้าร่วมการจองสำเร็จ!");
        setJoinedRoom(response.data as WaitingRoom);
        setShowJoinDialog(false);
      } else {
        toast.error(response.message || "ไม่สามารถเข้าร่วมได้");
      }
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าร่วม");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBackFromJoining = () => {
    setJoinedRoom(null);
    setSearchCode("");
    setSelectedRoom(null);
  };

  // If user joined a room, show waiting room
  if (joinedRoom) {
    return (
      <BookingWaitingRoom
        bookingCode={joinedRoom.roomCode}
        facilityId={joinedRoom.facilityId._id}
        facilityName={joinedRoom.facilityId.name}
        sportTypeId={joinedRoom.sportTypeId._id}
        sportTypeName={joinedRoom.sportTypeId.name}
        date={format(new Date(joinedRoom.date), "yyyy-MM-dd")}
        timeSlot={`${joinedRoom.startTime} - ${joinedRoom.endTime}`}
        requiredPlayers={joinedRoom.maxPlayers}
        currentUser={user}
        onComplete={handleBackFromJoining}
        onExpired={handleBackFromJoining}
        isJoining={true}
      />
    );
  }

  const availableRooms = rooms.filter(
    (r) => r.status === "open" && r.players.length < r.maxPlayers
  );
  const fullRooms = rooms.filter((r) => r.status === "full");

  const formatTimeLeft = (expiresAt: Date) => {
    const now = new Date();
    const ms = new Date(expiresAt).getTime() - now.getTime();
    if (ms <= 0) return "หมดเวลา";
    const mins = Math.floor(ms / 60000);
    return `${mins}:${((ms % 60000) / 1000).toFixed(0).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">เข้าร่วมการจอง</h2>

      {/* Search Section */}
      <Card className="p-6 border-2 border-teal-100">
        <h3 className="font-bold text-gray-800 mb-4">ค้นหารหัสจอง</h3>
        <div className="flex gap-2">
          <Input
            placeholder="กรอกรหัสจอง (เช่น WR123456789)"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="border-teal-200 focus:border-teal-500"
            maxLength={20}
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            ค้นหา
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ขอรหัสจองจากผู้จองอื่นที่อื่น
        </p>
      </Card>

      {/* Available Rooms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            ห้องรอเปิดอยู่ ({availableRooms.length})
          </h3>
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            ยังมีที่ว่าง
          </Badge>
        </div>

        {loading && availableRooms.length === 0 ? (
          <Card className="p-6 border-2 border-teal-50">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังโหลด...</span>
            </div>
          </Card>
        ) : availableRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRooms.map((room) => (
              <Card
                key={room._id}
                className="p-4 border-2 border-teal-100 hover:border-teal-500 hover:shadow-lg transition-all"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">
                        {room.facilityId.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {room.sportTypeId.name}
                      </p>
                    </div>
                    <Badge className="bg-teal-500 text-xs">
                      {room.roomCode}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{room.facilityId.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>
                        {format(new Date(room.date), "d MMM yyyy", {
                          locale: th,
                        })}{" "}
                        {room.startTime} - {room.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>
                        {room.players.length}/{room.maxPlayers} คน
                      </span>
                    </div>
                  </div>

                  {/* Host */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">ผู้จอง:</p>
                    <p className="font-medium text-gray-800">
                      {room.host.firstName} {room.host.lastName}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all"
                      style={{
                        width: `${(room.players.length / room.maxPlayers) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowJoinDialog(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                      size="sm"
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      เข้าร่วม
                    </Button>
                    <p className="flex items-center text-xs text-gray-500 px-2">
                      ⏱️ {formatTimeLeft(room.expiresAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 border-2 border-teal-50">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <AlertCircle className="w-5 h-5" />
              <span>ไม่มีห้องรอเปิดในขณะนี้</span>
            </div>
          </Card>
        )}
      </div>

      {/* Full Rooms Section */}
      {fullRooms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">
              ห้องรอเต็มแล้ว ({fullRooms.length})
            </h3>
            <Badge variant="outline" className="border-gray-400 text-gray-600">
              เต็มแล้ว
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fullRooms.map((room) => (
              <Card
                key={room._id}
                className="p-4 border-2 border-gray-200 opacity-50"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">
                        {room.facilityId.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {room.sportTypeId.name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {room.roomCode}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {room.players.length}/{room.maxPlayers} คน
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded">
                    ห้องนี้เต็มแล้ว
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการเข้าร่วม</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="py-4 space-y-4">
              {/* Room Details */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">รายละเอียด</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>สนาม:</strong> {selectedRoom.facilityId.name}
                  </p>
                  <p>
                    <strong>ประเภท:</strong> {selectedRoom.sportTypeId.name}
                  </p>
                  <p>
                    <strong>วันที่:</strong>{" "}
                    {format(new Date(selectedRoom.date), "d MMM yyyy", {
                      locale: th,
                    })}
                  </p>
                  <p>
                    <strong>เวลา:</strong> {selectedRoom.startTime} -{" "}
                    {selectedRoom.endTime}
                  </p>
                  <p>
                    <strong>ผู้จอง:</strong> {selectedRoom.host.firstName}{" "}
                    {selectedRoom.host.lastName}
                  </p>
                </div>
              </div>

              {/* Players */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-2">
                  ผู้เล่นปัจจุบัน ({selectedRoom.players.length}/
                  {selectedRoom.maxPlayers}):
                </p>
                <div className="space-y-2">
                  {selectedRoom.players.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-100 rounded text-sm text-gray-700"
                    >
                      {idx + 1}. {player.firstName} {player.lastName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>⚠️ หมายเหตุ:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>
                    เมื่อเข้าร่วม คุณจะอยู่ในห้องรอสำหรับ{" "}
                    {formatTimeLeft(selectedRoom.expiresAt)} นาที
                  </li>
                  <li>เมื่อครบจำนวนผู้เล่น จะยืนยันการจองอัตโนมัติ</li>
                  <li>กรุณาเช็คอินก่อนเวลาเริ่มใช้งาน 10-15 นาที</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowJoinDialog(false)}
                  variant="outline"
                  className="flex-1 border-gray-300"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังเข้าร่วม...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      ยืนยันเข้าร่วม
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
