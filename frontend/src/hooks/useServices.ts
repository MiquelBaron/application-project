import { useEffect, useState } from "react";

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: string;
  allow_rescheduling?: boolean;
}

export function useServices(csrfToken?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = "http://localhost:8001/v1/api/services/";

  // Fetch all services
  const fetchServices = async () => {
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

      if (!res.ok) throw new Error(`Failed to fetch services: ${res.statusText}`);
      const json = await res.json();
      // EXTRAEMOS EL ARRAY DE SERVICIOS
      setServices(Array.isArray(json.services) ? json.services : []);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [csrfToken]);

  // Create a new service
  const createService = async (data: Partial<Service>) => {
    try {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to create service: ${res.statusText}`);
      const newService = await res.json();
      setServices(prev => [...prev, newService]);
      return newService;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Edit a service
  const editService = async (id: number, data: Partial<Service>) => {
    try {
      const res = await fetch(`${baseUrl}${id}/`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to edit service: ${res.statusText}`);
      const updatedService = await res.json();
      setServices(prev => prev.map(s => (s.id === id ? updatedService : s)));
      return updatedService;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Delete a service
  const deleteService = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
      });

      if (!res.ok) throw new Error(`Failed to delete service: ${res.statusText}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  return {
    services,
    isLoading,
    error,
    fetchServices,
    createService,
    editService,
    deleteService,
  };
}
