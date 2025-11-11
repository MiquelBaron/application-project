"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export function StaffWizard({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const totalSteps = 3;

  const handleChange = (newData: any) => setFormData((prev: any) => ({ ...prev, ...newData }));

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const csrfToken = localStorage.getItem("csrfToken");
      const res = await fetch("http://localhost:8001/v1/api/staffs/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Error creating staff");
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error creating staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input placeholder="First name" value={formData.first_name || ""} onChange={e => handleChange({ first_name: e.target.value })} />
            <Input placeholder="Last name" value={formData.last_name || ""} onChange={e => handleChange({ last_name: e.target.value })} />
            <Input type="email" placeholder="Email" value={formData.email || ""} onChange={e => handleChange({ email: e.target.value })} />
            <Input type="number" placeholder="Phone number" value={formData.number || ""} onChange={e => handleChange({ number: e.target.value })} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Select value={formData.role || ""} onValueChange={(value) => handleChange({ role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <p><strong>Name:</strong> {formData.first_name} {formData.last_name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Role:</strong> {formData.role}</p>
            <p><strong>Phone:</strong> {formData.number}</p>
          </div>
        );
    }
  };

  if (success) return (
    <Card className="max-w-md mx-auto text-center p-8">
      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold">Staff created successfully!</h2>
    </Card>
  );

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Staff Member</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}
        <div className="flex justify-between pt-4">
          {step > 1 && <Button variant="outline" onClick={prevStep}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>}
          {step < totalSteps ? (
            <Button onClick={nextStep}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
