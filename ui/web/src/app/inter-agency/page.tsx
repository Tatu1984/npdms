'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Share2,
  Building2,
  Database,
  Key,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Download,
  FileText,
  Search,
  Shield,
  Globe,
  Server,
  RefreshCw,
  AlertTriangle,
  Link2,
  ExternalLink,
} from 'lucide-react';

// Mock connected agencies
const connectedAgencies = [
  {
    id: '1',
    name: 'Central Bureau of Investigation (CBI)',
    type: 'NATIONAL',
    status: 'CONNECTED',
    endpoint: 'https://api.cbi.gov.in/v1',
    lastSync: '5 min ago',
    dataShared: ['FIR', 'CRIMINAL_RECORDS', 'INTERSTATE_CASES'],
    requestsPending: 3,
  },
  {
    id: '2',
    name: 'National Crime Records Bureau (NCRB)',
    type: 'NATIONAL',
    status: 'CONNECTED',
    endpoint: 'https://api.ncrb.gov.in/v2',
    lastSync: '2 min ago',
    dataShared: ['CRIME_STATS', 'FINGERPRINTS', 'MISSING_PERSONS'],
    requestsPending: 0,
  },
  {
    id: '3',
    name: 'Regional Transport Office (RTO)',
    type: 'STATE',
    status: 'CONNECTED',
    endpoint: 'https://api.parivahan.gov.in/v1',
    lastSync: '10 min ago',
    dataShared: ['VEHICLE_DATA', 'LICENSE_DATA'],
    requestsPending: 1,
  },
  {
    id: '4',
    name: 'Income Tax Department',
    type: 'NATIONAL',
    status: 'PENDING',
    endpoint: 'https://api.incometax.gov.in/v1',
    lastSync: null,
    dataShared: ['PAN_VERIFICATION'],
    requestsPending: 0,
  },
  {
    id: '5',
    name: 'Unique Identification Authority (UIDAI)',
    type: 'NATIONAL',
    status: 'CONNECTED',
    endpoint: 'https://api.uidai.gov.in/v2',
    lastSync: '1 min ago',
    dataShared: ['AADHAAR_VERIFICATION', 'DEMOGRAPHIC_DATA'],
    requestsPending: 0,
  },
  {
    id: '6',
    name: 'Interpol',
    type: 'INTERNATIONAL',
    status: 'LIMITED',
    endpoint: 'https://api.interpol.int/v1',
    lastSync: '1 hr ago',
    dataShared: ['RED_NOTICES', 'STOLEN_DOCUMENTS'],
    requestsPending: 2,
  },
];

// Mock API requests
const apiRequests = [
  {
    id: '1',
    type: 'OUTGOING',
    agency: 'NCRB',
    endpoint: '/criminal-records/search',
    status: 'SUCCESS',
    timestamp: '2024-01-15 10:30:00',
    responseTime: '234ms',
    requestedBy: 'SI Rajesh Kumar',
  },
  {
    id: '2',
    type: 'INCOMING',
    agency: 'CBI',
    endpoint: '/fir/lookup',
    status: 'SUCCESS',
    timestamp: '2024-01-15 10:28:00',
    responseTime: '156ms',
    requestedBy: 'External',
  },
  {
    id: '3',
    type: 'OUTGOING',
    agency: 'RTO',
    endpoint: '/vehicle/verify',
    status: 'PENDING',
    timestamp: '2024-01-15 10:25:00',
    responseTime: '-',
    requestedBy: 'ASI Priya Sharma',
  },
  {
    id: '4',
    type: 'OUTGOING',
    agency: 'UIDAI',
    endpoint: '/aadhaar/verify',
    status: 'FAILED',
    timestamp: '2024-01-15 10:20:00',
    responseTime: '5023ms',
    error: 'Timeout',
    requestedBy: 'Const. Mahesh R',
  },
];

// Mock data sharing agreements
const dataSharingAgreements = [
  {
    id: '1',
    agency: 'CBI',
    dataType: 'FIR Records',
    direction: 'BIDIRECTIONAL',
    frequency: 'REAL_TIME',
    validUntil: '2025-12-31',
    status: 'ACTIVE',
  },
  {
    id: '2',
    agency: 'NCRB',
    dataType: 'Crime Statistics',
    direction: 'OUTGOING',
    frequency: 'DAILY',
    validUntil: '2025-06-30',
    status: 'ACTIVE',
  },
  {
    id: '3',
    agency: 'RTO',
    dataType: 'Vehicle Records',
    direction: 'INCOMING',
    frequency: 'ON_DEMAND',
    validUntil: '2024-12-31',
    status: 'ACTIVE',
  },
];

const stats = {
  totalAgencies: 6,
  connected: 4,
  pending: 1,
  limited: 1,
  todayRequests: 156,
  successRate: 98.2,
};

const statusColors: Record<string, string> = {
  CONNECTED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  LIMITED: 'bg-orange-100 text-orange-800',
  DISCONNECTED: 'bg-red-100 text-red-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function InterAgencyPage() {
  const [activeTab, setActiveTab] = useState('agencies');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inter-Agency Integration</h1>
            <p className="text-gray-500">API connections and data sharing with other agencies</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Key className="mr-2 h-4 w-4" />
              API Keys
            </Button>
            <Button>
              <Link2 className="mr-2 h-4 w-4" />
              New Connection
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Agencies</CardTitle>
              <Building2 className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgencies}</div>
              <p className="text-xs text-gray-500">Integrated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Connected</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
              <p className="text-xs text-gray-500">Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500">Awaiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Limited</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.limited}</div>
              <p className="text-xs text-gray-500">Restricted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today&apos;s Requests</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayRequests}</div>
              <p className="text-xs text-gray-500">API calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Success Rate</CardTitle>
              <Server className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.successRate}%</div>
              <p className="text-xs text-gray-500">Last 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="agencies">Connected Agencies</TabsTrigger>
            <TabsTrigger value="requests">API Requests</TabsTrigger>
            <TabsTrigger value="agreements">Data Agreements</TabsTrigger>
          </TabsList>

          {/* Agencies Tab */}
          <TabsContent value="agencies" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search agencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {connectedAgencies.map((agency) => (
                <Card key={agency.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {agency.type === 'INTERNATIONAL' ? (
                            <Globe className="h-6 w-6 text-blue-600" />
                          ) : agency.type === 'NATIONAL' ? (
                            <Shield className="h-6 w-6 text-purple-600" />
                          ) : (
                            <Building2 className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{agency.name}</div>
                          <div className="text-sm text-gray-500">{agency.type}</div>
                        </div>
                      </div>
                      <Badge className={statusColors[agency.status]}>{agency.status}</Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Server className="h-4 w-4" />
                        <span className="truncate">{agency.endpoint}</span>
                      </div>
                      {agency.lastSync && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <RefreshCw className="h-4 w-4" />
                          <span>Last sync: {agency.lastSync}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-gray-500 mb-2">Data Shared:</div>
                      <div className="flex flex-wrap gap-1">
                        {agency.dataShared.map((data) => (
                          <Badge key={data} variant="outline" className="text-xs">
                            {data.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center pt-4 border-t">
                      {agency.requestsPending > 0 && (
                        <Badge variant="outline" className="text-yellow-600">
                          {agency.requestsPending} pending
                        </Badge>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded ${request.type === 'OUTGOING' ? 'bg-blue-50' : 'bg-green-50'}`}>
                          {request.type === 'OUTGOING' ? (
                            <Send className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Download className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{request.agency}</div>
                          <div className="text-xs text-gray-500 font-mono">{request.endpoint}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{request.timestamp}</div>
                          <div className="text-xs text-gray-400">{request.responseTime}</div>
                        </div>
                        <Badge className={statusColors[request.status]}>{request.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements">
            <Card>
              <CardHeader>
                <CardTitle>Data Sharing Agreements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataSharingAgreements.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                    >
                      <div>
                        <div className="font-medium">{agreement.agency}</div>
                        <div className="text-sm text-gray-500">{agreement.dataType}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Direction</div>
                          <Badge variant="outline">{agreement.direction}</Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Frequency</div>
                          <Badge variant="outline">{agreement.frequency.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Valid Until</div>
                          <span className="text-sm">{agreement.validUntil}</span>
                        </div>
                        <Badge className={statusColors.CONNECTED}>{agreement.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
