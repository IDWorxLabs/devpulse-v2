/**
 * Strategic Audit Roadmap Consistency Repair V1 — consistency authority.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMissingCapabilitiesReport } from '../capability-audit-v3/missing-capabilities.js';
import { buildCodeGenerationAssessment } from '../capability-audit-v3/code-generation-assessment.js';
import {
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
} from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import { STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR } from '../strategic-capability-audit-v4/strategic-capability-audit-v4-bounds.js';
import type {
  RoadmapConflict,
  RoadmapConsistencyItem,
  RoadmapConsistencyStatus,
} from './strategic-audit-roadmap-consistency-repair-v1-types.js';

const TRACKED_CAPABILITIES: readonly {
  capability: string;
  phase: string;
  passToken: string;
  artifactRelative: string;
  capabilityAuditGapKey?: string;
}[] = [
  {
    capability: 'General-Purpose Code Generation V1',
    phase: 'General-Purpose Code Generation',
    passToken: GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
    artifactRelative: `${GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR}/assessment.json`,
    capabilityAuditGapKey: 'General-purpose code generation beyond CRUD profiles',
  },
  {
    capability: 'Continuous Deployment Pipeline V1',
    phase: 'Continuous Deployment Pipeline',
    passToken: 'CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS',
    artifactRelative: '.continuous-deployment-pipeline-v1/assessment.json',
  },
  {
    capability: 'Production Observability Platform V1',
    phase: 'Production Observability Platform',
    passToken: 'PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS',
    artifactRelative: '.production-observability-platform-v1/assessment.json',
  },
  {
    capability: 'Customer Operations Platform V1',
    phase: 'Customer Operations Platform',
    passToken: 'CUSTOMER_OPERATIONS_PLATFORM_V1_PASS',
    artifactRelative: '.customer-operations-platform-v1/assessment.json',
  },
];

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function isProven(projectRootDir: string, artifactRelative: string, passToken: string): boolean {
  const data = readJson<{ passToken?: string }>(join(projectRootDir, artifactRelative));
  return data?.passToken === passToken;
}

export function assessRoadmapConsistency(projectRootDir: string): {
  items: RoadmapConsistencyItem[];
  conflicts: RoadmapConflict[];
} {
  const strategic = readJson<{
    highestValueNextCapability?: string;
    roadmapV4?: Array<{ phase?: string; action?: string; rank?: number; evidenceBasis?: string }>;
  }>(join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR, 'assessment.json'));

  const codegen = buildCodeGenerationAssessment({ projectRootDir });
  const missing = buildMissingCapabilitiesReport({
    projectRootDir,
    codeGenerationMaturityScore: codegen.codeGenerationMaturityScore,
  });

  const roadmapByPhase = new Map<string, string>();
  for (const item of strategic?.roadmapV4 ?? []) {
    if (item.phase) roadmapByPhase.set(item.phase, item.action ?? 'UNKNOWN');
  }

  const phaseCounts = new Map<string, number>();
  for (const item of strategic?.roadmapV4 ?? []) {
    if (!item.phase) continue;
    phaseCounts.set(item.phase, (phaseCounts.get(item.phase) ?? 0) + 1);
  }

  const items: RoadmapConsistencyItem[] = [];
  const conflicts: RoadmapConflict[] = [];

  for (const tracked of TRACKED_CAPABILITIES) {
    const proven = isProven(projectRootDir, tracked.artifactRelative, tracked.passToken);
    const roadmapAction = roadmapByPhase.get(tracked.phase) ?? 'ABSENT';
    const gapOpen =
      tracked.capabilityAuditGapKey != null &&
      missing.entries.some((e) => e.capability === tracked.capabilityAuditGapKey);
    const capabilityAuditAction = proven && !gapOpen ? 'COMPLETE' : gapOpen ? 'EXTEND' : 'UNKNOWN';

    let consistencyStatus: RoadmapConsistencyStatus = 'CONSISTENT';
    let detail = 'Strategic and Capability audits align.';

    if ((phaseCounts.get(tracked.phase) ?? 0) > 1) {
      consistencyStatus = 'DUPLICATE';
      detail = `Duplicate roadmap entries for ${tracked.phase}.`;
    } else if (proven && roadmapAction !== 'COMPLETE' && roadmapAction !== 'ABSENT') {
      consistencyStatus = 'CONFLICTING';
      detail = `Capability proven (${tracked.passToken}) but Strategic Audit action is ${roadmapAction}.`;
      conflicts.push({
        readOnly: true,
        conflictId: `conflict-${tracked.phase.toLowerCase().replace(/\s+/g, '-')}`,
        capability: tracked.capability,
        strategicAuditAction: roadmapAction,
        capabilityAuditAction,
        resolution: `Set Strategic Audit roadmap action to COMPLETE for ${tracked.phase}.`,
      });
    } else if (proven && capabilityAuditAction === 'COMPLETE' && roadmapAction === 'COMPLETE') {
      consistencyStatus = 'CONSISTENT';
      detail = 'Proven capability marked COMPLETE in both audits.';
    } else if (!proven && roadmapAction === 'COMPLETE') {
      consistencyStatus = 'STALE';
      detail = 'Roadmap marks COMPLETE but pass token not present.';
    } else if (
      proven &&
      (strategic?.highestValueNextCapability ?? '').includes(tracked.phase) &&
      roadmapAction !== 'COMPLETE'
    ) {
      consistencyStatus = 'CONFLICTING';
      detail = 'Proven capability still ranked as highest strategic priority.';
      conflicts.push({
        readOnly: true,
        conflictId: `top-gap-${tracked.phase.toLowerCase().replace(/\s+/g, '-')}`,
        capability: tracked.capability,
        strategicAuditAction: `TOP_GAP (${roadmapAction})`,
        capabilityAuditAction,
        resolution: 'Remove proven capability from highest-value override; select from unresolved evidence only.',
      });
    }

    items.push({
      readOnly: true,
      capability: tracked.capability,
      evidenceSource: tracked.capability,
      passToken: proven ? tracked.passToken : null,
      roadmapAction,
      capabilityAuditAction,
      consistencyStatus,
      detail,
    });
  }

  return { items, conflicts };
}
