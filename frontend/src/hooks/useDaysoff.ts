import { create } from "domain";
import { useState } from "react";

interface DayOff {
  start_date: string;
  end_date: string;
  description: string;
}

export function useDaysoff(csrfToken: string) {
  const baseUrl = import.meta.env.VITE_API_URL +"/daysoff/";
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
      return data;
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createDayOff = async (staff_id: number, data: { start_date: string; end_date: string; description: string }) => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`${baseUrl}staffs/${staff_id}/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || "Error creating day off.");
    }
    const newDayOff: DayOff = await res.json();
    return newDayOff;
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

  return {  loading, error, getDaysoffByStaff, getDaysoff, createDayOff };
}
