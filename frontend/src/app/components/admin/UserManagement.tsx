import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MobileTable } from "../ui/MobileTable";
import { Search, Loader2, AlertCircle, Edit2, Save, X } from "lucide-react";
import { userAPI } from "../../../services/api";
import { toast } from "sonner";

interface User {
  id: string;
  studentId: string;
  barcode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  faculty: string;
  role: "admin" | "user" | "facility-staff";
  isBanned: boolean;
  bannedUntil?: Date;
  noShowCount?: number;
}

const roleConfig = {
  admin: { label: "ผู้ดูแลระบบ", color: "bg-red-500" },
  user: { label: "ผู้ใช้งาน", color: "bg-blue-500" },
  "facility-staff": { label: "ผู้ดูแลสนาม", color: "bg-green-500" },
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all users
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await userAPI.getAll();
        
        if (isMounted && response.success && Array.isArray(response.data)) {
          setUsers(response.data as User[]);
        } else if (isMounted) {
          setError("ไม่สามารถโหลดข้อมูลผู้ใช้งาน");
        }
      } catch (err: any) {
        console.error("Error fetching users:", err);
        if (isMounted) {
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle role change
  const handleRoleChange = (userId: string, currentRole: string) => {
    setEditingId(userId);
    setEditingRole(currentRole);
  };

  // Save role change
  const handleSaveRole = async (userId: string) => {
    if (editingRole === users.find(u => u.id === userId)?.role) {
      setEditingId(null);
      return;
    }

    try {
      setActionLoading(userId);
      
      // Update user role
      const response = await userAPI.update(userId, {
        role: editingRole as "admin" | "user" | "facility-staff",
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update role");
      }

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: editingRole as any } : u
        )
      );

      toast.success(`เปลี่ยน role เป็น ${roleConfig[editingRole as keyof typeof roleConfig]?.label || editingRole} สำเร็จ`);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
      console.error("Role update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingRole("");
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.studentId.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <Card className="p-4 border-2 border-teal-50">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="p-4 border-2 border-teal-50">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาด้วยชื่อ, เลขประจำตัว, หรืออีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-teal-200 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    ชื่อ - นามสกุล
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    เลขประจำตัว
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    อีเมล
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      ไม่พบข้อมูลผู้ใช้งาน
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-teal-50/50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.studentId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === user.id ? (
                          <Select value={editingRole} onValueChange={setEditingRole}>
                            <SelectTrigger className="w-40 border-teal-200 focus:border-teal-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                              <SelectItem value="user">ผู้ใช้งาน</SelectItem>
                              <SelectItem value="facility-staff">
                                ผู้ดูแลสนาม
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            className={`${
                              roleConfig[user.role as keyof typeof roleConfig]?.color ||
                              "bg-gray-500"
                            }`}
                          >
                            {roleConfig[user.role as keyof typeof roleConfig]?.label ||
                              user.role}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {editingId === user.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveRole(user.id)}
                              disabled={actionLoading === user.id}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-1" />
                              )}
                              บันทึก
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user.id, user.role)}
                            className="border-teal-200 text-teal-600 hover:bg-teal-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            แก้ไข
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                ไม่พบข้อมูลผู้ใช้งาน
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.studentId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">อีเมล</p>
                    <p className="text-sm text-gray-700">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    {editingId === user.id ? (
                      <Select value={editingRole} onValueChange={setEditingRole}>
                        <SelectTrigger className="w-full border-teal-200 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          <SelectItem value="user">ผู้ใช้งาน</SelectItem>
                          <SelectItem value="facility-staff">
                            ผู้ดูแลสนาม
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        className={`${
                          roleConfig[user.role as keyof typeof roleConfig]?.color ||
                          "bg-gray-500"
                        }`}
                      >
                        {roleConfig[user.role as keyof typeof roleConfig]?.label ||
                          user.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingId === user.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveRole(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          บันทึก
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className="w-full border-teal-200 text-teal-600 hover:bg-teal-50"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        แก้ไข
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
