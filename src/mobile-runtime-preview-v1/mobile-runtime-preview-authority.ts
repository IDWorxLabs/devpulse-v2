/**
 * Mobile Runtime Preview V1 — main orchestration authority.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME,
  MOBILE_RUNTIME_PREVIEW_V1_ARTIFACT_DIR,
  MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE,
  MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME,
} from './mobile-runtime-preview-bounds.js';
import { detectMobileRuntimeCapabilities } from './mobile-runtime-capability-registry.js';
import { buildMobileRuntimePreviewRegistry } from './mobile-runtime-preview-registry-builder.js';
import { assessMobileRuntimeRealityWithPreviewEvidence } from './mobile-runtime-reality-bridge.js';
import { buildMobileRuntimePreviewReportMarkdown } from './mobile-runtime-preview-report-builder.js';
import type {
  AssessMobileRuntimePreviewInput,
  MobileRuntimePreviewAssessment,
  MobileRuntimeVerificationRecord,
} from './mobile-runtime-preview-types.js';
import { createMobileRuntimeAdapterRegistry, shutdownAllRuntimeAdapters } from './runtime-adapters.js';

let assessmentCounter = 0;

export function resetMobileRuntimePreviewCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `mobile-runtime-preview-${assessmentCounter}`;
}

export async function assessMobileRuntimePreviewV1(
  input: AssessMobileRuntimePreviewInput,
): Promise<MobileRuntimePreviewAssessment> {
  const capabilityMatrix = await detectMobileRuntimeCapabilities(input.rootDir);
  const adapterRegistry = createMobileRuntimeAdapterRegistry();
  const adapterStatuses = adapterRegistry.getAllStatuses(capabilityMatrix);

  const verificationRecords: MobileRuntimeVerificationRecord[] = [];

  for (const adapter of adapterRegistry.adapters) {
    const launchInput = {
      rootDir: input.rootDir,
      workspaceDir: input.workspaceDir,
      previewUrl: input.previewUrl,
    };

    const launchResult = await adapter.launch(launchInput, capabilityMatrix);
    const verifyResult = await adapter.verify(launchInput, capabilityMatrix);
    await adapter.shutdown();

    const adapterStatus = adapterRegistry.getAdapter(adapter.runtimeId)?.getStatus(capabilityMatrix);
    const isAndroidDeferred =
      adapter.runtimeId === 'ANDROID' &&
      launchResult.launchAttempted &&
      !launchResult.launchSuccessful &&
      launchResult.unsupportedReason === 'LAUNCH_DEFERRED_PHASE_1';

    verificationRecords.push({
      runtimeId: adapter.runtimeId,
      detected: launchResult.detected || verifyResult.detected,
      launchAttempted: launchResult.launchAttempted,
      launchSuccessful: launchResult.launchSuccessful,
      verificationAttempted: verifyResult.verificationAttempted,
      verificationSuccessful: verifyResult.verificationSuccessful,
      unsupportedReason: isAndroidDeferred ? null : (launchResult.unsupportedReason ?? verifyResult.unsupportedReason),
      androidRuntimeState:
        adapter.runtimeId === 'ANDROID'
          ? isAndroidDeferred
            ? 'LAUNCH_DEFERRED_PHASE_1'
            : capabilityMatrix.androidToolchain.androidRuntimeState
          : undefined,
    });
  }

  await shutdownAllRuntimeAdapters();

  const registry = buildMobileRuntimePreviewRegistry(adapterStatuses);
  const realityBridge = assessMobileRuntimeRealityWithPreviewEvidence(input.rootDir, verificationRecords);

  const browserOk = verificationRecords.find((r) => r.runtimeId === 'BROWSER')?.verificationSuccessful;
  const mobileWebOk = verificationRecords.find((r) => r.runtimeId === 'MOBILE_WEB')?.verificationSuccessful;
  const nativeUnsupported = verificationRecords
    .filter((r) => ['ANDROID', 'IOS', 'EXPO'].includes(r.runtimeId))
    .every((r) => !r.launchSuccessful);

  const androidAdapter = adapterStatuses.find((s) => s.runtimeId === 'ANDROID');
  const androidDeferred = verificationRecords.find((r) => r.runtimeId === 'ANDROID');

  const summary = [
    'MOBILE_RUNTIME_PREVIEW_V1 Phase 1 assessment complete.',
    browserOk ? 'Browser runtime verified.' : 'Browser runtime not verified.',
    mobileWebOk ? 'Mobile web runtime verified.' : 'Mobile web runtime not verified.',
    androidAdapter?.launchable
      ? `Android runtime detected/launchable-deferred (state: ${androidDeferred?.androidRuntimeState ?? capabilityMatrix.androidToolchain.androidRuntimeState}).`
      : androidAdapter?.available
        ? 'Android toolchain detected; launch blocked pending AVD or device.'
        : 'Android runtime unsupported — toolchain not detected.',
    nativeUnsupported && !androidAdapter?.launchable
      ? 'Other native runtimes (iOS/Expo) honestly reported as unsupported or deferred.'
      : !androidAdapter?.launchable && nativeUnsupported
        ? 'Native runtimes (Android/iOS/Expo) honestly reported as unsupported or deferred.'
        : '',
    `Reality score via mobile-runtime-experience-reality: ${realityBridge.realityAssessmentScore}/100.`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    assessmentId: nextAssessmentId(),
    capabilityMatrix,
    adapterStatuses,
    verificationRecords,
    registry,
    realityBridge,
    summary,
    assessedAt: Date.now(),
  };
}

export function writeMobileRuntimePreviewArtifacts(
  rootDir: string,
  assessment: MobileRuntimePreviewAssessment,
): { registryPath: string; reportPath: string; artifactDir: string } {
  const artifactDir = join(rootDir, MOBILE_RUNTIME_PREVIEW_V1_ARTIFACT_DIR);
  mkdirSync(artifactDir, { recursive: true });

  const registryPath = join(rootDir, MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME);
  writeFileSync(registryPath, `${JSON.stringify(assessment.registry, null, 2)}\n`, 'utf8');

  const reportPath = join(rootDir, MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME);
  writeFileSync(reportPath, buildMobileRuntimePreviewReportMarkdown(assessment), 'utf8');

  writeFileSync(
    join(artifactDir, 'capability-matrix.json'),
    `${JSON.stringify(assessment.capabilityMatrix, null, 2)}\n`,
    'utf8',
  );
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

  return { registryPath, reportPath, artifactDir };
}

export { MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE };
