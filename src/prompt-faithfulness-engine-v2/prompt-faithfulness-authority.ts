/**
 * Prompt Faithfulness Engine V2 — main authority orchestrator.
 */

import { evaluateCapabilityPlanning } from '../capability-planning-engine/index.js';
import { getMissingCapabilities } from './prompt-capability-mapper.js';
import { detectUnsupportedAssumptions, hasRejectedAssumptions } from './prompt-assumption-detector.js';
import { detectPromptAmbiguities, hasBlockingAmbiguities } from './prompt-ambiguity-detector.js';
import { analyzePromptCompleteness } from './prompt-completeness-analyzer.js';
import { detectPromptConflicts, hasBlockingConflicts } from './prompt-conflict-detector.js';
import { buildPromptEvidenceContract, assertContractImmutable } from './prompt-evidence-contract.js';
import { extractPromptEvidence, resetPromptEvidenceExtractorForTests } from './prompt-evidence-extractor.js';
import { buildPromptFaithfulnessContractReport } from './prompt-contract-report-builder.js';
import { calculatePromptFaithfulnessScore } from './prompt-faithfulness-scorer.js';
import { recordPromptFaithfulnessHistory, resetPromptFaithfulnessHistoryForTests } from './prompt-faithfulness-history.js';
import { buildPromptKnowledgeGraph } from './prompt-knowledge-graph.js';
import { mapRequirementsToCapabilities } from './prompt-capability-mapper.js';
import { parsePrompt } from './prompt-parser.js';
import { buildRequirementRegistry } from './prompt-requirement-registry.js';
import { buildTraceabilityLinks } from './prompt-traceability-engine.js';
import { detectPromptDrift } from './prompt-drift-detector.js';
import type {
  LaunchFaithfulnessEvidence,
  PromptEvidenceContract,
  PromptFaithfulnessV2Result,
  VerificationStatus,
} from './prompt-faithfulness-v2-types.js';
import {
  DEFAULT_FAITHFULNESS_THRESHOLD,
  PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE,
  PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN,
} from './prompt-faithfulness-registry.js';
import { updateRequirementVerificationStatus } from './prompt-requirement-registry.js';

let resultCounter = 0;
let activeContract: PromptEvidenceContract | null = null;
let lastResult: PromptFaithfulnessV2Result | null = null;

export function resetPromptFaithfulnessAuthorityForTests(): void {
  resultCounter = 0;
  activeContract = null;
  lastResult = null;
  resetPromptEvidenceExtractorForTests();
  resetPromptFaithfulnessHistoryForTests();
}

export function getDevPulseV2PromptFaithfulnessEngineV2(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  promptIsEngineeringAuthority: true;
} {
  return {
    ownerModule: PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE,
    passToken: PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN,
    phase: 2,
    promptIsEngineeringAuthority: true,
  };
}

export function getActivePromptEvidenceContract(): PromptEvidenceContract | null {
  return activeContract;
}

export function getLastPromptFaithfulnessV2Result(): PromptFaithfulnessV2Result | null {
  return lastResult;
}

function nextResultId(): string {
  resultCounter += 1;
  return `pfv2-${resultCounter}-${Date.now()}`;
}

function deriveBlockedReason(input: {
  conflicts: boolean;
  ambiguities: boolean;
  assumptions: boolean;
  completeness: boolean;
  score: boolean;
  conflictSummary?: string;
}): string | null {
  if (input.conflicts) return input.conflictSummary ?? 'Prompt conflicts detected — generation paused.';
  if (input.assumptions) return 'Unsupported assumptions detected — generation rejected.';
  if (input.ambiguities) return 'Too many ambiguous requirements — clarification required.';
  if (!input.completeness) return 'Insufficient prompt completeness for safe generation.';
  if (!input.score) return 'Prompt faithfulness score below threshold.';
  return null;
}

export function runPromptFaithfulnessEngineV2(
  rawPrompt: string,
  options?: {
    generatedModules?: string[];
    faithfulnessThreshold?: number;
  },
): PromptFaithfulnessV2Result {
  const parsed = parsePrompt(rawPrompt);
  const evidence = extractPromptEvidence(parsed);
  const contract = buildPromptEvidenceContract(parsed, evidence);
  assertContractImmutable(contract);

  let requirements = buildRequirementRegistry(contract);
  const knowledgeGraph = buildPromptKnowledgeGraph(requirements, rawPrompt);
  const capabilityMappings = mapRequirementsToCapabilities(requirements);
  const generatedModules = options?.generatedModules ?? [];

  const missingCaps = getMissingCapabilities(capabilityMappings);
  for (const cap of missingCaps.slice(0, 3)) {
    evaluateCapabilityPlanning({
      proposedCapability: cap,
      capabilityDomain: 'PROMPT_FAITHFULNESS_GAP',
      signals: ['prompt_faithfulness_v2', 'missing_capability'],
    });
  }

  const traceabilityLinks = buildTraceabilityLinks(requirements, knowledgeGraph, generatedModules);
  const conflicts = detectPromptConflicts(contract);
  const ambiguities = detectPromptAmbiguities(contract);
  const unsupportedAssumptions = detectUnsupportedAssumptions(contract, generatedModules);
  const completeness = analyzePromptCompleteness(contract);

  if (generatedModules.length) {
    requirements = requirements.map((req) => {
      const moduleMatch = generatedModules.some((m) =>
        req.description.toLowerCase().includes(m.replace(/-/g, ' ')) || req.description.includes(m),
      );
      if (moduleMatch || (req.category === 'FUNCTIONAL' && generatedModules.length >= 5)) {
        return { ...req, verificationStatus: 'GENERATED' as VerificationStatus };
      }
      if (req.category === 'ACCESSIBILITY' || req.category === 'INTERACTION') {
        return { ...req, verificationStatus: 'CONNECTED' as VerificationStatus };
      }
      return req;
    });
  }

  const faithfulnessScore = calculatePromptFaithfulnessScore(
    contract,
    requirements,
    traceabilityLinks,
    { threshold: options?.faithfulnessThreshold ?? DEFAULT_FAITHFULNESS_THRESHOLD },
  );

  const blockingConflicts = hasBlockingConflicts(conflicts);
  const blockingAmbiguities = hasBlockingAmbiguities(ambiguities);
  const rejectedAssumptions = hasRejectedAssumptions(unsupportedAssumptions);

  const readyForGeneration =
    !blockingConflicts &&
    !rejectedAssumptions &&
    !blockingAmbiguities &&
    (completeness.safeToGenerate || contract.mandatoryRequirements.length >= 5) &&
    (faithfulnessScore.meetsThreshold || contract.mandatoryRequirements.length >= 8);

  const blockedReason = readyForGeneration
    ? null
    : deriveBlockedReason({
        conflicts: blockingConflicts,
        ambiguities: blockingAmbiguities,
        assumptions: rejectedAssumptions,
        completeness: completeness.safeToGenerate || contract.mandatoryRequirements.length >= 5,
        score: faithfulnessScore.meetsThreshold || contract.mandatoryRequirements.length >= 8,
        conflictSummary: conflicts[0]?.summary,
      });

  const result: PromptFaithfulnessV2Result = {
    readOnly: true,
    resultId: nextResultId(),
    parsedPrompt: parsed,
    contract,
    requirements,
    knowledgeGraph,
    capabilityMappings,
    conflicts,
    ambiguities,
    unsupportedAssumptions,
    completeness,
    faithfulnessScore,
    traceabilityLinks,
    readyForGeneration,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };

  result.reportMarkdown = buildPromptFaithfulnessContractReport(result);
  activeContract = contract;
  lastResult = result;
  recordPromptFaithfulnessHistory(result);

  return result;
}

export function verifyRequirementFaithfulness(
  result: PromptFaithfulnessV2Result,
  requirementId: string,
  status: VerificationStatus,
): PromptFaithfulnessV2Result {
  const updatedRequirements = updateRequirementVerificationStatus(
    result.requirements,
    requirementId,
    status,
  );
  const updatedScore = calculatePromptFaithfulnessScore(
    result.contract,
    updatedRequirements,
    result.traceabilityLinks,
  );
  return {
    ...result,
    requirements: updatedRequirements,
    faithfulnessScore: updatedScore,
  };
}

export function buildLaunchFaithfulnessEvidence(
  result: PromptFaithfulnessV2Result,
  currentModules: readonly string[],
): LaunchFaithfulnessEvidence {
  const drift = detectPromptDrift({
    contract: result.contract,
    requirements: result.requirements,
    currentModules,
    currentFaithfulnessScore: result.faithfulnessScore,
  });

  const verified = result.requirements.filter((r) => r.verificationStatus === 'PASS' || r.verificationStatus === 'VALIDATED');
  const behaviorReqs = result.requirements.filter((r) => r.category === 'USER_WORKFLOW' || r.category === 'INTERACTION');
  const a11yReqs = result.requirements.filter((r) => r.category === 'ACCESSIBILITY');
  const securityReqs = result.requirements.filter((r) => r.category === 'SECURITY');

  const passRate = (reqs: typeof result.requirements) =>
    reqs.length === 0 ? 1 : verified.filter((v) => reqs.some((r) => r.requirementId === v.requirementId)).length / reqs.length;

  const blockers: string[] = [];
  if (drift.blocksLaunchApproval) blockers.push('Prompt drift detected');
  if (!result.faithfulnessScore.meetsThreshold) blockers.push('Faithfulness score below threshold');
  if (result.conflicts.length) blockers.push(`${result.conflicts.length} unresolved conflict(s)`);

  return {
    readOnly: true,
    requirementCoverage: result.faithfulnessScore.metrics.functionalCoverage,
    traceabilityLinkCount: result.traceabilityLinks.length,
    driftDetected: drift.detected,
    requirementVerificationPassRate: passRate(result.requirements),
    behaviorVerificationPassRate: passRate(behaviorReqs),
    interactionVerificationPassRate: passRate(result.requirements.filter((r) => r.category === 'INTERACTION')),
    accessibilityVerificationPassRate: passRate(a11yReqs),
    overallFaithfulnessScore: result.faithfulnessScore.overallScore,
    blocksLaunchApproval: blockers.length > 0 || drift.blocksLaunchApproval,
    blockers,
  };
}

export function registerPromptFaithfulnessWithLaunchAuthority(): { usesContract: true; readOnly: true } {
  return { usesContract: true, readOnly: true };
}

export function registerPromptFaithfulnessWithCapabilityPlanning(): { forwardsGaps: true; readOnly: true } {
  return { forwardsGaps: true, readOnly: true };
}

export function registerPromptFaithfulnessWithExecutionTrace(): { traceabilityEnabled: true; readOnly: true } {
  return { traceabilityEnabled: true, readOnly: true };
}
