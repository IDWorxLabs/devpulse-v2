/**
 * Phase 25.37 — Capability boundary checker before chat answers.
 */

import { resolveExecutionConnectedForRoot } from '../founder-test-integration/founder-execution-connected-resolver.js';
import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import type {
  ChatCapabilityBoundary,
  CapabilityProofLevel,
  TrackedChatCapability,
} from './chat-cognitive-types.js';

function boundary(
  capability: TrackedChatCapability,
  level: CapabilityProofLevel,
  explanation: string,
  evidenceUsed: string[],
): ChatCapabilityBoundary {
  return { readOnly: true, capability, level, explanation, evidenceUsed };
}

export function assessChatCapabilityBoundaries(rootDir?: string): ChatCapabilityBoundary[] {
  const founderTest = getLatestFounderTestAssessment();
  const executionConnected = rootDir
    ? resolveExecutionConnectedForRoot(rootDir).executionConnected
    : false;

  const requirementScore =
    founderTest?.run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY')
      ?.normalizedScore ?? null;

  return [
    boundary(
      'planning',
      'PARTIALLY_PROVEN',
      'Planning modules and requirement extraction exist; full autonomous planning loop is not always proven in live runs.',
      ['foundation modules present'],
    ),
    boundary(
      'requirements',
      requirementScore !== null && requirementScore >= 70 ? 'PARTIALLY_PROVEN' : 'UNPROVEN',
      requirementScore !== null
        ? `Requirement Reality last scored ${requirementScore}/100 in Founder Test.`
        : 'Requirement Reality not available — run Founder Test for bounded score.',
      founderTest ? ['founder-test-integration'] : [],
    ),
    boundary(
      'architecture_review',
      'PARTIALLY_PROVEN',
      'Architecture review and general question routing exist; answers must stay bounded to registered systems.',
      ['command-center-brain', 'general-question-understanding'],
    ),
    boundary(
      'project_memory',
      'PARTIALLY_PROVEN',
      'Project memory and vault intelligence exist; chat may not have full live memory context every turn.',
      ['project-vault-intelligence'],
    ),
    boundary(
      'autonomous_build_execution',
      executionConnected ? 'PARTIALLY_PROVEN' : 'UNPROVEN',
      executionConnected
        ? 'Connected execution proof exists in session — still not full autonomous app completion.'
        : 'Execution chain not proven — do not claim autonomous build execution is connected.',
      rootDir ? ['founder-execution-proof-resolver'] : [],
    ),
    boundary(
      'live_preview',
      founderTest?.run.authorityResults.find((r) => r.authorityId === 'LIVE_PREVIEW_REALITY')
        ?.normalizedScore
        ? 'PARTIALLY_PROVEN'
        : 'UNKNOWN',
      'Live Preview Reality authority exists; live preview URL/session may be unavailable without runtime evidence.',
      founderTest ? ['founder-test-integration'] : [],
    ),
    boundary(
      'verification',
      'PARTIALLY_PROVEN',
      'Verification validators and Founder Test exist; verification must be run — not assumed.',
      ['verification-reality', 'founder-test'],
    ),
    boundary(
      'launch_readiness',
      founderTest?.verdict === 'FOUNDER_READY' || founderTest?.verdict === 'FOUNDER_READY_WITH_WARNINGS'
        ? 'PARTIALLY_PROVEN'
        : founderTest?.verdict === 'BLOCKED'
          ? 'CONTRADICTED'
          : 'UNPROVEN',
      founderTest
        ? `Latest Founder Test verdict: ${founderTest.verdict} (${founderTest.score.overall}/100).`
        : 'Launch readiness unknown — Founder Test not run in session.',
      founderTest ? ['founder-test-integration'] : [],
    ),
    boundary(
      'mobile_runtime',
      'UNPROVEN',
      'Mobile runtime experience is tracked separately; do not claim mobile parity without evidence.',
      [],
    ),
    boundary(
      'self_awareness',
      'PARTIALLY_PROVEN',
      'Operational self-awareness via cognitive architecture — not human consciousness.',
      ['chat-cognitive-architecture'],
    ),
    boundary(
      'chat_reasoning',
      'PARTIALLY_PROVEN',
      'Chat Cognitive Architecture enforces intent, boundaries, and quality review on every response.',
      ['chat-cognitive-orchestrator'],
    ),
  ];
}

export function findCapabilityBoundary(
  boundaries: ChatCapabilityBoundary[],
  capability: TrackedChatCapability,
): ChatCapabilityBoundary | null {
  return boundaries.find((b) => b.capability === capability) ?? null;
}
