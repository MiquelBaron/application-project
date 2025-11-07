import { useState, useEffect } from "react";

type User = {
  id: number;
  fullName: string;
  group: string;
  isSuperuser: boolean;
  staffInfo: any | null;
};


export function useAuth() {
  const [user, setUser] = useState<User | null>(
    () => JSON.parse(sessionStorage.getItem("user") || "null")
  );
  const [csrfToken, setCsrfToken] = useState<string | null>(
    sessionStorage.getItem("csrfToken")
  );

  const [loading, setLoading] = useState(false);

  async function login(username: string, password: string) {
  setLoading(true);
  try {
    const res = await fetch("http://localhost:8001/v1/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // muy importante para que se guarde la cookie
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Invalid credentials");

    const data = await res.json();

    // Construimos el usuario a partir de la respuesta
    const user = {
      id: data.user_id,
      fullName: data.full_name,
      group: data.group,
      isSuperuser: data.is_superuser,
      staffInfo: data.staff_info,
    };

    // Leemos CSRF de la cookie (viene en headers Set-Cookie)
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || null;

    setUser(user);
    setCsrfToken(csrfToken);
    console.log("HOLA")
    sessionStorage.setItem("user", JSON.stringify(user));
    if (csrfToken) sessionStorage.setItem("csrfToken", csrfToken);

    return user;
  } finally {
    setLoading(false);
  }
}


  function logout() {
  fetch("http://localhost:8001/v1/api/logout/", {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRFToken": csrfToken || "",
    },
  });

  setUser(null);
  setCsrfToken(null);
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("csrfToken");
}
  return {
    user,
    csrfToken,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };
}
