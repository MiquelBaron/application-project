import { useState } from "react";

export function useReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_API_URL; 


  /**
   * exportMedicalHistory
   * @param patientId ID del paciente/cliente
   */
  const exportMedicalHistory = async (patientId: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/export-history/${patientId}/`, {
        method: "GET",
        credentials: "include", // 🔹 envía cookies de sesión
      });

      if (!res.ok) {
        throw new Error(`Error fetching PDF: ${res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical_history_${patientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return {
    exportMedicalHistory,
    loading,
    error,
  };
}
