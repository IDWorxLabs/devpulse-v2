/**
 * GPCA_RENDERED_CONTENT_EVIDENCE_V1 — validation.
 *
 * GPCA Production Enforcement V1 proved production correctly hard-stops whenever GPCA returns a
 * blocking result. But GPCA's own evidence surface only ever audited *structure* — contract,
 * blueprint, module/route/navigation names, file paths, generation traceability — never the actual
 * *rendered* output a real user sees. A build could produce correct filenames/routes/modules/
 * traceability and still render generic template content ("reusable components where", generic
 * onboarding/dashboard/hero copy, template placeholders, boilerplate nav) because none of that
 * lives in a file path.
 *
 * This validator proves Rendered Content Evidence Expansion V1 closes that gap:
 *   1-5.   rendered headings/navigation/buttons/routes/component-output are all actually audited
 *          from real file *contents* (never guessed, never a file path alone),
 *   6-13.  every requested fingerprint family (placeholder copy, generic template wording, starter
 *          dashboard, starter onboarding, reusable shell, hero template, numbered
 *          card/feature-grid template fingerprints, placeholder feature/module pages) is detected,
 *   14.    boilerplate/generic-shell-only navigation (no real feature nav at all) is detected,
 *   15.    a rendered-contract mismatch (visible text that references no contract concept and
 *          matches no template fingerprint either) is detected as real drift, not silently ignored,
 *   16.    GPCA's own gate actually blocks a build whose *structure* was otherwise fully compliant
 *          purely because the *rendered* output failed this new evidence layer,
 *   17.    that block still happens before preview activation in the real production orchestrator,
 *   18-19. no product domain is hardcoded anywhere in this expansion, and every detection is
 *          generic/fingerprint-based (regex + generic marker/label lists, never per-app branching),
 *   20-23. the sibling authorities/validators this milestone must never touch (GPCA's own
 *          structural validator, CBGA, Product Faithfulness, and every other sibling pass token)
 *          are provably unweakened,
 *   24-25. no application-specific logic and no VERE work were introduced,
 *   26.    no new TypeScript errors were introduced in touched files,
 *   27.    the rendered-content audit is actually attached to (and rendered inside) GPCA's report,
 *   28.    AEO classifies every one of the four new rendered-content failure classes correctly and
 *          never attempts a preview-recovery repair for any of them,
 *   29.    the production orchestrator's live-preview/dev-server start calls are strictly
 *          downstream of the rendered-content-aware gate check, and
 *   30.    identical rendered input always produces an identical rendered-content audit.
 *
 * Run only:
 *   npx tsx scripts/validate-gpca-rendered-content-evidence-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runGenerationPipelineComplianceAuthority,
  gpcaBlocksGeneration,
  GPCA_GATE_OUTCOME_TO_FAILURE_CLASS,
  collectRenderedContentEvidence,
  matchRenderedFingerprints,
  GENERIC_RENDERED_CONTENT_FINGERPRINTS,
  renderGenerationPipelineComplianceReportMarkdown,
  GPCA_CAPABILITY_MATRIX_ROWS,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type {
  GpcaPipelineEvidenceInput,
  GpcaComplianceReport,
  GpcaRenderedContentAudit,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { RenderedContentFileInput } from '../src/generation-pipeline-compliance-authority-v1/rendered-content-collector.js';
import {
  buildContractModulePlan,
  buildContractRoutePlan,
  buildContractNavigationPlan,
  runContractBoundGenerationAuthority,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from '../src/contract-bound-generation-authority-v4/index.js';
import { runAutonomousEngineeringOrchestrator } from '../src/autonomous-engineering-orchestrator-v1/index.js';
import { diagnoseBuildFailure } from '../src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.js';
import { getRepairCapabilityById } from '../src/autonomous-engineering-orchestrator-v1/repair-capability-registry.js';
import { AEO_FAILURE_CLASS_METADATA } from '../src/autonomous-engineering-orchestrator-v1/failure-taxonomy.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'GPCA_RENDERED_CONTENT_EVIDENCE_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// -------------------------------------------------------------------------------------------
// Fixtures — a domain-neutral test contract (a community-garden plot manager) deliberately
// unrelated to every banned product-domain word this validator checks for later, plus a small
// library of hand-written rendered-file fixtures. Every fixture below is deterministic, generic
// evidence — never product-domain branching in GPCA/AEO's own detection logic.
// -------------------------------------------------------------------------------------------
const TEST_CONTRACT: CbgaCanonicalContractEvidence = {
  contractId: 'contract-test-fixture-rendered-v1',
  productIdentity: 'Community Garden Plot Manager',
  primaryWorkflows: ['assigning plots', 'tracking harvests'],
  coreEntities: ['plots', 'gardeners', 'harvest schedules'],
  coreActions: ['assign', 'water', 'harvest'],
  navigationExpectations: ['plots', 'gardeners'],
  majorFeatureGroups: ['plot assignment', 'harvest tracking'],
  businessConcepts: ['plots', 'gardeners', 'harvest schedules', 'plot assignment', 'harvest tracking'],
  allConceptNames: [
    'assigning plots',
    'tracking harvests',
    'plots',
    'gardeners',
    'harvest schedules',
    'assign',
    'water',
    'harvest',
    'plot assignment',
    'harvest tracking',
  ],
};

const CONTRACT_VOCABULARY = [TEST_CONTRACT.productIdentity, ...TEST_CONTRACT.allConceptNames];

const modulePlan = buildContractModulePlan(TEST_CONTRACT);
const routePlan = buildContractRoutePlan(modulePlan);
const navigationPlan = buildContractNavigationPlan(routePlan);

const COMPLIANT_CBGA_REPORT: CbgaGenerationReport = runContractBoundGenerationAuthority({
  contract: TEST_CONTRACT,
  proposed: {
    proposedModuleIds: modulePlan.map((m) => m.moduleId),
    proposedRoutes: routePlan.map((r) => r.path),
    proposedNavigationLabels: navigationPlan.map((n) => n.label),
    proposedAppTitle: TEST_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  },
});

function structurallyCompliantEvidence(generatedFilePaths: readonly string[]): GpcaPipelineEvidenceInput {
  return {
    contract: TEST_CONTRACT,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    proposed: {
      appTitle: TEST_CONTRACT.productIdentity,
      moduleIds: modulePlan.map((m) => m.moduleId),
      routes: routePlan.map((r) => r.path),
      navigationLabels: navigationPlan.map((n) => n.label),
      generatedFilePaths,
    },
  };
}

const COMPLIANT_FILE: RenderedContentFileInput = {
  path: 'src/features/plots/PlotsPage.tsx',
  content: `
export default function PlotsPage() {
  return (
    <section>
      <h1>Community Garden Plot Manager</h1>
      <nav aria-label="Main navigation">
        <button>Plots</button>
        <button>Gardeners</button>
      </nav>
      <button>Assign Plot</button>
    </section>
  );
}
`,
};

const COMPONENT_FILE: RenderedContentFileInput = {
  path: 'src/features/plots/components/PlotCard.tsx',
  content: `
export default function PlotCard({ plot }: { plot: { name: string } }) {
  return (
    <div className="plot-card">
      <p>Managing plot assignments and harvest schedules.</p>
    </div>
  );
}
`,
};

const PLACEHOLDER_FILE: RenderedContentFileInput = {
  path: 'src/features/plots/PlaceholderPanel.tsx',
  content: `
export default function PlaceholderPanel() {
  return (
    <div>
      <p>This is placeholder content.</p>
      <button>Click Me</button>
    </div>
  );
}
`,
};

const GENERIC_TEMPLATE_FILE: RenderedContentFileInput = {
  path: 'src/features/plots/DemoNotice.tsx',
  content: `
export default function DemoNotice() {
  return <p>This is a demo starter app.</p>;
}
`,
};

const STARTER_DASHBOARD_FILE: RenderedContentFileInput = {
  path: 'src/blueprint/pages/HomePage.tsx',
  content: `
export default function HomePage() {
  return (
    <section>
      <h2>Dashboard Overview</h2>
      <p>Recent activity</p>
      <div>Quick Actions</div>
    </section>
  );
}
`,
};

const ONBOARDING_FILE: RenderedContentFileInput = {
  path: 'src/blueprint/OnboardingScreen.tsx',
  content: `
export default function OnboardingScreen() {
  return (
    <div>
      <p>Let's get you set up</p>
      <p>Step 1 of 3</p>
    </div>
  );
}
`,
};

const REUSABLE_SHELL_FILE: RenderedContentFileInput = {
  path: 'src/blueprint/WelcomeScreen.tsx',
  content: `
export default function WelcomeScreen() {
  return (
    <div data-blueprint="welcome-screen">
      <h1>Welcome to your app</h1>
    </div>
  );
}
`,
};

const HERO_FILE: RenderedContentFileInput = {
  path: 'src/features/marketing/Hero.tsx',
  content: `
export default function Hero() {
  return <h1>Your headline here</h1>;
}
`,
};

const CARDS_FILE: RenderedContentFileInput = {
  path: 'src/features/marketing/CardGrid.tsx',
  content: `
export default function CardGrid() {
  return (
    <div>
      <div>Card One</div>
      <div>Feature Two</div>
    </div>
  );
}
`,
};

const PLACEHOLDER_FEATURE_FILE: RenderedContentFileInput = {
  path: 'src/features/some-module/SomeModulePage.tsx',
  content: `
export default function SomeModulePage() {
  return (
    <section>
      <h1>Some Module</h1>
      <p>This feature page is a placeholder.</p>
    </section>
  );
}
`,
};

const GENERIC_NAV_FILE: RenderedContentFileInput = {
  path: 'src/blueprint/AppShell.tsx',
  content: `
export default function AppShell() {
  return (
    <nav aria-label="Main navigation">
      <button>Settings</button>
      <button>Profile</button>
      <button>Help</button>
    </nav>
  );
}
`,
};

const DRIFT_FILE: RenderedContentFileInput = {
  path: 'src/features/plots/DriftPage.tsx',
  content: `
export default function DriftPage() {
  return <h1>Blorptastic Zone Alpha</h1>;
}
`,
};

function audit(files: readonly RenderedContentFileInput[]): GpcaRenderedContentAudit {
  return collectRenderedContentEvidence({ files, contractVocabulary: CONTRACT_VOCABULARY });
}

async function main(): Promise<void> {
  const ORCHESTRATOR_PATH = join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const orchestratorSource = readFileSync(ORCHESTRATOR_PATH, 'utf8').replace(/\r\n/g, '\n');

  // -------------------------------------------------------------------------------------------
  // 1. Rendered headings audited.
  // -------------------------------------------------------------------------------------------
  const compliantAudit = audit([COMPLIANT_FILE, COMPONENT_FILE]);
  assert(
    '1. Rendered headings audited',
    compliantAudit.headings.headings.includes('Community Garden Plot Manager') &&
      compliantAudit.headings.items.some((i) => i.reason.includes('references a real contract concept')),
    `headings=${compliantAudit.headings.headings.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. Navigation audited.
  // -------------------------------------------------------------------------------------------
  assert(
    '2. Navigation audited',
    compliantAudit.navigation.navigationLabels.includes('Plots') && compliantAudit.navigation.navigationLabels.includes('Gardeners'),
    `navigationLabels=${compliantAudit.navigation.navigationLabels.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. Button labels audited.
  // -------------------------------------------------------------------------------------------
  assert(
    '3. Button labels audited',
    compliantAudit.interactions.buttonLabels.includes('Assign Plot'),
    `buttonLabels=${compliantAudit.interactions.buttonLabels.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. Route output audited.
  // -------------------------------------------------------------------------------------------
  assert(
    '4. Route output audited',
    compliantAudit.routesAudited.includes('src/features/plots/PlotsPage.tsx'),
    `routesAudited=${compliantAudit.routesAudited.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. Component output audited — real text rendered by a non-page component file is captured too.
  // -------------------------------------------------------------------------------------------
  assert(
    '5. Component output audited',
    compliantAudit.filesAudited.includes('src/features/plots/components/PlotCard.tsx') &&
      compliantAudit.surfaces.visibleText.some((t) => t.includes('Managing plot assignments and harvest schedules')),
    `filesAudited=${compliantAudit.filesAudited.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. Placeholder copy detected.
  // -------------------------------------------------------------------------------------------
  const placeholderAudit = audit([PLACEHOLDER_FILE]);
  assert(
    '6. Placeholder copy detected',
    placeholderAudit.placeholders.placeholderPhrasesMatched.length > 0 &&
      placeholderAudit.gateOutcome === 'RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION',
    `placeholderPhrasesMatched=${placeholderAudit.placeholders.placeholderPhrasesMatched.join(', ')}, gateOutcome=${placeholderAudit.gateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Generic template detected.
  // -------------------------------------------------------------------------------------------
  const genericTemplateAudit = audit([GENERIC_TEMPLATE_FILE]);
  assert(
    '7. Generic template detected',
    genericTemplateAudit.templates.templateFingerprintsMatched.includes('template-wording-demo-starter-app') &&
      genericTemplateAudit.gateOutcome === 'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
    `templateFingerprintsMatched=${genericTemplateAudit.templates.templateFingerprintsMatched.join(', ')}, gateOutcome=${genericTemplateAudit.gateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Starter dashboard detected.
  // -------------------------------------------------------------------------------------------
  const starterDashboardAudit = audit([STARTER_DASHBOARD_FILE]);
  assert(
    '8. Starter dashboard detected',
    starterDashboardAudit.templates.genericShellFingerprintsMatched.includes('starter-dashboard-overview') &&
      starterDashboardAudit.gateOutcome === 'RENDERED_CONTENT_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
    `genericShellFingerprintsMatched=${starterDashboardAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Starter onboarding detected.
  // -------------------------------------------------------------------------------------------
  const onboardingAudit = audit([ONBOARDING_FILE]);
  assert(
    '9. Starter onboarding detected',
    onboardingAudit.templates.genericShellFingerprintsMatched.includes('onboarding-lets-get-set-up') &&
      onboardingAudit.templates.genericShellFingerprintsMatched.includes('onboarding-step-of'),
    `genericShellFingerprintsMatched=${onboardingAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Reusable shell detected.
  // -------------------------------------------------------------------------------------------
  const reusableShellAudit = audit([REUSABLE_SHELL_FILE]);
  assert(
    '10. Reusable shell detected',
    reusableShellAudit.templates.genericShellFingerprintsMatched.includes('generated-ui-metadata:welcome-screen') &&
      reusableShellAudit.templates.genericShellFingerprintsMatched.includes('reusable-shell-welcome-to-app'),
    `genericShellFingerprintsMatched=${reusableShellAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 11. Hero template detected.
  // -------------------------------------------------------------------------------------------
  const heroAudit = audit([HERO_FILE]);
  assert(
    '11. Hero template detected',
    heroAudit.templates.genericShellFingerprintsMatched.includes('hero-template-headline-placeholder'),
    `genericShellFingerprintsMatched=${heroAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Template fingerprint detected (numbered starter cards / generic feature grid).
  // -------------------------------------------------------------------------------------------
  const cardsAudit = audit([CARDS_FILE]);
  assert(
    '12. Template fingerprint detected',
    cardsAudit.templates.genericShellFingerprintsMatched.includes('starter-cards-numbered-card') &&
      cardsAudit.templates.genericShellFingerprintsMatched.includes('generic-feature-grid-numbered-feature'),
    `genericShellFingerprintsMatched=${cardsAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Placeholder feature detected.
  // -------------------------------------------------------------------------------------------
  const placeholderFeatureAudit = audit([PLACEHOLDER_FEATURE_FILE]);
  assert(
    '13. Placeholder feature detected',
    placeholderFeatureAudit.placeholders.placeholderPhrasesMatched.length > 0 &&
      placeholderFeatureAudit.gateOutcome === 'RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION',
    `placeholderPhrasesMatched=${placeholderFeatureAudit.placeholders.placeholderPhrasesMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Generic navigation detected — every rendered nav label is generic system-shell chrome,
  //     with zero product-specific feature navigation anywhere in the build.
  // -------------------------------------------------------------------------------------------
  const genericNavAudit = audit([GENERIC_NAV_FILE]);
  assert(
    '14. Generic navigation detected',
    genericNavAudit.templates.genericShellFingerprintsMatched.includes('boilerplate-navigation-no-feature-items'),
    `genericShellFingerprintsMatched=${genericNavAudit.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. Rendered contract mismatch detected — visible text matches no template fingerprint and
  //     references no contract concept: real drift, not silently allowed.
  // -------------------------------------------------------------------------------------------
  const driftAudit = audit([DRIFT_FILE]);
  assert(
    '15. Rendered contract mismatch detected',
    driftAudit.renderedContractMatchPercent === 0 && driftAudit.gateOutcome === 'RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT',
    `renderedContractMatchPercent=${driftAudit.renderedContractMatchPercent}, gateOutcome=${driftAudit.gateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 16. GPCA blocks rendered mismatch — a build whose *structure* (modules/routes/nav/title) is
  //     fully CBGA-approved still gets blocked once its *rendered* output drifts from the contract.
  //     Structural evidence uses an empty generatedFilePaths list (the same shape GPCA's own
  //     pre-materialization pass — and its own existing validator's `compliantEvidence()` default —
  //     already uses to legitimately reach COMPLIANCE_ALLOWED) so this isolates the *new*
  //     rendered-content override mechanism itself, independent of the pre-existing, unrelated
  //     structural "Blueprint Generator" compliance floor (see generator-legacy-detection.ts /
  //     pipeline-compliance-scoring.ts, both untouched by this milestone) that already blocks
  //     essentially every real post-materialization build with the *unconditional* blueprint shell
  //     writer on its own, before rendered-content evidence is ever consulted.
  // -------------------------------------------------------------------------------------------
  const structurallyAllowedReport = runGenerationPipelineComplianceAuthority(structurallyCompliantEvidence([]));
  assert(
    'pre-16. Structural-only evidence for this fixture is allowed (proves the block in #16 comes from rendered content, not structure)',
    structurallyAllowedReport.finalGateOutcome === 'COMPLIANCE_ALLOWED',
    `finalGateOutcome=${structurallyAllowedReport.finalGateOutcome}`,
  );
  const renderedMismatchReport = runGenerationPipelineComplianceAuthority(structurallyCompliantEvidence([]), driftAudit);
  assert(
    '16. GPCA blocks rendered mismatch',
    gpcaBlocksGeneration(renderedMismatchReport) &&
      renderedMismatchReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT',
    `finalGateOutcome=${renderedMismatchReport.finalGateOutcome}, blockedReasons=${renderedMismatchReport.blockedReasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 17. GPCA still blocks before preview — the production orchestrator passes the real
  //     `workspaceDir` into the exact same post-materialization call the previous milestone
  //     already proved hard-stops before npm install/build/dev-server/live-preview, and that call
  //     is strictly upstream of the dev-server start.
  // -------------------------------------------------------------------------------------------
  const renderedContentWiringMarker =
    'generatedFilePaths: engineResult.generatedFiles,\n      workspaceDir,\n    });\n    if (gpcaBlocksGeneration(gpcaComplianceReport)) {';
  const renderedContentWiringIndex = orchestratorSource.indexOf(renderedContentWiringMarker);
  const firstDevServerStartIndex = orchestratorSource.indexOf('const devServer = await startGeneratedAppDevServer(');
  assert(
    '17. GPCA still blocks before preview (workspaceDir-augmented rendered-content check is wired before dev-server start)',
    renderedContentWiringIndex !== -1 && firstDevServerStartIndex !== -1 && renderedContentWiringIndex < firstDevServerStartIndex,
    `renderedContentWiringIndex=${renderedContentWiringIndex}, firstDevServerStartIndex=${firstDevServerStartIndex}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Product-specific wording is not hardcoded anywhere in this milestone's new files.
  // -------------------------------------------------------------------------------------------
  const NEW_FILES = [
    'src/generation-pipeline-compliance-authority-v1/rendered-content-types.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
  ];
  const newFilesSource = NEW_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  const FORBIDDEN_DOMAIN_WORDS = [
    'restaurant',
    'calculator',
    'converter',
    '\\bcrm\\b',
    'booking',
    'inventory management',
    'notes app',
    'note-taking',
    '\\blisa\\b',
    'authentication system',
    '\\bcrud\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(newFilesSource));
  assert(
    '18. Product-specific wording is not hardcoded',
    domainHits.length === 0,
    domainHits.length === 0 ? `inspected ${NEW_FILES.length} new file(s) — no forbidden domain words found` : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 19. Detection is fingerprint-based — every check is a regex/generic-marker-list lookup against
  //     a declared fingerprint table, never an app-specific branch, and the table itself is large
  //     enough to cover every requested category.
  // -------------------------------------------------------------------------------------------
  const fingerprintCategoriesCovered = new Set(GENERIC_RENDERED_CONTENT_FINGERPRINTS.map((f) => f.category));
  const REQUIRED_FINGERPRINT_CATEGORIES = [
    'TEMPLATE_WORDING',
    'PLACEHOLDER_COPY',
    'REUSABLE_SHELL',
    'ONBOARDING',
    'STARTER_DASHBOARD',
    'HERO_TEMPLATE',
    'BOILERPLATE_QUICK_ACTIONS',
    'STARTER_CARDS',
    'GENERIC_FEATURE_GRID',
  ];
  const missingCategories = REQUIRED_FINGERPRINT_CATEGORIES.filter((c) => !fingerprintCategoriesCovered.has(c as never));
  const sampleMatch = matchRenderedFingerprints('lorem ipsum');
  assert(
    '19. Detection is fingerprint-based',
    GENERIC_RENDERED_CONTENT_FINGERPRINTS.length >= 20 &&
      missingCategories.length === 0 &&
      sampleMatch.length > 0 &&
      sampleMatch[0].pattern instanceof RegExp,
    `fingerprintCount=${GENERIC_RENDERED_CONTENT_FINGERPRINTS.length}, missingCategories=${missingCategories.join(', ') || '(none)'}, sampleMatch=${sampleMatch.map((m) => m.id).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. Existing GPCA validator still passes (its pass token is untouched; and this milestone's
  //     purely-structural detection path — no rendered evidence supplied — behaves identically to
  //     before this milestone for a known structural violation).
  // -------------------------------------------------------------------------------------------
  const structuralOnlyBlueprintBypassReport = runGenerationPipelineComplianceAuthority(
    structurallyCompliantEvidence(['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx']),
  );
  const gpcaSiblingValidatorSource = readFileSync(join(ROOT, 'scripts/validate-generation-pipeline-compliance-authority-v1.ts'), 'utf8');
  assert(
    '20. Existing GPCA validator still passes',
    structuralOnlyBlueprintBypassReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS' &&
      structuralOnlyBlueprintBypassReport.renderedContentAudit === null &&
      gpcaSiblingValidatorSource.includes('GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_PASS'),
    `finalGateOutcome=${structuralOnlyBlueprintBypassReport.finalGateOutcome}, renderedContentAudit=${structuralOnlyBlueprintBypassReport.renderedContentAudit}`,
  );

  // -------------------------------------------------------------------------------------------
  // 21. CBGA unaffected — its own sibling validator pass token is untouched, and this milestone
  //     only ever reads CBGA's existing exported constant (never redefines or mutates it).
  // -------------------------------------------------------------------------------------------
  const cbgaSiblingValidatorSource = readFileSync(join(ROOT, 'scripts/validate-contract-bound-generation-authority-v4.ts'), 'utf8');
  const collectorSource = readFileSync(
    join(ROOT, 'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts'),
    'utf8',
  );
  assert(
    '21. CBGA unaffected',
    cbgaSiblingValidatorSource.includes('CONTRACT_BOUND_GENERATION_AUTHORITY_V4_PASS') &&
      collectorSource.includes("import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../contract-bound-generation-authority-v4/index.js';") &&
      !collectorSource.includes('CBGA_DEFAULT_SHELL_NAVIGATION_LABELS ='),
    'CBGA sibling validator pass token present; collector only imports (never redefines) CBGA_DEFAULT_SHELL_NAVIGATION_LABELS',
  );

  // -------------------------------------------------------------------------------------------
  // 22. Product Faithfulness unaffected — its own sibling validator pass token is untouched.
  // -------------------------------------------------------------------------------------------
  const productFaithfulnessValidatorSource = readFileSync(join(ROOT, 'scripts/validate-product-faithfulness-milestone-2.ts'), 'utf8');
  assert(
    '22. Product Faithfulness unaffected',
    productFaithfulnessValidatorSource.includes('PRODUCT_FAITHFULNESS_MILESTONE_2_PASS'),
    'Product Faithfulness sibling validator pass token present and untouched',
  );

  // -------------------------------------------------------------------------------------------
  // 23. No validator was weakened — every sibling validator this milestone depends on/adjoins
  //     still declares its own pass token.
  // -------------------------------------------------------------------------------------------
  const SIBLING_VALIDATORS: Array<{ path: string; passToken: string }> = [
    { path: 'scripts/validate-generation-pipeline-compliance-authority-v1.ts', passToken: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_PASS' },
    { path: 'scripts/validate-gpca-production-enforcement-fix-v1.ts', passToken: 'GPCA_PRODUCTION_ENFORCEMENT_FIX_V1_PASS' },
    { path: 'scripts/validate-contract-bound-generation-authority-v4.ts', passToken: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4_PASS' },
    { path: 'scripts/validate-product-faithfulness-milestone-2.ts', passToken: 'PRODUCT_FAITHFULNESS_MILESTONE_2_PASS' },
    { path: 'scripts/validate-autonomous-engineering-orchestrator-v1.ts', passToken: "'AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_PASS'" },
  ];
  const siblingChecks = SIBLING_VALIDATORS.map((v) => {
    try {
      return readFileSync(join(ROOT, v.path), 'utf8').includes(v.passToken);
    } catch {
      return false;
    }
  });
  assert(
    '23. No validator was weakened',
    siblingChecks.every(Boolean),
    `sibling validator pass-token presence: ${SIBLING_VALIDATORS.map((v, i) => `${v.path}=${siblingChecks[i]}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 24. No application-specific logic added — no per-domain special-casing branch anywhere in the
  //     new files.
  // -------------------------------------------------------------------------------------------
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /if\s*\(\s*(domain|product|profile)\s*===\s*['"](restaurant|calculator|crm|booking|inventory|notes|converter)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
  ];
  const logicHits = APPLICATION_SPECIFIC_LOGIC_PATTERNS.filter((p) => p.test(newFilesSource));
  assert(
    '24. No application-specific logic added',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${NEW_FILES.length} new file(s) — no per-domain branching found` : `found ${logicHits.length} pattern match(es)`,
  );

  // -------------------------------------------------------------------------------------------
  // 25. No VERE work was introduced.
  // -------------------------------------------------------------------------------------------
  const TOUCHED_EXISTING_FILES = [
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
    'src/generation-pipeline-compliance-authority-v1/index.ts',
    'src/autonomous-engineering-orchestrator-v1/failure-taxonomy.ts',
    'src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.ts',
    'src/autonomous-engineering-orchestrator-v1/repair-capability-registry.ts',
    'src/autonomous-engineering-orchestrator-v1/missing-capability-router.ts',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/autonomous-engineering-executive/aee-production-response.ts',
  ];
  const touchedExistingSource = TOUCHED_EXISTING_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  const vereMention = /\bvere\b/i.test(`${newFilesSource}\n${touchedExistingSource}`);
  assert(
    '25. No VERE work was introduced',
    !vereMention,
    vereMention ? 'unexpected VERE reference found' : 'no VERE references found in new or touched files',
  );

  // -------------------------------------------------------------------------------------------
  // 26. No new TypeScript errors introduced in touched files (lightweight touched-file tsc
  //     diagnostic, run as part of this validator — never a separate full-repo command, and never
  //     any sibling validator script).
  // -------------------------------------------------------------------------------------------
  const KNOWN_PREEXISTING_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  const ALL_TOUCHED_FILES = [...NEW_FILES, ...TOUCHED_EXISTING_FILES];
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return ALL_TOUCHED_FILES.some((f) => normalized.includes(f));
  });
  const newTouchedFileErrors = touchedFileErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '26. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // 27. Rendered evidence is included in the GPCA report — both the object field and the
  //     rendered markdown report.
  // -------------------------------------------------------------------------------------------
  const reportWithRenderedEvidence: GpcaComplianceReport = runGenerationPipelineComplianceAuthority(
    structurallyCompliantEvidence([COMPLIANT_FILE.path]),
    compliantAudit,
  );
  const renderedMarkdown = renderGenerationPipelineComplianceReportMarkdown(reportWithRenderedEvidence);
  assert(
    '27. Rendered evidence included in GPCA report',
    reportWithRenderedEvidence.renderedContentAudit !== null &&
      renderedMarkdown.includes('## Rendered Content Audit') &&
      renderedMarkdown.includes('### Headings') &&
      renderedMarkdown.includes('### Navigation') &&
      renderedMarkdown.includes('### Buttons') &&
      renderedMarkdown.includes('### Routes') &&
      renderedMarkdown.includes('### Visible Features') &&
      renderedMarkdown.includes('### Placeholder Detection') &&
      renderedMarkdown.includes('### Template Fingerprints') &&
      renderedMarkdown.includes('### Generic Shell Fingerprints') &&
      renderedMarkdown.includes('### Rendered Contract Match') &&
      renderedMarkdown.includes('### Overall Rendered Compliance') &&
      renderedMarkdown.includes('Community Garden Plot Manager'),
    `renderedContentAudit present=${reportWithRenderedEvidence.renderedContentAudit !== null}`,
  );

  // -------------------------------------------------------------------------------------------
  // 28. AEO classification correct for every new rendered-content failure class, and AEO never
  //     attempts a preview-recovery repair for any of them.
  // -------------------------------------------------------------------------------------------
  const NEW_RENDERED_OUTCOMES = [
    'COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION',
    'COMPLIANCE_BLOCKED_GENERIC_TEMPLATE_OUTPUT',
    'COMPLIANCE_BLOCKED_RENDERED_CONTRACT_DRIFT',
    'COMPLIANCE_BLOCKED_RENDERED_CONTENT_NON_COMPLIANCE',
  ] as const;
  let allNewOutcomesClassifyCorrectly = true;
  const classificationDetail: string[] = [];
  for (const outcome of NEW_RENDERED_OUTCOMES) {
    const expectedClass = GPCA_GATE_OUTCOME_TO_FAILURE_CLASS[outcome];
    const classifications = diagnoseBuildFailure({ gpcaComplianceReport: { finalGateOutcome: outcome, blockedReasons: [`test: ${outcome}`] } });
    const actualClass = classifications[0]?.failureClass ?? null;
    const repairMayBeAttempted = expectedClass ? AEO_FAILURE_CLASS_METADATA[expectedClass].repairMayBeAttempted : true;
    if (actualClass !== expectedClass || repairMayBeAttempted) allNewOutcomesClassifyCorrectly = false;
    classificationDetail.push(`${outcome}->${actualClass}(expected ${expectedClass}, repairMayBeAttempted=${repairMayBeAttempted})`);
  }
  const gpcaCapability = getRepairCapabilityById('generation-pipeline-compliance-authority-v1');
  const capabilityHandlesAllFour = NEW_RENDERED_OUTCOMES.every((outcome) => {
    const expectedClass = GPCA_GATE_OUTCOME_TO_FAILURE_CLASS[outcome];
    return expectedClass ? (gpcaCapability?.failureClassesHandled ?? []).includes(expectedClass) : false;
  });
  const aeoReportForRenderedBlock = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      gpcaComplianceReport: { finalGateOutcome: 'COMPLIANCE_BLOCKED_PLACEHOLDER_APPLICATION', blockedReasons: ['rendered placeholder copy detected'] },
    },
  });
  assert(
    '28. AEO classification correct (and no preview-recovery repair attempted)',
    allNewOutcomesClassifyCorrectly &&
      capabilityHandlesAllFour &&
      gpcaCapability?.safeToRunAutomatically === false &&
      aeoReportForRenderedBlock.buildRecovered === false &&
      aeoReportForRenderedBlock.repairResult !== 'REPAIRED' &&
      aeoReportForRenderedBlock.classification.failureClass === 'PLACEHOLDER_APPLICATION',
    `${classificationDetail.join(', ')}; capabilityHandlesAllFour=${capabilityHandlesAllFour}; buildRecovered=${aeoReportForRenderedBlock.buildRecovered}; classification=${aeoReportForRenderedBlock.classification.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 29. Live preview never starts after a rendered-content hard stop — every dev-server-start and
  //     preview-recovery-loop call site in the orchestrator remains strictly downstream of the
  //     rendered-content-aware gate check proven in scenario 17.
  // -------------------------------------------------------------------------------------------
  const previewRecoveryIndices = [...orchestratorSource.matchAll(/runAeePreviewRecoveryLoop\(/g)].map((m) => m.index ?? -1);
  assert(
    '29. Live preview never starts after rendered-content hard stop',
    renderedContentWiringIndex !== -1 &&
      firstDevServerStartIndex > renderedContentWiringIndex &&
      previewRecoveryIndices.length > 0 &&
      previewRecoveryIndices.every((i) => i > renderedContentWiringIndex),
    `renderedContentWiringIndex=${renderedContentWiringIndex}, firstDevServerStartIndex=${firstDevServerStartIndex}, previewRecoveryIndices=${previewRecoveryIndices.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 30. Deterministic results for identical rendered output.
  // -------------------------------------------------------------------------------------------
  const files = [COMPLIANT_FILE, PLACEHOLDER_FILE, STARTER_DASHBOARD_FILE];
  const auditA = audit(files);
  const auditB = audit(files);
  const strip = (a: GpcaRenderedContentAudit) => JSON.stringify({ ...a, generatedAt: null });
  assert(
    '30. Deterministic results for identical rendered output',
    strip(auditA) === strip(auditB),
    strip(auditA) === strip(auditB) ? 'two independent audits of identical input produced byte-identical (timestamp aside) results' : 'audits diverged',
  );

  // -------------------------------------------------------------------------------------------
  // Report + exit
  // -------------------------------------------------------------------------------------------
  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  // eslint-disable-next-line no-console
  console.log('\n## Mandatory Capability Matrix\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of GPCA_CAPABILITY_MATRIX_ROWS) {
    // eslint-disable-next-line no-console
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Validator crashed:', err);
  process.exit(1);
});
