import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  datetime,
  tinyint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with multi-tenant support.
 * Users can be admins (platform) or clients (business owners).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["platform_admin", "business_owner", "staff"]).default("business_owner").notNull(),
  tenantId: int("tenantId"),
  profileImage: text("profileImage"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tenants represent businesses/organizations using the platform.
 * Each tenant has its own agendamentos, configurações, etc.
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  logo: text("logo"),
  description: text("description"),
  businessType: varchar("businessType", { length: 100 }),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  whatsappApiKey: text("whatsappApiKey"),
  geminiApiKey: text("geminiApiKey"),
  notificationPreferences: json("notificationPreferences"),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo").notNull(),
  maxConcurrentBookings: int("maxConcurrentBookings").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Business hours configuration for each tenant.
 * Defines when the business is open and available for bookings.
 */
export const businessHours = mysqlTable("businessHours", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  dayOfWeek: tinyint("dayOfWeek").notNull(), // 0 = Sunday, 6 = Saturday
  isOpen: boolean("isOpen").default(true).notNull(),
  openTime: varchar("openTime", { length: 5 }).notNull(), // HH:MM format
  closeTime: varchar("closeTime", { length: 5 }).notNull(),
  breakStartTime: varchar("breakStartTime", { length: 5 }),
  breakEndTime: varchar("breakEndTime", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = typeof businessHours.$inferInsert;

/**
 * Services offered by each tenant.
 * Each service has a duration and can have different pricing.
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").notNull(), // Duration in minutes
  price: decimal("price", { precision: 10, scale: 2 }),
  color: varchar("color", { length: 7 }), // Hex color for calendar display
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Clients/customers who book appointments.
 * Stores client information for WhatsApp communication.
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsappId: varchar("whatsappId", { length: 100 }), // WhatsApp contact ID
  notes: text("notes"),
  totalBookings: int("totalBookings").default(0).notNull(),
  lastBookingDate: datetime("lastBookingDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Appointments/Agendamentos - Core booking entity.
 * Stores all booking information with status tracking.
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  clientId: int("clientId").notNull(),
  serviceId: int("serviceId").notNull(),
  staffId: int("staffId"), // Optional: assigned staff member
  startTime: datetime("startTime").notNull(),
  endTime: datetime("endTime").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  source: mysqlEnum("source", ["whatsapp", "web", "phone", "manual"]).default("whatsapp").notNull(),
  notes: text("notes"),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  confirmationSent: boolean("confirmationSent").default(false).notNull(),
  whatsappMessageId: varchar("whatsappMessageId", { length: 100 }),
  metadata: json("metadata"), // Store additional data like AI processing results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Conversation history with clients via WhatsApp.
 * Stores messages for context and analytics.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  clientId: int("clientId").notNull(),
  messageId: varchar("messageId", { length: 100 }).notNull().unique(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  messageText: text("messageText").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "document", "audio"]).default("text").notNull(),
  aiProcessed: boolean("aiProcessed").default(false).notNull(),
  aiResponse: text("aiResponse"),
  extractedData: json("extractedData"), // Intent, date, service, etc.
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Documents uploaded by clients via WhatsApp.
 * Stores references to files in S3 with metadata.
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  conversationId: int("conversationId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // MIME type
  fileSize: int("fileSize").notNull(), // Size in bytes
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: text("s3Url").notNull(),
  documentType: varchar("documentType", { length: 100 }), // e.g., "proof", "receipt", "contract"
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Notifications sent to business owners and staff.
 * Tracks in-app and email notifications.
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  appointmentId: int("appointmentId"),
  type: mysqlEnum("type", ["new_booking", "booking_modified", "booking_cancelled", "reminder", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Analytics data for bookings and conversions.
 * Aggregated data for reporting and insights.
 */
export const analytics = mysqlTable("analytics", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  date: datetime("date").notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  totalBookingRequests: int("totalBookingRequests").default(0).notNull(),
  successfulBookings: int("successfulBookings").default(0).notNull(),
  cancelledBookings: int("cancelledBookings").default(0).notNull(),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0"),
  topService: varchar("topService", { length: 255 }),
  topHour: tinyint("topHour").default(0), // 0-23
  averageResponseTime: int("averageResponseTime").default(0), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Business rules and AI configuration for each tenant.
 * Stores custom rules for booking automation.
 */
export const businessRules = mysqlTable("businessRules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ruleType: mysqlEnum("ruleType", ["auto_confirm", "auto_reject", "auto_suggest", "custom"]).notNull(),
  condition: json("condition").notNull(), // JSON object defining the rule condition
  action: json("action").notNull(), // JSON object defining the action to take
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessRule = typeof businessRules.$inferSelect;
export type InsertBusinessRule = typeof businessRules.$inferInsert;

/**
 * AI Processing logs for debugging and monitoring.
 * Tracks all Gemini API calls and responses.
 */
export const aiLogs = mysqlTable("aiLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  conversationId: int("conversationId"),
  inputText: text("inputText").notNull(),
  outputText: text("outputText"),
  extractedIntent: varchar("extractedIntent", { length: 100 }),
  extractedDate: datetime("extractedDate"),
  extractedService: varchar("extractedService", { length: 255 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  processingTimeMs: int("processingTimeMs"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AILog = typeof aiLogs.$inferSelect;
export type InsertAILog = typeof aiLogs.$inferInsert;

/**
 * Subscription/Pricing plans for the platform.
 * Tracks which plan each tenant is on.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().unique(),
  planName: varchar("planName", { length: 100 }).notNull(),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  maxAppointmentsPerMonth: int("maxAppointmentsPerMonth"),
  maxServices: int("maxServices"),
  maxStaff: int("maxStaff"),
  features: json("features"), // Array of feature flags
  status: mysqlEnum("status", ["active", "cancelled", "paused"]).default("active").notNull(),
  startDate: datetime("startDate").notNull(),
  renewalDate: datetime("renewalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Webhook logs for WhatsApp and other integrations.
 * For debugging and audit trails.
 */
export const webhookLogs = mysqlTable("webhookLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  webhookType: varchar("webhookType", { length: 50 }).notNull(), // "whatsapp", "payment", etc.
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;
