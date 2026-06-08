/**
 * DevPulse V2 Task Governor — sole approved scheduling authority for non-trivial work.
 */

import {
  DEFAULT_TASK_GOVERNOR_BUDGET,
  TASK_PRIORITY_RANK,
  type DevPulseV2Task,
  type DevPulseV2TaskGovernorReport,
  type DevPulseV2TaskGovernorState,
  type DevPulseV2TaskResult,
  type EnqueueResult,
  type QueuedTask,
  type ResponsivenessState,
  type TaskGovernorBudgetConfig,
  type TaskPriority,
} from './types.js';

let singleton: DevPulseV2TaskGovernor | null = null;

export class DevPulseV2TaskGovernor {
  private readonly budget: TaskGovernorBudgetConfig;
  private readonly queue: QueuedTask[] = [];
  private runningTaskId: string | null = null;
  private paused = false;
  private pauseReason: string | null = null;
  private interactionActive = false;
  private interactionReason: string | null = null;
  private lastInteractionAt = 0;

  private completedCount = 0;
  private failedCount = 0;
  private cancelledCount = 0;
  private deferredCount = 0;
  private longTaskCount = 0;

  private lastTask: DevPulseV2TaskResult | null = null;
  private lastWarning: string | null = null;
  private continuousWorkMs = 0;
  private continuousWorkStartedAt: number | null = null;

  private readonly results: DevPulseV2TaskResult[] = [];
  private readonly cancelledStaleTasks: DevPulseV2TaskResult[] = [];
  private taskCounter = 0;

  constructor(budget: TaskGovernorBudgetConfig = DEFAULT_TASK_GOVERNOR_BUDGET) {
    this.budget = budget;
  }

  enqueueTask(task: DevPulseV2Task): EnqueueResult {
    if (this.paused) {
      return { accepted: false, taskId: task.id, reason: 'Governor paused' };
    }

    if (this.queue.length >= this.budget.maxQueueSize) {
      return {
        accepted: false,
        taskId: task.id,
        reason: `Queue limit ${this.budget.maxQueueSize} reached`,
      };
    }

    this.cancelSupersededStaleTasks(task);

    this.queue.push({ ...task, sliceAttempts: 0 });
    this.sortQueue();
    this.updateResponsivenessState();

    return { accepted: true, taskId: task.id };
  }

  async runNextTask(): Promise<DevPulseV2TaskResult | null> {
    if (this.paused || this.runningTaskId) {
      return null;
    }

    const task = this.selectNextRunnableTask();
    if (!task) {
      this.updateResponsivenessState();
      return null;
    }

    return this.executeTask(task);
  }

  async runUntilBudgetExhausted(
    budgetMs: number = this.budget.maxContinuousWorkMs,
  ): Promise<DevPulseV2TaskResult[]> {
    const executed: DevPulseV2TaskResult[] = [];
    const batchStart = Date.now();

    while (Date.now() - batchStart < budgetMs) {
      const result = await this.runNextTask();
      if (!result) {
        break;
      }
      executed.push(result);

      if (result.status === 'deferred') {
        break;
      }

      if (this.continuousWorkMs >= this.budget.maxContinuousWorkMs) {
        break;
      }
    }

    this.updateResponsivenessState();
    return executed;
  }

  pause(reason: string): void {
    this.paused = true;
    this.pauseReason = reason;
    this.updateResponsivenessState();
  }

  resume(reason: string): void {
    this.paused = false;
    this.pauseReason = null;
    this.lastWarning = this.lastWarning ?? `Resumed: ${reason}`;
    this.updateResponsivenessState();
  }

  cancelTask(id: string): boolean {
    const index = this.queue.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    const [task] = this.queue.splice(index, 1);
    const now = Date.now();
    const result: DevPulseV2TaskResult = {
      id: task.id,
      status: 'cancelled',
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      priority: task.priority,
    };
    this.recordResult(result);
    this.cancelledCount += 1;
    this.updateResponsivenessState();
    return true;
  }

  cancelStaleTasks(): number {
    const now = Date.now();
    let cancelled = 0;
    const remaining: QueuedTask[] = [];

    for (const task of this.queue) {
      const isStale =
        task.cancelWhenStale &&
        task.staleAfterMs !== undefined &&
        now - task.createdAt > task.staleAfterMs;

      const protectedCancel =
        task.cancelWhenStale &&
        this.getResponsivenessState() === 'PROTECTED';

      if (isStale || protectedCancel) {
        const result: DevPulseV2TaskResult = {
          id: task.id,
          status: 'cancelled',
          startedAt: now,
          finishedAt: now,
          durationMs: 0,
          priority: task.priority,
          error: isStale ? 'Stale timeout exceeded' : 'Cancelled in PROTECTED state',
        };
        this.recordResult(result);
        this.cancelledStaleTasks.push(result);
        this.cancelledCount += 1;
        cancelled += 1;
      } else {
        remaining.push(task);
      }
    }

    this.queue.length = 0;
    this.queue.push(...remaining);
    this.updateResponsivenessState();
    return cancelled;
  }

  setInteractionActive(active: boolean, reason?: string): void {
    this.interactionActive = active;
    this.interactionReason = reason ?? null;
    if (active) {
      this.lastInteractionAt = Date.now();
    }
    if (active) {
      this.cancelStaleTasks();
    }
    this.updateResponsivenessState();
  }

  getState(): DevPulseV2TaskGovernorState {
    return {
      queueLength: this.queue.length,
      runningTaskId: this.runningTaskId,
      completedCount: this.completedCount,
      failedCount: this.failedCount,
      cancelledCount: this.cancelledCount,
      deferredCount: this.deferredCount,
      longTaskCount: this.longTaskCount,
      paused: this.paused,
      pauseReason: this.pauseReason,
      lastTask: this.lastTask,
      lastWarning: this.lastWarning,
      responsivenessState: this.getResponsivenessState(),
      interactionActive: this.interactionActive,
      interactionReason: this.interactionReason,
      continuousWorkMs: this.continuousWorkMs,
    };
  }

  getReport(): DevPulseV2TaskGovernorReport {
    const state = this.getState();
    const responsivenessState = state.responsivenessState;

    const longTasks = this.results.filter(
      (r) => r.durationMs >= this.budget.longTaskWarningMs,
    );
    const deferredTasks = this.results.filter((r) => r.status === 'deferred');

    let verdict: DevPulseV2TaskGovernorReport['verdict'] = 'HEALTHY';
    if (responsivenessState === 'PROTECTED') {
      verdict = 'PROTECTED';
    } else if (responsivenessState === 'DEGRADED') {
      verdict = 'DEGRADED';
    }

    let recommendedAction = 'Continue normal scheduling.';
    if (responsivenessState === 'PROTECTED') {
      recommendedAction =
        'User interaction active — defer P2/P3/P4; only P0/P1 on critical path.';
    } else if (responsivenessState === 'DEGRADED') {
      recommendedAction =
        'Reduce background load; cancel stale tasks; verify P3 tasks use slicing.';
    } else if (longTasks.length > 0) {
      recommendedAction = 'Review long tasks; ensure heavy work uses P3 slices.';
    }

    const summary = [
      `Task Governor ${verdict}`,
      `queue=${state.queueLength}`,
      `responsiveness=${responsivenessState}`,
      `longTasks=${state.longTaskCount}`,
      `deferred=${state.deferredCount}`,
    ].join(' | ');

    return {
      ...state,
      verdict,
      longTasks,
      deferredTasks,
      cancelledStaleTasks: [...this.cancelledStaleTasks],
      recommendedAction,
      summary,
    };
  }

  /** @internal test hook — simulate idle for P4 scheduling */
  setLastInteractionAtForTests(timestamp: number): void {
    this.lastInteractionAt = timestamp;
  }

  private selectNextRunnableTask(): QueuedTask | null {
    this.cancelStaleTasks();

    if (!this.isIdleForP4()) {
      this.queue.sort((a, b) => {
        const rankDiff = TASK_PRIORITY_RANK[a.priority] - TASK_PRIORITY_RANK[b.priority];
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return a.createdAt - b.createdAt;
      });
    }

    for (let i = 0; i < this.queue.length; i += 1) {
      const task = this.queue[i];
      if (this.canRunPriority(task.priority)) {
        this.queue.splice(i, 1);
        return task;
      }
    }

    return null;
  }

  private canRunPriority(priority: TaskPriority): boolean {
    if (this.interactionActive) {
      if (priority === 'P0_VISIBLE_USER_PATH' || priority === 'P1_CORE_INTERACTION') {
        return true;
      }
      // P2 deferred during interaction unless queue is empty (no runnable work)
      if (priority === 'P2_LIGHT_BACKGROUND') {
        return false;
      }
      return false;
    }

    if (priority === 'P4_IDLE_ONLY') {
      return this.isIdleForP4();
    }

    return true;
  }

  private isIdleForP4(): boolean {
    if (this.interactionActive) {
      return false;
    }
    return Date.now() - this.lastInteractionAt >= this.budget.idleOnlyDelayMs;
  }

  private async executeTask(task: QueuedTask): Promise<DevPulseV2TaskResult> {
    this.runningTaskId = task.id;
    const startedAt = Date.now();
    const sliceBudget =
      task.priority === 'P3_HEAVY_BACKGROUND'
        ? task.maxSliceMs ?? this.budget.defaultSliceBudgetMs
        : this.budget.maxContinuousWorkMs;

    try {
      await this.runWithSliceBudget(task, sliceBudget);
      const finishedAt = Date.now();
      const durationMs = finishedAt - startedAt;

      this.trackContinuousWork(durationMs);

      if (durationMs >= this.budget.longTaskWarningMs) {
        this.longTaskCount += 1;
        this.lastWarning = `Long task ${task.label} (${durationMs}ms >= ${this.budget.longTaskWarningMs}ms)`;
      }

      const result: DevPulseV2TaskResult = {
        id: task.id,
        status: 'completed',
        startedAt,
        finishedAt,
        durationMs,
        priority: task.priority,
      };
      this.recordResult(result);
      this.completedCount += 1;
      return result;
    } catch (error) {
      const finishedAt = Date.now();
      const durationMs = finishedAt - startedAt;
      const message = error instanceof Error ? error.message : String(error);

      if (message === 'SLICE_BUDGET_EXCEEDED') {
        task.sliceAttempts += 1;
        this.queue.unshift(task);
        this.sortQueue();
        this.deferredCount += 1;

        const result: DevPulseV2TaskResult = {
          id: task.id,
          status: 'deferred',
          startedAt,
          finishedAt,
          durationMs,
          priority: task.priority,
          error: 'Deferred — slice budget exceeded; will resume',
        };
        this.recordResult(result);
        return result;
      }

      const result: DevPulseV2TaskResult = {
        id: task.id,
        status: 'failed',
        startedAt,
        finishedAt,
        durationMs,
        priority: task.priority,
        error: message,
      };
      this.recordResult(result);
      this.failedCount += 1;
      return result;
    } finally {
      this.runningTaskId = null;
      this.updateResponsivenessState();
    }
  }

  private async runWithSliceBudget(task: QueuedTask, sliceBudgetMs: number): Promise<void> {
    const sliceStart = Date.now();
    const outcome = task.run();

    if (outcome instanceof Promise) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('SLICE_BUDGET_EXCEEDED'));
        }, sliceBudgetMs);

        outcome
          .then(() => {
            clearTimeout(timer);
            resolve();
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
      return;
    }

    const elapsed = Date.now() - sliceStart;
    if (
      task.priority === 'P3_HEAVY_BACKGROUND' &&
      elapsed > sliceBudgetMs
    ) {
      throw new Error('SLICE_BUDGET_EXCEEDED');
    }
  }

  private trackContinuousWork(durationMs: number): void {
    const now = Date.now();
    if (this.continuousWorkStartedAt === null) {
      this.continuousWorkStartedAt = now;
    }
    this.continuousWorkMs += durationMs;

    if (this.continuousWorkMs >= this.budget.maxContinuousWorkMs) {
      this.lastWarning =
        this.lastWarning ??
        `Continuous work ${this.continuousWorkMs}ms reached max ${this.budget.maxContinuousWorkMs}ms`;
      this.continuousWorkMs = 0;
      this.continuousWorkStartedAt = null;
    }
  }

  private cancelSupersededStaleTasks(incoming: DevPulseV2Task): void {
    if (!incoming.cancelWhenStale) {
      return;
    }

    const now = Date.now();
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      const existing = this.queue[i];
      if (
        existing.cancelWhenStale &&
        existing.label === incoming.label &&
        existing.id !== incoming.id
      ) {
        this.queue.splice(i, 1);
        const result: DevPulseV2TaskResult = {
          id: existing.id,
          status: 'cancelled',
          startedAt: now,
          finishedAt: now,
          durationMs: 0,
          priority: existing.priority,
          error: 'Superseded by newer task',
        };
        this.recordResult(result);
        this.cancelledStaleTasks.push(result);
        this.cancelledCount += 1;
      }
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const rankDiff = TASK_PRIORITY_RANK[a.priority] - TASK_PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return a.createdAt - b.createdAt;
    });
  }

  private recordResult(result: DevPulseV2TaskResult): void {
    this.results.push(result);
    this.lastTask = result;
  }

  private getResponsivenessState(): ResponsivenessState {
    if (this.interactionActive) {
      return 'PROTECTED';
    }
    if (
      this.queue.length >= this.budget.maxQueueSize * 0.8 ||
      this.longTaskCount >= 3
    ) {
      return 'DEGRADED';
    }
    if (this.runningTaskId || this.queue.length > 0) {
      return 'BUSY';
    }
    return 'RESPONSIVE';
  }

  private updateResponsivenessState(): void {
    void this.getResponsivenessState();
  }
}

export function createDevPulseV2TaskGovernor(
  budget?: TaskGovernorBudgetConfig,
): DevPulseV2TaskGovernor {
  singleton = new DevPulseV2TaskGovernor(budget);
  return singleton;
}

export function getDevPulseV2TaskGovernor(): DevPulseV2TaskGovernor {
  if (!singleton) {
    singleton = new DevPulseV2TaskGovernor();
  }
  return singleton;
}

export function resetDevPulseV2TaskGovernorForTests(
  budget?: TaskGovernorBudgetConfig,
): DevPulseV2TaskGovernor {
  singleton = new DevPulseV2TaskGovernor(budget);
  return singleton;
}

export function createTaskId(prefix = 'task'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
