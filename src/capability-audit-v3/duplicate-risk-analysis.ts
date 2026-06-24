/**
 * AiDevEngine Capability Audit V3 — duplicate risk analysis.
 */

import { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/index.js';
import { buildDuplicateRiskResolutions } from '../canonical-ownership-v2/index.js';
import type { DuplicateRiskAnalysis, DuplicateRiskEntry } from './capability-audit-types.js';
import { CAPABILITY_INVENTORY_V3 } from './capability-inventory.js';

const AUTHORITY_OWNERSHIP_CHECKS = [
  {
    domain: 'Requirements (CQI)',
    expectedOwner: 'Clarifying Question Intelligence',
    match: (name: string) =>
      name.includes('Clarifying Question') ||
      name.includes('CQI Maturity') ||
      name.includes('Requirement Completeness') ||
      name.includes('Requirement Extractor'),
  },
  {
    domain: 'Verification (UVL)',
    expectedOwner: 'Unified Verification Lab (UVL)',
    match: (name: string) =>
      name.includes('Verification') ||
      name.includes('UVL') ||
      name === 'Feature Reality Validation' ||
      name === 'Engineering Reality Authority',
  },
  {
    domain: 'Launch decisions (AFLA)',
    expectedOwner: 'Autonomous Founder Launch Authority',
    match: (name: string) =>
      name.includes('Launch') ||
      name.includes('AFLA') ||
      name.includes('Founder Launch Decision'),
  },
  {
    domain: 'Product completeness (PAI)',
    expectedOwner: 'Product Architect Intelligence V1',
    match: (name: string) =>
      name.includes('Product Architect') ||
      name === 'Workflow Review' ||
      name === 'Product Experience Verification Engine',
  },
  {
    domain: 'Isolated execution (World2)',
    expectedOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    match: (name: string) => name.startsWith('World2'),
  },
] as const;

export const NEW_OVERLAPS_SINCE_V2: readonly string[] = [
  'Real Build Execution Pipeline V1/V1.1 ↔ Connected Build Execution ↔ Execution Reality Validation (~30% overlap, complementary proof layers)',
  'Real Build Execution Pipeline V1.1 ↔ UVL Verification Execution V1 — build/preview proof vs verification proof; ownership boundary clear, evidence split by layer',
  'CQI Maturity V1 ↔ Clarifying Question Intelligence ↔ Requirement Completeness Intelligence (~25% overlap, CQI is canonical)',
  'Production Readiness Gate ↔ Launch Readiness Authority ↔ AFLA (~40% overlap, launch vs production boundary)',
  'Capability Audit V2 ↔ Capability Audit V3 — meta audit lineage; V3 supersedes V2 roadmap',
];

function buildDuplicateRiskEntries(): DuplicateRiskEntry[] {
  const remediationByName = new Map(
    HIGH_DUPLICATE_RISK_REMEDIATIONS.map((r) => [r.capabilityName, r]),
  );

  return CAPABILITY_INVENTORY_V3.filter(
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
    const domainEntries = CAPABILITY_INVENTORY_V3.filter((entry) => check.match(entry.name));
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
  const highDuplicateRiskCount = CAPABILITY_INVENTORY_V3.filter(
    (e) => e.duplicateRisk === 'HIGH',
  ).length;
  const mediumDuplicateRiskCount = CAPABILITY_INVENTORY_V3.filter(
    (e) => e.duplicateRisk === 'MEDIUM',
  ).length;
  const lowDuplicateRiskCount = CAPABILITY_INVENTORY_V3.filter(
    (e) => e.duplicateRisk === 'LOW',
  ).length;
  const authorityOwnershipChecks = validateAuthorityOwnership();
  const v2Resolutions = buildDuplicateRiskResolutions();
  const resolvedOverlapNotes = v2Resolutions
    .filter((r) => r.resolved)
    .map((r) => `${r.pair} — ${r.resolution}`);

  return {
    duplicateRiskCount: highDuplicateRiskCount + mediumDuplicateRiskCount,
    highDuplicateRiskCount,
    mediumDuplicateRiskCount,
    lowDuplicateRiskCount,
    oneCapabilityOneOwnerValid: authorityOwnershipChecks.every((c) => c.valid),
    authorityOwnershipChecks,
    entries,
    newOverlapsSinceV2: [...NEW_OVERLAPS_SINCE_V2, ...resolvedOverlapNotes],
  };
}
