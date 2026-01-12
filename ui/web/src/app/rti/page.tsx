'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Calendar,
  Filter,
  FileCheck,
  FileClock,
  FileX,
  Printer
} from 'lucide-react';

// Mock RTI requests data
const rtiRequests = [
  {
    id: '1',
    requestNumber: 'RTI/2024/00123',
    applicantName: 'Arun Kumar',
    subject: 'Details of pending cases in Koramangala station',
    status: 'PENDING',
    receivedDate: '2024-01-10',
    dueDate: '2024-02-09',
    type: 'CASE_INFORMATION',
  },
  {
    id: '2',
    requestNumber: 'RTI/2024/00124',
    applicantName: 'Meera Singh',
    subject: 'Crime statistics for 2023',
    status: 'IN_PROGRESS',
    receivedDate: '2024-01-12',
    dueDate: '2024-02-11',
    type: 'STATISTICS',
  },
  {
    id: '3',
    requestNumber: 'RTI/2024/00125',
    applicantName: 'Vikram Reddy',
    subject: 'FIR copy - FIR/2023/00456',
    status: 'COMPLETED',
    receivedDate: '2024-01-05',
    dueDate: '2024-02-04',
    completedDate: '2024-01-18',
    type: 'FIR_COPY',
  },
  {
    id: '4',
    requestNumber: 'RTI/2024/00126',
    applicantName: 'Priya Nair',
    subject: 'Personnel deployment details',
    status: 'REJECTED',
    receivedDate: '2024-01-08',
    dueDate: '2024-02-07',
    rejectionReason: 'Information exempt under Section 8(1)(a) - National Security',
    type: 'PERSONNEL',
  },
];

const stats = {
  totalRequests: 456,
  pending: 23,
  inProgress: 15,
  completed: 398,
  rejected: 20,
  averageResponseDays: 12,
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  TRANSFERRED: 'bg-purple-100 text-purple-800',
};

const typeLabels: Record<string, string> = {
  CASE_INFORMATION: 'Case Information',
  FIR_COPY: 'FIR Copy',
  STATISTICS: 'Statistics',
  PERSONNEL: 'Personnel Details',
  BUDGET: 'Budget Information',
  OTHER: 'Other',
};

export default function RTIPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const filteredRequests = rtiRequests.filter((req) => {
    const matchesSearch =
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RTI Reporting & Compliance</h1>
            <p className="text-gray-500">Manage Right to Information requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New RTI Request
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.totalRequests}</div>
                  <div className="text-sm text-gray-500">Total Requests</div>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <FileClock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-sm text-gray-500">In Progress</div>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <FileCheck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-500">Rejected</div>
                </div>
                <FileX className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.averageResponseDays}</div>
                  <div className="text-sm text-gray-500">Avg. Days</div>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">RTI Requests</TabsTrigger>
            <TabsTrigger value="reports">Generated Reports</TabsTrigger>
            <TabsTrigger value="templates">Response Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search by request number, applicant, or subject..."
                        value={searchQuery}
                        onChange={(value: string) => setSearchQuery(value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Request Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRequests.map((request) => {
                        const daysRemaining = getDaysRemaining(request.dueDate);
                        const isOverdue = daysRemaining < 0 && request.status !== 'COMPLETED' && request.status !== 'REJECTED';
                        const isUrgent = daysRemaining <= 7 && daysRemaining >= 0 && request.status !== 'COMPLETED';

                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{request.requestNumber}</div>
                              <div className="text-sm text-gray-500">
                                Received: {new Date(request.receivedDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{request.applicantName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {request.subject}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">{typeLabels[request.type]}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(request.dueDate).toLocaleDateString()}
                              </div>
                              {request.status !== 'COMPLETED' && request.status !== 'REJECTED' && (
                                <div
                                  className={`text-xs ${
                                    isOverdue
                                      ? 'text-red-600'
                                      : isUrgent
                                      ? 'text-orange-600'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {isOverdue
                                    ? `${Math.abs(daysRemaining)} days overdue`
                                    : `${daysRemaining} days remaining`}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Badge className={statusColors[request.status]}>
                                  {request.status.replace(/_/g, ' ')}
                                </Badge>
                                {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === 'COMPLETED' && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Generated RTI Reports</CardTitle>
                <CardDescription>
                  Pre-formatted reports ready for RTI disclosure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: 'Crime Statistics 2023', type: 'Annual Report', size: '2.4 MB' },
                    { name: 'FIR Registration Summary', type: 'Monthly Report', size: '156 KB' },
                    { name: 'Case Disposal Report', type: 'Quarterly Report', size: '890 KB' },
                    { name: 'Personnel Strength', type: 'Annual Report', size: '1.2 MB' },
                    { name: 'Vehicle Fleet Status', type: 'Monthly Report', size: '340 KB' },
                    { name: 'Budget Utilization', type: 'Quarterly Report', size: '2.1 MB' },
                  ].map((report, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <FileText className="h-10 w-10 text-blue-500 mb-3" />
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-gray-500">{report.type}</div>
                            <div className="text-xs text-gray-400 mt-1">{report.size}</div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Response Templates</CardTitle>
                <CardDescription>
                  Pre-approved templates for common RTI responses with automatic redaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'FIR Copy Template', fields: 12, exemptions: 3 },
                    { name: 'Case Status Template', fields: 8, exemptions: 2 },
                    { name: 'Crime Statistics Template', fields: 15, exemptions: 0 },
                    { name: 'Personnel Information Template', fields: 10, exemptions: 5 },
                    { name: 'Rejection Notice Template', fields: 5, exemptions: 0 },
                  ].map((template, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.fields} fields • {template.exemptions} auto-redacted sections
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button size="sm">Use Template</Button>
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
