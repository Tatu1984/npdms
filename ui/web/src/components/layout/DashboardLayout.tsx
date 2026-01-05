"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/Toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only redirect after hydration is complete
    if (_hasHydrated && (!isAuthenticated || !user)) {
      router.push("/login");
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  // Show loading while hydrating OR if not authenticated after hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
      <ToastContainer />
    </div>
  );
}
