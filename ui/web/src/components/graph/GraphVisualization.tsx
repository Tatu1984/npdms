'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  Filter,
  Download,
  RefreshCw,
  Crosshair,
  Users,
  MapPin,
  Phone,
  Car,
  FileText,
  Building,
  Wallet,
  Globe,
  ChevronDown,
} from 'lucide-react';

interface GraphNode {
  id: string;
  nodeType: string;
  label: string;
  properties: Record<string, unknown>;
  riskScore?: number;
  isActive: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  fromNodeId?: string;
  toNodeId?: string;
  relationType: string;
  weight: number;
  confidence: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphVisualizationProps {
  initialNodeId?: string;
  onNodeSelect?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
  className?: string;
}

const NODE_COLORS: Record<string, string> = {
  PERSON: '#ef4444',
  ORGANIZATION: '#8b5cf6',
  LOCATION: '#22c55e',
  VEHICLE: '#3b82f6',
  PHONE: '#f59e0b',
  EMAIL: '#ec4899',
  BANK_ACCOUNT: '#14b8a6',
  CRYPTO_WALLET: '#f97316',
  CASE: '#6366f1',
  FIR: '#dc2626',
  EVIDENCE: '#84cc16',
  WEAPON: '#991b1b',
};

const NODE_ICONS: Record<string, typeof Users> = {
  PERSON: Users,
  ORGANIZATION: Building,
  LOCATION: MapPin,
  VEHICLE: Car,
  PHONE: Phone,
  EMAIL: Globe,
  BANK_ACCOUNT: Wallet,
  CRYPTO_WALLET: Wallet,
  CASE: FileText,
  FIR: FileText,
  EVIDENCE: FileText,
  WEAPON: Crosshair,
};

const RELATION_STYLES: Record<string, { color: string; dashArray?: string }> = {
  ASSOCIATE: { color: '#94a3b8' },
  FAMILY_MEMBER: { color: '#22c55e' },
  EMPLOYER: { color: '#3b82f6' },
  EMPLOYEE: { color: '#3b82f6', dashArray: '5,5' },
  OWNS: { color: '#8b5cf6' },
  RESIDES: { color: '#f59e0b' },
  FREQUENTS: { color: '#f59e0b', dashArray: '3,3' },
  COMMUNICATES: { color: '#ec4899' },
  TRANSACTS: { color: '#14b8a6' },
  SUSPECTED_OF: { color: '#ef4444' },
  WITNESSED_BY: { color: '#84cc16' },
  LINKED_TO: { color: '#6b7280' },
  CO_ACCUSED: { color: '#dc2626' },
  GANG_MEMBER: { color: '#991b1b' },
};

export default function GraphVisualization({
  initialNodeId,
  onNodeSelect,
  onEdgeSelect,
  className,
}: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [depth, setDepth] = useState(2);

  const fetchGraphData = useCallback(async (nodeId?: string) => {
    setLoading(true);
    try {
      const endpoint = nodeId
        ? `/api/v1/graph/nodes/${nodeId}/connections?depth=${depth}`
        : '/api/v1/graph/visualization';

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Transform nodes and edges
        const nodes = (data.nodes || []).map((n: GraphNode, i: number) => ({
          ...n,
          x: Math.cos(i * 0.5) * 200 + 400,
          y: Math.sin(i * 0.5) * 200 + 300,
          vx: 0,
          vy: 0,
        }));

        const edges = (data.edges || []).map((e: GraphEdge) => ({
          ...e,
          source: e.fromNodeId || e.source,
          target: e.toNodeId || e.target,
        }));

        setGraphData({ nodes, edges });
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  }, [depth]);

  useEffect(() => {
    fetchGraphData(initialNodeId);
  }, [initialNodeId, fetchGraphData]);

  // Physics simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const interval = setInterval(() => {
      setGraphData((prev) => {
        const nodes = [...prev.nodes];
        const edges = prev.edges;

        // Apply forces
        nodes.forEach((node, i) => {
          // Repulsion between nodes
          nodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x! - other.x!;
            const dy = node.y! - other.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            node.vx! += (dx / dist) * force * 0.01;
            node.vy! += (dy / dist) * force * 0.01;
          });

          // Center gravity
          node.vx! += (400 - node.x!) * 0.001;
          node.vy! += (300 - node.y!) * 0.001;
        });

        // Edge constraints
        edges.forEach((edge) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return;

          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 150;
          const force = (dist - idealDist) * 0.01;

          source.vx! += (dx / dist) * force;
          source.vy! += (dy / dist) * force;
          target.vx! -= (dx / dist) * force;
          target.vy! -= (dy / dist) * force;
        });

        // Apply velocity with damping
        nodes.forEach((node) => {
          node.x! += node.vx! * 0.5;
          node.y! += node.vy! * 0.5;
          node.vx! *= 0.9;
          node.vy! *= 0.9;

          // Keep within bounds
          node.x! = Math.max(50, Math.min(750, node.x!));
          node.y! = Math.max(50, Math.min(550, node.y!));
        });

        return { nodes, edges };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [graphData.nodes.length]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      // Draw edges
      graphData.edges.forEach((edge) => {
        const source = graphData.nodes.find((n) => n.id === edge.source);
        const target = graphData.nodes.find((n) => n.id === edge.target);
        if (!source || !target) return;

        const style = RELATION_STYLES[edge.relationType] || RELATION_STYLES.LINKED_TO;
        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.strokeStyle = selectedEdge?.id === edge.id ? '#3b82f6' : style.color;
        ctx.lineWidth = selectedEdge?.id === edge.id ? 3 : 1.5;
        if (style.dashArray) {
          ctx.setLineDash(style.dashArray.split(',').map(Number));
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y! - source.y!, target.x! - source.x!);
        const midX = (source.x! + target.x!) / 2;
        const midY = (source.y! + target.y!) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - 8 * Math.cos(angle - Math.PI / 6),
          midY - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          midX - 8 * Math.cos(angle + Math.PI / 6),
          midY - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = style.color;
        ctx.fill();
      });

      // Draw nodes
      graphData.nodes.forEach((node) => {
        const color = NODE_COLORS[node.nodeType] || '#6b7280';
        const isSelected = selectedNode?.id === node.id;
        const isHighRisk = (node.riskScore || 0) > 0.7;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, isSelected ? 25 : 20, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#1e40af';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (isHighRisk) {
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node label
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label,
          node.x!,
          node.y! + 35
        );
      });

      ctx.restore();
      requestAnimationFrame(render);
    };

    render();
  }, [graphData, selectedNode, selectedEdge, zoom, offset]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    // Check if clicked on a node
    const clickedNode = graphData.nodes.find((node) => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      onNodeSelect?.(clickedNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(3, z * delta)));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `/api/v1/graph/nodes?keyword=${encodeURIComponent(searchQuery)}${filterType ? `&type=${filterType}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const nodes = await response.json();
        if (nodes.length > 0) {
          fetchGraphData(nodes[0].id);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const downloadGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'graph-visualization.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Network className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Graph Intelligence</h3>
              <p className="text-sm text-gray-500">
                {graphData.nodes.length} nodes, {graphData.edges.length} connections
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="px-2 py-1 text-sm border rounded-lg"
            >
              <option value={1}>Depth: 1</option>
              <option value={2}>Depth: 2</option>
              <option value={3}>Depth: 3</option>
            </select>
            <button
              onClick={() => fetchGraphData(initialNodeId)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              onClick={downloadGraph}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search nodes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            {Object.keys(NODE_COLORS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border">
          <p className="text-xs font-medium text-gray-700 mb-2">Node Types</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(NODE_COLORS).slice(0, 6).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.nodeType] }}
                />
                <span className="font-medium text-gray-900">{selectedNode.label}</span>
                <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                  {selectedNode.nodeType}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {Object.entries(selectedNode.properties || {}).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => fetchGraphData(selectedNode.id)}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              Explore Connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
