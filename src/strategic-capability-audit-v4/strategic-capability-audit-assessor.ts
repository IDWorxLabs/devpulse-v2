/**
 * Strategic Capability Audit V4 — main assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MIN_EVIDENCE_SOURCES_CONSUMED,
  MIN_STRATEGIC_DIMENSIONS_ASSESSED,
  STRATEGIC_CAPABILITY_AUDIT_V4_FAIL_TOKEN,
  STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
  STRATEGIC_GAP_CATEGORIES,
} from './strategic-capability-audit-v4-bounds.js';
import type { StrategicCapabilityAuditV4Assessment } from './strategic-capability-audit-v4-types.js';
import { collectStrategicEvidence } from './strategic-evidence-collector.js';
import { assessCapabilityQuestions } from './capability-question-assessor.js';
import {
  assessAutonomyReadiness,
  assessCommercializationReadiness,
  assessFactoryReadiness,
} from './readiness-assessors.js';
import {
  analyzeStrategicGaps,
  deriveHighestValueNextCapability,
} from './strategic-gap-analyzer.js';
import { buildRoadmapV4 } from './roadmap-v4-builder.js';
import { writeStrategicCapabilityAuditV4Artifacts } from './strategic-capability-audit-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const PRIOR_PHASES_COMPLETE = [
  'Operational Evidence Freshness Authority V1',
  'Unified Failure Escalation Authority V1',
  'Multi-Project Concurrent Execution V1',
  'Canonical Ownership V2 Registration',
  'Self-Evolution Execution V1',
  'World2 Real Instantiation V1',
  'Mobile Runtime Validation at Scale V1',
  'Real Build Execution Pipeline V1.1',
  'UVL Verification Execution V1',
  'Large-Scale Pipeline Integration V1',
  'Production Readiness Gate V1',
  'Cloud Execution Path V1',
  'Validation Runtime Governance V1',
  'Customer Operations Platform V1',
  'Production Observability Platform V1',
  'Continuous Deployment Pipeline V1',
] as const;

function resolveProofStatus(input: {
  evidenceSourcesConsumed: number;
  questionsAnswered: number;
  roadmapGenerated: boolean;
  gapsAnalyzed: boolean;
}): StrategicCapabilityAuditV4Assessment['auditProofStatus'] {
  const proven =
    input.evidenceSourcesConsumed >= MIN_EVIDENCE_SOURCES_CONSUMED &&
    input.questionsAnswered >= 7 &&
    input.roadmapGenerated &&
    input.gapsAnalyzed;
  if (proven) return 'PROVEN';
  if (input.questionsAnswered > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function runStrategicCapabilityAuditV4(input?: {
  projectRootDir?: string;
}): StrategicCapabilityAuditV4Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;

  const evidence = collectStrategicEvidence(projectRootDir);
  const capabilityQuestions = assessCapabilityQuestions(evidence);
  const factoryReadiness = assessFactoryReadiness(evidence, capabilityQuestions);
  const autonomyReadiness = assessAutonomyReadiness(evidence);
  const commercializationReadiness = assessCommercializationReadiness(evidence);
  const remainingGaps = analyzeStrategicGaps({
    evidence,
    factoryReadiness,
    autonomyReadiness,
    commercializationReadiness,
  });

  const { highestValue, noMajorGaps } = deriveHighestValueNextCapability(
    remainingGaps,
    factoryReadiness.softwareFactoryReady,
    evidence,
  );

  const roadmapV4 = buildRoadmapV4({
    gaps: remainingGaps,
    evidence,
    noMajorGaps,
    highestValue,
  });

  const auditProofStatus = resolveProofStatus({
    evidenceSourcesConsumed: evidence.sourceSystemsConsumed.length,
    questionsAnswered: capabilityQuestions.length,
    roadmapGenerated: roadmapV4.length >= 1,
    gapsAnalyzed: remainingGaps.length >= 0,
  });

  const assessment: StrategicCapabilityAuditV4Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Strategic Capability Audit V4',
    passToken:
      auditProofStatus === 'PROVEN'
        ? STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN
        : STRATEGIC_CAPABILITY_AUDIT_V4_FAIL_TOKEN,
    version: 'V4',
    generatedAt: new Date().toISOString(),
    evidenceSourcesConsumed: evidence.sourceSystemsConsumed.length,
    strategicDimensionsAssessed: STRATEGIC_GAP_CATEGORIES.length,
    auditProofStatus,
    capabilityQuestions,
    remainingGaps,
    highestValueNextCapability: highestValue,
    noMajorGapsConclusion: noMajorGaps,
    factoryReadiness,
    autonomyReadiness,
    commercializationReadiness,
    roadmapV4,
    priorPhasesComplete: [...PRIOR_PHASES_COMPLETE],
  };

  writeStrategicCapabilityAuditV4Artifacts(projectRootDir, assessment);
  return assessment;
}
