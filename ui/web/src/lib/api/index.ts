// API Services
export { default as apiClient, ApiClientError } from './client';
export { default as authApi, type User, type LoginResponse } from './auth';
export { default as firsApi, type FIR, type FIRQuery, type FIRStatus, type FIRPriority, type FIRInput } from './firs';
export { default as casesApi, type Case, type Accused, type Witness, type CaseQuery, type CaseStatus, type CaseInput } from './cases';
export { default as evidenceApi, type Evidence, type EvidenceCustody, type EvidenceListResponse, type EvidenceType, type EvidenceStatus, type EvidenceFilter, type CreateEvidenceRequest, type UpdateEvidenceRequest, type TransferEvidenceRequest } from './evidence';
