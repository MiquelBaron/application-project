import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMedicalRecords } from "@/hooks/useMedicalRecord";

interface MedicalHistoryFormProps {
  client: any;
  csrfToken: string | null;
  onClose: () => void;
}

export function MedicalHistoryForm({ client, csrfToken, onClose }: MedicalHistoryFormProps) {
  const { data: medicalRecordData, update, create, isLoading } = useMedicalRecords(client?.id, csrfToken);

  const medicalRecord = medicalRecordData?.medical_record;

  const [formData, setFormData] = useState({
    allergies: "",
    medical_conditions: "",
    medications: "",
    notes: "",
    blood_type: "",
  });

  useEffect(() => {
    if (medicalRecord) {
      setFormData({
        allergies: medicalRecord.allergies || "",
        medical_conditions: medicalRecord.medical_conditions || "",
        medications: medicalRecord.medications || "",
        notes: medicalRecord.notes || "",
        blood_type: medicalRecord.blood_type || "",
      });
    } else {
      setFormData({
        allergies: "",
        medical_conditions: "",
        medications: "",
        notes: "",
        blood_type: "",
      });
    }
  }, [medicalRecord]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (medicalRecord?.id) {
        await update(medicalRecord.id, formData);
      } else {
        await create(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving medical record");
    }
  };

  if (isLoading) return <p>Loading medical record...</p>;

  return (
    <div className="space-y-2">
      {["allergies", "medical_conditions", "medications", "notes", "blood_type"].map(field => (
        <div key={field} className="flex flex-col">
          <label className="font-medium capitalize">{field.replace("_", " ")}</label>
          {(field === "notes" || field === "medical_conditions") ? (
            <textarea
              title="Medical condition"
              name={field}
              value={formData[field as keyof typeof formData]}
              onChange={handleChange}
              className="border rounded p-1"
            />
          ) : (
            <input
              type="text"
              title="test"
              name={field}
              value={formData[field as keyof typeof formData]}
              onChange={handleChange}
              className="border rounded p-1"
            />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
