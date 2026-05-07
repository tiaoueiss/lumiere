require("dotenv").config();

const { sendSignupOtpEmail } = require("../services/emailService");

async function main() {
  const to = process.argv[2] || process.env.SMTP_USER;

  if (!to) {
    throw new Error("No recipient found. Pass an email or set SMTP_USER in .env.");
  }

  const result = await sendSignupOtpEmail({
    to,
    name: "Lumiere Tester",
    otp: "123456",
  });

  if (!result.sent) {
    throw new Error("Email was not sent. Check SMTP settings and EMAIL_FALLBACK_TO_CONSOLE.");
  }

  console.log(`Test email sent to ${to}`);
}

main().catch((error) => {
  console.error("Test email failed:", error.message);
  process.exit(1);
});
