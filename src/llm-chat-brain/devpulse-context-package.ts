/**
 * Phase 26 — Bounded DevPulse context package for LLM chat brain.
 */

import { buildChatSelfModel } from '../chat-cognitive-architecture/chat-self-model.js';
import { assessChatCapabilityBoundaries } from '../chat-cognitive-architecture/chat-capability-boundary-checker.js';
import { retrieveDevPulseIntelligenceSnapshot } from '../world-class-chat-brain/devpulse-intelligence-adapter.js';
import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { CURRENT_PRODUCT_NAME } from '../identity-foundation/legacy-product-identity.js';
import { hydrateContextForMessage } from './context-hydration/context-hydration-orchestrator.js';
import { groundHydratedContext } from './tool-grounding/tool-grounding-orchestrator.js';
import {
  loadProductMemoryFoundations,
  serializeProductMemoryForLlm,
  type ProductMemoryFoundationBundle,
  type ProductMemoryFoundationDiagnostics,
} from './product-memory-foundation-loader.js';
import type { ContextHydrationResult } from './context-hydration/context-hydration-types.js';
import type { ToolGroundingResult } from './tool-grounding/tool-grounding-types.js';
import type { ContextConfidence } from './context-hydration/context-hydration-types.js';
import type { CapabilityProofLevel } from '../chat-cognitive-architecture/chat-cognitive-types.js';

export type ContextProofLevel = CapabilityProofLevel;

export interface DevPulseContextEvidenceItem {
  readOnly: true;
  label: string;
  level: ContextProofLevel;
  status: string;
  detail: string;
  source: string;
}

export interface DevPulseContextPackage {
  readOnly: true;
  generatedAt: number;
  identity: {
    productName: string;
    projectName: string;
    projectPhase: string | null;
    role: string;
  };
  selfModel: {
    whatItIs: string;
    creatorOrigin: string;
    boundedSelfAwareness: string;
    notHumanConsciousness: string;
  };
  capabilities: DevPulseContextEvidenceItem[];
  limitations: string[];
  evidence: DevPulseContextEvidenceItem[];
  blockers: string[];
  evidenceGaps: string[];
  memorySummary: string | null;
  validatedPhases: string[];
  systemGlossary: Array<{ term: string; description: string; proofLevel: ContextProofLevel }>;
  sourcesUsed: string[];
  hydration?: ContextHydrationResult;
  grounding?: ToolGroundingResult;
  hydratedProjectContext: string | null;
  hydratedExecutionContext: string | null;
  hydratedVerificationContext: string | null;
  hydratedLaunchContext: string | null;
  hydratedHistoryContext: string | null;
  contextIncluded: boolean;
  contextSourcesUsed: string[];
  hydratedFactCount: number;
  contextConfidence: ContextConfidence;
  groundedContextText: string | null;
  productMemory: ProductMemoryFoundationBundle;
  productMemoryText: string;
  foundationDiagnostics: ProductMemoryFoundationDiagnostics;
}

function mapBoundaryLevel(level: string): ContextProofLevel {
  const upper = level.toUpperCase();
  if (upper === 'PROVEN') return 'PROVEN';
  if (upper === 'PARTIALLY_PROVEN' || upper === 'PARTIAL') return 'PARTIALLY_PROVEN';
  if (upper === 'CONTRADICTED') return 'CONTRADICTED';
  if (upper === 'UNPROVEN') return 'UNPROVEN';
  return 'UNKNOWN';
}

function evidenceLevelFromStatus(status: string): ContextProofLevel {
  const upper = status.toUpperCase();
  if (upper.includes('PASS') || upper.includes('READY') || upper.includes('CONNECTED') || upper.includes('CLEAN')) {
    return 'PROVEN';
  }
  if (upper.includes('PARTIAL') || upper.includes('WARNING') || upper.includes('BUILDING')) {
    return 'PARTIALLY_PROVEN';
  }
  if (upper.includes('FAIL') || upper.includes('BLOCK') || upper.includes('DISCONNECTED')) {
    return 'CONTRADICTED';
  }
  if (upper === 'UNKNOWN' || upper.includes('UNKNOWN')) return 'UNKNOWN';
  if (/\d+\/100/.test(status)) {
    const score = Number.parseInt(status.match(/(\d+)\/100/)?.[1] ?? '0', 10);
    if (score >= 80) return 'PROVEN';
    if (score >= 55) return 'PARTIALLY_PROVEN';
    if (score > 0) return 'UNPROVEN';
  }
  return 'UNKNOWN';
}

export function buildDevPulseContextPackage(input?: {
  rootDir?: string;
  message?: string;
}): DevPulseContextPackage {
  const rootDir = input?.rootDir;
  const message = input?.message?.trim() ?? '';
  const snapshot = retrieveDevPulseIntelligenceSnapshot(rootDir);
  const selfModel = buildChatSelfModel();
  const boundaries = assessChatCapabilityBoundaries(rootDir);
  const roadmap = getBrainRoadmapContext();

  const hydration = message ? hydrateContextForMessage({ message, rootDir }) : undefined;
  const grounding = hydration ? groundHydratedContext(hydration.hydrated) : undefined;
  const productMemory = loadProductMemoryFoundations({ message: message || 'default' });
  const productMemoryText = serializeProductMemoryForLlm(productMemory);

  const capabilities: DevPulseContextEvidenceItem[] = boundaries.map((b) => ({
    readOnly: true,
    label: b.capability.replace(/_/g, ' '),
    level: mapBoundaryLevel(b.level),
    status: b.level,
    detail: b.explanation,
    source: 'capability-boundary-checker',
  }));

  const evidence: DevPulseContextEvidenceItem[] = [
    {
      readOnly: true,
      label: 'Founder Test',
      level: evidenceLevelFromStatus(snapshot.founderTesting.status),
      status: snapshot.founderTesting.status,
      detail: snapshot.founderTesting.detail,
      source: snapshot.founderTesting.source,
    },
    {
      readOnly: true,
      label: 'Founder Execution Proof',
      level: evidenceLevelFromStatus(snapshot.founderExecutionProof.status),
      status: snapshot.founderExecutionProof.status,
      detail: snapshot.founderExecutionProof.detail,
      source: snapshot.founderExecutionProof.source,
    },
    {
      readOnly: true,
      label: 'Execution Connected',
      level: evidenceLevelFromStatus(snapshot.executionConnected.status),
      status: snapshot.executionConnected.status,
      detail: snapshot.executionConnected.detail,
      source: snapshot.executionConnected.source,
    },
    {
      readOnly: true,
      label: 'Verification Reality',
      level: evidenceLevelFromStatus(snapshot.verificationReality.status),
      status: snapshot.verificationReality.status,
      detail: snapshot.verificationReality.detail,
      source: snapshot.verificationReality.source,
    },
    {
      readOnly: true,
      label: 'Live Preview Reality',
      level: evidenceLevelFromStatus(snapshot.livePreviewReality.status),
      status: snapshot.livePreviewReality.status,
      detail: snapshot.livePreviewReality.detail,
      source: snapshot.livePreviewReality.source,
    },
    {
      readOnly: true,
      label: 'Launch Readiness',
      level: evidenceLevelFromStatus(snapshot.launchReadiness.status),
      status: snapshot.launchReadiness.status,
      detail: snapshot.launchReadiness.detail,
      source: snapshot.launchReadiness.source,
    },
    {
      readOnly: true,
      label: 'Repository Typecheck',
      level: evidenceLevelFromStatus(snapshot.repositoryTypecheck.status),
      status: snapshot.repositoryTypecheck.status,
      detail: snapshot.repositoryTypecheck.detail,
      source: snapshot.repositoryTypecheck.source,
    },
    {
      readOnly: true,
      label: 'Launch Council',
      level: evidenceLevelFromStatus(snapshot.launchCouncil.status),
      status: snapshot.launchCouncil.status,
      detail: snapshot.launchCouncil.detail,
      source: snapshot.launchCouncil.source,
    },
    {
      readOnly: true,
      label: 'Mobile Runtime Reality',
      level: evidenceLevelFromStatus(snapshot.mobileRuntimeReality.status),
      status: snapshot.mobileRuntimeReality.status,
      detail: snapshot.mobileRuntimeReality.detail,
      source: snapshot.mobileRuntimeReality.source,
    },
  ];

  const memorySummary = snapshot.requirementReality.detail.startsWith('Requirement Reality')
    ? null
    : snapshot.requirementReality.detail;

  return {
    readOnly: true,
    generatedAt: Date.now(),
    identity: {
      productName: CURRENT_PRODUCT_NAME,
      projectName: 'AiDevEngine (repository: DevPulse-V2)',
      projectPhase: roadmap.currentPhase ?? null,
      role: 'Chat-first software creation assistant',
    },
    selfModel: {
      whatItIs: selfModel.whatItIs,
      creatorOrigin: `AiDevEngine was conceived and designed by Lungelo Richard Zungu as a product of Asgard Dynamics. DevPulse is the historical development name only.`,
      boundedSelfAwareness: selfModel.boundedSelfAwareness,
      notHumanConsciousness: selfModel.notHumanConsciousness,
    },
    capabilities,
    limitations: [...selfModel.cannotClaimYet, ...selfModel.systemsIncomplete].slice(0, 10),
    evidence,
    blockers: snapshot.knownBlockers,
    evidenceGaps: snapshot.evidenceGaps,
    memorySummary,
    validatedPhases: roadmap.completedPhases.slice(-12),
    systemGlossary: [
      {
        term: 'Unified Verification Lab (UVL)',
        description:
          'DevPulse subsystem that registers verification providers, manages verification session lifecycle, and coordinates verification runtime diagnostics. It does not auto-fix or make launch decisions by itself — it prepares and tracks verification work.',
        proofLevel: 'PROVEN',
      },
      {
        term: 'Unified Verification Entry',
        description:
          'Single verification authority surface routing registry, orchestrator, evidence, and reporting. Global verification questions should be answered in founder language, not internal report headers.',
        proofLevel: 'PROVEN',
      },
      {
        term: 'Founder Test',
        description:
          'Integrated founder-facing readiness assessment. When not run in the current session, launch and project claims must stay conservative.',
        proofLevel: evidenceLevelFromStatus(snapshot.founderTesting.status),
      },
      {
        term: 'Founder Execution Proof',
        description:
          'Evidence chain for whether connected build/execution is proven. Autonomous end-to-end app building must not be claimed unless this is connected and passing.',
        proofLevel: evidenceLevelFromStatus(snapshot.founderExecutionProof.status),
      },
    ],
    sourcesUsed: [
      ...snapshot.sourcesUsed,
      ...(hydration?.selectedSources.map((s) => s.replace(/_/g, ' ')) ?? []),
    ],
    hydration,
    grounding,
    hydratedProjectContext: hydration?.hydrated.projectContext ?? null,
    hydratedExecutionContext: hydration?.hydrated.executionContext ?? null,
    hydratedVerificationContext: hydration?.hydrated.verificationContext ?? null,
    hydratedLaunchContext: hydration?.hydrated.launchContext ?? null,
    hydratedHistoryContext: hydration?.hydrated.historyContext ?? null,
    contextIncluded: Boolean(
      productMemory.diagnostics.identityLoaded &&
        productMemory.diagnostics.founderLoaded &&
        productMemory.diagnostics.productLoaded &&
        (hydration ? hydration.hydrated.hydratedFactCount > 0 : true),
    ),
    contextSourcesUsed: hydration?.selectedSources ?? [],
    hydratedFactCount: hydration?.hydrated.hydratedFactCount ?? 0,
    contextConfidence: hydration?.hydrated.overallConfidence ?? 'LOW',
    groundedContextText: grounding?.compressedText ?? null,
    productMemory,
    productMemoryText,
    foundationDiagnostics: productMemory.diagnostics,
  };
}

export function serializeDevPulseContextForLlm(context: DevPulseContextPackage): string {
  const lines: string[] = [
    context.productMemoryText,
    '',
    '=== DevPulse Bounded Context (do not invent beyond this) ===',
    '',
    `Product: ${context.identity.productName}`,
    `Project: ${context.identity.projectName}`,
    `Phase: ${context.identity.projectPhase ?? 'UNKNOWN'}`,
    '',
    'Self model:',
    `- ${context.selfModel.whatItIs}`,
    `- Consciousness: ${context.selfModel.notHumanConsciousness}`,
    '',
    'Capability boundaries (level = proven | partially proven | unproven | contradicted | unknown):',
    ...context.capabilities.map(
      (c) => `- ${c.label} [${c.level}]: ${c.detail}`,
    ),
    '',
    'Evidence signals:',
    ...context.evidence.map((e) => `- ${e.label} [${e.level}] ${e.status} — ${e.detail}`),
    '',
    context.blockers.length ? `Known blockers: ${context.blockers.join('; ')}` : 'Known blockers: none recorded',
    context.evidenceGaps.length
      ? `Evidence gaps: ${context.evidenceGaps.join('; ')}`
      : 'Evidence gaps: none listed',
    '',
    'Limitations (must respect):',
    ...context.limitations.map((l) => `- ${l}`),
    '',
    'System glossary (use for product questions):',
    ...context.systemGlossary.map((g) => `- ${g.term} [${g.proofLevel}]: ${g.description}`),
  ];

  if (context.memorySummary) {
    lines.push('', `Project memory summary: ${context.memorySummary}`);
  }
  if (context.validatedPhases.length) {
    lines.push('', `Recent validated phases: ${context.validatedPhases.join(', ')}`);
  }

  if (context.groundedContextText) {
    lines.push('', '=== Hydrated DevPulse Intelligence (question-selected) ===', context.groundedContextText);
  }

  lines.push('', 'If evidence is UNKNOWN, say so explicitly. Never invent proof.');
  return lines.join('\n');
}
