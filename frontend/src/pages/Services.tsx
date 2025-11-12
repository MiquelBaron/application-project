import { useState } from "react";
import { useServices, Service } from "@/hooks/useServices";
import ProtectedAdmin from "@/components/ProtectedAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash, Edit, PlusCircle, Clock, DollarSign, Repeat } from "lucide-react";

export default function ServicesAdminPage() {
  const csrfToken = sessionStorage.getItem("csrfToken")
  const { services, isLoading, error, createService, editService, deleteService } = useServices(csrfToken);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({});

  const openModalForEdit = (service: Service) => {
    setEditingService(service);
    setFormData(service);
    setModalOpen(true);
  };

  const openModalForCreate = () => {
    setEditingService(null);
    setFormData({});
    setModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await editService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      setModalOpen(false);
      setFormData({});
      setEditingService(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDuration = (td: string | number) => {
  // td viene como "P0DT00H30M00S" de Django
  if (typeof td === "string") {
    const match = td.match(/(\d+)H(\d+)M(\d+)?S?/);
    if (match) {
      const hours = match[1].padStart(2, "0");
      const minutes = match[2].padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  }
  return td;
};
  return (
    <ProtectedAdmin>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Services Administration</h1>
          <Button onClick={openModalForCreate} variant="secondary" className="flex items-center space-x-2">
            <PlusCircle size={18} /> <span>Add Service</span>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Loading services...</p>
        ) : error ? (
          <p className="text-red-600 font-medium">{error.message}</p>
        ) : services.length === 0 ? (
          <p className="text-gray-600">No services available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <Card key={service.id} className="border shadow-sm hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
                  {service.description && <CardDescription className="text-gray-500">{service.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <DollarSign size={16} />
                    <span className="font-medium">{service.price} {service.currency}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Clock size={16} />
                    <span className="font-medium">{formatDuration(service.duration)} hrs</span>
                  </div>
                  {service.allow_rescheduling && (
                    <div className="flex items-center space-x-2 text-green-600 font-medium">
                      <Repeat size={16} />
                      <span>Allows Rescheduling</span>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openModalForEdit(service)}>
                          <Edit size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Service</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>
                          <Trash size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Service</TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <Card className="w-full max-w-lg p-6 shadow-xl animate-fade-in">
              <CardHeader>
                <CardTitle>{editingService ? "Edit Service" : "Add Service"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      name="name"
                      value={formData.name || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description || ""}
                      onChange={handleFormChange}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price</Label>
                      <Input
                        name="price"
                        type="number"
                        value={formData.price || ""}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Input
                        name="currency"
                        value={formData.currency || "EUR"}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Duration (HH:MM)</Label>
                    <Input
                      name="duration"
                      value={formData.duration || "00:30:00"}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingService ? "Update" : "Create"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedAdmin>
  );
}
