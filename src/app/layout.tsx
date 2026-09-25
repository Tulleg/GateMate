import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GateMate | Multi-Tenant Event Ticketing & QR Check-In",
  description: "Modern, secure event ticketing platform with real-time mobile QR check-in and Stripe Connect payouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
