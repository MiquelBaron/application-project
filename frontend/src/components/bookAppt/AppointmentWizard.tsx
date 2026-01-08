import React, { useState } from "react";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";

import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useStaffsByService } from "@/hooks/useStaffsByService";
import { useAvailability } from "@/hooks/useAvailability";
import { useAppointments } from "@/hooks/useAppointment";
import { useAuth } from "@/hooks/useAuth";

import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from "@/components/ui/toast";

interface AppointmentWizardProps {
  onComplete?: () => void;
}

const formatDateLocal = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;

export default function AppointmentWizard({ onComplete }: AppointmentWizardProps) {
  const [clientId, setClientId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [wizardKey, setWizardKey] = useState(0);

  const dayString = selectedDate ? formatDateLocal(selectedDate) : "";

  const { csrfToken } = useAuth();
  const { clients, loading } = useClients(csrfToken);
  const { services, isLoading: loadingServices } = useServices(csrfToken);
  const { staffs, loading: loadingStaffs } = useStaffsByService(serviceId);
  const { slots, loading: loadingAvailability } = useAvailability(
    staffId ?? null,
    serviceId ?? null,
    dayString
  );
  const { createAppointment } = useAppointments();

  const { toasts, toast: showToast, dismiss: dismissToast } = useToast();

  const handleFinalSubmit = async () => {
    if (!clientId || !serviceId || !staffId || !selectedDate || !selectedTime) {
    showToast({ title: "Error", description: "Missing data", variant: "destructive" });
      return;
    }

    const appointmentData = {
      client_id: clientId,
      service_id: serviceId,
      staff_id: staffId,
      date: formatDateLocal(selectedDate),
      start_time: selectedTime,
      additional_info: "",
    };

    try {
      await createAppointment(appointmentData, csrfToken);

      showToast({
        title: "Appointment booked successfully",
        description: `Your appointment for ${selectedDate.toDateString()} at ${selectedTime} has been booked.`,
        variant: "success"
      });

      // Reset wizard
      setClientId(null);
      setServiceId(null);
      setStaffId(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setWizardKey((prev) => prev + 1);

      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      showToast({
        title: "Error booking appointment",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <>
      <FormWizard
        key={wizardKey}
        color="#4f46e5"
        stepSize="sm"
        title="New Appointment"
        subtitle="Follow the steps to complete the booking"
        onComplete={handleFinalSubmit}
        nextButtonText="Next"
        finishButtonText="Confirm"
      >
        {/* --- Steps --- */}
        <FormWizard.TabContent title="Client" icon="ti-user">
          <h3 className="text-lg font-bold mb-3">Select a Client</h3>
          {loading && <p>Loading clients...</p>}
          {!loading && clients && (
            <select
              className="border p-2 w-full rounded"
              value={clientId ?? ""}
              onChange={(e) => setClientId(Number(e.target.value))}
            >
              <option value="">-- Select client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          )}
        </FormWizard.TabContent>

        <FormWizard.TabContent title="Service" icon="ti-clipboard">
          <h3 className="text-lg font-bold mb-3">Select a Treatment</h3>
          {loadingServices && <p>Loading services...</p>}
          {!loadingServices && services && (
            <select
              className="border p-2 w-full rounded"
              value={serviceId ?? ""}
              onChange={(e) => setServiceId(Number(e.target.value))}
            >
              <option value="">-- Select service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </FormWizard.TabContent>

        <FormWizard.TabContent title="Staff" icon="ti-id-badge">
          <h3 className="text-lg font-bold mb-3">Available Staff</h3>
          {loadingStaffs && <p>Loading staff...</p>}
          {!loadingStaffs && staffs && (
            <select
              className="border p-2 w-full rounded"
              value={staffId ?? ""}
              onChange={(e) => setStaffId(Number(e.target.value))}
            >
              <option value="">-- Select staff --</option>
              {staffs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </FormWizard.TabContent>

        <FormWizard.TabContent title="Schedule" icon="ti-calendar">
          <h3 className="text-lg font-bold mb-4">Select Date & Time</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={(date) => {
                if (!date) return;
                setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
                setSelectedTime(null);
              }}
              className="rounded-md border shadow-md p-2"
            />
            <div>
              <h4 className="text-md font-semibold mb-2">Available Times</h4>
              {loadingAvailability && <p>Loading times...</p>}
              {!loadingAvailability && slots.length === 0 && (
                <p className="text-gray-500">No available times for this day.</p>
              )}
              {!loadingAvailability && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const timeStr = slot.split(" ")[1].slice(0, 5);
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(timeStr)}
                        className={`border rounded-md p-2 text-center font-medium transition ${
                          selectedTime === timeStr
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-100"
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {!selectedDate && <p className="mt-3 text-sm text-gray-500">Please select a date to see available times.</p>}
        </FormWizard.TabContent>

        <FormWizard.TabContent title="Confirm" icon="ti-check">
          <h3 className="text-lg font-bold mb-3">Review Appointment</h3>
          <p>
            <strong>Client:</strong> {clients?.find((c) => c.id === clientId)?.first_name ?? "-"}
          </p>
          <p>
            <strong>Service:</strong> {services?.find((s) => s.id === serviceId)?.name ?? "-"}
          </p>
          <p>
            <strong>Staff:</strong> {staffs?.find((s) => s.id === staffId)?.name ?? "-"}
          </p>
          <p>
            <strong>Date:</strong> {selectedDate?.toDateString() ?? "-"}
          </p>
          <p>
            <strong>Time:</strong> {selectedTime ?? "-"}
          </p>
          <p className="mt-7 ">Click "Confirm" to save the appointment.</p>
        </FormWizard.TabContent>
      </FormWizard>

      {/* --- Toasts usando Radix --- */}
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} open={t.open} onOpenChange={() => dismissToast(t.id)}>
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>

      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/lykmapipo/themify-icons@0.1.2/css/themify-icons.css");
      `}</style>
    </>
  );
}
