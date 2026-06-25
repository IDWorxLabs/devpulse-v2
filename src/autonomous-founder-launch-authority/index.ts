/**
 * Autonomous Founder Launch Authority V1 — public exports.
 */

export {
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN,
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_OWNER_MODULE,
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_PHASE,
  DEFAULT_AUTOFIX_MAX_RETRIES,
  FOUNDER_LAUNCH_MIN_SCORE,
  FOUNDER_LAUNCH_USER_LABELS,
  FOUNDER_LAUNCH_SUITE_APPS,
} from './autonomous-founder-launch-authority-registry.js';

export type {
  FounderLaunchVerdict,
  FounderReviewerRole,
  FounderLaunchUserPhase,
  FounderEvidenceSource,
  FounderEvidenceSnapshot,
  FounderReviewerAssessment,
  FounderLaunchScores,
  FounderRemediationIssue,
  FounderRemediationPlan,
  AutonomousFounderLaunchAssessment,
  LaunchDecisionExplainability,
  RunAutonomousFounderLaunchAuthorityInput,
  RunAiDevEngineEvidencePipelineInput,
} from './autonomous-founder-launch-authority-types.js';

export {
  collectFounderLaunchEvidence,
  buildBuildRealityEvidenceFromWorkspace,
  synthesizeLaunchReadinessEvidenceFromPipeline,
} from './founder-evidence-collector.js';

export { runFounderReviewerPanel, getReviewerByRole } from './founder-reviewer-engine.js';

export {
  buildFounderLaunchScores,
  deriveFounderLaunchVerdict,
  buildAutonomousFounderLaunchAssessment,
  resolveFounderLaunchBlockingRules,
} from './founder-verdict-engine.js';

export { buildLaunchDecisionExplainability } from './founder-launch-decision-explainability.js';

export {
  buildFounderRemediationPlan,
  resetFounderRemediationPlanCounterForTests,
} from './founder-remediation-plan.js';

export {
  dispatchFounderRemediationToAutofix,
  type FounderAutofixDispatchResult,
} from './founder-autofix-integration.js';

export { formatAutonomousFounderLaunchReportMarkdown } from './autonomous-founder-launch-report.js';

export {
  resolveFounderLaunchUserLabel,
  resolveFounderLaunchPhaseDuringPipeline,
} from './founder-launch-user-surface.js';

export {
  runAutonomousFounderLaunchAuthority,
  assessAutonomousFounderLaunchAuthority,
  runAutonomousFounderLaunchAuthorityWithRetries,
  maybeRunAutonomousFounderLaunchAuthority,
  areFounderLaunchPrerequisitesMet,
  getLastAutonomousFounderLaunchAssessment,
  resetAutonomousFounderLaunchAssessmentForTests,
} from './autonomous-founder-launch-orchestrator.js';

export {
  runAiDevEngineEvidencePipeline,
  materializeUniversalCrudWorkspaceFiles,
  type AiDevEngineEvidencePipelineResult,
} from './aidev-engine-evidence-pipeline.js';

export { evaluateInvisibleFounderLaunchTrigger } from './founder-invisible-trigger.js';
export type { InvisibleFounderLaunchTriggerResult } from './founder-invisible-trigger.js';

export { mapAutonomousFounderLaunchCouncilAuthority } from './autonomous-founder-launch-integration.js';

export {
  AFLA_CANONICAL_OWNERSHIP_STATUS,
  AFLA_CANONICAL_RESPONSIBILITIES,
  AFLA_CONSOLIDATED_CAPABILITIES,
  getAutonomousFounderLaunchConsolidationOwnership,
} from './autonomous-founder-launch-consolidation-ownership.js';
export type { AutonomousFounderLaunchConsolidationOwnership } from './autonomous-founder-launch-consolidation-ownership.js';
