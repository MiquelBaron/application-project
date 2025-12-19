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
import { useAppointments } from "@/hooks/useAppointment";
import { useClients } from "@/hooks/useClients";

 interface Appointment {
  id: number;
  customer: string;
  service: string;
  date: string; // ISO string
  duration: number; // minutos
  start_time: string; 
  staff: string;
}

export default function Dashboard() {
  // Hooks
  const { csrfToken } = useAuth();
  const { getTodayAppointments, getWeekAppointments, getRecentAppointments } = useAppointments();
  const { clientsCount } = useClients(csrfToken);

  // useState
  const [apptToday, setTodaysAppointments] = useState<number>(0);
  const [apptWeek, setWeekAppts] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTodayAppointments();      
        const week = await getWeekAppointments();      
        const customers = await clientsCount();         
        const recentAppt = await getRecentAppointments();

        setTodaysAppointments(data.appointments_today);
        setWeekAppts(week.week_appointments);
        setCustomersCount(customers);
        setRecentAppointments(recentAppt)
      } catch (err) {
        console.error(err);
        setTodaysAppointments(0);
        setWeekAppts(0);
        setCustomersCount(0);
      }
    }

    load();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!isAuthenticated) return null;

  const stats = [
    {
      title: "Today's Appointments",
      value: apptToday,
      icon: Calendar,
      color: "bg-primary text-white",
    },
    {
      title: "This Week",
      value: apptWeek,
      icon: CalendarDays,
      color: "bg-success text-white",
    },
    {
      title: "Active Customers",
      value: customersCount,
      icon: Users,
      color: "bg-info text-white",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${variants[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
          className=" text-white hover:scale-105 transition-transform flex items-center gap-2"
          onClick={() => setWizardOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="flex items-center p-4 shadow-lg hover:shadow-xl transition-shadow rounded-xl">
            <div className={`p-3 rounded-full ${stat.color} mr-4 flex items-center justify-center`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Appointments */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={()=>{navigate("/calendar?view=agenda")}}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
  <div className="space-y-4">
    {recentAppointments.map((appt) => (
      <div
        key={appt.id}
        className="flex justify-between items-center p-4 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
      >
        {/* Información principal */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-muted-foreground">Customer:</span>
            <span className="font-medium text-foreground">{appt.customer}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-muted-foreground">Staff:</span>
            <span className="font-medium text-foreground">{appt.staff}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {appt.service} • {appt.duration} 
          </p>
        </div>

        {/* Fecha y estado */}
        <div className="flex flex-col items-end space-y-1">
          <p className="text-sm font-medium text-foreground">
            {appt.date} - {appt.start_time}
          </p>
        </div>
      </div>
    ))}
  </div>
</CardContent>

      </Card>

      {/* Appointment Wizard Dialog */}
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
