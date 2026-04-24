import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ TENANT ROUTES ============
  tenant: router({
    getById: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input }) => {
        return db.getTenantById(input.tenantId);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getTenantBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          businessType: z.string().optional(),
          timezone: z.string().default("America/Sao_Paulo"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "platform_admin") {
          throw new Error("Only platform admins can create tenants");
        }

        const tenant = await db.createTenant({
          ...input,
          isActive: true,
        });

        return tenant;
      }),
  }),

  // ============ APPOINTMENT ROUTES ============
  appointment: router({
    list: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Verify user has access to this tenant
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getAppointmentsByTenant(
          input.tenantId,
          input.startDate,
          input.endDate
        );
      }),

    getById: protectedProcedure
      .input(z.object({ appointmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getAppointmentById(input.appointmentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          clientId: z.number(),
          serviceId: z.number(),
          startTime: z.date(),
          endTime: z.date(),
          source: z.enum(["whatsapp", "web", "phone", "manual"]).default("web"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const appointment = await db.createAppointment({
          ...input,
          status: "pending",
        });

        // Notify owner
        await notifyOwner({
          title: "New Booking Request",
          content: `A new booking request has been received. Please review it in your dashboard.`,
        });

        return appointment;
      }),

    update: protectedProcedure
      .input(
        z.object({
          appointmentId: z.number(),
          tenantId: z.number(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const updated = await db.updateAppointment(input.appointmentId, {
          status: input.status,
          notes: input.notes,
        });

        return updated;
      }),
  }),

  // ============ CUSTOMER ROUTES ============
  customer: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getClientsByTenant(input.tenantId);
      }),

    getByPhone: protectedProcedure
      .input(z.object({ tenantId: z.number(), phone: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getClientByPhone(input.tenantId, input.phone);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          name: z.string(),
          phone: z.string(),
          email: z.string().email().optional(),
          whatsappId: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.createClient({
          ...input,
          isActive: true,
        });
      }),
  }),

  // ============ SERVICE ROUTES ============
  service: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getServicesByTenant(input.tenantId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          durationMinutes: z.number(),
          price: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.createService({
          tenantId: input.tenantId,
          name: input.name,
          description: input.description,
          durationMinutes: input.durationMinutes,
          price: input.price,
          color: input.color,
          isActive: true,
        });
      }),
  }),

  // ============ BUSINESS HOURS ROUTES ============
  businessHours: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getBusinessHoursByTenant(input.tenantId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          dayOfWeek: z.number().min(0).max(6),
          isOpen: z.boolean().default(true),
          openTime: z.string(),
          closeTime: z.string(),
          breakStartTime: z.string().optional(),
          breakEndTime: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.createBusinessHours(input);
      }),
  }),

  // ============ NOTIFICATION ROUTES ============
  notification: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("Unauthorized");
        return db.getNotificationsByUser(ctx.user.id, input.limit);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          userId: z.number(),
          appointmentId: z.number().optional(),
          type: z.enum(["new_booking", "booking_modified", "booking_cancelled", "reminder", "system"]),
          title: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.createNotification(input);
      }),
  }),

  // ============ DOCUMENT ROUTES ============
  document: router({
    list: protectedProcedure
      .input(z.object({ tenantId: z.number(), clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getDocumentsByClient(input.tenantId, input.clientId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          clientId: z.number(),
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          s3Key: z.string(),
          s3Url: z.string(),
          documentType: z.string().optional(),
          appointmentId: z.number().optional(),
          conversationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.createDocument({
          ...input,
          isPublic: false,
        });
      }),
  }),

  // ============ ANALYTICS ROUTES ============
  analytics: router({
    getByTenant: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.getAnalyticsByTenant(input.tenantId, input.startDate, input.endDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
