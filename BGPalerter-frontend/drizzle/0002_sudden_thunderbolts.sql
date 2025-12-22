CREATE TABLE `bgp_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`type` varchar(50) NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`prefix` varchar(50) NOT NULL,
	`asn` varchar(20),
	`message` text NOT NULL,
	`details` json,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bgp_alerts_id` PRIMARY KEY(`id`)
);
