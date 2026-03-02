import { useState } from "react";
import { WorkingHours } from "@/types";

export function useWorkingHours(csrfToken?: string) {
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL +"/workinghours/"; 


  const fetchWorkingHours = async (staff_id: number) => {
    if (!staff_id) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}staff/${staff_id}/`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch working hours");

      const data = await res.json();
      setWorkingHours(data.working_hours);
    } catch (err) {
      setError("Error fetching working hours");
    } finally {
      setIsLoading(false);
    }
  };

  const postWorkingHours = async (
    staff_id: number,
    payload: WorkingHours[]
  ) => {
    if (!csrfToken || !staff_id || !payload.length) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}staff/${staff_id}/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save working hours");

      await fetchWorkingHours(staff_id);
    } catch (err) {
      setError("Error saving working hours");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    workingHours,
    isLoading,
    error,
    fetchWorkingHours,
    postWorkingHours,
  };
}
