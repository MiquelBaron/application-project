"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { WorkingHours } from "@/types";
import { Loader2, Copy } from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WORK_DAYS = [0, 1, 2, 3, 4]; // Mon–Fri

interface Props {
  staffId: number;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  csrfToken?: string;
}

export function WorkingHoursModal({
  staffId,
  open,
  onClose,
  canEdit,
  csrfToken,
}: Props) {
  const {
    workingHours,
    isLoading,
    fetchWorkingHours,
    postWorkingHours,
  } = useWorkingHours(csrfToken);

  const [localHours, setLocalHours] = useState<WorkingHours[]>([]);

  /* ---------- INIT ---------- */
  useEffect(() => {
    if (!open) return;

    if (canEdit) {
      // Set mode: inicializamos vacío
      setLocalHours(
        Array.from({ length: 7 }).map((_, i) => ({
          staff_member_id: staffId,
          day_of_week: i,
          start_time: "",
          end_time: "",
        }))
      );
    } else {
      // View mode
      fetchWorkingHours(staffId);
    }
  }, [open, canEdit, staffId]);

  useEffect(() => {
    if (!canEdit && workingHours.length) {
      setLocalHours(workingHours);
    }
  }, [workingHours, canEdit]);

  /* ---------- HELPERS ---------- */
  const updateHour = (
    day: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setLocalHours((prev) =>
      prev.map((h) =>
        h.day_of_week === day ? { ...h, [field]: value } : h
      )
    );
  };

  const getSourceDay = () =>
    localHours.find((h) => h.start_time && h.end_time);

  const copyToAllDays = () => {
    const source = getSourceDay();
    if (!source) return;

    setLocalHours((prev) =>
      prev.map((h) => ({
        ...h,
        start_time: source.start_time,
        end_time: source.end_time,
      }))
    );
  };

  const copyToWorkDays = () => {
    const source = getSourceDay();
    if (!source) return;

    setLocalHours((prev) =>
      prev.map((h) =>
        WORK_DAYS.includes(h.day_of_week)
          ? {
              ...h,
              start_time: source.start_time,
              end_time: source.end_time,
            }
          : h
      )
    );
  };

  const handleSave = async () => {
    const payload = localHours.filter(
      (h) => h.start_time && h.end_time
    );

    await postWorkingHours(staffId, payload);
    onClose();
  };

  /* ---------- UI ---------- */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? "Set Working Hours" : "Working Hours"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {canEdit && (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToWorkDays}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Mon–Fri
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToAllDays}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
              </div>
            )}

            {localHours.map((wh) => (
              <div
                key={wh.day_of_week}
                className="flex items-center justify-between gap-4"
              >
                <span className="w-24 font-medium">
                  {DAYS[wh.day_of_week]}
                </span>

                <input
                  type="time"
                  value={wh.start_time}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateHour(
                      wh.day_of_week,
                      "start_time",
                      e.target.value
                    )
                  }
                  className="border rounded px-2 py-1"
                />

                <input
                  type="time"
                  value={wh.end_time}
                  disabled={!canEdit}
                  onChange={(e) =>
                    updateHour(
                      wh.day_of_week,
                      "end_time",
                      e.target.value
                    )
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
