"use client";
import { useStaffsByService } from "@/hooks/useStaffsByService";
import { Button } from "@/components/ui/button";

export default function StepDoctor({ service, selectedDoctor, setSelectedDoctor, goNext, goBack }: any) {
  const { staffs, loading, error } = useStaffsByService(service?.id || null);

  if (!service) return <p>Please select a service first.</p>;

  return (
    <div>
      <h3 className="font-bold mb-2">Select a doctor</h3>
      {loading ? (
        <p>Loading doctors...</p>
      ) : error ? (
        <p className="text-red-500">Error loading doctors: {error}</p>
      ) : (
        <>
          <select
          title="mock"
            value={selectedDoctor?.id || ""}
            onChange={(e) => {
              const doc = staffs.find((s: any) => s.id === Number(e.target.value));
              setSelectedDoctor(doc);
              goNext();
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select --</option>
            {staffs.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name} 
              </option>
            ))}
          </select>
          <div className="mt-2 flex justify-between">
            <Button onClick={goBack}>Back</Button>
          </div>
        </>
      )}
    </div>
  );
}

