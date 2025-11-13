import { useState, useEffect } from "react";

export function useStaffsByService(serviceId: number | null) {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setStaffs([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:8001/v1/api/staffs-by-service/${serviceId}/`, {
      headers: { "Accept": "application/json" },
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        setStaffs(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || "Error fetching staffs");
        setStaffs([]);
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  return { staffs, loading, error };
}
