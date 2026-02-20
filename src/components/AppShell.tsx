"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Header from "./Header";
import Disclaimer from "./Disclaimer";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublic, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600/30 border-t-teal-600" />
      </div>
    );
  }

  // Login and Register pages render their own full-screen layout
  if ((pathname === "/login" || pathname === "/register") && !user) {
    return <>{children}</>;
  }

  // Protected route accessed without auth — show nothing while redirecting
  if (!user && !isPublic) {
    return null;
  }

  return (
    <div className="flex h-dvh flex-col">
      <Header />
      {user && <Disclaimer />}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
