import { useState } from "react";
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
import { Search } from "lucide-react";

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

const mockBookings: Booking[] = [
  {
    id: "1",
    facilityId: "1",
    facilityName: "สนามฟุตบอล 1",
    userId: "2",
    userName: "สมหญิง รักเรียน",
    date: "2026-02-20",
    startTime: "14:00",
    endTime: "16:00",
    status: "confirmed",
  },
  {
    id: "2",
    facilityId: "2",
    facilityName: "สนามบาสเกตบอล A",
    userId: "3",
    userName: "ประเสริฐ กีฬาดี",
    date: "2026-02-19",
    startTime: "16:00",
    endTime: "17:30",
    status: "checked-in",
    checkInTime: "15:50",
  },
  {
    id: "3",
    facilityId: "3",
    facilityName: "คอร์ทแบดมินตัน 1",
    userId: "2",
    userName: "สมหญิง รักเรียน",
    date: "2026-02-18",
    startTime: "10:00",
    endTime: "11:00",
    status: "completed",
    checkInTime: "09:55",
  },
  {
    id: "4",
    facilityId: "1",
    facilityName: "สนามฟุตบอล 1",
    userId: "3",
    userName: "ประเสริฐ กีฬาดี",
    date: "2026-02-17",
    startTime: "14:00",
    endTime: "16:00",
    status: "no-show",
  },
  {
    id: "5",
    facilityId: "2",
    facilityName: "สนามบาสเกตบอล A",
    userId: "2",
    userName: "สมหญิง รักเรียน",
    date: "2026-02-16",
    startTime: "09:00",
    endTime: "10:30",
    status: "cancelled",
  },
];

const statusConfig = {
  confirmed: { label: "จองแล้ว", color: "bg-blue-500" },
  "checked-in": { label: "เช็คอินแล้ว", color: "bg-green-500" },
  completed: { label: "ใช้งานแล้ว", color: "bg-gray-500" },
  "no-show": { label: "ไม่มา", color: "bg-red-500" },
  cancelled: { label: "ยกเลิก", color: "bg-orange-500" },
};

export default function BookingMonitor() {
  const [bookings] = useState<Booking[]>(mockBookings);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    </div>
  );
}
