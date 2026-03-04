import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

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

        className={`${geistSans.variable} ${geistMono.variable} font-sans text-black antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
