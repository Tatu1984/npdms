"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import aiReviewApi, {
  type AcceptanceQuery,
  type AIQueueQuery,
  type FeedbackInput,
  type RecordEvaluationInput,
  type RegisterModelInput,
  type ReviewInput,
  type UpdateModelInput,
} from "@/lib/api/ai-review";

/**
 * React Query bindings for the AI layer.
 *
 * Invalidation is scoped to what a change can affect: a review refreshes the
 * queue and the acceptance figures, a switch refreshes the registry and the
 * gateway. Nothing here polls the model services themselves.
 */
export const aiKeys = {
  all: ["ai-review"] as const,
  gateway: ["ai-review", "gateway"] as const,
  models: ["ai-review", "models"] as const,
  model: (name: string) => ["ai-review", "model", name] as const,
  evaluations: (name?: string) => ["ai-review", "evaluations", name ?? "all"] as const,
  evaluationLists: ["ai-review", "evaluations"] as const,
  modules: ["ai-review", "modules"] as const,
  acceptance: (q: AcceptanceQuery) => ["ai-review", "acceptance", q] as const,
  acceptanceLists: ["ai-review", "acceptance"] as const,
  queue: (q: AIQueueQuery) => ["ai-review", "queue", q] as const,
  queues: ["ai-review", "queue"] as const,
  stats: ["ai-review", "stats"] as const,
  assignments: ["ai-review", "my-assignments"] as const,
  decision: (id: string) => ["ai-review", "decision", id] as const,
  history: (id: string) => ["ai-review", "decision", id, "history"] as const,
};

/**
 * The gateway is readable by DSP and above. `enabled` lets a screen open to
 * every officer skip the request rather than collect a 403 on each load.
 */
export function useAIGateway(enabled = true) {
  return useQuery({ queryKey: aiKeys.gateway, queryFn: aiReviewApi.gateway, staleTime: 30_000, enabled });
}

export function useAIModels() {
  return useQuery({ queryKey: aiKeys.models, queryFn: aiReviewApi.models });
}

export function useAIModel(modelName: string) {
  return useQuery({
    queryKey: aiKeys.model(modelName),
    queryFn: () => aiReviewApi.model(modelName),
    enabled: Boolean(modelName),
  });
}

export function useAIEvaluations(modelName?: string) {
  return useQuery({
    queryKey: aiKeys.evaluations(modelName),
    queryFn: () => aiReviewApi.evaluations(modelName).then((r) => r.data ?? []),
  });
}

export function useAIModuleSwitches() {
  return useQuery({ queryKey: aiKeys.modules, queryFn: () => aiReviewApi.modules().then((r) => r.data ?? []) });
}

export function useAIAcceptance(query: AcceptanceQuery) {
  return useQuery({
    queryKey: aiKeys.acceptance(query),
    queryFn: () => aiReviewApi.acceptance(query),
    placeholderData: (prev) => prev,
  });
}

export function useAIQueue(query: AIQueueQuery) {
  return useQuery({
    queryKey: aiKeys.queue(query),
    queryFn: () => aiReviewApi.queue(query),
    placeholderData: (prev) => prev,
  });
}

export function useAIStats() {
  return useQuery({ queryKey: aiKeys.stats, queryFn: aiReviewApi.stats });
}

export function useAIMyAssignments() {
  return useQuery({ queryKey: aiKeys.assignments, queryFn: aiReviewApi.myAssignments });
}

export function useAIDecision(id: string, enabled = true) {
  return useQuery({
    queryKey: aiKeys.decision(id),
    queryFn: () => aiReviewApi.decision(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useAIDecisionHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: aiKeys.history(id),
    queryFn: () => aiReviewApi.history(id),
    enabled: Boolean(id) && enabled,
  });
}

/** Registering a model does not switch it on; the registry decides that. */
export function useRegisterAIModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterModelInput) => aiReviewApi.registerModel(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.models });
      qc.invalidateQueries({ queryKey: aiKeys.gateway });
      qc.invalidateQueries({ queryKey: aiKeys.modules });
    },
  });
}

/**
 * Changes a registry entry. Switching one on is refused with 409 until an
 * evaluation of that exact version has passed; the caller shows that message
 * as the rule it is.
 */
export function useUpdateAIModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modelName, input }: { modelName: string; input: UpdateModelInput }) =>
      aiReviewApi.updateModel(modelName, input),
    onSuccess: (_model, variables) => {
      qc.invalidateQueries({ queryKey: aiKeys.models });
      qc.invalidateQueries({ queryKey: aiKeys.gateway });
      qc.invalidateQueries({ queryKey: aiKeys.model(variables.modelName) });
      qc.invalidateQueries({ queryKey: aiKeys.modules });
    },
  });
}

/** Measurements are appended, never rewritten. */
export function useRecordAIEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordEvaluationInput) => aiReviewApi.recordEvaluation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiKeys.evaluationLists });
      qc.invalidateQueries({ queryKey: aiKeys.models });
      qc.invalidateQueries({ queryKey: aiKeys.gateway });
    },
  });
}

export function useReviewAIDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewInput }) => aiReviewApi.review(id, input),
    // Settled, not success: a 409 means another officer decided it, so the
    // queue and the decision both need rereading.
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: aiKeys.queues });
      qc.invalidateQueries({ queryKey: aiKeys.stats });
      qc.invalidateQueries({ queryKey: aiKeys.assignments });
      qc.invalidateQueries({ queryKey: aiKeys.acceptanceLists });
      qc.invalidateQueries({ queryKey: aiKeys.decision(variables.id) });
      qc.invalidateQueries({ queryKey: aiKeys.history(variables.id) });
    },
  });
}

export function useAIDecisionFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FeedbackInput }) => aiReviewApi.feedback(id, input),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: aiKeys.history(variables.id) }),
  });
}
