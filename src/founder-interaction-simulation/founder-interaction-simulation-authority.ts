/**
 * Founder Interaction Simulation Authority — simulates founder actions and detects interaction failures.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { LiveScreenResultInput } from '../founder-testing-mode/founder-testing-types.js';
import type { FounderSensemakingAssessment, SensemakingFinding } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_INTERACTION_FINDINGS,
  MAX_INTERACTION_SCENARIOS,
} from './founder-interaction-simulation-bounds.js';
import type {
  AssessFounderInteractionSimulationInput,
  EnrichedAssessments,
  FounderInteractionSimulationAssessment,
  InteractionCategory,
  InteractionFeedEvent,
  InteractionFinding,
  InteractionFindingType,
  InteractionScenarioResult,
  InteractionSeverity,
} from './founder-interaction-simulation-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<InteractionSeverity, number> = {
  CRITICAL: 22,
  HIGH: 14,
  MEDIUM: 8,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetFounderInteractionCounterForTests(): void {
  findingIdCounter = 0;
}

function nextFindingId(prefix: string): string {
  findingIdCounter += 1;
  return `${prefix}-${findingIdCounter}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pushFinding(
  bucket: InteractionFinding[],
  seen: Set<string>,
  finding: Omit<InteractionFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.whatFailed.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_INTERACTION_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.whatFailed} ${finding.observedBehavior} ${finding.recommendedFix}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('interaction') });
}

function makeFinding(
  type: InteractionFindingType,
  category: InteractionCategory,
  severity: InteractionSeverity,
  whatFailed: string,
  founderActionAttempted: string,
  expectedBehavior: string,
  observedBehavior: string,
  whyItMatters: string,
  recommendedFix: string,
  regressionScenario: string,
): Omit<InteractionFinding, 'id'> {
  return {
    type,
    category,
    severity,
    whatFailed,
    founderActionAttempted,
    expectedBehavior,
    observedBehavior,
    whyItMatters,
    recommendedFix,
    regressionScenario,
  };
}

function runStaticScenario(
  id: string,
  category: InteractionCategory,
  name: string,
  passed: boolean,
  detail: string,
  finding: Omit<InteractionFinding, 'id'> | null,
  findings: InteractionFinding[],
  seen: Set<string>,
): InteractionScenarioResult {
  if (!passed && finding) {
    pushFinding(findings, seen, finding);
  }
  return { id, category, name, passed, detail };
}

function buildOperatorFeed(
  scenarios: InteractionScenarioResult[],
  findings: InteractionFinding[],
): InteractionFeedEvent[] {
  const events: InteractionFeedEvent[] = [
    {
      section: 'Founder Experience',
      action: 'Simulating founder interactions',
      detail: 'Testing primary buttons, modals, navigation, and Command Center usability.',
      status: 'Active',
    },
    {
      section: 'Founder Experience',
      action: 'Testing primary buttons',
      detail: 'Checking Run Founder Test, Send, and navigation controls respond as expected.',
      status: 'Completed',
    },
    {
      section: 'Founder Experience',
      action: 'Testing modal dismissal',
      detail: 'Verifying Founder Test Results closes via X without trapping workflow.',
      status: scenarios.find((s) => s.id === 'modal-close-regression')?.passed ? 'Completed' : 'Blocked',
    },
    {
      section: 'Founder Experience',
      action: 'Checking Command Center readability',
      detail: 'Ensuring responses and input remain usable after report overlays.',
      status: scenarios.find((s) => s.id === 'command-center-after-close')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Founder Experience',
      action: 'Checking workflow recovery',
      detail: 'Confirming founders can continue without refresh after closing overlays.',
      status: findings.some((f) => f.type === 'RECOVERY_FAILURE' || f.type === 'BLOCKED_WORKFLOW')
        ? 'Blocked'
        : 'Completed',
    },
    {
      section: 'Founder Experience',
      action: 'Ranking interaction failures',
      detail:
        findings.length > 0
          ? `${findings.length} interaction issue(s) ranked by severity.`
          : 'No interaction failures detected in bounded scenarios.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Warning' : 'Completed',
    },
  ];
  return events;
}

function mergeLiveInteractionChecks(
  liveResults: LiveScreenResultInput[] | undefined,
  findings: InteractionFinding[],
  seen: Set<string>,
  scenarios: InteractionScenarioResult[],
): void {
  const live = liveResults?.find(
    (r) => r.viewId === 'interaction-simulation' || r.screen === 'Founder Interaction Simulation',
  );
  if (!live) return;

  for (const check of live.checks) {
    if (check.passed) continue;
    const type: InteractionFindingType =
      check.name.includes('modal') && check.name.includes('close')
        ? 'INTERACTION_FAILURE'
        : check.name.includes('input') || check.name.includes('send')
          ? 'BLOCKED_WORKFLOW'
          : check.name.includes('hidden') || check.name.includes('readable')
            ? 'HIDDEN_CONTENT'
            : check.name.includes('recovery')
              ? 'RECOVERY_FAILURE'
              : 'INTERACTION_FAILURE';

    pushFinding(
      findings,
      seen,
      makeFinding(
        type,
        check.name.includes('modal') ? 'MODAL' : check.name.includes('nav') ? 'NAVIGATION' : 'COMMAND_CENTER',
        'HIGH',
        check.detail || `Live interaction check failed: ${check.name}`,
        check.name.includes('close') ? 'Clicked X close button.' : 'Attempted founder workflow action.',
        'Control performs expected action and workflow continues.',
        check.detail || 'Live check failed.',
        'Founder cannot comfortably continue the main workflow after testing.',
        'Wire the control to its expected dismiss or navigation behavior and restore Command Center focus.',
        `Live check: ${check.name}`,
      ),
    );
  }

  const modalCloseLive = live.checks.find((c) => c.name === 'modal-closes-via-x');
  if (modalCloseLive) {
    scenarios.push({
      id: 'live-modal-close',
      category: 'MODAL',
      name: 'Live modal close via X',
      passed: modalCloseLive.passed,
      detail: modalCloseLive.detail,
    });
  }
}

export function assessFounderInteractionSimulation(
  input: AssessFounderInteractionSimulationInput,
): FounderInteractionSimulationAssessment {
  const { shellSources: sources } = input;
  const findings: InteractionFinding[] = [];
  const seen = new Set<string>();
  const scenarios: InteractionScenarioResult[] = [];

  const appJs = sources.appJs;
  const html = sources.html;
  const css = sources.css;

  const closeWired =
    html.includes('id="founder-test-close"') &&
    appJs.includes('founder-test-close') &&
    (/founderClose\.addEventListener\(['"]click['"],\s*hideFounderTestPanel\)/.test(appJs) ||
      /founderClose\.addEventListener\(['"]click['"][\s\S]{0,160}hideFounderTestPanel/.test(appJs));
  const hideSetsHidden = /function hideFounderTestPanel\(\)[\s\S]{0,220}setAttribute\(['"]hidden['"]/.test(appJs);
  const cssRespectsHidden = /\.founder-test-panel\[hidden\][\s\S]{0,120}display:\s*none/.test(css);
  const v5ShowsPanelAfterRender =
    !/if \(isV5 && summary\)[\s\S]{0,1200}return;/.test(appJs) ||
    /if \(isV5 && summary\)[\s\S]{0,1200}showFounderTestPanel\(['"]done['"]\)/.test(appJs);
  const focusRestore =
    /function hideFounderTestPanel\(\)[\s\S]{0,400}chat-input/.test(appJs) ||
    /function hideFounderTestPanel\(\)[\s\S]{0,400}\.focus\(\)/.test(appJs);
  const escapeDismiss = /keydown/.test(appJs) && /Escape/.test(appJs) && /hideFounderTestPanel/.test(appJs);

  scenarios.push(
    runStaticScenario(
      'modal-close-regression',
      'MODAL',
      'Founder Test Results modal closes via X',
      closeWired && hideSetsHidden && cssRespectsHidden,
      closeWired && hideSetsHidden && cssRespectsHidden
        ? 'Close button wired and hidden state hides panel.'
        : 'Modal close wiring or hidden CSS incomplete.',
      !closeWired || !hideSetsHidden
        ? makeFinding(
            'INTERACTION_FAILURE',
            'MODAL',
            'HIGH',
            'Founder Test Results close button did not dismiss modal.',
            'Clicked X close button.',
            'Modal closes and Command Center becomes readable.',
            !closeWired
              ? 'Close button is not wired to hideFounderTestPanel.'
              : 'hideFounderTestPanel does not set hidden attribute.',
            'Founder cannot continue using Command Center after running a test.',
            'Wire close button to hide the results modal, clear active overlay state, and return focus to Command Center input.',
            'Open Founder Test Results → click X → verify modal hidden.',
          )
        : !cssRespectsHidden
          ? makeFinding(
              'INTERACTION_FAILURE',
              'MODAL',
              'HIGH',
              'Founder Test Results modal cannot be dismissed.',
              'Clicked X close button.',
              'Modal closes and Command Center becomes readable.',
              'Panel CSS keeps display:flex even when hidden attribute is set.',
              'Founder cannot continue using Command Center after running a test.',
              'Add .founder-test-panel[hidden] { display: none !important; } and restore focus after close.',
              'Open Founder Test Results → click X → verify modal hidden.',
            )
          : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'v5-results-panel-visible',
      'MODAL',
      'V5 results show panel after render',
      v5ShowsPanelAfterRender,
      v5ShowsPanelAfterRender
        ? 'V5 render path shows results panel.'
        : 'V5 render path returns before showing results panel.',
      !v5ShowsPanelAfterRender
        ? makeFinding(
            'HIDDEN_CONTENT',
            'MODAL',
            'MEDIUM',
            'Founder Test V5 results may render into a hidden panel.',
            'Completed Run Founder Test.',
            'Results panel becomes visible with summary.',
            'V5 render path returns without calling showFounderTestPanel.',
            'Founders may think the test failed or close control is broken.',
            'Call showFounderTestPanel after rendering V5 unified summary.',
            'Run V5 founder test → verify results panel visible.',
          )
        : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'command-center-after-close',
      'COMMAND_CENTER',
      'Command Center input usable after modal close',
      focusRestore && html.includes('id="chat-input"'),
      focusRestore ? 'Focus restore wired after modal close.' : 'Focus not restored to Command Center input.',
      !focusRestore
        ? makeFinding(
            'TRAPPED_FOCUS',
            'COMMAND_CENTER',
            'MEDIUM',
            'Command Center input may not regain focus after closing results.',
            'Closed Founder Test Results modal.',
            'Focus returns to Command Center input for continued typing.',
            'hideFounderTestPanel does not restore focus to chat input.',
            'Founder must click manually before continuing the conversation.',
            'Restore focus to #chat-input when the results panel closes.',
            'Close results modal → verify chat input focused.',
          )
        : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'copy-report-available',
      'BUTTON',
      'Copy Report available while modal open',
      html.includes('id="copy-founder-test-report"') && appJs.includes('copyFounderTestReport'),
      'Copy Report button present and wired.',
      null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'run-founder-test-button',
      'BUTTON',
      'Run Founder Test button wired',
      html.includes('id="run-founder-test"') && appJs.includes('runFounderTest'),
      'Run Founder Test triggers founder test flow.',
      !html.includes('id="run-founder-test"') || !appJs.includes('runFounderTest')
        ? makeFinding(
            'DEAD_CONTROL',
            'BUTTON',
            'HIGH',
            'Run Founder Test control may not trigger evaluation.',
            'Clicked Run Founder Test.',
            'Founder test begins and results appear.',
            'Button missing or not wired to runFounderTest.',
            'Founders cannot validate product readiness from the shell.',
            'Wire #run-founder-test to runFounderTest().',
            'Click Run Founder Test → verify panel shows running state.',
          )
        : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'send-button',
      'BUTTON',
      'Command Center Send wired',
      html.includes('id="chat-send"') && appJs.includes('chat-form') && appJs.includes('askBrain'),
      'Send submits prompt to Command Center brain.',
      null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'sidebar-navigation',
      'NAVIGATION',
      'Sidebar navigation changes screens',
      appJs.includes('switchView') && appJs.includes('nav-item') && appJs.includes('data-view'),
      'Navigation switches center views.',
      !appJs.includes('switchView')
        ? makeFinding(
            'INTERACTION_FAILURE',
            'NAVIGATION',
            'HIGH',
            'Sidebar navigation may not change screens.',
            'Clicked sidebar navigation item.',
            'Active screen updates and title matches selection.',
            'switchView not wired to nav items.',
            'Founder cannot reach Action Center, Verification, or other workflows.',
            'Wire .nav-item clicks to switchView with active state updates.',
            'Click nav item → verify view-* container visible.',
          )
        : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'modal-scroll',
      'SCROLL',
      'Modal content scrollable',
      css.includes('.founder-test-panel-body') && css.includes('overflow'),
      'Founder Test Results body supports overflow scroll.',
      null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'overlay-workflow-block',
      'RECOVERY',
      'Modal does not permanently block workflow when dismissed',
      cssRespectsHidden && hideSetsHidden,
      cssRespectsHidden
        ? 'Hidden panel no longer occupies interaction layer.'
        : 'Dismissed panel may still block Command Center.',
      !cssRespectsHidden
        ? makeFinding(
            'OVERLAY_CONFLICT',
            'MODAL',
            'HIGH',
            'Founder Test Results modal blocks Command Center response.',
            'Attempted to read Command Center after closing modal.',
            'Command Center content readable and input usable.',
            'Modal overlay remains visible or intercepts clicks after close.',
            'Founder cannot continue the main workflow after testing.',
            'Ensure hidden panel uses display:none and does not trap pointer events.',
            'Open results → close → verify Command Center readable.',
          )
        : null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'escape-dismiss',
      'MODAL',
      'Modal closes via Escape when supported',
      escapeDismiss || closeWired,
      escapeDismiss ? 'Escape key dismisses results panel.' : 'Escape dismiss optional — X close wired.',
      null,
      findings,
      seen,
    ),
  );

  scenarios.push(
    runStaticScenario(
      'notification-drawer-zindex',
      'MODAL',
      'Results panel stacks above notification drawer',
      css.includes('z-index') &&
        (() => {
          const panelZ = css.match(/\.founder-test-panel[\s\S]{0,120}z-index:\s*(\d+)/);
          const drawerZ = css.match(/\.notification-drawer[\s\S]{0,120}z-index:\s*(\d+)/);
          if (!panelZ || !drawerZ) return true;
          return Number(panelZ[1]) > Number(drawerZ[1]);
        })(),
      'Founder Test Results panel z-index above notification drawer.',
      null,
      findings,
      seen,
    ),
  );

  mergeLiveInteractionChecks(input.liveResults, findings, seen, scenarios);

  const boundedScenarios = scenarios.slice(0, MAX_INTERACTION_SCENARIOS);
  const blockedWorkflows = findings.filter(
    (f) => f.type === 'BLOCKED_WORKFLOW' || f.type === 'OVERLAY_CONFLICT' || f.type === 'RECOVERY_FAILURE',
  );
  const hiddenContentIssues = findings.filter((f) => f.type === 'HIDDEN_CONTENT' || f.type === 'SCROLL_TRAP');
  const recoveryIssues = findings.filter(
    (f) => f.type === 'RECOVERY_FAILURE' || f.type === 'TRAPPED_FOCUS' || f.type === 'BLOCKED_WORKFLOW',
  );

  const penalty = findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);
  const interactionScore = clamp(100 - penalty);
  const passedInteractions = boundedScenarios.filter((s) => s.passed).length;

  const modalCloseRegressionPass = boundedScenarios.some(
    (s) => s.id === 'modal-close-regression' && s.passed,
  );
  const liveModal = input.liveResults
    ?.find((r) => r.viewId === 'interaction-simulation')
    ?.checks.find((c) => c.name === 'modal-closes-via-x');
  const commandCenterReadableAfterClosePass =
    (liveModal?.passed ?? modalCloseRegressionPass) &&
    !findings.some((f) => f.type === 'OVERLAY_CONFLICT' || f.type === 'HIDDEN_CONTENT');
  const copyReportAvailablePass = boundedScenarios.some((s) => s.id === 'copy-report-available' && s.passed);
  const sendInputUsableAfterClosePass =
    input.liveResults
      ?.find((r) => r.viewId === 'interaction-simulation')
      ?.checks.find((c) => c.name === 'command-center-input-usable')?.passed ??
    (html.includes('id="chat-input"') &&
      !findings.some((f) => f.category === 'COMMAND_CENTER' && f.severity === 'HIGH'));

  return {
    interactionScore,
    testedInteractions: boundedScenarios.length,
    passedInteractions,
    scenarios: boundedScenarios,
    findings,
    blockedWorkflows,
    hiddenContentIssues,
    recoveryIssues,
    recommendedFixes: findings.map((f) => f.recommendedFix).slice(0, 8),
    operatorFeedEvents: buildOperatorFeed(boundedScenarios, findings),
    modalCloseRegressionPass: liveModal?.passed ?? modalCloseRegressionPass,
    commandCenterReadableAfterClosePass,
    copyReportAvailablePass,
    sendInputUsableAfterClosePass,
    findingsGenerated: findings.length > 0,
    insufficientInfo: boundedScenarios.length === 0,
    insufficientInfoReason: boundedScenarios.length === 0 ? 'No interaction scenarios executed.' : null,
  };
}

function severityRank(s: InteractionSeverity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s];
}

function mapInteractionToSensemaking(finding: InteractionFinding): SensemakingFinding {
  const senseType =
    finding.type === 'OVERLAY_CONFLICT' || finding.type === 'BLOCKED_WORKFLOW'
      ? ('TRUST_RISK' as const)
      : finding.type === 'HIDDEN_CONTENT'
        ? ('COHERENCE_GAP' as const)
        : ('TRUST_RISK' as const);

  return {
    id: `interaction-sense-${finding.id}`,
    type: senseType,
    severity: finding.severity,
    area: 'Founder Interaction',
    whatDoesNotMakeSense: finding.whatFailed,
    whyItMatters: finding.whyItMatters,
    recommendedUpgrade: finding.recommendedFix,
    expectedImpact: 'Improves workflow recovery and founder trust.',
    evidence: finding.regressionScenario,
  };
}

function mergeSensemakingFeed(
  base: FounderSensemakingAssessment,
  interaction: FounderInteractionSimulationAssessment,
): FounderSensemakingAssessment {
  const extraFindings = interaction.findings.map(mapInteractionToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => severityRank(a.severity as InteractionSeverity) - severityRank(b.severity as InteractionSeverity))
    .slice(0, 12);

  const topTrustRisks = mergedFindings.filter(
    (f) => f.type === 'TRUST_RISK' || f.type === 'PROMISE_CONFLICT' || f.type === 'COHERENCE_GAP',
  ).slice(0, 4);

  const penalty = interaction.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);
  const founderSensemakingScore = clamp(base.founderSensemakingScore - Math.round(penalty * 0.35));
  const productCoherenceScore = clamp(base.productCoherenceScore - Math.round(penalty * 0.25));

  return {
    ...base,
    founderSensemakingScore,
    productCoherenceScore,
    findings: mergedFindings,
    topTrustRisks: topTrustRisks.length ? topTrustRisks : base.topTrustRisks,
    trustRisksDetected: topTrustRisks.length > 0 || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...interaction.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  interaction: FounderInteractionSimulationAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  for (const finding of interaction.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
    const title = `[${finding.severity}] Fix ${finding.whatFailed.replace(/\.$/, '')}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('interaction-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: finding.whyItMatters,
      expectedImpact: 'Improves workflow recovery and founder trust.',
      evidence: finding.regressionScenario,
      executable: true,
    });
  }

  const topActions = actions.slice(0, 8);
  const recommendedNextStep =
    topActions[0] && (topActions[0].priority === 'CRITICAL' || topActions[0].priority === 'HIGH')
      ? {
          priority: topActions[0].priority,
          title: topActions[0].title,
          type: topActions[0].type,
          reason: topActions[0].rationale,
          expectedImpact: topActions[0].expectedImpact,
          evidence: topActions[0].evidence,
        }
      : base.recommendedNextStep;

  return {
    ...base,
    topActions,
    recommendedNextStep,
    actionsGenerated: topActions.length > 0,
    recommendationsActionable: topActions.some((a) => a.executable) || base.recommendationsActionable,
    operatorFeedEvents: [...interaction.operatorFeedEvents.slice(3, 5), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithInteractionSimulation(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: FounderSensemakingAssessment,
  interaction: FounderInteractionSimulationAssessment,
): EnrichedAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, interaction),
    founderSensemaking: mergeSensemakingFeed(founderSensemaking, interaction),
  };
}
