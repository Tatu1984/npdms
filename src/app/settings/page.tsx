"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Monitor,
  Moon,
  Sun,
  Lock,
  Key,
  Smartphone,
  Fingerprint,
  History,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

export default function SettingsPage() {
  const { user, syncState } = useAuthStore();
  const [activeTab, setActiveTab] = useState("general");

  const isAdmin = user && hasMinimumRole(user.role, "SHO");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground-muted">
            Manage your preferences and system configuration
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="sync">
              <Database className="h-4 w-4 mr-2" />
              Sync & Data
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">
                <Lock className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Theme</p>
                    <p className="text-sm text-foreground-muted">
                      Select your preferred color scheme
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Language</p>
                    <p className="text-sm text-foreground-muted">
                      Select display language
                    </p>
                  </div>
                  <Select
                    options={[
                      { value: "en", label: "English" },
                      { value: "hi", label: "Hindi" },
                      { value: "kn", label: "Kannada" },
                      { value: "ta", label: "Tamil" },
                      { value: "te", label: "Telugu" },
                    ]}
                    value="en"
                    onChange={() => {}}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Date Format</p>
                    <p className="text-sm text-foreground-muted">
                      Select date display format
                    </p>
                  </div>
                  <Select
                    options={[
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                    ]}
                    value="DD/MM/YYYY"
                    onChange={() => {}}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Compact Mode</p>
                    <p className="text-sm text-foreground-muted">
                      Display more information in less space
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Disabled
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Time Zone</p>
                    <p className="text-sm text-foreground-muted">
                      Current: IST (India Standard Time)
                    </p>
                  </div>
                  <Badge variant="success">Auto-detected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Currency</p>
                    <p className="text-sm text-foreground-muted">
                      For displaying monetary values
                    </p>
                  </div>
                  <span className="text-foreground">₹ INR</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Flash Alerts", desc: "Immediate critical alerts", enabled: true },
                  { title: "BOLO Notices", desc: "Be on lookout notifications", enabled: true },
                  { title: "Case Updates", desc: "Updates on assigned cases", enabled: true },
                  { title: "FIR Assignments", desc: "New FIR assigned to you", enabled: true },
                  { title: "SLA Reminders", desc: "Deadline approaching alerts", enabled: true },
                  { title: "Meeting Notices", desc: "Scheduled meetings", enabled: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-foreground-muted">{item.desc}</p>
                    </div>
                    <Button variant={item.enabled ? "default" : "ghost"} size="sm">
                      {item.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Desktop Notifications</p>
                    <p className="text-sm text-foreground-muted">
                      Show browser notifications
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Sound Alerts</p>
                    <p className="text-sm text-foreground-muted">
                      Play sound for critical alerts
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-foreground-muted">
                      Last changed 30 days ago
                    </p>
                  </div>
                  <Button variant="secondary">Change Password</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-foreground-muted">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Biometric Login</p>
                    <p className="text-sm text-foreground-muted">
                      Use fingerprint/face for login
                    </p>
                  </div>
                  <Button variant="secondary">Configure</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Session History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    device: "Windows PC - Chrome",
                    location: "Bengaluru, Karnataka",
                    time: "Active now",
                    current: true,
                  },
                  {
                    device: "Android - NPDMS App",
                    location: "Bengaluru, Karnataka",
                    time: "2 hours ago",
                    current: false,
                  },
                ].map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                  >
                    <div>
                      <p className="font-medium text-foreground">{session.device}</p>
                      <p className="text-sm text-foreground-muted">
                        {session.location} • {session.time}
                      </p>
                    </div>
                    {session.current ? (
                      <Badge variant="success">Current</Badge>
                    ) : (
                      <Button variant="ghost" size="sm">
                        Logout
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync & Data Settings */}
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                    <div>
                      <p className="font-medium text-foreground">
                        {syncState.status === "ONLINE" ? "Connected" : syncState.status}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        Last sync: {syncState.lastSyncTime ? new Date(syncState.lastSyncTime).toLocaleString("en-IN") : "Never"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary">Sync Now</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Pending Changes</p>
                    <p className="text-sm text-foreground-muted">
                      Changes waiting to sync
                    </p>
                  </div>
                  <Badge variant={syncState.pendingChanges > 0 ? "warning" : "success"}>
                    {syncState.pendingChanges} items
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto Sync</p>
                    <p className="text-sm text-foreground-muted">
                      Automatically sync when online
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Offline Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Cached Data</p>
                    <p className="text-sm text-foreground-muted">
                      Data stored for offline access
                    </p>
                  </div>
                  <span className="text-foreground">45 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Download Station Data</p>
                    <p className="text-sm text-foreground-muted">
                      Download FIRs and cases for offline
                    </p>
                  </div>
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Clear Cache</p>
                    <p className="text-sm text-foreground-muted">
                      Remove offline data
                    </p>
                  </div>
                  <Button variant="ghost">Clear</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Settings */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Station Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Station Code</p>
                      <p className="text-sm text-foreground-muted">
                        Unique identifier for this station
                      </p>
                    </div>
                    <span className="font-mono text-accent">KOR-001</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">FIR Prefix</p>
                      <p className="text-sm text-foreground-muted">
                        Prefix for FIR numbering
                      </p>
                    </div>
                    <span className="font-mono">KOR/2024/</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Auto-assign FIRs</p>
                      <p className="text-sm text-foreground-muted">
                        Automatically assign IOs
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Disabled
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Database", status: "Operational", ok: true },
                    { name: "Sync Service", status: "Operational", ok: true },
                    { name: "AI Services", status: "Operational", ok: true },
                    { name: "Backup", status: "Last: 2 hours ago", ok: true },
                  ].map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                    >
                      <span className="text-foreground">{service.name}</span>
                      <Badge variant={service.ok ? "success" : "error"}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
