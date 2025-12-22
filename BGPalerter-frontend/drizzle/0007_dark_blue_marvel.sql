CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`bgpUpdateRate` int,
	`alertsGenerated` int,
	`apiLatency` int,
	`apiErrorRate` decimal(5,2),
	`cpuUsage` decimal(5,2),
	`memoryUsage` decimal(5,2),
	`dbQueryTime` int,
	`dbConnections` int,
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
