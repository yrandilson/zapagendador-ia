import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Edit2 } from "lucide-react";

export default function Services() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Corte de Cabelo",
      description: "Corte de cabelo profissional",
      durationMinutes: 30,
      price: "50.00",
      color: "#3b82f6",
    },
    {
      id: 2,
      name: "Barba",
      description: "Aparação e alinhamento de barba",
      durationMinutes: 20,
      price: "30.00",
      color: "#8b5cf6",
    },
    {
      id: 3,
      name: "Corte + Barba",
      description: "Combo: corte de cabelo + barba",
      durationMinutes: 45,
      price: "70.00",
      color: "#ec4899",
    },
  ]);

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: "",
    color: "#3b82f6",
  });

  const handleAddService = () => {
    if (newService.name && newService.price) {
      setServices([
        ...services,
        {
          id: Math.max(...services.map((s) => s.id), 0) + 1,
          ...newService,
        },
      ]);
      setNewService({
        name: "",
        description: "",
        durationMinutes: 30,
        price: "",
        color: "#3b82f6",
      });
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteService = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
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
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="serviceDescription">Descrição</Label>
                  <Input
                    id="serviceDescription"
                    placeholder="Descrição breve do serviço"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newService.durationMinutes}
                      onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value) })}
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
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
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
                      value={newService.color}
                      onChange={(e) => setNewService({ ...newService, color: e.target.value })}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 mt-2">{newService.color}</span>
                  </div>
                </div>

                <Button onClick={handleAddService} className="w-full">
                  Adicionar Serviço
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          style={{ backgroundColor: service.color }}
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

                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Deletar
                    </Button>
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
