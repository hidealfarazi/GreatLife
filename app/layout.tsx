import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AppRuntime } from "@/components/AppRuntime";
import { INSTALL_CAPTURE_SCRIPT } from "@/lib/installScript";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["700"],
  variable: "--font-display",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Belajar",
  description: "Pendamping belajar harian",
  applicationName: "Belajar",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // iOS "Add to Home Screen": open full screen with a dark status bar.
  appleWebApp: {
    capable: true,
    title: "Belajar",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  other: {
    // Older iOS versions only read the apple-prefixed tag.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0D10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable}`}>
      <head>
        {/* Keeps the browser's install prompt for the "Pasang aplikasi" button (fires before React loads). */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
      </head>
      <body style={{ position: "relative", minHeight: "100vh", background: "var(--rn-bg)", color: "var(--rn-text)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <BottomNav />
        <AppRuntime />
      </body>
    </html>
  );
}
