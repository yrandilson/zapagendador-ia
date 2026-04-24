import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Clock, Zap, Key, Bell } from "lucide-react";

export default function Settings() {
  const [businessName, setBusinessName] = useState("Meu Negócio");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [maxConcurrentBookings, setMaxConcurrentBookings] = useState("1");
  const [businessHours, setBusinessHours] = useState({
    monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    saturday: { isOpen: false, openTime: "09:00", closeTime: "14:00" },
    sunday: { isOpen: false, openTime: "00:00", closeTime: "00:00" },
  });

  const days = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-600 mt-1">Gerencie as configurações do seu negócio</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="hours">Horários</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Negócio</CardTitle>
                <CardDescription>Configure informações básicas da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Nome do Negócio</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email de Contato</Label>
                  <Input id="email" type="email" placeholder="contato@empresa.com" />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxBookings">Agendamentos Simultâneos Máximos</Label>
                  <Input
                    id="maxBookings"
                    type="number"
                    value={maxConcurrentBookings}
                    onChange={(e) => setMaxConcurrentBookings(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>

                <Button>Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours */}
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>Configure os horários em que você atende</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {days.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 pb-4 border-b border-slate-200 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={businessHours[key as keyof typeof businessHours].isOpen}
                        onCheckedChange={(checked) => {
                          setBusinessHours({
                            ...businessHours,
                            [key]: { ...businessHours[key as keyof typeof businessHours], isOpen: checked },
                          });
                        }}
                      />
                      <span className="text-sm text-slate-600">
                        {businessHours[key as keyof typeof businessHours].isOpen ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    {businessHours[key as keyof typeof businessHours].isOpen && (
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={businessHours[key as keyof typeof businessHours].openTime}
                          onChange={(e) => {
                            setBusinessHours({
                              ...businessHours,
                              [key]: {
                                ...businessHours[key as keyof typeof businessHours],
                                openTime: e.target.value,
                              },
                            });
                          }}
                          className="w-24"
                        />
                        <span className="text-slate-600">até</span>
                        <Input
                          type="time"
                          value={businessHours[key as keyof typeof businessHours].closeTime}
                          onChange={(e) => {
                            setBusinessHours({
                              ...businessHours,
                              [key]: {
                                ...businessHours[key as keyof typeof businessHours],
                                closeTime: e.target.value,
                              },
                            });
                          }}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <Button className="mt-4">Salvar Horários</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>Configure suas integrações com serviços externos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">WhatsApp</h3>
                        <p className="text-sm text-slate-600 mt-1">Receba agendamentos via WhatsApp</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Conectado
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Gemini IA</h3>
                        <p className="text-sm text-slate-600 mt-1">Processamento inteligente de mensagens</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Ativo
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="geminiKey">Chave da API Gemini</Label>
                    <Input
                      id="geminiKey"
                      type="password"
                      placeholder="Sua chave da API"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Obtenha sua chave em{" "}
                      <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        ai.google.dev
                      </a>
                    </p>
                  </div>
                </div>

                <Button>Salvar Integrações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure como você quer ser notificado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Novos Agendamentos</h3>
                      <p className="text-sm text-slate-600">Receba notificação quando um novo agendamento for criado</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Lembretes</h3>
                      <p className="text-sm text-slate-600">Receba lembretes de agendamentos próximos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Cancelamentos</h3>
                      <p className="text-sm text-slate-600">Receba notificação quando um agendamento for cancelado</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Email</h3>
                      <p className="text-sm text-slate-600">Envie notificações por email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button>Salvar Preferências</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
