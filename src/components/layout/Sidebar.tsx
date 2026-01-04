"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Briefcase,
  Package,
  Users,
  Car,
  Shield,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import type { Role } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  minRole?: Role;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "FIR Management", href: "/fir", icon: FileText },
  { name: "Case Tracking", href: "/cases", icon: Briefcase },
  { name: "Evidence", href: "/evidence", icon: Package },
  { name: "Personnel", href: "/personnel", icon: Users, minRole: "SHO" },
  { name: "Vehicles", href: "/vehicles", icon: Car, minRole: "SHO" },
  { name: "Armoury", href: "/armoury", icon: Shield, minRole: "SHO" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, minRole: "SP" },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Lookout", href: "/lookout", icon: AlertTriangle },
  { name: "GIS Mapping", href: "/gis", icon: MapPin, minRole: "SHO" },
];

const bottomNavigation: NavItem[] = [
  { name: "Search", href: "/search", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filterByRole = (items: NavItem[]) => {
    if (!user) return [];
    return items.filter(
      (item) => !item.minRole || hasMinimumRole(user.role, item.minRole)
    );
  };

  const visibleNav = filterByRole(navigation);
  const visibleBottomNav = filterByRole(bottomNavigation);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-background-secondary border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-accent" />
            <span className="font-bold text-lg text-foreground">NPDMS</span>
          </div>
        )}
        {collapsed && <Shield className="h-8 w-8 text-accent mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-border py-4">
        <ul className="space-y-1 px-2">
          {visibleBottomNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
