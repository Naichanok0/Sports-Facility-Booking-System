import { useState } from "react";
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
import { CalendarIcon, TrendingUp, Users, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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

const bookingData = [
  { name: "จันทร์", bookings: 12, completed: 10, noShow: 2 },
  { name: "อังคาร", bookings: 15, completed: 13, noShow: 2 },
  { name: "พุธ", bookings: 18, completed: 16, noShow: 2 },
  { name: "พฤหัสบดี", bookings: 20, completed: 18, noShow: 2 },
  { name: "ศุกร์", bookings: 22, completed: 20, noShow: 2 },
  { name: "เสาร์", bookings: 25, completed: 23, noShow: 2 },
  { name: "อาทิตย์", bookings: 24, completed: 22, noShow: 2 },
];

const sportTypeData = [
  { name: "ฟุตบอล", value: 35, color: "#14b8a6" },
  { name: "บาสเกตบอล", value: 25, color: "#3b82f6" },
  { name: "แบดมินตัน", value: 20, color: "#8b5cf6" },
  { name: "เทนนิส", value: 12, color: "#f59e0b" },
  { name: "วอลเลย์บอล", value: 8, color: "#ec4899" },
];

export default function ReportsDashboard() {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2026, 1, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [reportType, setReportType] = useState("daily");

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
              <p className="text-3xl font-bold text-gray-800 mt-1">136</p>
              <p className="text-xs text-teal-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% จากสัปดาห์ก่อน
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
              <p className="text-3xl font-bold text-gray-800 mt-1">122</p>
              <p className="text-xs text-green-600 mt-1">89.7% ของทั้งหมด</p>
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
              <p className="text-3xl font-bold text-gray-800 mt-1">14</p>
              <p className="text-xs text-orange-600 mt-1">10.3% ของทั้งหมด</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-teal-50 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">เวลาใช้งานเฉลี่ย</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">1.8</p>
              <p className="text-xs text-blue-600 mt-1">ชั่วโมงต่อครั้ง</p>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
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
        </Card>

        <Card className="p-6 border-2 border-teal-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            สัดส่วนการจองแยกตามชนิดกีฬา
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sportTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sportTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Popular Times */}
      <Card className="p-6 border-2 border-teal-50">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ช่วงเวลายอดนิยม
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">08:00 - 10:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">18 ครั้ง</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">14:00 - 16:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">32 ครั้ง</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">16:00 - 18:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">45 ครั้ง</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
            <p className="text-sm text-gray-600">18:00 - 20:00</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">41 ครั้ง</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
