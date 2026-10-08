import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { RainBackground } from "@/components/RainBackground";
import { BottomNav } from "@/components/BottomNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Belajar",
  description: "Pendamping belajar harian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable}`}>
      <body style={{ position: "relative", minHeight: "100vh", background: "var(--rn-bg)", color: "var(--rn-text)" }}>
        <RainBackground />
        <div style={{ position: "relative", zIndex: 1, paddingBottom: "4rem" }}>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
