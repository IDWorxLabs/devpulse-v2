/**
 * Brain response generator — plain English, evidence-based responses. Intelligence only.
 */

import type {
  BrainClassification,
  BrainRequestCategory,
  BrainRoadmapContext,
  BrainSystemRecord,
} from './brain-types.js';
import { findSystemByKeyword, summarizeSystemMaturity } from './brain-system-awareness.js';
import { formatCompletedPhasesList, getBrainRoadmapContext } from './brain-roadmap-awareness.js';

export function responseKey(category: BrainRequestCategory, message: string): string {
  return `${category}:${message.trim().toLowerCase().slice(0, 64)}`;
}

function world2HonestStatus(): string {
  return 'World 2 planning foundations exist (workspace, simulation, builder, completion verifier), but execution runtime has not been implemented. World 2 does not autonomously build applications today.';
}

function trustEngineExplanation(): string {
  return 'Trust Engine Expansion (Phase 10.2) aggregates trust signals from evidence ledger, verification gated apply, completion verifier, and related systems. It produces a unified trust score for founder review. It does not replace verification systems or the evidence ledger as source of truth.';
}

function governanceExplanation(): string {
  return 'Governance Stack (Phase 6) provides execution authority, verification loops, evidence ledger, and founder approval gates. These are foundation-complete and validated. They govern execution paths — the Command Center Brain does not bypass or replace them.';
}

function generateRoadmapResponse(roadmap: BrainRoadmapContext): string {
  return [
    `Current phase: ${roadmap.currentPhase}. Next: ${roadmap.nextPhase}.`,
    '',
    'Current foundation maturity:',
    roadmap.stackMaturitySummary,
    '',
    'Recommended next step:',
    roadmap.recommendedNextStep,
    '',
    'Completed phases include:',
    formatCompletedPhasesList(),
    '',
    'This is intelligence only — no execution, file changes, or code generation will occur from this response.',
  ].join('\n');
}

function generateSystemResponse(message: string, systems: BrainSystemRecord[]): string {
  const lower = message.toLowerCase();

  if (lower.includes('trust')) {
    return trustEngineExplanation();
  }
  if (lower.includes('world 2') || lower.includes('world2')) {
    return world2HonestStatus();
  }
  if (lower.includes('governance')) {
    return governanceExplanation();
  }

  if (systems.length === 0) {
    return [
      'DevPulse V2 has many registered foundation systems across Phases 6–11.',
      summarizeSystemMaturity(),
      '',
      'Ask about a specific system (Trust Engine, World 2, Governance, Mobile Command, Self-Evolution, Experience Layer) for a targeted explanation.',
      '',
      'The Command Center Brain understands these systems — it does not replace them.',
    ].join('\n');
  }

  const lines = systems.slice(0, 3).map(
    (s) =>
      `• ${s.displayName} (Phase ${s.phase}) — ${s.purpose} Status: ${s.status.replace(/_/g, ' ').toLowerCase()}. Owner: ${s.ownerModule}.`,
  );

  return [
    'Based on registered ownership and foundation status:',
    '',
    ...lines,
    '',
    summarizeSystemMaturity(),
    '',
    'This is an understanding layer only — no execution or system modification occurred.',
  ].join('\n');
}

function generateStatusResponse(message: string, roadmap: BrainRoadmapContext): string {
  const lower = message.toLowerCase();
  const lines = [
    `Current phase: ${roadmap.currentPhase}.`,
    '',
    roadmap.stackMaturitySummary,
    '',
    'Product maturity: Foundation architecture exists and is validated. Runnable Command Center shell and local Brain intelligence are active. Execution runtime, cloud runtime, autonomous building, and real mobile control are NOT YET connected.',
    '',
    'Founder Reality checklist confirms: you can open DevPulse, see stacks and validators. You cannot yet type a project idea and have DevPulse build it.',
  ];
  if (lower.includes('world 2') || lower.includes('world2')) {
    lines.push('', world2HonestStatus());
  }
  return lines.join('\n');
}

function generateArchitectureResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('duplic')) {
    return [
      'DevPulse V2 uses a strict ownership registry — one owner per domain.',
      'The Command Center Brain (Phase 11.1) is distinct from Central Brain authority. It is an understanding layer for the Command Center chat — not a second Central Brain, World 2 planner, trust engine, or operator feed.',
      '',
      'Before adding new systems, the registry is checked for duplicate ownership patterns. The Brain references existing systems; it does not duplicate their truth or execution.',
    ].join('\n');
  }

  return [
    'DevPulse V2 architecture separates foundations (Phases 6–10) from the Command Center shell (10.3.1) and Brain intelligence (11.1).',
    'Each system has a registered owner, phase, and bounded responsibility. Intelligence layers aggregate and explain — they do not execute, modify files, or replace governance.',
    '',
    governanceExplanation(),
  ].join('\n');
}

function generateRiskResponse(): string {
  return [
    'Primary risks at current maturity:',
    '• Treating foundation-complete systems as runtime-complete (especially World 2 and execution paths)',
    '• Duplicating intelligence or governance systems instead of extending ownership registry entries',
    '• Expecting Command Center Brain responses to trigger builds, file changes, or deployments',
    '',
    'Mitigation: Use validated foundation checkpoints, ownership registry, and Trust Engine aggregation. Brain responses are intelligence only.',
  ].join('\n');
}

function generateProjectResponse(): string {
  return [
    'Project and workspace foundations exist in World 2 workspace foundation (Phase 7.1), but end-to-end project building from a founder idea is NOT YET available.',
    '',
    'You can map experience journeys (Phase 10.1) and assess trust (Phase 10.2), but DevPulse cannot execute builds, modify project files, or autonomously complete projects today.',
    '',
    world2HonestStatus(),
  ].join('\n');
}

function generateGeneralResponse(roadmap: BrainRoadmapContext): string {
  return [
    'I am the Unified Command Center Brain — local intelligence only, no external AI models.',
    '',
    'I understand DevPulse phases, registered systems, ownership, and roadmap status. I can explain architecture, maturity, risks, and next steps.',
    '',
    `Current phase: ${roadmap.currentPhase}.`,
    roadmap.recommendedNextStep,
    '',
    'Try: "What should we build next?" or "How does World 2 connect to Command Center?" or "What depends on Governance?"',
  ].join('\n');
}

export function generateBrainResponse(
  message: string,
  classification: BrainClassification,
  systems: BrainSystemRecord[],
  roadmap: BrainRoadmapContext,
): string {
  switch (classification.category) {
    case 'ROADMAP':
      return generateRoadmapResponse(roadmap);
    case 'SYSTEM':
      return generateSystemResponse(message, systems.length ? systems : findSystemByKeyword(message));
    case 'STATUS':
      return generateStatusResponse(message, roadmap);
    case 'ARCHITECTURE':
      return generateArchitectureResponse(message);
    case 'RISK':
      return generateRiskResponse();
    case 'PROJECT':
      return generateProjectResponse();
    case 'GENERAL':
    default:
      return generateGeneralResponse(roadmap);
  }
}

export function generateBlockedResponse(reason: string): string {
  return `Request blocked — ${reason}. The Command Center Brain provides intelligence only. No execution, file modification, or code generation was performed.`;
}
