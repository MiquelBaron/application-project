import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ServiceFormValues {
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: string; // Formato HH:MM
}

interface ServiceModalProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  editingService?: ServiceFormValues & { id?: number };
  onSubmit: (data: ServiceFormValues) => void;
}

// Función para convertir "P0DT00H30M00S" a "00:30"
const parseDuration = (td: string) => {
  if (!td) return "";
  const match = td.match(/(\d+)H(\d+)M/);
  if (match) {
    const hours = match[1].padStart(2, "0");
    const minutes = match[2].padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return td;
};

export function ServiceModal({ modalOpen, setModalOpen, editingService, onSubmit }: ServiceModalProps) {
  const formMethods = useForm<ServiceFormValues>({
    defaultValues: { name: "", description: "", price: 0, currency: "EUR", duration: "" }
  });

  // Resetear el formulario cuando cambie editingService
  useEffect(() => {
    if (editingService) {
      formMethods.reset({
        ...editingService,
        duration: parseDuration(editingService.duration)
      });
    } else {
      formMethods.reset({ name: "", description: "", price: 0, currency: "EUR", duration: "" });
    }
  }, [editingService, formMethods]);

  return modalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg p-6 shadow-2xl border border-gray-200 rounded-2xl animate-in fade-in-50 bg-white">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {editingService ? "Edit Service" : "New Service"}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-5">

              {/* Name */}
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...formMethods.register("name", { required: "Name is required" })}
                    placeholder="Service name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Description */}
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...formMethods.register("description")}
                    rows={3}
                    placeholder="Short description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Price & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      {...formMethods.register("price", { required: "Price is required", valueAsNumber: true })}
                      type="number"
                      placeholder="50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input
                      {...formMethods.register("currency", { required: "Currency is required" })}
                      placeholder="EUR"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Duration */}
              <FormItem>
                <FormLabel>Duration (HH:MM)</FormLabel>
                <FormControl>
                  <Input
                    {...formMethods.register("duration", { required: "Duration is required" })}
                    placeholder="00:30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingService ? "Update" : "Create"}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  ) : null;
}
