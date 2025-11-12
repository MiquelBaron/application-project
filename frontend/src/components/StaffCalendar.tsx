import { Calendar, dayjsLocalizer, Views } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface Appointment {
  id: number;
  client: string;
  service: string;
  date: string;
  start_time: string;
  end_time: string;
  staff: string;
}

interface StaffCalendarProps {
  appointments: Appointment[];
}

const localizer = dayjsLocalizer(dayjs);

export function StaffCalendar({ appointments }: StaffCalendarProps) {
  const today = dayjs();

  const events = appointments
    .map((appt) => {
      if (!appt.date || !appt.start_time) return null;
      const start = dayjs(`${appt.date}T${appt.start_time}`);
      if (!start.isValid()) return null;
      const end = dayjs(`${appt.date}T${appt.end_time}`);
      return {
        id: appt.id,
        title: `${appt.client} - ${appt.service}`,
        start: start.toDate(),
        end: end.toDate(),
        staff: appt.staff || "Unknown",
      };
    })
    .filter(Boolean);

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
    events={events}
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
