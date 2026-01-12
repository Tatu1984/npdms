"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, getRoleDisplayName } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { user, syncState, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getSyncIcon = () => {
    switch (syncState.status) {
      case "ONLINE":
        return <Wifi className="h-4 w-4 text-success" />;
      case "OFFLINE":
        return <WifiOff className="h-4 w-4 text-error" />;
      case "SYNCING":
        return <RefreshCw className="h-4 w-4 text-info animate-spin" />;
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-error" />;
    }
  };

  const getSyncText = () => {
    switch (syncState.status) {
      case "ONLINE":
        return "Connected";
      case "OFFLINE":
        return "Offline Mode";
      case "SYNCING":
        return `Syncing (${syncState.pendingChanges} pending)`;
      case "ERROR":
        return "Sync Error";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "CONSTABLE":
      case "HEAD_CONSTABLE":
        return "constable";
      case "SHO":
      case "SI":
      case "ASI":
      case "INSPECTOR":
        return "sho";
      case "SP":
      case "DSP":
        return "district";
      case "DGP":
      case "IG":
      case "DIG":
        return "state";
      case "ADMIN":
        return "central";
      default:
        return "default";
    }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-background-secondary border-b border-border">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Station Info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-medium text-foreground">
              {user.stationName}
            </h1>
            <p className="text-xs text-foreground-muted">
              {user.districtName}, {user.stateName}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-tertiary">
            {getSyncIcon()}
            <span className="text-xs text-foreground-muted">{getSyncText()}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error" />
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-background-secondary border border-border rounded-lg shadow-lg animate-slide-in">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 p-3 rounded-md hover:bg-background-tertiary cursor-pointer">
                    <div className="h-2 w-2 rounded-full bg-error mt-2" />
                    <div>
                      <p className="text-sm text-foreground">
                        Flash Alert: Armed suspects spotted
                      </p>
                      <p className="text-xs text-foreground-muted">2 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-md hover:bg-background-tertiary cursor-pointer">
                    <div className="h-2 w-2 rounded-full bg-warning mt-2" />
                    <div>
                      <p className="text-sm text-foreground">
                        New FIR assigned to you
                      </p>
                      <p className="text-xs text-foreground-muted">15 min ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-background-tertiary transition-colors"
            >
              <Avatar fallback={user.name} size="sm" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <Badge
                  variant={getRoleBadgeVariant(user.role) as any}
                  className="text-[10px] px-1.5 py-0"
                >
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-foreground-muted" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-background-secondary border border-border rounded-lg shadow-lg animate-slide-in">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-foreground-muted">{user.badgeNumber}</p>
                </div>
                <div className="p-2">
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-foreground-muted hover:bg-background-tertiary hover:text-foreground rounded-md transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/profile");
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
