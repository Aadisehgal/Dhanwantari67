import "server-only";
import nodemailer from "nodemailer";

export interface NotificationPayload {
  to: string;
  subject: string;
  message: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}

/** Free SMTP provider (Gmail app-password / Resend free tier / any SMTP). */
class SmtpProvider implements NotificationProvider {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async send({ to, subject, message }: NotificationPayload) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: message,
    });
  }
}

/** Zero-config fallback — logs to console. Always works, no setup required. */
class ConsoleProvider implements NotificationProvider {
  async send({ to, subject, message }: NotificationPayload) {
    console.log(`[NOTIFY] to=${to} subject="${subject}" message="${message}"`);
  }
}

/**
 * Future paid providers (Twilio SMS, WhatsApp Business API, etc.) implement
 * NotificationProvider and get swapped in here — no changes needed at call
 * sites elsewhere in the app.
 */
function resolveProvider(): NotificationProvider {
  switch (process.env.NOTIFICATION_PROVIDER) {
    case "email":
      return new SmtpProvider();
    case "console":
    default:
      return new ConsoleProvider();
  }
}

export const notificationProvider = resolveProvider();
