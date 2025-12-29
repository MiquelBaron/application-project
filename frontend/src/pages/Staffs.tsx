"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffs } from "@/hooks/useStaffs";
import { useServices } from "@/hooks/useServices";
import { StaffWizard } from "@/components/staff/StaffWizard";
import { WorkingHoursModal } from "@/components/modals/WorkingHoursModal";
import { Staff } from "@/types";
import { DayOff } from "@/types";
import { useDaysoff } from "@/hooks/useDaysoff";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Service {
  id: number;
  name: string;
}

interface ModifyServicesModalProps {
  open: boolean;
  staff: Staff | null;
  services: Service[];
  onClose: () => void;
  onSave: (serviceIds: number[]) => void;
}

function ModifyServicesModal({
  open,
  staff,
  services,
  onClose,
  onSave,
}: ModifyServicesModalProps) {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    if (staff) {
      setSelectedServices(staff.services_offered?.map(s => s.id) || []);
    }
  }, [staff]);

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modify Services Offered</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() =>
                  setSelectedServices((prev) =>
                    prev.includes(service.id)
                      ? prev.filter((id) => id !== service.id)
                      : [...prev, service.id]
                  )
                }
              />
              <span>{service.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(selectedServices)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Staffs() {
  const { csrfToken, isAuthenticated } = useAuth();
  const { staffs, isLoading, error, createStaff, deleteStaff, modifyServicesOffered } = useStaffs(csrfToken);
  const { services } = useServices();
  const { getDaysoffByStaff } = useDaysoff(csrfToken);

  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [showDaysOff, setShowDaysOff] = useState(false);

  // Nuevo estado para modal de services y lista local
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedStaffForServices, setSelectedStaffForServices] = useState<Staff | null>(null);
  const [localStaffs, setLocalStaffs] = useState<Staff[]>([]);

  // Sincronizar lista local cuando cambian los staffs
  useEffect(() => {
    setLocalStaffs(staffs);
  }, [staffs]);

  // ------------------ GUARDS ------------------
  if (!isAuthenticated) return <p className="text-center text-red-500">Please login to see staff members.</p>;
  if (isLoading) return <p className="text-center text-muted-foreground">Loading staff members...</p>;
  if (error) return <p className="text-center text-red-500">Error loading staff: {error}</p>;

  // ------------------ FILTER ------------------
  const filteredStaffs = localStaffs.filter((s) =>
    `${s.user_first_name} ${s.user_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ------------------ Handlers ------------------
  const handleViewDaysOff = async (staffId: number) => {
    const data = await getDaysoffByStaff(staffId);
    setDaysOff(data);
    setShowDaysOff(true);
  };

  const handleServicesOffered = (staff: Staff) => {
    setSelectedStaffForServices(staff);
    setShowServicesModal(true);
  };

  const handleSaveServices = async (serviceIds: number[]) => {
    if (!selectedStaffForServices) return;
    try {
      await modifyServicesOffered(selectedStaffForServices.id, serviceIds)

      // Actualizar lista local
      setLocalStaffs(
        localStaffs.map((s) =>
          s.id === selectedStaffForServices.id
            ? { ...s, services_offered: services.filter((svc) => serviceIds.includes(svc.id)) }
            : s
        )
      );

      setShowServicesModal(false);
      setSelectedStaffForServices(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Members</h1>
          <p className="text-muted-foreground">Manage and view all staff in the organization</p>
        </div>
        <Button className="bg-gradient-primary text-white hover:opacity-90" onClick={() => setShowWizard(true)}>
          <UserCog className="mr-2 h-4 w-4" /> New Staff Member
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Staff</CardTitle>
          <CardDescription>Search by name</CardDescription>
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
            {filteredStaffs.length} staff member{filteredStaffs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStaffs.length === 0 ? (
            <p className="text-center text-muted-foreground">No staff members match your search.</p>
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
                  {filteredStaffs.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>{staff.id}</TableCell>
                      <TableCell className="font-medium">{staff.user_first_name} {staff.user_last_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" /> {staff.user_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3" /> {staff.slot_duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.services_offered?.length
                          ? staff.services_offered.map((s) => s.name).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {staff.set_timetable ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Configured
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-yellow-600 cursor-pointer">
                                <AlertTriangle className="h-4 w-4" /> Missing
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Timetable not configured yet</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDaysOff(staff.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View days off
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleServicesOffered(staff)}>
                              <Edit className="mr-2 h-4 w-4" /> Modify services offered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => {
                                setSelectedStaff(staff);
                                setShowWorkingHours(true);
                              }}
                            >
                              <Clock className="h-4 w-4" />
                              <span>
                                {staff.set_timetable ? "View working hours" : "Set working hours"}
                              </span>
                              {!staff.set_timetable && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            </DropdownMenuItem>
                         
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteStaff(staff.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Staff Wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Staff Member</DialogTitle>
          </DialogHeader>
          <StaffWizard onCreate={createStaff} onSuccess={() => setShowWizard(false)} availableServices={services} />
        </DialogContent>
      </Dialog>

      {/* Working Hours Modal */}
      {selectedStaff && (
        <WorkingHoursModal
          staffId={selectedStaff.id}
          open={showWorkingHours}
          onClose={() => setShowWorkingHours(false)}
          canEdit={!selectedStaff.set_timetable}
          csrfToken={csrfToken}
        />
      )}

      {/* Days Off Modal */}
      {showDaysOff && (
        <Dialog open={showDaysOff} onOpenChange={setShowDaysOff}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Days Off</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {daysOff.length === 0 ? (
                <p className="text-center text-muted-foreground">No days off found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daysOff.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>{day.start_date}</TableCell>
                        <TableCell>{day.end_date}</TableCell>
                        <TableCell>{day.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowDaysOff(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modify Services Modal */}
      <ModifyServicesModal
        open={showServicesModal}
        staff={selectedStaffForServices}
        services={services}
        onClose={() => setShowServicesModal(false)}
        onSave={handleSaveServices}
      />
    </div>
  );
}
