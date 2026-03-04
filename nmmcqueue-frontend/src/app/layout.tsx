import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Queueing System: NMMC",
  description: "Northern Mindanao Medical Center's Queueing System and Admin Monitoring",

  icons: {
    icon: "/nmmc-logo.png"
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body

        className={`${sans.variable} ${mono.variable} font-sans text-black antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
