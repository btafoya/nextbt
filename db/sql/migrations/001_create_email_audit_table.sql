-- Email Audit Table Migration
-- Creates a table to log all email notifications sent through NextBT

CREATE TABLE IF NOT EXISTS `mantis_email_audit_table` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `bug_id` int(10) unsigned NOT NULL DEFAULT 0,
  `user_id` int(10) unsigned NOT NULL DEFAULT 0,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `channel` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL,
  `error_message` text NOT NULL DEFAULT '',
  `date_sent` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_email_audit_bug_id` (`bug_id`),
  KEY `idx_email_audit_user_id` (`user_id`),
  KEY `idx_email_audit_date_sent` (`date_sent`),
  KEY `idx_email_audit_channel` (`channel`),
  KEY `idx_email_audit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
