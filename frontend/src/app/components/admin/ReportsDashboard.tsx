import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, TrendingUp, Users, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { statisticsAPI } from "../../../services/api";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ReportsDashboard() {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2026, 1, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [reportType, setReportType] = useState("daily");
  const [bookingStats, setBookingStats] = useState<any[]>([]);
  const [facilityStats, setFacilityStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    noShowCount: 0,
    totalPlayers: 0,
  });

  // Fetch statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const startDate = format(dateFrom, "yyyy-MM-dd");
        const endDate = format(dateTo, "yyyy-MM-dd");

        const [bookingResponse, facilityResponse] = await Promise.all([
          statisticsAPI.getBookings(startDate, endDate),
          statisticsAPI.getFacilities(startDate, endDate),
        ]);

        if (bookingResponse.success && bookingResponse.data) {
          const bookingData = Array.isArray(bookingResponse.data) ? bookingResponse.data : [];
          setBookingStats(bookingData);
          setSummaryStats({
            totalBookings: bookingData.length || 0,
            completedBookings: bookingData.filter((b: any) => b.status === "completed").length || 0,
            noShowCount: bookingData.filter((b: any) => b.status === "no-show").length || 0,
            totalPlayers: bookingData.reduce((sum: number, b: any) => sum + (b.playerCount || 0), 0),
          });
        } else {
          setBookingStats([]);
        }

        if (facilityResponse.success && facilityResponse.data) {
          const facilityData = Array.isArray(facilityResponse.data) ? facilityResponse.data : [];
          setFacilityStats(facilityData);
        } else {
          setFacilityStats([]);
        }
      } catch (error: any) {
        console.error("Error fetching statistics:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสถิติได้");
        setBookingStats([]);
        setFacilityStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateFrom, dateTo, reportType]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">รายงานสรุปการจอง</h2>
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[150px] border-teal-200 focus:border-teal-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">รายวัน</SelectItem>
              <SelectItem value="weekly">รายสัปดาห์</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-2 border-teal-50 bg-gradient-to-br from-teal-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">การจองทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {summaryStats.totalBookings}
              </p>
              <p className="text-xs text-teal-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {bookingStats.length > 0 ? "+5%" : "ไม่มีข้อมูล"}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-teal-50 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ใช้งานสำเร็จ</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {summaryStats.completedBookings}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summaryStats.totalBookings > 0
                  ? `${Math.round(
                      (summaryStats.completedBookings /
                        summaryStats.totalBookings) *
                        100
                    )}% ของทั้งหมด`
                  : "0%"}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-teal-50 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ไม่มาใช้งาน</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {summaryStats.noShowCount}
              </p>
              <p className="text-xs text-orange-600 mt-1">ครั้ง</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-teal-50 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">จำนวนผู้เล่น</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {summaryStats.totalPlayers}
              </p>
              <p className="text-xs text-blue-600 mt-1">คนทั้งสิ้น</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-teal-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            สถิติการจองรายวัน
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : bookingStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="ใช้งานสำเร็จ" fill="#14b8a6" />
                <Bar dataKey="noShow" name="ไม่มาใช้งาน" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              ไม่มีข้อมูลในช่วงเวลาที่เลือก
            </div>
          )}
        </Card>

        <Card className="p-6 border-2 border-teal-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            สัดส่วนการจองแยกตามสนาม
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : facilityStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={facilityStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookingCount"
                >
                  {facilityStats.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              ไม่มีข้อมูลในช่วงเวลาที่เลือก
            </div>
          )}
        </Card>
      </div>

      {/* Peak Hours Analysis */}
      <Card className="p-6 border-2 border-teal-50">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ปีกอย่างการจองตามช่วงเวลา
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">08:00 - 10:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {Array.isArray(bookingStats) ? bookingStats.filter((b: any) => b.startTime === "08:00").length : 0} ครั้ง
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">10:00 - 12:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {Array.isArray(bookingStats) ? bookingStats.filter((b: any) => b.startTime === "10:00").length : 0} ครั้ง
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">14:00 - 16:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {Array.isArray(bookingStats) ? bookingStats.filter((b: any) => b.startTime === "14:00").length : 0} ครั้ง
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">16:00 - 18:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {Array.isArray(bookingStats) ? bookingStats.filter((b: any) => b.startTime === "16:00").length : 0} ครั้ง
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
