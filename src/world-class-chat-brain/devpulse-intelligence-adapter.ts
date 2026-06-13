/**
 * Phase 25.38 — DevPulse Intelligence Systems adapter.
 * Exposes read-only evidence from DevPulse authorities to the chat brain.
 */

import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import { resolveExecutionConnectedForRoot } from '../founder-test-integration/founder-execution-connected-resolver.js';
import { getLatestFounderExecutionProofHistoryEntry } from '../founder-execution-proof/founder-execution-proof-history.js';
import { getLatestRepositoryTypecheckBaseline } from '../repository-typecheck-reality/repository-typecheck-reality-history.js';
import { getLatestLaunchCouncilAssessment } from '../launch-council/launch-council-history.js';
import { getLatestLaunchReadinessAssessment } from '../launch-readiness-authority/launch-readiness-history.js';
import { listVerificationHistory } from '../verification-reality/verification-reality-history.js';
import { listLivePreviewHistory } from '../live-preview-reality/live-preview-reality-history.js';
import { listMobileRuntimeHistory } from '../mobile-runtime-experience-reality/mobile-runtime-experience-reality-history.js';
import { getLatestRequirementSummary } from '../requirement-extractor/requirement-brain-bridge.js';

export type DevPulseIntelligenceSnapshot = {
  readOnly: true;
  founderTesting: { status: string; detail: string; source: string };
  founderExecutionProof: { status: string; detail: string; source: string };
  verificationReality: { status: string; detail: string; source: string };
  requirementReality: { status: string; detail: string; source: string };
  livePreviewReality: { status: string; detail: string; source: string };
  mobileRuntimeReality: { status: string; detail: string; source: string };
  projectMemory: { status: string; detail: string; source: string };
  launchCouncil: { status: string; detail: string; source: string };
  launchReadiness: { status: string; detail: string; source: string };
  repositoryTypecheck: { status: string; detail: string; source: string };
  chatCognitiveArchitecture: { status: string; detail: string; source: string };
  executionConnected: { status: string; detail: string; source: string };
  knownBlockers: string[];
  evidenceGaps: string[];
  sourcesUsed: string[];
};

function unknown(label: string): DevPulseIntelligenceSnapshot[keyof Omit<
  DevPulseIntelligenceSnapshot,
  'knownBlockers' | 'evidenceGaps' | 'sourcesUsed' | 'readOnly'
>] {
  return { status: 'UNKNOWN', detail: `${label} — no session evidence`, source: 'none' };
}

export function retrieveDevPulseIntelligenceSnapshot(rootDir?: string): DevPulseIntelligenceSnapshot {
  const knownBlockers: string[] = [];
  const evidenceGaps: string[] = [];
  const sourcesUsed: string[] = [];

  const founderTest = getLatestFounderTestAssessment();
  let founderTesting = unknown('Founder Testing');
  if (founderTest) {
    founderTesting = {
      status: founderTest.verdict,
      detail: `${founderTest.score.overall}/100 — ${founderTest.blockers.length} blockers`,
      source: 'founder-test-integration-history',
    };
    sourcesUsed.push('Founder Testing');
    knownBlockers.push(...founderTest.blockers.slice(0, 4));
  } else {
    evidenceGaps.push('Founder Test not run in this session');
  }

  const execProof = getLatestFounderExecutionProofHistoryEntry();
  let founderExecutionProof = unknown('Founder Execution Proof');
  if (execProof) {
    founderExecutionProof = {
      status: execProof.founderExecutionState,
      detail: `${execProof.founderExecutionScore}/100 — launch ${execProof.launchRecommendation}`,
      source: 'founder-execution-proof-history',
    };
    sourcesUsed.push('Founder Execution Proof');
  } else {
    evidenceGaps.push('Founder Execution Proof not recorded in session');
  }

  let executionConnected = unknown('Execution Connected');
  if (rootDir) {
    try {
      const resolved = resolveExecutionConnectedForRoot(rootDir);
      executionConnected = {
        status: resolved.executionConnected ? 'CONNECTED' : 'DISCONNECTED',
        detail: resolved.source,
        source: 'founder-execution-connected-resolver',
      };
      sourcesUsed.push('Execution Connected Resolver');
      if (!resolved.executionConnected) {
        knownBlockers.push('Execution chain not proven by Founder Execution Proof');
      }
    } catch {
      evidenceGaps.push('Could not resolve execution connected state');
    }
  }

  const verificationEntry = listVerificationHistory()[0];
  let verificationReality = unknown('Verification Reality');
  if (verificationEntry) {
    verificationReality = {
      status: `${verificationEntry.verificationRealityScore}/100`,
      detail: verificationEntry.summary,
      source: 'verification-reality-history',
    };
    sourcesUsed.push('Verification Reality');
  } else {
    evidenceGaps.push('Verification Reality not assessed in session');
  }

  const previewEntry = listLivePreviewHistory()[0];
  let livePreviewReality = unknown('Live Preview Reality');
  if (previewEntry) {
    livePreviewReality = {
      status: `${previewEntry.livePreviewRealityScore}/100`,
      detail: previewEntry.summary,
      source: 'live-preview-reality-history',
    };
    sourcesUsed.push('Live Preview Reality');
  } else {
    evidenceGaps.push('Live Preview Reality not assessed in session');
  }

  const mobileEntry = listMobileRuntimeHistory()[0];
  let mobileRuntimeReality = unknown('Mobile Runtime Reality');
  if (mobileEntry) {
    mobileRuntimeReality = {
      status: `${mobileEntry.mobileRuntimeExperienceScore}/100`,
      detail: mobileEntry.summary,
      source: 'mobile-runtime-experience-reality-history',
    };
    sourcesUsed.push('Mobile Runtime Reality');
  } else {
    evidenceGaps.push('Mobile Runtime Reality not assessed in session');
  }

  const requirementSummary = getLatestRequirementSummary();
  let requirementReality = unknown('Requirement Reality');
  if (requirementSummary?.trim()) {
    requirementReality = {
      status: 'AVAILABLE',
      detail: requirementSummary.slice(0, 160),
      source: 'requirement-brain-bridge',
    };
    sourcesUsed.push('Project Memory / Requirements');
  } else {
    evidenceGaps.push('No requirement summary in project memory bridge');
  }

  const launchCouncil = getLatestLaunchCouncilAssessment();
  let launchCouncilSnap = unknown('Launch Council');
  if (launchCouncil) {
    launchCouncilSnap = {
      status: `${launchCouncil.overallScore}/100`,
      detail: launchCouncil.verdict,
      source: 'launch-council-history',
    };
    sourcesUsed.push('Launch Council');
  }

  const launchReadiness = getLatestLaunchReadinessAssessment();
  let launchReadinessSnap = unknown('Launch Readiness');
  if (launchReadiness) {
    launchReadinessSnap = {
      status: launchReadiness.readinessState,
      detail: `${launchReadiness.readinessScore}/100`,
      source: 'launch-readiness-authority-history',
    };
    sourcesUsed.push('Launch Readiness Authority');
  } else if (founderTest) {
    launchReadinessSnap = {
      status: founderTest.verdict,
      detail: `Derived from Founder Test (${founderTest.score.overall}/100)`,
      source: 'founder-test-integration-history',
    };
  }

  const typecheck = getLatestRepositoryTypecheckBaseline();
  let repositoryTypecheck = unknown('Repository Typecheck');
  if (typecheck) {
    repositoryTypecheck = {
      status: typecheck.readinessState,
      detail: typecheck.typecheckClean ? 'Typecheck clean' : 'Typecheck issues present',
      source: 'repository-typecheck-reality-history',
    };
    sourcesUsed.push('Repository Typecheck');
  }

  const chatCognitiveArchitecture = {
    status: 'MODULE_ACTIVE',
    detail:
      'Chat Cognitive Architecture (Phase 25.37) — intent, self-diagnosis, capability boundaries, quality review',
    source: 'chat-cognitive-architecture',
  };
  sourcesUsed.push('Chat Cognitive Architecture');

  return {
    readOnly: true,
    founderTesting,
    founderExecutionProof,
    verificationReality,
    requirementReality,
    livePreviewReality,
    mobileRuntimeReality,
    projectMemory: requirementReality,
    launchCouncil: launchCouncilSnap,
    launchReadiness: launchReadinessSnap,
    repositoryTypecheck,
    chatCognitiveArchitecture,
    executionConnected,
    knownBlockers: [...new Set(knownBlockers)].slice(0, 8),
    evidenceGaps: [...new Set(evidenceGaps)].slice(0, 8),
    sourcesUsed: [...new Set(sourcesUsed)],
  };
}
