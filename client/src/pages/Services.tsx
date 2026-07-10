import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type ServiceRecord = {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string | null;
  color: string | null;
  isActive: boolean;
};

export default function Services() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  const tenantId = user?.tenantId ?? 0;

  const servicesQuery = trpc.service.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const createServiceMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      setName("");
      setDescription("");
      setDurationMinutes(30);
      setPrice("");
      setColor("#3b82f6");
      setIsCreateDialogOpen(false);
      void servicesQuery.refetch();
    },
  });

  const updateServiceMutation = trpc.service.update.useMutation({
    onSuccess: () => {
      setEditingServiceId(null);
      setIsEditDialogOpen(false);
      void servicesQuery.refetch();
    },
  });

  const deleteServiceMutation = trpc.service.delete.useMutation({
    onSuccess: () => void servicesQuery.refetch(),
  });

  const services = servicesQuery.data ?? [];
  const editingService = services.find((service) => service.id === editingServiceId) ?? null;

  useEffect(() => {
    if (!editingService) return;

    setName(editingService.name ?? "");
    setDescription(editingService.description ?? "");
    setDurationMinutes(editingService.durationMinutes ?? 30);
    setPrice(editingService.price ?? "");
    setColor(editingService.color ?? "#3b82f6");
  }, [editingService]);

  const handleAddService = () => {
    if (!tenantId || !name || !price) return;

    createServiceMutation.mutate({
      tenantId,
      name,
      description: description || undefined,
      durationMinutes,
      price,
      color,
    });
  };

  const handleUpdateService = () => {
    if (!tenantId || !editingServiceId || !name || !price) return;

    updateServiceMutation.mutate({
      tenantId,
      serviceId: editingServiceId,
      name,
      description: description || undefined,
      durationMinutes,
      price,
      color,
    });
  };

  const openEditService = (service: ServiceRecord) => {
    setEditingServiceId(service.id);
    setName(service.name ?? "");
    setDescription(service.description ?? "");
    setDurationMinutes(service.durationMinutes ?? 30);
    setPrice(service.price ?? "");
    setColor(service.color ?? "#3b82f6");
    setIsEditDialogOpen(true);
  };

  const handleDeleteService = (serviceId: number) => {
    if (!tenantId) return;
    if (!window.confirm("Desativar este serviço?")) return;

    deleteServiceMutation.mutate({ tenantId, serviceId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Serviços</h1>
            <p className="text-slate-600 mt-1">Gerencie os serviços que você oferece</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                <DialogDescription>Crie um novo serviço para seus agendamentos</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serviceName">Nome do Serviço</Label>
                  <Input
                    id="serviceName"
                    placeholder="Ex: Corte de Cabelo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="serviceDescription">Descrição</Label>
                  <Input
                    id="serviceDescription"
                    placeholder="Descrição breve do serviço"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                      min="5"
                      step="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">Cor do Calendário</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 mt-2">{color}</span>
                  </div>
                </div>

                <Button onClick={handleAddService} className="w-full" disabled={createServiceMutation.isPending || !name || !price}>
                  {createServiceMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    "Adicionar Serviço"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Serviço</DialogTitle>
                <DialogDescription>Atualize os dados do serviço</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-serviceName">Nome do Serviço</Label>
                  <Input
                    id="edit-serviceName"
                    placeholder="Ex: Corte de Cabelo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-serviceDescription">Descrição</Label>
                  <Input
                    id="edit-serviceDescription"
                    placeholder="Descrição breve do serviço"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-duration">Duração (minutos)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                      min="5"
                      step="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-price">Preço (R$)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-color">Cor do Calendário</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 mt-2">{color}</span>
                  </div>
                </div>

                <Button onClick={handleUpdateService} className="w-full" disabled={updateServiceMutation.isPending || !name || !price}>
                  {updateServiceMutation.isPending ? (
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicesQuery.isFetching ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex items-center gap-3 py-12 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando serviços reais...
              </CardContent>
            </Card>
          ) : null}

          {services.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Nenhum serviço cadastrado</p>
                <p className="text-slate-500 text-sm">Adicione um novo serviço para começar</p>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: service.color ?? "#3b82f6" }}
                        ></div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </div>
                      {service.description && (
                        <CardDescription className="mt-1">{service.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Duração:</span>
                      <Badge variant="outline">{service.durationMinutes} min</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Preço:</span>
                      <span className="font-semibold text-slate-900">R$ {service.price}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditService(service)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteService(service.id)}>
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
