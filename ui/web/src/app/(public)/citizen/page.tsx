'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Shield,
  ArrowRight,
  Upload
} from 'lucide-react';

// Complaint form validation schema
const complaintSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  subject: z
    .string()
    .min(10, 'Subject must be at least 10 characters')
    .max(200, 'Subject must be less than 200 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentLocation: z.string().max(500, 'Location must be less than 500 characters').optional(),
  name: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number (10 digits starting with 6-9)')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean(),
}).refine(
  (data) => data.isAnonymous || (data.name && data.name.length >= 2),
  { message: 'Name is required for non-anonymous complaints', path: ['name'] }
).refine(
  (data) => data.isAnonymous || (data.phone && data.phone.length === 10),
  { message: 'Phone number is required for non-anonymous complaints', path: ['phone'] }
);

type ComplaintFormData = z.infer<typeof complaintSchema>;

export default function CitizenPortalPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [complaintStatus, setComplaintStatus] = useState<any>(null);
  const [firStatus, setFirStatus] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // React Hook Form for complaint
  const {
    setValue,
    watch,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    reset,
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: '',
      subject: '',
      description: '',
      incidentDate: '',
      incidentLocation: '',
      name: '',
      phone: '',
      email: '',
      isAnonymous: false,
    },
  });

  const complaint = watch();

  const handleTrackComplaint = async () => {
    // Mock tracking
    setComplaintStatus({
      trackingNumber: trackingNumber || 'CMP/2024/001234',
      status: 'IN_PROGRESS',
      category: 'THEFT',
      subject: 'Mobile phone theft at bus stand',
      submittedAt: '2024-01-10T10:30:00',
      acknowledgedAt: '2024-01-10T14:00:00',
      stationName: 'Koramangala Police Station',
      updates: [
        { message: 'Complaint submitted successfully', date: '2024-01-10T10:30:00', isPublic: true },
        { message: 'Your complaint has been acknowledged', date: '2024-01-10T14:00:00', isPublic: true },
        { message: 'Investigation in progress', date: '2024-01-11T09:00:00', isPublic: true },
      ],
    });
  };

  const handleTrackFIR = async () => {
    // Mock FIR tracking
    setFirStatus({
      firNumber: firNumber || 'KOR/2024/00001',
      stationName: 'Koramangala Police Station',
      registrationDate: '2024-01-15',
      status: 'UNDER_INVESTIGATION',
      statusDescription: 'Investigation is in progress',
      lastUpdated: '2024-01-18',
      nextAction: 'Witness statements being recorded',
    });
  };

  const onSubmitComplaint = async (_data: ComplaintFormData) => {
    setIsSubmitting(true);

    // Mock submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      reset();
    }, 1500);
  };

  const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-gray-100 text-gray-800',
    ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
    ASSIGNED: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    UNDER_INVESTIGATION: 'bg-yellow-100 text-yellow-800',
    CHARGESHEET_FILED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Citizen Services Portal</h1>
              <p className="text-blue-200">Karnataka State Police</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">15,234</div>
              <div className="text-sm text-gray-500">Complaints Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">92%</div>
              <div className="text-sm text-gray-500">Resolution Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-600">3.5</div>
              <div className="text-sm text-gray-500">Avg. Resolution Days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-purple-600">456</div>
              <div className="text-sm text-gray-500">Missing Persons Found</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="file" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="file">File Complaint</TabsTrigger>
            <TabsTrigger value="track">Track Status</TabsTrigger>
            <TabsTrigger value="fir">FIR Status</TabsTrigger>
            <TabsTrigger value="missing">Missing Person</TabsTrigger>
          </TabsList>

          {/* File Complaint Tab */}
          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>File a Complaint</CardTitle>
                <CardDescription>
                  Submit your complaint online. You will receive a tracking number to monitor progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Complaint Submitted Successfully!</h3>
                    <p className="text-gray-600 mb-4">Your tracking number is:</p>
                    <div className="text-2xl font-mono font-bold text-blue-600 mb-6">
                      CMP/2024/001234
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                      Please save this number to track your complaint status.
                    </p>
                    <Button onClick={() => setSubmitted(false)}>File Another Complaint</Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit(onSubmitComplaint)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">Complaint Category *</label>
                        <Select
                          value={complaint.category}
                          onValueChange={(v) => setValue('category', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="THEFT">Theft</SelectItem>
                            <SelectItem value="FRAUD">Fraud</SelectItem>
                            <SelectItem value="ASSAULT">Assault</SelectItem>
                            <SelectItem value="CYBER_CRIME">Cyber Crime</SelectItem>
                            <SelectItem value="DOMESTIC_VIOLENCE">Domestic Violence</SelectItem>
                            <SelectItem value="MISSING_PERSON">Missing Person</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Incident Date *</label>
                        <Input
                          type="date"
                          value={complaint.incidentDate}
                          onChange={(value: string) => setValue('incidentDate', value)}
                        />
                        {errors.incidentDate && (
                          <p className="text-xs text-red-600 mt-1">{errors.incidentDate.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Subject *</label>
                      <Input
                        placeholder="Brief subject of your complaint"
                        value={complaint.subject}
                        onChange={(value: string) => setValue('subject', value)}
                      />
                      {errors.subject && (
                        <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Incident Location</label>
                      <Input
                        placeholder="Where did the incident occur?"
                        value={complaint.incidentLocation || ''}
                        onChange={(value: string) => setValue('incidentLocation', value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description *</label>
                      <Textarea
                        placeholder="Describe the incident in detail..."
                        rows={5}
                        value={complaint.description}
                        onChange={(value: string) => setValue('description', value)}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Your Contact Information</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={complaint.isAnonymous}
                          onChange={(e) => setValue('isAnonymous', e.target.checked)}
                        />
                        <label htmlFor="anonymous" className="text-sm">File anonymously</label>
                      </div>

                      {!complaint.isAnonymous && (
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <Input
                              placeholder="Your name"
                              value={complaint.name || ''}
                              onChange={(value: string) => setValue('name', value)}
                            />
                            {errors.name && (
                              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Phone Number *</label>
                            <Input
                              placeholder="9876543210"
                              value={complaint.phone || ''}
                              onChange={(value: string) => setValue('phone', value)}
                            />
                            {errors.phone && (
                              <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              value={complaint.email || ''}
                              onChange={(value: string) => setValue('email', value)}
                            />
                            {errors.email && (
                              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <Button variant="outline" type="button">
                        <Upload className="mr-2 h-4 w-4" />
                        Attach Evidence
                      </Button>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Complaint Tab */}
          <TabsContent value="track">
            <Card>
              <CardHeader>
                <CardTitle>Track Your Complaint</CardTitle>
                <CardDescription>
                  Enter your tracking number to check the status of your complaint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Enter tracking number (e.g., CMP/2024/001234)"
                    value={trackingNumber}
                    onChange={(value: string) => setTrackingNumber(value)}
                    className="flex-1"
                  />
                  <Button onClick={handleTrackComplaint}>
                    <Search className="mr-2 h-4 w-4" />
                    Track
                  </Button>
                </div>

                {complaintStatus && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Tracking Number</div>
                          <div className="font-mono font-bold">{complaintStatus.trackingNumber}</div>
                        </div>
                        <Badge className={statusColors[complaintStatus.status]}>
                          {complaintStatus.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-sm text-gray-500">Category</div>
                          <div>{complaintStatus.category}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Station</div>
                          <div>{complaintStatus.stationName}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Subject</div>
                        <div>{complaintStatus.subject}</div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-medium mb-4">Progress Timeline</h4>
                      <div className="space-y-4">
                        {complaintStatus.updates.map((update: any, index: number) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" />
                              {index < complaintStatus.updates.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="text-sm font-medium">{update.message}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(update.date).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FIR Status Tab */}
          <TabsContent value="fir">
            <Card>
              <CardHeader>
                <CardTitle>Check FIR Status</CardTitle>
                <CardDescription>
                  Track the status of your registered FIR using the FIR number and registered phone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Input
                    placeholder="FIR Number (e.g., KOR/2024/00001)"
                    value={firNumber}
                    onChange={(value: string) => setFirNumber(value)}
                  />
                  <Input
                    placeholder="Registered Phone Number"
                    value={phone}
                    onChange={(value: string) => setPhone(value)}
                  />
                  <Button onClick={handleTrackFIR}>
                    <Search className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                </div>

                {firStatus && (
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="text-sm text-gray-500">FIR Number</div>
                        <div className="text-xl font-mono font-bold">{firStatus.firNumber}</div>
                      </div>
                      <Badge className={statusColors[firStatus.status]}>
                        {firStatus.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Police Station</div>
                          <div>{firStatus.stationName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Registration Date</div>
                          <div>{new Date(firStatus.registrationDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <div className="font-medium mb-2">Current Status</div>
                      <div className="text-gray-600">{firStatus.statusDescription}</div>
                      {firStatus.nextAction && (
                        <div className="mt-2 text-sm text-blue-600">
                          Next: {firStatus.nextAction}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      Last updated: {new Date(firStatus.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missing Person Tab */}
          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle>Report Missing Person</CardTitle>
                <CardDescription>
                  File a missing person report. This information will be shared with all nearby stations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="font-medium mb-4">Reporter Information</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input placeholder="Your Name *" />
                      <Input placeholder="Phone Number *" />
                      <Input placeholder="Relationship to Missing Person *" />
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="font-medium mb-4">Missing Person Details</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input placeholder="Full Name *" />
                      <Input type="number" placeholder="Age *" />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Gender *" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder={'Height (e.g., 5\'8")'} />
                      <Input placeholder="Weight (e.g., 65 kg)" />
                      <Input placeholder="Complexion" />
                    </div>
                    <div className="mt-4">
                      <Textarea placeholder="Identifying marks, features, or any other description..." rows={3} />
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="font-medium mb-4">Last Seen Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input type="datetime-local" />
                      <Input placeholder="Last Seen Location *" />
                    </div>
                    <div className="mt-4">
                      <Textarea placeholder="What were they wearing? Any other relevant details..." rows={2} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Recent Photo</label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click or drag to upload photo</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Missing Person Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Emergency Contacts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Phone className="h-6 w-6 text-red-600" />
                <div>
                  <div className="font-bold text-red-600">100</div>
                  <div className="text-sm text-gray-600">Police Emergency</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-bold text-blue-600">1091</div>
                  <div className="text-sm text-gray-600">Women Helpline</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Phone className="h-6 w-6 text-orange-600" />
                <div>
                  <div className="font-bold text-orange-600">1098</div>
                  <div className="text-sm text-gray-600">Child Helpline</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Phone className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-bold text-green-600">112</div>
                  <div className="text-sm text-gray-600">Emergency Response</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>Karnataka State Police - Citizen Services Portal</p>
          <p className="mt-1">For technical support, contact: support@karpolice.gov.in</p>
        </div>
      </footer>
    </div>
  );
}
