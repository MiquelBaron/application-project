import { useState, useEffect } from "react";

type User = {
  id: number;
  fullName: string;
  group: string;
  isSuperuser: boolean;
  staffInfo: any | null;
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

  // 🧠 Comprueba si la sesión aún es válida al recargar
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("http://localhost:8001/v1/api/session/", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          sessionStorage.setItem("user", JSON.stringify(data));
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

  // 🔑 LOGIN
  async function login(username: string, password: string) {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/v1/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Django crea cookies (csrftoken + sessionid)
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();

      const user = {
        id: data.user_id,
        fullName: data.full_name,
        group: data.group,
        isSuperuser: data.is_superuser,
        staffInfo: data.staff_info,
      };

      setUser(user);
      sessionStorage.setItem("user", JSON.stringify(user));

      return user;
    } finally {
      setLoading(false);
    }
  }

  // 🔒 LOGOUT
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

  // 🚀 CSRF siempre actualizado (sin guardar)
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
