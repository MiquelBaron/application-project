import { useCallback, useEffect, useState } from "react";
import { NewStaffPayload, Staff } from "@/types";




export function useStaffs(csrfToken?: string) {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = "http://localhost:8001/v1/api/staffs/"
  /* ------------------ FETCH STAFFS ------------------ */
  const fetchStaffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(baseUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch staffs (${res.status})`);
      }

      const json = await res.json();
      const data = json.results
      setStaffs(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ------------------ CREATE STAFF ------------------ */
  const createStaff = async (payload: NewStaffPayload) => {
    setError(null);
    console.log(payload)
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create staff");
      }

      // refresh list after create
      await fetchStaffs();
      return json;
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      throw err;
    }
  };

  /* ------------------ EFFECT ------------------ */
  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  return {
    staffs,
    isLoading,
    error,
    refetch: fetchStaffs,
    createStaff,
  };
}

