import { AppAlertProvider } from "@/shared/providers/AppAlertProvider";
import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans text-black antialiased">
        <AppAlertProvider>
          {children}
        </AppAlertProvider>
      </body>
    </html>
  );
}
