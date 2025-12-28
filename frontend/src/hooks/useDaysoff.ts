import { useState } from "react";

interface DayOff {
  start_date: string;
  end_date: string;
  description: string;
}

export function useDaysoff(csrfToken: string) {
  const baseUrl = "http://localhost:8001/v1/api/daysoff/";
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getDaysoffByStaff = async (staff_id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}staffs/${staff_id}/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
      });
      if (!res.ok) {
        throw new Error("Error fetching daysoff.");
      }
      const data: DayOff[] = await res.json();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getDaysoff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
      });
      if (!res.ok) {
        throw new Error("Error fetching daysoff.");
      }
      const data: DayOff[] = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return {  loading, error, getDaysoffByStaff, getDaysoff };
}
