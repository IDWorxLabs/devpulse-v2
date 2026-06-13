/**
 * Phase 26.27 — Mobile Preview Modes V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEVICE_PROFILES,
  MOBILE_PREVIEW_MODES_V1_PASS,
  MAX_MOBILE_PREVIEW_HISTORY,
  analyzeDeviceCompatibility,
  analyzeMobileNavigation,
  analyzeMobilePreviewModes,
  analyzePreviewLayouts,
  assessMobilePreviewModes,
  buildMobilePreviewModesArtifacts,
  consolidatePreviewEvidence,
  detectResponsiveRisks,
  getAllDeviceProfileIds,
  getMobilePreviewHistorySize,
  resetMobilePreviewHistoryForTests,
  resetMobilePreviewModesModuleForTests,
} from '../src/mobile-preview-modes/index.js';

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

const REQUIRED = [
  'src/mobile-preview-modes/mobile-preview-types.ts',
  'src/mobile-preview-modes/mobile-preview-registry.ts',
  'src/mobile-preview-modes/device-profile-library.ts',
  'src/mobile-preview-modes/preview-layout-analyzer.ts',
  'src/mobile-preview-modes/responsive-risk-detector.ts',
  'src/mobile-preview-modes/mobile-navigation-analyzer.ts',
  'src/mobile-preview-modes/device-compatibility-analyzer.ts',
  'src/mobile-preview-modes/mobile-preview-history.ts',
  'src/mobile-preview-modes/mobile-preview-report-builder.ts',
  'src/mobile-preview-modes/mobile-preview-authority.ts',
  'src/mobile-preview-modes/index.ts',
  'architecture/MOBILE_PREVIEW_MODES_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const visualFixture = {
  readOnly: true as const,
  analysisId: 'visual-fixture-1',
  uploadId: null,
  filename: 'mobile-dashboard.png',
  analyzedAt: new Date().toISOString(),
  imageMetadata: {
    readOnly: true as const,
    format: 'PNG' as const,
    width: 375,
    height: 812,
    aspectRatio: 375 / 812,
    byteLength: 12000,
  },
  screenDetection: {
    readOnly: true as const,
    screenCountEstimate: 3,
    screenType: 'DASHBOARD' as const,
    platform: 'MOBILE' as const,
    classification: 'DASHBOARD' as const,
    evidence: ['VIEWPORT_WIDTH_375', 'PLATFORM_MOBILE'],
  },
  layoutRegions: [
    { readOnly: true as const, region: 'HEADER' as const, confidence: 70, evidence: ['TOP_BAND'] },
    { readOnly: true as const, region: 'NAVIGATION' as const, confidence: 75, evidence: ['BOTTOM_BAND'] },
    { readOnly: true as const, region: 'CARDS' as const, confidence: 65, evidence: ['CARD_BLOCKS'] },
    { readOnly: true as const, region: 'SIDEBAR' as const, confidence: 58, evidence: ['LEFT_BAND'] },
  ],
  detectedComponents: [
    { readOnly: true as const, token: 'HEADER_DETECTED' as const, confidence: 70, evidence: [] },
    { readOnly: true as const, token: 'BOTTOM_NAVIGATION_DETECTED' as const, confidence: 75, evidence: [] },
    { readOnly: true as const, token: 'CARD_DETECTED' as const, confidence: 65, evidence: [] },
    { readOnly: true as const, token: 'SIDEBAR_DETECTED' as const, confidence: 58, evidence: [] },
    { readOnly: true as const, token: 'MODAL_DETECTED' as const, confidence: 60, evidence: [] },
    { readOnly: true as const, token: 'BUTTON_GROUP_DETECTED' as const, confidence: 62, evidence: [] },
  ],
  inferredFlows: [
    { readOnly: true as const, flow: 'DASHBOARD' as const, confidence: 68, evidence: [] },
    { readOnly: true as const, flow: 'ONBOARDING' as const, confidence: 50, evidence: [] },
    { readOnly: true as const, flow: 'SETTINGS' as const, confidence: 55, evidence: [] },
  ],
  completeness: {
    readOnly: true as const,
    visualCompletenessScore: 78,
    missingScreens: [],
    incompleteFlows: [],
    navigationGaps: [],
    uxRisks: [],
  },
  confidenceScore: 72,
  recommendations: [],
};

const completenessFixture = {
  readOnly: true as const,
  analysisId: 'req-fixture-1',
  analyzedAt: new Date().toISOString(),
  evidence: {
    readOnly: true as const,
    sources: ['TYPED_PROMPT', 'VISUAL_REFERENCE_INTELLIGENCE'],
    screens: ['dashboard', 'settings', 'onboarding', 'checkout'],
    userRoles: ['user', 'admin'],
    workflows: ['onboarding', 'checkout', 'authentication'],
    businessRules: ['Admin must approve checkout'],
    integrations: ['Stripe'],
    notifications: ['push notification'],
    authentication: ['OAuth', 'login'],
    dataEntities: ['user', 'order'],
    platformTargets: ['IOS', 'ANDROID', 'WEB'],
    inferredFlows: ['DASHBOARD', 'CHECKOUT'],
    visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
    productType: 'MOBILE_APP',
  },
  domainResults: [],
  completenessScore: 76,
  completenessCategory: 'READY_WITH_GAPS' as const,
  readinessScore: 74,
  projectRequirementReadiness: 'READY_WITH_GAPS' as const,
  missingRequirements: [],
  riskLevel: 'MEDIUM' as const,
  confidenceScore: 70,
  clarifyingQuestions: [],
  safeToProceed: false,
};

resetMobilePreviewModesModuleForTests();
resetMobilePreviewHistoryForTests();

assert('A device profile count', DEVICE_PROFILES.length === 10, `${DEVICE_PROFILES.length}`);
assert(
  'A all profile ids',
  getAllDeviceProfileIds().length === 10 &&
    getAllDeviceProfileIds().includes('IPHONE_STANDARD') &&
    getAllDeviceProfileIds().includes('DESKTOP_WIDE'),
  getAllDeviceProfileIds().join(', '),
);

const insufficient = analyzeMobilePreviewModes({});
assert('B insufficient evidence rejected', insufficient == null, 'null');

const evidence = consolidatePreviewEvidence({
  visualReferenceAnalysis: visualFixture,
  requirementCompletenessAnalysis: completenessFixture,
  projectUnderstanding: {
    readOnly: true,
    productType: 'MOBILE_APP',
    platformTargets: ['IOS', 'ANDROID'],
    keyWorkflows: ['onboarding', 'checkout'],
    featureInventory: ['Screen: dashboard', 'Integration: Stripe'],
    confidenceScore: 80,
  },
});
assert('C evidence consolidated', evidence != null, String(evidence != null));

const layouts = analyzePreviewLayouts(DEVICE_PROFILES, evidence!);
assert('C layout behaviors', layouts.length === 10, `${layouts.length}`);

const risks = detectResponsiveRisks({
  evidence: evidence!,
  profiles: DEVICE_PROFILES,
  layoutBehaviors: layouts,
});
assert('D risk detection', risks.riskCount >= 1, `${risks.riskCount}`);
assert(
  'D responsive risk types',
  risks.risks.some((r) => r.riskType === 'NAVIGATION_CROWDING' || r.riskType === 'DASHBOARD_DENSITY_ISSUE' || r.riskType === 'TOUCH_TARGET_ISSUE'),
  risks.risks.map((r) => r.riskType).join(', '),
);

const navigation = analyzeMobileNavigation(evidence!);
assert(
  'E navigation review score bounded',
  navigation.navigationUsabilityScore >= 0 && navigation.navigationUsabilityScore <= 100,
  String(navigation.navigationUsabilityScore),
);
assert('E bottom nav detected', navigation.bottomNavigationPresent === true, String(navigation.bottomNavigationPresent));

const compatibility = analyzeDeviceCompatibility({
  evidence: evidence!,
  layoutBehaviors: layouts,
  responsiveRiskAnalysis: risks,
});
assert('F compatibility categories', compatibility.length === 4, `${compatibility.length}`);
assert(
  'F compatibility scores bounded',
  compatibility.every((c) => c.deviceCompatibilityScore >= 0 && c.deviceCompatibilityScore <= 100),
  'yes',
);
assert(
  'F profile scores per category',
  compatibility.every((c) => c.profileScores.length >= 2),
  'yes',
);

const analysis = analyzeMobilePreviewModes({
  visualReferenceAnalysis: visualFixture,
  requirementCompletenessAnalysis: completenessFixture,
  projectUnderstanding: {
    readOnly: true,
    productType: 'MOBILE_APP',
    platformTargets: ['IOS', 'ANDROID', 'WEB'],
    keyWorkflows: ['onboarding', 'checkout', 'authentication'],
    featureInventory: ['Screen: dashboard', 'Workflow: checkout'],
    confidenceScore: 80,
  },
});
assert('G full analysis produced', analysis != null, String(analysis != null));
assert(
  'G readiness scoring bounded',
  analysis != null &&
    analysis.previewReadinessScore >= 0 &&
    analysis.previewReadinessScore <= 100,
  String(analysis?.previewReadinessScore),
);
assert(
  'G readiness category',
  analysis != null &&
    (analysis.mobilePreviewReadiness === 'HIGH_RISK' ||
      analysis.mobilePreviewReadiness === 'READY_WITH_ADJUSTMENTS' ||
      analysis.mobilePreviewReadiness === 'READY_FOR_PREVIEW' ||
      analysis.mobilePreviewReadiness === 'NOT_READY'),
  analysis?.mobilePreviewReadiness ?? 'none',
);
assert('G recommendations generated', analysis != null && analysis.deviceRecommendations.length >= 1, `${analysis?.deviceRecommendations.length ?? 0}`);
assert('G all profiles in analysis', analysis != null && analysis.deviceProfilesAnalyzed.length === 10, `${analysis?.deviceProfilesAnalyzed.length ?? 0}`);

resetMobilePreviewHistoryForTests();
for (let i = 0; i < MAX_MOBILE_PREVIEW_HISTORY + 5; i += 1) {
  analyzeMobilePreviewModes({
    visualReferenceAnalysis: { ...visualFixture, analysisId: `visual-${i}` },
    requirementCompletenessAnalysis: completenessFixture,
    skipHistoryRecording: false,
  });
}
assert(
  'H history bounded',
  getMobilePreviewHistorySize() <= MAX_MOBILE_PREVIEW_HISTORY,
  `${getMobilePreviewHistorySize()}/${MAX_MOBILE_PREVIEW_HISTORY}`,
);

const assessment = assessMobilePreviewModes({
  visualReferenceAnalysis: visualFixture,
  requirementCompletenessAnalysis: completenessFixture,
  skipHistoryRecording: true,
});
assert('I advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('I orchestration complete', assessment.orchestrationState === 'MOBILE_PREVIEW_MODES_COMPLETE', assessment.orchestrationState);

const artifacts = buildMobilePreviewModesArtifacts({
  analyses: analysis ? [analysis] : [],
});
assert('J report markdown', artifacts.markdown.includes('Mobile Preview Modes Report'), 'yes');
assert('J device analysis in report', artifacts.markdown.includes('Device Analysis'), 'yes');
assert('J responsive risks in report', artifacts.markdown.includes('Responsive Risks'), 'yes');
assert('J navigation review in report', artifacts.markdown.includes('Navigation Review'), 'yes');

writeFileSync(join(ROOT, 'architecture/MOBILE_PREVIEW_MODES_REPORT.md'), artifacts.markdown, 'utf8');
assert('J report written', existsSync(join(ROOT, 'architecture/MOBILE_PREVIEW_MODES_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/mobile-preview-modes/mobile-preview-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/mobile-preview-modes/mobile-preview-registry.ts'), 'utf8');
assert(
  'K read-only safeguards',
  registrySource.includes('NO_EMULATOR_LAUNCH') &&
    registrySource.includes('NO_RUNTIME_ENVIRONMENT_CREATION') &&
    registrySource.includes('NO_DEPLOYMENT') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('K advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/MOBILE_PREVIEW_MODES_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(MOBILE_PREVIEW_MODES_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('L no validator recursion marker', !authoritySource.includes('validate-mobile-preview-modes'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Mobile Preview Modes V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getMobilePreviewHistorySize()}`);
  console.log(`Report path: architecture/MOBILE_PREVIEW_MODES_REPORT.md`);
  console.log(`\n${MOBILE_PREVIEW_MODES_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
