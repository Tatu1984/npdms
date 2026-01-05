/**
 * OCR Test Component
 * Allows uploading images and extracting text using the OCR service
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface OCRResult {
  text: string;
  confidence: number;
  bbox: number[][];
}

interface OCRResponse {
  success: boolean;
  full_text: string;
  results: OCRResult[];
  total_words: number;
  average_confidence: number;
  languages_detected: string[];
}

export function OCRTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/ml/ocr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.statusText}`);
      }

      const data: OCRResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          OCR Text Extraction (Demo)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <input
            type="file"
            id="ocr-file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <label htmlFor="ocr-file" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-3 text-foreground-muted" />
            <p className="text-foreground-secondary mb-2">
              Click to upload an image
            </p>
            <p className="text-sm text-foreground-muted">
              Supports: JPG, PNG (English + Hindi text)
            </p>
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-3">
            <h4 className="font-medium">Selected Image:</h4>
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 w-auto mx-auto border border-border rounded"
            />
            <Button
              onClick={handleExtractText}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting Text...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Extract Text
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Extraction Complete - {result.total_words} words detected
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-tertiary p-3 rounded">
                <div className="text-sm text-foreground-muted">Confidence</div>
                <div className="text-lg font-semibold">
                  {(result.average_confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-background-tertiary p-3 rounded">
                <div className="text-sm text-foreground-muted">Languages</div>
                <div className="text-lg font-semibold">
                  {result.languages_detected.join(', ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Extracted Text */}
            <div className="space-y-2">
              <h4 className="font-medium">Extracted Text:</h4>
              <div className="bg-background-tertiary p-4 rounded border border-border max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap">{result.full_text}</p>
              </div>
            </div>

            {/* Individual Results */}
            <details className="group">
              <summary className="cursor-pointer font-medium text-sm text-foreground-secondary hover:text-foreground-primary">
                View Individual Text Regions ({result.results.length})
              </summary>
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {result.results.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-background-tertiary p-2 rounded text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <span className="flex-1">{item.text}</span>
                      <span className="text-xs text-foreground-muted ml-2">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-danger bg-danger/10 p-3 rounded">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
