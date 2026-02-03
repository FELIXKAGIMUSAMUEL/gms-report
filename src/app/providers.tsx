"use client";

import { SessionProvider } from "next-auth/react";
import NotificationSystem from "@/components/NotificationSystem";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <NotificationSystem />
      {children}
    </SessionProvider>
  );
}
