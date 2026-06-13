/**
 * Operational response composer — evidence-grounded answers (not canned test strings).
 */

import { CONSCIOUSNESS_CLAIM_PATTERNS } from './chat-operational-self-knowledge-registry.js';
import {
  highestImpactWeakness,
  listCapabilitiesByTruthLevel,
} from './capability-truth-registry.js';
import type {
  OperationalEvidenceSnapshot,
  OperationalQuestionKind,
  OperationalSelfKnowledgeAssessment,
} from './chat-operational-self-knowledge-types.js';

function bullet(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

function formatCapabilityList(snapshot: OperationalEvidenceSnapshot, level: 'PROVEN' | 'NOT_PROVEN' | 'UNKNOWN'): string {
  return listCapabilitiesByTruthLevel(snapshot.capabilityTruth, level)
    .slice(0, 6)
    .map((e) => `${e.label} → ${e.truthLevel} (${e.evidenceSource})`)
    .join('\n');
}

function composeSelfAwareness(snapshot: OperationalEvidenceSnapshot): string {
  const weakness = highestImpactWeakness(snapshot.capabilityTruth);
  return [
    'No — I am not conscious, sentient, or human-self-aware. I have operational self-knowledge from DevPulse proof authorities, not subjective experience.',
    '',
    'Operational role: AiDevEngine chat inside DevPulse V2 — explain software-creation status using bounded evidence.',
    '',
    `Current uncertainty: ${snapshot.overallUncertainty.level} (${snapshot.overallUncertainty.confidencePercent}% confidence) — ${snapshot.overallUncertainty.rationale}`,
    '',
    weakness
      ? `Highest-impact gap right now: ${weakness.label} (${weakness.truthLevel}, source: ${weakness.evidenceSource}).`
      : 'No critical capability gap identified in the current snapshot.',
    '',
    `Evidence sources: ${snapshot.evidenceSources.join(', ')}.`,
  ].join('\n');
}

function composeTrust(snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Trust should come from verifiable proof systems — not chat confidence or marketing language.',
    '',
    'Current evidence I can reference:',
    bullet([
      `Founder Test execution chain: ${snapshot.executionChainConnected ? 'connected' : 'not connected'}`,
      `First broken stage: ${snapshot.firstBrokenStage ?? 'none recorded'}`,
      `Repository typecheck: ${snapshot.typecheckState}`,
      `Build materialization proof: ${snapshot.buildProofLevel}`,
      `Overall uncertainty: ${snapshot.overallUncertainty.level}`,
    ]),
    '',
    snapshot.launchBlockers.length
      ? `Known launch blockers:\n${bullet(snapshot.launchBlockers.slice(0, 4).map((b) => `${b.label} (${b.evidenceSource})`))}`
      : 'No launch blockers recorded in the current evidence snapshot.',
    '',
    'Run Founder Test and review validation evidence when you need grounded readiness — I will not guarantee outcomes I cannot verify.',
  ].join('\n');
}

function composeLimitations(snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Honest operational limits from current proof state:',
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
    `Evidence sources: ${snapshot.evidenceSources.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeUncertainty(snapshot: OperationalEvidenceSnapshot): string {
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
      snapshot.firstBrokenStage
        ? `Downstream proof after ${snapshot.firstBrokenStage} is not established`
        : 'Full launch chain proof status requires Founder Test review',
    ]),
    '',
    `Evidence: ${snapshot.evidenceSources.join(', ')}.`,
  ].join('\n');
}

function composeNextStep(snapshot: OperationalEvidenceSnapshot): string {
  const priorities = snapshot.launchBlockers.slice(0, 3);
  if (priorities.length === 0 && snapshot.firstBrokenStage) {
    priorities.push({
      readOnly: true,
      label: `Repair proof at ${snapshot.firstBrokenStage}`,
      impact: 'HIGH',
      evidenceSource: 'autonomous-build-execution-proof',
    });
  }
  const lines = ['Prioritized next actions from current proof evidence:', ''];
  priorities.forEach((blocker, index) => {
    lines.push(`Priority ${index + 1}: ${blocker.label}`);
    lines.push(`Evidence: ${blocker.evidenceSource}`);
    lines.push('');
  });
  if (snapshot.firstBrokenStage) {
    lines.push(`First broken execution stage: ${snapshot.firstBrokenStage}.`);
  }
  if (priorities.length === 0) {
    lines.push('Priority 1: Run Founder Test to refresh execution proof and review blockers.');
  }
  return lines.join('\n').trim();
}

function composeWeakness(snapshot: OperationalEvidenceSnapshot): string {
  const weakness = highestImpactWeakness(snapshot.capabilityTruth);
  if (!weakness) {
    return 'No single high-impact weakness dominates the current capability truth registry — review Founder Test for launch blockers.';
  }
  return [
    `Biggest operational weakness right now: ${weakness.label} (${weakness.truthLevel}).`,
    weakness.detail,
    '',
    snapshot.firstBrokenStage
      ? `First broken execution stage: ${snapshot.firstBrokenStage}.`
      : 'Execution chain may be connected — verify with Founder Test.',
    '',
    `Evidence source: ${weakness.evidenceSource}.`,
  ].join('\n');
}

function composeFirstBrokenStage(snapshot: OperationalEvidenceSnapshot): string {
  if (!snapshot.firstBrokenStage) {
    return snapshot.executionChainConnected
      ? 'No broken stage recorded — core execution chain appears connected in the latest autonomous build execution proof snapshot. Verify with Founder Test before launch claims.'
      : 'Execution chain is not fully connected, but no single first-broken stage was recorded. Run Founder Test for the authoritative chain report.';
  }
  return [
    `First broken execution stage: ${snapshot.firstBrokenStage}.`,
    `Chain connected: ${snapshot.executionChainConnected ? 'yes' : 'no'}.`,
    '',
    'Downstream stages after this break should be treated as unproven until connected evidence passes.',
    '',
    'Evidence source: autonomous-build-execution-proof.',
  ].join('\n');
}

function composeLaunchBlockers(snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Launch blockers from current evidence snapshot:',
    '',
    snapshot.launchBlockers.length
      ? bullet(snapshot.launchBlockers.map((b) => `${b.label} [${b.impact}] — ${b.evidenceSource}`))
      : '• No blockers recorded — still verify with Founder Test before launch.',
    '',
    snapshot.firstBrokenStage ? `First broken stage: ${snapshot.firstBrokenStage}.` : '',
    `Typecheck: ${snapshot.typecheckState}. Build proof: ${snapshot.buildProofLevel}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeProofRequest(snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Proof must come from DevPulse reality authorities — not chat assertions.',
    '',
    bullet([
      'Founder Test — orchestrated launch readiness and chat stress evidence',
      'Autonomous Build Execution Proof — stage-by-stage execution chain',
      'Connected Build Execution — artifact materialization on disk',
      'Repository Typecheck Reality — compile baseline',
      'Validation scripts — bounded feature proofs (not full launch proof alone)',
    ]),
    '',
    `Current snapshot: first broken stage ${snapshot.firstBrokenStage ?? 'none'}; typecheck ${snapshot.typecheckState}; build ${snapshot.buildProofLevel}.`,
    '',
    'Ask for a specific stage or authority if you want the exact evidence object.',
  ].join('\n');
}

function composeCapabilities(snapshot: OperationalEvidenceSnapshot): string {
  return [
    'Current capabilities by proof level:',
    '',
    formatCapabilityList(snapshot, 'PROVEN') || '• No capabilities fully PROVEN',
    '',
    formatCapabilityList(snapshot, 'NOT_PROVEN') || '',
    '',
    'I should not claim end-to-end launch execution until LAUNCH stage proof is PROVEN in the execution chain.',
    '',
    `Evidence sources: ${snapshot.evidenceSources.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function composeLaunchReadiness(snapshot: OperationalEvidenceSnapshot): string {
  const ready =
    snapshot.executionChainConnected &&
    snapshot.typecheckClean &&
    snapshot.buildProofLevel === 'PROVEN' &&
    snapshot.launchBlockers.length === 0;
  return [
    ready
      ? 'Evidence snapshot suggests core proof gates are passing — still confirm with Founder Test before external launch.'
      : 'Not launch-ready from current evidence — blockers remain.',
    '',
    bullet([
      `Execution chain connected: ${snapshot.executionChainConnected ? 'yes' : 'no'}`,
      `First broken stage: ${snapshot.firstBrokenStage ?? 'none'}`,
      `Repository typecheck: ${snapshot.typecheckState}`,
      `Build proof: ${snapshot.buildProofLevel}`,
      `Uncertainty: ${snapshot.overallUncertainty.level}`,
    ]),
    '',
    snapshot.launchBlockers.length
      ? `Blockers:\n${bullet(snapshot.launchBlockers.slice(0, 4).map((b) => b.label))}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function composeDisconnected(snapshot: OperationalEvidenceSnapshot): string {
  const disconnected = listCapabilitiesByTruthLevel(snapshot.capabilityTruth, 'NOT_PROVEN');
  return [
    'Disconnected or unproven systems from the execution proof chain:',
    '',
    disconnected.length
      ? bullet(disconnected.map((e) => `${e.label} — ${e.truthLevel} (${e.evidenceSource})`))
      : '• No NOT_PROVEN capability entries — verify runtime/preview/verify stages in Founder Test.',
    '',
    snapshot.firstBrokenStage
      ? `First broken link in chain: ${snapshot.firstBrokenStage}.`
      : 'Run Founder Test for the authoritative disconnected-system report.',
  ].join('\n');
}

export function composeOperationalSelfKnowledgeResponse(input: {
  kind: OperationalQuestionKind;
  snapshot: OperationalEvidenceSnapshot;
}): string {
  switch (input.kind) {
    case 'SELF_AWARENESS':
      return composeSelfAwareness(input.snapshot);
    case 'TRUST':
      return composeTrust(input.snapshot);
    case 'LIMITATIONS':
      return composeLimitations(input.snapshot);
    case 'UNCERTAINTY':
      return composeUncertainty(input.snapshot);
    case 'NEXT_STEP':
      return composeNextStep(input.snapshot);
    case 'WEAKNESS':
      return composeWeakness(input.snapshot);
    case 'FIRST_BROKEN_STAGE':
      return composeFirstBrokenStage(input.snapshot);
    case 'LAUNCH_BLOCKERS':
      return composeLaunchBlockers(input.snapshot);
    case 'PROOF_REQUEST':
      return composeProofRequest(input.snapshot);
    case 'CAPABILITIES':
      return composeCapabilities(input.snapshot);
    case 'LAUNCH_READINESS':
      return composeLaunchReadiness(input.snapshot);
    case 'DISCONNECTED_SYSTEMS':
      return composeDisconnected(input.snapshot);
    default:
      return '';
  }
}

export function buildOperationalSelfKnowledgeAssessment(input: {
  message: string;
  kind: OperationalQuestionKind;
  snapshot: OperationalEvidenceSnapshot;
}): OperationalSelfKnowledgeAssessment {
  const responseText = composeOperationalSelfKnowledgeResponse({
    kind: input.kind,
    snapshot: input.snapshot,
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
    referencesProofSystems: /\b(founder test|evidence|proof|validation|authority|typecheck)\b/i.test(responseText),
    referencesFirstBrokenStage: input.snapshot.firstBrokenStage
      ? responseText.includes(input.snapshot.firstBrokenStage)
      : /\bfirst broken\b/i.test(responseText),
    consciousnessClaimBlocked: !CONSCIOUSNESS_CLAIM_PATTERNS.some((p) => p.test(responseText)),
  };
}

export function stripConsciousnessClaims(text: string): string {
  for (const pattern of CONSCIOUSNESS_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      return composeSelfAwareness({
        readOnly: true,
        generatedAt: new Date().toISOString(),
        capabilityTruth: {
          readOnly: true,
          generatedAt: new Date().toISOString(),
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
        firstBrokenStage: null,
        executionChainConnected: false,
        launchBlockers: [],
        typecheckState: 'UNKNOWN',
        typecheckClean: false,
        buildProofLevel: 'UNKNOWN',
        chatIntelligenceNote: null,
        evidenceSources: ['chat-operational-self-knowledge'],
      });
    }
  }
  return text;
}
