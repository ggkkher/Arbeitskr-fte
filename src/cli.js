#!/usr/bin/env node

import dotenv from 'dotenv';
import Scraper from './agents/scraper.js';
import ContactGenerator from './agents/contact-generator.js';

dotenv.config();

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'scrape': {
        console.log('Starting scraper...\n');
        const scraper = new Scraper();
        await scraper.runAll();
        break;
      }

      case 'generate-messages': {
        console.log('Starting contact message generation...\n');
        const generator = new ContactGenerator();
        await generator.processScrapedContacts();
        break;
      }

      case 'full': {
        console.log('Running full pipeline: scrape + generate messages\n');
        const scraper = new Scraper();
        const generator = new ContactGenerator();
        await scraper.runAll();
        await generator.processScrapedContacts();
        break;
      }

      default:
        console.log(`
Usage: node src/cli.js <command>

Commands:
  scrape                 - Scrape Kleinanzeigen for candidates
  generate-messages      - Generate recruitment messages for uncontacted candidates
  full                   - Run full pipeline (scrape + generate messages)

Examples:
  npm run scrape
  npm run generate-messages
  npm run full

Requirements:
  - Set ANTHROPIC_API_KEY environment variable for message generation
  - Database must be initialized with 'npm run db:init'
        `);
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
