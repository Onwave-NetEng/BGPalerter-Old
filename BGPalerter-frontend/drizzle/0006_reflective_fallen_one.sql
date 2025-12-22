CREATE TABLE `hijack_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prefix` varchar(50) NOT NULL,
	`expectedAsn` int NOT NULL,
	`announcedAsn` int NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`status` enum('active','resolved','false_positive') NOT NULL DEFAULT 'active',
	`alertId` int,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'critical',
	`notes` text,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hijack_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prefix_ownership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prefix` varchar(50) NOT NULL,
	`asn` int NOT NULL,
	`description` text,
	`verified` boolean NOT NULL DEFAULT false,
	`source` varchar(50),
	`createdBy` int NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSeen` timestamp,
	CONSTRAINT `prefix_ownership_id` PRIMARY KEY(`id`),
	CONSTRAINT `prefix_ownership_prefix_unique` UNIQUE(`prefix`)
);
