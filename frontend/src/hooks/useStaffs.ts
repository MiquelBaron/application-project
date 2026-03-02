import { useCallback, useEffect, useState } from "react";
import { NewStaffPayload, Staff } from "@/types";
import { Service } from "@/types";



export function useStaffs(csrfToken?: string) {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_API_URL +"/staffs/"; 
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


  const deleteStaff = async (staff_id: number) => {
  const res = await fetch(`${baseUrl}${staff_id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete staff");
  }
  await fetchStaffs(); // refresca la lista
};



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

  const modifyServicesOffered = async(staff_id:number, services:Number[]) =>{
    const res = await fetch(`${baseUrl}${staff_id}/services/`,{
      method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
      body: JSON.stringify(services)
    });

    const json = await res.json();
    if(!res.ok){
      setError(json.error)
      throw new Error(json.error || "Failed to create staff");
  }}

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
    deleteStaff,
    modifyServicesOffered
  };
}

