/**
 * MOBILE_RUNTIME_PREVIEW_V2 — bounded Android emulator launch validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANDROID_EMULATOR_LAUNCH_EVIDENCE_FILENAME,
  DOCUMENTED_ANDROID_VERDICTS,
  MOBILE_RUNTIME_PREVIEW_V2_ANDROID_UNAVAILABLE_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR,
  MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME,
  assessMobileRuntimePreviewV2,
  resetMobileRuntimePreviewV2CounterForTests,
  writeMobileRuntimePreviewV2Artifacts,
} from '../src/mobile-runtime-preview-v2/index.js';
import { resetMobileRuntimePreviewCounterForTests } from '../src/mobile-runtime-preview-v1/index.js';
import {
  resetMobileRuntimeExperienceHistoryForTests,
  resetMobileRuntimeExperienceRealityCounterForTests,
  resetMobileRuntimeExperienceRegistryForTests,
} from '../src/mobile-runtime-experience-reality/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const REQUIRED_FILES = [
  'src/mobile-runtime-preview-v2/index.ts',
  'src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-bounds.ts',
  'src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-types.ts',
  'src/mobile-runtime-preview-v2/android-emulator-launch-controller.ts',
  'src/mobile-runtime-preview-v2/android-runtime-adapter-v2.ts',
  'src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-reality-bridge.ts',
  'src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-report-builder.ts',
  'src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-authority.ts',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  const full = join(ROOT, relativePath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8').slice(0, 300_000);
}

async function main(): Promise<void> {
  console.log('');
  console.log('MOBILE_RUNTIME_PREVIEW_V2 — Validation');
  console.log('======================================');
  console.log('');

  resetMobileRuntimePreviewV2CounterForTests();
  resetMobileRuntimePreviewCounterForTests();
  resetMobileRuntimeExperienceRealityCounterForTests();
  resetMobileRuntimeExperienceRegistryForTests();
  resetMobileRuntimeExperienceHistoryForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }

  const controllerSource = readSource('src/mobile-runtime-preview-v2/android-emulator-launch-controller.ts');
  const adapterSource = readSource('src/mobile-runtime-preview-v2/android-runtime-adapter-v2.ts');
  const authoritySource = readSource('src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-authority.ts');
  const bridgeSource = readSource('src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-reality-bridge.ts');
  const pkg = JSON.parse(readSource('package.json') || '{}') as { scripts?: Record<string, string> };

  assert('pass token', readSource('src/mobile-runtime-preview-v2/mobile-runtime-preview-v2-bounds.ts').includes(MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN), MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN);
  assert('package script', Boolean(pkg.scripts?.['validate:mobile-runtime-preview-v2']), 'validate:mobile-runtime-preview-v2');
  assert('reuses V1 detection', authoritySource.includes('detectMobileRuntimeCapabilities') && authoritySource.includes('assessMobileRuntimePreviewV1'), 'v1 reuse');
  assert('launch controller exists', controllerSource.includes('AndroidEmulatorLaunchController'), 'controller');
  assert('detectRunningDevices', controllerSource.includes('detectRunningDevices'), 'detect devices');
  assert('waitForBootComplete', controllerSource.includes('waitForBootComplete'), 'boot wait');
  assert('shutdownIfStartedByAiDevEngine', controllerSource.includes('shutdownIfStartedByAiDevEngine'), 'safe shutdown');
  assert('reuse running emulator', controllerSource.includes('emulatorAlreadyRunning'), 'reuse');
  assert('no fake verify', !adapterSource.includes('verificationSuccessful: true') || adapterSource.includes("verificationVerdict === 'VERIFIED'"), 'honest verify');
  assert('reality bridge android evidence', bridgeSource.includes('androidRuntimeLaunchEvidence'), 'reality');
  assert('no duplicate preview dir', !existsSync(join(ROOT, 'src/mobile-runtime-preview-v3')), 'no v3 fork');

  console.log('Running bounded Android launch assessment (up to 120s)...');
  const assessment = await assessMobileRuntimePreviewV2({
    rootDir: ROOT,
    requestAndroidCleanup: false,
  });
  const { reportPath, evidencePath } = writeMobileRuntimePreviewV2Artifacts(ROOT, assessment);
  const ev = assessment.androidLaunchEvidence;
  const tc = assessment.capabilityMatrix.androidToolchain;
  const defaultWinSdk = join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
  const machineHasSdk = existsSync(defaultWinSdk);

  assert('evidence file written', existsSync(evidencePath), evidencePath);
  assert('report written', existsSync(reportPath), reportPath);
  assert('report at root', existsSync(join(ROOT, MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME)), MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME);
  assert('artifact dir', existsSync(join(ROOT, MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR)), MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR);
  assert('documented verdict', DOCUMENTED_ANDROID_VERDICTS.includes(ev.verificationVerdict), ev.verificationVerdict);
  assert('blocker recorded', ev.blockerDetail.length > 0, ev.blockerDetail.slice(0, 80));
  assert('reality bridge consumed', assessment.realityBridge.realityAssessmentId.length > 0, assessment.realityBridge.realityAssessmentId);

  if (machineHasSdk) {
    assert('sdk path resolved', Boolean(tc.sdkPath), tc.sdkPath ?? 'null');
    assert('adb path resolved', Boolean(tc.adbPath), tc.adbPath ?? 'null');
    assert('emulator path resolved', Boolean(tc.emulatorPath), tc.emulatorPath ?? 'null');
    assert('avd list recorded', Array.isArray(tc.avdList), String(tc.avdList.length));
    assert('android not PATH-only unsupported', assessment.verificationRecords.find((r) => r.runtimeId === 'ANDROID')?.detected !== false || !tc.adbPath, 'detected');
  }

  const browser = assessment.verificationRecords.find((r) => r.runtimeId === 'BROWSER');
  const mobileWeb = assessment.verificationRecords.find((r) => r.runtimeId === 'MOBILE_WEB');
  const android = assessment.verificationRecords.find((r) => r.runtimeId === 'ANDROID');
  const ios = assessment.verificationRecords.find((r) => r.runtimeId === 'IOS');
  const expo = assessment.verificationRecords.find((r) => r.runtimeId === 'EXPO');

  assert('browser verified', Boolean(browser?.verificationSuccessful), String(browser?.verificationSuccessful));
  assert('mobile web verified', Boolean(mobileWeb?.verificationSuccessful), String(mobileWeb?.verificationSuccessful));
  assert('ios unsupported on windows', process.platform !== 'win32' || !ios?.launchSuccessful, ios?.unsupportedReason ?? 'ok');
  assert(
    'expo not faked without project',
    !expo?.verificationSuccessful,
    String(expo?.verificationSuccessful),
  );

  if (ev.verificationVerdict === 'VERIFIED') {
    assert('android VERIFIED launch', Boolean(android?.launchSuccessful), String(android?.launchSuccessful));
    assert('android VERIFIED verify', Boolean(android?.verificationSuccessful), String(android?.verificationSuccessful));
    assert('android reality evidence', assessment.realityBridge.workspaceSignals.androidRuntimeLaunchEvidence, 'reality');
    assert('boot completed', ev.bootCompleted, String(ev.bootCompleted));
    assert('device serial', Boolean(ev.deviceSerial), ev.deviceSerial ?? 'null');
  } else {
    assert('android launch not faked', !android?.verificationSuccessful, String(android?.verificationSuccessful));
    assert('exact reason in evidence', ev.blockerDetail.length > 2, ev.blockerDetail.slice(0, 60));
  }

  const reportText = readSource(MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME);
  assert('report v2 sections', reportText.includes('V2 bounded Android launch') && reportText.includes('Final runtime matrix'), 'sections');
  assert('report toolchain paths', reportText.includes('adb path'), 'paths');

  const structuralFailed = results.filter((r) => !r.passed);
  const browserMobilePass = Boolean(browser?.verificationSuccessful && mobileWeb?.verificationSuccessful);
  const androidDocumented = DOCUMENTED_ANDROID_VERDICTS.includes(ev.verificationVerdict);

  console.log(`Checks: ${results.length} | Passed: ${results.length - structuralFailed.length} | Failed: ${structuralFailed.length}`);
  console.log('');
  console.log(`Summary: ${assessment.summary}`);
  console.log(`Android verdict: ${ev.verificationVerdict}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (structuralFailed.length) {
    console.log('MOBILE_RUNTIME_PREVIEW_V2_REQUIRES_FIXES');
    process.exit(1);
  }

  if (browserMobilePass && androidDocumented) {
    if (ev.verificationVerdict === 'VERIFIED') {
      console.log(MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN);
      process.exit(0);
    }
    console.log(MOBILE_RUNTIME_PREVIEW_V2_ANDROID_UNAVAILABLE_TOKEN);
    console.log(MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN);
    process.exit(0);
  }

  console.log('MOBILE_RUNTIME_PREVIEW_V2_REQUIRES_FIXES');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  console.log('MOBILE_RUNTIME_PREVIEW_V2_REQUIRES_FIXES');
  process.exit(1);
});
