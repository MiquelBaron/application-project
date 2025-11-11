import { useAppointments } from "@/hooks/useAppointment";
import { StaffCalendar } from "@/components/StaffCalendar";

export default function CalendarPage() {
    const { appointments, loading, error } = useAppointments();
    console.log("Loading calendar page")
    console.log(appointments)
  if (loading) return <div>Cargando citas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Calendario de Citas</h1>
      <StaffCalendar appointments={appointments} />
    </div>
  );
}
