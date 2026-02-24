import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
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
import { Calendar } from "../ui/calendar";
import {
  Clock,
  Users,
  MapPin,
  CalendarIcon,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { User } from "../../App";
import { facilityAPI, queueAPI, sportTypeAPI, reservationAPI } from "../../../services/api";

interface StandbyQueue {
  id: string;
  queueNumber: 1 | 2 | 3;
  facilityName: string;
  sportTypeName: string;
  date: string;
  timeSlot: string;
  requiredPlayers: number;
  players: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  }[];
  status: "waiting" | "activated" | "expired";
}

interface Facility {
  _id: string;
  name: string;
  sportTypeId: string;
  sportTypeName: string;
  requiredPlayers: number;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  hasStandbySlots: boolean;
}

interface SportType {
  _id: string;
  name: string;
}

const generateTimeSlots = (): TimeSlot[] => {
  const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const slots: TimeSlot[] = [];

  hours.forEach((hour, index) => {
    if (index < hours.length - 1) {
      slots.push({
        start: hour,
        end: hours[index + 1],
        available: false, // Main slot is full
        hasStandbySlots: false, // Will be set based on actual reservations
      });
    }
  });

  return slots;
};

interface StandbyQueuePageProps {
  user: User;
}

export default function StandbyQueuePage({ user }: StandbyQueuePageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSportType, setSelectedSportType] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableQueue, setAvailableQueue] = useState<1 | 2 | 3 | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // API State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);
  const [myStandbyQueues, setMyStandbyQueues] = useState<StandbyQueue[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch facilities and sport types
        const [facilitiesRes, sportTypesRes, queuesRes] = await Promise.all([
          facilityAPI.getAll(),
          sportTypeAPI.getAll(),
          queueAPI.getAll(),
        ]);

        if (facilitiesRes.success && facilitiesRes.data) {
          const facilitiesData = (facilitiesRes.data as any[]).map((f: any) => ({
            _id: f._id,
            name: f.name,
            sportTypeId: f.sportTypeId,
            sportTypeName: f.sportTypeName,
            requiredPlayers: f.requiredPlayers || 10,
          }));
          setFacilities(facilitiesData);
        }

        if (sportTypesRes.success && sportTypesRes.data) {
          setSportTypes((sportTypesRes.data as any[]) || []);
        }

        if (queuesRes.success && queuesRes.data) {
          const queuesData = (queuesRes.data as any[]).map((q: any) => ({
            id: q._id,
            queueNumber: q.queueNumber,
            facilityName: q.facilityName,
            sportTypeName: q.sportTypeName,
            date: format(new Date(q.date), "d MMMM yyyy", { locale: th }),
            timeSlot: `${q.startTime} - ${q.endTime}`,
            requiredPlayers: q.requiredPlayers,
            players: q.players || [],
            status: q.status,
          }));
          setMyStandbyQueues(queuesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check which slots are full - for standby queue availability
  useEffect(() => {
    const checkFullSlots = async () => {
      if (!selectedFacility) {
        setTimeSlots(generateTimeSlots());
        return;
      }

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const reservationsRes = await reservationAPI.getFacilityReservations(selectedFacility, dateStr);
        
        if (reservationsRes.success && Array.isArray(reservationsRes.data)) {
          // Update time slots based on which ones have reservations (full slots)
          const updatedSlots = generateTimeSlots().map(slot => {
            const hasReservation = (reservationsRes.data as any[]).some((res: any) => {
              return res.startTime === slot.start && res.status !== "cancelled";
            });
            return {
              ...slot,
              available: false, // Standby page shows full slots
              hasStandbySlots: hasReservation, // If reservation exists, standby is available
            };
          });
          
          setTimeSlots(updatedSlots);
        }
      } catch (err: any) {
        console.error("Error checking full slots:", err);
        setTimeSlots(generateTimeSlots());
      }
    };

    checkFullSlots();
  }, [selectedFacility, selectedDate]);

  const filteredFacilities = selectedSportType
    ? facilities.filter((f: any) => f.sportTypeId === selectedSportType)
    : facilities;

  const selectedFacilityData = facilities.find(
    (f: any) => f._id === selectedFacility
  );

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    // Simulate checking available standby queue
    const random = Math.random();
    if (random < 0.33) setAvailableQueue(1);
    else if (random < 0.66) setAvailableQueue(2);
    else setAvailableQueue(3);
  };

  const handleJoinStandbyQueue = () => {
    if (!selectedFacility || !selectedTimeSlot || !availableQueue) {
      toast.error("กรุณาเลือกสนามและช่วงเวลาที่ต้องการ");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmJoinQueue = () => {
    toast.success(
      `เข้าคิวหลุด ${availableQueue} สำเร็จ! คุณจะได้รับการแจ้งเตือนเมื่อคิวของคุณถูกเรียก`
    );
    setShowConfirmDialog(false);
    setSelectedFacility("");
    setSelectedTimeSlot(null);
    setAvailableQueue(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">คิวหลุด (Standby Queue)</h2>
        <p className="text-sm text-gray-600 mt-1">
          เข้าคิวหลุดเพื่อรอรับสิทธิ์จองเมื่อมีการยกเลิกหรือไม่มาใช้งาน
        </p>
      </div>

      {/* My Standby Queues */}
      {myStandbyQueues.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            คิวหลุดของฉัน
          </h3>
          {myStandbyQueues.map((queue) => (
            <Card key={queue.id} className="p-4 border-2 border-orange-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-500">
                      คิวหลุด {queue.queueNumber}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-yellow-300 text-yellow-700"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {queue.status === "waiting" ? "รอเรียก" : queue.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-gray-800">
                    {queue.facilityName} - {queue.sportTypeName}
                  </h4>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p>
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      {queue.date}
                    </p>
                    <p>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {queue.timeSlot}
                    </p>
                    <p>
                      <Users className="w-4 h-4 inline mr-1" />
                      {queue.players.length}/{queue.requiredPlayers} คน
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  ยกเลิกคิว
                </Button>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>💡 หมายเหตุ:</strong> คิวของคุณจะถูกเรียกเมื่อ:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>คิวปกติไม่ครบคนภายใน 10 นาที</li>
                  <li>มีผู้จอง No-show (ไม่มาใช้งาน)</li>
                  <li>มีการยกเลิกการจอง</li>
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Standby Queue Booking */}
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
                {sportTypes.map((sport: any) => (
                  <SelectItem key={sport._id} value={sport._id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Available Slots */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-2 border-teal-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">เลือกสนาม</h3>
              <Badge className="bg-gradient-to-r from-teal-500 to-blue-500">
                {format(selectedDate, "d MMMM yyyy", { locale: th })}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {filteredFacilities.map((facility: any) => (
                <button
                  key={facility._id}
                  onClick={() => setSelectedFacility(facility._id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedFacility === facility._id
                      ? "border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 shadow-md"
                      : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{facility.name}</h4>
                      <p className="text-sm text-gray-600">
                        {facility.sportTypeName}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        ต้องการ {facility.requiredPlayers} คน
                      </p>
                    </div>
                    {selectedFacility === facility._id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedFacility && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  เลือกช่วงเวลา (เฉพาะที่เต็มแล้ว)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots
                    .filter((slot) => !slot.available)
                    .map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={!slot.hasStandbySlots}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedTimeSlot?.start === slot.start
                            ? "border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50"
                            : slot.hasStandbySlots
                            ? "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                            : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                        {slot.hasStandbySlots ? (
                          <p className="text-xs text-orange-600 text-center">
                            มีคิวหลุด
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 text-center">
                            คิวเต็ม
                          </p>
                        )}
                      </button>
                    ))}
                </div>
              </>
            )}

            {selectedFacility && selectedTimeSlot && availableQueue && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
                <h4 className="font-bold text-gray-800 mb-2">
                  ข้อมูลคิวหลุด
                </h4>
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
                  <p className="font-bold text-orange-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    คิวหลุดที่ {availableQueue}
                  </p>
                </div>
                <Button
                  onClick={handleJoinStandbyQueue}
                  className="w-full mt-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  เข้าคิวหลุด
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Explanation Card */}
      <Card className="p-5 border-2 border-blue-100 bg-blue-50">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          ระบบคิวหลุดคืออะไร?
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>คิวหลุด</strong> คือระบบจองสำรองสำหรับช่วงเวลาที่เต็มแล้ว
            ซึ่งมี 3 ลำดับ (คิวหลุด 1, 2, 3)
          </p>
          <div>
            <p className="font-bold mb-2">คิวหลุดจะถูกเรียกใช้เมื่อ:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>การจองปกติไม่ครบคน:</strong> หากการจองปกติไม่สามารถรวบรวมผู้เล่นได้ครบภายใน 10 นาที ระบบจะเปิดให้คิวหลุดถัดไป
              </li>
              <li>
                <strong>No-show:</strong> หากผู้จองไม่มาใช้งานตามเวลาที่กำหนด
                ระบบจะเปิดให้คิวหลุดถัดไป
              </li>
              <li>
                <strong>การยกเลิก:</strong> หากมีการยกเลิกการจอง
                ระบบจะเปิดให้คิวหลุดถัดไป
              </li>
            </ul>
          </div>
          <div className="p-3 bg-yellow-100 border-2 border-yellow-300 rounded">
            <p className="font-bold text-yellow-800">⚠️ ข้อควรระวัง:</p>
            <ul className="list-disc list-inside mt-1 text-yellow-700">
              <li>คิวหลุดจะถูกเรียกตามลำดับ (1 → 2 → 3)</li>
              <li>เมื่อคิวถูกเรียก คุณมีเวลา 10 นาทีในการรวบรวมผู้เล่น</li>
              <li>หากไม่ครบเวลา คิวของคุณจะถูกยกเลิกและเปิดให้คิวถัดไป</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการเข้าคิวหลุด</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-3">รายละเอียด</h4>
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
                <p className="font-bold text-orange-700">
                  <strong>คิวหลุด:</strong> ลำดับที่ {availableQueue}
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>💡 การแจ้งเตือน:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>คุณจะได้รับการแจ้งเตือนทาง SMS/Email</li>
                <li>เมื่อคิวถูกเรียก มีเวลา 10 นาทีในการรวบรวมผู้เล่น</li>
                <li>สามารถยกเลิกคิวได้ตลอดเวลา</li>
              </ul>
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
                onClick={confirmJoinQueue}
                className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                ยืนยันเข้าคิว
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}