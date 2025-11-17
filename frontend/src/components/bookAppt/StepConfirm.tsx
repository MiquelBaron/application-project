"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/useAppointment";

interface StepConfirmProps {
  client: any;
  service: any;
  doctor: any;
  day: string;      // "YYYY-MM-DD"
  slot: string;     // "HH:MM"
  goBack: () => void;
  onComplete?: () => void;
}

export default function StepConfirm({ client, service, doctor, day, slot, goBack, onComplete }: StepConfirmProps) {
  const { createAppointment, loading, error } = useAppointments();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
  if (!client || !service || !doctor) {
    setLocalError("Missing client!");
    return;
  }
  else if(!service){
    setLocalError("Missing service")
    return
  }
  else if(!doctor){
    setLocalError("Missing doctor")
    return
  }

  try {
    const [hour, minute] = slot.split(":").map(Number);
    const [year, month, dayNum] = day.split("-").map(Number);

    const startDate = new Date(year, month - 1, dayNum, hour, minute);
    const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);

    await createAppointment({
      client_id: client.id,
      staff_id: doctor.id,
      service_id: service.id,
      date: startDate.toISOString().split("T")[0],
      start_time: startDate.toTimeString().slice(0, 8),
      end_time: endDate.toTimeString().slice(0, 8),
    });

    alert("Appointment booked!");
    onComplete?.();
  } catch (err: any) {
    setLocalError(err.message || "Failed to book appointment");
  }
};


  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Confirm Appointment</h3>
      <p>Service: {service.name}</p>
      <p>Doctor: {doctor.name}</p>
      <p>Day & Time: {day} {slot}</p>

      {localError && <p className="text-red-500">{localError}</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={goBack} disabled={loading}>Back</Button>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? "Booking..." : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
