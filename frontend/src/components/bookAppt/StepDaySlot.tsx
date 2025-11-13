"use client";
import { useAvailability } from "@/hooks/useAvailability";
import { Button } from "@/components/ui/button";

export default function StepDaySlot({
  doctor,
  service,
  selectedDay,
  setSelectedDay,
  selectedSlot,
  setSelectedSlot,
  goNext,
  goBack,
}: any) {
  const { slots, loading } = useAvailability(doctor?.id, service?.id, selectedDay);

  return (
    <div>
      <h3 className="font-bold mb-2">Select a day</h3>
      <input
        title="mock"
        type="date"
        value={selectedDay}
        min={new Date().toISOString().split("T")[0]}
        onChange={(e) => setSelectedDay(e.target.value)}
        className="border p-2 rounded mb-2"
      />

      <h3 className="font-bold mb-2">Available time slots</h3>
      {loading ? (
        <p>Loading slots...</p>
      ) : slots.length === 0 ? (
        <p>No available slots for this day</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {slots.map((slot: string) => (
            <button
              key={slot}
              className={`border rounded px-2 py-1 ${
                selectedSlot === slot ? "bg-primary text-white" : ""
              }`}
              onClick={() => setSelectedSlot(slot)}
            >
              {new Date(slot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button onClick={goBack}>Back</Button>
        <Button disabled={!selectedSlot} onClick={goNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
