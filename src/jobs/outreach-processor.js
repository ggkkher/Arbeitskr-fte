import cron from 'node-cron';
import OutreachService from '../services/outreach.js';
import dotenv from 'dotenv';

dotenv.config();

class OutreachProcessor {
  constructor() {
    this.outreachService = new OutreachService();
    this.isRunning = false;
  }

  // Run outreach processing
  async run() {
    if (this.isRunning) {
      console.log('⚠️  Outreach processor already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Outreach Processor started at ${startTime.toLocaleString()}`);
      console.log('='.repeat(50));

      await this.outreachService.processPendingOutreach();

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;

      console.log('\n' + '='.repeat(50));
      console.log(`✅ Processor completed in ${duration.toFixed(2)}s`);
      console.log('='.repeat(50) + '\n');

    } catch (error) {
      console.error('\n❌ Processor failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  // Schedule to run every hour
  schedule() {
    const cronExpression = '0 * * * *'; // Every hour

    cron.schedule(cronExpression, () => {
      console.log('\n⏰ Scheduled outreach processor triggered');
      this.run();
    });

    console.log(`✓ Outreach processor scheduled: ${cronExpression} (hourly)`);
  }

  // Manual trigger
  async runNow() {
    await this.run();
  }
}

export default OutreachProcessor;
