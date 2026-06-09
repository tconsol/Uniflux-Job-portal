const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendOtpEmail(to, name, otp) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'Uniflux <noreply@uniflux.com>',
    to,
    subject: `${otp} is your Uniflux verification code`,
    text: `Hi ${name},\n\nYour Uniflux verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.\n\nUniflux Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Uniflux</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Verify your email</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Hi ${name}, use the code below to verify your account. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <div style="background:#f0f4ff;border:2px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                <p style="margin:0;font-size:40px;font-weight:800;color:#2563eb;letter-spacing:12px;">${otp}</p>
              </div>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you did not create a Uniflux account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} Uniflux. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

module.exports = { sendOtpEmail };
