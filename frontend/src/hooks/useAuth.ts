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
  email: string;
  isSuperuser: boolean;
  staffInfo: StaffInfo | null;
};

const baseUrl = import.meta.env.VITE_API_URL; // hasta /api

// 🔒 Utilidad para leer cookies de forma segura
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper centralizado para fetch
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${baseUrl}${endpoint}`, {
    credentials: "include",
    ...options,
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(
    () => JSON.parse(sessionStorage.getItem("user") || "null")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await apiFetch("/session/"); 
        console.log("Called session")
        if (res.ok) {
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
      const res = await apiFetch("/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    await apiFetch("/logout/", {
      method: "POST",
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
