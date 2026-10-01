import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GateMate | Multi-Tenant Event-Ticketing & QR-Check-In",
  description: "Moderne, sichere Event-Ticketing-Plattform mit Echtzeit Mobile-QR-Check-In und Stripe Connect Auszahlungen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="font-sans bg-slate-950 text-slate-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
