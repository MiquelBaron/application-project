import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

import {
  Calendar,
  CalendarDays,
  Users,
  Clock,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import AppointmentWizard from "@/components/bookAppt/AppointmentWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // si usas shadcn/ui
import { useNavigate } from "react-router-dom"; 

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"

// Mock data - in real app, this would come from your Django API
const stats = [
  {
    title: "Today's Appointments",
    value: "12",
    change: "+2.5%",
    icon: Calendar,
    color: "text-primary",
  },
  {
    title: "This Week",
    value: "48",
    change: "+12%",
    icon: CalendarDays,
    color: "text-success",
  },
  {
    title: "Active Customers",
    value: "234",
    change: "+5.2%",
    icon: Users,
    color: "text-info",
  },
  {
    title: "Pending Appointments",
    value: "8",
    change: "-1.2%",
    icon: Clock,
    color: "text-warning",
  },
];

const recentAppointments = [
  {
    id: 1,
    customer: "John Doe",
    service: "Consultation",
    time: "10:00 AM",
    status: "confirmed",
    duration: "30 min",
  },
  {
    id: 2,
    customer: "Jane Smith",
    service: "Follow-up",
    time: "11:30 AM",
    status: "pending",
    duration: "15 min",
  },
  {
    id: 3,
    customer: "Mike Johnson",
    service: "Initial Assessment",
    time: "2:00 PM",
    status: "confirmed",
    duration: "45 min",
  },
  {
    id: 4,
    customer: "Sarah Wilson",
    service: "Consultation",
    time: "3:30 PM",
    status: "cancelled",
    duration: "30 min",
  },
  {
    id: 5,
    customer: "David Brown",
    service: "Treatment",
    time: "4:15 PM",
    status: "completed",
    duration: "60 min",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "pending":
      return <Clock className="h-4 w-4 text-warning" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "completed":
      return <AlertCircle className="h-4 w-4 text-info" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants = {
    confirmed: "bg-success-light text-success border-success",
    pending: "bg-warning-light text-warning border-warning",
    cancelled: "bg-destructive-light text-destructive border-destructive",
    completed: "bg-info-light text-info border-info",
  };

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function Dashboard() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate(); // <-- Reemplaza router

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("User not authenticated")
      navigate("/login"); // <-- Reemplaza router.push
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <p>Loading...</p>;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your appointments.
          </p>
        </div>
        <Button
          className="bg-gradient-primary text-white hover:opacity-90"
          onClick={() => setWizardOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3" />
                {stat.change} from last week
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Appointments */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>
                Your latest appointment bookings and their current status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border p-4 shadow-soft transition-shadow hover:shadow-medium"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center">
                    {getStatusIcon(appointment.status)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {appointment.customer}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.service} • {appointment.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{appointment.time}</p>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book a New Appointment</DialogTitle>
          </DialogHeader>

          <AppointmentWizard
            onComplete={() => {
                toast({ title: "Appointment booked successfully!" });
              setWizardOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
    
    
  );
}