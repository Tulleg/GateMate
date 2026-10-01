import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GateMate | Multi-Tenant Event-Ticketing & QR-Check-In",
  description: "Moderne, sichere Event-Ticketing-Plattform mit Echtzeit Mobile-QR-Check-In und Stripe Connect Auszahlungen.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className="font-sans bg-slate-950 text-slate-50 min-h-dvh antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

