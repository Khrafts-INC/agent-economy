-- Migration: Add referral tracking columns to agents table
-- Run with: sqlite3 data/agent-economy.db < scripts/add-referral-columns.sql

-- Add referral columns
ALTER TABLE agents ADD COLUMN referred_by TEXT REFERENCES agents(id);
ALTER TABLE agents ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE agents ADD COLUMN referrals_made INTEGER NOT NULL DEFAULT 0;

-- Index for referral lookups
CREATE INDEX IF NOT EXISTS idx_agents_referral_code ON agents(referral_code);
CREATE INDEX IF NOT EXISTS idx_agents_referred_by ON agents(referred_by);

-- Generate referral codes for existing agents (NAME-XXXX format)
-- This needs to be run programmatically since SQLite lacks random string functions
