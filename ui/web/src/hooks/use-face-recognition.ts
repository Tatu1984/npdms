"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import faceRecognitionApi, {
  type FRCandidateStatus,
  type FRPhotoKind,
  type RecordAuthorisationInput,
  type SearchInput,
} from "@/lib/api/face-recognition";
import { missingPersonKeys } from "@/hooks/use-missing-persons";

export const frKeys = {
  all: ["face-recognition"] as const,
  status: () => ["face-recognition", "status"] as const,
  authorisations: () => ["face-recognition", "authorisations"] as const,
  report: (id: string) => ["face-recognition", "report", id] as const,
  reportCandidates: (id: string) => ["face-recognition", "report", id, "candidates"] as const,
  queue: (q: object) => ["face-recognition", "queue", q] as const,
};

export const useFRStatus = () =>
  useQuery({ queryKey: frKeys.status(), queryFn: faceRecognitionApi.status, refetchInterval: 30_000 });

export const useFRAuthorisations = () =>
  useQuery({ queryKey: frKeys.authorisations(), queryFn: faceRecognitionApi.authorisations });

export const useFRReport = (reportId: string, enabled = true) =>
  useQuery({ queryKey: frKeys.report(reportId), queryFn: () => faceRecognitionApi.report(reportId), enabled: Boolean(reportId) && enabled });

export const useFRReportCandidates = (reportId: string, enabled = true) =>
  useQuery({
    queryKey: frKeys.reportCandidates(reportId),
    queryFn: () => faceRecognitionApi.reportCandidates(reportId),
    enabled: Boolean(reportId) && enabled,
  });

export const useFRQueue = (q: { status?: FRCandidateStatus | "ALL"; demo?: boolean; page?: number }) =>
  useQuery({ queryKey: frKeys.queue(q), queryFn: () => faceRecognitionApi.queue({ ...q, pageSize: 20 }), refetchInterval: 30_000 });

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: frKeys.all });
    qc.invalidateQueries({ queryKey: missingPersonKeys.all });
  };
}

export const useRecordAuthorisation = () => {
  const done = useInvalidate();
  return useMutation({ mutationFn: (input: RecordAuthorisationInput) => faceRecognitionApi.recordAuthorisation(input), onSuccess: done });
};

export const useRevokeAuthorisation = () => {
  const done = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; reason: string }) => faceRecognitionApi.revokeAuthorisation(v.id, v.reason), onSuccess: done });
};

export const useUpdateFRSettings = () => {
  const done = useInvalidate();
  return useMutation({ mutationFn: faceRecognitionApi.updateSettings, onSuccess: done });
};

export const useEnrol = (reportId: string) => {
  const done = useInvalidate();
  return useMutation({
    mutationFn: (v: { photoId?: string; kind?: FRPhotoKind } = {}) => faceRecognitionApi.enrol(reportId, v.photoId, v.kind),
    onSettled: done,
  });
};

export const useWithdrawEnrolment = (reportId: string) => {
  const done = useInvalidate();
  return useMutation({
    mutationFn: (v: { enrolmentId: string; reason: string }) => faceRecognitionApi.withdraw(reportId, v.enrolmentId, v.reason),
    onSuccess: done,
  });
};

export const useUploadSyntheticPhoto = (reportId: string) => {
  const done = useInvalidate();
  return useMutation({
    mutationFn: (v: { file: File; source: string; declared: boolean }) =>
      faceRecognitionApi.uploadSyntheticPhoto(reportId, v.file, v.source, v.declared),
    onSuccess: done,
  });
};

export const useFaceSearch = () => {
  const done = useInvalidate();
  return useMutation({ mutationFn: (input: SearchInput) => faceRecognitionApi.search(input), onSettled: done });
};

export const useConfirmCandidate = () => {
  const done = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; note?: string; location?: string }) => faceRecognitionApi.confirm(v.id, { note: v.note, location: v.location }),
    onSuccess: done,
  });
};

export const useRejectCandidate = () => {
  const done = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; note: string }) => faceRecognitionApi.reject(v.id, v.note), onSuccess: done });
};
