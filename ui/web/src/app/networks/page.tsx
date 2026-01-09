'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Network,
  Users,
  AlertTriangle,
  Search,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Filter,
  Eye,
  Link2
} from 'lucide-react';

// Mock data for criminal networks
const networks = [
  {
    id: '1',
    name: 'Bangalore Tech Fraud Ring',
    type: 'SYNDICATE',
    threatLevel: 'HIGH',
    memberCount: 12,
    operatingAreas: ['Bangalore', 'Hyderabad', 'Chennai'],
    crimeTypes: ['ONLINE_FRAUD', 'IDENTITY_THEFT'],
    linkedCases: 8,
    isActive: true,
  },
  {
    id: '2',
    name: 'Interstate Drug Network',
    type: 'GANG',
    threatLevel: 'CRITICAL',
    memberCount: 25,
    operatingAreas: ['Karnataka', 'Maharashtra', 'Goa'],
    crimeTypes: ['DRUG_TRAFFICKING', 'MONEY_LAUNDERING'],
    linkedCases: 15,
    isActive: true,
  },
  {
    id: '3',
    name: 'Koramangala Robbery Gang',
    type: 'GANG',
    threatLevel: 'MEDIUM',
    memberCount: 6,
    operatingAreas: ['Koramangala', 'HSR Layout', 'BTM'],
    crimeTypes: ['ROBBERY', 'CHAIN_SNATCHING'],
    linkedCases: 4,
    isActive: false,
  },
];

// Mock graph data
const graphData = {
  nodes: [
    { id: '1', label: 'Rakesh (Leader)', type: 'PERSON', risk: 0.9 },
    { id: '2', label: 'Suresh', type: 'PERSON', risk: 0.7 },
    { id: '3', label: 'Mahesh', type: 'PERSON', risk: 0.6 },
    { id: '4', label: 'KA-01-AB-1234', type: 'VEHICLE', risk: 0.4 },
    { id: '5', label: '+91-98765xxxxx', type: 'PHONE', risk: 0.5 },
    { id: '6', label: 'HDFC-xxxx1234', type: 'BANK_ACCOUNT', risk: 0.8 },
    { id: '7', label: 'FIR/2024/00001', type: 'FIR', risk: 0.3 },
    { id: '8', label: 'Priya', type: 'PERSON', risk: 0.5 },
  ],
  edges: [
    { source: '1', target: '2', type: 'ASSOCIATE' },
    { source: '1', target: '3', type: 'ASSOCIATE' },
    { source: '1', target: '4', type: 'OWNS' },
    { source: '2', target: '5', type: 'COMMUNICATES' },
    { source: '1', target: '6', type: 'TRANSACTS' },
    { source: '3', target: '6', type: 'TRANSACTS' },
    { source: '1', target: '7', type: 'SUSPECTED_OF' },
    { source: '2', target: '7', type: 'SUSPECTED_OF' },
    { source: '8', target: '2', type: 'FAMILY_MEMBER' },
    { source: '3', target: '5', type: 'COMMUNICATES' },
  ],
};

const stats = {
  totalNodes: 1245,
  totalEdges: 3567,
  totalNetworks: 28,
  highRiskEntities: 156,
};

const threatColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const nodeColors: Record<string, string> = {
  PERSON: '#3B82F6',
  VEHICLE: '#10B981',
  PHONE: '#F59E0B',
  BANK_ACCOUNT: '#EF4444',
  FIR: '#8B5CF6',
  CASE: '#EC4899',
  ORGANIZATION: '#6366F1',
};

export default function NetworksPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(1);

  // Simple canvas-based graph visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Position nodes in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const nodePositions: Record<string, { x: number; y: number }> = {};
    graphData.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / graphData.nodes.length;
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle) * zoom,
        y: centerY + radius * Math.sin(angle) * zoom,
      };
    });

    // Draw edges
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    graphData.edges.forEach((edge) => {
      const from = nodePositions[edge.source];
      const to = nodePositions[edge.target];
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const pos = nodePositions[node.id];
      const nodeRadius = 20 + node.risk * 10;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColors[node.type] || '#6B7280';
      ctx.fill();

      // Risk indicator ring
      if (node.risk > 0.7) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#1F2937';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y + nodeRadius + 15);
    });
  }, [zoom]);

  const filteredNetworks = networks.filter((network) => {
    const matchesSearch = network.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThreat = threatFilter === 'all' || network.threatLevel === threatFilter;
    return matchesSearch && matchesThreat;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Criminal Network Intelligence</h1>
            <p className="text-gray-500">Graph analysis and relationship mapping</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Network
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Entities</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNodes}</div>
              <p className="text-xs text-gray-500">Persons, vehicles, accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Relationships</CardTitle>
              <Link2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEdges}</div>
              <p className="text-xs text-gray-500">Known connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Networks</CardTitle>
              <Network className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNetworks}</div>
              <p className="text-xs text-gray-500">Identified groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">High Risk</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highRiskEntities}</div>
              <p className="text-xs text-gray-500">Flagged entities</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Graph Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Network Graph</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full h-full"
                />
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-sm text-xs">
                  <div className="font-medium mb-2">Entity Types</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(nodeColors).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span>{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Networks List */}
          <Card>
            <CardHeader>
              <CardTitle>Criminal Networks</CardTitle>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={threatFilter} onValueChange={setThreatFilter}>
                  <SelectTrigger className="w-[100px] h-8">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredNetworks.map((network) => (
                <div
                  key={network.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNetwork === network.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedNetwork(network.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{network.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {network.type} • {network.memberCount} members
                      </div>
                    </div>
                    <Badge className={threatColors[network.threatLevel]}>
                      {network.threatLevel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {network.crimeTypes.slice(0, 2).map((crime) => (
                      <Badge key={crime} variant="outline" className="text-xs">
                        {crime.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                    <span>{network.operatingAreas.join(', ')}</span>
                    <span>{network.linkedCases} linked cases</span>
                  </div>
                  {!network.isActive && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
