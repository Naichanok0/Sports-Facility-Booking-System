import { useState, useEffect } from "react";
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
import { Calendar, Clock, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { reservationAPI, facilityAPI } from "../../../services/api";

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
}

/**
 * Maps MongoDB Reservation document to Booking interface
 * and enriches with facility information
 */
async function mapReservationToBooking(
  reservation: any,
  facilities: any[]
): Promise<Booking> {
  // Try to get facility name from populated data first
  let facilityName = "Unknown Facility";
  if (reservation.facilityId) {
    if (typeof reservation.facilityId === 'object' && reservation.facilityId.name) {
      facilityName = reservation.facilityId.name;
    } else if (typeof reservation.facilityId === 'string') {
      const facility = facilities.find((f) => f._id === reservation.facilityId);
      facilityName = facility?.name || "Unknown Facility";
    }
  }

  // Try to get sport type name from populated data
  let sportTypeName = "Unknown Sport";
  if (reservation.sportTypeId) {
    if (typeof reservation.sportTypeId === 'object' && reservation.sportTypeId.name) {
      sportTypeName = reservation.sportTypeId.name;
    }
  }

  return {
    id: reservation._id,
    facilityName: facilityName,
    sportType: sportTypeName,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status || "confirmed",
    checkInTime: reservation.checkInTime,
    canCancel: reservation.status === "confirmed",
    // Note: user check-in is not allowed from the booking history page.
  };
}

const getStatusBadgeColor = (status: string) => {
  const config: Record<string, string> = {
    confirmed: "bg-blue-500",
    "checked-in": "bg-green-500",
    completed: "bg-gray-500",
    "no-show": "bg-red-500",
    cancelled: "bg-orange-500",
  };
  return config[status] || "bg-gray-500";
};

const statusConfig = {
  confirmed: { label: "จองแล้ว" },
  "checked-in": { label: "เช็คอินแล้ว" },
  completed: { label: "ใช้งานเสร็จสิ้น" },
  "no-show": { label: "ไม่มาใช้งาน" },
  cancelled: { label: "ยกเลิกแล้ว" },
};

interface BookingHistoryProps {
  user: User;
}

export default function BookingHistory({ user }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user reservations and facilities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch facilities for mapping
        const facilitiesRes = await facilityAPI.getAll();
        if (facilitiesRes.success && Array.isArray(facilitiesRes.data)) {
          setFacilities(facilitiesRes.data);
        }

        // Fetch user reservations
        const reservationsRes = await reservationAPI.getUserReservations(
          user.id
        );
        if (!reservationsRes.success) {
          throw new Error(
            reservationsRes.error || "Failed to fetch reservations"
          );
        }

        // Map reservations to booking interface
        const bookingData = await Promise.all(
          (Array.isArray(reservationsRes.data) ? reservationsRes.data : []).map((reservation: any) =>
            mapReservationToBooking(reservation, Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [])
          )
        );

        setBookings(bookingData);
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        setError(err.message || "Failed to load bookings");
        toast.error("ไม่สามารถโหลดประวัติการจองได้");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user.id]);

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      const result = await reservationAPI.cancel(selectedBooking.id, "User cancelled");
      if (!result.success) {
        throw new Error(result.error || "Failed to cancel booking");
      }

      // Update local state
      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: "cancelled", canCancel: false }
            : b
        )
      );

      toast.success("ยกเลิกการจองสำเร็จ");
      setShowCancelDialog(false);
      setSelectedBooking(null);
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      toast.error(err.message || "ไม่สามารถยกเลิกการจองได้");
    }
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

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
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

      {/* Table */}
      {!loading && (
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
                          className={`${getStatusBadgeColor(booking.status)}`}
                        >
                          {statusConfig[booking.status]?.label || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Check-in removed from booking history - only cancel allowed here */}
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
                          {!booking.canCancel && (
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
      )}

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

      {/* Check-in removed: users cannot check in from booking history */}
    </div>
  );
}
