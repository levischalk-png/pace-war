import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pace War",
  description:
    "The ultimate running competition with your friends",
  applicationName: "Pace War",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Pace War",
  },
  other: {
    "color-scheme": "light",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white" style={{ colorScheme: 'light' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black min-h-screen`}
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
