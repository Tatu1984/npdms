"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  Briefcase,
  Users,
  Car,
  Package,
  AlertTriangle,
  Clock,
  Filter,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

// Mock search results
const mockResults = {
  firs: [
    {
      id: "fir-001",
      firNumber: "KOR/2024/00123",
      complainant: "Rajesh Sharma",
      offence: "Theft",
      status: "UNDER_INVESTIGATION",
      date: "2024-01-15",
    },
    {
      id: "fir-002",
      firNumber: "KOR/2024/00089",
      complainant: "Sunil Kumar",
      offence: "Theft",
      status: "CLOSED",
      date: "2024-01-10",
    },
  ],
  cases: [
    {
      id: "case-001",
      caseNumber: "CC/2024/KOR/00089",
      title: "State vs Unknown",
      status: "ACTIVE",
      firNumber: "KOR/2024/00123",
    },
  ],
  persons: [
    {
      id: "per-001",
      name: "Rajesh Sharma",
      type: "COMPLAINANT",
      linkedFIRs: ["KOR/2024/00123"],
      phone: "+91 9876543210",
    },
    {
      id: "per-002",
      name: "Ramesh Kumar",
      type: "OFFICER",
      badgeNumber: "KAR-C-4567",
      rank: "Constable",
    },
  ],
  vehicles: [
    {
      id: "veh-001",
      regNumber: "KA-01-MH-5678",
      type: "Stolen Vehicle",
      linkedFIR: "KOR/2024/00118",
      status: "ACTIVE_LOOKOUT",
    },
  ],
  evidence: [
    {
      id: "evd-001",
      evidenceNumber: "EVD-2024-KOR-00123-001",
      type: "Fingerprint Sample",
      firNumber: "KOR/2024/00123",
      status: "AT_LAB",
    },
  ],
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
    }
  };

  const totalResults =
    mockResults.firs.length +
    mockResults.cases.length +
    mockResults.persons.length +
    mockResults.vehicles.length +
    mockResults.evidence.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Search Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Search</h1>
          <p className="text-foreground-muted">
            Search across FIRs, cases, persons, vehicles, and evidence
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search by FIR number, case number, name, vehicle number, phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-lg py-6"
                  icon={<Search className="h-5 w-5" />}
                />
              </div>
              <Button onClick={handleSearch} className="px-8">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-foreground-muted">Quick search:</span>
              <button
                className="text-sm text-accent hover:underline"
                onClick={() => setSearchQuery("KOR/2024/")}
              >
                FIRs this year
              </button>
              <span className="text-foreground-muted">|</span>
              <button
                className="text-sm text-accent hover:underline"
                onClick={() => setSearchQuery("CRITICAL")}
              >
                Critical cases
              </button>
              <span className="text-foreground-muted">|</span>
              <button
                className="text-sm text-accent hover:underline"
                onClick={() => setSearchQuery("WANTED")}
              >
                Wanted persons
              </button>
              <span className="text-foreground-muted">|</span>
              <button
                className="text-sm text-accent hover:underline"
                onClick={() => setSearchQuery("STOLEN")}
              >
                Stolen vehicles
              </button>
            </div>
          </CardContent>
        </Card>

        {/* AI Search Suggestions */}
        {searchQuery && !hasSearched && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-sm text-foreground">
                  AI Suggestion: Searching for &quot;{searchQuery}&quot; - Press Enter or click Search
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {hasSearched && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-foreground-muted">
                Found <span className="font-semibold text-foreground">{totalResults}</span> results
                for &quot;{searchQuery}&quot;
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Clock className="h-4 w-4" />
                Search completed in 0.23s
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="firs">
                  <FileText className="h-4 w-4 mr-2" />
                  FIRs ({mockResults.firs.length})
                </TabsTrigger>
                <TabsTrigger value="cases">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Cases ({mockResults.cases.length})
                </TabsTrigger>
                <TabsTrigger value="persons">
                  <Users className="h-4 w-4 mr-2" />
                  Persons ({mockResults.persons.length})
                </TabsTrigger>
                <TabsTrigger value="vehicles">
                  <Car className="h-4 w-4 mr-2" />
                  Vehicles ({mockResults.vehicles.length})
                </TabsTrigger>
                <TabsTrigger value="evidence">
                  <Package className="h-4 w-4 mr-2" />
                  Evidence ({mockResults.evidence.length})
                </TabsTrigger>
              </TabsList>

              {/* All Results */}
              <TabsContent value="all" className="space-y-4">
                {/* FIRs */}
                {mockResults.firs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        FIRs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockResults.firs.map((fir) => (
                          <div
                            key={fir.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div>
                              <span className="font-mono text-accent">{fir.firNumber}</span>
                              <p className="text-sm text-foreground">
                                {fir.complainant} - {fir.offence}
                              </p>
                              <p className="text-xs text-foreground-muted">{fir.date}</p>
                            </div>
                            <Badge variant={fir.status === "CLOSED" ? "closed" : "investigating"}>
                              {fir.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cases */}
                {mockResults.cases.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Briefcase className="h-5 w-5" />
                        Cases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockResults.cases.map((caseItem) => (
                          <div
                            key={caseItem.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div>
                              <span className="font-mono text-accent">{caseItem.caseNumber}</span>
                              <p className="text-sm text-foreground">{caseItem.title}</p>
                              <p className="text-xs text-foreground-muted">
                                FIR: {caseItem.firNumber}
                              </p>
                            </div>
                            <Badge variant="investigating">{caseItem.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Persons */}
                {mockResults.persons.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Persons
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockResults.persons.map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div>
                              <p className="font-medium text-foreground">{person.name}</p>
                              <p className="text-sm text-foreground-muted">
                                {person.type === "OFFICER"
                                  ? `${person.rank} - ${person.badgeNumber}`
                                  : `${person.type} | ${person.phone}`}
                              </p>
                            </div>
                            <Badge variant={person.type === "OFFICER" ? "info" : "secondary"}>
                              {person.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vehicles */}
                {mockResults.vehicles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5" />
                        Vehicles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockResults.vehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div>
                              <span className="font-mono text-accent">{vehicle.regNumber}</span>
                              <p className="text-sm text-foreground">{vehicle.type}</p>
                              <p className="text-xs text-foreground-muted">
                                FIR: {vehicle.linkedFIR}
                              </p>
                            </div>
                            <Badge variant="warning">{vehicle.status.replace(/_/g, " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Evidence */}
                {mockResults.evidence.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5" />
                        Evidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockResults.evidence.map((evidence) => (
                          <div
                            key={evidence.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary cursor-pointer"
                          >
                            <div>
                              <span className="font-mono text-accent text-sm">
                                {evidence.evidenceNumber}
                              </span>
                              <p className="text-sm text-foreground">{evidence.type}</p>
                              <p className="text-xs text-foreground-muted">
                                FIR: {evidence.firNumber}
                              </p>
                            </div>
                            <Badge variant="info">{evidence.status.replace(/_/g, " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Individual tabs would show filtered results */}
              <TabsContent value="firs">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground-muted">
                      Showing {mockResults.firs.length} FIR results
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="cases">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground-muted">
                      Showing {mockResults.cases.length} case results
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="persons">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground-muted">
                      Showing {mockResults.persons.length} person results
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="vehicles">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground-muted">
                      Showing {mockResults.vehicles.length} vehicle results
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="evidence">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-foreground-muted">
                      Showing {mockResults.evidence.length} evidence results
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* No Search Yet State */}
        {!hasSearched && !searchQuery && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Search the NPDMS Database
              </h3>
              <p className="text-foreground-muted mb-4">
                Enter a search query above to find FIRs, cases, persons, vehicles, or evidence
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">FIR Number</Badge>
                <Badge variant="secondary">Case Number</Badge>
                <Badge variant="secondary">Name</Badge>
                <Badge variant="secondary">Phone Number</Badge>
                <Badge variant="secondary">Vehicle Number</Badge>
                <Badge variant="secondary">Badge Number</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
