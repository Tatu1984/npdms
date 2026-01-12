'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Shield,
  DollarSign,
  Globe,
  Smartphone,
  Mail,
  AlertTriangle,
  TrendingUp,
  Eye,
  FileText
} from 'lucide-react';

// Mock data
const cyberCrimes = [
  {
    id: '1',
    caseNumber: 'CYBER/2024/00001',
    type: 'ONLINE_FRAUD',
    status: 'INVESTIGATING',
    priority: 'HIGH',
    complainantName: 'Rajesh Kumar',
    platform: 'BANKING',
    financialLoss: 250000,
    incidentDate: '2024-01-10',
    reportedAt: '2024-01-11',
  },
  {
    id: '2',
    caseNumber: 'CYBER/2024/00002',
    type: 'PHISHING',
    status: 'ANALYZING',
    priority: 'MEDIUM',
    complainantName: 'Priya Sharma',
    platform: 'EMAIL',
    financialLoss: 0,
    incidentDate: '2024-01-12',
    reportedAt: '2024-01-12',
  },
  {
    id: '3',
    caseNumber: 'CYBER/2024/00003',
    type: 'IDENTITY_THEFT',
    status: 'REPORTED',
    priority: 'CRITICAL',
    complainantName: 'Amit Singh',
    platform: 'SOCIAL_MEDIA',
    financialLoss: 500000,
    incidentDate: '2024-01-14',
    reportedAt: '2024-01-15',
  },
  {
    id: '4',
    caseNumber: 'CYBER/2024/00004',
    type: 'CRYPTO_FRAUD',
    status: 'ESCALATED',
    priority: 'HIGH',
    complainantName: 'Neha Patel',
    platform: 'CRYPTO',
    financialLoss: 1500000,
    incidentDate: '2024-01-08',
    reportedAt: '2024-01-09',
  },
];

const stats = {
  totalCases: 156,
  activeCases: 42,
  resolvedCases: 98,
  totalFinancialLoss: 45000000,
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

const platformIcons: Record<string, React.ReactNode> = {
  WEBSITE: <Globe className="h-4 w-4" />,
  MOBILE_APP: <Smartphone className="h-4 w-4" />,
  SOCIAL_MEDIA: <Globe className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  BANKING: <DollarSign className="h-4 w-4" />,
  CRYPTO: <TrendingUp className="h-4 w-4" />,
};

export default function CyberCrimePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredCrimes = cyberCrimes.filter((crime) => {
    const matchesSearch =
      crime.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crime.complainantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crime.status === statusFilter;
    const matchesType = typeFilter === 'all' || crime.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cyber Crime Unit</h1>
            <p className="text-foreground-muted">Manage digital crime investigations</p>
          </div>
          <Button onClick={() => router.push('/cyber-crime/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Report Cyber Crime
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Total Cases</CardTitle>
              <Shield className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalCases}</div>
              <p className="text-xs text-foreground-muted">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Active Cases</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeCases}</div>
              <p className="text-xs text-foreground-muted">Under investigation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Resolved</CardTitle>
              <FileText className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.resolvedCases}</div>
              <p className="text-xs text-foreground-muted">Cases closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Financial Loss</CardTitle>
              <DollarSign className="h-5 w-5 text-error" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalFinancialLoss)}</div>
              <p className="text-xs text-foreground-muted">Total reported</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by case number or complainant..."
                  value={searchQuery}
                  onChange={(value: string) => setSearchQuery(value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="REPORTED">Reported</SelectItem>
                  <SelectItem value="ANALYZING">Analyzing</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Crime Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PHISHING">Phishing</SelectItem>
                  <SelectItem value="ONLINE_FRAUD">Online Fraud</SelectItem>
                  <SelectItem value="IDENTITY_THEFT">Identity Theft</SelectItem>
                  <SelectItem value="CRYPTO_FRAUD">Crypto Fraud</SelectItem>
                  <SelectItem value="RANSOMWARE">Ransomware</SelectItem>
                  <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                  <SelectItem value="HACKING">Hacking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Case Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Complainant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Financial Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCrimes.map((crime) => (
                    <tr
                      key={crime.id}
                      className="hover:bg-background-tertiary cursor-pointer"
                      onClick={() => router.push(`/cyber-crime/${crime.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{crime.caseNumber}</div>
                        <div className="text-sm text-foreground-muted">
                          {new Date(crime.reportedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getTypeBadgeVariant(crime.type) as any}>
                          {crime.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{crime.complainantName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-foreground-muted">
                          {platformIcons[crime.platform]}
                          <span className="ml-2">{crime.platform.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {crime.financialLoss > 0 ? formatCurrency(crime.financialLoss) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(crime.status) as any}>
                          {crime.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cyber-crime/${crime.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
