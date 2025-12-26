"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { WorkingHours } from "@/types";
import { Loader2 } from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

interface Props {
  staffId: number;
  open: boolean;
  onClose: () => void;
  canEdit: boolean; // si es false, solo visualizamos
  csrfToken?: string;
}

export function WorkingHoursModal({ staffId, open, onClose, canEdit, csrfToken }: Props) {
  const { workingHours, isLoading, fetchWorkingHours, postWorkingHours } = useWorkingHours(csrfToken);
  const [localHours, setLocalHours] = useState<WorkingHours[]>([]);

  useEffect(() => {
    if (open) {
      if (canEdit) {
        // Si no hay horarios, inicializamos localmente
        setLocalHours(
          Array.from({ length: 7 }).map((_, i) => ({
            staff_member_id: staffId,
            day_of_week: i,
            start_time: "",
            end_time: "",
          }))
        );
      } else {
        // Si solo visualizamos, hacemos fetch
        fetchWorkingHours(staffId);
      }
    }
  }, [open, staffId, canEdit]);

  useEffect(() => {
    if (!canEdit && workingHours.length > 0) {
      setLocalHours(workingHours);
    }
  }, [workingHours, canEdit]);

  const updateHour = (day: number, field: "start_time" | "end_time", value: string) => {
    setLocalHours(prev =>
      prev.map(h => (h.day_of_week === day ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = async () => {
    await postWorkingHours(staffId, localHours);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{canEdit ? "Set Working Hours" : "Working Hours"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {localHours.map((wh) => (
              <div key={wh.day_of_week} className="flex items-center justify-between gap-4">
                <span className="w-24">{DAYS[wh.day_of_week]}</span>

                <input
                  type="time"
                  value={wh.start_time}
                  disabled={!canEdit}
                  onChange={(e) => updateHour(wh.day_of_week, "start_time", e.target.value)}
                  className="border rounded px-2 py-1"
                />

                <input
                  type="time"
                  value={wh.end_time}
                  disabled={!canEdit}
                  onChange={(e) => updateHour(wh.day_of_week, "end_time", e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
