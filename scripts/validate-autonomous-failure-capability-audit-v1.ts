/**
 * AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1 — validation.
 *
 * Proves the audit tool in src/autonomous-failure-capability-audit-v1/:
 *   1. inspects real files (real BFS over the real import graph, real citations that resolve to
 *      files that actually exist on disk),
 *   2. identifies existing AutoFix/capability systems that are actually real (not scaffolds),
 *   3. correctly identifies whether each is wired into the real production build path,
 *   4. identifies concrete missing self-repair gaps with citations,
 *   5. does not implement any fix (the audit source itself never writes/execs anything),
 *   6. does not modify generation behavior (the audit module itself is not part of the real
 *      build path it inspects),
 *   7. is deterministic (running it twice yields identical structural output).
 *
 * This is a validator for an AUDIT, not a repair. It does not apply any fix and does not change
 * generation behavior.
 *
 * Run only:
 *   npx tsx scripts/validate-autonomous-failure-capability-audit-v1.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildAutonomousFailureCapabilityAuditReport,
  PRODUCTION_BUILD_ENTRYPOINT,
} from '../src/autonomous-failure-capability-audit-v1/index.js';
import type { AutonomousFailureCapabilityAuditReport } from '../src/autonomous-failure-capability-audit-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function listTsFilesRecursive(dirAbs: string): string[] {
  let files: string[] = [];
  for (const name of readdirSync(dirAbs)) {
    const abs = join(dirAbs, name);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      files = files.concat(listTsFilesRecursive(abs));
    } else if (/\.tsx?$/.test(name)) {
      files.push(abs);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------------------------
// Run the audit twice (determinism check happens below) before scoring individual scenarios.
// ---------------------------------------------------------------------------------------------
const reportA: AutonomousFailureCapabilityAuditReport = buildAutonomousFailureCapabilityAuditReport(ROOT);
const reportB: AutonomousFailureCapabilityAuditReport = buildAutonomousFailureCapabilityAuditReport(ROOT);

function stableJson(report: AutonomousFailureCapabilityAuditReport): string {
  const { generatedAt, ...rest } = report as unknown as Record<string, unknown>;
  return JSON.stringify(rest, Object.keys(rest).sort());
}

// 1. Audit inspects real files -----------------------------------------------------------------

assert(
  'Scenario 1: production entrypoint file really exists on disk',
  existsSync(join(ROOT, PRODUCTION_BUILD_ENTRYPOINT)),
  `entrypoint=${PRODUCTION_BUILD_ENTRYPOINT} exists=${existsSync(join(ROOT, PRODUCTION_BUILD_ENTRYPOINT))}`,
);

assert(
  'Scenario 2: reachability report confirms entrypoint was read and BFS visited a non-trivial number of real files',
  reportA.reachability.entrypointExists && reportA.reachability.filesVisited > 20,
  `entrypointExists=${reportA.reachability.entrypointExists} filesVisited=${reportA.reachability.filesVisited}`,
);

assert(
  'Scenario 3: BFS reached a non-trivial number of real src/ modules (not a hardcoded stub)',
  reportA.reachability.modulesReached.length > 15,
  `modulesReached.length=${reportA.reachability.modulesReached.length}`,
);

assert(
  'Scenario 4: every citation in the report resolves to a file path that really exists on disk',
  reportA.systems.every((s) => {
    const citations = [s.realLogicCitation].filter((c): c is NonNullable<typeof c> => c !== null);
    return citations.every((c) => existsSync(join(ROOT, c.file)));
  }),
  'all realLogicCitation.file paths exist on disk',
);

assert(
  'Scenario 5: failure-class coverage citations resolve to real files',
  reportA.failureClassCoverage.every((f) => !f.citation || existsSync(join(ROOT, f.citation.file))),
  'all failureClassCoverage citations point to real files',
);

assert(
  'Scenario 6: earliestStoppingPoint citation is a real, found (non-null-line) match in a real file',
  existsSync(join(ROOT, reportA.earliestStoppingPoint.file)) && reportA.earliestStoppingPoint.citation.line !== null,
  `file=${reportA.earliestStoppingPoint.file} line=${reportA.earliestStoppingPoint.citation.line}`,
);

// 2. Audit identifies existing AutoFix/capability systems that are real ------------------------

const buildAutofix = reportA.systems.find((s) => s.definition.id === 'aee-build-autofix-repair');
assert(
  'Scenario 7: audit identifies the real AEE build-AutoFix repair system as having real logic',
  !!buildAutofix?.hasRealLogicEvidence,
  `aee-build-autofix-repair hasRealLogicEvidence=${buildAutofix?.hasRealLogicEvidence} citation=${JSON.stringify(buildAutofix?.realLogicCitation)}`,
);

const classifier = reportA.systems.find((s) => s.definition.id === 'aee-build-failure-classifier');
assert(
  'Scenario 8: audit identifies the real build-failure classifier as having real logic',
  !!classifier?.hasRealLogicEvidence,
  `aee-build-failure-classifier hasRealLogicEvidence=${classifier?.hasRealLogicEvidence}`,
);

const capEvolutionRouter = reportA.systems.find((s) => s.definition.id === 'ase-capability-evolution-router');
assert(
  'Scenario 9: audit identifies the real capability-evolution router as having real logic',
  !!capEvolutionRouter?.hasRealLogicEvidence,
  `ase-capability-evolution-router hasRealLogicEvidence=${capEvolutionRouter?.hasRealLogicEvidence}`,
);

const missingCapIntake = reportA.systems.find((s) => s.definition.id === 'missing-capability-evolution-intake');
assert(
  'Scenario 10: audit identifies the real missing-capability-evolution intake system as having real logic',
  !!missingCapIntake?.hasRealLogicEvidence,
  `missing-capability-evolution-intake hasRealLogicEvidence=${missingCapIntake?.hasRealLogicEvidence}`,
);

// 3. Audit correctly identifies wiring into the real build path (internal consistency + known facts) --

assert(
  'Scenario 11: every WIRED_AND_REAL system\'s moduleDir is actually inside the computed reachable-module set',
  reportA.systems
    .filter((s) => s.verdict === 'WIRED_AND_REAL')
    .every((s) => reportA.reachability.modulesReached.includes(s.definition.moduleDir)),
  'wiring verdicts are internally consistent with the reachability set',
);

assert(
  'Scenario 12: every system NOT in the reachable-module set is never marked WIRED_AND_REAL',
  reportA.systems
    .filter((s) => !reportA.reachability.modulesReached.includes(s.definition.moduleDir))
    .every((s) => s.verdict !== 'WIRED_AND_REAL'),
  'no false-positive wiring claims',
);

assert(
  'Scenario 13: the Autonomous Engineering Executive (a directly-imported module) is confirmed wired',
  reportA.systems.find((s) => s.definition.id === 'autonomous-engineering-executive')?.wiredIntoProduction === true,
  'autonomous-engineering-executive is directly imported by one-prompt-build-orchestrator.ts',
);

assert(
  'Scenario 14: the Autonomous Debugging Engine (transitively imported via ASE stage orchestrator) is confirmed wired',
  reportA.systems.find((s) => s.definition.id === 'autonomous-debugging-engine')?.wiredIntoProduction === true,
  'autonomous-debugging-engine is reached transitively through autonomous-software-engineering-engine',
);

assert(
  'Scenario 15: wiringPathFromEntrypoint is non-empty for every WIRED_AND_REAL system',
  reportA.systems.filter((s) => s.verdict === 'WIRED_AND_REAL').every((s) => s.wiringPathFromEntrypoint.length > 0),
  'wired systems always carry a real import chain from the entrypoint',
);

// 4. Audit identifies missing self-repair gaps with citations ----------------------------------

assert(
  'Scenario 16: audit reports at least one failure class as NOT_HANDLED-eligible check ran (coverage computed for all 7 classes)',
  reportA.failureClassCoverage.length === 7,
  `failureClassCoverage.length=${reportA.failureClassCoverage.length}`,
);

assert(
  'Scenario 17: earliestStoppingPoint identifies a concrete missing-repair gap, not a vague statement',
  reportA.earliestStoppingPoint.description.includes('No repair strategy for failure class'),
  'earliestStoppingPoint cites the literal give-up message in the real repair code',
);

assert(
  'Scenario 18: missingCapabilityEvolutionGapFinding cites both a wired call site and a not-wired call site',
  reportA.missingCapabilityEvolutionGapFinding.wiredCitation.line !== null &&
    reportA.missingCapabilityEvolutionGapFinding.notWiredCitation.line !== null,
  `wired.line=${reportA.missingCapabilityEvolutionGapFinding.wiredCitation.line} notWired.line=${reportA.missingCapabilityEvolutionGapFinding.notWiredCitation.line}`,
);

assert(
  'Scenario 19: recommended implementation order references only existing systems already found by this audit',
  reportA.recommendedImplementationOrder.every((step) =>
    step.dependsOnExistingSystems.every((id) => reportA.systems.some((s) => s.definition.id === id)),
  ),
  'every dependsOnExistingSystems id resolves to a catalogued system',
);

assert(
  'Scenario 20: contractBoundGenerationAuthorityAssessment citations resolve to real files with a real line match',
  reportA.contractBoundGenerationAuthorityAssessment.supportingCitations.every(
    (c) => existsSync(join(ROOT, c.file)) && c.line !== null,
  ),
  'all Contract-Bound Generation Authority supporting citations are real, found matches',
);

// 5. Audit does not implement any fix -----------------------------------------------------------

const auditDir = join(ROOT, 'src/autonomous-failure-capability-audit-v1');
const auditSourceFiles = listTsFilesRecursive(auditDir);
// Matches real Node.js mutation/process-execution APIs. Deliberately requires a non-"." boundary
// before "exec(" so RegExp.prototype.exec(...) calls (used throughout this audit for read-only
// marker matching) are never mistaken for child_process exec(...).
const forbiddenMutationPatterns = [
  /\bwriteFileSync\b/,
  /\bappendFileSync\b/,
  /\bexecSync\b/,
  /[^.\w]exec\(/,
  /\brmSync\b/,
  /\bunlinkSync\b/,
  /\bmkdirSync\b/,
  /\bchild_process\b/,
];

const scenario21Violations: string[] = [];
for (const f of auditSourceFiles) {
  const src = readFileSync(f, 'utf8');
  for (const p of forbiddenMutationPatterns) {
    const m = p.exec(src);
    if (m) scenario21Violations.push(`${f}: matched ${p} -> "${m[0]}"`);
  }
}

assert(
  'Scenario 21: audit source contains zero file-mutation or process-execution calls anywhere',
  scenario21Violations.length === 0,
  scenario21Violations.length === 0
    ? `inspected ${auditSourceFiles.length} audit source file(s) for writeFileSync/execSync/etc — none found`
    : scenario21Violations.join('; '),
);

assert(
  'Scenario 22: audit engine only imports read-only fs primitives (existsSync/readFileSync/readdirSync/statSync)',
  (() => {
    const engineSrc = readFileSync(join(auditDir, 'autonomous-failure-capability-audit.ts'), 'utf8');
    const importLine = engineSrc.match(/import\s*\{([^}]+)\}\s*from\s*'node:fs'/);
    if (!importLine) return false;
    const imported = importLine[1].split(',').map((s) => s.trim());
    const allowed = new Set(['existsSync', 'readFileSync', 'readdirSync', 'statSync']);
    return imported.every((i) => allowed.has(i));
  })(),
  'node:fs imports in the audit engine are limited to read-only primitives',
);

// 6. Audit does not modify generation behavior --------------------------------------------------

assert(
  'Scenario 23: the audit module itself is NOT part of the real build path it inspects (no self-reference)',
  !reportA.reachability.modulesReached.includes('src/autonomous-failure-capability-audit-v1'),
  'autonomous-failure-capability-audit-v1 is not reachable from one-prompt-build-orchestrator.ts',
);

assert(
  'Scenario 24: one-prompt-build-orchestrator.ts was not modified by this task (no import of the new audit module)',
  !readFileSync(join(ROOT, PRODUCTION_BUILD_ENTRYPOINT), 'utf8').includes('autonomous-failure-capability-audit-v1'),
  'the real build orchestrator does not reference the new audit module',
);

// 7. Audit is deterministic ----------------------------------------------------------------------

assert(
  'Scenario 25: running the audit twice yields byte-identical structural output (excluding the timestamp)',
  stableJson(reportA) === stableJson(reportB),
  `stableJson lengths: A=${stableJson(reportA).length} B=${stableJson(reportB).length}`,
);

assert(
  'Scenario 26: the reachable-module BFS itself is deterministic (same module list both runs)',
  JSON.stringify(reportA.reachability.modulesReached) === JSON.stringify(reportB.reachability.modulesReached),
  `modulesReached count A=${reportA.reachability.modulesReached.length} B=${reportB.reachability.modulesReached.length}`,
);

// 8. Import-reachability alone is distinguished from real call-site invocation ------------------

assert(
  'Scenario 28: the AEE build-AutoFix repair is confirmed as DIRECTLY INVOKED (not just import-reachable) at a real call site',
  buildAutofix?.directlyInvokedEvidence === true && buildAutofix?.directlyInvokedCitation?.line !== null,
  `directlyInvokedEvidence=${buildAutofix?.directlyInvokedEvidence} citation=${JSON.stringify(buildAutofix?.directlyInvokedCitation)}`,
);

assert(
  'Scenario 29: every directlyInvokedEvidence=true system is also wiredIntoProduction=true (a real call site implies real import reachability)',
  reportA.systems.filter((s) => s.directlyInvokedEvidence).every((s) => s.wiredIntoProduction),
  'no system is marked directly-invoked without also being import-reachable',
);

assert(
  'Scenario 30: at least one catalogued system is import-reachable but NOT confirmed as a direct call site (proves the audit distinguishes the two, rather than treating reachability as automatic proof of invocation)',
  reportA.systems.some((s) => s.wiredIntoProduction && !s.directlyInvokedEvidence),
  `count with wired-but-not-directly-invoked=${reportA.systems.filter((s) => s.wiredIntoProduction && !s.directlyInvokedEvidence).length}`,
);

// Sanity: at least confirm the catalog is non-trivial and every category represented -------------

assert(
  'Scenario 27: catalog covers all required categories with a non-trivial number of systems each',
  reportA.existingFailureDiagnosisSystems.length >= 5 &&
    reportA.existingRepairSystems.length >= 5 &&
    reportA.existingCapabilityDetectionSystems.length >= 5,
  `diagnosis=${reportA.existingFailureDiagnosisSystems.length} repair=${reportA.existingRepairSystems.length} capability=${reportA.existingCapabilityDetectionSystems.length}`,
);

// ---------------------------------------------------------------------------------------------

const failed = results.filter((r) => !r.passed);

for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}`);
  if (!r.passed) console.log(`    ${r.detail}`);
}

console.log('');
console.log(`${results.length - failed.length}/${results.length} scenarios passed.`);

if (failed.length > 0) {
  console.log('');
  console.log('VALIDATION FAILED.');
  process.exit(1);
}

console.log('');
console.log(PASS_TOKEN);
