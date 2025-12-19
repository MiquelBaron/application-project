import { useState } from "react";
import { Calendar, dayjsLocalizer, Views, View } from "react-big-calendar";
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
  initialView?: View;
}

const localizer = dayjsLocalizer(dayjs);

export function StaffCalendar({ appointments, initialView = Views.MONTH }: StaffCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const events = appointments
    .map((appt) => {
      if (!appt.date || !appt.start_time) return null;
      const start = dayjs(`${appt.date}T${appt.start_time}`);
      if (!start.isValid()) return null;
      const end = dayjs(`${appt.date}T${appt.end_time}`);
      return {
        id: appt.id,
        title: `Client: ${appt.client}`,
        service: appt.service,
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
      <strong>{event.title}</strong>
    </div>
  );

  const [view, setView] = useState<View>(initialView);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md h-[700px] relative">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        eventPropGetter={eventStyleGetter}
        components={{ event: EventComponent }}
        defaultView={initialView}  // vista inicial
        view={view}                // vista controlada
        onView={(v) => setView(v)} // manejar cambios de vista por el usuario
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        onSelectEvent={(event) => setSelectedEvent(event)}
      />

      {/* Modal Profesional */}
{selectedEvent && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 animate-fadeIn">
    <div className="bg-white rounded-xl shadow-lg w-96 p-6 relative transform transition-transform duration-200 scale-95 animate-scaleIn">
      {/* Botón de cierre */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        onClick={() => setSelectedEvent(null)}
        aria-label="Cerrar"
      >
        ✖
      </button>

      {/* Header */}
      <div className="mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-2xl font-semibold text-gray-800">
          {selectedEvent.title}
        </h2>
        <p className="text-sm text-gray-500"> Staff: {selectedEvent.staff}</p>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Service:</span>
          <span className="text-gray-800">{selectedEvent.service}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Start:</span>
          <span className="text-gray-800">
            {dayjs(selectedEvent.start).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">End:</span>
          <span className="text-gray-800">
            {dayjs(selectedEvent.end).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      </div>

      {/* Footer opcional */}
      <div className="mt-6 text-right">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => setSelectedEvent(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
