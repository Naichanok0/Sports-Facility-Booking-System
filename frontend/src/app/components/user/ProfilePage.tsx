import { useState, useEffect } from "react";
import { User } from "../../App";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CreditCard, User as UserIcon, Mail, Phone, Building2, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { userAPI, reservationAPI } from "../../../services/api";
import { toast } from "sonner";

interface ProfilePageProps {
  user: User;
}

interface UserStats {
  totalBookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
  checkedIn: number;
  pending: number;
  confirmed: number;
  noShowCount: number;
  isBanned: boolean;
  bannedUntil?: string;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to get user profile with authentication
        const profileRes = await userAPI.getByUsername(user.studentId);
        if (profileRes.success && profileRes.data) {
          const dbUser = profileRes.data as any;
          const userId = dbUser._id || dbUser.id;

          // Now fetch reservations for this user
          const reservationsRes = await reservationAPI.getUserReservations(userId);
          if (reservationsRes.success && Array.isArray(reservationsRes.data)) {
            const bookings = reservationsRes.data;
            
            setStats({
              totalBookings: bookings.length,
              completed: bookings.filter((b: any) => b.status === "completed").length,
              cancelled: bookings.filter((b: any) => b.status === "cancelled").length,
              noShow: bookings.filter((b: any) => b.status === "no-show").length,
              checkedIn: bookings.filter((b: any) => b.status === "checked-in").length,
              pending: bookings.filter((b: any) => b.status === "pending").length,
              confirmed: bookings.filter((b: any) => b.status === "confirmed").length,
              noShowCount: dbUser.noShowCount || 0,
              isBanned: dbUser.isBanned || false,
              bannedUntil: dbUser.bannedUntil,
            });
            return;
          }
        }

        // Try to get stats from API endpoint
        const response = await userAPI.getStats();
        if (response.success) {
          setStats(response.data as UserStats);
          return;
        }

        // Fallback: use data from user object (demo mode)
        if (user.noShowCount !== undefined) {
          setStats({
            totalBookings: 0,
            completed: 0,
            cancelled: 0,
            noShow: user.noShowCount || 0,
            checkedIn: 0,
            pending: 0,
            confirmed: 0,
            noShowCount: user.noShowCount || 0,
            isBanned: user.isBanned || false,
            bannedUntil: user.bannedUntil ? user.bannedUntil.toString() : undefined,
          });
        }
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        // Fallback to demo data
        if (user.noShowCount !== undefined) {
          setStats({
            totalBookings: 0,
            completed: 0,
            cancelled: 0,
            noShow: user.noShowCount || 0,
            checkedIn: 0,
            pending: 0,
            confirmed: 0,
            noShowCount: user.noShowCount || 0,
            isBanned: user.isBanned || false,
            bannedUntil: user.bannedUntil ? user.bannedUntil.toString() : undefined,
          });
        } else {
          setError("ไม่สามารถโหลดสถิติได้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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

            {error && (
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-white rounded-lg">
                  <p className="text-3xl font-bold text-teal-600">{stats.totalBookings}</p>
                  <p className="text-sm text-gray-600 mt-1">ครั้งที่จอง</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-gray-600 mt-1">ใช้งานสำเร็จ</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">{stats.cancelled}</p>
                  <p className="text-sm text-gray-600 mt-1">ยกเลิก</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{stats.noShow}</p>
                  <p className="text-sm text-gray-600 mt-1">ไม่มาใช้งาน</p>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <Card className="p-6 border-2 border-teal-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">สถานะบัญชี</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : (
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

                {stats?.isBanned ? (
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
            )}
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