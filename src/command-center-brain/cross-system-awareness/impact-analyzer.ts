/**
 * Impact analyzer — what happens if a system disappeared. Honest, evidence-based.
 */

import type { CrossSystemSystemRecord } from './relationship-types.js';
import { founderDisplayName } from './system-relationship-registry.js';
import { analyzeDependencies } from './dependency-analyzer.js';
import {
  getRelationshipEdges,
  getSystemById,
  resolveSystemIdFromMessage,
} from './system-relationship-registry.js';

export type ImpactSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ImpactAnalysisResult {
  targetSystemId: string;
  targetDisplayName: string;
  affectedSystems: CrossSystemSystemRecord[];
  impactLines: string[];
  executionAffected: boolean;
  visibilityAffected: boolean;
  intelligenceAffected: boolean;
  severity: ImpactSeverity;
}

const IMPACT_TEMPLATES: Record<string, Omit<ImpactAnalysisResult, 'targetSystemId' | 'targetDisplayName' | 'affectedSystems' | 'impactLines' | 'severity'>> = {
  operator_feed: {
    executionAffected: false,
    visibilityAffected: true,
    intelligenceAffected: false,
  },
  trust_engine: {
    executionAffected: false,
    visibilityAffected: true,
    intelligenceAffected: true,
  },
  command_center_brain: {
    executionAffected: false,
    visibilityAffected: true,
    intelligenceAffected: true,
  },
  governance_stack: {
    executionAffected: true,
    visibilityAffected: true,
    intelligenceAffected: true,
  },
};

function defaultImpactFlags(): Pick<ImpactAnalysisResult, 'executionAffected' | 'visibilityAffected' | 'intelligenceAffected'> {
  return { executionAffected: false, visibilityAffected: true, intelligenceAffected: false };
}

function computeSeverity(
  flags: Pick<ImpactAnalysisResult, 'executionAffected' | 'visibilityAffected' | 'intelligenceAffected'>,
  affectedCount: number,
): ImpactSeverity {
  if (flags.executionAffected) return 'HIGH';
  if (flags.intelligenceAffected && affectedCount > 2) return 'HIGH';
  if (flags.intelligenceAffected || flags.visibilityAffected) return 'MEDIUM';
  return 'LOW';
}

export function analyzeImpact(systemId: string): ImpactAnalysisResult | null {
  const target = getSystemById(systemId);
  if (!target) return null;

  const dep = analyzeDependencies(systemId);
  const affectedSystems = dep?.directDependents ?? [];
  const flags = IMPACT_TEMPLATES[systemId] ?? defaultImpactFlags();
  const impactLines: string[] = [];

  if (systemId === 'operator_feed') {
    impactLines.push('Brain still works — intelligence is not stored in the Operator Feed.');
    impactLines.push('Chat still works — Brain responses continue via the chat surface.');
    impactLines.push('Visibility decreases — pipeline activity would not surface in the feed panel.');
    impactLines.push('Execution unaffected — Operator Feed is informational only.');
  } else if (systemId === 'trust_engine') {
    impactLines.push('Trust scoring aggregation unavailable — unified trust score would not be produced.');
    impactLines.push('Governance still exists — verification, evidence ledger, and approval gates remain separate systems.');
    impactLines.push('Decision confidence reduced — founders lose aggregated trust signals for review.');
    impactLines.push('Execution unaffected at current maturity — Trust Engine does not execute builds.');
  } else if (systemId === 'command_center_brain') {
    impactLines.push('Command Center chat intelligence unavailable — no local Brain responses.');
    impactLines.push('Operator Feed would lose Brain pipeline events.');
    impactLines.push('Notifications would lose Brain request lifecycle events.');
    impactLines.push('Execution unaffected — Brain provides intelligence only.');
  } else if (systemId === 'governance_stack') {
    impactLines.push('Execution authority patterns would lose their registered governance owner context.');
    impactLines.push('World 2, Mobile Command, and verification paths lose governance dependency anchor.');
    impactLines.push('Trust Engine aggregation loses primary governance protection target.');
    impactLines.push('No automatic execution occurs today — but governance is foundational to future execution paths.');
  } else {
    impactLines.push(`${founderDisplayName(systemId)} would no longer appear in Cross-System Awareness responses.`);
    if (affectedSystems.length > 0) {
      impactLines.push(`Registered dependents lose relationship context to ${founderDisplayName(systemId)}.`);
    }
    impactLines.push('Execution unaffected at current foundation maturity unless governance or execution paths are involved.');
  }

  const severity = computeSeverity(flags, affectedSystems.length);

  return {
    targetSystemId: systemId,
    targetDisplayName: founderDisplayName(systemId),
    affectedSystems,
    impactLines,
    severity,
    ...flags,
  };
}

export function analyzeImpactFromMessage(message: string): ImpactAnalysisResult | null {
  const systemId = resolveSystemIdFromMessage(message);
  if (!systemId) return null;
  return analyzeImpact(systemId);
}

export function formatImpactResponse(result: ImpactAnalysisResult): string {
  const affected =
    result.affectedSystems.length > 0
      ? result.affectedSystems.map((s) => `• ${founderDisplayName(s.systemId)}`)
      : ['• No registered direct dependents — visibility and context impact only'];

  return [
    `Removed System: ${result.targetDisplayName}`,
    '',
    'Affected Systems:',
    ...affected,
    '',
    `Severity: ${result.severity}`,
    '',
    'Explanation:',
    ...result.impactLines.map((line) => `• ${line}`),
    '',
    `Execution affected: ${result.executionAffected ? 'yes (foundational risk)' : 'no at current maturity'}.`,
    `Visibility affected: ${result.visibilityAffected ? 'yes' : 'no'}.`,
    `Intelligence affected: ${result.intelligenceAffected ? 'yes' : 'no'}.`,
    '',
    'This is relationship awareness only — no systems were modified or executed.',
  ].join('\n');
}
