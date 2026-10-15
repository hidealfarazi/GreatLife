import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

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
      <body style={{ position: "relative", minHeight: "100vh", background: "var(--rn-bg)", color: "var(--rn-text)" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
