-- Candidates from manual registration or scraping
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  experience TEXT,
  skill_level VARCHAR(50),
  region VARCHAR(100),
  availability VARCHAR(255),
  language VARCHAR(100),
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scraped contacts from platforms (Kleinanzeigen, Facebook, etc.)
CREATE TABLE IF NOT EXISTS scraped_contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  url VARCHAR(1000),
  platform VARCHAR(100),
  contact_info JSONB,
  raw_text TEXT,
  contacted_at TIMESTAMP,
  response_status VARCHAR(50),
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contact history and outreach tracking
CREATE TABLE IF NOT EXISTS outreach_logs (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  contact_id INTEGER REFERENCES scraped_contacts(id),
  method VARCHAR(50),
  message TEXT,
  status VARCHAR(50),
  sent_at TIMESTAMP,
  response_received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scraping configuration
CREATE TABLE IF NOT EXISTS scraping_config (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(100),
  keywords JSONB,
  regions JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_scraped_contacts_platform ON scraped_contacts(platform);
CREATE INDEX IF NOT EXISTS idx_scraped_contacts_created_at ON scraped_contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_outreach_logs_candidate_id ON outreach_logs(candidate_id);
