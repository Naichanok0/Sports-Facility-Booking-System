import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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
import { MobileTable } from "../ui/MobileTable";
import { Search, Loader2, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { reservationAPI, userAPI } from "../../../services/api";
import { toast } from "sonner";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Handle check-in
  const handleCheckIn = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await reservationAPI.update(bookingId, {
        status: "checked-in",
        checkInTime: new Date().toISOString()
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to check-in");
      }
      
      // Update local state
      setBookings(bookings.map(b => 
        b.id === bookingId 
          ? { ...b, status: "checked-in", checkInTime: new Date().toISOString() }
          : b
      ));
      
      toast.success("เช็คอินสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "Failed to check-in");
      console.error("Check-in error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel (change status)
  const handleCancel = async (bookingId: string) => {
    if (!confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?")) {
      return;
    }
    
    try {
      setActionLoading(bookingId);
      const response = await reservationAPI.cancel(bookingId, "ยกเลิกโดยผู้ดูแลระบบ");
      
      if (!response.success) {
        throw new Error(response.error || "Failed to cancel");
      }
      
      // Update local state - change status to cancelled
      setBookings(bookings.map(b => 
        b.id === bookingId 
          ? { ...b, status: "cancelled" }
          : b
      ));
      
      toast.success("ยกเลิกการจองสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
      console.error("Cancel error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle permanent delete
  const handleDelete = async (bookingId: string) => {
    if (!confirm("คุณต้องการลบรายการนี้ออกจากระบบหรือไม่? ไม่สามารถกู้คืนได้")) {
      return;
    }
    
    try {
      setActionLoading(bookingId);
      const response = await reservationAPI.delete(bookingId);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to delete");
      }
      
      // Remove from local state immediately
      setBookings(bookings.filter(b => b.id !== bookingId));
      
      toast.success("ลบรายการสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
      console.error("Delete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch reservations and users
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all users first for name lookup
        const usersRes = await userAPI.getAll();
        if (!isMounted) return;
        
        let userData: any[] = [];
        if (usersRes.success && Array.isArray(usersRes.data)) {
          userData = usersRes.data;
          setUsers(userData);
        }

        // Fetch all reservations
        const reservationsRes = await reservationAPI.getAll();
        if (!isMounted) return;
        
        if (!reservationsRes.success || !Array.isArray(reservationsRes.data)) {
          throw new Error(reservationsRes.error || "Failed to fetch reservations");
        }

        // Transform reservations to booking format
        const bookingData: Booking[] = (reservationsRes.data || []).map((res: any) => {
          // Extract user info from populated data or lookup
          let userName = "Unknown User";
          let userId = res.userId;
          
          if (res.userId) {
            if (typeof res.userId === 'object' && res.userId.firstName) {
              // Already populated
              userName = `${res.userId.firstName} ${res.userId.lastName}`;
              userId = res.userId._id;
            } else if (typeof res.userId === 'string') {
              // Need to lookup
              const user = userData.find((u) => u._id === res.userId);
              if (user) {
                userName = `${user.firstName} ${user.lastName}`;
              }
            }
          }
          
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
            userId: userId,
            userName: userName,
            date: res.date,
            startTime: res.startTime,
            endTime: res.endTime,
            status: res.status || "confirmed",
            checkInTime: res.checkInTime,
          };
        });

        if (isMounted) {
          setBookings(bookingData);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load bookings");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
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

          <MobileTable
            columns={[
              {
                key: "date",
                label: "วันที่",
                render: (value, row) =>
                  new Date(row.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
              },
              {
                key: "time",
                label: "เวลา",
                render: (value, row) => `${row.startTime} - ${row.endTime}`,
              },
              {
                key: "facilityName",
                label: "สนาม",
              },
              {
                key: "userName",
                label: "ผู้จอง",
              },
              {
                key: "status",
                label: "สถานะ",
                render: (value, row) => {
                  const status = row.status as keyof typeof statusConfig;
                  return (
                    <Badge className={`${statusConfig[status]?.color || 'bg-gray-500'}`}>
                      {statusConfig[status]?.label || value}
                    </Badge>
                  );
                },
              },
              {
                key: "checkInTime",
                label: "เช็คอิน",
                render: (value) =>
                  value ? (
                    <span className="text-sm text-green-600">{value}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  ),
              },
              {
                key: "actions",
                label: "การดำเนินการ",
                render: (value, row) => (
                  <div className="flex flex-col md:flex-row gap-1">
                    {row.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckIn(row.id)}
                        disabled={actionLoading === row.id}
                        className="border-green-200 text-green-600 hover:bg-green-50 whitespace-nowrap text-xs"
                      >
                        {actionLoading === row.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        เช็คอิน
                      </Button>
                    )}
                    {row.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(row.id)}
                        disabled={actionLoading === row.id}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 whitespace-nowrap text-xs"
                      >
                        {actionLoading === row.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-1" />
                        )}
                        ยกเลิก
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(row.id)}
                      disabled={actionLoading === row.id}
                      className="border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap text-xs"
                    >
                      {actionLoading === row.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      ลบ
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredBookings}
            loading={false}
            emptyMessage="ไม่พบข้อมูลการจอง"
          />
        </Card>
      )}
    </div>
  );
}
