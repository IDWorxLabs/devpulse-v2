/**
 * Chat Operational Contradiction Detector — same-session truth conflicts (Phase 26.84).
 */

import type { CapabilityTruthRegistry } from './chat-operational-self-knowledge-types.js';
import type {
  ChatOperationalContradiction,
  ExecutionStageInventoryEntry,
} from './chat-operational-self-knowledge-types.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { CHAT_OPERATIONAL_CONTRADICTION } from './chat-operational-self-knowledge-types.js';

const STAGE_CAPABILITY_MAP: Array<{
  stageId: string;
  capabilityId: string;
  truthKey: keyof Pick<
    ConnectedExecutionChainTruth,
    'buildProven' | 'runtimeProven' | 'previewProven' | 'verificationProven' | 'launchProven'
  >;
}> = [
  { stageId: 'BUILD', capabilityId: 'build_materialization', truthKey: 'buildProven' },
  { stageId: 'RUNTIME', capabilityId: 'runtime_execution', truthKey: 'runtimeProven' },
  { stageId: 'PREVIEW', capabilityId: 'preview_execution', truthKey: 'previewProven' },
  { stageId: 'VERIFY', capabilityId: 'verification_execution', truthKey: 'verificationProven' },
  { stageId: 'LAUNCH', capabilityId: 'launch_execution', truthKey: 'launchProven' },
];

function chainValueLabel(proven: boolean): string {
  return proven ? 'proven=true' : 'proven=false';
}

export function detectChatOperationalContradictions(input: {
  context: {
    executionChainTruth: ConnectedExecutionChainTruth;
    stageInventory: readonly ExecutionStageInventoryEntry[];
    executionTruthSource: string;
    capabilityTruth: CapabilityTruthRegistry;
  };
  responseText?: string;
  questionCategory?: string;
}): ChatOperationalContradiction[] {
  const contradictions: ChatOperationalContradiction[] = [];
  const { executionChainTruth, stageInventory, executionTruthSource, capabilityTruth } = input.context;

  for (const mapping of STAGE_CAPABILITY_MAP) {
    const chainProven = executionChainTruth[mapping.truthKey];
    const inventory = stageInventory.find((s) => s.stageId === mapping.stageId);
    const capability = capabilityTruth.entries.find((e) => e.capabilityId === mapping.capabilityId);

    if (inventory && chainProven !== inventory.proven) {
      contradictions.push({
        readOnly: true,
        kind: CHAT_OPERATIONAL_CONTRADICTION,
        questionCategory: input.questionCategory ?? 'internal-snapshot',
        conflictingSources: [CONNECTED_TRUTH_LABEL, 'stage-inventory'],
        conflictingValues: [chainValueLabel(chainProven), chainValueLabel(inventory.proven)],
        detail: `${mapping.stageId} chain truth disagrees with stage inventory`,
      });
    }

    if (capability && chainProven && capability.truthLevel === 'NOT_PROVEN') {
      contradictions.push({
        readOnly: true,
        kind: CHAT_OPERATIONAL_CONTRADICTION,
        questionCategory: input.questionCategory ?? 'capability-registry',
        conflictingSources: [executionTruthSource, capability.evidenceSource],
        conflictingValues: [chainValueLabel(true), `${capability.label}: NOT_PROVEN`],
        detail: `${mapping.stageId} proven in chain truth but NOT_PROVEN in capability registry`,
      });
    }
  }

  if (input.responseText) {
    contradictions.push(
      ...detectResponseContradictions({
        responseText: input.responseText,
        executionChainTruth,
        executionTruthSource,
        questionCategory: input.questionCategory ?? 'response',
      }),
    );
  }

  return contradictions;
}

const CONNECTED_TRUTH_LABEL = 'ConnectedExecutionChainTruth';

export function detectResponseContradictions(input: {
  responseText: string;
  executionChainTruth: ConnectedExecutionChainTruth;
  executionTruthSource: string;
  questionCategory: string;
}): ChatOperationalContradiction[] {
  const contradictions: ChatOperationalContradiction[] = [];
  const text = input.responseText;

  if (
    input.executionTruthSource &&
    /\b(do not have access|don't have access|no connected execution truth|unknown truth source)\b/i.test(text)
  ) {
    contradictions.push({
      readOnly: true,
      kind: CHAT_OPERATIONAL_CONTRADICTION,
      questionCategory: input.questionCategory,
      conflictingSources: [input.executionTruthSource, 'response-denial'],
      conflictingValues: [input.executionTruthSource, 'no access claimed'],
      detail: 'Response denies execution truth source while synchronized context has one',
    });
  }

  const stageChecks: Array<{
    proven: boolean;
    patterns: RegExp[];
    stage: string;
  }> = [
    {
      stage: 'RUNTIME',
      proven: input.executionChainTruth.runtimeProven,
      patterns: [/\bruntime\b[^.\n]{0,40}\bunproven\b/i, /\bruntime\b[^.\n]{0,40}\bnot proven\b/i],
    },
    {
      stage: 'PREVIEW',
      proven: input.executionChainTruth.previewProven,
      patterns: [
        /\bpreview\b[^.\n]{0,40}\bunproven\b/i,
        /\bpreview\b[^.\n]{0,40}\bnot proven\b/i,
        /\bpartially proven\b/i,
      ],
    },
    {
      stage: 'BUILD',
      proven: input.executionChainTruth.buildProven,
      patterns: [/\bbuild\b[^.\n]{0,40}\bunproven\b/i, /\bbuild\b[^.\n]{0,40}\bnot proven\b/i],
    },
  ];

  for (const check of stageChecks) {
    if (!check.proven) continue;
    if (!check.patterns.some((p) => p.test(text))) continue;
    contradictions.push({
      readOnly: true,
      kind: CHAT_OPERATIONAL_CONTRADICTION,
      questionCategory: input.questionCategory,
      conflictingSources: [input.executionTruthSource, 'response-text'],
      conflictingValues: [`${check.stage} proven=true`, `${check.stage} unproven in response`],
      detail: `Response reports ${check.stage} unproven while chain truth says proven`,
    });
  }

  return contradictions;
}
