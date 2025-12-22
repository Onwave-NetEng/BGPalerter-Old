CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`emailRecipients` json,
	`teamsEnabled` boolean NOT NULL DEFAULT false,
	`teamsWebhookUrl` text,
	`slackEnabled` boolean NOT NULL DEFAULT false,
	`slackWebhookUrl` text,
	`discordEnabled` boolean NOT NULL DEFAULT false,
	`discordWebhookUrl` text,
	`minSeverity` enum('critical','warning','info') NOT NULL DEFAULT 'info',
	`alertTypes` json,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
