import { User } from "../../App";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CreditCard, User as UserIcon, Mail, Phone, Building2, CheckCircle, XCircle } from "lucide-react";

interface ProfilePageProps {
  user: User;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 border-2 border-teal-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              ข้อมูลส่วนตัว
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">รหัสนิสิต</p>
                  <p className="text-lg font-medium font-mono text-gray-800">
                    {user.studentId}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">คณะ</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user.faculty}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">อีเมล</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user.phone}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-teal-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              สถิติการใช้งาน
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-teal-600">12</p>
                <p className="text-sm text-gray-600 mt-1">ครั้งที่จอง</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-green-600">10</p>
                <p className="text-sm text-gray-600 mt-1">ใช้งานสำเร็จ</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-orange-600">1</p>
                <p className="text-sm text-gray-600 mt-1">ยกเลิก</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg">
                <p className="text-3xl font-bold text-red-600">1</p>
                <p className="text-sm text-gray-600 mt-1">ไม่มาใช้งาน</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <Card className="p-6 border-2 border-teal-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">สถานะบัญชี</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    สถานะการใช้งาน
                  </span>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">
                  ปกติ
                </Badge>
              </div>

              {user.isBanned ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      สิทธิ์การจอง
                    </span>
                  </div>
                  <Badge className="bg-red-500 hover:bg-red-600">
                    ถูกระงับ
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      สิทธิ์การจอง
                    </span>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">
                    ปกติ
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-2 border-teal-50 bg-gradient-to-br from-yellow-50 to-orange-50">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              💡 เคล็ดลับ
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>เช็คอินก่อนเวลาใช้งาน 10-15 นาที</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>ยกเลิกการจองล่วงหน้าหากไม่สามารถมาได้</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>การไม่มาใช้งานบ่อยครั้งอาจส่งผลต่อสิทธิ์การจอง</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}