import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Plus, Search, Mail, Phone, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type CustomerRecord = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  isActive: boolean;
};

export default function Customers() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);

  const tenantId = user?.tenantId ?? 0;

  const customersQuery = trpc.customer.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const createCustomerMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setIsCreateDialogOpen(false);
      void customersQuery.refetch();
    },
  });

  const updateCustomerMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      setEditingCustomerId(null);
      setIsEditDialogOpen(false);
      void customersQuery.refetch();
    },
  });

  const deleteCustomerMutation = trpc.customer.delete.useMutation({
    onSuccess: () => void customersQuery.refetch(),
  });

  const customers = customersQuery.data ?? [];
  const editingCustomer = customers.find((customer) => customer.id === editingCustomerId) ?? null;

  useEffect(() => {
    if (!editingCustomer) return;

    setName(editingCustomer.name ?? "");
    setPhone(editingCustomer.phone ?? "");
    setEmail(editingCustomer.email ?? "");
    setNotes(editingCustomer.notes ?? "");
  }, [editingCustomer]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [customers, searchTerm]
  );

  const handleCreateCustomer = () => {
    if (!tenantId || !name || !phone) return;

    createCustomerMutation.mutate({
      tenantId,
      name,
      phone,
      email: email || undefined,
      notes: notes || undefined,
    });
  };

  const handleUpdateCustomer = () => {
    if (!tenantId || !editingCustomerId || !name || !phone) return;

    updateCustomerMutation.mutate({
      tenantId,
      clientId: editingCustomerId,
      name,
      phone,
      email: email || undefined,
      notes: notes || undefined,
    });
  };

  const openEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomerId(customer.id);
    setName(customer.name ?? "");
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setNotes(customer.notes ?? "");
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: number) => {
    if (!tenantId) return;
    if (!window.confirm("Desativar este cliente?")) return;

    deleteCustomerMutation.mutate({ tenantId, clientId: customerId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-600 mt-1">Gerencie seus clientes e histórico de agendamentos</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>Crie um novo cliente manualmente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" placeholder="Informações adicionais" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateCustomer} disabled={createCustomerMutation.isPending || !name || !phone}>
                  {createCustomerMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    "Adicionar Cliente"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogDescription>Atualize os dados do cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input id="edit-name" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input id="edit-phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notas</Label>
                  <Input id="edit-notes" placeholder="Informações adicionais" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleUpdateCustomer} disabled={updateCustomerMutation.isPending || !name || !phone}>
                  {updateCustomerMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customersQuery.isFetching ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex items-center gap-3 py-12 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando clientes reais...
              </CardContent>
            </Card>
          ) : null}

          {filteredCustomers.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Nenhum cliente encontrado</p>
                <p className="text-slate-500 text-sm">Adicione um novo cliente para começar</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <Badge className={customer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {customer.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {customer.totalBookings} agendamento{customer.totalBookings !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-3">
                      Último agendamento: {customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString("pt-BR") : "Sem histórico"}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditCustomer(customer)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteCustomer(customer.id)}>
                        Desativar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
