'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/textarea';
import { LegacySelect as Select } from '@/components/ui/select';
import { useToastStore } from '@/stores/toastStore';
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
  Link2,
  X,
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

function getThreatBadgeVariant(threat: string) {
  const variants: Record<string, string> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'warning',
    CRITICAL: 'error',
  };
  return variants[threat] || 'secondary';
}

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
  const { addToast } = useToastStore();
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networksList, setNetworksList] = useState(networks);

  // Form state for adding network
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    type: 'GANG',
    threatLevel: 'MEDIUM',
    operatingAreas: '',
    crimeTypes: '',
    description: '',
  });

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

  const filteredNetworks = networksList.filter((network) => {
    const matchesSearch = network.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThreat = !threatFilter || network.threatLevel === threatFilter;
    return matchesSearch && matchesThreat;
  });

  const handleAddNetwork = () => {
    if (!newNetwork.name || !newNetwork.operatingAreas) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields' });
      return;
    }

    const newNetworkEntry = {
      id: `${networksList.length + 1}`,
      name: newNetwork.name,
      type: newNetwork.type as 'GANG' | 'SYNDICATE',
      threatLevel: newNetwork.threatLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      memberCount: 0,
      operatingAreas: newNetwork.operatingAreas.split(',').map(s => s.trim()),
      crimeTypes: newNetwork.crimeTypes.split(',').map(s => s.trim()),
      linkedCases: 0,
      isActive: true,
    };

    setNetworksList([...networksList, newNetworkEntry]);
    addToast({ type: 'success', title: 'Network Added', message: `${newNetwork.name} has been added to the database` });
    setShowAddModal(false);
    setNewNetwork({ name: '', type: 'GANG', threatLevel: 'MEDIUM', operatingAreas: '', crimeTypes: '', description: '' });
  };

  const handleDownloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      addToast({ type: 'error', title: 'Export Failed', message: 'Unable to export graph' });
      return;
    }

    const link = document.createElement('a');
    link.download = 'network-graph.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast({ type: 'success', title: 'Graph Exported', message: 'Network graph downloaded as PNG' });
  };

  const handleFullscreen = () => {
    const graphContainer = document.getElementById('graph-container');
    if (!graphContainer) return;

    if (!document.fullscreenElement) {
      graphContainer.requestFullscreen?.();
      setIsFullscreen(true);
      addToast({ type: 'info', title: 'Full Screen', message: 'Press ESC to exit full screen' });
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Criminal Network Intelligence</h1>
            <p className="text-foreground-muted">Graph analysis and relationship mapping</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Network
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Total Entities</CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalNodes}</div>
              <p className="text-xs text-foreground-muted">Persons, vehicles, accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Relationships</CardTitle>
              <Link2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalEdges}</div>
              <p className="text-xs text-foreground-muted">Known connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">Networks</CardTitle>
              <Network className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalNetworks}</div>
              <p className="text-xs text-foreground-muted">Identified groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">High Risk</CardTitle>
              <AlertTriangle className="h-5 w-5 text-error" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.highRiskEntities}</div>
              <p className="text-xs text-foreground-muted">Flagged entities</p>
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
                  <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleFullscreen}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDownloadGraph}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div id="graph-container" className="relative bg-background-tertiary rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full h-full"
                />
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background-secondary p-3 rounded-lg shadow-sm text-xs border border-border">
                  <div className="font-medium mb-2 text-foreground">Entity Types</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(nodeColors).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-foreground-muted">{type}</span>
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
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(value: string) => setSearchQuery(value)}
                  icon={<Search className="h-4 w-4" />}
                  className="h-8 text-sm"
                />
                <Select
                  options={[
                    { value: '', label: 'All' },
                    { value: 'CRITICAL', label: 'Critical' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'LOW', label: 'Low' },
                  ]}
                  value={threatFilter}
                  onChange={setThreatFilter}
                  className="w-[100px]"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredNetworks.map((network) => (
                <div
                  key={network.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNetwork === network.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedNetwork(network.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm text-foreground">{network.name}</div>
                      <div className="text-xs text-foreground-muted mt-1">
                        {network.type} - {network.memberCount} members
                      </div>
                    </div>
                    <Badge variant={getThreatBadgeVariant(network.threatLevel) as any}>
                      {network.threatLevel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {network.crimeTypes.slice(0, 2).map((crime) => (
                      <Badge key={crime} variant="secondary" className="text-xs">
                        {crime.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-foreground-muted flex items-center justify-between">
                    <span>{network.operatingAreas.join(', ')}</span>
                    <span>{network.linkedCases} linked cases</span>
                  </div>
                  {!network.isActive && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              ))}
              {filteredNetworks.length === 0 && (
                <div className="text-center py-8 text-foreground-muted">
                  No networks found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Network Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Criminal Network"
        description="Add a new criminal network to the intelligence database"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Network Name *"
            placeholder="e.g., Bangalore Tech Fraud Ring"
            value={newNetwork.name}
            onChange={(value: string) => setNewNetwork({ ...newNetwork, name: value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Network Type"
              options={[
                { value: 'GANG', label: 'Gang' },
                { value: 'SYNDICATE', label: 'Syndicate' },
                { value: 'CARTEL', label: 'Cartel' },
                { value: 'MAFIA', label: 'Mafia' },
              ]}
              value={newNetwork.type}
              onChange={(value: string) => setNewNetwork({ ...newNetwork, type: value })}
            />
            <Select
              label="Threat Level"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
              value={newNetwork.threatLevel}
              onChange={(value: string) => setNewNetwork({ ...newNetwork, threatLevel: value })}
            />
          </div>
          <Input
            label="Operating Areas *"
            placeholder="Bangalore, Hyderabad, Chennai (comma-separated)"
            value={newNetwork.operatingAreas}
            onChange={(value: string) => setNewNetwork({ ...newNetwork, operatingAreas: value })}
          />
          <Input
            label="Crime Types"
            placeholder="Drug Trafficking, Money Laundering (comma-separated)"
            value={newNetwork.crimeTypes}
            onChange={(value: string) => setNewNetwork({ ...newNetwork, crimeTypes: value })}
          />
          <Textarea
            label="Description"
            placeholder="Additional details about the network..."
            value={newNetwork.description}
            onChange={(value: string) => setNewNetwork({ ...newNetwork, description: value })}
            rows={3}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddNetwork}>
            <Plus className="h-4 w-4 mr-2" />
            Add Network
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
