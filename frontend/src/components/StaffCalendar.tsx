import { useState } from "react";
import { Calendar, dayjsLocalizer, Views, View } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useAppointments } from "@/hooks/useAppointment";
import { useAuth } from "@/hooks/useAuth";


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

// Función para generar un color consistente a partir del nombre del staff
function getColorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

export function StaffCalendar({
  appointments: initialAppointments,
  initialView = Views.MONTH,
}: StaffCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<View>(initialView);
  const [appointmentDelete, setAppointmentDelete] = useState<any>(null);

  const { deleteAppointment } = useAppointments();
  const { csrfToken,user } = useAuth();

  // Convertimos citas a eventos del calendario
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

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: getColorFromString(event.staff || "Unknown"),
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
        defaultView={initialView}
        view={view}
        onView={(v) => setView(v)}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        onSelectEvent={(event) => setSelectedEvent(event)}
      />

      {/* Modal de evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6 relative transform transition-transform duration-200 scale-95 animate-scaleIn">
            <div className="mb-4 border-b border-gray-200 pb-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedEvent.title.replace("Client: ", "")}
              </h2>
              <p className="text-sm text-gray-500"> Staff: {selectedEvent.staff}</p>
            </div>

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

            <div className="mt-6 flex justify-end gap-2">
              {user.group ==="Admins" && (
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                onClick={() => setAppointmentDelete(selectedEvent)}
              >
                Delete
              </button>
              )}
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AlertDialog de confirmación */}
      {appointmentDelete && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open) setAppointmentDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the appointment on{" "}
                <span className="font-semibold">
                  {dayjs(appointmentDelete.start).format("DD/MM/YYYY HH:mm")}
                </span>{" "}
                or the service <strong>{appointmentDelete.service}</strong> and client{" "}
                <strong>{appointmentDelete.title.replace("Client: ", "")}</strong>?
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive"
                onClick={async () => {
                  try {
                    await deleteAppointment(appointmentDelete.id!, csrfToken);
                    // Actualizamos el estado local para recargar el calendario
                    setAppointments((prev) =>
                      prev.filter((a) => a.id !== appointmentDelete.id)
                    );
                    setAppointmentDelete(null);
                    setSelectedEvent(null);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
