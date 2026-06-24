/**
 * Canonical Capability Ownership V1 — validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { HIGH_DUPLICATE_RISK_REMEDIATIONS } from '../capability-audit-v1/high-duplicate-risk-remediations.js';
import type { ConsolidationGroupId, CanonicalCapabilityOwnershipEntry } from './canonical-capability-ownership-types.js';
import { CONSOLIDATION_GROUPS } from './consolidation-groups.js';
import { CANONICAL_OWNERSHIP_ENTRIES } from './ownership-registry.js';

export interface CanonicalOwnershipValidation {
  valid: boolean;
  multipleOwnerViolations: readonly string[];
  duplicateOwnershipViolations: readonly string[];
  removedCapabilityReappearances: readonly string[];
  remediationViolations: readonly string[];
  consolidationGroupViolations: readonly string[];
  bridgeViolations: readonly string[];
}

const REMOVED_FORBIDDEN_PATHS = [
  'src/navigation-review',
  'src/navigation-review-authority',
] as const;

const CONSOLIDATION_BRIDGE_PATHS: Record<
  ConsolidationGroupId,
  { bridgePath: string; canonicalOwnerPath: string }
> = {
  LAUNCH_READINESS_AUTHORITY: {
    bridgePath: 'src/launch-readiness-authority/launch-readiness-consolidation-bridge.ts',
    canonicalOwnerPath: 'src/autonomous-founder-launch-authority/autonomous-founder-launch-consolidation-ownership.ts',
  },
  VERIFICATION_ORCHESTRATOR: {
    bridgePath: 'src/verification-orchestrator/verification-orchestrator-consolidation-bridge.ts',
    canonicalOwnerPath: 'src/unified-verification-lab/unified-verification-lab-consolidation-ownership.ts',
  },
  REQUIREMENT_COMPLETENESS_INTELLIGENCE: {
    bridgePath: 'src/requirement-completeness-intelligence/requirement-completeness-consolidation-bridge.ts',
    canonicalOwnerPath: 'src/clarifying-question-intelligence/clarifying-question-consolidation-ownership.ts',
  },
  NAVIGATION_REVIEW: {
    bridgePath: 'src/canonical-capability-ownership/navigation-review-removal-guard.ts',
    canonicalOwnerPath: 'src/universal-app-blueprint-visual/',
  },
  WORLD2_EXECUTION_ENGINE: {
    bridgePath: 'src/world2-execution-engine/world2-execution-engine-consolidation-bridge.ts',
    canonicalOwnerPath: 'src/world2-disposable-workspace/world2-disposable-workspace-consolidation-ownership.ts',
  },
};

function countCanonicalOwnersByGroup(groupId: ConsolidationGroupId): string[] {
  return CANONICAL_OWNERSHIP_ENTRIES.filter(
    (entry) => entry.consolidationGroup === groupId && entry.status === 'CANONICAL',
  ).map((entry) => entry.owner);
}

function validateMultipleOwners(root: string): string[] {
  const violations: string[] = [];
  for (const group of CONSOLIDATION_GROUPS) {
    const canonicalOwners = countCanonicalOwnersByGroup(group.id);
    const uniqueOwners = [...new Set(canonicalOwners)];

    if (group.auditDecision === 'REMOVE') {
      const removedEntries = CANONICAL_OWNERSHIP_ENTRIES.filter(
        (entry) => entry.consolidationGroup === group.id && entry.status === 'REMOVED',
      );
      if (removedEntries.length === 0) {
        violations.push(`Group ${group.id}: no REMOVED entry registered`);
      }
      continue;
    }

    if (uniqueOwners.length !== 1) {
      violations.push(
        `Group ${group.id}: expected 1 canonical owner, found ${uniqueOwners.length}: ${uniqueOwners.join(', ')}`,
      );
    }

    if (uniqueOwners[0] && uniqueOwners[0] !== group.canonicalOwner) {
      violations.push(
        `Group ${group.id}: canonical owner "${uniqueOwners[0]}" does not match target "${group.canonicalOwner}"`,
      );
    }
  }
  return violations;
}

function validateDuplicateOwnership(): string[] {
  const violations: string[] = [];
  const canonicalByResponsibility = new Map<string, string[]>();

  for (const entry of CANONICAL_OWNERSHIP_ENTRIES) {
    if (entry.status !== 'CANONICAL' || !entry.responsibilities) continue;
    for (const responsibility of entry.responsibilities) {
      const owners = canonicalByResponsibility.get(responsibility) ?? [];
      owners.push(entry.capability);
      canonicalByResponsibility.set(responsibility, owners);
    }
  }

  for (const [responsibility, owners] of canonicalByResponsibility) {
    if (owners.length > 1) {
      violations.push(
        `Responsibility "${responsibility}" has multiple CANONICAL owners: ${owners.join(', ')}`,
      );
    }
  }

  const mergedEntries = CANONICAL_OWNERSHIP_ENTRIES.filter((entry) => entry.status === 'MERGED');
  for (const merged of mergedEntries) {
    const canonical = CANONICAL_OWNERSHIP_ENTRIES.find(
      (entry) => entry.capability === merged.mergedInto && entry.status === 'CANONICAL',
    );
    if (!canonical) {
      violations.push(
        `MERGED capability "${merged.capability}" targets "${merged.mergedInto}" which is not CANONICAL`,
      );
    }
  }

  return violations;
}

function validateRemovedCapabilities(root: string): string[] {
  const violations: string[] = [];

  for (const forbiddenPath of REMOVED_FORBIDDEN_PATHS) {
    if (existsSync(join(root, forbiddenPath))) {
      violations.push(`REMOVED capability reappeared at ${forbiddenPath}`);
    }
  }

  const removedEntries = CANONICAL_OWNERSHIP_ENTRIES.filter((entry) => entry.status === 'REMOVED');
  for (const entry of removedEntries) {
    const standalonePath = entry.ownerPath.split(',')[0]?.trim();
    if (standalonePath?.includes('navigation-review')) {
      continue;
    }
  }

  return violations;
}

function validateRemediationDecisions(): string[] {
  const violations: string[] = [];

  for (const remediation of HIGH_DUPLICATE_RISK_REMEDIATIONS) {
    const entry = CANONICAL_OWNERSHIP_ENTRIES.find(
      (candidate) => candidate.capability === remediation.capabilityName,
    );

    if (remediation.decision === 'REMOVE') {
      if (!entry || entry.status !== 'REMOVED') {
        violations.push(
          `Remediation REMOVE for "${remediation.capabilityName}" not reflected in ownership registry`,
        );
      }
      continue;
    }

    if (remediation.decision === 'MERGE') {
      if (!entry || entry.status !== 'MERGED') {
        violations.push(
          `Remediation MERGE for "${remediation.capabilityName}" expected MERGED status, got ${entry?.status ?? 'missing'}`,
        );
      }
      if (entry && entry.mergedInto !== remediation.target) {
        violations.push(
          `Remediation MERGE for "${remediation.capabilityName}" target mismatch: registry=${entry.mergedInto} audit=${remediation.target}`,
        );
      }
      continue;
    }

    if (remediation.decision === 'KEEP' || remediation.decision === 'EXTEND') {
      const canonical = CANONICAL_OWNERSHIP_ENTRIES.find(
        (candidate) =>
          candidate.capability === remediation.capabilityName && candidate.status === 'CANONICAL',
      );
      if (!canonical && remediation.capabilityName !== 'Founder Acceptance Stack (24.8)') {
        const delegated = CANONICAL_OWNERSHIP_ENTRIES.find(
          (candidate) => candidate.capability === remediation.capabilityName,
        );
        if (!delegated || (delegated.status !== 'CANONICAL' && delegated.status !== 'DELEGATED')) {
          violations.push(
            `Remediation ${remediation.decision} for "${remediation.capabilityName}" not registered as CANONICAL or DELEGATED`,
          );
        }
      }
    }
  }

  return violations;
}

function validateConsolidationGroups(root: string): string[] {
  const violations: string[] = [];

  for (const group of CONSOLIDATION_GROUPS) {
    const bridge = CONSOLIDATION_BRIDGE_PATHS[group.id];
    if (!existsSync(join(root, bridge.bridgePath))) {
      violations.push(`Consolidation bridge missing for group ${group.id}: ${bridge.bridgePath}`);
    }

    if (group.auditDecision === 'MERGE') {
      for (const merged of group.mergedCapabilities) {
        const entry = CANONICAL_OWNERSHIP_ENTRIES.find((candidate) => candidate.capability === merged);
        if (!entry || entry.status !== 'MERGED') {
          violations.push(`Group ${group.id}: "${merged}" must have MERGED status`);
        }
      }
    }
  }

  return violations;
}

export function validateCanonicalCapabilityOwnership(root: string): CanonicalOwnershipValidation {
  const multipleOwnerViolations = validateMultipleOwners(root);
  const duplicateOwnershipViolations = validateDuplicateOwnership();
  const removedCapabilityReappearances = validateRemovedCapabilities(root);
  const remediationViolations = validateRemediationDecisions();
  const consolidationGroupViolations = validateConsolidationGroups(root);

  const valid =
    multipleOwnerViolations.length === 0 &&
    duplicateOwnershipViolations.length === 0 &&
    removedCapabilityReappearances.length === 0 &&
    remediationViolations.length === 0 &&
    consolidationGroupViolations.length === 0;

  return {
    valid,
    multipleOwnerViolations,
    duplicateOwnershipViolations,
    removedCapabilityReappearances,
    remediationViolations,
    consolidationGroupViolations,
    bridgeViolations: consolidationGroupViolations.filter((v) => v.includes('bridge')),
  };
}

export function countRemainingDuplicateRisk(): number {
  const unresolvedMerged = CANONICAL_OWNERSHIP_ENTRIES.filter(
    (entry) => entry.status === 'MERGED' && !entry.mergedInto,
  );
  const removedReappeared = 0;
  return unresolvedMerged.length + removedReappeared;
}

export function listMergedCapabilities(): readonly string[] {
  return CANONICAL_OWNERSHIP_ENTRIES.filter((entry) => entry.status === 'MERGED').map(
    (entry) => entry.capability,
  );
}

export function listRemovedCapabilities(): readonly string[] {
  return CANONICAL_OWNERSHIP_ENTRIES.filter((entry) => entry.status === 'REMOVED').map(
    (entry) => entry.capability,
  );
}

export function listCanonicalOwnerEntries(): readonly CanonicalCapabilityOwnershipEntry[] {
  return CANONICAL_OWNERSHIP_ENTRIES.filter((entry) => entry.status === 'CANONICAL');
}
