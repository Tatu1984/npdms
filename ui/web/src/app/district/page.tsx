'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Map,
  Building,
  Phone
} from 'lucide-react'

interface District {
  id: string
  name: string
  code: string
  spName: string
  spPhone: string
  headquarters: string
  totalStations: number
  totalOfficers: number
}

interface DashboardData {
  districtId: string
  districtName: string
  period: string
  totalFirs: number
  pendingFirs: number
  resolvedFirs: number
  criticalFirs: number
  totalCases: number
  underInvestigation: number
  chargesheetFiled: number
  convicted: number
  acquitted: number
  totalOfficers: number
  onDuty: number
  onLeave: number
  vacant: number
  crimesByCategory: Record<string, number>
  stationWiseFirs: Array<{
    stationId: string
    stationName: string
    stationCode: string
    totalFirs: number
    pendingFirs: number
    resolvedFirs: number
    officers: number
    avgResolutionDays: number
  }>
  trendData: Array<{ date: string; value: number }>
  pendingAlerts: number
  criticalAlerts: number
}

interface CoordinationRequest {
  id: string
  requestType: string
  subject: string
  priority: string
  status: string
  requestingStationName: string
  targetStationName: string
  createdAt: string
}

interface Meeting {
  id: string
  title: string
  meetingDate: string
  venue: string
  status: string
}

export default function DistrictDashboardPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [period, setPeriod] = useState('MONTH')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [coordinationRequests, setCoordinationRequests] = useState<CoordinationRequest[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDistricts()
  }, [])

  useEffect(() => {
    if (selectedDistrict) {
      fetchDashboard()
      fetchCoordinationRequests()
      fetchMeetings()
    }
  }, [selectedDistrict, period])

  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/v1/district')
      const data = await response.json()
      setDistricts(data.districts || [])
      if (data.districts?.length > 0) {
        setSelectedDistrict(data.districts[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/v1/district/${selectedDistrict}/dashboard?period=${period}`)
      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    }
  }

  const fetchCoordinationRequests = async () => {
    try {
      const response = await fetch(`/api/v1/district/coordination/requests?districtId=${selectedDistrict}`)
      const data = await response.json()
      setCoordinationRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch coordination requests:', error)
    }
  }

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/v1/district/meetings?districtId=${selectedDistrict}`)
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error('Failed to fetch meetings:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'APPROVED': return 'default'
      case 'REJECTED': return 'destructive'
      case 'COMPLETED': return 'default'
      case 'IN_PROGRESS': return 'default'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const selectedDistrictData = districts.find(d => d.id === selectedDistrict)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">District Command Center</h1>
          <p className="text-muted-foreground">
            Comprehensive district-level police administration and coordination
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="WEEK">This Week</SelectItem>
              <SelectItem value="MONTH">This Month</SelectItem>
              <SelectItem value="YEAR">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDistrictData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedDistrictData.name} District</h2>
                  <p className="text-muted-foreground">Code: {selectedDistrictData.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">SP</span>
                  </div>
                  <p className="font-medium">{selectedDistrictData.spName || 'Not assigned'}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">Stations</span>
                  </div>
                  <p className="font-medium">{selectedDistrictData.totalStations}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Officers</span>
                  </div>
                  <p className="font-medium">{selectedDistrictData.totalOfficers}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Contact</span>
                  </div>
                  <p className="font-medium">{selectedDistrictData.spPhone || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dashboard && (
            <>
              {/* FIR Statistics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total FIRs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.totalFirs}</div>
                    <p className="text-xs text-muted-foreground">
                      {period === 'MONTH' ? 'This month' : period.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending FIRs</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{dashboard.pendingFirs}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.totalFirs > 0
                        ? `${((dashboard.pendingFirs / dashboard.totalFirs) * 100).toFixed(1)}% of total`
                        : 'No FIRs'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved FIRs</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboard.resolvedFirs}</div>
                    <p className="text-xs text-muted-foreground">
                      Resolution rate: {dashboard.totalFirs > 0
                        ? `${((dashboard.resolvedFirs / dashboard.totalFirs) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical FIRs</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboard.criticalFirs}</div>
                    <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                  </CardContent>
                </Card>
              </div>

              {/* Personnel & Alerts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Personnel Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{dashboard.totalOfficers}</div>
                        <p className="text-xs text-muted-foreground">Total Officers</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{dashboard.onDuty}</div>
                        <p className="text-xs text-muted-foreground">On Duty</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{dashboard.onLeave}</div>
                        <p className="text-xs text-muted-foreground">On Leave</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{dashboard.vacant}</div>
                        <p className="text-xs text-muted-foreground">Vacant</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Active Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">{dashboard.pendingAlerts}</div>
                        <p className="text-sm text-muted-foreground">Pending Alerts</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-3xl font-bold text-red-600">{dashboard.criticalAlerts}</div>
                        <p className="text-sm text-muted-foreground">Critical Alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Case Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Case Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{dashboard.totalCases}</div>
                      <p className="text-xs text-muted-foreground">Total Cases</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dashboard.underInvestigation}</div>
                      <p className="text-xs text-muted-foreground">Under Investigation</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{dashboard.chargesheetFiled}</div>
                      <p className="text-xs text-muted-foreground">Chargesheet Filed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dashboard.convicted}</div>
                      <p className="text-xs text-muted-foreground">Convicted</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{dashboard.acquitted}</div>
                      <p className="text-xs text-muted-foreground">Acquitted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crime Categories */}
              {dashboard.crimesByCategory && Object.keys(dashboard.crimesByCategory).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Crime Distribution by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(dashboard.crimesByCategory).map(([category, count]) => (
                        <div key={category} className="p-3 border rounded-lg">
                          <div className="text-lg font-semibold">{count}</div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {category.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Station-wise Performance</CardTitle>
              <CardDescription>FIR and case statistics by police station</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.stationWiseFirs && dashboard.stationWiseFirs.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.stationWiseFirs.map((station) => (
                    <div key={station.stationId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{station.stationName}</h3>
                          <p className="text-sm text-muted-foreground">Code: {station.stationCode}</p>
                        </div>
                        <Badge variant="outline">{station.officers} Officers</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">{station.totalFirs}</div>
                          <p className="text-xs text-muted-foreground">Total FIRs</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-orange-600">{station.pendingFirs}</div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{station.resolvedFirs}</div>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{station.avgResolutionDays?.toFixed(1) || '-'}</div>
                          <p className="text-xs text-muted-foreground">Avg Resolution (days)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No station data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cross-Station Coordination Requests</h2>
            <Button>New Request</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {coordinationRequests.length > 0 ? (
                <div className="space-y-4">
                  {coordinationRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{request.subject}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(request.priority) as any}>
                            {request.priority}
                          </Badge>
                          <Badge variant={getStatusColor(request.status) as any}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {request.requestType}</span>
                        <span>From: {request.requestingStationName}</span>
                        <span>To: {request.targetStationName}</span>
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No coordination requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Coordination Meetings</h2>
            <Button>Schedule Meeting</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {meetings.length > 0 ? (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <Badge variant={meeting.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {meeting.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(meeting.meetingDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {meeting.venue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No scheduled meetings</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resource Allocations</h2>
            <Button>Request Resource</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Resource allocation module - Coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
