import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ZoneCookie } from "@/components/ZoneCookie";
import { ServiceWorker } from "@/components/ServiceWorker";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AstroMed",
  description: "Personal health monitoring for astronauts on missions beyond Earth.",
  appleWebApp: { capable: true, title: "AstroMed", statusBarStyle: "black-translucent" },
  // Space Apps rules: acknowledge AI-assisted code in metadata as well as in text (see /about).
  other: { "ai-assistance": "Code and text written with the help of an AI coding assistant (Claude, by Anthropic) and reviewed by the team. The My body figure image is AI-generated and labelled on screen; no other AI-generated images, video or audio." },
};

export const viewport: Viewport = {
  themeColor: "#070b16",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ZoneCookie />
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
