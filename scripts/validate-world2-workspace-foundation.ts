/**
 * DevPulse V2 World 2 Workspace Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  assertConstitutionReferenced,
  assertDistinctFromWorld2IsolationGate,
  assertFileOwnership,
  assertGovernanceStackPresent,
  assertNoGovernanceBypassAttempt,
  assertWorld1FoundationProtected,
  boundaryOutputKey,
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  checkWorkspaceTakeover,
  DevPulseV2World2WorkspaceFoundation,
  evaluateWorkspaceIsolation,
  formatWorld2WorkspaceReport,
  getGovernanceBridgeSummary,
  identityKey,
  isCommunicationAllowed,
  isCommunicationBlocked,
  isValidWorkspaceId,
  isolationOutputKey,
  lookupOutputKey,
  MAX_WORKSPACES,
  normalizeProjectId,
  rejectOrphanFile,
  resetDevPulseV2World2WorkspaceFoundationForTests,
  WORLD1_PROTECTED_DOMAINS,
  WORLD2_WORKSPACE_OWNER_MODULE,
  WORLD2_WORKSPACE_PASS_TOKEN,
} from '../src/world2-workspace-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function seedWorkspaces(foundation: DevPulseV2World2WorkspaceFoundation, count: number) {
  const names = [
    'DevPulse Workspace',
    'Fine Print Decipherer Workspace',
    'OmniLingo Workspace',
    'TempLink Workspace',
    'Project A Workspace',
  ];
  for (let i = 0; i < count; i += 1) {
    foundation.createWorkspace({
      projectId: `project-${i + 1}`,
      projectName: names[i % names.length] ?? `Project ${i + 1}`,
      projectVision: `Vision for project ${i + 1}`,
    });
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — World 2 Workspace Foundation');
  console.log('==========================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const manager = foundation.getManager();

  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse independently in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Decipherer Workspace',
    projectVision: 'Legal document analysis project',
  });

  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().pauseWorkspace(ws2.workspaceId);

  assert('1. workspace creation succeeds', ws1.workspaceId.startsWith('world2-ws-'), ws1.workspaceId);
  assert('2. workspace state includes WORKSPACE_CREATED', ws1.stateSequence.includes('WORKSPACE_CREATED'), ws1.stateSequence.join(' → '));
  assert('3. workspace identity valid', isValidWorkspaceId(ws1.workspaceId), ws1.workspaceId);
  assert('4. project id normalized', ws1.projectId === 'devpulse', ws1.projectId);
  assert('5. identity key deterministic', identityKey(ws1) === `${ws1.workspaceId}|devpulse`, identityKey(ws1));
  assert('6. lookup by project id', manager.lookupByProjectId('devpulse')?.workspaceId === ws1.workspaceId, ws1.workspaceId);
  assert('7. lookup output key', lookupOutputKey(manager, 'devpulse') === identityKey(ws1), lookupOutputKey(manager, 'devpulse'));
  assert('8. duplicate project rejected', (() => {
    try {
      manager.createWorkspace({ projectId: 'devpulse', projectName: 'Dup', projectVision: 'x' });
      return false;
    } catch {
      return true;
    }
  })(), 'duplicate blocked');

  const crossRead = checkCrossWorkspaceAccess(ws1.workspaceId, ws2);
  assert('9. cross-workspace read blocked', !crossRead.allowed && crossRead.verdict === 'BOUNDARY_VIOLATION', crossRead.reason);
  const sameAccess = checkCrossWorkspaceAccess(ws1.workspaceId, ws1);
  assert('10. same-workspace access allowed', sameAccess.allowed, sameAccess.reason);

  const takeover = checkWorkspaceTakeover(ws1.workspaceId, ws2.workspaceId);
  assert('11. workspace takeover blocked', !takeover.allowed, takeover.reason);

  const world1Mod = checkWorld1ModificationAttempt('verification_gated_apply');
  assert('12. world1 governance modification blocked', !world1Mod.allowed && world1Mod.verdict === 'WORLD1_PROTECTED', world1Mod.reason);
  const world1Foundation = checkWorld1ModificationAttempt('foundation_enforcement');
  assert('13. world1 foundation modification blocked', !world1Foundation.allowed, world1Foundation.reason);

  const isolation = evaluateWorkspaceIsolation(ws1.workspaceId, ws2);
  assert('14. workspace isolation enforced', !isolation.isolated, `${isolation.checks.length} checks`);
  assert('15. isolation output key deterministic', isolationOutputKey(ws1.workspaceId, ws2.workspaceId).includes('false'), isolationOutputKey(ws1.workspaceId, ws2.workspaceId));

  const activated = manager.activateWorkspace(ws1.workspaceId);
  assert('16. workspace activation', activated?.workspaceState === 'WORKSPACE_ACTIVE', String(activated?.workspaceState));
  const paused = manager.pauseWorkspace(ws2.workspaceId);
  assert('17. workspace pause', paused?.workspaceState === 'WORKSPACE_PAUSED', String(paused?.workspaceState));
  const archived = manager.archiveWorkspace(ws2.workspaceId);
  assert('18. workspace archival', archived?.workspaceState === 'WORKSPACE_ARCHIVED', String(archived?.workspaceState));
  const deleted = manager.deleteWorkspace(ws2.workspaceId);
  assert('19. workspace deletion', deleted?.workspaceState === 'WORKSPACE_DELETED', String(deleted?.workspaceState));

  assert('20. active workspace count', manager.getActiveWorkspaceCount() === 1, String(manager.getActiveWorkspaceCount()));
  assert('21. workspace count excludes deleted', manager.getWorkspaceCount() === 1, String(manager.getWorkspaceCount()));

  const w1Notify = manager.tagNotification('WORLD2', 'DevPulse Workspace build completed.', ws1.workspaceId);
  const world1Notify = manager.tagNotification('WORLD1', 'Phase 6 governance checkpoint completed.');
  assert('22. WORLD2 notification tagged', w1Notify.sourceWorld === 'WORLD2', w1Notify.sourceWorld);
  assert('23. WORLD1 notification tagged', world1Notify.sourceWorld === 'WORLD1', world1Notify.sourceWorld);
  assert('24. notification includes workspace id', w1Notify.workspaceId === ws1.workspaceId, String(w1Notify.workspaceId));
  assert('25. world1 notification has null workspace', world1Notify.workspaceId === null, 'null workspace');

  assert('26. RECOMMENDATION communication allowed', isCommunicationAllowed('RECOMMENDATION'), 'allowed');
  assert('27. PLAN communication allowed', isCommunicationAllowed('PLAN'), 'allowed');
  assert('28. STATUS communication allowed', isCommunicationAllowed('STATUS'), 'allowed');
  assert('29. RISK_REPORT communication allowed', isCommunicationAllowed('RISK_REPORT'), 'allowed');
  assert('30. DIRECT_WORLD1_MODIFICATION blocked', isCommunicationBlocked('DIRECT_WORLD1_MODIFICATION'), 'blocked');
  assert('31. GOVERNANCE_BYPASS blocked', isCommunicationBlocked('GOVERNANCE_BYPASS'), 'blocked');
  assert('32. WORKSPACE_TAKEOVER blocked', isCommunicationBlocked('WORKSPACE_TAKEOVER'), 'blocked');

  assert('33. boundary output key deterministic', boundaryOutputKey(ws1.workspaceId, ws2.workspaceId, 'PLAN',).includes('false'), boundaryOutputKey(ws1.workspaceId, ws2.workspaceId, 'PLAN'));

  assert('34. file ownership valid', assertFileOwnership(ws1.workspaceId, ws1.workspaceId), 'owned');
  assert('35. orphan file rejected', rejectOrphanFile(null), 'null rejected');
  assert('36. mismatched file ownership rejected', !assertFileOwnership(ws1.workspaceId, ws2.workspaceId), 'mismatch');

  assert('37. governance stack present', assertGovernanceStackPresent(), getGovernanceBridgeSummary());
  assert('38. no governance bypass', assertNoGovernanceBypassAttempt(), 'bypass blocked');
  assert('39. world1 foundation protected', assertWorld1FoundationProtected(), 'protected');
  assert('40. constitution referenced', assertConstitutionReferenced(), 'constitution ok');
  assert('41. distinct from world2 isolation gate', assertDistinctFromWorld2IsolationGate(), 'distinct owners');

  assert('42. registry ownership', DevPulseV2World2WorkspaceFoundation.assertRegistryOwnership(), WORLD2_WORKSPACE_OWNER_MODULE);
  assert('43. duplicate check passes', DevPulseV2World2WorkspaceFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('44. does not execute', DevPulseV2World2WorkspaceFoundation.assertDoesNotExecute(), 'no execution paths');
  assert('45. dependency chain', DevPulseV2World2WorkspaceFoundation.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('world2_workspace_foundation');
  assert('46. registry phase 7.1', owner.phase === 7.1, String(owner.phase));
  assert('47. registry owner module', owner.ownerModule === WORLD2_WORKSPACE_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2WorkspaceReport(foundation.getFoundationState());
  assert('48. report workspace count', reportText.includes('Workspace count:'), 'count line');
  assert('49. report active count', reportText.includes('Active workspace count:'), 'active line');
  assert('50. report isolation status', reportText.includes('Isolation status: ENFORCED'), 'isolation');
  assert('51. report boundary status', reportText.includes('Boundary status: ENFORCED'), 'boundary');
  assert('52. report notification status', reportText.includes('Notification status: TAGGED_BY_SOURCE_WORLD'), 'notifications');
  assert('53. report world1 protection', reportText.includes('World 1 protection status: PROTECTED'), 'world1');
  assert('54. report foundation only confirmed', reportText.includes('World 2 foundation only: CONFIRMED'), 'foundation only');
  assert('55. report no autonomous builder', reportText.includes('No autonomous builder enabled: CONFIRMED'), 'no builder');
  assert('56. report no execution planner', reportText.includes('No execution planner enabled: CONFIRMED'), 'no planner');
  assert('57. report no simulation runtime', reportText.includes('No simulation runtime enabled: CONFIRMED'), 'no simulation');
  assert('58. report no learning loop', reportText.includes('No learning loop enabled: CONFIRMED'), 'no learning');

  assert('59. MAX_WORKSPACES is 25', MAX_WORKSPACES === 25, String(MAX_WORKSPACES));
  assert('60. normalize project id trims', normalizeProjectId('  My Project  ') === 'my-project', normalizeProjectId('  My Project  '));

  const multiFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  seedWorkspaces(multiFoundation, 5);
  assert('61. five workspaces supported', multiFoundation.getManager().getWorkspaceCount() === 5, '5 workspaces');

  const tenFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  seedWorkspaces(tenFoundation, 10);
  assert('62. ten workspaces supported', tenFoundation.getManager().getWorkspaceCount() === 10, '10 workspaces');

  const limitFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  seedWorkspaces(limitFoundation, 25);
  assert('63. twenty-five workspaces supported', limitFoundation.getManager().getWorkspaceCount() === 25, '25 workspaces');
  assert('64. twenty-sixth workspace rejected', (() => {
    try {
      limitFoundation.createWorkspace({ projectId: 'overflow', projectName: 'Overflow', projectVision: 'x' });
      return false;
    } catch {
      return true;
    }
  })(), 'limit enforced');

  assert('65. world1 protected domains non-empty', WORLD1_PROTECTED_DOMAINS.length >= 10, String(WORLD1_PROTECTED_DOMAINS.length));
  assert('66. ownership key lookup', manager.getOwnershipKey(ws1.workspaceId) === identityKey(ws1), manager.getOwnershipKey(ws1.workspaceId) ?? 'null');

  const isolationGate = getDevPulseV2Owner('world2_isolation');
  assert('67. world2 isolation gate preserved', isolationGate.ownerModule === 'devpulse_v2_world2_isolation_gate', isolationGate.ownerModule);
  assert('68. workspace foundation distinct owner', owner.ownerModule !== isolationGate.ownerModule, 'distinct');

  assert('69. get workspace by id', manager.getWorkspace(ws1.workspaceId)?.projectName === 'DevPulse Workspace', ws1.projectName);
  assert('70. notifications list populated', manager.getNotifications().length >= 2, String(manager.getNotifications().length));

  assert('71. governance bridge summary non-empty', getGovernanceBridgeSummary().includes('law_enforcement'), getGovernanceBridgeSummary());
  assert('72. pass token defined', WORLD2_WORKSPACE_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_WORKSPACE_FOUNDATION_V1_PASS', WORLD2_WORKSPACE_PASS_TOKEN);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('73. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('==========================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(WORLD2_WORKSPACE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-workspace-foundation');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
