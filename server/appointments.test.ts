import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database
vi.mock("./db", () => ({
  getAppointmentsByTenant: vi.fn().mockResolvedValue([
    {
      id: 1,
      tenantId: 1,
      clientId: 1,
      serviceId: 1,
      startTime: new Date("2026-04-05T10:00:00"),
      endTime: new Date("2026-04-05T10:30:00"),
      status: "confirmed",
      source: "whatsapp",
      notes: "Test appointment",
      reminderSent: false,
      confirmationSent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAppointmentById: vi.fn().mockResolvedValue({
    id: 1,
    tenantId: 1,
    clientId: 1,
    serviceId: 1,
    startTime: new Date("2026-04-05T10:00:00"),
    endTime: new Date("2026-04-05T10:30:00"),
    status: "confirmed",
    source: "whatsapp",
    notes: "Test appointment",
    reminderSent: false,
    confirmationSent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createAppointment: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateAppointment: vi.fn().mockResolvedValue({ success: true }),
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createAuthContext(tenantId = 1): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "business_owner",
      tenantId,
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      phone: null,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any as TrpcContext["res"],
  };
}

describe("Appointments Router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext(1);
  });

  describe("appointment.list", () => {
    it("should list appointments for a tenant", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.appointment.list({
        tenantId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
      expect(result[0]?.status).toBe("confirmed");
    });

    it("should reject unauthorized access", async () => {
      const unauthorizedCtx = createAuthContext(2);
      const caller = appRouter.createCaller(unauthorizedCtx);

      await expect(
        caller.appointment.list({
          tenantId: 1,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should allow platform admin access", async () => {
      const adminCtx = createAuthContext(1);
      if (adminCtx.user) {
        adminCtx.user.role = "platform_admin";
      }
      const caller = appRouter.createCaller(adminCtx);

      const result = await caller.appointment.list({
        tenantId: 1,
      });

      expect(result).toBeDefined();
    });
  });

  describe("appointment.getById", () => {
    it("should get a specific appointment", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.appointment.getById({
        appointmentId: 1,
      });

      expect(result?.id).toBe(1);
      expect(result?.status).toBe("confirmed");
    });
  });

  describe("appointment.create", () => {
    it("should create a new appointment", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.appointment.create({
        tenantId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: new Date("2026-04-05T10:00:00"),
        endTime: new Date("2026-04-05T10:30:00"),
        source: "web",
      });

      expect(result).toBeDefined();
    });

    it("should reject creation for unauthorized tenant", async () => {
      const unauthorizedCtx = createAuthContext(2);
      const caller = appRouter.createCaller(unauthorizedCtx);

      await expect(
        caller.appointment.create({
          tenantId: 1,
          clientId: 1,
          serviceId: 1,
          startTime: new Date("2026-04-05T10:00:00"),
          endTime: new Date("2026-04-05T10:30:00"),
          source: "web",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("appointment.update", () => {
    it("should update an appointment status", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.appointment.update({
        appointmentId: 1,
        tenantId: 1,
        status: "completed",
      });

      expect(result).toBeDefined();
    });

    it("should reject unauthorized update", async () => {
      const unauthorizedCtx = createAuthContext(2);
      const caller = appRouter.createCaller(unauthorizedCtx);

      await expect(
        caller.appointment.update({
          appointmentId: 1,
          tenantId: 1,
          status: "completed",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
