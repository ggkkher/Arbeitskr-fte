import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// GET all candidates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM candidates ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET single candidate
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// POST new candidate (registration)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, experience, skill_level, region, availability, language } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = await pool.query(
      'INSERT INTO candidates (name, email, phone, experience, skill_level, region, availability, language, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, email, phone, experience, skill_level, region, availability, language, 'registration']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// PUT update candidate
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, experience, skill_level, region, availability, language } = req.body;

    const result = await pool.query(
      'UPDATE candidates SET name = $1, email = $2, phone = $3, experience = $4, skill_level = $5, region = $6, availability = $7, language = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
      [name, email, phone, experience, skill_level, region, availability, language, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// DELETE candidate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM candidates WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// POST export candidates to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC');
    const candidates = result.rows;

    if (candidates.length === 0) {
      return res.json({ message: 'No candidates to export' });
    }

    // Build CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Experience', 'Skill Level', 'Region', 'Availability', 'Language', 'Source', 'Created At'];
    const rows = candidates.map(c => [
      c.id,
      c.name,
      c.email || '',
      c.phone || '',
      c.experience || '',
      c.skill_level || '',
      c.region || '',
      c.availability || '',
      c.language || '',
      c.source || '',
      c.created_at
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting candidates:', error);
    res.status(500).json({ error: 'Failed to export candidates' });
  }
});

export default router;
