/**
 * Founder Testing Mode V2 — orchestrates V1 technical checks + founder-proxy evaluation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  buildReadinessReality,
  detectConfusionRisks,
  evaluateScreenPurpose,
  integratePerceptionSignals,
  predictFounderApproval,
  promptVisionToIssues,
  screenPurposeToIssues,
  summarizeArchitectureLeakage,
  topFounderConcerns,
} from './founder-proxy-evaluator.js';
import { runBoundedPromptVisionChecks } from './founder-testing-prompt-vision-checker.js';
import { runFounderTestingMode } from './founder-testing-orchestrator.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';
import { buildRecommendedFixOrder } from './founder-testing-scorer.js';
import { assembleFounderTestV2Report } from './founder-testing-v2-report-builder.js';
import { FOUNDER_TEST_V2_MAX_TOTAL_MS } from './founder-testing-v2-bounds.js';
import { deriveV2Verdict } from './founder-testing-v2-scorer.js';
import type { FounderTestV2Report, RunFounderTestingModeV2Input } from './founder-testing-v2-types.js';
import type { FounderTestIssue } from './founder-testing-types.js';

function loadShellSources(rootDir: string): ScreenCheckSources {
  const publicDir = join(rootDir, 'public', 'founder-reality');
  return {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    css: readFileSync(join(publicDir, 'styles.css'), 'utf8'),
  };
}

export function runFounderTestingModeV2(input: RunFounderTestingModeV2Input = {}): FounderTestV2Report {
  const start = Date.now();
  const rootDir = input.rootDir ?? join(process.cwd());
  const requestId = `founder-test-v2-${randomUUID()}`;

  const v1 = runFounderTestingMode({
    rootDir,
    validatorScripts: input.validatorScripts,
    liveResults: input.liveResults,
    liveSection: input.liveSection,
  });

  const sources = loadShellSources(rootDir);
  const screenPurposeResults = evaluateScreenPurpose(sources);
  const { understandabilityScore, risks: confusionRisks } = detectConfusionRisks(sources);

  const promptBudget = Math.max(0, start + FOUNDER_TEST_V2_MAX_TOTAL_MS - Date.now());
  const promptVisionResults = runBoundedPromptVisionChecks(promptBudget);

  const perception = integratePerceptionSignals(requestId);
  const architectureLeakageSummary = summarizeArchitectureLeakage(screenPurposeResults, promptVisionResults);

  const screenPurposeAvg =
    screenPurposeResults.reduce((s, r) => s + r.founderExpectationAlignment, 0) /
    Math.max(1, screenPurposeResults.length);

  const readinessReality = buildReadinessReality({
    v1Overall: v1.scores.overall,
    screenPurposeResults,
    promptVisionResults,
    understandabilityScore,
    perception,
  });

  const founderApproval = predictFounderApproval({
    technicalReadiness: readinessReality.technicalReadiness,
    productReadiness: readinessReality.productReadiness,
    visionAlignment: readinessReality.visionAlignment,
    customerReadiness: readinessReality.customerReadiness,
    architectureLevel: architectureLeakageSummary,
    screenPurposeAvg,
  });

  const v2Issues: FounderTestIssue[] = [
    ...v1.issues,
    ...screenPurposeToIssues(screenPurposeResults),
    ...promptVisionToIssues(promptVisionResults),
    ...confusionRisks
      .filter((r) => r.severity === 'HIGH')
      .map((r) => ({
        severity: 'HIGH' as const,
        screen: r.screens,
        problem: r.risk,
        userImpact: 'First-time user confusion within 5–10 seconds.',
        likelyCause: 'Overlapping labels or missing distinguishing copy.',
        recommendedFix: `Clarify difference between ${r.screens}.`,
        copyPasteFixPrompt: `Reduce AiDevEngine confusion risk: ${r.risk}`,
      })),
  ];

  const recommendedFixOrder = buildRecommendedFixOrder(v2Issues);
  const copyPasteFixPrompts = v2Issues
    .filter((i) => i.copyPasteFixPrompt)
    .slice(0, 8)
    .map((i) => i.copyPasteFixPrompt!);

  const verdict = deriveV2Verdict({
    readiness: readinessReality,
    founderApproval,
    architectureLevel: architectureLeakageSummary,
    promptVisionResults,
  });

  return assembleFounderTestV2Report({
    reportId: randomUUID(),
    generatedAt: Date.now(),
    durationMs: Date.now() - start,
    readOnly: true,
    mode: 'founder-testing-v2',
    v1,
    readinessReality,
    founderApproval,
    understandabilityScore,
    confusionRisks,
    screenPurposeResults,
    promptVisionResults,
    architectureLeakageSummary,
    topFounderConcerns: topFounderConcerns({
      promptVision: promptVisionResults,
      screenPurpose: screenPurposeResults,
      confusion: confusionRisks,
    }),
    verdict,
    issues: v2Issues,
    recommendedFixOrder,
    copyPasteFixPrompts,
  });
}
