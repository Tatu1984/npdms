"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, FileText, X, CheckCircle, AlertCircle, Languages, Tag, Zap } from "lucide-react";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  position?: {
    start: number;
    end: number;
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  document_type?: string;
  document_confidence?: number;
  entities?: ExtractedEntity[];
  pages?: number;
  processing_time_ms: number;
}

interface DocumentScannerProps {
  onTextExtracted: (result: OCRResult) => void;
  onError?: (error: string) => void;
  apiBaseUrl?: string;
  defaultLanguage?: string;
  extractEntities?: boolean;
  classifyDocument?: boolean;
  enhanceImage?: boolean;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "hin", name: "Hindi" },
  { code: "ben", name: "Bengali" },
  { code: "tel", name: "Telugu" },
  { code: "mar", name: "Marathi" },
  { code: "tam", name: "Tamil" },
  { code: "guj", name: "Gujarati" },
  { code: "kan", name: "Kannada" },
  { code: "mal", name: "Malayalam" },
  { code: "pan", name: "Punjabi" },
  { code: "ori", name: "Odia" },
  { code: "urd", name: "Urdu" },
];

const DOCUMENT_TYPES: Record<string, { label: string; color: string }> = {
  FIR: { label: "FIR", color: "bg-red-100 text-red-700" },
  CHARGE_SHEET: { label: "Charge Sheet", color: "bg-orange-100 text-orange-700" },
  COURT_ORDER: { label: "Court Order", color: "bg-purple-100 text-purple-700" },
  WARRANT: { label: "Warrant", color: "bg-red-100 text-red-700" },
  BAIL_APPLICATION: { label: "Bail Application", color: "bg-blue-100 text-blue-700" },
  EVIDENCE_REPORT: { label: "Evidence Report", color: "bg-green-100 text-green-700" },
  WITNESS_STATEMENT: { label: "Witness Statement", color: "bg-yellow-100 text-yellow-700" },
  ID_DOCUMENT: { label: "ID Document", color: "bg-indigo-100 text-indigo-700" },
  VEHICLE_DOCUMENT: { label: "Vehicle Document", color: "bg-cyan-100 text-cyan-700" },
  FINANCIAL_DOCUMENT: { label: "Financial Document", color: "bg-emerald-100 text-emerald-700" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-700" },
};

const ENTITY_LABELS: Record<string, string> = {
  fir_number: "FIR Number",
  case_number: "Case Number",
  date: "Date",
  aadhaar: "Aadhaar Number",
  pan: "PAN Number",
  phone: "Phone Number",
  vehicle_number: "Vehicle Number",
  ipc_section: "IPC Section",
  pincode: "PIN Code",
  email: "Email",
  amount: "Amount",
  PERSON: "Person",
  ORG: "Organization",
  GPE: "Location",
  DATE: "Date",
  MONEY: "Amount",
};

export function DocumentScanner({
  onTextExtracted,
  onError,
  apiBaseUrl = "/api/v1/ocr",
  defaultLanguage = "eng",
  extractEntities = true,
  classifyDocument = true,
  enhanceImage = true,
  className,
}: DocumentScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([defaultLanguage]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(code)) {
        return prev.length > 1 ? prev.filter((l) => l !== code) : prev;
      }
      return [...prev, code];
    });
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/tiff", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      const errorMsg = "Please select an image (JPG, PNG, TIFF, WebP) or PDF file";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    await processFile(file);
  }, [selectedLanguages, extractEntities, classifyDocument, enhanceImage, onError, onTextExtracted]);

  const processFile = async (file: File | Blob, filename?: string) => {
    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file, filename || "document");
      formData.append("languages", selectedLanguages.join(","));
      formData.append("extract_entities", extractEntities.toString());
      formData.append("classify_document", classifyDocument.toString());
      formData.append("enhance_image", enhanceImage.toString());

      const response = await fetch(`${apiBaseUrl}/extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `OCR service error: ${response.statusText}`);
      }

      const result: OCRResult = await response.json();
      setOcrResult(result);

      if (result.text) {
        onTextExtracted(result);
      } else {
        throw new Error("OCR failed to extract text from the document");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process document";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const errorMsg = "Failed to access camera. Please check permissions.";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        setPreview(canvas.toDataURL("image/jpeg"));
        stopCamera();
        await processFile(blob, "captured_document.jpg");
      }
    }, "image/jpeg", 0.95);
  }, [stream, selectedLanguages, extractEntities, classifyDocument, enhanceImage]);

  const reset = () => {
    setPreview(null);
    setOcrResult(null);
    setError(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="text-sm"
        >
          <Languages className="h-4 w-4 mr-2" />
          Languages ({selectedLanguages.length})
        </Button>
        {showLanguageSelector && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => toggleLanguage(lang.code)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedLanguages.includes(lang.code)
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!preview && !showCamera && (
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={startCamera}>
            <Camera className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg border border-gray-200"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button type="button" onClick={captureImage}>
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
            <Button type="button" variant="secondary" onClick={stopCamera}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Image Preview */}
      {preview && (
        <div className="relative">
          <img src={preview} alt="Document preview" className="w-full rounded-lg border border-gray-200" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80"
            onClick={reset}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Processing document with OCR...</span>
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && ocrResult.text && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Text Extracted Successfully
              </CardTitle>
              <div className="flex gap-2">
                {ocrResult.pages && (
                  <Badge variant="outline" className="text-xs">
                    {ocrResult.pages} page{ocrResult.pages > 1 ? "s" : ""}
                  </Badge>
                )}
                <Badge
                  variant={ocrResult.confidence >= 0.7 ? "success" : "warning"}
                  className="text-xs"
                >
                  {(ocrResult.confidence * 100).toFixed(0)}% confidence
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {ocrResult.processing_time_ms}ms
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-3 space-y-4">
            {/* Document Type */}
            {ocrResult.document_type && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Document Type:</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${DOCUMENT_TYPES[ocrResult.document_type]?.color || "bg-gray-100 text-gray-700"}`}>
                  {DOCUMENT_TYPES[ocrResult.document_type]?.label || ocrResult.document_type}
                </span>
                {ocrResult.document_confidence && (
                  <span className="text-xs text-gray-500">
                    ({(ocrResult.document_confidence * 100).toFixed(0)}% match)
                  </span>
                )}
              </div>
            )}

            {/* Extracted Text */}
            <div className="p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{ocrResult.text}</p>
            </div>

            {/* Extracted Entities */}
            {ocrResult.entities && ocrResult.entities.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Extracted Entities</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ocrResult.entities.map((entity, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 bg-blue-50 rounded-lg text-xs border border-blue-100"
                    >
                      <span className="text-blue-600 font-medium">
                        {ENTITY_LABELS[entity.type] || entity.type}:
                      </span>{" "}
                      <span className="text-gray-700">{entity.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={reset} className="ml-auto">
            Try Again
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!preview && !showCamera && !isProcessing && (
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p>Scan or upload documents to extract text automatically using OCR.</p>
              <p>Supports images (JPG, PNG, TIFF, WebP) and PDF files. For best results:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Ensure good lighting and clear focus</li>
                <li>Include all text in the frame</li>
                <li>Select appropriate languages for multi-lingual documents</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
