"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bodycamApi, {
  type BWCDeviceStatus,
  type BWCReadingSource,
  type DeviceQuery,
  type RecordingQuery,
} from "@/lib/api/bodycam";

/**
 * React Query bindings for Phase 13. No local fallback. Mutations invalidate
 * only what they change — a camera, its ledger and the register counts — so
 * normal use stays inside the API's rate limit.
 */

export const bodycamKeys = {
  all: ["bodycam"] as const,
  devices: (q: DeviceQuery) => ["bodycam", "devices", q] as const,
  deviceLists: () => ["bodycam", "devices"] as const,
  stats: () => ["bodycam", "stats"] as const,
  device: (id: string) => ["bodycam", "device", id] as const,
  readings: (id: string) => ["bodycam", "device", id, "readings"] as const,
  assignments: (id: string) => ["bodycam", "device", id, "assignments"] as const,
  recordings: (q: RecordingQuery) => ["bodycam", "recordings", q] as const,
  recordingLists: () => ["bodycam", "recordings"] as const,
  chain: (id: string) => ["bodycam", "recording", id, "chain"] as const,
  accessLog: (id: string) => ["bodycam", "recording", id, "access-log"] as const,
};

export function useBodycamDevices(q: DeviceQuery) {
  return useQuery({ queryKey: bodycamKeys.devices(q), queryFn: () => bodycamApi.devices(q) });
}

export function useBodycamStats() {
  return useQuery({ queryKey: bodycamKeys.stats(), queryFn: bodycamApi.stats });
}

export function useBodycamDevice(id: string | null) {
  return useQuery({
    queryKey: bodycamKeys.device(id ?? ""),
    queryFn: () => bodycamApi.device(id!),
    enabled: Boolean(id),
  });
}

export function useBodycamReadings(id: string | null) {
  return useQuery({
    queryKey: bodycamKeys.readings(id ?? ""),
    queryFn: () => bodycamApi.readings(id!),
    enabled: Boolean(id),
  });
}

export function useBodycamAssignments(id: string | null) {
  return useQuery({
    queryKey: bodycamKeys.assignments(id ?? ""),
    queryFn: () => bodycamApi.assignments(id!),
    enabled: Boolean(id),
  });
}

export function useBodycamRecordings(q: RecordingQuery, enabled = true) {
  return useQuery({ queryKey: bodycamKeys.recordings(q), queryFn: () => bodycamApi.recordings(q), enabled });
}

export function useRecordingChain(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bodycamKeys.chain(id ?? ""),
    queryFn: () => bodycamApi.chain(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useRecordingAccessLog(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bodycamKeys.accessLog(id ?? ""),
    queryFn: () => bodycamApi.accessLog(id!),
    enabled: Boolean(id) && enabled,
  });
}

/** Refreshes one camera, its lists and the counts. */
function useInvalidateDevice() {
  const qc = useQueryClient();
  return (deviceId: string) => {
    qc.invalidateQueries({ queryKey: bodycamKeys.device(deviceId) });
    qc.invalidateQueries({ queryKey: bodycamKeys.deviceLists() });
    qc.invalidateQueries({ queryKey: bodycamKeys.stats() });
  };
}

export function useRegisterBodycam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bodycamApi.registerDevice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bodycamKeys.deviceLists() });
      qc.invalidateQueries({ queryKey: bodycamKeys.stats() });
    },
  });
}

export function useSetBodycamStatus(deviceId: string) {
  const refresh = useInvalidateDevice();
  return useMutation({
    mutationFn: (body: { status: BWCDeviceStatus; note?: string }) => bodycamApi.setStatus(deviceId, body),
    onSuccess: () => refresh(deviceId),
  });
}

export function useRecordBodycamReading(deviceId: string) {
  const qc = useQueryClient();
  const refresh = useInvalidateDevice();
  return useMutation({
    mutationFn: (body: { batteryPercent: number; storagePercent: number; source: BWCReadingSource }) =>
      bodycamApi.recordReading(deviceId, body),
    onSuccess: () => {
      refresh(deviceId);
      qc.invalidateQueries({ queryKey: bodycamKeys.readings(deviceId) });
    },
  });
}

export function useIssueBodycam(deviceId: string) {
  const qc = useQueryClient();
  const refresh = useInvalidateDevice();
  return useMutation({
    mutationFn: (body: { officerId: string; shiftLabel: string; expectedReturn?: string }) =>
      bodycamApi.issue(deviceId, body),
    onSuccess: () => {
      refresh(deviceId);
      qc.invalidateQueries({ queryKey: bodycamKeys.assignments(deviceId) });
    },
  });
}

export function useReturnBodycam(deviceId: string) {
  const qc = useQueryClient();
  const refresh = useInvalidateDevice();
  return useMutation({
    mutationFn: ({ assignmentId, note }: { assignmentId: string; note?: string }) =>
      bodycamApi.returnCamera(deviceId, assignmentId, { note }),
    onSuccess: () => {
      refresh(deviceId);
      qc.invalidateQueries({ queryKey: bodycamKeys.assignments(deviceId) });
    },
  });
}

export function useDockRecording(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { assignmentId: string; file: File; startedAt: string; endedAt: string }) =>
      bodycamApi.dock(deviceId, v.assignmentId, v.file, v.startedAt, v.endedAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bodycamKeys.assignments(deviceId) });
      qc.invalidateQueries({ queryKey: bodycamKeys.recordingLists() });
      qc.invalidateQueries({ queryKey: bodycamKeys.stats() });
    },
  });
}

export function useLinkRecording(recordingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { firId?: string; caseId?: string; dispatchIncidentId?: string; note: string }) =>
      bodycamApi.link(recordingId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bodycamKeys.recordingLists() });
      qc.invalidateQueries({ queryKey: bodycamKeys.chain(recordingId) });
      qc.invalidateQueries({ queryKey: bodycamKeys.stats() });
    },
  });
}

export function usePurgeRecording(recordingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => bodycamApi.purge(recordingId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bodycamKeys.recordingLists() });
      qc.invalidateQueries({ queryKey: bodycamKeys.stats() });
    },
  });
}
