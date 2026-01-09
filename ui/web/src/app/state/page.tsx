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
  Shield,
  BarChart3,
  Map,
  Building,
  Phone,
  Globe,
  Layers,
  Target,
  Bell
} from 'lucide-react'

interface State {
  id: string
  name: string
  code: string
  dgpName: string
  dgpPhone: string
  population: number
  totalOfficers: number
}

interface StateDashboard {
  stateId: string
  stateName: string
  stateCode: string
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
  totalZones: number
  totalRanges: number
  totalDistricts: number
  totalStations: number
  totalOfficers: number
  zoneWiseStats: Array<{
    zoneId: string
    zoneName: string
    zoneCode: string
    totalDistricts: number
    totalStations: number
    totalFirs: number
    pendingFirs: number
    resolvedFirs: number
    resolutionRate: number
  }>
  topDistricts: Array<{
    rank: number
    districtId: string
    districtName: string
    districtCode: string
    metricValue: number
    totalFirs: number
    resolvedFirs: number
    resolutionRate: number
    avgResolutionDays: number
  }>
  crimesByCategory: Record<string, number>
  pendingAlerts: number
  criticalAlerts: number
}

interface StateAlert {
  id: string
  alertType: string
  severity: string
  title: string
  description: string
  status: string
  createdAt: string
}

export default function StateCommandPage() {
  const [states, setStates] = useState<State[]>([])
  const [selectedState, setSelectedState] = useState<string>('')
  const [period, setPeriod] = useState('MONTH')
  const [dashboard, setDashboard] = useState<StateDashboard | null>(null)
  const [alerts, setAlerts] = useState<StateAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (selectedState) {
      fetchDashboard()
      fetchAlerts()
    }
  }, [selectedState, period])

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/v1/state')
      const data = await response.json()
      setStates(data.states || [])
      if (data.states?.length > 0) {
        setSelectedState(data.states[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch states:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/v1/state/${selectedState}/dashboard?period=${period}`)
      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/v1/state/alerts?stateId=${selectedState}&status=ACTIVE`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const selectedStateData = states.find(s => s.id === selectedState)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">State Command Center</h1>
          <p className="text-muted-foreground">
            State-wide police operations monitoring and coordination
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name} ({state.code})
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

      {selectedStateData && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-600 text-white">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStateData.name} Police</h2>
                  <p className="text-muted-foreground">State Code: {selectedStateData.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">DGP</span>
                  </div>
                  <p className="font-medium">{selectedStateData.dgpName || 'Not assigned'}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Population</span>
                  </div>
                  <p className="font-medium">
                    {selectedStateData.population ? `${(selectedStateData.population / 10000000).toFixed(1)} Cr` : '-'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Officers</span>
                  </div>
                  <p className="font-medium">{selectedStateData.totalOfficers?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy Overview */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zones</CardTitle>
              <Layers className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalZones}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ranges</CardTitle>
              <Target className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalRanges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Districts</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalDistricts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stations</CardTitle>
              <Building className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalStations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Officers</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalOfficers?.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zone Analysis</TabsTrigger>
          <TabsTrigger value="districts">District Rankings</TabsTrigger>
          <TabsTrigger value="alerts">State Alerts</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
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
                    <div className="text-2xl font-bold">{dashboard.totalFirs?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">State-wide {period.toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending FIRs</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{dashboard.pendingFirs?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.totalFirs > 0
                        ? `${((dashboard.pendingFirs / dashboard.totalFirs) * 100).toFixed(1)}% of total`
                        : '-'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved FIRs</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboard.resolvedFirs?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Resolution rate: {dashboard.totalFirs > 0
                        ? `${((dashboard.resolvedFirs / dashboard.totalFirs) * 100).toFixed(1)}%`
                        : '-'}
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

              {/* Case Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Case Disposition Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{dashboard.totalCases?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total Cases</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">{dashboard.underInvestigation?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Under Investigation</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-purple-50">
                      <div className="text-2xl font-bold text-purple-600">{dashboard.chargesheetFiled?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Chargesheet Filed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">{dashboard.convicted?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Convicted</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-red-50">
                      <div className="text-2xl font-bold text-red-600">{dashboard.acquitted?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Acquitted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
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

                {/* Crime Categories */}
                {dashboard.crimesByCategory && Object.keys(dashboard.crimesByCategory).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Crime Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(dashboard.crimesByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm capitalize">{category.replace(/_/g, ' ').toLowerCase()}</span>
                              <Badge variant="secondary">{count.toLocaleString()}</Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone-wise Performance</CardTitle>
              <CardDescription>FIR statistics and resolution rates by zone</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.zoneWiseStats && dashboard.zoneWiseStats.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.zoneWiseStats.map((zone) => (
                    <div key={zone.zoneId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{zone.zoneName}</h3>
                          <p className="text-sm text-muted-foreground">Code: {zone.zoneCode}</p>
                        </div>
                        <Badge
                          variant={zone.resolutionRate >= 70 ? 'default' : zone.resolutionRate >= 50 ? 'secondary' : 'destructive'}
                        >
                          {zone.resolutionRate.toFixed(1)}% Resolution
                        </Badge>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">{zone.totalDistricts}</div>
                          <p className="text-xs text-muted-foreground">Districts</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{zone.totalStations}</div>
                          <p className="text-xs text-muted-foreground">Stations</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{zone.totalFirs}</div>
                          <p className="text-xs text-muted-foreground">Total FIRs</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-orange-600">{zone.pendingFirs}</div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{zone.resolvedFirs}</div>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No zone data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>District Performance Rankings</CardTitle>
              <CardDescription>Top performing districts by resolution rate</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.topDistricts && dashboard.topDistricts.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.topDistricts.map((district) => (
                    <div key={district.districtId} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${district.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          district.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          district.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'}`}>
                        #{district.rank}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{district.districtName}</h3>
                        <p className="text-sm text-muted-foreground">Code: {district.districtCode}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <div className="font-semibold">{district.totalFirs}</div>
                          <p className="text-xs text-muted-foreground">Total FIRs</p>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{district.resolvedFirs}</div>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-600">{district.resolutionRate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Resolution Rate</p>
                        </div>
                        <div>
                          <div className="font-semibold">{district.avgResolutionDays.toFixed(1)}</div>
                          <p className="text-xs text-muted-foreground">Avg Days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No district ranking data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">State-Wide Alerts</h2>
            <Button>Create Alert</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{alert.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{alert.alertType}</Badge>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                        <Badge variant="secondary">{alert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No active alerts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Inter-District Coordination</h2>
            <Button>New Request</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Inter-district coordination requests will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
