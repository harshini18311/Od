// server/services/qrService.js
import QRCode from 'qrcode';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Generates a Base64 QR Code string linking to the public verification URL.
 * @param {string} odCode - The unique identifier of the OD Request (e.g., OD-2026-CSE-0001)
 * @returns {Promise<string>} Base64 Data URL
 */
export async function generateVerificationQR(odCode) {
  try {
    const verificationUrl = `${CLIENT_URL}/verify/${odCode}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#0F172A',  // Navy
        light: '#FFFFFF'  // White
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    throw new Error('QR Code generation failed');
  }
}
