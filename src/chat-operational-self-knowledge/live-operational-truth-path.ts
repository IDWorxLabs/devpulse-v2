/**
 * Live Operational Truth Path — enforce ConnectedExecutionChainTruth on live chat (Phase 26.83).
 */

import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import {
  classifyOperationalQuestion,
  isOperationalSelfKnowledgeQuestion,
} from './operational-question-classifier.js';
import { responseContradictsExecutionTruth } from './operational-truth-source-contradiction-detector.js';
import type {
  LiveOperationalTruthBypass,
  OperationalEvidenceSnapshot,
  OperationalQuestionKind,
  OperationalTruthPath,
} from './chat-operational-self-knowledge-types.js';
import { LIVE_OPERATIONAL_TRUTH_BYPASS } from './chat-operational-self-knowledge-types.js';
import { detectChatOperationalContradictions } from './chat-operational-contradiction-detector.js';
import { OPERATIONAL_TRUTH_CONTEXT_VERSION } from './operational-truth-context.js';

export const EXECUTION_STAGE_OPERATIONAL_KINDS = new Set<OperationalQuestionKind>([
  'FIRST_BROKEN_STAGE',
  'LAUNCH_READINESS',
  'LAUNCH_BLOCKERS',
  'WEAKNESS',
  'CAPABILITIES',
  'IDENTITY',
  'SELF_AWARENESS',
  'LIMITATIONS',
  'TRUST',
  'UNCERTAINTY',
  'TRUTH_SOURCE',
  'EXECUTION_STAGE_INVENTORY',
  'PROOF_REQUEST',
  'LAUNCH_NOT_PROVEN',
  'FIRST_LAUNCH_BLOCKER',
  'LAUNCH_FIX_REQUIRED',
]);

const EXECUTION_STAGE_MESSAGE_PATTERNS: RegExp[] = [
  /\bfirst broken stage\b/i,
  /\bcurrent first broken stage\b/i,
  /\bcan you run applications?\b/i,
  /\bcan you preview applications?\b/i,
  /\btop (three|3) launch blockers?\b/i,
  /\bwhat blocks launch\b/i,
  /\bexecution status\b/i,
  /\bexecution chain\b/i,
  /\bare you ready to (be )?launch/i,
  /\bcan you be launch/i,
  /\bwhat execution truth source\b/i,
  /\bexecution truth source are you (currently )?using\b/i,
  /\bwhat evidence are you using\b/i,
  /\bhow do you know this\b/i,
  /\blist all execution stages\b/i,
  /\bexecution stages and their (?:current )?status\b/i,
  /\bsystem status\b/i,
  /\bcapability inventory\b/i,
  /\bwhat is aidevengine\b/i,
  /\bwho built you\b/i,
  /\bwhat can you do\b/i,
  /\bbuild my whole (app|application)\b/i,
  /\bfrom one prompt\b/i,
  /\bwhy is launch not proven\b/i,
  /\bwhat is preventing launch\b/i,
  /\bfirst launch blocker\b/i,
  /\bwhat do i need to fix before launch\b/i,
];

export function inferExecutionStageQuestionKind(message: string): OperationalQuestionKind {
  const classified = classifyOperationalQuestion(message);
  if (classified !== 'GENERAL') return classified;
  if (/\bfirst broken stage\b/i.test(message)) return 'FIRST_BROKEN_STAGE';
  if (/\bcan you run applications?\b/i.test(message)) return 'CAPABILITIES';
  if (/\bcan you preview applications?\b/i.test(message)) return 'CAPABILITIES';
  if (/\b(what execution truth source|execution truth source are you|what evidence are you using|how do you know this)\b/i.test(message)) {
    return 'TRUTH_SOURCE';
  }
  if (/\b(list all execution stages|execution stages and their|execution stage inventory)\b/i.test(message)) {
    return 'EXECUTION_STAGE_INVENTORY';
  }
  if (/\btop (three|3) launch blockers?\b/i.test(message) || /\blaunch blockers?\b/i.test(message)) {
    return 'LAUNCH_BLOCKERS';
  }
  if (/\b(ready to launch|launch readiness|can you be launch)\b/i.test(message)) return 'LAUNCH_READINESS';
  if (/\b(why is launch not proven|what is preventing launch|why can't we launch)\b/i.test(message)) {
    return 'LAUNCH_NOT_PROVEN';
  }
  if (/\b(first launch blocker|primary launch blocker)\b/i.test(message)) return 'FIRST_LAUNCH_BLOCKER';
  if (/\bwhat do i need to fix before launch\b/i.test(message)) return 'LAUNCH_FIX_REQUIRED';
  if (/\bexecution status\b/i.test(message)) return 'TRUST';
  if (/\bbiggest blocker\b/i.test(message)) return 'WEAKNESS';
  return 'GENERAL';
}

export function isExecutionStageOperationalQuestion(message: string): boolean {
  const classified = classifyOperationalQuestion(message);
  if (isOperationalSelfKnowledgeQuestion(classified) && EXECUTION_STAGE_OPERATIONAL_KINDS.has(classified)) {
    return true;
  }
  return EXECUTION_STAGE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function resolveOperationalTruthPath(snapshot: OperationalEvidenceSnapshot): OperationalTruthPath {
  if (
    snapshot.executionTruthSource === CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE &&
    snapshot.executionChainTruth.sourceAuthority === CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE
  ) {
    return 'connected-execution-truth';
  }
  return 'legacy-autonomous-proof';
}

export function detectLiveOperationalTruthBypass(input: {
  message: string;
  responseText: string;
  snapshot: OperationalEvidenceSnapshot;
  operationalTruthPath: OperationalTruthPath;
  draftAnswer?: string;
}): LiveOperationalTruthBypass[] {
  const bypasses: LiveOperationalTruthBypass[] = [];
  const text = `${input.responseText}\n${input.draftAnswer ?? ''}`;

  if (/\bautonomous-build-execution-proof\b/i.test(text)) {
    bypasses.push({
      readOnly: true,
      kind: LIVE_OPERATIONAL_TRUTH_BYPASS,
      staleSource: 'autonomous-build-execution-proof',
      truthSource: input.snapshot.executionTruthSource,
      detail: 'Response generation referenced autonomous-build-execution-proof instead of ConnectedExecutionChainTruth',
    });
  }

  if (input.operationalTruthPath === 'connected-execution-truth') {
    for (const contradiction of responseContradictsExecutionTruth({
      executionChainTruth: input.snapshot.executionChainTruth,
      responseText: input.responseText,
    })) {
      bypasses.push({
        readOnly: true,
        kind: LIVE_OPERATIONAL_TRUTH_BYPASS,
        staleSource: contradiction.staleSource,
        truthSource: contradiction.truthSource,
        capability: contradiction.capability,
        staleValue: contradiction.staleValue,
        truthValue: contradiction.truthValue,
        detail: `Live response contradicted synchronized execution truth for ${contradiction.capability}`,
      });
    }
  }

  if (
    isExecutionStageOperationalQuestion(input.message) &&
    input.operationalTruthPath === 'legacy-autonomous-proof' &&
    !input.snapshot.executionChainTruth.chainConnected
  ) {
    bypasses.push({
      readOnly: true,
      kind: LIVE_OPERATIONAL_TRUTH_BYPASS,
      staleSource: 'legacy-autonomous-proof',
      truthSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      detail: 'Execution-stage question answered without connected execution chain truth',
    });
  }

  const context = input.snapshot.operationalTruthContext;
  if (context) {
    const contradictions = detectChatOperationalContradictions({
      context: {
        executionChainTruth: context.executionChainTruth,
        stageInventory: context.stageInventory,
        executionTruthSource: context.executionTruthSource,
        capabilityTruth: input.snapshot.capabilityTruth,
      },
      responseText: input.responseText,
      questionCategory: inferExecutionStageQuestionKind(input.message),
    });
    for (const contradiction of contradictions) {
      bypasses.push({
        readOnly: true,
        kind: LIVE_OPERATIONAL_TRUTH_BYPASS,
        staleSource: contradiction.conflictingSources[1] ?? 'response',
        truthSource: context.executionTruthSource,
        detail: contradiction.detail,
      });
    }
  }

  return bypasses;
}

export function buildLiveOperationalTruthDiagnostics(snapshot: OperationalEvidenceSnapshot): {
  readOnly: true;
  operationalTruthPath: OperationalTruthPath;
  operationalTruthContextVersion: string;
  operationalTruthSource: string;
  operationalTruthGeneratedAt: string;
  executionTruthSource: string;
  firstBrokenStage: string | null;
  chainConnected: boolean;
  generatedAt: string;
  executionTruthGeneratedAt: string;
  contradictionCount: number;
} {
  const context = snapshot.operationalTruthContext;
  return {
    readOnly: true,
    operationalTruthPath: resolveOperationalTruthPath(snapshot),
    operationalTruthContextVersion: context?.version ?? OPERATIONAL_TRUTH_CONTEXT_VERSION,
    operationalTruthSource: snapshot.executionTruthSource,
    operationalTruthGeneratedAt: snapshot.executionTruthGeneratedAt,
    executionTruthSource: snapshot.executionTruthSource,
    firstBrokenStage: snapshot.firstBrokenStage,
    chainConnected: snapshot.executionChainConnected,
    generatedAt: snapshot.generatedAt,
    executionTruthGeneratedAt: snapshot.executionTruthGeneratedAt,
    contradictionCount: context?.contradictionCount ?? 0,
  };
}
