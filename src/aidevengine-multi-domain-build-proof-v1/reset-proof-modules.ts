/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — authority module reset between scenarios.
 */

import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../aidev-engine/aidev-engine-authority.js';
import { resetCqiMaturityHistoryForTests } from '../clarifying-question-intelligence/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../requirements-to-plan-execution-contract/index.js';
import { resetAutonomousFounderLaunchAssessmentForTests } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { resetFeatureRealityAssessmentForTests } from '../feature-reality-validation/feature-reality-validation-authority.js';
import { resetBlueprintVisualAssessmentForTests } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-authority.js';
import { resetEngineeringRealityAssessmentForTests } from '../engineering-reality-authority/engineering-reality-authority.js';
import { resetUniversalFeatureContractAssessmentForTests } from '../universal-feature-contract-intelligence/universal-feature-contract-authority.js';
import { resetProductArchitectIntelligenceHistoryForTests } from '../product-architect-intelligence-v1/product-architect-intelligence-history.js';
import { resetUvlMaturityHistoryForTests } from '../unified-verification-lab/index.js';
import { resetLaunchReadinessHistoryForTests } from '../launch-readiness-authority/index.js';

export function resetMultiDomainProofModules(): void {
  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetCqiMaturityHistoryForTests();
  resetAutonomousFounderLaunchAssessmentForTests();
  resetFeatureRealityAssessmentForTests();
  resetBlueprintVisualAssessmentForTests();
  resetEngineeringRealityAssessmentForTests();
  resetUniversalFeatureContractAssessmentForTests();
  resetProductArchitectIntelligenceHistoryForTests();
  resetUvlMaturityHistoryForTests();
  resetLaunchReadinessHistoryForTests();
}
