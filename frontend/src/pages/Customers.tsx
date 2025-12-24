import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, MoreHorizontal, FileText, Eye, Edit, Trash2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MedicalHistoryForm } from "@/components/MedicalHistoryForm";
import { useReport } from "@/hooks/useReport";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ------------------ TYPES ------------------ */
export interface Client {
  id?: number;
  source?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  extra_info?: string;
  date_of_birth?: string | null;
  gender?: "M" | "F" | "O";
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

/* ------------------ ZOD SCHEMA ------------------ */
const newClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().regex(/^\+34\d{9}$/),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  extra_info: z.string().optional(),
});

/* ------------------ UTILS ------------------ */
const formatDate = (dateStr?: string, withTime = false) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return withTime
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-GB");
};

const formatGender = (gender?: "M" | "F" | "O") => {
  switch (gender) {
    case "M": return "Male";
    case "F": return "Female";
    case "O": return "Other";
    default: return "—";
  }
};

/* ------------------ COMPONENT ------------------ */
export default function Customers() {
  const { exportMedicalHistory } = useReport();
  const { csrfToken, isAuthenticated } = useAuth();
  const { clients, createClient, updateClient, getClientById, error, loading } = useClients(csrfToken);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);

  const [viewClientModalOpen, setViewClientModalOpen] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  /* ------------------ FORM ------------------ */
  const { register, handleSubmit, setValue } = useForm<Client>({
    resolver: zodResolver(newClientSchema),
    mode: "onChange",
    defaultValues: { phone_number: "+34" },
  });

  /* ------------------ HELPERS ------------------ */
  const openMedicalHistory = (client: Client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const openViewClient = async (clientId: number) => {
    try {
      setViewLoading(true);
      const data = await getClientById(clientId);
      if (data) {
        const clientData = data.client ?? data;
        setViewClient(clientData);

        // populate form
        Object.entries(clientData).forEach(([key, value]) => {
          setValue(key as keyof Client, value as any);
        });

        setViewClientModalOpen(true);
        setEditMode(false);
      }
    } finally {
      setViewLoading(false);
    }
  };

  
  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) return <p className="text-center text-red-500">Please login to see clients.</p>;
  if (loading) return <p className="text-center text-muted-foreground">Loading clients...</p>;
  if (error) return <p className="text-center text-red-500">Error loading clients: {error}</p>;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage and view all your clients</p>
        </div>
        <Button onClick={() => setNewClientModalOpen(true)}>
          <User className="mr-2 h-4 w-4" /> New Client
        </Button>
      </div>

      {/* SEARCH */}
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

      {/* CLIENT TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>{filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}</CardDescription>
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
                  {filteredClients.map(client => (
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
                            <DropdownMenuItem onClick={() => exportMedicalHistory(client.id!)}>
                              <FileText className="mr-2 h-4 w-4 text-primary" /> Export Medical History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openViewClient(client.id!)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* VIEW CLIENT MODAL */}
      {viewClientModalOpen && viewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="relative w-full max-w-md">

            {/* Absolute buttons top-right */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Edit
                className="h-5 w-5 text-blue-500 cursor-pointer hover:text-blue-600"
                onClick={() => setEditMode(!editMode)}
              />
              <X
                className="h-5 w-5 text-gray-500 cursor-pointer hover:text-black"
                onClick={() => {
                  setViewClientModalOpen(false);
                  setViewClient(null);
                  setEditMode(false);
                }}
              />
            </div>

            <CardHeader>
              <CardTitle>{viewClient.first_name} {viewClient.last_name}</CardTitle>
              <CardDescription>Client Information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {editMode ? (
                <form
                  onSubmit={handleSubmit(async (data: Client) => {
                    if (!viewClient.id) return;
                    await updateClient(viewClient.id, { ...viewClient, ...data });
                    setEditMode(false);
                    await openViewClient(viewClient.id);
                  })}
                  className="space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="First Name" {...register("first_name")} />
                    <Input placeholder="Last Name" {...register("last_name")} />
                  </div>
                  <Input placeholder="Email" type="email" {...register("email")} />
                  <Input placeholder="Phone" {...register("phone_number")} />
                  <Input placeholder="Address" {...register("address")} />
                  <Input type="date" {...register("date_of_birth")} />
                  <select {...register("gender")} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="" disabled>Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <Input placeholder="Extra Info" {...register("extra_info")} />
                  <div className="mt-4 flex justify-end gap-2">
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div><strong>Email:</strong> {viewClient.email}</div>
                  <div><strong>Phone:</strong> {viewClient.phone_number}</div>
                  <div><strong>Address:</strong> {viewClient.address || "—"}</div>
                  <div><strong>Gender:</strong> {formatGender(viewClient.gender)}</div>
                  <div><strong>Date of Birth:</strong> {formatDate(viewClient.date_of_birth)}</div>
                  <div><strong>Extra Info:</strong> {viewClient.extra_info || "—"}</div>
                  <div><strong>Created At:</strong> {formatDate(viewClient.created_at, true)}</div>
                  <div><strong>Updated At:</strong> {formatDate(viewClient.updated_at, true)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MEDICAL HISTORY MODAL */}
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

      {/* ------------------ NUEVO CLIENTE MODAL ------------------ */}
{newClientModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <Card className="relative w-full max-w-md">

      {/* Close button */}
      <X
        className="absolute top-4 right-4 h-5 w-5 text-gray-500 cursor-pointer hover:text-black"
        onClick={() => setNewClientModalOpen(false)}
      />

      <CardHeader>
        <CardTitle>New Client</CardTitle>
        <CardDescription>Fill in the client information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
            <form
              onSubmit={handleSubmit(async (data: Client) => {
                try {
                  const newClient = await createClient(data);
                  setNewClientModalOpen(false);
                } catch (err) {
                  console.error("Error creating client:", err);
                }
              })}
              className="space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="First Name" {...register("first_name")} />
                <Input placeholder="Last Name" {...register("last_name")} />
              </div>
              <Input placeholder="Email" type="email" {...register("email")} />
              <Input placeholder="Phone" {...register("phone_number")} />
              <Input placeholder="Address" {...register("address")} />
              <Input type="date" {...register("date_of_birth")} />
              <select {...register("gender")} className="w-full border rounded px-3 py-2 text-sm">
                <option value="" disabled>Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <Input placeholder="Extra Info" {...register("extra_info")} />
              <div className="mt-4 flex justify-end gap-2">
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )}


    </div>
  );
}
