/**
 * Runtime Banner Truth Reconciliation V1 — validation harness simulating browser persistence.
 */

import {
  COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
  STALE_RUNTIME_SESSION_STORAGE_KEYS,
  type PersistedStaleRuntimeState,
  type RuntimeBannerReconciliationResult,
  type RuntimeTruthClientResult,
} from './runtime-banner-truth-reconciliation-types.js';
import {
  buildRuntimeBannerDiagnostic,
  isRuntimeHealthReady,
  isRuntimeTruthFresh,
  reconcileRuntimeBannerState,
} from './runtime-banner-truth-reconciliation-engine.js';
import { isLocalRuntimeHealthPayloadOk } from '../command-center-restart-resilience/restart-resilience-engine.js';
import { STALE_RUNTIME_ERROR_SESSION_KEY } from '../command-center-restart-resilience/restart-resilience-types.js';

const STALE_BANNER_TEXT =
  'AiDevEngine runtime unavailable. Check Runtime Authority status and restart with npm run dev if needed.';

export class RuntimeBannerTruthReconciliationHarness {
  localRuntimeHealthy = false;

  runtimeReadinessLifecycle: 'STARTING' | 'CHECKING_HEALTH' | 'READY' | 'DEGRADED' | 'UNAVAILABLE' =
    'UNAVAILABLE';

  bannerVisible = true;

  bodyBlocked = true;

  sendDisabled = true;

  footerText = 'AiDevEngine runtime unavailable — restart using Start-AiDevEngine';

  bannerSource = 'persisted-stale';

  sessionStorage: Record<string, string> = {
    [STALE_RUNTIME_ERROR_SESSION_KEY]: STALE_BANNER_TEXT,
  };

  localStorage: Record<string, string> = {
    'aidevengine.runtimeTruth.runtimeId': 'old-runtime-id-before-restart',
  };

  consoleTraces: string[] = [];

  lastDiagnostic: Record<string, unknown> | null = null;

  applyPersistedStaleState(): void {
    this.localRuntimeHealthy = false;
    this.runtimeReadinessLifecycle = 'UNAVAILABLE';
    this.bannerVisible = true;
    this.bodyBlocked = true;
    this.sendDisabled = true;
    this.footerText = 'AiDevEngine runtime unavailable';
    this.bannerSource = 'persisted-stale-localStorage/sessionStorage';
    this.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY] = STALE_BANNER_TEXT;
    this.localStorage['aidevengine.runtimeTruth.runtimeId'] = 'old-runtime-id-before-restart';
  }

  clearPersistedStaleRuntimeState(): void {
    for (const key of STALE_RUNTIME_SESSION_STORAGE_KEYS) {
      delete this.sessionStorage[key];
    }
  }

  applyReconciliation(input: {
    truth: RuntimeTruthClientResult;
    healthPayload: Parameters<typeof reconcileRuntimeBannerState>[0]['healthPayload'];
    runtimeAuthority?: Parameters<typeof reconcileRuntimeBannerState>[0]['runtimeAuthority'];
    runtimeIdChanged?: boolean;
  }): RuntimeBannerReconciliationResult {
    if (input.runtimeIdChanged) {
      this.clearPersistedStaleRuntimeState();
    }
    if (isRuntimeTruthFresh(input.truth)) {
      this.clearPersistedStaleRuntimeState();
      this.consoleTraces.push(COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE);
    }
    const reconciliation = reconcileRuntimeBannerState({
      truth: input.truth,
      healthPayload: input.healthPayload,
      runtimeAuthority: input.runtimeAuthority ?? null,
      previousLifecycle: this.runtimeReadinessLifecycle,
      bannerSourceHint: this.bannerSource,
    });
    reconciliation.clearedPersistedStaleState =
      !this.sessionStorage[STALE_RUNTIME_ERROR_SESSION_KEY];
    this.localRuntimeHealthy = reconciliation.localRuntimeHealthy;
    this.runtimeReadinessLifecycle = reconciliation.lifecycle;
    this.bannerVisible = reconciliation.shouldShowBanner;
    this.bodyBlocked = reconciliation.shouldShowBanner;
    this.sendDisabled = !reconciliation.localRuntimeHealthy;
    this.footerText = reconciliation.footerStatus;
    this.bannerSource = reconciliation.bannerSource;
    this.lastDiagnostic = buildRuntimeBannerDiagnostic(reconciliation);
    this.consoleTraces.push('RUNTIME_BANNER_TRUTH_DIAGNOSTIC');
    if (input.truth.runtimeId) {
      this.localStorage['aidevengine.runtimeTruth.runtimeId'] = input.truth.runtimeId;
    }
    return reconciliation;
  }

  simulateReloadWithFreshRuntime(): void {
    this.applyPersistedStaleState();
    this.applyReconciliation({
      truth: {
        ok: true,
        stale: false,
        freshnessStatus: 'FRESH',
        classifyRouteAvailable: true,
        runtimeId: 'new-runtime-id-after-restart',
        runtimeIdChanged: true,
        staleReasons: [],
        message: null,
      },
      healthPayload: {
        postAllowed: true,
        serverCapability: 'command-center-brain-v11.1a',
        buildIntentRouting: true,
        registryLoaded: true,
        runtimeReady: true,
      },
      runtimeIdChanged: true,
    });
  }

  snapshotPersistedState(): PersistedStaleRuntimeState {
    return {
      sessionStorage: { ...this.sessionStorage },
      localStorage: { ...this.localStorage },
      bodyBlocked: this.bodyBlocked,
    };
  }
}

export { isLocalRuntimeHealthPayloadOk, isRuntimeHealthReady, isRuntimeTruthFresh, STALE_BANNER_TEXT };
