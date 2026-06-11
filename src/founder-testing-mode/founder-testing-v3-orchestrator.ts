/**
 * Founder Testing Mode V3 — V2 + Human Behavior Simulation Engine.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  assessHumanPatience,
  buildTrustSimulation,
  computeLaunchReadinessSignals,
  detectHumanConfusion,
  simulateCuriosityPaths,
  simulateGoalCompletion,
  simulateMistakePrompts,
  simulatePersonas,
} from './human-behavior-simulation-engine.js';
import { DEFAULT_FOUNDER_PREFERENCE_MODEL } from './founder-preference-model.js';
import { runFounderTestingModeV2 } from './founder-testing-v2-orchestrator.js';
import { FOUNDER_TEST_V3_MAX_TOTAL_MS } from './founder-testing-v3-bounds.js';
import { assembleFounderTestV3Report } from './founder-testing-v3-report-builder.js';
import { deriveV3Verdict } from './founder-testing-v3-scorer.js';
import type { FounderTestV3Report, RunFounderTestingModeV3Input } from './founder-testing-v3-types.js';
import { buildRecommendedFixOrder } from './founder-testing-scorer.js';
import type { ScreenCheckSources } from './founder-testing-screen-checker.js';
import type { FounderTestIssue } from './founder-testing-types.js';

function loadShellSources(rootDir: string): ScreenCheckSources {
  const publicDir = join(rootDir, 'public', 'founder-reality');
  return {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
    css: readFileSync(join(publicDir, 'styles.css'), 'utf8'),
  };
}

function buildV3Issues(input: {
  v2Issues: FounderTestIssue[];
  mistakeResults: ReturnType<typeof simulateMistakePrompts>;
  goalResults: ReturnType<typeof simulateGoalCompletion>;
  confusionFindings: ReturnType<typeof detectHumanConfusion>;
  patienceAssessments: ReturnType<typeof assessHumanPatience>;
}): FounderTestIssue[] {
  const extra: FounderTestIssue[] = [];

  for (const m of input.mistakeResults.filter((r) => !r.recovered)) {
    extra.push({
      severity: 'MEDIUM',
      screen: 'Command Center',
      problem: `Mistake prompt "${m.prompt}" not recovered`,
      userImpact: 'Real users type vague or poor inputs — product must guide them.',
      likelyCause: 'Brain lacks recovery routing for ambiguous prompts.',
      recommendedFix: 'Improve mistake recovery and follow-up questions.',
      copyPasteFixPrompt: `Improve AiDevEngine recovery for vague prompt: "${m.prompt}"`,
    });
  }

  for (const g of input.goalResults.filter((r) => r.goalSuccessScore < 50)) {
    extra.push({
      severity: 'HIGH',
      screen: 'Goal Completion',
      problem: `Goal "${g.label}" low success (${g.goalSuccessScore})`,
      userImpact: 'Users may abandon before completing real goals.',
      likelyCause: g.deadEnds[0] ?? g.confusionPoints[0] ?? 'Goal path unclear',
      recommendedFix: `Improve goal path for: ${g.label}`,
      copyPasteFixPrompt: `Improve AiDevEngine goal completion for: ${g.label}`,
    });
  }

  for (const c of input.confusionFindings.filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL')) {
    extra.push({
      severity: c.severity === 'CRITICAL' ? 'BLOCKER' : 'HIGH',
      screen: c.topic,
      problem: c.detail,
      userImpact: 'Human confusion during non-ideal usage.',
      likelyCause: 'Overlapping surfaces or unclear labels.',
      recommendedFix: `Reduce confusion: ${c.topic}`,
    });
  }

  for (const p of input.patienceAssessments.filter((a) => a.frustrationRisk === 'CRITICAL' || a.frustrationRisk === 'HIGH')) {
    extra.push({
      severity: p.frustrationRisk === 'CRITICAL' ? 'BLOCKER' : 'HIGH',
      screen: p.screen,
      problem: `Frustration risk ${p.frustrationRisk}: ${p.detail}`,
      userImpact: 'Impatient users perceive product as broken.',
      likelyCause: 'Loading/feedback gap',
      recommendedFix: `Improve patience UX on ${p.screen}`,
    });
  }

  return [...input.v2Issues, ...extra];
}

export function runFounderTestingModeV3(input: RunFounderTestingModeV3Input = {}): FounderTestV3Report {
  const start = Date.now();
  const rootDir = input.rootDir ?? join(process.cwd());
  const deadline = start + FOUNDER_TEST_V3_MAX_TOTAL_MS;

  const v2 = runFounderTestingModeV2({
    rootDir,
    validatorScripts: input.validatorScripts,
    liveResults: input.liveResults,
    liveSection: input.liveSection,
  });

  const sources = loadShellSources(rootDir);
  const remaining = () => Math.max(0, deadline - Date.now());

  const personaSimulations = simulatePersonas(v2);
  const curiosityPaths = simulateCuriosityPaths(sources);
  const mistakeResults = simulateMistakePrompts(Math.min(remaining(), 25000));
  const patienceAssessments = assessHumanPatience(sources);
  const goalResults = simulateGoalCompletion(v2, sources, Math.min(remaining(), 25000));
  const confusionFindings = detectHumanConfusion(v2, sources);

  const { events: trustEvents, trustScore } = buildTrustSimulation({
    v2,
    personas: personaSimulations,
    mistakeResults,
    patienceAssessments,
    curiosityPaths,
  });

  const launchReadiness = computeLaunchReadinessSignals({
    v2,
    personas: personaSimulations,
    trustScore,
    goalResults,
    confusionFindings,
    mistakeResults,
    curiosityPaths,
  });

  const issues = buildV3Issues({
    v2Issues: v2.issues,
    mistakeResults,
    goalResults,
    confusionFindings,
    patienceAssessments,
  });

  const recommendedFixOrder = buildRecommendedFixOrder(issues);
  const copyPasteFixPrompts = issues
    .filter((i) => i.copyPasteFixPrompt)
    .slice(0, 10)
    .map((i) => i.copyPasteFixPrompt!);

  const topFrustrationRisks = patienceAssessments
    .filter((p) => p.frustrationRisk === 'HIGH' || p.frustrationRisk === 'CRITICAL')
    .map((p) => `${p.screen}: ${p.frustrationRisk} — ${p.detail}`);

  if (!topFrustrationRisks.length) {
    topFrustrationRisks.push('No HIGH/CRITICAL frustration risks — patience UX acceptable for V3 bounds');
  }

  const topTrustLossRisks = trustEvents
    .filter((e) => e.type === 'LOSS')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 6)
    .map((e) => `${e.source}: ${e.reason}`);

  if (!topTrustLossRisks.length) {
    topTrustLossRisks.push('No major trust loss events simulated');
  }

  const verdict = deriveV3Verdict({ v2, launch: launchReadiness, trustScore });

  return assembleFounderTestV3Report({
    reportId: randomUUID(),
    generatedAt: Date.now(),
    durationMs: Date.now() - start,
    readOnly: true,
    mode: 'founder-testing-v3',
    v2,
    founderPreferenceModel: DEFAULT_FOUNDER_PREFERENCE_MODEL,
    personaSimulations,
    curiosityPaths,
    mistakeResults,
    patienceAssessments,
    trustEvents,
    trustScore,
    goalResults,
    confusionFindings,
    launchReadiness,
    topFrustrationRisks,
    topTrustLossRisks,
    verdict,
    issues,
    recommendedFixOrder,
    copyPasteFixPrompts,
  });
}
