"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Records which screens an officer opened and for how long.
 *
 * This is staff monitoring and the platform says so: the retention notice sits
 * on the officer's own profile, where they can read their own trail, and the
 * server keeps the detail for ninety days before reducing it to monthly
 * totals. See migration 000090, which explains why a force needs it — misuse
 * of a police system is usually reading, which changes nothing and so leaves
 * no trace in the audit trail at all.
 *
 * Three things it is careful about:
 *
 * The duration is measured from when the screen became visible, not from when
 * the route changed. A tab in the background is not an officer reading, and
 * counting it would make every figure built on this wrong in the same
 * direction.
 *
 * It reports on leaving a page and again when the tab closes, and those two
 * overlap. The server takes (officer, path, opened at) as the identity of a
 * visit and ignores the repeat, so nothing is counted twice.
 *
 * The last batch is sent with `keepalive`, which is what survives the page
 * going away. sendBeacon cannot carry the Authorization header, so it is not
 * usable here.
 */

interface Visit {
  path: string;
  openedAt: string;
  closedAt: string;
}

const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/activity`;

// Visits shorter than this are a redirect or a mis-click passing through, not
// a screen somebody looked at.
const MIN_SECONDS = 2;

export function ActivityTracker() {
  const pathname = usePathname();
  const pending = React.useRef<Visit[]>([]);
  const openedAt = React.useRef<Date | null>(null);
  const current = React.useRef<string | null>(null);

  const send = React.useCallback((keepalive: boolean) => {
    if (pending.current.length === 0) return;
    const visits = pending.current;
    pending.current = [];

    let token: string | null = null;
    try {
      token = localStorage.getItem("accessToken");
    } catch {
      // Private window or blocked storage. Nothing to report against.
    }
    if (!token) return;

    void fetch(ENDPOINT, {
      method: "POST",
      keepalive,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visits }),
    }).catch(() => {
      // A trail that cannot be sent must never break the screen the officer is
      // working on. The visit is lost; the work is not.
    });
  }, []);

  // Close off the visit in progress and queue it.
  const closeCurrent = React.useCallback(() => {
    const path = current.current;
    const opened = openedAt.current;
    openedAt.current = null;
    if (!path || !opened) return;

    const closed = new Date();
    if ((closed.getTime() - opened.getTime()) / 1000 < MIN_SECONDS) return;
    pending.current.push({
      path,
      openedAt: opened.toISOString(),
      closedAt: closed.toISOString(),
    });
  }, []);

  // A route change ends one visit and starts the next.
  React.useEffect(() => {
    if (!pathname || pathname === "/login") {
      closeCurrent();
      send(false);
      current.current = null;
      return;
    }
    closeCurrent();
    send(false);
    current.current = pathname;
    openedAt.current = document.visibilityState === "visible" ? new Date() : null;
  }, [pathname, closeCurrent, send]);

  // Time only counts while the screen is actually in front of somebody.
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (current.current && !openedAt.current) openedAt.current = new Date();
        return;
      }
      closeCurrent();
      send(true);
    };
    const onPageHide = () => {
      closeCurrent();
      send(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [closeCurrent, send]);

  // A long sitting on one screen should not go unreported until it is left.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (!current.current || !openedAt.current) return;
      const opened = openedAt.current;
      const now = new Date();
      if ((now.getTime() - opened.getTime()) / 1000 < 300) return;
      pending.current.push({
        path: current.current,
        openedAt: opened.toISOString(),
        closedAt: now.toISOString(),
      });
      openedAt.current = now;
      send(false);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [send]);

  return null;
}

export default ActivityTracker;
