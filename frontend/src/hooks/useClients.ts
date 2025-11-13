import useSWR from "swr";

export function useClients(csrfToken: string | null) {
  const fetcher = (url: string) =>
    fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
    }).then((res) => res.json());

  const { data, error, mutate, isLoading } = useSWR(
    "http://localhost:8001/v1/api/clients/",
    fetcher
  );

  const createClient = async (csrfToken: string, payload: any) => {
    if (!csrfToken || !payload) return;
    await fetch(`http://localhost:8001/v1/api/clients/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({ ...payload}),
    });
    mutate();
  };


  return { data, createClient, error, mutate, isLoading };
}
