"use client";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";

export default function StepService({ selectedService, setSelectedService, goNext }: any) {
  const { services, isLoading } = useServices();

  return (
    <div>
      <h3 className="font-bold mb-2">Select a service</h3>
      {isLoading ? (
        <p>Loading services...</p>
      ) : (
        <select
          title="select"
          value={selectedService?.id || ""}
          onChange={(e) => {
            const svc = services.find((s: any) => s.id === Number(e.target.value));
            setSelectedService(svc);
            goNext();
          }}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select --</option>
          {services.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
