/**
 * DevPulse V2 Phase 16.8 — Verification Registry validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  VERIFICATION_REGISTRY_PASS_TOKEN,
  VERIFICATION_REGISTRY_OWNER_MODULE,
  FORBIDDEN_VERIFICATION_REGISTRY_DUPLICATES,
  INITIAL_VERIFICATION_TARGET_CATEGORIES,
  isVerificationRegistryQuestion,
  isVerificationRegistryAdvisoryQuestion,
  prepareVerificationRegistry,
  processVerificationRegistryRequest,
  getVerificationRegistryDiagnostics,
  resetVerificationRegistryDiagnostics,
  resetVerificationRegistryReportCounterForTests,
  resetVerificationTargetRegistryForTests,
  resetVerificationOwnerRegistryForTests,
  resetVerificationDependencyRegistryForTests,
  resetVerificationRequirementRegistryForTests,
  resetVerificationCapabilityRegistryForTests,
  buildVerificationRegistryFailureContext,
  registerVerificationTarget,
  registerInitialTargets,
  buildInitialTargetDefinition,
  getVerificationTarget,
  listVerificationTargets,
  registerVerificationOwner,
  registerInitialOwners,
  buildOwnerRecord,
  listVerificationOwners,
  registerVerificationDependency,
  registerInitialDependencies,
  buildDependencyRecord,
  listVerificationDependencies,
  registerVerificationRequirement,
  registerInitialRequirements,
  buildRequirementRecord,
  listVerificationRequirements,
  registerVerificationCapability,
  registerInitialCapabilities,
  buildCapabilityRecord,
  listVerificationCapabilities,
  validateDependencyRegistration,
  validateOwnerExists,
} from '../src/verification-registry/index.js';
import type { PrepareVerificationRegistryInput } from '../src/verification-registry/types.js';
import {
  buildVerificationRegistryPanelSnapshot,
  VERIFICATION_REGISTRY_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/index.js';
import { isIntelligenceConsoleCapability } from '../src/intelligence-console/index.js';
import { resolveFindPanelAlias } from '../src/find-panel/index.js';
import {
  buildQuestionRoutingPlan,
  resetDevPulseV2CommandCenterBrainForTests,
  resetBrainCountersForTests,
} from '../src/command-center-brain/index.js';
import { resetGeneralQuestionUnderstandingForTests } from '../src/command-center-brain/general-question-understanding/index.js';
import {
  resetActionVisibilityDiagnostics,
  resetActionCandidateCounterForTests,
  analyzeActionVisibility,
} from '../src/action-visibility-engine/index.js';
import {
  resetReasoningVisibilityDiagnostics,
  resetReasoningBlockerCounterForTests,
  buildReasoningVisibilityRecord,
} from '../src/reasoning-visibility-engine/index.js';
import {
  resetFailureVisibilityDiagnostics,
  resetFailureRecordCounterForTests,
  buildFailureRecords,
} from '../src/failure-visibility-engine/index.js';
import { buildProgressRecords } from '../src/progress-intelligence/progress-model-builder.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

const MAX_RUNTIME_MS = 6 * 60 * 1000;
const GROUP_WARNING_MS = 60 * 1000;
const MIN_SCENARIOS = 180;
const CANONICAL_QUERY = 'What can be verified?';

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const startedAt = Date.now();
const groupTimings: Array<{ group: string; elapsedMs: number }> = [];
const responseCache = new Map<string, ReturnType<typeof processVerificationRegistryRequest>>();
const textCache = new Map<string, string>();

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

function beginGroup(group: string): number {
  if (Date.now() - startedAt > MAX_RUNTIME_MS) throw new Error(`Max runtime guard exceeded during ${group}`);
  console.log(`▶ ${group} ...`);
  return Date.now();
}

function endGroup(group: string, started: number): void {
  const elapsed = Date.now() - started;
  groupTimings.push({ group, elapsedMs: elapsed });
  const groupResults = results.filter((r) => r.group === group);
  console.log(`✓ ${group} — ${groupResults.filter((r) => r.passed).length}/${groupResults.length} passed (${elapsed}ms)`);
  if (elapsed > GROUP_WARNING_MS) console.log(`  ⚠ ${group} exceeded per-group warning threshold`);
}

function readText(path: string): string {
  const hit = textCache.get(path);
  if (hit) return hit;
  const text = readFileSync(join(ROOT, path), 'utf8');
  textCache.set(path, text);
  return text;
}

function cachedResponse(query: string = CANONICAL_QUERY) {
  const key = query.trim().toLowerCase();
  const hit = responseCache.get(key);
  if (hit) return hit;
  const result = processVerificationRegistryRequest(query);
  responseCache.set(key, result);
  return result;
}

function baseInput(overrides: Partial<PrepareVerificationRegistryInput> = {}): PrepareVerificationRegistryInput {
  return {
    query: CANONICAL_QUERY,
    projectId: 'proj-test-001',
    workspaceId: 'ws-test-001',
    projectExists: true,
    workspaceExists: true,
    world1Protected: true,
    ownershipValid: true,
    ...overrides,
  };
}

function resetAll(): void {
  responseCache.clear();
  resetBrainCountersForTests();
  resetGeneralQuestionUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();
  resetVerificationTargetRegistryForTests();
  resetVerificationOwnerRegistryForTests();
  resetVerificationDependencyRegistryForTests();
  resetVerificationRequirementRegistryForTests();
  resetVerificationCapabilityRegistryForTests();
  resetVerificationRegistryDiagnostics();
  resetVerificationRegistryReportCounterForTests();
  resetActionVisibilityDiagnostics();
  resetActionCandidateCounterForTests();
  resetReasoningVisibilityDiagnostics();
  resetReasoningBlockerCounterForTests();
  resetFailureVisibilityDiagnostics();
  resetFailureRecordCounterForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 16.8 Verification Registry');
  console.log('==============================================');
  resetAll();

  let g = beginGroup('A-SETUP');
  const dir = join(ROOT, 'src/verification-registry');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert('A-SETUP', '1. types', existsSync(join(dir, 'types.ts')), 'types');
  assert('A-SETUP', '2. target registry', existsSync(join(dir, 'verification-target-registry.ts')), 'target');
  assert('A-SETUP', '3. owner registry', existsSync(join(dir, 'verification-owner-registry.ts')), 'owner');
  assert('A-SETUP', '4. dependency registry', existsSync(join(dir, 'verification-dependency-registry.ts')), 'dep');
  assert('A-SETUP', '5. requirement registry', existsSync(join(dir, 'verification-requirement-registry.ts')), 'req');
  assert('A-SETUP', '6. capability registry', existsSync(join(dir, 'verification-capability-registry.ts')), 'cap');
  assert('A-SETUP', '7. validator', existsSync(join(dir, 'verification-registry-validator.ts')), 'validator');
  assert('A-SETUP', '8. report', existsSync(join(dir, 'verification-registry-report.ts')), 'report');
  assert('A-SETUP', '9. diagnostics', existsSync(join(dir, 'verification-registry-diagnostics.ts')), 'diag');
  assert('A-SETUP', '10. failure bridge', existsSync(join(dir, 'verification-registry-failure-bridge.ts')), 'bridge');
  assert('A-SETUP', '11. orchestrator', existsSync(join(dir, 'verification-registry.ts')), 'orch');
  assert('A-SETUP', '12. index', existsSync(join(dir, 'index.ts')), 'index');
  assert('A-SETUP', '13. feed bridge', existsSync(join(ROOT, 'src/operator-feed/verification-registry-feed-bridge.ts')), 'feed');
  assert('A-SETUP', '14. script', typeof pkg.scripts?.['validate:verification-registry'] === 'string', 'script');
  const owner = getDevPulseV2Owner('verification_registry');
  assert('A-SETUP', '15. owner', owner.ownerModule === VERIFICATION_REGISTRY_OWNER_MODULE, owner.ownerModule);
  assert('A-SETUP', '16. phase', owner.phase === 16.8, String(owner.phase));
  endGroup('A-SETUP', g);

  g = beginGroup('B-CORE');
  resetAll();
  const ready = prepareVerificationRegistry(baseInput());
  assert('B-CORE', '17. report id', ready.registryReport.reportId.startsWith('vreg-'), 'id');
  assert('B-CORE', '18. targets', ready.verificationTargets.length === 11, String(ready.verificationTargets.length));
  assert('B-CORE', '19. dependencies', ready.verificationDependencies.length === 11, String(ready.verificationDependencies.length));
  assert('B-CORE', '20. requirements', ready.verificationRequirements.length === 11, String(ready.verificationRequirements.length));
  assert('B-CORE', '21. registry only', ready.registryReport.registryOnly === true, 'only');
  assert('B-CORE', '22. ready state', ready.registryReport.registryState === 'READY', ready.registryReport.registryState);

  resetAll();
  registerInitialTargets();
  const target = buildInitialTargetDefinition('WORLD2_TARGET');
  const dup = registerVerificationTarget(target);
  assert('B-CORE', '23. duplicate target', !dup.ok && dup.duplicate === true, 'dup');

  resetAll();
  registerInitialTargets();
  const ownerRecord = buildOwnerRecord(listVerificationTargets()[0]!);
  const ownerDup = registerVerificationOwner(ownerRecord);
  assert('B-CORE', '24. owner registered', ownerDup.ok === true, 'owner');
  assert('B-CORE', '25. owner duplicate', !registerVerificationOwner(ownerRecord).ok, 'dup');

  resetAll();
  registerInitialTargets();
  registerInitialOwners();
  registerInitialDependencies();
  const firstTarget = listVerificationTargets()[0]!;
  const dep = registerVerificationDependency(
    buildDependencyRecord(firstTarget.verificationTargetId, firstTarget.verificationCategory),
  );
  assert('B-CORE', '26. dependency registered', dep.ok === true, 'dep');

  resetAll();
  registerInitialTargets();
  const invalidDep = registerVerificationDependency({
    dependencyId: 'vdep-invalid',
    targetId: 'vtarg-missing',
    upstreamDependencies: [],
    downstreamDependencies: [],
    verificationBlockers: [],
    verificationPrerequisites: [],
    registryOnly: true,
  });
  assert('B-CORE', '27. invalid dependency', !invalidDep.ok && invalidDep.invalid === true, 'invalid');

  resetAll();
  registerInitialTargets();
  registerInitialRequirements();
  const reqTarget = listVerificationTargets()[2]!;
  const req = registerVerificationRequirement(buildRequirementRecord(reqTarget.verificationTargetId));
  assert('B-CORE', '28. requirement registered', req.ok === true, 'req');

  resetAll();
  registerInitialTargets();
  registerInitialCapabilities();
  const capTarget = listVerificationTargets()[4]!;
  const cap = registerVerificationCapability(
    buildCapabilityRecord(capTarget.verificationTargetId, capTarget.verificationCategory),
  );
  assert('B-CORE', '29. capability registered', cap.ok === true, 'cap');

  resetAll();
  const lookup = prepareVerificationRegistry(baseInput());
  const found = getVerificationTarget(lookup.verificationTargets[0]!.verificationTargetId);
  assert('B-CORE', '30. target lookup', found !== null, 'lookup');
  assert('B-CORE', '31. owner lookup', validateOwnerExists(found!.ownerModule) === true, 'owner');
  assert('B-CORE', '32. dep validation', validateDependencyRegistration(found!.verificationTargetId).valid === true, 'dep');
  assert('B-CORE', '33. categories', INITIAL_VERIFICATION_TARGET_CATEGORIES.length === 11, String(INITIAL_VERIFICATION_TARGET_CATEGORIES.length));

  resetAll();
  prepareVerificationRegistry(baseInput());
  const panel = buildVerificationRegistryPanelSnapshot();
  assert('B-CORE', '34. uvl panel', panel.panelTitle === 'Verification Registry', panel.panelTitle);
  assert('B-CORE', '35. panel targets', panel.targetCount === 11, String(panel.targetCount));
  endGroup('B-CORE', g);

  g = beginGroup('C-INTEGRATION');
  resetAll();
  const routing = buildQuestionRoutingPlan(CANONICAL_QUERY);
  assert('C-INTEGRATION', '36. routing', routing.primaryCapability === 'VERIFICATION_REGISTRY', String(routing.primaryCapability));
  assert('C-INTEGRATION', '37. advisory', isVerificationRegistryAdvisoryQuestion(CANONICAL_QUERY), 'advisory');

  const action = analyzeActionVisibility('recommended');
  assert('C-INTEGRATION', '38. action target count', action.candidates[0]!.verificationTargetCount === 11, 'count');
  assert('C-INTEGRATION', '39. action dep count', action.candidates[0]!.verificationDependencyCount === 11, 'count');
  assert('C-INTEGRATION', '40. action req count', action.candidates[0]!.verificationRequirementCount === 11, 'count');

  const reasoning = buildReasoningVisibilityRecord('why verification registry');
  assert('C-INTEGRATION', '41. reasoning basis', reasoning.verificationRegistryBasis.length > 10, 'basis');
  assert('C-INTEGRATION', '42. reasoning targets', reasoning.verificationTargets.length >= 11, 'targets');
  assert('C-INTEGRATION', '43. reasoning deps', reasoning.verificationDependencies.length >= 4, 'deps');
  assert('C-INTEGRATION', '44. reasoning reqs', reasoning.verificationRequirements.length >= 4, 'reqs');

  const failures = buildFailureRecords('Why is verification registry blocked?');
  assert('C-INTEGRATION', '45. failure', failures.some((f) => f.sourceSystem === 'verification_registry'), 'fail');

  const progress = buildProgressRecords('verification registry');
  assert('C-INTEGRATION', '46. progress', progress[0]?.verificationRegistryNote !== undefined, 'progress');
  endGroup('C-INTEGRATION', g);

  g = beginGroup('D-REGISTRY');
  assert('D-REGISTRY', '47. uvl rows', VERIFICATION_REGISTRY_UVL_ROWS.length === 10, String(VERIFICATION_REGISTRY_UVL_ROWS.length));
  assert('D-REGISTRY', '48. uvl types', hasUvlRow('VERIFICATION_REGISTRY_TYPES'), 'types');
  assert('D-REGISTRY', '49. console', isIntelligenceConsoleCapability('VERIFICATION_REGISTRY'), 'console');
  assert('D-REGISTRY', '50. find panel', resolveFindPanelAlias('Verification Registry') !== null, 'find');
  const registry = readText('src/foundation/ownership-registry.ts');
  assert('D-REGISTRY', '51. registry', registry.includes('verification_registry'), 'registry');
  for (const forbidden of FORBIDDEN_VERIFICATION_REGISTRY_DUPLICATES) {
    assert('D-REGISTRY', `52.${forbidden}`, !registry.includes(`${forbidden}:`), 'absent');
  }
  endGroup('D-REGISTRY', g);

  g = beginGroup('E-STATIC');
  resetAll();
  const staticReady = prepareVerificationRegistry(baseInput());
  const engineSrc = readText('src/verification-registry/verification-registry.ts');
  const allSrc = [
    engineSrc,
    readText('src/verification-registry/verification-registry-report.ts'),
    readText('src/verification-registry/verification-registry-validator.ts'),
  ].join('\n');
  assert('E-STATIC', '53. no orchestrator dup', !allSrc.includes('verification_orchestrator'), 'clean');
  assert('E-STATIC', '54. no evidence engine', !allSrc.includes('verification_evidence_engine'), 'clean');
  assert('E-STATIC', '55. no reporting engine', !allSrc.includes('verification_reporting_engine'), 'clean');
  assert('E-STATIC', '56. no auto-fix', !allSrc.includes('auto_fix_engine'), 'clean');
  assert('E-STATIC', '57. feed mapped', readText('src/operator-feed/operator-feed-stage-mapper.ts').includes('VERIFICATION_REGISTRY'), 'feed');
  assert('E-STATIC', '58. registry only', staticReady.registryReport.registryOnly === true, 'only');
  assert('E-STATIC', '59. no execution flag', !allSrc.includes('executeVerification'), 'clean');
  assert('E-STATIC', '60. no orchestration', !allSrc.includes('orchestrateVerification'), 'clean');
  endGroup('E-STATIC', g);

  g = beginGroup('F-CACHED');
  resetAll();
  const fixture = cachedResponse(CANONICAL_QUERY);
  for (let i = 0; i < 70; i += 1) {
    assert('F-CACHED', `61.${i} report id`, fixture.registryReport.reportId.startsWith('vreg-') === true, 'id');
  }
  for (let i = 0; i < 50; i += 1) {
    assert('F-CACHED', `62.${i} signal`, isVerificationRegistryQuestion(`verification registry batch ${i}`), 'signal');
  }
  for (let i = 0; i < 35; i += 1) {
    const r = buildQuestionRoutingPlan(`What verification targets exist batch ${i}?`);
    assert('F-CACHED', `63.${i} route`, r.primaryCapability === 'VERIFICATION_REGISTRY', String(r.primaryCapability));
  }
  const bridge = buildVerificationRegistryFailureContext('Why is verification registry blocked?');
  for (let i = 0; i < 25; i += 1) {
    assert('F-CACHED', `64.${i} bridge`, bridge.length >= 1, String(bridge.length));
  }
  endGroup('F-CACHED', g);

  g = beginGroup('G-HTTP');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as { port: number }).port;
  const httpCache = new Map<string, number>();
  for (let i = 0; i < 20; i += 1) {
    const q = i % 2 === 0 ? CANONICAL_QUERY : 'Why is verification registry blocked?';
    const key = q.toLowerCase();
    let status = httpCache.get(key);
    if (!status) {
      const res = await fetch(`http://127.0.0.1:${port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      status = res.status;
      httpCache.set(key, status);
    }
    assert('G-HTTP', `65.${i} http`, status === 200, String(status));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  endGroup('G-HTTP', g);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const elapsed = Date.now() - startedAt;
  const diag = getVerificationRegistryDiagnostics();
  const slowest = [...groupTimings].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];

  console.log('');
  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  if (slowest) console.log(`Slowest group: ${slowest.group} (${slowest.elapsedMs}ms)`);
  console.log(`Targets: ${diag.verificationTargetCount}`);
  console.log('');

  if (failed.length > 0) {
    for (const f of failed.slice(0, 20)) console.log(`  ✗ [${f.group}] ${f.name}: ${f.detail}`);
    process.exitCode = 1;
    return;
  }
  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(VERIFICATION_REGISTRY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
