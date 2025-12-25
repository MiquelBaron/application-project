"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { NewStaffPayload, Service } from "@/types/staff";

interface StaffWizardProps {
  onSuccess?: () => void;
  onCreate: (payload: NewStaffPayload) => Promise<any>;
  availableServices?: Service[];
}

export function StaffWizard({ onSuccess, onCreate, availableServices = [] }: StaffWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NewStaffPayload>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const totalSteps = 3;

  const handleChange = (newData: Partial<NewStaffPayload>) =>
    setFormData((prev) => ({ ...prev, ...newData }));

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleService = (serviceId: number) => {
    const current = formData.services_offered || [];
    handleChange({
      services_offered: current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input placeholder="Username" value={formData.username || ""} onChange={(e) => handleChange({ username: e.target.value })} />
            <Input type="password" placeholder="Password" value={formData.password || ""} onChange={(e) => handleChange({ password: e.target.value })} />
            <Input placeholder="First Name" value={formData.user_first_name || ""} onChange={(e) => handleChange({ user_first_name: e.target.value })} />
            <Input placeholder="Last Name" value={formData.user_last_name || ""} onChange={(e) => handleChange({ user_last_name: e.target.value })} />
            <Input type="email" placeholder="Email" value={formData.email || ""} onChange={(e) => handleChange({ email: e.target.value })} />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Input type="number" placeholder="Slot Duration (minutes)" value={formData.slot_duration || ""} onChange={(e) => handleChange({ slot_duration: Number(e.target.value) })} />
            <Input type="time" placeholder="Lead Time" value={formData.lead_time || ""} onChange={(e) => handleChange({ lead_time: e.target.value })} />
            <Input type="time" placeholder="Finish Time" value={formData.finish_time || ""} onChange={(e) => handleChange({ finish_time: e.target.value })} />
            <Input type="number" placeholder="Appointment Buffer Time (minutes)" value={formData.appointment_buffer_time || ""} onChange={(e) => handleChange({ appointment_buffer_time: Number(e.target.value) })} />

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Checkbox checked={!!formData.work_on_saturday} onCheckedChange={(val) => handleChange({ work_on_saturday: !!val })} />
                Work on Saturday
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={!!formData.work_on_sunday} onCheckedChange={(val) => handleChange({ work_on_sunday: !!val })} />
                Work on Sunday
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="font-medium">Select Services Offered:</p>
            <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
              {availableServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.services_offered?.includes(s.id) || false}
                    onCheckedChange={() => toggleService(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <p className="font-semibold text-lg">Summary</p>

              {/* User Info */}
              <div className="bg-muted p-3 rounded space-y-1">
                <p className="font-medium">User Information</p>
                <p><strong>Username:</strong> {formData.username || "—"}</p>
                <p><strong>Name:</strong> {formData.user_first_name || "—"} {formData.user_last_name || ""}</p>
                <p><strong>Email:</strong> {formData.email || "—"}</p>
              </div>

              {/* Staff Config */}
              <div className="bg-muted p-3 rounded space-y-1">
                <p className="font-medium">Staff Configuration</p>
                <p><strong>Slot Duration:</strong> {formData.slot_duration ? `${formData.slot_duration} min` : "—"}</p>
                <p><strong>Lead Time:</strong> {formData.lead_time || "—"}</p>
                <p><strong>Finish Time:</strong> {formData.finish_time || "—"}</p>
                <p><strong>Buffer Time:</strong> {formData.appointment_buffer_time ? `${formData.appointment_buffer_time} min` : "—"}</p>
                <p><strong>Work on Saturday:</strong> {formData.work_on_saturday ? "Yes" : "No"}</p>
                <p><strong>Work on Sunday:</strong> {formData.work_on_sunday ? "Yes" : "No"}</p>
                <p><strong>Timetable Set:</strong> {formData.set_timetable ? "Yes" : "No"}</p>
              </div>

              {/* Services Offered */}
              <div className="bg-muted p-3 rounded space-y-1">
                <p className="font-medium">Services Offered</p>
                <p>
                  {formData.services_offered?.length
                    ? formData.services_offered.map((id) => {
                        const service = availableServices.find((s) => s.id === id);
                        return service?.name || id;
                      }).join(", ")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto text-center p-8">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Staff created successfully!</h2>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Staff Member</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}
        <div className="flex justify-between pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary text-white"
            >
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
