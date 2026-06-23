const nodemailer = require('nodemailer');

const createTransport = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS &&
      !process.env.SMTP_PASS.includes('your_smtp')) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Ethereal test account for dev
  return null;
};

let transport = null;
let testAccount = null;

const getTransport = async () => {
  if (transport) return transport;
  const real = createTransport();
  if (real) { transport = real; return transport; }
  // Create Ethereal test account
  testAccount = await nodemailer.createTestAccount();
  transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return transport;
};

const FROM = `"Cruzen Digital" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@cruzendigital.com'}>`;

const send = async (to, subject, html) => {
  try {
    const t = await getTransport();
    const info = await t.sendMail({ from: FROM, to, subject, html });
    if (testAccount) {
      console.log(`\n📧 ─────────────────────────────────────────`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`─────────────────────────────────────────\n`);
    } else {
      console.log(`📧 Email sent to ${to}: ${subject}`);
    }
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendOTPEmail = async (to, otp, purpose = 'verify') => {
  const titles = { signup: 'Verify Your Email', login: 'Your Login OTP', '2fa': 'Two-Factor Authentication Code', verify: 'Verification Code', reset: 'Reset Your Password' };
  const title = titles[purpose] || 'Your OTP Code';
  await send(to, `${title} — Cruzen Digital`, `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);padding:32px 40px;text-align:center;">
        <h1 style="color:#fff;font-size:1.6rem;font-weight:800;margin:0;">CruzenDigital</h1>
      </div>
      <div style="padding:40px;">
        <h2 style="color:#022B50;font-size:1.3rem;font-weight:700;margin:0 0 12px;">${title}</h2>
        <p style="color:#64748b;margin:0 0 28px;">Use the code below to complete your action. This code expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f8fafc;border:2px dashed #00B4CC;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
          <span style="font-size:2.5rem;font-weight:800;color:#022B50;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:0.85rem;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:0.8rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India</p>
      </div>
    </div>
  `);
};

exports.sendWelcomeEmail = async (to, name) => {
  await send(to, 'Welcome to Cruzen Digital', `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);padding:40px;text-align:center;">
        <h1 style="color:#fff;font-size:1.8rem;font-weight:800;margin:0 0 8px;">Welcome, ${name}! 🎉</h1>
        <p style="color:rgba(255,255,255,0.75);margin:0;font-size:0.95rem;">You're now part of the Cruzen Digital family.</p>
      </div>
      <div style="padding:40px;">
        <p style="color:#334155;font-size:1rem;line-height:1.7;margin:0 0 24px;">We're thrilled to have you on board. Cruzen Digital helps e-commerce brands scale with expert Amazon management, performance marketing, and conversion-focused web solutions.</p>
        <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);border-radius:12px;padding:24px;margin:0 0 24px;">
          <h3 style="color:#fff;margin:0 0 12px;font-size:1rem;">What's next?</h3>
          <ul style="color:rgba(255,255,255,0.9);margin:0;padding-left:20px;line-height:2;">
            <li>Browse our services and find the right plan</li>
            <li>Book a free consultation with our experts</li>
            <li>Track your projects in real-time from your dashboard</li>
          </ul>
        </div>
        <div style="text-align:center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/services" style="display:inline-block;background:linear-gradient(135deg,#1dbf73,#00B4CC);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">Explore Services →</a>
        </div>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:0.8rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India · <a href="mailto:hello@cruzendigital.com" style="color:#00B4CC;">hello@cruzendigital.com</a></p>
      </div>
    </div>
  `);
};

exports.sendOrderConfirmationEmail = async (to, name, service, notes) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@cruzendigital.com';
  const userHtml = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);padding:36px 40px;text-align:center;">
        <div style="font-size:2.8rem;margin-bottom:8px;">✅</div>
        <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Order Confirmed</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.95rem;">Our team will review your order and contact you within 24 hours.</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#334155;font-size:1rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, thank you for your order! Here's a summary:</p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:0 0 24px;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#64748b;font-size:0.88rem;padding:6px 0;width:40%;">Service</td>
              <td style="color:#022B50;font-weight:700;font-size:0.95rem;padding:6px 0;">${service}</td>
            </tr>
            ${notes ? `<tr><td style="color:#64748b;font-size:0.88rem;padding:6px 0;vertical-align:top;">Notes</td><td style="color:#334155;font-size:0.88rem;padding:6px 0;">${notes}</td></tr>` : ''}
          </table>
        </div>
        <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
          <h3 style="color:#fff;margin:0 0 10px;font-size:0.95rem;">What happens next?</h3>
          <ol style="color:rgba(255,255,255,0.85);margin:0;padding-left:18px;line-height:2;font-size:0.88rem;">
            <li>Our team reviews your order within 24 hours</li>
            <li>You will be contacted to confirm details</li>
            <li>Work begins after confirmation</li>
          </ol>
        </div>
        <p style="color:#64748b;font-size:0.88rem;margin:0;">Questions? Contact us at <a href="mailto:support@cruzendigital.com" style="color:#1dbf73;font-weight:600;">support@cruzendigital.com</a></p>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:0.8rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India</p>
      </div>
    </div>
  `;
  const adminHtml = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#022B50;padding:24px 32px;">
        <h2 style="color:#1dbf73;margin:0;font-size:1.2rem;">New Order Received</h2>
      </div>
      <div style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:8px 0;width:35%;">Name</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${name}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Email</td><td style="color:#022B50;padding:8px 0;">${to}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Service</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${service}</td></tr>
          ${notes ? `<tr><td style="color:#64748b;padding:8px 0;vertical-align:top;">Notes</td><td style="color:#334155;padding:8px 0;">${notes}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;
  await send(to, `Order Confirmed — ${service} | Cruzen Digital`, userHtml);
  await send(adminEmail, `New Order: ${service} from ${name}`, adminHtml);
};

exports.sendConsultationConfirmationEmail = async (to, name, service, date, timeSlot) => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@cruzendigital.com';
  const formattedDate = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const userHtml = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);padding:36px 40px;text-align:center;">
        <div style="font-size:2.8rem;margin-bottom:8px;">📅</div>
        <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Consultation Booked!</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.95rem;">We look forward to speaking with you.</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#334155;font-size:1rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, your consultation has been confirmed. Here are the details:</p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:0 0 24px;border:1px solid #e2e8f0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;width:40%;">Service</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${service}</td></tr>
            <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;">Date</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${formattedDate}</td></tr>
            <tr><td style="color:#64748b;font-size:0.88rem;padding:8px 0;">Time</td><td style="color:#022B50;font-weight:700;padding:8px 0;">${timeSlot}</td></tr>
          </table>
        </div>
        <div style="background:linear-gradient(135deg,#1dbf73,#00B4CC);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
          <h3 style="color:#fff;margin:0 0 10px;font-size:0.95rem;">Before your call:</h3>
          <ul style="color:rgba(255,255,255,0.9);margin:0;padding-left:18px;line-height:2;font-size:0.88rem;">
            <li>Our team will call on your registered phone number</li>
            <li>Have your current challenges ready to discuss</li>
            <li>The call typically lasts 20–30 minutes</li>
          </ul>
        </div>
        <p style="color:#64748b;font-size:0.88rem;margin:0;">Need to reschedule? Contact us at <a href="mailto:support@cruzendigital.com" style="color:#1dbf73;font-weight:600;">support@cruzendigital.com</a></p>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:0.8rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India</p>
      </div>
    </div>
  `;
  const adminHtml = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#022B50;padding:24px 32px;">
        <h2 style="color:#00B4CC;margin:0;font-size:1.2rem;">New Consultation Booked</h2>
      </div>
      <div style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:8px 0;width:35%;">Name</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${name}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Email</td><td style="color:#022B50;padding:8px 0;">${to}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Service</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${service}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Date</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${formattedDate}</td></tr>
          <tr><td style="color:#64748b;padding:8px 0;">Time</td><td style="color:#022B50;font-weight:600;padding:8px 0;">${timeSlot}</td></tr>
        </table>
      </div>
    </div>
  `;
  await send(to, `Consultation Confirmed — ${service} | Cruzen Digital`, userHtml);
  await send(adminEmail, `New Consultation: ${service} from ${name} on ${formattedDate}`, adminHtml);
};

exports.send2FASetupEmail = async (to, name) => {
  await send(to, 'Secure Your Account with 2FA — Cruzen Digital', `
    <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#022B50,#0f3d6c);padding:32px 40px;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔐</div>
        <h1 style="color:#fff;font-size:1.4rem;font-weight:800;margin:0;">Secure Your Account</h1>
      </div>
      <div style="padding:40px;">
        <p style="color:#334155;font-size:1rem;line-height:1.7;margin:0 0 20px;">Hi <strong>${name}</strong>, for your security we recommend enabling Two-Factor Authentication (2FA) on your Cruzen Digital account.</p>
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
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1dbf73,#00B4CC);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">Enable 2FA in Dashboard →</a>
        </div>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:0.8rem;margin:0;">© 2026 Cruzen Digital · New Delhi, India</p>
      </div>
    </div>
  `);
};
