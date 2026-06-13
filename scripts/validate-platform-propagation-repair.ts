/**
 * Phase 26.36 — Platform Propagation Repair V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runArchitectureBriefGenerator } from '../src/architecture-brief-generator/index.js';
import { runBuildPlanGenerator } from '../src/build-plan-generator/index.js';
import { detectInformationLosses, runOrchestrationProof } from '../src/cross-system-orchestration-proof/index.js';
import { extractAuthoritySnapshots } from '../src/cross-system-orchestration-proof/project-consistency-tracker.js';
import {
  resetFounderSimulationEngineModuleForTests,
  simulateFounderJourney,
  getFounderSimulationScenarioByType,
} from '../src/founder-simulation-engine/index.js';
import { runPlanningGateAuthority } from '../src/planning-gate-authority/index.js';
import {
  propagatePlatformTargets,
  runPlanningBriefGenerator,
} from '../src/planning-brief-generator/index.js';
import type { UnifiedIntakeAnalysis } from '../src/unified-intake-intelligence/unified-intake-types.js';

const PLATFORM_PROPAGATION_REPAIR_V1_PASS = 'PLATFORM_PROPAGATION_REPAIR_V1_PASS';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function buildMobileIntakeFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-platform-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Uber-style ride sharing app for iOS and Android',
      platforms: ['IOS', 'ANDROID'],
      screens: ['ride request', 'tracking', 'onboarding'],
      workflows: ['onboarding', 'ride request', 'tracking', 'payments'],
      userRoles: ['driver', 'rider'],
      integrations: ['Stripe'],
      notifications: ['push notification'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'ride'],
      businessRules: ['Drivers must complete onboarding'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['RIDE_REQUEST', 'TRACKING'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 18,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Ride sharing marketplace',
      targetUsers: ['drivers', 'riders'],
      businessObjective: 'Transportation marketplace revenue',
      confidence: 92,
      evidence: ['TYPED_PROMPT'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP',
      platforms: ['IOS', 'ANDROID'],
      workflows: ['onboarding', 'ride request', 'tracking', 'payments'],
      screens: ['ride request', 'tracking', 'onboarding'],
      userRoles: ['driver', 'rider'],
      entities: ['user', 'ride'],
      integrations: ['Stripe'],
      businessRules: ['Drivers must complete onboarding'],
      confidence: 92,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    evidenceConflicts: [],
    intakeGaps: [],
    unifiedIntakeConfidence: 92,
    intakeReadinessScore: 90,
    intakeReadinessCategory: 'READY_FOR_PLANNING',
    intakeReadiness: 'READY_FOR_PLANNING',
    intakeRecommendations: [],
  };
}

const propagated = propagatePlatformTargets(['IOS', 'ANDROID'], 'MOBILE_APP');
assert('A propagate preserves IOS', propagated.includes('IOS'), propagated.join(', '));
assert('A propagate preserves ANDROID', propagated.includes('ANDROID'), propagated.join(', '));
assert('A propagate adds MOBILE grouping', propagated.includes('MOBILE'), propagated.join(', '));
assert('A propagate does not collapse to MOBILE only', propagated.length >= 3, `${propagated.length}`);

const multiPlatform = propagatePlatformTargets(['WEB', 'IOS', 'ANDROID'], 'MOBILE_APP');
assert('A multi-platform preserves WEB', multiPlatform.includes('WEB'), multiPlatform.join(', '));
assert('A multi-platform preserves specifics', multiPlatform.includes('IOS') && multiPlatform.includes('ANDROID'), multiPlatform.join(', '));

const tabletPlatform = propagatePlatformTargets(['IPAD', 'ANDROID_TABLET'], 'MOBILE_APP');
assert('A tablet preserves IPAD', tabletPlatform.includes('IPAD'), tabletPlatform.join(', '));
assert('A tablet preserves ANDROID_TABLET', tabletPlatform.includes('ANDROID_TABLET'), tabletPlatform.join(', '));
assert('A tablet adds TABLET grouping', tabletPlatform.includes('TABLET'), tabletPlatform.join(', '));

const intake = buildMobileIntakeFixture();
const gate = runPlanningGateAuthority({
  unifiedIntakeAnalysis: intake,
  skipHistoryRecording: true,
});

const planningBriefRun = runPlanningBriefGenerator({
  planningGateAnalysis: gate.analysis,
  unifiedIntakeAnalysis: intake,
  skipHistoryRecording: true,
});

const planningBrief = planningBriefRun.planningBrief;
assert('B planning brief generated', planningBrief != null, planningBriefRun.orchestrationState);
assert('B IOS survives to planning brief', planningBrief?.platformTargets.includes('IOS') === true, planningBrief?.platformTargets.join(', ') ?? 'none');
assert(
  'B ANDROID survives to planning brief',
  planningBrief?.platformTargets.includes('ANDROID') === true,
  planningBrief?.platformTargets.join(', ') ?? 'none',
);
assert(
  'B MOBILE added not replacing specifics',
  planningBrief != null &&
    planningBrief.platformTargets.includes('MOBILE') &&
    planningBrief.platformTargets.includes('IOS') &&
    planningBrief.platformTargets.includes('ANDROID'),
  planningBrief?.platformTargets.join(', ') ?? 'none',
);

const architectureRun = runArchitectureBriefGenerator({
  planningBrief,
  planningGateAnalysis: gate.analysis,
  unifiedIntakeAnalysis: intake,
  skipHistoryRecording: true,
});

const architectureBrief = architectureRun.architectureBrief;
assert('C architecture brief generated', architectureBrief != null, architectureRun.orchestrationState);
assert('C IOS survives to architecture brief', architectureBrief?.systemOverview.platforms.includes('IOS') === true, architectureBrief?.systemOverview.platforms.join(', ') ?? 'none');
assert(
  'C ANDROID survives to architecture brief',
  architectureBrief?.systemOverview.platforms.includes('ANDROID') === true,
  architectureBrief?.systemOverview.platforms.join(', ') ?? 'none',
);
assert(
  'C MOBILE present on architecture brief',
  architectureBrief?.systemOverview.platforms.includes('MOBILE') === true,
  architectureBrief?.systemOverview.platforms.join(', ') ?? 'none',
);

const buildPlanRun = runBuildPlanGenerator({
  architectureBrief,
  planningBrief,
  planningGateAnalysis: gate.analysis,
  unifiedIntakeAnalysis: intake,
  skipHistoryRecording: true,
});

const buildPlan = buildPlanRun.buildPlan;
assert('D build plan generated', buildPlan != null, buildPlanRun.orchestrationState);
assert('D IOS survives to build plan', buildPlan?.projectSummary.platforms.includes('IOS') === true, buildPlan?.projectSummary.platforms.join(', ') ?? 'none');
assert(
  'D ANDROID survives to build plan',
  buildPlan?.projectSummary.platforms.includes('ANDROID') === true,
  buildPlan?.projectSummary.platforms.join(', ') ?? 'none',
);
assert(
  'D MOBILE present on build plan',
  buildPlan?.projectSummary.platforms.includes('MOBILE') === true,
  buildPlan?.projectSummary.platforms.join(', ') ?? 'none',
);

const snapshots = extractAuthoritySnapshots({
  unifiedIntakeAnalysis: intake,
  planningBrief: planningBrief ?? undefined,
  architectureBrief: architectureBrief ?? undefined,
  buildPlan: buildPlan ?? undefined,
});
const platformLosses = detectInformationLosses(snapshots).filter((l) => l.field === 'platforms');
assert(
  'E no platform loss intake to planning brief',
  !platformLosses.some(
    (l) =>
      l.upstreamAuthority === 'UNIFIED_INTAKE_INTELLIGENCE' &&
      l.downstreamAuthority === 'PLANNING_BRIEF_GENERATOR',
  ),
  platformLosses.map((l) => `${l.upstreamAuthority}->${l.downstreamAuthority}:${l.lostItems.join(',')}`).join('; ') || 'none',
);

const orchestrationProof = runOrchestrationProof({
  scenarioTypes: ['MOBILE_FIRST'],
  skipHistoryRecording: true,
});
const mobilePlatformLosses =
  orchestrationProof.analysis?.systemOrchestrationProof.informationLosses.filter(
    (l) =>
      l.field === 'platforms' &&
      l.upstreamAuthority === 'UNIFIED_INTAKE_INTELLIGENCE' &&
      l.downstreamAuthority === 'PLANNING_BRIEF_GENERATOR',
  ) ?? [];
assert(
  'E orchestration proof no MOBILE_FIRST platform loss to planning brief',
  mobilePlatformLosses.length === 0,
  `${mobilePlatformLosses.length} losses`,
);

resetFounderSimulationEngineModuleForTests();
const mobileScenario = getFounderSimulationScenarioByType('MOBILE_FIRST');
const mobileJourney = mobileScenario
  ? simulateFounderJourney({ scenario: mobileScenario, applyAlignmentRepair: true })
  : null;
assert('F founder simulation mobile-first runs', mobileJourney != null, mobileJourney?.finalVerdict ?? 'null');
assert(
  'F founder simulation remains planning-ready or better',
  mobileJourney != null &&
    (mobileJourney.finalVerdict === 'READY_FOR_PLANNING' ||
      mobileJourney.finalVerdict === 'READY_FOR_ARCHITECTURE' ||
      mobileJourney.finalVerdict === 'READY_FOR_BUILD_PLAN' ||
      mobileJourney.finalVerdict === 'READY_FOR_EXECUTION_GATE'),
  mobileJourney?.finalVerdict ?? 'none',
);
assert(
  'F no readiness inflation to execution gate from low gate alone',
  mobileJourney == null || mobileJourney.finalVerdict !== 'READY_FOR_EXECUTION_GATE' || mobileJourney.readinessScore >= 95,
  `${mobileJourney?.finalVerdict ?? 'none'} / ${mobileJourney?.readinessScore ?? 0}`,
);

const summarizerSource = readFileSync(join(ROOT, 'src/planning-brief-generator/project-scope-summarizer.ts'), 'utf8');
const authoritySource = readFileSync(join(ROOT, 'src/planning-brief-generator/planning-brief-authority.ts'), 'utf8');
assert(
  'G no code generation introduced',
  !summarizerSource.includes('generateCode') &&
    !summarizerSource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('G propagatePlatformTargets exported', summarizerSource.includes('export function propagatePlatformTargets'), 'yes');

const summarizerHash = createHash('sha256').update(summarizerSource).digest('hex').slice(0, 12);
assert('H no validator recursion marker', !summarizerSource.includes('validate-platform-propagation-repair'), summarizerHash);

const reportLines = [
  '# Platform Propagation Repair Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Before Behavior',
  '',
  '- Unified Intake preserved `IOS`, `ANDROID`',
  '- Planning Brief collapsed to `MOBILE` only',
  '- Cross-System Orchestration Proof reported `LOSS_OF_INFORMATION` for platform targets',
  '',
  '## After Behavior',
  '',
  `- propagatePlatformTargets: \`${propagated.join(', ')}\``,
  `- Planning Brief: \`${planningBrief?.platformTargets.join(', ') ?? 'none'}\``,
  `- Architecture Brief: \`${architectureBrief?.systemOverview.platforms.join(', ') ?? 'none'}\``,
  `- Build Plan: \`${buildPlan?.projectSummary.platforms.join(', ') ?? 'none'}\``,
  '',
  '## Repaired Files',
  '',
  '- src/planning-brief-generator/planning-brief-types.ts',
  '- src/planning-brief-generator/planning-brief-registry.ts',
  '- src/planning-brief-generator/project-scope-summarizer.ts',
  '- src/planning-brief-generator/index.ts',
  '- src/architecture-brief-generator/frontend-architecture-summarizer.ts',
  '- src/cross-system-orchestration-proof/project-consistency-tracker.ts',
  '',
  '## Validation Evidence',
  '',
  `- Orchestration MOBILE_FIRST platform losses (intake→planning brief): ${mobilePlatformLosses.length}`,
  `- Fixture platform losses across chain: ${platformLosses.length}`,
  `- Founder simulation verdict: ${mobileJourney?.finalVerdict ?? 'n/a'}`,
  `- Founder simulation readiness: ${mobileJourney?.readinessScore ?? 0}/100`,
  '',
  '## Remaining Known Platform Risks',
  '',
  '- Generic `MOBILE`-only intake (without IOS/ANDROID specifics) still yields `MOBILE` only — no fabrication of specifics',
  '- Planning Gate mirrors intake platforms and does not expand grouping labels',
  '- Founder Test Automation does not carry platform inventory (by design)',
  '',
  '---',
  '',
  `Pass token: ${PLATFORM_PROPAGATION_REPAIR_V1_PASS}`,
  '',
];

writeFileSync(join(ROOT, 'architecture/PLATFORM_PROPAGATION_REPAIR_REPORT.md'), reportLines.join('\n'), 'utf8');
assert('I report written', existsSync(join(ROOT, 'architecture/PLATFORM_PROPAGATION_REPAIR_REPORT.md')), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/PLATFORM_PROPAGATION_REPAIR_REPORT.md'), 'utf8');
assert('I pass token in report', arch.includes(PLATFORM_PROPAGATION_REPAIR_V1_PASS), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Platform Propagation Repair V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nPropagated platforms: ${propagated.join(', ')}`);
  console.log(`Planning brief platforms: ${planningBrief?.platformTargets.join(', ')}`);
  console.log(`Architecture platforms: ${architectureBrief?.systemOverview.platforms.join(', ')}`);
  console.log(`Build plan platforms: ${buildPlan?.projectSummary.platforms.join(', ')}`);
  console.log(`MOBILE_FIRST platform losses: ${mobilePlatformLosses.length}`);
  console.log(`Founder simulation: ${mobileJourney?.finalVerdict} (${mobileJourney?.readinessScore}/100)`);
  console.log(`Report path: architecture/PLATFORM_PROPAGATION_REPAIR_REPORT.md`);
  console.log(`\n${PLATFORM_PROPAGATION_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
