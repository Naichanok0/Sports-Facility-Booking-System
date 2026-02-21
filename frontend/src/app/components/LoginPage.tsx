import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { User, LogIn, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { User as UserType } from "../App";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

interface LoginPageProps {
  onLogin: (user: UserType) => void;
}

// Mock data for demo
const mockUsers: UserType[] = [
  {
    id: "1",
    studentId: "6612345678",
    barcode: "1234567890",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai@university.ac.th",
    phone: "081-234-5678",
    faculty: "วิศวกรรมศาสตร์",
    role: "admin",
    isBanned: false,
    noShowCount: 0,
    password: "admin123",
  },
  {
    id: "2",
    studentId: "6698765432",
    barcode: "0987654321",
    firstName: "สมหญิง",
    lastName: "รักเรียน",
    email: "somying@university.ac.th",
    phone: "089-876-5432",
    faculty: "วิทยาศาสตร์",
    role: "user",
    isBanned: false,
    noShowCount: 1,
    password: "user123",
  },
  {
    id: "3",
    studentId: "6611112222",
    barcode: "1111222233",
    firstName: "ประเสริฐ",
    lastName: "กีฬาดี",
    email: "prasert@university.ac.th",
    phone: "092-111-2222",
    faculty: "พาณิชยศาสตร์",
    role: "user",
    isBanned: false,
    noShowCount: 0,
    password: "user123",
  },
  {
    id: "4",
    studentId: "6655554444",
    barcode: "5555444433",
    firstName: "สมศักดิ์",
    lastName: "ดูแลดี",
    email: "somsak@university.ac.th",
    phone: "081-555-4444",
    faculty: "กองกีฬา",
    role: "facility-staff",
    isBanned: false,
    noShowCount: 0,
    password: "staff123",
  },
];

export const registeredUsers = mockUsers;

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = () => {
    if (!studentId.trim() || !password.trim()) {
      toast.error("กรุณากรอกรหัสนิสิตและรหัสผ่าน");
      return;
    }

    const user = registeredUsers.find((u) => u.studentId === studentId);
    if (!user) {
      toast.error("ไม่พบรหัสนิสิตในระบบ");
      return;
    }

    if (user.password !== password) {
      toast.error("รหัสผ่านไม่ถูกต้อง");
      return;
    }

    if (user.isBanned && user.bannedUntil && user.bannedUntil > new Date()) {
      toast.error(
        `บัญชีของคุณถูกระงับจนถึง ${user.bannedUntil.toLocaleDateString("th-TH")}`
      );
      return;
    }

    toast.success(`ยินดีต้อนรับ ${user.firstName} ${user.lastName}`);
    onLogin(user);
  };

  if (showRegister) {
    return <RegisterPage onBack={() => setShowRegister(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-2 border-teal-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            เข้าสู่ระบบ
          </h1>
          <p className="text-gray-600">ระบบจองสนามกีฬามหาวิทยาลัย</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="studentId" className="text-gray-700">
              รหัสนิสิต
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="studentId"
                type="text"
                placeholder="กรอกรหัสนิสิต 10 หลัก"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                maxLength={10}
                className="pl-10 border-teal-200 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">
              รหัสผ่าน
            </Label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="pl-10 border-teal-200 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
          >
            <LogIn className="w-4 h-4 mr-2" />
            เข้าสู่ระบบ
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                ยังไม่มีบัญชี?
              </span>
            </div>
          </div>

          <Button
            onClick={() => setShowRegister(true)}
            variant="outline"
            className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            สมัครสมาชิก
          </Button>

          <div className="pt-4 border-t border-gray-200 mt-6">
            <p className="text-sm text-gray-600 mb-2">บัญชีทดสอบ:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>• Admin: 6612345678 / admin123</p>
              <p>• User: 6698765432 / user123</p>
              <p>• ผู้ดูแลสนาม: 6655554444 / staff123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
