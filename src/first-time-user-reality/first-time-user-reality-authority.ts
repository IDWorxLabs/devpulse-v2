/**
 * First-Time User Reality Authority — evaluates whether a new founder can understand AiDevEngine.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import { assessProjectIntelligenceClarity } from '../founder-testing-mode/project-intelligence-clarity.js';
import { verificationTrustEvidenceResolved } from '../verification-trust-evidence/index.js';
import { founderFrictionHeatmapResolved } from '../founder-friction-heatmap/index.js';
import type { FounderSensemakingAssessment, SensemakingFinding } from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_FIRST_TIME_FINDINGS,
  MAX_FIRST_TIME_SCENARIOS,
  MAX_SCREEN_PURPOSE_CHECKS,
} from './first-time-user-reality-bounds.js';
import type {
  AssessFirstTimeUserRealityInput,
  EnrichedFirstTimeAssessments,
  FirstTimeFeedEvent,
  FirstTimeRealityCategory,
  FirstTimeScenarioResult,
  FirstTimeScreenPurposeResult,
  FirstTimeSeverity,
  FirstTimeUserCategoryScores,
  FirstTimeUserFinding,
  FirstTimeUserRealityAssessment,
  FirstTimeFindingType,
} from './first-time-user-reality-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<FirstTimeSeverity, number> = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 7,
  LOW: 3,
};

const NAV_OVERLAP_PAIRS: ReadonlyArray<{ a: string; b: string; detail: string; separationId: string }> = [
  {
    a: 'Verification',
    b: 'Project Insights',
    detail: 'Both relate to product quality and readiness.',
    separationId: 'verification-insights',
  },
  {
    a: 'Verification',
    b: 'System Diagnostics',
    detail: 'Both sound like troubleshooting destinations.',
    separationId: 'verification-diagnostics',
  },
  {
    a: 'Live Preview',
    b: 'Autonomous Builder',
    detail: 'Both relate to building and seeing output.',
    separationId: 'preview-builder',
  },
  {
    a: 'Live Preview',
    b: 'Verification',
    detail: 'Preview shows the running app; Verification proves readiness.',
    separationId: 'preview-verification',
  },
  {
    a: 'Projects',
    b: 'Project Memory',
    detail: 'Both relate to project context but serve different purposes.',
    separationId: 'projects-vault',
  },
  {
    a: 'Action Center',
    b: 'Project Insights',
    detail: 'Both may recommend next steps.',
    separationId: 'action-insights',
  },
];

let findingIdCounter = 0;

export function resetFirstTimeUserCounterForTests(): void {
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
  bucket: FirstTimeUserFinding[],
  seen: Set<string>,
  finding: Omit<FirstTimeUserFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.whatConfuses.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_FIRST_TIME_FINDINGS) return;
  const text = `${finding.whatConfuses} ${finding.observedGap} ${finding.recommendedFix}`;
  if (ARCH_LEAK.test(text)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('first-time') });
}

function makeFinding(
  type: FirstTimeFindingType,
  category: FirstTimeRealityCategory,
  severity: FirstTimeSeverity,
  whatConfuses: string,
  firstTimeQuestion: string,
  expectedClarity: string,
  observedGap: string,
  whyItMatters: string,
  recommendedFix: string,
  screen?: string,
): Omit<FirstTimeUserFinding, 'id'> {
  return {
    type,
    category,
    severity,
    whatConfuses,
    firstTimeQuestion,
    expectedClarity,
    observedGap,
    whyItMatters,
    recommendedFix,
    screen,
  };
}

function runScenario(
  id: string,
  category: FirstTimeRealityCategory,
  name: string,
  passed: boolean,
  detail: string,
  finding: Omit<FirstTimeUserFinding, 'id'> | null,
  findings: FirstTimeUserFinding[],
  seen: Set<string>,
): FirstTimeScenarioResult {
  if (!passed && finding) pushFinding(findings, seen, finding);
  return { id, category, name, passed, detail };
}

function navItemHasHelp(html: string, viewId: string): boolean {
  const re = new RegExp(`data-view="${viewId}"[\\s\\S]{0,420}nav-help`, 'i');
  return re.test(html);
}

function shellCopy(sources: { html: string; appJs: string }): string {
  return `${sources.html}\n${sources.appJs}`;
}

export function navPurposeSeparationResolved(
  separationId: string,
  sources: { html: string; appJs: string },
): boolean {
  const combined = shellCopy(sources);
  switch (separationId) {
    case 'verification-insights':
      return (
        /pass\/fail proof|launch confidence.*not Project Insights/i.test(combined) &&
        /patterns, risks, and recommendations|not pass\/fail proof/i.test(combined)
      );
    case 'verification-diagnostics':
      return (
        /pass\/fail proof|launch confidence/i.test(combined) &&
        /Advanced health checks|not internal diagnostics|troubleshooting is needed/i.test(combined)
      );
    case 'preview-builder':
      return (
        /Interact with the running app|interact with the running app/i.test(combined) &&
        /Turn ideas into builds|guided development/i.test(combined)
      );
    case 'preview-verification':
      return (
        /Interact with the running app|interact with the running app/i.test(combined) &&
        /not readiness proof|prove readiness|pass\/fail proof/i.test(combined)
      );
    case 'projects-vault':
      return (
        /active workspaces.*being built|applications being built/i.test(combined) &&
        /Project vault|stored knowledge.*history|not active workspaces/i.test(combined)
      );
    case 'action-insights':
      return (
        /execution priorities|what to do next/i.test(combined) &&
        /patterns, risks, and recommendations|not pass\/fail proof/i.test(combined)
      );
    default:
      return false;
  }
}

export function firstTimeActionPathResolved(
  stepId: string,
  sources: { html: string; appJs: string },
): boolean {
  const combined = shellCopy(sources);
  switch (stepId) {
    case 'panel-visible':
      return (
        combined.includes('first-time-founder-path') &&
        combined.includes('First-Time Founder Path') &&
        combined.includes('Launch with Confidence')
      );
    case 'start-project':
      return combined.includes('Start by creating a project or opening an existing one');
    case 'describe-vision':
      return combined.includes(
        'Describe what you want to build. The more detail you provide, the better AiDevEngine can understand your vision',
      );
    case 'review-insights':
      return combined.includes(
        'Review Project Insights to confirm AiDevEngine understands your project correctly',
      );
    case 'live-preview':
      return combined.includes(
        'Use Live Preview to interact with and test the current version of your application',
      );
    case 'verification-step':
      return combined.includes(
        'Run Verification to determine whether your application is ready for launch',
      );
    case 'preview-vs-verification-path':
      return (
        combined.includes('Interact with the running app') &&
        combined.includes('Run Verification to determine') &&
        combined.includes('not readiness proof')
      );
    case 'after-pass':
      return combined.includes(
        'Verification passed. Review any recommendations and prepare for launch',
      );
    case 'after-fail':
      return combined.includes(
        'Verification found issues that should be addressed before launch',
      );
    default:
      return false;
  }
}

function runActionPathScenarios(
  sources: { html: string; appJs: string },
  scenarios: FirstTimeScenarioResult[],
  findings: FirstTimeUserFinding[],
  seen: Set<string>,
): void {
  const steps: ReadonlyArray<{
    id: string;
    name: string;
    stepId: string;
    question: string;
    fix: string;
  }> = [
    {
      id: 'action-path-panel',
      name: 'First-Time Founder Path panel visible',
      stepId: 'panel-visible',
      question: 'What should I do first?',
      fix: 'Add a visible First-Time Founder Path panel with six ordered steps in the sidebar.',
    },
    {
      id: 'action-path-start',
      name: 'Founder knows where to start',
      stepId: 'start-project',
      question: 'What should I do first?',
      fix: 'Add guidance: Start by creating a project or opening an existing one.',
    },
    {
      id: 'action-path-vision',
      name: 'Founder knows how to describe vision',
      stepId: 'describe-vision',
      question: 'What do I do next?',
      fix: 'Add Command Center guidance encouraging detailed product vision prompts.',
    },
    {
      id: 'action-path-insights',
      name: 'Founder knows to review Project Insights',
      stepId: 'review-insights',
      question: 'How do I see progress?',
      fix: 'Add guidance to review Project Insights for understanding, risks, and recommendations.',
    },
    {
      id: 'action-path-preview',
      name: 'Founder knows where to test the app',
      stepId: 'live-preview',
      question: 'Where do I test the app?',
      fix: 'Add Live Preview step guidance for interaction and testing.',
    },
    {
      id: 'action-path-verify',
      name: 'Founder knows where to verify readiness',
      stepId: 'verification-step',
      question: 'How do I know if I am ready to launch?',
      fix: 'Add Verification step guidance for readiness and pass/fail proof.',
    },
    {
      id: 'action-path-preview-vs-verify',
      name: 'Founder understands Preview vs Verification in action path',
      stepId: 'preview-vs-verification-path',
      question: 'Should I use Preview or Verification?',
      fix: 'Clarify Live Preview for testing and Verification for launch readiness proof.',
    },
    {
      id: 'action-path-after-pass',
      name: 'Founder understands what to do after Verification passes',
      stepId: 'after-pass',
      question: 'What do I do after Verification passes?',
      fix: 'Surface pass guidance: review recommendations and prepare for launch.',
    },
    {
      id: 'action-path-after-fail',
      name: 'Founder understands what to do after Verification fails',
      stepId: 'after-fail',
      question: 'What do I do after Verification fails?',
      fix: 'Surface fail guidance: review findings and re-run Verification after fixes.',
    },
  ];

  for (const step of steps) {
    const passed = firstTimeActionPathResolved(step.stepId, sources);
    scenarios.push(
      runScenario(
        step.id,
        'WORKFLOW_UNDERSTANDING',
        step.name,
        passed,
        passed ? `${step.name} — guidance present.` : `${step.name} — guidance missing.`,
        passed
          ? null
          : makeFinding(
              'WORKFLOW_UNKNOWN',
              'WORKFLOW_UNDERSTANDING',
              'HIGH',
              `First-time founder action path gap: ${step.name}.`,
              step.question,
              'Ordered founder journey with clear next steps.',
              'Action path guidance missing or incomplete.',
              'Founders stall with "What do I do now?" moments.',
              step.fix,
              'First-Time Founder Path',
            ),
        findings,
        seen,
      ),
    );
  }
}

function runVerificationTrustScenarios(
  sources: { html: string; appJs: string },
  scenarios: FirstTimeScenarioResult[],
  findings: FirstTimeUserFinding[],
  seen: Set<string>,
): void {
  const trustSteps: ReadonlyArray<{
    id: string;
    name: string;
    checkId: string;
    question: string;
    fix: string;
  }> = [
    {
      id: 'verification-trust-why-pass',
      name: 'Founder understands why Verification passed',
      checkId: 'why-pass-scenario',
      question: 'Why did Verification pass?',
      fix: 'Add Why It Passed explanations on the Verification Trust & Evidence surface.',
    },
    {
      id: 'verification-trust-why-fail',
      name: 'Founder understands why Verification failed',
      checkId: 'why-failed',
      question: 'Why did Verification fail?',
      fix: 'Add Why It Failed explanations with evidence on the Verification surface.',
    },
    {
      id: 'verification-trust-evidence',
      name: 'Founder understands verification evidence',
      checkId: 'evidence-found',
      question: 'What evidence supports this result?',
      fix: 'Add Evidence Found blocks for major verification findings.',
    },
    {
      id: 'verification-trust-confidence',
      name: 'Founder understands verification confidence',
      checkId: 'confidence-explained',
      question: 'Why is confidence high, medium, or low?',
      fix: 'Add Confidence explanation on the Verification Summary.',
    },
    {
      id: 'verification-trust-scope',
      name: 'Founder understands verification scope limitations',
      checkId: 'scope-not-checked',
      question: 'What was not checked?',
      fix: 'Add What Verification Did Not Check to prevent false confidence.',
    },
    {
      id: 'verification-trust-next-steps',
      name: 'Founder understands verification next steps',
      checkId: 'next-steps-scenario',
      question: 'What should I do next?',
      fix: 'Add pass/warn/fail recommended next steps after every run.',
    },
    {
      id: 'verification-trust-pass-not-guarantee',
      name: 'Founder does not interpret PASS as success guarantee',
      checkId: 'pass-not-guarantee',
      question: 'Does PASS mean the business will succeed?',
      fix: 'Clarify scope limits — business viability and marketing readiness are not checked.',
    },
  ];

  for (const step of trustSteps) {
    const passed = verificationTrustEvidenceResolved(step.checkId, sources);
    scenarios.push(
      runScenario(
        step.id,
        'TRUST_FORMATION',
        step.name,
        passed,
        passed ? `${step.name} — explainability present.` : `${step.name} — explainability missing.`,
        passed
          ? null
          : makeFinding(
              'TRUST_FORMATION_FAILURE',
              'TRUST_FORMATION',
              'HIGH',
              `Verification trust gap: ${step.name}.`,
              step.question,
              'Explainable verification with evidence and next steps.',
              'Verification results may feel like a black box.',
              'Founders cannot trust pass/fail results they cannot explain.',
              step.fix,
              'Verification',
            ),
        findings,
        seen,
      ),
    );
  }
}

function runFrictionHeatmapScenarios(
  sources: { html: string; appJs: string },
  scenarios: FirstTimeScenarioResult[],
  findings: FirstTimeUserFinding[],
  seen: Set<string>,
): void {
  const frictionSteps: ReadonlyArray<{
    id: string;
    name: string;
    checkId: string;
    question: string;
    fix: string;
  }> = [
    {
      id: 'friction-navigation',
      name: 'Friction navigation analysis visible',
      checkId: 'heatmap-visible',
      question: 'Where do founders get lost in navigation?',
      fix: 'Surface Navigation Friction Score in the Founder Friction Heatmap.',
    },
    {
      id: 'friction-understanding',
      name: 'Friction understanding analysis visible',
      checkId: 'confusion-hotspots',
      question: 'What concepts confuse founders most?',
      fix: 'List Confusion Hotspots with explainable detail.',
    },
    {
      id: 'friction-workflow',
      name: 'Friction workflow analysis visible',
      checkId: 'successful-journey',
      question: 'Where does the founder journey break down?',
      fix: 'Show Most Successful Journey and workflow friction ranking.',
    },
    {
      id: 'friction-verification',
      name: 'Friction verification analysis visible',
      checkId: 'category-scores',
      question: 'Where does verification create friction?',
      fix: 'Include Verification Friction Score in heatmap rankings.',
    },
    {
      id: 'friction-decision',
      name: 'Friction decision analysis visible',
      checkId: 'abandonment-point',
      question: 'Where do founders abandon or hesitate?',
      fix: 'Surface Most Likely Abandonment Point and Decision Friction Score.',
    },
  ];

  for (const step of frictionSteps) {
    const panel = founderFrictionHeatmapResolved('heatmap-visible', sources);
    const passed = panel && founderFrictionHeatmapResolved(step.checkId, sources);
    scenarios.push(
      runScenario(
        step.id,
        'TRUST_FORMATION',
        step.name,
        passed,
        passed ? `${step.name} — friction findings explainable.` : `${step.name} — heatmap incomplete.`,
        passed
          ? null
          : makeFinding(
              'TRUST_FORMATION_FAILURE',
              'TRUST_FORMATION',
              'MEDIUM',
              `Founder friction heatmap gap: ${step.name}.`,
              step.question,
              'Automatic friction discovery with ranked hotspots.',
              'Friction may exist but is not surfaced to founders.',
              'Teams cannot prioritize UX fixes without visible friction rankings.',
              step.fix,
              'Product Coherence',
            ),
        findings,
        seen,
      ),
    );
  }
}

function extractNavLabels(html: string): string[] {
  const labels: string[] = [];
  const re = /class="nav-label"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) labels.push(m[1].trim());
  return labels;
}

function extractFunctionBlock(appJs: string, fnName: string): string {
  const marker = `function ${fnName}`;
  const idx = appJs.indexOf(marker);
  if (idx < 0) return '';
  const nextIdx = appJs.indexOf('\n  function ', idx + marker.length);
  return appJs.slice(idx, nextIdx > idx ? nextIdx : idx + 6000);
}

function screenPurposeCheck(
  screen: string,
  viewId: string,
  block: string,
  html: string,
  markers: readonly string[],
): FirstTimeScreenPurposeResult {
  const navHelp = html.includes(`data-view="${viewId}"`) && html.includes('nav-help');
  const hasLead = /product-lead|welcome-subtitle|welcome-hint|What should I do here/i.test(block);
  const hasMarkers = markers.some((m) => block.includes(m) || html.includes(m));
  const purposeClear = hasMarkers && (hasLead || navHelp || markers.length <= 2);
  return {
    screen,
    viewId,
    purposeClear,
    detail: purposeClear
      ? `${screen} purpose copy is discoverable for first-time founders.`
      : `${screen} purpose is not obvious within the first minute.`,
  };
}

function buildOperatorFeed(
  scenarios: FirstTimeScenarioResult[],
  findings: FirstTimeUserFinding[],
): FirstTimeFeedEvent[] {
  return [
    {
      section: 'Planning',
      action: 'Simulating first-time founder',
      detail: 'Entering AiDevEngine with no prior context, roadmap, or architecture knowledge.',
      status: 'Active',
    },
    {
      section: 'Planning',
      action: 'Evaluating product understanding',
      detail: 'Checking whether a new founder can explain what AiDevEngine is for.',
      status: scenarios.find((s) => s.id === 'product-purpose-visible')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Planning',
      action: 'Evaluating navigation clarity',
      detail: 'Reviewing menu labels, overlaps, and discoverability for first-time navigation.',
      status: scenarios.find((s) => s.id === 'navigation-clarity')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Planning',
      action: 'Evaluating workflow discoverability',
      detail: 'Checking whether the first workflow and next step are obvious.',
      status: scenarios.find((s) => s.id === 'first-workflow-visible')?.passed ? 'Completed' : 'Blocked',
    },
    {
      section: 'Planning',
      action: 'Evaluating trust formation',
      detail: 'Reviewing score explanations, promise realism, and evidence visibility.',
      status: scenarios.find((s) => s.id === 'trust-formation')?.passed ? 'Completed' : 'Warning',
    },
    {
      section: 'Planning',
      action: 'Ranking confusion risks',
      detail:
        findings.length > 0
          ? `${findings.length} first-time confusion risk(s) ranked by severity.`
          : 'No major first-time confusion risks detected in bounded scenarios.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Warning' : 'Completed',
    },
  ];
}

function computeCategoryScores(
  scenarios: FirstTimeScenarioResult[],
  findings: FirstTimeUserFinding[],
  screenResults: FirstTimeScreenPurposeResult[],
): FirstTimeUserCategoryScores {
  const byCategory = (cat: FirstTimeRealityCategory) =>
    scenarios.filter((s) => s.category === cat);
  const penaltyFor = (cat: FirstTimeRealityCategory) =>
    findings.filter((f) => f.category === cat).reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  const scoreFrom = (cat: FirstTimeRealityCategory, base: number) =>
    clamp(base - penaltyFor(cat));

  const productScenarios = byCategory('PRODUCT_UNDERSTANDING');
  const navScenarios = byCategory('NAVIGATION_UNDERSTANDING');
  const workflowScenarios = byCategory('WORKFLOW_UNDERSTANDING');
  const trustScenarios = byCategory('TRUST_FORMATION');
  const cognitiveScenarios = byCategory('COGNITIVE_LOAD');

  const screenPassRate =
    screenResults.length > 0
      ? screenResults.filter((s) => s.purposeClear).length / screenResults.length
      : 0.5;

  return {
    understanding: scoreFrom(
      'PRODUCT_UNDERSTANDING',
      productScenarios.length
        ? (productScenarios.filter((s) => s.passed).length / productScenarios.length) * 100
        : 70,
    ),
    navigation: scoreFrom(
      'NAVIGATION_UNDERSTANDING',
      navScenarios.length ? (navScenarios.filter((s) => s.passed).length / navScenarios.length) * 100 : 70,
    ),
    workflow: scoreFrom(
      'WORKFLOW_UNDERSTANDING',
      workflowScenarios.length
        ? (workflowScenarios.filter((s) => s.passed).length / workflowScenarios.length) * 100
        : 65,
    ),
    trust: scoreFrom(
      'TRUST_FORMATION',
      trustScenarios.length ? (trustScenarios.filter((s) => s.passed).length / trustScenarios.length) * 100 : 70,
    ),
    simplicity: scoreFrom(
      'COGNITIVE_LOAD',
      clamp(
        (cognitiveScenarios.filter((s) => s.passed).length / Math.max(cognitiveScenarios.length, 1)) * 100 * 0.6 +
          screenPassRate * 40,
      ),
    ),
  };
}

export function assessFirstTimeUserReality(
  input: AssessFirstTimeUserRealityInput,
): FirstTimeUserRealityAssessment {
  const { shellSources: sources } = input;
  const { appJs, html, css } = sources;
  const findings: FirstTimeUserFinding[] = [];
  const seen = new Set<string>();
  const scenarios: FirstTimeScenarioResult[] = [];

  const welcomeSubtitle = html.includes('welcome-subtitle') || appJs.includes('welcome-subtitle');
  const welcomeHint = html.includes('welcome-hint') || appJs.includes('welcome-hint');
  const brandSub = html.includes('Autonomous Development Engine');
  const purposeCopy =
    /Turn detailed product ideas into working applications/i.test(html + appJs) ||
    /Ask AiDevEngine about your project/i.test(html + appJs);
  const productPurposeVisible = welcomeSubtitle && welcomeHint && purposeCopy;

  scenarios.push(
    runScenario(
      'product-purpose-visible',
      'PRODUCT_UNDERSTANDING',
      'Product purpose visible on first entry',
      productPurposeVisible,
      productPurposeVisible
        ? 'Welcome state explains what AiDevEngine does.'
        : 'Welcome state does not clearly explain product purpose.',
      !productPurposeVisible
        ? makeFinding(
            'FIRST_TIME_CONFUSION',
            'PRODUCT_UNDERSTANDING',
            'HIGH',
            'New founder cannot quickly explain what AiDevEngine is.',
            'What is this?',
            'A clear one-sentence product purpose within 60 seconds of entry.',
            'Welcome copy missing or too vague on first load.',
            'First-time founders hesitate before trusting or exploring further.',
            'Strengthen Command Center welcome subtitle and hint with a concrete product purpose.',
            'Command Center',
          )
        : null,
      findings,
      seen,
    ),
  );

  const titleTag = html.includes('<title>') && /AiDevEngine/i.test(html);
  const conflictingIdentity =
    /DevPulse/i.test(html.replace(/AiDevEngine/g, '')) ||
    (/Autonomous Software Development/i.test(html) &&
      /Autonomous Development Engine/i.test(html) &&
      !html.includes('AiDevEngine'));
  scenarios.push(
    runScenario(
      'product-identity-consistent',
      'PRODUCT_UNDERSTANDING',
      'Product identity consistent',
      titleTag && !conflictingIdentity,
      conflictingIdentity ? 'Multiple product identities detected.' : 'Brand and title align on AiDevEngine.',
      conflictingIdentity
        ? makeFinding(
            'FIRST_TIME_CONFUSION',
            'PRODUCT_UNDERSTANDING',
            'MEDIUM',
            'Product may present multiple identities to a first-time founder.',
            'What is this?',
            'One consistent product name and mission.',
            'Conflicting titles or subtitles appear in shell copy.',
            'Trust formation slows when the product cannot explain itself consistently.',
            'Align page title, brand subtitle, and welcome copy on AiDevEngine.',
            'Command Center',
          )
        : null,
      findings,
      seen,
    ),
  );

  const navLabels = extractNavLabels(html);
  const navCount = navLabels.length;
  const navWithHelp = (html.match(/nav-help/g) || []).length;
  const verificationHelp = navItemHasHelp(html, 'verification');
  const livePreviewHelp = navItemHasHelp(html, 'live-preview');

  scenarios.push(
    runScenario(
      'navigation-clarity',
      'NAVIGATION_UNDERSTANDING',
      'Navigation labels and help text',
      navCount >= 6 && navWithHelp >= 4,
      `${navCount} nav items, ${navWithHelp} with help text.`,
      navWithHelp < 4
        ? makeFinding(
            'DISCOVERABILITY_FAILURE',
            'NAVIGATION_UNDERSTANDING',
            'MEDIUM',
            'Several screens lack sidebar help for first-time founders.',
            'Where do I go next?',
            'Each major screen explains itself in navigation.',
            `Only ${navWithHelp} nav items include help descriptions.`,
            'New founders cannot confidently choose the right screen.',
            'Add concise nav-help text for Verification, Live Preview, and Builder.',
          )
        : null,
      findings,
      seen,
    ),
  );

  for (const pair of NAV_OVERLAP_PAIRS) {
    if (!navLabels.includes(pair.a) || !navLabels.includes(pair.b)) continue;
    const separated = navPurposeSeparationResolved(pair.separationId, sources);
    scenarios.push(
      runScenario(
        `nav-overlap-${pair.a}-${pair.b}`.replace(/\s+/g, '-').toLowerCase(),
        'NAVIGATION_UNDERSTANDING',
        `${pair.a} vs ${pair.b} navigation overlap`,
        separated,
        separated
          ? `Purpose separation copy clarifies ${pair.a} vs ${pair.b}.`
          : pair.detail,
        separated
          ? null
          : makeFinding(
              'FIRST_TIME_CONFUSION',
              'NAVIGATION_UNDERSTANDING',
              'MEDIUM',
              `${pair.a} and ${pair.b} may confuse first-time founders.`,
              'Where do I go next?',
              'Distinct labels and help text for each destination.',
              pair.detail,
              'Overlapping destinations increase navigation uncertainty.',
              `Clarify when to use ${pair.a} versus ${pair.b} in nav help and first-screen copy.`,
              pair.a,
            ),
        findings,
        seen,
      ),
    );
  }

  if (!verificationHelp) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'PURPOSE_UNCLEAR',
        'SCREEN_PURPOSE',
        'HIGH',
        'Verification screen purpose is not obvious from navigation alone.',
        'What does verification do?',
        'Sidebar or hero explains verification vs diagnostics.',
        'Verification nav item has no nav-help description.',
        'First-time founders may skip quality checks or open the wrong screen.',
        'Add nav-help for Verification explaining readiness and evidence review.',
        'Verification',
      ),
    );
  }

  if (!livePreviewHelp) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'PURPOSE_UNCLEAR',
        'SCREEN_PURPOSE',
        'MEDIUM',
        'Live Preview purpose is not explained in navigation.',
        'What can I do here?',
        'Navigation explains preview vs running application.',
        'Live Preview nav item lacks nav-help text.',
        'New founders may not discover preview workflow early.',
        'Add nav-help describing preview purpose and when to open it.',
        'Live Preview',
      ),
    );
  }

  const clarity = assessProjectIntelligenceClarity(sources);
  const screenResults: FirstTimeScreenPurposeResult[] = [
    screenPurposeCheck(
      'Command Center',
      'command-center',
      html,
      html,
      ['welcome-subtitle', 'welcome-hint', 'Message AiDevEngine'],
    ),
    screenPurposeCheck(
      'Project Memory',
      'project-memory',
      extractFunctionBlock(appJs, 'renderProjectMemorySurface'),
      html,
      ["Everything AiDevEngine knows", 'Requirements', 'Architecture'],
    ),
    screenPurposeCheck(
      'Project Insights',
      'project-insights',
      extractFunctionBlock(appJs, 'renderProjectInsightsSurface'),
      html,
      ["Everything AiDevEngine thinks", 'Launch Readiness', 'Health'],
    ),
    screenPurposeCheck(
      'Verification',
      'verification',
      extractFunctionBlock(appJs, 'renderVerificationSurface'),
      html,
      ['Verification Readiness', 'What should I do here'],
    ),
    screenPurposeCheck(
      'Live Preview',
      'live-preview',
      extractFunctionBlock(appJs, 'renderLivePreviewSurface'),
      html,
      ['Preview Status', 'Live Preview Status', 'Recommended action'],
    ),
    screenPurposeCheck(
      'Product Coherence',
      'product-coherence',
      extractFunctionBlock(appJs, 'renderProductCoherenceSurface'),
      html,
      ['Does the product make sense', 'Product Coherence Score'],
    ),
  ].slice(0, MAX_SCREEN_PURPOSE_CHECKS);

  for (const screen of screenResults) {
    if (screen.purposeClear) continue;
    pushFinding(
      findings,
      seen,
      makeFinding(
        'PURPOSE_UNCLEAR',
        'SCREEN_PURPOSE',
        screen.screen === 'Verification' || screen.screen === 'Product Coherence' ? 'HIGH' : 'MEDIUM',
        `${screen.screen} purpose is not obvious to a first-time founder.`,
        `What is ${screen.screen} for?`,
        'First-screen copy answers purpose within one minute.',
        screen.detail,
        'Without screen purpose, founders cannot build a mental model of the product.',
        `Add a product-lead or hero card explaining why ${screen.screen} exists and when to use it.`,
        screen.screen,
      ),
    );
  }

  if (!clarity.passed) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'FIRST_TIME_CONFUSION',
        'SCREEN_PURPOSE',
        clarity.confusionSeverity === 'CRITICAL' || clarity.confusionSeverity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        clarity.issues[0] ?? 'Project Memory and Project Insights may look like the same destination.',
        'What information lives here?',
        'Clear distinction between Memory (knows) and Insights (thinks).',
        clarity.issues.join('; ') || 'Intelligence surfaces overlap for new founders.',
        'First-time founders cannot determine where project knowledge vs recommendations live.',
        'Strengthen Memory vs Insights positioning and cross-links.',
        'Project Memory',
      ),
    );
  }

  const actionCenterHelp = html.includes('What to do next');
  const runTestVisible = html.includes('run-founder-test') || html.includes('Run Founder Test');
  const defaultCommandCenter = html.includes('data-view="command-center"') && html.includes('nav-item active');
  const actionPathPanel = firstTimeActionPathResolved('panel-visible', sources);
  const firstWorkflowVisible =
    actionPathPanel || (actionCenterHelp && runTestVisible && defaultCommandCenter);

  runActionPathScenarios(sources, scenarios, findings, seen);
  runVerificationTrustScenarios(sources, scenarios, findings, seen);
  runFrictionHeatmapScenarios(sources, scenarios, findings, seen);

  scenarios.push(
    runScenario(
      'first-workflow-visible',
      'WORKFLOW_UNDERSTANDING',
      'First workflow discoverable',
      firstWorkflowVisible,
      firstWorkflowVisible
        ? 'Command Center default, Action Center help, and Run Founder Test visible.'
        : 'No obvious first workflow for a new founder.',
      !firstWorkflowVisible
        ? makeFinding(
            'WORKFLOW_UNKNOWN',
            'WORKFLOW_UNDERSTANDING',
            'HIGH',
            'No obvious first workflow identified for a brand-new founder.',
            'What should I do first?',
            'Welcome or Action Center highlights a clear starting path.',
            'Starting workflow is not surfaced on first entry.',
            'First-time founders stall before experiencing product value.',
            'Improve onboarding path with a visible first step in Command Center or Action Center.',
            'Command Center',
          )
        : null,
      findings,
      seen,
    ),
  );

  const scoresExplained =
    appJs.includes('Founder Sensemaking Score') &&
    appJs.includes('Product Coherence Score') &&
    appJs.includes('Why it matters');
  const verificationExplained = appJs.includes('Verification Readiness indicates');
  const trustFormation = scoresExplained && verificationExplained;

  scenarios.push(
    runScenario(
      'trust-formation',
      'TRUST_FORMATION',
      'Trust formation copy present',
      trustFormation,
      trustFormation
        ? 'Scores and verification readiness include explanatory copy.'
        : 'Trust-forming explanations incomplete.',
      !trustFormation
        ? makeFinding(
            'TRUST_FORMATION_FAILURE',
            'TRUST_FORMATION',
            'MEDIUM',
            'First-time founder may not understand readiness scores quickly.',
            'Why should I trust this?',
            'Scores and statuses include plain-language explanations.',
            'Some readiness surfaces lack why-it-matters copy.',
            'Unexplained scores feel like black boxes to new founders.',
            'Add score explanations and evidence summaries on Verification and Product Coherence.',
            'Product Coherence',
          )
        : null,
      findings,
      seen,
    ),
  );

  const cognitiveOverload = navCount > 12 || navWithHelp < 3;
  scenarios.push(
    runScenario(
      'cognitive-load',
      'COGNITIVE_LOAD',
      'Cognitive load manageable',
      !cognitiveOverload,
      cognitiveOverload
        ? `${navCount} navigation items with limited help text increases mental effort.`
        : 'Navigation count and help text are manageable for first-time use.',
      cognitiveOverload
        ? makeFinding(
            'COGNITIVE_OVERLOAD',
            'COGNITIVE_LOAD',
            navCount > 12 ? 'HIGH' : 'MEDIUM',
            'Product may overwhelm a first-time founder with too many destinations.',
            'How hard is this to understand?',
            'Focused navigation with guided first steps.',
            `${navCount} sidebar items and uneven help coverage.`,
            'High cognitive load slows onboarding and trust formation.',
            'Group advanced destinations, add nav-help, and highlight a first-time path.',
          )
        : null,
      findings,
      seen,
    ),
  );

  const boundedScenarios = scenarios.slice(0, MAX_FIRST_TIME_SCENARIOS);
  const categoryScores = computeCategoryScores(boundedScenarios, findings, screenResults);
  const firstTimeUserScore = clamp(
    categoryScores.understanding * 0.25 +
      categoryScores.navigation * 0.2 +
      categoryScores.workflow * 0.2 +
      categoryScores.trust * 0.2 +
      categoryScores.simplicity * 0.15,
  );

  const strengths: string[] = [];
  if (productPurposeVisible) strengths.push('Product purpose understandable from welcome state');
  if (navWithHelp >= 4) strengths.push('Navigation mostly clear with sidebar help text');
  if (clarity.passed) strengths.push('Project Memory vs Insights distinction explained');
  if (trustFormation) strengths.push('Readiness scores include explanatory copy');
  if (firstWorkflowVisible) strengths.push('First workflow path is discoverable');
  if (actionPathPanel) strengths.push('First-time founder action path visible in sidebar');
  if (verificationTrustEvidenceResolved('trust-section-visible', sources)) {
    strengths.push('Verification Trust & Evidence section explains results');
  }
  if (founderFrictionHeatmapResolved('heatmap-visible', sources)) {
    strengths.push('Founder Friction Heatmap surfaces confusion and abandonment risks');
  }

  const actionPathScenarios = boundedScenarios.filter((s) => s.id.startsWith('action-path-'));
  const actionPathScenariosPassed = actionPathScenarios.filter((s) => s.passed).length;

  const weaknesses = findings.slice(0, 6).map((f) => f.whatConfuses);
  const topConfusionRisk = findings.sort(
    (a, b) => SEVERITY_PENALTY[b.severity] - SEVERITY_PENALTY[a.severity],
  )[0]?.whatConfuses ?? null;

  return {
    firstTimeUserScore,
    categoryScores,
    scenarios: boundedScenarios,
    screenPurposeResults: screenResults,
    findings,
    strengths: strengths.slice(0, 5),
    weaknesses,
    topConfusionRisk,
    recommendedFixes: findings.map((f) => f.recommendedFix).slice(0, 8),
    operatorFeedEvents: buildOperatorFeed(boundedScenarios, findings),
    productUnderstandingPass: boundedScenarios.some((s) => s.id === 'product-purpose-visible' && s.passed),
    navigationUnderstandingPass: boundedScenarios.some((s) => s.id === 'navigation-clarity' && s.passed),
    workflowClarityPass: boundedScenarios.some((s) => s.id === 'first-workflow-visible' && s.passed),
    trustFormationPass: boundedScenarios.some((s) => s.id === 'trust-formation' && s.passed),
    cognitiveLoadPass: boundedScenarios.some((s) => s.id === 'cognitive-load' && s.passed),
    actionPathPass: actionPathScenarios.length > 0 && actionPathScenarios.every((s) => s.passed),
    actionPathStepsVisible: firstTimeActionPathResolved('panel-visible', sources) ? 6 : 0,
    actionPathScenariosPassed,
    findingsGenerated: findings.length > 0,
    insufficientInfo: boundedScenarios.length === 0,
    insufficientInfoReason: boundedScenarios.length === 0 ? 'No first-time scenarios executed.' : null,
  };
}

function severityRank(s: FirstTimeSeverity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s];
}

function mapFirstTimeToSensemaking(finding: FirstTimeUserFinding): SensemakingFinding {
  const senseType =
    finding.type === 'TRUST_FORMATION_FAILURE'
      ? ('TRUST_RISK' as const)
      : finding.type === 'FIRST_TIME_CONFUSION' || finding.type === 'PURPOSE_UNCLEAR'
        ? ('CONFUSION' as const)
        : finding.type === 'COGNITIVE_OVERLOAD'
          ? ('COHERENCE_GAP' as const)
          : ('CONFUSION' as const);

  return {
    id: `first-time-sense-${finding.id}`,
    type: senseType,
    severity: finding.severity,
    area: 'First-Time User Reality',
    whatDoesNotMakeSense: finding.whatConfuses,
    whyItMatters: finding.whyItMatters,
    recommendedUpgrade: finding.recommendedFix,
    expectedImpact: 'Improves first-time founder understanding and trust.',
    evidence: finding.firstTimeQuestion,
  };
}

function mergeSensemaking(
  base: FounderSensemakingAssessment,
  firstTime: FirstTimeUserRealityAssessment,
): FounderSensemakingAssessment {
  const extraFindings = firstTime.findings.map(mapFirstTimeToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => severityRank(a.severity as FirstTimeSeverity) - severityRank(b.severity as FirstTimeSeverity))
    .slice(0, 12);

  const topConfusion = mergedFindings.filter((f) => f.type === 'CONFUSION').slice(0, 4);
  const topTrustRisks = mergedFindings.filter(
    (f) => f.type === 'TRUST_RISK' || f.type === 'COHERENCE_GAP',
  ).slice(0, 4);
  const penalty = firstTime.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.3)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.2)),
    findings: mergedFindings,
    topConfusionRisks: topConfusion.length ? topConfusion : base.topConfusionRisks,
    topTrustRisks: topTrustRisks.length ? topTrustRisks : base.topTrustRisks,
    confusionRisksDetected: topConfusion.length > 0 || base.confusionRisksDetected,
    trustRisksDetected: topTrustRisks.length > 0 || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...firstTime.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  firstTime: FirstTimeUserRealityAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  for (const finding of firstTime.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
    const title =
      finding.type === 'WORKFLOW_UNKNOWN'
        ? `[HIGH] Improve onboarding path`
        : finding.type === 'PURPOSE_UNCLEAR' && finding.screen
          ? `[HIGH] Improve ${finding.screen} explanation`
          : `[${finding.severity}] ${finding.recommendedFix.slice(0, 64)}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('first-time-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: finding.whyItMatters,
      expectedImpact: 'Helps first-time founders understand and use AiDevEngine faster.',
      evidence: finding.firstTimeQuestion,
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
    operatorFeedEvents: [...firstTime.operatorFeedEvents.slice(3, 5), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithFirstTimeUserReality(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: FounderSensemakingAssessment,
  firstTime: FirstTimeUserRealityAssessment,
): EnrichedFirstTimeAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, firstTime),
    founderSensemaking: mergeSensemaking(founderSensemaking, firstTime),
  };
}
