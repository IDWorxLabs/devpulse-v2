/**
 * Runtime Banner Truth Reconciliation V1 — pure reconciliation engine.
 * Banner visibility follows CURRENT runtime truth + health only.
 */

import { isLocalRuntimeHealthPayloadOk } from '../command-center-restart-resilience/restart-resilience-engine.js';
import type {
  RuntimeBannerReconciliationInput,
  RuntimeBannerReconciliationResult,
  RuntimeTruthClientResult,
} from './runtime-banner-truth-reconciliation-types.js';

export function isRuntimeTruthFresh(truth: RuntimeTruthClientResult | null | undefined): boolean {
  if (!truth || truth.ok !== true) return false;
  return truth.freshnessStatus === 'FRESH' && truth.classifyRouteAvailable === true;
}

export function isRuntimeHealthReady(
  healthPayload: RuntimeBannerReconciliationInput['healthPayload'],
): boolean {
  return isLocalRuntimeHealthPayloadOk(healthPayload);
}

export function collectStaleReasons(input: RuntimeBannerReconciliationInput): string[] {
  const reasons: string[] = [];
  if (input.truth) {
    if (input.truth.freshnessStatus === 'STALE') {
      reasons.push(...input.truth.staleReasons);
    }
    if (!input.truth.classifyRouteAvailable) {
      reasons.push('build intent classification route unavailable');
    }
    if (input.truth.message) {
      reasons.push(input.truth.message);
    }
  }
  if (input.healthPayload && !isRuntimeHealthReady(input.healthPayload)) {
    if (input.healthPayload.runtimeReady !== true) {
      reasons.push('brain health runtimeReady=false');
    }
    if (input.healthPayload.registryLoaded !== true) {
      reasons.push('brain health registryLoaded=false');
    }
    if (input.healthPayload.buildIntentRouting !== true) {
      reasons.push('brain health buildIntentRouting=false');
    }
  }
  return [...new Set(reasons.filter(Boolean))];
}

export function isRuntimeAuthorityReady(
  authority: RuntimeBannerReconciliationInput['runtimeAuthority'],
): boolean {
  if (!authority) return false;
  if (authority.bypassed) return authority.ok === true;
  return authority.ready === true || (authority.ok === true && authority.phase === 'READY');
}

export function isRuntimeAuthorityVerifying(
  authority: RuntimeBannerReconciliationInput['runtimeAuthority'],
): boolean {
  if (!authority || isRuntimeAuthorityReady(authority)) return false;
  const phase = authority.phase ?? '';
  return phase === 'VERIFYING' || phase === 'DISCOVERING' || phase === 'STARTING';
}

export function reconcileRuntimeBannerState(
  input: RuntimeBannerReconciliationInput,
): RuntimeBannerReconciliationResult {
  const authority = input.runtimeAuthority ?? null;
  const authorityReady = isRuntimeAuthorityReady(authority);
  const authorityVerifying = isRuntimeAuthorityVerifying(authority);
  const truthFresh = isRuntimeTruthFresh(input.truth);
  const healthReady = isRuntimeHealthReady(input.healthPayload);
  const runtimeConnected = authorityReady || truthFresh || healthReady;
  const staleReasons = collectStaleReasons(input);

  let lifecycle: RuntimeBannerReconciliationResult['lifecycle'] = 'UNAVAILABLE';
  let bannerSource = 'none';
  let bannerMessage: string | null = null;
  let bannerTone: RuntimeBannerReconciliationResult['bannerTone'] = 'none';

  if (authorityReady) {
    lifecycle = 'READY';
    bannerSource = 'runtime-authority-ready';
  } else if (authorityVerifying) {
    lifecycle = 'CHECKING_HEALTH';
    bannerSource = 'runtime-authority-verifying';
  } else if (runtimeConnected) {
    lifecycle = 'READY';
    bannerSource = truthFresh && healthReady
      ? 'truth-fresh-and-health-ready'
      : truthFresh
        ? 'truth-fresh'
        : 'health-ready';
  } else if (input.healthPayload && input.healthPayload.registryLoaded === true) {
    lifecycle = 'DEGRADED';
    bannerSource = 'health-degraded';
  } else if (input.previousLifecycle === 'STARTING' || input.previousLifecycle === 'CHECKING_HEALTH') {
    lifecycle = 'CHECKING_HEALTH';
    bannerSource = 'health-check-in-progress';
  } else {
    lifecycle = 'UNAVAILABLE';
    bannerSource = input.bannerSourceHint || input.truth?.message || 'runtime-unavailable';
  }

  if (authorityVerifying) {
    bannerTone = 'neutral';
    bannerMessage = null;
  } else if (!runtimeConnected && lifecycle === 'UNAVAILABLE') {
    bannerTone = 'error';
    bannerMessage =
      'AiDevEngine runtime unavailable. Check Runtime Authority status and restart with npm run dev if needed.';
  }

  return {
    readOnly: true,
    shouldShowBanner: bannerTone === 'error',
    bannerMessage,
    bannerTone,
    localRuntimeHealthy: runtimeConnected,
    runtimeTruthReady: truthFresh,
    runtimeTruthClassifyAllowed: Boolean(input.truth?.classifyRouteAvailable) && truthFresh,
    lifecycle,
    footerStatus: authorityReady
      ? 'Runtime Authority READY'
      : authorityVerifying
        ? 'Runtime Authority verifying…'
        : runtimeConnected
          ? 'AiDevEngine local runtime connected'
          : lifecycle === 'CHECKING_HEALTH'
            ? 'Runtime Authority verifying…'
            : lifecycle === 'DEGRADED'
              ? 'AiDevEngine runtime degraded — retrying health'
              : 'AiDevEngine runtime unavailable',
    bannerSource,
    staleReasons,
    runtimeId: input.truth?.runtimeId ?? null,
    truthFresh,
    healthReady,
    clearedPersistedStaleState: false,
  };
}

export function normalizeRuntimeTruthClientResult(
  result: Partial<RuntimeTruthClientResult> & { payload?: { freshness?: { status?: string; reasons?: string[] } } },
): RuntimeTruthClientResult {
  const freshnessStatus =
    result.freshnessStatus ??
    (result.payload?.freshness?.status as RuntimeTruthClientResult['freshnessStatus']) ??
    (result.stale ? 'STALE' : result.ok ? 'FRESH' : 'UNKNOWN');
  return {
    ok: result.ok === true,
    stale: result.stale === true || freshnessStatus === 'STALE',
    freshnessStatus,
    classifyRouteAvailable: result.classifyRouteAvailable === true,
    runtimeId: result.runtimeId ?? null,
    runtimeIdChanged: result.runtimeIdChanged === true,
    staleReasons: result.staleReasons ?? result.payload?.freshness?.reasons ?? [],
    message: result.message ?? null,
  };
}

export function buildRuntimeBannerDiagnostic(
  reconciliation: RuntimeBannerReconciliationResult,
): Record<string, unknown> {
  return {
    trace: 'RUNTIME_BANNER_TRUTH_DIAGNOSTIC',
    truthFresh: reconciliation.truthFresh,
    healthReady: reconciliation.healthReady,
    runtimeId: reconciliation.runtimeId,
    staleReasons: reconciliation.staleReasons,
    bannerSource: reconciliation.bannerSource,
    shouldShowBanner: reconciliation.shouldShowBanner,
    lifecycle: reconciliation.lifecycle,
    localRuntimeHealthy: reconciliation.localRuntimeHealthy,
  };
}
