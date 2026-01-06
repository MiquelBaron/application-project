import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserIcon, CogIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center mt-12">
        <p className="text-red-500 text-lg font-medium">No user logged in</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto p-4">
      {/* USER INFO CARD */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-indigo-600" /> Profile
          </CardTitle>
          <CardDescription>Basic account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-lg font-semibold">
              Username: <span className="font-normal">{user.username}</span>
            </p>
            <p>
              Group: <Badge variant="outline">{user.group}</Badge>
            </p>
            <p>
              Email: <Badge variant="outline">{user.email}</Badge>
            </p>
            <div>
 <p>
              Superuser: <Badge variant="outline">{user.isSuperuser ? "Yes" : "No"}</Badge>
            </p>
            </div>
           
          </div>
        </CardContent>
      </Card>

      {/* STAFF INFO CARD */}
      {user.group === "Staffs" && user.staffInfo && (
        <Card className="shadow-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CogIcon className="h-5 w-5 text-green-600" /> Staff Details
            </CardTitle>
            <CardDescription>Information related to staff role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Staff ID:</span>
              <span className="text-gray-700">{user.staffInfo.staff_id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Slot Duration:</span>
              <span className="text-gray-700">{user.staffInfo.slot_duration} min</span>
            </div>
            <div className="sm:col-span-2 flex flex-col">
              <span className="font-medium">Services:</span>
              <span className="text-gray-700">
                {user.staffInfo.services.length > 0
                  ? user.staffInfo.services.join(", ")
                  : "No services assigned"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
