// server/services/notificationService.js
import prisma from '../lib/prisma.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Configure SMTP Transporter with fallbacks
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

export async function sendEmail({ to, subject, text, html, priority = 'normal' }) {
  if (!to || !process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your_email@gmail.com') {
    return null;
  }

  const isHighPriority = priority === 'high' || subject.toLowerCase().includes('otp') || subject.toLowerCase().includes('password');

  return transporter.sendMail({
    from: `"KCET OD Portal" <${process.env.SMTP_USER}>`,
    to,
    replyTo: process.env.SMTP_USER,
    subject,
    text,
    html,
    priority: isHighPriority ? 'high' : 'normal',
    headers: {
      'X-Priority': isHighPriority ? '1' : '3',
      'X-MSMail-Priority': isHighPriority ? 'High' : 'Normal',
      'Importance': isHighPriority ? 'High' : 'Normal',
      'Precedence': 'bulk'
    }
  });
}

/**
 * Creates a system notification and attempts to trigger email alerts.
 * @param {string} userId - Recipient User ID
 * @param {string} odId - OD Request ID
 * @param {string} message - Notification text
 * @param {string} [emailTo] - Optional recipient email address
 * @param {string} [emailSubject] - Optional email subject
 */
export async function createNotification({ userId, odId, message, emailTo, emailSubject }) {
  try {
    // 1. Create DB Notification
    const notif = await prisma.notification.create({
      data: {
        userId,
        odId,
        message,
        isRead: false
      }
    });

    console.log(`[Notification Saved in DB] User: ${userId} | Message: ${message}`);

    // 2. Email Dispatcher (Runs asynchronously, doesn't block thread)
    if (emailTo) {
      try {
        const info = await sendEmail({
          to: emailTo,
          subject: emailSubject || 'OD Status Update',
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1E293B; background-color: #F8FAFC; border-radius: 8px;">
              <h2 style="color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">Kamaraj College of Engineering and Technology</h2>
              <p style="font-size: 16px; font-weight: bold; color: #0F172A;">OD Portal Update</p>
              <p style="font-size: 14px; line-height: 1.5; color: #475569;">${message}</p>
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94A3B8; text-align: center;">This is an automated system email. Please do not reply.</p>
            </div>
          `
        });

        if (info) {
          console.log(`[Mail Sent] Message Sent to ${emailTo}: ${info.messageId}`);
        }
      } catch (error) {
        console.warn('[Mail Service Warning] Email failed to send:', error.message);
      }
    } else {
      console.log(`[Notification Log (Email Disabled)] To: ${emailTo || 'No Email Provided'} | Subject: ${emailSubject || 'OD Update'} | Message: ${message}`);
    }

    return notif;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
