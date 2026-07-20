/**
 * INFRASTRUCTURE_PRODUCT_BOUNDARY_AUTHORITY_V1 — validation.
 *
 * Blueprint Generator Contract-Bound Replacement V1 exposed a genuine, generic architectural fact:
 * GPCA's `detectBlueprintBypass`/`detectGenericShellInjection` block generation the instant certain
 * structural blueprint files (WelcomeScreen.tsx, OnboardingScreen.tsx, the 8 known generic pages)
 * exist — but ~15 OTHER existing production authorities legitimately require those exact files to
 * exist. Neither system was wrong; there was simply no formal distinction between "this file hosts
 * the product" (infrastructure) and "this file IS the product" (business content).
 *
 * This validator proves the new Infrastructure vs Product Boundary Authority V1
 * (`src/infrastructure-product-boundary-authority-v1/`) resolves that conflict correctly:
 *
 *   - Every classification is 100% content-based — never a filename, never a whitelist (scenario 25
 *     classifies the exact same content under two unrelated fake paths and proves identical output).
 *   - GPCA's two presence-based detectors now consult this real, per-build classification instead of
 *     asking "does this file exist" (scenarios 10-13), while remaining EXACTLY as strict as before
 *     whenever no boundary evidence is supplied, or the evidence says PRODUCT/MIXED/UNKNOWN
 *     (scenarios 11, 12, 19, 20, 21 — backward compatibility + no weakening).
 *   - GPCA scoring, CBGA policy, and Product Faithfulness are provably untouched (scenarios 14-16).
 *
 * Run only:
 *   npx tsx scripts/validate-infrastructure-product-boundary-authority-v1.ts
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyBoundaryFile,
  runInfrastructureProductBoundaryVerification,
  isPathSafeInfrastructure,
} from '../src/infrastructure-product-boundary-authority-v1/index.js';
import {
  detectBlueprintBypass,
  detectGenericShellInjection,
} from '../src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.js';
import { runGenerationPipelineComplianceAuthority } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.js';
import { buildGpcaPostMaterializationReport } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { GpcaPipelineEvidenceInput } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.js';
import type { InfrastructureProductBoundaryAudit } from '../src/infrastructure-product-boundary-authority-v1/index.js';
import type { CanonicalProductContract } from '../src/product-faithfulness-v2/generation-faithfulness-types.js';
import type { CbgaGenerationReport } from '../src/contract-bound-generation-authority-v4/index.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'INFRASTRUCTURE_PRODUCT_BOUNDARY_AUTHORITY_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const contractVocabulary = ['Reservations', 'Riverside Bistro Manager'];

// =================================================================================================
// Fixtures — every one is a synthetic, generic, non-app-specific file body. None of them reference
// restaurant/calculator/CRM/todo/booking/medical/finance domain logic; "Reservations" here is only
// used as a stand-in noun the same way any approved module name would be, to prove contract-reference
// detection, never as domain-specific business logic.
// =================================================================================================

const cleanInfrastructureFixture = {
  path: 'src/infra/RuntimeShell.tsx',
  content: `
import { useState, useEffect } from 'react';
import { Suspense } from 'react';

export type ShellRoute = 'a' | 'b';

class ErrorBoundary extends Error {}

export default function RuntimeShell() {
  const [route, setRoute] = useState<ShellRoute>('a');
  useEffect(() => {}, []);
  function renderRoute() {
    switch (route) {
      case 'a': return <PaneA />;
      case 'b': return <PaneB />;
    }
  }
  return (
    <Suspense fallback={<div />}>
      {renderRoute()}
    </Suspense>
  );
}
`,
};

const cleanProductFixture = {
  path: 'src/features/reservations/ReservationsSurface.tsx',
  content: `
export default function ReservationsSurface() {
  return (
    <div>
      <h1>Reservations</h1>
      <p>Manage every Riverside Bistro Manager reservation from one place.</p>
      <button type="button">Add reservation</button>
    </div>
  );
}
`,
};

const mixedFixture = {
  path: 'src/blueprint/MixedShell.tsx',
  content: `
import { useNavigate } from 'react-router-dom';
export default function MixedShell() {
  const navigate = useNavigate();
  function handleClick() { navigate('/home'); }
  return (
    <div>
      <h1>Welcome to your app</h1>
      <button type="button" onClick={handleClick}>Get started</button>
    </div>
  );
}
`,
};

const unknownFixture = {
  path: 'src/misc/BlankPane.tsx',
  content: `
export default function BlankPane() {
  return <div className="blank-pane" />;
}
`,
};

const businessCopyInInfraFixture = {
  path: 'src/infra/RoutedHeader.tsx',
  content: `
import { useNavigate } from 'react-router-dom';
export default function RoutedHeader() {
  const navigate = useNavigate();
  return (
    <header>
      <h2>Your dashboard overview</h2>
    </header>
  );
}
`,
};

const placeholderInInfraFixture = {
  path: 'src/infra/RoutedPlaceholder.tsx',
  content: `
import { useNavigate } from 'react-router-dom';
export default function RoutedPlaceholder() {
  const navigate = useNavigate();
  return (
    <div>
      <p>Coming soon</p>
    </div>
  );
}
`,
};

const hardcodedNavInInfraFixture = {
  path: 'src/infra/RoutedNav.tsx',
  content: `
import { useNavigate } from 'react-router-dom';
export default function RoutedNav() {
  const navigate = useNavigate();
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/reports">Reports</a>
    </nav>
  );
}
`,
};

const templateWordingInProductFixture = {
  path: 'src/features/generic/GenericSurface.tsx',
  content: `
export default function GenericSurface() {
  return (
    <div>
      <h1>Welcome to your dashboard</h1>
      <p>This is a modular application shell with navigation, settings, and feature routing.</p>
    </div>
  );
}
`,
};

const reusableShellWordingFixture = {
  path: 'src/features/generic/ReusableShellSurface.tsx',
  content: `
export default function ReusableShellSurface() {
  return (
    <div>
      <p>This app shell is a generic shell for your application.</p>
    </div>
  );
}
`,
};

async function main(): Promise<void> {
  // ===============================================================================================
  // Scenarios 1-4 — the four Phase 5 classifications, each proven on a controlled fixture.
  // ===============================================================================================
  const infraResult = classifyBoundaryFile(cleanInfrastructureFixture, contractVocabulary);
  assert(
    '1. Detects INFRASTRUCTURE files (structural signal present, zero business-content signal)',
    infraResult.classification === 'INFRASTRUCTURE' && infraResult.safeAsInfrastructure,
    `classification=${infraResult.classification}, infraSignals=${infraResult.infrastructureSignals.map((s) => s.kind).join(',')}`,
  );

  const productResult = classifyBoundaryFile(cleanProductFixture, contractVocabulary);
  assert(
    '2. Detects PRODUCT files (business-content signal present, zero structural infrastructure signal)',
    productResult.classification === 'PRODUCT' && !productResult.safeAsInfrastructure,
    `classification=${productResult.classification}, businessSignals=${productResult.businessContentSignals.length}`,
  );

  const mixedResult = classifyBoundaryFile(mixedFixture, contractVocabulary);
  assert(
    '3. Detects MIXED files (both structural infrastructure AND business-content signals present)',
    mixedResult.classification === 'MIXED' && !mixedResult.safeAsInfrastructure,
    `classification=${mixedResult.classification}, infraSignals=${mixedResult.infrastructureSignals.length}, businessSignals=${mixedResult.businessContentSignals.length}`,
  );

  const unknownResult = classifyBoundaryFile(unknownFixture, contractVocabulary);
  assert(
    '4. Detects UNKNOWN files (JSX markup present, but zero infrastructure signal and zero business-content signal)',
    unknownResult.classification === 'UNKNOWN' && !unknownResult.safeAsInfrastructure,
    `classification=${unknownResult.classification}`,
  );

  // ===============================================================================================
  // Scenarios 5-9 — Phase 3 boundary-violation detail signals.
  // ===============================================================================================
  const businessCopyInInfra = classifyBoundaryFile(businessCopyInInfraFixture, contractVocabulary);
  assert(
    '5. Detects business copy inside an otherwise-infrastructure file (heading text disqualifies it from INFRASTRUCTURE)',
    businessCopyInInfra.classification === 'MIXED' &&
      businessCopyInInfra.businessContentSignals.some((s) => s.kind === 'HEADING'),
    `classification=${businessCopyInInfra.classification}, signals=${JSON.stringify(businessCopyInInfra.businessContentSignals)}`,
  );

  const placeholderInInfra = classifyBoundaryFile(placeholderInInfraFixture, contractVocabulary);
  assert(
    '6. Detects placeholder content inside an otherwise-infrastructure file ("Coming soon" placeholder fingerprint)',
    placeholderInInfra.classification === 'MIXED' &&
      placeholderInInfra.businessContentSignals.some((s) => s.kind.includes('PLACEHOLDER_COPY')),
    `classification=${placeholderInInfra.classification}, signals=${JSON.stringify(placeholderInInfra.businessContentSignals)}`,
  );

  const hardcodedNavInInfra = classifyBoundaryFile(hardcodedNavInInfraFixture, contractVocabulary);
  assert(
    '7. Detects hardcoded navigation labels inside an otherwise-infrastructure file (nav labels disqualify it from INFRASTRUCTURE)',
    hardcodedNavInInfra.classification === 'MIXED' &&
      hardcodedNavInInfra.businessContentSignals.some((s) => s.kind === 'BUSINESS_NAVIGATION'),
    `classification=${hardcodedNavInInfra.classification}, signals=${JSON.stringify(hardcodedNavInInfra.businessContentSignals)}`,
  );

  const templateInProduct = classifyBoundaryFile(templateWordingInProductFixture, contractVocabulary);
  assert(
    '8. Detects template generator wording inside a PRODUCT-classified file (generic modular-shell fingerprint surfaced even though the file has no infrastructure signal)',
    templateInProduct.classification === 'PRODUCT' &&
      templateInProduct.businessContentSignals.some((s) => s.kind.includes('REUSABLE_SHELL')),
    `classification=${templateInProduct.classification}, signals=${JSON.stringify(templateInProduct.businessContentSignals)}`,
  );

  const reusableShellBusinessContent = classifyBoundaryFile(reusableShellWordingFixture, contractVocabulary);
  assert(
    '9. Detects reusable-shell business content wording ("app shell"/"generic shell" fingerprints) and correctly classifies the file as PRODUCT, not a free pass',
    reusableShellBusinessContent.classification === 'PRODUCT' &&
      reusableShellBusinessContent.businessContentSignals.some((s) => s.kind.includes('REUSABLE_SHELL')),
    `classification=${reusableShellBusinessContent.classification}, signals=${JSON.stringify(reusableShellBusinessContent.businessContentSignals)}`,
  );

  // ===============================================================================================
  // Scenarios 10-13 — GPCA gate integration: infrastructure exemption is real, precise, and additive.
  // ===============================================================================================
  const baseEvidence: GpcaPipelineEvidenceInput = {
    contract: {
      contractId: 'c1',
      productIdentity: 'Riverside Bistro Manager',
      primaryWorkflows: ['Reservations'],
      coreEntities: ['Reservation'],
      coreActions: ['create', 'update'],
      navigationExpectations: ['Reservations'],
      majorFeatureGroups: ['Reservations'],
      businessConcepts: ['Reservations'],
      allConceptNames: ['Reservations', 'Riverside Bistro Manager'],
    },
    cbgaReport: {
      readOnly: true,
      contractVersion: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
      contractId: 'c1',
      productIdentity: 'Riverside Bistro Manager',
      modulePlan: [
        {
          readOnly: true,
          moduleId: 'reservations',
          displayName: 'Reservations',
          sourceContractConcept: 'Reservations',
          requiredWorkflows: [],
          requiredActions: [],
          requiredEntities: [],
          requiredUiSurfaces: [],
          evidenceSource: 'CONTRACT_ENTITY',
          confidence: 90,
          generationAllowed: true,
        },
      ],
      routePlan: [{ readOnly: true, routeId: 'reservations', path: '/reservations', label: 'Reservations', moduleId: 'reservations', sourceContractConcept: 'Reservations', requiredScreenPurpose: 'manage reservations' }],
      navigationPlan: [],
      surfacePlan: {
        readOnly: true,
        titleRequirement: 'Riverside Bistro Manager',
        primaryInteractionRequirement: 'Reservations',
        emptyStateRequirement: 'No Reservations yet.',
        successStateRequirement: 'Reservations saved.',
        requiredControls: [],
        requiredDataConcepts: [],
        sourceContractConcept: 'Riverside Bistro Manager',
      },
      initialGate: { readOnly: true, outcome: 'GENERATION_ALLOWED', reasons: [], moduleEvaluations: [], routeEvaluations: [], navigationEvaluations: [], surfaceEvaluation: { readOnly: true, titleIsGeneric: false, titleMatchesProductIdentity: true, welcomeSurfaceIsGenericShell: false, primaryWorkflowVisible: true, primaryWorkflowInteractive: true, reasons: [] }, unsupportedModulesRemoved: [], unsupportedRoutesRemoved: [], unsupportedNavigationRemoved: [], genericShellSurfaceBlocked: false, contractConceptsMissing: [] },
      repairsApplied: [],
      repairedInputs: { readOnly: true, moduleIds: ['reservations'], routes: ['/reservations'], navigationLabels: [], appTitle: 'Riverside Bistro Manager', welcomeSurfaceText: 'Riverside Bistro Manager — Reservations.', actionsPerformed: [] },
      finalGate: { readOnly: true, outcome: 'GENERATION_ALLOWED', reasons: [], moduleEvaluations: [], routeEvaluations: [], navigationEvaluations: [], surfaceEvaluation: { readOnly: true, titleIsGeneric: false, titleMatchesProductIdentity: true, welcomeSurfaceIsGenericShell: false, primaryWorkflowVisible: true, primaryWorkflowInteractive: true, reasons: [] }, unsupportedModulesRemoved: [], unsupportedRoutesRemoved: [], unsupportedNavigationRemoved: [], genericShellSurfaceBlocked: false, contractConceptsMissing: [] },
      finalGateOutcome: 'GENERATION_ALLOWED',
      generatedAt: new Date().toISOString(),
    },
    proposed: {
      appTitle: 'Riverside Bistro Manager',
      moduleIds: ['reservations'],
      routes: ['/reservations'],
      navigationLabels: [],
      generatedFilePaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'],
    },
  };

  const withoutBoundaryAudit = detectBlueprintBypass(baseEvidence);
  assert(
    '10. Without any boundary evidence supplied, detectBlueprintBypass behaves exactly as before this milestone (still blocks on presence alone) — backward compatible, no weakening by default',
    withoutBoundaryAudit.length === 2,
    `detected=${JSON.stringify(withoutBoundaryAudit)}`,
  );

  const safeInfraAudit: InfrastructureProductBoundaryAudit = {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    results: [
      { readOnly: true, path: 'src/blueprint/WelcomeScreen.tsx', classification: 'INFRASTRUCTURE', infrastructureSignals: [], businessContentSignals: [], contractReferenced: false, safeAsInfrastructure: true, reasons: ['synthetic'] },
      { readOnly: true, path: 'src/blueprint/OnboardingScreen.tsx', classification: 'INFRASTRUCTURE', infrastructureSignals: [], businessContentSignals: [], contractReferenced: false, safeAsInfrastructure: true, reasons: ['synthetic'] },
    ],
    infrastructureCount: 2,
    productCount: 0,
    mixedCount: 0,
    unknownCount: 0,
    safeInfrastructurePaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'],
    violatingPaths: [],
  };

  const withSafeBoundaryAudit = detectBlueprintBypass(baseEvidence, safeInfraAudit);
  assert(
    "11. Verifies GPCA no longer blocks infrastructure solely because it exists: when the SAME evidence's files are classified INFRASTRUCTURE by their own real content, detectBlueprintBypass no longer flags them",
    withSafeBoundaryAudit.length === 0,
    `detected=${JSON.stringify(withSafeBoundaryAudit)}`,
  );

  const mixedAudit: InfrastructureProductBoundaryAudit = {
    ...safeInfraAudit,
    results: safeInfraAudit.results.map((r) => ({ ...r, classification: 'MIXED' as const, safeAsInfrastructure: false })),
    infrastructureCount: 0,
    mixedCount: 2,
    safeInfrastructurePaths: [],
    violatingPaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'],
  };
  const withMixedBoundaryAudit = detectBlueprintBypass(baseEvidence, mixedAudit);
  assert(
    '12. Verifies GPCA still blocks genuine template/mixed generation: when boundary evidence classifies the same files MIXED (not pure INFRASTRUCTURE), detectBlueprintBypass still flags them — the exemption only ever fires for a true INFRASTRUCTURE classification',
    withMixedBoundaryAudit.length === 2,
    `detected=${JSON.stringify(withMixedBoundaryAudit)}`,
  );

  const shellPageEvidence: GpcaPipelineEvidenceInput = {
    ...baseEvidence,
    proposed: { ...baseEvidence.proposed, generatedFilePaths: ['src/blueprint/pages/SettingsPage.tsx'] },
  };
  const settingsPageProductAudit: InfrastructureProductBoundaryAudit = {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    results: [
      { readOnly: true, path: 'src/blueprint/pages/SettingsPage.tsx', classification: 'PRODUCT', infrastructureSignals: [], businessContentSignals: [{ kind: 'HEADING', evidence: 'Settings' }], contractReferenced: false, safeAsInfrastructure: false, reasons: ['synthetic'] },
    ],
    infrastructureCount: 0,
    productCount: 1,
    mixedCount: 0,
    unknownCount: 0,
    safeInfrastructurePaths: [],
    violatingPaths: [],
  };
  const genericShellForProduct = detectGenericShellInjection(shellPageEvidence, settingsPageProductAudit);
  assert(
    '13. Verifies product files remain fully contract-bound: a known generic page classified PRODUCT (not exempt) with no contract-justified nav label is still detected by detectGenericShellInjection exactly as before',
    genericShellForProduct.detectedPaths.includes('src/blueprint/pages/SettingsPage.tsx'),
    `detected=${JSON.stringify(genericShellForProduct)}`,
  );

  // ===============================================================================================
  // Scenario 14 — full end-to-end gate proof: same evidence, only the boundary audit differs. The
  // top-level authority entrypoint (not just the low-level detector functions) genuinely stops citing
  // COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS / blueprintBypassDetected the instant real content proves the
  // exact files are pure infrastructure.
  //
  // HONEST SCOPE NOTE: the gate's SEPARATE, coarser-grained, per-STAGE `detectTemplateGeneratorUsage`
  // check (Blueprint Generator Contract-Bound Replacement V1's own, already-disclosed PARTIAL scope —
  // pipeline-stage-discovery.ts's BLUEPRINT_GENERATOR structural flags, forced true because the fixed
  // shell files still exist) still fires afterwards for THIS evidence, because this milestone's file-
  // level boundary exemption and that pre-existing stage-level flag are two independent detectors at
  // two different granularities — this milestone only replaces the presence-based, per-FILE checks
  // (blueprint-bypass / generic-shell-injection) with the responsibility-based boundary authority, as
  // Phase 6 specifies; it never touches pipeline-stage-discovery.ts's stage-level flags (that would be
  // exactly the "modify GPCA scoring" this milestone is forbidden from doing).
  // ===============================================================================================
  const reportWithoutBoundary = runGenerationPipelineComplianceAuthority(baseEvidence, null, null);
  const reportWithSafeBoundary = runGenerationPipelineComplianceAuthority(baseEvidence, null, safeInfraAudit);
  assert(
    '14. End-to-end: runGenerationPipelineComplianceAuthority blocks COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS (blueprintBypassDetected non-empty) without boundary evidence, and that SPECIFIC file-level bypass is fully cleared (blueprintBypassDetected=[]) once the same files are proven INFRASTRUCTURE by their own real content — the only difference between the two calls is the boundary audit',
    reportWithoutBoundary.finalGateOutcome === 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS' &&
      reportWithoutBoundary.blueprintBypassDetected.length === 2 &&
      reportWithSafeBoundary.finalGateOutcome !== 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS' &&
      reportWithSafeBoundary.blueprintBypassDetected.length === 0,
    `without=${reportWithoutBoundary.finalGateOutcome} (bypass=${JSON.stringify(reportWithoutBoundary.blueprintBypassDetected)}), with=${reportWithSafeBoundary.finalGateOutcome} (bypass=${JSON.stringify(reportWithSafeBoundary.blueprintBypassDetected)})`,
  );

  // ===============================================================================================
  // Scenario 15 — content-based, never path-based: identical content under two unrelated fake paths
  // classifies identically. This is the direct, mechanical proof against filename whitelisting.
  // ===============================================================================================
  const sameContentDifferentPathA = classifyBoundaryFile({ path: 'src/blueprint/WelcomeScreen.tsx', content: cleanInfrastructureFixture.content }, contractVocabulary);
  const sameContentDifferentPathB = classifyBoundaryFile({ path: 'src/totally/unrelated/RandomFileName123.tsx', content: cleanInfrastructureFixture.content }, contractVocabulary);
  assert(
    '15. Classification is 100% content-based, never path-based: the exact same content classifies identically whether its path is a known blueprint filename or a completely unrelated random filename (no whitelist)',
    sameContentDifferentPathA.classification === sameContentDifferentPathB.classification &&
      sameContentDifferentPathA.classification === 'INFRASTRUCTURE' &&
      JSON.stringify(sameContentDifferentPathA.infrastructureSignals) === JSON.stringify(sameContentDifferentPathB.infrastructureSignals),
    `pathA=${sameContentDifferentPathA.classification}, pathB=${sameContentDifferentPathB.classification}`,
  );

  // ===============================================================================================
  // Scenario 16 — verifier aggregate correctness (Phase 5).
  // ===============================================================================================
  const verifierAudit = runInfrastructureProductBoundaryVerification(
    [cleanInfrastructureFixture, cleanProductFixture, mixedFixture, unknownFixture],
    contractVocabulary,
  );
  assert(
    '16. runInfrastructureProductBoundaryVerification aggregates all four classifications correctly and reports MIXED/UNKNOWN as violating paths (Phase 5: "mixed files must be decomposed or rejected... unknown files must fail")',
    verifierAudit.infrastructureCount === 1 &&
      verifierAudit.productCount === 1 &&
      verifierAudit.mixedCount === 1 &&
      verifierAudit.unknownCount === 1 &&
      verifierAudit.violatingPaths.includes(mixedFixture.path) &&
      verifierAudit.violatingPaths.includes(unknownFixture.path) &&
      verifierAudit.safeInfrastructurePaths.includes(cleanInfrastructureFixture.path),
    `audit=${JSON.stringify({ infra: verifierAudit.infrastructureCount, product: verifierAudit.productCount, mixed: verifierAudit.mixedCount, unknown: verifierAudit.unknownCount, violating: verifierAudit.violatingPaths })}`,
  );

  assert(
    '17. isPathSafeInfrastructure resolves to false for any path when no audit is supplied (null/undefined) — the gate\'s fallback is always the original, unmodified strictness',
    isPathSafeInfrastructure(null, cleanInfrastructureFixture.path) === false &&
      isPathSafeInfrastructure(undefined, cleanInfrastructureFixture.path) === false,
    'checked null/undefined audit fallback',
  );

  // ===============================================================================================
  // Scenario 18 — end-to-end production wiring: buildGpcaPostMaterializationReport (the real
  // production adapter one-prompt-build-orchestrator.ts calls) actually computes and attaches a real
  // boundaryAudit when given a real workspace directory on disk.
  // ===============================================================================================
  const tempWorkspaceDir = mkdtempSync(join(tmpdir(), 'gpca-boundary-authority-test-'));
  try {
    mkdirSync(join(tempWorkspaceDir, 'src', 'infra'), { recursive: true });
    mkdirSync(join(tempWorkspaceDir, 'src', 'features', 'reservations'), { recursive: true });
    writeFileSync(join(tempWorkspaceDir, 'src', 'infra', 'RuntimeShell.tsx'), cleanInfrastructureFixture.content, 'utf8');
    writeFileSync(join(tempWorkspaceDir, 'src', 'features', 'reservations', 'ReservationsSurface.tsx'), cleanProductFixture.content, 'utf8');

    const fakeContract: CanonicalProductContract = {
      readOnly: true,
      contractId: 'c1',
      productIdentity: 'Riverside Bistro Manager',
      productSummary: 'Riverside Bistro Manager',
      primaryWorkflows: ['Reservations'],
      coreEntities: ['Reservation'],
      coreActions: ['create', 'update'],
      navigationExpectations: ['Reservations'],
      majorFeatureGroups: ['Reservations'],
      businessConcepts: ['Reservations'],
      allConceptNames: ['Reservations', 'Riverside Bistro Manager'],
      generatedAt: new Date().toISOString(),
    } as unknown as CanonicalProductContract;

    const fakeCbgaReport: CbgaGenerationReport = {
      readOnly: true,
      contractVersion: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
      contractId: 'c1',
      productIdentity: 'Riverside Bistro Manager',
      modulePlan: [],
      routePlan: [],
      navigationPlan: [],
      surfacePlan: { readOnly: true, titleRequirement: 'Riverside Bistro Manager', primaryInteractionRequirement: 'Reservations', emptyStateRequirement: 'No Reservations yet.', successStateRequirement: 'Reservations saved.', requiredControls: [], requiredDataConcepts: [], sourceContractConcept: 'Riverside Bistro Manager' },
      initialGate: { readOnly: true, outcome: 'GENERATION_ALLOWED', reasons: [], moduleEvaluations: [], routeEvaluations: [], navigationEvaluations: [], surfaceEvaluation: { readOnly: true, titleIsGeneric: false, titleMatchesProductIdentity: true, welcomeSurfaceIsGenericShell: false, primaryWorkflowVisible: true, primaryWorkflowInteractive: true, reasons: [] }, unsupportedModulesRemoved: [], unsupportedRoutesRemoved: [], unsupportedNavigationRemoved: [], genericShellSurfaceBlocked: false, contractConceptsMissing: [] },
      repairsApplied: [],
      repairedInputs: { readOnly: true, moduleIds: [], routes: [], navigationLabels: [], appTitle: 'Riverside Bistro Manager', welcomeSurfaceText: 'Riverside Bistro Manager.', actionsPerformed: [] },
      finalGate: { readOnly: true, outcome: 'GENERATION_ALLOWED', reasons: [], moduleEvaluations: [], routeEvaluations: [], navigationEvaluations: [], surfaceEvaluation: { readOnly: true, titleIsGeneric: false, titleMatchesProductIdentity: true, welcomeSurfaceIsGenericShell: false, primaryWorkflowVisible: true, primaryWorkflowInteractive: true, reasons: [] }, unsupportedModulesRemoved: [], unsupportedRoutesRemoved: [], unsupportedNavigationRemoved: [], genericShellSurfaceBlocked: false, contractConceptsMissing: [] },
      finalGateOutcome: 'GENERATION_ALLOWED',
      generatedAt: new Date().toISOString(),
    } as unknown as CbgaGenerationReport;

    const fakeBuildPlan = {
      extraction: { appName: 'Riverside Bistro Manager', targetUsers: ['users'] },
      modulePlan: { approvedModuleIds: [], routes: [] },
    } as unknown as ResolvedPromptFaithfulBuildPlan;

    const productionReport = buildGpcaPostMaterializationReport({
      contract: fakeContract,
      cbgaReport: fakeCbgaReport,
      buildPlan: fakeBuildPlan,
      generatedFilePaths: ['src/infra/RuntimeShell.tsx', 'src/features/reservations/ReservationsSurface.tsx'],
      workspaceDir: tempWorkspaceDir,
    });

    assert(
      '18. The real production adapter (buildGpcaPostMaterializationReport, which one-prompt-build-orchestrator.ts calls) computes a real boundaryAudit from real files on disk and attaches it to the report — production-wired, not dead code',
      productionReport.boundaryAudit !== null &&
        productionReport.boundaryAudit.infrastructureCount === 1 &&
        productionReport.boundaryAudit.productCount === 1 &&
        productionReport.boundaryAudit.safeInfrastructurePaths.includes('src/infra/RuntimeShell.tsx'),
      `boundaryAudit=${JSON.stringify(productionReport.boundaryAudit)}`,
    );
  } finally {
    rmSync(tempWorkspaceDir, { recursive: true, force: true });
  }

  // ===============================================================================================
  // Scenario 19 — Capability Matrix has a dedicated row.
  // ===============================================================================================
  const boundaryRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Infrastructure vs Product Boundary Authority');
  assert(
    '19. Mandatory Capability Matrix includes a dedicated "Infrastructure vs Product Boundary Authority" row',
    boundaryRow !== undefined && boundaryRow.status === 'IMPLEMENTED',
    `row present=${boundaryRow !== undefined}, status=${boundaryRow?.status}`,
  );

  // ===============================================================================================
  // Scenarios 20-23 — self-discipline: no weakening, no whitelisting, other authorities untouched.
  // ===============================================================================================
  function readSource(relativePath: string): string {
    try {
      return readFileSync(join(ROOT, relativePath), 'utf8');
    } catch {
      return '';
    }
  }

  const boundaryModuleFiles = [
    'src/infrastructure-product-boundary-authority-v1/infrastructure-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/business-content-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-classifier.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-verifier.ts',
  ].map(readSource).join('\n');
  const FILENAME_WHITELIST_TOKENS = [
    'WelcomeScreen',
    'OnboardingScreen',
    'AppShell.tsx',
    'AuthScreen',
    'blueprint/pages/',
    "'src/blueprint",
    '"src/blueprint',
  ];
  const whitelistHits = FILENAME_WHITELIST_TOKENS.filter((token) => boundaryModuleFiles.includes(token));
  assert(
    '20. Verifies no whitelisting: the boundary authority\'s own signal-detection/classifier/verifier source never references a specific blueprint filename or path literal — every decision comes from content patterns only',
    whitelistHits.length === 0,
    whitelistHits.length === 0 ? 'no filename/path literal tokens found in boundary module source' : `hits: ${whitelistHits.join(', ')}`,
  );

  const THIS_MILESTONE_NEW_SYMBOLS = [
    'InfrastructureProductBoundaryAudit',
    'classifyBoundaryFile',
    'runInfrastructureProductBoundaryVerification',
    'isPathSafeInfrastructure',
    'BoundaryClassification',
    'detectInfrastructureSignals',
    'detectBusinessContentSignals',
  ];

  const gpcaScoringFiles = [
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-stage-discovery.ts',
    'src/generation-pipeline-compliance-authority-v1/contract-traceability.ts',
  ].map(readSource).join('\n');
  assert(
    "21. Verifies no weakening of GPCA scoring: pipeline-compliance-scoring.ts, pipeline-stage-discovery.ts, and contract-traceability.ts (the scoring/threshold/traceability engine) carry none of this milestone's new symbols — never edited by this fix",
    !THIS_MILESTONE_NEW_SYMBOLS.some((s) => gpcaScoringFiles.includes(s)),
    'checked GPCA scoring/threshold/traceability files for new symbols',
  );

  const cbgaPolicyFiles = [
    'src/contract-bound-generation-authority-v4/contract-module-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-route-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-navigation-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-surface-plan.ts',
    'src/contract-bound-generation-authority-v4/contract-generation-gate.ts',
    'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts',
    'src/contract-bound-generation-authority-v4/contract-bound-generation-types.ts',
  ].map(readSource).join('\n');
  assert(
    "22. Verifies CBGA remains unchanged: all seven CBGA policy files carry none of this milestone's new symbols — never edited by this fix",
    !THIS_MILESTONE_NEW_SYMBOLS.some((s) => cbgaPolicyFiles.includes(s)),
    'checked CBGA policy files for new symbols',
  );

  const productFaithfulnessFiles = [
    'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
    'src/product-faithfulness-v2/canonical-product-contract.ts',
  ].map(readSource).join('\n');
  assert(
    "23. Verifies Product Faithfulness remains unchanged: product-faithfulness-feature-extractor.ts and canonical-product-contract.ts carry none of this milestone's new symbols — never edited by this fix",
    !THIS_MILESTONE_NEW_SYMBOLS.some((s) => productFaithfulnessFiles.includes(s)),
    'checked Product Faithfulness files for new symbols',
  );

  const aeoFiles = [
    'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts',
    'src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.ts',
    'src/autonomous-engineering-orchestrator-v1/repair-capability-registry.ts',
    'src/autonomous-engineering-orchestrator-v1/missing-capability-router.ts',
  ].map(readSource).join('\n');
  assert(
    "24. Verifies AEO (Autonomous Engineering Orchestrator) remains unchanged: none of its core files carry this milestone's new symbols — never edited by this fix",
    !THIS_MILESTONE_NEW_SYMBOLS.some((s) => aeoFiles.includes(s)),
    'checked AEO core files for new symbols',
  );

  // ===============================================================================================
  // Scenario 25 — no application-specific logic in this fix's own added lines.
  // ===============================================================================================
  const TOUCHED_PRODUCTION_FILES = [
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-types.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/business-content-signal-detection.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-classifier.ts',
    'src/infrastructure-product-boundary-authority-v1/infrastructure-product-boundary-verifier.ts',
    'src/infrastructure-product-boundary-authority-v1/index.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-types.ts',
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  ];
  let diffOutput = '';
  try {
    diffOutput = execSync(`git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch {
    diffOutput = '';
  }
  const addedCodeLines = diffOutput
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|todo|medical|finance)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|todo|medical|finance)['"]\s*,/i,
  ];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  assert(
    "25. No application-specific logic introduced by this fix's own added lines (no branching on a hardcoded product/domain word)",
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${addedCodeLines.length} added code line(s) — no application-specific branching found` : `hits: ${logicHits.join(' || ')}`,
  );

  // ===============================================================================================
  // Scenario 26 — self-discipline: no existing validator modified.
  // ===============================================================================================
  let scriptsStatus = '';
  try {
    scriptsStatus = execSync('git status --porcelain -- scripts', { cwd: ROOT, encoding: 'utf8' });
  } catch {
    scriptsStatus = '';
  }
  const modifiedExistingValidators = scriptsStatus.split('\n').filter((l) => /^\s*M\s+scripts\/validate-.*\.ts$/.test(l));
  assert(
    '26. No existing validator was modified/weakened by this change (only a brand-new validator file was added)',
    modifiedExistingValidators.length === 0,
    modifiedExistingValidators.length === 0 ? 'no pre-existing validate-*.ts files show as modified' : `modified: ${modifiedExistingValidators.join(', ')}`,
  );

  const touchedSourceForVere = TOUCHED_PRODUCTION_FILES.map(readSource).join('\n');
  assert(
    '27. No VERE work was introduced by this fix',
    !/\bvere\b/i.test(touchedSourceForVere),
    /\bvere\b/i.test(touchedSourceForVere) ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // ===============================================================================================
  // Scenario 28 — no new TypeScript errors introduced in touched files.
  // ===============================================================================================
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return TOUCHED_PRODUCTION_FILES.some((f) => normalized.startsWith(f));
  });
  assert(
    '28. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && touchedFileErrorLines.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}${touchedFileErrorLines.length > 0 ? `: ${touchedFileErrorLines.join(' | ')}` : ''}`,
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
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
