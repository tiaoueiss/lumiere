const nodemailer = require("nodemailer");

let cachedTransporter = null;

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const canFallbackToConsole = () => {
  if (process.env.EMAIL_FALLBACK_TO_CONSOLE !== undefined) {
    return String(process.env.EMAIL_FALLBACK_TO_CONSOLE).toLowerCase() === "true";
  }

  return process.env.NODE_ENV !== "production";
};

const getTransporter = () => {
  if (!hasSmtpConfig()) return null;
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendSignupOtpEmail = async ({ to, name, otp }) => {
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER;

  const transporter = getTransporter();
  const safeName = escapeHtml(name);

  if (!transporter) {
    if (!canFallbackToConsole()) {
      throw new Error("SMTP is not fully configured. Check SMTP_HOST, SMTP_USER, and SMTP_PASS.");
    }

    console.log(`[DEV OTP] Signup code for ${to}: ${otp}`);
    return { sent: false };
  }

  try {
    await transporter.sendMail({
      from,
      to, 
      subject: "Your Lumiere verification code",
      text: `Hi ${name},\n\nYour Lumiere verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <div style="margin:0; padding:0; background:#f7f1e7;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f1e7; padding:40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#fffaf2; border:1px solid rgba(201,168,76,0.35); border-radius:24px; overflow:hidden; box-shadow:0 18px 45px rgba(31,26,23,0.08);">
                  <tr>
                    <td style="height:4px; background:linear-gradient(90deg,#9a7530,#d8bd69,#9a7530);"></td>
                  </tr>
                  <tr>
                    <td style="padding:38px 36px 34px; font-family:Georgia,'Times New Roman',serif; color:#1f1a17;">
                      <p style="margin:0 0 8px; font-family:Arial,sans-serif; font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#a9873e;">
                        Lumiere
                      </p>
                      <h1 style="margin:0; font-size:32px; line-height:1.15; font-weight:400; color:#1f1a17;">
                        Your sign-in code
                      </h1>
                      <div style="width:52px; height:1px; background:#c9a84c; margin:22px 0;"></div>
                      <p style="margin:0 0 18px; font-size:16px; line-height:1.7; color:#5f574f;">
                        Hi ${safeName},
                      </p>
                      <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#5f574f;">
                        Welcome to Lumiere. Use the verification code below to finish creating your account and step into your personal style studio.
                      </p>
                      <div style="background:#f3eadb; border:1px solid rgba(201,168,76,0.45); border-radius:18px; padding:24px; text-align:center; margin:0 0 24px;">
                        <p style="margin:0 0 10px; font-family:Arial,sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#9a7530;">
                          Verification code
                        </p>
                        <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:36px; letter-spacing:10px; font-weight:700; color:#1f1a17;">
                          ${otp}
                        </p>
                      </div>
                      <p style="margin:0 0 8px; font-size:14px; line-height:1.7; color:#6f665e;">
                        This code expires in 10 minutes.
                      </p>
                      <p style="margin:0; font-size:13px; line-height:1.7; color:#8b8177;">
                        If you did not request this email, you can safely ignore it.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  } catch (error) {
    if (!canFallbackToConsole()) throw error;

    console.warn(`[EMAIL FALLBACK] Could not send OTP email to ${to}: ${error.message}`);
    console.log(`[DEV OTP] Signup code for ${to}: ${otp}`);
    return { sent: false, error: error.message };
  }

  return { sent: true };
};

module.exports = { sendSignupOtpEmail };
