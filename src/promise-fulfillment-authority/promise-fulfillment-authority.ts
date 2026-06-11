/**
 * Promise Fulfillment Authority — deterministic promised-vs-observed evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithSkeptical } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  MAX_PROMISE_RECOMMENDATIONS,
  PROMISE_FULFILLMENT_BLOCK_SCORE,
  PROMISE_FULFILLMENT_CACHE_KEY_PREFIX,
  PROMISE_SCORE_CONTRADICTED,
  PROMISE_SCORE_FULFILLED,
  PROMISE_SCORE_PARTIAL,
  PROMISE_SCORE_UNPROVEN,
} from './promise-fulfillment-bounds.js';
import { recordPromiseFulfillmentAssessment } from './promise-fulfillment-history.js';
import { buildPromiseFulfillmentReportMarkdown } from './promise-fulfillment-report-builder.js';
import { REGISTERED_PROMISES } from './promise-fulfillment-registry.js';
import type {
  PromiseAssessment,
  PromiseFulfillmentAssessment,
  PromiseFulfillmentReadinessState,
  PromiseStatus,
  RegisteredPromiseDefinition,
} from './promise-fulfillment-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreForStatus(status: PromiseStatus): number {
  switch (status) {
    case 'FULFILLED':
      return PROMISE_SCORE_FULFILLED;
    case 'PARTIALLY_FULFILLED':
      return PROMISE_SCORE_PARTIAL;
    case 'UNPROVEN':
      return PROMISE_SCORE_UNPROVEN;
    case 'CONTRADICTED':
      return PROMISE_SCORE_CONTRADICTED;
  }
}

function founderEvidence(label: string, detail: string): string {
  return `Founder Testing: ${label} — ${detail}`;
}

function chatEvidence(label: string, detail: string): string {
  return `Chat Intelligence Reality: ${label} — ${detail}`;
}

function typecheckEvidence(label: string, detail: string): string {
  return `Repository Typecheck Reality: ${label} — ${detail}`;
}

function skepticalEvidence(label: string, detail: string): string {
  return `Skeptical Founder Simulator: ${label} — ${detail}`;
}

function assessPromise(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  switch (definition.promiseId) {
    case 'understands-product-ideas':
      return assessUnderstandsProductIdeas(definition, report);
    case 'helps-create-applications':
      return assessHelpsCreateApplications(definition, report);
    case 'understands-requirements':
      return assessUnderstandsRequirements(definition, report);
    case 'assists-planning':
      return assessAssistsPlanning(definition, report);
    case 'understands-intent':
      return assessUnderstandsIntent(definition, report);
    case 'answers-correctly':
      return assessAnswersCorrectly(definition, report);
    case 'provides-useful-guidance':
      return assessProvidesUsefulGuidance(definition, report);
    case 'readiness-visibility':
      return assessReadinessVisibility(definition, report);
    case 'verification-visibility':
      return assessVerificationVisibility(definition, report);
    case 'launch-confidence':
      return assessLaunchConfidence(definition, report);
    case 'honesty':
      return assessHonesty(definition, report);
    case 'transparency':
      return assessTransparency(definition, report);
    case 'uncertainty-visibility':
      return assessUncertaintyVisibility(definition, report);
    case 'software-creation':
      return assessSoftwareCreation(definition, report);
    case 'project-understanding':
      return assessProjectUnderstanding(definition, report);
    case 'architecture-support':
      return assessArchitectureSupport(definition, report);
    default:
      return {
        promiseId: definition.promiseId,
        promise: definition.promise,
        category: definition.category,
        status: 'UNPROVEN',
        confidence: 40,
        supportingEvidence: [],
        contradictoryEvidence: [founderEvidence('assessment', 'No bounded evaluator registered for this promise')],
        recommendations: ['Register a bounded evaluator before treating this promise as fulfilled.'],
      };
  }
}

function assessUnderstandsProductIdeas(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const supporting: string[] = [
    founderEvidence('idea-to-app score', `${report.ideaToAppScore}/100`),
    founderEvidence('creation journey score', `${report.creationJourneyScore}/100`),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (report.ideaToAppScore >= 70 && report.creationJourneyScore >= 70) {
    status = 'FULFILLED';
  } else if (report.ideaToAppScore >= 55 || report.creationJourneyScore >= 55) {
    status = 'PARTIALLY_FULFILLED';
  } else if (report.ideaToAppScore < 45 && report.creationJourneyScore < 45) {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('journey reality', 'Idea-to-app and creation journey scores both remain weak'));
  }

  if (report.skepticalFounderSimulator.objections.some((item) => item.toLowerCase().includes('purpose'))) {
    contradictory.push(skepticalEvidence('purpose challenge', 'Skeptical founder still questions product understanding'));
    if (status === 'FULFILLED') status = 'PARTIALLY_FULFILLED';
    else if (status === 'PARTIALLY_FULFILLED') status = 'CONTRADICTED';
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Make idea-to-app and creation journey proof visible in the first founder session.',
  ]);
}

function assessHelpsCreateApplications(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const builder = report.autonomousBuilderReality;
  const supporting: string[] = [founderEvidence('autonomous builder score', `${builder.score}/100`)];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (builder.canExecuteBuilds && builder.canCreatePreviews && builder.score >= 70) {
    status = 'FULFILLED';
    supporting.push(founderEvidence('execution path', 'Build execution and preview creation are connected'));
  } else if (builder.canPlanWork || builder.canCreatePreviews || builder.score >= 55) {
    status = 'PARTIALLY_FULFILLED';
    supporting.push(founderEvidence('partial builder path', 'Planning or preview support exists but full creation is limited'));
  } else if (!builder.canExecuteBuilds && builder.score < 45) {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('builder reality', 'Application creation path is not connected'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Connect bounded build execution and preview proof before claiming application creation.',
  ]);
}

function assessUnderstandsRequirements(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const memory = report.projectMemoryReality;
  const builder = report.autonomousBuilderReality;
  const supporting: string[] = [
    founderEvidence('project memory score', `${memory.score}/100`),
    founderEvidence('requirements support', builder.canCreateRequirements ? 'Can create requirements' : 'Requirements path limited'),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (memory.recallsRequirements && builder.canCreateRequirements && memory.score >= 65) {
    status = 'FULFILLED';
  } else if (memory.recallsRequirements || builder.canCreateRequirements) {
    status = 'PARTIALLY_FULFILLED';
  } else {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('requirements reality', 'Requirements recall and creation are not both supported'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Show requirements recall and requirement-generation proof from bounded founder workflows.',
  ]);
}

function assessAssistsPlanning(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const builder = report.autonomousBuilderReality;
  const supporting: string[] = [
    founderEvidence('planning support', builder.canPlanWork ? 'Can plan work' : 'Planning path limited'),
    founderEvidence('task support', builder.canCreateTasks ? 'Can create tasks' : 'Task creation limited'),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (builder.canPlanWork && builder.canCreateTasks) {
    status = 'FULFILLED';
  } else if (builder.canPlanWork || builder.canCreateTasks) {
    status = 'PARTIALLY_FULFILLED';
  } else {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('planning reality', 'Planning and task creation are not both supported'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Demonstrate bounded planning and task creation before claiming planning assistance.',
  ]);
}

function assessUnderstandsIntent(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const chat = report.chatIntelligenceReality;
  const supporting = [
    chatEvidence('intelligence score', `${chat.chatIntelligenceScore}/100`),
    chatEvidence('scenarios passed', `${chat.scenariosPassed}/${chat.scenariosRun}`),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (!chat.blocksLaunchReadiness && chat.chatIntelligenceScore >= 70 && chat.scenariosPassed >= 7) {
    status = 'FULFILLED';
  } else if (chat.chatIntelligenceScore >= 55 && chat.scenariosPassed >= 5) {
    status = 'PARTIALLY_FULFILLED';
  } else if (chat.blocksLaunchReadiness) {
    status = 'CONTRADICTED';
    contradictory.push(chatEvidence('launch block', 'Chat intelligence blocks launch readiness'));
  }

  return buildAssessment(definition, status, supporting, contradictory, chat.requiredFixesBeforeLaunch.slice(0, 2));
}

function assessAnswersCorrectly(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const chat = report.chatIntelligenceReality;
  const supporting = [
    chatEvidence('failed scenarios', `${chat.failedScenarios.length}`),
    chatEvidence('launch verdict', chat.chatLaunchVerdict),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (!chat.blocksLaunchReadiness && chat.failedScenarios.length <= 1 && chat.scenariosPassed >= 8) {
    status = 'FULFILLED';
  } else if (chat.scenariosPassed >= 6) {
    status = 'PARTIALLY_FULFILLED';
  } else if (chat.failedScenarios.length >= 3 || chat.blocksLaunchReadiness) {
    status = 'CONTRADICTED';
    contradictory.push(chatEvidence('accuracy gap', `${chat.failedScenarios.length} bounded scenarios failed`));
  }

  return buildAssessment(definition, status, supporting, contradictory, chat.requiredFixesBeforeLaunch.slice(0, 2));
}

function assessProvidesUsefulGuidance(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const chat = report.chatIntelligenceReality;
  const supporting = [chatEvidence('intelligence score', `${chat.chatIntelligenceScore}/100`)];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (chat.chatIntelligenceScore >= 75 && !chat.blocksLaunchReadiness) {
    status = 'FULFILLED';
  } else if (chat.chatIntelligenceScore >= 60) {
    status = 'PARTIALLY_FULFILLED';
  } else if (chat.chatIntelligenceScore < 50 || chat.blocksLaunchReadiness) {
    status = 'CONTRADICTED';
    contradictory.push(chatEvidence('usefulness gap', 'Bounded chat scenarios do not show consistently useful guidance'));
  }

  return buildAssessment(definition, status, supporting, contradictory, chat.requiredFixesBeforeLaunch.slice(0, 2));
}

function assessReadinessVisibility(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const visibility = report.verificationResultsVisibility;
  const lr = report.launchReadinessReality;
  const supporting = [
    founderEvidence('launch readiness reality', `${lr.launchReadinessRealityScore}/100`),
    founderEvidence('readiness explained', visibility.readinessExplained ? 'Yes' : 'No'),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (visibility.readinessExplained && lr.launchReadinessRealityScore >= 65) {
    status = 'FULFILLED';
  } else if (visibility.readinessExplained || lr.launchReadinessRealityScore >= 55) {
    status = 'PARTIALLY_FULFILLED';
  } else {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('visibility gap', 'Launch readiness is not explained with sufficient evidence'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Expose launch readiness reality with explainable evidence in Founder Testing output.',
  ]);
}

function assessVerificationVisibility(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const visibility = report.verificationResultsVisibility;
  const supporting = [
    founderEvidence('verification evidence present', visibility.evidencePresent ? 'Yes' : 'No'),
    founderEvidence('verification state', visibility.state),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (visibility.evidencePresent && visibility.launchReady) {
    status = 'FULFILLED';
  } else if (visibility.evidencePresent) {
    status = 'PARTIALLY_FULFILLED';
  } else if (visibility.state !== 'NO_VERIFICATION_RUN' && !visibility.evidencePresent) {
    status = 'CONTRADICTED';
    contradictory.push(founderEvidence('verification gap', 'Verification ran but evidence is not visible'));
  }

  if (report.skepticalFounderSimulator.objections.some((item) => item.toLowerCase().includes('verification'))) {
    contradictory.push(skepticalEvidence('trust challenge', 'Skeptical founder still questions verification visibility'));
    if (status === 'FULFILLED') status = 'PARTIALLY_FULFILLED';
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Make verification evidence visible and explainable before claiming verification visibility.',
  ]);
}

function assessLaunchConfidence(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const supporting: string[] = [founderEvidence('verdict', report.verdict)];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  const launchBlockers =
    report.chatIntelligenceReality.blocksLaunchReadiness ||
    report.repositoryTypecheckReality.blocksLaunchReadiness ||
    report.skepticalFounderSimulator.blocksLaunchReadiness ||
    report.issues.some((issue) => issue.severity === 'BLOCKER');

  if (launchBlockers) {
    status = 'CONTRADICTED';
    if (
      report.skepticalFounderSimulator.readinessState === 'HIGH_RISK' ||
      report.skepticalFounderSimulator.readinessState === 'BLOCKED'
    ) {
      contradictory.push(skepticalEvidence('readiness state', report.skepticalFounderSimulator.readinessState));
    }
    if (report.repositoryTypecheckReality.readinessState === 'TYPECHECK_NOT_RUN') {
      contradictory.push(typecheckEvidence('baseline', 'Repository typecheck baseline not established'));
    }
    if (report.chatIntelligenceReality.blocksLaunchReadiness) {
      contradictory.push(chatEvidence('launch block', 'Chat intelligence blocks launch readiness'));
    }
    contradictory.push(
      founderEvidence(
        'launch blockers',
        `${report.issues.filter((issue) => issue.severity === 'BLOCKER').length} blocker issue(s)`,
      ),
    );
  } else if (
    (report.verdict === 'READY_FOR_LAUNCH' || report.verdict === 'READY_FOR_PUBLIC_BETA') &&
    report.launchReadinessReality.launchReadinessRealityScore >= 70
  ) {
    status = 'FULFILLED';
    supporting.push(
      founderEvidence('launch readiness reality', `${report.launchReadinessReality.launchReadinessRealityScore}/100`),
    );
  } else if (report.launchReadinessReality.launchReadinessRealityScore >= 55) {
    status = 'PARTIALLY_FULFILLED';
  }

  return buildAssessment(definition, status, supporting, contradictory, report.recommendedFixOrder.slice(0, 3));
}

function assessHonesty(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const chat = report.chatIntelligenceReality;
  const skepticalState = report.skepticalFounderSimulator;
  const honestyScenario = skepticalState.scenarioResults.find((scenario) => scenario.id === 'honesty-challenge');
  const supporting = [
    chatEvidence('self-evolution advisory only', chat.selfEvolution.advisoryOnly ? 'Yes' : 'No'),
    skepticalEvidence('honesty challenge score', `${honestyScenario?.score ?? 0}/100`),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if ((honestyScenario?.passed ?? false) && chat.selfEvolution.advisoryOnly) {
    status = 'FULFILLED';
  } else if (honestyScenario && honestyScenario.score >= 55) {
    status = 'PARTIALLY_FULFILLED';
  } else if (skepticalState.criticalTrustObjection) {
    status = 'CONTRADICTED';
    contradictory.push(skepticalEvidence('critical trust objection', 'Skeptical founder detected trust without proof'));
  }

  return buildAssessment(definition, status, supporting, contradictory, skepticalState.recommendations.slice(0, 2));
}

function assessTransparency(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const visibility = report.verificationResultsVisibility;
  const trustScenario = report.skepticalFounderSimulator.scenarioResults.find((scenario) => scenario.id === 'trust-challenge');
  const supporting = [
    founderEvidence('verification evidence present', visibility.evidencePresent ? 'Yes' : 'No'),
    skepticalEvidence('trust challenge score', `${trustScenario?.score ?? 0}/100`),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (visibility.evidencePresent && (trustScenario?.passed ?? false)) {
    status = 'FULFILLED';
  } else if (visibility.evidencePresent || (trustScenario?.score ?? 0) >= 55) {
    status = 'PARTIALLY_FULFILLED';
  } else if ((trustScenario?.objections.length ?? 0) > 0) {
    status = 'CONTRADICTED';
    contradictory.push(
      ...(trustScenario?.objections.slice(0, 2).map((item) => skepticalEvidence('trust challenge', item)) ?? []),
    );
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Surface verification evidence and limits transparently before claiming operational transparency.',
  ]);
}

function assessUncertaintyVisibility(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const chat = report.chatIntelligenceReality;
  const typecheck = report.repositoryTypecheckReality;
  const honestyFailures = chat.failedScenarios.filter(
    (scenario) => !scenario.passed && !scenario.criteria.self_diagnosis_present,
  );
  const supporting = [
    chatEvidence('self-diagnosis under failure', honestyFailures.length === 0 ? 'Present' : 'Missing in some failures'),
    typecheckEvidence('readiness state', typecheck.readinessState),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (honestyFailures.length === 0 && typecheck.readinessState !== 'TYPECHECK_NOT_RUN') {
    status = 'FULFILLED';
  } else if (honestyFailures.length <= 1 || typecheck.founderProofNotes.length > 0) {
    status = 'PARTIALLY_FULFILLED';
  } else if (honestyFailures.length >= 2) {
    status = 'CONTRADICTED';
    contradictory.push(chatEvidence('honesty gap', 'Chat lacks self-diagnosis under direct honesty challenges'));
  }
  if (typecheck.readinessState === 'TYPECHECK_NOT_RUN') {
    contradictory.push(typecheckEvidence('baseline', 'Repository compile integrity baseline has not been established'));
    if (status !== 'CONTRADICTED') status = 'PARTIALLY_FULFILLED';
  }

  return buildAssessment(definition, status, supporting, contradictory, typecheck.recommendations.slice(0, 2));
}

function assessSoftwareCreation(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const builder = report.autonomousBuilderReality;
  const typecheck = report.repositoryTypecheckReality;
  const supporting = [
    founderEvidence('can execute builds', builder.canExecuteBuilds ? 'Yes' : 'No'),
    founderEvidence('can verify outputs', builder.canVerifyOutputs ? 'Yes' : 'No'),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (builder.canExecuteBuilds && builder.canVerifyOutputs && builder.score >= 65) {
    status = 'FULFILLED';
  } else if (builder.canPlanWork || builder.canCreatePreviews) {
    status = 'PARTIALLY_FULFILLED';
  } else if (!builder.canExecuteBuilds) {
    status = 'UNPROVEN';
    contradictory.push(founderEvidence('builder proof', 'No connected build execution proof available'));
  }

  if (typecheck.blocksLaunchReadiness && typecheck.readinessState === 'TYPECHECK_FAILED') {
    status = 'CONTRADICTED';
    contradictory.push(typecheckEvidence('compile integrity', 'Repository typecheck failed'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Prove bounded software creation and verification before claiming autonomous builder fulfillment.',
  ]);
}

function assessProjectUnderstanding(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const memory = report.projectMemoryReality;
  const supporting = [
    founderEvidence('retains context', memory.retainsContext ? 'Yes' : 'No'),
    founderEvidence('understands state', memory.understandsState ? 'Yes' : 'No'),
    founderEvidence('project memory score', `${memory.score}/100`),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (memory.retainsContext && memory.understandsState && memory.score >= 65) {
    status = 'FULFILLED';
  } else if (memory.retainsContext || memory.understandsState) {
    status = 'PARTIALLY_FULFILLED';
  } else {
    status = 'UNPROVEN';
    contradictory.push(founderEvidence('memory proof', 'Project context retention is not proven'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Demonstrate project memory retention and state understanding in bounded founder workflows.',
  ]);
}

function assessArchitectureSupport(
  definition: RegisteredPromiseDefinition,
  report: FounderTestV4ReportWithSkeptical,
): PromiseAssessment {
  const builder = report.autonomousBuilderReality;
  const supporting = [
    founderEvidence('can create architecture', builder.canCreateArchitecture ? 'Yes' : 'No'),
    founderEvidence('can coordinate systems', builder.canCoordinateSystems ? 'Yes' : 'No'),
  ];
  const contradictory: string[] = [];
  let status: PromiseStatus = 'UNPROVEN';

  if (builder.canCreateArchitecture && builder.canCoordinateSystems) {
    status = 'FULFILLED';
  } else if (builder.canCreateArchitecture || builder.canCoordinateSystems) {
    status = 'PARTIALLY_FULFILLED';
  } else {
    status = 'UNPROVEN';
    contradictory.push(founderEvidence('architecture proof', 'Architecture planning support is not proven'));
  }

  return buildAssessment(definition, status, supporting, contradictory, [
    'Show architecture planning and system coordination proof before claiming architecture support.',
  ]);
}

function buildAssessment(
  definition: RegisteredPromiseDefinition,
  status: PromiseStatus,
  supportingEvidence: string[],
  contradictoryEvidence: string[],
  recommendations: string[],
): PromiseAssessment {
  const confidence =
    status === 'FULFILLED'
      ? clamp(80 + supportingEvidence.length * 5)
      : status === 'PARTIALLY_FULFILLED'
        ? clamp(55 + supportingEvidence.length * 5)
        : status === 'UNPROVEN'
          ? 40
          : clamp(20 + contradictoryEvidence.length * 10);

  return {
    promiseId: definition.promiseId,
    promise: definition.promise,
    category: definition.category,
    status,
    confidence,
    supportingEvidence: supportingEvidence.slice(0, 6),
    contradictoryEvidence: contradictoryEvidence.slice(0, 6),
    recommendations: recommendations.length
      ? recommendations.slice(0, 3)
      : ['If reality cannot prove the claim, treat the claim as not fulfilled.'],
  };
}

function deriveReadinessState(
  fulfillmentScore: number,
  contradictedCount: number,
  blocksLaunchReadiness: boolean,
): PromiseFulfillmentReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (fulfillmentScore >= 75 && contradictedCount === 0) return 'FULFILLED';
  if (fulfillmentScore >= 60 && contradictedCount === 0) return 'PARTIAL';
  return 'RISK';
}

function buildCacheKey(assessments: PromiseAssessment[]): string {
  const digest = assessments
    .map((assessment) => `${assessment.promiseId}:${assessment.status}:${assessment.confidence}`)
    .join('|');
  return `${PROMISE_FULFILLMENT_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessPromiseFulfillment(
  report: FounderTestV4ReportWithSkeptical,
): PromiseFulfillmentAssessment {
  const promiseAssessments = REGISTERED_PROMISES.map((definition) => assessPromise(definition, report));
  const fulfillmentScore = clamp(
    promiseAssessments.reduce((sum, assessment) => sum + scoreForStatus(assessment.status), 0) /
      Math.max(1, promiseAssessments.length),
  );
  const fulfilledCount = promiseAssessments.filter((assessment) => assessment.status === 'FULFILLED').length;
  const partiallyFulfilledCount = promiseAssessments.filter(
    (assessment) => assessment.status === 'PARTIALLY_FULFILLED',
  ).length;
  const unprovenCount = promiseAssessments.filter((assessment) => assessment.status === 'UNPROVEN').length;
  const contradictedCount = promiseAssessments.filter((assessment) => assessment.status === 'CONTRADICTED').length;
  const blocksLaunchReadiness = contradictedCount > 0 || fulfillmentScore < PROMISE_FULFILLMENT_BLOCK_SCORE;
  const recommendations = [
    ...new Set(
      promiseAssessments
        .filter((assessment) => assessment.status !== 'FULFILLED')
        .flatMap((assessment) => assessment.recommendations),
    ),
  ].slice(0, MAX_PROMISE_RECOMMENDATIONS);
  const readinessState = deriveReadinessState(fulfillmentScore, contradictedCount, blocksLaunchReadiness);

  const assessment: PromiseFulfillmentAssessment = {
    readOnly: true,
    fulfillmentScore,
    fulfilledCount,
    partiallyFulfilledCount,
    unprovenCount,
    contradictedCount,
    blocksLaunchReadiness,
    readinessState,
    promiseAssessments,
    recommendations,
    cacheKey: buildCacheKey(promiseAssessments),
  };

  recordPromiseFulfillmentAssessment(assessment);
  return assessment;
}

export function buildPromiseFulfillmentArtifacts(
  report: FounderTestV4ReportWithSkeptical,
): {
  promiseFulfillment: PromiseFulfillmentAssessment;
  promiseFulfillmentReportMarkdown: string;
} {
  const promiseFulfillment = assessPromiseFulfillment(report);
  return {
    promiseFulfillment,
    promiseFulfillmentReportMarkdown: buildPromiseFulfillmentReportMarkdown(
      promiseFulfillment,
      report.generatedAt,
    ),
  };
}
