import useSWR from "swr";

export function useMedicalRecords(clientId: number | null, csrfToken: string) {
    console.log(csrfToken)
  const fetcher = (url: string) =>
    fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken 
      },
    }).then((res) => res.json());

  const { data, error, mutate, isLoading } = useSWR(
    clientId ? `http://localhost:8001/v1/api/clients/${clientId}/medical_records/` : null,
    fetcher
  );

  const create = async (payload: any) => {
    if (!clientId) return;
    await fetch(`http://localhost:8001/v1/api/medical_records/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
      body: JSON.stringify({ ...payload, client: clientId }),
    });
    mutate();
  };

  const update = async (recordId: number, payload: any) => {
    await fetch(`http://localhost:8001/v1/api/medical_records/${recordId}/`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
         "X-CSRFToken": csrfToken
      },
      body: JSON.stringify(payload),
    });
    mutate();
  };

  const remove = async (recordId: number) => {
    await fetch(`http://localhost:8001/v1/api/medical_records/${recordId}/`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
    });
    mutate();
  };

  return { data, error, isLoading, mutate, create, update, remove };
}
