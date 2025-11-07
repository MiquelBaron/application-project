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

  return { data, error, mutate, isLoading };
}
