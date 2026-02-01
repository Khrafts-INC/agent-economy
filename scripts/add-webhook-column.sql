-- Migration: Add webhook_url column to agents table
-- Run this on existing databases

ALTER TABLE agents ADD COLUMN webhook_url TEXT;
