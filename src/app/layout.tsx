import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import OfflineIndicator from "@/components/OfflineIndicator";

export const metadata: Metadata = {
  title: "General Managers Report",
  description: "Sir Apollo Kaggwa Schools — performance tracking and reporting dashboard.",
  manifest: "/manifest.json",
  themeColor: "#e8254d",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GMS Report",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#e8254d",
    "msapplication-tap-highlight": "no",
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
