import { useState } from "react";
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
import { ShieldAlert, CalendarIcon, Ban, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  const [formData, setFormData] = useState({
    barcode: "",
    userName: "",
    reason: "",
    bannedUntil: new Date(),
  });

  const handleSubmit = () => {
    if (!formData.barcode || !formData.userName || !formData.reason) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const newPenalty: UserPenalty = {
      id: Date.now().toString(),
      userId: Date.now().toString(),
      userName: formData.userName,
      barcode: formData.barcode,
      reason: formData.reason,
      bannedUntil: formData.bannedUntil,
      isActive: true,
    };

    setPenalties([newPenalty, ...penalties]);
    toast.success("ระงับสิทธิ์ผู้ใช้งานสำเร็จ");
    setIsDialogOpen(false);
    setFormData({
      barcode: "",
      userName: "",
      reason: "",
      bannedUntil: new Date(),
    });
  };

  const handleUnban = (penaltyId: string) => {
    setPenalties(
      penalties.map((p) =>
        p.id === penaltyId ? { ...p, isActive: false } : p
      )
    );
    toast.success("ยกเลิกการระงับสิทธิ์แล้ว");
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
                <Label htmlFor="barcode">เลขบาร์โค้ดบัตรนิสิต</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  placeholder="เช่น 6612345678"
                  maxLength={10}
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="userName">ชื่อ-นามสกุล</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  placeholder="ชื่อผู้ใช้งาน"
                  className="border-teal-200 focus:border-teal-500"
                />
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
                        !isExpired(penalty.bannedUntil) && (
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
    </div>
  );
}
