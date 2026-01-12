'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LegacySelect as Select } from '@/components/ui/select';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useAccessLogStore, type AccessLog } from '@/stores/accessLogStore';
import { useAuthStore, hasMinimumRole } from '@/stores/authStore';
import {
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Shield,
  AlertTriangle,
  Search,
  Download,
  Eye,
  Activity,
  Users,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
  Wifi,
  MapPinned,
  Building2,
  Navigation,
} from 'lucide-react';

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FAILED', label: 'Failed Login' },
  { value: 'VIEW', label: 'View' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'DOWNLOAD', label: 'Download' },
  { value: 'SENSITIVE_ACCESS', label: 'Sensitive Access' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

function getActionBadgeVariant(action: string): string {
  switch (action) {
    case 'LOGIN':
      return 'success';
    case 'LOGOUT':
      return 'secondary';
    case 'LOGIN_FAILED':
      return 'error';
    case 'CREATE':
      return 'info';
    case 'UPDATE':
      return 'warning';
    case 'DELETE':
      return 'error';
    case 'EXPORT':
    case 'DOWNLOAD':
      return 'info';
    case 'SENSITIVE_ACCESS':
      return 'warning';
    default:
      return 'secondary';
  }
}

export default function IPTrackerPage() {
  const { user } = useAuthStore();
  const { getLogs, getStats, exportLogs, getSuspiciousActivity } = useAccessLogStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const canAccess = user && hasMinimumRole(user.role, 'INSPECTOR');

  const stats = getStats();
  const suspiciousLogs = getSuspiciousActivity();

  const filteredLogs = useMemo(() => {
    return getLogs({
      search: searchQuery,
      action: actionFilter as any || undefined,
      success: statusFilter === 'success' ? true : statusFilter === 'failed' ? false : undefined,
      startDate: dateFilter ? `${dateFilter}T00:00:00` : undefined,
      endDate: dateFilter ? `${dateFilter}T23:59:59` : undefined,
    });
  }, [getLogs, searchQuery, actionFilter, statusFilter, dateFilter]);

  const handleExport = () => {
    const csv = exportLogs({
      search: searchQuery,
      action: actionFilter as any || undefined,
      success: statusFilter === 'success' ? true : statusFilter === 'failed' ? false : undefined,
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (log: AccessLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (!canAccess) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-foreground-muted">
              You need Inspector level or above to access IP tracking logs.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">IP Tracker & Access Logs</h1>
            <p className="text-foreground-muted">
              Monitor system access, track IP addresses, and view geolocation data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Total Logs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalLogs}</p>
                </div>
                <Activity className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Today</p>
                  <p className="text-2xl font-bold text-info">{stats.todayLogs}</p>
                </div>
                <Clock className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Unique Users</p>
                  <p className="text-2xl font-bold text-success">{stats.uniqueUsers}</p>
                </div>
                <Users className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Unique IPs</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.uniqueIPs}</p>
                </div>
                <Globe className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Failed Logins</p>
                  <p className="text-2xl font-bold text-error">{stats.failedLogins}</p>
                </div>
                <XCircle className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className={stats.suspiciousActivities > 0 ? 'border-warning' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground-muted">Suspicious</p>
                  <p className="text-2xl font-bold text-warning">{stats.suspiciousActivities}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suspicious Activity Alert */}
        {suspiciousLogs.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Suspicious Activity Detected ({suspiciousLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suspiciousLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 bg-background rounded"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium">{log.description}</p>
                        <p className="text-xs text-foreground-muted">
                          IP: {log.ipAddress} | {log.geolocation?.formattedAddress || 'Unknown location'}
                          {log.geolocation?.proxy && ' | VPN/Proxy Detected'}
                          {log.geolocation?.tor && ' | TOR Exit Node'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleViewDetails(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by user, IP, location, or description..."
                  value={searchQuery}
                  onChange={(v: string) => setSearchQuery(v)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select
                options={actionOptions}
                value={actionFilter}
                onChange={setActionFilter}
                className="w-full md:w-40"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full md:w-32"
              />
              <Input
                type="date"
                value={dateFilter}
                onChange={(v: string) => setDateFilter(v)}
                className="w-full md:w-40"
              />
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Access Logs ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Activity className="h-12 w-12 text-foreground-muted mx-auto mb-4 opacity-50" />
                      <p className="text-foreground-muted">No access logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-background-tertiary">
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{log.userName}</div>
                        <div className="text-xs text-foreground-muted">{log.userRole}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action) as any}>
                          {log.action}
                        </Badge>
                        {log.resource && (
                          <div className="text-xs text-foreground-muted mt-1">
                            {log.resource} {log.resourceId && `#${log.resourceId}`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-3 w-3 text-foreground-muted" />
                          <span className="font-mono text-sm">{log.ipAddress}</span>
                        </div>
                        {(log.geolocation?.proxy || log.geolocation?.vpn || log.geolocation?.tor) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-warning" />
                            <span className="text-xs text-warning">
                              {log.geolocation?.tor ? 'TOR' : 'VPN/Proxy'}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.geolocation ? (
                          <div>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-foreground-muted" />
                              {log.geolocation.city}, {log.geolocation.region}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              {log.geolocation.country}
                            </div>
                          </div>
                        ) : (
                          <span className="text-foreground-muted">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(log.deviceType)}
                          <div>
                            <div className="text-xs">{log.browser}</div>
                            <div className="text-xs text-foreground-muted">{log.os}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="success">Success</Badge>
                        ) : (
                          <Badge variant="error">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        title="Access Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-foreground-muted mb-2">User Information</h4>
                <div className="space-y-2 p-3 bg-background-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Name:</span>
                    <span className="text-sm font-medium">{selectedLog.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Role:</span>
                    <span className="text-sm">{selectedLog.userRole}</span>
                  </div>
                  {selectedLog.userBadge && (
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-muted">Badge:</span>
                      <span className="text-sm font-mono">{selectedLog.userBadge}</span>
                    </div>
                  )}
                  {selectedLog.stationName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-muted">Station:</span>
                      <span className="text-sm">{selectedLog.stationName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground-muted mb-2">Action Details</h4>
                <div className="space-y-2 p-3 bg-background-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Action:</span>
                    <Badge variant={getActionBadgeVariant(selectedLog.action) as any}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Status:</span>
                    {selectedLog.success ? (
                      <Badge variant="success">Success</Badge>
                    ) : (
                      <Badge variant="error">Failed</Badge>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Time:</span>
                    <span className="text-sm">
                      {new Date(selectedLog.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedLog.resource && (
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground-muted">Resource:</span>
                      <span className="text-sm">{selectedLog.resource} {selectedLog.resourceId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-foreground-muted mb-2">Description</h4>
              <p className="text-sm p-3 bg-background-secondary rounded-lg">
                {selectedLog.description}
              </p>
              {selectedLog.errorMessage && (
                <p className="text-sm text-error mt-2 p-3 bg-error/10 rounded-lg">
                  Error: {selectedLog.errorMessage}
                </p>
              )}
            </div>

            {/* IP & Location */}
            <div>
              <h4 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                IP Address & Geolocation
              </h4>
              <div className="p-4 bg-background-secondary rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Wifi className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-mono text-lg">{selectedLog.ipAddress}</p>
                    {selectedLog.geolocation?.isp && (
                      <p className="text-sm text-foreground-muted">ISP: {selectedLog.geolocation.isp}</p>
                    )}
                  </div>
                </div>

                {selectedLog.geolocation && (
                  <>
                    <div className="border-t border-border pt-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Location</p>
                            <p className="text-sm text-foreground-muted">
                              {selectedLog.geolocation.formattedAddress}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Region</p>
                            <p className="text-sm text-foreground-muted">
                              {selectedLog.geolocation.city}, {selectedLog.geolocation.region}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Country</p>
                            <p className="text-sm text-foreground-muted">
                              {selectedLog.geolocation.country} ({selectedLog.geolocation.countryCode})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="h-4 w-4 text-foreground-muted mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">GPS Coordinates</p>
                            <p className="text-sm font-mono text-foreground-muted">
                              {selectedLog.geolocation.latitude.toFixed(6)}, {selectedLog.geolocation.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedLog.geolocation.timezone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-foreground-muted" />
                        <span>Timezone: {selectedLog.geolocation.timezone}</span>
                        {selectedLog.geolocation.utcOffset && (
                          <span className="text-foreground-muted">({selectedLog.geolocation.utcOffset})</span>
                        )}
                      </div>
                    )}

                    {(selectedLog.geolocation.proxy || selectedLog.geolocation.vpn || selectedLog.geolocation.tor) && (
                      <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-center gap-2 text-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Security Alert</span>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          {selectedLog.geolocation.proxy && <p>Proxy/VPN connection detected</p>}
                          {selectedLog.geolocation.tor && <p>TOR exit node detected</p>}
                          {selectedLog.geolocation.mobile && <p>Mobile network</p>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Device Info */}
            <div>
              <h4 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                {getDeviceIcon(selectedLog.deviceType)}
                Device Information
              </h4>
              <div className="p-3 bg-background-secondary rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-muted">Device Type:</span>
                  <span className="text-sm capitalize">{selectedLog.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-muted">Browser:</span>
                  <span className="text-sm">{selectedLog.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-muted">Operating System:</span>
                  <span className="text-sm">{selectedLog.os}</span>
                </div>
                {selectedLog.sessionId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-muted">Session ID:</span>
                    <span className="text-sm font-mono">{selectedLog.sessionId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw User Agent */}
            <div>
              <h4 className="text-sm font-medium text-foreground-muted mb-2">Raw User Agent</h4>
              <p className="text-xs font-mono p-3 bg-background-tertiary rounded-lg break-all">
                {selectedLog.userAgent}
              </p>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
