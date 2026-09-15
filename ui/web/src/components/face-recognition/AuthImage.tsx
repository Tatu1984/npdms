"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import faceRecognitionApi from "@/lib/api/face-recognition";
import { cn } from "@/lib/utils";

/**
 * An image the API serves only to a signed-in officer. It is fetched with the
 * officer's token and shown from an object URL that is released on unmount.
 */
export function AuthImage({
  path,
  alt,
  className,
  box,
}: {
  path: string;
  alt: string;
  className?: string;
  /** Optional face box (in image pixels) drawn over the image. */
  box?: { x: number; y: number; w: number; h: number; width: number; height: number };
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    setFailed(false);
    faceRecognitionApi
      .fetchImage(path)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !revoked && setFailed(true));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-background-secondary text-foreground-subtle", className)}>
        <ImageOff className="h-5 w-5" aria-label={alt} />
      </div>
    );
  }
  if (!url) return <div className={cn("animate-pulse bg-background-secondary", className)} />;
  if (!box) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={cn("object-cover", className)} />;
  }
  return (
    <div className={cn("relative", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-auto w-full" />
      <div
        className="pointer-events-none absolute border-2 border-warning"
        style={{
          left: `${(box.x / box.width) * 100}%`,
          top: `${(box.y / box.height) * 100}%`,
          width: `${(box.w / box.width) * 100}%`,
          height: `${(box.h / box.height) * 100}%`,
        }}
      />
    </div>
  );
}
