import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings as SettingsIcon, Clock, Zap, Key, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type BusinessHoursState = Record<DayKey, { isOpen: boolean; openTime: string; closeTime: string }>;
type NotificationPreferencesState = {
  newBookings: boolean;
  reminders: boolean;
  cancellations: boolean;
  email: boolean;
};

const DEFAULT_BUSINESS_HOURS: BusinessHoursState = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
  saturday: { isOpen: false, openTime: "09:00", closeTime: "14:00" },
  sunday: { isOpen: false, openTime: "00:00", closeTime: "00:00" },
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesState = {
  newBookings: true,
  reminders: true,
  cancellations: true,
  email: true,
};

export default function Settings() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? 0;

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [maxConcurrentBookings, setMaxConcurrentBookings] = useState("1");
  const [businessHours, setBusinessHours] = useState<BusinessHoursState>(DEFAULT_BUSINESS_HOURS);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesState>(DEFAULT_NOTIFICATION_PREFERENCES);

  const tenantQuery = trpc.tenant.getById.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const hoursQuery = trpc.businessHours.list.useQuery(
    { tenantId },
    { enabled: Boolean(user?.tenantId) }
  );

  const updateTenantMutation = trpc.tenant.update.useMutation({
    onSuccess: () => void tenantQuery.refetch(),
  });

  const saveHoursMutation = trpc.businessHours.save.useMutation({
    onSuccess: () => void hoursQuery.refetch(),
  });

  const days = [
    { key: "monday" as DayKey, label: "Segunda-feira", dayOfWeek: 1 },
    { key: "tuesday" as DayKey, label: "Terça-feira", dayOfWeek: 2 },
    { key: "wednesday" as DayKey, label: "Quarta-feira", dayOfWeek: 3 },
    { key: "thursday" as DayKey, label: "Quinta-feira", dayOfWeek: 4 },
    { key: "friday" as DayKey, label: "Sexta-feira", dayOfWeek: 5 },
    { key: "saturday" as DayKey, label: "Sábado", dayOfWeek: 6 },
    { key: "sunday" as DayKey, label: "Domingo", dayOfWeek: 0 },
  ];

  useEffect(() => {
    if (tenantQuery.data) {
      setBusinessName(tenantQuery.data.name ?? "");
      setBusinessEmail(tenantQuery.data.email ?? "");
      setBusinessPhone(tenantQuery.data.phone ?? "");
      setWhatsappNumber(tenantQuery.data.whatsappNumber ?? "");
      setWhatsappApiKey(tenantQuery.data.whatsappApiKey ?? "");
      setGeminiApiKey(tenantQuery.data.geminiApiKey ?? "");
      setTimezone(tenantQuery.data.timezone ?? "America/Sao_Paulo");
      setMaxConcurrentBookings(String(tenantQuery.data.maxConcurrentBookings ?? 1));
      setNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(tenantQuery.data.notificationPreferences as Partial<NotificationPreferencesState> | null),
      });
    }
  }, [tenantQuery.data]);

  useEffect(() => {
    if (!hoursQuery.data?.length) return;

    const nextHours: BusinessHoursState = { ...DEFAULT_BUSINESS_HOURS };
    for (const item of hoursQuery.data) {
      const day = days.find((entry) => entry.dayOfWeek === item.dayOfWeek);
      if (!day) continue;
      nextHours[day.key] = {
        isOpen: item.isOpen,
        openTime: item.openTime,
        closeTime: item.closeTime,
      };
    }
    setBusinessHours(nextHours);
  }, [hoursQuery.data]);

  const handleSaveGeneral = () => {
    if (!tenantId) return;

    updateTenantMutation.mutate({
      tenantId,
      name: businessName,
      email: businessEmail,
      phone: businessPhone,
      timezone,
      maxConcurrentBookings: Number(maxConcurrentBookings),
      whatsappNumber,
      whatsappApiKey,
      geminiApiKey,
    });
  };

  const handleSaveNotifications = () => {
    if (!tenantId) return;

    updateTenantMutation.mutate({
      tenantId,
      notificationPreferences,
    });
  };

  const handleSaveHours = () => {
    if (!tenantId) return;

    saveHoursMutation.mutate({
      tenantId,
      items: days.map(({ key, dayOfWeek }) => ({
        dayOfWeek,
        isOpen: businessHours[key].isOpen,
        openTime: businessHours[key].openTime,
        closeTime: businessHours[key].closeTime,
      })),
    });
  };

  const isLoading = tenantQuery.isFetching || hoursQuery.isFetching;

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
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando configurações reais...
                  </div>
                ) : null}

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
                  <Input id="email" type="email" placeholder="contato@empresa.com" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
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

                <Button onClick={handleSaveGeneral} disabled={updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
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

                <Button className="mt-4" onClick={handleSaveHours} disabled={saveHoursMutation.isPending}>
                  {saveHoursMutation.isPending ? "Salvando..." : "Salvar Horários"}
                </Button>
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
                        {whatsappNumber ? "Conectado" : "Não configurado"}
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
                        {geminiApiKey ? "Ativo" : "Não configurado"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="whatsappNumber">Número WhatsApp</Label>
                    <Input
                      id="whatsappNumber"
                      type="text"
                      placeholder="5511999999999"
                      className="font-mono text-xs"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsappApiKey">Chave da API WhatsApp</Label>
                    <Input
                      id="whatsappApiKey"
                      type="password"
                      placeholder="Sua chave da API"
                      className="font-mono text-xs"
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="geminiKey">Chave da API Gemini</Label>
                    <Input
                      id="geminiKey"
                      type="password"
                      placeholder="Sua chave da API"
                      className="font-mono text-xs"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Obtenha sua chave em{" "}
                      <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        ai.google.dev
                      </a>
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveGeneral} disabled={updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending ? "Salvando..." : "Salvar Integrações"}
                </Button>
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
                    <Switch
                      checked={notificationPreferences.newBookings}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences((current) => ({ ...current, newBookings: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Lembretes</h3>
                      <p className="text-sm text-slate-600">Receba lembretes de agendamentos próximos</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.reminders}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences((current) => ({ ...current, reminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Cancelamentos</h3>
                      <p className="text-sm text-slate-600">Receba notificação quando um agendamento for cancelado</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.cancellations}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences((current) => ({ ...current, cancellations: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Email</h3>
                      <p className="text-sm text-slate-600">Envie notificações por email</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.email}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences((current) => ({ ...current, email: checked }))
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending ? "Salvando..." : "Salvar Preferências"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
