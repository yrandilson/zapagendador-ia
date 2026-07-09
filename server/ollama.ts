export interface AgendamentoIA {
  intencao: "agendar" | "cancelar" | "remarcar" | "duvida" | "outro";
  servico: string | null;
  data: string | null;
  hora: string | null;
  resposta_cliente: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function tabelaDeDatas(): string {
  const linhas: string[] = [];
  const hoje = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const label = i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS_SEMANA[d.getDay()];
    linhas.push(`${d.toISOString().split("T")[0]} = ${label}`);
  }
  return linhas.join("\n");
}

export async function generateOllamaResponse(
  history: ChatMessage[],
  clientName: string,
  servicosDisponiveis: string[] = []
): Promise<AgendamentoIA> {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const MODEL = process.env.OLLAMA_MODEL || 'gemma2:2b';

  const historicoTexto = history
    .map(m => `${m.role === "user" ? "Cliente" : "Assistente"}: ${m.content}`)
    .join("\n");

  const servicosTexto = servicosDisponiveis.length > 0
    ? servicosDisponiveis.join(", ")
    : "nenhum serviço cadastrado ainda";

  const prompt = `Você é um assistente de agendamentos via WhatsApp para o cliente ${clientName}.

SERVIÇOS QUE REALMENTE EXISTEM (use SOMENTE estes, nunca invente outro):
${servicosTexto}

TABELA DE DATAS (use exatamente essas datas quando o cliente mencionar um dia, NÃO calcule por conta própria):
${tabelaDeDatas()}

HISTÓRICO DA CONVERSA:
${historicoTexto}

Considerando TODO o histórico acima (não só a última mensagem), responda APENAS com um JSON válido, sem texto antes ou depois, neste formato:
{
  "intencao": "agendar" | "cancelar" | "remarcar" | "duvida" | "outro",
  "servico": "nome EXATO de um dos serviços listados acima, ou null se ainda não souber",
  "data": "YYYY-MM-DD da tabela acima, ou null se ainda não souber",
  "hora": "HH:mm ou null se ainda não souber",
  "resposta_cliente": "mensagem curta e educada em português, considerando o que já foi dito na conversa"
}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.2 }
      })
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();
    return JSON.parse(data.response) as AgendamentoIA;
  } catch (error) {
    console.error("Erro ao conectar com o Ollama local:", error);
    return {
      intencao: "outro",
      servico: null,
      data: null,
      hora: null,
      resposta_cliente: "Desculpa, tive um problema aqui. Pode repetir sua mensagem?",
    };
  }
}
