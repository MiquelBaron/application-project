import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDaysoff } from "@/hooks/useDaysoff";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, X } from "lucide-react";
import { DayOff } from "@/types";

/* ------------------ UTILS ------------------ */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB");
};

/* ------------------ COMPONENT ------------------ */
export default function DaysOffPage() {
  const { csrfToken, isAuthenticated } = useAuth();
  const { getDaysoff, loading, error } = useDaysoff(csrfToken);

  const [daysoff, setDaysoff] = useState<DayOff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDayOff, setSelectedDayOff] = useState<DayOff | null>(null);

  /* ------------------ FETCH ALL DAYS OFF ------------------ */
  useEffect(() => {
    const fetchDaysOff = async () => {
      const data = await getDaysoff();
      if (data) setDaysoff(data);
    };
    fetchDaysOff();
  }, []);

  /* ------------------ FILTER ------------------ */
  const filteredDaysOff = daysoff.filter(d =>
    (d.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ------------------ GUARDS ------------------ */
  if (!isAuthenticated)
    return <p className="text-center text-red-500">Please login to see days off.</p>;

  if (loading)
    return <p className="text-center text-muted-foreground">Loading days off...</p>;

  if (error)
    return <p className="text-center text-red-500">Error: {error}</p>;

  /* ------------------ RENDER ------------------ */
  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Days Off</h1>
        <p className="text-muted-foreground">
          Manage all staff days off
        </p>
      </div>

      {/* SEARCH */}
      <Card>
        <CardHeader>
          <CardTitle>Search Days Off</CardTitle>
          <CardDescription>Filter by description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search days off..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Days Off List</CardTitle>
          <CardDescription>
            {filteredDaysOff.length} record
            {filteredDaysOff.length !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDaysOff.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No days off found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDaysOff.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {day.user_first_name} {day.user_last_name}
                      </TableCell>
                      <TableCell>{formatDate(day.start_date)}</TableCell>
                      <TableCell>{formatDate(day.end_date)}</TableCell>
                      <TableCell>{day.description || "—"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedDayOff(day)}
                            >
                              View
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL */}
      {selectedDayOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="relative w-full max-w-md">
            <X
              className="absolute top-4 right-4 h-5 w-5 cursor-pointer text-gray-500 hover:text-black"
              onClick={() => setSelectedDayOff(null)}
            />
            <CardHeader>
              <CardTitle>Day Off Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Staff:</strong>{" "}
                {selectedDayOff.staff_member_id}
              </div>
              <div>
                <strong>Start Date:</strong>{" "}
                {formatDate(selectedDayOff.start_date)}
              </div>
              <div>
                <strong>End Date:</strong>{" "}
                {formatDate(selectedDayOff.end_date)}
              </div>
              <div>
                <strong>Description:</strong>{" "}
                {selectedDayOff.description || "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
