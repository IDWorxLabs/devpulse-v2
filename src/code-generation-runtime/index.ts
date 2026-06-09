/**
 * DevPulse V2 Phase 14.3 — Code Generation Runtime Foundation public API.
 */

export {
  CODE_GENERATION_RUNTIME_FOUNDATION_PASS_TOKEN,
  CODE_GENERATION_RUNTIME_OWNER_MODULE,
  CODE_GENERATION_QUESTION_SIGNALS,
  CODE_GENERATION_INPUT_SOURCES,
  FORBIDDEN_CODE_GENERATION_RUNTIME_DUPLICATES,
  isCodeGenerationRuntimeFoundationQuestion,
  isDuplicateCodeGenerationBrainQuestion,
  isCodeGenerationPlanningAdvisoryQuestion,
  type CodeGenerationState,
  type CodeGenerationConfidence,
  type CodeGenerationStrategy,
  type CodeGenerationRequest,
  type CodeArtifactProposal,
  type CodeChangeProposal,
  type CodeGenerationRisk,
  type CodeGenerationValidationPlan,
  type CodeGenerationPlan,
  type CodeGenerationRuntimeDiagnostics,
  type CodeGenerationRuntimeResult,
} from './code-generation-runtime-types.js';

export {
  parseCodeGenerationRequest,
  resetCodeGenerationRequestCounterForTests,
} from './code-generation-request-parser.js';

export {
  buildArtifactProposals,
  resetCodeArtifactCounterForTests,
} from './code-artifact-model.js';

export {
  buildChangeProposals,
  extractTargetFiles,
  resetCodeChangeProposalCounterForTests,
} from './code-change-proposal-builder.js';

export {
  selectGenerationStrategy,
  strategyDescription,
} from './code-generation-strategy.js';

export {
  analyzeCodeGenerationRisks,
  resetCodeGenerationRiskCounterForTests,
} from './code-generation-risk-analyzer.js';

export { createCodeGenerationValidationPlan } from './code-generation-validation-plan.js';

export {
  buildCodeGenerationPlan,
  strategyRationale,
  resetCodeGenerationPlanCounterForTests,
} from './code-generation-plan-builder.js';

export {
  getCodeGenerationRuntimeDiagnostics,
  updateCodeGenerationRuntimeDiagnostics,
  resetCodeGenerationRuntimeDiagnostics,
  codeGenerationRuntimeKey,
} from './code-generation-runtime-diagnostics.js';

export {
  processCodeGenerationRuntimeRequest,
  getCodeGenerationRuntimeContext,
} from './code-generation-runtime.js';

export function getDevPulseV2CodeGenerationRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_code_generation_runtime',
    passToken: 'DEVPULSE_V2_CODE_GENERATION_RUNTIME_FOUNDATION_V1_PASS',
    phase: 14.3,
  };
}
