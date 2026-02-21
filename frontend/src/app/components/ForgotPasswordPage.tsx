import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { KeyRound, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { registeredUsers } from "./LoginPage";

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleVerifyEmail = () => {
    if (!studentId.trim() || !email.trim()) {
      toast.error("กรุณากรอกรหัสนิสิตและอีเมล");
      return;
    }

    const user = registeredUsers.find(
      (u) => u.studentId === studentId && u.email === email
    );

    if (!user) {
      toast.error("ไม่พบข้อมูลผู้ใช้ที่ตรงกัน กรุณาตรวจสอบรหัสนิสิตและอีเมล");
      return;
    }

    toast.success("ยืนยันข้อมูลสำเร็จ! กรุณาตั้งรหัสผ่านใหม่");
    setStep("reset");
  };

  const handleResetPassword = () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    const user = registeredUsers.find(
      (u) => u.studentId === studentId && u.email === email
    );

    if (user) {
      user.password = newPassword;
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      onBack();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-2 border-teal-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-4">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ลืมรหัสผ่าน
          </h1>
          <p className="text-gray-600">
            {step === "email"
              ? "กรุณายืนยันตัวตนด้วยรหัสนิสิตและอีเมล"
              : "ตั้งรหัสผ่านใหม่"}
          </p>
        </div>

        {step === "email" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="studentId" className="text-gray-700">
                รหัสนิสิต
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="studentId"
                  placeholder="กรอกรหัสนิสิต 10 หลัก"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  maxLength={10}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700">
                อีเมลที่ลงทะเบียน
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@university.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyEmail()}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
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
                onClick={handleVerifyEmail}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                ยืนยัน
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg mb-4">
              <p className="text-sm text-green-800 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                ยืนยันตัวตนสำเร็จ
              </p>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-gray-700">
                รหัสผ่านใหม่
              </Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                ยืนยันรหัสผ่านใหม่
              </Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
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
                onClick={handleResetPassword}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
