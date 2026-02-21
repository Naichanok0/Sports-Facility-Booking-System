import { useState } from "react";
import { User } from "../../App";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar, Clock, X, CheckCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Booking {
  id: string;
  facilityName: string;
  sportType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "no-show" | "completed" | "checked-in";
  checkInTime?: string;
  canCancel: boolean;
  canCheckIn: boolean;
}

const mockBookings: Booking[] = [
  {
    id: "1",
    facilityName: "สนามฟุตบอล 1",
    sportType: "ฟุตบอล",
    date: "2026-02-20",
    startTime: "14:00",
    endTime: "16:00",
    status: "confirmed",
    canCancel: true,
    canCheckIn: false,
  },
  {
    id: "2",
    facilityName: "คอร์ทแบดมินตัน 1",
    sportType: "แบดมินตัน",
    date: "2026-02-19",
    startTime: "10:00",
    endTime: "11:00",
    status: "checked-in",
    checkInTime: "09:55",
    canCancel: false,
    canCheckIn: false,
  },
  {
    id: "3",
    facilityName: "สนามบาสเกตบอล A",
    sportType: "บาสเกตบอล",
    date: "2026-02-18",
    startTime: "16:00",
    endTime: "17:30",
    status: "completed",
    checkInTime: "15:50",
    canCancel: false,
    canCheckIn: false,
  },
  {
    id: "4",
    facilityName: "สนามฟุตบอล 1",
    sportType: "ฟุตบอล",
    date: "2026-02-17",
    startTime: "14:00",
    endTime: "16:00",
    status: "no-show",
    canCancel: false,
    canCheckIn: false,
  },
  {
    id: "5",
    facilityName: "คอร์ทแบดมินตัน 2",
    sportType: "แบดมินตัน",
    date: "2026-02-16",
    startTime: "18:00",
    endTime: "19:00",
    status: "cancelled",
    canCancel: false,
    canCheckIn: false,
  },
];

const statusConfig = {
  confirmed: { label: "จองแล้ว", color: "bg-blue-500" },
  "checked-in": { label: "เช็คอินแล้ว", color: "bg-green-500" },
  completed: { label: "ใช้งานเสร็จสิ้น", color: "bg-gray-500" },
  "no-show": { label: "ไม่มาใช้งาน", color: "bg-red-500" },
  cancelled: { label: "ยกเลิกแล้ว", color: "bg-orange-500" },
};

interface BookingHistoryProps {
  user: User;
}

export default function BookingHistory({ user }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    setBookings(
      bookings.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: "cancelled", canCancel: false } : b
      )
    );
    toast.success("ยกเลิกการจองสำเร็จ");
    setShowCancelDialog(false);
    setSelectedBooking(null);
  };

  const handleCheckIn = () => {
    if (!selectedBooking) return;

    const now = new Date();
    const checkInTime = format(now, "HH:mm");

    setBookings(
      bookings.map((b) =>
        b.id === selectedBooking.id
          ? { ...b, status: "checked-in", checkInTime, canCheckIn: false }
          : b
      )
    );
    toast.success("เช็คอินสำเร็จ! ขอให้สนุกกับการออกกำลังกาย");
    setShowCheckInDialog(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ประวัติการจอง</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] border-teal-200 focus:border-teal-500">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">สถานะทั้งหมด</SelectItem>
            <SelectItem value="confirmed">จองแล้ว</SelectItem>
            <SelectItem value="checked-in">เช็คอินแล้ว</SelectItem>
            <SelectItem value="completed">ใช้งานเสร็จสิ้น</SelectItem>
            <SelectItem value="no-show">ไม่มาใช้งาน</SelectItem>
            <SelectItem value="cancelled">ยกเลิกแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 border-2 border-teal-50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-teal-50 to-blue-50">
                <TableHead>วันที่</TableHead>
                <TableHead>เวลา</TableHead>
                <TableHead>สนาม</TableHead>
                <TableHead>ชนิดกีฬา</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>การกระทำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    ไม่พบประวัติการจอง
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-teal-50/50">
                    <TableCell>
                      {format(new Date(booking.date), "d MMM yyyy", {
                        locale: th,
                      })}
                    </TableCell>
                    <TableCell>
                      {booking.startTime} - {booking.endTime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.facilityName}
                    </TableCell>
                    <TableCell>{booking.sportType}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusConfig[booking.status].color} hover:${statusConfig[booking.status].color}`}
                      >
                        {statusConfig[booking.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking.canCheckIn && (
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCheckInDialog(true);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            เช็คอิน
                          </Button>
                        )}
                        {booking.canCancel && (
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelDialog(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            ยกเลิก
                          </Button>
                        )}
                        {!booking.canCancel && !booking.canCheckIn && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิกการจอง</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedBooking && (
              <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>สนาม:</strong> {selectedBooking.facilityName}
                  </p>
                  <p>
                    <strong>วันที่:</strong>{" "}
                    {format(new Date(selectedBooking.date), "d MMMM yyyy", {
                      locale: th,
                    })}
                  </p>
                  <p>
                    <strong>เวลา:</strong> {selectedBooking.startTime} -{" "}
                    {selectedBooking.endTime}
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant="outline"
                className="flex-1 border-gray-300"
              >
                ไม่ยกเลิก
              </Button>
              <Button
                onClick={handleCancelBooking}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                ยืนยันยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เช็คอินเข้าใช้งานสนาม</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedBooking && (
              <>
                <div className="flex justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-white" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>สนาม:</strong> {selectedBooking.facilityName}
                    </p>
                    <p>
                      <strong>วันที่:</strong>{" "}
                      {format(new Date(selectedBooking.date), "d MMMM yyyy", {
                        locale: th,
                      })}
                    </p>
                    <p>
                      <strong>เวลา:</strong> {selectedBooking.startTime} -{" "}
                      {selectedBooking.endTime}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  สแกน QR Code นี้ที่เครื่องอ่านหน้าสนาม<br />
                  หรือกดปุ่มเพื่อเช็คอินด้วยตนเอง
                </p>

                <Button
                  onClick={handleCheckIn}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ยืนยันเช็คอิน
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
