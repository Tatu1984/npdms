'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Fingerprint,
  Camera,
  MapPin,
  Download,
  Filter,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Coffee,
  TrendingUp,
} from 'lucide-react';

// Mock data
const todayAttendance = {
  total: 45,
  present: 38,
  absent: 3,
  onLeave: 4,
  late: 5,
  onFieldDuty: 2,
};

const attendanceRecords = [
  {
    id: '1',
    name: 'SI Rajesh Kumar',
    badgeNumber: 'KA-BLR-1234',
    rank: 'Sub Inspector',
    status: 'PRESENT',
    checkIn: '08:45 AM',
    checkOut: null,
    method: 'FINGERPRINT',
    location: 'Main Gate',
    hoursWorked: '4h 15m',
  },
  {
    id: '2',
    name: 'HC Suresh Babu',
    badgeNumber: 'KA-BLR-1235',
    rank: 'Head Constable',
    status: 'LATE',
    checkIn: '09:32 AM',
    checkOut: null,
    method: 'FACE',
    location: 'Main Gate',
    hoursWorked: '3h 28m',
    lateBy: '32 min',
  },
  {
    id: '3',
    name: 'ASI Priya Sharma',
    badgeNumber: 'KA-BLR-1236',
    rank: 'ASI',
    status: 'ON_FIELD_DUTY',
    checkIn: '07:30 AM',
    checkOut: null,
    method: 'GPS',
    location: 'Sector 4, Beat Patrol',
    hoursWorked: '5h 30m',
  },
  {
    id: '4',
    name: 'Const. Mahesh R',
    badgeNumber: 'KA-BLR-1237',
    rank: 'Constable',
    status: 'ABSENT',
    checkIn: null,
    checkOut: null,
    method: null,
    location: null,
    hoursWorked: '-',
  },
  {
    id: '5',
    name: 'SI Lakshmi N',
    badgeNumber: 'KA-BLR-1238',
    rank: 'Sub Inspector',
    status: 'ON_LEAVE',
    checkIn: null,
    checkOut: null,
    method: null,
    location: null,
    hoursWorked: '-',
    leaveType: 'Casual Leave',
  },
];

const shifts = [
  { id: '1', name: 'Morning Shift', time: '06:00 - 14:00', personnel: 15 },
  { id: '2', name: 'Day Shift', time: '09:00 - 17:00', personnel: 20 },
  { id: '3', name: 'Evening Shift', time: '14:00 - 22:00', personnel: 12 },
  { id: '4', name: 'Night Shift', time: '22:00 - 06:00', personnel: 8 },
];

const devices = [
  { id: '1', name: 'Main Gate Scanner', type: 'FINGERPRINT', status: 'ONLINE', lastSync: '2 min ago' },
  { id: '2', name: 'Back Gate Scanner', type: 'FINGERPRINT', status: 'ONLINE', lastSync: '5 min ago' },
  { id: '3', name: 'Reception Cam', type: 'FACE', status: 'ONLINE', lastSync: '1 min ago' },
  { id: '4', name: 'Server Room', type: 'CARD', status: 'OFFLINE', lastSync: '2 hrs ago' },
];

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
  ON_FIELD_DUTY: 'bg-purple-100 text-purple-800',
  HALF_DAY: 'bg-orange-100 text-orange-800',
};

const methodIcons: Record<string, typeof Fingerprint> = {
  FINGERPRINT: Fingerprint,
  FACE: Camera,
  GPS: MapPin,
  CARD: CheckCircle,
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Biometric Attendance</h1>
            <p className="text-gray-500">Track personnel attendance and shifts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Devices
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              <Users className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance.total}</div>
              <p className="text-xs text-gray-500">Personnel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Present</CardTitle>
              <UserCheck className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todayAttendance.present}</div>
              <p className="text-xs text-gray-500">{Math.round((todayAttendance.present / todayAttendance.total) * 100)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Absent</CardTitle>
              <UserX className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{todayAttendance.absent}</div>
              <p className="text-xs text-gray-500">Unaccounted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">On Leave</CardTitle>
              <Coffee className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayAttendance.onLeave}</div>
              <p className="text-xs text-gray-500">Approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Late</CardTitle>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{todayAttendance.late}</div>
              <p className="text-xs text-gray-500">After grace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Field Duty</CardTitle>
              <MapPin className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{todayAttendance.onFieldDuty}</div>
              <p className="text-xs text-gray-500">GPS tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Attendance Records */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today&apos;s Attendance</CardTitle>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name or badge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-1 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="ON_FIELD_DUTY">Field Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRecords.map((record) => {
                  const MethodIcon = record.method ? methodIcons[record.method] || CheckCircle : null;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {record.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{record.name}</div>
                          <div className="text-xs text-gray-500">
                            {record.badgeNumber} • {record.rank}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {record.checkIn && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Check In</div>
                            <div className="text-sm font-medium">{record.checkIn}</div>
                          </div>
                        )}
                        {record.checkOut && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Check Out</div>
                            <div className="text-sm font-medium">{record.checkOut}</div>
                          </div>
                        )}
                        {record.hoursWorked !== '-' && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Hours</div>
                            <div className="text-sm font-medium">{record.hoursWorked}</div>
                          </div>
                        )}
                        {MethodIcon && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <MethodIcon className="h-4 w-4" />
                          </div>
                        )}
                        <Badge className={statusColors[record.status]}>
                          {record.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Shifts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium text-sm">{shift.name}</div>
                      <div className="text-xs text-gray-500">{shift.time}</div>
                    </div>
                    <Badge variant="outline">{shift.personnel} staff</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Biometric Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="font-medium text-sm">{device.name}</div>
                        <div className="text-xs text-gray-500">{device.type} • {device.lastSync}</div>
                      </div>
                    </div>
                    <Badge variant={device.status === 'ONLINE' ? 'default' : 'destructive'} className="text-xs">
                      {device.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Avg. Attendance</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Avg. Check-in Time</span>
                    <span className="font-medium">08:52 AM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Late Arrivals</span>
                    <span className="font-medium text-yellow-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Leave Requests</span>
                    <span className="font-medium">8</span>
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
