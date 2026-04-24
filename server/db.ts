import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  tenants,
  appointments,
  clients,
  services,
  businessHours,
  conversations,
  notifications,
  documents,
  analytics,
  businessRules,
  aiLogs,
  subscriptions,
  webhookLogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "platform_admin";
      updateSet.role = "platform_admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ TENANT QUERIES ============

export async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createTenant(data: typeof tenants.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tenants).values(data);
  return result;
}

// ============ APPOINTMENT QUERIES ============

export async function getAppointmentsByTenant(
  tenantId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(appointments.tenantId, tenantId)];

  if (startDate && endDate) {
    conditions.push(
      gte(appointments.startTime, startDate),
      lte(appointments.startTime, endDate)
    );
  }

  return db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(desc(appointments.startTime));
}

export async function getAppointmentById(appointmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(
  data: typeof appointments.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appointments).values(data);
  return result;
}

export async function updateAppointment(
  appointmentId: number,
  data: Partial<typeof appointments.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(appointments)
    .set(data)
    .where(eq(appointments.id, appointmentId));
}

// ============ CLIENT QUERIES ============

export async function getClientsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
    .orderBy(desc(clients.lastBookingDate));
}

export async function getClientByPhone(tenantId: number, phone: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.phone, phone)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: typeof clients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data);
  return result;
}

export async function updateClient(
  clientId: number,
  data: Partial<typeof clients.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(clients)
    .set(data)
    .where(eq(clients.id, clientId));
}

// ============ SERVICE QUERIES ============

export async function getServicesByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenantId), eq(services.isActive, true)))
    .orderBy(asc(services.name));
}

export async function getServiceById(serviceId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createService(data: typeof services.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(services).values(data);
}

// ============ BUSINESS HOURS QUERIES ============

export async function getBusinessHoursByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(businessHours)
    .where(eq(businessHours.tenantId, tenantId))
    .orderBy(asc(businessHours.dayOfWeek));
}

export async function createBusinessHours(
  data: typeof businessHours.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(businessHours).values(data);
}

// ============ CONVERSATION QUERIES ============

export async function createConversation(
  data: typeof conversations.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(conversations).values(data);
}

export async function getConversationsByClient(
  tenantId: number,
  clientId: number
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.tenantId, tenantId),
        eq(conversations.clientId, clientId)
      )
    )
    .orderBy(desc(conversations.createdAt));
}

// ============ NOTIFICATION QUERIES ============

export async function createNotification(
  data: typeof notifications.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// ============ DOCUMENT QUERIES ============

export async function createDocument(data: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(documents).values(data);
}

export async function getDocumentsByClient(tenantId: number, clientId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        eq(documents.clientId, clientId)
      )
    )
    .orderBy(desc(documents.createdAt));
}

// ============ AI LOG QUERIES ============

export async function createAILog(data: typeof aiLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(aiLogs).values(data);
}

// ============ ANALYTICS QUERIES ============

export async function createAnalytics(data: typeof analytics.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(analytics).values(data);
}

export async function getAnalyticsByTenant(
  tenantId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(analytics)
    .where(
      and(
        eq(analytics.tenantId, tenantId),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      )
    )
    .orderBy(desc(analytics.date));
}

// ============ WEBHOOK LOG QUERIES ============

export async function createWebhookLog(data: typeof webhookLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(webhookLogs).values(data);
}

export async function updateWebhookLog(
  webhookLogId: number,
  data: Partial<typeof webhookLogs.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(webhookLogs)
    .set(data)
    .where(eq(webhookLogs.id, webhookLogId));
}
