const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

let backendEnv = {};
try {
  backendEnv = dotenv.parse(
    fs.readFileSync(path.join(__dirname, "..", ".env"))
  );
} catch {
  // Hosting environments can provide SMTP settings without a local .env file.
}

const getSetting = (name) =>
  process.env[name]?.trim() || backendEnv[name]?.trim() || "";

const sendEmail = async ({ email, subject, html, attachments = [] }) => {
  const host = getSetting("SMTP_HOST");
  const port = Number(getSetting("SMTP_PORT")) || 587;
  const user = getSetting("SMTP_EMAIL");
  const pass = getSetting("SMTP_PASSWORD");
  const fromEmail = getSetting("SMTP_FROM_EMAIL") || user;
  const fromName = getSetting("SMTP_FROM_NAME") || "J&J K-POP Store";

  if (!host || !user || !pass || !fromEmail) {
    const missing = [
      ["SMTP_HOST", host],
      ["SMTP_EMAIL", user],
      ["SMTP_PASSWORD", pass],
      ["SMTP_FROM_EMAIL", fromEmail],
    ].filter(([, value]) => !value).map(([name]) => name);
    throw new Error(`SMTP settings are incomplete: ${missing.join(", ")}.`);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    html,
    attachments,
  });
};

module.exports = sendEmail;
