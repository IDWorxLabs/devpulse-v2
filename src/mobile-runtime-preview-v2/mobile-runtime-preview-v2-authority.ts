/**
 * Mobile Runtime Preview V2 — orchestration authority.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assessMobileRuntimePreviewV1,
  detectMobileRuntimeCapabilities,
} from '../mobile-runtime-preview-v1/index.js';
import {
  AndroidRuntimeAdapterV2,
  resetAndroidRuntimeV2ForTests,
  runBoundedAndroidLaunch,
} from './android-runtime-adapter-v2.js';
import {
  ANDROID_EMULATOR_LAUNCH_EVIDENCE_FILENAME,
  DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS,
  MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR,
  MOBILE_RUNTIME_PREVIEW_V2_OWNER_MODULE,
  MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME,
} from './mobile-runtime-preview-v2-bounds.js';
import { assessMobileRuntimeRealityWithV2Evidence } from './mobile-runtime-preview-v2-reality-bridge.js';
import { buildMobileRuntimePreviewV2ReportMarkdown } from './mobile-runtime-preview-v2-report-builder.js';
import type {
  AssessMobileRuntimePreviewV2Input,
  MobileRuntimePreviewV2Assessment,
} from './mobile-runtime-preview-v2-types.js';
import type { MobileRuntimeVerificationRecord } from '../mobile-runtime-preview-v1/mobile-runtime-preview-types.js';

let assessmentCounter = 0;

export function resetMobileRuntimePreviewV2CounterForTests(): void {
  assessmentCounter = 0;
  resetAndroidRuntimeV2ForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `mobile-runtime-preview-v2-${assessmentCounter}`;
}

function buildAndroidVerificationRecord(
  evidence: Awaited<ReturnType<typeof runBoundedAndroidLaunch>>,
): MobileRuntimeVerificationRecord {
  const verified = evidence.verificationVerdict === 'VERIFIED';
  const launchSuccessful = evidence.launchSuccessful && Boolean(evidence.deviceSerial);
  return {
    runtimeId: 'ANDROID',
    detected: Boolean(evidence.adbPath),
    launchAttempted: evidence.launchAttempted || evidence.emulatorAlreadyRunning,
    launchSuccessful,
    verificationAttempted: evidence.launchAttempted || evidence.emulatorAlreadyRunning,
    verificationSuccessful: verified,
    unsupportedReason: verified ? null : evidence.blockerDetail,
    androidRuntimeState: verified ? 'DEVICE_RUNNING' : launchSuccessful ? 'LAUNCHABLE' : undefined,
  };
}

export async function assessMobileRuntimePreviewV2(
  input: AssessMobileRuntimePreviewV2Input,
): Promise<MobileRuntimePreviewV2Assessment> {
  const timeoutMs = input.androidLaunchTimeoutMs ?? DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS;
  const requestCleanup = Boolean(input.requestAndroidCleanup);

  const v1Baseline = await assessMobileRuntimePreviewV1({
    rootDir: input.rootDir,
    workspaceDir: input.workspaceDir,
    previewUrl: input.previewUrl,
  });

  const capabilityMatrix = await detectMobileRuntimeCapabilities(input.rootDir);

  const androidEvidence = await runBoundedAndroidLaunch({
    rootDir: input.rootDir,
    timeoutMs,
    requestCleanup,
  });

  const androidAdapter = new AndroidRuntimeAdapterV2({
    evidence: androidEvidence,
    requestCleanup,
    timeoutMs,
  });
  const androidAdapterStatus = androidAdapter.getStatus(capabilityMatrix);

  const verificationRecords = v1Baseline.verificationRecords.map((record) =>
    record.runtimeId === 'ANDROID' ? buildAndroidVerificationRecord(androidEvidence) : record,
  );

  const adapterStatuses = v1Baseline.adapterStatuses.map((status) =>
    status.runtimeId === 'ANDROID' ? androidAdapterStatus : status,
  );

  const realityBridge = assessMobileRuntimeRealityWithV2Evidence(
    input.rootDir,
    verificationRecords,
    androidEvidence,
  );

  const browserOk = verificationRecords.find((r) => r.runtimeId === 'BROWSER')?.verificationSuccessful;
  const mobileWebOk = verificationRecords.find((r) => r.runtimeId === 'MOBILE_WEB')?.verificationSuccessful;
  const androidVerified = androidEvidence.verificationVerdict === 'VERIFIED';

  const summary = [
    'MOBILE_RUNTIME_PREVIEW_V2 assessment complete.',
    browserOk ? 'Browser verified.' : 'Browser not verified.',
    mobileWebOk ? 'Mobile web verified.' : 'Mobile web not verified.',
    androidVerified
      ? `Android VERIFIED (${androidEvidence.deviceSerial}, API ${androidEvidence.deviceState.apiLevel ?? 'unknown'}).`
      : `Android bounded launch: ${androidEvidence.verificationVerdict} — ${androidEvidence.blockerDetail}`,
    `Reality score: ${realityBridge.realityAssessmentScore}/100.`,
  ].join(' ');

  return {
    assessmentId: nextAssessmentId(),
    v1Baseline,
    capabilityMatrix,
    verificationRecords,
    androidLaunchEvidence: androidEvidence,
    realityBridge,
    summary,
    assessedAt: Date.now(),
  };
}

export function writeMobileRuntimePreviewV2Artifacts(
  rootDir: string,
  assessment: MobileRuntimePreviewV2Assessment,
): { reportPath: string; artifactDir: string; evidencePath: string } {
  const artifactDir = join(rootDir, MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR);
  mkdirSync(artifactDir, { recursive: true });

  const evidencePath = join(artifactDir, ANDROID_EMULATOR_LAUNCH_EVIDENCE_FILENAME);
  writeFileSync(evidencePath, `${JSON.stringify(assessment.androidLaunchEvidence, null, 2)}\n`, 'utf8');

  const reportPath = join(rootDir, MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME);
  writeFileSync(reportPath, buildMobileRuntimePreviewV2ReportMarkdown(assessment), 'utf8');

  writeFileSync(
    join(artifactDir, 'verification-records.json'),
    `${JSON.stringify(assessment.verificationRecords, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(artifactDir, 'reality-bridge.json'),
    `${JSON.stringify(assessment.realityBridge, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(artifactDir, 'capability-matrix.json'),
    `${JSON.stringify(assessment.capabilityMatrix, null, 2)}\n`,
    'utf8',
  );

  return { reportPath, artifactDir, evidencePath };
}

export { MOBILE_RUNTIME_PREVIEW_V2_OWNER_MODULE };
