'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Shield,
  DollarSign,
  Globe,
  Smartphone,
  Mail,
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Clock,
  Edit,
  Download,
} from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

// Mock data - same as in the list page
const cyberCrimes = [
  {
    id: '1',
    caseNumber: 'CYBER/2024/00001',
    type: 'ONLINE_FRAUD',
    status: 'INVESTIGATING',
    priority: 'HIGH',
    complainantName: 'Rajesh Kumar',
    complainantPhone: '+91 9876543210',
    complainantEmail: 'rajesh.kumar@email.com',
    complainantAddress: '123, MG Road, Bangalore - 560001',
    platform: 'BANKING',
    financialLoss: 250000,
    incidentDate: '2024-01-10',
    reportedAt: '2024-01-11',
    description: 'Complainant received a call from someone claiming to be from the bank. The caller asked for OTP and transferred money from the account.',
    suspectInfo: 'Unknown caller from number +91 8765432109',
    evidenceCollected: ['Call recordings', 'Bank statements', 'Transaction details'],
    investigatingOfficer: 'SI Mohan Kumar',
    updates: [
      { date: '2024-01-11', action: 'Case registered', officer: 'SI Mohan Kumar' },
      { date: '2024-01-12', action: 'Bank details obtained', officer: 'HC Ramesh' },
      { date: '2024-01-15', action: 'Call records requested from telecom', officer: 'SI Mohan Kumar' },
    ],
  },
  {
    id: '2',
    caseNumber: 'CYBER/2024/00002',
    type: 'PHISHING',
    status: 'ANALYZING',
    priority: 'MEDIUM',
    complainantName: 'Priya Sharma',
    complainantPhone: '+91 9876543211',
    complainantEmail: 'priya.sharma@email.com',
    complainantAddress: '456, Indiranagar, Bangalore - 560038',
    platform: 'EMAIL',
    financialLoss: 0,
    incidentDate: '2024-01-12',
    reportedAt: '2024-01-12',
    description: 'Complainant received a phishing email claiming to be from their employer. The email contained a malicious link.',
    suspectInfo: 'Unknown sender using fake company domain',
    evidenceCollected: ['Email headers', 'Phishing link screenshot'],
    investigatingOfficer: 'ASI Priya',
    updates: [
      { date: '2024-01-12', action: 'Case registered', officer: 'ASI Priya' },
      { date: '2024-01-13', action: 'Email headers analyzed', officer: 'Cyber Expert' },
    ],
  },
  {
    id: '3',
    caseNumber: 'CYBER/2024/00003',
    type: 'IDENTITY_THEFT',
    status: 'REPORTED',
    priority: 'CRITICAL',
    complainantName: 'Amit Singh',
    complainantPhone: '+91 9876543212',
    complainantEmail: 'amit.singh@email.com',
    complainantAddress: '789, Koramangala, Bangalore - 560034',
    platform: 'SOCIAL_MEDIA',
    financialLoss: 500000,
    incidentDate: '2024-01-14',
    reportedAt: '2024-01-15',
    description: 'Unknown person created fake social media accounts using complainant identity and defrauded multiple people.',
    suspectInfo: 'Fake accounts identified on Instagram and Facebook',
    evidenceCollected: ['Fake account screenshots', 'Victim statements'],
    investigatingOfficer: 'Inspector Anil',
    updates: [
      { date: '2024-01-15', action: 'Case registered', officer: 'Inspector Anil' },
    ],
  },
  {
    id: '4',
    caseNumber: 'CYBER/2024/00004',
    type: 'CRYPTO_FRAUD',
    status: 'ESCALATED',
    priority: 'HIGH',
    complainantName: 'Neha Patel',
    complainantPhone: '+91 9876543213',
    complainantEmail: 'neha.patel@email.com',
    complainantAddress: '321, HSR Layout, Bangalore - 560102',
    platform: 'CRYPTO',
    financialLoss: 1500000,
    incidentDate: '2024-01-08',
    reportedAt: '2024-01-09',
    description: 'Complainant was lured into investing in a fake cryptocurrency platform. After initial returns, all funds were locked.',
    suspectInfo: 'Platform: CryptoMax (fake), Contact: support@cryptomax-invest.com',
    evidenceCollected: ['Website screenshots', 'Transaction records', 'Chat history'],
    investigatingOfficer: 'DSP Cyber Cell',
    updates: [
      { date: '2024-01-09', action: 'Case registered', officer: 'SI Mohan Kumar' },
      { date: '2024-01-10', action: 'Escalated to DSP Cyber Cell', officer: 'SHO' },
      { date: '2024-01-12', action: 'Crypto exchange contacted', officer: 'DSP Cyber Cell' },
    ],
  },
];

const platformIcons: Record<string, React.ReactNode> = {
  WEBSITE: <Globe className="h-5 w-5" />,
  MOBILE_APP: <Smartphone className="h-5 w-5" />,
  SOCIAL_MEDIA: <Globe className="h-5 w-5" />,
  EMAIL: <Mail className="h-5 w-5" />,
  BANKING: <DollarSign className="h-5 w-5" />,
  CRYPTO: <TrendingUp className="h-5 w-5" />,
};

function getTypeBadgeVariant(type: string) {
  const variants: Record<string, string> = {
    PHISHING: 'warning',
    RANSOMWARE: 'error',
    IDENTITY_THEFT: 'info',
    ONLINE_FRAUD: 'warning',
    CYBER_STALKING: 'error',
    DATA_BREACH: 'info',
    CRYPTO_FRAUD: 'info',
    HACKING: 'secondary',
  };
  return variants[type] || 'secondary';
}

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    REPORTED: 'secondary',
    ANALYZING: 'info',
    INVESTIGATING: 'warning',
    ESCALATED: 'error',
    RESOLVED: 'success',
    CLOSED: 'secondary',
  };
  return variants[status] || 'secondary';
}

export default function CyberCrimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToastStore();
  const id = params.id as string;

  const crime = cyberCrimes.find((c) => c.id === id);

  if (!crime) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Case Not Found</h2>
          <p className="text-foreground-muted mb-4">The cyber crime case you're looking for doesn't exist.</p>
          <Link href="/cyber-crime">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cyber Crime
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cyber-crime">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{crime.caseNumber}</h1>
                <Badge variant={getTypeBadgeVariant(crime.type) as any}>
                  {crime.type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={getStatusBadgeVariant(crime.status) as any}>
                  {crime.status}
                </Badge>
                <Badge
                  variant={
                    crime.priority === 'CRITICAL'
                      ? 'error'
                      : crime.priority === 'HIGH'
                      ? 'warning'
                      : crime.priority === 'MEDIUM'
                      ? 'info'
                      : 'success'
                  }
                >
                  {crime.priority}
                </Badge>
              </div>
              <p className="text-foreground-muted">Cyber Crime Investigation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => addToast({ type: 'success', title: 'Report Downloaded', message: 'Case report exported to PDF' })}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => addToast({ type: 'info', title: 'Edit Mode', message: 'Edit functionality coming soon' })}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Case
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Case Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Description</h4>
                  <p className="text-foreground">{crime.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground-muted mb-1">Platform</h4>
                    <div className="flex items-center gap-2 text-foreground">
                      {platformIcons[crime.platform]}
                      <span>{crime.platform.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground-muted mb-1">Financial Loss</h4>
                    <p className="text-xl font-bold text-error">
                      {crime.financialLoss > 0 ? formatCurrency(crime.financialLoss) : 'No financial loss'}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Suspect Information</h4>
                  <p className="text-foreground">{crime.suspectInfo}</p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidence Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {crime.evidenceCollected.map((evidence, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                    >
                      <span className="text-foreground">{evidence}</span>
                      <Button variant="ghost" size="sm" onClick={() => addToast({ type: 'info', title: 'View Evidence', message: `Viewing: ${evidence}` })}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Case Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Case Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {crime.updates.map((update, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-accent" />
                        {index < crime.updates.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-foreground">{update.action}</p>
                        <p className="text-sm text-foreground-muted">
                          {new Date(update.date).toLocaleDateString('en-IN')} - {update.officer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Complainant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Complainant Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Name</h4>
                  <p className="text-foreground">{crime.complainantName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Phone</h4>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-foreground-muted" />
                    {crime.complainantPhone}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Email</h4>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-foreground-muted" />
                    {crime.complainantEmail}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Address</h4>
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-foreground-muted mt-0.5" />
                    {crime.complainantAddress}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Incident Date</h4>
                  <p className="text-foreground">
                    {new Date(crime.incidentDate).toLocaleDateString('en-IN', {
                      dateStyle: 'long',
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-muted mb-1">Reported On</h4>
                  <p className="text-foreground">
                    {new Date(crime.reportedAt).toLocaleDateString('en-IN', {
                      dateStyle: 'long',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Investigating Officer */}
            <Card>
              <CardHeader>
                <CardTitle>Investigating Officer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{crime.investigatingOfficer}</p>
                    <p className="text-sm text-foreground-muted">Cyber Crime Cell</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
