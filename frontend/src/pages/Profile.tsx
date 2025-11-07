import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type User = {
  id: number;
  fullName: string;
  group: string;
  isSuperuser: boolean;
  staffInfo: {
    group: string;
    staff_id: number;
    slot_duration: number;
    services: string[];
  } | null;
};

export default function Profile() {
  const userString = sessionStorage.getItem("user");
  const user: User | null = userString ? JSON.parse(userString) : null;

  if (!user) {
    return (
      <p className="text-center text-red-500 mt-6">
        No user logged in
      </p>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-medium">Username: {user.fullName}</p>
          <p>
            Group: <Badge variant="outline">{user.group}</Badge>
          </p>
          <p>
            Superuser: <Badge variant="outline">{user.isSuperuser ? "Yes" : "No"}</Badge>
          </p>

          {user.staffInfo && (
            <div className="mt-4 space-y-1">
              <p className="font-medium">Staff Details:</p>
              <p>Staff ID: {user.staffInfo.staff_id}</p>
              <p>Slot Duration: {user.staffInfo.slot_duration} min</p>
              <p>
                Services:{" "}
                {user.staffInfo.services.length > 0
                  ? user.staffInfo.services.join(", ")
                  : "No services assigned"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
