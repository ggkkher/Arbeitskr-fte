import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import candidatesRouter from './api/candidates.js';
import scrapeResultsRouter from './api/scrape-results.js';
import outreachRouter from './api/outreach.js';
import DailyScraperJob from './jobs/daily-scrape.js';
import OutreachProcessor from './jobs/outreach-processor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/candidates', candidatesRouter);
app.use('/api/scrape-results', scrapeResultsRouter);
app.use('/api/outreach', outreachRouter);

// Serve static files (later for React frontend)
app.use(express.static('public'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Registration: http://localhost:${PORT}`);
  console.log(`👨‍💼 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log('\n');

  // Initialize daily scraper job (only if API key is configured)
  if (process.env.ANTHROPIC_API_KEY) {
    const scraperJob = new DailyScraperJob();
    scraperJob.schedule();
    console.log('✓ Daily scraper job scheduled');
  } else {
    console.log('⚠️  ANTHROPIC_API_KEY not set - scraper job disabled');
  }

  // Initialize outreach processor (runs hourly)
  const outreachProcessor = new OutreachProcessor();
  outreachProcessor.schedule();
  console.log('✓ Outreach processor scheduled\n');
});

export default server;
