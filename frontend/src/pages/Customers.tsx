import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { useMedicalRecords } from "@/hooks/useMedicalRecord";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Phone, MoreHorizontal, Eye, Edit, Trash2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MedicalHistoryForm } from "@/components/MedicalHistoryForm";

export default function Customers() {
  const { isAuthenticated } = useAuth();
  const csrfToken = sessionStorage.getItem("csrfToken")
  const { data, error, isLoading } = useClients(csrfToken);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Abrir modal de Medical History
  const openMedicalHistory = (client: any) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  if (!isAuthenticated) return <p className="text-center text-red-500">Please login to see clients.</p>;
  if (isLoading) return <p className="text-center text-muted-foreground">Loading clients...</p>;
  if (error) return <p className="text-center text-red-500">Error loading clients: {error.message}</p>;

  const clients = data?.clients || [];
  const filteredClients = clients.filter((c: any) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage and view all your clients</p>
        </div>
        <Button className="bg-gradient-primary text-white hover:opacity-90">
          <User className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Clients</CardTitle>
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

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>{filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <p className="text-center text-muted-foreground">No clients match your search.</p>
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
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <p className="font-medium">{client.first_name} {client.last_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right flex justify-end items-center gap-2">
                        {/* Medical History Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openMedicalHistory(client)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Medical History
                        </Button>

                        {/* Dropdown for View/Edit/Delete */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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

      {/* Medical History Modal */}
      {modalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg overflow-y-auto max-h-[80vh]">
            <CardHeader>
              <CardTitle>Medical History: {selectedClient.first_name} {selectedClient.last_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MedicalHistoryForm
                client={selectedClient}
                csrfToken={csrfToken}
                onClose={() => setModalOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
