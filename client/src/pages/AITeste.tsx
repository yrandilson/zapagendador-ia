import { useState } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";

export default function AITeste() {
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (result) => {
      const resumo = `**Intenção:** ${result.intencao}\n**Serviço:** ${result.servico ?? "-"}\n**Data:** ${result.data ?? "-"}\n**Hora:** ${result.hora ?? "-"}\n\n${result.resposta_cliente}`;
      setMessages((prev) => [...prev, { role: "assistant", content: resumo }]);
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

    chatMutation.mutate({ messages: historicoParaIA, clientName: "Teste", tenantId: 1 });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Teste da IA local (Ollama)</h1>
      <AIChatBox
        messages={messages}
        onSendMessage={handleSend}
        isLoading={chatMutation.isPending}
        placeholder="Digite uma mensagem como se fosse o cliente..."
        emptyStateMessage="Teste aqui como a IA responde a um cliente"
        suggestedPrompts={[
          "Quero agendar um corte de cabelo amanhã às 15h",
          "Vocês abrem no sábado?",
          "Quero cancelar meu horário",
        ]}
      />
    </div>
  );
}
