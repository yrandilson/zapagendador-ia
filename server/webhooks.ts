import { Router } from 'express';
import { generateOllamaResponse } from './ollama';
import {
  getClientByPhone,
  createClient,
  getServicesByTenant,
  getTenantBySlug,
  createAppointment,
  createAILog,
  createWebhookLog,
} from './db';

export const webhookRouter = Router();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:3333';
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || '';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

webhookRouter.get('/whatsapp', (req, res) => {
  const token = req.query.hub_verify_token;
  const challenge = req.query.hub_challenge;
  if (token === WHATSAPP_VERIFY_TOKEN) {
    return res.send(challenge);
  }
  return res.status(403).json({ error: 'Token de verificação inválido' });
});

async function sendWhatsAppMessage(instanceName: string, number: string, text: string) {
  try {
    await fetch(`${EVOLUTION_API_URL}/api/instances/${instanceName}/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EVOLUTION_API_TOKEN}`,
      },
      body: JSON.stringify({ number, text }),
    });
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar resposta:', error);
  }
}

webhookRouter.post('/whatsapp', async (req, res) => {
  let tenantId: number | undefined;
  try {
    const { data } = req.body;
    const msg = data?.messages?.[0];

    if (!msg || msg.key?.fromMe) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const clientPhone = msg.key.remoteJid.split('@')[0];
    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const instanceName = data.instanceName;

    if (!messageText || !clientPhone) {
      console.warn('[Webhook] Payload incompleto:', JSON.stringify(req.body));
      return res.status(400).json({ error: 'Payload incompleto.' });
    }

    const tenant = await getTenantBySlug(instanceName);
    if (!tenant) {
      console.warn(`[Webhook] Tenant não encontrado para instância: ${instanceName}`);
      return res.status(404).json({ error: 'Tenant não encontrado.' });
    }
    tenantId = tenant.id;

    console.log(`[Webhook] Mensagem recebida de ${clientPhone} (tenant ${tenantId}): ${messageText}`);

    let client = await getClientByPhone(tenantId, clientPhone);
    if (!client) {
      await createClient({ tenantId, phone: clientPhone, name: 'Cliente' });
      client = await getClientByPhone(tenantId, clientPhone);
    }

    const servicosDoTenant = await getServicesByTenant(tenantId);
    const iaResult = await generateOllamaResponse(
      [{ role: 'user', content: messageText }],
      client?.name || 'Cliente',
      servicosDoTenant.map(s => s.name)
    );

    await createAILog({
      tenantId,
      inputText: messageText,
      outputText: JSON.stringify(iaResult),
      extractedIntent: iaResult.intencao,
      extractedDate: iaResult.data ? new Date(iaResult.data) : null,
      extractedService: iaResult.servico,
    } as any);

    let respostaFinal = iaResult.resposta_cliente;

    if (iaResult.intencao === 'agendar' && iaResult.data && iaResult.hora && client) {
      const servicos = await getServicesByTenant(tenantId);
      const servicoEncontrado = servicos.find(s =>
        iaResult.servico && s.name.toLowerCase().includes(iaResult.servico.toLowerCase())
      );

      if (!servicoEncontrado) {
        respostaFinal = 'Não consegui identificar qual serviço você quer agendar. Pode me dizer o nome exato?';
      } else {
        const startTime = new Date(`${iaResult.data}T${iaResult.hora}:00`);
        const endTime = new Date(startTime.getTime() + servicoEncontrado.durationMinutes * 60000);

        await createAppointment({
          tenantId,
          clientId: client.id,
          serviceId: servicoEncontrado.id,
          startTime,
          endTime,
          status: 'pending',
          source: 'whatsapp',
        } as any);
      }
    }

    await sendWhatsAppMessage(instanceName, clientPhone, respostaFinal);

    await createWebhookLog({
      tenantId,
      webhookType: 'whatsapp',
      payload: req.body,
      status: 'success',
      retryCount: 0,
    } as any);

    return res.status(200).json({ success: true, intent: iaResult.intencao, response: respostaFinal });
  } catch (error) {
    console.error('Erro no Webhook:', error);
    if (tenantId) {
      await createWebhookLog({
        tenantId,
        webhookType: 'whatsapp',
        payload: req.body,
        status: 'error',
        retryCount: 0,
      } as any).catch(() => {});
    }
    return res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
  }
});
