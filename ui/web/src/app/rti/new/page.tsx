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
  FileText,
  User,
  Mail,
  Clock,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';

const applicantTypes = [
  { value: 'CITIZEN', label: 'Indian Citizen' },
  { value: 'MEDIA', label: 'Media/Press' },
  { value: 'NGO', label: 'NGO/Organization' },
  { value: 'ADVOCATE', label: 'Advocate/Legal' },
  { value: 'OTHER', label: 'Other' },
];

const informationCategories = [
  { value: 'CASE_STATUS', label: 'Case/FIR Status' },
  { value: 'PERSONNEL', label: 'Personnel Information' },
  { value: 'BUDGET', label: 'Budget & Expenditure' },
  { value: 'PROCUREMENT', label: 'Procurement & Tenders' },
  { value: 'STATISTICS', label: 'Crime Statistics' },
  { value: 'POLICY', label: 'Policy Documents' },
  { value: 'COMPLAINT', label: 'Complaint Status' },
  { value: 'OTHER', label: 'Other' },
];

const modeOfReceipt = [
  { value: 'ONLINE', label: 'Online Portal' },
  { value: 'POST', label: 'By Post' },
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'EMAIL', label: 'Email' },
];

export default function NewRTIRequestPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Applicant Details
    applicantType: 'CITIZEN',
    applicantName: '',
    applicantAddress: '',
    applicantPhone: '',
    applicantEmail: '',
    isBPL: false,
    bplCardNumber: '',
    // Request Details
    category: '',
    subject: '',
    description: '',
    relatedFIR: '',
    dateRange: '',
    // Delivery
    modeOfReceipt: 'ONLINE',
    preferredLanguage: 'English',
    // Payment
    feeAmount: '10',
    feeReceiptNumber: '',
    feePaymentDate: '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const rtiNumber = `RTI/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    addToast({
      type: 'success',
      title: 'RTI Request Submitted',
      message: `Your RTI request ${rtiNumber} has been registered. Response due within 30 days.`,
    });

    setIsSubmitting(false);
    router.push('/rti');
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
              <h1 className="text-2xl font-bold text-foreground">New RTI Request</h1>
              <p className="text-foreground-muted">Submit a Right to Information request</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applicant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Applicant Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Applicant Type *"
                      value={formData.applicantType}
                      onChange={(v: string) => handleChange('applicantType', v)}
                      options={applicantTypes}
                    />
                    <Input
                      label="Full Name *"
                      value={formData.applicantName}
                      onChange={(v: string) => handleChange('applicantName', v)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <Textarea
                    label="Address *"
                    value={formData.applicantAddress}
                    onChange={(v: string) => handleChange('applicantAddress', v)}
                    placeholder="Complete postal address"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number *"
                      value={formData.applicantPhone}
                      onChange={(v: string) => handleChange('applicantPhone', v)}
                      placeholder="10-digit mobile number"
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={formData.applicantEmail}
                      onChange={(v: string) => handleChange('applicantEmail', v)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-background-secondary rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isBPL}
                        onChange={(e) => handleChange('isBPL', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">BPL (Below Poverty Line) Card Holder</span>
                    </label>
                    {formData.isBPL && (
                      <Input
                        placeholder="BPL Card Number"
                        value={formData.bplCardNumber}
                        onChange={(v: string) => handleChange('bplCardNumber', v)}
                        className="flex-1"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Information Requested */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Information Requested
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Category *"
                      value={formData.category}
                      onChange={(v: string) => handleChange('category', v)}
                      options={informationCategories}
                    />
                    <Input
                      label="Related FIR/Case Number"
                      value={formData.relatedFIR}
                      onChange={(v: string) => handleChange('relatedFIR', v)}
                      placeholder="e.g., KOR/2024/00123"
                    />
                  </div>
                  <Input
                    label="Subject *"
                    value={formData.subject}
                    onChange={(v: string) => handleChange('subject', v)}
                    placeholder="Brief subject of your request"
                    required
                  />
                  <Textarea
                    label="Details of Information Required *"
                    value={formData.description}
                    onChange={(v: string) => handleChange('description', v)}
                    placeholder="Please provide specific details of the information you are seeking. Be as specific as possible to ensure accurate response."
                    rows={6}
                  />
                  <Input
                    label="Time Period (if applicable)"
                    value={formData.dateRange}
                    onChange={(v: string) => handleChange('dateRange', v)}
                    placeholder="e.g., January 2023 to December 2023"
                  />
                </CardContent>
              </Card>

              {/* Delivery & Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Delivery & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Mode of Receipt *"
                      value={formData.modeOfReceipt}
                      onChange={(v: string) => handleChange('modeOfReceipt', v)}
                      options={modeOfReceipt}
                    />
                    <Select
                      label="Preferred Language"
                      value={formData.preferredLanguage}
                      onChange={(v: string) => handleChange('preferredLanguage', v)}
                      options={[
                        { value: 'English', label: 'English' },
                        { value: 'Hindi', label: 'Hindi' },
                        { value: 'Kannada', label: 'Kannada' },
                      ]}
                    />
                  </div>
                  {!formData.isBPL && (
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-3">Application Fee: Rs. 10/-</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Receipt Number"
                          value={formData.feeReceiptNumber}
                          onChange={(v: string) => handleChange('feeReceiptNumber', v)}
                          placeholder="Fee payment receipt number"
                        />
                        <Input
                          label="Payment Date"
                          type="date"
                          value={formData.feePaymentDate}
                          onChange={(v: string) => handleChange('feePaymentDate', v)}
                        />
                      </div>
                    </div>
                  )}
                  {formData.isBPL && (
                    <div className="p-3 bg-success/10 rounded-lg text-sm text-success">
                      Fee waived for BPL card holders as per RTI Act, 2005
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Timeline Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Response Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Normal Response</span>
                      <span className="font-medium text-foreground">30 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Life/Liberty matters</span>
                      <span className="font-medium text-foreground">48 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">First Appeal</span>
                      <span className="font-medium text-foreground">30 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Second Appeal</span>
                      <span className="font-medium text-foreground">90 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Card className="border-info/30 bg-info/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-info flex-shrink-0" />
                    <div>
                      <p className="font-medium text-info">Guidelines</p>
                      <ul className="text-sm text-foreground-muted mt-2 space-y-1 list-disc list-inside">
                        <li>Be specific about information needed</li>
                        <li>Mention relevant time period</li>
                        <li>One application per subject</li>
                        <li>Additional fees for copies</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning">Exemptions</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        Information affecting national security, ongoing investigations,
                        or personal privacy may be exempted under Section 8 of RTI Act.
                      </p>
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
                    <Check className="h-4 w-4 mr-2" />
                    Submit RTI Request
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
