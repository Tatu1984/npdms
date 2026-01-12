'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Percent,
  Zap,
  MoreVertical,
} from 'lucide-react';

interface AIDecision {
  id: string;
  type: string;
  status: string;
  priority: string;
  sourceType: string;
  sourceId: string;
  sourceReference: string;
  modelName: string;
  modelVersion: string;
  prediction: string;
  predictionData?: Record<string, unknown>;
  confidence: number;
  confidenceThreshold: number;
  alternatives?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  humanDecision?: string;
  overrideReason?: string;
  assignedTo?: string;
  assignedAt?: string;
  dueBy?: string;
  requestedBy: string;
  stationId?: string;
  processingTimeMs: number;
  createdAt: string;
  updatedAt: string;
}

interface AIReviewQueueProps {
  onReviewDecision?: (decision: AIDecision, action: string) => void;
  userId?: string;
  showFilters?: boolean;
}

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  OVERRIDDEN: 'bg-purple-100 text-purple-800',
  AUTO_APPROVED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

const typeLabels: Record<string, string> = {
  IPC_CLASSIFICATION: 'IPC Classification',
  CRIME_CATEGORY: 'Crime Category',
  PRIORITY_ASSIGNMENT: 'Priority Assignment',
  SUSPECT_MATCH: 'Suspect Match',
  FRAUD_DETECTION: 'Fraud Detection',
  DOCUMENT_CLASSIFICATION: 'Document Classification',
  ENTITY_EXTRACTION: 'Entity Extraction',
  SENTIMENT_ANALYSIS: 'Sentiment Analysis',
};

export default function AIReviewQueue({
  onReviewDecision,
  userId,
  showFilters = true,
}: AIReviewQueueProps) {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: 'PENDING',
    assignedTo: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: '',
    humanDecision: '',
    reviewNotes: '',
    overrideReason: '',
  });

  useEffect(() => {
    fetchDecisions();
  }, [filters, pagination.page]);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.pageSize.toString(),
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.assignedTo) params.append('assigned_to', filters.assignedTo);

      const response = await fetch(`/api/v1/ai-review/queue?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.total_pages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: AIDecision, status: string) => {
    setSelectedDecision(decision);
    setReviewForm({
      status,
      humanDecision: status === 'APPROVED' ? decision.prediction : '',
      reviewNotes: '',
      overrideReason: '',
    });
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedDecision) return;

    try {
      const response = await fetch(`/api/v1/ai-review/decisions/${selectedDecision.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        setReviewModal(false);
        fetchDecisions();
        if (onReviewDecision) {
          onReviewDecision(selectedDecision, reviewForm.status);
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getConfidenceColor = (confidence: number, threshold: number) => {
    if (confidence >= threshold) return 'text-green-600';
    if (confidence >= threshold * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Review Queue</h2>
              <p className="text-sm text-gray-500">
                {pagination.total} decisions pending review
              </p>
            </div>
          </div>
          <button
            onClick={fetchDecisions}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="OVERRIDDEN">Overridden</option>
              <option value="AUTO_APPROVED">Auto-Approved</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        )}
      </div>

      {/* Decision List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading decisions...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="p-8 text-center">
            <Brain className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-500">No decisions pending review</p>
          </div>
        ) : (
          decisions.map((decision) => (
            <div
              key={decision.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                expandedId === decision.id ? 'bg-gray-50' : ''
              }`}
            >
              {/* Decision Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      decision.confidence >= decision.confidenceThreshold
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    <Zap
                      className={`w-5 h-5 ${
                        decision.confidence >= decision.confidenceThreshold
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {typeLabels[decision.type] || decision.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          priorityColors[decision.priority]
                        }`}
                      >
                        {decision.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          statusColors[decision.status]
                        }`}
                      >
                        {decision.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {decision.sourceType}: {decision.sourceReference || decision.sourceId}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(decision.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        <span
                          className={getConfidenceColor(
                            decision.confidence,
                            decision.confidenceThreshold
                          )}
                        >
                          {(decision.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-gray-400">
                          (threshold: {(decision.confidenceThreshold * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {decision.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReview(decision, 'APPROVED')}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReview(decision, 'REJECTED')}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReview(decision, 'OVERRIDDEN')}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Override"
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleExpand(decision.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedId === decision.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === decision.id && (
                <div className="mt-4 pl-12 space-y-4">
                  {/* Prediction */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">AI Prediction</h4>
                    <p className="text-blue-800 font-medium">{decision.prediction}</p>
                    {decision.predictionData && (
                      <pre className="mt-2 text-xs text-blue-700 bg-blue-100 rounded p-2 overflow-x-auto">
                        {JSON.stringify(decision.predictionData, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Alternatives */}
                  {decision.alternatives && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Alternative Predictions
                      </h4>
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {decision.alternatives}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Model:</span>
                      <span className="ml-2 text-gray-900">
                        {decision.modelName} v{decision.modelVersion}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing Time:</span>
                      <span className="ml-2 text-gray-900">{decision.processingTimeMs}ms</span>
                    </div>
                    {decision.assignedTo && (
                      <div>
                        <span className="text-gray-500">Assigned To:</span>
                        <span className="ml-2 text-gray-900">{decision.assignedTo}</span>
                      </div>
                    )}
                    {decision.dueBy && (
                      <div>
                        <span className="text-gray-500">Due By:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(decision.dueBy).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review Info */}
                  {decision.reviewedAt && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-2">Review Details</h4>
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Decision:</span> {decision.humanDecision}
                      </p>
                      {decision.reviewNotes && (
                        <p className="text-sm text-green-700 mt-1">
                          <span className="font-medium">Notes:</span> {decision.reviewNotes}
                        </p>
                      )}
                      {decision.overrideReason && (
                        <p className="text-sm text-green-700 mt-1">
                          <span className="font-medium">Override Reason:</span>{' '}
                          {decision.overrideReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedDecision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Review AI Decision</h3>
              <p className="text-sm text-gray-500 mt-1">
                {typeLabels[selectedDecision.type]} - {selectedDecision.sourceReference}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Prediction */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900">AI Prediction</h4>
                <p className="text-blue-800 font-medium mt-1">{selectedDecision.prediction}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Confidence: {(selectedDecision.confidence * 100).toFixed(1)}%
                </p>
              </div>

              {/* Review Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Decision
                </label>
                <div className="flex gap-2">
                  {['APPROVED', 'REJECTED', 'OVERRIDDEN'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setReviewForm({ ...reviewForm, status })}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        reviewForm.status === status
                          ? status === 'APPROVED'
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : status === 'REJECTED'
                              ? 'bg-red-100 border-red-500 text-red-700'
                              : 'bg-purple-100 border-purple-500 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Human Decision (for override) */}
              {reviewForm.status === 'OVERRIDDEN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Value
                  </label>
                  <input
                    type="text"
                    value={reviewForm.humanDecision}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, humanDecision: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter the correct value"
                  />
                </div>
              )}

              {/* Override Reason */}
              {reviewForm.status === 'OVERRIDDEN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Override Reason
                  </label>
                  <textarea
                    value={reviewForm.overrideReason}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, overrideReason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Explain why the AI prediction is incorrect"
                  />
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setReviewModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={!reviewForm.status}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
