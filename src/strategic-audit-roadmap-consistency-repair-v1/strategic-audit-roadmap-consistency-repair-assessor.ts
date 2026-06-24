/**
 * Strategic Audit Roadmap Consistency Repair V1 — main assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStrategicCapabilityAuditV4 } from '../strategic-capability-audit-v4/index.js';
import {
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_FAIL_TOKEN,
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN,
} from './strategic-audit-roadmap-consistency-repair-v1-bounds.js';
import type { StrategicAuditRoadmapConsistencyRepairAssessment } from './strategic-audit-roadmap-consistency-repair-v1-types.js';
import { assessRoadmapConsistency } from './strategic-audit-roadmap-consistency-authority.js';
import { writeStrategicAuditRoadmapConsistencyRepairArtifacts } from './roadmap-consistency-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runStrategicAuditRoadmapConsistencyRepairV1(input?: {
  projectRootDir?: string;
  refreshStrategicAudit?: boolean;
}): StrategicAuditRoadmapConsistencyRepairAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const now = new Date();

  const strategicAudit = runStrategicCapabilityAuditV4({ projectRootDir });
  const { items, conflicts } = assessRoadmapConsistency(projectRootDir);

  const conflictingItems = items.filter((i) => i.consistencyStatus === 'CONFLICTING').length;
  const staleItems = items.filter((i) => i.consistencyStatus === 'STALE').length;
  const duplicateItems = items.filter((i) => i.consistencyStatus === 'DUPLICATE').length;
  const consistentItems = items.filter((i) => i.consistencyStatus === 'CONSISTENT').length;

  const gpItem = items.find((i) => i.capability.includes('General-Purpose Code Generation'));
  const generalPurposeV1CompleteInRoadmap = gpItem?.roadmapAction === 'COMPLETE';
  const generalPurposeV1NotTopGap = !strategicAudit.highestValueNextCapability.includes(
    'General-Purpose Code Generation',
  );

  const auditsAgree =
    conflictingItems === 0 &&
    generalPurposeV1CompleteInRoadmap &&
    gpItem?.capabilityAuditAction === 'COMPLETE';
  const completedCapabilitiesCannotReappear =
    generalPurposeV1NotTopGap && generalPurposeV1CompleteInRoadmap;
  const evidenceDrivenRoadmapProven =
    !strategicAudit.highestValueNextCapability.includes('General-Purpose Code Generation') ||
    strategicAudit.highestValueNextCapability.includes('Operational Excellence');

  const consistencyProofStatus =
    auditsAgree && completedCapabilitiesCannotReappear && evidenceDrivenRoadmapProven && conflictingItems === 0
      ? 'PROVEN'
      : conflictingItems === 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const assessment: StrategicAuditRoadmapConsistencyRepairAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Strategic Audit Roadmap Consistency Repair V1',
    passToken:
      consistencyProofStatus === 'PROVEN'
        ? STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN
        : STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_FAIL_TOKEN,
    version: 'V1',
    generatedAt: now.toISOString(),
    consistencyProofStatus,
    auditsAgree,
    completedCapabilitiesCannotReappear,
    evidenceDrivenRoadmapProven,
    conflictingItems,
    staleItems,
    duplicateItems,
    consistentItems,
    generalPurposeV1CompleteInRoadmap,
    generalPurposeV1NotTopGap,
    consistencyAnalysis: items,
    roadmapConflicts: conflicts,
    resolvedPriorities: strategicAudit.roadmapV4.map((p) => ({
      readOnly: true,
      rank: p.rank,
      phase: p.phase,
      action: p.action,
      evidenceBasis: p.evidenceBasis,
    })),
  };

  writeStrategicAuditRoadmapConsistencyRepairArtifacts(projectRootDir, assessment);
  return assessment;
}
