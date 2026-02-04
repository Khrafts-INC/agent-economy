// SQLite schema for Agent Economy MVP

export const SCHEMA = `
-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  moltbook_id TEXT UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  balance INTEGER NOT NULL DEFAULT 0,  -- in shells (🐚)
  reputation_score REAL NOT NULL DEFAULT 0.0,
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  total_jobs_requested INTEGER NOT NULL DEFAULT 0,
  webhook_url TEXT,  -- optional webhook for job notifications
  referred_by TEXT REFERENCES agents(id),  -- who referred this agent
  referral_code TEXT UNIQUE,  -- unique code for sharing (e.g., ODED-7X3K)
  referrals_made INTEGER NOT NULL DEFAULT 0,  -- count of agents referred
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Services table (what agents offer)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES agents(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price INTEGER NOT NULL,  -- in shells
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Jobs table (work in progress)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES services(id),
  requester_id TEXT NOT NULL REFERENCES agents(id),
  provider_id TEXT NOT NULL REFERENCES agents(id),
  amount INTEGER NOT NULL,  -- shells escrowed
  description TEXT,
  deliverable TEXT,
  status TEXT NOT NULL DEFAULT 'requested',  -- requested, accepted, delivered, completed, cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Transactions table (all shell movements)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  type TEXT NOT NULL,  -- starter_grant, job_payment, job_earning, escrow_lock, escrow_release, fee
  amount INTEGER NOT NULL,  -- positive = credit, negative = debit
  job_id TEXT REFERENCES jobs(id),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  reviewer_id TEXT NOT NULL REFERENCES agents(id),
  reviewee_id TEXT NOT NULL REFERENCES agents(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_jobs_requester ON jobs(requester_id);
CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- Referral tracking indexes
CREATE INDEX IF NOT EXISTS idx_agents_referral_code ON agents(referral_code);
CREATE INDEX IF NOT EXISTS idx_agents_referred_by ON agents(referred_by);

-- USDC Escrows table (for real-money transactions)
CREATE TABLE IF NOT EXISTS escrows (
  id TEXT PRIMARY KEY,  -- bytes32 from contract
  client_agent_id TEXT NOT NULL REFERENCES agents(id),
  provider_agent_id TEXT NOT NULL REFERENCES agents(id),
  service_id TEXT REFERENCES services(id),
  amount TEXT NOT NULL,  -- USDC amount as string (e.g., "10.00")
  status TEXT NOT NULL DEFAULT 'active',  -- active, released, refunded, claimed
  tx_hash TEXT,  -- creation transaction hash
  deadline TEXT,  -- when timeout actions become available
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_escrows_client ON escrows(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_escrows_provider ON escrows(provider_agent_id);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
`;
