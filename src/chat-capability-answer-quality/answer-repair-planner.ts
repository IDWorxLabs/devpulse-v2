/**
 * Phase 26.92 — Capability answer scenario matching and repaired canonical answers (V1).
 */

import {
  COMPANY_IDENTITY,
  CURRENT_PRODUCT_NAME,
  FOUNDER_IDENTITY,
  LEGACY_PRODUCT_NAME,
} from '../identity-foundation/legacy-product-identity.js';
import { listCapabilitiesByTruthLevel } from '../chat-operational-self-knowledge/capability-truth-registry.js';
import type { OperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';
import { CAPABILITY_ANSWER_SCENARIOS } from './chat-capability-answer-quality-registry.js';
import type {
  BuildRepairedCapabilityAnswerInput,
  CapabilityAnswerScenarioId,
} from './chat-capability-answer-quality-types.js';

const SCENARIO_PATTERNS: { id: CapabilityAnswerScenarioId; patterns: RegExp[] }[] = [
  {
    id: 'what-is-aidevengine',
    patterns: [
      /\bwhat is aidevengine\b/i,
      /\bwhat's aidevengine\b/i,
      /\bexplain aidevengine\b/i,
      /\btell me about aidevengine\b/i,
    ],
  },
  {
    id: 'who-built-you',
    patterns: [
      /\bwho built you\b/i,
      /\bwho created you\b/i,
      /\bwho made you\b/i,
      /\bwhat product do you represent\b/i,
      /\bwho are you and what product\b/i,
    ],
  },
  {
    id: 'build-from-one-prompt',
    patterns: [
      /\bbuild my whole (app|application)\b/i,
      /\bfrom one prompt\b/i,
      /\bentire application from (a )?single prompt\b/i,
      /\bwhole (app|application) from one (message|prompt)\b/i,
    ],
  },
  {
    id: 'what-can-you-do',
    patterns: [
      /\bwhat can you do\b/i,
      /\bwhat are your capabilities\b/i,
      /\bwhat are you able to do\b/i,
      /\blist your capabilities\b/i,
    ],
  },
];

export function matchCapabilityAnswerScenario(message: string): CapabilityAnswerScenarioId | null {
  const text = message.trim();
  if (!text) return null;
  for (const entry of SCENARIO_PATTERNS) {
    if (entry.patterns.some((p) => p.test(text))) return entry.id;
  }
  return null;
}

function formatCapabilitySection(snapshot: OperationalEvidenceSnapshot, level: 'PROVEN' | 'PARTIALLY_PROVEN' | 'NOT_PROVEN'): string {
  const entries = listCapabilitiesByTruthLevel(snapshot.capabilityTruth, level);
  if (!entries.length) return `• None recorded at ${level} in this snapshot`;
  return entries
    .slice(0, 8)
    .map((e) => `• ${e.label} — ${level} (${e.evidenceSource})`)
    .join('\n');
}

function buildWhatIsAiDevEngineAnswer(snapshot: OperationalEvidenceSnapshot): string {
  const weakness = snapshot.launchBlockers[0]?.label ?? 'areas still under Founder Test validation';
  return [
    `${CURRENT_PRODUCT_NAME} is the current software-creation platform from ${COMPANY_IDENTITY}. It helps founders and builders turn product ideas into validated, evidence-backed software through structured planning, build materialization, runtime proof, and launch readiness checks.`,
    '',
    'What it does today:',
    '• Guides requirements intake, planning, and architecture decisions',
    '• Materializes code into builder workspaces with validation gates',
    '• Runs execution proof (build, runtime, routes, UI) and Founder Test simulations',
    '• Reports honest launch readiness from synchronized proof authorities — not marketing claims',
    '',
    'Who it is for:',
    '• Founders and operators who need bounded, verifiable software creation — not vague AI demos',
    '• Teams that want proof chains (typecheck, build, runtime, launch) before external launch',
    '',
    'Major capabilities by proof level:',
    '',
    'PROVEN:',
    formatCapabilitySection(snapshot, 'PROVEN'),
    '',
    'PARTIAL:',
    formatCapabilitySection(snapshot, 'PARTIALLY_PROVEN'),
    '',
    'NOT PROVEN / unproven in this snapshot:',
    formatCapabilitySection(snapshot, 'NOT_PROVEN'),
    '',
    'Honest limitations:',
    `• I cannot guarantee production launch from chat alone — verify with Founder Test`,
    `• ${weakness} may still block launch readiness`,
    `• ${LEGACY_PRODUCT_NAME} is the historical product name only; ${CURRENT_PRODUCT_NAME} is the current identity`,
    '',
    'Next steps:',
    '• Describe your product goal and run Founder Test for grounded readiness',
    '• Ask about specific execution stages, blockers, or capability boundaries',
  ].join('\n');
}

function buildWhoBuiltYouAnswer(snapshot: OperationalEvidenceSnapshot): string {
  return [
    `I represent ${CURRENT_PRODUCT_NAME}, the current software-creation product from ${COMPANY_IDENTITY}.`,
    '',
    'Identity (verified, not hallucinated):',
    `• Created by ${FOUNDER_IDENTITY}`,
    `• Product: ${CURRENT_PRODUCT_NAME}`,
    `• Company: ${COMPANY_IDENTITY}`,
    '',
    'Company–product relationship:',
    `• ${COMPANY_IDENTITY} builds and operates ${CURRENT_PRODUCT_NAME}`,
    `• ${CURRENT_PRODUCT_NAME} is the founder-facing product identity — not a separate unrelated brand`,
    `• ${LEGACY_PRODUCT_NAME} is the earlier historical name; use it only when discussing migration or repository history`,
    '',
    'Identity proof levels:',
    '• PROVEN: canonical product and company identity from identity foundation (not inferred or hallucinated)',
    `• PARTIAL: live execution proof depends on workspace snapshot (${snapshot.capabilityTruth.provenCount} PROVEN capabilities here)`,
    '• PLANNED: no alternate ownership narratives — unproven claims stay explicitly unproven',
    '',
    'Honest boundary:',
    '• I do not invent alternate founders, companies, or product owners',
    '• When uncertain about execution proof, I say so and point to Founder Test evidence',
    '',
    'Next step: ask what AiDevEngine can do today or run Founder Test for execution proof on your workspace.',
  ].join('\n');
}

function buildFromOnePromptAnswer(snapshot: OperationalEvidenceSnapshot): string {
  return [
    `No — ${CURRENT_PRODUCT_NAME} cannot honestly build your whole application from one prompt alone.`,
    '',
    'What is currently possible:',
    '• Help you clarify requirements, scope, and architecture from an initial idea',
    '• Run bounded planning and validation workflows with evidence gates',
    '• Materialize code into workspaces when upstream proof stages pass',
    '• Report realistic execution and launch readiness from synchronized proof authorities',
    '',
    'What still requires clarification:',
    '• Product scope, user flows, integrations, and acceptance criteria',
    '• Technical constraints, deployment target, and quality bar',
    '• Which capabilities are PROVEN vs PARTIAL vs NOT PROVEN for your workspace',
    '',
    'Realistic capability boundaries:',
    '• PROVEN capabilities only — I will not claim full autonomous delivery without evidence',
    '• PARTIAL capabilities need iteration and validation — not one-shot completion',
    '• PLANNED or unproven areas stay explicitly unproven until Founder Test confirms them',
    '',
    'Expected workflow:',
    '1. Describe the product goal and constraints',
    '2. Plan and validate architecture with explicit gates',
    '3. Materialize and verify build/runtime/route/UI proof',
    '4. Run Founder Test before treating launch as proven',
    '',
    `Current snapshot: ${snapshot.capabilityTruth.provenCount} PROVEN, ${snapshot.capabilityTruth.notProvenCount} NOT PROVEN capabilities.`,
    '',
    'Next step: share your product goal and I will outline a realistic, bounded build path.',
  ].join('\n');
}

function buildWhatCanYouDoAnswer(snapshot: OperationalEvidenceSnapshot): string {
  return [
    `Here is what ${CURRENT_PRODUCT_NAME} can do today — grouped by proof level, not generic AI marketing:`,
    '',
    'Planning & architecture:',
    '• Requirements intake, planning gates, and architecture guidance tied to execution proof',
    '',
    'Validation & code generation:',
    '• Repository typecheck reality, build materialization, and workspace-scoped code generation',
    '• Validation scripts and proof authorities — bounded by what has actually passed',
    '',
    'Execution proof:',
    '• Build, runtime startup, route reachability, and UI render proof when connected chain truth supports it',
    '',
    'Founder testing & launch readiness:',
    '• Founder Test chat stress, product readiness simulation, and launch readiness reconciliation',
    '• Honest blocker reporting — I will not claim launch is proven without synchronized evidence',
    '',
    'Capabilities by proof level:',
    '',
    'PROVEN:',
    formatCapabilitySection(snapshot, 'PROVEN'),
    '',
    'PARTIAL:',
    formatCapabilitySection(snapshot, 'PARTIALLY_PROVEN'),
    '',
    'NOT PROVEN:',
    formatCapabilitySection(snapshot, 'NOT_PROVEN'),
    '',
    'Current limitations:',
    `• Uncertainty level: ${snapshot.overallUncertainty.level} (${snapshot.overallUncertainty.confidencePercent}% confidence)`,
    snapshot.launchBlockers.length
      ? `• Known blockers: ${snapshot.launchBlockers.slice(0, 3).map((b) => b.label).join('; ')}`
      : '• No launch blockers recorded in this snapshot — still confirm with Founder Test',
    '',
    'Next steps:',
    '• Ask about a specific stage (build, runtime, launch) or run Founder Test for full readiness',
    '• Request capability boundaries for any feature before assuming it is production-ready',
  ].join('\n');
}

export function buildRepairedCapabilityAnswer(input: BuildRepairedCapabilityAnswerInput): string {
  const { scenarioId, snapshot } = input;
  switch (scenarioId) {
    case 'what-is-aidevengine':
      return buildWhatIsAiDevEngineAnswer(snapshot);
    case 'who-built-you':
      return buildWhoBuiltYouAnswer(snapshot);
    case 'build-from-one-prompt':
      return buildFromOnePromptAnswer(snapshot);
    case 'what-can-you-do':
      return buildWhatCanYouDoAnswer(snapshot);
    default:
      return `I represent ${CURRENT_PRODUCT_NAME}. Ask a specific capability question and I will answer with bounded, evidence-backed honesty.`;
  }
}

export function getCapabilityAnswerScenarioDefinition(scenarioId: CapabilityAnswerScenarioId) {
  return CAPABILITY_ANSWER_SCENARIOS.find((s) => s.id === scenarioId) ?? null;
}

export function planCapabilityAnswerRepair(input: {
  scenarioId: CapabilityAnswerScenarioId;
  missingTopics: readonly string[];
  honestyViolations: readonly string[];
  boundaryIssues: readonly string[];
  passed: boolean;
}): {
  readOnly: true;
  scenarioId: CapabilityAnswerScenarioId;
  repairRequired: boolean;
  actions: readonly string[];
  missingTopics: readonly string[];
  reason: string | null;
} {
  if (input.passed) {
    return {
      readOnly: true,
      scenarioId: input.scenarioId,
      repairRequired: false,
      actions: [],
      missingTopics: [],
      reason: null,
    };
  }
  const actions: string[] = [];
  if (input.missingTopics.length) {
    actions.push(`Cover missing topics: ${input.missingTopics.join(', ')}`);
  }
  if (input.honestyViolations.length) {
    actions.push('Remove overclaims and add honest capability caveats');
  }
  if (input.boundaryIssues.length) {
    actions.push('Separate PROVEN, PARTIAL, and PLANNED capabilities explicitly');
  }
  actions.push('Route through buildRepairedCapabilityAnswer for canonical founder-facing response');
  return {
    readOnly: true,
    scenarioId: input.scenarioId,
    repairRequired: true,
    actions,
    missingTopics: input.missingTopics,
    reason: actions.join('; '),
  };
}
