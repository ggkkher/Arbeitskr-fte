import pool from '../db/connection.js';
import dotenv from 'dotenv';

dotenv.config();

class OutreachService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Get all pending outreach tasks
  async getPendingOutreach() {
    try {
      const result = await pool.query(
        `SELECT ol.*, sc.contact_info, sc.name, sc.platform
         FROM outreach_logs ol
         JOIN scraped_contacts sc ON ol.contact_id = sc.id
         WHERE ol.status = 'pending'
         LIMIT 20`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting pending outreach:', error);
      return [];
    }
  }

  // Get preferred contact method for a candidate
  getPreferredContactMethod(contactInfo) {
    // Priority: WhatsApp > Phone > Email
    if (contactInfo.phones && contactInfo.phones.length > 0) {
      return 'whatsapp'; // Use WhatsApp if phone available
    }
    if (contactInfo.emails && contactInfo.emails.length > 0) {
      return 'email';
    }
    return 'sms'; // Fallback
  }

  // Send WhatsApp message via Twilio
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID) {
        console.log('⚠️  Twilio not configured, skipping WhatsApp message');
        return { success: false, reason: 'Twilio not configured' };
      }

      // In production, use Twilio SDK
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // const response = await client.messages.create({
      //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      //   to: `whatsapp:${phoneNumber}`,
      //   body: message
      // });

      console.log(`📱 [Mock] WhatsApp message queued to ${phoneNumber}`);
      return { success: true, messageId: 'mock_' + Date.now() };

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, reason: error.message };
    }
  }

  // Send SMS via Twilio
  async sendSMS(phoneNumber, message) {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID) {
        console.log('⚠️  Twilio not configured, skipping SMS');
        return { success: false, reason: 'Twilio not configured' };
      }

      // In production:
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // const response = await client.messages.create({
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber,
      //   body: message
      // });

      console.log(`📧 [Mock] SMS queued to ${phoneNumber}`);
      return { success: true, messageId: 'mock_' + Date.now() };

    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, reason: error.message };
    }
  }

  // Send Email via SendGrid
  async sendEmail(email, subject, message) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️  SendGrid not configured, skipping email');
        return { success: false, reason: 'SendGrid not configured' };
      }

      // In production:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // const msg = {
      //   to: email,
      //   from: process.env.SENDGRID_FROM_EMAIL,
      //   subject: subject,
      //   html: message
      // };
      // await sgMail.send(msg);

      console.log(`💌 [Mock] Email queued to ${email}`);
      return { success: true, messageId: 'mock_' + Date.now() };

    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, reason: error.message };
    }
  }

  // Send outreach message via preferred channel
  async sendOutreach(outreachId, method, phoneOrEmail, message) {
    try {
      let result;

      if (method === 'whatsapp') {
        result = await this.sendWhatsAppMessage(phoneOrEmail, message);
      } else if (method === 'sms') {
        result = await this.sendSMS(phoneOrEmail, message);
      } else if (method === 'email') {
        result = await this.sendEmail(
          phoneOrEmail,
          '🌱 Garten- und Landschaftsbau Opportunity',
          message
        );
      }

      // Update log with result
      const newStatus = result.success ? 'sent' : 'failed';
      await pool.query(
        `UPDATE outreach_logs
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [newStatus, outreachId]
      );

      return result;

    } catch (error) {
      console.error('Error sending outreach:', error);
      return { success: false, reason: error.message };
    }
  }

  // Process all pending outreach
  async processPendingOutreach() {
    try {
      const pending = await this.getPendingOutreach();
      console.log(`\n📬 Processing ${pending.length} pending outreach messages\n`);

      let sent = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          const contactInfo = item.contact_info || {};
          const method = this.getPreferredContactMethod(contactInfo);

          let contact;
          if (method === 'whatsapp' || method === 'sms') {
            contact = contactInfo.phones?.[0];
          } else {
            contact = contactInfo.emails?.[0];
          }

          if (!contact) {
            console.log(`  ⊘ Skipped ${item.name} - no contact info`);
            failed++;
            continue;
          }

          const result = await this.sendOutreach(
            item.id,
            method,
            contact,
            item.message
          );

          if (result.success) {
            console.log(`  ✓ Sent to ${item.name} via ${method}`);
            sent++;
          } else {
            console.log(`  ✗ Failed to send to ${item.name}: ${result.reason}`);
            failed++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`  ✗ Error with ${item.name}:`, error.message);
          failed++;
        }
      }

      console.log(`\n✓ Outreach complete: ${sent} sent, ${failed} failed\n`);

    } catch (error) {
      console.error('Error processing pending outreach:', error);
    }
  }

  // Schedule follow-up for non-responders
  async scheduleFollowUp(contactId, delayDays = 3) {
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + delayDays);

      const result = await pool.query(
        `INSERT INTO outreach_logs (contact_id, method, status, sent_at)
         VALUES ($1, 'follow_up', 'scheduled', $2)`,
        [contactId, followUpDate]
      );

      return { success: true };
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return { success: false, reason: error.message };
    }
  }
}

export default OutreachService;
