# ZapAgendador IA - Documentação Completa

## 📋 Visão Geral

**ZapAgendador IA** é uma plataforma B2B SaaS de automação de agendamentos via WhatsApp com inteligência artificial. O sistema processa mensagens naturais do WhatsApp usando a API Gemini para extrair intenções de agendamento, gerencia disponibilidade de horários e notifica proprietários de negócios em tempo real.

### Características Principais

- **Automação Inteligente**: Processa mensagens WhatsApp com IA para extrair datas, horários e serviços
- **Multi-Tenancy**: Suporte completo para múltiplos clientes B2B com isolamento de dados
- **Dashboard Administrativo**: Interface intuitiva para gerenciar agendamentos, clientes e configurações
- **Calendário Interativo**: Visualização de horários disponíveis e agendamentos confirmados
- **Notificações em Tempo Real**: Alertas para novos agendamentos, modificações e cancelamentos
- **Analytics**: Relatórios de conversão, horários mais procurados e métricas de desempenho
- **Armazenamento de Documentos**: Upload seguro de comprovantes e documentos via WhatsApp
- **Integração com Webhooks**: API RESTful para integração com Evolution API do WhatsApp

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|--------------|
| **Frontend** | React 19 + Tailwind CSS 4 | UI moderna e responsiva |
| **Backend** | Node.js + Express + TypeScript | Melhor para webhooks e eventos em tempo real |
| **Banco de Dados** | MySQL (Drizzle ORM) | Relacional com suporte a multi-tenancy |
| **IA** | Google Gemini API | Processamento natural de linguagem |
| **Armazenamento** | AWS S3 | Armazenamento seguro de documentos |
| **Autenticação** | OAuth | Autenticação integrada |

### Estrutura de Dados

#### Tabelas Principais

1. **users** - Usuários da plataforma (admin, business_owner, staff)
2. **tenants** - Empresas/negócios usando a plataforma
3. **appointments** - Agendamentos com status e rastreamento
4. **clients** - Clientes/consumidores finais
5. **services** - Serviços oferecidos por cada tenant
6. **businessHours** - Configuração de horários de funcionamento
7. **conversations** - Histórico de mensagens WhatsApp
8. **documents** - Documentos enviados via WhatsApp
9. **notifications** - Notificações para proprietários
10. **analytics** - Dados agregados para relatórios
11. **aiLogs** - Logs de processamento Gemini
12. **webhookLogs** - Logs de webhooks recebidos

---

## 🚀 Fluxo de Agendamento Automático

### 1. Cliente Envia Mensagem WhatsApp

```
Cliente: "Oi, quero marcar um corte de cabelo para amanhã às 15h"
```

### 2. Webhook Recebe Mensagem

```
POST /api/webhooks/whatsapp
{
  "tenantId": 1,
  "clientPhone": "(11) 99999-9999",
  "clientName": "João Silva",
  "messageText": "Oi, quero marcar um corte de cabelo para amanhã às 15h",
  "messageId": "wamid.xxx"
}
```

### 3. Processamento com Gemini IA

O backend envia a mensagem para a API Gemini com contexto:
- Serviços disponíveis
- Horários de funcionamento
- Histórico do cliente

**Resposta Gemini:**
```json
{
  "intent": "booking",
  "service": "Corte de Cabelo",
  "date": "2026-04-03",
  "time": "15:00",
  "confidence": 0.95,
  "suggestedResponse": "Perfeito! Reservei seu corte de cabelo para amanhã às 15h. Te espero!",
  "clientName": "João Silva"
}
```

### 4. Criação de Agendamento

O sistema verifica disponibilidade e cria o agendamento:
- Status: `pending` (aguardando confirmação)
- Fonte: `whatsapp`
- Metadados: dados extraídos pela IA

### 5. Notificação ao Proprietário

O proprietário recebe notificação in-app e por email:
- Novo agendamento de João Silva
- Serviço: Corte de Cabelo
- Data/Hora: 03/04/2026 às 15:00
- Link para confirmar ou rejeitar

### 6. Resposta Automática

Cliente recebe resposta via WhatsApp:
```
"Perfeito! Reservei seu corte de cabelo para amanhã às 15h. Te espero!"
```

---

## 🔌 API RESTful

### Endpoints de Webhooks

#### POST `/api/webhooks/whatsapp`

Recebe mensagens do WhatsApp Evolution API.

**Request:**
```json
{
  "tenantId": 1,
  "clientPhone": "(11) 99999-9999",
  "clientName": "João Silva",
  "messageText": "Quero agendar um corte",
  "messageId": "wamid.xxx",
  "attachmentUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "intent": "booking",
  "response": "Sua mensagem foi processada com sucesso!",
  "confidence": 0.95
}
```

#### GET `/api/webhooks/whatsapp`

Verificação de webhook (para Evolution API).

**Query Parameters:**
- `hub_verify_token`: Token de verificação
- `hub_challenge`: Challenge para validação

---

## 📊 Rotas tRPC

### AI / Assistente Local

```typescript
// Enviar conversa para o modelo local do servidor
trpc.ai.chat({
  messages,
  clientName?,
  tenantId?
})
```

Esta rota é consumida pela tela real em `/ai` e usa o backend local em Ollama para interpretar intenções de agendamento.
Quando um cliente é selecionado, a tela também carrega o histórico persistido via `trpc.ai.history` e grava novas mensagens na tabela `conversations`.

### Appointments

```typescript
// Listar agendamentos
trpc.appointment.list({ tenantId, startDate?, endDate? })

// Obter agendamento específico
trpc.appointment.getById({ appointmentId })

// Criar agendamento
trpc.appointment.create({
  tenantId, clientId, serviceId,
  startTime, endTime, source, notes
})

// Atualizar agendamento
trpc.appointment.update({
  appointmentId, tenantId,
  status?, notes?
})
```

### Customers

```typescript
// Listar clientes
trpc.customer.list({ tenantId })

// Buscar cliente por telefone
trpc.customer.getByPhone({ tenantId, phone })

// Criar cliente
trpc.customer.create({
  tenantId, name, phone, email?, whatsappId?, notes?
})
```

### Services

```typescript
// Listar serviços
trpc.service.list({ tenantId })

// Criar serviço
trpc.service.create({
  tenantId, name, description?,
  durationMinutes, price?, color?
})
```

### Business Hours

```typescript
// Listar horários
trpc.businessHours.list({ tenantId })

// Criar horário
trpc.businessHours.create({
  tenantId, dayOfWeek, isOpen,
  openTime, closeTime, breakStartTime?, breakEndTime?
})
```

---

## 🔐 Segurança Multi-Tenant

### Isolamento de Dados

1. **Verificação de Tenant**: Toda rota protegida verifica se o usuário tem acesso ao tenant
2. **Contexto de Usuário**: `ctx.user.tenantId` é validado em cada operação
3. **Roles**: `platform_admin`, `business_owner`, `staff`
4. **Autorização**: Middleware `protectedProcedure` e `adminProcedure`

### Exemplo de Validação

```typescript
// Apenas o proprietário do tenant ou admin pode acessar
if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
  throw new Error("Unauthorized");
}
```

---

## 📌 Estado Atual do Projeto

Esta documentação descreve o que o código realmente faz hoje, não apenas a intenção do produto.

### Fluxos que já existem no backend

- Autenticação via OAuth no contexto do servidor.
- Autenticação real no frontend via `trpc.auth.me` e logout por tRPC.
- Tela real de IA em `/ai`, conectada ao endpoint `trpc.ai.chat`.
- Tela real de agendamentos conectada a `appointment.list` e `appointment.create`.
- Tela real de clientes conectada a `customer.list` e `customer.create`.
- Tela real de serviços conectada a `service.list` e `service.create`.
- Tela real de configurações com persistência de tenant, horários e integrações via `tenant.update` e `businessHours.save`.
- Tela real de documentos com upload, listagem e abertura de arquivos via `document.upload` e `document.list`.
- Preferências de notificações da aba Settings agora também persistem no tenant.
- Rotas tRPC para tenant, agendamentos, clientes, serviços, horários, notificações, documentos e analytics.
- Webhook de WhatsApp em `/api/webhooks/whatsapp` com validação `GET` e processamento `POST`.
- Integração com Gemini/Ollama para interpretação de mensagens.
- Helpers de storage para upload e download de arquivos via proxy externo.

### Fluxos que ainda estão mockados no frontend

- A tela de IA já é real, mas ainda funciona como assistente de validação e análise, não como painel completo de atendimento com histórico persistido.
- O dashboard inicial ainda usa métricas estáticas em vez de agregações do banco, mas já recebeu o primeiro resumo real de métricas.
- Editar/excluir clientes e serviços ainda não está implementado.
- A aba de integrações em Settings já persiste dados reais do tenant.

### Erros e inconsistências conhecidas

- A criação de agendamento tenta notificar o proprietário, mas agora o fluxo continua mesmo se `BUILT_IN_FORGE_API_URL` ou `BUILT_IN_FORGE_API_KEY` não existirem.
- A suíte de testes já expõe esse problema em `appointment.create`.
- O documento antigo de webhook estava desatualizado: o servidor real espera o payload da Evolution API em `data.messages[0]`, não o JSON simplificado mostrado antes.
- O `package.json` ainda usa o bloco `pnpm` antigo, que hoje gera aviso e pode confundir manutenção.

### Correções documentadas para o fluxo real

#### Webhook WhatsApp

Payload aceito hoje pelo servidor:

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

Fluxo executado:

1. Identifica a instância e resolve o tenant pelo slug.
2. Busca ou cria o cliente pelo telefone.
3. Envia a mensagem para a IA.
4. Registra logs da IA e do webhook.
5. Se a intenção for agendamento, cria o agendamento no banco.
6. Envia a resposta via Evolution API.

#### Criação de agendamento via tRPC

Fluxo executado:

1. Valida tenant e permissões.
2. Cria o agendamento com status `pending`.
3. Tenta notificar o proprietário sem bloquear a criação se a integração estiver ausente.
4. Retorna o resultado da criação.

Ponto de falha atual:

- Se a integração de notificação não estiver configurada, o passo 3 lança erro e interrompe a criação.

#### Frontend

Fluxo esperado, mas ainda incompleto:

1. `auth.me` deveria definir o usuário real no cliente.
2. As telas deveriam usar queries e mutations tRPC.
3. A UI deveria refletir os dados persistidos no banco.

Hoje o frontend ainda mantém parte desse estado apenas em memória, exceto a tela `/ai`, que já conversa com o modelo local do servidor e persiste histórico por tenant e cliente quando há um cliente selecionado.

### Próximos blocos que realmente faltam

- Conectar o frontend ao backend nas telas principais.
- Tornar a notificação opcional ou tolerante a ausência de config.
- Implementar upload de documentos com fluxo end-to-end.
- Adicionar testes de integração cobrindo webhook e fluxo completo de agendamento.
- Persistir configurações do negócio e preferências de notificação.

---

## 📧 Sistema de Notificações

### Tipos de Notificação

| Tipo | Gatilho | Destinatário |
|------|---------|-------------|
| `new_booking` | Novo agendamento criado | Proprietário |
| `booking_modified` | Agendamento modificado | Proprietário |
| `booking_cancelled` | Agendamento cancelado | Proprietário |
| `reminder` | Lembrete de agendamento próximo | Proprietário |
| `system` | Alertas do sistema | Proprietário |

### Canais

- **In-app**: Notificações no dashboard
- **Email**: Envio automático de emails
- **WebSocket**: Atualizações em tempo real (futuro)

---

## 💾 Armazenamento de Documentos

### Fluxo de Upload

1. Cliente envia documento via WhatsApp
2. Sistema faz download e armazena em S3
3. Referência salva no banco de dados
4. Proprietário pode visualizar no dashboard

### Estrutura de S3

```
s3://bucket/
├── tenants/
│   ├── {tenantId}/
│   │   ├── documents/
│   │   │   ├── {documentId}-{filename}
│   │   │   └── {documentId}-{filename}
```

---

## 📈 Analytics

### Métricas Rastreadas

- **Total de Mensagens**: Mensagens processadas por dia
- **Requisições de Agendamento**: Quantas pessoas tentaram agendar
- **Agendamentos Bem-Sucedidos**: Agendamentos confirmados
- **Taxa de Conversão**: (Agendamentos / Requisições) * 100
- **Horário Mais Procurado**: Qual hora tem mais demanda
- **Serviço Mais Popular**: Qual serviço é mais agendado

### Relatórios

- Diário: Resumo do dia anterior
- Semanal: Tendências da semana
- Mensal: Análise completa do mês

---

## 🚀 Deploy

### Opção 1: Render + Vercel + Supabase (Recomendado)

#### 1. Banco de Dados (Supabase)

```bash
# Criar projeto no Supabase
# Copiar DATABASE_URL

# Aplicar migrations
pnpm drizzle-kit migrate
```

#### 2. Backend (Render)

```bash
# Conectar repositório GitHub
# Configurar variáveis de ambiente:
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key
WHATSAPP_VERIFY_TOKEN=your_token
JWT_SECRET=your_secret

# Deploy automático
```

#### 3. Frontend (Vercel)

```bash
# Conectar repositório GitHub
# Configurar variáveis:
VITE_API_URL=https://zapagendador-api.onrender.com

# Deploy automático
```

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=mysql://user:pass@host/db

# APIs
GEMINI_API_KEY=your_gemini_key
WHATSAPP_VERIFY_TOKEN=verify_token_123

# Auth
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=https://seu-servidor-oauth.exemplo

# S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# App
NODE_ENV=production
PORT=3000
```

---

## 💰 Modelo de Monetização

### Planos Sugeridos

| Plano | Preço/Mês | Agendamentos | Serviços | Suporte |
|-------|-----------|-------------|---------|---------|
| **Starter** | R$ 99 | 100 | 5 | Email |
| **Professional** | R$ 299 | 500 | 20 | Priorizado |
| **Enterprise** | Customizado | Ilimitado | Ilimitado | Dedicado |

### Estratégia de Venda

1. **Venda Local**: Aborde barbearias, salões, clínicas
2. **Argumento**: "Automatize seus agendamentos e economize tempo"
3. **Demo**: Mostre o bot funcionando no WhatsApp
4. **Preço**: R$ 150 setup + R$ 60-99/mês

### Fluxo de Onboarding

1. Cadastro da empresa
2. Configuração de serviços
3. Integração com WhatsApp (Evolution API)
4. Configuração de horários
5. Ativação do bot

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
pnpm test

# Com cobertura
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

### Exemplo de Teste

```typescript
describe("appointment.create", () => {
  it("should create a new appointment", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.appointment.create({
      tenantId: 1,
      clientId: 1,
      serviceId: 1,
      startTime: new Date(),
      endTime: new Date(),
      source: "web"
    });
    
    expect(result).toBeDefined();
  });
});
```

---

## 🔧 Desenvolvimento Local

### Setup

```bash
# Instalar dependências
pnpm install

# Configurar .env.local
cp .env.example .env.local

# Aplicar migrations
pnpm drizzle-kit migrate

# Iniciar dev server
pnpm dev
```

### Endpoints Locais

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API tRPC: http://localhost:3000/api/trpc

---

## 📚 Recursos Adicionais

### Documentação Externa

- [Gemini API Docs](https://ai.google.dev)
- [Evolution API Docs](https://evolution-api.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io)

### Suporte

Para dúvidas ou problemas:
1. Consulte a documentação
2. Abra uma issue no GitHub
3. Entre em contato com suporte

---

## 📝 Changelog

### v1.0.0 (Inicial)

- ✅ Schema de banco de dados completo
- ✅ Backend com rotas CRUD
- ✅ Integração Gemini API
- ✅ Webhooks WhatsApp
- ✅ Dashboard administrativo
- ✅ Sistema de notificações
- ✅ Testes unitários

---

**Desenvolvido com ❤️ para automação de agendamentos**
