/*
 * Archivo: src/lib/mail.ts
 * Qué hace: Configura Nodemailer con las credenciales SMTP de Brevo
 * y exporta una función sendMail para enviar emails desde cualquier
 * parte de la aplicación.
 */

import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailParams) {
  console.log("SMTP USER:", process.env.BREVO_SMTP_USER);
  console.log("SMTP PASS:", process.env.BREVO_SMTP_PASS ? "definida" : "indefinida");

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.sendMail({
      from: `JobMatch Uruguay <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log("Email enviado a:", to);
  } catch (error) {
    console.error("Error al enviar email:", error);
  }
}