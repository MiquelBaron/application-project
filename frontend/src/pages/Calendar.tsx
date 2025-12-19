import { useAppointments } from "@/hooks/useAppointment";
import { StaffCalendar } from "@/components/StaffCalendar";
import { Views } from "react-big-calendar";
import { useLocation } from "react-router-dom";

export default function CalendarPage() {
  const { appointments, loading, error } = useAppointments();
  const location = useLocation();

  // Leer query param "view" (ej: /calendar?view=day)
  const searchParams = new URLSearchParams(location.search);
  const viewParam = searchParams.get("view")?.toLowerCase();

  // Mapear string a Views
  const initialView = (() => {
    switch (viewParam) {
      case "day":
        return Views.DAY;
      case "week":
        return Views.WEEK;
      case "agenda":
        return Views.AGENDA;
      default:
        return Views.MONTH;
    }
  })();

  if (loading) return <div>Cargando citas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Calendario de Citas</h1>
      <StaffCalendar appointments={appointments} initialView={initialView} />
    </div>
  );
}
