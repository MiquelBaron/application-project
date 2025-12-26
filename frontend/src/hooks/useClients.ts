import { useState, useEffect, useCallback } from "react";

export function useClients(csrfToken: string | null) {
  const baseUrl = "http://localhost:8001/v1/api/clients/";

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  interface Client {
    id?: number;
    source?: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    extra_info?: string;
    date_of_birth?: string | null; // YYYY-MM-DD
    gender?: "M" | "F" | "O";
    address?: string;
  }

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
      setClients(data.clients ?? data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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
      await fetchClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ---------------- UPDATE CLIENT ----------------
  const updateClient = async (clientId: number, payload: Client) => {
    if (!csrfToken || !clientId || !payload) return;
    try {
      const res = await fetch(`${baseUrl}${clientId}/`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error updating client: ${res.status} ${text}`);
      }
      await fetchClients(); // refresh list
    } catch (err: any) {
      setError(err.message);
    }
  };

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
      return data.count ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  const getClientById = async(client_id:number) => {
    try{
      if (!client_id) return;
      const res = await fetch(`${baseUrl}${client_id}/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Error fetching client info");
      return await res.json();
    } catch(err){
      console.log(err);
      return;
    }
  }

  const deleteClient = async(client_id:number) => {
    const res = await fetch(`${baseUrl}${client_id}/`,{
       method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
    });

    if(!res.ok){throw new Error("Error deleting client")}
    await fetchClients();

  }

  return {
    clients,
    fetchClients,
    createClient,
    updateClient, // <-- new method
    clientsCount,
    getClientById,
    deleteClient,
    loading,
    error,
  };
}
