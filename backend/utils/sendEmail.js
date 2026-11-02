
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

let backendEnv = {};

try {
  backendEnv = dotenv.parse(
    fs.readFileSync(path.join(__dirname, "..", ".env"))
  );
} catch {}

const getSetting = (name) =>
  process.env[name]?.trim() || backendEnv[name]?.trim() || "";

const sendEmail = async ({
  email,
  subject,
  html,
  attachments = [],
}) => {
  const host = getSetting("SMTP_HOST");
  const port = Number(getSetting("SMTP_PORT")) || 2525;
  const user = getSetting("SMTP_EMAIL");
  const pass = getSetting("SMTP_PASSWORD");

  const fromEmail = getSetting("SMTP_FROM_EMAIL") || user;
  const fromName =
    getSetting("SMTP_FROM_NAME") || "J&J K-POP Store";

  if (!host || !user || !pass || !fromEmail) {
    throw new Error("SMTP configuration is incomplete.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const result = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject,
    html,
    attachments,
  });

  console.log("SMTP email sent:", result.messageId);

  return result;
};

module.exports = sendEmail;
