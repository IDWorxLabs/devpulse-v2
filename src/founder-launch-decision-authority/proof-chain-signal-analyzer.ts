/**
 * Proof chain signal analyzer — aggregate evidence from existing authorities.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type {
  AssessFounderLaunchDecisionInput,
  ProofChainSignal,
  ProofChainSignalAnalysis,
} from './founder-launch-decision-authority-types.js';

function signal(
  signalId: string,
  sourceAuthority: string,
  label: string,
  present: boolean,
  strength: ProofChainSignal['strength'],
  detail: string,
): ProofChainSignal {
  return { readOnly: true, signalId, sourceAuthority, label, present, strength, detail };
}

function strengthFromProofLevel(level: string | undefined): ProofChainSignal['strength'] {
  if (level === 'PROVEN') return 'STRONG';
  if (level === 'PARTIAL') return 'MODERATE';
  if (level === 'CONFIRMED') return 'STRONG';
  return 'ABSENT';
}

export function analyzeProofChainSignals(input: {
  snapshot: {
    liveExecutionRunner: AssessFounderLaunchDecisionInput['liveExecutionRunner'];
    launchReadinessProof: AssessFounderLaunchDecisionInput['launchReadinessProof'];
    runtimeActivationProof: AssessFounderLaunchDecisionInput['runtimeActivationProof'];
    previewExperienceProof: AssessFounderLaunchDecisionInput['previewExperienceProof'];
    buildMaterialization: AssessFounderLaunchDecisionInput['buildMaterialization'];
    verificationExecutionProof: AssessFounderLaunchDecisionInput['verificationExecutionProof'];
    founderTestLaunchReadiness: AssessFounderLaunchDecisionInput['founderTestLaunchReadiness'];
    founderTestRealitySweep: AssessFounderLaunchDecisionInput['founderTestRealitySweep'];
    launchCouncil: AssessFounderLaunchDecisionInput['launchCouncil'];
    requirementsToPlanContract: AssessFounderLaunchDecisionInput['requirementsToPlanContract'];
    autonomousBuildExecutionProof: AssessFounderLaunchDecisionInput['autonomousBuildExecutionProof'];
    founderTestAssessment: AssessFounderLaunchDecisionInput['founderTestAssessment'];
  };
  sourceCodeOnlyFixture?: boolean;
}): ProofChainSignalAnalysis {
  const signals: ProofChainSignal[] = [];
  const missingEvidence: string[] = [];
  const s = input.snapshot;

  const runner = s.liveExecutionRunner;
  if (runner) {
    signals.push(
      signal(
        'live-execution-runner',
        'live-idea-to-launch-execution-runner',
        'Execution lifecycle',
        true,
        runner.executionVerdict === 'PROVEN' ? 'STRONG' : runner.executionVerdict === 'PARTIAL' ? 'MODERATE' : 'WEAK',
        `${runner.executionState} — ${runner.executionVerdict} (${runner.overallExecutionScore}/100)`,
      ),
    );
    missingEvidence.push(...runner.missingEvidence.slice(0, 4));
  } else {
    missingEvidence.push('Live Idea-To-Launch Execution Runner not assessed');
    signals.push(
      signal('live-execution-runner', 'live-idea-to-launch-execution-runner', 'Execution lifecycle', false, 'ABSENT', 'not assessed'),
    );
  }

  const launchProof = s.launchReadinessProof;
  const launchReadinessProven = launchProof?.launchProofLevel === 'PROVEN';
  signals.push(
    signal(
      'launch-readiness-proof',
      'connected-launch-readiness-proof',
      'Launch readiness proof',
      Boolean(launchProof),
      strengthFromProofLevel(launchProof?.launchProofLevel),
      launchProof ? `${launchProof.launchProofLevel} — ${launchProof.launchState}` : 'not assessed',
    ),
  );
  if (!launchProof) missingEvidence.push('Connected Launch Readiness Proof not assessed');

  const runtime = s.runtimeActivationProof;
  const runtimeProven = runtime?.runtimeProofLevel === 'PROVEN';
  signals.push(
    signal(
      'runtime-activation',
      'connected-runtime-activation-proof',
      'Runtime activation',
      Boolean(runtime),
      strengthFromProofLevel(runtime?.runtimeProofLevel),
      runtime ? `${runtime.runtimeProofLevel} — ${runtime.runtimeActivationState}` : 'not assessed',
    ),
  );
  if (!runtimeProven) missingEvidence.push('Runtime activation not proven');

  const preview = s.previewExperienceProof;
  const previewProven = preview?.previewProofLevel === 'PROVEN';
  signals.push(
    signal(
      'preview-experience',
      'connected-preview-experience-proof',
      'Preview experience',
      Boolean(preview),
      strengthFromProofLevel(preview?.previewProofLevel),
      preview ? `${preview.previewProofLevel} — ${preview.previewState}` : 'not assessed',
    ),
  );

  const build = s.buildMaterialization;
  const buildProven = build?.proofLevel === 'PROVEN' && !input.sourceCodeOnlyFixture;
  signals.push(
    signal(
      'build-materialization',
      'connected-build-execution',
      'Build materialization',
      Boolean(build) && !input.sourceCodeOnlyFixture,
      input.sourceCodeOnlyFixture ? 'WEAK' : strengthFromProofLevel(build?.proofLevel),
      input.sourceCodeOnlyFixture
        ? 'source code only — not launch evidence'
        : build
          ? `${build.proofLevel} — ${build.generatedFileEvidence.fileCount} files`
          : 'not assessed',
    ),
  );
  if (!buildProven && !input.sourceCodeOnlyFixture) {
    missingEvidence.push('Build materialization not proven');
  }

  const verify = s.verificationExecutionProof;
  const validationProven = verify?.verificationProofLevel === 'PROVEN';
  signals.push(
    signal(
      'verification-execution',
      'connected-verification-execution-proof',
      'Verification / UVL execution',
      Boolean(verify),
      strengthFromProofLevel(verify?.verificationProofLevel),
      verify ? `${verify.verificationProofLevel} — ${verify.verificationState}` : 'not assessed',
    ),
  );

  const founderLaunch = s.founderTestLaunchReadiness;
  if (founderLaunch) {
    signals.push(
      signal(
        'founder-test-launch-readiness',
        'founder-test-launch-readiness',
        'Founder test launch readiness',
        true,
        founderLaunch.launchReadinessVerdict.startsWith('LAUNCH_READY') ? 'STRONG' : 'MODERATE',
        founderLaunch.launchReadinessVerdict,
      ),
    );
  }

  const sweep = s.founderTestRealitySweep;
  if (sweep) {
    signals.push(
      signal(
        'founder-reality-sweep',
        'founder-test-reality-sweep',
        'Founder reality sweep',
        true,
        sweep.founderLaunchVerdict === 'READY_TO_LAUNCH' ? 'STRONG' : 'MODERATE',
        `${sweep.founderLaunchVerdict} — ${sweep.launchReadinessPercent}% ready`,
      ),
    );
    missingEvidence.push(...sweep.blockingReasons.slice(0, 2));
  }

  if (s.launchCouncil) {
    signals.push(
      signal(
        'launch-council',
        'launch-council',
        'Launch Council',
        true,
        s.launchCouncil.readinessState === 'READY' ? 'STRONG' : 'MODERATE',
        `readiness ${s.launchCouncil.readinessState}, score ${s.launchCouncil.overallScore}/100`,
      ),
    );
  }

  if (s.requirementsToPlanContract) {
    signals.push(
      signal(
        'requirements-contract',
        'requirements-to-plan-execution-contract',
        'Requirements-to-plan contract',
        true,
        strengthFromProofLevel(s.requirementsToPlanContract.proofLevel),
        s.requirementsToPlanContract.proofLevel,
      ),
    );
  }

  const vaultCount = getDevPulseV2ProjectVaultAuthority().listProjects().length;
  signals.push(
    signal(
      'project-vault',
      'project-vault',
      'Project vault',
      vaultCount > 0,
      vaultCount > 0 ? 'MODERATE' : 'ABSENT',
      `${vaultCount} project record(s)`,
    ),
  );

  const launchProofAuthoritative = s.launchReadinessProof?.launchProofLevel === 'PROVEN';

  const criticalBlockerCount = launchProofAuthoritative
    ? (s.launchReadinessProof?.blockers.criticalCount ?? 0)
    : (s.launchReadinessProof?.blockers.criticalCount ?? 0) +
      (founderLaunch?.topBlockers.filter((b) => b.severity === 'CRITICAL').length ?? 0) +
      (sweep?.launchBlockers.filter((b) => b.severity === 'CRITICAL').length ?? 0);

  const presentStrong = signals.filter((x) => x.strength === 'STRONG').length;
  const presentTotal = signals.filter((x) => x.present).length;
  let proofChainScore = Math.round((presentStrong * 15 + presentTotal * 5));
  if (runner) proofChainScore = Math.max(proofChainScore, runner.overallExecutionScore);
  proofChainScore = Math.min(100, proofChainScore);

  if (input.sourceCodeOnlyFixture) {
    proofChainScore = Math.min(proofChainScore, 35);
  }

  return {
    readOnly: true,
    signals,
    proofChainScore,
    executionState: runner?.executionState ?? 'UNKNOWN',
    executionVerdict: runner?.executionVerdict ?? 'UNKNOWN',
    runtimeProven: runtimeProven && !input.sourceCodeOnlyFixture,
    previewProven: previewProven ?? false,
    launchReadinessProven: launchReadinessProven && !input.sourceCodeOnlyFixture,
    buildMaterializationProven: buildProven,
    validationProven: validationProven ?? false,
    criticalBlockerCount,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
  };
}
