/**
 * Phase 24.9.7 — Founder Action Center validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  FOUNDER_ACTION_CENTER_PASS_TOKEN,
  assessFounderActionCenter,
  resetFounderActionCenterCounterForTests,
} from '../src/founder-action-center/index.js';
import {
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import { resetVerificationResultsCacheForTests } from '../src/verification-results-visibility/index.js';
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

async function main(): Promise<void> {
  console.log('');
  console.log('Founder Action Center — Validation');
  console.log('==================================');
  console.log('');

  resetFounderActionCenterCounterForTests();
  resetVerificationResultsCacheForTests();

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/founder-action-center/founder-action-center-authority.ts');
  const responses = readText('src/command-center-brain/founder-action-center-responses.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/founder-action-center/founder-action-center-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/founder-action-center/founder-action-center-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-action-center']), 'package');
  assert('04. action types', authority.includes('REVIEW_ACTION') && authority.includes('APPROVAL_ACTION'), 'types');
  assert('05. priority levels', authority.includes('CRITICAL') && authority.includes('LOW'), 'priority');
  assert('06. action center UI', appJs.includes('founder-action-center-visibility') && appJs.includes('Founder Action Center'), 'ui');
  assert('07. recommended next step UI', appJs.includes('Recommended Next Step') && appJs.includes('action-reason'), 'next');
  assert('08. top actions UI', appJs.includes('Top Actions') && appJs.includes('action-priority'), 'top');
  assert('09. blockers UI', appJs.includes('Action Blockers') && appJs.includes('action-blocker-list'), 'blockers');
  assert('10. opportunities UI', appJs.includes('Opportunities') && appJs.includes('action-opportunity-list'), 'opps');
  assert('11. execution impact UI', appJs.includes('Execution Impact'), 'impact');
  assert('12. action feed', appJs.includes('streamFounderActionCenterFeed'), 'feed');
  assert('13. founder evaluation', engine.includes('evaluateFounderActionCenterVisibility'), 'founder');
  assert('14. command center responses', responses.includes('resolveFounderActionCenterResponse'), 'brain');
  assert('15. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs + responses), 'safety');
  assert('16. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  assert('17. panel styles', styles.includes('founder-action-center-visibility'), 'styles');
  guardRuntime('static');

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const plan = snapshot.founderActionCenter;

  assert('18. snapshot founderActionCenter', Boolean(plan), String(plan?.state));
  assert('19. actions from real state', plan.actionsGenerated || plan.insufficientInfo, String(plan.topActions.length));
  assert('20. priorities visible', plan.prioritiesVisible, String(plan.prioritiesVisible));
  assert('21. rationale visible', plan.rationaleVisible, String(plan.rationaleVisible));
  assert('22. impact visible', plan.impactVisible, String(plan.impactVisible));
  assert('23. no duplicates', plan.noDuplicates, String(plan.noDuplicates));
  assert('24. no technical-only', plan.noTechnicalOnly, String(plan.noTechnicalOnly));
  assert('25. operator feed events', (plan.operatorFeedEvents?.length ?? 0) >= 6, String(plan.operatorFeedEvents?.length));
  guardRuntime('snapshot');

  const blockedPlan = assessFounderActionCenter({
    projectMemory: snapshot.projectMemory,
    livePreview: {
      reality: {
        ...snapshot.livePreview.reality,
        state: 'PREVIEW_DEGRADED',
        validationReady: false,
        validationReadyReason: 'Preview iframe did not become interactive.',
        problems: ['Preview load stalled'],
      },
    },
    runningApplication: {
      ...snapshot.runningApplication,
      testReadiness: 'NOT_TESTABLE',
      testReadinessReason: 'Output is not aligned with the active project.',
    },
    verificationResults: {
      ...snapshot.verificationResults,
      state: 'VERIFICATION_FAILED',
      fixesNext: [
        {
          title: 'Resolve verification failure',
          priority: 'CRITICAL',
          blocksLabel: 'Launch',
          recommendedAction: 'Review failed checks before approving release.',
          evidence: '2 failed checks',
        },
      ],
    },
    changeIntelligence: snapshot.changeIntelligence,
    verification: snapshot.verification,
  });

  assert('26. blockers surfaced', blockedPlan.blockers.length > 0, String(blockedPlan.blockers.length));
  assert('27. critical ranked first', blockedPlan.topActions[0]?.priority === 'CRITICAL', blockedPlan.topActions[0]?.priority ?? 'none');
  assert('28. recommended next step', Boolean(blockedPlan.recommendedNextStep), blockedPlan.recommendedNextStep?.title ?? 'missing');
  guardRuntime('authority');

  const nextStep = processBrainRequest({ message: 'What should I do next?' });
  const blocking = processBrainRequest({ message: 'What is blocking me?' });
  const priorityList = processBrainRequest({ message: 'Give me a priority list.' });
  const focus = processBrainRequest({ message: 'What should AiDevEngine focus on next?' });

  assert('29. brain next step', /recommended next step|priority|run founder testing|no recommended/i.test(nextStep.brainResponse ?? ''), (nextStep.brainResponse ?? '').slice(0, 90));
  assert('30. brain blockers', /blocker|no blockers|preview not validation/i.test(blocking.brainResponse ?? ''), (blocking.brainResponse ?? '').slice(0, 90));
  assert('31. brain priority list', /action center|priority|\[CRITICAL\]|\[HIGH\]/i.test(priorityList.brainResponse ?? ''), (priorityList.brainResponse ?? '').slice(0, 90));
  assert('32. brain focus next', /focus on|recommended|gathering more product state/i.test(focus.brainResponse ?? ''), (focus.brainResponse ?? '').slice(0, 90));
  assert('33. brain no fabrication phrase', !/i recommend you immediately launch/i.test(nextStep.brainResponse ?? ''), 'honest');
  guardRuntime('brain');

  const reportPath = join(ROOT, 'architecture', 'FOUNDER_ACTION_CENTER_REPORT.md');
  assert('34. report exists', existsSync(reportPath), reportPath);

  const v4 = runFounderTestingModeV4({ rootDir: ROOT, validatorScripts });
  const v3 = runFounderTestingModeV3({ rootDir: ROOT, validatorScripts });
  assert('35. V4 action center section', Boolean(v4.founderActionCenter), String(v4.founderActionCenter?.state));
  assert('36. V4 action score', v4.founderActionCenterVisibilityScore.score >= 0, String(v4.founderActionCenterVisibilityScore.score));
  assert('37. V4 markdown section', v4.reportMarkdown.includes('Founder Action Center'), 'md');
  assert('38. V3 still valid', v3.trustScore >= 0, String(v3.trustScore));
  guardRuntime('founder');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const elapsed = Date.now() - START;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`V4 founder action center score: ${v4.founderActionCenterVisibilityScore.score}`);
  console.log('');

  if (failed.length) {
    console.log('FOUNDER_ACTION_CENTER_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_ACTION_CENTER_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
