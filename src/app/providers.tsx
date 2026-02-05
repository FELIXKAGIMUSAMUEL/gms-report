"use client";

import { SessionProvider } from "next-auth/react";
import NotificationSystem from "@/components/NotificationSystem";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={60} 
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <NotificationSystem />
      {children}
    </SessionProvider>
  );
}
