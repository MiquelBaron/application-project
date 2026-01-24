import { useState, useEffect, useCallback } from "react";

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL +"/appointments/";
  // GET all appointments
  const fetchAppointments = useCallback(async () => {
    console.log("Called fetchAppointments");
    try {
      setLoading(true);
      const res = await fetch(baseUrl, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error fetching appointments");
      const data = await res.json();
      console.log("data recibida:", data);
      setAppointments(data.appointments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Post
  const createAppointment = async (newAppointment: any, csrfToken: string) => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(newAppointment),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error creating appointment: ${res.status} ${text}`);
    }

    const created = await res.json();
    await fetchAppointments();
    return created;
  };

  // PUT
  const updateAppointment = async (
    id: number,
    updatedData: any,
    csrfToken: string
  ) => {
    const res = await fetch(`${baseUrl}${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error("Error updating appointment");
    await fetchAppointments();
  };

  // DELETE
  const deleteAppointment = async (id: number, csrfToken: string) => {
    const res = await fetch(`${baseUrl}${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": csrfToken },
      credentials: "include",
    });

    if (!res.ok) throw new Error("Error deleting appointment");
    await fetchAppointments();
  };

  // GET by id
  const getAppointmentInfo = async (id: number) => {
    const res = await fetch(`${baseUrl}${id}/`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Error getting appointment info");
    return await res.json();
  };

  const getTodayAppointments = async () =>{
    const res = await fetch(`${baseUrl}today/`, {
      method: "GET",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Error getting today's appointments");
    return await res.json();
  };

  const getWeekAppointments = async() =>{
    const {start, end} = getWeekRange()
    const res = await fetch(`${baseUrl}${start}/${end}/`,{
      method:"GET",
      credentials:"include"
    })
    if (!res.ok) throw new Error("Error getting week's appointments.")
    return res.json();
  }

  const getRecentAppointments = async() =>{
    const res = await fetch(`${baseUrl}recent/`,{
      method:"GET",
      credentials:"include"
    })
    if (!res.ok) throw new Error("Error getting recent appointments")
    const res2 = await res.json()
    return res2.recent_appointments ?? ""
  }

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentInfo,
    getTodayAppointments,
    getWeekAppointments,
    getRecentAppointments
  };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo, 1 = lunes, ...
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7)); // lunes
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // domingo

  const formatDate = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD
  return { start: formatDate(monday), end: formatDate(sunday) };
}
