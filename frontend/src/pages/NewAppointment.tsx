import React from "react";
import {MainLayout} from "@/components/layout/MainLayout";
import ProtectedAdmin from "@/components/ProtectedAdmin";
import AppointmentWizard from "@/components/bookAppt/AppointmentWizard";

export default function NewAppointmentPage() {
  const handleComplete = () => {
    console.log("Appointment created!");
    // Aquí podrías redirigir al calendario o mostrar toast
  };

  return (

        <div className="p-6 min-h-screen bg-gray-50 flex justify-center items-start">
          <div className="w-full max-w-4xl">
            <AppointmentWizard onComplete={handleComplete} />
          </div>
        </div>

  );
}
