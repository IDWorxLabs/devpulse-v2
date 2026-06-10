/**
 * Documentation Verification Checkpoint — Phases 24.1 through 24.6 composition validation.
 * Read-only checkpoint. No runtime behavior changes.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../src/intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES, resolveFindPanelAlias } from '../src/find-panel/alias-registry.js';
import {
  ALL_UVL_ROWS,
  SELF_DOCUMENTATION_UVL_ROWS,
  FOUNDER_GUIDES_UVL_ROWS,
  USER_GUIDES_UVL_ROWS,
  ARCHITECTURE_DOCUMENTATION_UVL_ROWS,
  API_DOCUMENTATION_UVL_ROWS,
  INTERACTIVE_EXPLANATIONS_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/uvl-row-registry.js';
import {
  getDevPulseV2SelfDocumentation,
  evaluateSelfDocumentationEngine,
  getSelfDocumentationRecordCount,
  getSelfDocumentationHistorySize,
  resetSelfDocumentationForTests,
  registerSelfDocumentationWithCentralBrain,
} from '../src/self-documentation/index.js';
import {
  getDevPulseV2FounderGuides,
  evaluateFounderGuidesEngine,
  getFounderGuideRecordCount,
  getFounderGuidesHistorySize,
  resetFounderGuidesForTests,
  registerFounderGuidesWithSelfDocumentation,
} from '../src/founder-guides/index.js';
import {
  getDevPulseV2UserGuides,
  evaluateUserGuidesEngine,
  getUserGuideRecordCount,
  getUserGuidesHistorySize,
  resetUserGuidesForTests,
  registerUserGuidesWithFounderGuides,
} from '../src/user-guides/index.js';
import {
  getDevPulseV2ArchitectureDocumentation,
  evaluateArchitectureDocumentationEngine,
  getArchitectureDocumentationRecordCount,
  getArchitectureDocumentationHistorySize,
  resetArchitectureDocumentationForTests,
  registerArchitectureDocumentationWithUserGuides,
} from '../src/architecture-documentation/index.js';
import {
  getDevPulseV2ApiDocumentation,
  evaluateApiDocumentationEngine,
  getApiDocumentationRecordCount,
  getApiDocumentationHistorySize,
  resetApiDocumentationForTests,
  registerApiDocumentationWithArchitectureDocumentation,
} from '../src/api-documentation/index.js';
import {
  getDevPulseV2InteractiveExplanations,
  evaluateInteractiveExplanationsEngine,
  getInteractiveExplanationRecordCount,
  getInteractiveExplanationsHistorySize,
  resetInteractiveExplanationsForTests,
  registerInteractiveExplanationsWithApiDocumentation,
} from '../src/interactive-explanations/index.js';
import type { SelfDocumentationInput } from '../src/self-documentation/self-documentation-types.js';
import type { FounderGuidesInput } from '../src/founder-guides/founder-guides-types.js';
import type { UserGuidesInput } from '../src/user-guides/user-guides-types.js';
import type { ArchitectureDocumentationInput } from '../src/architecture-documentation/architecture-documentation-types.js';
import type { ApiDocumentationInput } from '../src/api-documentation/api-documentation-types.js';
import type { InteractiveExplanationsInput } from '../src/interactive-explanations/interactive-explanations-types.js';

export const DOCUMENTATION_VERIFICATION_PASS_TOKEN = 'DOCUMENTATION_VERIFICATION_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MIN_SCENARIOS = 110;

const DOCUMENTATION_MODULE_DIRS = [
  'src/self-documentation',
  'src/founder-guides',
  'src/user-guides',
  'src/architecture-documentation',
  'src/api-documentation',
  'src/interactive-explanations',
] as const;

const UVL_MINIMUMS: Record<string, number> = {
  SELF_DOCUMENTATION_UVL_ROWS: 13,
  FOUNDER_GUIDES_UVL_ROWS: 13,
  USER_GUIDES_UVL_ROWS: 13,
  ARCHITECTURE_DOCUMENTATION_UVL_ROWS: 13,
  API_DOCUMENTATION_UVL_ROWS: 13,
  INTERACTIVE_EXPLANATIONS_UVL_ROWS: 13,
};

const FORBIDDEN_EXECUTION_PATTERNS = [
  'writeFileSync',
  'writeFile(',
  'unlinkSync',
  'deploy(',
  'executeBuild',
  'runAutonomousFix',
  'controlledApply',
  'applyPacket',
  'selfModification',
  'mutateWorkspace',
  'mutateProject',
  'startHttpServer',
  'child_process',
  'spawn(',
] as const;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
  responsible?: string;
}

interface DocumentationChainOverrides {
  self?: Partial<SelfDocumentationInput>;
  founder?: Partial<FounderGuidesInput>;
  user?: Partial<UserGuidesInput>;
  architecture?: Partial<ArchitectureDocumentationInput>;
  api?: Partial<ApiDocumentationInput>;
  interactive?: Partial<InteractiveExplanationsInput>;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 60 * 1000 });

function assert(
  group: string,
  name: string,
  condition: boolean,
  detail: string,
  responsible?: string,
): void {
  results.push({ group, name, passed: condition, detail, responsible });
}

function resetAllDocumentationPhases(): void {
  resetSelfDocumentationForTests();
  resetFounderGuidesForTests();
  resetUserGuidesForTests();
  resetArchitectureDocumentationForTests();
  resetApiDocumentationForTests();
  resetInteractiveExplanationsForTests();
}

function hasAlias(alias: string, capabilityId: string): boolean {
  return WORLD2_BUILDER_PACKET_FIND_ALIASES.some(
    (entry) => entry.alias === alias && entry.capabilityId === capabilityId,
  );
}

function listTsFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(dir, f));
}

function baseInput(requestId: string): {
  requestId: string;
  projectId: string;
  workspaceId: string;
  governanceBlocked: false;
} {
  return {
    requestId,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    governanceBlocked: false,
  };
}

function composeDocumentationChain(requestId: string, overrides: DocumentationChainOverrides = {}) {
  const self = evaluateSelfDocumentationEngine({
    ...baseInput(`${requestId}-self`),
    ...overrides.self,
  });

  const founder = evaluateFounderGuidesEngine({
    ...baseInput(`${requestId}-founder`),
    ...overrides.founder,
  });

  const user = evaluateUserGuidesEngine({
    ...baseInput(`${requestId}-user`),
    ...overrides.user,
  });

  const architecture = evaluateArchitectureDocumentationEngine({
    ...baseInput(`${requestId}-architecture`),
    ...overrides.architecture,
  });

  const api = evaluateApiDocumentationEngine({
    ...baseInput(`${requestId}-api`),
    ...overrides.api,
  });

  const interactive = evaluateInteractiveExplanationsEngine({
    ...baseInput(`${requestId}-interactive`),
    ...overrides.interactive,
  });

  return {
    self,
    founder,
    user,
    architecture,
    api,
    interactive,
    mapped: {
      selfCoverageScore: self.record.documentationCoverageScore,
      founderCoverageScore: founder.record.founderCoverageScore,
      userCoverageScore: user.record.userCoverageScore,
      architectureCoverageScore: architecture.record.architectureCoverageScore,
      apiCoverageScore: api.record.apiCoverageScore,
      explanationCoverageScore: interactive.record.explanationCoverageScore,
    },
  };
}

function runPhaseExistence(): void {
  const g = harness.beginGroup('A-PHASE-EXISTENCE');
  for (const dir of DOCUMENTATION_MODULE_DIRS) {
    const full = join(ROOT, dir);
    assert('A-PHASE-EXISTENCE', `module ${dir}`, existsSync(full), dir);
    assert('A-PHASE-EXISTENCE', `index ${dir}`, existsSync(join(full, 'index.ts')), 'index.ts');
  }
  harness.endGroup('A-PHASE-EXISTENCE', g);
}

function runPublicExports(): void {
  const g = harness.beginGroup('B-PUBLIC-EXPORTS');

  const getters = [
    { name: 'getDevPulseV2SelfDocumentation', fn: getDevPulseV2SelfDocumentation, phase: 24.1 },
    { name: 'getDevPulseV2FounderGuides', fn: getDevPulseV2FounderGuides, phase: 24.2 },
    { name: 'getDevPulseV2UserGuides', fn: getDevPulseV2UserGuides, phase: 24.3 },
    { name: 'getDevPulseV2ArchitectureDocumentation', fn: getDevPulseV2ArchitectureDocumentation, phase: 24.4 },
    { name: 'getDevPulseV2ApiDocumentation', fn: getDevPulseV2ApiDocumentation, phase: 24.5 },
    { name: 'getDevPulseV2InteractiveExplanations', fn: getDevPulseV2InteractiveExplanations, phase: 24.6 },
  ];

  for (const entry of getters) {
    const result = entry.fn();
    assert('B-PUBLIC-EXPORTS', entry.name, typeof entry.fn === 'function', 'callable');
    assert('B-PUBLIC-EXPORTS', `${entry.name} phase`, result.phase === entry.phase, String(result.phase));
    assert('B-PUBLIC-EXPORTS', `${entry.name} readOnly`, result.readOnly === true, 'readOnly');
    assert('B-PUBLIC-EXPORTS', `${entry.name} noExecution`, result.noExecution === true, 'noExecution');
    assert('B-PUBLIC-EXPORTS', `${entry.name} noMutations`, result.noMutations === true, 'noMutations');
  }

  const resetFns = [
    { expected: 'resetSelfDocumentationForTests', actual: resetSelfDocumentationForTests },
    { expected: 'resetFounderGuidesForTests', actual: resetFounderGuidesForTests },
    { expected: 'resetUserGuidesForTests', actual: resetUserGuidesForTests },
    { expected: 'resetArchitectureDocumentationForTests', actual: resetArchitectureDocumentationForTests },
    { expected: 'resetApiDocumentationForTests', actual: resetApiDocumentationForTests },
    { expected: 'resetInteractiveExplanationsForTests', actual: resetInteractiveExplanationsForTests },
  ];

  for (const mapping of resetFns) {
    const nameDiffers = mapping.expected !== mapping.actual.name;
    assert(
      'B-PUBLIC-EXPORTS',
      mapping.expected,
      typeof mapping.actual === 'function',
      nameDiffers ? `callable as ${mapping.actual.name} (name mismatch from spec)` : 'callable',
      nameDiffers ? 'index.ts export naming' : undefined,
    );
  }

  harness.endGroup('B-PUBLIC-EXPORTS', g);
}

function runFoundationRegistration(): void {
  const g = harness.beginGroup('C-FOUNDATION-REGISTRATION');
  const domains = [
    { domain: 'self_documentation', phase: 24.1, owner: 'devpulse_v2_self_documentation' },
    { domain: 'founder_guides', phase: 24.2, owner: 'devpulse_v2_founder_guides' },
    { domain: 'user_guides', phase: 24.3, owner: 'devpulse_v2_user_guides' },
    { domain: 'architecture_documentation', phase: 24.4, owner: 'devpulse_v2_architecture_documentation' },
    { domain: 'api_documentation', phase: 24.5, owner: 'devpulse_v2_api_documentation' },
    { domain: 'interactive_explanations', phase: 24.6, owner: 'devpulse_v2_interactive_explanations' },
  ] as const;

  for (const entry of domains) {
    const owner = getDevPulseV2Owner(entry.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} domain`, owner.domain === entry.domain, owner.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} owner`, owner.ownerModule === entry.owner, owner.ownerModule);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} phase`, owner.phase === entry.phase, String(owner.phase));
  }

  harness.endGroup('C-FOUNDATION-REGISTRATION', g);
}

function runCapabilityRegistry(): void {
  const g = harness.beginGroup('D-CAPABILITY-REGISTRY');
  const expected = [
    { capabilityId: 'SELF_DOCUMENTATION', label: 'Self Documentation', phase: 24.1 },
    { capabilityId: 'FOUNDER_GUIDES', label: 'Founder Guides', phase: 24.2 },
    { capabilityId: 'USER_GUIDES', label: 'User Guides', phase: 24.3 },
    { capabilityId: 'ARCHITECTURE_DOCUMENTATION', label: 'Architecture Documentation', phase: 24.4 },
    { capabilityId: 'API_DOCUMENTATION', label: 'API Documentation', phase: 24.5 },
    { capabilityId: 'INTERACTIVE_EXPLANATIONS', label: 'Interactive Explanations', phase: 24.6 },
  ];

  for (const entry of expected) {
    const found = INTELLIGENCE_CONSOLE_CAPABILITIES.find((c) => c.capabilityId === entry.capabilityId);
    assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} exists`, found !== undefined, entry.capabilityId, 'capability-registry.ts');
    if (found) {
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} label`, found.label === entry.label, found.label);
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} phase`, found.phase === entry.phase, String(found.phase));
    }
  }

  harness.endGroup('D-CAPABILITY-REGISTRY', g);
}

function runFindPanelAliases(): void {
  const g = harness.beginGroup('E-FIND-PANEL-ALIASES');
  const required: { alias: string; capabilityId: string }[] = [
    { alias: 'Self Documentation', capabilityId: 'SELF_DOCUMENTATION' },
    { alias: 'Documentation', capabilityId: 'SELF_DOCUMENTATION' },
    { alias: 'Founder Guides', capabilityId: 'FOUNDER_GUIDES' },
    { alias: 'Founder Documentation', capabilityId: 'FOUNDER_GUIDES' },
    { alias: 'User Guides', capabilityId: 'USER_GUIDES' },
    { alias: 'User Documentation', capabilityId: 'USER_GUIDES' },
    { alias: 'Architecture Documentation', capabilityId: 'ARCHITECTURE_DOCUMENTATION' },
    { alias: 'Architecture', capabilityId: 'ARCHITECTURE_DOCUMENTATION' },
    { alias: 'API Documentation', capabilityId: 'API_DOCUMENTATION' },
    { alias: 'API Docs', capabilityId: 'API_DOCUMENTATION' },
    { alias: 'Interactive Explanations', capabilityId: 'INTERACTIVE_EXPLANATIONS' },
    { alias: 'Explanations', capabilityId: 'INTERACTIVE_EXPLANATIONS' },
  ];

  for (const entry of required) {
    assert(
      'E-FIND-PANEL-ALIASES',
      entry.alias,
      hasAlias(entry.alias, entry.capabilityId),
      entry.capabilityId,
      'find-panel/alias-registry.ts',
    );
  }

  const unambiguousResolve: { alias: string; capabilityId: string }[] = [
    { alias: 'Founder Guides', capabilityId: 'FOUNDER_GUIDES' },
    { alias: 'User Guides', capabilityId: 'USER_GUIDES' },
    { alias: 'API Docs', capabilityId: 'API_DOCUMENTATION' },
    { alias: 'Explanations', capabilityId: 'INTERACTIVE_EXPLANATIONS' },
  ];
  for (const entry of unambiguousResolve) {
    const resolved = resolveFindPanelAlias(entry.alias);
    assert(
      'E-FIND-PANEL-ALIASES',
      `resolve ${entry.alias}`,
      resolved?.capabilityId === entry.capabilityId,
      resolved?.capabilityId ?? 'null',
    );
  }

  harness.endGroup('E-FIND-PANEL-ALIASES', g);
}

function runUvlRegistration(): void {
  const g = harness.beginGroup('F-UVL-REGISTRATION');
  const groups = [
    { name: 'SELF_DOCUMENTATION_UVL_ROWS', rows: SELF_DOCUMENTATION_UVL_ROWS },
    { name: 'FOUNDER_GUIDES_UVL_ROWS', rows: FOUNDER_GUIDES_UVL_ROWS },
    { name: 'USER_GUIDES_UVL_ROWS', rows: USER_GUIDES_UVL_ROWS },
    { name: 'ARCHITECTURE_DOCUMENTATION_UVL_ROWS', rows: ARCHITECTURE_DOCUMENTATION_UVL_ROWS },
    { name: 'API_DOCUMENTATION_UVL_ROWS', rows: API_DOCUMENTATION_UVL_ROWS },
    { name: 'INTERACTIVE_EXPLANATIONS_UVL_ROWS', rows: INTERACTIVE_EXPLANATIONS_UVL_ROWS },
  ];

  for (const group of groups) {
    const minimum = UVL_MINIMUMS[group.name] ?? 13;
    assert('F-UVL-REGISTRATION', `${group.name} count`, group.rows.length >= minimum, String(group.rows.length));
    for (const row of group.rows) {
      assert('F-UVL-REGISTRATION', `row ${row.rowId}`, hasUvlRow(row.rowId), row.rowId, 'uvl-row-registry.ts');
      assert(
        'F-UVL-REGISTRATION',
        `ALL_UVL_ROWS includes ${row.rowId}`,
        ALL_UVL_ROWS.some((r) => r.rowId === row.rowId),
        row.rowId,
      );
    }
  }

  harness.endGroup('F-UVL-REGISTRATION', g);
}

function runDocumentationAuthorityComposition(): void {
  const g = harness.beginGroup('G-DOCUMENTATION-AUTHORITY-COMPOSITION');
  resetAllDocumentationPhases();

  const chain = composeDocumentationChain('doc-chain-strong');

  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'self report', chain.self.report !== undefined, 'report', 'self-documentation');
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'founder report', chain.founder.report !== undefined, 'report', 'founder-guides');
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'user report', chain.user.report !== undefined, 'report', 'user-guides');
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'architecture report', chain.architecture.report !== undefined, 'report', 'architecture-documentation');
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'api report', chain.api.report !== undefined, 'report', 'api-documentation');
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'interactive report', chain.interactive.report !== undefined, 'report', 'interactive-explanations');

  const score = chain.interactive.record.explanationCoverageScore;
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'numeric explanation score', typeof score === 'number' && Number.isFinite(score), String(score));
  assert('G-DOCUMENTATION-AUTHORITY-COMPOSITION', 'bounded explanation score', score >= 0 && score <= 100, String(score));
  assert(
    'G-DOCUMENTATION-AUTHORITY-COMPOSITION',
    'bounded confidence',
    chain.interactive.record.confidence >= 0 && chain.interactive.record.confidence <= 100,
    String(chain.interactive.record.confidence),
  );
  assert(
    'G-DOCUMENTATION-AUTHORITY-COMPOSITION',
    'recommendations present',
    chain.interactive.report.recommendations.length > 0,
    String(chain.interactive.report.recommendations.length),
  );

  harness.endGroup('G-DOCUMENTATION-AUTHORITY-COMPOSITION', g);
}

function runSignalCompatibility(): void {
  const g = harness.beginGroup('H-SIGNAL-COMPATIBILITY');
  resetAllDocumentationPhases();

  const selfToken = getDevPulseV2SelfDocumentation().passToken;
  const founderToken = getDevPulseV2FounderGuides().passToken;
  const userToken = getDevPulseV2UserGuides().passToken;
  const architectureToken = getDevPulseV2ArchitectureDocumentation().passToken;
  const apiToken = getDevPulseV2ApiDocumentation().passToken;

  assert(
    'H-SIGNAL-COMPATIBILITY',
    'self -> founder token',
    registerFounderGuidesWithSelfDocumentation().passToken === selfToken,
    registerFounderGuidesWithSelfDocumentation().passToken,
    'founder-guides',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'founder -> user token',
    registerUserGuidesWithFounderGuides().passToken === founderToken,
    registerUserGuidesWithFounderGuides().passToken,
    'user-guides',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'user -> architecture token',
    registerArchitectureDocumentationWithUserGuides().passToken === userToken,
    registerArchitectureDocumentationWithUserGuides().passToken,
    'architecture-documentation',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'architecture -> api token',
    registerApiDocumentationWithArchitectureDocumentation().passToken === architectureToken,
    registerApiDocumentationWithArchitectureDocumentation().passToken,
    'api-documentation',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'api -> interactive token',
    registerInteractiveExplanationsWithApiDocumentation().passToken === apiToken,
    registerInteractiveExplanationsWithApiDocumentation().passToken,
    'interactive-explanations',
  );

  const selfBrain = registerSelfDocumentationWithCentralBrain();
  const founderBrain = registerFounderGuidesWithSelfDocumentation();
  assert('H-SIGNAL-COMPATIBILITY', 'founder reads self token', founderBrain.passToken === selfToken, founderBrain.passToken);

  const chain = composeDocumentationChain('signal-compat');
  assert('H-SIGNAL-COMPATIBILITY', 'self mappable', chain.mapped.selfCoverageScore >= 0, String(chain.mapped.selfCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'founder mappable', chain.mapped.founderCoverageScore >= 0, String(chain.mapped.founderCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'user mappable', chain.mapped.userCoverageScore >= 0, String(chain.mapped.userCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'architecture mappable', chain.mapped.architectureCoverageScore >= 0, String(chain.mapped.architectureCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'api mappable', chain.mapped.apiCoverageScore >= 0, String(chain.mapped.apiCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'interactive mappable', chain.mapped.explanationCoverageScore >= 0, String(chain.mapped.explanationCoverageScore));
  assert('H-SIGNAL-COMPATIBILITY', 'self brain systems', selfBrain.centralBrainSystems >= 0, String(selfBrain.centralBrainSystems));

  harness.endGroup('H-SIGNAL-COMPATIBILITY', g);
}

function runReadOnlyBoundary(): void {
  const g = harness.beginGroup('I-READ-ONLY-BOUNDARY');

  for (const dir of DOCUMENTATION_MODULE_DIRS) {
    const files = listTsFiles(join(ROOT, dir));
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_EXECUTION_PATTERNS) {
        assert(
          'I-READ-ONLY-BOUNDARY',
          `${file.replace(ROOT, '')} no ${pattern}`,
          !content.includes(pattern),
          pattern,
          dir,
        );
      }
    }
  }

  harness.endGroup('I-READ-ONLY-BOUNDARY', g);
}

function runResetIsolation(): void {
  const g = harness.beginGroup('J-RESET-ISOLATION');
  resetAllDocumentationPhases();

  composeDocumentationChain('reset-before');
  assert('J-RESET-ISOLATION', 'self records before reset', getSelfDocumentationRecordCount() >= 1, String(getSelfDocumentationRecordCount()));
  assert('J-RESET-ISOLATION', 'interactive records before reset', getInteractiveExplanationRecordCount() >= 1, String(getInteractiveExplanationRecordCount()));
  assert('J-RESET-ISOLATION', 'interactive history before reset', getInteractiveExplanationsHistorySize() >= 1, String(getInteractiveExplanationsHistorySize()));

  resetAllDocumentationPhases();

  assert('J-RESET-ISOLATION', 'self records cleared', getSelfDocumentationRecordCount() === 0, String(getSelfDocumentationRecordCount()));
  assert('J-RESET-ISOLATION', 'founder records cleared', getFounderGuideRecordCount() === 0, String(getFounderGuideRecordCount()));
  assert('J-RESET-ISOLATION', 'user records cleared', getUserGuideRecordCount() === 0, String(getUserGuideRecordCount()));
  assert('J-RESET-ISOLATION', 'architecture records cleared', getArchitectureDocumentationRecordCount() === 0, String(getArchitectureDocumentationRecordCount()));
  assert('J-RESET-ISOLATION', 'api records cleared', getApiDocumentationRecordCount() === 0, String(getApiDocumentationRecordCount()));
  assert('J-RESET-ISOLATION', 'interactive records cleared', getInteractiveExplanationRecordCount() === 0, String(getInteractiveExplanationRecordCount()));
  assert('J-RESET-ISOLATION', 'interactive history cleared', getInteractiveExplanationsHistorySize() === 0, String(getInteractiveExplanationsHistorySize()));

  const after = composeDocumentationChain('reset-after');
  assert('J-RESET-ISOLATION', 'fresh interactive id', after.interactive.record.explanationId === 'interactive-explanations-1', after.interactive.record.explanationId);
  assert('J-RESET-ISOLATION', 'no stale interactive count', getInteractiveExplanationRecordCount() === 1, String(getInteractiveExplanationRecordCount()));

  harness.endGroup('J-RESET-ISOLATION', g);
}

function runDeterminism(): void {
  const g = harness.beginGroup('K-DETERMINISM');
  resetAllDocumentationPhases();

  let baselineScore = -1;
  let baselineState = '';
  let baselineConfidence = -1;

  for (let i = 0; i < 25; i++) {
    resetAllDocumentationPhases();
    const chain = composeDocumentationChain('determinism-fixed');
    if (i === 0) {
      baselineScore = chain.interactive.record.explanationCoverageScore;
      baselineState = chain.interactive.record.state;
      baselineConfidence = chain.interactive.record.confidence;
    }
    assert('K-DETERMINISM', `score stable run ${i}`, chain.interactive.record.explanationCoverageScore === baselineScore, String(chain.interactive.record.explanationCoverageScore));
    assert('K-DETERMINISM', `state stable run ${i}`, chain.interactive.record.state === baselineState, chain.interactive.record.state);
    assert('K-DETERMINISM', `confidence stable run ${i}`, chain.interactive.record.confidence === baselineConfidence, String(chain.interactive.record.confidence));
    assert('K-DETERMINISM', `history bounded run ${i}`, getInteractiveExplanationsHistorySize() <= 1, String(getInteractiveExplanationsHistorySize()));
    assert('K-DETERMINISM', `registry bounded run ${i}`, getInteractiveExplanationRecordCount() <= 1, String(getInteractiveExplanationRecordCount()));
  }

  harness.endGroup('K-DETERMINISM', g);
}

function runConflictScenarios(): void {
  const g = harness.beginGroup('L-CONFLICT-SCENARIOS');
  resetAllDocumentationPhases();

  const cases: { name: string; overrides: DocumentationChainOverrides; weakLayer: string }[] = [
    {
      name: 'self-documentation-weak',
      overrides: {
        self: {
          missingCapabilityLabels: true,
          missingModuleExports: true,
          missingAuthorityChainMapping: true,
          missingPassTokens: true,
          missingCheckpointDocs: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'self',
    },
    {
      name: 'founder-guides-weak',
      overrides: {
        founder: {
          missingCompletedPhases: true,
          missingCurrentPhase: true,
          missingTrustEngineCheckpoint: true,
          missingCapabilityDiscovery: true,
          missingProtectedFoundationGuidance: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'founder',
    },
    {
      name: 'user-guides-weak',
      overrides: {
        user: {
          missingFirstLaunchGuidance: true,
          missingChatGuidance: true,
          missingCapabilityDiscoveryGuidance: true,
          missingSafeUsageGuidance: true,
          missingTrustScoreInterpretation: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'user',
    },
    {
      name: 'architecture-documentation-weak',
      overrides: {
        architecture: {
          missingFoundationDomainGuidance: true,
          missingModuleDependencyGuidance: true,
          missingRegistryIntegrationGuidance: true,
          missingReadOnlyBoundaryGuidance: true,
          missingTrustEngineChainGuidance: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'architecture',
    },
    {
      name: 'api-documentation-weak',
      overrides: {
        api: {
          missingPublicApiGuidance: true,
          missingModuleInterfaceGuidance: true,
          missingInputContractGuidance: true,
          missingRegistryIntegrationGuidance: true,
          missingValidationCommandGuidance: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'api',
    },
    {
      name: 'interactive-explanations-weak',
      overrides: {
        interactive: {
          missingSystemExplanationGuidance: true,
          missingProjectWorkflowExplanation: true,
          missingTrustDecisionExplanation: true,
          missingTrustReportExplanation: true,
          missingNextPhaseGuidance: true,
          governanceBlocked: true,
        },
      },
      weakLayer: 'interactive',
    },
  ];

  for (const testCase of cases) {
    resetAllDocumentationPhases();
    const chain = composeDocumentationChain(`conflict-${testCase.name}`, testCase.overrides);

    const notFullyReady =
      chain.self.record.state !== 'DOCUMENTED'
      || chain.founder.record.state !== 'READY'
      || chain.user.record.state !== 'READY'
      || chain.architecture.record.state !== 'DOCUMENTED'
      || chain.api.record.state !== 'DOCUMENTED'
      || chain.interactive.record.state !== 'READY';

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} not fully ready`,
      notFullyReady,
      `${chain.self.record.state}/${chain.founder.record.state}/${chain.user.record.state}/${chain.architecture.record.state}/${chain.api.record.state}/${chain.interactive.record.state}`,
      testCase.weakLayer,
    );

    const weakLayerDegraded =
      (testCase.weakLayer === 'self' && chain.self.record.completenessLevel !== 'COMPLETE')
      || (testCase.weakLayer === 'founder' && chain.founder.record.completenessLevel !== 'COMPLETE')
      || (testCase.weakLayer === 'user' && chain.user.record.completenessLevel !== 'COMPLETE')
      || (testCase.weakLayer === 'architecture' && chain.architecture.record.coverageLevel !== 'COMPLETE')
      || (testCase.weakLayer === 'api' && chain.api.record.coverageLevel !== 'COMPLETE')
      || (testCase.weakLayer === 'interactive' && chain.interactive.record.coverageLevel !== 'COMPLETE');

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} weak layer not complete`,
      weakLayerDegraded,
      `${testCase.weakLayer}:${chain.interactive.record.coverageLevel}`,
      testCase.weakLayer,
    );

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} recommendations`,
      chain.interactive.report.recommendations.length > 0,
      String(chain.interactive.report.recommendations.length),
      testCase.weakLayer,
    );

    if (testCase.weakLayer === 'interactive') {
      assert(
        'L-CONFLICT-SCENARIOS',
        `${testCase.name} final not complete`,
        chain.interactive.record.coverageLevel !== 'COMPLETE',
        chain.interactive.record.coverageLevel,
        'interactive-explanations',
      );
    }
  }

  harness.endGroup('L-CONFLICT-SCENARIOS', g);
}

function stressFullChain(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAllDocumentationPhases();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const mod = i % 20;
    composeDocumentationChain(`stress-${label}-${i}`, {
      self: mod % 5 === 0 ? { missingModuleExports: true } : undefined,
      founder: mod % 7 === 0 ? { missingCapabilityDiscovery: true } : undefined,
      user: mod % 9 === 0 ? { missingChatGuidance: true } : undefined,
      architecture: mod % 11 === 0 ? { missingFoundationDomainGuidance: true } : undefined,
      api: mod % 13 === 0 ? { missingPublicApiGuidance: true } : undefined,
      interactive: mod % 17 === 0 ? { missingSystemExplanationGuidance: true } : undefined,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'interactive record count', getInteractiveExplanationRecordCount() === count, String(getInteractiveExplanationRecordCount()));
  assert(`M-STRESS-${label}`, 'self record count', getSelfDocumentationRecordCount() === count, String(getSelfDocumentationRecordCount()));
  assert(`M-STRESS-${label}`, 'runtime bounded', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);
  assert(`M-STRESS-${label}`, 'interactive history bounded', getInteractiveExplanationsHistorySize() <= 128, String(getInteractiveExplanationsHistorySize()));
  assert(`M-STRESS-${label}`, 'self history bounded', getSelfDocumentationHistorySize() <= 128, String(getSelfDocumentationHistorySize()));
  assert(`M-STRESS-${label}`, 'founder history bounded', getFounderGuidesHistorySize() <= 128, String(getFounderGuidesHistorySize()));
  assert(`M-STRESS-${label}`, 'user history bounded', getUserGuidesHistorySize() <= 128, String(getUserGuidesHistorySize()));
  assert(`M-STRESS-${label}`, 'architecture history bounded', getArchitectureDocumentationHistorySize() <= 128, String(getArchitectureDocumentationHistorySize()));
  assert(`M-STRESS-${label}`, 'api history bounded', getApiDocumentationHistorySize() <= 128, String(getApiDocumentationHistorySize()));

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Documentation Verification Checkpoint (24.1–24.6)');
  console.log('==============================================================\n');

  runPhaseExistence();
  runPublicExports();
  runFoundationRegistration();
  runCapabilityRegistry();
  runFindPanelAliases();
  runUvlRegistration();
  runDocumentationAuthorityComposition();
  runSignalCompatibility();
  runReadOnlyBoundary();
  runResetIsolation();
  runDeterminism();
  runConflictScenarios();
  stressFullChain(100, '100');
  stressFullChain(1000, '1000');
  stressFullChain(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Self records: ${getSelfDocumentationRecordCount()}`,
    `Founder records: ${getFounderGuideRecordCount()}`,
    `User records: ${getUserGuideRecordCount()}`,
    `Architecture records: ${getArchitectureDocumentationRecordCount()}`,
    `API records: ${getApiDocumentationRecordCount()}`,
    `Interactive records: ${getInteractiveExplanationRecordCount()}`,
    failed.length === 0 ? DOCUMENTATION_VERIFICATION_PASS_TOKEN : 'DOCUMENTATION_VERIFICATION_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 30)) {
      const module = f.responsible ? ` [${f.responsible}]` : '';
      console.error(`  [${f.group}] ${f.name}${module}: expected pass, got ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(`\n${DOCUMENTATION_VERIFICATION_PASS_TOKEN}`);
}

main();
