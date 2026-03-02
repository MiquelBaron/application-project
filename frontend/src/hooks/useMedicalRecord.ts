import useSWR from "swr";

export function useMedicalRecords(clientId: number | null, csrfToken: string) {
const baseUrl = import.meta.env.VITE_API_URL; 
  const fetcher = (url: string) =>
    fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
    }).then((res) => res.json());

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    return fetch(`${baseUrl}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
      ...options,
    });
  };

  const { data, error, mutate, isLoading } = useSWR(
    clientId ? `${baseUrl}/clients/${clientId}/medical_records/` : null,
    fetcher
  );

  const create = async (payload: any) => {
    if (!clientId) return;
    await apiFetch("/medical_records/", {
      method: "POST",
      body: JSON.stringify({ ...payload, client: clientId }),
    });
    mutate();
  };

  const update = async (recordId: number, payload: any) => {
    await apiFetch(`/medical_records/${recordId}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    mutate();
  };

  const remove = async (recordId: number) => {
    await apiFetch(`/medical_records/${recordId}/`, {
      method: "DELETE",
    });
    mutate();
  };

  return { data, error, isLoading, mutate, create, update, remove };
}
