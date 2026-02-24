import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { reservationAPI, userAPI } from "../../../services/api";

interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "no-show" | "completed" | "checked-in";
  checkInTime?: string;
}

const statusConfig = {
  confirmed: { label: "จองแล้ว", color: "bg-blue-500" },
  "checked-in": { label: "เช็คอินแล้ว", color: "bg-green-500" },
  completed: { label: "ใช้งานแล้ว", color: "bg-gray-500" },
  "no-show": { label: "ไม่มา", color: "bg-red-500" },
  cancelled: { label: "ยกเลิก", color: "bg-orange-500" },
};

export default function BookingMonitor() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reservations and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all users first for name lookup
        const usersRes = await userAPI.getAll();
        let userData: any[] = [];
        if (usersRes.success && Array.isArray(usersRes.data)) {
          userData = usersRes.data;
          setUsers(userData);
        }

        // Fetch all reservations
        const reservationsRes = await reservationAPI.getAll();
        if (!reservationsRes.success || !Array.isArray(reservationsRes.data)) {
          throw new Error(reservationsRes.error || "Failed to fetch reservations");
        }

        // Transform reservations to booking format
        const bookingData: Booking[] = (reservationsRes.data || []).map((res: any) => {
          const user = userData.find((u) => u._id === res.userId);
          
          // Extract facility name from populated data or fallback
          let facilityName = "Unknown Facility";
          if (res.facilityId) {
            if (typeof res.facilityId === 'object' && res.facilityId.name) {
              facilityName = res.facilityId.name;
            } else if (res.facilityName) {
              facilityName = res.facilityName;
            }
          }
          
          return {
            id: res._id,
            facilityId: typeof res.facilityId === 'object' ? res.facilityId._id : res.facilityId,
            facilityName: facilityName,
            userId: res.userId,
            userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
            date: res.date,
            startTime: res.startTime,
            endTime: res.endTime,
            status: res.status || "confirmed",
            checkInTime: res.checkInTime,
          };
        });

        setBookings(bookingData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.facilityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">ตรวจสอบการจอง</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <Card className="p-4 border-2 border-teal-50">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="p-4 border-2 border-teal-50">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาด้วยชื่อผู้ใช้หรือชื่อสนาม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-teal-200 focus:border-teal-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px] border-teal-200 focus:border-teal-500">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="confirmed">จองแล้ว</SelectItem>
              <SelectItem value="checked-in">เช็คอินแล้ว</SelectItem>
              <SelectItem value="completed">ใช้งานแล้ว</SelectItem>
              <SelectItem value="no-show">ไม่มา</SelectItem>
              <SelectItem value="cancelled">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-teal-50 to-blue-50">
                <TableHead>วันที่</TableHead>
                <TableHead>เวลา</TableHead>
                <TableHead>สนาม</TableHead>
                <TableHead>ผู้จอง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เช็คอิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    ไม่พบข้อมูลการจอง
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-teal-50/50">
                    <TableCell>
                      {new Date(booking.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {booking.startTime} - {booking.endTime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.facilityName}
                    </TableCell>
                    <TableCell>{booking.userName}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}
    </div>
  );
}
