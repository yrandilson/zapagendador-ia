# Guia de Integração com WhatsApp Evolution API

## 📱 Configuração do WhatsApp

### Pré-requisitos

1. **Conta WhatsApp Business**: Crie em [business.facebook.com](https://business.facebook.com)
2. **Evolution API**: Hospede ou use serviço gerenciado
3. **Número WhatsApp**: Número de telefone para o bot

### Passo 1: Configurar Evolution API

#### Opção A: Self-Hosted (Docker)

```bash
# Clone o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure .env
cp .env.example .env

# Inicie com Docker Compose
docker-compose up -d
```

**Arquivo .env:**
```env
EVOLUTION_API_PORT=3333
EVOLUTION_API_URL=http://localhost:3333
DATABASE_URL=postgresql://user:pass@localhost/evolution

# Webhook para ZapAgendador
WEBHOOK_URL=https://seu-dominio.com/api/webhooks/whatsapp
```

#### Opção B: Serviço Gerenciado

Use provedores como:
- [Evolution API Cloud](https://evolution-api.com)
- [Whatsapp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

### Passo 2: Conectar Número WhatsApp

#### Via Evolution API Dashboard

```bash
# Acesse o dashboard
http://localhost:3333/api/docs

# Endpoint para conectar WhatsApp
POST /api/instances/create
{
  "instanceName": "zapagendador-bot",
  "token": "seu_token_evolution"
}
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "zapagendador-bot",
    "instanceUrl": "http://localhost:3333/instance/zapagendador-bot",
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### Escanear QR Code

1. Abra WhatsApp no seu celular
2. Vá para **Configurações > Dispositivos Conectados**
3. Clique em **Conectar Dispositivo**
4. Escaneie o QR Code exibido

### Passo 3: Configurar Webhook

#### Registrar Webhook no Evolution API

```bash
# Configure o webhook para receber mensagens
POST /api/instances/zapagendador-bot/webhooks
{
  "url": "https://seu-dominio.com/api/webhooks/whatsapp",
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "MESSAGES_DELETE"
  ]
}
```

#### Verificar Webhook

O Evolution API fará uma requisição GET para validar:

```bash
GET https://seu-dominio.com/api/webhooks/whatsapp?hub_verify_token=verify_token_123&hub_challenge=challenge_value
```

**Resposta esperada:**
```
challenge_value
```

### Passo 4: Testar Integração

#### Enviar Mensagem de Teste

```bash
# Via Evolution API
POST /api/instances/zapagendador-bot/send/text
{
  "number": "5511999999999",
  "text": "Olá! Sou o bot de agendamentos. Como posso ajudar?"
}
```

#### Receber Mensagem

Quando o cliente enviar uma mensagem, o webhook receberá:

```json
{
  "data": {
    "instanceName": "zapagendador-bot",
    "messages": [
      {
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false,
          "id": "3EB0..."
        },
        "message": {
          "conversation": "Oi, quero marcar um corte"
        },
        "messageTimestamp": 1680000000
      }
    ]
  }
}
```

---

## 🔄 Fluxo de Mensagens

### 1. Cliente Envia Mensagem

```
Cliente WhatsApp → Evolution API → Webhook ZapAgendador
```

### 2. Processamento

```
Webhook recebe → Validação → Gemini IA → Criar Agendamento → Notificar Proprietário
```

### 3. Resposta Automática

```
Gerar Resposta → Evolution API → Enviar WhatsApp → Cliente recebe
```

---

## 📨 Exemplos de Implementação

### Receber Mensagem

```typescript
// server/webhooks.ts
webhookRouter.post("/whatsapp", async (req: Request, res: Response) => {
  const { data } = req.body;
  const message = data.messages[0];
  
  const clientPhone = message.key.remoteJid.split("@")[0];
  const messageText = message.message.conversation;
  
  // Processar com Gemini
  const extracted = await processWhatsAppMessage(
    messageText,
    geminiApiKey,
    tenantName,
    services,
    businessHours
  );
  
  res.json({ success: true });
});
```

### Enviar Resposta

```typescript
// Enviar via Evolution API
async function sendWhatsAppMessage(
  instanceName: string,
  number: string,
  text: string
) {
  const response = await fetch(
    `${EVOLUTION_API_URL}/api/instances/${instanceName}/send/text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${EVOLUTION_API_TOKEN}`
      },
      body: JSON.stringify({
        number,
        text
      })
    }
  );
  
  return response.json();
}
```

---

## 🛡️ Segurança

### Validar Token de Webhook

```typescript
function validateWebhookToken(token: string): boolean {
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  return token === expectedToken;
}
```

### Verificar Assinatura

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return hash === signature;
}
```

---

## 🚨 Tratamento de Erros

### Retry de Mensagens

```typescript
// Se falhar, Evolution API tenta novamente
// Configure em .env do Evolution API
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
```

### Logging

```typescript
// Registrar todas as tentativas
await db.createWebhookLog({
  tenantId,
  webhookType: "whatsapp",
  payload: req.body,
  status: "success",
  retryCount: 0
});
```

---

## 📊 Monitoramento

### Verificar Status da Instância

```bash
GET /api/instances/zapagendador-bot
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "zapagendador-bot",
    "status": "open",
    "qrCode": null,
    "profileName": "ZapAgendador",
    "profilePicture": "https://...",
    "phoneNumber": "5511999999999"
  }
}
```

### Métricas de Webhook

- Total de mensagens recebidas
- Taxa de sucesso
- Tempo médio de processamento
- Erros e falhas

---

## 🔧 Troubleshooting

### Problema: Webhook não recebe mensagens

**Solução:**
1. Verifique se o webhook está registrado: `GET /api/instances/{name}/webhooks`
2. Teste a URL do webhook manualmente
3. Verifique logs do Evolution API
4. Confirme que o número está conectado: `GET /api/instances/{name}`

### Problema: Mensagens não são processadas

**Solução:**
1. Verifique logs de erro do backend
2. Teste a integração Gemini separadamente
3. Verifique se o tenant existe no banco de dados
4. Valide o formato da mensagem recebida

### Problema: Respostas não chegam ao cliente

**Solução:**
1. Verifique se o número está no formato correto (com código de país)
2. Teste envio via Evolution API Dashboard
3. Verifique se o token de autenticação é válido
4. Confirme que o número tem permissão para enviar

---

## 📚 Recursos

- [Evolution API Docs](https://evolution-api.com/docs)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business API](https://www.whatsapp.com/business/api)

---

## ✅ Checklist de Implementação

- [ ] Evolution API instalado e rodando
- [ ] Número WhatsApp conectado
- [ ] Webhook registrado
- [ ] Webhook validado (GET request)
- [ ] Mensagem de teste recebida
- [ ] Resposta automática enviada
- [ ] Agendamento criado no banco de dados
- [ ] Notificação enviada ao proprietário
- [ ] Logs registrados corretamente
- [ ] Testes de erro implementados

---

**Integração WhatsApp completa e funcionando! 🎉**
