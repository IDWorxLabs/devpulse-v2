/**
 * Phase 24C.5 — Mobile Runtime Experience Reality validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS_TOKEN,
  MOBILE_RUNTIME_NEVER_PROOF,
  analyzeAndroidRuntimeReality,
  analyzeDeviceFrameReality,
  analyzeMobileExperienceCompleteness,
  assessMobileRuntimeExperienceReality,
  buildMobileRuntimeWorkspaceSignalsForValidation,
  detectMobileRuntimeModulePresenceEvidence,
  getMobileRuntimeHistoryCount,
  getMobileRuntimeRegistryCount,
  resetMobileRuntimeExperienceHistoryForTests,
  resetMobileRuntimeExperienceRealityCounterForTests,
  resetMobileRuntimeExperienceRegistryForTests,
  runAllMobileRuntimeAnalyzers,
  writeMobileRuntimeExperienceRealityReportFile,
} from '../src/mobile-runtime-experience-reality/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const STATIC_SCAN_FILES = [
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-types.ts',
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-analyzers.ts',
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-authority.ts',
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-bounds.ts',
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-registry.ts',
  'src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-history.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts',
  'server/execution-proof-handler.ts',
  'public/founder-reality/app.js',
  'package.json',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 256_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Mobile Runtime Experience Reality — Validation (leaf mode)');
  console.log('============================================================');
  console.log('');

  checkpoint('start');
  resetMobileRuntimeExperienceRealityCounterForTests();
  resetMobileRuntimeExperienceRegistryForTests();
  resetMobileRuntimeExperienceHistoryForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const types = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-types.ts') ?? '';
  const analyzers = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-analyzers.ts') ?? '';
  const authority = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-authority.ts') ?? '';
  const bounds = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-bounds.ts') ?? '';
  const registry = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-registry.ts') ?? '';
  const history = fileTexts.get('src/mobile-runtime-experience-reality/mobile-runtime-experience-reality-history.ts') ?? '';
  const workflow = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts') ?? '';
  const proofHandler = fileTexts.get('server/execution-proof-handler.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. module exists', existsSync(join(ROOT, 'src/mobile-runtime-experience-reality/index.ts')), 'module');
  assert('02. analyzers exist', analyzers.includes('analyzeDeviceFrameReality') && analyzers.includes('analyzeMobileExperienceCompleteness'), 'analyzers');
  assert('03. authority exists', authority.includes('assessMobileRuntimeExperienceReality') && authority.includes('mobileRuntimeExperienceScore'), 'authority');
  assert('04. report generation', authority.includes('buildMobileRuntimeExperienceRealityReport') && authority.includes('writeMobileRuntimeExperienceRealityReportFile'), 'report');
  assert('05. dashboard integration', proofHandler.includes('mobileRuntimeExperience') && appJs.includes('Mobile Runtime Experience'), 'dashboard');
  assert('06. founder reality integration', workflow.includes('mobile-runtime-experience-reality'), 'workflow');
  assert('07. phone image not proof', bounds.includes('Phone image exists') && authority.includes('phone image'), 'phone rule');
  assert('08. roadmap not proof', bounds.includes('Roadmap item exists') && authority.includes('roadmap'), 'roadmap rule');
  assert('09. evidence-only scoring', authority.includes('No future-state scoring') && authority.includes('Evidence only'), 'evidence');
  assert('10. no emulator launch', !authority.includes('emulator.launch') && !authority.includes('spawnSync') && !analyzers.includes('execSync'), 'emulator');
  assert('11. no expo launch', !authority.includes('expo start') && !authority.includes('npx expo'), 'expo');
  assert('12. no runtime execution', !authority.includes('buildProductWorkspaceSnapshot') && !authority.includes('assessFounderSensemaking'), 'runtime');
  assert('13. bounded registry', registry.includes('MAX_REGISTRY_ENTRIES') && bounds.includes('MAX_REGISTRY_ENTRIES = 16'), 'registry');
  assert('14. bounded history', history.includes('MAX_HISTORY_ENTRIES') && bounds.includes('MAX_HISTORY_ENTRIES = 32'), 'history');
  assert('15. package script', Boolean(pkg.scripts?.['validate:mobile-runtime-experience-reality']), 'package');
  assert('16. assessment types', types.includes('MobileRuntimeExperienceRealityAssessment') && types.includes('MobileRuntimeReport'), 'types');
  assert('17. device frame analyzer', analyzers.includes('DEVICE_FRAME_PROVEN') && analyzers.includes('DEVICE_FRAME_PARTIAL'), 'device');
  assert('18. android analyzer', analyzers.includes('ANDROID_RUNTIME_MISSING') && analyzers.includes('ANDROID_RUNTIME_PROVEN'), 'android');
  assert('19. cloud analyzer', analyzers.includes('analyzeCloudDeviceRuntimeReality') && analyzers.includes('CLOUD_RUNTIME_MISSING'), 'cloud');
  assert('20. pass token', bounds.includes("MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS"), 'token');
  checkpoint('static checks complete');

  const moduleEvidence = detectMobileRuntimeModulePresenceEvidence(ROOT);
  const leafInput = {
    rootDir: ROOT,
    workspace: buildMobileRuntimeWorkspaceSignalsForValidation(),
    moduleEvidence,
  };

  assert('21. module detection', moduleEvidence.hasMobileRuntimeExperienceReality, 'detected');
  assert('22. extension points', moduleEvidence.mobileExtensionPointsReserved, 'extensions');

  const leafAnalyzers = runAllMobileRuntimeAnalyzers(leafInput);
  assert('23. android not proven leaf', leafAnalyzers.androidRuntimeReality !== 'ANDROID_RUNTIME_PROVEN', leafAnalyzers.androidRuntimeReality);
  assert('24. ios not proven leaf', leafAnalyzers.iosRuntimeReality !== 'IOS_RUNTIME_PROVEN', leafAnalyzers.iosRuntimeReality);
  assert('25. experience not proven', leafAnalyzers.mobileExperienceCompleteness !== 'MOBILE_EXPERIENCE_PROVEN', leafAnalyzers.mobileExperienceCompleteness);

  const provenInput = {
    ...leafInput,
    workspace: buildMobileRuntimeWorkspaceSignalsForValidation({
      deviceFramePreviewActive: true,
      mobilePreviewLaunchEvidence: true,
      touchSimulationEvidence: true,
      androidRuntimeLaunchEvidence: true,
      iosRuntimeLaunchEvidence: true,
      expoRuntimeLaunchEvidence: true,
      cloudDeviceSessionEvidence: true,
    }),
  };
  assert('26. proven signals upgrade', analyzeDeviceFrameReality(provenInput) === 'DEVICE_FRAME_PROVEN', 'device');
  assert('27. android proven signal', analyzeAndroidRuntimeReality(provenInput) === 'ANDROID_RUNTIME_PROVEN', 'android');
  assert('28. completeness proven', analyzeMobileExperienceCompleteness(provenInput) === 'MOBILE_EXPERIENCE_PROVEN', 'experience');

  const assessment = assessMobileRuntimeExperienceReality(ROOT);
  checkpoint('assessment complete');
  assert('29. score bounded', assessment.mobileRuntimeExperienceScore >= 0 && assessment.mobileRuntimeExperienceScore <= 100, String(assessment.mobileRuntimeExperienceScore));
  assert('30. honest low score', assessment.mobileRuntimeExperienceScore < 60, String(assessment.mobileRuntimeExperienceScore));
  assert('31. founder conclusion honest', assessment.founderConclusion.toLowerCase().includes('no') || assessment.founderConclusion.toLowerCase().includes('not'), 'honest');
  assert('32. registry populated', getMobileRuntimeRegistryCount() >= 1, String(getMobileRuntimeRegistryCount()));
  assert('33. history populated', getMobileRuntimeHistoryCount() >= 1, String(getMobileRuntimeHistoryCount()));

  const reportPath = writeMobileRuntimeExperienceRealityReportFile(ROOT, assessment);
  assert('34. report file written', existsSync(reportPath), reportPath);
  const reportText = readBoundedText('architecture/MOBILE_RUNTIME_EXPERIENCE_REALITY_REPORT.md', 64_000);
  assert('35. report sections', reportText.includes('Executive Summary') && reportText.includes('Capability Matrix') && reportText.includes('Founder Conclusion'), 'sections');
  assert('36. never proof list', MOBILE_RUNTIME_NEVER_PROOF.length >= 6, String(MOBILE_RUNTIME_NEVER_PROOF.length));
  assert('37. matrix rows', assessment.capabilityMatrix.length >= 7, String(assessment.capabilityMatrix.length));
  assert('38. blockers ranked', assessment.mobileRuntimeBlockers.length >= 1, String(assessment.mobileRuntimeBlockers.length));

  checkpoint('runtime checks complete');

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  console.log(`Mobile Runtime Experience Score: ${assessment.mobileRuntimeExperienceScore}/100`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('MOBILE_RUNTIME_EXPERIENCE_REALITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('MOBILE_RUNTIME_EXPERIENCE_REALITY_REQUIRES_FIXES');
  process.exit(1);
}
