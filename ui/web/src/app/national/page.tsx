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
  TrendingDown,
  Shield,
  BarChart3,
  Map,
  Globe,
  Layers,
  Target,
  Bell,
  Flag,
  Activity,
  Award
} from 'lucide-react'

interface NationalDashboard {
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
  totalStates: number
  totalZones: number
  totalRanges: number
  totalDistricts: number
  totalStations: number
  totalOfficers: number
  stateWiseStats: Array<{
    rank: number
    stateId: string
    stateName: string
    stateCode: string
    totalFirs: number
    resolvedFirs: number
    resolutionRate: number
    convictionRate: number
    totalOfficers: number
    population: number
  }>
  crimesByCategory: Record<string, number>
  nationalAlerts: number
  criticalAlerts: number
  nationalTrends: Array<{ date: string; value: number }>
}

interface NationalAlert {
  id: string
  alertType: string
  severity: string
  title: string
  description: string
  status: string
  createdAt: string
}

export default function NationalCommandPage() {
  const [period, setPeriod] = useState('MONTH')
  const [dashboard, setDashboard] = useState<NationalDashboard | null>(null)
  const [alerts, setAlerts] = useState<NationalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboard()
    fetchAlerts()
  }, [period])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/v1/national/dashboard?period=${period}`)
      const data = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/national/alerts?status=ACTIVE')
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Command Center</h1>
          <p className="text-muted-foreground">
            Pan-India police operations monitoring and coordination
          </p>
        </div>
        <div className="flex items-center gap-4">
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

      {/* National Header Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-lg bg-white/20">
                <Flag className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">India Police Network</h2>
                <p className="text-white/80">National Crime Records Bureau Dashboard</p>
              </div>
            </div>
            {dashboard && (
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">{dashboard.totalStates}</div>
                  <p className="text-sm text-white/80">States/UTs</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{dashboard.totalDistricts?.toLocaleString()}</div>
                  <p className="text-sm text-white/80">Districts</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{dashboard.totalStations?.toLocaleString()}</div>
                  <p className="text-sm text-white/80">Stations</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{dashboard.totalOfficers?.toLocaleString()}</div>
                  <p className="text-sm text-white/80">Officers</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Stats */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States/UTs</CardTitle>
              <Globe className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalStates}</div>
            </CardContent>
          </Card>
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
              <div className="text-2xl font-bold">{dashboard.totalDistricts?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stations</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalStations?.toLocaleString()}</div>
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
          <TabsTrigger value="states">State Rankings</TabsTrigger>
          <TabsTrigger value="alerts">National Alerts</TabsTrigger>
          <TabsTrigger value="coordination">Inter-State Coordination</TabsTrigger>
          <TabsTrigger value="patterns">Crime Patterns</TabsTrigger>
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
                    <p className="text-xs text-muted-foreground">National total ({period.toLowerCase()})</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending FIRs</CardTitle>
                    <Activity className="h-4 w-4 text-orange-500" />
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
                      National resolution: {dashboard.totalFirs > 0
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
                    <div className="text-2xl font-bold text-red-600">{dashboard.criticalFirs?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">High priority cases</p>
                  </CardContent>
                </Card>
              </div>

              {/* Case Disposition */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    National Case Disposition
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

              {/* Alerts and Crime Categories */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      National Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">{dashboard.nationalAlerts}</div>
                        <p className="text-sm text-muted-foreground">Active Alerts</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-3xl font-bold text-red-600">{dashboard.criticalAlerts}</div>
                        <p className="text-sm text-muted-foreground">Critical Alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {dashboard.crimesByCategory && Object.keys(dashboard.crimesByCategory).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Crime Categories (National)</CardTitle>
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

        <TabsContent value="states" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                State Performance Rankings
              </CardTitle>
              <CardDescription>Ranked by FIR resolution rate</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.stateWiseStats && dashboard.stateWiseStats.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.stateWiseStats.map((state) => (
                    <div key={state.stateId} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                        ${state.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          state.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          state.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'}`}>
                        #{state.rank}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{state.stateName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {state.stateCode} | Officers: {state.totalOfficers?.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <div className="font-semibold">{state.totalFirs?.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">Total FIRs</p>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{state.resolvedFirs?.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-600">{state.resolutionRate?.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Resolution</p>
                        </div>
                        <div>
                          <div className="font-semibold text-purple-600">{state.convictionRate?.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Conviction</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No state data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">National Alerts</h2>
            <Button>Issue National Alert</Button>
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
                          <Badge variant="outline">{alert.alertType.replace(/_/g, ' ')}</Badge>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Issued: {new Date(alert.createdAt).toLocaleString()}</span>
                        <Badge variant="secondary">{alert.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No active national alerts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Inter-State Coordination</h2>
            <Button>New Inter-State Request</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Inter-state coordination requests will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">National Crime Patterns</h2>
            <Button>Add Pattern</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Crime pattern analysis will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
