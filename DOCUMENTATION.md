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
| **Autenticação** | Manus OAuth | Autenticação integrada |

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
OAUTH_SERVER_URL=https://api.manus.im

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
