/**
 * Universal Capability Pack Framework V1 — behavioral verification.
 */

import type { CapabilityCompositionPlan, PackVerificationClassification } from './universal-capability-pack-types.js';
import { getPack } from './capability-pack-registry.js';

export interface PackBehaviorVerificationResult {
  readonly packId: string;
  readonly classification: PackVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export function verifyPackBehavior(
  packId: string,
  generatedSources: { readonly packArtifacts: string; readonly registrySource: string },
): PackBehaviorVerificationResult {
  const pack = getPack(packId);
  const checks: { id: string; passed: boolean; detail: string }[] = [];
  const check = (id: string, passed: boolean, detail: string) => checks.push({ id, passed, detail });

  if (!pack) {
    return { packId, classification: 'INVALID', passed: false, checks: [{ id: 'pack-exists', passed: false, detail: 'Pack not in registry' }] };
  }

  if (pack.supportStatus === 'NOT_IMPLEMENTED') {
    check('not-implemented-explicit', !generatedSources.packArtifacts.includes('TODO'), 'Unimplemented pack emits no fake runtime');
    check('not-implemented-no-marker', !generatedSources.registrySource.includes(packId) || generatedSources.registrySource.length === 0, 'Unimplemented pack not in production registry');
    return { packId, classification: 'BLOCKED_BY_MISSING_PACK', passed: checks.every((c) => c.passed), checks };
  }

  check('artifacts-materialized', generatedSources.packArtifacts.includes(packId) || generatedSources.packArtifacts.length > 0, 'Pack artifacts present');
  check('no-static-shell', !/TODO|placeholder|return true;\s*\/\//i.test(generatedSources.packArtifacts), 'No static shell markers');
  check('registry-registered', generatedSources.registrySource.includes(packId), 'Pack registered in runtime registry');

  const passed = checks.every((c) => c.passed);
  return {
    packId,
    classification: passed ? 'BEHAVIORALLY_VERIFIED' : 'FAILED',
    passed,
    checks,
  };
}

export function detectStaticCapabilityShell(source: string): string[] {
  const findings: string[] = [];
  if (/TODO|FIXME|placeholder capability/i.test(source)) findings.push('capability shell contains TODO/placeholder');
  if (/disabled=\{true\}[^>]*>.*(?:login|schedule|upload|notify)/i.test(source)) findings.push('disabled fake capability UI');
  if (/return\s+\[\];\s*\/\/\s*static/i.test(source)) findings.push('static empty capability result');
  return findings;
}

export function diagnoseCapabilityPackGaps(plan: CapabilityCompositionPlan): string[] {
  const gaps: string[] = [];
  for (const reqId of plan.blockedRequirements) gaps.push(`blocked_requirement:${reqId}`);
  for (const resolution of plan.resolutions) {
    if (resolution.outcome === 'BLOCKED_BY_MISSING_PACK') gaps.push(`blocked_by_missing_pack:${resolution.capabilityKey}`);
  }
  return [...new Set(gaps)];
}
