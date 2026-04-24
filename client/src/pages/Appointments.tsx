import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Search, Filter, Clock, User, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Appointments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data - será substituído por queries reais
  const appointments = [
    {
      id: 1,
      clientName: "João Silva",
      clientPhone: "(11) 99999-9999",
      service: "Corte de Cabelo",
      startTime: new Date(Date.now() + 86400000),
      status: "confirmed",
      notes: "Cliente preferencial",
    },
    {
      id: 2,
      clientName: "Maria Santos",
      clientPhone: "(11) 98888-8888",
      service: "Barba",
      startTime: new Date(Date.now() + 172800000),
      status: "pending",
      notes: "Primeira vez",
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.clientPhone.includes(searchTerm) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agendamentos</h1>
            <p className="text-slate-600 mt-1">Gerencie todos os seus agendamentos</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Agendamento</DialogTitle>
                <DialogDescription>Adicione um novo agendamento manualmente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Input id="client" placeholder="Nome do cliente" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="service">Serviço</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="haircut">Corte de Cabelo</SelectItem>
                      <SelectItem value="beard">Barba</SelectItem>
                      <SelectItem value="combo">Corte + Barba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data e Hora</Label>
                  <Input id="date" type="datetime-local" />
                </div>
                <Button className="w-full">Criar Agendamento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, telefone ou serviço..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Nenhum agendamento encontrado</p>
                <p className="text-slate-500 text-sm">Crie um novo agendamento para começar</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((apt) => (
              <Card key={apt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{apt.clientName}</h3>
                        <Badge className={statusColors[apt.status]}>
                          {apt.status === "pending" && "Pendente"}
                          {apt.status === "confirmed" && "Confirmado"}
                          {apt.status === "completed" && "Concluído"}
                          {apt.status === "cancelled" && "Cancelado"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {apt.clientPhone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apt.startTime.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {apt.service}
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-sm text-slate-500 italic">Notas: {apt.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Cancelar
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
