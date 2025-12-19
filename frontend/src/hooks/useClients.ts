import { useState, useEffect, useCallback } from "react";

export function useClients(csrfToken: string | null) {
  const baseUrl = "http://localhost:8001/v1/api/clients/";

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(baseUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
      });
      if (!res.ok) throw new Error("Error fetching clients");
      const data = await res.json();
      setClients(data.clients ?? data); // Ajusta según tu backend
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  // Cargar clients al montar el hook
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Crear nuevo client
  const createClient = async (payload: any) => {
    if (!csrfToken || !payload) return;
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error creating client: ${res.status} ${text}`);
      }
      await fetchClients(); // refresca la lista
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Contar clientes
  const clientsCount = async (): Promise<number> => {
    try {
      const res = await fetch(`${baseUrl}count/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Error fetching clients count");
      const data = await res.json();

      return data.count ?? 0; // Ajusta según tu backend
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  return {
    clients,
    fetchClients,
    createClient,
    clientsCount,
    loading,
    error,
  };
}
