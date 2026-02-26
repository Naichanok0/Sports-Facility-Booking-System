import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  DialogTrigger,
} from "../ui/dialog";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ShieldAlert, CalendarIcon, Ban, Check, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { userAPI } from "../../../services/api";

interface UserPenalty {
  id: string;
  userId: string;
  userName: string;
  barcode: string;
  reason: string;
  bannedUntil: Date;
  isActive: boolean;
}

const mockPenalties: UserPenalty[] = [
  {
    id: "1",
    userId: "4",
    userName: "สมศักดิ์ ขาดนัด",
    barcode: "6633334444",
    reason: "ไม่มาใช้งานสนาม 3 ครั้งติดต่อกัน",
    bannedUntil: new Date("2026-02-25"),
    isActive: true,
  },
  {
    id: "2",
    userId: "5",
    userName: "วิชัย ฝ่าฝืน",
    barcode: "6655556666",
    reason: "มีพฤติกรรมไม่เหมาะสมในสนาม",
    bannedUntil: new Date("2026-03-01"),
    isActive: true,
  },
];

export default function UserPenalties() {
  const [penalties, setPenalties] = useState<UserPenalty[]>(mockPenalties);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    barcode: "",
    reason: "",
    bannedUntil: new Date(),
  });

  // Fetch penalties on component mount
  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all users to get banned users
        const usersRes = await userAPI.getAll();
        if (!usersRes.success || !Array.isArray(usersRes.data)) {
          throw new Error(usersRes.error || "Failed to fetch users");
        }

        setAllUsers(usersRes.data || []);

        // Filter users who are banned
        const bannedUsers: UserPenalty[] = (usersRes.data || [])
          .filter((user: any) => user.isBanned)
          .map((user: any) => ({
            id: user._id,
            userId: user._id,
            userName: `${user.firstName} ${user.lastName}`,
            barcode: user.studentId || user.barcode || "-",
            reason: user.banReason || "ระงับสิทธิ์โดยผู้ดูแลระบบ",
            bannedUntil: new Date(user.bannedUntil || new Date()),
            isActive: user.isBanned,
          }));

        setPenalties(bannedUsers);
      } catch (err: any) {
        console.error("Error fetching penalties:", err);
        setError(err.message || "Failed to load penalties");
        toast.error("ไม่สามารถโหลดข้อมูลบทลงโทษได้");
      } finally {
        setLoading(false);
      }
    };

    fetchPenalties();
  }, []);

  const handleSubmit = async () => {
    if (!selectedUser || !formData.reason) {
      toast.error("กรุณาเลือกผู้ใช้งานและกรอกเหตุผล");
      return;
    }

    try {
      // Call ban API
      const banRes = await userAPI.ban(selectedUser._id, formData.reason, formData.bannedUntil);
      
      if (!banRes.success) {
        toast.error(banRes.message || "ไม่สามารถระงับสิทธิ์ได้");
        return;
      }

      // Refetch penalties
      const updatedUsersRes = await userAPI.getAll();
      const updatedUserList = Array.isArray(updatedUsersRes.data) ? updatedUsersRes.data : [];
      setAllUsers(updatedUserList);
      
      const bannedUsers: UserPenalty[] = updatedUserList
        .filter((u: any) => u.isBanned)
        .map((u: any) => ({
          id: u._id,
          userId: u._id,
          userName: `${u.firstName} ${u.lastName}`,
          barcode: u.studentId || u.barcode || "-",
          reason: u.banReason || "ระงับสิทธิ์โดยผู้ดูแลระบบ",
          bannedUntil: new Date(u.bannedUntil || new Date()),
          isActive: u.isBanned,
        }));

      setPenalties(bannedUsers);
      toast.success("ระงับสิทธิ์ผู้ใช้งานสำเร็จ");
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      setFormData({
        barcode: "",
        reason: "",
        bannedUntil: new Date(),
      });
    } catch (err: any) {
      console.error("Error banning user:", err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการระงับสิทธิ์");
    }
  };

  const handleUnban = async (penaltyId: string) => {
    try {
      const unbanRes = await userAPI.unban(penaltyId);
      
      if (!unbanRes.success) {
        toast.error(unbanRes.message || "ไม่สามารถยกเลิกการระงับสิทธิ์ได้");
        return;
      }

      // Refetch penalties
      const usersRes = await userAPI.getAll();
      const userList = Array.isArray(usersRes.data) ? usersRes.data : [];
      setAllUsers(userList);
      
      const bannedUsers: UserPenalty[] = userList
        .filter((u: any) => u.isBanned)
        .map((u: any) => ({
          id: u._id,
          userId: u._id,
          userName: `${u.firstName} ${u.lastName}`,
          barcode: u.studentId || u.barcode || "-",
          reason: u.banReason || "ระงับสิทธิ์โดยผู้ดูแลระบบ",
          bannedUntil: new Date(u.bannedUntil || new Date()),
          isActive: u.isBanned,
        }));

      setPenalties(bannedUsers);
      toast.success("ยกเลิกการระงับสิทธิ์แล้ว");
    } catch (err: any) {
      console.error("Error unbanning user:", err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการยกเลิกการระงับสิทธิ์");
    }
  };

  const getFilteredUsers = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allUsers.filter((u: any) => 
      !u.isBanned && (
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.studentId?.includes(query) ||
        u.username?.includes(query)
      )
    ).slice(0, 8); // Show max 8 suggestions
  };

  const isExpired = (date: Date) => {
    return new Date() > date;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">จัดการบทลงโทษ</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white">
              <ShieldAlert className="w-4 h-4 mr-2" />
              ระงับสิทธิ์ผู้ใช้
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ระงับสิทธิ์ผู้ใช้งาน</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="search">ค้นหาผู้ใช้งาน</Label>
                <div className="relative">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="ค้นหาจากชื่อ รหัสนิสิต หรือชื่อผู้ใช้"
                    className="border-teal-200 focus:border-teal-500"
                  />
                  {showSuggestions && getFilteredUsers().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-teal-200 rounded-md shadow-lg z-10">
                      {getFilteredUsers().map((user: any) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery(`${user.firstName} ${user.lastName}`);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-teal-50 border-b last:border-b-0 text-sm"
                        >
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-gray-500 text-xs">{user.studentId} • {user.username}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedUser.studentId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="reason">เหตุผลในการระงับสิทธิ์</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="เช่น ไม่มาใช้งานสนามตามที่จอง"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label>ระงับถึงวันที่</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-teal-200"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.bannedUntil, "PPP", { locale: th })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.bannedUntil}
                      onSelect={(date) =>
                        date &&
                        setFormData({ ...formData, bannedUntil: date })
                      }
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
              >
                ยืนยันการระงับสิทธิ์
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
        <Card className="p-8 border-2 border-teal-50">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="p-4 border-2 border-teal-50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-teal-50 to-blue-50">
                  <TableHead>บาร์โค้ด</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>ระงับถึงวันที่</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การกระทำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      ไม่มีรายการบทลงโทษ
                    </TableCell>
                  </TableRow>
                ) : (
                  penalties.map((penalty) => (
                    <TableRow key={penalty.id} className="hover:bg-teal-50/50">
                      <TableCell className="font-mono">
                        {penalty.barcode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {penalty.userName}
                      </TableCell>
                      <TableCell>{penalty.reason}</TableCell>
                      <TableCell>
                        {format(penalty.bannedUntil, "d MMM yyyy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell>
                        {!penalty.isActive ? (
                          <Badge className="bg-gray-500 hover:bg-gray-600">
                            ยกเลิกแล้ว
                          </Badge>
                        ) : isExpired(penalty.bannedUntil) ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            หมดอายุ
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500 hover:bg-red-600">
                            กำลังระงับ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {penalty.isActive &&
                          (
                            <Button
                              onClick={() => handleUnban(penalty.id)}
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              ยกเลิกระงับ
                            </Button>
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
