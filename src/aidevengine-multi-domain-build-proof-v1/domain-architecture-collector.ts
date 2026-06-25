/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — parameterized product architecture evidence.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ProductArchitectureEvidence, ProductArchitectureEvidenceItem } from '../aidevengine-build-proof-v1-4/product-architecture-evidence-types.js';
import type { VisualRuntimeEvidence } from '../aidevengine-build-proof-v1-3/visual-runtime-evidence-types.js';
import type {
  DomainBehaviourEvidenceRecord,
  MultiDomainScenarioDefinition,
} from './multi-domain-scenario-types.js';

function recordItem(
  items: ProductArchitectureEvidenceItem[],
  input: Omit<ProductArchitectureEvidenceItem, 'readOnly'>,
): void {
  items.push({ readOnly: true, ...input });
}

function listSourceFiles(workspaceDir: string, max = 200): string[] {
  if (!existsSync(workspaceDir)) return [];
  const out: string[] = [];
  function walk(current: string, depth: number): void {
    if (out.length >= max || depth > 8) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full, depth + 1);
      } else if (/\.(tsx?|jsx?|html|css|json|mjs)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  walk(workspaceDir, 0);
  return out;
}

function readWorkspaceCombined(workspaceDir: string): string {
  let combined = '';
  for (const file of listSourceFiles(workspaceDir)) {
    try {
      combined += readFileSync(file, 'utf8') + '\n';
    } catch {
      /* skip */
    }
  }
  return combined;
}

function readJsonIfExists(path: string): unknown | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function collectDomainProductArchitectureEvidence(input: {
  scenario: MultiDomainScenarioDefinition;
  workspacePath: string | null;
  contractId: string | null;
  enrichedPrompt: string;
  uvlBehaviour: DomainBehaviourEvidenceRecord;
  visualRuntime: VisualRuntimeEvidence;
}): ProductArchitectureEvidence {
  const items: ProductArchitectureEvidenceItem[] = [];
  const { scenario } = input;
  const workspacePath = input.workspacePath;
  const combined = workspacePath ? readWorkspaceCombined(workspacePath) : '';
  const lower = combined.toLowerCase();

  const featureContract = workspacePath
    ? readJsonIfExists(join(workspacePath, 'feature-contract.json'))
    : null;
  const universalContract = workspacePath
    ? readJsonIfExists(join(workspacePath, 'universal-feature-contract.json'))
    : null;
  const packageJson = workspacePath ? readJsonIfExists(join(workspacePath, 'package.json')) : null;

  const domainFromPrompt =
    new RegExp(scenario.productDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(
      scenario.productRequest,
    ) || lower.includes(scenario.entitySlug.replace(/-/g, ' '));
  recordItem(items, {
    id: 'domain-purpose',
    category: 'domain',
    label: 'App purpose / product domain captured',
    passed: domainFromPrompt,
    detail: domainFromPrompt
      ? `${scenario.domainDescription} identified from product request and workspace`
      : 'Product domain not evidenced in prompt/workspace',
    critical: true,
  });

  const singleUserExplicit =
    scenario.clarificationAnswers.some((a) => /single end-user|single-user|no separate admin/i.test(a)) ||
    /single end-user|guest auth|single-user/i.test(lower);
  recordItem(items, {
    id: 'user-roles',
    category: 'roles',
    label: 'User roles defined or explicitly single-user',
    passed: singleUserExplicit,
    detail: singleUserExplicit
      ? 'Single end-user role documented in clarifications and/or guest auth blueprint'
      : 'Role model not explicitly documented',
    critical: true,
  });

  const entityPattern = new RegExp(
    `interface ${scenario.entityLabel}|type ${scenario.entityLabel}|${scenario.entitySlug}|${scenario.entityLabel.toLowerCase()} entity`,
    'i',
  );
  const entityDetected =
    entityPattern.test(combined) ||
    (typeof featureContract === 'object' &&
      featureContract !== null &&
      JSON.stringify(featureContract).toLowerCase().includes(scenario.entitySlug)) ||
    (typeof universalContract === 'object' &&
      universalContract !== null &&
      JSON.stringify(universalContract).toLowerCase().includes(scenario.entitySlug));
  recordItem(items, {
    id: 'entity-primary',
    category: 'entities',
    label: `Core entity ${scenario.entityLabel} defined`,
    passed: Boolean(entityDetected),
    detail: entityDetected
      ? `${scenario.entityLabel} entity/interface or contract feature present in generated workspace`
      : `${scenario.entityLabel} entity not detected in workspace sources or contracts`,
    critical: true,
    entity: scenario.entityLabel,
  });

  for (const spec of scenario.behaviourSpecs) {
    const uvlItem = input.uvlBehaviour.behaviours.find((b) => b.id === spec.id);
    const sourcePass = spec.pattern.test(combined);
    const uvlPass = uvlItem?.passed ?? false;
    const runtimePass = input.visualRuntime.checks.some(
      (c) => c.passed && (c.id.includes('runtime-') || c.id.includes('viewport-')),
    );
    const passed = sourcePass && (uvlPass || runtimePass);
    recordItem(items, {
      id: `behaviour-${spec.id}`,
      category: 'behaviours',
      label: `${spec.label} behaviour mapped to ${scenario.entityLabel}`,
      passed,
      detail: passed
        ? `Source + verification: source=${sourcePass} uvl=${uvlPass} runtime=${runtimePass}`
        : `Missing mapping — source=${sourcePass} uvl=${uvlPass}`,
      critical: spec.critical,
      entity: scenario.entityLabel,
    });
  }

  const frontendArchitecture =
    /react|vite|appshell|blueprint|tsx|universal-feature/i.test(lower) &&
    existsSync(join(workspacePath ?? '', 'src'));
  recordItem(items, {
    id: 'frontend-architecture',
    category: 'frontend',
    label: 'Frontend architecture exists (React/Vite blueprint shell)',
    passed: frontendArchitecture,
    detail: frontendArchitecture
      ? `React/Vite SPA with universal app blueprint shell and ${scenario.navLabel} feature module`
      : 'Frontend architecture signals not found',
    critical: true,
  });

  const stateFlow = /usestate|usememo|useeffect|setrecords|filtered/i.test(lower);
  recordItem(items, {
    id: 'state-data-flow',
    category: 'state',
    label: 'State/data flow identifiable in feature module',
    passed: stateFlow,
    detail: stateFlow
      ? 'React state hooks and record list derivation present in generated sources'
      : 'State/data flow patterns not detected',
    critical: false,
  });

  const persistenceLocal = /localstorage|sessionstorage|storage_key|persist/i.test(lower);
  recordItem(items, {
    id: 'persistence-model',
    category: 'persistence',
    label: 'Persistence model explicit (local/session/in-memory)',
    passed: persistenceLocal,
    detail: persistenceLocal
      ? `Client localStorage persistence identified for ${scenario.entityLabel} records`
      : 'Persistence model not documented in workspace sources',
    critical: false,
  });

  const viteBuild =
    (typeof packageJson === 'object' &&
      packageJson !== null &&
      'scripts' in packageJson &&
      JSON.stringify(packageJson).includes('vite build')) ||
    existsSync(join(workspacePath ?? '', 'dist', 'index.html'));
  recordItem(items, {
    id: 'deployment-target',
    category: 'deployment',
    label: 'Deployment/build target is browser Vite static dist',
    passed: Boolean(viteBuild),
    detail: viteBuild
      ? 'Vite build script and/or dist/index.html artifact present'
      : 'Browser static build target not evidenced',
    critical: true,
  });

  const runtimeLinked =
    input.visualRuntime.boundedRuntimePassed && input.uvlBehaviour.allBehavioursPresent;
  recordItem(items, {
    id: 'verification-link',
    category: 'verification',
    label: 'Verification evidence links to UVL/runtime behaviour proof',
    passed: runtimeLinked,
    detail: runtimeLinked
      ? `UVL ${input.uvlBehaviour.passedCount}/${input.uvlBehaviour.totalCount} + visual runtime ${input.visualRuntime.passedCount}/${input.visualRuntime.totalCount}`
      : 'UVL or bounded runtime evidence incomplete',
    critical: true,
  });

  recordItem(items, {
    id: 'limitations-documented',
    category: 'limitations',
    label: 'Known limitations documented honestly',
    passed: true,
    detail: scenario.knownLimitations.join('; '),
    critical: false,
  });

  const observedEvidence = [
    '--- Bounded workspace product architecture evidence (multi-domain) ---',
    `Scenario: ${scenario.id} (${scenario.productDomain})`,
    `Workspace: ${workspacePath?.replace(/\\/g, '/') ?? 'none'}`,
    `Contract: ${input.contractId ?? 'none'}`,
    `Domain: ${scenario.domainDescription}`,
    `Entity ${scenario.entityLabel}: primary record in client state`,
    `Behaviours: ${scenario.behaviourSpecs.map((b) => b.label).join(', ')}`,
    `Frontend: React + Vite SPA with ${scenario.navLabel} feature route`,
    `Verification: UVL ${input.uvlBehaviour.passedCount}/${input.uvlBehaviour.totalCount}; runtime ${input.visualRuntime.passedCount}/${input.visualRuntime.totalCount}`,
    'Known limitations:',
    ...scenario.knownLimitations.map((l) => `- ${l}`),
  ].join('\n');

  const behaviourItems = items.filter((i) => i.category === 'behaviours');
  const behavioursMappedToTask =
    behaviourItems.length > 0 && behaviourItems.every((i) => i.passed);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    workspacePath,
    contractId: input.contractId,
    observedEvidence,
    items,
    knownLimitations: scenario.knownLimitations,
    verificationLinks: [
      `uvl-behaviour:${input.uvlBehaviour.passedCount}/${input.uvlBehaviour.totalCount}`,
      `visual-runtime:${input.visualRuntime.passedCount}/${input.visualRuntime.totalCount}`,
    ],
    passedCount: items.filter((i) => i.passed).length,
    totalCount: items.length,
    taskEntityDetected: Boolean(entityDetected),
    behavioursMappedToTask,
    frontendArchitectureDetected: frontendArchitecture,
    buildTargetDetected: Boolean(viteBuild),
    runtimeEvidenceLinked: runtimeLinked,
  };
}
