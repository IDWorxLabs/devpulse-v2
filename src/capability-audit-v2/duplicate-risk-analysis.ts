/**
 * AiDevEngine Capability Audit V2 — duplicate risk analysis.
 */

import { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/index.js';
import type { DuplicateRiskAnalysis, DuplicateRiskEntry } from './capability-audit-types.js';
import { CAPABILITY_INVENTORY_V2 } from './capability-inventory.js';

const AUTHORITY_OWNERSHIP_CHECKS = [
  {
    domain: 'Requirement discovery',
    expectedOwner: 'Clarifying Question Intelligence',
    match: (name: string) =>
      name.includes('Clarifying Question') ||
      name.includes('Requirement Completeness') ||
      name.includes('Requirement Extractor'),
  },
  {
    domain: 'Verification',
    expectedOwner: 'Unified Verification Lab (UVL)',
    match: (name: string) =>
      name.includes('Verification') ||
      name.includes('UVL') ||
      name === 'Feature Reality Validation' ||
      name === 'Engineering Reality Authority',
  },
  {
    domain: 'Launch decisions',
    expectedOwner: 'Autonomous Founder Launch Authority',
    match: (name: string) =>
      name.includes('Launch') ||
      name.includes('AFLA') ||
      name.includes('Founder Launch Decision'),
  },
  {
    domain: 'Product completeness',
    expectedOwner: 'Product Architect Intelligence V1',
    match: (name: string) =>
      name.includes('Product Architect') ||
      name === 'Workflow Review' ||
      name === 'Product Experience Verification Engine',
  },
  {
    domain: 'Isolated execution',
    expectedOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    match: (name: string) => name.startsWith('World2'),
  },
] as const;

export const NEW_OVERLAPS_SINCE_V1: readonly string[] = [
  'Product Architect Intelligence V1 ↔ Product Architect ↔ Workflow Review (~40% overlap)',
  'UVL Verification Hub V1 ↔ Unified Verification Lab ↔ Verification Orchestrator (~35% overlap)',
  'AFLA Trust Calibration V1 ↔ Autonomous Founder Launch Authority (~25% overlap)',
  'Founder Review Operator Dashboard V1 ↔ Command Center Brain ↔ Inline Operator Feed (~30% overlap)',
  'Large-Scale Multi-App Validation V1 ↔ Feature/Engineering Reality (~20% overlap, complementary)',
  'Founder Reality Surface ↔ multiple operator panels (~45% UI host overlap, acceptable)',
];

function buildDuplicateRiskEntries(): DuplicateRiskEntry[] {
  const remediationByName = new Map(
    HIGH_DUPLICATE_RISK_REMEDIATIONS.map((r) => [r.capabilityName, r]),
  );

  return CAPABILITY_INVENTORY_V2.filter(
    (entry) => entry.duplicateRisk !== 'LOW' || (entry.overlapWith?.length ?? 0) > 0,
  ).map((entry) => {
    const remediation = remediationByName.get(entry.name);
    return {
      capabilityName: entry.name,
      duplicateRisk: entry.duplicateRisk,
      recommendation: entry.recommendation,
      overlapWith: entry.overlapWith ?? [],
      canonicalOwner: entry.canonicalOwner,
      remediationDecision: remediation?.decision,
      remediationTarget: remediation?.target,
    };
  });
}

function validateAuthorityOwnership(): DuplicateRiskAnalysis['authorityOwnershipChecks'] {
  return AUTHORITY_OWNERSHIP_CHECKS.map((check) => {
    const domainEntries = CAPABILITY_INVENTORY_V2.filter((entry) => check.match(entry.name));
    const canonicalOwners = new Set(
      domainEntries
        .map((entry) => entry.canonicalOwner ?? entry.name)
        .filter((owner) => owner !== '—'),
    );
    const hasExpected =
      domainEntries.some(
        (entry) =>
          entry.name === check.expectedOwner ||
          entry.canonicalOwner === check.expectedOwner ||
          entry.name.includes(check.expectedOwner.split(' ')[0] ?? ''),
      ) || canonicalOwners.has(check.expectedOwner);

    return {
      domain: check.domain,
      expectedOwner: check.expectedOwner,
      valid: hasExpected,
      detail: hasExpected
        ? `${domainEntries.length} capabilities; canonical owner resolved`
        : `Expected ${check.expectedOwner}; found ${[...canonicalOwners].join(', ') || 'none'}`,
    };
  });
}

export function buildDuplicateRiskAnalysis(): DuplicateRiskAnalysis {
  const entries = buildDuplicateRiskEntries();
  const highDuplicateRiskCount = CAPABILITY_INVENTORY_V2.filter(
    (e) => e.duplicateRisk === 'HIGH',
  ).length;
  const mediumDuplicateRiskCount = CAPABILITY_INVENTORY_V2.filter(
    (e) => e.duplicateRisk === 'MEDIUM',
  ).length;
  const lowDuplicateRiskCount = CAPABILITY_INVENTORY_V2.filter(
    (e) => e.duplicateRisk === 'LOW',
  ).length;
  const authorityOwnershipChecks = validateAuthorityOwnership();

  return {
    duplicateRiskCount: highDuplicateRiskCount + mediumDuplicateRiskCount,
    highDuplicateRiskCount,
    mediumDuplicateRiskCount,
    lowDuplicateRiskCount,
    oneCapabilityOneOwnerValid: authorityOwnershipChecks.every((c) => c.valid),
    authorityOwnershipChecks,
    entries,
    newOverlapsSinceV1: NEW_OVERLAPS_SINCE_V1,
  };
}
