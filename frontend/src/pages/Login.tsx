// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react"; // Icono de loading

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        navigate("/"); // Redirige al dashboard
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {/* Logo de la startup */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Appointment Management</h1>
          <p className="text-gray-500 mt-1">Secure admin login</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 mb-1">Username</span>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 mb-1">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </label>

          <button
            type="submit"
            className={`mt-2 flex items-center justify-center gap-2 bg-primary text-white font-semibold p-2 rounded hover:bg-primary-dark transition-colors disabled:opacity-50`}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-xs mt-6 text-center">
          &copy; {new Date().getFullYear()} StartupName. All rights reserved.
        </p>
      </div>
    </div>
  );
}
