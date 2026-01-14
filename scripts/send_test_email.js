// scripts/send_test_email.js (Ethereal dev-only)
const nodemailer = require("nodemailer");

async function main() {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Dev Test" <no-reply@example.dev>',
    to: "baronlonewolf999@gmail.com",
    subject: "Ethereal test",
    text: "If you see this, Ethereal works",
  });

  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);
