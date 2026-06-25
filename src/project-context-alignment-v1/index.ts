/**
 * Project Context Alignment Guard V1 — multi-project build safety.
 */

export {
  PROJECT_CONTEXT_ALIGNMENT_PASS_TOKEN,
  type ProjectContextAlignmentVerdict,
  type ProjectContextSuggestedAction,
  type ProjectContextProfileConfidence,
  type ProjectContextMetadata,
  type ProjectContextAlignmentAction,
  type ProjectContextAlignmentInput,
  type ProjectContextAlignmentResult,
  type PromptDomainSignals,
} from './project-context-alignment-types.js';

export {
  extractPromptDomainSignals,
  extractProjectNameDomainSignals,
  domainOverlapScore,
  normalizeProjectDisplayName,
} from './prompt-domain-analyzer.js';

export {
  getProjectContextMetadata,
  listProjectContextMetadata,
  upsertProjectContextMetadata,
  resetProjectContextMetadataForTests,
} from './project-context-metadata-store.js';

export {
  assessProjectContextAlignment,
  alignmentBlocksBuildExecution,
} from './project-context-alignment-assessor.js';

export {
  composeProjectContextAlignmentBrainResponse,
  composeProjectContextAlignmentBrainApiPayload,
  composeProjectContextAlignmentBuildFromPromptPayload,
  buildProjectContextAlignmentFeedEvents,
} from './project-context-alignment-response.js';
