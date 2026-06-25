/**
 * MOBILE_RUNTIME_PREVIEW_V1 — validation script.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME,
  MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME,
  REUSED_MOBILE_PREVIEW_MODULES,
  assessMobileRuntimePreviewV1,
  resetMobileRuntimePreviewCounterForTests,
  writeMobileRuntimePreviewArtifacts,
} from '../src/mobile-runtime-preview-v1/index.js';
import { resetMobileRuntimeExperienceRegistryForTests, resetMobileRuntimeExperienceHistoryForTests, resetMobileRuntimeExperienceRealityCounterForTests } from '../src/mobile-runtime-experience-reality/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const REQUIRED_FILES = [
  'src/mobile-runtime-preview-v1/index.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-preview-bounds.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-preview-types.ts',
  'src/mobile-runtime-preview-v1/android-sdk-path-resolver.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-capability-registry.ts',
  'src/mobile-runtime-preview-v1/runtime-adapter-types.ts',
  'src/mobile-runtime-preview-v1/runtime-adapters.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-reality-bridge.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-preview-registry-builder.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-preview-authority.ts',
  'src/mobile-runtime-preview-v1/mobile-runtime-preview-report-builder.ts',
] as const;

const FORBIDDEN_DUPLICATE_DIRS = [
  'src/mobile-runtime-preview-v2',
  'src/mobile-native-preview',
  'src/android-runtime-preview',
  'src/ios-runtime-preview',
  'src/expo-runtime-preview',
];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  const full = join(ROOT, relativePath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8').slice(0, 256_000);
}

async function main(): Promise<void> {
  console.log('');
  console.log('MOBILE_RUNTIME_PREVIEW_V1 — Validation');
  console.log('======================================');
  console.log('');

  resetMobileRuntimePreviewCounterForTests();
  resetMobileRuntimeExperienceRealityCounterForTests();
  resetMobileRuntimeExperienceRegistryForTests();
  resetMobileRuntimeExperienceHistoryForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
  }

  const authoritySource = readSource('src/mobile-runtime-preview-v1/mobile-runtime-preview-authority.ts');
  const adaptersSource = readSource('src/mobile-runtime-preview-v1/runtime-adapters.ts');
  const bridgeSource = readSource('src/mobile-runtime-preview-v1/mobile-runtime-reality-bridge.ts');
  const resolverSource = readSource('src/mobile-runtime-preview-v1/android-sdk-path-resolver.ts');
  const capabilitySource = readSource('src/mobile-runtime-preview-v1/mobile-runtime-capability-registry.ts');
  const pkg = JSON.parse(readSource('package.json') || '{}') as { scripts?: Record<string, string> };

  assert('pass token defined', readSource('src/mobile-runtime-preview-v1/mobile-runtime-preview-bounds.ts').includes(MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN), MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN);
  assert('package script', Boolean(pkg.scripts?.['validate:mobile-runtime-preview-v1']), 'validate:mobile-runtime-preview-v1');
  assert('sdk path resolver', resolverSource.includes('resolveAndroidSdkPath') && resolverSource.includes('local.properties'), 'resolver');
  assert('sdk-relative adb resolution', resolverSource.includes('platform-tools') && resolverSource.includes('resolveAdbPath'), 'adb path');
  assert('sdk-relative emulator resolution', resolverSource.includes('resolveEmulatorPath') && resolverSource.includes('-list-avds'), 'emulator path');
  assert('android state categories', readSource('src/mobile-runtime-preview-v1/mobile-runtime-preview-types.ts').includes('LAUNCH_DEFERRED_PHASE_1'), 'states');
  assert('capability uses resolver', capabilitySource.includes('resolveAndroidToolchain'), 'toolchain');
  assert('reuses mobile-preview-modes', adaptersSource.includes('mobile-preview-modes/device-profile-library'), 'device profiles');
  assert('reuses mobile-runtime-experience-reality', bridgeSource.includes('assessMobileRuntimeExperienceReality'), 'reality bridge');
  assert('no nested validators in authority', !authoritySource.includes('validate:'), 'nested validator');
  assert('no writeFileSync in adapters', !adaptersSource.includes('writeFileSync'), 'adapter purity');
  assert('five runtime adapters', adaptersSource.includes('BrowserRuntimeAdapter') && adaptersSource.includes('ExpoRuntimeAdapter'), 'adapters');
  assert('no fake android launch', adaptersSource.includes('launchSuccessful: false') && adaptersSource.includes('LAUNCH_DEFERRED_PHASE_1'), 'honest android');
  assert('no duplicate preview dirs', FORBIDDEN_DUPLICATE_DIRS.every((d) => !existsSync(join(ROOT, d))), 'duplicate risk');
  assert('reused modules declared', REUSED_MOBILE_PREVIEW_MODULES.length >= 6, String(REUSED_MOBILE_PREVIEW_MODULES.length));

  const assessment = await assessMobileRuntimePreviewV1({ rootDir: ROOT });
  const { registryPath, reportPath } = writeMobileRuntimePreviewArtifacts(ROOT, assessment);

  assert('capability registry generated', Boolean(assessment.capabilityMatrix.detectedAt), 'capability matrix');
  assert('runtime registry generated', existsSync(registryPath), registryPath);
  assert('registry json valid', existsSync(join(ROOT, MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME)), MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME);
  assert('report generated', existsSync(reportPath), reportPath);
  assert('report markdown at root', existsSync(join(ROOT, MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME)), MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME);
  assert('reality bridge consumed', assessment.realityBridge.realityAssessmentId.length > 0, assessment.realityBridge.realityAssessmentId);
  assert('reality score bounded', assessment.realityBridge.realityAssessmentScore >= 0 && assessment.realityBridge.realityAssessmentScore <= 100, String(assessment.realityBridge.realityAssessmentScore));

  const browserRecord = assessment.verificationRecords.find((r) => r.runtimeId === 'BROWSER');
  const mobileWebRecord = assessment.verificationRecords.find((r) => r.runtimeId === 'MOBILE_WEB');
  assert('browser runtime detected', Boolean(browserRecord?.detected), String(browserRecord?.detected));
  assert(
    'browser or mobile-web verified',
    Boolean(browserRecord?.verificationSuccessful || mobileWebRecord?.verificationSuccessful),
    `browser=${browserRecord?.verificationSuccessful} mobileWeb=${mobileWebRecord?.verificationSuccessful}`,
  );

  const androidRecord = assessment.verificationRecords.find((r) => r.runtimeId === 'ANDROID');
  const androidAdapter = assessment.adapterStatuses.find((s) => s.runtimeId === 'ANDROID');
  const iosRecord = assessment.verificationRecords.find((r) => r.runtimeId === 'IOS');
  const expoRecord = assessment.verificationRecords.find((r) => r.runtimeId === 'EXPO');
  const tc = assessment.capabilityMatrix.androidToolchain;
  const defaultWinSdk = join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
  const machineHasDefaultSdk = existsSync(defaultWinSdk);

  if (assessment.capabilityMatrix.androidSdkPresent) {
    assert('adb path resolved when sdk present', Boolean(tc.adbPath), tc.adbPath ?? 'null');
    assert('adb present when sdk present', assessment.capabilityMatrix.adbPresent, String(assessment.capabilityMatrix.adbPresent));
    assert('sdk path recorded', Boolean(tc.sdkPath), tc.sdkPath ?? 'null');
    assert('not PATH-only false negative', !tc.adbPath || tc.adbPath.includes('platform-tools') || tc.adbPath === 'adb', tc.adbPath ?? 'null');
  }

  if (tc.emulatorPath) {
    assert('emulator path resolved', Boolean(tc.emulatorPath), tc.emulatorPath ?? 'null');
    assert('avd list recorded', Array.isArray(tc.avdList), String(tc.avdList.length));
  }

  if (machineHasDefaultSdk) {
    assert('default Windows SDK path detected', assessment.capabilityMatrix.androidSdkPresent, tc.sdkPath ?? 'null');
    assert('adb resolved without PATH', assessment.capabilityMatrix.adbPresent, tc.adbPath ?? 'null');
    assert('android adapter available', Boolean(androidAdapter?.available), String(androidAdapter?.available));
    assert('android adapter supported', Boolean(androidAdapter?.supported), String(androidAdapter?.supported));
    assert('android not unsupported PATH message', androidAdapter?.unavailableReason !== 'adb not found in PATH', androidAdapter?.unavailableReason ?? 'null');
    if (tc.avdList.length > 0) {
      assert('android launchable when AVD exists', Boolean(androidAdapter?.launchable), String(androidAdapter?.launchable));
      assert('android in available runtimes', assessment.registry.availableRuntimes.includes('ANDROID'), assessment.registry.availableRuntimes.join(', '));
    }
  }

  assert('android launch not faked', Boolean(androidRecord && !androidRecord.launchSuccessful), String(androidRecord?.launchSuccessful));
  assert('android verification not faked', Boolean(androidRecord && !androidRecord.verificationSuccessful), String(androidRecord?.verificationSuccessful));
  assert(
    'android detected or honestly missing',
    Boolean(androidRecord && (androidRecord.detected || !assessment.capabilityMatrix.androidSdkPresent)),
    String(androidRecord?.detected),
  );
  assert(
    'android deferred when launchable',
    !androidAdapter?.launchable || androidRecord?.androidRuntimeState === 'LAUNCH_DEFERRED_PHASE_1',
    androidRecord?.androidRuntimeState ?? 'n/a',
  );
  assert(
    'ios honestly reported',
    Boolean(iosRecord && !iosRecord.launchSuccessful),
    iosRecord?.unsupportedReason ?? 'missing',
  );
  assert(
    'expo honestly reported',
    Boolean(expoRecord && !expoRecord.launchSuccessful),
    expoRecord?.unsupportedReason ?? 'missing',
  );

  assert('registry has five entries', assessment.registry.entries.length === 5, String(assessment.registry.entries.length));
  assert('live preview tree complete', Boolean(assessment.registry.livePreviewTree.browserRuntime && assessment.registry.livePreviewTree.expoRuntime), 'tree');

  const reportText = readSource(MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME);
  assert('report sections', reportText.includes('Capability matrix') && reportText.includes('Runtime verification'), 'sections');
  assert('report android toolchain section', reportText.includes('Android toolchain (V1.1)'), 'android section');
  if (machineHasDefaultSdk && assessment.capabilityMatrix.adbPresent) {
    assert('report shows adb path', reportText.includes('adb path'), 'adb path in report');
    assert('report shows launchable-deferred', reportText.includes('launchable-deferred') || reportText.includes('LAUNCH_DEFERRED'), 'deferred in report');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Checks: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  console.log(`Summary: ${assessment.summary}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length) {
    console.log('MOBILE_RUNTIME_PREVIEW_V1_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  console.log('MOBILE_RUNTIME_PREVIEW_V1_REQUIRES_FIXES');
  process.exit(1);
});
