const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const REQUIRED_ENV_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "CONTACT_TO",
];

// Basic guard to help catch missing configuration early.
const missingEnv = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.warn(
    `⚠️  Missing environment variables: ${missingEnv.join(
      ", "
    )}. Email delivery will fail until these are provided.`
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static site assets (HTML, CSS, images, etc.).
app.use(express.static(path.join(__dirname)));

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ ok: false, error: "Name, email, and message are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlBody = `
      <h2>New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    await transporter.sendMail({
      from: `"JC Elite Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: "New inquiry from JC Elite Equine Ltd website",
      text: `Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}
`,
      html: htmlBody,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Email dispatch failed:", error);
    res
      .status(500)
      .json({ ok: false, error: "Unable to send message. Please try again later." });
  }
});

// Fallback to index for any other request (useful for direct navigation).
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ JC Elite Equine site running at http://localhost:${PORT}`);
});

