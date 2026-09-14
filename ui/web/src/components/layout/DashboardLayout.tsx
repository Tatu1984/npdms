"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { PlatformSidebar } from "./PlatformSidebar";
import { PlatformTopbar } from "./PlatformTopbar";
import { Spinner } from "@/components/ui/Spinner";
import { ToastContainer } from "@/components/ui/Toast";

interface DashboardLayoutProps {
  children: ReactNode;
  /**
   * Command-centre screens (CCTV, dispatch) render dark regardless of the
   * user's theme preference — they are read at a distance in a control room.
   */
  ops?: boolean;
}

export function DashboardLayout({ children, ops }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && (!isAuthenticated || !user)) {
      router.push("/login");
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PlatformSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformTopbar />
        <main className={ops ? "dark flex-1 bg-background" : "flex-1"}>
          <div className="mx-auto w-full max-w-[110rem] p-4 md:p-6">{children}</div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
