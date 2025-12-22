CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`ruleType` enum('prefix_length','as_path_pattern','roa_mismatch','announcement_rate','custom') NOT NULL,
	`conditions` json NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`notificationChannels` json,
	`createdBy` int NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastTriggered` timestamp,
	`triggerCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
