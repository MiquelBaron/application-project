import { useState, useEffect } from "react";

export function useAvailability(
  staffId: number | null,
  serviceId: number | null,
  day: string
) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId || !serviceId || !day) return;

    setLoading(true);
    setError(null);

    fetch(
      `http://localhost:8001/v1/api/staffs/availability/${staffId}/${serviceId}/${day}/`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include", // <- importante, envía la cookie de sesión
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => setSlots(data.slots || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [staffId, serviceId, day]);

  return { slots, loading, error };
}
