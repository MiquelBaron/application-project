"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffs } from "@/hooks/useStaffs";
import { StaffWizard } from "@/components/staff/StaffWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Search,
  UserCog,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Staffs() {
  const { csrfToken, isAuthenticated } = useAuth();
  const { data, error, isLoading } = useStaffs(csrfToken);
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  if (!isAuthenticated)
    return (
      <p className="text-center text-red-500">
        Please login to see staff members.
      </p>
    );
  if (isLoading)
    return (
      <p className="text-center text-muted-foreground">
        Loading staff members...
      </p>
    );
  if (error)
    return (
      <p className="text-center text-red-500">
        Error loading staff: {error.message}
      </p>
    );

  const staffs = data?.results || [];

  const filteredStaffs = staffs.filter((s: any) =>
    `${s.user_first_name} ${s.user_last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Members</h1>
          <p className="text-muted-foreground">
            Manage and view all staff in the organization
          </p>
        </div>
        <Button
          className="bg-gradient-primary text-white hover:opacity-90"
          onClick={() => setShowWizard(true)}
        >
          <UserCog className="mr-2 h-4 w-4" />
          New Staff Member
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Staff</CardTitle>
          <CardDescription>Search by name or username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>
            {filteredStaffs.length} staff member
            {filteredStaffs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStaffs.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No staff members match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Slot Duration</TableHead>
                    <TableHead>Services Offered</TableHead>
                    <TableHead>Timetable</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredStaffs.map((staff: any) => (
                    <TableRow key={staff.id} className="hover:bg-muted/50">
                      <TableCell>{staff.id}</TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCog className="h-4 w-4 text-primary" />
                          </div>
                          <p className="font-medium">
                            {staff.user_first_name} {staff.user_last_name}
                          </p>
                        </div>
                      </TableCell>

                      {/* Email – backend aún no lo envía */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {staff.email || "—"}
                        </div>
                      </TableCell>

                      {/* Slot Duration */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3" />
                          {staff.slot_duration} min
                        </div>
                      </TableCell>

                      {/* Services Offered */}
                      <TableCell>
                        {staff.services_offered?.length > 0
                          ? staff.services_offered.map((s: any) => s.name).join(", ")
                          : "—"}
                      </TableCell>

                      {/* Timetable Status */}
                      <TableCell>
                        {staff.set_timetable ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Configured</span>
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 cursor-pointer text-yellow-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">Missing</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              This staff member needs to be assigned a timetable.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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

      {/* Wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Staff Member</DialogTitle>
          </DialogHeader>
          <StaffWizard onSuccess={() => setShowWizard(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
