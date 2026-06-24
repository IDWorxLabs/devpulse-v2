/**
 * General-Purpose Code Generation Gap Investigation — cross-audit evidence analyzer.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
} from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import { GENERAL_PURPOSE_PROOF_SUITE } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-suite-registry.js';
import { STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR } from '../strategic-capability-audit-v4/strategic-capability-audit-v4-bounds.js';
import { buildMissingCapabilitiesReport } from '../capability-audit-v3/missing-capabilities.js';
import { buildCodeGenerationAssessment } from '../capability-audit-v3/code-generation-assessment.js';
import {
  CATEGORY_VISION_TARGET,
  GP_V1_PROOF_DOMAINS,
  RBEP_PROVEN_CATEGORIES,
} from './general-purpose-code-generation-gap-investigation-bounds.js';
import type {
  EvidenceAnalysisEntry,
  RemainingCodegenGap,
  RoadmapConsistencyFinding,
} from './general-purpose-code-generation-gap-investigation-types.js';

const RBEP_CATEGORY_SAMPLES = [
  'TASK_TRACKER_WEB_V1',
  'CRM_WEB_V1',
  'INVENTORY_WEB_V1',
  'SCHOOL_MANAGEMENT_WEB_V1',
  'HEALTHCARE_PORTAL_WEB_V1',
  'FINANCE_TRACKER_WEB_V1',
  'BOOKING_PLATFORM_WEB_V1',
  'RESTAURANT_POS_WEB_V1',
  'PROJECT_MANAGEMENT_WEB_V1',
  'HR_PLATFORM_WEB_V1',
  'SOCIAL_PLATFORM_WEB_V1',
  'LEARNING_PLATFORM_WEB_V1',
  'MARKETPLACE_WEB_V1',
  'APPOINTMENT_BOOKING_WEB_V1',
  'CUSTOMER_SUPPORT_WEB_V1',
] as const;

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function isGeneralPurposeV1Proven(projectRootDir: string): boolean {
  const assessment = readJson<{ passToken?: string }>(
    join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  return assessment?.passToken === GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN;
}

export function collectEvidenceAnalysis(projectRootDir: string): EvidenceAnalysisEntry[] {
  const gpProven = isGeneralPurposeV1Proven(projectRootDir);
  const codegen = buildCodeGenerationAssessment({ projectRootDir });
  const missing = buildMissingCapabilitiesReport({
    projectRootDir,
    codeGenerationMaturityScore: codegen.codeGenerationMaturityScore,
  });

  const strategic = readJson<{
    highestValueNextCapability?: string;
    roadmapV4?: Array<{ phase?: string; action?: string; rank?: number }>;
    commercializationReadiness?: { dimensions?: Array<{ dimension?: string; score?: number }> };
  }>(join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR, 'assessment.json'));

  const gpGapInMissing = missing.entries.some((e) =>
    e.capability.includes('General-purpose code generation'),
  );
  const cdDimension = strategic?.commercializationReadiness?.dimensions?.find((d) =>
    d.dimension?.includes('Code Generation'),
  );
  const topRoadmap = strategic?.roadmapV4?.find((p) => p.rank === 1);

  return [
    {
      readOnly: true,
      source: 'General-Purpose Code Generation V1',
      generalPurposeV1Proven: gpProven,
      reportsGap: false,
      highestPriority: gpProven ? 'N/A — V1 PASS' : 'Prove General-Purpose Code Generation V1',
      codeGenerationScore: readJson<{ generalPurposeMaturityScore?: number }>(
        join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json'),
      )?.generalPurposeMaturityScore ?? null,
      detail: gpProven
        ? '10/10 GP proof domains passed; workflows, roles, domain logic, and production readiness proven.'
        : 'GP V1 artifact missing or not PASS.',
    },
    {
      readOnly: true,
      source: 'Capability Audit V3.1',
      generalPurposeV1Proven: gpProven,
      reportsGap: gpGapInMissing,
      highestPriority: missing.highestPriorityGap,
      codeGenerationScore: codegen.codeGenerationMaturityScore,
      detail: gpProven
        ? 'Missing-capabilities filter removes GP gap when assessment.json exists; code generation status MATURE.'
        : 'GP gap remains in missing capabilities report.',
    },
    {
      readOnly: true,
      source: 'Strategic Capability Audit V4',
      generalPurposeV1Proven: gpProven,
      reportsGap: (strategic?.highestValueNextCapability ?? '').includes('General-Purpose Code Generation'),
      highestPriority: strategic?.highestValueNextCapability ?? 'Unknown',
      codeGenerationScore: cdDimension?.score ?? null,
      detail: gpProven
        ? `Roadmap rank 1: ${topRoadmap?.phase ?? 'n/a'} (${topRoadmap?.action ?? 'n/a'}). Code Generation Diversity dimension ${cdDimension?.score ?? '?'}/100 despite V1 PASS.`
        : 'Strategic audit reports GP as gap because V1 not proven.',
    },
  ];
}

export function analyzeRoadmapConsistency(projectRootDir: string): RoadmapConsistencyFinding[] {
  const gpProven = isGeneralPurposeV1Proven(projectRootDir);
  const strategic = readJson<{
    roadmapV4?: Array<{ phase?: string; action?: string; rank?: number; evidenceBasis?: string }>;
    highestValueNextCapability?: string;
  }>(join(projectRootDir, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR, 'assessment.json'));

  const findings: RoadmapConsistencyFinding[] = [];

  for (const item of strategic?.roadmapV4 ?? []) {
    if (item.phase !== 'General-Purpose Code Generation') continue;
    findings.push({
      readOnly: true,
      auditSource: 'Strategic Capability Audit V4',
      phase: item.phase ?? 'General-Purpose Code Generation',
      action: item.action ?? 'UNKNOWN',
      consistentWithV1Pass: gpProven ? item.action === 'COMPLETE' : item.action === 'BUILD' || item.action === 'EXTEND',
      issue:
        gpProven && item.action !== 'COMPLETE'
          ? `V1 PASS but roadmap action is ${item.action} — treats proven capability as next build target.`
          : null,
    });
  }

  if ((strategic?.highestValueNextCapability ?? '').includes('General-Purpose Code Generation') && gpProven) {
    findings.push({
      readOnly: true,
      auditSource: 'Strategic Capability Audit V4',
      phase: 'General-Purpose Code Generation',
      action: 'HIGHEST_VALUE_OVERRIDE',
      consistentWithV1Pass: false,
      issue:
        'deriveHighestValueNextCapability hardcodes GP as next priority when CD+COP+POP proven — ignores V1 PASS.',
    });
  }

  findings.push({
    readOnly: true,
    auditSource: 'Capability Audit V3.1',
    phase: 'General-Purpose Code Generation',
    action: gpProven ? 'GAP_CLOSED' : 'EXTEND',
    consistentWithV1Pass: gpProven,
    issue: gpProven ? null : 'GP gap still listed in missing capabilities.',
  });

  return findings;
}

export function buildRemainingCodegenGaps(projectRootDir: string): RemainingCodegenGap[] {
  const gpProven = isGeneralPurposeV1Proven(projectRootDir);
  const gaps: RemainingCodegenGap[] = [];

  const gpDomains = new Set(GENERAL_PURPOSE_PROOF_SUITE.map((e) => e.domain));
  const rbepSet = new Set(RBEP_CATEGORY_SAMPLES);
  const provenProfiles = new Set([
    ...GENERAL_PURPOSE_PROOF_SUITE.map((e) => e.profile),
    ...RBEP_CATEGORY_SAMPLES,
  ]);

  const unsupportedSamples: string[] = [];
  for (let i = 1; i <= CATEGORY_VISION_TARGET; i += 1) {
    const placeholder = `CATEGORY_${String(i).padStart(2, '0')}_WEB_V1`;
    if (!provenProfiles.has(placeholder) && !rbepSet.has(placeholder as (typeof RBEP_CATEGORY_SAMPLES)[number])) {
      if (unsupportedSamples.length < 8) {
        unsupportedSamples.push(placeholder);
      }
    }
  }

  if (gpProven) {
    gaps.push({
      readOnly: true,
      gapId: 'gp-v1-proven',
      category: 'RESOLVED',
      capability: 'General-Purpose Code Generation V1',
      severity: 'LOW',
      detail: 'V1 PASS — 10/10 non-trivial domains with workflow, role, and domain logic validation.',
      unsupportedApplicationClasses: [],
    });
  }

  gaps.push({
    readOnly: true,
    gapId: '58-category-vision',
    category: 'ASPIRATIONAL',
    capability: 'Full 58-category autonomous generation',
    severity: 'MEDIUM',
    detail: `${RBEP_PROVEN_CATEGORIES} RBEP categories + ${GP_V1_PROOF_DOMAINS} GP V1 domains proven; ${CATEGORY_VISION_TARGET - RBEP_PROVEN_CATEGORIES} categories remain outside full-pipeline proof scope.`,
    unsupportedApplicationClasses: unsupportedSamples,
  });

  gaps.push({
    readOnly: true,
    gapId: 'strategic-dimension-cap',
    category: 'ASPIRATIONAL',
    capability: 'Code Generation Diversity commercialization dimension',
    severity: 'LOW',
    detail:
      'Strategic audit caps Code Generation Diversity at 75/100 when V1 PASS — reflects 58-category vision headroom, not V1 failure.',
    unsupportedApplicationClasses: [],
  });

  if (!gpProven) {
    gaps.push({
      readOnly: true,
      gapId: 'gp-v1-unproven',
      category: 'REAL',
      capability: 'General-Purpose Code Generation V1',
      severity: 'HIGH',
      detail: 'GP V1 not proven — real capability gap.',
      unsupportedApplicationClasses: [...gpDomains],
    });
  }

  return gaps;
}
