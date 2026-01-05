"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Fingerprint,
  Camera,
  Upload,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const ranks = [
  { value: "CONSTABLE", label: "Constable" },
  { value: "HEAD_CONSTABLE", label: "Head Constable" },
  { value: "ASI", label: "Assistant Sub-Inspector" },
  { value: "SI", label: "Sub-Inspector" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "DSP", label: "Deputy SP" },
  { value: "SP", label: "Superintendent of Police" },
];

const bloodGroups = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

export default function NewPersonnelPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const canCreate = user && hasMinimumRole(user.role, "SHO");

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    email: "",
    permanentAddress: "",
    currentAddress: "",

    // Service Info
    rank: "",
    badgeNumber: "",
    dateOfJoining: "",
    postingStation: user?.stationName || "",
    previousPosting: "",
    specialization: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",

    // Documents
    aadharNumber: "",
    panNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const badgeNumber = `KAR-${formData.rank.slice(0, 2)}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    alert(`Officer registered successfully!\nBadge Number: ${badgeNumber}`);
    router.push("/personnel");
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-foreground-muted">
              You need SHO level or above to register new personnel.
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
            <h1 className="text-2xl font-bold text-foreground">Register New Officer</h1>
            <p className="text-foreground-muted">
              Add a new officer to the station roster
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.back()}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name *"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(v: string) =>
                        setFormData({ ...formData, firstName: v })
                      }
                      required
                    />
                    <Input
                      label="Last Name *"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(v: string) =>
                        setFormData({ ...formData, lastName: v })
                      }
                      required
                    />
                  </div>

                  <Input
                    label="Father's Name *"
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={(v: string) =>
                      setFormData({ ...formData, fatherName: v })
                    }
                    required
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Date of Birth *"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(v: string) =>
                        setFormData({ ...formData, dateOfBirth: v })
                      }
                      required
                    />
                    <Select
                      label="Gender *"
                      value={formData.gender}
                      onChange={(v: string) =>
                        setFormData({ ...formData, gender: v })
                      }
                      options={[
                        { value: "MALE", label: "Male" },
                        { value: "FEMALE", label: "Female" },
                        { value: "OTHER", label: "Other" },
                      ]}
                      required
                    />
                    <Select
                      label="Blood Group"
                      value={formData.bloodGroup}
                      onChange={(v: string) =>
                        setFormData({ ...formData, bloodGroup: v })
                      }
                      options={bloodGroups}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number *"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(v: string) =>
                        setFormData({ ...formData, phone: v })
                      }
                      icon={<Phone className="h-4 w-4" />}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="officer@karpolice.gov.in"
                      value={formData.email}
                      onChange={(v: string) =>
                        setFormData({ ...formData, email: v })
                      }
                      icon={<Mail className="h-4 w-4" />}
                    />
                  </div>

                  <Textarea
                    label="Permanent Address *"
                    placeholder="Full permanent address"
                    value={formData.permanentAddress}
                    onChange={(v: string) =>
                      setFormData({ ...formData, permanentAddress: v })
                    }
                    rows={2}
                    required
                  />

                  <Textarea
                    label="Current Address"
                    placeholder="Current residential address"
                    value={formData.currentAddress}
                    onChange={(v: string) =>
                      setFormData({ ...formData, currentAddress: v })
                    }
                    rows={2}
                  />
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Rank *"
                      value={formData.rank}
                      onChange={(v: string) =>
                        setFormData({ ...formData, rank: v })
                      }
                      options={ranks}
                      required
                    />
                    <Input
                      label="Badge Number"
                      placeholder="Auto-generated"
                      value={formData.badgeNumber}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Date of Joining *"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={(v: string) =>
                        setFormData({ ...formData, dateOfJoining: v })
                      }
                      required
                    />
                    <Input
                      label="Posting Station"
                      value={formData.postingStation}
                      disabled
                    />
                  </div>

                  <Input
                    label="Previous Posting (if any)"
                    placeholder="Previous station/department"
                    value={formData.previousPosting}
                    onChange={(v: string) =>
                      setFormData({ ...formData, previousPosting: v })
                    }
                  />

                  <Input
                    label="Specialization"
                    placeholder="e.g., Cyber Crime, Traffic, Investigation"
                    value={formData.specialization}
                    onChange={(v: string) =>
                      setFormData({ ...formData, specialization: v })
                    }
                  />
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Contact Name *"
                      placeholder="Emergency contact name"
                      value={formData.emergencyContactName}
                      onChange={(v: string) =>
                        setFormData({ ...formData, emergencyContactName: v })
                      }
                      required
                    />
                    <Input
                      label="Relationship *"
                      placeholder="e.g., Spouse, Parent"
                      value={formData.emergencyContactRelation}
                      onChange={(v: string) =>
                        setFormData({ ...formData, emergencyContactRelation: v })
                      }
                      required
                    />
                  </div>
                  <Input
                    label="Contact Phone *"
                    placeholder="+91 9876543210"
                    value={formData.emergencyContactPhone}
                    onChange={(v: string) =>
                      setFormData({ ...formData, emergencyContactPhone: v })
                    }
                    icon={<Phone className="h-4 w-4" />}
                    required
                  />
                </CardContent>
              </Card>

              {/* Identity Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Aadhar Number *"
                      placeholder="XXXX XXXX XXXX"
                      value={formData.aadharNumber}
                      onChange={(v: string) =>
                        setFormData({ ...formData, aadharNumber: v })
                      }
                      required
                    />
                    <Input
                      label="PAN Number"
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(v: string) =>
                        setFormData({ ...formData, panNumber: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Officer Photo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => setPhotoUploaded(true)}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
                  >
                    {photoUploaded ? (
                      <div className="space-y-2">
                        <div className="h-24 w-24 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                          <User className="h-12 w-12 text-accent" />
                        </div>
                        <p className="text-sm text-success">Photo uploaded</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                        <p className="text-sm text-foreground-muted">
                          Click to upload photo
                        </p>
                        <p className="text-xs text-foreground-muted mt-1">
                          Passport size, JPG/PNG
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Biometric Enrollment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Biometric Enrollment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 rounded-lg bg-background-tertiary">
                    <Fingerprint className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted mb-3">
                      Fingerprint enrollment required for system access
                    </p>
                    <Button variant="secondary" size="sm">
                      Start Enrollment
                    </Button>
                  </div>
                  <div className="mt-4 p-3 rounded bg-info/10">
                    <p className="text-xs text-info">
                      Biometric enrollment can be completed after initial registration
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Registering...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Register Officer
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
