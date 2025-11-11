import { useEffect, useState } from "react";

export function useStaffs(csrfToken?: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStaffs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:8001/v1/api/staffs/`, {
          method: "GET",
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch staffs: ${res.statusText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffs();
  }, [csrfToken]);

  return { data, isLoading, error };
}
