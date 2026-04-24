# ZapAgendador IA - Project TODO

## Fase 1: Arquitetura e Schema do Banco de Dados
- [x] Definir modelo de dados para multi-tenancy
- [x] Criar schema de usuários com níveis de acesso (admin/cliente)
- [x] Criar schema de agendamentos e slots de horários
- [x] Criar schema de configurações de negócio (horários, regras)
- [x] Criar schema de documentos e arquivos
- [x] Criar schema de notificações e logs
- [x] Criar schema de analytics e conversões

## Fase 2: Backend - Autenticação e Core
- [x] Implementar autenticação multi-tenant
- [x] Criar middleware de autorização por nível de acesso
- [x] Implementar rotas CRUD de agendamentos
- [x] Implementar rotas CRUD de configurações
- [x] Criar sistema de validação de horários disponíveis
- [x] Implementar integração com Gemini API

## Fase 3: Backend - Webhooks e Integrações
- [x] Criar endpoint POST para webhook do WhatsApp
- [x] Implementar processamento de mensagens com Gemini
- [x] Criar lógica de extração de intenção e data
- [x] Implementar verificação de disponibilidade de horários
- [x] Criar respostas automáticas personalizadas
- [x] Implementar sistema de fila para processamento assíncrono

## Fase 4: Notificações e Emails
- [ ] Implementar sistema de notificações em tempo real (WebSocket/SSE)
- [ ] Criar templates de emails
- [ ] Implementar envio de emails para proprietários
- [ ] Implementar notificações in-app
- [ ] Criar sistema de preferências de notificação

## Fase 5: Frontend - Dashboard e Autenticação
- [x] Criar página de login/autenticação
- [x] Implementar dashboard administrativo
- [x] Criar layout responsivo com sidebar
- [x] Implementar verificação de permissões no frontend
- [x] Criar componentes de loading e erro

## Fase 6: Frontend - Calendário e Agendamentos
- [x] Implementar componente de calendário interativo
- [x] Criar visualização de slots disponíveis
- [x] Implementar CRUD de agendamentos no frontend
- [x] Criar modal de detalhes de agendamento
- [x] Implementar filtros e busca de agendamentos

## Fase 7: Frontend - Configurações e Analytics
- [x] Criar painel de configuração de horários
- [x] Implementar painel de regras de negócio
- [x] Criar dashboard de analytics
- [x] Implementar gráficos de conversão
- [x] Criar relatórios de horários mais procurados

## Fase 8: Upload de Documentos
- [ ] Implementar sistema de upload seguro
- [ ] Integrar com S3 para armazenamento
- [ ] Criar visualizador de documentos
- [ ] Implementar gerenciamento de arquivos
- [ ] Criar sistema de permissões de acesso

## Fase 9: Testes e Validação
- [x] Escrever testes unitários para rotas críticas
- [ ] Criar testes de integração
- [ ] Testar fluxo completo de agendamento
- [ ] Validar segurança multi-tenant
- [ ] Testar integração com Gemini

## Fase 10: Documentação
- [ ] Documentar arquitetura do sistema
- [ ] Criar guia de deploy (Render, Vercel, Supabase)
- [ ] Documentar API RESTful completa
- [ ] Criar guia de monetização
- [ ] Criar guia de uso para clientes
- [ ] Documentar integração com WhatsApp

## Fase 11: Deploy e Finalização
- [ ] Preparar variáveis de ambiente
- [ ] Configurar CI/CD
- [ ] Realizar testes em staging
- [ ] Deploy em produção
- [ ] Criar checkpoint final
