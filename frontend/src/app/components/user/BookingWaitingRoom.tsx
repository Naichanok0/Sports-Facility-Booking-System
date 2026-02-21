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
  Copy, 
  Check, 
  UserPlus, 
  AlertCircle,
  CheckCircle2,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { User } from "../../App";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  joinedAt: Date;
}

interface BookingWaitingRoomProps {
  bookingCode: string;
  facilityName: string;
  sportTypeName: string;
  date: string;
  timeSlot: string;
  requiredPlayers: number;
  currentUser: User;
  onComplete: () => void;
  onExpired: () => void;
  isJoining?: boolean; // New prop to indicate if user is joining (not creator)
}

export default function BookingWaitingRoom({
  bookingCode,
  facilityName,
  sportTypeName,
  date,
  timeSlot,
  requiredPlayers,
  currentUser,
  onComplete,
  onExpired,
  isJoining = false,
}: BookingWaitingRoomProps) {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      studentId: currentUser.studentId,
      joinedAt: new Date(),
    },
  ]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [joinForm, setJoinForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
  });

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpired]);

  // Auto-confirm when players are full
  useEffect(() => {
    if (players.length === requiredPlayers) {
      // Delay a bit to show full status before confirming
      const timer = setTimeout(() => {
        setShowConfirmDialog(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [players.length, requiredPlayers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyBookingCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    toast.success("คัดลอกรหัสจองแล้ว!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareBookingLink = () => {
    const message = `🏀 มาเล่น${sportTypeName}กันเถอะ!\n\n` +
      `📍 สนาม: ${facilityName}\n` +
      `📅 วันที่: ${date}\n` +
      `⏰ เวลา: ${timeSlot}\n` +
      `👥 ต้องการ: ${requiredPlayers} คน (เหลืออีก ${requiredPlayers - players.length} คน)\n\n` +
      `รหัสจอง: ${bookingCode}\n` +
      `⏱️ รีบเข้าร่วมด่วน! เหลือเวลาอีก ${formatTime(timeLeft)} นาที`;

    if (navigator.share) {
      navigator.share({
        title: "เชิญเข้าร่วมจองสนามกีฬา",
        text: message,
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(message);
        toast.success("คัดลอกข้อความแล้ว!");
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success("คัดลอกข้อความแล้ว!");
    }
  };

  const handleJoinSubmit = () => {
    if (!joinForm.firstName || !joinForm.lastName || !joinForm.studentId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (joinForm.studentId.length !== 14) {
      toast.error("บาร์โค้ดนิสิตต้องมี 14 หลัก");
      return;
    }

    // Check duplicate student ID
    if (players.some((p) => p.studentId === joinForm.studentId)) {
      toast.error("รหัสนิสิตนี้ได้เข้าร่วมแล้ว");
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      firstName: joinForm.firstName,
      lastName: joinForm.lastName,
      studentId: joinForm.studentId,
      joinedAt: new Date(),
    };

    setPlayers([...players, newPlayer]);
    setShowJoinDialog(false);
    setJoinForm({ firstName: "", lastName: "", studentId: "" });
    toast.success(`เพิ่ม ${joinForm.firstName} ${joinForm.lastName} เข้าร่วมแล้ว!`);
  };

  const handleConfirmBooking = () => {
    toast.success("ยืนยันการจองสำเร็จ! กรุณาเช็คอินก่อนเวลาเริ่มใช้งาน 10-15 นาที");
    onComplete();
  };

  const progress = (players.length / requiredPlayers) * 100;
  const isUrgent = timeLeft < 300; // Less than 5 minutes
  const isFull = players.length === requiredPlayers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">ห้องรอการจอง</h2>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
          isUrgent 
            ? "bg-red-100 text-red-700 animate-pulse" 
            : "bg-blue-100 text-blue-700"
        }`}>
          <Clock className="w-5 h-5" />
          <span className="text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Info & Share */}
        <div className="lg:col-span-1 space-y-4">
          {/* Booking Details */}
          <Card className="p-5 border-2 border-teal-100">
            <h3 className="font-bold text-gray-800 mb-3">รายละเอียดการจอง</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>สนาม:</strong> {facilityName}
              </p>
              <p>
                <strong>ประเภท:</strong> {sportTypeName}
              </p>
              <p>
                <strong>วันที่:</strong> {date}
              </p>
              <p>
                <strong>เวลา:</strong> {timeSlot}
              </p>
            </div>
          </Card>

          {/* Booking Code */}
          <Card className="p-5 border-2 border-teal-100">
            <h3 className="font-bold text-gray-800 mb-3">รหัสจอง</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200">
                <p className="text-2xl font-bold text-center text-teal-700 tracking-wider">
                  {bookingCode}
                </p>
              </div>
              <Button
                onClick={copyBookingCode}
                variant="outline"
                size="icon"
                className="border-teal-300"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={shareBookingLink}
              className="w-full mt-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              แชร์ลิงค์เชิญเพื่อน
            </Button>
          </Card>

          {/* Add Player Button */}
          <Button
            onClick={() => setShowJoinDialog(true)}
            variant="outline"
            className="w-full border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            disabled={isFull}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            เพิ่มผู้เล่น (Demo)
          </Button>
        </div>

        {/* Right Column - Players List */}
        <div className="lg:col-span-2">
          <Card className="p-5 border-2 border-teal-50">
            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">
                  รายชื่อผู้เล่น ({players.length}/{requiredPlayers})
                </h3>
                {isFull ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    ครบแล้ว!
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    เหลืออีก {requiredPlayers - players.length} คน
                  </Badge>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFull 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                      : "bg-gradient-to-r from-teal-500 to-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-100 animate-in slide-in-from-bottom-4 duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {player.studentId}
                    </p>
                    {index === 0 && (
                      <Badge className="mt-1 bg-teal-500 text-xs">
                        ผู้จอง
                      </Badge>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: requiredPlayers - players.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg mr-3 shrink-0">
                    {players.length + index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-400">รอผู้เล่น...</p>
                    <p className="text-sm text-gray-400">ยังไม่มีผู้เข้าร่วม</p>
                  </div>
                  <Users className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>

            {/* Warning Message */}
            {!isFull && (
              <div className={`mt-5 p-4 rounded-lg border-2 ${
                isUrgent
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <p className="text-sm text-gray-700">
                  <strong>⚠️ หมายเหตุ:</strong>
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>แชร์รหัสจองให้เพื่อนๆ เข้าร่วมภายใน {formatTime(timeLeft)} นาที</li>
                  <li>หากไม่ครบ {requiredPlayers} คนภายในเวลา การจองจะถูกยกเลิก</li>
                  <li>เมื่อครบจำนวนแล้วจะยืนยันการจองอัตโนมัติ</li>
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เข้าร่วมการจอง</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>รหัสจอง:</strong> {bookingCode}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>สนาม:</strong> {facilityName}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-gray-700">ชื่อ *</Label>
                <Input
                  placeholder="ชื่อ"
                  value={joinForm.firstName}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, firstName: e.target.value })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label className="text-gray-700">นามสกุล *</Label>
                <Input
                  placeholder="นามสกุล"
                  value={joinForm.lastName}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, lastName: e.target.value })
                  }
                  className="mt-1 border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label className="text-gray-700">บาร์โค้ดนิสิต *</Label>
                <Input
                  placeholder="บาร์โค้ดนิสิต 14 หลัก"
                  value={joinForm.studentId}
                  onChange={(e) =>
                    setJoinForm({ ...joinForm, studentId: e.target.value })
                  }
                  maxLength={14}
                  className="mt-1 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowJoinDialog(false)}
                variant="outline"
                className="flex-1 border-gray-300"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleJoinSubmit}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                เข้าร่วม
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Full Booking Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ครบจำนวนแล้ว! ยืนยันการจอง</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                รวบรวมผู้เล่นครบแล้ว!
              </h3>
              <p className="text-sm text-gray-600 text-center">
                มีผู้เล่นครบ {requiredPlayers} คนแล้ว<br />
                พร้อมยืนยันการจองหรือไม่?
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>⚠️ หมายเหตุ:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>กรุณาเช็คอินก่อนเวลาเริ่มใช้งาน 10-15 นาที</li>
                <li>ผู้เล่นทุกคนต้องนำบัตรนิสิตมาแสดง</li>
                <li>หากไม่มาใช้งานจะมีบทลงโทษ</li>
              </ul>
            </div>

            <Button
              onClick={handleConfirmBooking}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              ยืนยันการจอง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}