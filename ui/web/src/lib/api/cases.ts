import apiClient from './client';

export type CaseStatus = 'registered' | 'under_investigation' | 'chargesheet_filed' | 'court_proceedings' | 'closed' | 'transferred';

export interface Case {
  id: string;
  caseNumber: string;
  firId: string;
  firNumber: string;
  title: string;
  status: CaseStatus;
  ipcSections: string[];
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  courtName?: string;
  nextHearingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Accused {
  id: string;
  caseId?: string;
  firId?: string;
  name: string;
  fatherName?: string;
  age?: number;
  gender: string;
  address?: string;
  phone?: string;
  aadhar?: string;
  status: 'wanted' | 'arrested' | 'in_custody' | 'released_on_bail' | 'absconding' | 'deceased';
  arrestDate?: string;
  arrestingOfficer?: string;
  custodyLocation?: string;
  bailStatus?: string;
  role?: string;
  photo?: string;
}

export interface Witness {
  id: string;
  caseId?: string;
  firId?: string;
  name: string;
  fatherName?: string;
  age?: number;
  gender: string;
  address?: string;
  phone?: string;
  type: 'eyewitness' | 'expert' | 'character' | 'material' | 'hostile';
  statement?: string;
  statementDate?: string;
  isProtected: boolean;
  reliability?: string;
}

export interface CaseListResponse {
  data: Case[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CaseFilter {
  page?: number;
  pageSize?: number;
  status?: CaseStatus;
  search?: string;
  assignedOfficerId?: string;
}

export interface CreateCaseRequest {
  firId: string;
  title: string;
  ipcSections: string[];
}

export interface UpdateCaseRequest {
  title?: string;
  status?: CaseStatus;
  ipcSections?: string[];
  assignedOfficerId?: string;
  courtName?: string;
  nextHearingDate?: string;
}

export const casesApi = {
  list: async (filter?: CaseFilter): Promise<CaseListResponse> => {
    const params: Record<string, string | number> = {};
    if (filter) {
      if (filter.page) params.page = filter.page;
      if (filter.pageSize) params.pageSize = filter.pageSize;
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      if (filter.assignedOfficerId) params.assignedOfficerId = filter.assignedOfficerId;
    }
    return apiClient.get<CaseListResponse>('/cases', params);
  },

  get: async (id: string): Promise<Case> => {
    return apiClient.get<Case>(`/cases/${id}`);
  },

  create: async (data: CreateCaseRequest): Promise<Case> => {
    return apiClient.post<Case>('/cases', data);
  },

  update: async (id: string, data: UpdateCaseRequest): Promise<Case> => {
    return apiClient.put<Case>(`/cases/${id}`, data);
  },

  // Accused management
  getAccused: async (caseId: string): Promise<Accused[]> => {
    return apiClient.get<Accused[]>(`/cases/${caseId}/accused`);
  },

  addAccused: async (caseId: string, data: Omit<Accused, 'id' | 'caseId'>): Promise<Accused> => {
    return apiClient.post<Accused>(`/cases/${caseId}/accused`, data);
  },

  updateAccused: async (caseId: string, accusedId: string, data: Partial<Accused>): Promise<Accused> => {
    return apiClient.put<Accused>(`/cases/${caseId}/accused/${accusedId}`, data);
  },

  // Witness management
  getWitnesses: async (caseId: string): Promise<Witness[]> => {
    return apiClient.get<Witness[]>(`/cases/${caseId}/witnesses`);
  },

  addWitness: async (caseId: string, data: Omit<Witness, 'id' | 'caseId'>): Promise<Witness> => {
    return apiClient.post<Witness>(`/cases/${caseId}/witnesses`, data);
  },

  updateWitness: async (caseId: string, witnessId: string, data: Partial<Witness>): Promise<Witness> => {
    return apiClient.put<Witness>(`/cases/${caseId}/witnesses/${witnessId}`, data);
  },
};

export default casesApi;
