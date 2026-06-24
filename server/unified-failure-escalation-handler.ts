/**
 * Unified Failure Escalation Authority V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadUnifiedFailureEscalationAssessmentFromDisk,
  runUnifiedFailureEscalationAuthorityV1,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
} from '../src/unified-failure-escalation-authority-v1/index.js';
import type { UnifiedFailureEscalationAssessment } from '../src/unified-failure-escalation-authority-v1/unified-failure-escalation-v1-types.js';

export { UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface UnifiedFailureEscalationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_unified_failure_escalation_authority_v1';
  canonicalOwner: 'Unified Failure Escalation Authority V1';
  passToken: string;
  openIncidents: number;
  escalatedIncidents: number;
  blockedIncidents: number;
  repeatedFailures: number;
  sourceSystemsConsumed: number;
  threeFailureRuleProven: boolean;
  escalationProofStatus: string;
  resolvedRate: number;
  repeatRate: number;
  assessment: UnifiedFailureEscalationAssessment | null;
}

export function buildUnifiedFailureEscalationPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): UnifiedFailureEscalationPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runUnifiedFailureEscalationAuthorityV1({ projectRootDir })
    : loadUnifiedFailureEscalationAssessmentFromDisk(projectRootDir) ??
      runUnifiedFailureEscalationAuthorityV1({ projectRootDir });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_unified_failure_escalation_authority_v1',
    canonicalOwner: 'Unified Failure Escalation Authority V1',
    passToken: assessment.passToken,
    openIncidents: assessment.registry.openIncidents,
    escalatedIncidents: assessment.registry.escalatedIncidents,
    blockedIncidents: assessment.registry.blockedIncidents,
    repeatedFailures: assessment.registry.repeatedIncidents,
    sourceSystemsConsumed: assessment.sourceSystemsConsumed,
    threeFailureRuleProven: assessment.threeFailureRuleProven,
    escalationProofStatus: assessment.escalationProofStatus,
    resolvedRate: assessment.effectivenessAssessment.resolvedRate,
    repeatRate: assessment.effectivenessAssessment.repeatRate,
    assessment,
  };
}

export function sendUnifiedFailureEscalationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildUnifiedFailureEscalationPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'unified-failure-escalation-authority-v1',
    'X-DevPulse-Canonical-Owner': 'Unified Failure Escalation Authority V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
