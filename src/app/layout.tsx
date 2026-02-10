import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import OfflineIndicator from "@/components/OfflineIndicator";

export const metadata: Metadata = {
  title: "General Managers Report",
  description: "Manage and visualize mission statistics including baptisms, tithes, membership, and more.",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GMS Report",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <OfflineIndicator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
