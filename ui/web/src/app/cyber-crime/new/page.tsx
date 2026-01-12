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
import { LocationPicker, type LocationData } from '@/components/ui/LocationPicker';
import {
  Shield,
  ArrowLeft,
  User,
  Globe,
  DollarSign,
  FileText,
  Upload,
  AlertTriangle,
  Check,
} from 'lucide-react';

const crimeTypes = [
  { value: 'PHISHING', label: 'Phishing Attack' },
  { value: 'ONLINE_FRAUD', label: 'Online Fraud' },
  { value: 'IDENTITY_THEFT', label: 'Identity Theft' },
  { value: 'RANSOMWARE', label: 'Ransomware Attack' },
  { value: 'CYBER_STALKING', label: 'Cyber Stalking' },
  { value: 'HACKING', label: 'Hacking / Unauthorized Access' },
  { value: 'DATA_BREACH', label: 'Data Breach' },
  { value: 'CRYPTO_FRAUD', label: 'Cryptocurrency Fraud' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media Crime' },
  { value: 'EMAIL_FRAUD', label: 'Email Fraud' },
  { value: 'OTP_FRAUD', label: 'OTP/UPI Fraud' },
  { value: 'OTHER', label: 'Other' },
];

const platforms = [
  { value: 'BANKING', label: 'Banking/UPI' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'ECOMMERCE', label: 'E-Commerce' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
  { value: 'GAMING', label: 'Online Gaming' },
  { value: 'DATING', label: 'Dating Apps' },
  { value: 'MESSAGING', label: 'Messaging Apps' },
  { value: 'OTHER', label: 'Other' },
];

const priorities = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function NewCyberCrimePage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const [formData, setFormData] = useState({
    // Complainant Details
    complainantName: '',
    complainantPhone: '',
    complainantEmail: '',
    complainantAddress: '',
    // Incident Details
    crimeType: '',
    platform: '',
    priority: 'MEDIUM',
    incidentDate: '',
    incidentTime: '',
    description: '',
    // Financial Details
    financialLoss: '',
    bankName: '',
    accountNumber: '',
    transactionIds: '',
    // Suspect Details
    suspectInfo: '',
    suspectPhone: '',
    suspectEmail: '',
    suspectAccount: '',
    // Evidence
    websiteUrls: '',
    ipAddresses: '',
    screenshots: [] as File[],
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const caseNumber = `CYBER/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    addToast({
      type: 'success',
      title: 'Cyber Crime Reported',
      message: `Case ${caseNumber} has been registered successfully`,
    });

    setIsSubmitting(false);
    router.push('/cyber-crime');
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
              <h1 className="text-2xl font-bold text-foreground">Report Cyber Crime</h1>
              <p className="text-foreground-muted">File a new cyber crime complaint</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complainant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Complainant Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      value={formData.complainantName}
                      onChange={(v: string) => handleChange('complainantName', v)}
                      placeholder="Enter full name"
                      required
                    />
                    <Input
                      label="Phone Number *"
                      value={formData.complainantPhone}
                      onChange={(v: string) => handleChange('complainantPhone', v)}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.complainantEmail}
                    onChange={(v: string) => handleChange('complainantEmail', v)}
                    placeholder="email@example.com"
                  />
                  <LocationPicker
                    label="Address"
                    value={formData.complainantAddress}
                    onChange={(address, data) => {
                      handleChange('complainantAddress', address);
                      if (data) setLocationData(data);
                    }}
                    placeholder="Enter address, search, or use auto-detect"
                    showMap={false}
                  />
                </CardContent>
              </Card>

              {/* Incident Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Incident Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Crime Type *"
                      value={formData.crimeType}
                      onChange={(v: string) => handleChange('crimeType', v)}
                      options={crimeTypes}
                    />
                    <Select
                      label="Platform/Medium *"
                      value={formData.platform}
                      onChange={(v: string) => handleChange('platform', v)}
                      options={platforms}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Incident Date *"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(v: string) => handleChange('incidentDate', v)}
                      required
                    />
                    <Input
                      label="Incident Time"
                      type="time"
                      value={formData.incidentTime}
                      onChange={(v: string) => handleChange('incidentTime', v)}
                    />
                    <Select
                      label="Priority"
                      value={formData.priority}
                      onChange={(v: string) => handleChange('priority', v)}
                      options={priorities}
                    />
                  </div>
                  <Textarea
                    label="Detailed Description *"
                    value={formData.description}
                    onChange={(v: string) => handleChange('description', v)}
                    placeholder="Describe how the incident occurred, what happened, and any other relevant details..."
                    rows={5}
                  />
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Details (if applicable)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Financial Loss (Rs.)"
                      type="number"
                      value={formData.financialLoss}
                      onChange={(v: string) => handleChange('financialLoss', v)}
                      placeholder="Amount lost"
                    />
                    <Input
                      label="Bank Name"
                      value={formData.bankName}
                      onChange={(v: string) => handleChange('bankName', v)}
                      placeholder="Name of bank"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Account Number"
                      value={formData.accountNumber}
                      onChange={(v: string) => handleChange('accountNumber', v)}
                      placeholder="Your account number"
                    />
                    <Input
                      label="Transaction IDs"
                      value={formData.transactionIds}
                      onChange={(v: string) => handleChange('transactionIds', v)}
                      placeholder="Comma-separated transaction IDs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suspect Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Suspect Details (if known)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    label="Suspect Information"
                    value={formData.suspectInfo}
                    onChange={(v: string) => handleChange('suspectInfo', v)}
                    placeholder="Any known details about the suspect (name, profile links, etc.)"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Suspect Phone Number"
                      value={formData.suspectPhone}
                      onChange={(v: string) => handleChange('suspectPhone', v)}
                      placeholder="Phone number used by suspect"
                    />
                    <Input
                      label="Suspect Email"
                      value={formData.suspectEmail}
                      onChange={(v: string) => handleChange('suspectEmail', v)}
                      placeholder="Email used by suspect"
                    />
                  </div>
                  <Input
                    label="Suspect Bank/UPI Account"
                    value={formData.suspectAccount}
                    onChange={(v: string) => handleChange('suspectAccount', v)}
                    placeholder="Bank account or UPI ID where money was sent"
                  />
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Digital Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    label="Website URLs"
                    value={formData.websiteUrls}
                    onChange={(v: string) => handleChange('websiteUrls', v)}
                    placeholder="Enter any relevant website URLs (one per line)"
                    rows={2}
                  />
                  <Input
                    label="IP Addresses (if known)"
                    value={formData.ipAddresses}
                    onChange={(v: string) => handleChange('ipAddresses', v)}
                    placeholder="Comma-separated IP addresses"
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Upload Screenshots/Evidence
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-foreground-muted mb-2" />
                      <p className="text-sm text-foreground-muted">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        Supports: JPG, PNG, PDF (Max 10MB each)
                      </p>
                      <input type="file" className="hidden" multiple accept="image/*,.pdf" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Important Notice */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Important Notice</p>
                      <ul className="text-sm text-foreground-muted mt-2 space-y-1">
                        <li>Report within 24 hours for faster action</li>
                        <li>Do not delete any evidence</li>
                        <li>Take screenshots of all communications</li>
                        <li>Note down all transaction details</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Helpline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Cyber Crime Helpline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent">1930</p>
                    <p className="text-sm text-foreground-muted mt-1">
                      National Cyber Crime Helpline
                    </p>
                    <p className="text-xs text-foreground-muted mt-2">
                      Available 24x7
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-accent hover:underline"
                  >
                    National Cyber Crime Portal
                  </a>
                  <a
                    href="#"
                    className="block text-sm text-accent hover:underline"
                  >
                    Track Complaint Status
                  </a>
                  <a
                    href="#"
                    className="block text-sm text-accent hover:underline"
                  >
                    Cyber Safety Guidelines
                  </a>
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
                    <Check className="h-4 w-4 mr-2" />
                    Submit Complaint
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
