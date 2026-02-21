import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Plus, Edit, Clock, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

interface SportType {
  id: string;
  name: string;
  duration: number;
  minPlayers: number;
  checkInWindow: number;
  cancelWindow: number;
  description: string;
}

const initialSportTypes: SportType[] = [
  {
    id: "1",
    name: "ฟุตบอล",
    duration: 120,
    minPlayers: 10,
    checkInWindow: 15,
    cancelWindow: 24,
    description: "กีฬาฟุตบอล ต้องมีผู้เล่นขั้นต่ำ 10 คน",
  },
  {
    id: "2",
    name: "บาสเกตบอล",
    duration: 90,
    minPlayers: 8,
    checkInWindow: 10,
    cancelWindow: 12,
    description: "กีฬาบาสเกตบอล ต้องมีผู้เล่นขั้นต่ำ 8 คน",
  },
  {
    id: "3",
    name: "แบดมินตัน",
    duration: 60,
    minPlayers: 2,
    checkInWindow: 10,
    cancelWindow: 6,
    description: "กีฬาแบดมินตัน เล่นได้ตั้งแต่ 2 คนขึ้นไป",
  },
  {
    id: "4",
    name: "เทนนิส",
    duration: 60,
    minPlayers: 2,
    checkInWindow: 10,
    cancelWindow: 6,
    description: "กีฬาเทนนิส เล่นได้ตั้งแต่ 2 คนขึ้นไป",
  },
  {
    id: "5",
    name: "วอลเลย์บอล",
    duration: 90,
    minPlayers: 6,
    checkInWindow: 15,
    cancelWindow: 12,
    description: "กีฬาวอลเลย์บอล ต้องมีผู้เล่นขั้นต่ำ 6 คน",
  },
];

export default function SportTypeManagement() {
  const [sportTypes, setSportTypes] = useState<SportType[]>(initialSportTypes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 60,
    minPlayers: 2,
    checkInWindow: 10,
    cancelWindow: 6,
    description: "",
  });

  const handleOpenDialog = (sport?: SportType) => {
    if (sport) {
      setEditingSport(sport);
      setFormData({
        name: sport.name,
        duration: sport.duration,
        minPlayers: sport.minPlayers,
        checkInWindow: sport.checkInWindow,
        cancelWindow: sport.cancelWindow,
        description: sport.description,
      });
    } else {
      setEditingSport(null);
      setFormData({
        name: "",
        duration: 60,
        minPlayers: 2,
        checkInWindow: 10,
        cancelWindow: 6,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("กรุณากรอกชื่อชนิดกีฬา");
      return;
    }

    if (editingSport) {
      setSportTypes(
        sportTypes.map((s) =>
          s.id === editingSport.id ? { ...s, ...formData } : s
        )
      );
      toast.success("แก้ไขข้อมูลสำเร็จ");
    } else {
      const newSport: SportType = {
        id: Date.now().toString(),
        ...formData,
      };
      setSportTypes([...sportTypes, newSport]);
      toast.success("เพิ่มชนิดกีฬาใหม่สำเร็จ");
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">จัดการชนิดกีฬา</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มชนิดกีฬา
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSport ? "แก้ไขข้อมูลชนิดกีฬา" : "เพิ่มชนิดกีฬาใหม่"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">ชื่อชนิดกีฬา</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="เช่น ฟุตบอล"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="duration">ระยะเวลาต่อรอบ (นาที)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) })
                  }
                  min="30"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="minPlayers">จำนวนผู้เล่นขั้นต่ำ</Label>
                <Input
                  id="minPlayers"
                  type="number"
                  value={formData.minPlayers}
                  onChange={(e) =>
                    setFormData({ ...formData, minPlayers: parseInt(e.target.value) })
                  }
                  min="1"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="checkInWindow">เวลาเช็คอินก่อนเริ่ม (นาที)</Label>
                <Input
                  id="checkInWindow"
                  type="number"
                  value={formData.checkInWindow}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkInWindow: parseInt(e.target.value),
                    })
                  }
                  min="5"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="cancelWindow">เวลายกเลิกล่วงหน้า (ชั่วโมง)</Label>
                <Input
                  id="cancelWindow"
                  type="number"
                  value={formData.cancelWindow}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cancelWindow: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="description">คำอธิบาย</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="คำอธิบายเกี่ยวกับชนิดกีฬา"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                {editingSport ? "บันทึกการแก้ไข" : "เพิ่มชนิดกีฬา"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sportTypes.map((sport) => (
          <Card key={sport.id} className="p-5 hover:shadow-lg transition-shadow border-2 border-teal-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{sport.name}</h3>
              <Button
                onClick={() => handleOpenDialog(sport)}
                variant="outline"
                size="sm"
                className="border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-teal-600" />
                <span>ระยะเวลา: {sport.duration} นาที</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="w-4 h-4 mr-2 text-teal-600" />
                <span>ผู้เล่นขั้นต่ำ: {sport.minPlayers} คน</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                <span>เช็คอินก่อน: {sport.checkInWindow} นาที</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                <span>ยกเลิกก่อน: {sport.cancelWindow} ชั่วโมง</span>
              </div>
              <div className="text-gray-700">
                <span>คำอธิบาย: {sport.description}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}