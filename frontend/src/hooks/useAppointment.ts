import { useState, useEffect, useCallback } from "react";

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrfToken = sessionStorage.getItem("csrfToken") || "";

  // Debugging seguro: log cuando appointments cambie
  useEffect(() => {
    console.log("appointments actualizados:", appointments);
  }, [appointments]);

  // Cargar citas desde el backend
  const fetchAppointments = useCallback(async () => {
    console.log("Called fetchAppointments");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8001/v1/api/appointments/", {
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
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (newAppointment: any) => {
    const res = await fetch("http://localhost:8001/v1/api/appointments/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(newAppointment),
    });
    if (!res.ok) throw new Error("Error creating appointment");
    await fetchAppointments();
  };

  const updateAppointment = async (id: number, updatedData: any) => {
    const res = await fetch(`http://localhost:8001/v1/api/appointments/${id}/`, {
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

  const deleteAppointment = async (id: number) => {
    const res = await fetch(`http://localhost:8001/v1/api/appointments/${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": csrfToken },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error deleting appointment");
    await fetchAppointments();
  };

  const getAppointmentInfo = async (id: number) => {
    const res = await fetch(`http://localhost:8001/v1/api/appointments/${id}/`, {
      method: "GET",
      headers: { "X-CSRFToken": csrfToken },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error getting appointment info");
    return await res.json();
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentInfo,
  };
}
