import cron from 'node-cron';
import Scraper from '../agents/scraper.js';
import ContactGenerator from '../agents/contact-generator.js';
import dotenv from 'dotenv';

dotenv.config();

class DailyScraperJob {
  constructor() {
    this.scraper = new Scraper();
    this.contactGenerator = new ContactGenerator();
    this.isRunning = false;
  }

  // Run the full scraping and contact generation pipeline
  async run() {
    if (this.isRunning) {
      console.log('⚠️  Scraper job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Daily Scraper Job started at ${startTime.toLocaleString()}`);
      console.log('='.repeat(50));

      // Step 1: Scrape new candidates
      console.log('\n📍 Step 1: Scraping platforms for candidates...');
      await this.scraper.runAll();

      // Step 2: Process and generate messages
      console.log('\n📍 Step 2: Processing candidates and generating messages...');
      await this.contactGenerator.processScrapedContacts();

      // Log completion
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;

      console.log('\n' + '='.repeat(50));
      console.log(`✅ Job completed successfully in ${duration.toFixed(2)}s`);
      console.log('='.repeat(50) + '\n');

    } catch (error) {
      console.error('\n❌ Job failed with error:', error);
      console.error('Error details:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // Schedule the job to run daily at 2 AM
  schedule() {
    // Runs every day at 2:00 AM
    const cronExpression = '0 2 * * *';

    cron.schedule(cronExpression, () => {
      console.log('\n⏰ Scheduled scraper job triggered');
      this.run();
    });

    console.log(`✓ Daily scraper job scheduled: ${cronExpression} (2:00 AM every day)`);
  }

  // Manual trigger for testing
  async runNow() {
    await this.run();
  }
}

export default DailyScraperJob;
