CREATE TABLE `mcp_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_prefix` text NOT NULL,
	`scopes` text DEFAULT '["mcp"]' NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_tokens_token_hash_unique` ON `mcp_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `mcp_tokens_user_idx` ON `mcp_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `mcp_tokens_org_idx` ON `mcp_tokens` (`organization_id`);