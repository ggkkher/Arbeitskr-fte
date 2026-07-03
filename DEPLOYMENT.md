# Deployment Guide

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 3. Initialize database
npm run db:init

# 4. Start server
npm run dev
```

Server runs on `http://localhost:3000`

---

## Production Deployment (Railway.app)

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 2. Connect Repository
- Create new project
- Connect your GitHub repo (ggkkher/Arbeitskr-fte)

### 3. Add PostgreSQL Plugin
- In Railway dashboard, click "Add Service"
- Select "PostgreSQL"
- This automatically provides `DATABASE_URL`

### 4. Set Environment Variables
In Railway dashboard, set:
```
ANTHROPIC_API_KEY=sk-...  (from Anthropic console)
SENDGRID_API_KEY=SG_...   (from SendGrid)
TWILIO_ACCOUNT_SID=AC_... (from Twilio)
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+49...
ADMIN_PASSWORD=secure_password_here
NODE_ENV=production
```

### 5. Add Database Initialization Hook
In Railway, add "Run Command" for deployment:
```
npm run db:init
```

### 6. Deploy
- Railway auto-deploys on `git push`
- Your app runs at `https://<project-name>.railway.app`

---

## Configuration Files

### .env variables

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/kania_workforce

# Server
PORT=3000
NODE_ENV=production

# Claude AI (for candidate evaluation)
ANTHROPIC_API_KEY=sk-...

# Email (SendGrid)
SENDGRID_API_KEY=SG_...
SENDGRID_FROM_EMAIL=noreply@kania-galabau.de

# WhatsApp & SMS (Twilio)
TWILIO_ACCOUNT_SID=AC_...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+49...
TWILIO_PHONE_NUMBER=+49...

# Admin
ADMIN_PASSWORD=your_secure_password
```

---

## Scheduled Jobs

### Daily Scraper (2:00 AM)
- Scrapes Kleinanzeigen.de for candidates
- Uses Claude AI to evaluate relevance
- Generates personalized contact messages
- Saves to database

**Manually trigger:**
```bash
npm run scrape
npm run generate-messages
npm run full-pipeline
```

### Hourly Outreach Processor
- Processes pending outreach messages
- Sends via WhatsApp > SMS > Email
- Tracks delivery status
- Updates response logs

**Manually trigger:**
```bash
curl -X POST http://localhost:3000/api/outreach/process-pending
```

---

## API Endpoints

### Candidates
- `GET /api/candidates` — List all
- `POST /api/candidates` — Register new
- `GET /api/candidates/export/csv` — Export

### Scraped Contacts
- `GET /api/scrape-results` — List all scraped
- `POST /api/scrape-results/trigger-scrape` — Start scraping
- `POST /api/scrape-results/trigger-contact-generation` — Generate messages

### Outreach
- `GET /api/outreach` — List all outreach logs
- `GET /api/outreach/stats/overview` — Statistics
- `POST /api/outreach/process-pending` — Process messages

---

## Database Schema

### candidates
Manually registered applicants
```sql
id, name, email, phone, experience, skill_level, region, 
availability, language, source, created_at, updated_at
```

### scraped_contacts
Extracted from web platforms
```sql
id, name, url, platform, contact_info (JSON), raw_text,
contacted_at, response_status, created_at, updated_at
```

### outreach_logs
Tracking all contact attempts
```sql
id, candidate_id, contact_id, method (email/sms/whatsapp),
message, status (pending/sent/failed), sent_at, created_at
```

---

## Monitoring

### Logs
```bash
# View server logs
npm run dev

# View database
psql $DATABASE_URL
```

### Admin Dashboards
- **Candidates:** `http://localhost:3000/admin`
- **Scraper:** `http://localhost:3000/admin-scraper.html`
- **Outreach:** `http://localhost:3000/admin-outreach.html`

Default admin password: `admin123` (change in production!)

---

## Scaling Tips

1. **Database Indexes:** Already added for fast queries
2. **Rate Limiting:** Add for APIs if scaling to many users
3. **Caching:** Consider Redis for frequent queries
4. **Async Jobs:** Outreach jobs already run in background
5. **Error Handling:** Implement Sentry for error tracking

---

## Troubleshooting

### Scraping Not Working
- Check `ANTHROPIC_API_KEY` is set
- Verify Kleinanzeigen.de access (might be blocked)
- Try manual trigger: `npm run scrape`

### Outreach Not Sending
- Verify Twilio/SendGrid credentials
- Check rate limits (WhatsApp has daily caps)
- View logs in admin dashboard

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Try: `psql $DATABASE_URL` to test

---

## Support

For issues, contact: info@kania-galabau.de

See README.md for architecture overview.
