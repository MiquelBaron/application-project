"use client";
import { useState } from "react";
import StepService from "./StepService";
import StepDoctor from "./StepDoctor";
import StepDaySlot from "./StepDaySlot";
import StepConfirm from "./StepConfirm";

export enum Step {
  SERVICE = 0,
  DOCTOR = 1,
  DAY_SLOT = 2,
  CONFIRM = 3,
}

interface AppointmentWizardProps {
  client?: any;
  onComplete?: () => void; // <- nuevo
}

export default function AppointmentWizard({ client, onComplete }: AppointmentWizardProps) {
  const [step, setStep] = useState<Step>(Step.SERVICE);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const goNext = () => setStep((s) => (s + 1 > Step.CONFIRM ? Step.CONFIRM : s + 1));
  const goBack = () => setStep((s) => (s - 1 < Step.SERVICE ? Step.SERVICE : s - 1));

  const handleComplete = () => {
    if (onComplete) onComplete();
  };

  return (
    <div className="p-4 border rounded shadow-md space-y-4">
      {step === Step.SERVICE && (
        <StepService
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          goNext={goNext}
        />
      )}

      {step === Step.DOCTOR && (
        <StepDoctor
          service={selectedService}
          selectedDoctor={selectedDoctor}
          setSelectedDoctor={setSelectedDoctor}
          goNext={goNext}
          goBack={goBack}
        />
      )}

      {step === Step.DAY_SLOT && (
        <StepDaySlot
          doctor={selectedDoctor}
          service={selectedService}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          goNext={goNext}
          goBack={goBack}
        />
      )}

      {step === Step.CONFIRM && (
        <StepConfirm
          client={client}
          service={selectedService}
          doctor={selectedDoctor}
          day={selectedDay}
          slot={selectedSlot}
          goBack={goBack}
          onComplete={handleComplete} // <- pasamos el callback
        />
      )}
    </div>
  );
}
