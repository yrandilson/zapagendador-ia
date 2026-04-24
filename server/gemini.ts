import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedData {
  intent: "booking" | "cancellation" | "modification" | "inquiry" | "other";
  service?: string;
  date?: string;
  time?: string;
  confidence: number;
  suggestedResponse: string;
  clientName?: string;
  clientPhone?: string;
}

/**
 * Initialize Gemini API client
 */
function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Process a message from WhatsApp and extract booking information
 */
export async function processWhatsAppMessage(
  messageText: string,
  apiKey: string,
  tenantName: string,
  services: Array<{ name: string; durationMinutes: number }>,
  businessHours: string
): Promise<ExtractedData> {
  const genAI = getGeminiClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const servicesString = services.map((s) => `- ${s.name} (${s.durationMinutes}min)`).join("\n");

  const prompt = `You are an AI assistant for a booking system called "${tenantName}". 
Your job is to analyze WhatsApp messages from customers and extract booking information.

Available services:
${servicesString}

Business hours: ${businessHours}

Analyze this customer message and extract the following information:
- Intent: Is the customer trying to book, cancel, modify, ask a question, or something else?
- Service: Which service are they interested in?
- Date and Time: When do they want to book?
- Confidence: How confident are you in your extraction (0-1)?
- Suggested Response: What should the business respond with?

Customer message: "${messageText}"

Respond ONLY with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "intent": "booking|cancellation|modification|inquiry|other",
  "service": "service name or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "confidence": 0.0-1.0,
  "suggestedResponse": "suggested response text",
  "clientName": "extracted name or null",
  "clientPhone": "extracted phone or null"
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Remove markdown code blocks if present
    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const extracted = JSON.parse(cleanedResponse);

    return {
      intent: extracted.intent || "other",
      service: extracted.service,
      date: extracted.date,
      time: extracted.time,
      confidence: extracted.confidence || 0,
      suggestedResponse: extracted.suggestedResponse || "Thank you for your message. We'll get back to you soon.",
      clientName: extracted.clientName,
      clientPhone: extracted.clientPhone,
    };
  } catch (error) {
    console.error("[Gemini] Error processing message:", error);

    // Return a safe default response on error
    return {
      intent: "inquiry",
      confidence: 0,
      suggestedResponse: "Thank you for your message. Our team will review it and get back to you shortly.",
    };
  }
}

/**
 * Generate a personalized response based on booking status
 */
export async function generateBookingResponse(
  clientName: string,
  service: string,
  dateTime: string,
  status: "available" | "unavailable" | "pending",
  apiKey: string,
  alternativeSlots?: string[]
): Promise<string> {
  const genAI = getGeminiClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let prompt = "";

  if (status === "available") {
    prompt = `Generate a friendly WhatsApp message confirming a booking:
- Client name: ${clientName}
- Service: ${service}
- Date and time: ${dateTime}

Keep it short, professional, and warm. Include a confirmation message and ask for confirmation.`;
  } else if (status === "unavailable") {
    const alternatives = alternativeSlots?.join(", ") || "other available times";
    prompt = `Generate a friendly WhatsApp message suggesting alternative booking times:
- Client name: ${clientName}
- Service: ${service}
- Requested date/time: ${dateTime}
- Alternative slots: ${alternatives}

Keep it short, professional, and helpful. Suggest the alternatives politely.`;
  } else {
    prompt = `Generate a friendly WhatsApp message acknowledging a booking request:
- Client name: ${clientName}
- Service: ${service}
- Requested date/time: ${dateTime}

Keep it short and professional. Let them know we're processing their request.`;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("[Gemini] Error generating response:", error);
    return `Hi ${clientName}, thank you for your interest in our ${service} service. We'll confirm your booking shortly!`;
  }
}

/**
 * Analyze sentiment of a message
 */
export async function analyzeSentiment(
  messageText: string,
  apiKey: string
): Promise<{ sentiment: "positive" | "negative" | "neutral"; score: number }> {
  const genAI = getGeminiClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analyze the sentiment of this message and respond with ONLY a JSON object:
Message: "${messageText}"

Respond with this exact format (no markdown):
{"sentiment": "positive|negative|neutral", "score": 0.0-1.0}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(cleanedResponse);
    return {
      sentiment: analysis.sentiment || "neutral",
      score: analysis.score || 0.5,
    };
  } catch (error) {
    console.error("[Gemini] Error analyzing sentiment:", error);
    return { sentiment: "neutral", score: 0.5 };
  }
}
