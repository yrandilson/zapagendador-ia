import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, RefreshCcw, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AiResult = {
  intencao: "agendar" | "cancelar" | "remarcar" | "duvida" | "outro";
  servico: string | null;
  data: string | null;
  hora: string | null;
  resposta_cliente: string;
};

export default function AITeste() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá. Eu sou o assistente IA local do seu servidor. Envie uma mensagem como se fosse um cliente e eu vou interpretar o pedido.",
    },
  ]);
  const [lastResult, setLastResult] = useState<AiResult | null>(null);

  const authQuery = trpc.auth.me.useQuery();
  const tenantId = authQuery.data?.tenantId ?? 1;
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const servicesQuery = trpc.service.list.useQuery(
    { tenantId },
    { enabled: Boolean(authQuery.data?.tenantId) }
  );
  const customersQuery = trpc.customer.list.useQuery(
    { tenantId },
    { enabled: Boolean(authQuery.data?.tenantId) }
  );

  useEffect(() => {
    if (!selectedClientId && customersQuery.data?.length) {
      setSelectedClientId(customersQuery.data[0]?.id ?? null);
    }
  }, [customersQuery.data, selectedClientId]);

  const selectedClient = customersQuery.data?.find((client) => client.id === selectedClientId) ?? null;

  const historyQuery = trpc.ai.history.useQuery(
    { tenantId, clientId: selectedClientId ?? 0, limit: 50 },
    { enabled: Boolean(selectedClientId) }
  );

  const suggestedPrompts = useMemo(() => {
    const serviceNames = servicesQuery.data?.map((service) => service.name) ?? [];

    if (serviceNames.length > 0) {
      return [
        `Quero agendar ${serviceNames[0]} amanhã às 15h`,
        `Quanto tempo dura ${serviceNames[0]}?`,
        "Quero remarcar meu horário para sexta às 10h",
      ];
    }

    return [
      "Quero agendar um corte de cabelo amanhã às 15h",
      "Vocês abrem no sábado?",
      "Quero cancelar meu horário",
    ];
  }, [servicesQuery.data]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (result) => {
      setLastResult(result);
      const resumo = `**Intenção:** ${result.intencao}\n**Serviço:** ${result.servico ?? "-"}\n**Data:** ${result.data ?? "-"}\n**Hora:** ${result.hora ?? "-"}\n\n${result.resposta_cliente}`;
      setMessages((prev) => [...prev, { role: "assistant", content: resumo }]);
      if (selectedClientId) {
        void historyQuery.refetch();
      }
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erro: ${error.message}` },
      ]);
    },
  });

  const handleSend = (content: string) => {
    const novaLista: Message[] = [...messages, { role: "user", content }];
    setMessages(novaLista);

    // Manda só role+content "puros" pro backend (sem os resumos formatados em markdown)
    const historicoParaIA = novaLista
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    chatMutation.mutate({
      messages: historicoParaIA,
      clientName: selectedClient?.name ?? authQuery.data?.name ?? "Cliente",
      tenantId,
      clientId: selectedClientId ?? undefined,
      message: content,
    });
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Olá. Eu sou o assistente IA local do seu servidor. Envie uma mensagem como se fosse um cliente e eu vou interpretar o pedido.",
      },
    ]);
    setLastResult(null);
    if (selectedClientId) {
      void historyQuery.refetch();
    }
  };

  useEffect(() => {
    const historyMessages: Message[] = historyQuery.data
      ? historyQuery.data.flatMap((entry) => [
          {
            role: entry.direction === "inbound" ? "user" : "assistant",
            content: entry.messageText,
          } as Message,
        ])
      : [];

    setMessages([
      {
        role: "assistant",
        content:
          "Olá. Eu sou o assistente IA local do seu servidor. Envie uma mensagem como se fosse um cliente e eu vou interpretar o pedido.",
      },
      ...historyMessages,
    ]);
  }, [historyQuery.data, selectedClientId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bot className="h-4 w-4" />
              Assistente IA local
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Atendimento com o modelo local do servidor</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Esta tela conversa com o Ollama do servidor, interpreta pedidos de agendamento e mostra o resultado da análise em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Ollama local
            </Badge>
            <Badge variant="outline" className="gap-2 rounded-full px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              tRPC conectado
            </Badge>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>
        </div>

        {!authQuery.data && authQuery.isFetching ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando contexto do usuário...
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Conversa do cliente</CardTitle>
              <CardDescription>
                Selecione um cliente para carregar e gravar o histórico persistido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                <div className="space-y-2">
                  <Label htmlFor="client-select">Cliente</Label>
                  <Select
                    value={selectedClientId ? String(selectedClientId) : ""}
                    onValueChange={(value) => setSelectedClientId(Number(value))}
                    disabled={!customersQuery.data?.length}
                  >
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder={customersQuery.isFetching ? "Carregando clientes..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customersQuery.data?.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.name} {client.phone ? `(${client.phone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="text-muted-foreground">Histórico persistido</div>
                  <div className="font-medium">{selectedClient ? selectedClient.name : "Sem cliente selecionado"}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedClientId ? "As mensagens são gravadas na tabela conversations." : "Selecione um cliente para ativar o histórico real."}
                  </div>
                </div>
              </div>

              <AIChatBox
                messages={messages}
                onSendMessage={handleSend}
                isLoading={chatMutation.isPending}
                height="720px"
                placeholder="Digite uma mensagem como se fosse o cliente..."
                emptyStateMessage={selectedClientId ? "Teste aqui como a IA responde a um cliente" : "Selecione um cliente para começar"}
                suggestedPrompts={suggestedPrompts}
                className="border-0 shadow-none"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contexto da sessão</CardTitle>
                <CardDescription>Dados reais usados para esta conversa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="text-muted-foreground">Usuário</div>
                  <div className="font-medium">{authQuery.data?.name ?? "Sessão não autenticada"}</div>
                  <div className="text-xs text-muted-foreground">{authQuery.data?.email ?? "A tela ainda funciona com o modelo local mesmo sem login."}</div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="text-muted-foreground">Tenant</div>
                  <div className="font-medium">{authQuery.data?.tenantId ?? 1}</div>
                  <div className="text-xs text-muted-foreground">Contexto enviado para o modelo local.</div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="text-muted-foreground">Cliente selecionado</div>
                  <div className="font-medium">{selectedClient?.name ?? "Nenhum"}</div>
                  <div className="text-xs text-muted-foreground">{selectedClient?.phone ?? "Escolha um cliente para persistir o histórico."}</div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="text-muted-foreground">Serviços carregados</div>
                  <div className="mt-2 space-y-2">
                    {servicesQuery.isFetching ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando serviços...
                      </div>
                    ) : servicesQuery.data?.length ? (
                      servicesQuery.data.slice(0, 5).map((service) => (
                        <div key={service.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                          <span className="truncate">{service.name}</span>
                          <span className="text-xs text-muted-foreground">{service.durationMinutes} min</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Nenhum serviço carregado para este tenant.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Última análise</CardTitle>
                <CardDescription>Resultado retornado pelo modelo local</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {lastResult ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>Intenção</span>
                      <Badge variant="secondary">{lastResult.intencao}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>Serviço</span>
                      <span className="font-medium">{lastResult.servico ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>Data</span>
                      <span className="font-medium">{lastResult.data ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>Hora</span>
                      <span className="font-medium">{lastResult.hora ?? "-"}</span>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3 text-muted-foreground">
                      {lastResult.resposta_cliente}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
                    Envie uma mensagem para ver o resumo estruturado da IA.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atalho de acesso</CardTitle>
                <CardDescription>Se a sessão do servidor não estiver ativa, abra o login do portal.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = getLoginUrl()}>
                  Abrir login do portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
