/**
 * Operational response composer — evidence-grounded answers synchronized to OperationalTruthContext (Phase 26.84).
 */

import { CONSCIOUSNESS_CLAIM_PATTERNS } from './chat-operational-self-knowledge-registry.js';
import {
  highestImpactWeakness,
  listCapabilitiesByTruthLevel,
} from './capability-truth-registry.js';
import { detectChatOperationalContradictions } from './chat-operational-contradiction-detector.js';
import { buildOperationalTruthContext } from './operational-truth-context.js';
import {
  buildEvidenceBasisAnswer,
  buildExecutionStageInventoryAnswer,
  buildExecutionTruthSummary,
  buildFirstBrokenStageAnswer,
  buildPreviewCapabilityAnswer,
  buildRuntimeCapabilityAnswer,
  buildTruthSourceAnswer,
} from './operational-status-builder.js';
import { responseContradictsExecutionTruth } from './operational-truth-source-contradiction-detector.js';
import type {
  OperationalEvidenceSnapshot,
  OperationalQuestionKind,
  OperationalSelfKnowledgeAssessment,
  OperationalTruthContext,
} from './chat-operational-self-knowledge-types.js';

function bullet(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

function resolveTruthContext(snapshot: OperationalEvidenceSnapshot): OperationalTruthContext {
  return snapshot.operationalTruthContext ?? buildOperationalTruthContext(snapshot);
}

function formatCapabilityList(snapshot: OperationalEvidenceSnapshot, level: 'PROVEN' | 'NOT_PROVEN' | 'UNKNOWN'): string {
  return listCapabilitiesByTruthLevel(snapshot.capabilityTruth, level)
    .slice(0, 6)
    .map((e) => `${e.label} → ${e.truthLevel} (${e.evidenceSource})`)
    .join('\n');
}

function composeSelfAwareness(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const weakness = highestImpactWeakness(snapshot.capabilityTruth);
  return [
    'No — I am not conscious, sentient, or human-self-aware. I have operational self-knowledge from DevPulse proof authorities, not subjective experience.',
    '',
    'Operational role: AiDevEngine chat inside DevPulse V2 — explain software-creation status using bounded evidence.',
    '',
    `Current uncertainty: ${snapshot.overallUncertainty.level} (${snapshot.overallUncertainty.confidencePercent}% confidence) — ${snapshot.overallUncertainty.rationale}`,
    '',
    'Synchronized execution chain truth:',
    buildExecutionTruthSummary(context),
    '',
    weakness
      ? `Highest-impact gap right now: ${weakness.label} (${weakness.truthLevel}, source: ${weakness.evidenceSource}).`
      : 'No critical capability gap identified in the synchronized execution truth snapshot.',
    '',
    `Truth source: ${context.executionTruthSource} (generated ${context.executionTruthGeneratedAt}).`,
    `Evidence sources: ${snapshot.evidenceSources.join(', ')}.`,
  ].join('\n');
}

function composeTrust(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Trust should come from verifiable proof systems — not chat confidence or marketing language.',
    '',
    'Current evidence I can reference:',
    bullet([
      `Connected execution chain: ${context.chainConnected ? 'connected' : 'not connected'}`,
      `First broken stage: ${context.firstBrokenStage ?? 'none recorded'}`,
      `Repository typecheck: ${context.repositoryTypecheckReality.state}`,
      `Build proof: ${snapshot.buildProofLevel}`,
      `Overall uncertainty: ${snapshot.overallUncertainty.level}`,
      context.founderTestReality.available
        ? `Latest Founder Test verdict: ${context.founderTestReality.verdict}`
        : 'Latest Founder Test verdict: not recorded in this session',
    ]),
    '',
    snapshot.launchBlockers.length
      ? `Known launch blockers:\n${bullet(snapshot.launchBlockers.slice(0, 4).map((b) => `${b.label} (${b.evidenceSource})`))}`
      : 'No launch blockers recorded in the synchronized evidence snapshot.',
    '',
    'Run Founder Test and review validation evidence when you need grounded readiness — I will not guarantee outcomes I cannot verify.',
  ].join('\n');
}

function composeLimitations(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Honest operational limits from synchronized proof state:',
    '',
    'Proven capabilities:',
    formatCapabilityList(snapshot, 'PROVEN') || '• None fully proven in this snapshot',
    '',
    'Unproven capabilities:',
    formatCapabilityList(snapshot, 'NOT_PROVEN') || '• None marked NOT_PROVEN',
    '',
    'Unknown / not assessed:',
    formatCapabilityList(snapshot, 'UNKNOWN') || '• None',
    '',
    snapshot.launchBlockers.length
      ? `Currently blocked:\n${bullet(snapshot.launchBlockers.slice(0, 4).map((b) => b.label))}`
      : '',
    '',
    `Truth source: ${context.executionTruthSource}.`,
    `Evidence sources: ${snapshot.evidenceSources.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeUncertainty(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const unknown = listCapabilitiesByTruthLevel(snapshot.capabilityTruth, 'UNKNOWN');
  const notProven = listCapabilitiesByTruthLevel(snapshot.capabilityTruth, 'NOT_PROVEN');
  return [
    `Uncertainty level: ${snapshot.overallUncertainty.level} (${snapshot.overallUncertainty.confidencePercent}% confidence).`,
    snapshot.overallUncertainty.rationale,
    '',
    'What I do not know or cannot verify without evidence:',
    bullet([
      ...notProven.slice(0, 4).map((e) => `${e.label} — ${e.detail}`),
      ...unknown.slice(0, 2).map((e) => `${e.label} — not assessed`),
      context.firstBrokenStage
        ? `Downstream proof after ${context.firstBrokenStage} is not established`
        : 'Full launch chain proof status requires Founder Test review',
    ]),
    '',
    `Truth source: ${context.executionTruthSource}.`,
    `Evidence: ${snapshot.evidenceSources.join(', ')}.`,
  ].join('\n');
}

function composeNextStep(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const priorities = snapshot.launchBlockers.slice(0, 3);
  if (priorities.length === 0 && context.firstBrokenStage) {
    priorities.push({
      readOnly: true,
      label: `Repair proof at ${context.firstBrokenStage}`,
      impact: 'HIGH',
      evidenceSource: context.executionTruthSource,
    });
  }
  const lines = ['Prioritized next actions from synchronized proof evidence:', ''];
  priorities.forEach((blocker, index) => {
    lines.push(`Priority ${index + 1}: ${blocker.label}`);
    lines.push(`Evidence: ${blocker.evidenceSource}`);
    lines.push('');
  });
  if (context.firstBrokenStage) {
    lines.push(`First broken execution stage: ${context.firstBrokenStage}.`);
  }
  if (priorities.length === 0) {
    lines.push('Priority 1: Run Founder Test to refresh execution proof and review blockers.');
  }
  return lines.join('\n').trim();
}

function composeWeakness(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const weakness = highestImpactWeakness(snapshot.capabilityTruth);
  if (!weakness) {
    return [
      'No single high-impact weakness dominates the synchronized capability truth registry — review Founder Test for launch blockers.',
      '',
      buildExecutionTruthSummary(context),
    ].join('\n');
  }
  return [
    `Biggest operational weakness right now: ${weakness.label} (${weakness.truthLevel}).`,
    weakness.detail,
    '',
    context.firstBrokenStage
      ? `First broken execution stage: ${context.firstBrokenStage}.`
      : 'Execution chain appears connected in synchronized truth — verify with Founder Test.',
    '',
    `Truth source: ${weakness.evidenceSource}.`,
  ].join('\n');
}

function composeLaunchBlockers(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Launch blockers from synchronized evidence snapshot:',
    '',
    snapshot.launchBlockers.length
      ? bullet(snapshot.launchBlockers.map((b) => `${b.label} [${b.impact}] — ${b.evidenceSource}`))
      : '• No blockers recorded — still verify with Founder Test before launch.',
    '',
    context.firstBrokenStage ? `First broken stage: ${context.firstBrokenStage}.` : '',
    `Typecheck: ${context.repositoryTypecheckReality.state}. Build proof: ${snapshot.buildProofLevel}.`,
    context.founderTestReality.available ? `Latest Founder Test verdict: ${context.founderTestReality.verdict}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function composeProofRequest(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Proof must come from DevPulse reality authorities — not chat assertions.',
    '',
    bullet([
      'Connected Execution Chain Truth — synchronized BUILD/RUNTIME/PREVIEW/VERIFY/LAUNCH proof',
      'Founder Test — orchestrated launch readiness and chat stress evidence',
      'Connected Build Execution — artifact materialization on disk',
      'Repository Typecheck Reality — compile baseline',
      'Validation scripts — bounded feature proofs (not full launch proof alone)',
    ]),
    '',
    `Current synchronized snapshot: first broken stage ${context.firstBrokenStage ?? 'none'}; typecheck ${context.repositoryTypecheckReality.state}; build ${snapshot.buildProofLevel}.`,
    '',
    'Ask for a specific stage or authority if you want the exact evidence object.',
  ].join('\n');
}

function composeTruthSource(context: OperationalTruthContext, message?: string): string {
  if (message && /\b(how do you know|what evidence are you using)\b/i.test(message)) {
    return buildEvidenceBasisAnswer(context);
  }
  return buildTruthSourceAnswer(context);
}

function composeCapabilities(context: OperationalTruthContext, message?: string): string {
  if (message && /\bcan you run applications?\b/i.test(message)) {
    return buildRuntimeCapabilityAnswer(context);
  }

  if (message && /\bcan you preview applications?\b/i.test(message)) {
    return buildPreviewCapabilityAnswer(context);
  }

  if (message && /\bcapability inventory\b/i.test(message)) {
    return buildExecutionStageInventoryAnswer(context);
  }

  return [
    'Current capabilities by synchronized proof level:',
    '',
    bullet(
      context.stageInventory.map((stage) => `${stage.label}: ${stage.status} (${stage.source})`),
    ),
    '',
    context.executionChainTruth.launchProven
      ? 'Launch execution is PROVEN in synchronized chain truth — still confirm with Founder Test before external launch.'
      : 'I should not claim end-to-end launch execution until LAUNCH is PROVEN in synchronized execution chain truth.',
    '',
    `Truth source: ${context.executionTruthSource}.`,
    `Operational truth context: ${context.version}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeLaunchReadiness(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const ready =
    context.chainConnected &&
    context.executionChainTruth.launchProven &&
    context.repositoryTypecheckReality.clean &&
    snapshot.buildProofLevel === 'PROVEN' &&
    snapshot.launchBlockers.length === 0;
  return [
    ready
      ? 'Synchronized execution truth suggests core proof gates are passing — still confirm with Founder Test before external launch.'
      : 'Not launch-ready from synchronized evidence — blockers remain.',
    '',
    buildExecutionTruthSummary(context),
    '',
    bullet([
      `Repository typecheck: ${context.repositoryTypecheckReality.state}`,
      `Build proof: ${snapshot.buildProofLevel}`,
      `Uncertainty: ${snapshot.overallUncertainty.level}`,
      context.founderTestReality.available
        ? `Latest Founder Test verdict: ${context.founderTestReality.verdict}`
        : 'Latest Founder Test verdict: not recorded in this session',
    ]),
    '',
    snapshot.launchBlockers.length
      ? `Blockers:\n${bullet(snapshot.launchBlockers.slice(0, 4).map((b) => b.label))}`
      : '',
    '',
    `Truth source: ${context.executionTruthSource}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeDisconnected(context: OperationalTruthContext, snapshot: OperationalEvidenceSnapshot): string {
  const disconnected = listCapabilitiesByTruthLevel(snapshot.capabilityTruth, 'NOT_PROVEN');
  return [
    'Disconnected or unproven systems from synchronized execution proof chain:',
    '',
    disconnected.length
      ? bullet(disconnected.map((e) => `${e.label} — ${e.truthLevel} (${e.evidenceSource})`))
      : '• No NOT_PROVEN capability entries in synchronized truth — verify with Founder Test.',
    '',
    context.firstBrokenStage
      ? `First broken link in chain: ${context.firstBrokenStage}.`
      : 'Run Founder Test for the authoritative disconnected-system report.',
  ].join('\n');
}

export function composeOperationalSelfKnowledgeResponse(input: {
  kind: OperationalQuestionKind;
  snapshot: OperationalEvidenceSnapshot;
  message?: string;
}): string {
  const context = resolveTruthContext(input.snapshot);

  switch (input.kind) {
    case 'SELF_AWARENESS':
      return composeSelfAwareness(context, input.snapshot);
    case 'TRUST':
      return composeTrust(context, input.snapshot);
    case 'LIMITATIONS':
      return composeLimitations(context, input.snapshot);
    case 'UNCERTAINTY':
      return composeUncertainty(context, input.snapshot);
    case 'NEXT_STEP':
      return composeNextStep(context, input.snapshot);
    case 'WEAKNESS':
      return composeWeakness(context, input.snapshot);
    case 'FIRST_BROKEN_STAGE':
      return buildFirstBrokenStageAnswer(context);
    case 'LAUNCH_BLOCKERS':
      return composeLaunchBlockers(context, input.snapshot);
    case 'PROOF_REQUEST':
      return composeProofRequest(context, input.snapshot);
    case 'TRUTH_SOURCE':
      return composeTruthSource(context, input.message);
    case 'EXECUTION_STAGE_INVENTORY':
      return buildExecutionStageInventoryAnswer(context);
    case 'CAPABILITIES':
      return composeCapabilities(context, input.message);
    case 'LAUNCH_READINESS':
      return composeLaunchReadiness(context, input.snapshot);
    case 'DISCONNECTED_SYSTEMS':
      return composeDisconnected(context, input.snapshot);
    default:
      return '';
  }
}

export function buildOperationalSelfKnowledgeAssessment(input: {
  message: string;
  kind: OperationalQuestionKind;
  snapshot: OperationalEvidenceSnapshot;
}): OperationalSelfKnowledgeAssessment {
  const context = resolveTruthContext(input.snapshot);
  const responseText = composeOperationalSelfKnowledgeResponse({
    kind: input.kind,
    snapshot: input.snapshot,
    message: input.message,
  });

  const responseContradictions = responseContradictsExecutionTruth({
    executionChainTruth: input.snapshot.executionChainTruth,
    responseText,
  });

  const chatOperationalContradictions = detectChatOperationalContradictions({
    context: {
      executionChainTruth: context.executionChainTruth,
      stageInventory: context.stageInventory,
      executionTruthSource: context.executionTruthSource,
      capabilityTruth: input.snapshot.capabilityTruth,
    },
    responseText,
    questionCategory: input.kind,
  });

  return {
    readOnly: true,
    questionKind: input.kind,
    snapshot: input.snapshot,
    responseText,
    usedEvidenceSources: input.snapshot.evidenceSources,
    admitsLimitations: /\b(not proven|unproven|cannot|can't|limit|unknown|uncertain|not conscious|not sentient)\b/i.test(
      responseText,
    ),
    referencesProofSystems: /\b(founder test|evidence|proof|validation|authority|typecheck|execution chain truth)\b/i.test(
      responseText,
    ),
    referencesFirstBrokenStage: context.firstBrokenStage
      ? responseText.includes(context.firstBrokenStage)
      : /\bfirst broken\b/i.test(responseText),
    consciousnessClaimBlocked: !CONSCIOUSNESS_CLAIM_PATTERNS.some((p) => p.test(responseText)),
    executionTruthSource: context.executionTruthSource,
    executionTruthGeneratedAt: context.executionTruthGeneratedAt,
    chainConnected: context.chainConnected,
    firstBrokenStage: context.firstBrokenStage,
    truthSourceContradictionCount:
      input.snapshot.truthSourceContradictions.length + responseContradictions.length,
    chatOperationalContradictionCount: chatOperationalContradictions.length,
  };
}

export function stripConsciousnessClaims(text: string): string {
  for (const pattern of CONSCIOUSNESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      const generatedAt = new Date().toISOString();
      const emptySnapshot: OperationalEvidenceSnapshot = {
        readOnly: true,
        generatedAt,
        capabilityTruth: {
          readOnly: true,
          generatedAt,
          entries: [],
          provenCount: 0,
          partiallyProvenCount: 0,
          notProvenCount: 0,
          unknownCount: 0,
        },
        overallUncertainty: {
          readOnly: true,
          level: 'UNVERIFIED',
          confidencePercent: 40,
          rationale: 'Consciousness claim blocked — reverting to operational self-knowledge.',
          evidenceSource: 'chat-operational-self-knowledge',
        },
        executionChainTruth: {
          readOnly: true,
          requirementsProven: false,
          planProven: false,
          buildProven: false,
          runtimeProven: false,
          previewProven: false,
          verificationProven: false,
          launchProven: false,
          chainConnected: false,
          firstBrokenStage: null,
          generatedAt,
          sourceAuthority: 'connected-execution-chain-stage-resolver',
        },
        executionTruthGeneratedAt: generatedAt,
        executionTruthSource: 'connected-execution-chain-stage-resolver',
        firstBrokenStage: null,
        executionChainConnected: false,
        launchBlockers: [],
        typecheckState: 'UNKNOWN',
        typecheckClean: false,
        buildProofLevel: 'UNKNOWN',
        chatIntelligenceNote: null,
        founderTestVerdict: null,
        truthSourceContradictions: [],
        operationalTruthContext: buildOperationalTruthContext({
          readOnly: true,
          generatedAt,
          capabilityTruth: {
            readOnly: true,
            generatedAt,
            entries: [],
            provenCount: 0,
            partiallyProvenCount: 0,
            notProvenCount: 0,
            unknownCount: 0,
          },
          overallUncertainty: {
            readOnly: true,
            level: 'UNVERIFIED',
            confidencePercent: 40,
            rationale: 'Consciousness claim blocked — reverting to operational self-knowledge.',
            evidenceSource: 'chat-operational-self-knowledge',
          },
          executionChainTruth: {
            readOnly: true,
            requirementsProven: false,
            planProven: false,
            buildProven: false,
            runtimeProven: false,
            previewProven: false,
            verificationProven: false,
            launchProven: false,
            chainConnected: false,
            firstBrokenStage: null,
            generatedAt,
            sourceAuthority: 'connected-execution-chain-stage-resolver',
          },
          executionTruthGeneratedAt: generatedAt,
          executionTruthSource: 'connected-execution-chain-stage-resolver',
          firstBrokenStage: null,
          executionChainConnected: false,
          launchBlockers: [],
          typecheckState: 'UNKNOWN',
          typecheckClean: false,
          buildProofLevel: 'UNKNOWN',
          chatIntelligenceNote: null,
          founderTestVerdict: null,
          truthSourceContradictions: [],
          evidenceSources: ['chat-operational-self-knowledge'],
        }),
        evidenceSources: ['chat-operational-self-knowledge'],
      };
      return composeSelfAwareness(emptySnapshot.operationalTruthContext, emptySnapshot);
    }
  }
  return text;
}
