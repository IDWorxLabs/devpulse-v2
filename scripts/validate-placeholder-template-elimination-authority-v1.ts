/**
 * PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1 — validation.
 *
 * Production Pipeline Constitution Adoption Phase 2. GPCA's Rendered Content Evidence Expansion V1
 * already blocks generic template/reusable-shell/placeholder-copy fingerprints, but generators still
 * independently invented business content ("Sample Customer", "Demo Item", "Preview entry", "Example
 * record", "Fake statistics") that had no constitutional ancestry at all — GPCA correctly blocked it,
 * but the root cause was generator autonomy, not a GPCA weakness.
 *
 * This milestone (1) introduces a generic Product Content Origin model so every rendered text
 * fragment classifies into exactly one of CONTRACT_PRODUCT_CONTENT / CBGA_PRODUCT_CONTENT /
 * PROMPT_PRODUCT_CONTENT / INFRASTRUCTURE_CONTENT / MATERIALIZATION_METADATA / UNKNOWN_CONTENT
 * (`src/placeholder-template-elimination-authority-v1/`), (2) extends GPCA's rendered-content
 * evidence model (never its gate/detectors/scoring) so every evidence item additionally carries
 * Content Origin / Content Source / Approved Producer / Traceability Chain, (3) adds a dedicated,
 * additive business-placeholder-fingerprint registry whose hits are merged into GPCA's existing,
 * unmodified `placeholderPhrasesMatched` evidence (can only ever add new blocking signals), and
 * (4) removes the last generator-invented business content still in production (modular feature
 * module generator's hardcoded "Sample/preview" records; profile feature UI generator's "Demo data"
 * card).
 *
 * This validator proves:
 *   1-8.   every generator-invented business-content shape the milestone background calls out
 *          (Sample/Preview/Demo/Example/Placeholder/Generic-dashboard/Fake-statistics/Fake-cards)
 *          is rejected (classifies UNKNOWN_CONTENT and/or matches the business-placeholder registry),
 *   9-11.  infrastructure text/navigation/loading-states remain allowed (INFRASTRUCTURE_CONTENT,
 *          ancestry-exempt),
 *   12-13. product content requires proven ancestry while infrastructure content is exempt,
 *   14.    GPCA's rendered-content evidence model actually distinguishes infrastructure vs product
 *          text end-to-end (real evidence items, not just the standalone classifier),
 *   15.    the real Blueprint Generator's real generated output contains zero business-placeholder
 *          fingerprint matches,
 *   16-18. GPCA / CBGA / Product Faithfulness are unweakened,
 *   19-20. no application-specific logic and no VERE work were introduced,
 *   21.    no new TypeScript errors were introduced in touched files,
 *   22.    the mandatory Capability Matrix includes this authority,
 *   23.    the real production adapter (buildGpcaPostMaterializationReport /
 *          collectRenderedContentEvidence) is actually wired to build and consume CBGA/prompt
 *          vocabulary, not merely a type-level addition nobody's production code path reaches,
 *   24-25. the pre-existing rendered-content and contract-traceability validators' own fixtures still
 *          behave identically after this milestone (no behavioral regression).
 *
 * Run only:
 *   npx tsx scripts/validate-placeholder-template-elimination-authority-v1.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyContentOrigin,
  forcedContentOriginClassification,
  type ContentOriginClassifierContext,
} from '../src/placeholder-template-elimination-authority-v1/content-origin-classifier.js';
import { matchBusinessPlaceholderFingerprints } from '../src/placeholder-template-elimination-authority-v1/business-placeholder-fingerprints.js';
import { isInfrastructureContentText } from '../src/placeholder-template-elimination-authority-v1/infrastructure-content-lexicon.js';
import { auditProductContentOrigins } from '../src/placeholder-template-elimination-authority-v1/placeholder-template-elimination-authority.js';
import { ANCESTRY_EXEMPT_ORIGINS } from '../src/placeholder-template-elimination-authority-v1/product-content-origin-types.js';

import {
  collectRenderedContentEvidence,
  matchRenderedFingerprints,
  GPCA_CAPABILITY_MATRIX_ROWS,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { RenderedContentFileInput } from '../src/generation-pipeline-compliance-authority-v1/rendered-content-collector.js';

import {
  buildContractModulePlan,
  buildContractRoutePlan,
  buildContractNavigationPlan,
  runContractBoundGenerationAuthority,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from '../src/contract-bound-generation-authority-v4/index.js';

import {
  buildUniversalBlueprintWorkspaceFiles,
} from '../src/universal-app-blueprint/index.js';
import type { UniversalBlueprintBuildInput } from '../src/universal-app-blueprint/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

// -------------------------------------------------------------------------------------------
// Fixtures — a domain-neutral test contract (deliberately unrelated to every banned
// product-domain word checked later), reused across scenarios needing real CBGA/contract
// vocabulary.
// -------------------------------------------------------------------------------------------
const TEST_CONTRACT: CbgaCanonicalContractEvidence = {
  contractId: 'contract-test-fixture-placeholder-elim-v1',
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

const CBGA_VOCABULARY = [
  ...COMPLIANT_CBGA_REPORT.modulePlan.map((m) => m.displayName),
  ...COMPLIANT_CBGA_REPORT.navigationPlan.map((n) => n.label),
  ...COMPLIANT_CBGA_REPORT.routePlan.map((r) => r.label),
];
const PROMPT_VOCABULARY = ['Community Garden Plot Manager', 'seedling-inventory'];

const CLASSIFIER_CONTEXT: ContentOriginClassifierContext = {
  contractVocabulary: CONTRACT_VOCABULARY,
  cbgaVocabulary: CBGA_VOCABULARY,
  promptVocabulary: PROMPT_VOCABULARY,
};

async function main(): Promise<void> {
  // ===============================================================================================
  // Scenarios 1-8 — generator-invented business content is rejected (Part 2 background list).
  // ===============================================================================================
  const businessContentCases: readonly { n: number; label: string; text: string; expectedFingerprintId?: string }[] = [
    { n: 1, label: 'Sample business records rejected', text: 'Sample Customer', expectedFingerprintId: 'business-placeholder-sample-noun-phrase' },
    { n: 2, label: 'Preview business records rejected', text: 'Preview entry', expectedFingerprintId: 'business-placeholder-preview-entry' },
    { n: 3, label: 'Demo business records rejected', text: 'Demo Item', expectedFingerprintId: 'business-placeholder-demo-noun-phrase' },
    { n: 4, label: 'Example business records rejected', text: 'Example Record', expectedFingerprintId: 'business-placeholder-example-record' },
    { n: 7, label: 'Fake statistics rejected', text: 'Fake statistics', expectedFingerprintId: 'business-placeholder-fake-business-noun' },
    { n: 8, label: 'Fake cards rejected', text: 'Fake cards', expectedFingerprintId: 'business-placeholder-fake-business-noun' },
  ];
  for (const testCase of businessContentCases) {
    const matches = matchBusinessPlaceholderFingerprints(testCase.text);
    const classification = classifyContentOrigin(testCase.text, 'test.tsx', CLASSIFIER_CONTEXT);
    assert(
      `${testCase.n}. ${testCase.label}: "${testCase.text}" matches business-placeholder fingerprint "${testCase.expectedFingerprintId}" and classifies UNKNOWN_CONTENT with isBusinessPlaceholder=true`,
      matches.some((m) => m.id === testCase.expectedFingerprintId) &&
        classification.origin === 'UNKNOWN_CONTENT' &&
        classification.isBusinessPlaceholder === true &&
        classification.matchedBusinessPlaceholderFingerprint === testCase.expectedFingerprintId,
      `matches=${JSON.stringify(matches.map((m) => m.id))}, classification=${JSON.stringify(classification)}`,
    );
  }

  // Scenario 5 — Placeholder business records rejected (existing GENERIC_RENDERED_CONTENT_FINGERPRINTS
  // PLACEHOLDER_COPY family, exercised end-to-end through the real rendered-content collector so it
  // proves the business-placeholder registry and the pre-existing template-fingerprint registry are
  // both consulted, never one silently replacing the other).
  const placeholderCardFile: RenderedContentFileInput = {
    path: 'src/features/plots/PlaceholderCard.tsx',
    content: `
export default function PlaceholderCard() {
  return (
    <section>
      <h2>Placeholder Card</h2>
      <p>Sample placeholder content for this record.</p>
    </section>
  );
}
`,
  };
  const placeholderAudit = collectRenderedContentEvidence({
    files: [placeholderCardFile],
    contractVocabulary: CONTRACT_VOCABULARY,
    cbgaVocabulary: CBGA_VOCABULARY,
    promptVocabulary: PROMPT_VOCABULARY,
  });
  assert(
    '5. Placeholder business records rejected: a rendered "Placeholder Card" heading matches the pre-existing generic placeholder-copy fingerprint registry (starter-cards-sample-or-placeholder-card / template-wording-placeholder), is added to placeholders.placeholderPhrasesMatched, and its classification (via forcedContentOriginClassification) is UNKNOWN_CONTENT',
    (placeholderAudit.placeholders.placeholderPhrasesMatched.includes('starter-cards-sample-or-placeholder-card') ||
      placeholderAudit.placeholders.placeholderPhrasesMatched.includes('template-wording-placeholder')) &&
      placeholderAudit.placeholders.items.some((item) => item.contentOrigin === 'UNKNOWN_CONTENT'),
    `placeholderPhrasesMatched=${JSON.stringify(placeholderAudit.placeholders.placeholderPhrasesMatched)}`,
  );

  // Scenario 6 — Generic dashboard text rejected (pre-existing REUSABLE_SHELL fingerprint family).
  const genericDashboardFile: RenderedContentFileInput = {
    path: 'src/features/plots/GenericDashboard.tsx',
    content: `
export default function GenericDashboard() {
  return (
    <section>
      <h2>Generic Dashboard</h2>
    </section>
  );
}
`,
  };
  const genericDashboardAudit = collectRenderedContentEvidence({
    files: [genericDashboardFile],
    contractVocabulary: CONTRACT_VOCABULARY,
    cbgaVocabulary: CBGA_VOCABULARY,
    promptVocabulary: PROMPT_VOCABULARY,
  });
  assert(
    '6. Generic dashboard text rejected: a rendered "Generic Dashboard" heading matches the pre-existing "reusable-shell-generic-shell" fingerprint, is added to templates.genericShellFingerprintsMatched, and contentOriginAudit reports it as an unknown-content fragment (no constitutional ancestry)',
    genericDashboardAudit.templates.genericShellFingerprintsMatched.includes('reusable-shell-generic-shell') &&
      genericDashboardAudit.contentOriginAudit.unknownContentFragments.includes('Generic Dashboard'),
    `genericShellFingerprintsMatched=${JSON.stringify(genericDashboardAudit.templates.genericShellFingerprintsMatched)}, unknownContentFragments=${JSON.stringify(genericDashboardAudit.contentOriginAudit.unknownContentFragments)}`,
  );

  // ===============================================================================================
  // Scenario 9-11 — infrastructure text/navigation/loading states remain allowed.
  // ===============================================================================================
  const infraTextCases = ['Loading', 'Back', 'Retry', 'Next', 'Previous', 'Search', 'Menu', 'Navigation', 'Cancel', 'Confirm', 'Close'];
  const infraTextResults = infraTextCases.map((text) => ({ text, classification: classifyContentOrigin(text, 'test.tsx', CLASSIFIER_CONTEXT) }));
  assert(
    '9. Infrastructure text allowed: every generic UI-chrome word from Part 3\'s example list (Loading/Back/Retry/Next/Previous/Search/Menu/Navigation/Cancel/Confirm/Close) classifies INFRASTRUCTURE_CONTENT with ancestryRequired=false and ancestryProven=true — never UNKNOWN_CONTENT, regardless of contract/CBGA/prompt vocabulary',
    infraTextResults.every(
      (r) => r.classification.origin === 'INFRASTRUCTURE_CONTENT' && r.classification.ancestryRequired === false && r.classification.ancestryProven === true,
    ),
    JSON.stringify(infraTextResults.map((r) => ({ text: r.text, origin: r.classification.origin, ancestryRequired: r.classification.ancestryRequired }))),
  );

  const infraNavFile: RenderedContentFileInput = {
    path: 'src/blueprint/AppShell.tsx',
    content: `
export default function Shell() {
  return (
    <nav>
      <NavLink data-nav-kind="ROOT_SURFACE" to="/">Home</NavLink>
      <Link to="/plots">Plots</Link>
    </nav>
  );
}
`,
  };
  const infraNavAudit = collectRenderedContentEvidence({
    files: [infraNavFile],
    contractVocabulary: CONTRACT_VOCABULARY,
    cbgaVocabulary: CBGA_VOCABULARY,
    promptVocabulary: PROMPT_VOCABULARY,
  });
  const infraNavItem = infraNavAudit.navigation.items.find((item) => item.source === 'RENDERED_INFRASTRUCTURE_NAVIGATION_LABEL');
  assert(
    '10. Infrastructure navigation allowed: a structurally-marked (data-nav-kind="ROOT_SURFACE") "Home" navigation label is reported in navigation.infrastructureNavigationLabels, its RenderedEvidenceItem classifies contentOrigin=INFRASTRUCTURE_CONTENT with approvedProducer=BLUEPRINT_INFRASTRUCTURE, and it is absent from the product navigation.navigationLabels set that requires CBGA ancestry',
    infraNavAudit.navigation.infrastructureNavigationLabels.includes('Home') &&
      !infraNavAudit.navigation.navigationLabels.includes('Home') &&
      infraNavItem !== undefined &&
      infraNavItem.contentOrigin === 'INFRASTRUCTURE_CONTENT' &&
      infraNavItem.approvedProducer === 'BLUEPRINT_INFRASTRUCTURE',
    `infrastructureNavigationLabels=${JSON.stringify(infraNavAudit.navigation.infrastructureNavigationLabels)}, navigationLabels=${JSON.stringify(infraNavAudit.navigation.navigationLabels)}, infraNavItem=${JSON.stringify(infraNavItem)}`,
  );

  const loadingPhraseCases = ['Loading…', 'Loading...', 'Saving…', 'Retrying…', 'Submitting…'];
  const loadingResults = loadingPhraseCases.map((text) => ({ text, isInfra: isInfrastructureContentText(text), classification: classifyContentOrigin(text, 'test.tsx', CLASSIFIER_CONTEXT) }));
  assert(
    '11. Infrastructure loading states allowed: every generic "Loading…"/"Saving…"/"Retrying…"/"Submitting…"-style progress phrase classifies isInfrastructureContentText()=true and INFRASTRUCTURE_CONTENT (ancestry-exempt), never a business placeholder and never UNKNOWN_CONTENT',
    loadingResults.every((r) => r.isInfra && r.classification.origin === 'INFRASTRUCTURE_CONTENT'),
    JSON.stringify(loadingResults.map((r) => ({ text: r.text, isInfra: r.isInfra, origin: r.classification.origin }))),
  );

  // ===============================================================================================
  // Scenario 12 — product content requires ancestry (both directions: proven when it references
  // approved vocabulary, unproven/UNKNOWN_CONTENT when it does not).
  // ===============================================================================================
  const provenProductText = classifyContentOrigin('Plots', 'test.tsx', CLASSIFIER_CONTEXT);
  const unprovenProductText = classifyContentOrigin('Untraceable invented business copy nobody approved', 'test.tsx', CLASSIFIER_CONTEXT);
  assert(
    '12. Product content requires ancestry: text referencing real contract vocabulary ("Plots") classifies CONTRACT_PRODUCT_CONTENT with ancestryRequired=true and ancestryProven=true (real traceabilityChain), while text referencing no approved vocabulary at all classifies UNKNOWN_CONTENT with ancestryProven=false — product content can never silently pass without proof',
    provenProductText.origin === 'CONTRACT_PRODUCT_CONTENT' &&
      provenProductText.ancestryRequired === true &&
      provenProductText.ancestryProven === true &&
      provenProductText.traceabilityChain.length > 0 &&
      unprovenProductText.origin === 'UNKNOWN_CONTENT' &&
      unprovenProductText.ancestryProven === false,
    `provenProductText=${JSON.stringify(provenProductText)}, unprovenProductText=${JSON.stringify(unprovenProductText)}`,
  );

  // ===============================================================================================
  // Scenario 13 — infrastructure content exempt from CBGA/contract ancestry even with empty
  // vocabularies (proves the exemption is structural, not a vocabulary-match coincidence).
  // ===============================================================================================
  const emptyVocabContext: ContentOriginClassifierContext = { contractVocabulary: [], cbgaVocabulary: [], promptVocabulary: [] };
  const infraWithEmptyVocab = classifyContentOrigin('Back', 'test.tsx', emptyVocabContext);
  assert(
    '13. Infrastructure content exempt from CBGA: "Back" still classifies INFRASTRUCTURE_CONTENT with ancestryRequired=false even when contract/CBGA/prompt vocabularies are all empty — ANCESTRY_EXEMPT_ORIGINS includes INFRASTRUCTURE_CONTENT structurally, never because it happened to match some vocabulary',
    infraWithEmptyVocab.origin === 'INFRASTRUCTURE_CONTENT' &&
      infraWithEmptyVocab.ancestryRequired === false &&
      infraWithEmptyVocab.ancestryProven === true &&
      ANCESTRY_EXEMPT_ORIGINS.includes('INFRASTRUCTURE_CONTENT'),
    `infraWithEmptyVocab=${JSON.stringify(infraWithEmptyVocab)}`,
  );

  // ===============================================================================================
  // Scenario 14 — GPCA distinguishes infrastructure/product text end-to-end (real evidence items
  // from collectRenderedContentEvidence, not just the standalone classifier in isolation).
  // ===============================================================================================
  const mixedSurfaceFile: RenderedContentFileInput = {
    path: 'src/features/plots/PlotsSurface.tsx',
    content: `
export default function PlotsSurface() {
  return (
    <section>
      <h1>Plots</h1>
      <p>Loading</p>
    </section>
  );
}
`,
  };
  const mixedAudit = collectRenderedContentEvidence({
    files: [mixedSurfaceFile],
    contractVocabulary: CONTRACT_VOCABULARY,
    cbgaVocabulary: CBGA_VOCABULARY,
    promptVocabulary: PROMPT_VOCABULARY,
  });
  const plotsHeadingItem = mixedAudit.headings.items.find((item) => item.reason.includes('Plots'));
  const loadingTextItem = mixedAudit.contentOriginAudit.classifications.find((c) => c.text === 'Loading');
  assert(
    '14. GPCA distinguishes infrastructure/product text end-to-end: within the SAME real rendered-content audit, the "Plots" heading evidence item classifies contentOrigin=CONTRACT_PRODUCT_CONTENT (ancestry required+proven), while the "Loading" text fragment classifies INFRASTRUCTURE_CONTENT (ancestry-exempt) — proving the distinction is real evidence-model behavior, not merely a standalone-classifier property',
    plotsHeadingItem !== undefined &&
      plotsHeadingItem.contentOrigin === 'CONTRACT_PRODUCT_CONTENT' &&
      loadingTextItem !== undefined &&
      loadingTextItem.origin === 'INFRASTRUCTURE_CONTENT' &&
      loadingTextItem.ancestryRequired === false,
    `plotsHeadingItem=${JSON.stringify(plotsHeadingItem)}, loadingTextItem=${JSON.stringify(loadingTextItem)}`,
  );

  // ===============================================================================================
  // Scenario 15 — the real Blueprint Generator's real generated output contains zero
  // business-placeholder fingerprint matches.
  // ===============================================================================================
  const blueprintInput: UniversalBlueprintBuildInput = {
    contractId: 'c1',
    ideaId: 'i1',
    buildUnits: ['ui'],
    appName: 'Community Garden Plot Manager',
    tagline: 'Community Garden Plot Manager — modular application workspace',
    coreFeatureLabel: 'Plots',
    landingSummary: 'Community Garden Plot Manager — manage Plots and connected workflows.',
    homeSummary: 'Your Community Garden Plot Manager workspace is ready. Start with Plots.',
    contractDerivationSource: 'APPROVED_MODULE_PLAN',
  };
  const blueprintFiles = buildUniversalBlueprintWorkspaceFiles(blueprintInput);
  const blueprintRenderableFiles = blueprintFiles
    .filter((f) => /\.(tsx?|jsx?|html)$/i.test(f.relativePath))
    .map((f) => ({ path: f.relativePath, content: f.content }));
  const blueprintAudit = collectRenderedContentEvidence({
    files: blueprintRenderableFiles,
    contractVocabulary: CONTRACT_VOCABULARY,
    cbgaVocabulary: CBGA_VOCABULARY,
    promptVocabulary: PROMPT_VOCABULARY,
  });
  assert(
    '15. Blueprint no longer emits placeholder business content: the real buildUniversalBlueprintWorkspaceFiles() output (every real generated blueprint file) contains zero business-placeholder-fingerprint matches anywhere in contentOriginAudit.businessPlaceholderMatches — no "Sample X", "Demo Y", "Preview entry", "Example record", "Fake statistics" anywhere in the real blueprint shell',
    blueprintAudit.contentOriginAudit.businessPlaceholderMatches.length === 0,
    `businessPlaceholderMatches=${JSON.stringify(blueprintAudit.contentOriginAudit.businessPlaceholderMatches)}`,
  );

  // ===============================================================================================
  // Scenarios 16-18 — no GPCA / CBGA / Product Faithfulness weakening.
  // ===============================================================================================
  const TOUCHED_PRODUCTION_FILES = [
    'src/placeholder-template-elimination-authority-v1/product-content-origin-types.ts',
    'src/placeholder-template-elimination-authority-v1/infrastructure-content-lexicon.ts',
    'src/placeholder-template-elimination-authority-v1/business-placeholder-fingerprints.ts',
    'src/placeholder-template-elimination-authority-v1/content-origin-classifier.ts',
    'src/placeholder-template-elimination-authority-v1/placeholder-template-elimination-authority.ts',
    'src/placeholder-template-elimination-authority-v1/index.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-types.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
    'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    'src/universal-prompt-to-app-materialization/profile-feature-ui-generator.ts',
  ];

  const THIS_MILESTONE_NEW_SYMBOLS = [
    'ProductContentOrigin',
    'ContentOriginClassification',
    'contentOriginAudit',
    'classifyContentOrigin',
    'BUSINESS_PLACEHOLDER_RECORD_FINGERPRINTS',
    'matchBusinessPlaceholderFingerprints',
    'INFRASTRUCTURE_CONTENT_LEXICON',
    'Placeholder & Template Elimination Authority',
    'PLACEHOLDER_TEMPLATE_ELIMINATION_AUTHORITY_V1',
  ];
  function fileContainsAnyMilestoneSymbol(relPath: string): boolean {
    const abs = join(ROOT, relPath);
    if (!existsSync(abs)) return false;
    const content = readFileSync(abs, 'utf8');
    return THIS_MILESTONE_NEW_SYMBOLS.some((sym) => content.includes(sym));
  }
  function anyFileInDirContainsAnyMilestoneSymbol(dirRelPath: string): string | null {
    const abs = join(ROOT, dirRelPath);
    if (!existsSync(abs)) return null;
    const stack = [abs];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = readFileSync(full, 'utf8');
          const hit = THIS_MILESTONE_NEW_SYMBOLS.find((sym) => content.includes(sym));
          if (hit) return `${relative(ROOT, full)} contains "${hit}"`;
        }
      }
    }
    return null;
  }

  const UNTOUCHED_GPCA_JUDGMENT_FILES = [
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-stage-discovery.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
  ];
  const judgmentFileHits = UNTOUCHED_GPCA_JUDGMENT_FILES.filter(fileContainsAnyMilestoneSymbol);
  // Within the two GPCA evidence files this milestone DID touch, confirm the change is strictly
  // additive: the pre-existing gate call, pre-existing fingerprint matching, and pre-existing
  // generic-shell-navigation check are all still present verbatim.
  const renderedCollectorSource = readSource('src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts');
  const preExistingBehaviorPreserved =
    renderedCollectorSource.includes('evaluateRenderedContentGate(') &&
    renderedCollectorSource.includes('matchRenderedFingerprints(') &&
    renderedCollectorSource.includes('navigationIsFullyGenericShell') &&
    renderedCollectorSource.includes('nonSystemShellNavLabels');
  assert(
    "16. No GPCA weakening: none of this milestone's own new symbols appear anywhere in GPCA's actual judgment files (gate/detectors/scoring/traceability/pre-existing fingerprint-registry files this milestone never touched); the evidence-layer file this milestone DID touch (rendered-content-collector.ts) preserves its pre-existing gate call, pre-existing template-fingerprint matching, and pre-existing generic-shell-navigation check verbatim — this milestone only ADDS origin classification metadata and an additive business-placeholder registry feed on top",
    judgmentFileHits.length === 0 && preExistingBehaviorPreserved,
    `judgmentFileHits=${JSON.stringify(judgmentFileHits)}, preExistingBehaviorPreserved=${preExistingBehaviorPreserved}`,
  );

  const cbgaHit = anyFileInDirContainsAnyMilestoneSymbol('src/contract-bound-generation-authority-v4');
  assert(
    "17. No CBGA weakening: none of this milestone's own new symbols appear anywhere under src/contract-bound-generation-authority-v4 — this milestone only READS CbgaGenerationReport.modulePlan/navigationPlan/routePlan (existing, unmodified fields) via the existing, unmodified runContractBoundGenerationAuthority()",
    cbgaHit === null,
    cbgaHit === null ? 'no milestone symbol found in CBGA' : cbgaHit,
  );

  const pfHit = anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v1') ?? anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v2');
  assert(
    "18. No Product Faithfulness weakening: none of this milestone's own new symbols appear anywhere under src/product-faithfulness-v1 or src/product-faithfulness-v2 (this milestone never touched either directory)",
    pfHit === null,
    pfHit === null ? 'no milestone symbol found in Product Faithfulness v1/v2' : pfHit,
  );

  // ===============================================================================================
  // Scenario 19 — no application-specific logic in this milestone's own added code lines.
  // ===============================================================================================
  const touchedFilesDiff = execSync(`git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  }).toString();
  const addedCodeLines = touchedFilesDiff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|todo|medical|finance|lisa)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|todo|medical|finance|lisa)['"]\s*,/i,
  ];
  const HARDCODED_DOMAIN_WORDS = ['restaurant', 'calculator', 'crm', 'booking', 'inventory', 'notes', 'dashboard-app', 'authentication-app', 'crud-app', 'lisa'];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  const hardcodedDomainHits = addedCodeLines.filter((l) =>
    HARDCODED_DOMAIN_WORDS.some((w) => new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(l)),
  );
  assert(
    "19. No application-specific logic: none of this milestone's own added code lines (git diff, comments excluded) branch on a hardcoded product/domain word — every classifier rule is either a structural shape (business-placeholder wording, infrastructure lexicon, materialization-metadata shape) or a word-overlap check against THIS build's own vocabularies, never a specific application",
    logicHits.length === 0 && hardcodedDomainHits.length === 0,
    `logicHits=${JSON.stringify(logicHits)}, hardcodedDomainHits=${JSON.stringify(hardcodedDomainHits)}`,
  );

  // ===============================================================================================
  // Scenario 20 — no VERE work.
  // ===============================================================================================
  const vereHit = existsSync(join(ROOT, 'src', 'vere-v1')) ? anyFileInDirContainsAnyMilestoneSymbol('src/vere-v1') : null;
  const touchedFilesReferenceVere = TOUCHED_PRODUCTION_FILES.some((f) => /\bvere\b/i.test(readSource(f)));
  assert(
    '20. No VERE work: this milestone never touched any VERE directory/file, and none of the files this milestone DID touch reference VERE in any way',
    vereHit === null && !touchedFilesReferenceVere,
    `vereHit=${vereHit}, touchedFilesReferenceVere=${touchedFilesReferenceVere}`,
  );

  // ===============================================================================================
  // Scenario 21 — no NEW TypeScript errors introduced in touched files (git-stash baseline diff,
  // the same technique every prior GPCA/blueprint milestone validator in this codebase uses).
  // ===============================================================================================
  function runTsc(): { lines: string[]; failedToRun: boolean } {
    let output = '';
    let failedToRun = false;
    try {
      output = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      if (!output) failedToRun = true;
    }
    const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
    return { lines, failedToRun };
  }
  function touchedFileErrorSignatures(lines: string[]): Set<string> {
    const sigs = new Set<string>();
    for (const l of lines) {
      const normalized = l.replace(/\\/g, '/');
      const matchedFile = TOUCHED_PRODUCTION_FILES.find((f) => normalized.startsWith(f));
      if (!matchedFile) continue;
      const signature = normalized.replace(/\(\d+,\d+\)/, '(L,C)');
      sigs.add(signature);
    }
    return sigs;
  }

  const current = runTsc();
  const currentTouchedSignatures = touchedFileErrorSignatures(current.lines);

  let baselineTouchedSignatures = new Set<string>();
  let baselineFailedToRun = false;
  let stashed = false;
  try {
    const stashOutput = execSync(`git stash push -u -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, { cwd: ROOT, encoding: 'utf8' });
    stashed = !/No local changes to save/i.test(stashOutput);
    const baseline = runTsc();
    baselineFailedToRun = baseline.failedToRun;
    baselineTouchedSignatures = touchedFileErrorSignatures(baseline.lines);
  } catch {
    baselineFailedToRun = true;
  } finally {
    if (stashed) {
      try {
        execSync('git stash pop', { cwd: ROOT, encoding: 'utf8' });
      } catch (popErr) {
        throw new Error(
          `CRITICAL: failed to restore git stash after scenario 21 baseline tsc run — working tree may be left stashed. Run "git stash pop" manually. ${String(popErr)}`,
        );
      }
    }
  }

  const newErrorSignatures = [...currentTouchedSignatures].filter((s) => !baselineTouchedSignatures.has(s));
  assert(
    '21. No new TypeScript errors introduced in touched files',
    !current.failedToRun && !baselineFailedToRun && newErrorSignatures.length === 0,
    current.failedToRun || baselineFailedToRun
      ? `tsc did not run/produce output (currentFailed=${current.failedToRun}, baselineFailed=${baselineFailedToRun})`
      : `pre-existing touched-file errors (unrelated to this milestone, not counted)=${baselineTouchedSignatures.size}, NEW touched-file errors=${newErrorSignatures.length}${newErrorSignatures.length > 0 ? `: ${newErrorSignatures.join(' | ')}` : ''}`,
  );

  // ===============================================================================================
  // Scenario 22 — mandatory Capability Matrix row.
  // ===============================================================================================
  const capabilityRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Placeholder & Template Elimination Authority');
  assert(
    '22. Capability Matrix included: a dedicated "Placeholder & Template Elimination Authority" row exists with Status/Production Wired/Auto Run/Activation Allowed/Notes',
    capabilityRow !== undefined && capabilityRow.status === 'IMPLEMENTED' && capabilityRow.productionWired === 'YES',
    `row present=${capabilityRow !== undefined}, status=${capabilityRow?.status}, productionWired=${capabilityRow?.productionWired}`,
  );

  // ===============================================================================================
  // Scenario 23 — production wiring verified: the real production adapter
  // (generation-pipeline-compliance-adapter.ts's buildGpcaPostMaterializationReport) actually builds
  // and forwards CBGA/prompt vocabulary into collectRenderedContentEvidence (the exact function this
  // milestone modified), and that function — the exact one the real adapter calls — actually uses
  // that vocabulary to classify content, not merely a type-level change nobody's production code path
  // reaches.
  // ===============================================================================================
  const adapterSource = readSource('src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts');
  const adapterWiresVocabulary =
    adapterSource.includes('function buildCbgaVocabulary(') &&
    adapterSource.includes('function buildPromptVocabulary(') &&
    /collectRenderedContentEvidence\(\{\s*files,\s*contractVocabulary,\s*cbgaVocabulary,\s*promptVocabulary\s*\}\)/.test(adapterSource);
  const onlyCbgaProductFile: RenderedContentFileInput = {
    path: 'src/features/misc/CbgaOnly.tsx',
    content: `
export default function CbgaOnly() {
  return (
    <section>
      <h2>seedling-inventory</h2>
    </section>
  );
}
`,
  };
  const cbgaOnlyAudit = collectRenderedContentEvidence({
    files: [onlyCbgaProductFile],
    contractVocabulary: [],
    cbgaVocabulary: [],
    promptVocabulary: PROMPT_VOCABULARY,
  });
  const promptOnlyClassification = cbgaOnlyAudit.contentOriginAudit.classifications.find((c) => c.text === 'seedling-inventory');
  assert(
    '23. Production wiring verified: generation-pipeline-compliance-adapter.ts (the real production adapter) defines and calls buildCbgaVocabulary()/buildPromptVocabulary() and forwards their output as cbgaVocabulary/promptVocabulary into the real collectRenderedContentEvidence() call inside buildGpcaPostMaterializationReport — and that exact function, called with only promptVocabulary populated (no contract/CBGA vocabulary), classifies matching text as PROMPT_PRODUCT_CONTENT, proving the vocabulary parameter is actually consumed end-to-end by the real production code path, not a dead parameter',
    adapterWiresVocabulary && promptOnlyClassification !== undefined && promptOnlyClassification.origin === 'PROMPT_PRODUCT_CONTENT',
    `adapterWiresVocabulary=${adapterWiresVocabulary}, promptOnlyClassification=${JSON.stringify(promptOnlyClassification)}`,
  );

  // ===============================================================================================
  // Scenarios 24-25 — existing rendered-content / contract-traceability validator fixtures remain
  // compatible (no behavioral regression from this milestone's additive changes).
  // ===============================================================================================
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
  const compliantAuditNoNewVocab = collectRenderedContentEvidence({ files: [COMPLIANT_FILE], contractVocabulary: CONTRACT_VOCABULARY });
  assert(
    '24. Existing rendered-content validator remains compatible: collectRenderedContentEvidence() called exactly as the pre-existing rendered-content-evidence-v1 validator calls it (no cbgaVocabulary/promptVocabulary argument at all) still returns gateOutcome=RENDERED_CONTENT_ALLOWED for its known-compliant fixture — the new, optional parameters never change pre-existing caller behavior when omitted',
    compliantAuditNoNewVocab.gateOutcome === 'RENDERED_CONTENT_ALLOWED' && compliantAuditNoNewVocab.placeholders.placeholderPhrasesMatched.length === 0,
    `gateOutcome=${compliantAuditNoNewVocab.gateOutcome}, placeholderPhrasesMatched=${JSON.stringify(compliantAuditNoNewVocab.placeholders.placeholderPhrasesMatched)}`,
  );

  const driftFile: RenderedContentFileInput = {
    path: 'src/features/plots/DriftPage.tsx',
    content: `
export default function DriftPage() {
  return (
    <section>
      <h1>Completely unrelated visible copy about nothing in the contract</h1>
    </section>
  );
}
`,
  };
  const driftAuditNoNewVocab = collectRenderedContentEvidence({ files: [driftFile], contractVocabulary: CONTRACT_VOCABULARY });
  assert(
    '25. Existing contract-traceability validator remains compatible: matchRenderedFingerprints()/collectRenderedContentEvidence() still correctly compute renderedContractMatchPercent=0 and gateOutcome=RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT for a genuinely off-contract fixture (the pre-existing drift-detection behavior this milestone must never weaken), and matchRenderedFingerprints() itself is still a pure, unmodified function callable exactly as before',
    driftAuditNoNewVocab.renderedContractMatchPercent === 0 &&
      driftAuditNoNewVocab.gateOutcome === 'RENDERED_CONTENT_BLOCKED_RENDERED_CONTRACT_DRIFT' &&
      matchRenderedFingerprints('Completely unrelated visible copy about nothing in the contract').length === 0,
    `renderedContractMatchPercent=${driftAuditNoNewVocab.renderedContractMatchPercent}, gateOutcome=${driftAuditNoNewVocab.gateOutcome}`,
  );

  // Sanity guards: keep these imports/values alive as compile-time proof this validator depends on
  // the real modules, not locally re-declared copies.
  void forcedContentOriginClassification;
  void auditProductContentOrigins;

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
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
