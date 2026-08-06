CREATE TABLE `waitlist_signup` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_signup_email_uidx` ON `waitlist_signup` (`email`);--> statement-breakpoint
CREATE INDEX `waitlist_signup_createdAt_idx` ON `waitlist_signup` (`createdAt`);
