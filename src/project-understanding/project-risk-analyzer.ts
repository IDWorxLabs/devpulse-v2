/**
 * Project risk analyzer — structured risk assessment. Deterministic only.
 */

import { getCurrentProjectProfile } from './project-profile-store.js';
import type { ProjectRiskAnalysis } from './project-understanding-types.js';

function computeSeverity(riskCount: number, blockedCount: number): ProjectRiskAnalysis['severity'] {
  if (blockedCount >= 3 && riskCount >= 4) return 'HIGH';
  if (riskCount >= 3 || blockedCount >= 2) return 'MEDIUM';
  return 'LOW';
}

export function analyzeProjectRisks(): ProjectRiskAnalysis {
  const profile = getCurrentProjectProfile();
  return {
    projectId: profile.projectId,
    riskItems: [...profile.riskItems],
    riskCount: profile.riskItems.length,
    severity: computeSeverity(profile.riskItems.length, profile.blockedItems.length),
    explanation:
      'Risks are derived from the registered DevPulse V2 project profile — governance, duplication, runtime, and honesty constraints.',
  };
}

export function formatProjectRisksResponse(): string {
  const profile = getCurrentProjectProfile();
  const risks = analyzeProjectRisks();
  const lines = risks.riskItems.map((r) => `• ${r}`);
  return [
    `Project: ${profile.name}`,
    '',
    'Project Risks:',
    ...lines,
    '',
    `Risk Count: ${risks.riskCount}`,
    `Severity: ${risks.severity}`,
    '',
    'Explanation:',
    risks.explanation,
    '',
    'Intelligence only — no execution occurred.',
  ].join('\n');
}

export function formatBlockedItemsResponse(): string {
  const profile = getCurrentProjectProfile();
  const lines = profile.blockedItems.map((b) => `• ${b}`);
  return [
    `Project: ${profile.name}`,
    '',
    'Blocked Items:',
    ...lines,
    '',
    `Blocked Count: ${profile.blockedItems.length}`,
    '',
    'These are intentional foundation gates — not runtime failures.',
  ].join('\n');
}
