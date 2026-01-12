"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  FileText,
  Award,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Save,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegacySelect as Select } from "@/components/ui/select";
import { useAuthStore, hasMinimumRole, getRoleDisplayName } from "@/stores/authStore";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useToastStore } from "@/stores/toastStore";

// Helper function to generate mock officer data based on ID
const getOfficerById = (id: string) => {
  const mockOfficers: any = {
    "p-001": {
      id: "p-001",
      badgeNumber: "KAR-C-4567",
      name: "Ramesh Kumar",
      rank: "CONSTABLE",
      photo: null,
      phone: "+91 9876543210",
      email: "ramesh.kumar@karpolice.gov.in",
      dateOfBirth: "1992-03-15",
      dateOfJoining: "2019-05-15",
      gender: "Male",
      bloodGroup: "B+",
      currentPosting: {
        station: "Koramangala Police Station",
        district: "Bangalore Urban",
        state: "Karnataka",
        since: "2019-05-15",
      },
      address: {
        permanent: "123, 4th Main, Jayanagar 4th Block, Bangalore - 560041",
        current: "45, 2nd Cross, Koramangala 5th Block, Bangalore - 560095",
      },
      emergency: {
        name: "Sunita Kumar",
        relation: "Spouse",
        phone: "+91 9876543211",
      },
      stats: {
        casesAssigned: 3,
        casesResolved: 2,
        pendingCases: 1,
        resolutionRate: 67,
        avgResolutionDays: 15,
        commendations: 1,
        complaints: 0,
      },
      postingHistory: [
        { station: "Koramangala PS", from: "2019-05-15", to: "Present", role: "Patrol Officer" },
      ],
      trainings: [
        { name: "Basic Police Training", year: "2019", status: "Completed" },
        { name: "Traffic Management", year: "2020", status: "Completed" },
      ],
      awards: [
        { title: "Best Newcomer", year: "2020", from: "Station SHO" },
      ],
      activeCases: [
        { firNumber: "KOR/2024/00123", type: "Theft", status: "UNDER_INVESTIGATION" },
      ],
      attendance: { present: 22, leave: 2, absent: 0, onDuty: 24 },
      status: "ON_DUTY",
      lastSeen: "2 min ago",
    },
    "p-002": {
      id: "p-002",
      badgeNumber: "KAR-HC-3456",
      name: "Mohan Singh",
      rank: "HEAD_CONSTABLE",
      photo: null,
      phone: "+91 9876543211",
      email: "mohan.singh@karpolice.gov.in",
      dateOfBirth: "1988-07-20",
      dateOfJoining: "2015-08-20",
      gender: "Male",
      bloodGroup: "O+",
      currentPosting: {
        station: "Koramangala Police Station",
        district: "Bangalore Urban",
        state: "Karnataka",
        since: "2015-08-20",
      },
      address: {
        permanent: "456, MG Road, Bangalore - 560001",
        current: "78, Brigade Road, Bangalore - 560001",
      },
      emergency: {
        name: "Rekha Singh",
        relation: "Spouse",
        phone: "+91 9876543212",
      },
      stats: {
        casesAssigned: 5,
        casesResolved: 4,
        pendingCases: 1,
        resolutionRate: 80,
        avgResolutionDays: 10,
        commendations: 2,
        complaints: 0,
      },
      postingHistory: [
        { station: "Koramangala PS", from: "2015-08-20", to: "Present", role: "Armoury In-Charge" },
      ],
      trainings: [
        { name: "Weapons Training", year: "2016", status: "Completed" },
        { name: "Security Management", year: "2018", status: "Completed" },
      ],
      awards: [
        { title: "Excellence in Service", year: "2021", from: "District SP" },
        { title: "Best Armoury Management", year: "2022", from: "Station SHO" },
      ],
      activeCases: [
        { firNumber: "KOR/2024/00145", type: "Robbery", status: "UNDER_INVESTIGATION" },
      ],
      attendance: { present: 23, leave: 1, absent: 0, onDuty: 24 },
      status: "ON_DUTY",
      lastSeen: "10 min ago",
    },
    "p-003": {
      id: "p-003",
      badgeNumber: "KAR-ASI-2345",
      name: "Prakash Rao",
      rank: "ASI",
      photo: null,
      phone: "+91 9876543212",
      email: "prakash.rao@karpolice.gov.in",
      dateOfBirth: "1985-11-10",
      dateOfJoining: "2012-03-10",
      gender: "Male",
      bloodGroup: "A+",
      currentPosting: {
        station: "Koramangala Police Station",
        district: "Bangalore Urban",
        state: "Karnataka",
        since: "2012-03-10",
      },
      address: {
        permanent: "789, Indiranagar, Bangalore - 560038",
        current: "321, HAL 2nd Stage, Bangalore - 560008",
      },
      emergency: {
        name: "Lakshmi Rao",
        relation: "Spouse",
        phone: "+91 9876543213",
      },
      stats: {
        casesAssigned: 4,
        casesResolved: 3,
        pendingCases: 1,
        resolutionRate: 75,
        avgResolutionDays: 12,
        commendations: 2,
        complaints: 0,
      },
      postingHistory: [
        { station: "Koramangala PS", from: "2012-03-10", to: "Present", role: "Investigation Officer" },
      ],
      trainings: [
        { name: "Criminal Investigation", year: "2013", status: "Completed" },
        { name: "Digital Forensics", year: "2020", status: "Completed" },
      ],
      awards: [
        { title: "Investigator of the Year", year: "2019", from: "District SP" },
      ],
      activeCases: [
        { firNumber: "KOR/2024/00098", type: "Fraud", status: "UNDER_INVESTIGATION" },
      ],
      attendance: { present: 20, leave: 4, absent: 0, onDuty: 24 },
      status: "ON_LEAVE",
      lastSeen: "1 day ago",
    },
    "p-004": {
      id: "p-004",
      badgeNumber: "KAR-SI-1234",
      name: "Suresh Patil",
      rank: "SI",
      photo: null,
      phone: "+91 9876543213",
      email: "suresh.patil@karpolice.gov.in",
      dateOfBirth: "1982-06-01",
      dateOfJoining: "2010-07-01",
      gender: "Male",
      bloodGroup: "AB+",
      currentPosting: {
        station: "Koramangala Police Station",
        district: "Bangalore Urban",
        state: "Karnataka",
        since: "2010-07-01",
      },
      address: {
        permanent: "234, Malleshwaram, Bangalore - 560003",
        current: "567, Koramangala 6th Block, Bangalore - 560095",
      },
      emergency: {
        name: "Anita Patil",
        relation: "Spouse",
        phone: "+91 9876543214",
      },
      stats: {
        casesAssigned: 8,
        casesResolved: 7,
        pendingCases: 1,
        resolutionRate: 87,
        avgResolutionDays: 8,
        commendations: 3,
        complaints: 0,
      },
      postingHistory: [
        { station: "Koramangala PS", from: "2018-01-01", to: "Present", role: "Investigation Officer" },
        { station: "BTM Layout PS", from: "2010-07-01", to: "2017-12-31", role: "Beat Officer" },
      ],
      trainings: [
        { name: "Advanced Investigation", year: "2015", status: "Completed" },
        { name: "Crime Scene Management", year: "2019", status: "Completed" },
        { name: "Cyber Crime", year: "2023", status: "Completed" },
      ],
      awards: [
        { title: "Best Investigation Award", year: "2023", from: "District SP" },
        { title: "Commendation Letter", year: "2021", from: "DGP Office" },
      ],
      activeCases: [
        { firNumber: "KOR/2024/00123", type: "Theft", status: "UNDER_INVESTIGATION" },
      ],
      attendance: { present: 24, leave: 0, absent: 0, onDuty: 24 },
      status: "ON_DUTY",
      lastSeen: "Just now",
    },
  };

  // Return officer data if exists, otherwise generate a generic one
  return mockOfficers[id] || {
    id,
    badgeNumber: `KAR-${id.slice(-3)}`,
    name: "Unknown Officer",
    rank: "CONSTABLE",
    photo: null,
    phone: "+91 9876543210",
    email: "officer@karpolice.gov.in",
    dateOfBirth: "1990-01-01",
    dateOfJoining: "2020-01-01",
    gender: "Male",
    bloodGroup: "O+",
    currentPosting: {
      station: "Koramangala Police Station",
      district: "Bangalore Urban",
      state: "Karnataka",
      since: "2020-01-01",
    },
    address: {
      permanent: "Address not available",
      current: "Address not available",
    },
    emergency: {
      name: "Not available",
      relation: "N/A",
      phone: "N/A",
    },
    stats: {
      casesAssigned: 0,
      casesResolved: 0,
      pendingCases: 0,
      resolutionRate: 0,
      avgResolutionDays: 0,
      commendations: 0,
      complaints: 0,
    },
    postingHistory: [],
    trainings: [],
    awards: [],
    activeCases: [],
    attendance: { present: 0, leave: 0, absent: 0, onDuty: 0 },
    status: "ON_DUTY",
    lastSeen: "Unknown",
  };
};

function getStatusBadge(status: string) {
  switch (status) {
    case "ON_DUTY":
      return <Badge variant="success">On Duty</Badge>;
    case "OFF_DUTY":
      return <Badge variant="secondary">Off Duty</Badge>;
    case "ON_LEAVE":
      return <Badge variant="warning">On Leave</Badge>;
    case "SUSPENDED":
      return <Badge variant="error">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function OfficerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditMode, setIsEditMode] = useState(false);

  // Get officer data using useMemo to avoid setState in useEffect
  const officerData = useMemo(() => {
    const officerId = params.id as string;
    return getOfficerById(officerId);
  }, [params.id]);

  const [officer, setOfficer] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);

  const canEdit = user && hasMinimumRole(user.role, "SHO");

  // Sync officer data when it changes
  useEffect(() => {
    if (officerData && officer !== officerData) {
      setOfficer(officerData);
      setEditedData(officerData);
    }
  }, [officerData, officer]);

  const handleEditToggle = () => {
    if (isEditMode) {
      // Reset to original data on cancel
      setEditedData(officer);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    try {
      // Update the officer data
      setOfficer(editedData);
      setIsEditMode(false);

      addToast({
        type: "success",
        title: "Profile Updated",
        message: `${editedData.name}'s profile has been updated successfully.`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update profile. Please try again.",
      });
    }
  };

  if (!officer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground-muted">Loading officer details...</p>
        </div>
      </DashboardLayout>
    );
  }

  const mockOfficer = officer;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-8 w-8 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {mockOfficer.name}
                  </h1>
                  {getStatusBadge(mockOfficer.status)}
                </div>
                <div className="flex items-center gap-4 text-foreground-muted">
                  <span className="font-mono text-accent">{mockOfficer.badgeNumber}</span>
                  <span>|</span>
                  <span>{getRoleDisplayName(mockOfficer.rank as any)}</span>
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button variant="secondary" onClick={handleEditToggle}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditToggle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">{mockOfficer.stats.casesAssigned}</p>
              <p className="text-sm text-foreground-muted">Cases Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{mockOfficer.stats.casesResolved}</p>
              <p className="text-sm text-foreground-muted">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning">{mockOfficer.stats.pendingCases}</p>
              <p className="text-sm text-foreground-muted">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-info">{mockOfficer.stats.resolutionRate}%</p>
              <p className="text-sm text-foreground-muted">Resolution Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{mockOfficer.stats.commendations}</p>
              <p className="text-sm text-foreground-muted">Commendations</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="cases">
              <FileText className="h-4 w-4 mr-2" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="career">
              <Briefcase className="h-4 w-4 mr-2" />
              Career
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditMode ? (
                    <>
                      <Input
                        label="Full Name"
                        value={editedData.name}
                        onChange={(v: string) => setEditedData({ ...editedData, name: v })}
                      />
                      <Input
                        label="Badge Number"
                        value={editedData.badgeNumber}
                        disabled
                      />
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={editedData.dateOfBirth}
                        onChange={(v: string) => setEditedData({ ...editedData, dateOfBirth: v })}
                      />
                      <Select
                        label="Gender"
                        value={editedData.gender}
                        onChange={(v: string) => setEditedData({ ...editedData, gender: v })}
                        options={[
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                      <Select
                        label="Blood Group"
                        value={editedData.bloodGroup}
                        onChange={(v: string) => setEditedData({ ...editedData, bloodGroup: v })}
                        options={[
                          { value: "A+", label: "A+" },
                          { value: "A-", label: "A-" },
                          { value: "B+", label: "B+" },
                          { value: "B-", label: "B-" },
                          { value: "AB+", label: "AB+" },
                          { value: "AB-", label: "AB-" },
                          { value: "O+", label: "O+" },
                          { value: "O-", label: "O-" },
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Full Name</span>
                        <span className="text-foreground">{mockOfficer.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Badge Number</span>
                        <span className="font-mono text-accent">{mockOfficer.badgeNumber}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Rank</span>
                        <span className="text-foreground">{getRoleDisplayName(mockOfficer.rank as any)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Date of Birth</span>
                        <span className="text-foreground">{mockOfficer.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Gender</span>
                        <span className="text-foreground">{mockOfficer.gender}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-foreground-muted">Blood Group</span>
                        <Badge variant="error">{mockOfficer.bloodGroup}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditMode ? (
                    <>
                      <Input
                        label="Phone Number"
                        value={editedData.phone}
                        onChange={(v: string) => setEditedData({ ...editedData, phone: v })}
                        icon={<Phone className="h-4 w-4" />}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={editedData.email}
                        onChange={(v: string) => setEditedData({ ...editedData, email: v })}
                        icon={<Mail className="h-4 w-4" />}
                      />
                      <Textarea
                        label="Permanent Address"
                        value={editedData.address.permanent}
                        onChange={(v: string) =>
                          setEditedData({
                            ...editedData,
                            address: { ...editedData.address, permanent: v },
                          })
                        }
                        rows={2}
                      />
                      <Textarea
                        label="Current Address"
                        value={editedData.address.current}
                        onChange={(v: string) =>
                          setEditedData({
                            ...editedData,
                            address: { ...editedData.address, current: v },
                          })
                        }
                        rows={2}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 py-2 border-b border-border">
                        <Phone className="h-4 w-4 text-foreground-muted" />
                        <span className="text-foreground">{mockOfficer.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 py-2 border-b border-border">
                        <Mail className="h-4 w-4 text-foreground-muted" />
                        <span className="text-foreground">{mockOfficer.email}</span>
                      </div>
                      <div className="py-2 border-b border-border">
                        <div className="flex items-center gap-2 text-foreground-muted mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Permanent Address</span>
                        </div>
                        <p className="text-foreground text-sm">{mockOfficer.address.permanent}</p>
                      </div>
                      <div className="py-2">
                        <div className="flex items-center gap-2 text-foreground-muted mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Current Address</span>
                        </div>
                        <p className="text-foreground text-sm">{mockOfficer.address.current}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Current Posting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Posting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">Station</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.station}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">District</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.district}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-foreground-muted">State</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.state}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-foreground-muted">Posted Since</span>
                    <span className="text-foreground">{mockOfficer.currentPosting.since}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-error/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditMode ? (
                    <>
                      <Input
                        label="Contact Name"
                        value={editedData.emergency.name}
                        onChange={(v: string) =>
                          setEditedData({
                            ...editedData,
                            emergency: { ...editedData.emergency, name: v },
                          })
                        }
                      />
                      <Input
                        label="Relationship"
                        value={editedData.emergency.relation}
                        onChange={(v: string) =>
                          setEditedData({
                            ...editedData,
                            emergency: { ...editedData.emergency, relation: v },
                          })
                        }
                      />
                      <Input
                        label="Phone"
                        value={editedData.emergency.phone}
                        onChange={(v: string) =>
                          setEditedData({
                            ...editedData,
                            emergency: { ...editedData.emergency, phone: v },
                          })
                        }
                        icon={<Phone className="h-4 w-4" />}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Name</span>
                        <span className="text-foreground">{mockOfficer.emergency.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-foreground-muted">Relationship</span>
                        <span className="text-foreground">{mockOfficer.emergency.relation}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-foreground-muted">Phone</span>
                        <span className="text-foreground">{mockOfficer.emergency.phone}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOfficer.activeCases.map((caseItem: { firNumber: string; type: string; status: string }, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                    >
                      <div>
                        <span className="font-mono text-accent">{caseItem.firNumber}</span>
                        <p className="text-sm text-foreground-muted">{caseItem.type}</p>
                      </div>
                      <Badge variant="investigating">{caseItem.status.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Tab */}
          <TabsContent value="career" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Posting History */}
              <Card>
                <CardHeader>
                  <CardTitle>Posting History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOfficer.postingHistory.map((posting: { station: string; from: string; to: string; role: string }, index: number) => (
                      <div key={index} className="relative pl-6 pb-4 border-l-2 border-border last:pb-0">
                        <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-accent" />
                        <p className="font-medium text-foreground">{posting.station}</p>
                        <p className="text-sm text-foreground-muted">{posting.role}</p>
                        <p className="text-xs text-foreground-muted">{posting.from} - {posting.to}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trainings */}
              <Card>
                <CardHeader>
                  <CardTitle>Training & Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockOfficer.trainings.map((training: { name: string; year: string; status: string }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                      >
                        <div>
                          <p className="font-medium text-foreground">{training.name}</p>
                          <p className="text-sm text-foreground-muted">{training.year}</p>
                        </div>
                        <Badge variant={training.status === "Completed" ? "success" : "info"}>
                          {training.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Awards */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Awards & Commendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockOfficer.awards.map((award: { title: string; year: string; from: string }, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                      >
                        <Award className="h-6 w-6 text-warning mb-2" />
                        <p className="font-medium text-foreground">{award.title}</p>
                        <p className="text-sm text-foreground-muted">From: {award.from}</p>
                        <p className="text-xs text-foreground-muted">{award.year}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-foreground">Resolution Rate</span>
                      <span className="text-success font-medium">{mockOfficer.stats.resolutionRate}%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${mockOfficer.stats.resolutionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Avg. Resolution Time</span>
                    <span className="text-foreground">{mockOfficer.stats.avgResolutionDays} days</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-foreground-muted">Complaints Filed</span>
                    <span className="text-success">{mockOfficer.stats.complaints}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month&apos;s Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-success/10 text-center">
                      <p className="text-2xl font-bold text-success">{mockOfficer.attendance.present}</p>
                      <p className="text-sm text-foreground-muted">Present</p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 text-center">
                      <p className="text-2xl font-bold text-warning">{mockOfficer.attendance.leave}</p>
                      <p className="text-sm text-foreground-muted">Leave</p>
                    </div>
                    <div className="p-4 rounded-lg bg-error/10 text-center">
                      <p className="text-2xl font-bold text-error">{mockOfficer.attendance.absent}</p>
                      <p className="text-sm text-foreground-muted">Absent</p>
                    </div>
                    <div className="p-4 rounded-lg bg-info/10 text-center">
                      <p className="text-2xl font-bold text-info">{mockOfficer.attendance.onDuty}</p>
                      <p className="text-sm text-foreground-muted">Total Days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
