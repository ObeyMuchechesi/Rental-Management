/**
 * Notification engine for Prime Access.
 *
 * When a new inquiry arrives the system tries, in order:
 *   1. WhatsApp alert to the admin  (Twilio or Meta Cloud API, if configured)
 *   2. Email alert to the admin     (SMTP, if configured)
 *   3. Webhook notification         (any external endpoint, if configured)
 *
 * If no provider is configured the alert is recorded as "skipped" and the
 * admin dashboard offers a one-click "Send via WhatsApp" shortcut that opens
 * the inquiry pre-filled in WhatsApp, so no lead is ever lost.
 */
const nodemailer = require('nodemailer');

let transporter = null;
let transporterPromise = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (transporter) return transporter;
  if (transporterPromise) return transporterPromise;

  transporterPromise = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  transporter = transporterPromise;
  return transporter;
}

function formatInquiryForAlert(inquiry) {
  return [
    `NEW INQUIRY ${inquiry.reference}`,
    `Name: ${inquiry.name}`,
    `Phone: ${inquiry.phone}`,
    `Email: ${inquiry.email || '-'}`,
    `Destination: ${inquiry.destination || '-'}`,
    `Service: ${inquiry.service || '-'}`,
    `Message: ${inquiry.message || '-'}`,
    `Received: ${new Date(inquiry.createdAt).toLocaleString()}`,
  ].join('\n');
}

function clientConfirmText(inquiry, settings) {
  const contact = settings ? settings.phoneDisplay || settings.phone || '' : '';
  return [
    `Dear ${inquiry.name},`,
    '',
    `Thank you for contacting ${(settings && settings.brandName) || 'Prime Access'} Immigration Consultancy Firm.`,
    '',
    `We have received your inquiry (Ref: ${inquiry.reference}) regarding ${inquiry.service || 'our services'}.`,
    'Our team will respond to you shortly during business hours.',
    '',
    `To chat with us instantly on WhatsApp, open: https://wa.me/${(settings && settings.whatsappNumber) || ''}`,
    contact ? `Or call us on ${contact}` : '',
    '',
    'Warm regards,',
    `${(settings && settings.brandName) || 'Prime Access'} Immigration Consultancy Firm Team`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendWhatsAppAlert(inquiry) {
  const provider = process.env.WHATSAPP_PROVIDER;
  const adminNumber = process.env.ADMIN_WHATSAPP;
  if (!provider || !adminNumber) {
    return { status: 'skipped', error: 'WhatsApp provider not configured' };
  }

  const to = `whatsapp:+${adminNumber}`;
  const body = formatInquiryForAlert(inquiry);

  try {
    if (provider === 'twilio') {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
        return { status: 'skipped', error: 'Twilio credentials missing' };
      }
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body });
      return { status: 'sent', to };
    }

    if (provider === 'meta') {
      if (!process.env.META_WHATSAPP_TOKEN || !process.env.META_WHATSAPP_PHONE_ID) {
        return { status: 'skipped', error: 'Meta credentials missing' };
      }
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.META_WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: adminNumber,
            type: 'text',
            text: { body },
          }),
        }
      );
      if (!res.ok) {
        const detail = await res.text();
        return { status: 'failed', error: `Meta API ${res.status}: ${detail.slice(0, 200)}` };
      }
      return { status: 'sent', to };
    }

    return { status: 'skipped', error: `Unknown provider "${provider}"` };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

async function sendEmail(to, subject, text) {
  const t = await getTransporter();
  if (!t) return { status: 'skipped', error: 'SMTP not configured' };
  try {
    await t.sendMail({
      from: process.env.CLIENT_CONFIRM_FROM || 'Prime Access <no-reply@primeaccess.co.zw>',
      to,
      subject,
      text,
    });
    return { status: 'sent', to };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

async function sendWebhook(inquiry) {
  const url = process.env.INQUIRY_WEBHOOK_URL;
  if (!url) return { status: 'skipped', error: 'Webhook not configured' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'inquiry.created',
        reference: inquiry.reference,
        name: inquiry.name,
        phone: inquiry.phone,
        email: inquiry.email,
        destination: inquiry.destination,
        service: inquiry.service,
        message: inquiry.message,
        createdAt: inquiry.createdAt,
      }),
    });
    if (!res.ok) return { status: 'failed', error: `Webhook HTTP ${res.status}` };
    return { status: 'sent', to: url };
  } catch (err) {
    return { status: 'failed', error: err.message };
  }
}

/**
 * Fires all configured alerts for a new inquiry and records delivery
 * status on the inquiry document. Never throws - the inquiry is saved
 * regardless so no lead is lost.
 */
async function notifyInquiry(inquiry, settings) {
  const results = [];
  results.push({ channel: 'whatsapp', ...(await sendWhatsAppAlert(inquiry)) });
  results.push({
    channel: 'email',
    ...(await sendEmail(process.env.ALERT_EMAIL, `New inquiry ${inquiry.reference}`, formatInquiryForAlert(inquiry))),
  });
  results.push({ channel: 'webhook', ...(await sendWebhook(inquiry)) });

  inquiry.notifications = results.map((r) => ({
    channel: r.channel,
    to: r.to,
    status: r.status,
    error: r.error,
    at: new Date(),
  }));

  // Client confirmation email
  const clientResult = await sendEmail(
    inquiry.email,
    `We received your inquiry (Ref: ${inquiry.reference}) - ${settings?.brandName || 'Prime Access'}`,
    clientConfirmText(inquiry, settings)
  );
  inquiry.clientConfirmationSent = clientResult.status === 'sent';

  await inquiry.save();
  console.log(
    `[notify] inquiry ${inquiry.reference}: ` +
      inquiry.notifications.map((n) => `${n.channel}=${n.status}`).join(', ')
  );
}

module.exports = { notifyInquiry, formatInquiryForAlert };