import { Router, Request, Response } from "express";
import * as db from "./db";
import { processWhatsAppMessage } from "./gemini";

export const webhookRouter = Router();

/**
 * WhatsApp webhook handler
 * Receives messages from WhatsApp Evolution API
 */
webhookRouter.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const { tenantId, clientPhone, clientName, messageText, messageId, attachmentUrl } = req.body;

    if (!tenantId || !clientPhone || !messageText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get tenant configuration
    const tenant = await db.getTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Get or create client
    let client = await db.getClientByPhone(tenantId, clientPhone);
    if (!client) {
      await db.createClient({
        tenantId,
        name: clientName || "Unknown",
        phone: clientPhone,
        whatsappId: messageId,
        isActive: true,
      });
      // Fetch the created client
      client = await db.getClientByPhone(tenantId, clientPhone);
    }

    if (!client) {
      return res.status(500).json({ error: "Failed to create client" });
    }

    // Get services and business hours for AI processing
    const services = await db.getServicesByTenant(tenantId);
    const businessHours = await db.getBusinessHoursByTenant(tenantId);

    const businessHoursString = businessHours
      .map((bh) => `${bh.dayOfWeek}: ${bh.openTime}-${bh.closeTime}`)
      .join(", ");

    // Process message with Gemini
    const geminiApiKey = tenant.geminiApiKey;
    if (!geminiApiKey) {
      console.warn("[Webhook] No Gemini API key configured for tenant", tenantId);
      return res.status(500).json({ error: "AI not configured" });
    }

    const extractedData = await processWhatsAppMessage(
      messageText,
      geminiApiKey,
      tenant.name,
      services,
      businessHoursString
    );

    // Store conversation
    await db.createConversation({
      tenantId,
      clientId: client.id,
      messageId,
      direction: "inbound",
      messageText,
      messageType: attachmentUrl ? "document" : "text",
      aiProcessed: true,
      extractedData: extractedData as any,
      attachmentUrl,
    });

    // Store AI log
    await db.createAILog({
      tenantId,
      inputText: messageText,
      outputText: extractedData.suggestedResponse,
      extractedIntent: extractedData.intent,
      extractedDate: extractedData.date ? new Date(extractedData.date) : undefined,
      extractedService: extractedData.service,
      confidence: extractedData.confidence?.toString(),
      processingTimeMs: 0,
    });

    // Handle booking intent
    if (extractedData.intent === "booking" && extractedData.service && extractedData.date) {
      // Check if service exists
      const service = services.find((s) => s.name.toLowerCase() === extractedData.service?.toLowerCase());

      if (service) {
        // Parse date and time
        const appointmentDate = new Date(extractedData.date);
        if (extractedData.time) {
          const [hours, minutes] = extractedData.time.split(":").map(Number);
          appointmentDate.setHours(hours, minutes, 0, 0);
        }

        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);

        // Create appointment
        await db.createAppointment({
          tenantId,
          clientId: client.id,
          serviceId: service.id,
          startTime: appointmentDate,
          endTime,
          source: "whatsapp",
          notes: `Created from WhatsApp: ${messageText}`,
          whatsappMessageId: messageId,
          status: "pending",
        });
      }
    }

    // Send response
    res.json({
      success: true,
      intent: extractedData.intent,
      response: extractedData.suggestedResponse,
      confidence: extractedData.confidence,
    });
  } catch (error) {
    console.error("[Webhook] Error processing WhatsApp message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Webhook verification endpoint for WhatsApp
 */
webhookRouter.get("/whatsapp", (req: Request, res: Response) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "verify_token_123";
  const token = req.query.hub_verify_token as string;
  const challenge = req.query.hub_challenge as string;

  if (token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Verification failed");
  }
});

/**
 * Generic webhook log endpoint for debugging
 */
webhookRouter.post("/log", async (req: Request, res: Response) => {
  try {
    const { tenantId, webhookType, payload } = req.body;

    await db.createWebhookLog({
      tenantId,
      webhookType,
      payload,
      status: "success",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error logging webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
