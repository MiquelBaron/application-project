import { useState } from "react";
import { useServices, Service } from "@/hooks/useServices";
import ProtectedAdmin from "@/components/ProtectedAdmin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash,
  Edit,
  PlusCircle,
  Clock,
  DollarSign,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ServicesAdminPage() {
  const {csrfToken} = useAuth();
  const {
    services,
    isLoading,
    error,
    createService,
    editService,
    deleteService,
  } = useServices(csrfToken);

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

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen">

        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
              Service Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage, edit, and configure all available services.
            </p>
          </div>
          <Button
            onClick={openModalForCreate}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <PlusCircle size={18} /> <span>New Service</span>
          </Button>
        </div>

      {
        isLoading ? ( <p className="text-gray-500 animate-pulse">Loading services...</p>) 
        
        : error ? (<p className="text-red-600 font-medium">{error.message}</p> ) 
        
        : services.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No services found. Add your first service to get started.</p>
          </div>
        ) 
        
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className="rounded-2xl overflow-hidden bg-gradient-to-b from-gray-100 via-gray-50 to-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* SAP-style header */}
                <CardHeader className="bg-blue-50 border-b border-blue-100 py-3 px-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-800">
                        {service.name}
                      </CardTitle>
                      {service.description && (
                        <CardDescription className="text-gray-500 text-sm">
                          {service.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openModalForEdit(service)}
                            className="hover:bg-blue-100"
                          >
                            <Edit size={16} className="text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(service.id)}
                            className="hover:bg-red-100"
                          >
                            <Trash size={16} className="text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign size={16} className="text-blue-700" />
                    </div>
                    <span>
                      <span className="font-medium">{service.price}</span>{" "}
                      {service.currency}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock size={16} className="text-indigo-700" />
                    </div>
                    <span>{formatDuration(service.duration)} hrs</span>
                  </div>
                  {service.allow_rescheduling && (
                    <div className="flex items-center space-x-2 text-green-700">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Repeat size={16} />
                      </div>
                      <span className="font-medium">Allows Rescheduling</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg p-6 shadow-2xl border border-gray-200 rounded-2xl animate-in fade-in-50 bg-white">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {editingService ? "Edit Service" : "New Service"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label>Name</Label>
                    <Input
                      name="name"
                      value={formData.name || ""}
                      onChange={handleFormChange}
                      required
                      placeholder="Service name"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description || ""}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Short description"
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
                        placeholder="e.g. 50"
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

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingService ? "Update" : "Create"}
                    </Button>
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
