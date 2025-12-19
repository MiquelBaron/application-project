import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, MoreHorizontal, FileText, Eye, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MedicalHistoryForm } from "@/components/MedicalHistoryForm";
import { useReport } from "@/hooks/useReport";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ------------------ ZOD SCHEMA ------------------ */
const newClientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone_number: z.string().regex(/^\+34\d{9}$/, "Phone must start with +34 and have 9 digits"),
});

type NewClientForm = z.infer<typeof newClientSchema>;

export default function Customers() {
  const { exportMedicalHistory } = useReport();
  const { csrfToken, isAuthenticated } = useAuth();
  const { clients, createClient, error, loading, fetchClients } = useClients(csrfToken);

  /* ------------------ LOCAL STATE ------------------ */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  /* ------------------ FORM ------------------ */
  const { register, handleSubmit, formState: { errors } } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    mode: "onChange",
    defaultValues: { phone_number: "+34" },
  });

  /* ------------------ HELPERS ------------------ */
  const openMedicalHistory = (client: any) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  if (!isAuthenticated) {
    return <p className="text-center text-red-500">Please login to see clients.</p>;
  }

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading clients...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error loading clients: {error}</p>;
  }

  // Filtrar clientes
  const filteredClients = clients.filter((c: any) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ------------------ HEADER ------------------ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage and view all your clients</p>
        </div>
        <Button onClick={() => setNewClientModalOpen(true)}>
          <User className="mr-2 h-4 w-4" /> New Client
        </Button>
      </div>

      {/* ------------------ SEARCH ------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Search Clients</CardTitle>
          <CardDescription>Search by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* ------------------ TABLE ------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground">No clients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.first_name} {client.last_name}</TableCell>
                      <TableCell>{client.phone_number}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="secondary" onClick={() => openMedicalHistory(client)}>
                          <FileText className="h-4 w-4 mr-2" /> Medical History
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportMedicalHistory(client.id)}>
                              <FileText className="mr-2 h-4 w-4 text-primary" />
                              Export Medical History
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------ NEW CLIENT MODAL ------------------ */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 relative">
            <button className="absolute top-4 right-4" onClick={() => setNewClientModalOpen(false)}>✖</button>
            <CardHeader>
              <CardTitle>New Client</CardTitle>
              <CardDescription>Create a new client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="First Name" {...register("first_name")} />
              {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name.message}</p>}
              <Input placeholder="Last Name" {...register("last_name")} />
              {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name.message}</p>}
              <Input placeholder="Email" type="email" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              <Input placeholder="Phone Number" {...register("phone_number")} />
              {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number.message}</p>}
            </CardContent>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNewClientModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit(async (data) => {
                await createClient(data);
                await fetchClients(); // refresca la lista
                setNewClientModalOpen(false);
              })}>
                Create
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------ MEDICAL HISTORY MODAL ------------------ */}
      {modalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Medical History: {selectedClient.first_name} {selectedClient.last_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <MedicalHistoryForm client={selectedClient} csrfToken={csrfToken} onClose={() => setModalOpen(false)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
