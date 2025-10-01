-- Migration: Add Notification Digest, Web Push, and Advanced Filter Support
-- Date: 2025-10-01
-- Description: Adds tables for notification queuing/batching, web push subscriptions, and enhanced filtering

-- Notification Queue for Digest System
CREATE TABLE IF NOT EXISTS `mantis_notification_queue_table` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `bug_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `event_type` VARCHAR(32) NOT NULL,
  `severity` SMALLINT NOT NULL DEFAULT 10,
  `priority` SMALLINT NOT NULL DEFAULT 30,
  `category_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `html_body` LONGTEXT,
  `metadata` JSON,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, batched, sent, failed
  `batch_id` VARCHAR(64),
  `date_created` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_scheduled` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_sent` INT UNSIGNED,
  INDEX `idx_queue_user_status` (`user_id`, `status`),
  INDEX `idx_queue_batch` (`batch_id`),
  INDEX `idx_queue_scheduled` (`date_scheduled`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Web Push Subscriptions
CREATE TABLE IF NOT EXISTS `mantis_webpush_subscription_table` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `endpoint` VARCHAR(512) NOT NULL,
  `p256dh_key` VARCHAR(128) NOT NULL,
  `auth_key` VARCHAR(64) NOT NULL,
  `user_agent` VARCHAR(255),
  `ip_address` VARCHAR(45),
  `enabled` TINYINT NOT NULL DEFAULT 1,
  `date_created` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_last_used` INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY `idx_webpush_endpoint` (`endpoint`),
  INDEX `idx_webpush_user` (`user_id`, `enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Notification Preferences Extension (Advanced Filters)
CREATE TABLE IF NOT EXISTS `mantis_notification_filter_table` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `project_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  `filter_type` VARCHAR(32) NOT NULL, -- category, priority, severity, tag, custom
  `filter_value` VARCHAR(128) NOT NULL,
  `action` VARCHAR(32) NOT NULL DEFAULT 'notify', -- notify, ignore, digest_only
  `channels` JSON, -- ["email", "webpush", "teams"] etc.
  `date_created` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_modified` INT UNSIGNED NOT NULL DEFAULT 1,
  INDEX `idx_filter_user_project` (`user_id`, `project_id`, `enabled`),
  INDEX `idx_filter_type` (`filter_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notification History (User-Facing Log)
CREATE TABLE IF NOT EXISTS `mantis_notification_history_table` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `bug_id` INT UNSIGNED NOT NULL DEFAULT 0,
  `event_type` VARCHAR(32) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `channels_sent` JSON, -- ["email", "webpush"]
  `read_status` TINYINT NOT NULL DEFAULT 0,
  `date_sent` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_read` INT UNSIGNED,
  INDEX `idx_history_user` (`user_id`, `read_status`),
  INDEX `idx_history_bug` (`bug_id`),
  INDEX `idx_history_date` (`date_sent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Digest Preferences
CREATE TABLE IF NOT EXISTS `mantis_digest_pref_table` (
  `user_id` INT UNSIGNED NOT NULL PRIMARY KEY,
  `enabled` TINYINT NOT NULL DEFAULT 0,
  `frequency` VARCHAR(32) NOT NULL DEFAULT 'daily', -- hourly, daily, weekly
  `time_of_day` SMALLINT NOT NULL DEFAULT 9, -- 0-23 hour
  `day_of_week` TINYINT NOT NULL DEFAULT 1, -- 1-7 (Monday-Sunday)
  `min_notifications` SMALLINT NOT NULL DEFAULT 1, -- minimum notifications to trigger digest
  `include_channels` JSON, -- ["email", "webpush"]
  `last_digest_sent` INT UNSIGNED,
  `next_digest_scheduled` INT UNSIGNED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
