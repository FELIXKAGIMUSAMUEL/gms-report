"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;
    
    // If session is loading, wait
    if (status === "loading") return;

    const isLoginPage = pathname === "/login";

    // If not authenticated and not on login page, redirect to login
    // Middleware will handle this for protected routes
    if (status === "unauthenticated" && !isLoginPage) {
      router.push("/login");
    }
  }, [status, pathname, router, isClient]);

  // During SSR or initial client render, just render children
  if (!isClient) {
    return <>{children}</>;
  }

  // Show loading state only for non-login pages
  if (status === "loading" && pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
