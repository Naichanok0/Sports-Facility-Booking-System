import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, Wrench, MapPin, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { facilityAPI } from "../../../services/api";

interface Facility {
  _id?: string;
  id?: string;
  name: string;
  sportType: string;
  status: "available" | "in-use" | "maintenance";
  currentBooking?: {
    userName: string;
    startTime: string;
    endTime: string;
  };
  nextBooking?: {
    userName: string;
    startTime: string;
    endTime: string;
  };
  location?: string;
}

const statusConfig = {
  available: {
    label: "พร้อมใช้งาน",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  "in-use": {
    label: "กำลังใช้งาน",
    color: "bg-blue-500",
    icon: CheckCircle,
  },
  maintenance: {
    label: "ปิดปรับปรุง",
    color: "bg-orange-500",
    icon: Wrench,
  },
};

export default function FacilityStatus() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await facilityAPI.getAll();
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.error || "Failed to fetch facilities");
        }

        // Map MongoDB data to Facility interface
        const facilitiesData: Facility[] = (response.data || []).map((fac: any) => ({
          _id: fac._id,
          id: fac._id,
          name: fac.name,
          sportType: fac.sportType,
          status: fac.status || "available",
          location: fac.location,
        }));

        setFacilities(facilitiesData);
      } catch (err: any) {
        console.error("Error fetching facilities:", err);
        setError(err.message || "Failed to load facilities");
        toast.error("ไม่สามารถโหลดสนามกีฬาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const toggleMaintenance = async (facilityId: string) => {
    try {
      const facility = facilities.find((f) => f._id === facilityId);
      if (!facility) return;

      const newStatus = facility.status === "maintenance" ? "available" : "maintenance";

      // Update on server
      const result = await facilityAPI.update(facilityId, {
        status: newStatus,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update facility");
      }

      // Update local state
      setFacilities(
        facilities.map((f) =>
          f._id === facilityId ? { ...f, status: newStatus } : f
        )
      );

      toast.success(
        newStatus === "maintenance"
          ? `ปิดปรับปรุง ${facility.name} แล้ว`
          : `เปิดใช้งาน ${facility.name} แล้ว`
      );
    } catch (err: any) {
      console.error("Error updating facility:", err);
      toast.error(err.message || "ไม่สามารถอัปเดตสนามได้");
    }
  };

  const stats = {
    total: facilities.length,
    available: facilities.filter((f) => f.status === "available").length,
    inUse: facilities.filter((f) => f.status === "in-use").length,
    maintenance: facilities.filter((f) => f.status === "maintenance").length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">สถานะสนามกีฬา</h2>

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
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-teal-50 to-white">
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.total}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-green-50 to-white">
              <p className="text-sm text-gray-600">พร้อมใช้งาน</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.available}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm text-gray-600">กำลังใช้งาน</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.inUse}
              </p>
            </Card>

            <Card className="p-4 border-2 border-teal-50 bg-gradient-to-br from-orange-50 to-white">
              <p className="text-sm text-gray-600">ปิดปรับปรุง</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats.maintenance}
              </p>
            </Card>
          </div>

          {/* Facilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((facility) => {
          const config = statusConfig[facility.status];
          const StatusIcon = config.icon;

          return (
            <Card
              key={facility.id}
              className="p-5 border-2 border-teal-50 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {facility.name}
                  </h3>
                  <p className="text-sm text-gray-600">{facility.sportType}</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {facility.location}
                  </p>
                </div>
                <Badge className={`${config.color} hover:${config.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              {facility.currentBooking && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    กำลังใช้งาน
                  </p>
                  <p className="text-sm text-gray-700">
                    {facility.currentBooking.userName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {facility.currentBooking.startTime} -{" "}
                    {facility.currentBooking.endTime}
                  </p>
                </div>
              )}

              {facility.nextBooking && facility.status === "available" && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-800 mb-1">
                    การจองถัดไป
                  </p>
                  <p className="text-sm text-gray-700">
                    {facility.nextBooking.userName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {facility.nextBooking.startTime} -{" "}
                    {facility.nextBooking.endTime}
                  </p>
                </div>
              )}

              {facility.status !== "in-use" && (
                <Button
                  onClick={() => toggleMaintenance(facility._id!)}
                  variant="outline"
                  size="sm"
                  className={`w-full ${
                    facility.status === "maintenance"
                      ? "border-green-300 text-green-700 hover:bg-green-50"
                      : "border-orange-300 text-orange-700 hover:bg-orange-50"
                  }`}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  {facility.status === "maintenance"
                    ? "เปิดใช้งาน"
                    : "ปิดปรับปรุง"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}
