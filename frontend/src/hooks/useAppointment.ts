import { useState, useEffect, useCallback } from "react";

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 

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

const createAppointment = async (newAppointment: any, csrfToken: string) => {
  const res = await fetch("http://localhost:8001/v1/api/appointments/", {
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
  await fetchAppointments(); // opcional: refresca la lista de appointments
  return created;
};

  const updateAppointment = async (id: number, updatedData: any, csrfToken) => {
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

  const deleteAppointment = async (id: number,csrfToken) => {
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
