import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY') ?? '';
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = config.get<string>('EMAIL_FROM') ?? 'ATLAS Payments <noreply@atlaspay.io>';
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3001';

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged only');
    }
  }

  private async send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    if (!this.resend) {
      this.logger.log(`[EMAIL PREVIEW] To: ${opts.to} | Subject: ${opts.subject}`);
      this.logger.log(`[EMAIL TEXT] ${opts.text}`);
      return { id: 'local-preview' };
    }
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      this.logger.log(`Email sent: id=${result.data?.id} to=${opts.to}`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
      // Never throw — email failures should not break the request
    }
  }

  // ── Templates ────────────────────────────────────────────

  async sendPasswordReset(opts: { to: string; name: string; token: string }) {
    const link = `${this.appUrl}/reset-password?token=${opts.token}`;
    return this.send({
      to: opts.to,
      subject: 'Reset your ATLAS password',
      text: `Hi ${opts.name},\n\nClick the link below to reset your password (expires in 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.\n\nThe ATLAS Team`,
      html: emailTemplate({
        title: 'Reset Your Password',
        preheader: 'Click to reset your ATLAS account password.',
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hi ${opts.name},</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            We received a request to reset your password. Click the button below to set a new password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${link}" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px">
            Reset Password
          </a>
          <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6">
            If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
        `,
      }),
    });
  }

  async sendTeamInvite(opts: {
    to: string;
    inviteeName: string;
    merchantName: string;
    role: string;
    inviterName: string;
    token?: string;
  }) {
    const link = opts.token
      ? `${this.appUrl}/accept-invite?token=${opts.token}`
      : `${this.appUrl}/login`;
    const roleFriendly = opts.role.charAt(0) + opts.role.slice(1).toLowerCase();

    return this.send({
      to: opts.to,
      subject: `You've been invited to ${opts.merchantName} on ATLAS`,
      text: `Hi ${opts.inviteeName},\n\n${opts.inviterName} has invited you to join ${opts.merchantName} on ATLAS as a ${roleFriendly}.\n\nAccept your invitation: ${link}\n\nThe ATLAS Team`,
      html: emailTemplate({
        title: `Join ${opts.merchantName} on ATLAS`,
        preheader: `${opts.inviterName} has invited you to collaborate.`,
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hi ${opts.inviteeName || 'there'},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            <strong>${opts.inviterName}</strong> has invited you to join <strong>${opts.merchantName}</strong> on ATLAS as a <strong>${roleFriendly}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            ATLAS is a payment infrastructure platform that helps African businesses collect and send payments at scale.
          </p>
          <a href="${link}" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px">
            Accept Invitation
          </a>
          <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6">
            This invitation was sent by ${opts.inviterName}. If you weren't expecting this, you can safely ignore it.
          </p>
        `,
      }),
    });
  }

  async sendPaymentConfirmation(opts: {
    to: string;
    customerName: string;
    amount: number;
    currency: string;
    reference: string;
    merchantName: string;
    pageName: string;
  }) {
    const formatted = new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: opts.currency,
      minimumFractionDigits: 2,
    }).format(opts.amount / 100);

    return this.send({
      to: opts.to,
      subject: `Payment receipt — ${formatted} to ${opts.merchantName}`,
      text: `Hi ${opts.customerName},\n\nYour payment of ${formatted} to ${opts.merchantName} was successful.\n\nReference: ${opts.reference}\n\nThank you!\nThe ATLAS Team`,
      html: emailTemplate({
        title: 'Payment Confirmed',
        preheader: `Your payment of ${formatted} to ${opts.merchantName} was successful.`,
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hi ${opts.customerName || 'there'},</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
            Your payment to <strong>${opts.merchantName}</strong> was successful.
          </p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Amount</td><td style="text-align:right;font-weight:700;font-size:20px;color:#111827">${formatted}</td></tr>
              <tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Merchant</td><td style="text-align:right;color:#374151;font-size:14px">${opts.merchantName}</td></tr>
              <tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Description</td><td style="text-align:right;color:#374151;font-size:14px">${opts.pageName}</td></tr>
              <tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Reference</td><td style="text-align:right;color:#374151;font-size:13px;font-family:monospace">${opts.reference}</td></tr>
            </table>
          </div>
          <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6">
            Keep this reference number for your records. If you have any questions, contact ${opts.merchantName} directly.
          </p>
        `,
      }),
    });
  }

  async sendWelcome(opts: { to: string; name: string }) {
    return this.send({
      to: opts.to,
      subject: 'Welcome to ATLAS 🎉',
      text: `Hi ${opts.name},\n\nWelcome to ATLAS — your pan-African payment infrastructure.\n\nLog in to get started: ${this.appUrl}/login\n\nThe ATLAS Team`,
      html: emailTemplate({
        title: 'Welcome to ATLAS 🎉',
        preheader: 'Your account is ready. Start accepting payments today.',
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hi ${opts.name},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
            Welcome to <strong>ATLAS</strong> — pan-African payment infrastructure. Your account is ready.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">Here's how to get started:</p>
          <ol style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:2">
            <li>Create your first API key in Settings</li>
            <li>Make a test payment using your test key</li>
            <li>Add a webhook endpoint to receive real-time events</li>
            <li>Go Live when you're ready</li>
          </ol>
          <a href="${this.appUrl}/dashboard" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px">
            Open Dashboard
          </a>
        `,
      }),
    });
  }
}

// ── Shared HTML template ─────────────────────────────────
function emailTemplate(opts: { title: string; preheader: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Inter',system-ui,sans-serif">
  <span style="display:none;max-height:0;overflow:hidden">${opts.preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;min-height:100vh">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center">
              <div style="display:inline-flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;background:#2563EB;border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
                <span style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px">ATLAS</span>
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;padding:40px 36px;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px">${opts.title}</h1>
              ${opts.body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center">
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6">
                © ${new Date().getFullYear()} ATLAS Payments · All rights reserved<br>
                <a href="#" style="color:#9CA3AF">Unsubscribe</a> · <a href="#" style="color:#9CA3AF">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
