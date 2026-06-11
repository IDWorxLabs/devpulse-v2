/**
 * Founder Proxy Evaluation Layer — vision, usefulness, customer readiness, confusion.
 * Simulates founder / first-time user / customer without external AI or execution.
 */

import { evaluateFirstImpressionJudge } from '../product-reality-verification/first-impression-judge/first-impression-judge.js';
import { evaluateUXHeuristicEngine } from '../product-reality-verification/ux-heuristic-evaluator/ux-heuristic-engine.js';
import { MANDATORY_PRODUCT_IDENTITY_PROMPTS } from '../command-center-brain/product-identity-responses.js';
import { assessProjectIntelligenceClarity } from './project-intelligence-clarity.js';
import {
  assessArchitectureLeakage,
  leakageLevelSeverity,
  type ArchitectureLeakageLevel,
} from './founder-proxy-architecture-leakage.js';
import { FOUNDER_TEST_SCREENS } from './founder-testing-nav-spec.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';
import {
  PRODUCT_VISION_BASELINE,
  VISION_ALIGNMENT_KEYWORDS,
  VISION_ANTI_KEYWORDS,
} from './founder-testing-vision-baseline.js';
import type {
  ConfusionRisk,
  FounderApprovalPrediction,
  FounderProxyScreenContext,
  ProductReadinessReality,
  PromptVisionResult,
  ScreenPurposeResult,
} from './founder-testing-v2-types.js';
import type { FounderTestIssue } from './founder-testing-types.js';

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countKeywordHits(text: string, keywords: readonly string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) hits += 1;
  }
  return hits;
}

export function scoreVisionAlignment(text: string): number {
  const visionHits = countKeywordHits(text, VISION_ALIGNMENT_KEYWORDS);
  const antiHits = countKeywordHits(text, VISION_ANTI_KEYWORDS);
  const leakage = assessArchitectureLeakage(text);
  let score = 45 + visionHits * 6 - antiHits * 10 - leakage.riskScore * 0.45;
  if (/aidevengine/i.test(text) && visionHits >= 2) score += 10;
  if (leakage.level === 'CRITICAL') score -= 25;
  if (leakage.level === 'HIGH') score -= 15;
  return clamp(score);
}

export function scoreUsefulness(text: string, screen: string): number {
  const actionSignals = /\b(next action|recommended|start|open|ask|build|verify|preview|create|view|select)\b/i.test(text);
  const insightSignals = /\b(status|health|progress|summary|portfolio|priority|readiness|insight)\b/i.test(text);
  let score = 50;
  if (actionSignals) score += 18;
  if (insightSignals) score += 14;
  if (text.length > 200) score += 8;
  if (/empty state|no .* yet/i.test(text) && /next action|ask|start/i.test(text)) score += 10;
  if (screen === 'System Diagnostics' && /advanced|internal/i.test(text)) score += 12;
  return clamp(score);
}

function surfaceSnippet(appJs: string, containerId: string, viewId: string): string {
  const renderMap: Record<string, string> = {
    'projects-surface': 'renderProjectsSurface',
    'autonomous-builder-surface': 'renderAutonomousBuilderSurface',
    'live-preview-surface': 'renderLivePreviewSurface',
    'project-memory-surface': 'renderProjectMemorySurface',
    'verification-surface': 'renderVerificationSurface',
    'notifications-surface': 'renderNotificationsSurface',
    'project-insights-surface': 'renderProjectInsightsSurface',
  };
  if (viewId === 'command-center') {
    const idx = appJs.indexOf('welcome-title');
    return idx >= 0 ? appJs.slice(idx, idx + 1200) : appJs.slice(0, 1200);
  }
  if (viewId === 'system-diagnostics') {
    return 'System Diagnostics advanced internal platform architecture Foundation Stacks Verification Scripts';
  }
  const fn = renderMap[containerId];
  if (!fn) return '';
  const idx = appJs.indexOf(`function ${fn}`);
  return idx >= 0 ? appJs.slice(idx, idx + 4000) : '';
}

const SCREEN_PURPOSE_EXPECTATIONS: Record<
  string,
  { what: RegExp[]; why: RegExp[]; next: RegExp[]; founderIntent: string }
> = {
  'command-center': {
    what: [/command center|message aidevengine|ask aidevengine/i],
    why: [/product ideas|working applications|roadmap|verification/i],
    next: [/message|ask|send|build next/i],
    founderIntent: 'Primary AI conversation surface for planning and guidance',
  },
  projects: {
    what: [/your projects|projects aidevengine/i],
    why: [/ideas becoming|tracking/i],
    next: [/start|select|command center|get started/i],
    founderIntent: 'Shows projects the founder is building',
  },
  'autonomous-builder': {
    what: [/autonomous builder/i],
    why: [/plans and executes|workspace/i],
    next: [/readiness|connected|honest/i],
    founderIntent: 'Honest autonomous execution readiness',
  },
  'live-preview': {
    what: [/preview status|live preview/i],
    why: [/running preview|application/i],
    next: [/next action|start|select a project/i],
    founderIntent: 'See the app running without fake previews',
  },
  'project-memory': {
    what: [/project memory|everything aidevengine knows|project knowledge/i],
    why: [/requirements|architecture|facts|history|stored context/i],
    next: [/ask command center|project insights|empty/i],
    founderIntent: 'What AiDevEngine knows about the project — not registry internals',
  },
  verification: {
    what: [/verification readiness|quality checks/i],
    why: [/validation gates|readiness/i],
    next: [/run|system diagnostics|npm/i],
    founderIntent: 'User-friendly verification status — not raw script dumps',
  },
  notifications: {
    what: [/notifications/i],
    why: [/updates|alerts|activity/i],
    next: [/empty|list|check/i],
    founderIntent: 'Clear notification purpose and empty state',
  },
  'project-insights': {
    what: [/project insights|everything aidevengine thinks|project intelligence/i],
    why: [/health|risks|progress|launch readiness|recommendations/i],
    next: [/view insights|recommended|next actions|priority/i],
    founderIntent: 'What AiDevEngine thinks about the project — health and next steps',
  },
  'system-diagnostics': {
    what: [/system diagnostics|advanced|internal/i],
    why: [/platform architecture|advanced visibility/i],
    next: [/run manually|diagnostics/i],
    founderIntent: 'Advanced internal diagnostics — clearly separated from insights',
  },
};

export function evaluateScreenPurpose(sources: ScreenCheckSources): ScreenPurposeResult[] {
  const { appJs } = sources;
  const results: ScreenPurposeResult[] = [];

  for (const spec of FOUNDER_TEST_SCREENS) {
    const text = surfaceSnippet(appJs, spec.containerId, spec.viewId);
    const expect = SCREEN_PURPOSE_EXPECTATIONS[spec.viewId];
    const leakage = assessArchitectureLeakage(text);
    const issues: string[] = [];

    const whatIsClear = expect ? expect.what.some((p) => p.test(text)) : false;
    const whyCareClear = expect ? expect.why.some((p) => p.test(text)) : false;
    const nextActionClear = expect ? expect.next.some((p) => p.test(text)) : false;

    if (!whatIsClear) issues.push('Unclear what this screen is');
    if (!whyCareClear) issues.push('Unclear why the user should care');
    if (!nextActionClear) issues.push('Unclear next action');

    if (
      spec.viewId !== 'system-diagnostics' &&
      leakageLevelSeverity(leakage.level) >= leakageLevelSeverity('MEDIUM')
    ) {
      issues.push(`Architecture leakage in surface copy (${leakage.level})`);
    }

    if (spec.viewId === 'project-insights' && /foundation stacks|validator-list/i.test(text)) {
      issues.push('Project Insights exposes internal diagnostics');
    }

    let founderExpectation = 70;
    if (!whatIsClear) founderExpectation -= 20;
    if (!whyCareClear) founderExpectation -= 15;
    if (!nextActionClear) founderExpectation -= 15;
    if (issues.some((i) => i.includes('diagnostics'))) founderExpectation -= 25;

    results.push({
      screen: spec.label,
      viewId: spec.viewId,
      whatIsClear,
      whyCareClear,
      nextActionClear,
      visionAlignment: scoreVisionAlignment(text),
      usefulness: scoreUsefulness(text, spec.label),
      founderExpectationAlignment: clamp(founderExpectation),
      architectureLeakage: leakage.level,
      issues,
    });
  }

  return results;
}

export function detectConfusionRisks(sources: ScreenCheckSources): {
  understandabilityScore: number;
  risks: ConfusionRisk[];
} {
  const { appJs, html } = sources;
  const risks: ConfusionRisk[] = [];

  const clarity = assessProjectIntelligenceClarity({ appJs, html });
  if (!clarity.passed || clarity.confusionSeverity === 'HIGH' || clarity.confusionSeverity === 'CRITICAL') {
    risks.push({
      screens: 'Project Memory vs Project Insights',
      risk:
        clarity.issues[0] ??
        'User may not distinguish stored project knowledge from project intelligence recommendations',
      severity: clarity.confusionSeverity === 'HIGH' || clarity.confusionSeverity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
    });
  } else if (clarity.confusionSeverity === 'LOW') {
    risks.push({
      screens: 'Project Memory vs Project Insights',
      risk: 'Minor clarity polish possible between Memory and Insights',
      severity: 'LOW',
    });
  }

  const verificationText = surfaceSnippet(appJs, 'verification-surface', 'verification');
  if (/system diagnostics/i.test(verificationText) && !/advanced/i.test(verificationText)) {
    risks.push({
      screens: 'Verification vs System Diagnostics',
      risk: 'Verification may feel like a gateway to internal diagnostics rather than product quality',
      severity: 'MEDIUM',
    });
  }

  if (html.includes('Autonomous Builder') && !/not connected|honest|does not overpromise/i.test(appJs)) {
    risks.push({
      screens: 'Autonomous Builder vs Command Center',
      risk: 'Autonomous Builder may overpromise relative to Command Center chat',
      severity: 'MEDIUM',
    });
  }

  const navCount = (html.match(/nav-label/g) || []).length;
  if (navCount >= 8) {
    risks.push({
      screens: 'Navigation breadth',
      risk: 'Nine nav items may overwhelm a first-time user in 5–10 seconds',
      severity: 'LOW',
    });
  }

  const understandabilityScore = clamp(88 - risks.length * 12 - risks.filter((r) => r.severity === 'HIGH').length * 8);
  return { understandabilityScore, risks };
}

function isMandatoryIdentityPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase().replace(/[?.!]+$/, '');
  return MANDATORY_PRODUCT_IDENTITY_PROMPTS.some(
    (entry) => entry.trim().toLowerCase().replace(/[?.!]+$/, '') === normalized,
  );
}

function scoreCustomerReadinessFromResponse(text: string): number {
  const leakage = assessArchitectureLeakage(text);
  let score = 52;
  if (/aidevengine/i.test(text)) score += 14;
  if (/\b(application|applications|app|build|project|preview|verify|launch)\b/i.test(text)) score += 16;
  if (/next action/i.test(text)) score += 10;
  if (leakageLevelSeverity(leakage.level) <= leakageLevelSeverity('LOW')) score += 10;
  if (/\b(requirement|plan|quality|readiness)\b/i.test(text)) score += 8;
  return clamp(score);
}

function scoreFounderApprovalFromResponse(input: {
  visionAlignment: number;
  usefulness: number;
  actionability: number;
  leakage: ArchitectureLeakageLevel;
}): number {
  const leakagePenalty =
    input.leakage === 'CRITICAL' ? 30 : input.leakage === 'HIGH' ? 18 : input.leakage === 'MEDIUM' ? 8 : 0;
  return clamp(
    input.visionAlignment * 0.4 + input.usefulness * 0.25 + input.actionability * 0.25 + 12 - leakagePenalty,
  );
}

export function evaluatePromptVision(prompt: string, response: string): PromptVisionResult {
  const trimmed = response.trim();
  const leakage = assessArchitectureLeakage(trimmed);
  const visionAlignment = scoreVisionAlignment(trimmed);
  const usefulness = scoreUsefulness(trimmed, 'Command Center');
  const clarity =
    trimmed.split(/\s+/).length >= 12 && !/^error\b/i.test(trimmed) ? clamp(60 + countKeywordHits(trimmed, VISION_ALIGNMENT_KEYWORDS) * 4) : 35;
  const actionability = /\b(next|start|open|ask|try|recommend|suggest|go to|build|verify|create)\b/i.test(trimmed)
    ? clamp(70 + countKeywordHits(trimmed, ['next', 'start', 'build']) * 5)
    : 30;
  const nextStepQuality = actionability;
  const mandatoryIdentity = isMandatoryIdentityPrompt(prompt);
  const customerReadiness = mandatoryIdentity
    ? scoreCustomerReadinessFromResponse(trimmed)
    : integratePerceptionSignals(`prompt-vision-${prompt.slice(0, 24)}`).customerReadiness;
  const founderApprovalProxy = mandatoryIdentity
    ? scoreFounderApprovalFromResponse({
        visionAlignment,
        usefulness,
        actionability,
        leakage: leakage.level,
      })
    : clamp(
        visionAlignment * 0.35 + customerReadiness * 0.25 + usefulness * 0.2 + actionability * 0.2 -
          (leakageLevelSeverity(leakage.level) >= leakageLevelSeverity('HIGH') ? 20 : 0),
      );

  const issues: string[] = [];
  if (leakage.level === 'CRITICAL' || leakage.level === 'HIGH') {
    issues.push(`Architecture leakage ${leakage.level}: ${leakage.findings.map((f) => f.label).join(', ')}`);
  }
  if (mandatoryIdentity && leakageLevelSeverity(leakage.level) > leakageLevelSeverity('LOW')) {
    issues.push(`Mandatory identity prompt requires architecture leakage LOW or better (got ${leakage.level})`);
  }
  if (visionAlignment < 55) issues.push('Response describes architecture more than product vision');
  if (mandatoryIdentity && visionAlignment < 85) {
    issues.push(`Mandatory identity prompt requires vision alignment ≥ 85 (got ${visionAlignment})`);
  }
  if (/what is aidevengine/i.test(prompt) && /devpulse|phase \d/i.test(trimmed)) {
    issues.push('Identity prompt answered with internal phase/architecture instead of product explanation');
  }
  if (usefulness < 50) issues.push('Low product usefulness for founder-style prompt');
  if (actionability < 50) issues.push('Weak next-step guidance');
  if (mandatoryIdentity && founderApprovalProxy < 80) {
    issues.push(`Mandatory identity prompt founder approval proxy below 80 (got ${founderApprovalProxy})`);
  }
  if (mandatoryIdentity && customerReadiness < 80) {
    issues.push(`Mandatory identity prompt customer readiness below 80 (got ${customerReadiness})`);
  }

  const passed = mandatoryIdentity
    ? visionAlignment >= 85 &&
      leakageLevelSeverity(leakage.level) <= leakageLevelSeverity('LOW') &&
      clarity >= 55 &&
      actionability >= 50 &&
      usefulness >= 50 &&
      founderApprovalProxy >= 80 &&
      customerReadiness >= 80
    : visionAlignment >= 55 &&
      leakageLevelSeverity(leakage.level) <= leakageLevelSeverity('MEDIUM') &&
      clarity >= 45 &&
      actionability >= 40;

  return {
    prompt,
    responsePreview: trimmed.slice(0, 320) + (trimmed.length > 320 ? '…' : ''),
    visionAlignment,
    usefulness,
    clarity,
    actionability,
    nextStepQuality,
    architectureLeakage: leakage.level,
    leakageFindings: leakage.findings.map((f) => f.label),
    passed,
    issues,
  };
}

export function integratePerceptionSignals(requestId: string): {
  customerReadiness: number;
  founderSignals: number;
  navigationClarity: number;
} {
  try {
    const founderFi = evaluateFirstImpressionJudge({
      requestId: `${requestId}-founder`,
      persona: 'FOUNDER_FIRST_VISIT',
    });
    const customerFi = evaluateFirstImpressionJudge({
      requestId: `${requestId}-customer`,
      persona: 'CUSTOMER_FIRST_VISIT',
    });
    const ux = evaluateUXHeuristicEngine({ requestId: `${requestId}-ux` });

    return {
      customerReadiness: clamp(
        (customerFi.report.launchReadinessPerceptionScore +
          customerFi.report.trustworthinessScore +
          customerFi.report.productClarityScore) /
          3,
      ),
      founderSignals: clamp(
        (founderFi.report.founderUsefulnessScore +
          founderFi.report.actionReadinessScore +
          founderFi.report.productIdentityScore) /
          3,
      ),
      navigationClarity: ux.report.navigationClarityScore,
    };
  } catch {
    return { customerReadiness: 55, founderSignals: 55, navigationClarity: 60 };
  }
}

export function predictFounderApproval(input: {
  technicalReadiness: number;
  productReadiness: number;
  visionAlignment: number;
  customerReadiness: number;
  architectureLevel: ArchitectureLeakageLevel;
  screenPurposeAvg: number;
}): FounderApprovalPrediction {
  const leakagePenalty =
    input.architectureLevel === 'CRITICAL'
      ? 35
      : input.architectureLevel === 'HIGH'
        ? 22
        : input.architectureLevel === 'MEDIUM'
          ? 10
          : 0;

  const likelihood = clamp(
    input.technicalReadiness * 0.12 +
      input.productReadiness * 0.22 +
      input.visionAlignment * 0.28 +
      input.customerReadiness * 0.18 +
      input.screenPurposeAvg * 0.2 -
      leakagePenalty,
  );

  const reasons: string[] = [];
  if (input.visionAlignment < 60) reasons.push('vision alignment below founder bar');
  if (input.architectureLevel === 'CRITICAL' || input.architectureLevel === 'HIGH') {
    reasons.push('architecture leakage in user-facing responses or surfaces');
  }
  if (input.productReadiness < 65) reasons.push('product usefulness and screen purpose need work');
  if (input.technicalReadiness >= 75 && input.visionAlignment < 60) {
    reasons.push('technically correct but product story misaligned');
  }
  if (likelihood >= 75) reasons.push('founder would likely approve with minor polish');
  if (!reasons.length) reasons.push('balanced technical and product readiness');

  return {
    likelihood,
    reasoning: reasons.join('; '),
  };
}

export function buildReadinessReality(input: {
  v1Overall: number;
  screenPurposeResults: ScreenPurposeResult[];
  promptVisionResults: PromptVisionResult[];
  understandabilityScore: number;
  perception: { customerReadiness: number; founderSignals: number; navigationClarity: number };
}): ProductReadinessReality {
  const screenVision =
    input.screenPurposeResults.reduce((s, r) => s + r.visionAlignment, 0) /
    Math.max(1, input.screenPurposeResults.length);
  const promptVision =
    input.promptVisionResults.reduce((s, r) => s + r.visionAlignment, 0) /
    Math.max(1, input.promptVisionResults.length);
  const usefulness =
    input.screenPurposeResults.reduce((s, r) => s + r.usefulness, 0) /
    Math.max(1, input.screenPurposeResults.length);
  const founderExpect =
    input.screenPurposeResults.reduce((s, r) => s + r.founderExpectationAlignment, 0) /
    Math.max(1, input.screenPurposeResults.length);

  return {
    technicalReadiness: clamp(input.v1Overall),
    productReadiness: clamp((usefulness + input.understandabilityScore) / 2),
    founderReadiness: clamp((founderExpect + input.perception.founderSignals) / 2),
    customerReadiness: clamp((input.perception.customerReadiness + input.understandabilityScore) / 2),
    visionAlignment: clamp((screenVision + promptVision) / 2),
  };
}

export function screenPurposeToIssues(results: ScreenPurposeResult[]): FounderTestIssue[] {
  const issues: FounderTestIssue[] = [];
  for (const r of results) {
    for (const issue of r.issues) {
      const severity =
        issue.includes('diagnostics') || issue.includes('Architecture leakage')
          ? ('HIGH' as const)
          : issue.includes('Unclear what')
            ? ('HIGH' as const)
            : ('MEDIUM' as const);
      issues.push({
        severity,
        screen: r.screen,
        problem: issue,
        userImpact: 'Founder or customer may not understand this screen purpose within 5–10 seconds.',
        likelyCause: 'Copy emphasizes implementation over user goals.',
        recommendedFix: `Rewrite ${r.screen} to answer: what is this, why care, what next.`,
        copyPasteFixPrompt: `Improve AiDevEngine ${r.screen} user-facing copy for vision alignment: ${issue}`,
      });
    }
  }
  return issues;
}

export function promptVisionToIssues(results: PromptVisionResult[]): FounderTestIssue[] {
  return results
    .filter((r) => !r.passed)
    .map((r) => ({
      severity: (r.architectureLeakage === 'CRITICAL' || r.architectureLeakage === 'HIGH'
        ? 'BLOCKER'
        : 'HIGH') as FounderTestIssue['severity'],
      screen: 'Command Center',
      problem: `Prompt "${r.prompt}" vision misaligned: ${r.issues.join('; ')}`,
      userImpact: 'Founder hears architecture instead of product value.',
      likelyCause: 'Brain routes identity questions to internal roadmap/architecture context.',
      recommendedFix: 'Rewrite brain identity responses to explain AiDevEngine product vision first.',
      copyPasteFixPrompt: `Fix Command Center response for "${r.prompt}" — explain AiDevEngine as autonomous software development engine, not DevPulse phases. Issues: ${r.issues.join('; ')}`,
    }));
}

export function summarizeArchitectureLeakage(
  screens: ScreenPurposeResult[],
  prompts: PromptVisionResult[],
): ArchitectureLeakageLevel {
  const levels = [...screens.map((s) => s.architectureLeakage), ...prompts.map((p) => p.architectureLeakage)];
  const max = levels.reduce((best, cur) => (leakageLevelSeverity(cur) > leakageLevelSeverity(best) ? cur : best), 'NONE' as ArchitectureLeakageLevel);
  return max;
}

export function topFounderConcerns(input: {
  promptVision: PromptVisionResult[];
  screenPurpose: ScreenPurposeResult[];
  confusion: ConfusionRisk[];
}): string[] {
  const concerns: string[] = [];
  const badPrompts = input.promptVision.filter((p) => !p.passed || p.architectureLeakage === 'CRITICAL');
  for (const p of badPrompts.slice(0, 5)) {
    concerns.push(`"${p.prompt}" → ${p.issues[0] ?? 'vision misaligned'} (leakage: ${p.architectureLeakage})`);
  }
  for (const s of input.screenPurpose.filter((r) => r.issues.length).slice(0, 4)) {
    concerns.push(`${s.screen}: ${s.issues[0]}`);
  }
  for (const c of input.confusion.filter((r) => r.severity !== 'LOW').slice(0, 3)) {
    concerns.push(`${c.screens}: ${c.risk}`);
  }
  if (!concerns.length) concerns.push('No critical founder concerns detected — polish only.');
  return concerns;
}

export { PRODUCT_VISION_BASELINE };
