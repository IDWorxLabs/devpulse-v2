/**
 * Mobile Runtime Experience Reality — unified authority (Phase 24C.5).
 * Read-only. No emulator launch. No Expo/Android/iOS runtime execution.
 * Phone image / roadmap / code mention ≠ proof. Evidence only — no future-state scoring.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_MOBILE_RUNTIME_BLOCKERS,
  MAX_MOBILE_RUNTIME_EVIDENCE,
  MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE,
  MOBILE_RUNTIME_NEVER_PROOF,
} from './mobile-runtime-experience-reality-bounds.js';
import {
  buildMobileRuntimeWorkspaceSignalsForValidation,
  collectMobileRuntimeEvidence,
  detectMobileRuntimeModulePresenceEvidence,
  runAllMobileRuntimeAnalyzers,
} from './mobile-runtime-experience-reality-analyzers.js';
import { recordMobileRuntimeHistory } from './mobile-runtime-experience-reality-history.js';
import { storeMobileRuntimeRegistryEntry } from './mobile-runtime-experience-reality-registry.js';
import type {
  AssessMobileRuntimeExperienceRealityInput,
  MobileRuntimeBlocker,
  MobileRuntimeExperienceRealityAssessment,
  MobileRuntimeMatrixRow,
  MobileRuntimeReport,
  MobileRuntimeStage,
  MobileRuntimeSubscores,
} from './mobile-runtime-experience-reality-types.js';

export { MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE };

let assessmentCounter = 0;

export function resetMobileRuntimeExperienceRealityCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `mobile-runtime-reality-${assessmentCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreDeviceFrames(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).deviceFrameReality;
  if (level === 'DEVICE_FRAME_PROVEN') return 82;
  if (level === 'DEVICE_FRAME_PARTIAL') return 34;
  return 8;
}

function scoreSimulation(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).mobileSimulationReality;
  if (level === 'SIMULATION_PROVEN') return 80;
  if (level === 'SIMULATION_PARTIAL') return 32;
  return 10;
}

function scoreAndroidRuntime(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).androidRuntimeReality;
  if (level === 'ANDROID_RUNTIME_PROVEN') return 88;
  if (level === 'ANDROID_RUNTIME_PARTIAL') return 14;
  return 6;
}

function scoreIosRuntime(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).iosRuntimeReality;
  if (level === 'IOS_RUNTIME_PROVEN') return 88;
  if (level === 'IOS_RUNTIME_PARTIAL') return 14;
  return 6;
}

function scoreExpoRuntime(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).expoRuntimeReality;
  if (level === 'EXPO_RUNTIME_PROVEN') return 86;
  if (level === 'EXPO_RUNTIME_PARTIAL') return 12;
  return 6;
}

function scoreCloudRuntime(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).cloudRuntimeReality;
  if (level === 'CLOUD_RUNTIME_PROVEN') return 84;
  if (level === 'CLOUD_RUNTIME_PARTIAL') return 18;
  return 5;
}

function scoreMobileExperience(input: AssessMobileRuntimeExperienceRealityInput): number {
  const level = runAllMobileRuntimeAnalyzers(input).mobileExperienceCompleteness;
  if (level === 'MOBILE_EXPERIENCE_PROVEN') return 90;
  if (level === 'MOBILE_EXPERIENCE_PARTIAL') return 28;
  return 8;
}

function computeSubscores(input: AssessMobileRuntimeExperienceRealityInput): MobileRuntimeSubscores {
  return {
    deviceFrames: scoreDeviceFrames(input),
    simulation: scoreSimulation(input),
    androidRuntime: scoreAndroidRuntime(input),
    iosRuntime: scoreIosRuntime(input),
    expoRuntime: scoreExpoRuntime(input),
    cloudRuntime: scoreCloudRuntime(input),
    mobileExperience: scoreMobileExperience(input),
  };
}

function computeOverallScore(subscores: MobileRuntimeSubscores): number {
  const raw =
    subscores.deviceFrames * 0.18 +
    subscores.simulation * 0.16 +
    subscores.androidRuntime * 0.16 +
    subscores.iosRuntime * 0.16 +
    subscores.expoRuntime * 0.12 +
    subscores.cloudRuntime * 0.1 +
    subscores.mobileExperience * 0.12;
  return clamp(raw);
}

function levelToMatrix(
  area: string,
  level: string,
): MobileRuntimeMatrixRow {
  const proven = level.includes('PROVEN') ? 'PROVEN' : 'NONE';
  const observed = level.includes('PARTIAL') || level.includes('PROVEN') ? 'OBSERVED' : 'NONE';
  const claimed = level.includes('MISSING') ? 'NONE' : 'CLAIMED';
  return { area, claimed, observed, proven };
}

function buildCapabilityMatrix(
  analyzers: ReturnType<typeof runAllMobileRuntimeAnalyzers>,
): MobileRuntimeMatrixRow[] {
  return [
    levelToMatrix('Device Frames', analyzers.deviceFrameReality),
    levelToMatrix('Mobile Simulation', analyzers.mobileSimulationReality),
    levelToMatrix('Android Runtime', analyzers.androidRuntimeReality),
    levelToMatrix('iOS Runtime', analyzers.iosRuntimeReality),
    levelToMatrix('Expo Runtime', analyzers.expoRuntimeReality),
    levelToMatrix('Cloud Device Runtime', analyzers.cloudRuntimeReality),
    levelToMatrix('Mobile Experience', analyzers.mobileExperienceCompleteness),
  ];
}

function buildStages(analyzers: ReturnType<typeof runAllMobileRuntimeAnalyzers>): MobileRuntimeStage[] {
  const toStatus = (level: string): MobileRuntimeStage['status'] => {
    if (level.includes('PROVEN')) return 'COMPLETE';
    if (level.includes('PARTIAL')) return 'PARTIAL';
    return 'NOT_STARTED';
  };

  return [
    {
      area: 'DEVICE_FRAME_PREVIEW',
      status: toStatus(analyzers.deviceFrameReality),
      detail: analyzers.deviceFrameReality.replace(/_/g, ' ').toLowerCase(),
    },
    {
      area: 'MOBILE_SIMULATION',
      status: toStatus(analyzers.mobileSimulationReality),
      detail: analyzers.mobileSimulationReality.replace(/_/g, ' ').toLowerCase(),
    },
    {
      area: 'ANDROID_RUNTIME',
      status: toStatus(analyzers.androidRuntimeReality),
      detail: analyzers.androidRuntimeReality.replace(/_/g, ' ').toLowerCase(),
    },
    {
      area: 'IOS_RUNTIME',
      status: toStatus(analyzers.iosRuntimeReality),
      detail: analyzers.iosRuntimeReality.replace(/_/g, ' ').toLowerCase(),
    },
    {
      area: 'EXPO_RUNTIME',
      status: toStatus(analyzers.expoRuntimeReality),
      detail: analyzers.expoRuntimeReality.replace(/_/g, ' ').toLowerCase(),
    },
    {
      area: 'CLOUD_DEVICE_RUNTIME',
      status: toStatus(analyzers.cloudRuntimeReality),
      detail: analyzers.cloudRuntimeReality.replace(/_/g, ' ').toLowerCase(),
    },
  ];
}

function buildBlockers(
  analyzers: ReturnType<typeof runAllMobileRuntimeAnalyzers>,
  input: AssessMobileRuntimeExperienceRealityInput,
): MobileRuntimeBlocker[] {
  const blockers: MobileRuntimeBlocker[] = [];
  let rank = 0;

  const add = (
    severity: MobileRuntimeBlocker['severity'],
    explanation: string,
    recommendation: string,
  ) => {
    rank += 1;
    blockers.push({
      id: `mobile-runtime-blocker-${rank}`,
      severity,
      impactRank: rank,
      explanation,
      recommendation,
    });
  };

  if (analyzers.androidRuntimeReality === 'ANDROID_RUNTIME_MISSING') {
    add(
      'CRITICAL',
      'No Android runtime launch or execution evidence exists.',
      'Build Android runtime launch path with observable launch and device experience evidence before claiming Android support.',
    );
  }
  if (analyzers.iosRuntimeReality === 'IOS_RUNTIME_MISSING') {
    add(
      'CRITICAL',
      'No iOS runtime launch or execution evidence exists.',
      'Build iOS runtime launch path with observable launch and device experience evidence before claiming iOS support.',
    );
  }
  if (analyzers.expoRuntimeReality === 'EXPO_RUNTIME_MISSING') {
    add(
      'HIGH',
      'No Expo runtime integration or launch evidence exists.',
      'Wire Expo runtime launch path with evidence collection — Expo mentions in code are not proof.',
    );
  }
  if (analyzers.deviceFrameReality !== 'DEVICE_FRAME_PROVEN') {
    add(
      'HIGH',
      'Device frame preview is not proven — phone images and metadata alone do not prove familiar device environments.',
      'Connect device frame preview to launch evidence for Android phone, iPhone, and tablet frames.',
    );
  }
  if (analyzers.mobileSimulationReality !== 'SIMULATION_PROVEN') {
    add(
      'MEDIUM',
      'Touch, safe-area, keyboard, and orientation simulation are not proven.',
      'Implement simulation systems with observable evidence — responsive CSS alone is insufficient.',
    );
  }
  if (!input.workspace.executionConnected) {
    add(
      'MEDIUM',
      'Mobile runtime experience is not linked to connected builder execution outcomes.',
      'Link mobile runtime evidence to controlled execution workspaces after Phase 24D.',
    );
  }

  return blockers.slice(0, MAX_MOBILE_RUNTIME_BLOCKERS);
}

function resolveNextRequiredCapability(analyzers: ReturnType<typeof runAllMobileRuntimeAnalyzers>): string {
  if (analyzers.androidRuntimeReality === 'ANDROID_RUNTIME_MISSING') {
    return 'Android runtime launch path with execution evidence';
  }
  if (analyzers.iosRuntimeReality === 'IOS_RUNTIME_MISSING') {
    return 'iOS runtime launch path with execution evidence';
  }
  if (analyzers.deviceFrameReality !== 'DEVICE_FRAME_PROVEN') {
    return 'Device frame preview backed by launch evidence';
  }
  if (analyzers.mobileSimulationReality !== 'SIMULATION_PROVEN') {
    return 'Mobile simulation (touch, safe areas, orientation) with evidence';
  }
  return 'Cloud device runtime sessions with remote evidence';
}

function buildFounderConclusion(
  score: number,
  analyzers: ReturnType<typeof runAllMobileRuntimeAnalyzers>,
): string {
  if (analyzers.mobileExperienceCompleteness === 'MOBILE_EXPERIENCE_PROVEN') {
    return `Yes — founders can experience applications in familiar mobile device environments today (score ${score}/100) with proven runtime, launch, and device experience evidence.`;
  }

  if (analyzers.mobileExperienceCompleteness === 'MOBILE_EXPERIENCE_PARTIAL') {
    return `Not fully — DevPulse has partial mobile runtime infrastructure (score ${score}/100). Integration points and responsive preview signals exist, but Android/iOS/Expo runtimes are not proven. Phone images, frames, and code mentions are not proof.`;
  }

  return `No — DevPulse cannot yet provide familiar Android/iPhone/tablet runtime experiences (score ${score}/100). Mobile preview metadata and extension points exist; runtime launch evidence, execution evidence, and device experience evidence are missing. ${MOBILE_RUNTIME_NEVER_PROOF.slice(0, 3).join('; ')} ≠ proof.`;
}

export function buildMobileRuntimeExperienceRealityReport(
  assessment: Omit<MobileRuntimeExperienceRealityAssessment, 'report'> & { report?: never },
): MobileRuntimeReport {
  const matrixTable = assessment.capabilityMatrix
    .map((r) => `| ${r.area} | ${r.claimed} | ${r.observed} | ${r.proven} |`)
    .join('\n');

  const markdown = `# Mobile Runtime Experience Reality Report

Generated by Mobile Runtime Experience Reality Authority (${MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE}).

## Executive Summary

**Mobile Runtime Experience Score: ${assessment.mobileRuntimeExperienceScore}/100**

${assessment.mobileRuntimeSummary}

Next required capability: **${assessment.nextRequiredCapability}**

## Capability Matrix

| Area | Claimed | Observed | Proven |
| ---- | ------- | -------- | ------ |
${matrixTable}

## Evidence Found

${assessment.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${assessment.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Mobile Runtime Blockers

${assessment.mobileRuntimeBlockers.map((b, i) => `${i + 1}. **${b.severity}** — ${b.explanation} → ${b.recommendation}`).join('\n') || 'None ranked'}

## Founder Conclusion

${assessment.founderConclusion}

> Can DevPulse provide a familiar mobile runtime experience today?

${assessment.founderConclusion}

---

*Reality only — phone image / phone frame / roadmap / Android/iOS/Expo mention in code ≠ proof. No emulator launch in this authority. No future-state scoring.*
`;

  return {
    executiveSummary: `Mobile Runtime Experience Score ${assessment.mobileRuntimeExperienceScore}/100 — ${assessment.analyzers.mobileExperienceCompleteness.replace(/_/g, ' ').toLowerCase()}.`,
    capabilityMatrix: assessment.capabilityMatrix,
    evidenceFound: assessment.evidenceFound,
    missingEvidence: assessment.missingEvidence,
    mobileRuntimeBlockers: assessment.mobileRuntimeBlockers.map(
      (b) => `${b.severity}: ${b.explanation}`,
    ),
    founderConclusion: assessment.founderConclusion,
    markdown,
  };
}

export function assessMobileRuntimeExperienceReality(
  rootDir: string,
  overrides: Partial<AssessMobileRuntimeExperienceRealityInput['workspace']> = {},
): MobileRuntimeExperienceRealityAssessment {
  const moduleEvidence = detectMobileRuntimeModulePresenceEvidence(rootDir);
  const input: AssessMobileRuntimeExperienceRealityInput = {
    rootDir,
    workspace: buildMobileRuntimeWorkspaceSignalsForValidation(overrides),
    moduleEvidence,
  };

  const analyzers = runAllMobileRuntimeAnalyzers(input);
  const subscores = computeSubscores(input);
  const mobileRuntimeExperienceScore = computeOverallScore(subscores);
  const evidenceRecords = collectMobileRuntimeEvidence(input).slice(0, MAX_MOBILE_RUNTIME_EVIDENCE);
  const capabilityMatrix = buildCapabilityMatrix(analyzers);
  const stages = buildStages(analyzers);
  const mobileRuntimeBlockers = buildBlockers(analyzers, input);
  const nextRequiredCapability = resolveNextRequiredCapability(analyzers);

  const evidenceFound = evidenceRecords
    .filter((e) => e.level === 'OBSERVED' || e.level === 'PROVEN')
    .map((e) => `[${e.level}] ${e.description}`)
    .slice(0, 8);

  const missingEvidence = [
    'Android runtime launch evidence',
    'iOS runtime launch evidence',
    'Expo runtime launch evidence',
    'Cloud device remote session evidence',
    'TestFlight-style runtime evidence',
    'Device frame preview backed by launch proof',
    'Touch/safe-area/orientation simulation proof',
  ].filter((line) => {
    if (line.startsWith('Android') && analyzers.androidRuntimeReality === 'ANDROID_RUNTIME_PROVEN') return false;
    if (line.startsWith('iOS') && analyzers.iosRuntimeReality === 'IOS_RUNTIME_PROVEN') return false;
    if (line.startsWith('Expo') && analyzers.expoRuntimeReality === 'EXPO_RUNTIME_PROVEN') return false;
    if (line.startsWith('Cloud') && analyzers.cloudRuntimeReality === 'CLOUD_RUNTIME_PROVEN') return false;
    if (line.startsWith('Device') && analyzers.deviceFrameReality === 'DEVICE_FRAME_PROVEN') return false;
    if (line.startsWith('Touch') && analyzers.mobileSimulationReality === 'SIMULATION_PROVEN') return false;
    return true;
  });

  const founderConclusion = buildFounderConclusion(mobileRuntimeExperienceScore, analyzers);
  const mobileRuntimeSummary = `Mobile runtime ${mobileRuntimeExperienceScore}/100 — device frames ${analyzers.deviceFrameReality.replace(/_/g, ' ').toLowerCase()}; Android ${analyzers.androidRuntimeReality.replace(/_/g, ' ').toLowerCase()}; iOS ${analyzers.iosRuntimeReality.replace(/_/g, ' ').toLowerCase()}.`;

  const assessmentId = nextAssessmentId();
  const base = {
    assessmentId,
    mobileRuntimeExperienceScore,
    portfolioSubscores: subscores,
    analyzers,
    stages,
    evidence: evidenceRecords,
    capabilityMatrix,
    evidenceFound,
    missingEvidence,
    mobileRuntimeBlockers,
    founderConclusion,
    mobileRuntimeSummary,
    nextRequiredCapability,
    assessedAt: Date.now(),
  };

  const report = buildMobileRuntimeExperienceRealityReport(base);

  storeMobileRuntimeRegistryEntry({
    assessmentId,
    mobileRuntimeExperienceScore,
    mobileExperienceCompleteness: analyzers.mobileExperienceCompleteness,
    assessedAt: base.assessedAt,
  });

  recordMobileRuntimeHistory({
    assessmentId,
    mobileRuntimeExperienceScore,
    summary: mobileRuntimeSummary,
    recordedAt: base.assessedAt,
  });

  return { ...base, report };
}

export function writeMobileRuntimeExperienceRealityReportFile(
  rootDir: string,
  assessment: MobileRuntimeExperienceRealityAssessment,
): string {
  const reportPath = join(rootDir, 'architecture', 'MOBILE_RUNTIME_EXPERIENCE_REALITY_REPORT.md');
  writeFileSync(reportPath, assessment.report.markdown, 'utf8');
  return reportPath;
}

export function getMobileRuntimeExperienceDashboardSummary(
  assessment: MobileRuntimeExperienceRealityAssessment,
): {
  deviceFrames: string;
  mobileSimulation: string;
  androidRuntime: string;
  iosRuntime: string;
  expoRuntime: string;
  cloudRuntime: string;
  overallScore: string;
  founderConclusion: string;
  realityEvidenceLines: string[];
} {
  const { analyzers, portfolioSubscores } = assessment;
  const label = (level: string) => level.replace(/_/g, ' ');

  return {
    deviceFrames: `${label(analyzers.deviceFrameReality)} (${portfolioSubscores.deviceFrames}/100)`,
    mobileSimulation: `${label(analyzers.mobileSimulationReality)} (${portfolioSubscores.simulation}/100)`,
    androidRuntime: `${label(analyzers.androidRuntimeReality)} (${portfolioSubscores.androidRuntime}/100)`,
    iosRuntime: `${label(analyzers.iosRuntimeReality)} (${portfolioSubscores.iosRuntime}/100)`,
    expoRuntime: `${label(analyzers.expoRuntimeReality)} (${portfolioSubscores.expoRuntime}/100)`,
    cloudRuntime: `${label(analyzers.cloudRuntimeReality)} (${portfolioSubscores.cloudRuntime}/100)`,
    overallScore: `${assessment.mobileRuntimeExperienceScore}/100`,
    founderConclusion: assessment.founderConclusion,
    realityEvidenceLines: assessment.evidenceFound.slice(0, 4),
  };
}
