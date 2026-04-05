import nodemailer from 'nodemailer';
import { getSMTPConfig } from '../config/env';

export interface PriceAlertEmail {
  email: string;
  route: {
    fromCity: string;
    toCity: string;
    travelDate: string;
  };
  price: number;
  threshold: number;
}

const transporter = nodemailer.createTransport({
  host: getSMTPConfig().host,
  port: getSMTPConfig().port,
  secure: getSMTPConfig().secure,
  auth: {
    user: getSMTPConfig().user,
    pass: getSMTPConfig().pass,
  },
});

export async function sendPriceAlert(
  email: string,
  route: { fromCity: string; toCity: string; travelDate: string },
  price: number,
  threshold: number
): Promise<boolean> {
  const subject = `Price Alert: ${route.fromCity} → ${route.toCity}`;
  const html = `
    <h2>Price Alert!</h2>
    <p>The price for your tracked route has dropped below your threshold.</p>
    <table>
      <tr><td><strong>Route:</strong></td><td>${route.fromCity} → ${route.toCity}</td></tr>
      <tr><td><strong>Travel Date:</strong></td><td>${route.travelDate}</td></tr>
      <tr><td><strong>Current Price:</strong></td><td>€${price.toFixed(2)}</td></tr>
      <tr><td><strong>Your Threshold:</strong></td><td>€${threshold.toFixed(2)}</td></tr>
    </table>
    <p>Book now before prices go up!</p>
  `;

  const text = `
Price Alert!

Route: ${route.fromCity} → ${route.toCity}
Travel Date: ${route.travelDate}
Current Price: €${price.toFixed(2)}
Your Threshold: €${threshold.toFixed(2)}

Book now before prices go up!
  `;

  try {
    const info = await transporter.sendMail({
      from: getSMTPConfig().from,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL] Sent price alert to ${email}`, {
      messageId: info.messageId,
      route: `${route.fromCity} → ${route.toCity}`,
      price,
      threshold,
    });

    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send price alert to ${email}:`, error);
    return false;
  }
}

export async function verifySMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[EMAIL] SMTP connection failed:', error);
    return false;
  }
}
