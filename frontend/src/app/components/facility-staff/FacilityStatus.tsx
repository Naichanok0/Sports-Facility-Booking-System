import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, Wrench, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Facility {
  id: string;
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
  location: string;
}

const mockFacilities: Facility[] = [
  {
    id: "1",
    name: "สนามฟุตบอล 1",
    sportType: "ฟุตบอล",
    status: "available",
    nextBooking: {
      userName: "สมหญิง รักเรียน",
      startTime: "14:00",
      endTime: "16:00",
    },
    location: "อาคารกีฬา ชั้น 1",
  },
  {
    id: "2",
    name: "สนามบาสเกตบอล A",
    sportType: "บาสเกตบอล",
    status: "available",
    nextBooking: {
      userName: "ประเสริฐ กีฬาดี",
      startTime: "16:00",
      endTime: "17:30",
    },
    location: "อาคารกีฬา ชั้น 2",
  },
  {
    id: "3",
    name: "คอร์ทแบดมินตัน 1",
    sportType: "แบดมินตัน",
    status: "available",
    location: "อาคารกีฬา ชั้น 3",
  },
  {
    id: "4",
    name: "คอร์ทแบดมินตัน 2",
    sportType: "แบดมินตัน",
    status: "available",
    location: "อาคารกีฬา ชั้น 3",
  },
  {
    id: "5",
    name: "สนามเทนนิส 1",
    sportType: "เทนนิส",
    status: "maintenance",
    location: "สนามกลางแจ้ง",
  },
];

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
  const [facilities, setFacilities] = useState<Facility[]>(mockFacilities);

  const toggleMaintenance = (facilityId: string) => {
    setFacilities(
      facilities.map((f) =>
        f.id === facilityId
          ? {
              ...f,
              status:
                f.status === "maintenance" ? "available" : "maintenance",
            }
          : f
      )
    );

    const facility = facilities.find((f) => f.id === facilityId);
    if (facility) {
      toast.success(
        facility.status === "maintenance"
          ? `เปิดใช้งาน ${facility.name} แล้ว`
          : `ปิดปรับปรุง ${facility.name} แล้ว`
      );
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
                  onClick={() => toggleMaintenance(facility.id)}
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
    </div>
  );
}
