"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface StepConfirmProps {
  client: any;
  service: any;
  doctor: any;
  day: string;
  slot: string;
  goBack: () => void;
  onComplete?: () => void; // <- nuevo
}

export default function StepConfirm({ client, service, doctor, day, slot, goBack, onComplete }: StepConfirmProps) {
  const handleConfirm = async () => {
    const [dateStr, timeStr] = slot.split(" ");
    const [year, month, dayNum] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    const res = await fetch("/v1/api/appointments/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: client.id,
        staff_id: doctor.id,
        service_id: service.id,
        date: `${year}-${month}-${dayNum}`,
        start_time: `${hour}:${minute}:00`,
      }),
    });

    if (res.ok) {
      alert("Appointment booked!");
      if (onComplete) onComplete(); // <- llama al callback si existe
    } else {
      const err = await res.json();
      alert("Error: " + (err.detail || "Failed to book"));
    }
  };

  return (
    <div>
      <h3 className="font-bold mb-2">Confirm Appointment</h3>
      <p>Service: {service.name}</p>
      <p>Doctor: {doctor.name} </p>
      <p>Day & Time: {slot}</p>

      <div className="flex justify-between mt-2">
        <Button onClick={goBack}>Back</Button>
        <Button onClick={handleConfirm}>Confirm</Button>
      </div>
    </div>
  );
}
