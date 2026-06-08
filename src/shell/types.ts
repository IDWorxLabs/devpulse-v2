/** DevPulse V2 Shell — types and constitutional targets. */

import { DEV_PULSE_V2_LAWS } from '../foundation/law-registry.js';

export type ShellStatus = 'BOOTING' | 'VISIBLE' | 'CLICKABLE' | 'READY' | 'DEGRADED';

export interface DevPulseV2ShellState {
  startupId: string;
  startupStartedAt: number;
  shellVisibleAt?: number;
  shellClickableAt?: number;
  visibleMs?: number;
  clickableMs?: number;
  status: ShellStatus;
  warnings: string[];
  errors: string[];
}

export interface ClickabilityReport {
  firstClickableControl: string;
  clickabilityAchievedAt: number | null;
  clickabilityState: 'pending' | 'achieved';
  visibleAt: number | null;
  visibleMs: number | null;
  clickableMs: number | null;
  visibleTargetMet: boolean | null;
  clickableTargetMet: boolean | null;
}

export interface ShellStartupGovernorUsage {
  tasksScheduled: number;
  p0Tasks: number;
  p1Tasks: number;
  p3Tasks: number;
  p4Tasks: number;
  usedTaskGovernor: boolean;
}

export interface ShellConstitutionalTargets {
  visibleTargetMs: number;
  clickableTargetMs: number;
}

export const SHELL_CONSTITUTIONAL_TARGETS: ShellConstitutionalTargets = {
  visibleTargetMs: 800,
  clickableTargetMs: DEV_PULSE_V2_LAWS.firstClickableBudgetMs,
};

export interface ShellReport extends DevPulseV2ShellState {
  constitutionalTargets: ShellConstitutionalTargets;
  visibleTargetMet: boolean | null;
  clickableTargetMet: boolean | null;
  readinessStatus: ShellStatus;
  recommendation: string;
  summary: string;
  governorUsage: ShellStartupGovernorUsage;
}

export const SHELL_PASS_TOKEN = 'DEVPULSE_V2_SHELL_FOUNDATION_V1_PASS';

export const SHELL_OWNER_MODULE = 'devpulse_v2_shell_authority';
