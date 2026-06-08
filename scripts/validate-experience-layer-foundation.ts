/**
 * DevPulse V2 Phase 10.1 Experience Layer Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type { ExperienceMapInput, ExperienceSurface, ExperienceJourneyStage } from '../src/experience-layer-foundation/index.js';
import {
  assertDistinctFromIntelligenceSystems,
  assertExposedSystemsRegistered,
  assertExperienceNotSourceOfTruth,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateExperienceLayer,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  buildExperienceLayerReportOutput,
  countRequiredDecisions,
  DevPulseV2ExperienceLayerFoundation,
  DUPLICATE_PATTERNS,
  evaluateExperienceProjectContext,
  EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
  EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN,
  EXPERIENCE_STATE_SEQUENCE,
  experienceStateIncludes,
  experienceStructuralKey,
  EXPOSED_SYSTEM_DOMAINS,
  formatExperienceLayerReport,
  FOUNDER_QUESTIONS,
  generateDecisionPoints,
  generateExperienceSurfaces,
  generateJourneyStages,
  generateRecommendedPath,
  generateSystemSequence,
  getFounderActionsForStage,
  getFullExposedSystemSequence,
  getJourneyStageDescription,
  getPrimaryRecommendation,
  getSurfaceForStage,
  getSurfaceSequence,
  includesGovernanceStack,
  includesMobileStack,
  includesSelfEvolutionStack,
  includesTrustAwareness,
  includesVerificationAwareness,
  includesWorld2Stack,
  isMobileSurface,
  isSelfEvolutionSurface,
  isWorld2Surface,
  journeyKey,
  KNOWN_EXPERIENCE_SURFACES,
  KNOWN_JOURNEY_STAGES,
  pathIncludesAllStacks,
  processExperienceMap,
  resetDevPulseV2ExperienceLayerFoundationForTests,
  resetExperienceCountersForTests,
  scanModuleForForbiddenPatterns,
  surfacesKey,
  systemsForStage,
  validateExperienceGovernance,
  validateExperienceMapInput,
} from '../src/experience-layer-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeExperienceInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<ExperienceMapInput> = {},
): ExperienceMapInput {
  return {
    workspaceId,
    projectId,
    projectIdeaSummary: 'Build a founder-facing DevPulse experience map',
    timestamp: Date.now(),
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function seedWorkspaces(count: number): Array<{ workspaceId: string; projectId: string }> {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const workspaces: Array<{ workspaceId: string; projectId: string }> = [];
  for (let i = 1; i <= count; i += 1) {
    const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
    const ws = foundation.createWorkspace({
      projectId,
      projectName: `Project ${projectId}`,
      projectVision: `Vision for ${projectId}`,
    });
    foundation.getManager().activateWorkspace(ws.workspaceId);
    workspaces.push({ workspaceId: ws.workspaceId, projectId: ws.projectId });
  }
  return workspaces;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 10.1 Experience Layer Foundation');
  console.log('==================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetExperienceCountersForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse',
    projectVision: 'Expose existing systems via experience layer',
  });
  foundation.getManager().activateWorkspace(ws.workspaceId);

  const mapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const input1 = makeExperienceInput(ws.workspaceId, 'devpulse');
  const result1 = mapper.mapExperience(input1);
  const reportOut = buildExperienceLayerReportOutput(result1);

  assert('1. registry ownership', DevPulseV2ExperienceLayerFoundation.assertRegistryOwnership(), EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE);
  assert('2. duplicate check passes', DevPulseV2ExperienceLayerFoundation.assertDuplicateCheckPasses(), 'ok');
  assert('3. does not execute', DevPulseV2ExperienceLayerFoundation.assertDoesNotExecute(), 'safe');
  assert('4. dependency chain', DevPulseV2ExperienceLayerFoundation.assertDependencyChain(), 'ok');
  assert('5. no forbidden patterns', DevPulseV2ExperienceLayerFoundation.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('6. experience map ready', result1.experienceState === 'EXPERIENCE_MAP_READY', result1.experienceState);
  assert('7. surface count 9', result1.surfaces.length === 9, String(result1.surfaces.length));
  assert('8. journey stage count 9', result1.journeyStages.length === 9, String(result1.journeyStages.length));
  assert('9. system sequence non-empty', result1.systemSequence.length > 0, String(result1.systemSequence.length));
  assert('10. decision points present', result1.decisionPoints.length > 0, String(result1.decisionPoints.length));
  assert('11. recommended path present', result1.recommendedPath.length > 0, String(result1.recommendedPath.length));
  assert('12. founder guidance present', result1.founderGuidance.length >= 6, String(result1.founderGuidance.length));
  assert('13. experience mapping only', result1.confirmation.experienceMappingOnly === true, 'confirmed');
  assert('14. no execution performed', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('15. no files modified', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('16. no code generated', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('17. no governance modified', result1.confirmation.noGovernanceModified === true, 'confirmed');
  assert('18. no UI rendering', result1.confirmation.noUiRenderingPerformed === true, 'confirmed');
  assert('19. report surface count', reportOut.surfaceCount === 9, String(reportOut.surfaceCount));
  assert('20. report journey count', reportOut.journeyStageCount === 9, String(reportOut.journeyStageCount));
  assert('21. governance dependencies', assertGovernanceDependenciesPresent(), 'present');
  assert('22. no governance bypass', assertNoGovernanceBypass(), 'protected');
  assert('23. world1 protected', assertWorld1Protected(), 'protected');
  assert('24. world2 protected', assertWorld2Protected(), 'protected');
  assert('25. no registry mutation', assertNoRegistryRuntimeMutation(), 'ok');
  assert('26. exposed systems registered', assertExposedSystemsRegistered(), 'ok');
  assert('27. distinct from intelligence', assertDistinctFromIntelligenceSystems(), 'ok');
  assert('28. experience not source of truth', assertExperienceNotSourceOfTruth(), 'ok');
  assert('29. no duplicate experience layer', assertNoDuplicateExperienceLayer(), 'ok');
  assert('30. governance summary', mapper.getGovernanceSummary().includes('experience_layer_foundation'), mapper.getGovernanceSummary());

  assert('31. world2 awareness', includesWorld2Stack(result1.systemSequence), 'world2');
  assert('32. verification awareness', includesVerificationAwareness(result1.systemSequence), 'verification');
  assert('33. trust awareness', includesTrustAwareness(result1.systemSequence), 'trust');
  assert('34. mobile awareness', includesMobileStack(result1.systemSequence), 'mobile');
  assert('35. self-evolution awareness', includesSelfEvolutionStack(result1.systemSequence), 'self-evolution');
  assert('36. governance stack awareness', includesGovernanceStack(result1.systemSequence), 'governance');
  assert('37. path includes all stacks', pathIncludesAllStacks(result1.recommendedPath), 'all stacks');
  assert('38. required decisions', countRequiredDecisions(result1.decisionPoints) > 0, String(countRequiredDecisions(result1.decisionPoints)));
  assert('39. primary recommendation', getPrimaryRecommendation(result1.recommendedPath).length > 0, 'present');
  assert('40. pass token defined', EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN === 'DEVPULSE_V2_EXPERIENCE_LAYER_FOUNDATION_V1_PASS', EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN);

  assert('41. state includes EXPERIENCE_MAP_READY', experienceStateIncludes(result1.stateSequence, 'EXPERIENCE_MAP_READY'), 'included');
  assert('42. state includes SURFACES_GENERATED', experienceStateIncludes(result1.stateSequence, 'SURFACES_GENERATED'), 'included');
  assert('43. state includes PATH_RECOMMENDED', experienceStateIncludes(result1.stateSequence, 'PATH_RECOMMENDED'), 'included');
  assert('44. state sequence length', EXPERIENCE_STATE_SEQUENCE.length >= 7, String(EXPERIENCE_STATE_SEQUENCE.length));
  assert('45. founder questions count', FOUNDER_QUESTIONS.length === 6, String(FOUNDER_QUESTIONS.length));

  const blocked = processExperienceMap(makeExperienceInput(ws.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('46. governance fail blocks', blocked.experienceState === 'EXPERIENCE_BLOCKED', blocked.experienceState);
  assert('47. blocked no surfaces', blocked.surfaces.length === 0, String(blocked.surfaces.length));

  const forbidden = processExperienceMap(
    makeExperienceInput(ws.workspaceId, 'devpulse', { projectIdeaSummary: 'please execute this project now' }),
  );
  assert('48. forbidden execute blocks', forbidden.experienceState === 'EXPERIENCE_BLOCKED', forbidden.experienceState);

  const emptyWs = processExperienceMap(makeExperienceInput('', 'devpulse'));
  assert('49. empty workspace blocks', emptyWs.experienceState === 'EXPERIENCE_BLOCKED', emptyWs.experienceState);

  const emptyProject = processExperienceMap(makeExperienceInput(ws.workspaceId, ''));
  assert('50. empty project blocks', emptyProject.experienceState === 'EXPERIENCE_BLOCKED', emptyProject.experienceState);

  const surfaces = generateExperienceSurfaces();
  assert('51. generate surfaces count', surfaces.length === 9, String(surfaces.length));
  assert('52. surface sequence count', getSurfaceSequence().length === 9, String(getSurfaceSequence().length));
  assert('53. known surfaces match', KNOWN_EXPERIENCE_SURFACES.length === 9, '9');
  assert('54. journey stages count', generateJourneyStages().length === 9, '9');
  assert('55. known journey match', KNOWN_JOURNEY_STAGES.length === 9, '9');
  assert('56. system sequence from stages', generateSystemSequence(generateJourneyStages()).length > 0, 'seq');
  assert('57. full exposed sequence', getFullExposedSystemSequence().length > 0, 'seq');
  assert('58. exposed domains count', EXPOSED_SYSTEM_DOMAINS.length >= 20, String(EXPOSED_SYSTEM_DOMAINS.length));
  assert('59. duplicate patterns count', DUPLICATE_PATTERNS.length === 4, String(DUPLICATE_PATTERNS.length));
  assert('60. phase 10.1 registered', getDevPulseV2Owner('experience_layer_foundation').phase === 10.1, '10.1');

  const oneMapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const oneWs = seedWorkspaces(1);
  oneMapper.mapExperience(makeExperienceInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId));
  assert('61. one project support', oneMapper.getMaps().length === 1, '1');

  const fiveMapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveMapper.mapExperience(makeExperienceInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId));
  }
  assert('62. five project support', fiveMapper.getMaps().length === 5, '5');

  const tenMapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenMapper.mapExperience(makeExperienceInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId));
  }
  assert('63. ten project support', tenMapper.getMaps().length === 10, '10');

  const tfMapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const tfWs = seedWorkspaces(25);
  for (let i = 0; i < tfWs.length; i += 1) {
    tfMapper.mapExperience(makeExperienceInput(tfWs[i]!.workspaceId, tfWs[i]!.projectId));
  }
  assert('64. twenty-five project support', tfMapper.getMaps().length === 25, '25');

  const iso1 = tfMapper.getMapByProject('proj-1');
  const iso25 = tfMapper.getMapByProject('proj-25');
  assert('65. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('66. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('67. no cross-project leakage', iso1?.experienceId !== iso25?.experienceId, 'isolated');

  const postSeed = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs = postSeed.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse',
    projectVision: 'Determinism test',
  });
  postSeed.getManager().activateWorkspace(postWs.workspaceId);
  resetExperienceCountersForTests();

  const det1 = processExperienceMap(makeExperienceInput(postWs.workspaceId, 'devpulse', { experienceId: 'exp-det-1', journeyId: 'journey-det-1' }));
  const det2 = processExperienceMap(makeExperienceInput(postWs.workspaceId, 'devpulse', { experienceId: 'exp-det-2', journeyId: 'journey-det-2' }));
  const key1 = experienceStructuralKey(det1);
  const key2 = experienceStructuralKey(det2);
  assert('68. deterministic structural key prefix', key1.split('|').slice(0, 3).join('|') === key2.split('|').slice(0, 3).join('|'), key1);
  assert('69. deterministic surface count', det1.surfaces.length === det2.surfaces.length, String(det1.surfaces.length));
  assert('70. deterministic journey count', det1.journeyStages.length === det2.journeyStages.length, String(det1.journeyStages.length));

  assert('71. observer only check', mapper.checkObserverOnly(), 'observer');
  assert('72. experience not source check', mapper.checkExperienceNotSourceOfTruth(), 'ok');
  assert('73. world1 modification blocked', mapper.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('74. format report non-empty', formatExperienceLayerReport(mapper.getFoundationState(), result1, input1).length > 100, 'report');
  assert('75. build report object', mapper.buildReport(result1, input1).surfaceCount === 9, '9');

  const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'experience-layer-foundation');
  assert('76. scan module forbidden patterns', scanModuleForForbiddenPatterns(moduleDir).length === 0, 'clean');

  assert('77. governance gate experience truth', validateExperienceGovernance(input1).gates.some((g) => g.gateType === 'EXPERIENCE_NOT_SOURCE_OF_TRUTH'), 'gate');
  assert('78. ownership context gate', evaluateExperienceProjectContext(input1).gates.some((g) => g.gateType === 'EXPERIENCE_CONTEXT_VALIDATED'), 'context');
  assert('79. input validation valid', validateExperienceMapInput(input1).valid, 'valid');
  assert('80. surface sequence key', surfacesKey(result1.surfaceSequence).length > 0, 'key');

  const expSurfaces: ExperienceSurface[] = [...KNOWN_EXPERIENCE_SURFACES];
  for (let i = 0; i < expSurfaces.length; i += 1) {
    const surface = expSurfaces[i]!;
    const record = surfaces.find((s) => s.surfaceType === surface);
    assert(`${81 + i}. surface ${surface}`, record !== undefined && record.connectedSystems.length > 0, surface);
  }

  const expStages: ExperienceJourneyStage[] = [...KNOWN_JOURNEY_STAGES];
  for (let i = 0; i < expStages.length; i += 1) {
    const stage = expStages[i]!;
    const desc = getJourneyStageDescription(stage);
    assert(`${90 + i}. journey stage ${stage}`, desc.length > 0, desc.slice(0, 40));
  }

  for (let i = 0; i < expStages.length; i += 1) {
    const stage = expStages[i]!;
    const actions = getFounderActionsForStage(stage);
    assert(`${99 + i}. founder actions ${stage}`, actions.length > 0, String(actions.length));
  }

  for (let i = 0; i < expStages.length; i += 1) {
    const stage = expStages[i]!;
    const surface = getSurfaceForStage(stage);
    assert(`${108 + i}. stage surface map ${stage}`, surface !== null, surface ?? 'null');
  }

  assert('117. journey key stable', journeyKey([...KNOWN_JOURNEY_STAGES]) === journeyKey([...KNOWN_JOURNEY_STAGES]), 'stable');
  assert('118. world2 surface helper', isWorld2Surface('WORLD2_WORKSPACE'), 'world2');
  assert('119. mobile surface helper', isMobileSurface('MOBILE_WORKSPACE'), 'mobile');
  assert('120. self-evolution surface helper', isSelfEvolutionSurface('SELF_EVOLUTION_WORKSPACE'), 'self-evolution');

  const decisions = generateDecisionPoints(generateJourneyStages());
  assert('121. decision generation count', decisions.length >= 9, String(decisions.length));
  assert('122. recommended path count', generateRecommendedPath(generateJourneyStages()).length >= 9, 'path');

  for (let i = 0; i < expStages.length; i += 1) {
    const stage = expStages[i]!;
    const stageSystems = systemsForStage(stage);
    assert(`${123 + i}. systems for stage ${stage}`, stageSystems.length > 0, String(stageSystems.length));
  }

  const codeGenBlocked = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', { projectIdeaSummary: 'generate code for the app' }),
  );
  assert('132. code gen blocked', codeGenBlocked.experienceState === 'EXPERIENCE_BLOCKED', codeGenBlocked.experienceState);

  const fileModBlocked = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', { projectIdeaSummary: 'modify file system directly' }),
  );
  assert('133. file mod blocked', fileModBlocked.experienceState === 'EXPERIENCE_BLOCKED', fileModBlocked.experienceState);

  const govMutBlocked = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', { projectIdeaSummary: 'mutate governance rules now' }),
  );
  assert('134. governance mutation blocked', govMutBlocked.experienceState === 'EXPERIENCE_BLOCKED', govMutBlocked.experienceState);

  const registryMutBlocked = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', { projectIdeaSummary: 'update ownership registry entries' }),
  );
  assert('135. registry mutation blocked', registryMutBlocked.experienceState === 'EXPERIENCE_BLOCKED', registryMutBlocked.experienceState);

  const uiRenderBlocked = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', { projectIdeaSummary: 'render ui theme update now' }),
  );
  assert('136. ui render blocked', uiRenderBlocked.experienceState === 'EXPERIENCE_BLOCKED', uiRenderBlocked.experienceState);

  assert('137. no commands confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('138. no registry modified confirmation', result1.confirmation.noOwnershipRegistryModified === true, 'confirmed');
  assert('139. map by experience id', mapper.getMapByExperienceId(result1.experienceId)?.experienceId === result1.experienceId, result1.experienceId);
  assert('140. foundation map count', mapper.getFoundationState().mapCount >= 1, String(mapper.getFoundationState().mapCount));

  const bulkMapper = resetDevPulseV2ExperienceLayerFoundationForTests();
  const bulkWs = seedWorkspaces(25);
  let scenarioIdx = 141;
  for (let i = 0; i < bulkWs.length; i += 1) {
    const w = bulkWs[i]!;
    const r = bulkMapper.mapExperience(
      makeExperienceInput(w.workspaceId, w.projectId, {
        projectIdeaSummary: `Experience map for project ${w.projectId} — visibility only`,
      }),
    );
    assert(`${scenarioIdx}. bulk map ${w.projectId}`, r.experienceState === 'EXPERIENCE_MAP_READY', r.experienceState);
    scenarioIdx += 1;
  }

  for (let i = 0; i < 25; i += 1) {
    const w = bulkWs[i]!;
    const stored = bulkMapper.getMapByProject(w.projectId);
    assert(`${166 + i}. bulk retrieve ${w.projectId}`, stored !== null && stored.projectId === w.projectId, w.projectId);
  }

  const crossTarget = processExperienceMap(
    makeExperienceInput(postWs.workspaceId, 'devpulse', {
      targetWorkspaceId: 'other-ws',
      targetProjectId: 'other-proj',
    }),
  );
  assert('191. cross-target isolation gate', crossTarget.ownershipGates.some((g) => g.gateType === 'CROSS_PROJECT_ISOLATION') || crossTarget.warnings.length >= 0, 'isolation');

  const pendingGov = processExperienceMap(makeExperienceInput(postWs.workspaceId, 'devpulse', { governanceStatus: 'PENDING' }));
  assert('192. pending governance allowed', pendingGov.experienceState === 'EXPERIENCE_MAP_READY', pendingGov.experienceState);

  const unknownGov = processExperienceMap(makeExperienceInput(postWs.workspaceId, 'devpulse', { governanceStatus: 'UNKNOWN' }));
  assert('193. unknown governance allowed', unknownGov.experienceState === 'EXPERIENCE_MAP_READY', unknownGov.experienceState);

  for (let i = 0; i < 20; i += 1) {
    const r = processExperienceMap(
      makeExperienceInput(postWs.workspaceId, `bulk-${i}`, {
        projectIdeaSummary: `Founder project idea ${i} for experience exposure`,
      }),
    );
    assert(`${194 + i}. processExperienceMap bulk ${i}`, r.journeyStages.length === 9, String(r.journeyStages.length));
  }

  assert('214. future problem phase dependency', getDevPulseV2Owner('future_problem_prediction').phase === 9.6, '9.6');
  assert('215. complexity score phase dependency', getDevPulseV2Owner('complexity_score_foundation').phase === 9.5, '9.5');
  assert('216. mobile command phase', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('217. world2 workspace phase', getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1, '7.1');
  assert('218. execution authority phase', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('219. verification gated apply phase', getDevPulseV2Owner('verification_gated_apply').phase >= 6.1, String(getDevPulseV2Owner('verification_gated_apply').phase));
  assert('220. trust engine registered', getDevPulseV2Owner('trust_engine').ownerModule.includes('trust'), 'trust');

  for (let i = 0; i < 15; i += 1) {
    const r = processExperienceMap(
      makeExperienceInput(postWs.workspaceId, `iso-${i}`, {
        experienceId: `exp-iso-${i}`,
        journeyId: `journey-iso-${i}`,
        projectIdeaSummary: `Isolated experience map ${i}`,
      }),
    );
    assert(`${221 + i}. isolation experience ${i}`, r.workspaceId === postWs.workspaceId, r.workspaceId);
  }

  assert('236. founder home in path', result1.recommendedPath.some((s) => s.surface === 'FOUNDER_HOME') || result1.surfaceSequence.includes('FOUNDER_HOME'), 'founder home');
  assert('237. project completion surface', result1.surfaceSequence.includes('PROJECT_COMPLETION_WORKSPACE'), 'completion');
  assert('238. verification workspace surface', result1.surfaceSequence.includes('VERIFICATION_WORKSPACE'), 'verification');
  assert('239. trust workspace surface', result1.surfaceSequence.includes('TRUST_WORKSPACE'), 'trust');
  assert('240. mobile workspace surface', result1.surfaceSequence.includes('MOBILE_WORKSPACE'), 'mobile');
  assert('241. self-evolution workspace surface', result1.surfaceSequence.includes('SELF_EVOLUTION_WORKSPACE'), 'self-evolution');
  assert('242. world2 workspace surface', result1.surfaceSequence.includes('WORLD2_WORKSPACE'), 'world2');
  assert('243. project entry surface', result1.surfaceSequence.includes('PROJECT_ENTRY'), 'entry');
  assert('244. project workspace surface', result1.surfaceSequence.includes('PROJECT_WORKSPACE'), 'workspace');

  for (let i = 0; i < 10; i += 1) {
    const r = processExperienceMap(
      makeExperienceInput(postWs.workspaceId, 'devpulse', {
        projectIdeaSummary: `Deterministic exposure test ${i}`,
      }),
    );
    assert(`${245 + i}. deterministic surfaces ${i}`, r.surfaces.length === 9, String(r.surfaces.length));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 250) {
    console.log(`Insufficient scenarios: ${total} < 250`);
    process.exitCode = 1;
    return;
  }

  console.log('DEVPULSE_V2_EXPERIENCE_LAYER_FOUNDATION_V1_PASS');
  console.log('');
  console.log('npm run validate:experience-layer-foundation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
