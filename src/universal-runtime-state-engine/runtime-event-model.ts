/**
 * Universal Runtime State Engine V1 — typed runtime event model.
 */

export const RUNTIME_EVENT_TYPES = [
  'runtime/initialize',
  'runtime/reset',
  'query/start',
  'query/success',
  'query/failure',
  'query/invalidate',
  'query/revalidate',
  'mutation/start',
  'mutation/optimistic',
  'mutation/commit',
  'mutation/rollback',
  'mutation/failure',
  'entity/upsert',
  'entity/remove',
  'collection/replace',
  'selection/set',
  'selection/clear',
  'filter/set',
  'search/set',
  'sort/set',
  'pagination/set',
  'form/change',
  'form/dirty',
  'form/clean',
  'workflow/transition',
  'workflow/resume',
  'relationship/link',
  'relationship/unlink',
  'navigation/change',
  'feedback/success',
  'feedback/error',
  'retry/request',
  'synchronization/complete',
  'rule/evaluation-start',
  'rule/evaluation-success',
  'rule/evaluation-failure',
  'rule/value-updated',
  'rule/blocked',
  'rule/invalid',
  'rule/dependency-invalidated',
  'capability/register',
  'capability/initialize',
  'capability/ready',
  'capability/blocked',
  'capability/failure',
  'capability/reset',
  'pack/configure',
  'pack/materialize',
  'pack/verify',
  'pack/unload',
] as const;

export type RuntimeEventType = (typeof RUNTIME_EVENT_TYPES)[number];

export interface RuntimeEvent<TPayload = Record<string, unknown>> {
  readonly type: RuntimeEventType;
  readonly scopeId: string;
  readonly payload: TPayload;
  readonly timestamp: string;
  readonly provenance: string;
}

export function createRuntimeEvent<TPayload extends Record<string, unknown>>(
  type: RuntimeEventType,
  scopeId: string,
  payload: TPayload,
  provenance: string,
): RuntimeEvent<TPayload> {
  return { type, scopeId, payload, timestamp: new Date().toISOString(), provenance };
}

export function runtimeEventModelSource(): string {
  return `/** Universal runtime event model */
export const RUNTIME_EVENT_TYPES = ${JSON.stringify(RUNTIME_EVENT_TYPES, null, 2)} as const;
export type RuntimeEventType = (typeof RUNTIME_EVENT_TYPES)[number];

export interface RuntimeEvent<TPayload = Record<string, unknown>> {
  type: RuntimeEventType;
  scopeId: string;
  payload: TPayload;
  timestamp: string;
  provenance: string;
}

export function createRuntimeEvent<TPayload extends Record<string, unknown>>(
  type: RuntimeEventType,
  scopeId: string,
  payload: TPayload,
  provenance: string,
): RuntimeEvent<TPayload> {
  return { type, scopeId, payload, timestamp: new Date().toISOString(), provenance };
}
`;
}

