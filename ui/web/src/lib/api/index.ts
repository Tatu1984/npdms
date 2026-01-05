// API Services
export { default as apiClient, ApiClientError } from './client';
export { default as authApi, type User, type LoginResponse } from './auth';
export { default as firApi, type FIR, type FIRListResponse, type FIRFilter, type FIRStatus, type Priority, type CreateFIRRequest, type UpdateFIRRequest } from './fir';
export { default as casesApi, type Case, type Accused, type Witness, type CaseListResponse, type CaseStatus, type CaseFilter, type CreateCaseRequest, type UpdateCaseRequest } from './cases';
export { default as evidenceApi, type Evidence, type EvidenceCustody, type EvidenceListResponse, type EvidenceType, type EvidenceStatus, type EvidenceFilter, type CreateEvidenceRequest, type UpdateEvidenceRequest, type TransferEvidenceRequest } from './evidence';
