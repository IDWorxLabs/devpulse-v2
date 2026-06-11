/**
 * Phase 24.9.2 — Project Memory vs Project Insights clarity checks.
 */

import { assessArchitectureLeakage, leakageLevelSeverity } from './founder-proxy-architecture-leakage.js';

export interface ProjectIntelligenceClarityCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ProjectIntelligenceClarityAssessment {
  passed: boolean;
  confusionSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checks: ProjectIntelligenceClarityCheck[];
  issues: string[];
}

const FORBIDDEN_USER_COPY = /\b(ownership registry|knowledge store|diagnostics engine|analysis engine|authority chain)\b/i;

function includesAll(text: string, markers: readonly string[]): boolean {
  return markers.every((marker) => text.includes(marker));
}

function extractFunctionBlock(appJs: string, fnName: string): string {
  const marker = `function ${fnName}`;
  const idx = appJs.indexOf(marker);
  if (idx < 0) return '';
  const nextIdx = appJs.indexOf('\n  function ', idx + marker.length);
  return appJs.slice(idx, nextIdx > idx ? nextIdx : idx + 8000);
}

function extractQuotedCopy(block: string): string {
  const matches = block.match(/'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"/g);
  return matches ? matches.join('\n') : block;
}

export function assessProjectIntelligenceClarity(sources: {
  appJs: string;
  html: string;
}): ProjectIntelligenceClarityAssessment {
  const { appJs, html } = sources;
  const memoryText = extractFunctionBlock(appJs, 'renderProjectMemorySurface');
  const insightsText = [
    extractFunctionBlock(appJs, 'renderProjectInsightsSurface'),
    extractFunctionBlock(appJs, 'renderProjectInsightsClarityIntro'),
    extractFunctionBlock(appJs, 'renderProjectInsightsPortfolio'),
    extractFunctionBlock(appJs, 'renderProjectInsightsDetail'),
    extractFunctionBlock(appJs, 'renderIntelligenceRelationship'),
    extractFunctionBlock(appJs, 'renderIntelligenceHeader'),
  ].join('\n');
  const sidebarHtml = html.includes('class="sidebar-nav"')
    ? html.slice(html.indexOf('class="sidebar-nav"'), html.indexOf('class="center-area"'))
    : html;
  const userCopy = `${extractQuotedCopy(memoryText)}\n${extractQuotedCopy(insightsText)}\n${sidebarHtml}`;
  const combined = `${memoryText}\n${insightsText}\n${sidebarHtml}`;
  const checks: ProjectIntelligenceClarityCheck[] = [];
  const issues: string[] = [];

  const memoryPositioning = includesAll(memoryText, [
    'Everything AiDevEngine knows',
    "project's memory",
    'Requirements',
    'Architecture',
    'Facts',
    'History',
  ]);
  checks.push({
    id: 'memory-positioning',
    label: 'Project Memory positioning exists',
    passed: memoryPositioning,
    detail: memoryPositioning ? 'Memory header and hero cards present' : 'Missing memory positioning copy',
  });
  if (!memoryPositioning) issues.push('Project Memory positioning incomplete');

  const insightsPositioning = includesAll(insightsText, [
    'Everything AiDevEngine thinks',
    "project's intelligence",
    'Health',
    'Risks',
    'Next Actions',
    'Launch Readiness',
  ]);
  checks.push({
    id: 'insights-positioning',
    label: 'Project Insights positioning exists',
    passed: insightsPositioning,
    detail: insightsPositioning ? 'Insights header and hero cards present' : 'Missing insights positioning copy',
  });
  if (!insightsPositioning) issues.push('Project Insights positioning incomplete');

  const relationshipExplained =
    combined.includes('Insights come from Memory') &&
    combined.includes('AiDevEngine Analysis') &&
    combined.includes('Project Insights');
  checks.push({
    id: 'relationship',
    label: 'Memory → Analysis → Insights relationship explained',
    passed: relationshipExplained,
    detail: relationshipExplained ? 'Relationship flow present' : 'Missing relationship explanation',
  });
  if (!relationshipExplained) issues.push('Relationship between Memory and Insights not explained');

  const sidebarMemoryHelp =
    html.includes('data-view="project-memory"') &&
    (html.includes('Project knowledge, requirements, and history') ||
      html.includes('Project vault: stored knowledge'));
  const sidebarInsightsHelp =
    html.includes('data-view="project-insights"') &&
    (html.includes('Project health, risks, recommendations, and progress') ||
      html.includes('patterns, risks, and recommendations'));
  checks.push({
    id: 'sidebar-memory',
    label: 'Sidebar Project Memory description',
    passed: sidebarMemoryHelp,
    detail: sidebarMemoryHelp ? 'Nav help for Memory present' : 'Missing Memory nav description',
  });
  checks.push({
    id: 'sidebar-insights',
    label: 'Sidebar Project Insights description',
    passed: sidebarInsightsHelp,
    detail: sidebarInsightsHelp ? 'Nav help for Insights present' : 'Missing Insights nav description',
  });
  if (!sidebarMemoryHelp || !sidebarInsightsHelp) {
    issues.push('Sidebar descriptions missing for Memory or Insights');
  }

  const canExplainMemory = /what.*knows|project knowledge|stored context/i.test(memoryText);
  const canExplainInsights = /what.*thinks|project intelligence|recommendations/i.test(insightsText);
  const canExplainDifference =
    memoryText.includes('knows') &&
    insightsText.includes('thinks') &&
    combined.includes('Insights come from Memory');
  const canDetermineWhere =
    memoryText.includes('Project Insights') && insightsText.includes('Project Memory');

  checks.push({
    id: 'explain-memory',
    label: 'User can explain Project Memory',
    passed: canExplainMemory,
    detail: canExplainMemory ? 'Memory purpose copy is clear' : 'Memory purpose unclear',
  });
  checks.push({
    id: 'explain-insights',
    label: 'User can explain Project Insights',
    passed: canExplainInsights,
    detail: canExplainInsights ? 'Insights purpose copy is clear' : 'Insights purpose unclear',
  });
  checks.push({
    id: 'explain-difference',
    label: 'User can explain the difference',
    passed: canExplainDifference,
    detail: canExplainDifference ? 'Knows vs thinks distinction present' : 'Difference not clear',
  });
  checks.push({
    id: 'determine-destination',
    label: 'User can determine where to go',
    passed: canDetermineWhere,
    detail: canDetermineWhere ? 'Cross-links between surfaces present' : 'Navigation guidance missing',
  });

  for (const check of checks.slice(5)) {
    if (!check.passed) issues.push(check.label);
  }

  const leakage = assessArchitectureLeakage(userCopy);
  const noForbiddenTerms = !FORBIDDEN_USER_COPY.test(userCopy);
  checks.push({
    id: 'no-architecture-leakage',
    label: 'No architecture leakage in intelligence surfaces',
    passed: leakageLevelSeverity(leakage.level) <= leakageLevelSeverity('LOW') && noForbiddenTerms,
    detail: `${leakage.level}${noForbiddenTerms ? '' : ' — forbidden internal terms found'}`,
  });
  if (!noForbiddenTerms || leakageLevelSeverity(leakage.level) > leakageLevelSeverity('LOW')) {
    issues.push('Architecture leakage or forbidden terms in intelligence surfaces');
  }

  const failedHigh = checks.filter((c) => !c.passed && /positioning|relationship|explain-difference/.test(c.id));
  const confusionSeverity: ProjectIntelligenceClarityAssessment['confusionSeverity'] =
    failedHigh.length >= 2
      ? 'HIGH'
      : issues.length === 0
        ? 'NONE'
        : issues.length <= 2
          ? 'LOW'
          : 'MEDIUM';

  return {
    passed: checks.filter((c) => c.id !== 'no-architecture-leakage').every((c) => c.passed) &&
      leakageLevelSeverity(leakage.level) <= leakageLevelSeverity('LOW') &&
      noForbiddenTerms &&
      confusionSeverity !== 'HIGH',
    confusionSeverity,
    checks,
    issues,
  };
}
