CREATE TABLE `aiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`conversationId` int,
	`inputText` text NOT NULL,
	`outputText` text,
	`extractedIntent` varchar(100),
	`extractedDate` datetime,
	`extractedService` varchar(255),
	`confidence` decimal(3,2),
	`processingTimeMs` int,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`date` datetime NOT NULL,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalBookingRequests` int NOT NULL DEFAULT 0,
	`successfulBookings` int NOT NULL DEFAULT 0,
	`cancelledBookings` int NOT NULL DEFAULT 0,
	`conversionRate` decimal(5,2) DEFAULT '0',
	`topService` varchar(255),
	`topHour` tinyint DEFAULT 0,
	`averageResponseTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`clientId` int NOT NULL,
	`serviceId` int NOT NULL,
	`staffId` int,
	`startTime` datetime NOT NULL,
	`endTime` datetime NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`source` enum('whatsapp','web','phone','manual') NOT NULL DEFAULT 'whatsapp',
	`notes` text,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`confirmationSent` boolean NOT NULL DEFAULT false,
	`whatsappMessageId` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`dayOfWeek` tinyint NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`openTime` varchar(5) NOT NULL,
	`closeTime` varchar(5) NOT NULL,
	`breakStartTime` varchar(5),
	`breakEndTime` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessHours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ruleType` enum('auto_confirm','auto_reject','auto_suggest','custom') NOT NULL,
	`condition` json NOT NULL,
	`action` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`whatsappId` varchar(100),
	`notes` text,
	`totalBookings` int NOT NULL DEFAULT 0,
	`lastBookingDate` datetime,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`clientId` int NOT NULL,
	`messageId` varchar(100) NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`messageText` text NOT NULL,
	`messageType` enum('text','image','document','audio') NOT NULL DEFAULT 'text',
	`aiProcessed` boolean NOT NULL DEFAULT false,
	`aiResponse` text,
	`extractedData` json,
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`clientId` int NOT NULL,
	`appointmentId` int,
	`conversationId` int,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` text NOT NULL,
	`documentType` varchar(100),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`appointmentId` int,
	`type` enum('new_booking','booking_modified','booking_cancelled','reminder','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`durationMinutes` int NOT NULL,
	`price` decimal(10,2),
	`color` varchar(7),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`planName` varchar(100) NOT NULL,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`maxAppointmentsPerMonth` int,
	`maxServices` int,
	`maxStaff` int,
	`features` json,
	`status` enum('active','cancelled','paused') NOT NULL DEFAULT 'active',
	`startDate` datetime NOT NULL,
	`renewalDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`website` varchar(255),
	`logo` text,
	`description` text,
	`businessType` varchar(100),
	`whatsappNumber` varchar(20),
	`whatsappApiKey` text,
	`geminiApiKey` text,
	`timezone` varchar(50) NOT NULL DEFAULT 'America/Sao_Paulo',
	`maxConcurrentBookings` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `webhookLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`webhookType` varchar(50) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('platform_admin','business_owner','staff') NOT NULL DEFAULT 'business_owner';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);