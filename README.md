# Kania Galabau - Workforce Recruitment Platform

**Kostenlose KI-gesteuerte Arbeitskräfte-Recruitment-Lösung für Garten- und Landschaftsbau**

## 🎯 Überblick

Diese Plattform hilft Garten- und Landschaftsbau-Unternehmen, schnell und kostenlos qualifizierte Arbeitskräfte zu finden und zu managen.

**Features:**
- ✅ **Mehrsprachiges Bewerbungsportal** (Deutsch, Englisch, Polnisch, Tschechisch)
- ✅ **Admin-Dashboard** zur Verwaltung von Bewerbern
- ✅ **CSV-Export** für direkte Kontaktaufnahme
- 🔄 **KI-Agenten** für automatische Kandidatensuche (Phase 2)
- 📱 **WhatsApp/SMS Outreach** (Phase 3)

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Database Setup

Erstelle eine PostgreSQL-Datenbank:

```bash
createdb kania_workforce
```

Initialisiere das Schema:

```bash
npm run db:init
```

### 3. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Server starten

```bash
npm run dev
```

Server läuft auf `http://localhost:3000`

**URLs:**
- **Bewerbungsformular:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin (Passwort: `admin123`)
- **API:** http://localhost:3000/api/candidates

## 📋 API Endpoints

### Candidates

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| GET | `/api/candidates` | Alle Bewerbungen abrufen |
| GET | `/api/candidates/:id` | Einzelne Bewerbung |
| POST | `/api/candidates` | Neue Bewerbung erstellen |
| PUT | `/api/candidates/:id` | Bewerbung aktualisieren |
| DELETE | `/api/candidates/:id` | Bewerbung löschen |
| GET | `/api/candidates/export/csv` | Als CSV exportieren |

## 🗄️ Datenbank Schema

### candidates
```sql
- id (PK)
- name
- email
- phone
- experience
- skill_level
- region
- availability
- language
- source ('registration' oder 'scraped')
- created_at, updated_at
```

### scraped_contacts
```sql
- id (PK)
- name
- url
- platform ('kleinanzeigen', 'facebook', etc.)
- contact_info (JSON)
- contacted_at
- response_status
- created_at, updated_at
```

## 🎨 Frontend

### Bewerbungsformular (`/public/index.html`)
- Mehrsprachige UI (Deutsch, Englisch, Polnisch, Tschechisch)
- Felder: Name, Telefon, Email, Erfahrung, Region, Verfügbarkeit, Sprachniveau
- Automatische Validierung und Fehlerbehandlung

### Admin Dashboard (`/public/admin.html`)
- Login mit Password
- Übersicht über Bewerbungen
- Statistiken (Gesamt, diese Woche, Level-Filter, etc.)
- Suche & Filter
- CSV-Export
- Löschen von Bewerbungen

**Admin Login:**
- Passwort: `admin123` (in Produktion ändern!)

## 🔐 Sicherheit

- [ ] Passwords hashen (bcrypt)
- [ ] Environment variables für sensible Daten
- [ ] HTTPS in Produktion
- [ ] Admin-Passwort ändern
- [ ] Rate limiting für API
- [ ] CORS konfigurieren

## 📱 Deployment

### Option 1: Railway.app

```bash
# 1. Create account auf railway.app
# 2. Connect GitHub repo
# 3. Add PostgreSQL Plugin
# 4. Set environment variables
# 5. Deploy
```

### Option 2: Render.com

```bash
# Ähnlich wie Railway
# Free tier available
```

## 🔄 Phase 2: KI-Agenten (TODO)

- Scraper für Kleinanzeigen, Facebook Groups, Craigslist
- Claude API für Kandidaten-Bewertung
- Automatische Contact-Message-Generierung
- Scheduled Jobs mit node-cron

## 📞 Phase 3: Kontakt-Automatisierung (TODO)

- WhatsApp Business API Integration
- Twilio Voice für Telefon-Anrufe
- Email Templates mit SendGrid
- Auto-Follow-up Sequenzen
- Analytics Dashboard

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Frontend:** HTML/CSS/JavaScript (VanillaJS)
- **KI:** Claude API (Anthropic)
- **Scraping:** Puppeteer (Phase 2)
- **Hosting:** Railway/Render (free tier)

## 📝 Lizenz

MIT

## 👨‍💼 Support

Kontakt: info@kania-galabau.de
