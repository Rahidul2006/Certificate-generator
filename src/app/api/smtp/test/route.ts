import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { host, port, secure, user, pass } = body;

    if (!host || !port) {
      return NextResponse.json(
        { success: false, error: "SMTP host and port are required." },
        { status: 400 }
      );
    }

    const portNum = Number(port);
    const isSecure = Boolean(secure || portNum === 465);

    const transportOptions: SMTPTransport.Options = {
      host,
      port: portNum,
      secure: isSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      ...(user && pass
        ? {
            auth: {
              user,
              pass,
            },
          }
        : {}),
    };

    const transporter = nodemailer.createTransport(transportOptions);

    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: `Connection established to ${host}:${portNum} successfully!`,
    });
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : "Failed to connect to SMTP server.";
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
