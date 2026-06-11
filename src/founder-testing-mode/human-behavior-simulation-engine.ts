/**
 * Human Behavior Simulation Engine — bounded persona, trust, curiosity, mistake, patience, goal testing.
 * Read-only. No browser automation. No external AI.
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { assessArchitectureLeakage, leakageLevelSeverity } from './founder-proxy-architecture-leakage.js';
import { evaluatePromptVision } from './founder-proxy-evaluator.js';
import { DEFAULT_FOUNDER_PREFERENCE_MODEL } from './founder-preference-model.js';
import {
  FOUNDER_TEST_V3_MAX_GOALS,
  FOUNDER_TEST_V3_MAX_PERSONAS,
  HUMAN_CURIOSITY_PATHS,
  HUMAN_GOAL_DEFINITIONS,
  HUMAN_MISTAKE_PROMPTS,
} from './founder-testing-v3-bounds.js';
import type {
  CuriosityPathResult,
  FrustrationRiskLevel,
  GoalCompletionResult,
  HumanConfusionFinding,
  HumanPersonaSimulation,
  MistakePromptResult,
  PatienceAssessment,
  TrustEvent,
} from './founder-testing-v3-types.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';
import type { FounderTestV2Report } from './founder-testing-v2-types.js';
import { assessProjectIntelligenceClarity } from './project-intelligence-clarity.js';

const PERSONA_DEFINITIONS = [
  {
    personaId: 'first-time-user',
    label: 'First-Time User',
    questions: ['What is this?', 'What do I click?', 'Why should I care?'],
    weightVision: 0.35,
    weightClarity: 0.4,
    weightAction: 0.25,
  },
  {
    personaId: 'founder',
    label: 'Founder',
    questions: ['Does this match my vision?', 'Can I trust this?', 'Would I approve this?'],
    weightVision: 0.45,
    weightClarity: 0.2,
    weightAction: 0.35,
  },
  {
    personaId: 'customer',
    label: 'Customer',
    questions: ['Would I pay for this?', 'Does this solve my problem?'],
    weightVision: 0.3,
    weightClarity: 0.35,
    weightAction: 0.35,
  },
  {
    personaId: 'impatient-user',
    label: 'Impatient User',
    questions: ['Why is this taking so long?', 'Is it broken?'],
    weightVision: 0.1,
    weightClarity: 0.25,
    weightAction: 0.65,
  },
  {
    personaId: 'confused-user',
    label: 'Confused User',
    questions: ['What does this screen mean?', 'What is the difference between these options?'],
    weightVision: 0.2,
    weightClarity: 0.55,
    weightAction: 0.25,
  },
] as const;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function frustrationFromSignals(input: {
  hasTimeout: boolean;
  hasProgress: boolean;
  hasExplanation: boolean;
  infiniteLoadingRisk: boolean;
}): FrustrationRiskLevel {
  if (input.infiniteLoadingRisk && !input.hasTimeout) return 'CRITICAL';
  if (!input.hasExplanation && !input.hasProgress) return 'HIGH';
  if (!input.hasTimeout || !input.hasExplanation) return 'MEDIUM';
  return 'LOW';
}

export function simulatePersonas(v2: FounderTestV2Report): HumanPersonaSimulation[] {
  const rr = v2.readinessReality;
  const personas = PERSONA_DEFINITIONS.slice(0, FOUNDER_TEST_V3_MAX_PERSONAS);

  return personas.map((p) => {
    const satisfaction = clamp(
      rr.visionAlignment * p.weightVision +
        rr.productReadiness * p.weightClarity +
        v2.founderApproval.likelihood * p.weightAction,
    );
    const trustDelta =
      p.personaId === 'impatient-user' && v2.v1.screenResults.some((s) => !s.passed)
        ? -15
        : satisfaction >= 70
          ? 8
          : satisfaction >= 50
            ? 0
            : -12;

    const findings: string[] = [];
    if (p.personaId === 'first-time-user' && v2.understandabilityScore < 65) {
      findings.push('First-time user may not understand navigation breadth within 5–10 seconds');
    }
    if (p.personaId === 'founder' && v2.architectureLeakageSummary !== 'NONE' && v2.architectureLeakageSummary !== 'LOW') {
      findings.push(`Founder sees architecture leakage (${v2.architectureLeakageSummary})`);
    }
    if (p.personaId === 'customer' && rr.customerReadiness < 60) {
      findings.push('Customer value proposition unclear');
    }
    if (p.personaId === 'impatient-user' && v2.v1.workflowResults.some((w) => !w.passed)) {
      findings.push('Workflow friction increases impatience risk');
    }
    if (p.personaId === 'confused-user' && v2.confusionRisks.length) {
      findings.push(`Confusion risks: ${v2.confusionRisks.map((c) => c.screens).join(', ')}`);
    }
    if (!findings.length) findings.push('No major persona-specific concerns');

    return {
      personaId: p.personaId,
      label: p.label,
      questions: [...p.questions],
      satisfactionScore: satisfaction,
      trustDelta,
      findings,
    };
  });
}

export function simulateCuriosityPaths(sources: ScreenCheckSources): CuriosityPathResult[] {
  const { appJs, html } = sources;
  const hasSwitchView = appJs.includes('function switchView');
  const hasWorkspacePersist = appJs.includes('workspaceData') && appJs.includes('mergeWorkspaceData');
  const hasViewTitles = appJs.includes('VIEW_TITLES');

  return HUMAN_CURIOSITY_PATHS.map((path, idx) => {
    const issues: string[] = [];
    let score = 70;

    if (!hasSwitchView) {
      issues.push('switchView missing — non-linear navigation may break');
      score -= 30;
    }
    if (!hasViewTitles) {
      issues.push('VIEW_TITLES missing — context may not update on revisit');
      score -= 20;
    }
    if (!hasWorkspacePersist) {
      issues.push('workspaceData not persisted across views');
      score -= 15;
    }

    for (const viewId of path) {
      if (!html.includes(`id="view-${viewId}"`)) {
        issues.push(`Missing view-${viewId} in path`);
        score -= 10;
      }
    }

    const revisits = path[path.length - 1] === path[0];
    if (revisits && appJs.includes('renderProjectInsightsSurface') && path.includes('project-insights')) {
      score += 8;
    } else if (revisits) {
      score += 4;
    }

    return {
      pathLabel: `Curiosity path ${idx + 1}`,
      steps: [...path],
      contextRecoveryScore: clamp(score),
      understandabilityMaintained: score >= 55,
      issues,
    };
  });
}

export function simulateMistakePrompts(deadlineMs: number): MistakePromptResult[] {
  const results: MistakePromptResult[] = [];
  const start = Date.now();

  for (const prompt of HUMAN_MISTAKE_PROMPTS) {
    if (Date.now() - start > deadlineMs) break;

    try {
      const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
      const response = (brain.brainResponse ?? '').trim();
      const guidesUser =
        /\b(ask|try|start|clarify|specify|describe|tell me|next|help|build|project|idea)\b/i.test(response);
      const followUpQuality = guidesUser && response.split(/\s+/).length >= 10 ? 75 : guidesUser ? 55 : 25;
      const recovered = response.length >= 30 && guidesUser && !/^error\b/i.test(response);
      const leakage = assessArchitectureLeakage(response);
      const issues: string[] = [];
      if (!recovered) issues.push('Poor input did not recover with useful guidance');
      if (leakageLevelSeverity(leakage.level) >= leakageLevelSeverity('HIGH')) {
        issues.push(`Architecture leakage on mistake prompt (${leakage.level})`);
      }

      results.push({
        prompt,
        recovered,
        guidesUser,
        followUpQuality,
        responsePreview: response.slice(0, 200) + (response.length > 200 ? '…' : ''),
        issues,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'brain failed';
      results.push({
        prompt,
        recovered: false,
        guidesUser: false,
        followUpQuality: 0,
        responsePreview: '',
        issues: [message],
      });
    }
  }

  return results;
}

export function assessHumanPatience(sources: ScreenCheckSources): PatienceAssessment[] {
  const { appJs } = sources;
  const assessments: PatienceAssessment[] = [];

  const projectInsights = {
    screen: 'Project Insights',
    hasLoadingTimeout: appJs.includes('waitForInsightsReady') || appJs.includes('FOUNDER_TEST_MAX_SCREEN_MS'),
    hasProgressFeedback: appJs.includes('workspaceLoadState'),
    hasExplanation: appJs.includes('renderProjectInsightsErrorBanner') || appJs.includes('retry-workspace-load'),
    infiniteLoadingRisk: appJs.includes('Portfolio insights loading') && !appJs.includes('CLIENT_DEMO_PORTFOLIO_FALLBACK'),
  };
  assessments.push({
    screen: projectInsights.screen,
    frustrationRisk: frustrationFromSignals({
      hasTimeout: projectInsights.hasLoadingTimeout,
      hasProgress: projectInsights.hasProgressFeedback,
      hasExplanation: projectInsights.hasExplanation,
      infiniteLoadingRisk: projectInsights.infiniteLoadingRisk,
    }),
    hasLoadingTimeout: projectInsights.hasLoadingTimeout,
    hasProgressFeedback: projectInsights.hasProgressFeedback,
    hasExplanation: projectInsights.hasExplanation,
    detail: projectInsights.infiniteLoadingRisk
      ? 'Loading without guaranteed fallback risks impatience'
      : 'Loading state has timeout/fallback patterns',
  });

  const livePreview = {
    screen: 'Live Preview',
    hasTimeout: true,
    hasProgress:
      appJs.includes('live-preview-reality-state') ||
      appJs.includes('running-app-output-state') ||
      appJs.includes('PREVIEW_STARTING') ||
      appJs.includes('Live Preview Status'),
    hasExplanation:
      (appJs.includes('running-application-visibility') && appJs.includes('Testing status')) ||
      (appJs.includes('live-preview-reality-summary') && appJs.includes('Recommended Action')) ||
      (appJs.includes('No Live Preview Running') && appJs.includes('Next action')),
    infiniteLoadingRisk:
      appJs.includes('Checking preview status') &&
      !appJs.includes('live-preview-reality') &&
      !appJs.includes('running-application-visibility') &&
      !appJs.includes('empty-state'),
  };
  assessments.push({
    screen: livePreview.screen,
    frustrationRisk: frustrationFromSignals({
      hasTimeout: livePreview.hasTimeout,
      hasProgress: livePreview.hasProgress,
      hasExplanation: livePreview.hasExplanation,
      infiniteLoadingRisk: livePreview.infiniteLoadingRisk,
    }),
    hasLoadingTimeout: livePreview.hasTimeout,
    hasProgressFeedback: livePreview.hasProgress,
    hasExplanation: livePreview.hasExplanation,
    detail: livePreview.hasExplanation ? 'Honest idle state with next action' : 'Preview idle state unclear',
  });

  const commandCenter = {
    screen: 'Command Center',
    hasTimeout: appJs.includes('publishFeedFailure') || appJs.includes('Brain could not respond'),
    hasProgress: appJs.includes('Brain is analyzing') || appJs.includes('streamOperatorFeedEvents'),
    hasExplanation: appJs.includes('welcome-hint'),
    infiniteLoadingRisk: false,
  };
  assessments.push({
    screen: commandCenter.screen,
    frustrationRisk: frustrationFromSignals({
      hasTimeout: commandCenter.hasTimeout,
      hasProgress: commandCenter.hasProgress,
      hasExplanation: commandCenter.hasExplanation,
      infiniteLoadingRisk: commandCenter.infiniteLoadingRisk,
    }),
    hasLoadingTimeout: commandCenter.hasTimeout,
    hasProgressFeedback: commandCenter.hasProgress,
    hasExplanation: commandCenter.hasExplanation,
    detail: 'Brain feed streaming provides progress feedback',
  });

  return assessments;
}

export function buildTrustSimulation(input: {
  v2: FounderTestV2Report;
  personas: HumanPersonaSimulation[];
  mistakeResults: MistakePromptResult[];
  patienceAssessments: PatienceAssessment[];
  curiosityPaths: CuriosityPathResult[];
}): { events: TrustEvent[]; trustScore: number } {
  const events: TrustEvent[] = [];
  let score = 62;

  const identityPromptsPassing = input.v2.promptVisionResults.filter((p) => p.passed).length;
  if (
    input.v2.readinessReality.visionAlignment >= 70 &&
    identityPromptsPassing >= 10 &&
    input.v2.architectureLeakageSummary !== 'CRITICAL'
  ) {
    events.push({
      type: 'GAIN',
      source: 'Command Center identity',
      reason: 'Product-first identity responses on founder prompts',
      magnitude: 12,
    });
    score += 12;
  }

  if (input.v2.readinessReality.productReadiness >= 70) {
    events.push({ type: 'GAIN', source: 'Product surfaces', reason: 'Useful product-facing content', magnitude: 8 });
    score += 8;
  }
  for (const p of input.personas) {
    if (p.trustDelta > 0) {
      events.push({ type: 'GAIN', source: p.label, reason: `Satisfaction ${p.satisfactionScore}`, magnitude: p.trustDelta });
      score += p.trustDelta;
    } else if (p.trustDelta < 0) {
      events.push({ type: 'LOSS', source: p.label, reason: p.findings[0] ?? 'Low satisfaction', magnitude: Math.abs(p.trustDelta) });
      score += p.trustDelta;
    }
  }

  const criticalPatience = input.patienceAssessments.filter((p) => p.frustrationRisk === 'CRITICAL' || p.frustrationRisk === 'HIGH');
  for (const p of criticalPatience) {
    events.push({ type: 'LOSS', source: p.screen, reason: `Frustration risk ${p.frustrationRisk}`, magnitude: 12 });
    score -= 12;
  }

  if (input.v2.architectureLeakageSummary === 'CRITICAL' || input.v2.architectureLeakageSummary === 'HIGH') {
    events.push({
      type: 'LOSS',
      source: 'Command Center',
      reason: `Architecture leakage ${input.v2.architectureLeakageSummary}`,
      magnitude: 18,
    });
    score -= 18;
  }

  const mistakeFails = input.mistakeResults.filter((m) => !m.recovered).length;
  if (mistakeFails > 3) {
    events.push({ type: 'LOSS', source: 'Mistake recovery', reason: `${mistakeFails} poor inputs not recovered`, magnitude: 10 });
    score -= 10;
  } else if (mistakeFails <= 1) {
    events.push({ type: 'GAIN', source: 'Mistake recovery', reason: 'Most poor inputs recovered with guidance', magnitude: 6 });
    score += 6;
  }

  for (const path of input.curiosityPaths) {
    if (path.contextRecoveryScore >= 70) {
      events.push({ type: 'GAIN', source: path.pathLabel, reason: 'Context maintained on non-linear path', magnitude: 4 });
      score += 4;
    } else {
      events.push({ type: 'LOSS', source: path.pathLabel, reason: 'Context lost on non-linear exploration', magnitude: 6 });
      score -= 6;
    }
  }

  if (input.v2.v1.workflowResults.every((w) => w.passed)) {
    events.push({ type: 'GAIN', source: 'Workflow', reason: 'No broken workflow wiring detected', magnitude: 5 });
    score += 5;
  }

  return { events, trustScore: clamp(score) };
}

export function simulateGoalCompletion(
  v2: FounderTestV2Report,
  sources: ScreenCheckSources,
  deadlineMs: number,
): GoalCompletionResult[] {
  const goals = HUMAN_GOAL_DEFINITIONS.slice(0, FOUNDER_TEST_V3_MAX_GOALS);
  const results: GoalCompletionResult[] = [];
  const start = Date.now();

  for (const goal of goals) {
    if (Date.now() - start > deadlineMs) break;

    const confusionPoints: string[] = [];
    const deadEnds: string[] = [];
    const trustLossEvents: string[] = [];
    let likelihood = 55;

    for (const screen of goal.relatedScreens) {
      if (!sources.html.includes(`id="view-${screen}"`)) {
        deadEnds.push(`Screen ${screen} missing`);
        likelihood -= 15;
      }
    }

    try {
      const brain = processBrainRequest({ message: goal.entryPrompt, timestamp: Date.now() });
      const vision = evaluatePromptVision(goal.entryPrompt, brain.brainResponse ?? '');
      if (!vision.passed) {
        confusionPoints.push(`Entry prompt vision misaligned for "${goal.label}"`);
        trustLossEvents.push('Architecture-heavy or unclear brain response');
        likelihood -= 12;
      } else {
        likelihood += 10;
      }
      if (vision.actionability >= 60) likelihood += 8;
    } catch {
      deadEnds.push('Brain unavailable for goal entry');
      likelihood -= 20;
    }

    if (goal.goalId === 'understand-project-status') {
      const hasPortfolio = sources.appJs.includes('renderProjectInsightsPortfolio');
      if (!hasPortfolio) {
        confusionPoints.push('Portfolio insights path unclear');
        likelihood -= 10;
      } else {
        likelihood += 12;
      }
    }

    if (goal.goalId === 'verify-project-readiness') {
      if (sources.appJs.includes('validator-list') && sources.appJs.includes('verification-surface')) {
        confusionPoints.push('Verification may expose diagnostics overwhelm');
        likelihood -= 8;
      }
      if (sources.appJs.includes('System Diagnostics')) likelihood += 6;
    }

    const stepsRequired = goal.relatedScreens.length + 1;
    const goalSuccessScore = clamp(likelihood);

    results.push({
      goalId: goal.goalId,
      label: goal.label,
      stepsRequired,
      confusionPoints,
      deadEnds,
      trustLossEvents,
      completionLikelihood: clamp(likelihood),
      goalSuccessScore,
    });
  }

  return results;
}

export function detectHumanConfusion(v2: FounderTestV2Report, sources: ScreenCheckSources): HumanConfusionFinding[] {
  const findings: HumanConfusionFinding[] = [];

  for (const risk of v2.confusionRisks) {
    findings.push({
      topic: risk.screens,
      severity: risk.severity === 'HIGH' ? 'HIGH' : risk.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      detail: risk.risk,
    });
  }

  const { appJs, html } = sources;
  const clarity = assessProjectIntelligenceClarity({ appJs, html });
  const memoryInsightsAlreadyReported = findings.some((f) => f.topic === 'Project Memory vs Project Insights');
  if (
    (clarity.confusionSeverity === 'HIGH' || clarity.confusionSeverity === 'CRITICAL') &&
    !memoryInsightsAlreadyReported
  ) {
    findings.push({
      topic: 'Project Memory vs Project Insights',
      severity: 'HIGH',
      detail:
        clarity.issues[0] ??
        'Users may not distinguish stored project knowledge from project intelligence',
    });
  }

  if (appJs.includes('System Diagnostics') && appJs.includes('verification-surface')) {
    findings.push({
      topic: 'Verification vs System Diagnostics',
      severity: 'MEDIUM',
      detail: 'Advanced diagnostics reference may blur verification purpose',
    });
  }

  if (appJs.includes('Autonomous Builder') && !/not connected|honest|does not overpromise/i.test(appJs)) {
    findings.push({
      topic: 'Autonomous Builder readiness',
      severity: 'MEDIUM',
      detail: 'Autonomous readiness messaging may confuse users about execution availability',
    });
  }

  if (appJs.includes('No Live Preview Running') && appJs.includes('previewUrl')) {
    findings.push({
      topic: 'Live Preview state',
      severity: 'LOW',
      detail: 'Preview URL handling exists — verify honest idle vs active states in live usage',
    });
  } else if (!appJs.includes('No Live Preview Running')) {
    findings.push({
      topic: 'Live Preview state',
      severity: 'HIGH',
      detail: 'Missing honest empty preview messaging',
    });
  }

  return findings;
}

export function computeLaunchReadinessSignals(input: {
  v2: FounderTestV2Report;
  personas: HumanPersonaSimulation[];
  trustScore: number;
  goalResults: GoalCompletionResult[];
  confusionFindings: HumanConfusionFinding[];
  mistakeResults: MistakePromptResult[];
  curiosityPaths: CuriosityPathResult[];
}): import('./founder-testing-v3-types.js').LaunchReadinessSignals {
  const humanSuccessRate = clamp(
    input.personas.reduce((s, p) => s + p.satisfactionScore, 0) / Math.max(1, input.personas.length),
  );
  const goalCompletionScore = clamp(
    input.goalResults.reduce((s, g) => s + g.goalSuccessScore, 0) / Math.max(1, input.goalResults.length),
  );
  const confusionPenalty = input.confusionFindings.filter((c) => c.severity === 'HIGH' || c.severity === 'CRITICAL').length * 8;
  const confusionScore = clamp(100 - confusionPenalty - input.v2.confusionRisks.length * 4);

  const founderPersona = input.personas.find((p) => p.personaId === 'founder');
  const customerPersona = input.personas.find((p) => p.personaId === 'customer');
  const founderApprovalScore = founderPersona?.satisfactionScore ?? input.v2.founderApproval.likelihood;
  const customerApprovalScore = customerPersona?.satisfactionScore ?? input.v2.readinessReality.customerReadiness;

  const mistakeRecoveryRate =
    input.mistakeResults.filter((m) => m.recovered).length / Math.max(1, input.mistakeResults.length);
  const pathRecoveryRate =
    input.curiosityPaths.filter((p) => p.understandabilityMaintained).length /
    Math.max(1, input.curiosityPaths.length);

  const launchReadinessScore = clamp(
    humanSuccessRate * 0.2 +
      input.trustScore * 0.2 +
      confusionScore * 0.15 +
      goalCompletionScore * 0.2 +
      founderApprovalScore * 0.15 +
      customerApprovalScore * 0.1 +
      mistakeRecoveryRate * 100 * 0.05 +
      pathRecoveryRate * 100 * 0.05,
  );

  return {
    humanSuccessRate,
    trustScore: input.trustScore,
    confusionScore,
    goalCompletionScore,
    founderApprovalScore,
    customerApprovalScore,
    launchReadinessScore,
  };
}

export { DEFAULT_FOUNDER_PREFERENCE_MODEL, PERSONA_DEFINITIONS };
