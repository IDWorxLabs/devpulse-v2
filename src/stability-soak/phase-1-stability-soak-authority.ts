/**
 * DevPulse V2 Phase 1 Stability Soak Authority — repeated Phase 1 validation cycles.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2BrowserVerificationHarness } from '../browser-verification/browser-verification-harness.js';
import { formatPhase1StabilitySoakReport } from './phase-1-stability-soak-report.js';
import { runPhase1SoakCycle } from './phase-1-soak-runner.js';
import type { Phase1StabilitySoakState, Phase2Readiness, SoakStatus } from './types.js';
import {
  DEFAULT_SOAK_CYCLE_COUNT,
  SOAK_OWNER_MODULE,
  PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED,
} from './types.js';

let singleton: DevPulseV2Phase1StabilitySoakAuthority | null = null;

function createSoakId(): string {
  return `phase1-soak-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function derivePhase2Readiness(
  state: Pick<Phase1StabilitySoakState, 'failCount' | 'realBrowserRunnerAttached'>,
): Phase2Readiness {
  if (state.failCount > 0) return 'NOT_READY';
  if (!state.realBrowserRunnerAttached) return 'REAL_BROWSER_REQUIRED';
  return 'FOUNDATION_READY';
}

function deriveSoakStatus(
  passCount: number,
  warnCount: number,
  failCount: number,
): SoakStatus {
  if (failCount > 0) return 'FAIL';
  if (warnCount > 0) return 'WARN';
  if (passCount > 0) return 'PASS';
  return 'IDLE';
}

export class DevPulseV2Phase1StabilitySoakAuthority {
  private state: Phase1StabilitySoakState;

  constructor() {
    this.state = {
      soakId: createSoakId(),
      startedAt: Date.now(),
      runCount: 0,
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      status: 'IDLE',
      phase2Readiness: 'NOT_READY',
      warnings: [],
      errors: [],
      cycles: [],
      realBrowserRunnerAttached: false,
      elapsedDaysClaimed: 0,
    };
  }

  static readonly ownerModule = SOAK_OWNER_MODULE;
  static readonly ownerDomain = 'phase_1_stability_soak' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('phase_1_stability_soak');
    return owner.ownerModule === SOAK_OWNER_MODULE;
  }

  getState(): Phase1StabilitySoakState {
    return {
      ...this.state,
      warnings: [...this.state.warnings],
      errors: [...this.state.errors],
      cycles: this.state.cycles.map((c) => ({ ...c, warnings: [...c.warnings], errors: [...c.errors] })),
    };
  }

  /**
   * Run repeated Phase 1 validation cycles. Does NOT wait 30 days or fake elapsed time.
   */
  async runSoak(cycleCount: number = DEFAULT_SOAK_CYCLE_COUNT): Promise<Phase1StabilitySoakState> {
    this.state.status = 'RUNNING';
    this.state.startedAt = Date.now();
    this.state.warnings = [];
    this.state.errors = [];
    this.state.cycles = [];
    this.state.passCount = 0;
    this.state.warnCount = 0;
    this.state.failCount = 0;
    this.state.runCount = 0;
    this.state.elapsedDaysClaimed = 0;

    this.state.realBrowserRunnerAttached =
      getDevPulseV2BrowserVerificationHarness().isRealBrowserRunnerAttached();

    this.state.warnings.push(
      `This soak run executes ${cycleCount} immediate cycle(s) — not ${PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED} calendar days.`,
    );

    if (!this.state.realBrowserRunnerAttached) {
      this.state.warnings.push(
        'Real browser runner not yet attached — simulated browser verification only.',
      );
    }

    for (let i = 1; i <= cycleCount; i += 1) {
      const cycle = await runPhase1SoakCycle(i);
      this.state.cycles.push(cycle);
      this.state.runCount += 1;

      if (cycle.outcome === 'PASS') this.state.passCount += 1;
      else if (cycle.outcome === 'WARN') this.state.warnCount += 1;
      else this.state.failCount += 1;

      for (const w of cycle.warnings) {
        if (!this.state.warnings.includes(w)) this.state.warnings.push(w);
      }
      this.state.errors.push(...cycle.errors);
    }

    this.state.completedAt = Date.now();
    this.state.status = deriveSoakStatus(
      this.state.passCount,
      this.state.warnCount,
      this.state.failCount,
    );

    this.state.realBrowserRunnerAttached =
      getDevPulseV2BrowserVerificationHarness().isRealBrowserRunnerAttached();
    this.state.phase2Readiness = derivePhase2Readiness(this.state);

    return this.getState();
  }

  formatReport(): string {
    return formatPhase1StabilitySoakReport(this.getState());
  }
}

export function createDevPulseV2Phase1StabilitySoakAuthority(): DevPulseV2Phase1StabilitySoakAuthority {
  singleton = new DevPulseV2Phase1StabilitySoakAuthority();
  return singleton;
}

export function getDevPulseV2Phase1StabilitySoakAuthority(): DevPulseV2Phase1StabilitySoakAuthority {
  if (!singleton) {
    singleton = new DevPulseV2Phase1StabilitySoakAuthority();
  }
  return singleton;
}

export function resetDevPulseV2Phase1StabilitySoakAuthorityForTests(): DevPulseV2Phase1StabilitySoakAuthority {
  singleton = new DevPulseV2Phase1StabilitySoakAuthority();
  return singleton;
}
