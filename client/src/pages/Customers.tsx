import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Mail, Phone, Calendar } from "lucide-react";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data
  const customers = [
    {
      id: 1,
      name: "João Silva",
      phone: "(11) 99999-9999",
      email: "joao@email.com",
      totalBookings: 5,
      lastBooking: new Date(Date.now() - 86400000),
      isActive: true,
    },
    {
      id: 2,
      name: "Maria Santos",
      phone: "(11) 98888-8888",
      email: "maria@email.com",
      totalBookings: 3,
      lastBooking: new Date(Date.now() - 604800000),
      isActive: true,
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      phone: "(11) 97777-7777",
      email: "pedro@email.com",
      totalBookings: 1,
      lastBooking: new Date(Date.now() - 2592000000),
      isActive: false,
    },
  ];

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <Input id="name" placeholder="Nome completo" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" placeholder="Informações adicionais" />
                </div>
                <Button className="w-full">Adicionar Cliente</Button>
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
                      Último agendamento: {customer.lastBooking.toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Detalhes
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
