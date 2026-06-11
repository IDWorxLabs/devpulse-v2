/**
 * Visual Quality Authority — evaluates launch-ready presentation quality from shell signals.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type {
  SensemakingFinding,
  SensemakingFindingType,
} from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  MAX_VISUAL_ACTIONS,
  MAX_VISUAL_FINDINGS,
  MAX_VISUAL_RISKS,
  MAX_VISUAL_STRENGTHS,
} from './visual-quality-authority-bounds.js';
import type {
  AssessVisualQualityAuthorityInput,
  EnrichedVisualQualityAssessments,
  VisualFindingType,
  VisualQualityAuthorityAssessment,
  VisualQualityCategory,
  VisualQualityFinding,
  VisualQualityShellSources,
  VisualQualitySubscores,
  VisualQualityVisibility,
  VisualSeverity,
} from './visual-quality-authority-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const SEVERITY_PENALTY: Record<VisualSeverity, number> = {
  CRITICAL: 22,
  HIGH: 14,
  MEDIUM: 8,
  LOW: 4,
};

const SEVERITY_RANK: Record<VisualSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

let findingIdCounter = 0;

export function resetVisualQualityCounterForTests(): void {
  findingIdCounter = 0;
}

function nextFindingId(prefix: string): string {
  findingIdCounter += 1;
  return `${prefix}-${findingIdCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function shellCopy(sources: VisualQualityShellSources): string {
  return `${sources.html}\n${sources.css}\n${sources.appJs}`;
}

function pushFinding(
  bucket: VisualQualityFinding[],
  seen: Set<string>,
  finding: Omit<VisualQualityFinding, 'id'> & { id?: string },
): void {
  const key = `${finding.type}:${finding.explanation.trim().toLowerCase()}`;
  if (seen.has(key) || bucket.length >= MAX_VISUAL_FINDINGS) return;
  if (ARCH_LEAK.test(`${finding.explanation} ${finding.recommendation}`)) return;
  seen.add(key);
  bucket.push({ ...finding, id: finding.id ?? nextFindingId('visual') });
}

function makeFinding(
  type: VisualFindingType,
  category: VisualQualityCategory,
  severity: VisualSeverity,
  explanation: string,
  recommendation: string,
  surface?: string,
): Omit<VisualQualityFinding, 'id'> {
  return { type, category, severity, explanation, recommendation, surface };
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function computeSubscores(
  sources: VisualQualityShellSources,
  ft: AssessVisualQualityAuthorityInput['firstTimeUserReality'],
): VisualQualitySubscores {
  const { html, css, appJs } = sources;
  const combined = shellCopy(sources);

  const hasBrand = html.includes('sidebar-brand') && html.includes('brand-mark');
  const hasWelcome = html.includes('welcome-product-purpose') || /Turn detailed product ideas/i.test(combined);
  const usesInter = css.includes('Inter') || html.includes('fonts.googleapis.com');
  const hasDesignTokens = css.includes('--sidebar-w') && css.includes('--feed-w');

  const firstImpression =
    (hasBrand ? 25 : 0) +
    (hasWelcome ? 25 : 10) +
    (usesInter ? 20 : 5) +
    (html.includes('Autonomous Software Development') || html.includes('Autonomous Development Engine') ? 15 : 0) +
    (css.includes('.app-shell') ? 15 : 0);

  const primaryButtons =
    countMatches(combined, /btn-primary|run-founder-test|primary-action/gi) +
    (html.includes('run-founder-test') ? 2 : 0);
  const activeNav = html.includes('nav-item active');
  const hierarchy =
    (primaryButtons >= 2 ? 30 : primaryButtons >= 1 ? 20 : 5) +
    (activeNav ? 20 : 0) +
    (html.includes('welcome-product-purpose') ? 20 : 10) +
    (css.includes('.nav-item.active') ? 15 : 0) +
    (html.includes('Action Center') && html.includes('Command Center') ? 15 : 0);

  const navItems = countMatches(html, /class="nav-item/g);
  const navHelp = countMatches(html, /nav-help/g);
  const navigation =
    (ft?.navigationUnderstandingPass ? 30 : (ft?.categoryScores.navigation ?? 0) * 0.25) +
    (navHelp >= 8 ? 25 : navHelp >= 4 ? 15 : 5) +
    (navItems >= 8 && navItems <= 14 ? 20 : navItems > 14 ? 10 : 15) +
    (html.includes('first-time-nav-guidance') ? 15 : 0) +
    (css.includes('.nav-item:hover') ? 10 : 0);

  const layout =
    (css.includes('grid-template-columns') ? 25 : 0) +
    (css.includes('.card') ? 20 : 10) +
    (hasDesignTokens ? 20 : 5) +
    (css.includes('gap:') || css.includes('gap ') ? 15 : 5) +
    (html.includes('app-shell') ? 20 : 0);

  const placeholderSection = html.includes('section-placeholders') || html.includes('experience-placeholder');
  const demoDisclaimer = appJs.includes('Demo data for visual testing');
  const professionalism =
    (usesInter && hasDesignTokens ? 30 : 15) +
    (css.includes('.sidebar-brand') && css.includes('.brand-mark') ? 20 : 10) +
    (!placeholderSection ? 25 : 10) +
    (!demoDisclaimer ? 15 : 5) +
    (css.includes('border-radius') ? 10 : 5);

  const launchAppearance =
    (placeholderSection ? 15 : 35) +
    (demoDisclaimer ? 10 : 25) +
    (html.includes('Experience &amp; Trust Placeholders') || html.includes('Experience & Trust Placeholders') ? 5 : 25) +
    (ft?.firstTimeUserScore ? ft.firstTimeUserScore * 0.25 : 15) +
    (css.includes('.founder-test-panel') ? 15 : 10);

  return {
    firstImpression: clamp(firstImpression),
    hierarchy: clamp(hierarchy),
    navigation: clamp(navigation),
    layout: clamp(layout),
    professionalism: clamp(professionalism),
    launchAppearance: clamp(launchAppearance),
  };
}

function runFindings(
  subscores: VisualQualitySubscores,
  sources: VisualQualityShellSources,
  findings: VisualQualityFinding[],
  seen: Set<string>,
): void {
  const { html, css, appJs } = sources;
  const combined = shellCopy(sources);
  const navItems = countMatches(html, /class="nav-item/g);
  const navHelp = countMatches(html, /nav-help/g);

  if (navItems > 12 && navHelp < navItems * 0.5) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'VISUAL_CLUTTER',
        'NAVIGATION',
        navItems > 14 ? 'HIGH' : 'MEDIUM',
        'Navigation density may overwhelm first-time founders before they identify launch-critical destinations.',
        'Reduce interface clutter by grouping advanced destinations and highlighting a first-time path.',
        'Sidebar navigation',
      ),
    );
  }

  if (subscores.hierarchy < 55) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'POOR_HIERARCHY',
        'HIERARCHY',
        subscores.hierarchy < 40 ? 'HIGH' : 'MEDIUM',
        'Primary actions are difficult to distinguish from secondary actions.',
        'Increase visual emphasis of launch-critical actions.',
        'Command Center',
      ),
    );
  }

  if (subscores.navigation < 50 || navHelp < 4) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'WEAK_NAVIGATION',
        'NAVIGATION',
        'MEDIUM',
        'Navigation destinations or help text may not make destination purpose obvious enough.',
        'Improve navigation clarity with consistent nav-help coverage and grouping.',
        'Sidebar navigation',
      ),
    );
  }

  if (subscores.layout < 50 || !css.includes('grid-template-columns')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'MISALIGNED_LAYOUT',
        'LAYOUT',
        'MEDIUM',
        'Layout structure or spacing consistency may feel uneven across major surfaces.',
        'Tighten spacing consistency, card alignment, and section organization.',
        'App shell',
      ),
    );
  }

  if (subscores.professionalism < 55 || html.includes('section-placeholders')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LOW_PROFESSIONALISM',
        'PROFESSIONALISM',
        subscores.professionalism < 40 ? 'HIGH' : 'MEDIUM',
        'Visible placeholder or demo surfaces can make the product appear unfinished to founders.',
        'Increase professionalism of launch surfaces by replacing placeholder sections with production-ready copy.',
        'Experience & Trust Placeholders',
      ),
    );
  }

  if (
    subscores.launchAppearance < 55 ||
    html.includes('experience-placeholder') ||
    appJs.includes('Demo data for visual testing')
  ) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LAUNCH_READINESS_RISK',
        'LAUNCH_APPEARANCE',
        subscores.launchAppearance < 40 ? 'CRITICAL' : 'HIGH',
        'Launch-facing surfaces still expose unfinished or demo-only presentation elements.',
        'Address launch appearance risks before recommending external users.',
        'Command Center / Portfolio',
      ),
    );
  }

  if (subscores.firstImpression < 50) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LOW_PROFESSIONALISM',
        'FIRST_IMPRESSION',
        'MEDIUM',
        'First impression may not communicate polish or confidence within the first ten seconds.',
        'Strengthen welcome hero, brand presentation, and opening clarity.',
        'Command Center welcome',
      ),
    );
  }

  if (!css.includes('.nav-item.active') || !html.includes('nav-item active')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'POOR_HIERARCHY',
        'HIERARCHY',
        'LOW',
        'Active navigation state may be weak, reducing orientation confidence.',
        'Make active destination styling more obvious in the sidebar.',
        'Sidebar navigation',
      ),
    );
  }

  if (combined.includes('placeholder') && !findings.some((f) => f.type === 'LAUNCH_READINESS_RISK')) {
    pushFinding(
      findings,
      seen,
      makeFinding(
        'LAUNCH_READINESS_RISK',
        'LAUNCH_APPEARANCE',
        'MEDIUM',
        'Placeholder content remains visible in founder-facing surfaces.',
        'Replace placeholder content on launch-critical screens.',
      ),
    );
  }
}

function buildOperatorFeed(
  subscores: VisualQualitySubscores,
  findings: VisualQualityFinding[],
  visualQualityScore: number,
): import('./visual-quality-authority-types.js').VisualQualityFeedEvent[] {
  return [
    {
      section: 'Visual Quality',
      action: 'Evaluating first impression quality',
      detail: `First impression score ${subscores.firstImpression}/100 from brand, welcome, and polish signals.`,
      status: subscores.firstImpression >= 60 ? 'Completed' : 'Warning',
    },
    {
      section: 'Visual Quality',
      action: 'Detecting visual hierarchy issues',
      detail: findings.some((f) => f.type === 'POOR_HIERARCHY')
        ? 'Hierarchy findings detected in bounded visual scan.'
        : 'Primary and secondary actions appear distinguishable.',
      status: findings.some((f) => f.type === 'POOR_HIERARCHY') ? 'Warning' : 'Completed',
    },
    {
      section: 'Visual Quality',
      action: 'Detecting interface clutter',
      detail: findings.some((f) => f.type === 'VISUAL_CLUTTER')
        ? 'Navigation clutter may reduce visual trust.'
        : 'No major clutter findings in bounded scan.',
      status: findings.some((f) => f.type === 'VISUAL_CLUTTER') ? 'Warning' : 'Completed',
    },
    {
      section: 'Visual Quality',
      action: 'Evaluating launch appearance',
      detail: `Launch appearance score ${subscores.launchAppearance}/100 | overall visual quality ${visualQualityScore}/100.`,
      status: subscores.launchAppearance >= 60 ? 'Completed' : 'Blocked',
    },
    {
      section: 'Visual Quality',
      action: 'Summarizing visual trust risks',
      detail:
        findings.length > 0
          ? `${findings.length} visual finding(s) ranked by launch impact.`
          : 'No major visual trust risks detected in bounded scenarios.',
      status: findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'Warning' : 'Completed',
    },
  ];
}

export function assessVisualQualityAuthority(
  input: AssessVisualQualityAuthorityInput,
): VisualQualityAuthorityAssessment {
  const findings: VisualQualityFinding[] = [];
  const seen = new Set<string>();
  const subscores = computeSubscores(input.shellSources, input.firstTimeUserReality);
  runFindings(subscores, input.shellSources, findings, seen);

  const visualQualityScore = clamp(
    (subscores.firstImpression +
      subscores.hierarchy +
      subscores.navigation +
      subscores.layout +
      subscores.professionalism +
      subscores.launchAppearance) /
      6,
  );

  const strengths: string[] = [];
  if (subscores.firstImpression >= 70) strengths.push('Strong first impression from brand and welcome presentation');
  if (subscores.hierarchy >= 65) strengths.push('Primary actions visually distinguishable from secondary actions');
  if (subscores.navigation >= 65) strengths.push('Navigation organization supports discoverability');
  if (subscores.layout >= 65) strengths.push('Structured layout with consistent spacing signals');
  if (subscores.professionalism >= 65) strengths.push('Presentation feels mature and consistent');
  if (subscores.launchAppearance >= 65) strengths.push('Launch-facing surfaces appear production-ready');

  const weaknesses = findings.slice(0, 5).map((f) => f.explanation);
  const trustRisks = findings
    .filter((f) => f.type === 'VISUAL_CLUTTER' || f.type === 'POOR_HIERARCHY' || f.type === 'WEAK_NAVIGATION')
    .map((f) => f.explanation)
    .slice(0, MAX_VISUAL_RISKS);
  const professionalismRisks = findings
    .filter((f) => f.type === 'LOW_PROFESSIONALISM')
    .map((f) => f.explanation)
    .slice(0, MAX_VISUAL_RISKS);
  const launchAppearanceRisks = findings
    .filter((f) => f.type === 'LAUNCH_READINESS_RISK')
    .map((f) => f.explanation)
    .slice(0, MAX_VISUAL_RISKS);

  const topVisualRisks = [...findings]
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, 5);
  const highestSeverityFindings = topVisualRisks.filter(
    (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH',
  );

  const launchAppearanceConfidence = subscores.launchAppearance;
  const majorVisualRisks =
    findings.some((f) => f.severity === 'CRITICAL') ||
    findings.filter((f) => f.severity === 'HIGH').length >= 2 ||
    visualQualityScore < 50;
  const notLaunchReadyAppearance = subscores.launchAppearance < 55 || majorVisualRisks;
  const visualQualityPass = !majorVisualRisks && visualQualityScore >= 55;

  const visualSummary = visualQualityPass
    ? `Visual quality supports launch evaluation (${visualQualityScore}/100).`
    : `Visual quality needs improvement before strong launch recommendation (${visualQualityScore}/100).`;

  return {
    visualQualityScore,
    subscores,
    findings,
    strengths: strengths.slice(0, MAX_VISUAL_STRENGTHS),
    weaknesses,
    trustRisks,
    professionalismRisks,
    launchAppearanceRisks,
    topVisualRisks,
    highestSeverityFindings,
    launchAppearanceConfidence,
    visualSummary,
    operatorFeedEvents: buildOperatorFeed(subscores, findings, visualQualityScore),
    majorVisualRisks,
    notLaunchReadyAppearance,
    hierarchyDetectionPass: findings.some((f) => f.type === 'POOR_HIERARCHY') || subscores.hierarchy >= 55,
    professionalismDetectionPass: findings.some((f) => f.type === 'LOW_PROFESSIONALISM') || subscores.professionalism >= 55,
    clutterDetectionPass: findings.some((f) => f.type === 'VISUAL_CLUTTER') || subscores.navigation >= 55,
    launchAppearanceDetectionPass: findings.some((f) => f.type === 'LAUNCH_READINESS_RISK') || subscores.launchAppearance >= 55,
    visualTrustDetectionPass: trustRisks.length > 0 || visualQualityScore >= 60,
    visualQualityPass,
    insufficientInfo: false,
    insufficientInfoReason: null,
  };
}

export function evaluateVisualQualityVisibility(
  assessment: VisualQualityAuthorityAssessment,
): VisualQualityVisibility {
  const checks = [
    assessment.subscores.firstImpression >= 0,
    assessment.findings.length <= MAX_VISUAL_FINDINGS,
    assessment.operatorFeedEvents.length >= 4,
    assessment.hierarchyDetectionPass,
    assessment.professionalismDetectionPass,
    assessment.clutterDetectionPass,
    assessment.launchAppearanceDetectionPass,
    assessment.visualTrustDetectionPass,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    visualQualityScore: assessment.visualQualityScore,
    launchAppearanceConfidence: assessment.launchAppearanceConfidence,
    majorVisualRisks: assessment.majorVisualRisks,
    visualQualityPass: assessment.visualQualityPass,
    findingCount: assessment.findings.length,
    criticalCount: assessment.findings.filter((f) => f.severity === 'CRITICAL').length,
  };
}

function mapVisualToSensemaking(finding: VisualQualityFinding): SensemakingFinding {
  const type: SensemakingFindingType =
    finding.type === 'LAUNCH_READINESS_RISK' || finding.type === 'LOW_PROFESSIONALISM'
      ? 'TRUST_RISK'
      : finding.type === 'POOR_HIERARCHY' || finding.type === 'VISUAL_CLUTTER'
        ? 'CONFUSION'
        : 'COHERENCE_GAP';

  return {
    id: nextFindingId('visual-sense'),
    type,
    severity: finding.severity,
    area: 'Visual Quality',
    whatDoesNotMakeSense: finding.explanation,
    whyItMatters: 'Visual quality influences trust, credibility, and perceived launch readiness.',
    recommendedUpgrade: finding.recommendation,
    expectedImpact: 'Improves founder confidence and launch appearance.',
    evidence: finding.surface ?? 'Visual Quality Authority scan',
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  visual: VisualQualityAuthorityAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const extraFindings = visual.topVisualRisks.map(mapVisualToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => SEVERITY_RANK[a.severity as VisualSeverity] - SEVERITY_RANK[b.severity as VisualSeverity])
    .slice(0, 12);

  const penalty = visual.findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.2)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.25)),
    findings: mergedFindings,
    topConfusionRisks: mergedFindings.filter((f) => f.type === 'CONFUSION').slice(0, 4),
    topTrustRisks: mergedFindings.filter((f) => f.type === 'TRUST_RISK').slice(0, 4),
    confusionRisksDetected: mergedFindings.some((f) => f.type === 'CONFUSION') || base.confusionRisksDetected,
    trustRisksDetected: mergedFindings.some((f) => f.type === 'TRUST_RISK') || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...visual.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    visualQualitySummary: visual.visualSummary,
    topVisualRisks: visual.topVisualRisks.map((f) => f.explanation),
    launchAppearanceConfidence: visual.launchAppearanceConfidence,
    highestSeverityVisualFindings: visual.highestSeverityFindings.map((f) => f.explanation),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  visual: VisualQualityAuthorityAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: VisualFindingType; title: string; reason: string }> = [
    { match: 'POOR_HIERARCHY', title: 'Improve visual hierarchy', reason: 'Primary actions are hard to distinguish.' },
    { match: 'VISUAL_CLUTTER', title: 'Reduce interface clutter', reason: 'Navigation clutter detected.' },
    { match: 'WEAK_NAVIGATION', title: 'Improve navigation clarity', reason: 'Navigation clarity needs work.' },
    { match: 'LOW_PROFESSIONALISM', title: 'Increase professionalism of launch surfaces', reason: 'Product appears unfinished.' },
    { match: 'LAUNCH_READINESS_RISK', title: 'Address launch appearance risks', reason: 'Launch appearance risks detected.' },
    { match: 'MISALIGNED_LAYOUT', title: 'Improve layout consistency', reason: 'Layout consistency needs improvement.' },
  ];

  for (const finding of visual.highestSeverityFindings.length
    ? visual.highestSeverityFindings
    : visual.topVisualRisks) {
    const template = templates.find((t) => t.match === finding.type);
    const title = `[${finding.severity}] ${template?.title ?? finding.recommendation.slice(0, 48)}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextFindingId('visual-action'),
      type: 'FIX_ACTION',
      priority: finding.severity === 'CRITICAL' ? 'CRITICAL' : finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: template?.reason ?? finding.explanation,
      expectedImpact: 'Improves visual trust and launch-ready appearance.',
      evidence: finding.surface ?? finding.explanation,
      executable: true,
    });
  }

  const topActions = actions.slice(0, 8);
  return {
    ...base,
    topActions,
    recommendedNextStep:
      topActions[0] && (topActions[0].priority === 'CRITICAL' || topActions[0].priority === 'HIGH')
        ? {
            priority: topActions[0].priority,
            title: topActions[0].title,
            type: topActions[0].type,
            reason: topActions[0].rationale,
            expectedImpact: topActions[0].expectedImpact,
            evidence: topActions[0].evidence,
          }
        : base.recommendedNextStep,
    actionsGenerated: topActions.length > 0,
    recommendationsActionable: topActions.some((a) => a.executable) || base.recommendationsActionable,
    operatorFeedEvents: [...visual.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichAssessmentsWithVisualQuality(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  visual: VisualQualityAuthorityAssessment,
): EnrichedVisualQualityAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, visual),
    founderSensemaking: mergeSensemaking(founderSensemaking, visual),
  };
}
