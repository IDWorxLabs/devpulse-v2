/** DevPulse V2 Phase 1 Stability Soak — types. */

export type SoakStatus = 'IDLE' | 'RUNNING' | 'PASS' | 'WARN' | 'FAIL';

export type Phase2Readiness =
  | 'NOT_READY'
  | 'FOUNDATION_READY'
  | 'REAL_BROWSER_REQUIRED';

export type CycleOutcome = 'PASS' | 'WARN' | 'FAIL';

export interface SoakCycleResult {
  cycleIndex: number;
  startedAt: number;
  completedAt: number;
  outcome: CycleOutcome;
  foundationEnforcementOk: boolean;
  taskGovernorOk: boolean;
  shellOk: boolean;
  chatAuthorityOk: boolean;
  inlineOperatorFeedOk: boolean;
  browserHarnessStatus: 'PASS' | 'WARN' | 'FAIL';
  warnings: string[];
  errors: string[];
}

export interface Phase1StabilitySoakState {
  soakId: string;
  startedAt: number;
  completedAt?: number;
  runCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  status: SoakStatus;
  phase2Readiness: Phase2Readiness;
  warnings: string[];
  errors: string[];
  cycles: SoakCycleResult[];
  realBrowserRunnerAttached: boolean;
  elapsedDaysClaimed: number;
}

export interface Phase1StabilitySoakReport {
  soakId: string;
  runCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  status: SoakStatus;
  phase2Readiness: Phase2Readiness;
  browserRunnerStatus: 'simulated' | 'real';
  repeatedStabilityResult: string;
  remainingPhase1Risk: string[];
  recommendation: string;
  summary: string;
  warnings: string[];
  errors: string[];
  elapsedDaysClaimed: number;
}

export const SOAK_OWNER_MODULE = 'devpulse_v2_phase_1_stability_soak_authority';
export const SOAK_PASS_TOKEN = 'DEVPULSE_V2_PHASE_1_STABILITY_SOAK_FOUNDATION_V1_PASS';
export const DEFAULT_SOAK_CYCLE_COUNT = 3;

/** Constitutional Phase 1 soak requires 30 days — this foundation does NOT claim that. */
export const PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED = 30;
