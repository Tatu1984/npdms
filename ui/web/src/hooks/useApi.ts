'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  firApi, FIR, FIRListResponse, FIRFilter, CreateFIRRequest, UpdateFIRRequest, FIRStatus,
  casesApi, Case, CaseListResponse, CaseFilter, CreateCaseRequest, UpdateCaseRequest, Accused, Witness,
  evidenceApi, Evidence, EvidenceListResponse, EvidenceFilter, CreateEvidenceRequest, UpdateEvidenceRequest, EvidenceCustody, TransferEvidenceRequest,
  authApi, User, LoginResponse,
} from '@/lib/api';

// Query Keys
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,

  // FIRs
  firs: ['firs'] as const,
  firList: (filter?: FIRFilter) => ['firs', 'list', filter] as const,
  fir: (id: string) => ['firs', id] as const,
  firTimeline: (id: string) => ['firs', id, 'timeline'] as const,
  firStats: ['firs', 'stats'] as const,

  // Cases
  cases: ['cases'] as const,
  caseList: (filter?: CaseFilter) => ['cases', 'list', filter] as const,
  case: (id: string) => ['cases', id] as const,
  caseAccused: (caseId: string) => ['cases', caseId, 'accused'] as const,
  caseWitnesses: (caseId: string) => ['cases', caseId, 'witnesses'] as const,

  // Evidence
  evidence: ['evidence'] as const,
  evidenceList: (filter?: EvidenceFilter) => ['evidence', 'list', filter] as const,
  evidenceItem: (id: string) => ['evidence', id] as const,
  evidenceCustody: (id: string) => ['evidence', id, 'custody'] as const,
};

// ============================================
// Auth Hooks
// ============================================

export function useCurrentUser(options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.currentUser, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authApi.changePassword(oldPassword, newPassword),
  });
}

// ============================================
// FIR Hooks
// ============================================

export function useFIRList(filter?: FIRFilter, options?: Omit<UseQueryOptions<FIRListResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.firList(filter),
    queryFn: () => firApi.list(filter),
    ...options,
  });
}

export function useFIR(id: string, options?: Omit<UseQueryOptions<FIR>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.fir(id),
    queryFn: () => firApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useFIRTimeline(id: string) {
  return useQuery({
    queryKey: queryKeys.firTimeline(id),
    queryFn: () => firApi.getTimeline(id),
    enabled: !!id,
  });
}

export function useFIRStats() {
  return useQuery({
    queryKey: queryKeys.firStats,
    queryFn: () => firApi.getStats(),
  });
}

export function useCreateFIR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFIRRequest) => firApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.firs });
    },
  });
}

export function useUpdateFIR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFIRRequest }) =>
      firApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fir(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.firs });
    },
  });
}

export function useUpdateFIRStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FIRStatus }) =>
      firApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fir(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.firs });
    },
  });
}

// ============================================
// Case Hooks
// ============================================

export function useCaseList(filter?: CaseFilter, options?: Omit<UseQueryOptions<CaseListResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.caseList(filter),
    queryFn: () => casesApi.list(filter),
    ...options,
  });
}

export function useCase(id: string, options?: Omit<UseQueryOptions<Case>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.case(id),
    queryFn: () => casesApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCaseAccused(caseId: string) {
  return useQuery({
    queryKey: queryKeys.caseAccused(caseId),
    queryFn: () => casesApi.getAccused(caseId),
    enabled: !!caseId,
  });
}

export function useCaseWitnesses(caseId: string) {
  return useQuery({
    queryKey: queryKeys.caseWitnesses(caseId),
    queryFn: () => casesApi.getWitnesses(caseId),
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCaseRequest) => casesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCaseRequest }) =>
      casesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases });
    },
  });
}

export function useAddAccused() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, data }: { caseId: string; data: Omit<Accused, 'id' | 'caseId'> }) =>
      casesApi.addAccused(caseId, data),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caseAccused(caseId) });
    },
  });
}

export function useAddWitness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, data }: { caseId: string; data: Omit<Witness, 'id' | 'caseId'> }) =>
      casesApi.addWitness(caseId, data),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caseWitnesses(caseId) });
    },
  });
}

// ============================================
// Evidence Hooks
// ============================================

export function useEvidenceList(filter?: EvidenceFilter, options?: Omit<UseQueryOptions<EvidenceListResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.evidenceList(filter),
    queryFn: () => evidenceApi.list(filter),
    ...options,
  });
}

export function useEvidence(id: string, options?: Omit<UseQueryOptions<Evidence>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.evidenceItem(id),
    queryFn: () => evidenceApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useEvidenceCustody(id: string) {
  return useQuery({
    queryKey: queryKeys.evidenceCustody(id),
    queryFn: () => evidenceApi.getChainOfCustody(id),
    enabled: !!id,
  });
}

export function useCreateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEvidenceRequest) => evidenceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence });
    },
  });
}

export function useUpdateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEvidenceRequest }) =>
      evidenceApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceItem(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence });
    },
  });
}

export function useTransferEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransferEvidenceRequest }) =>
      evidenceApi.transfer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceCustody(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceItem(id) });
    },
  });
}

export function useUploadEvidencePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      evidenceApi.uploadPhoto(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceItem(id) });
    },
  });
}
