"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If session is loading, wait
    if (status === "loading") return;

    const isLoginPage = pathname === "/login";

    // If not authenticated and not on login page, redirect to login
    if (status === "unauthenticated" && !isLoginPage) {
      router.push("/login");
      return;
    }

    // If authenticated and on login page, redirect to dashboard
    if (status === "authenticated" && isLoginPage) {
      router.push("/dashboard");
      return;
    }
  }, [status, pathname, router]);

  // Show loading state while checking session
  if (status === "loading") {
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
