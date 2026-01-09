"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle, AlertCircle, Copy, Info } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface PersonEntity {
  name: string;
  role: string;
  age?: string;
  gender?: string;
  phone?: string;
  address?: string;
}

interface PropertyEntity {
  item: string;
  description?: string;
  quantity?: number;
  value?: string;
}

interface IncidentEntity {
  date?: string;
  time?: string;
  time_approximate?: boolean;
}

interface ExtractedData {
  complainant?: PersonEntity;
  accused: PersonEntity[];
  witnesses: PersonEntity[];
  incident?: IncidentEntity;
  property_items: PropertyEntity[];
  vehicles: string[];
  phone_numbers: string[];
  currency_amounts: string[];
  summary: string;
}

interface NLPExtractorProps {
  text: string;
  onExtracted: (data: ExtractedData) => void;
  onApplyField: (field: string, value: string) => void;
  nlpServiceUrl?: string;
  className?: string;
}

export function NLPExtractor({
  text,
  onExtracted,
  onApplyField,
  nlpServiceUrl = process.env.NEXT_PUBLIC_NLP_SERVICE_URL || "http://localhost:8005",
  className,
}: NLPExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractEntities = async () => {
    if (!text || text.length < 10) {
      setError("Please enter at least 10 characters in the description");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${nlpServiceUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, extract_summary: true }),
      });

      if (!response.ok) {
        throw new Error(`NLP service error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data);
        onExtracted(result.data);
      } else {
        throw new Error("Failed to extract entities");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process text";
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Extract Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={extractEntities}
          disabled={isProcessing || !text || text.length < 10}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Auto-Extract
            </>
          )}
        </Button>
        <span className="text-xs text-foreground-muted">
          Extract complainant, accused, dates, and property from description
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Extracted Data Display */}
      {extractedData && (
        <div className="p-4 rounded-lg bg-background-tertiary border border-border space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">AI Extracted Information</span>
            <Badge variant="info" className="text-xs ml-auto">Review before applying</Badge>
          </div>

          {/* Summary */}
          {extractedData.summary && (
            <div className="p-3 bg-background-secondary rounded-md">
              <div className="text-xs text-foreground-muted mb-1">Summary</div>
              <p className="text-sm text-foreground">{extractedData.summary}</p>
            </div>
          )}

          {/* Complainant */}
          {extractedData.complainant && (
            <ExtractedField
              label="Complainant Name"
              value={extractedData.complainant.name}
              onApply={() => onApplyField("complainantName", extractedData.complainant!.name)}
            />
          )}

          {/* Accused */}
          {extractedData.accused.length > 0 && (
            <ExtractedField
              label="Accused"
              value={extractedData.accused.map(a => a.name).join(", ")}
              onApply={() => onApplyField("accusedDetails", extractedData.accused.map(a => a.name).join(", "))}
            />
          )}

          {/* Incident Date/Time */}
          {extractedData.incident && (
            <>
              {extractedData.incident.date && (
                <ExtractedField
                  label="Incident Date"
                  value={extractedData.incident.date}
                  onApply={() => onApplyField("incidentDate", extractedData.incident!.date!)}
                />
              )}
              {extractedData.incident.time && (
                <ExtractedField
                  label="Incident Time"
                  value={extractedData.incident.time}
                  onApply={() => onApplyField("incidentTime", extractedData.incident!.time!)}
                />
              )}
            </>
          )}

          {/* Phone Numbers */}
          {extractedData.phone_numbers.length > 0 && (
            <ExtractedField
              label="Phone Numbers"
              value={extractedData.phone_numbers.join(", ")}
              onApply={() => onApplyField("complainantPhone", extractedData.phone_numbers[0])}
            />
          )}

          {/* Vehicle Numbers */}
          {extractedData.vehicles.length > 0 && (
            <ExtractedField
              label="Vehicle Numbers"
              value={extractedData.vehicles.join(", ")}
            />
          )}

          {/* Currency Amounts */}
          {extractedData.currency_amounts.length > 0 && (
            <ExtractedField
              label="Currency Amounts"
              value={extractedData.currency_amounts.join(", ")}
            />
          )}

          {/* Property Items */}
          {extractedData.property_items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-foreground-muted">Property Items</div>
              <div className="flex flex-wrap gap-2">
                {extractedData.property_items.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item.item}
                    {item.value && ` (${item.value})`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-2 p-2 rounded bg-background-secondary text-xs text-foreground-muted">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Click "Apply" to fill the corresponding form field. AI extraction is advisory - verify all information.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for extracted fields
function ExtractedField({
  label,
  value,
  onApply,
}: {
  label: string;
  value: string;
  onApply?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <div className="text-xs text-foreground-muted">{label}</div>
        <div className="text-sm text-foreground font-medium">{value}</div>
      </div>
      {onApply && (
        <Button type="button" variant="ghost" size="sm" onClick={onApply}>
          <Copy className="h-3 w-3 mr-1" />
          Apply
        </Button>
      )}
    </div>
  );
}
