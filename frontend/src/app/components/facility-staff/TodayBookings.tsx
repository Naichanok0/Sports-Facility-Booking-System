import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { reservationAPI } from "../../../services/api";
import { toast } from "sonner";

interface Booking {
  id: string;
  facilityName: string;
  userName: string;
  userBarcode: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "checked-in" | "completed" | "no-show";
  checkInTime?: string;
}

const statusConfig = {
  confirmed: { label: "รอเช็คอิน", color: "bg-blue-500" },
  "checked-in": { label: "เช็คอินแล้ว", color: "bg-green-500" },
  completed: { label: "เสร็จสิ้น", color: "bg-gray-500" },
  "no-show": { label: "ไม่มา", color: "bg-red-500" },
};

export default function TodayBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await reservationAPI.getAll();
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.error || "Failed to fetch bookings");
        }

        // Filter for today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayBookings: Booking[] = (response.data || [])
          .filter((res: any) => res.date === today)
          .map((res: any) => ({
            id: res._id,
            facilityName: res.facilityName || "Unknown Facility",
            userName: res.userName || "Unknown User",
            userBarcode: res.userBarcode || "-",
            startTime: res.startTime || "-",
            endTime: res.endTime || "-",
            status: res.status || "confirmed",
            checkInTime: res.checkInTime,
          }));

        setBookings(todayBookings);
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        setError(err.message || "Failed to load bookings");
        toast.error("ไม่สามารถโหลดข้อมูลการจองได้");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const today = new Date();
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    checkedIn: bookings.filter((b) => b.status === "checked-in").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    noShow: bookings.filter((b) => b.status === "no-show").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">การจองวันนี้</h2>
        <Badge className="text-base bg-gradient-to-r from-teal-500 to-blue-500">
          <Calendar className="w-4 h-4 mr-2" />
          {format(today, "d MMMM yyyy", { locale: th })}
        </Badge>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-teal-50 to-white">
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.total}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm text-gray-600">รอเช็คอิน</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.confirmed}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-green-50 to-white">
              <p className="text-sm text-gray-600">เช็คอินแล้ว</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.checkedIn}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-gray-50 to-white">
              <p className="text-sm text-gray-600">เสร็จสิ้น</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">
                {stats.completed}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-red-50 to-white">
              <p className="text-sm text-gray-600">ไม่มา</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.noShow}
              </p>
            </Card>
          </div>

      {/* Bookings Table */}
      <Card className="p-4 border-2 border-teal-50">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          รายการจองทั้งหมด
        </h3>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-teal-50 to-blue-50">
                <TableHead>เวลา</TableHead>
                <TableHead>สนาม</TableHead>
                <TableHead>ผู้จอง</TableHead>
                <TableHead>บาร์โค้ด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เช็คอิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-teal-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-teal-600" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </TableCell>
                  <TableCell>{booking.facilityName}</TableCell>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {booking.userBarcode}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusConfig[booking.status].color} hover:${statusConfig[booking.status].color}`}
                    >
                      {statusConfig[booking.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.checkInTime ? (
                      <span className="text-sm text-green-600">
                        {booking.checkInTime}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Timeline View */}
      <Card className="p-5 border-2 border-teal-50">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ไทม์ไลน์การใช้งาน
        </h3>

        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-4 p-3 bg-gradient-to-r from-teal-50/50 to-blue-50/50 rounded-lg"
            >
              <div className="text-center min-w-[80px]">
                <p className="text-sm font-bold text-gray-800">
                  {booking.startTime}
                </p>
                <p className="text-xs text-gray-600">{booking.endTime}</p>
              </div>

              <div className="h-12 w-1 bg-gradient-to-b from-teal-400 to-blue-400 rounded-full"></div>

              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {booking.facilityName}
                </p>
                <p className="text-sm text-gray-600">{booking.userName}</p>
              </div>

              <Badge
                className={`${statusConfig[booking.status].color} hover:${statusConfig[booking.status].color}`}
              >
                {statusConfig[booking.status].label}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
        </>
      )}
    </div>
  );
}
