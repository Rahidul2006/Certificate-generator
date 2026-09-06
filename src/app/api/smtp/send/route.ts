import { NextResponse } from "next/server";
import nodemailer, { SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

interface SendEmailPayload {
  smtp: {
    host: string;
    port: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    fromName?: string;
    fromEmail?: string;
  };
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  attachment?: {
    filename: string;
    content: string; // base64 or data URL
    contentType?: string;
  };
}

export async function POST(req: Request) {
  try {
    const payload: SendEmailPayload = await req.json();
    const { smtp, to, toName, subject, html, text, attachment } = payload;

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: "Recipient email and subject are required." },
        { status: 400 }
      );
    }

    if (!smtp || !smtp.host) {
      return NextResponse.json(
        { success: false, error: "Valid SMTP server configuration is required." },
        { status: 400 }
      );
    }

    const portNum = Number(smtp.port) || 587;
    const isSecure = Boolean(smtp.secure || portNum === 465);

    const transportOptions: SMTPTransport.Options = {
      host: smtp.host,
      port: portNum,
      secure: isSecure,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      ...(smtp.user && smtp.pass
        ? {
            auth: {
              user: smtp.user,
              pass: smtp.pass,
            },
          }
        : {}),
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const fromAddress = smtp.fromEmail
      ? smtp.fromName
        ? `"${smtp.fromName}" <${smtp.fromEmail}>`
        : smtp.fromEmail
      : `"CertiMail" <noreply@certimail.internal>`;

    const mailAttachments: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }> = [];

    if (attachment && attachment.content) {
      let base64Data = attachment.content;
      // Strip data url schema if present e.g. "data:image/png;base64," or "data:application/pdf;base64,"
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const buffer = Buffer.from(base64Data, "base64");
      mailAttachments.push({
        filename: attachment.filename || "Certificate.png",
        content: buffer,
        contentType:
          attachment.contentType ||
          (attachment.filename.endsWith(".pdf") ? "application/pdf" : "image/png"),
      });
    }

    const mailOptions: SendMailOptions = {
      from: fromAddress,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      attachments: mailAttachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : "Failed to dispatch email.";
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
