import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GateMate | Multi-Tenant Event-Ticketing & QR-Check-In",
  description: "Moderne, sichere Event-Ticketing-Plattform mit Echtzeit Mobile-QR-Check-In und Stripe Connect Auszahlungen.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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

