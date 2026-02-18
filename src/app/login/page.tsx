"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/lib/auth-context";

export default function LoginRoute() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/research");
    }
  }, [user, router]);

  if (user) return null;

  return <LoginPage />;
}
