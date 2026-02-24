import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Plus, Edit, Wrench, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { facilityAPI, sportTypeAPI } from "../../../services/api";

interface Facility {
  _id?: string;
  id?: string;
  name: string;
  sportTypeId: string;
  status: "available" | "maintenance";
  description: string;
  capacity: number;
  location: string;
}

interface SportType {
  _id?: string;
  id?: string;
  name: string;
}

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sportTypeId: "",
    status: "available" as "available" | "maintenance",
    description: "",
    capacity: 0,
    location: "",
  });

  // Fetch facilities and sport types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sport types
        const sportTypesRes = await sportTypeAPI.getAll();
        if (sportTypesRes.success && Array.isArray(sportTypesRes.data)) {
          setSportTypes(sportTypesRes.data);
        }

        // Fetch facilities
        const facilitiesRes = await facilityAPI.getAll();
        if (!facilitiesRes.success || !Array.isArray(facilitiesRes.data)) {
          throw new Error(facilitiesRes.error || "Failed to fetch facilities");
        }

        setFacilities(facilitiesRes.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.sportTypeId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSubmitting(true);

      if (editingFacility) {
        const result = await facilityAPI.update(editingFacility._id!, formData);
        if (!result.success) {
          throw new Error(result.error || "Failed to update facility");
        }

        setFacilities(
          facilities.map((f) =>
            f._id === editingFacility._id
              ? { ...f, ...formData }
              : f
          )
        );
        toast.success("แก้ไขข้อมูลสนามสำเร็จ");
      } else {
        const result = await facilityAPI.create(formData);
        if (!result.success) {
          throw new Error(result.error || "Failed to create facility");
        }

        setFacilities([...facilities, result.data as Facility]);
        toast.success("เพิ่มสนามใหม่สำเร็จ");
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const getSportTypeName = (sportTypeIdOrObject: any) => {
    // ถ้า populate แล้ว จะเป็น object ที่มี name
    if (typeof sportTypeIdOrObject === 'object' && sportTypeIdOrObject?.name) {
      return sportTypeIdOrObject.name;
    }
    // ถ้าเป็น ID string ให้หาจาก sportTypes array
    return sportTypes.find((s) => (s._id || s.id) === sportTypeIdOrObject)?.name || "Unknown";
  };

  const toggleStatus = async (facility: Facility) => {
    try {
      const newStatus = facility.status === "available" ? "maintenance" : "available";
      
      const result = await facilityAPI.update(facility._id!, {
        status: newStatus,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update facility");
      }

      setFacilities(
        facilities.map((f) =>
          f._id === facility._id ? { ...f, status: newStatus } : f
        )
      );
      
      toast.success(
        newStatus === "maintenance"
          ? "เปลี่ยนสถานะเป็นปิดปรับปรุง"
          : "เปลี่ยนสถานะเป็นพร้อมใช้งาน"
      );
    } catch (err: any) {
      console.error("Error updating facility status:", err);
      toast.error(err.message || "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDelete = async () => {
    if (!deletingFacility) return;

    try {
      setDeleting(true);

      const result = await facilityAPI.delete(deletingFacility._id!);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete facility");
      }

      setFacilities(facilities.filter((f) => f._id !== deletingFacility._id));
      setDeletingFacility(null);
      toast.success("ลบสนามสำเร็จ");
    } catch (err: any) {
      console.error("Error deleting facility:", err);
      toast.error(err.message || "ไม่สามารถลบสนามได้");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">จัดการสนามกีฬา</h2>
        
        {loading ? (
          <div className="text-sm text-gray-600">โหลดข้อมูล...</div>
        ) : (
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
                <DialogDescription>
                  {editingFacility
                    ? "แก้ไขข้อมูลของสนามที่มีอยู่"
                    : "กรุณากรอกข้อมูลสนามใหม่"}
                </DialogDescription>
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
                      <SelectItem key={sport._id} value={sport._id!}>
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
                disabled={submitting}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : editingFacility ? (
                  "บันทึกการแก้ไข"
                ) : (
                  "เพิ่มสนาม"
                )}
              </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
        <Card className="p-4 border-2 border-teal-50">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((facility) => (
          <Card key={facility._id} className="p-4 hover:shadow-lg transition-shadow border-2 border-teal-50">
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
              <Button
                onClick={() => setDeletingFacility(facility)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFacility} onOpenChange={(open) => !open && setDeletingFacility(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">ลบสนาม?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบสนาม <strong>{deletingFacility?.name}</strong>? การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              ⚠️ การลบสนามนี้จะลบข้อมูลทั้งหมดที่เกี่ยวข้อง
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-gray-300">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบสนาม"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}