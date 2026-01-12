'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LegacySelect as Select } from '@/components/ui/select';
import { useToastStore } from '@/stores/toastStore';
import {
  ArrowLeft,
  Link2,
  Shield,
  Server,
  Key,
  Check,
  AlertTriangle,
  Globe,
  Building2,
} from 'lucide-react';

const agencyTypes = [
  { value: 'NATIONAL', label: 'National Agency' },
  { value: 'STATE', label: 'State Agency' },
  { value: 'LOCAL', label: 'Local Authority' },
  { value: 'INTERNATIONAL', label: 'International Agency' },
];

const dataCategories = [
  { value: 'FIR', label: 'FIR Records' },
  { value: 'CRIMINAL_RECORDS', label: 'Criminal Records' },
  { value: 'VEHICLE_DATA', label: 'Vehicle Data' },
  { value: 'LICENSE_DATA', label: 'License Data' },
  { value: 'FINGERPRINTS', label: 'Fingerprints' },
  { value: 'MISSING_PERSONS', label: 'Missing Persons' },
  { value: 'AADHAAR_VERIFICATION', label: 'Aadhaar Verification' },
  { value: 'PAN_VERIFICATION', label: 'PAN Verification' },
  { value: 'CRIME_STATS', label: 'Crime Statistics' },
];

const authMethods = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
  { value: 'CERTIFICATE', label: 'Certificate-Based' },
  { value: 'JWT', label: 'JWT Token' },
];

export default function NewConnectionPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDataCategories, setSelectedDataCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    agencyName: '',
    agencyType: '',
    agencyCode: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    apiEndpoint: '',
    authMethod: 'API_KEY',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    webhookUrl: '',
    description: '',
    agreementNumber: '',
    agreementDate: '',
    expiryDate: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDataCategory = (category: string) => {
    setSelectedDataCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    addToast({
      type: 'success',
      title: 'Connection Request Sent',
      message: `Request to connect with ${formData.agencyName} has been submitted for approval`,
    });

    setIsSubmitting(false);
    router.push('/inter-agency');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">New Agency Connection</h1>
              <p className="text-foreground-muted">Setup API integration with another agency</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agency Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Agency Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Agency Name *"
                      value={formData.agencyName}
                      onChange={(v: string) => handleChange('agencyName', v)}
                      placeholder="e.g., National Crime Records Bureau"
                      required
                    />
                    <Select
                      label="Agency Type *"
                      value={formData.agencyType}
                      onChange={(v: string) => handleChange('agencyType', v)}
                      options={agencyTypes}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Agency Code"
                      value={formData.agencyCode}
                      onChange={(v: string) => handleChange('agencyCode', v)}
                      placeholder="Unique agency identifier"
                    />
                    <Input
                      label="Contact Person *"
                      value={formData.contactPerson}
                      onChange={(v: string) => handleChange('contactPerson', v)}
                      placeholder="Technical contact name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Contact Email *"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(v: string) => handleChange('contactEmail', v)}
                      placeholder="api-support@agency.gov.in"
                      required
                    />
                    <Input
                      label="Contact Phone"
                      value={formData.contactPhone}
                      onChange={(v: string) => handleChange('contactPhone', v)}
                      placeholder="Phone number"
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={formData.description}
                    onChange={(v: string) => handleChange('description', v)}
                    placeholder="Brief description of the integration purpose..."
                    rows={2}
                  />
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="API Endpoint URL *"
                    value={formData.apiEndpoint}
                    onChange={(v: string) => handleChange('apiEndpoint', v)}
                    placeholder="https://api.agency.gov.in/v1"
                    required
                  />
                  <Select
                    label="Authentication Method *"
                    value={formData.authMethod}
                    onChange={(v: string) => handleChange('authMethod', v)}
                    options={authMethods}
                  />

                  {formData.authMethod === 'API_KEY' && (
                    <Input
                      label="API Key"
                      value={formData.apiKey}
                      onChange={(v: string) => handleChange('apiKey', v)}
                      placeholder="Enter API key (or leave blank if pending)"
                      type="password"
                    />
                  )}

                  {formData.authMethod === 'OAUTH2' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Client ID"
                        value={formData.clientId}
                        onChange={(v: string) => handleChange('clientId', v)}
                        placeholder="OAuth Client ID"
                      />
                      <Input
                        label="Client Secret"
                        value={formData.clientSecret}
                        onChange={(v: string) => handleChange('clientSecret', v)}
                        placeholder="OAuth Client Secret"
                        type="password"
                      />
                    </div>
                  )}

                  <Input
                    label="Webhook URL (Optional)"
                    value={formData.webhookUrl}
                    onChange={(v: string) => handleChange('webhookUrl', v)}
                    placeholder="URL to receive real-time notifications"
                  />
                </CardContent>
              </Card>

              {/* Data Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data Sharing Agreement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Agreement Number"
                      value={formData.agreementNumber}
                      onChange={(v: string) => handleChange('agreementNumber', v)}
                      placeholder="MOU/Agreement reference"
                    />
                    <Input
                      label="Agreement Date"
                      type="date"
                      value={formData.agreementDate}
                      onChange={(v: string) => handleChange('agreementDate', v)}
                    />
                  </div>
                  <Input
                    label="Expiry Date"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(v: string) => handleChange('expiryDate', v)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data Categories to Share
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {dataCategories.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => toggleDataCategory(category.value)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                            selectedDataCategories.includes(category.value)
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border bg-background-secondary text-foreground-muted hover:text-foreground'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              selectedDataCategories.includes(category.value)
                                ? 'border-accent bg-accent'
                                : 'border-foreground-muted'
                            }`}
                          >
                            {selectedDataCategories.includes(category.value) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Security Notice */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning">Security Notice</p>
                      <ul className="text-sm text-foreground-muted mt-2 space-y-1 list-disc list-inside">
                        <li>Verify agency authenticity</li>
                        <li>Use encrypted connections (HTTPS)</li>
                        <li>Store credentials securely</li>
                        <li>Review data sharing policies</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Integration Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs">1</div>
                      <span>Submit connection request</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-background-tertiary text-foreground-muted flex items-center justify-center text-xs">2</div>
                      <span>Admin approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-background-tertiary text-foreground-muted flex items-center justify-center text-xs">3</div>
                      <span>API credential exchange</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-background-tertiary text-foreground-muted flex items-center justify-center text-xs">4</div>
                      <span>Connection testing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-background-tertiary text-foreground-muted flex items-center justify-center text-xs">5</div>
                      <span>Go live</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Submit Connection Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
