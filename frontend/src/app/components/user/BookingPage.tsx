import { useState } from "react";
import { User } from "../../App";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CalendarIcon, Clock, Users, MapPin, CheckCircle, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import BookingWaitingRoom from "./BookingWaitingRoom";

interface Facility {
  id: string;
  name: string;
  sportTypeId: string;
  sportTypeName: string;
  status: "available" | "maintenance";
  requiredPlayers: number;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

const mockFacilities: Facility[] = [
  {
    id: "1",
    name: "สนามฟุตบอล 1",
    sportTypeId: "1",
    sportTypeName: "ฟุตบอล",
    status: "available",
    requiredPlayers: 10,
  },
  {
    id: "2",
    name: "สนามบาสเกตบอล A",
    sportTypeId: "2",
    sportTypeName: "บาสเกตบอล",
    status: "available",
    requiredPlayers: 10,
  },
  {
    id: "3",
    name: "คอร์ทแบดมินตัน 1",
    sportTypeId: "3",
    sportTypeName: "แบดมินตัน",
    status: "available",
    requiredPlayers: 4,
  },
  {
    id: "4",
    name: "คอร์ทแบดมินตัน 2",
    sportTypeId: "3",
    sportTypeName: "แบดมินตัน",
    status: "available",
    requiredPlayers: 4,
  },
];

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  
  hours.forEach((hour, index) => {
    if (index < hours.length - 1) {
      slots.push({
        start: hour,
        end: hours[index + 1],
        available: Math.random() > 0.3,
      });
    }
  });
  
  return slots;
};

interface BookingPageProps {
  user: User;
}

export default function BookingPage({ user }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSportType, setSelectedSportType] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeBooking, setActiveBooking] = useState<{
    bookingCode: string;
    facilityName: string;
    sportTypeName: string;
    date: string;
    timeSlot: string;
    requiredPlayers: number;
  } | null>(null);

  const filteredFacilities = selectedSportType
    ? mockFacilities.filter(
        (f) => f.sportTypeId === selectedSportType && f.status === "available"
      )
    : mockFacilities.filter((f) => f.status === "available");

  const sportTypes = [
    { id: "1", name: "ฟุตบอล" },
    { id: "2", name: "บาสเกตบอล" },
    { id: "3", name: "แบดมินตัน" },
  ];

  const selectedFacilityData = mockFacilities.find(
    (f) => f.id === selectedFacility
  );

  const handleBooking = () => {
    if (!selectedFacility || !selectedTimeSlot) {
      toast.error("กรุณาเลือกสนามและช่วงเวลาที่ต้องการจอง");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmBooking = () => {
    // Generate booking code
    const bookingCode = `BK${Date.now().toString().slice(-6)}`;
    
    setActiveBooking({
      bookingCode,
      facilityName: selectedFacilityData!.name,
      sportTypeName: selectedFacilityData!.sportTypeName,
      date: format(selectedDate, "d MMMM yyyy", { locale: th }),
      timeSlot: `${selectedTimeSlot!.start} - ${selectedTimeSlot!.end}`,
      requiredPlayers: selectedFacilityData!.requiredPlayers,
    });

    setShowConfirmDialog(false);
    toast.success("สร้างการจองสำเร็จ! กรุณาแชร์รหัสจองให้เพื่อนๆ เข้าร่วม");
  };

  const handleBookingComplete = () => {
    // Reset form
    setActiveBooking(null);
    setSelectedFacility("");
    setSelectedTimeSlot(null);
  };

  const handleBookingExpired = () => {
    toast.error("การจองหมดเวลา กรุณาจองใหม่อีกครั้ง");
    setActiveBooking(null);
    setSelectedFacility("");
    setSelectedTimeSlot(null);
  };

  // If there's an active booking, show waiting room
  if (activeBooking) {
    return (
      <BookingWaitingRoom
        bookingCode={activeBooking.bookingCode}
        facilityName={activeBooking.facilityName}
        sportTypeName={activeBooking.sportTypeName}
        date={activeBooking.date}
        timeSlot={activeBooking.timeSlot}
        requiredPlayers={activeBooking.requiredPlayers}
        currentUser={user}
        onComplete={handleBookingComplete}
        onExpired={handleBookingExpired}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">จองสนามกีฬา</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date and Facility Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 border-2 border-teal-50">
            <Label className="text-gray-700 font-medium mb-2 block">
              เลือกวันที่
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const maxDate = new Date(today);
                maxDate.setDate(maxDate.getDate() + 2);
                return date < today || date > maxDate;
              }}
              className="rounded-md border-2 border-teal-100"
            />
          </Card>

          <Card className="p-4 border-2 border-teal-50">
            <Label className="text-gray-700 font-medium mb-2 block">
              กรองตามชนิดกีฬา
            </Label>
            <Select value={selectedSportType} onValueChange={setSelectedSportType}>
              <SelectTrigger className="border-teal-200 focus:border-teal-500">
                <SelectValue placeholder="ทุกชนิดกีฬา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกชนิดกีฬา</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Available Facilities and Time Slots */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-2 border-teal-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">เลือกสนาม</h3>
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-500">
                {format(selectedDate, "d MMMM yyyy", { locale: th })}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {filteredFacilities.map((facility) => (
                <button
                  key={facility.id}
                  onClick={() => setSelectedFacility(facility.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedFacility === facility.id
                      ? "border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 shadow-md"
                      : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {facility.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {facility.sportTypeName}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        ต้องการ {facility.requiredPlayers} คน
                      </p>
                    </div>
                    {selectedFacility === facility.id && (
                      <CheckCircle className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedFacility && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  เลือกช่วงเวลา
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && setSelectedTimeSlot(slot)}
                      disabled={!slot.available}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedTimeSlot?.start === slot.start
                          ? "border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50"
                          : slot.available
                          ? "border-gray-200 hover:border-teal-300 hover:bg-teal-50/30"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      {!slot.available && (
                        <p className="text-xs text-red-500 mt-1 text-center">
                          เต็มแล้ว
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedFacility && selectedTimeSlot && (
              <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-100">
                <h4 className="font-bold text-gray-800 mb-2">สรุปการจอง</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {selectedFacilityData?.name}
                  </p>
                  <p>
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    {format(selectedDate, "d MMMM yyyy", { locale: th })}
                  </p>
                  <p>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {selectedTimeSlot.start} - {selectedTimeSlot.end}
                  </p>
                  <p>
                    <Users className="w-4 h-4 inline mr-1" />
                    จำนวนผู้เล่น: {selectedFacilityData?.requiredPlayers} คน
                  </p>
                </div>
                <Button
                  onClick={handleBooking}
                  className="w-full mt-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  สร้างการจอง
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการสร้างการจอง</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-3">รายละเอียดการจอง</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>สนาม:</strong> {selectedFacilityData?.name}
                </p>
                <p>
                  <strong>วันที่:</strong>{" "}
                  {format(selectedDate, "d MMMM yyyy", { locale: th })}
                </p>
                <p>
                  <strong>เวลา:</strong> {selectedTimeSlot?.start} -{" "}
                  {selectedTimeSlot?.end}
                </p>
                <p>
                  <strong>ต้องการผู้เล่น:</strong> {selectedFacilityData?.requiredPlayers} คน
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>💡 วิธีการจอง:</strong>
              </p>
              <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                <li>คุณจะเป็นผู้เล่นคนที่ 1 (ผู้จอง)</li>
                <li>ระบบจะสร้างรหัสจองให้คุณ</li>
                <li>แชร์รหัสจองให้เพื่อนๆ เข้าร่วม</li>
                <li>มีเวลา 10 นาที ในการรวบรวมผู้เล่นให้ครบ</li>
                <li>หากไม่ครบภายในเวลา การจองจะถูกยกเลิก</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                className="flex-1 border-gray-300"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={confirmBooking}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                สร้างการจอง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}