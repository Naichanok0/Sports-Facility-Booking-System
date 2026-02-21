import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { UserPlus, ArrowLeft, Mail, Phone, CreditCard, User, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { User as UserType } from "../App";
import { registeredUsers } from "./LoginPage";

interface RegisterPageProps {
  onBack: () => void;
}

const faculties = [
  "วิศวกรรมศาสตร์",
  "วิทยาศาสตร์",
  "พาณิชยศาสตร์",
  "นิติศาสตร์",
  "ครุศาสตร์",
  "แพทยศาสตร์",
  "พยาบาลศาสตร์",
  "เภสัชศาสตร์",
  "ทันตแพทยศาสตร์",
  "สถาปัตยกรรมศาสตร์",
];

export default function RegisterPage({ onBack }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
    barcode: "",
    password: "",
    confirmPassword: "",
    faculty: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = () => {
    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.studentId ||
      !formData.barcode ||
      !formData.password ||
      !formData.faculty
    ) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.studentId.length !== 10) {
      toast.error("รหัสนิสิตต้องมี 10 หลัก");
      return;
    }

    if (formData.barcode.length !== 14) {
      toast.error("เลขบาร์โค้ดต้องมี 14 หลัก");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // Check if student ID already exists
    if (registeredUsers.find((u) => u.studentId === formData.studentId)) {
      toast.error("รหัสนิสิตนี้ถูกใช้งานแล้ว");
      return;
    }

    // Check if barcode already exists
    if (registeredUsers.find((u) => u.barcode === formData.barcode)) {
      toast.error("เลขบาร์โค้ดนี้ถูกใช้งานแล้ว");
      return;
    }

    // Create new user
    const newUser: UserType = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      barcode: formData.barcode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      faculty: formData.faculty,
      role: "user",
      isBanned: false,
      noShowCount: 0,
      password: formData.password,
    };

    registeredUsers.push(newUser);
    toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
    onBack();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-xl border-2 border-teal-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            สมัครสมาชิก
          </h1>
          <p className="text-gray-600">ระบบจองสนามกีฬามหาวิทยาลัย</p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">ชื่อ *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="firstName"
                  placeholder="ชื่อ"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lastName">นามสกุล *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="lastName"
                  placeholder="นามสกุล"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">อีเมล *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@university.ac.th"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="phone"
                  placeholder="08x-xxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Student ID and Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentId">รหัสนิสิต *</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="studentId"
                  placeholder="รหัสนิสิต 10 หลัก"
                  value={formData.studentId}
                  onChange={(e) => handleChange("studentId", e.target.value)}
                  maxLength={10}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="barcode">เลขบาร์โค้ดบัตรนิสิต *</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="barcode"
                  placeholder="เลขบาร์โค้ด 14 หลัก"
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  maxLength={14}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Faculty */}
          <div>
            <Label htmlFor="faculty">คณะ *</Label>
            <Select value={formData.faculty} onValueChange={(value) => handleChange("faculty", value)}>
              <SelectTrigger className="mt-1 border-teal-200 focus:border-teal-500">
                <SelectValue placeholder="เลือกคณะ" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">รหัสผ่าน *</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="ยืนยันรหัสผ่าน"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Button>

            <Button
              onClick={handleRegister}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              สมัครสมาชิก
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}