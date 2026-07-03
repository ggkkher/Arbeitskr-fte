import express from 'express';
import pool from '../db/connection.js';
import Scraper from '../agents/scraper.js';
import ContactGenerator from '../agents/contact-generator.js';

const router = express.Router();

// GET all scraped contacts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scraped_contacts ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scraped contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET statistics about scraping
router.get('/stats/overview', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM scraped_contacts');
    const platformResult = await pool.query(
      'SELECT platform, COUNT(*) as count FROM scraped_contacts GROUP BY platform'
    );
    const contactedResult = await pool.query(
      'SELECT COUNT(*) FROM scraped_contacts WHERE contacted_at IS NOT NULL'
    );

    res.json({
      total: parseInt(totalResult.rows[0].count),
      contacted: parseInt(contactedResult.rows[0].count),
      byPlatform: platformResult.rows.map(row => ({
        platform: row.platform,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST trigger manual scraping
router.post('/trigger-scrape', async (req, res) => {
  // In production, add authentication here
  try {
    res.json({ message: 'Scraping started in background' });

    // Run in background
    const scraper = new Scraper();
    scraper.runAll().catch(error => {
      console.error('Background scraping error:', error);
    });

  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({ error: 'Failed to trigger scrape' });
  }
});

// POST trigger contact generation
router.post('/trigger-contact-generation', async (req, res) => {
  // In production, add authentication here
  try {
    res.json({ message: 'Contact generation started in background' });

    // Run in background
    const generator = new ContactGenerator();
    generator.processScrapedContacts().catch(error => {
      console.error('Background contact generation error:', error);
    });

  } catch (error) {
    console.error('Error triggering contact generation:', error);
    res.status(500).json({ error: 'Failed to trigger contact generation' });
  }
});

// GET single scraped contact
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM scraped_contacts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// PUT update contact status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { response_status, response } = req.body;

    const result = await pool.query(
      `UPDATE scraped_contacts
       SET response_status = $1, response = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [response_status, response, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE scraped contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM scraped_contacts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
