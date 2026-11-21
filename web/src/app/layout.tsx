import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaShell } from "@/components/pwa/PwaShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Warung Nuhahade", template: "%s — Warung Nuhahade" },
  description: "Sistem POS & Manajemen Inventori Warung Nuhahade",
  applicationName: "Toko Nuhahade",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Toko Nuhahade",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#065f46",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        {children}
        <PwaShell />
      </body>
    </html>
  );
}