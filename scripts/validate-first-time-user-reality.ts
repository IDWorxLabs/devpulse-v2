/**
 * Phase 24.9.11 — First-Time User Reality Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { assessFounderSensemaking } from '../src/founder-sensemaking-engine/index.js';
import {
  FIRST_TIME_USER_REALITY_PASS_TOKEN,
  FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN,
  assessFirstTimeUserReality,
  enrichAssessmentsWithFirstTimeUserReality,
  firstTimeActionPathResolved,
  navPurposeSeparationResolved,
  resetFirstTimeUserCounterForTests,
} from '../src/first-time-user-reality/index.js';
import {
  VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_PASS_TOKEN,
  assessVerificationTrustEvidence,
  verificationTrustEvidenceResolved,
} from '../src/verification-trust-evidence/index.js';
import {
  FOUNDER_FRICTION_HEATMAP_PASS_TOKEN,
  assessFounderFrictionHeatmap,
  founderFrictionHeatmapResolved,
} from '../src/founder-friction-heatmap/index.js';
import { runFounderTestingModeV5 } from '../src/founder-testing-mode/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;
const textCache = new Map<string, string>();

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  const cached = textCache.get(relativePath);
  if (cached) return cached;
  const content = readFileSync(join(ROOT, relativePath), 'utf8');
  textCache.set(relativePath, content);
  return content;
}

function guardRuntime(group: string): void {
  if (Date.now() - START > MAX_RUNTIME_MS) {
    throw new Error(`Timeout in ${group} after ${Date.now() - START}ms`);
  }
}

function main(): void {
  console.log('');
  console.log('First-Time User Reality Engine — Validation');
  console.log('===========================================');
  console.log('');

  resetFirstTimeUserCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/first-time-user-reality/first-time-user-reality-authority.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/first-time-user-reality/first-time-user-reality-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/first-time-user-reality/first-time-user-reality-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:first-time-user-reality']), 'package');
  assert('04. finding types', authority.includes('FIRST_TIME_CONFUSION') && authority.includes('PURPOSE_UNCLEAR') && authority.includes('WORKFLOW_UNKNOWN'), 'types');
  assert('05. trust and cognitive types', authority.includes('TRUST_FORMATION_FAILURE') && authority.includes('COGNITIVE_OVERLOAD') && authority.includes('DISCOVERABILITY_FAILURE'), 'extra types');
  assert('06. category scores', authority.includes('understanding') && authority.includes('navigation') && authority.includes('simplicity'), 'scores');
  assert('07. screen purpose checks', authority.includes('screenPurposeCheck') && authority.includes('renderProductCoherenceSurface'), 'screens');
  assert('08. operator feed events', authority.includes('Simulating first-time founder'), 'feed');
  assert('09. V5 report section', v5Report.includes('First-Time User Reality'), 'v5 md');
  assert('10. founder evaluation', engine.includes('evaluateFirstTimeUserRealityVisibility'), 'visibility');
  assert('11. phase 1 integration', readText('src/founder-testing-mode/founder-testing-v5-phases.ts').includes('first-time user reality'), 'phase');
  assert('12. action path helper exported', authority.includes('firstTimeActionPathResolved'), 'action path');
  assert('13. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('14. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  assert(
    '15. verification nav help present',
    /data-view="verification"[\s\S]{0,520}nav-help[\s\S]{0,160}pass\/fail proof/i.test(html),
    'verification',
  );
  assert(
    '16. live preview nav help present',
    /data-view="live-preview"[\s\S]{0,520}nav-help[\s\S]{0,160}Interact with the running app/i.test(html),
    'live-preview',
  );
  assert(
    '17. verification vs insights separation copy',
    navPurposeSeparationResolved('verification-insights', { html, appJs }),
    'verification-insights',
  );
  assert(
    '18. projects vs vault separation copy',
    navPurposeSeparationResolved('projects-vault', { html, appJs }),
    'projects-vault',
  );
  assert(
    '19. live preview vs verification separation copy',
    navPurposeSeparationResolved('preview-verification', { html, appJs }),
    'preview-verification',
  );
  assert(
    '20. first-time nav guidance panel',
    html.includes('first-time-nav-guidance') && html.includes('Know the difference'),
    'guidance',
  );
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const firstTime = assessFirstTimeUserReality({ shellSources });

  assert('21. first-time simulation executes', firstTime.scenarios.length > 0, String(firstTime.scenarios.length));
  assert('22. screen purpose evaluation', firstTime.screenPurposeResults.length >= 6, String(firstTime.screenPurposeResults.length));
  assert('23. navigation evaluation', firstTime.scenarios.some((s) => s.category === 'NAVIGATION_UNDERSTANDING'), 'nav');
  assert('24. workflow evaluation', firstTime.scenarios.some((s) => s.category === 'WORKFLOW_UNDERSTANDING'), 'workflow');
  assert('25. trust evaluation', firstTime.scenarios.some((s) => s.category === 'TRUST_FORMATION'), 'trust');
  assert('26. cognitive load evaluation', firstTime.scenarios.some((s) => s.category === 'COGNITIVE_LOAD'), 'cognitive');
  assert('27. score bounded', firstTime.firstTimeUserScore >= 0 && firstTime.firstTimeUserScore <= 100, String(firstTime.firstTimeUserScore));
  assert(
    '28. confusion findings managed',
    firstTime.findings.length === 0 ||
      firstTime.scenarios.filter((s) => s.id.startsWith('nav-overlap-')).every((s) => s.passed) ||
      firstTime.findings.length < 4,
    `${firstTime.findings.length} findings (baseline 4)`,
  );
  assert(
    '29. verification nav weakness resolved',
    !firstTime.findings.some((f) => f.screen === 'Verification' && f.type === 'PURPOSE_UNCLEAR'),
    String(firstTime.findings.filter((f) => f.screen === 'Verification').length),
  );
  assert(
    '30. live preview nav weakness resolved',
    !firstTime.findings.some((f) => f.screen === 'Live Preview' && f.type === 'PURPOSE_UNCLEAR'),
    String(firstTime.findings.filter((f) => f.screen === 'Live Preview').length),
  );
  assert(
    '31. nav overlap separation scenarios pass',
    firstTime.scenarios.filter((s) => s.id.startsWith('nav-overlap-')).every((s) => s.passed),
    String(firstTime.scenarios.filter((s) => s.id.startsWith('nav-overlap-')).length),
  );
  assert('32. finding structure complete', firstTime.findings.every((f) => f.whatConfuses && f.recommendedFix && f.firstTimeQuestion), 'structure');
  assert('33. scenarios bounded', firstTime.scenarios.length <= 36, String(firstTime.scenarios.length));
  assert('34. operator feed generated', (firstTime.operatorFeedEvents?.length ?? 0) >= 5, String(firstTime.operatorFeedEvents?.length));
  guardRuntime('simulation');

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const actionBase = assessFounderActionCenter({
    projectMemory: snapshot.projectMemory,
    livePreview: snapshot.livePreview,
    runningApplication: snapshot.runningApplication,
    verificationResults: snapshot.verificationResults,
    changeIntelligence: snapshot.changeIntelligence,
    verification: snapshot.verification,
  });
  const senseBase = assessFounderSensemaking({
    projectMemory: snapshot.projectMemory,
    livePreview: snapshot.livePreview,
    runningApplication: snapshot.runningApplication,
    verificationResults: snapshot.verificationResults,
    changeIntelligence: snapshot.changeIntelligence,
    founderActionCenter: actionBase,
    verification: snapshot.verification,
    autonomousBuilder: snapshot.autonomousBuilder,
    portfolioInsights: snapshot.portfolioInsights,
    shellSources: { appJs, html },
  });

  const brokenFirstTime = assessFirstTimeUserReality({
    shellSources: {
      appJs: appJs.replace('welcome-hint', 'broken-hint'),
      html: html.replace('welcome-hint', 'broken-hint').replace('welcome-subtitle', 'broken-subtitle'),
      css,
    },
  });
  assert('35. detects broken welcome copy', brokenFirstTime.findings.some((f) => f.type === 'FIRST_TIME_CONFUSION'), String(brokenFirstTime.findings.length));

  const enriched = enrichAssessmentsWithFirstTimeUserReality(actionBase, senseBase, firstTime);
  const enrichedBroken = enrichAssessmentsWithFirstTimeUserReality(actionBase, senseBase, brokenFirstTime);
  assert(
    '36. action center integration',
    enrichedBroken.founderActionCenter.topActions.some((a) => a.id.startsWith('first-time-action')),
    enrichedBroken.founderActionCenter.topActions.map((a) => a.title).join('; '),
  );
  assert(
    '37. product coherence integration',
    enrichedBroken.founderSensemaking.findings.some((f) => f.type === 'CONFUSION' || f.type === 'TRUST_RISK' || f.type === 'COHERENCE_GAP'),
    String(enrichedBroken.founderSensemaking.findings.length),
  );

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('38. V5 includes first-time reality', Boolean(v5.firstTimeUserReality), String(v5.firstTimeUserReality.firstTimeUserScore));
  assert('39. V5 markdown section', v5.reportMarkdown.includes('First-Time User Reality'), 'md');
  assert('40. V5 strengths in summary', v5.unifiedSummary.whatWorks.some((w) => w.startsWith('First-time:')), String(v5.unifiedSummary.whatWorks.length));
  guardRuntime('integration');

  const reportPath = join(ROOT, 'architecture', 'FIRST_TIME_USER_REALITY_REPORT.md');
  assert('41. report exists', existsSync(reportPath), reportPath);
  const separationReportPath = join(ROOT, 'architecture', 'FIRST_TIME_USER_NAVIGATION_PURPOSE_SEPARATION_REPORT.md');
  assert('42. separation report exists', existsSync(separationReportPath), separationReportPath);

  assert(
    '43. action path panel visible',
    firstTimeActionPathResolved('panel-visible', shellSources),
    'first-time-founder-path',
  );
  assert(
    '44. ordered workflow steps',
    html.includes('Create/Open Project') &&
      html.includes('Describe Your Vision') &&
      html.includes('Review Project Insights') &&
      html.includes('Test in Live Preview') &&
      html.includes('Run Verification') &&
      html.includes('Launch with Confidence'),
    'six steps',
  );
  assert(
    '45. start path guidance',
    firstTimeActionPathResolved('start-project', shellSources),
    'start-project',
  );
  assert(
    '46. preview step in action path',
    firstTimeActionPathResolved('live-preview', shellSources),
    'live-preview',
  );
  assert(
    '47. verification step in action path',
    firstTimeActionPathResolved('verification-step', shellSources),
    'verification-step',
  );
  assert(
    '48. pass path guidance',
    firstTimeActionPathResolved('after-pass', shellSources),
    'after-pass',
  );
  assert(
    '49. fail path guidance',
    firstTimeActionPathResolved('after-fail', shellSources),
    'after-fail',
  );
  assert(
    '50. preview vs verification in path',
    firstTimeActionPathResolved('preview-vs-verification-path', shellSources),
    'preview-vs-verification',
  );
  assert(
    '51. action path scenarios pass',
    firstTime.scenarios.filter((s) => s.id.startsWith('action-path-')).every((s) => s.passed),
    String(firstTime.actionPathScenariosPassed),
  );
  assert('52. actionPathPass flag', firstTime.actionPathPass, String(firstTime.actionPathStepsVisible));
  assert('53. action path steps visible', firstTime.actionPathStepsVisible === 6, String(firstTime.actionPathStepsVisible));

  const actionPathReportPath = join(ROOT, 'architecture', 'FIRST_TIME_USER_ACTION_PATH_REPORT.md');
  assert('54. action path report exists', existsSync(actionPathReportPath), actionPathReportPath);

  const verificationTrust = assessVerificationTrustEvidence({
    verificationResults: snapshot.verificationResults,
    shellSources,
  });
  assert(
    '55. verification trust section visible',
    verificationTrustEvidenceResolved('trust-section-visible', shellSources),
    'trust-section',
  );
  assert(
    '56. verification trust evidence blocks',
    verificationTrustEvidenceResolved('evidence-found', shellSources) &&
      verificationTrustEvidenceResolved('what-was-checked', shellSources),
    'evidence',
  );
  assert(
    '57. verification trust scope clarity',
    verificationTrustEvidenceResolved('scope-checked', shellSources) &&
      verificationTrustEvidenceResolved('scope-not-checked', shellSources),
    'scope',
  );
  assert(
    '58. verification trust next steps',
    verificationTrustEvidenceResolved('next-steps-scenario', shellSources),
    'next-steps',
  );
  assert(
    '59. verification trust scenarios in first-time engine',
    firstTime.scenarios.filter((s) => s.id.startsWith('verification-trust-')).every((s) => s.passed),
    String(firstTime.scenarios.filter((s) => s.id.startsWith('verification-trust-')).length),
  );
  assert('60. verification trust pass', verificationTrust.trustPass, String(verificationTrust.trustScore));
  assert(
    '61. verification trust report exists',
    existsSync(join(ROOT, 'architecture', 'VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_REPORT.md')),
    'report',
  );

  const frictionHeatmap = assessFounderFrictionHeatmap({
    shellSources,
    firstTimeUserReality: firstTime,
    verificationTrustEvidence: verificationTrust,
    founderSensemaking: senseBase,
    founderActionCenter: actionBase,
    verificationResults: snapshot.verificationResults,
  });
  assert(
    '62. friction heatmap visible',
    founderFrictionHeatmapResolved('heatmap-visible', shellSources),
    'heatmap',
  );
  assert(
    '63. friction category scores',
    founderFrictionHeatmapResolved('category-scores', shellSources),
    'categories',
  );
  assert(
    '64. friction scenarios in first-time engine',
    firstTime.scenarios.filter((s) => s.id.startsWith('friction-')).every((s) => s.passed),
    String(firstTime.scenarios.filter((s) => s.id.startsWith('friction-')).length),
  );
  assert('65. friction heatmap pass', frictionHeatmap.heatmapPass, String(frictionHeatmap.overallFrictionScore));
  assert(
    '66. friction heatmap report exists',
    existsSync(join(ROOT, 'architecture', 'FOUNDER_FRICTION_HEATMAP_REPORT.md')),
    'report',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('FIRST_TIME_USER_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`First-Time User Score: ${firstTime.firstTimeUserScore} | Scenarios: ${firstTime.scenarios.length} | Findings: ${firstTime.findings.length} | Action path: ${firstTime.actionPathScenariosPassed}/9 | Trust: ${verificationTrust.trustScore}/100 | Friction: ${frictionHeatmap.overallFrictionScore}/100 | Runtime: ${Date.now() - START}ms`);
  console.log('');
  console.log(FIRST_TIME_USER_REALITY_PASS_TOKEN);
  console.log(FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN);
  console.log(VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_PASS_TOKEN);
  console.log(FOUNDER_FRICTION_HEATMAP_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
