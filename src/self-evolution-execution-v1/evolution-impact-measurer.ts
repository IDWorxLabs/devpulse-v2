/**
 * Self-Evolution Execution V1 — bounded impact measurement.
 */

import { loadPipelineEvidenceBundle } from '../large-scale-pipeline-integration-v1/pipeline-evidence-loader.js';
import { loadMobileRuntimeValidationAssessmentFromDisk } from '../mobile-runtime-validation-at-scale-v1/index.js';
import type {
  EvolutionExperimentResult,
  EvolutionImpactAssessment,
} from './self-evolution-execution-v1-types.js';

export function measureEvolutionImpact(input: {
  projectRootDir: string;
  experiment: EvolutionExperimentResult;
}): EvolutionImpactAssessment {
  const bundle = loadPipelineEvidenceBundle(input.projectRootDir);
  const mobile = loadMobileRuntimeValidationAssessmentFromDisk(input.projectRootDir);

  const beforeBuild = bundle.rbepGeneralization.buildSuccessRate || 0;
  const beforeVerification = bundle.uvlCoverage.verificationCoveragePercent || 0;
  const beforeRuntime = bundle.cloudAssessment.jobsCompleted > 0 ? 100 : 0;
  const beforeProduction = bundle.productionAssessment.productionReadinessScore || 0;
  const beforeMobile = mobile?.mobilePassRate ?? 0;
  const beforePipeline =
    bundle.rbepProofCoverage.proofCoveragePercent ||
    bundle.uvlCoverage.verificationCoveragePercent ||
    0;

  const exec = input.experiment;
  const afterBuild = exec.buildPassed ? 100 : 0;
  const afterVerification = exec.verificationPassed ? 100 : afterBuild;
  const afterRuntime = exec.previewPassed && exec.buildPassed ? 100 : 0;
  const afterProduction = exec.productionReadinessPassed
    ? Math.max(70, bundle.productionAssessment.productionReadinessScore || 70)
    : 0;
  const afterMobile = beforeMobile;
  const afterPipeline = Math.round(
    (afterBuild + afterVerification + afterProduction) / 3,
  );

  const beforeScore = Math.round(
    (beforeBuild + beforeVerification + beforeProduction + beforePipeline) / 4,
  );
  const afterScore = Math.round(
    (afterBuild + afterVerification + afterProduction + afterPipeline) / 4,
  );
  const improvement = Math.max(0, afterScore - beforeScore + (exec.validationPassed ? 5 : 0));

  let regressionRisk: EvolutionImpactAssessment['regressionRisk'] = 'LOW';
  if (!exec.buildPassed || !exec.previewPassed) regressionRisk = 'HIGH';
  else if (!exec.verificationPassed) regressionRisk = 'MEDIUM';

  return {
    readOnly: true,
    experimentId: input.experiment.experimentId,
    proposalId: input.experiment.proposalId,
    beforeScore,
    afterScore,
    improvement,
    regressionRisk,
    confidence: exec.validationPassed ? Math.min(100, 70 + improvement) : 40,
    areas: {
      readOnly: true,
      buildSuccess: { before: beforeBuild, after: afterBuild },
      verification: { before: beforeVerification, after: afterVerification },
      runtime: { before: beforeRuntime, after: afterRuntime },
      productionReadiness: { before: beforeProduction, after: afterProduction },
      mobile: { before: beforeMobile, after: afterMobile },
      pipelineScore: { before: beforePipeline, after: afterPipeline },
    },
  };
}
