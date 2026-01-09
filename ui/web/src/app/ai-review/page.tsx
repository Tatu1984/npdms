'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  BarChart3,
  RefreshCw,
  Download,
  Users,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import AIReviewQueue from '@/components/ai/AIReviewQueue';

interface AIStats {
  total_decisions: number;
  pending_count: number;
  avg_confidence: number;
  avg_review_time_hours: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface ModelConfig {
  id: string;
  modelName: string;
  decisionType: string;
  confidenceThreshold: number;
  autoApproveThreshold: number;
  isEnabled: boolean;
  requiresReview: boolean;
  reviewTimeout: number;
  maxQueueSize: number;
  description: string;
}

const typeLabels: Record<string, string> = {
  IPC_CLASSIFICATION: 'IPC Classification',
  CRIME_CATEGORY: 'Crime Category',
  PRIORITY_ASSIGNMENT: 'Priority',
  SUSPECT_MATCH: 'Suspect Match',
  FRAUD_DETECTION: 'Fraud Detection',
  DOCUMENT_CLASSIFICATION: 'Document Class.',
  ENTITY_EXTRACTION: 'Entity Extraction',
  SENTIMENT_ANALYSIS: 'Sentiment',
};

export default function AIReviewPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'stats' | 'models'>('queue');
  const [stats, setStats] = useState<AIStats | null>(null);
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStats();
    fetchModelConfigs();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/v1/ai-review/stats?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelConfigs = async () => {
    try {
      const response = await fetch('/api/v1/ai-review/models', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModelConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Failed to fetch model configs:', error);
    }
  };

  const updateModelConfig = async (config: ModelConfig) => {
    try {
      const response = await fetch(`/api/v1/ai-review/models/${config.modelName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          confidenceThreshold: config.confidenceThreshold,
          autoApproveThreshold: config.autoApproveThreshold,
          isEnabled: config.isEnabled,
          requiresReview: config.requiresReview,
          reviewTimeout: config.reviewTimeout,
          maxQueueSize: config.maxQueueSize,
          description: config.description,
        }),
      });

      if (response.ok) {
        setEditingModel(null);
        fetchModelConfigs();
      }
    } catch (error) {
      console.error('Failed to update model config:', error);
    }
  };

  const getApprovalRate = () => {
    if (!stats?.by_status) return 0;
    const approved = (stats.by_status['APPROVED'] || 0) + (stats.by_status['AUTO_APPROVED'] || 0);
    const total = stats.total_decisions;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
  };

  const getOverrideRate = () => {
    if (!stats?.by_status) return 0;
    const overridden = stats.by_status['OVERRIDDEN'] || 0;
    const reviewed = Object.values(stats.by_status).reduce((a, b) => a + b, 0) - (stats.by_status['PENDING'] || 0);
    return reviewed > 0 ? ((overridden / reviewed) * 100).toFixed(1) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Review Dashboard</h1>
              <p className="text-gray-500">Human-in-the-Loop AI Decision Management</p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.pending_count || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600">{getApprovalRate()}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Override Rate</p>
                <p className="text-2xl font-bold text-purple-600">{getOverrideRate()}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Review Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.avg_review_time_hours?.toFixed(1) || 0}h
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100">
          <nav className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'queue'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Review Queue
              </span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </span>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'models'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Model Configuration
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <AIReviewQueue showFilters={true} />
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* By Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decisions by Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {stats?.by_status &&
                    Object.entries(stats.by_status).map(([status, count]) => (
                      <div
                        key={status}
                        className={`p-4 rounded-lg ${
                          status === 'PENDING'
                            ? 'bg-yellow-50'
                            : status === 'APPROVED'
                              ? 'bg-green-50'
                              : status === 'REJECTED'
                                ? 'bg-red-50'
                                : status === 'OVERRIDDEN'
                                  ? 'bg-purple-50'
                                  : status === 'AUTO_APPROVED'
                                    ? 'bg-blue-50'
                                    : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-xs text-gray-600">{status}</p>
                        <p className="text-xl font-bold mt-1">{count}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* By Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decisions by Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats?.by_type &&
                    Object.entries(stats.by_type).map(([type, count]) => (
                      <div key={type} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600">{typeLabels[type] || type}</p>
                        <p className="text-xl font-bold mt-1">{count}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80">Average Confidence</p>
                        <p className="text-3xl font-bold">
                          {((stats?.avg_confidence || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-8 h-8 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80">Total Decisions</p>
                        <p className="text-3xl font-bold">{stats?.total_decisions || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80">AI Accuracy</p>
                        <p className="text-3xl font-bold">
                          {(100 - parseFloat(getOverrideRate() as string)).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Model Configuration Tab */}
          {activeTab === 'models' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Model Configurations</h3>
                <button
                  onClick={fetchModelConfigs}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {modelConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    {editingModel?.id === config.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Confidence Threshold
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.01"
                              value={editingModel.confidenceThreshold}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  confidenceThreshold: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Auto-Approve Threshold
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.01"
                              value={editingModel.autoApproveThreshold}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  autoApproveThreshold: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Review Timeout (hours)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editingModel.reviewTimeout}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  reviewTimeout: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Max Queue Size
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editingModel.maxQueueSize}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  maxQueueSize: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingModel.isEnabled}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  isEnabled: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingModel.requiresReview}
                              onChange={(e) =>
                                setEditingModel({
                                  ...editingModel,
                                  requiresReview: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Requires Human Review</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateModelConfig(editingModel)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingModel(null)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{config.modelName}</h4>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                config.isEnabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {config.isEnabled ? 'Active' : 'Disabled'}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {typeLabels[config.decisionType] || config.decisionType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                          <div className="flex items-center gap-6 mt-3 text-xs text-gray-600">
                            <span>
                              Confidence: {(config.confidenceThreshold * 100).toFixed(0)}%
                            </span>
                            <span>
                              Auto-approve: {(config.autoApproveThreshold * 100).toFixed(0)}%
                            </span>
                            <span>Timeout: {config.reviewTimeout}h</span>
                            <span>Max Queue: {config.maxQueueSize}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingModel(config)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
