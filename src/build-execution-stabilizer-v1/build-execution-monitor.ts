/**
 * Build Execution Stabilizer V1 — monitor.
 *
 * Holds the live state for one build's execution: the stage timeline, every heartbeat recorded
 * from real evidence, and which stages have already used their one allowed recovery attempt.
 * Pure state container — no process management, no timers. Timers/process handling live in
 * build-execution-stabilizer.ts, which call into this monitor to record what actually happened.
 */

import type {
  BuildExecutionHeartbeat,
  BuildExecutionRecoveryAttempt,
  BuildExecutionState,
  BuildExecutionStageName,
  BuildExecutionTimelineEntry,
} from './build-execution-types.js';

export class BuildExecutionMonitor {
  readonly startedAtMs: number;
  private readonly now: () => number;
  private readonly timeline: BuildExecutionTimelineEntry[] = [];
  private readonly heartbeats: BuildExecutionHeartbeat[] = [];
  private readonly recoveryAttempts: BuildExecutionRecoveryAttempt[] = [];
  private readonly recoveryAttemptedStages = new Set<BuildExecutionStageName>();
  private readonly stageStartMs = new Map<BuildExecutionStageName, number>();
  private readonly lastActivityMs = new Map<BuildExecutionStageName, number>();

  constructor(now: () => number = Date.now) {
    this.now = now;
    this.startedAtMs = now();
  }

  startStage(stage: BuildExecutionStageName, detail = ''): void {
    const nowMs = this.now();
    this.stageStartMs.set(stage, nowMs);
    this.lastActivityMs.set(stage, nowMs);
    this.timeline.push({
      readOnly: true,
      stage,
      state: 'RUNNING',
      startedAtMs: nowMs - this.startedAtMs,
      endedAtMs: null,
      durationMs: null,
      detail,
    });
  }

  private latestEntryFor(stage: BuildExecutionStageName): BuildExecutionTimelineEntry | null {
    for (let i = this.timeline.length - 1; i >= 0; i -= 1) {
      if (this.timeline[i]!.stage === stage) return this.timeline[i]!;
    }
    return null;
  }

  private setStageState(stage: BuildExecutionStageName, state: BuildExecutionState, detail: string, terminal: boolean): void {
    const entry = this.latestEntryFor(stage);
    const nowMs = this.now();
    const index = entry ? this.timeline.indexOf(entry) : -1;
    if (!entry || index === -1) {
      this.startStage(stage, detail);
      return this.setStageState(stage, state, detail, terminal);
    }
    const startedAbsoluteMs = this.startedAtMs + entry.startedAtMs;
    this.timeline[index] = {
      ...entry,
      state,
      detail,
      endedAtMs: terminal ? nowMs - this.startedAtMs : entry.endedAtMs,
      durationMs: terminal ? nowMs - startedAbsoluteMs : entry.durationMs,
    };
  }

  heartbeat(stage: BuildExecutionStageName, message: string): void {
    const nowMs = this.now();
    this.lastActivityMs.set(stage, nowMs);
    const startMs = this.stageStartMs.get(stage) ?? nowMs;
    this.heartbeats.push({
      readOnly: true,
      stage,
      atMs: nowMs - this.startedAtMs,
      elapsedMs: nowMs - startMs,
      message,
    });
  }

  completeStage(stage: BuildExecutionStageName, detail = ''): void {
    this.setStageState(stage, 'COMPLETED', detail, true);
  }

  failStage(stage: BuildExecutionStageName, detail: string): void {
    this.setStageState(stage, 'FAILED', detail, true);
  }

  blockStage(stage: BuildExecutionStageName, detail: string): void {
    this.setStageState(stage, 'BLOCKED', detail, true);
  }

  markStall(stage: BuildExecutionStageName, detail: string): void {
    this.setStageState(stage, 'STALL_DETECTED', detail, false);
  }

  markRecovering(stage: BuildExecutionStageName, detail = 'Attempting one automatic recovery…'): void {
    this.setStageState(stage, 'RECOVERING', detail, false);
  }

  markRecovered(stage: BuildExecutionStageName, detail = 'Recovery succeeded. Continuing build…'): void {
    this.setStageState(stage, 'RECOVERED', detail, false);
  }

  hasAttemptedRecovery(stage: BuildExecutionStageName): boolean {
    return this.recoveryAttemptedStages.has(stage);
  }

  recordRecoveryAttempt(attempt: BuildExecutionRecoveryAttempt): void {
    this.recoveryAttemptedStages.add(attempt.stage);
    this.recoveryAttempts.push(attempt);
  }

  msSinceLastActivity(stage: BuildExecutionStageName): number {
    const last = this.lastActivityMs.get(stage);
    if (last === undefined) return 0;
    return this.now() - last;
  }

  getTimeline(): BuildExecutionTimelineEntry[] {
    return [...this.timeline];
  }

  getHeartbeats(): BuildExecutionHeartbeat[] {
    return [...this.heartbeats];
  }

  getRecoveryAttempts(): BuildExecutionRecoveryAttempt[] {
    return [...this.recoveryAttempts];
  }

  getOverallState(): BuildExecutionState {
    if (this.timeline.length === 0) return 'WAITING';
    const hasBlocked = this.timeline.some((e) => e.state === 'BLOCKED');
    if (hasBlocked) return 'BLOCKED';
    const hasFailed = this.timeline.some((e) => e.state === 'FAILED');
    if (hasFailed) return 'FAILED';
    const hasStall = this.timeline.some((e) => e.state === 'STALL_DETECTED');
    if (hasStall) return 'STALL_DETECTED';
    const hasRecovering = this.timeline.some((e) => e.state === 'RECOVERING');
    if (hasRecovering) return 'RECOVERING';
    const last = this.timeline[this.timeline.length - 1]!;
    if (last.stage === 'RESULT' && last.state === 'COMPLETED') return 'COMPLETED';
    if (this.recoveryAttempts.length > 0 && this.recoveryAttempts.every((a) => a.succeeded)) {
      return last.state === 'RUNNING' ? 'RECOVERED' : last.state;
    }
    return last.state === 'RUNNING' ? 'RUNNING' : last.state;
  }

  elapsedTotalMs(): number {
    return this.now() - this.startedAtMs;
  }

  /**
   * Closes out whatever stage is still open (state RUNNING) using the build's real, already-known
   * outcome. This is the honest fallback for stages this module only observes at coarse
   * (start/duration) granularity rather than via runMonitoredCommand/runMonitoredPoll — it never
   * invents a stage that didn't run, it only finalizes the one that's still open.
   */
  finalizeDanglingStage(ok: boolean, detail: string): void {
    if (this.timeline.length === 0) return;
    const last = this.timeline[this.timeline.length - 1]!;
    if (last.state !== 'RUNNING' && last.state !== 'WAITING') return;
    if (ok) this.completeStage(last.stage, detail);
    else this.failStage(last.stage, detail);
  }
}

export function createBuildExecutionMonitor(now?: () => number): BuildExecutionMonitor {
  return new BuildExecutionMonitor(now);
}
