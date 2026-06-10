/**
 * Resource Allocation — types and models.
 * Planning only — no execution.
 */

export const RESOURCE_ALLOCATION_PASS_TOKEN = 'RESOURCE_ALLOCATION_V1_PASS';
export const RESOURCE_ALLOCATION_OWNER_MODULE = 'devpulse_v2_resource_allocation';
export const DEFAULT_MAX_ALLOCATION_HISTORY_SIZE = 128;

export type ResourceType =
  | 'BUILD_SLOT'
  | 'WORKSPACE_SLOT'
  | 'VERIFICATION_SLOT'
  | 'TESTING_SLOT'
  | 'FIXING_SLOT'
  | 'WORLD2_SLOT';

export type ResourcePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export type AllocationStatus = 'ALLOCATED' | 'QUEUED' | 'WAITING' | 'DENIED';

export type ContentionSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResourceAllocation {
  allocationId: string;
  projectId: string;
  resourceType: ResourceType;
  priority: ResourcePriority;
  status: AllocationStatus;
  allocatedUnits: number;
  createdAt: number;
}

export interface ResourceRecord {
  resourceType: ResourceType;
  totalCapacity: number;
  usedCapacity: number;
  reservedCapacity: number;
  updatedAt: number;
}

export interface ResourceCapacitySnapshot {
  resourceType: ResourceType;
  totalCapacity: number;
  usedCapacity: number;
  reservedCapacity: number;
  availableCapacity: number;
}

export interface ResourceBudget {
  budgetId: string;
  projectId?: string;
  workspaceId?: string;
  resourceType: ResourceType;
  maxUnits: number;
  usedUnits: number;
  createdAt: number;
}

export interface ResourceReservation {
  reservationId: string;
  projectId: string;
  resourceType: ResourceType;
  units: number;
  expiresAt: number;
  createdAt: number;
}

export interface QueuedAllocationRequest {
  queueId: string;
  projectId: string;
  resourceType: ResourceType;
  priority: ResourcePriority;
  requestedUnits: number;
  enqueuedAt: number;
}

export interface ContentionReport {
  resourceType: ResourceType;
  severity: ContentionSeverity;
  detail: string;
  recommendedAction: string;
}

export interface AllocationHistoryEntry {
  historyId: string;
  projectId: string;
  resourceType: ResourceType;
  eventType: 'ALLOCATION' | 'DENIAL' | 'RESERVATION' | 'RELEASE' | 'CONTENTION';
  detail: string;
  recordedAt: number;
}

export interface ResourceAllocationReport {
  reportId: string;
  capacities: ResourceCapacitySnapshot[];
  allocations: ResourceAllocation[];
  queueSize: number;
  contentionCount: number;
  utilizationPercent: number;
  recommendations: string[];
  generatedAt: number;
}

export interface AllocateResourcesInput {
  projectId: string;
  resourceType: ResourceType;
  requestedUnits: number;
  trustRecovery?: boolean;
  failedRecovery?: boolean;
  founderEscalation?: boolean;
  releaseCandidate?: boolean;
  completionCandidate?: boolean;
  activeBuild?: boolean;
  activeTesting?: boolean;
  planningOnly?: boolean;
  backgroundWork?: boolean;
}

export interface ResourceRuntimeReport {
  projectCount: number;
  allocationCount: number;
  queueSize: number;
  contentionCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const RESOURCE_ALLOCATION_QUESTION_SIGNALS = [
  'resource allocation',
  'resource budget',
  'resource priority',
  'resource contention',
  'allocation queue',
] as const;

export function isResourceAllocationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return RESOURCE_ALLOCATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
