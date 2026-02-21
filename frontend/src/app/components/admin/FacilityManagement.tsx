import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
  DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Plus, Edit, Wrench } from "lucide-react";
import { toast } from "sonner";

interface Facility {
  id: string;
  name: string;
  sportTypeId: string;
  status: "available" | "maintenance";
  description: string;
  capacity: number;
  location: string;
}

interface SportType {
  id: string;
  name: string;
}

// Mock data
const initialSportTypes: SportType[] = [
  { id: "1", name: "ฟุตบอล" },
  { id: "2", name: "บาสเกตบอล" },
  { id: "3", name: "แบดมินตัน" },
  { id: "4", name: "เทนนิส" },
  { id: "5", name: "วอลเลย์บอล" },
];

const initialFacilities: Facility[] = [
  {
    id: "1",
    name: "สนามฟุตบอล 1",
    sportTypeId: "1",
    status: "available",
    description: "สนามหญ้าเทียม ขนาดมาตรฐาน",
    capacity: 50,
    location: "สนามหญ้าเทียม 1",
  },
  {
    id: "2",
    name: "สนามบาสเกตบอล A",
    sportTypeId: "2",
    status: "available",
    description: "สนามในร่ม มีแอร์",
    capacity: 30,
    location: "สนามบาสเกตบอล A",
  },
  {
    id: "3",
    name: "คอร์ทแบดมินตัน 1",
    sportTypeId: "3",
    status: "available",
    description: "คอร์ทไม้ภายในอาคาร",
    capacity: 20,
    location: "คอร์ทแบดมินตัน 1",
  },
  {
    id: "4",
    name: "สนามเทนนิส 1",
    sportTypeId: "4",
    status: "maintenance",
    description: "สนามกลางแจ้ง พื้นคอนกรีต",
    capacity: 10,
    location: "สนามเทนนิส 1",
  },
];

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [sportTypes] = useState<SportType[]>(initialSportTypes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sportTypeId: "",
    status: "available" as "available" | "maintenance",
    description: "",
    capacity: 0,
    location: "",
  });

  const handleOpenDialog = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility);
      setFormData({
        name: facility.name,
        sportTypeId: facility.sportTypeId,
        status: facility.status,
        description: facility.description,
        capacity: facility.capacity,
        location: facility.location,
      });
    } else {
      setEditingFacility(null);
      setFormData({
        name: "",
        sportTypeId: "",
        status: "available",
        description: "",
        capacity: 0,
        location: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.sportTypeId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingFacility) {
      setFacilities(
        facilities.map((f) =>
          f.id === editingFacility.id ? { ...f, ...formData } : f
        )
      );
      toast.success("แก้ไขข้อมูลสนามสำเร็จ");
    } else {
      const newFacility: Facility = {
        id: Date.now().toString(),
        ...formData,
      };
      setFacilities([...facilities, newFacility]);
      toast.success("เพิ่มสนามใหม่สำเร็จ");
    }

    setIsDialogOpen(false);
  };

  const toggleStatus = (facility: Facility) => {
    const newStatus = facility.status === "available" ? "maintenance" : "available";
    setFacilities(
      facilities.map((f) =>
        f.id === facility.id ? { ...f, status: newStatus } : f
      )
    );
    toast.success(
      newStatus === "maintenance"
        ? "เปลี่ยนสถานะเป็นปิดปรับปรุง"
        : "เปลี่ยนสถานะเป็นพร้อมใช้งาน"
    );
  };

  const getSportTypeName = (sportTypeId: string) => {
    return sportTypes.find((s) => s.id === sportTypeId)?.name || "";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">จัดการสนามกีฬา</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสนามใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFacility ? "แก้ไขข้อมูลสนาม" : "เพิ่มสนามใหม่"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">ชื่อสนาม</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="เช่น สนามฟุตบอล 1"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="sportType">ชนิดกีฬา</Label>
                <Select
                  value={formData.sportTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sportTypeId: value })
                  }
                >
                  <SelectTrigger className="border-teal-200 focus:border-teal-500">
                    <SelectValue placeholder="เลือกชนิดกีฬา" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypes.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "available" | "maintenance") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="border-teal-200 focus:border-teal-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">พร้อมใช้งาน</SelectItem>
                    <SelectItem value="maintenance">ปิดปรับปรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสนาม"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="capacity">ความจุ</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  placeholder="จำนวนคนที่สามารถเข้าใช้งานได้"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="location">สถานที่</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="สถานที่ของสนาม"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                {editingFacility ? "บันทึกการแก้ไข" : "เพิ่มสนาม"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((facility) => (
          <Card key={facility.id} className="p-4 hover:shadow-lg transition-shadow border-2 border-teal-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {facility.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {getSportTypeName(facility.sportTypeId)}
                </p>
              </div>
              <Badge
                variant={
                  facility.status === "available" ? "default" : "secondary"
                }
                className={
                  facility.status === "available"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }
              >
                {facility.status === "available" ? "พร้อมใช้งาน" : "ปิดปรับปรุง"}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">{facility.description}</p>

            <div className="flex gap-2">
              <Button
                onClick={() => handleOpenDialog(facility)}
                variant="outline"
                size="sm"
                className="flex-1 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>
              <Button
                onClick={() => toggleStatus(facility)}
                variant="outline"
                size="sm"
                className={`flex-1 ${
                  facility.status === "available"
                    ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                    : "border-green-300 text-green-700 hover:bg-green-50"
                }`}
              >
                <Wrench className="w-4 h-4 mr-1" />
                {facility.status === "available" ? "ปิดปรับปรุง" : "เปิดใช้งาน"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}