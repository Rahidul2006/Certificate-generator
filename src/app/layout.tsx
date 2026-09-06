import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CertiMail - Certificate Automation & Bulk Emailing",
  description: "Modern certificate generation and bulk-email platform for organizers and teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${montserrat.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}