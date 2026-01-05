import apiClient from './client';

export type FIRStatus = 'registered' | 'under_investigation' | 'chargesheet_filed' | 'closed' | 'transferred';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface FIR {
  id: string;
  firNumber: string;
  stationId: string;
  status: FIRStatus;
  priority: Priority;
  complainantName: string;
  complainantPhone: string;
  complainantAddress: string;
  incidentDate: string;
  incidentTime?: string;
  incidentLocation: string;
  offenseDescription: string;
  ipcSections: string[];
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  registeredById: string;
  registeredByName: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FIRListResponse {
  data: FIR[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FIRFilter {
  page?: number;
  pageSize?: number;
  status?: FIRStatus;
  priority?: Priority;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedOfficerId?: string;
}

export interface CreateFIRRequest {
  complainantName: string;
  complainantPhone: string;
  complainantAddress: string;
  incidentDate: string;
  incidentTime?: string;
  incidentLocation: string;
  offenseDescription: string;
  ipcSections: string[];
  priority?: Priority;
}

export interface UpdateFIRRequest extends Partial<CreateFIRRequest> {
  status?: FIRStatus;
  assignedOfficerId?: string;
}

export const firApi = {
  list: async (filter?: FIRFilter): Promise<FIRListResponse> => {
    const params: Record<string, string | number> = {};
    if (filter) {
      if (filter.page) params.page = filter.page;
      if (filter.pageSize) params.pageSize = filter.pageSize;
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;
      if (filter.dateFrom) params.dateFrom = filter.dateFrom;
      if (filter.dateTo) params.dateTo = filter.dateTo;
      if (filter.assignedOfficerId) params.assignedOfficerId = filter.assignedOfficerId;
    }
    return apiClient.get<FIRListResponse>('/firs', params);
  },

  get: async (id: string): Promise<FIR> => {
    return apiClient.get<FIR>(`/firs/${id}`);
  },

  create: async (data: CreateFIRRequest): Promise<FIR> => {
    return apiClient.post<FIR>('/firs', data);
  },

  update: async (id: string, data: UpdateFIRRequest): Promise<FIR> => {
    return apiClient.put<FIR>(`/firs/${id}`, data);
  },

  updateStatus: async (id: string, status: FIRStatus): Promise<void> => {
    await apiClient.patch(`/firs/${id}/status`, { status });
  },

  getTimeline: async (id: string): Promise<{ timeline: unknown[] }> => {
    return apiClient.get(`/firs/${id}/timeline`);
  },

  getStats: async (): Promise<{
    total: number;
    registered: number;
    underInvestigation: number;
    closed: number;
    byPriority: Record<Priority, number>;
  }> => {
    return apiClient.get('/firs/stats');
  },
};

export default firApi;
