import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Plus, Search, Filter, Clock, User, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Appointments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const tenantId = user?.tenantId ?? 0;

  const appointmentsQuery = trpc.appointment.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const customersQuery = trpc.customer.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const servicesQuery = trpc.service.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const createAppointmentMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setSelectedClientId(null);
      setSelectedServiceId(null);
      setStartTime("");
      setNotes("");
      void appointmentsQuery.refetch();
    },
  });

  useEffect(() => {
    if (!selectedClientId && customersQuery.data?.length) {
      setSelectedClientId(customersQuery.data[0]?.id ?? null);
    }
  }, [customersQuery.data, selectedClientId]);

  useEffect(() => {
    if (!selectedServiceId && servicesQuery.data?.length) {
      setSelectedServiceId(servicesQuery.data[0]?.id ?? null);
    }
  }, [selectedServiceId, servicesQuery.data]);

  useEffect(() => {
    if (!startTime) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      defaultDate.setHours(10, 0, 0, 0);
      const localValue = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setStartTime(localValue);
    }
  }, [startTime]);

  const appointments = appointmentsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const clientsById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const servicesById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);

  const appointmentRows = useMemo(() => {
    return appointments.map((appointment) => {
      const client = clientsById.get(appointment.clientId);
      const service = servicesById.get(appointment.serviceId);

      return {
        id: appointment.id,
        clientName: client?.name ?? `Cliente #${appointment.clientId}`,
        clientPhone: client?.phone ?? "-",
        service: service?.name ?? `Serviço #${appointment.serviceId}`,
        startTime: appointment.startTime,
        status: appointment.status,
        notes: appointment.notes ?? undefined,
      };
    });
  }, [appointments, clientsById, servicesById]);

  const handleCreateAppointment = () => {
    if (!tenantId || !selectedClientId || !selectedServiceId || !startTime) return;

    const selectedService = servicesById.get(selectedServiceId);
    if (!selectedService) return;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + selectedService.durationMinutes * 60000);

    createAppointmentMutation.mutate({
      tenantId,
      clientId: selectedClientId,
      serviceId: selectedServiceId,
      startTime: start,
      endTime: end,
      source: "web",
      notes: notes || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  const filteredAppointments = appointmentRows.filter((apt) => {
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
                  <Select value={selectedClientId ? String(selectedClientId) : ""} onValueChange={(value) => setSelectedClientId(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={customersQuery.isFetching ? "Carregando clientes..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="service">Serviço</Label>
                  <Select value={selectedServiceId ? String(selectedServiceId) : ""} onValueChange={(value) => setSelectedServiceId(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={servicesQuery.isFetching ? "Carregando serviços..." : "Selecione um serviço"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          {service.name} ({service.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data e Hora</Label>
                  <Input id="date" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" placeholder="Informações adicionais" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateAppointment} disabled={createAppointmentMutation.isPending || !customers.length || !services.length}>
                  {createAppointmentMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    "Criar Agendamento"
                  )}
                </Button>
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
          {(appointmentsQuery.isFetching || customersQuery.isFetching || servicesQuery.isFetching) ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-12 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando agendamentos reais...
              </CardContent>
            </Card>
          ) : null}

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
                          {apt.status === "no_show" && "Não compareceu"}
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
