ALTER TABLE `bgp_alerts` ADD `acknowledged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bgp_alerts` ADD `acknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bgp_alerts` ADD `acknowledgedBy` int;