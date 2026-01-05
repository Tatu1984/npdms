import apiClient from './client';

export type EvidenceType = 'physical' | 'digital' | 'documentary' | 'biological' | 'forensic' | 'testimonial';
export type EvidenceStatus = 'collected' | 'in_custody' | 'sent_to_lab' | 'analyzed' | 'presented_in_court' | 'disposed';
export type EvidenceCondition = 'intact' | 'damaged' | 'partial' | 'contaminated';

export interface Evidence {
  id: string;
  evidenceNumber: string;
  caseId: string;
  caseNumber: string;
  type: EvidenceType;
  description: string;
  collectionDate: string;
  collectionTime?: string;
  collectionLocation: string;
  collectedById: string;
  collectedByName: string;
  storageLocation?: string;
  condition: EvidenceCondition;
  status: EvidenceStatus;
  photos: string[];
  integrityHash?: string;
  forensicLabId?: string;
  forensicStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceCustody {
  id: string;
  evidenceId: string;
  fromOfficerId: string;
  fromOfficerName: string;
  toOfficerId: string;
  toOfficerName: string;
  transferDate: string;
  purpose: string;
  condition: EvidenceCondition;
  notes?: string;
  signature?: string;
}

export interface EvidenceListResponse {
  data: Evidence[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EvidenceFilter {
  page?: number;
  pageSize?: number;
  type?: EvidenceType;
  status?: EvidenceStatus;
  caseId?: string;
  search?: string;
}

export interface CreateEvidenceRequest {
  caseId: string;
  type: EvidenceType;
  description: string;
  collectionDate: string;
  collectionTime?: string;
  collectionLocation: string;
  storageLocation?: string;
  condition?: EvidenceCondition;
  photos?: string[];
  notes?: string;
  forensicAnalysisRequired?: boolean;
  forensicLabId?: string;
}

export interface UpdateEvidenceRequest {
  description?: string;
  storageLocation?: string;
  condition?: EvidenceCondition;
  status?: EvidenceStatus;
  notes?: string;
}

export interface TransferEvidenceRequest {
  toOfficerId: string;
  purpose: string;
  condition: EvidenceCondition;
  notes?: string;
}

export const evidenceApi = {
  list: async (filter?: EvidenceFilter): Promise<EvidenceListResponse> => {
    const params: Record<string, string | number> = {};
    if (filter) {
      if (filter.page) params.page = filter.page;
      if (filter.pageSize) params.pageSize = filter.pageSize;
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.caseId) params.caseId = filter.caseId;
      if (filter.search) params.search = filter.search;
    }
    return apiClient.get<EvidenceListResponse>('/evidence', params);
  },

  get: async (id: string): Promise<Evidence> => {
    return apiClient.get<Evidence>(`/evidence/${id}`);
  },

  create: async (data: CreateEvidenceRequest): Promise<Evidence> => {
    return apiClient.post<Evidence>('/evidence', data);
  },

  update: async (id: string, data: UpdateEvidenceRequest): Promise<Evidence> => {
    return apiClient.put<Evidence>(`/evidence/${id}`, data);
  },

  // Chain of custody
  getChainOfCustody: async (id: string): Promise<EvidenceCustody[]> => {
    return apiClient.get<EvidenceCustody[]>(`/evidence/${id}/custody`);
  },

  transfer: async (id: string, data: TransferEvidenceRequest): Promise<EvidenceCustody> => {
    return apiClient.post<EvidenceCustody>(`/evidence/${id}/transfer`, data);
  },

  // File upload
  uploadPhoto: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/evidence/${id}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    return response.json();
  },
};

export default evidenceApi;
