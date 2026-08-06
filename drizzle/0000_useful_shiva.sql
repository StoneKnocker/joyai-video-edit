CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `account_providerId_accountId_idx` ON `account` (`providerId`,`accountId`);--> statement-breakpoint
CREATE TABLE `billing_customer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerCustomerId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customer_user_provider_uidx` ON `billing_customer` (`userId`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customer_provider_customer_uidx` ON `billing_customer` (`provider`,`providerCustomerId`);--> statement-breakpoint
CREATE TABLE `credit_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`amount` integer NOT NULL,
	`creditType` text NOT NULL,
	`creditEvent` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`referenceId` text DEFAULT '' NOT NULL,
	`paymentId` integer,
	`subscriptionId` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscriptionId`) REFERENCES `subscription`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `credit_history_userId_idx` ON `credit_history` (`userId`);--> statement-breakpoint
CREATE INDEX `credit_history_paymentId_idx` ON `credit_history` (`paymentId`);--> statement-breakpoint
CREATE INDEX `credit_history_subscriptionId_idx` ON `credit_history` (`subscriptionId`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text,
	`email` text NOT NULL,
	`category` text NOT NULL,
	`message` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `feedback_userId_idx` ON `feedback` (`userId`);--> statement-breakpoint
CREATE TABLE `payment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publicId` text NOT NULL,
	`userId` text NOT NULL,
	`subscriptionId` integer,
	`kind` text NOT NULL,
	`amountCents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`planId` text NOT NULL,
	`provider` text NOT NULL,
	`providerSessionId` text,
	`providerTransactionId` text,
	`creditType` text NOT NULL,
	`creditsAmount` integer NOT NULL,
	`status` text NOT NULL,
	`paidAt` integer,
	`metadata` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscriptionId`) REFERENCES `subscription`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_publicId_unique` ON `payment` (`publicId`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_provider_session_uidx` ON `payment` (`provider`,`providerSessionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_provider_transaction_uidx` ON `payment` (`provider`,`providerTransactionId`);--> statement-breakpoint
CREATE INDEX `payment_userId_createdAt_idx` ON `payment` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payment_subscriptionId_idx` ON `payment` (`subscriptionId`);--> statement-breakpoint
CREATE TABLE `rateLimit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text,
	`count` integer,
	`lastRequest` integer
);
--> statement-breakpoint
CREATE INDEX `rateLimit_key_idx` ON `rateLimit` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `session_token_idx` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publicId` text NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerSubscriptionId` text NOT NULL,
	`providerCustomerId` text,
	`status` text NOT NULL,
	`planId` text NOT NULL,
	`periodStart` integer NOT NULL,
	`periodEnd` integer NOT NULL,
	`cancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`canceledAt` integer,
	`metadata` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_publicId_unique` ON `subscription` (`publicId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_provider_providerSubscriptionId_uidx` ON `subscription` (`provider`,`providerSubscriptionId`);--> statement-breakpoint
CREATE INDEX `subscription_userId_status_idx` ON `subscription` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `subscription_periodEnd_idx` ON `subscription` (`periodEnd`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`banReason` text,
	`banExpires` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_balance` (
	`userId` text PRIMARY KEY NOT NULL,
	`subscriptionCredits` integer DEFAULT 0 NOT NULL,
	`permanentCredits` integer DEFAULT 0 NOT NULL,
	`subscriptionCycleEnd` integer,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_source` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text,
	`firstVisitAt` integer NOT NULL,
	`utmSource` text DEFAULT '' NOT NULL,
	`utmMedium` text DEFAULT '' NOT NULL,
	`utmCampaign` text DEFAULT '' NOT NULL,
	`utmContent` text DEFAULT '' NOT NULL,
	`utmTerm` text DEFAULT '' NOT NULL,
	`referrer` text DEFAULT '' NOT NULL,
	`landingUrl` text DEFAULT '' NOT NULL,
	`deviceType` text DEFAULT '' NOT NULL,
	`browser` text DEFAULT '' NOT NULL,
	`os` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`ipAddress` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_sources_userId_idx` ON `user_source` (`userId`);--> statement-breakpoint
CREATE TABLE `user_task` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`mode` text NOT NULL,
	`model` text NOT NULL,
	`provider` text DEFAULT 'kie' NOT NULL,
	`prompt` text DEFAULT '' NOT NULL,
	`input` text NOT NULL,
	`providerTaskId` text,
	`resultData` text NOT NULL,
	`errorMessage` text DEFAULT '' NOT NULL,
	`errorCode` text DEFAULT '' NOT NULL,
	`creditCost` integer DEFAULT 0 NOT NULL,
	`processingDurationMs` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`completedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_tasks_userId_createdAt_idx` ON `user_task` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_tasks_providerTaskId_idx` ON `user_task` (`providerTaskId`);--> statement-breakpoint
CREATE INDEX `user_tasks_status_updatedAt_idx` ON `user_task` (`status`,`updatedAt`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `webhook_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`eventId` text NOT NULL,
	`eventType` text NOT NULL,
	`status` text NOT NULL,
	`errorMessage` text DEFAULT '' NOT NULL,
	`payload` text,
	`createdAt` integer NOT NULL,
	`processedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_event_provider_eventId_uidx` ON `webhook_event` (`provider`,`eventId`);