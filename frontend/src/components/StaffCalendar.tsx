import { Calendar, dayjsLocalizer, Views } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface Appointment {
  id: number;
  client: string;
  service: string;
  date: string;
  start_time: string;
  staff: string;
}

interface StaffCalendarProps {
  appointments: Appointment[];
}

const localizer = dayjsLocalizer(dayjs);

export function StaffCalendar({ appointments }: StaffCalendarProps) {
  // Fecha de hoy para generar eventos dentro del mes actual
  const today = dayjs();

  const events = appointments
    .map((appt) => {
      if (!appt.date || !appt.start_time) return null;
      const start = dayjs(`${appt.date}T${appt.start_time}`);
      if (!start.isValid()) return null;
      const end = start.add(1, "hour");
      return {
        id: appt.id,
        title: `${appt.client} - ${appt.service}`,
        start: start.toDate(),
        end: end.toDate(),
        staff: appt.staff || "Unknown",
      };
    })
    .filter(Boolean);

  // Mock events dentro del mes actual
  const mockEvents = [
    {
      id: 1,
      title: "Client A - Tobillo",
      start: today.hour(10).minute(0).toDate(),
      end: today.hour(11).minute(0).toDate(),
      staff: "Aleix Rebollo",
    },
    {
      id: 2,
      title: "Client B - Rodilla",
      start: today.add(1, "day").hour(14).minute(0).toDate(),
      end: today.add(1, "day").hour(15).minute(0).toDate(),
      staff: "Raquel Admin",
    },
    {
      id: 3,
      title: "Client C - Hombro",
      start: today.add(2, "day").hour(9).minute(30).toDate(),
      end: today.add(2, "day").hour(10).minute(30).toDate(),
      staff: "Aleix Rebollo",
    },
  ];

  const staffColors: Record<string, string> = {
    "Aleix Rebollo": "#3182ce",
    "Raquel Admin": "#38a169",
  };

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: staffColors[event.staff] || "#718096",
      borderRadius: "8px",
      color: "white",
      padding: "4px 6px",
      fontSize: "0.875rem",
      border: "none",
      opacity: 0.9,
    },
  });

  const EventComponent = ({ event }: any) => (
    <div>
      <strong>{event.title.split(" - ")[0]}</strong>
      <div>{event.title.split(" - ")[1]}</div>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-md h-[700px]">
  <Calendar
    localizer={localizer}
    events={mockEvents} // cambia a `events` cuando tengas citas reales
    startAccessor="start"
    endAccessor="end"
    titleAccessor="title"
    eventPropGetter={eventStyleGetter}
    components={{ event: EventComponent }}
    defaultView={Views.MONTH}
    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
  />
</div>
  );
}
