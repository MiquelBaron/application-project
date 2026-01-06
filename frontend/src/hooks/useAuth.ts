import { useState, useEffect } from "react";

type StaffInfo = {
  staff_id: number;
  slot_duration: number;
  services: string[];
};

type User = {
  id: number;
  username: string;
  group: string;
  email:string;
  isSuperuser: boolean;
  staffInfo: StaffInfo | null;
};

// 🔒 Utilidad para leer cookies de forma segura
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(
    () => JSON.parse(sessionStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("http://localhost:8001/v1/api/session/", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();

          // Transformamos la respuesta para que coincida con TS
          const userData: User = {
            id: data.user_id,
            username: data.username,
            group: data.group,
            email: data.email,
            isSuperuser: data.is_superuser,
            staffInfo: data.services_offered
              ? {
                  staff_id: data.staff_id || 0, // agrega si lo devuelve
                  slot_duration: data.slot_duration,
                  services: data.services_offered,
                }
              : null,
          };

          setUser(userData);
          sessionStorage.setItem("user", JSON.stringify(userData));
        } else {
          setUser(null);
          sessionStorage.removeItem("user");
        }
      } catch {
        setUser(null);
        sessionStorage.removeItem("user");
      }
    }
    checkSession();
  }, []);

  async function login(username: string, password: string) {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/v1/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();

      const userData: User = {
        id: data.user_id,
        username: data.username,
        group: data.group,
        email: data.email,
        isSuperuser: data.is_superuser,
        staffInfo: data.services_offered
          ? {
              staff_id: data.staff_id || 0,
              slot_duration: data.slot_duration,
              services: data.services_offered,
            }
          : null,
      };

      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const csrfToken = getCookie("csrftoken");

    await fetch("http://localhost:8001/v1/api/logout/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      },
    });

    setUser(null);
    sessionStorage.removeItem("user");
  }

  const csrfToken = getCookie("csrftoken");

  return {
    user,
    csrfToken,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };
}
