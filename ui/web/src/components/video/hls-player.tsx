"use client";

import * as React from "react";
import type HlsType from "hls.js";
import { apiClient } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PlayerState = "idle" | "loading" | "playing" | "error";

/**
 * Lazy, self-cleaning HLS player — the Live Feed Portal / KMCP player.
 *
 * It attaches hls.js only while `active` is true and fully destroys it when
 * `active` turns false (tile scrolled away, tab hidden, camera not live,
 * viewing ended), so a wall of cameras never decodes everything at once and a
 * hidden tile costs nothing.
 *
 * Playback is gated on the server (a purpose-logged viewing session), so every
 * playlist and segment request carries the officer's access token through
 * xhrSetup. Native Safari HLS cannot set that header, so hls.js (MSE) is used
 * wherever it is supported.
 */
export function HlsPlayer({
  src,
  active,
  className,
  controls = true,
  onFatal,
}: {
  src: string;
  active: boolean;
  className?: string;
  controls?: boolean;
  /** Told when playback cannot continue (for example the session has ended). */
  onFatal?: (status: number | null) => void;
}) {
  const { t } = useI18n();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [state, setState] = React.useState<PlayerState>("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const onFatalRef = React.useRef(onFatal);
  onFatalRef.current = onFatal;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let hls: HlsType | null = null;
    const cleanups: (() => void)[] = [];

    const teardown = () => {
      cleanups.splice(0).forEach((fn) => fn());
      if (hls) {
        hls.destroy();
        hls = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        /* ignore */
      }
    };

    if (!active) {
      teardown();
      queueMicrotask(() => {
        if (!cancelled) setState("idle");
      });
      return () => {
        cancelled = true;
        teardown();
      };
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setState("loading");
        setMessage(null);
      }
    });

    (async () => {
      const { default: Hls } = await import("hls.js");
      if (cancelled) return;

      if (!Hls.isSupported()) {
        setState("error");
        setMessage(t("liveVideo.player.unsupported"));
        return;
      }

      const player = new Hls({
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 15,
        // Stay near the live edge so the player never drifts back far enough to
        // ask for a segment the Edge Agent has already deleted (a 404 and a
        // stall). The agent keeps a 20 s window plus six more segments.
        liveSyncDuration: 6,
        liveMaxLatencyDuration: 20,
        maxLiveSyncPlaybackRate: 1.5,
        // Report a live stream as live: without this the controls show a fixed
        // duration (the playlist window), which reads as a recording.
        liveDurationInfinity: true,
        manifestLoadingTimeOut: 8000,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 4,
        xhrSetup: (xhr) => {
          const token = apiClient.getAccessToken();
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
      });
      hls = player;

      /*
       * Jump to the live edge. This is a surveillance wall, not a film: the only
       * moment worth showing is now. Every stall, tab throttle or recovered
       * network error otherwise resumes from where playback stopped, and those
       * setbacks accumulate until a tile is minutes behind while claiming to be
       * live.
       */
      const seekToLive = () => {
        const target = player.liveSyncPosition;
        if (typeof target === "number" && Number.isFinite(target)) {
          if (video.currentTime < target - 1) video.currentTime = target;
          return;
        }
        const end = video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0;
        if (end > 0 && video.currentTime < end - 1) video.currentTime = end;
      };

      const onPlaying = () => setState("playing");
      video.addEventListener("playing", onPlaying);
      video.addEventListener("stalled", seekToLive);
      video.addEventListener("waiting", seekToLive);
      const onVisible = () => {
        if (document.visibilityState === "visible") seekToLive();
      };
      document.addEventListener("visibilitychange", onVisible);
      cleanups.push(() => {
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("stalled", seekToLive);
        video.removeEventListener("waiting", seekToLive);
        document.removeEventListener("visibilitychange", onVisible);
      });

      player.attachMedia(video);
      player.on(Hls.Events.MEDIA_ATTACHED, () => player.loadSource(src));
      player.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      let renewing = false;
      player.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) seekToLive();
          return;
        }
        const status = data.response?.code ?? null;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (status === 401 && !renewing) {
            // The access token expired mid-stream: renew it, then resume.
            renewing = true;
            apiClient.renewAccessToken().then((ok) => {
              renewing = false;
              if (cancelled || !hls) return;
              if (ok) {
                player.startLoad();
              } else {
                setState("error");
                setMessage(t("liveVideo.player.error"));
                onFatalRef.current?.(401);
                teardown();
              }
            });
            return;
          }
          if (status === 403 || status === 404) {
            // No viewing session any more, or streaming was turned off.
            setState("error");
            setMessage(t("liveVideo.player.error"));
            onFatalRef.current?.(status);
            teardown();
            return;
          }
          // startLoad() resumes from the last position, which after an outage
          // is stale by however long the outage lasted; restart at the edge.
          player.startLoad();
          seekToLive();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          player.recoverMediaError();
          seekToLive();
          return;
        }
        setState("error");
        setMessage(t("liveVideo.player.error"));
        onFatalRef.current?.(status);
        teardown();
      });
    })();

    return () => {
      cancelled = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, active]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        muted
        playsInline
        controls={controls && state === "playing"}
        className="h-full w-full object-contain"
      />
      {state !== "playing" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-3 text-center text-xs text-white/70">
          {state === "idle" && t("liveVideo.player.idle")}
          {state === "loading" && t("liveVideo.player.loading")}
          {state === "error" && (message ?? t("liveVideo.player.error"))}
        </div>
      )}
    </div>
  );
}

/** Reports whether an element is on screen (with a margin), for lazy tiles. */
export function useOnScreen<T extends Element>(ref: React.RefObject<T | null>, rootMargin = "100px") {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

/** True while the browser tab is visible. */
export function usePageVisible() {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
