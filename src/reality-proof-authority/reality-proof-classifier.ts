/**
 * Reality-Proof Authority Classifier — deterministic evidence level assignment.
 */

import type { FounderTestV4ReportWithCompetitiveReality } from '../founder-testing-mode/founder-testing-v4-types.js';
import { mapEvidenceAuthoritiesFromFounderTestV4 } from '../launch-council/launch-council-founder-integration.js';
import type { LaunchCouncilAuthorityResult } from '../launch-council/launch-council-types.js';
import { MAX_REALITY_PROOF_FINDINGS } from './reality-proof-bounds.js';
import type { RealityEvidenceLevel, RealityProofCategory, RealityProofFinding } from './reality-proof-types.js';

function makeFinding(input: Omit<RealityProofFinding, 'id'> & { id: string }): RealityProofFinding {
  return {
    ...input,
    evidence: input.evidence.slice(0, 6),
  };
}

function classifyAuthorityResult(result: LaunchCouncilAuthorityResult): RealityEvidenceLevel {
  if (result.status === 'NOT_RUN') return 'UNKNOWN_REALITY';
  if (result.authorityId === 'repository-typecheck-reality' && result.score > 0) return 'PROVEN_REALITY';
  if (result.authorityId === 'founder-testing' && result.score > 0) return 'OBSERVED_REALITY';
  if (result.authorityId === 'chat-intelligence-reality' && result.status === 'PASS') return 'OBSERVED_REALITY';
  if (result.status === 'PASS' || result.status === 'WARNING') return 'INFERRED_REALITY';
  return 'ASSUMED_REALITY';
}

export function classifyRealityProofFindings(
  report: FounderTestV4ReportWithCompetitiveReality,
): RealityProofFinding[] {
  const findings: RealityProofFinding[] = [];
  const typecheck = report.repositoryTypecheckReality;
  const chat = report.chatIntelligenceReality;
  const verification = report.verificationResultsVisibility;
  const userSuccess = report.userSuccessAuthority;
  const authorityResults = mapEvidenceAuthoritiesFromFounderTestV4(report);

  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    findings.push(
      makeFinding({
        id: 'execution-typecheck-not-run',
        category: 'EXECUTION_PROOF',
        evidenceLevel: 'UNKNOWN_REALITY',
        finding: 'Repository typecheck was not executed during founder testing',
        evidence: [`Readiness state: ${typecheck.readinessState}`],
        risk: 'Launch conclusions may rely on missing compile-time proof',
        recommendation: 'Execute live npx tsc --noEmit before treating type safety as proven.',
      }),
    );
  } else if (typecheck.checkedCommand.includes('tsc') && typecheck.checkedAt > 0) {
    findings.push(
      makeFinding({
        id: 'execution-typecheck-live',
        category: 'EXECUTION_PROOF',
        evidenceLevel: 'PROVEN_REALITY',
        finding: 'Live repository typecheck executed with recorded command output',
        evidence: [
          `Command: ${typecheck.checkedCommand}`,
          `Errors: ${typecheck.errorCount}`,
          `Warnings: ${typecheck.warningCount}`,
          `State: ${typecheck.readinessState}`,
        ],
        risk: 'Type errors may still exist in paths not covered by the check',
        recommendation: 'Keep live typecheck in the founder test pipeline before launch.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'execution-typecheck-inferred',
        category: 'EXECUTION_PROOF',
        evidenceLevel: 'INFERRED_REALITY',
        finding: 'Typecheck assessment exists without full live execution proof',
        evidence: [`State: ${typecheck.readinessState}`, `Command: ${typecheck.checkedCommand || 'none'}`],
        risk: 'Cached or partial typecheck may not reflect current repository state',
        recommendation: 'Prefer live npx tsc --noEmit over cached assessment only.',
      }),
    );
  }

  if (chat.scenariosRun > 0 && chat.scenarioResults.length > 0) {
    findings.push(
      makeFinding({
        id: 'interaction-chat-scenarios',
        category: 'INTERACTION_PROOF',
        evidenceLevel: 'OBSERVED_REALITY',
        finding: 'Chat intelligence was exercised through bounded scenario interactions',
        evidence: [
          `Scenarios run: ${chat.scenariosRun}`,
          `Scenarios passed: ${chat.scenariosPassed}`,
          `Verdict: ${chat.chatLaunchVerdict}`,
        ],
        risk: 'Scenario coverage may not represent all founder chat paths',
        recommendation: 'Extend scenario coverage for critical launch prompts.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'interaction-chat-missing',
        category: 'INTERACTION_PROOF',
        evidenceLevel: 'UNKNOWN_REALITY',
        finding: 'Chat intelligence proof is unknown because no scenarios ran',
        evidence: [`Scenarios run: ${chat.scenariosRun}`],
        risk: 'Chat readiness may be inferred without observed interactions',
        recommendation: 'Run chat intelligence reality scenarios before launch claims.',
      }),
    );
  }

  if (report.durationMs > 0) {
    findings.push(
      makeFinding({
        id: 'runtime-founder-test-executed',
        category: 'RUNTIME_PROOF',
        evidenceLevel: 'OBSERVED_REALITY',
        finding: 'Founder testing runtime executed and produced measurable results',
        evidence: [`Duration ms: ${report.durationMs}`, `Verdict: ${report.verdict}`],
        risk: 'Founder test duration alone does not prove every product path',
        recommendation: 'Pair founder test execution with live preview and verification proof.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'runtime-founder-test-not-run',
        category: 'RUNTIME_PROOF',
        evidenceLevel: 'UNKNOWN_REALITY',
        finding: 'Founder testing runtime evidence is unknown',
        evidence: ['Duration ms: 0'],
        risk: 'Launch readiness may be based on authority aggregation only',
        recommendation: 'Run the full founder test pipeline before synthesis.',
      }),
    );
  }

  if (verification.launchReady || verification.state === 'VERIFICATION_LAUNCH_READY') {
    findings.push(
      makeFinding({
        id: 'runtime-verification-launch-ready',
        category: 'RUNTIME_PROOF',
        evidenceLevel: 'PROVEN_REALITY',
        finding: 'Runtime verification recorded launch-ready execution evidence',
        evidence: [
          `State: ${verification.state}`,
          `Launch ready: ${verification.launchReady}`,
          verification.launchReadyReason,
        ],
        risk: 'Launch-ready verification may not cover every user path',
        recommendation: 'Keep runtime verification aligned with founder-visible workflows.',
      }),
    );
  }

  if (verification.state !== 'NO_VERIFICATION_RUN') {
    findings.push(
      makeFinding({
        id: 'verification-results-recorded',
        category: 'VERIFICATION_PROOF',
        evidenceLevel: verification.launchReady ? 'PROVEN_REALITY' : 'OBSERVED_REALITY',
        finding: 'Verification results visibility recorded runtime verification state',
        evidence: [
          `State: ${verification.state}`,
          `Launch ready: ${verification.launchReady}`,
          `Pass count: ${verification.summary.passCount}`,
        ],
        risk: 'Verification scope may not cover all launch-critical capabilities',
        recommendation: 'Ensure verification checks map to launch-blocking capabilities.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'verification-not-run',
        category: 'VERIFICATION_PROOF',
        evidenceLevel: 'ASSUMED_REALITY',
        finding: 'Verification proof is assumed because no verification run was recorded',
        evidence: [`State: ${verification.state}`],
        risk: 'Launch may rely on assumed verification without runtime proof',
        recommendation: 'Run bounded verification before treating outcomes as proven.',
      }),
    );
  }

  if (userSuccess.scenarioResults.length > 0) {
    const passedGoals = userSuccess.scenarioResults.filter((scenario) => scenario.passed).length;
    findings.push(
      makeFinding({
        id: 'user-success-scenarios',
        category: 'USER_PROOF',
        evidenceLevel: passedGoals > 0 ? 'OBSERVED_REALITY' : 'INFERRED_REALITY',
        finding:
          passedGoals > 0
            ? 'User success scenarios observed goal completion signals'
            : 'User success scenarios ran but did not observe successful outcomes',
        evidence: [
          `Scenarios: ${userSuccess.scenarioResults.length}`,
          `Passed goals: ${passedGoals}`,
          `Score: ${userSuccess.userSuccessScore}/100`,
        ],
        risk: 'Scenario success may not equal real user success in production',
        recommendation: 'Validate top user goals with observed workflow completion.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'user-success-predicted',
        category: 'USER_PROOF',
        evidenceLevel: 'ASSUMED_REALITY',
        finding: 'User success is predicted from scores without observed scenario proof',
        evidence: [`User success score: ${userSuccess.userSuccessScore}/100`],
        risk: 'Success may be assumed rather than proven through user behavior',
        recommendation: 'Run user success scenarios and record observed outcomes.',
      }),
    );
  }

  const inferredAuthorities = authorityResults.filter(
    (result) => classifyAuthorityResult(result) === 'INFERRED_REALITY',
  );
  const provenOrObservedAuthorities = authorityResults.filter((result) => {
    const level = classifyAuthorityResult(result);
    return level === 'PROVEN_REALITY' || level === 'OBSERVED_REALITY';
  });

  findings.push(
    makeFinding({
      id: 'launch-council-authority-mix',
      category: 'LAUNCH_PROOF',
      evidenceLevel:
        provenOrObservedAuthorities.length > inferredAuthorities.length
          ? 'OBSERVED_REALITY'
          : inferredAuthorities.length > provenOrObservedAuthorities.length
            ? 'INFERRED_REALITY'
            : 'ASSUMED_REALITY',
      finding: 'Launch Council evidence mix separates reality-backed from authority-inferred conclusions',
      evidence: [
        `Reality-backed authorities: ${provenOrObservedAuthorities.length}`,
        `Inferred authority conclusions: ${inferredAuthorities.length}`,
        `Participating authorities: ${authorityResults.filter((result) => result.status !== 'NOT_RUN').length}`,
      ],
      risk: 'Council scores may overweight inferred authority conclusions',
      recommendation: 'Treat authority PASS status as inference until runtime proof exists.',
    }),
  );

  findings.push(
    makeFinding({
      id: 'launch-confidence-inference',
      category: 'LAUNCH_PROOF',
      evidenceLevel: 'INFERRED_REALITY',
      finding: 'Launch confidence would be derived from weighted authority scores, not direct runtime proof',
      evidence: [
        `Trust blocks: ${report.trustAuthority.blocksLaunchReadiness}`,
        `User success blocks: ${report.userSuccessAuthority.blocksLaunchReadiness}`,
        `Competitive score: ${report.competitiveRealityAuthority.competitiveRealityScore}/100`,
      ],
      risk: 'High launch confidence can exist without proportional reality proof',
      recommendation: 'Require Reality-Proof clearance before public launch recommendations.',
    }),
  );

  for (const result of authorityResults.slice(0, 4)) {
    const level = classifyAuthorityResult(result);
    if (level === 'INFERRED_REALITY' || level === 'ASSUMED_REALITY') {
      findings.push(
        makeFinding({
          id: `authority-inferred-${result.authorityId}`,
          category: 'LAUNCH_PROOF',
          evidenceLevel: level,
          finding: `${result.authorityName} conclusion is ${level.replaceAll('_', ' ').toLowerCase()}`,
          evidence: [`Status: ${result.status}`, `Score: ${result.score}/100`],
          risk: 'Authority output must not be treated as runtime proof',
          recommendation: `Validate ${result.authorityName} claims with observed or executed evidence.`,
        }),
      );
    }
  }

  return findings.slice(0, MAX_REALITY_PROOF_FINDINGS);
}

export function countRealityLevels(findings: RealityProofFinding[]): {
  provenRealityCount: number;
  observedRealityCount: number;
  inferredRealityCount: number;
  assumedRealityCount: number;
  unknownRealityCount: number;
} {
  return {
    provenRealityCount: findings.filter((finding) => finding.evidenceLevel === 'PROVEN_REALITY').length,
    observedRealityCount: findings.filter((finding) => finding.evidenceLevel === 'OBSERVED_REALITY').length,
    inferredRealityCount: findings.filter((finding) => finding.evidenceLevel === 'INFERRED_REALITY').length,
    assumedRealityCount: findings.filter((finding) => finding.evidenceLevel === 'ASSUMED_REALITY').length,
    unknownRealityCount: findings.filter((finding) => finding.evidenceLevel === 'UNKNOWN_REALITY').length,
  };
}

export { classifyAuthorityResult };
