"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Fingerprint,
  Camera,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type BiometricType = "FINGERPRINT" | "FACE" | "IRIS" | "AADHAAR";

export type BiometricPurpose =
  | "EVIDENCE_ACCESS"
  | "WEAPON_ACCESS"
  | "SUSPECT_IDENTIFY"
  | "CUSTODY_TRANSFER"
  | "SENSITIVE_OPERATION"
  | "AUTHENTICATION";

interface BiometricScannerProps {
  type: BiometricType;
  purpose: BiometricPurpose;
  subjectId?: string;
  resourceId?: string;
  resourceType?: string;
  onVerified?: (result: VerificationResult) => void;
  onFailed?: (error: string) => void;
  onCapture?: (data: string) => void;
  autoVerify?: boolean;
  showHistory?: boolean;
  className?: string;
}

interface VerificationResult {
  verified: boolean;
  matchScore: number;
  confidence: number;
  matchedId?: string;
  message: string;
  verification?: {
    id: string;
    status: string;
  };
}

type ScannerStatus = "idle" | "scanning" | "processing" | "success" | "failed";

export function BiometricScanner({
  type,
  purpose,
  subjectId,
  resourceId,
  resourceType,
  onVerified,
  onFailed,
  onCapture,
  autoVerify = true,
  showHistory = false,
  className = "",
}: BiometricScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getTypeIcon = () => {
    switch (type) {
      case "FINGERPRINT":
        return <Fingerprint className="h-8 w-8" />;
      case "FACE":
        return <Camera className="h-8 w-8" />;
      case "IRIS":
        return <Eye className="h-8 w-8" />;
      case "AADHAAR":
        return <ShieldCheck className="h-8 w-8" />;
      default:
        return <Fingerprint className="h-8 w-8" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "FINGERPRINT":
        return "Fingerprint Scanner";
      case "FACE":
        return "Face Recognition";
      case "IRIS":
        return "Iris Scanner";
      case "AADHAAR":
        return "Aadhaar Verification";
      default:
        return "Biometric Scanner";
    }
  };

  const getPurposeLabel = () => {
    switch (purpose) {
      case "EVIDENCE_ACCESS":
        return "Evidence Access";
      case "WEAPON_ACCESS":
        return "Weapon Access";
      case "SUSPECT_IDENTIFY":
        return "Suspect Identification";
      case "CUSTODY_TRANSFER":
        return "Custody Transfer";
      case "SENSITIVE_OPERATION":
        return "Sensitive Operation";
      case "AUTHENTICATION":
        return "Authentication";
      default:
        return purpose;
    }
  };

  const startCamera = useCallback(async () => {
    if (type !== "FACE" && type !== "IRIS") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError("Failed to access camera. Please ensure camera permissions are granted.");
    }
  }, [type]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (type === "FACE" || type === "IRIS") {
      startCamera();
    }
    return () => stopCamera();
  }, [type, startCamera, stopCamera]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  }, []);

  const simulateFingerprint = useCallback(() => {
    // Simulate fingerprint capture - in production, this would interface with hardware
    return new Promise<string>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setCountdown(5 - Math.floor(progress / 20));
        if (progress >= 100) {
          clearInterval(interval);
          // Return mock base64 fingerprint data
          resolve(btoa("mock_fingerprint_data_" + Date.now()));
        }
      }, 500);
    });
  }, []);

  const handleScan = async () => {
    setStatus("scanning");
    setError(null);
    setResult(null);

    try {
      let biometricData: string;

      if (type === "FACE" || type === "IRIS") {
        setCountdown(3);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdown(2);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdown(1);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdown(0);

        const captured = captureImage();
        if (!captured) {
          throw new Error("Failed to capture image");
        }
        biometricData = captured;
      } else {
        setCountdown(5);
        biometricData = await simulateFingerprint();
      }

      setCapturedData(biometricData);
      onCapture?.(biometricData);

      if (autoVerify) {
        await verifyBiometric(biometricData);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Scan failed";
      setError(errorMessage);
      setStatus("failed");
      onFailed?.(errorMessage);
    }
  };

  const verifyBiometric = async (data: string) => {
    setStatus("processing");

    try {
      const response = await fetch("/api/v1/biometric/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          purpose,
          biometricData: data,
          subjectId,
          resourceId,
          resourceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification request failed");
      }

      const verificationResult: VerificationResult = await response.json();
      setResult(verificationResult);

      if (verificationResult.verified) {
        setStatus("success");
        onVerified?.(verificationResult);
      } else {
        setStatus("failed");
        setError(verificationResult.message || "Verification failed");
        onFailed?.(verificationResult.message || "Verification failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      setError(errorMessage);
      setStatus("failed");
      onFailed?.(errorMessage);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setCapturedData(null);
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-success";
      case "failed":
        return "text-error";
      case "scanning":
      case "processing":
        return "text-warning";
      default:
        return "text-foreground-muted";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getTypeIcon()}
            {getTypeLabel()}
          </span>
          <Badge variant="muted">{getPurposeLabel()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scanner Display */}
          <div className="relative aspect-video bg-background-tertiary rounded-lg overflow-hidden flex items-center justify-center">
            {(type === "FACE" || type === "IRIS") && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${status === "success" ? "opacity-50" : ""}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay */}
                {status === "scanning" && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-6xl font-bold text-white">{countdown}</div>
                  </div>
                )}
              </>
            )}

            {type === "FINGERPRINT" && (
              <div className="flex flex-col items-center justify-center p-8">
                <div className={`relative ${status === "scanning" ? "animate-pulse" : ""}`}>
                  <Fingerprint className={`h-32 w-32 ${getStatusColor()}`} />
                  {status === "scanning" && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{countdown}</span>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-foreground-muted">
                  {status === "idle" && "Place finger on scanner"}
                  {status === "scanning" && "Scanning fingerprint..."}
                  {status === "processing" && "Verifying..."}
                  {status === "success" && "Fingerprint verified"}
                  {status === "failed" && "Verification failed"}
                </p>
              </div>
            )}

            {type === "AADHAAR" && (
              <div className="flex flex-col items-center justify-center p-8">
                <ShieldCheck className={`h-32 w-32 ${getStatusColor()}`} />
                <p className="mt-4 text-sm text-foreground-muted">
                  Aadhaar Biometric Verification
                </p>
              </div>
            )}

            {/* Status Overlay */}
            {status === "success" && (
              <div className="absolute inset-0 flex items-center justify-center bg-success/20">
                <div className="bg-background p-4 rounded-full">
                  <CheckCircle className="h-16 w-16 text-success" />
                </div>
              </div>
            )}

            {status === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-error/20">
                <div className="bg-background p-4 rounded-full">
                  <XCircle className="h-16 w-16 text-error" />
                </div>
              </div>
            )}

            {status === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-lg ${result.verified ? "bg-success/10" : "bg-error/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.verified ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-error" />
                )}
                <span className={`font-semibold ${result.verified ? "text-success" : "text-error"}`}>
                  {result.verified ? "Verification Successful" : "Verification Failed"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-foreground-muted">Match Score:</span>
                  <span className="ml-2 font-medium">{(result.matchScore * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-foreground-muted">Confidence:</span>
                  <span className="ml-2 font-medium">{result.confidence.toFixed(1)}%</span>
                </div>
              </div>
              {result.message && (
                <p className="mt-2 text-sm text-foreground-muted">{result.message}</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-error/10 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-error">Error</p>
                <p className="text-sm text-foreground-muted">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status === "idle" && (
              <Button onClick={handleScan} className="flex-1">
                {type === "FACE" || type === "IRIS" ? (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Scan
                  </>
                )}
              </Button>
            )}

            {(status === "success" || status === "failed") && (
              <Button onClick={handleRetry} variant="secondary" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}

            {status === "scanning" && (
              <Button disabled className="flex-1">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </Button>
            )}

            {status === "processing" && (
              <Button disabled className="flex-1">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </Button>
            )}
          </div>

          {/* Manual Verify Button (if autoVerify is false) */}
          {!autoVerify && capturedData && status === "idle" && (
            <Button
              onClick={() => verifyBiometric(capturedData)}
              variant="primary"
              className="w-full"
            >
              Verify Captured Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BiometricScanner;
