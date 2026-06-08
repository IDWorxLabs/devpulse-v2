/**
 * DevPulse V2 Shell Authority — sole owner of shell readiness and startup timing.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  createTaskId,
  getDevPulseV2TaskGovernor,
  resetDevPulseV2TaskGovernorForTests,
} from '../task-governor/task-governor.js';
import {
  applyClickabilityToShellState,
  bindClickabilityStartup,
  markShellClickable,
  markShellVisible,
  resetClickabilityTrackerForTests,
} from './clickability-tracker.js';
import { getShellSurfaceSnapshot } from './shell-surface.js';
import {
  SHELL_CONSTITUTIONAL_TARGETS,
  SHELL_OWNER_MODULE,
  type DevPulseV2ShellState,
  type ShellStartupGovernorUsage,
  type ShellStatus,
} from './types.js';

let singleton: DevPulseV2ShellAuthority | null = null;

function createStartupId(): string {
  return `shell-startup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DevPulseV2ShellAuthority {
  private state: DevPulseV2ShellState;
  private surfaceHtml: string | null = null;
  private governorUsage: ShellStartupGovernorUsage = {
    tasksScheduled: 0,
    p0Tasks: 0,
    p1Tasks: 0,
    p3Tasks: 0,
    p4Tasks: 0,
    usedTaskGovernor: false,
  };

  constructor(startupStartedAt: number = Date.now()) {
    const startupId = createStartupId();
    this.state = {
      startupId,
      startupStartedAt,
      status: 'BOOTING',
      warnings: [],
      errors: [],
    };
    bindClickabilityStartup(startupStartedAt);
  }

  /** Registered ownership domain — no other module may claim shell authority. */
  static readonly ownerModule = SHELL_OWNER_MODULE;
  static readonly ownerDomain = 'shell_authority' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('shell_authority');
    return owner.ownerModule === SHELL_OWNER_MODULE;
  }

  getState(): DevPulseV2ShellState {
    return applyClickabilityToShellState({ ...this.state });
  }

  getSurfaceHtml(): string | null {
    return this.surfaceHtml;
  }

  getGovernorUsage(): ShellStartupGovernorUsage {
    return { ...this.governorUsage };
  }

  /**
   * Boot shell through Task Governor — P0/P1 only, no P3/P4 startup work.
   */
  async bootShell(): Promise<DevPulseV2ShellState> {
    const governor = getDevPulseV2TaskGovernor();
    this.governorUsage.usedTaskGovernor = true;

    this.scheduleStartupTask(governor, 'P0_VISIBLE_USER_PATH', 'shell-mark-visible', () => {
      markShellVisible();
      this.state.status = 'VISIBLE';
      this.surfaceHtml = getShellSurfaceSnapshot({
        title: 'DevPulse V2',
        status: 'VISIBLE',
      }).html;
    });

    this.scheduleStartupTask(governor, 'P1_CORE_INTERACTION', 'shell-mark-clickable', () => {
      markShellClickable();
      this.state.status = 'CLICKABLE';
      this.surfaceHtml = getShellSurfaceSnapshot({
        title: 'DevPulse V2',
        status: 'CLICKABLE',
      }).html;
    });

    this.scheduleStartupTask(governor, 'P1_CORE_INTERACTION', 'shell-ready', () => {
      this.state.status = 'READY';
      this.surfaceHtml = getShellSurfaceSnapshot({
        title: 'DevPulse V2',
        status: 'READY',
      }).html;
    });

    await governor.runUntilBudgetExhausted(50);

    this.state = applyClickabilityToShellState(this.state);
    return this.getState();
  }

  /** Direct marks for tests and clickability tracker validation. */
  markVisible(at?: number): DevPulseV2ShellState {
    markShellVisible(at);
    this.state.status = 'VISIBLE';
    this.state = applyClickabilityToShellState(this.state);
    return this.getState();
  }

  markClickable(at?: number): DevPulseV2ShellState {
    markShellClickable(at);
    this.state.status = 'CLICKABLE';
    this.state = applyClickabilityToShellState(this.state);
    return this.getState();
  }

  private scheduleStartupTask(
    governor: ReturnType<typeof getDevPulseV2TaskGovernor>,
    priority: 'P0_VISIBLE_USER_PATH' | 'P1_CORE_INTERACTION',
    label: string,
    run: () => void,
  ): void {
    const result = governor.enqueueTask({
      id: createTaskId(label),
      label,
      priority,
      estimatedCostMs: 1,
      createdAt: Date.now(),
      run,
    });

    if (result.accepted) {
      this.governorUsage.tasksScheduled += 1;
      if (priority === 'P0_VISIBLE_USER_PATH') this.governorUsage.p0Tasks += 1;
      if (priority === 'P1_CORE_INTERACTION') this.governorUsage.p1Tasks += 1;
    }
  }
}

export function createDevPulseV2ShellAuthority(
  startupStartedAt?: number,
): DevPulseV2ShellAuthority {
  singleton = new DevPulseV2ShellAuthority(startupStartedAt);
  return singleton;
}

export function getDevPulseV2ShellAuthority(): DevPulseV2ShellAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ShellAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ShellAuthorityForTests(
  startupStartedAt: number = Date.now(),
): DevPulseV2ShellAuthority {
  resetDevPulseV2TaskGovernorForTests();
  resetClickabilityTrackerForTests(startupStartedAt);
  singleton = new DevPulseV2ShellAuthority(startupStartedAt);
  return singleton;
}

export function getShellStatusLabel(status: ShellStatus): string {
  return status;
}
