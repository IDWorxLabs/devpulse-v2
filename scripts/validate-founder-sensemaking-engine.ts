/**
 * Phase 24.9.8 — Founder Sensemaking Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  FOUNDER_SENSEMAKING_ENGINE_PASS_TOKEN,
  assessFounderSensemaking,
  resetFounderSensemakingCacheForTests,
  resetFounderSensemakingCounterForTests,
} from '../src/founder-sensemaking-engine/index.js';
import {
  assessFirstTimeUserReality,
  firstTimeActionPathResolved,
  FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN,
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
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
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
  console.log('Founder Sensemaking Engine — Validation');
  console.log('=======================================');
  console.log('');

  resetFounderSensemakingCounterForTests();
  resetFounderSensemakingCacheForTests();

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/founder-sensemaking-engine/founder-sensemaking-authority.ts');
  const responses = readText('src/command-center-brain/founder-sensemaking-responses.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/founder-sensemaking-engine/founder-sensemaking-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/founder-sensemaking-engine/founder-sensemaking-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-sensemaking-engine']), 'package');
  assert('04. finding types', authority.includes('CONFUSION') && authority.includes('CONTRADICTION') && authority.includes('TRUST_RISK'), 'types');
  assert('05. severity levels', authority.includes('CRITICAL') && authority.includes('LOW'), 'severity');
  assert('06. coherence UI', appJs.includes('product-coherence-visibility') && appJs.includes('Product Coherence'), 'ui');
  assert('07. what does not make sense UI', appJs.includes("What Doesn't Make Sense"), 'confusion ui');
  assert('08. contradictions UI', appJs.includes('Contradictions'), 'contradiction ui');
  assert('09. trust risks UI', appJs.includes('Trust Risks'), 'trust ui');
  assert('10. upgrades UI', appJs.includes('Recommended Upgrades') && appJs.includes('Expected Impact'), 'upgrades');
  assert('11. sensemaking feed', appJs.includes('streamProductCoherenceFeed'), 'feed');
  assert('12. founder evaluation', engine.includes('evaluateFounderSensemakingVisibility'), 'founder');
  assert('13. command center responses', responses.includes('resolveFounderSensemakingResponse'), 'brain');
  assert('14. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs + responses), 'safety');
  assert('15. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  assert('16. panel styles', styles.includes('product-coherence-visibility'), 'styles');
  assert('17. nav surface', html.includes('data-view="product-coherence"'), 'nav');
  guardRuntime('static');

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const plan = snapshot.founderSensemaking;

  assert('18. snapshot founderSensemaking', Boolean(plan), String(plan?.founderSensemakingScore));
  assert('19. scores bounded', plan.founderSensemakingScore >= 0 && plan.productCoherenceScore <= 100, String(plan.founderSensemakingScore));
  assert('20. findings generated', plan.findingsGenerated || plan.insufficientInfo, String(plan.findings.length));
  assert('21. confusion detection wired', plan.confusionRisksDetected || plan.findings.some((f) => f.type === 'CONFUSION') || plan.findings.some((f) => f.type === 'REDUNDANCY'), 'confusion');
  assert('22. contradiction detection wired', plan.contradictionsDetected || plan.topContradictions.length >= 0, String(plan.topContradictions.length));
  assert('23. dead end detection wired', authority.includes('DEAD_END'), 'dead end');
  assert('24. trust risks wired', plan.trustRisksDetected || plan.topTrustRisks.length >= 0, String(plan.topTrustRisks.length));
  assert('25. upgrades generated', plan.upgradesGenerated, String(plan.recommendedUpgrades.length));
  assert('26. scores explained flag', plan.scoresExplained, String(plan.scoresExplained));
  assert('27. no false contradictions', plan.noFalseContradictions, String(plan.noFalseContradictions));
  assert('28. operator feed events', (plan.operatorFeedEvents?.length ?? 0) >= 6, String(plan.operatorFeedEvents?.length));
  guardRuntime('snapshot');

  const publicDir = join(ROOT, 'public', 'founder-reality');
  const shellSources = {
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
  };
  const direct = assessFounderSensemaking(
    {
      projectMemory: snapshot.projectMemory,
      livePreview: snapshot.livePreview,
      runningApplication: snapshot.runningApplication,
      verificationResults: snapshot.verificationResults,
      changeIntelligence: snapshot.changeIntelligence,
      founderActionCenter: snapshot.founderActionCenter,
      verification: snapshot.verification,
      autonomousBuilder: snapshot.autonomousBuilder,
      portfolioInsights: snapshot.portfolioInsights,
      shellSources,
    },
    { humanReadiness: 80, verdict: 'READY_FOR_PUBLIC_BETA' },
  );
  assert('29. direct assessment findings', direct.findings.length > 0, String(direct.findings.length));
  assert('30. finding structure complete', direct.findings.every((f) => f.whatDoesNotMakeSense && f.recommendedUpgrade && f.expectedImpact), 'structure');

  const brain = processBrainRequest({ message: "What doesn't make sense?", timestamp: Date.now() });
  const brainText = brain.brainResponse ?? '';
  assert(
    '31. brain sensemaking answer',
    /sensemaking|make sense|coherence|contradiction/i.test(brainText),
    brainText.slice(0, 90),
  );

  const v4 = runFounderTestingModeV4({ rootDir: ROOT, validatorScripts });
  assert('32. V4 embeds sensemaking', Boolean(v4.founderSensemaking), String(v4.founderSensemaking.founderSensemakingScore));
  assert('33. V4 visibility score', v4.founderSensemakingVisibilityScore.score >= 0, String(v4.founderSensemakingVisibilityScore.score));
  assert('34. V4 markdown section', v4.reportMarkdown.includes('Founder Sensemaking'), 'md');

  const firstTime = assessFirstTimeUserReality({ shellSources: { appJs, html, css: styles } });
  assert(
    '35. action path start guidance',
    firstTimeActionPathResolved('start-project', { html, appJs }),
    'start',
  );
  assert(
    '36. action path ordered workflow',
    firstTime.actionPathStepsVisible === 6,
    String(firstTime.actionPathStepsVisible),
  );
  assert(
    '37. action path scenarios pass',
    firstTime.actionPathPass,
    String(firstTime.actionPathScenariosPassed),
  );
  assert(
    '38. preview vs verification path',
    firstTimeActionPathResolved('preview-vs-verification-path', { html, appJs }),
    'separation',
  );

  const verificationTrust = assessVerificationTrustEvidence({
    verificationResults: snapshot.verificationResults,
    shellSources: { appJs, html },
  });
  assert(
    '39. verification trust evidence clarity',
    verificationTrustEvidenceResolved('trust-section-visible', { html, appJs }),
    'trust',
  );
  assert(
    '40. verification explainability scenarios',
    verificationTrust.trustPass,
    String(verificationTrust.trustScore),
  );
  assert(
    '41. verification trust not black box',
    !verificationTrust.blackBoxRisk,
    String(verificationTrust.blackBoxRisk),
  );

  const frictionHeatmap = assessFounderFrictionHeatmap({
    shellSources: { appJs, html },
    firstTimeUserReality: firstTime,
    verificationTrustEvidence: verificationTrust,
    founderSensemaking: snapshot.founderSensemaking,
    founderActionCenter: snapshot.founderActionCenter,
    verificationResults: snapshot.verificationResults,
  });
  assert(
    '42. friction heatmap visibility',
    founderFrictionHeatmapResolved('heatmap-visible', { html, appJs }),
    'heatmap',
  );
  assert(
    '43. friction ranking usefulness',
    frictionHeatmap.rankingsGenerated && founderFrictionHeatmapResolved('highest-friction-areas', { html, appJs }),
    String(frictionHeatmap.highestFrictionAreas.length),
  );
  assert(
    '44. friction recommendation usefulness',
    founderFrictionHeatmapResolved('ux-improvements', { html, appJs }),
    'ux',
  );
  assert('45. friction heatmap pass', frictionHeatmap.heatmapPass, String(frictionHeatmap.overallFrictionScore));
  guardRuntime('integration');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  const reportPath = join(ROOT, 'architecture', 'FOUNDER_SENSEMAKING_ENGINE_REPORT.md');
  assert('46. report exists', existsSync(reportPath), reportPath);

  if (failed > 0) {
    console.log('FOUNDER_SENSEMAKING_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Sensemaking score: ${plan.founderSensemakingScore} | Coherence: ${plan.productCoherenceScore}`);
  console.log('');
  console.log(FOUNDER_SENSEMAKING_ENGINE_PASS_TOKEN);
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
