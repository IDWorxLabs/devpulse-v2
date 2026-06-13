/**
 * Phase 26.2 — Context hydration orchestrator.
 */

import { buildChatSelfModel } from '../../chat-cognitive-architecture/chat-self-model.js';
import { assessChatCapabilityBoundaries } from '../../chat-cognitive-architecture/chat-capability-boundary-checker.js';
import { selectContextSourcesForMessage, listAllContextSources } from './context-selection-engine.js';
import { retrieveProjectVaultContext } from './adapters/project-vault-context-adapter.js';
import { retrieveFounderTestContext } from './adapters/founder-test-context-adapter.js';
import { retrieveExecutionProofContext } from './adapters/execution-proof-context-adapter.js';
import { retrieveVerificationContext } from './adapters/verification-context-adapter.js';
import { retrieveWorkspaceContext } from './adapters/workspace-context-adapter.js';
import { retrieveProjectHistoryContext } from './adapters/project-history-context-adapter.js';
import { retrieveLaunchCouncilContext } from './adapters/launch-council-context-adapter.js';
import type {
  ContextConfidence,
  ContextHydrationResult,
  ContextSection,
  ContextSource,
  HydratedContext,
} from './context-hydration-types.js';

function retrieveIdentityContext(): ContextSection[] {
  const self = buildChatSelfModel();
  return [
    {
      readOnly: true,
      id: 'identity-what',
      label: 'AiDevEngine identity',
      content: self.whatItIs,
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'IDENTITY',
    },
    {
      readOnly: true,
      id: 'identity-creator',
      label: 'Creator / origin',
      content: self.creatorOrigin,
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'IDENTITY',
    },
  ];
}

function retrieveSelfModelContext(): ContextSection[] {
  const self = buildChatSelfModel();
  return [
    {
      readOnly: true,
      id: 'self-awareness',
      label: 'Bounded self-awareness',
      content: self.boundedSelfAwareness,
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'SELF_MODEL',
    },
    {
      readOnly: true,
      id: 'self-limits',
      label: 'Cannot claim yet',
      content: self.cannotClaimYet.join('; '),
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'SELF_MODEL',
    },
    {
      readOnly: true,
      id: 'self-incomplete',
      label: 'Systems incomplete',
      content: self.systemsIncomplete.join('; '),
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'SELF_MODEL',
    },
  ];
}

function retrieveCapabilityBoundaryContext(rootDir?: string): ContextSection[] {
  return assessChatCapabilityBoundaries(rootDir).map((b) => ({
    readOnly: true,
    id: `cap-${b.capability}`,
    label: b.capability.replace(/_/g, ' '),
    content: b.explanation,
    confidence: b.level === 'UNKNOWN' ? 'LOW' : 'HIGH',
    proofLevel:
      b.level === 'PROVEN'
        ? 'PROVEN'
        : b.level === 'PARTIALLY_PROVEN'
          ? 'PARTIAL'
          : b.level === 'CONTRADICTED'
            ? 'CONTRADICTED'
            : 'UNKNOWN',
    source: 'CAPABILITY_BOUNDARIES' as const,
  }));
}

function retrieveSectionsForSource(source: ContextSource, message: string, rootDir?: string): ContextSection[] {
  switch (source) {
    case 'IDENTITY':
      return retrieveIdentityContext();
    case 'SELF_MODEL':
      return retrieveSelfModelContext();
    case 'CAPABILITY_BOUNDARIES':
      return retrieveCapabilityBoundaryContext(rootDir);
    case 'PROJECT_VAULT':
      return retrieveProjectVaultContext();
    case 'FOUNDER_TEST':
      return retrieveFounderTestContext();
    case 'EXECUTION_PROOF':
      return retrieveExecutionProofContext(rootDir);
    case 'VERIFICATION':
      return retrieveVerificationContext();
    case 'WORKSPACE':
      return retrieveWorkspaceContext();
    case 'PROJECT_HISTORY':
      return retrieveProjectHistoryContext(message);
    case 'LAUNCH_COUNCIL':
      return retrieveLaunchCouncilContext();
    default:
      return [];
  }
}

function computeOverallConfidence(sections: ContextSection[]): ContextConfidence {
  if (!sections.length) return 'LOW';
  const unknownCount = sections.filter((s) => s.proofLevel === 'UNKNOWN').length;
  if (unknownCount === 0) return 'HIGH';
  if (unknownCount <= sections.length / 2) return 'MEDIUM';
  return 'LOW';
}

function buildThemedContext(sections: ContextSection[], sources: ContextSource[]): Pick<
  HydratedContext,
  'projectContext' | 'executionContext' | 'verificationContext' | 'launchContext' | 'historyContext'
> {
  const pick = (srcs: ContextSource[]) =>
    sections
      .filter((s) => srcs.includes(s.source))
      .map((s) => `${s.label} [${s.proofLevel}]: ${s.content}`)
      .join('\n') || null;

  return {
    projectContext: pick(['PROJECT_VAULT', 'WORKSPACE', 'IDENTITY']),
    executionContext: pick(['EXECUTION_PROOF', 'FOUNDER_TEST']),
    verificationContext: pick(['VERIFICATION']),
    launchContext: pick(['LAUNCH_COUNCIL', 'FOUNDER_TEST']),
    historyContext: pick(['PROJECT_HISTORY']),
  };
}

export function hydrateContextForMessage(input: {
  message: string;
  rootDir?: string;
}): ContextHydrationResult {
  const message = input.message.trim();
  const selectedSources = selectContextSourcesForMessage(message);
  const allSources = listAllContextSources();
  const skippedSources = allSources.filter((s) => !selectedSources.includes(s));

  const sections: ContextSection[] = [];
  for (const source of selectedSources) {
    sections.push(...retrieveSectionsForSource(source, message, input.rootDir));
  }

  const themed = buildThemedContext(sections, selectedSources);
  const hydrated: HydratedContext = {
    readOnly: true,
    message,
    sections,
    sourcesUsed: selectedSources,
    hydratedFactCount: sections.length,
    overallConfidence: computeOverallConfidence(sections),
    ...themed,
  };

  return {
    readOnly: true,
    status: sections.length > 0 ? 'SUCCESS' : 'PARTIAL',
    hydrated,
    selectedSources,
    skippedSources,
  };
}
