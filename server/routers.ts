import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { generateOllamaResponse } from "./ollama";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,

  // ============ AI TEST ROUTE ============
  ai: router({
    history: publicProcedure
      .input(z.object({ tenantId: z.number(), clientId: z.number(), limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        const history = await db.getConversationsByClient(input.tenantId, input.clientId, input.limit);
        return history.reverse();
      }),
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
        clientName: z.string().default("Teste"),
        tenantId: z.number().default(1),
        clientId: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const servicos = await db.getServicesByTenant(input.tenantId);
        const result = await generateOllamaResponse(
          input.messages,
          input.clientName,
          servicos.map(s => s.name)
        );

        if (input.clientId && input.message) {
          const userMessageId = nanoid();
          await db.createConversation({
            tenantId: input.tenantId,
            clientId: input.clientId,
            messageId: userMessageId,
            direction: "inbound",
            messageText: input.message,
            messageType: "text",
            aiProcessed: true,
            aiResponse: result.resposta_cliente,
            extractedData: {
              intencao: result.intencao,
              servico: result.servico,
              data: result.data,
              hora: result.hora,
            },
          });

          await db.createConversation({
            tenantId: input.tenantId,
            clientId: input.clientId,
            messageId: `${userMessageId}-reply`,
            direction: "outbound",
            messageText: result.resposta_cliente,
            messageType: "text",
            aiProcessed: true,
            aiResponse: result.resposta_cliente,
            extractedData: {
              source: "ollama",
            },
          });
        }

        return result;
      }),
  }),
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

    update: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          businessType: z.string().optional(),
          timezone: z.string().optional(),
          maxConcurrentBookings: z.number().optional(),
          whatsappNumber: z.string().optional(),
          whatsappApiKey: z.string().optional(),
          geminiApiKey: z.string().optional(),
          notificationPreferences: z
            .object({
              newBookings: z.boolean(),
              reminders: z.boolean(),
              cancellations: z.boolean(),
              email: z.boolean(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.updateTenant(input.tenantId, {
          name: input.name,
          email: input.email,
          phone: input.phone,
          businessType: input.businessType,
          timezone: input.timezone,
          maxConcurrentBookings: input.maxConcurrentBookings,
          whatsappNumber: input.whatsappNumber,
          whatsappApiKey: input.whatsappApiKey,
          geminiApiKey: input.geminiApiKey,
          notificationPreferences: input.notificationPreferences,
        });
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
        const notificationSent = await notifyOwner({
          title: "New Booking Request",
          content: `A new booking request has been received. Please review it in your dashboard.`,
        });

        if (!notificationSent) {
          console.warn("[Appointments] Owner notification skipped or failed, but appointment was created successfully.");
        }

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

    update: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          clientId: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.updateClient(input.clientId, {
          name: input.name,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          isActive: input.isActive,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ tenantId: z.number(), clientId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.deactivateClient(input.clientId);
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

    update: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          serviceId: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          durationMinutes: z.number().optional(),
          price: z.string().optional(),
          color: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const service = await db.getServiceById(input.serviceId);
        if (!service || service.tenantId !== input.tenantId) {
          throw new Error("Service not found");
        }

        return db.updateService(input.serviceId, {
          name: input.name,
          description: input.description,
          durationMinutes: input.durationMinutes,
          price: input.price,
          color: input.color,
          isActive: input.isActive,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ tenantId: z.number(), serviceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const service = await db.getServiceById(input.serviceId);
        if (!service || service.tenantId !== input.tenantId) {
          throw new Error("Service not found");
        }

        return db.deactivateService(input.serviceId);
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

    save: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          items: z.array(
            z.object({
              dayOfWeek: z.number().min(0).max(6),
              isOpen: z.boolean(),
              openTime: z.string(),
              closeTime: z.string(),
              breakStartTime: z.string().optional(),
              breakEndTime: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        return db.upsertBusinessHoursForTenant(
          input.tenantId,
          input.items.map((item) => ({
            tenantId: input.tenantId,
            ...item,
          }))
        );
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

    upload: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          clientId: z.number(),
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          fileDataBase64: z.string(),
          documentType: z.string().optional(),
          appointmentId: z.number().optional(),
          conversationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const client = await db.getClientById(input.tenantId, input.clientId);
        if (!client) {
          throw new Error("Client not found");
        }

        const base64 = input.fileDataBase64.includes(",")
          ? input.fileDataBase64.split(",").pop() ?? input.fileDataBase64
          : input.fileDataBase64;
        const fileBuffer = Buffer.from(base64, "base64");
        const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const storageKey = `tenants/${input.tenantId}/documents/${Date.now()}-${nanoid(8)}-${safeFileName}`;
        const { key, url } = await storagePut(storageKey, fileBuffer, input.fileType);

        return db.createDocument({
          tenantId: input.tenantId,
          clientId: input.clientId,
          appointmentId: input.appointmentId,
          conversationId: input.conversationId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          s3Key: key,
          s3Url: url,
          documentType: input.documentType,
          isPublic: false,
        });
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

  dashboard: router({
    summary: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.tenantId !== input.tenantId && ctx.user?.role !== "platform_admin") {
          throw new Error("Unauthorized");
        }

        const [appointments, clients, conversations, services] = await Promise.all([
          db.getAppointmentsByTenant(input.tenantId),
          db.getClientsByTenant(input.tenantId),
          db.getConversationsByTenant(input.tenantId),
          db.getServicesByTenant(input.tenantId),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointmentsToday = appointments.filter((appointment) => {
          const start = new Date(appointment.startTime);
          return start >= today && start < tomorrow;
        }).length;

        const completedBookings = appointments.filter((appointment) => appointment.status === "completed").length;
        const conversionRate = appointments.length > 0 ? Math.round((completedBookings / appointments.length) * 100) : 0;

        const recentAppointments = appointments.slice(0, 5).map((appointment) => {
          const client = clients.find((item) => item.id === appointment.clientId);
          const service = services.find((item) => item.id === appointment.serviceId);

          return {
            id: appointment.id,
            clientName: client?.name ?? `Cliente #${appointment.clientId}`,
            serviceName: service?.name ?? `Serviço #${appointment.serviceId}`,
            status: appointment.status,
            startTime: appointment.startTime,
          };
        });

        return {
          appointmentsToday,
          activeClients: clients.filter((client) => client.isActive).length,
          conversionRate,
          messagesProcessed: conversations.length,
          recentAppointments,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
