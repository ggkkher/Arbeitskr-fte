import Anthropic from '@anthropic-ai/sdk';
import pool from '../db/connection.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

class ContactGenerator {
  constructor() {
    this.model = 'claude-3-5-sonnet-20241022';
  }

  // Check if contact is relevant for landscaping/gardening work
  async isRelevantCandidate(text) {
    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Ist diese Person wahrscheinlich qualifiziert für Garten- und Landschaftsbauarbeiten? Antworte nur mit "ja" oder "nein".

Text: "${text.substring(0, 500)}"`
          }
        ]
      });

      const answer = response.content[0].text.toLowerCase().trim();
      return answer.includes('ja') || answer.includes('yes');

    } catch (error) {
      console.error('Error checking relevance:', error);
      return false;
    }
  }

  // Generate personalized recruitment message in target language
  async generateContactMessage(candidate, language = 'de') {
    try {
      const languageMap = {
        de: 'Deutsch',
        en: 'Englisch',
        pl: 'Polnisch',
        cs: 'Tschechisch'
      };

      const targetLanguage = languageMap[language] || 'Deutsch';

      const prompt = `Du bist ein erfahrener Recruiter für ein professionelles Garten- und Landschaftsbauunternehmen.

Generiere eine kurze, professionelle und freundliche Kontaktnachricht, um diese potenzielle Arbeitskraft zu rekrutieren.

Kandidaten-Info:
- Name: ${candidate.name || 'Friend'}
- Erfahrung: ${candidate.experience || 'Unknown'}
- Region: ${candidate.region || 'Not specified'}

Anforderungen:
- Sprache: ${targetLanguage}
- Max. 100 Wörter
- Persönlich und authentisch
- Erwähne konkrete Möglichkeiten (Terrassen, Kantensteine, Pflasterarbeiten, etc.)
- Inklusive Link zum Bewerbungsformular: https://kania-galabau.de

Gib nur die Nachricht zurück, keine zusätzlichen Kommentare.`;

      const response = await client.messages.create({
        model: this.model,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text.trim();

    } catch (error) {
      console.error('Error generating message:', error);
      return null;
    }
  }

  // Process scraped contacts and generate messages
  async processScrapedContacts() {
    try {
      console.log('\n📧 Processing scraped contacts...\n');

      // Get unprocessed contacts
      const result = await pool.query(
        `SELECT * FROM scraped_contacts
         WHERE contacted_at IS NULL
         LIMIT 10`
      );

      const contacts = result.rows;
      console.log(`Found ${contacts.length} unprocessed contacts`);

      let processed = 0;

      for (const contact of contacts) {
        try {
          // Check if contact is relevant
          const isRelevant = await this.isRelevantCandidate(contact.raw_text);

          if (!isRelevant) {
            console.log(`  ⊘ Skipped "${contact.name}" - not relevant`);
            continue;
          }

          // Determine language based on country code or default to German
          const language = this.getLanguageFromContact(contact);

          // Generate message
          const message = await this.generateContactMessage(contact, language);

          if (message) {
            // Save message and mark as contacted
            await pool.query(
              `UPDATE scraped_contacts
               SET contacted_at = NOW()
               WHERE id = $1`,
              [contact.id]
            );

            // Log the outreach
            await pool.query(
              `INSERT INTO outreach_logs (contact_id, method, message, status, sent_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [contact.id, 'email', message, 'pending']
            );

            console.log(`  ✓ Prepared message for "${contact.name}"`);
            processed++;
          }

        } catch (error) {
          console.error(`  ✗ Error processing contact "${contact.name}":`, error.message);
        }

        // Rate limiting - wait between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`\n✓ Processed ${processed} contacts\n`);

    } catch (error) {
      console.error('Error processing contacts:', error);
    }
  }

  // Detect language from contact info
  getLanguageFromContact(contact) {
    // This is a simple heuristic - in real use, you'd detect from phone numbers, keywords, etc.
    const contactInfo = contact.contact_info || {};
    const text = (contact.raw_text || '').toLowerCase();

    if (text.includes('polski') || text.includes('polska')) return 'pl';
    if (text.includes('česk') || text.includes('čeština')) return 'cs';
    if (text.includes('english') || text.includes('english speaker')) return 'en';

    return 'de'; // Default to German
  }

  // Extract key skills from text
  async extractSkills(text) {
    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Extrahiere die Hauptfähigkeiten aus diesem Text für Garten-/Landschaftsbauarbeiten.
            Antworte als komma-separierte Liste (max 10 Wörter).

            Text: "${text.substring(0, 300)}"`
          }
        ]
      });

      return response.content[0].text.trim().split(',').map(s => s.trim());

    } catch (error) {
      console.error('Error extracting skills:', error);
      return [];
    }
  }
}

export default ContactGenerator;
