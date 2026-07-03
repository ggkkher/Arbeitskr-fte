import express from 'express';
import pool from '../db/connection.js';
import OutreachService from '../services/outreach.js';

const router = express.Router();
const outreachService = new OutreachService();

// GET all outreach logs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ol.*, sc.name, sc.platform FROM outreach_logs ol
       LEFT JOIN scraped_contacts sc ON ol.contact_id = sc.id
       ORDER BY ol.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching outreach logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET outreach statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const sentResult = await pool.query("SELECT COUNT(*) FROM outreach_logs WHERE status = 'sent'");
    const pendingResult = await pool.query("SELECT COUNT(*) FROM outreach_logs WHERE status = 'pending'");
    const failedResult = await pool.query("SELECT COUNT(*) FROM outreach_logs WHERE status = 'failed'");

    const sent = parseInt(sentResult.rows[0].count);
    const pending = parseInt(pendingResult.rows[0].count);
    const failed = parseInt(failedResult.rows[0].count);
    const total = sent + pending + failed;

    res.json({
      sent,
      pending,
      failed,
      total,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET by contact method
router.get('/stats/by-method', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT method, status, COUNT(*) as count
       FROM outreach_logs
       GROUP BY method, status
       ORDER BY method, status`
    );

    const data = {};
    result.rows.forEach(row => {
      if (!data[row.method]) data[row.method] = {};
      data[row.method][row.status] = parseInt(row.count);
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching method stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST process pending outreach
router.post('/process-pending', async (req, res) => {
  // In production, add authentication
  try {
    res.json({ message: 'Processing started in background' });

    // Run in background
    outreachService.processPendingOutreach().catch(error => {
      console.error('Background outreach error:', error);
    });

  } catch (error) {
    console.error('Error processing outreach:', error);
    res.status(500).json({ error: 'Failed to process outreach' });
  }
});

// PUT update outreach log
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const result = await pool.query(
      `UPDATE outreach_logs
       SET status = $1, response = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, response, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// POST schedule follow-up
router.post('/:contactId/schedule-followup', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { delayDays = 3 } = req.body;

    const result = await outreachService.scheduleFollowUp(contactId, delayDays);

    if (result.success) {
      res.json({ message: 'Follow-up scheduled' });
    } else {
      res.status(500).json({ error: result.reason });
    }
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    res.status(500).json({ error: 'Failed to schedule follow-up' });
  }
});

export default router;
