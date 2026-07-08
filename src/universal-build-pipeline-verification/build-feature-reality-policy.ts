/**
 * Universal Build Pipeline Verification V1 — feature reality policy.
 * DEGRADED_WITH_WORKSPACE_EVIDENCE is a warning, not a hard blocker.
 */

import type { WorkspaceFeatureRealityFallbackResult } from '../feature-contract-reality/feature-reality-workspace-fallback-collector.js';

export interface FeatureRealityPolicyResult {
  readOnly: true;
  status: string;
  isHardBlocker: boolean;
  isWarning: boolean;
  passed: boolean;
  detail: string;
}

export function evaluateFeatureRealityPolicy(
  fallback: WorkspaceFeatureRealityFallbackResult | null,
): FeatureRealityPolicyResult {
  if (!fallback) {
    return {
      readOnly: true,
      status: 'UNAVAILABLE',
      isHardBlocker: false,
      isWarning: true,
      passed: false,
      detail: 'No feature reality evidence — deferred until workspace materialization.',
    };
  }

  const degraded = fallback.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE';
  const passed = fallback.status === 'PASS' || degraded;
  const isHardBlocker = fallback.status === 'FAIL' && !degraded;
  const isWarning = degraded || fallback.status === 'UNAVAILABLE';

  return {
    readOnly: true,
    status: fallback.status,
    isHardBlocker,
    isWarning,
    passed,
    detail: degraded
      ? 'DEGRADED_WITH_WORKSPACE_EVIDENCE — workspace proves modules, registry, routes, App rendering; runtime/playwright evidence unavailable.'
      : fallback.status === 'PASS'
        ? 'Feature reality passed with full evidence.'
        : isHardBlocker
          ? `Feature reality FAIL: ${fallback.blockers.join('; ') || 'missing modules'}`
          : 'Feature reality evidence unavailable — warning only when workspace evidence pending.',
  };
}

export function featureRealityBlocksBuild(fallback: WorkspaceFeatureRealityFallbackResult | null): boolean {
  return evaluateFeatureRealityPolicy(fallback).isHardBlocker;
}
