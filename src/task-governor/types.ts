/** DevPulse V2 Task Governor — types and budget constants. */

export type TaskPriority =
  | 'P0_VISIBLE_USER_PATH'
  | 'P1_CORE_INTERACTION'
  | 'P2_LIGHT_BACKGROUND'
  | 'P3_HEAVY_BACKGROUND'
  | 'P4_IDLE_ONLY';

export type TaskStatus = 'completed' | 'failed' | 'cancelled' | 'deferred';

export type ResponsivenessState =
  | 'RESPONSIVE'
  | 'BUSY'
  | 'PROTECTED'
  | 'DEGRADED';

export interface TaskGovernorBudgetConfig {
  defaultSliceBudgetMs: number;
  maxContinuousWorkMs: number;
  maxQueueSize: number;
  idleOnlyDelayMs: number;
  longTaskWarningMs: number;
}

export const DEFAULT_TASK_GOVERNOR_BUDGET: TaskGovernorBudgetConfig = {
  defaultSliceBudgetMs: 25,
  maxContinuousWorkMs: 50,
  maxQueueSize: 100,
  idleOnlyDelayMs: 250,
  longTaskWarningMs: 50,
};

/** Priority rank — lower number runs first. */
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  P0_VISIBLE_USER_PATH: 0,
  P1_CORE_INTERACTION: 1,
  P2_LIGHT_BACKGROUND: 2,
  P3_HEAVY_BACKGROUND: 3,
  P4_IDLE_ONLY: 4,
};

export interface DevPulseV2Task {
  id: string;
  label: string;
  priority: TaskPriority;
  estimatedCostMs: number;
  run: () => void | Promise<void>;
  createdAt: number;
  maxSliceMs?: number;
  cancelWhenStale?: boolean;
  staleAfterMs?: number;
}

export interface DevPulseV2TaskResult {
  id: string;
  status: TaskStatus;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  priority: TaskPriority;
  error?: string;
}

export interface DevPulseV2TaskGovernorState {
  queueLength: number;
  runningTaskId: string | null;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  deferredCount: number;
  longTaskCount: number;
  paused: boolean;
  pauseReason: string | null;
  lastTask: DevPulseV2TaskResult | null;
  lastWarning: string | null;
  responsivenessState: ResponsivenessState;
  interactionActive: boolean;
  interactionReason: string | null;
  continuousWorkMs: number;
}

export interface DevPulseV2TaskGovernorReport extends DevPulseV2TaskGovernorState {
  verdict: 'HEALTHY' | 'DEGRADED' | 'PROTECTED';
  longTasks: DevPulseV2TaskResult[];
  deferredTasks: DevPulseV2TaskResult[];
  cancelledStaleTasks: DevPulseV2TaskResult[];
  recommendedAction: string;
  summary: string;
}

export interface EnqueueResult {
  accepted: boolean;
  taskId: string;
  reason?: string;
}

interface QueuedTask extends DevPulseV2Task {
  sliceAttempts: number;
}

export type { QueuedTask };

export const TASK_GOVERNOR_PASS_TOKEN =
  'DEVPULSE_V2_TASK_GOVERNOR_FOUNDATION_V1_PASS';
