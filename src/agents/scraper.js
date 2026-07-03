import puppeteer from 'puppeteer';
import pool from '../db/connection.js';

const SCRAPING_CONFIG = {
  kleinanzeigen: {
    baseUrl: 'https://www.kleinanzeigen.de',
    searchPath: '/s-gartenbau-landschaftsbau/k0',
    keywords: ['gärtner', 'garten', 'landschaftsbau', 'terrasse', 'pflasterarbeiten', 'bewässerung'],
    enabled: true,
    maxResults: 20
  },
  facebook: {
    // Note: Facebook requires API access or manual scraping is difficult
    note: 'Requires Facebook Graph API or manual intervention',
    enabled: false
  },
  craigslist: {
    baseUrl: 'https://www.craigslist.org',
    searchPath: '/search/lss',
    keywords: ['gardener', 'landscaping', 'worker'],
    enabled: false,
    maxResults: 20
  }
};

class Scraper {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('✓ Browser initialized');
    } catch (error) {
      console.error('✗ Failed to initialize browser:', error);
      throw error;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Scrape Kleinanzeigen.de
  async scrapeKleinanzeigen() {
    console.log('Scraping Kleinanzeigen.de...');
    const config = SCRAPING_CONFIG.kleinanzeigen;

    if (!config.enabled) {
      console.log('Kleinanzeigen scraping disabled');
      return [];
    }

    const results = [];

    try {
      const page = await this.browser.newPage();

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Add delays to avoid detection
      await page.setDefaultNavigationTimeout(30000);

      for (const keyword of config.keywords) {
        try {
          const searchUrl = `${config.baseUrl}${config.searchPath}?keywords=${encodeURIComponent(keyword)}`;

          console.log(`  Searching for: ${keyword}`);
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

          // Wait a bit to avoid rate limiting
          await page.waitForTimeout(1000 + Math.random() * 2000);

          // Extract listings
          const listings = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-adid]');
            return Array.from(items).slice(0, 10).map(item => {
              const titleEl = item.querySelector('h2 a');
              const priceEl = item.querySelector('.aditem-main--middle--price-shipping--price');
              const urlEl = item.querySelector('a.ellipsis');

              return {
                title: titleEl?.textContent?.trim() || '',
                url: urlEl?.href || '',
                text: item.textContent?.trim() || '',
                price: priceEl?.textContent?.trim() || 'VB'
              };
            });
          });

          results.push(...listings);

        } catch (error) {
          console.error(`  Error searching "${keyword}":`, error.message);
        }
      }

      await page.close();

    } catch (error) {
      console.error('Kleinanzeigen scraping error:', error);
    }

    console.log(`Found ${results.length} listings on Kleinanzeigen`);
    return results;
  }

  // Parse and extract contact info from text
  extractContactInfo(text) {
    const phoneRegex = /(\+?49|0)?[\s\-]?(\d{3,5})[\s\-]?(\d{3,9})[\s\-]?(\d{0,4})/g;
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const nameRegex = /^[A-Z][a-zäöüß\s\-]{2,}/m;

    const phones = [...(text.match(phoneRegex) || [])];
    const emails = [...(text.match(emailRegex) || [])];
    const names = [...(text.match(nameRegex) || [])];

    return {
      phones: [...new Set(phones)],
      emails: [...new Set(emails)],
      names: [...new Set(names)]
    };
  }

  // Save scraped contacts to database
  async saveContacts(platform, listings) {
    let savedCount = 0;

    for (const listing of listings) {
      try {
        const contactInfo = this.extractContactInfo(listing.text);

        // Only save if we found contact info
        if (contactInfo.phones.length === 0 && contactInfo.emails.length === 0) {
          continue;
        }

        await pool.query(
          `INSERT INTO scraped_contacts
           (platform, name, url, contact_info, raw_text, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [
            platform,
            listing.title || 'Unknown',
            listing.url,
            JSON.stringify(contactInfo),
            listing.text
          ]
        );

        savedCount++;

      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }

    console.log(`  Saved ${savedCount} contacts to database`);
    return savedCount;
  }

  // Main scraping orchestration
  async runAll() {
    try {
      await this.initialize();

      console.log('\n🤖 Starting Web Scraper...\n');

      // Kleinanzeigen
      const kleinanzeigenResults = await this.scrapeKleinanzeigen();
      await this.saveContacts('kleinanzeigen', kleinanzeigenResults);

      // Add more platforms here in Phase 2
      // - Facebook Groups (requires manual listing or API)
      // - Craigslist (international)
      // - Google Maps (business listings)

      console.log('\n✓ Scraping completed\n');

    } catch (error) {
      console.error('Scraper error:', error);
    } finally {
      await this.closeBrowser();
    }
  }
}

export default Scraper;
