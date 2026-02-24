import { useState, useEffect } from "react";
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
import { Plus, Edit, Clock, Users, Calendar, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { sportTypeAPI } from "../../../services/api";

interface SportType {
  _id?: string;
  id?: string;
  name: string;
  duration?: number;
  minPlayers?: number;
  description?: string;
  icon?: string;
}

export default function SportTypeManagement() {
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    minPlayers: 1,
  });

  // Fetch sport types from API
  useEffect(() => {
    const fetchSportTypes = async () => {
      try {
        setLoading(true);
        const result = await sportTypeAPI.getAll();
        if (result.success && Array.isArray(result.data)) {
          setSportTypes(result.data);
        }
      } catch (err: any) {
        console.error("Error fetching sport types:", err);
        setError("ไม่สามารถโหลดข้อมูลชนิดกีฬา");
        toast.error("ไม่สามารถโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchSportTypes();
  }, []);

  const handleOpenDialog = (sport?: SportType) => {
    if (sport) {
      setEditingSport(sport);
      setFormData({
        name: sport.name,
        description: sport.description || "",
        duration: sport.duration || 30,
        minPlayers: sport.minPlayers || 1,
      });
    } else {
      setEditingSport(null);
      setFormData({
        name: "",
        description: "",
        duration: 30,
        minPlayers: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("กรุณากรอกชื่อชนิดกีฬา");
      return;
    }

    try {
      if (editingSport) {
        // Update existing
        const result = await sportTypeAPI.update(editingSport._id || editingSport.id || "", formData);
        if (result.success) {
          setSportTypes(
            sportTypes.map((s) =>
              (s._id || s.id) === (editingSport._id || editingSport.id)
                ? { ...s, ...formData }
                : s
            )
          );
          toast.success("แก้ไขข้อมูลสำเร็จ");
        } else {
          toast.error(result.error || "ไม่สามารถแก้ไขข้อมูล");
        }
      } else {
        // Create new
        const result = await sportTypeAPI.create(formData);
        if (result.success) {
          setSportTypes([...sportTypes, result.data as SportType]);
          toast.success("เพิ่มชนิดกีฬาใหม่สำเร็จ");
        } else {
          toast.error(result.error || "ไม่สามารถเพิ่มชนิดกีฬา");
        }
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (sportId: string) => {
    if (!confirm("คุณแน่ใจหรือว่าต้องการลบชนิดกีฬานี้?")) {
      return;
    }

    try {
      const result = await sportTypeAPI.delete(sportId);
      if (result.success) {
        setSportTypes(sportTypes.filter((s) => (s._id || s.id) !== sportId));
        toast.success("ลบชนิดกีฬาสำเร็จ");
      } else {
        toast.error(result.error || "ไม่สามารถลบชนิดกีฬา");
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "เกิดข้อผิดพลาด");
    }
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
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })
                  }
                  min="30"
                  className="border-teal-200 focus:border-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="minPlayers">ผู้เล่นขั้นต่ำ</Label>
                <Input
                  id="minPlayers"
                  type="number"
                  value={formData.minPlayers}
                  onChange={(e) =>
                    setFormData({ ...formData, minPlayers: parseInt(e.target.value) || 1 })
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-4 border-2 border-teal-50 rounded-lg flex gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          <span>กำลังโหลด...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sportTypes.map((sport) => (
          <Card key={sport._id || sport.id} className="p-5 hover:shadow-lg transition-shadow border-2 border-teal-50">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">{sport.name}</h3>
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
              <div className="text-gray-700">
                <span>คำอธิบาย: {sport.description}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleOpenDialog(sport)}
                variant="outline"
                size="sm"
                className="flex-1 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>
              <Button
                onClick={() => handleDelete(sport._id || sport.id || "")}
                variant="outline"
                size="sm"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                ลบ
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}