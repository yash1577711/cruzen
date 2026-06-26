const nodemailer = require('nodemailer');

// ── Transport factory ────────────────────────────────────────────────────────
const createTransport = () => {
  if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      pool: true,           // Keep SMTP connections alive — much faster after first send
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS &&
      !process.env.SMTP_PASS.includes('your_smtp')) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }
  return null;
};

let _transport = null;
let _isTest = false;
let _testAccount = null;

const getTransport = async () => {
  if (_transport) return { t: _transport, isTest: _isTest };
  const real = createTransport();
  if (real) {
    _transport = real;
    _isTest = false;
    return { t: _transport, isTest: false };
  }
  // Fallback: Ethereal test account (dev only)
  _testAccount = await nodemailer.createTestAccount();
  _transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: _testAccount.user, pass: _testAccount.pass },
  });
  _isTest = true;
  return { t: _transport, isTest: true };
};

const getFrom = () => {
  const addr = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@cruzendigital.com';
  return `"Cruzen Digital" <${addr}>`;
};

// ── Core send ─────────────────────────────────────────────────────────────────
// Throws on failure — callers decide whether to await or fire-and-forget.
const send = async (to, subject, html, textContent) => {
  const { t, isTest } = await getTransport();
  let info;
  try {
    info = await t.sendMail({
      from: getFrom(),
      replyTo: `"Cruzen Digital Support" <support@cruzendigital.com>`,
      to,
      subject,
      html,
      text: textContent || subject,   // Plain-text fallback — reduces spam score
      headers: {
        'X-Mailer': 'Cruzen Digital Mailer v2',
        'X-Priority': '1 (Highest)',
        'Importance': 'high',
      },
    });
  } catch (err) {
    // Reset cached transport so next call gets a fresh connection
    _transport = null;
    console.error(`📧 Email FAILED [${to}] "${subject}": ${err.message}`);
    throw err;
  }
  if (isTest) {
    console.log(`\n📧 ─ Ethereal preview ─────────────────────`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`───────────────────────────────────────────\n`);
  } else {
    console.log(`📧 Email sent → ${to}: ${subject}`);
  }
  return info;
};

// ── Shared layout ─────────────────────────────────────────────────────────────
const layout = (headerBg, headerContent, body) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${headerBg};padding:36px 40px;text-align:center;">
      ${headerContent}
    </div>
    <div style="padding:36px 40px;">
      ${body}
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:0.78rem;margin:0;">
        © 2026 Cruzen Digital &middot; New Delhi, India &middot;
        <a href="mailto:support@cruzendigital.com" style="color:#00B4CC;text-decoration:none;">support@cruzendigital.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ── OTP Email ─────────────────────────────────────────────────────────────────
exports.sendOTPEmail = async (to, otp, purpose = 'verify') => {
  const titles = {
    signup: 'Verify Your Email',
    login:  'Your Login OTP',
    '2fa':  'Two-Factor Authentication Code',
    verify: 'Verification Code',
    reset:  'Reset Your Password',
  };
  const title = titles[purpose] || 'Your OTP Code';

  const html = layout(
    'linear-gradient(135deg,#1dbf73,#00B4CC)',
    `<h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">CruzenDigital</h1>
     <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.9rem;">${title}</p>`,
    `<h2 style="color:#022B50;font-size:1.2rem;font-weight:700;margin:0 0 10px;">${title}</h2>
     <p style="color:#64748b;margin:0 0 24px;font-size:0.95rem;">Use the code below to complete your action. This code expires in <strong>10 minutes</strong>.</p>
     <div style="background:#f8fafc;border:2px dashed #00B4CC;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
       <span style="font-size:2.8rem;font-weight:900;color:#022B50;letter-spacing:10px;font-family:monospace;">${otp}</span>
     </div>
     <p style="color:#64748b;font-size:0.88rem;margin:0 0 8px;">If you didn't request this code, you can safely ignore this email.</p>
     <p style="color:#94a3b8;font-size:0.82rem;margin:0;">For security, never share this code with anyone — including Cruzen Digital staff.</p>`
  );

  await send(
    to,
    `${otp} is your Cruzen Digital verification code`,
    html,
    `Your ${title} for Cruzen Digital is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`
  );
};

// ── Welcome Email ─────────────────────────────────────────────────────────────
exports.sendWelcomeEmail = async (to, name) => {
  const html = layout(
    'linear-gradient(135deg,#022B50,#0f3d6c)',
    `<h1 style="color:#fff;font-size:1.7rem;font-weight:800;margin:0 0 6px;">Welcome, ${name}!</h1>
     <p style="color:rgba(255,255,255,0.75);margin:0;font-size:0.9rem;">You're now part of the Cruzen Digital family.</p>`,
    `<p style="color:#334155;font-size:0.97rem;line-height:1.7;margin:0 0 24px;">
       We're thrilled to have you on board. Cruzen Digital helps e-commerce brands scale with expert Amazon management, performance marketing, and conversion-focused web solutions.
     </p>
     <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);border-radius:12px;padding:22px 26px;margin:0 0 24px;">
       <h3 style="color:#fff;margin:0 0 12px;font-size:0.95rem;font-weight:700;">What's next?</h3>
       <ul style="color:rgba(255,255,255,0.92);margin:0;padding-left:20px;line-height:2.1;font-size:0.9rem;">
         <li>Browse our services and find the right plan</li>
         <li>Book a free consultation with our experts</li>
         <li>Track your projects in real-time from your dashboard</li>
       </ul>
     </div>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'https://cruzendigital.us.cc'}/services"
          style="display:inline-block;background:linear-gradient(135deg,#1dbf73,#00B4CC);color:#fff;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">
         Explore Services →
       </a>
     </div>`
  );
  await send(
    to,
    `Welcome to Cruzen Digital, ${name}!`,
    html,
    `Hi ${name},\n\nWelcome to Cruzen Digital! We're excited to have you on board.\n\nExplore our services at ${process.env.FRONTEND_URL || 'https://cruzendigital.us.cc'}/services\n\n– The Cruzen Digital Team`
  );
};

// ── Order Confirmation ────────────────────────────────────────────────────────
exports.sendOrderConfirmationEmail = async (to, name, service, notes) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@cruzendigital.com';

  const userHtml = layout(
    'linear-gradient(135deg,#1dbf73,#00B4CC)',
    `<div style="font-size:2.5rem;margin-bottom:10px;">✅</div>
     <h1 style="color:#fff;font-size:1.4rem;font-weight:800;margin:0;">Order Confirmed</h1>
     <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.9rem;">Our team will contact you within 24 hours.</p>`,
    `<p style="color:#334155;font-size:0.97rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, thank you for your order! Here's a summary:</p>
     <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:0 0 22px;border:1px solid #e2e8f0;">
       <table style="width:100%;border-collapse:collapse;">
         <tr>
           <td style="color:#64748b;font-size:0.88rem;padding:6px 0;width:40%;">Service</td>
           <td style="color:#022B50;font-weight:700;font-size:0.95rem;padding:6px 0;">${service}</td>
         </tr>
         ${notes ? `<tr><td style="color:#64748b;font-size:0.88rem;padding:6px 0;vertical-align:top;">Notes</td><td style="color:#334155;font-size:0.88rem;padding:6px 0;">${notes}</td></tr>` : ''}
       </table>
     </div>
     <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);border-radius:12px;padding:20px 24px;margin:0 0 22px;">
       <h3 style="color:#fff;margin:0 0 10px;font-size:0.95rem;">What happens next?</h3>
       <ol style="color:rgba(255,255,255,0.85);margin:0;padding-left:18px;line-height:2.1;font-size:0.88rem;">
         <li>Our team reviews your order within 24 hours</li>
         <li>You'll be contacted to confirm details</li>
         <li>Work begins after confirmation</li>
       </ol>
     </div>
     <p style="color:#64748b;font-size:0.88rem;margin:0;">Questions? Reply to this email or contact <a href="mailto:support@cruzendigital.com" style="color:#1dbf73;font-weight:600;">support@cruzendigital.com</a></p>`
  );

  const adminHtml = layout(
    '#022B50',
    `<h2 style="color:#1dbf73;margin:0;font-size:1.2rem;">New Order Received</h2>`,
    `<table style="width:100%;border-collapse:collapse;">
       <tr><td style="color:#64748b;padding:8px 0;width:35%;">Name</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${name}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Email</td><td style="color:#022B50;padding:8px 0;">${to}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Service</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${service}</td></tr>
       ${notes ? `<tr><td style="color:#64748b;padding:8px 0;vertical-align:top;">Notes</td><td style="color:#334155;padding:8px 0;">${notes}</td></tr>` : ''}
     </table>`
  );

  await Promise.all([
    send(to, `Order Confirmed — ${service} | Cruzen Digital`, userHtml,
      `Hi ${name}, your order for ${service} is confirmed. Our team will contact you within 24 hours.`),
    send(adminEmail, `New Order: ${service} from ${name}`, adminHtml,
      `New order received.\nName: ${name}\nEmail: ${to}\nService: ${service}${notes ? '\nNotes: ' + notes : ''}`),
  ]);
};

// ── Consultation Confirmation ─────────────────────────────────────────────────
exports.sendConsultationConfirmationEmail = async (to, name, service, date, timeSlot) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@cruzendigital.com';
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const userHtml = layout(
    'linear-gradient(135deg,#022B50,#0f3d6c)',
    `<div style="font-size:2.5rem;margin-bottom:10px;">📅</div>
     <h1 style="color:#fff;font-size:1.4rem;font-weight:800;margin:0;">Consultation Booked!</h1>
     <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.9rem;">We look forward to speaking with you.</p>`,
    `<p style="color:#334155;font-size:0.97rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, your consultation has been confirmed:</p>
     <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:0 0 22px;border:1px solid #e2e8f0;">
       <table style="width:100%;border-collapse:collapse;">
         <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;width:40%;">Service</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${service}</td></tr>
         <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;">Date</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${formattedDate}</td></tr>
         <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;">Time</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${timeSlot}</td></tr>
       </table>
     </div>
     <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);border-radius:12px;padding:20px 24px;margin:0 0 22px;">
       <h3 style="color:#fff;margin:0 0 10px;font-size:0.95rem;">Before your call:</h3>
       <ul style="color:rgba(255,255,255,0.92);margin:0;padding-left:18px;line-height:2.1;font-size:0.88rem;">
         <li>Our team will call on your registered phone number</li>
         <li>Have your current challenges ready to discuss</li>
         <li>The call typically lasts 20–30 minutes</li>
       </ul>
     </div>
     <p style="color:#64748b;font-size:0.88rem;margin:0;">Need to reschedule? Reply to this email or contact <a href="mailto:support@cruzendigital.com" style="color:#1dbf73;font-weight:600;">support@cruzendigital.com</a></p>`
  );

  const adminHtml = layout(
    '#022B50',
    `<h2 style="color:#00B4CC;margin:0;font-size:1.2rem;">New Consultation Booked</h2>`,
    `<table style="width:100%;border-collapse:collapse;">
       <tr><td style="color:#64748b;padding:8px 0;width:35%;">Name</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${name}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Email</td><td style="color:#022B50;padding:8px 0;">${to}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Service</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${service}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Date</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${formattedDate}</td></tr>
       <tr><td style="color:#64748b;padding:8px 0;">Time</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${timeSlot}</td></tr>
     </table>`
  );

  await Promise.all([
    send(to, `Consultation Confirmed — ${service} | Cruzen Digital`, userHtml,
      `Hi ${name}, your consultation for ${service} on ${formattedDate} at ${timeSlot} is confirmed.`),
    send(adminEmail, `New Consultation: ${service} from ${name} on ${formattedDate}`, adminHtml,
      `New consultation.\nName: ${name}\nEmail: ${to}\nService: ${service}\nDate: ${formattedDate}\nTime: ${timeSlot}`),
  ]);
};

// ── 2FA Setup Email ───────────────────────────────────────────────────────────
exports.send2FASetupEmail = async (to, name) => {
  const html = layout(
    'linear-gradient(135deg,#022B50,#0f3d6c)',
    `<div style="font-size:2.2rem;margin-bottom:10px;">🔐</div>
     <h1 style="color:#fff;font-size:1.3rem;font-weight:800;margin:0;">Secure Your Account</h1>`,
    `<p style="color:#334155;font-size:0.97rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, we recommend enabling Two-Factor Authentication (2FA) for extra security.</p>
     <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 0 24px;">
       <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;">
         <span style="font-size:1.2rem;">📧</span>
         <div>
           <div style="font-weight:700;color:#022B50;font-size:0.9rem;">Email OTP</div>
           <div style="color:#64748b;font-size:0.82rem;">Receive a one-time code on your email</div>
         </div>
       </div>
       <div style="padding:16px 20px;display:flex;align-items:center;gap:12px;">
         <span style="font-size:1.2rem;">📱</span>
         <div>
           <div style="font-weight:700;color:#022B50;font-size:0.9rem;">Phone OTP</div>
           <div style="color:#64748b;font-size:0.82rem;">Receive a one-time code via SMS</div>
         </div>
       </div>
     </div>
     <div style="text-align:center;">
       <a href="${process.env.FRONTEND_URL || 'https://cruzendigital.us.cc'}/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#1dbf73,#00B4CC);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">
         Enable 2FA in Dashboard →
       </a>
     </div>`
  );
  await send(
    to,
    'Secure Your Cruzen Digital Account with 2FA',
    html,
    `Hi ${name}, enable 2FA on your Cruzen Digital account for extra security. Visit your dashboard at ${process.env.FRONTEND_URL || 'https://cruzendigital.us.cc'}/dashboard`
  );
};
