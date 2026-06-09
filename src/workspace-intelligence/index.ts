/**
 * DevPulse V2 Phase 12.3 — Workspace Intelligence public API.
 */

export {
  WORKSPACE_INTELLIGENCE_PASS_TOKEN,
  WORKSPACE_INTELLIGENCE_OWNER_MODULE,
  WORKSPACE_QUESTION_SIGNALS,
  FORBIDDEN_WORKSPACE_INTELLIGENCE_DUPLICATES,
  isWorkspaceIntelligenceQuestion,
  isDuplicateWorkspaceBrainQuestion,
  type WorkspaceContext,
  type WorkspaceProjectLink,
  type WorkspaceModule,
  type WorkspaceBoundary,
  type WorkspaceRisk,
  type WorkspaceIntelligenceSnapshot,
  type WorkspaceAnalysis,
  type WorkspaceIntelligenceDiagnostics,
  type WorkspaceAnswer,
  type WorkspaceBoundaryType,
  type WorkspaceConfidence,
} from './workspace-intelligence-types.js';

export {
  buildWorkspaceSnapshot,
  getWorkspaceSnapshot,
  getPrimaryFileAreas,
  resetWorkspaceSnapshotForTests,
} from './workspace-context-builder.js';

export {
  resolveWorkspaceOwner,
  resolveActiveProject,
  resolveModuleOwnership,
  assertWorkspaceIntelligenceOwner,
  findProjectLinkForWorkspace,
} from './workspace-owner-resolver.js';

export {
  detectWorkspaceBoundaries,
  summarizeBoundaries,
  boundariesForActiveWorkspace,
} from './workspace-boundary-detector.js';

export {
  analyzeWorkspaceIsolation,
  listWorkspaceModules,
  listWorkspaceFileAreas,
} from './workspace-isolation-analyzer.js';

export {
  detectWorkspaceRisks,
  applyRisksToSnapshot,
  resetWorkspaceRiskCounterForTests,
} from './workspace-risk-detector.js';

export {
  getWorkspaceIntelligenceDiagnostics,
  updateWorkspaceIntelligenceDiagnostics,
  resetWorkspaceIntelligenceDiagnostics,
  workspaceIntelligenceKey,
} from './workspace-intelligence-diagnostics.js';

export {
  analyzeWorkspace,
  processWorkspaceIntelligenceRequest,
  workspaceFactsFromAnalysis,
  getWorkspaceIntelligenceContext,
  displayBoundaryType,
} from './workspace-intelligence.js';

export function getDevPulseV2WorkspaceIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_workspace_intelligence',
    passToken: 'DEVPULSE_V2_WORKSPACE_INTELLIGENCE_FOUNDATION_V1_PASS',
    phase: 12.3,
  };
}
