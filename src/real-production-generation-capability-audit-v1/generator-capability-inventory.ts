/**
 * Real Production Generation Capability Audit V1 — generator capability inventory (read-only code analysis).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratorCapabilityInventoryRow } from './real-production-generation-capability-types.js';

function readRepoFile(repoRoot: string, rel: string): string {
  try {
    return readFileSync(join(repoRoot, rel), 'utf8');
  } catch {
    return '';
  }
}

/** Static inventory of what production generators can and cannot build today. */
export function buildGeneratorCapabilityInventory(repoRoot: string): GeneratorCapabilityInventoryRow[] {
  const modularGen = readRepoFile(repoRoot, 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts');
  const materialization = readRepoFile(repoRoot, 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts');
  const blueprint = readRepoFile(repoRoot, 'src/universal-app-blueprint/universal-app-blueprint-generator.ts');
  const moduleResolver = readRepoFile(repoRoot, 'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts');
  const calculator = readRepoFile(repoRoot, 'src/simple-utility-app/calculator-feature-generator.ts');

  const genericCrudShell = modularGen.includes('Manage ${displayName}') && modularGen.includes('data-interaction-control');
  const emptyServiceLayer = modularGen.includes('return []') || modularGen.includes('always returns `[]`');
  const persistenceOmitted = modularGen.includes("INFRASTRUCTURE_MODULES = new Set(['persistence'])");

  return [
    {
      capability: 'Modular CRUD feature shell (list + empty state + Manage button)',
      generator: 'modular-feature-module-generator.ts#buildFeatureComponentTsx',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Generates visible UI without persistence, handlers, or record mutation',
      repairAvailable: 'build-reality-autofix-engine-v1 (compile only); engineering-intelligence-runtime (EIAA-gated)',
      notes: genericCrudShell
        ? 'Default template emits data-interaction-control button without onClick handler.'
        : 'Template pattern not found — re-verify.',
    },
    {
      capability: 'Calculator / simple utility dedicated UI',
      generator: 'calculator-feature-generator.ts',
      productionWired: 'YES',
      coverage: calculator.includes('onClick') || calculator.includes('useState') ? 'PARTIAL_SUPPORT' : 'FALLBACK_SUPPORT',
      failureMode: 'Limited to detected simple-utility kinds; other utilities get generic CRUD shell',
      repairAvailable: 'None automatic — requires new dedicated generator or EI',
      notes: 'Triggered only when detectSimpleUtilityAppKind matches.',
    },
    {
      capability: 'Multi-module tab navigation (in-app)',
      generator: 'modular-feature-module-generator.ts#buildFeatureAppRouterTsx',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'State-based module switching — not URL router; auth module excluded from nav',
      repairAvailable: 'None — structural by design',
      notes: 'Blueprint AppShell renders FeatureAppRouter at route core.',
    },
    {
      capability: 'Blueprint shell navigation (Home/Settings/Profile/etc.)',
      generator: 'universal-app-blueprint-generator.ts + product-surface.ts',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Default shell labels omitted unless CBGA-approved; many pages are placeholder copy',
      repairAvailable: 'CBGA navigation plan repair only — not behavioral pages',
      notes: blueprint.includes('placeholder') ? 'Blueprint contains explicit placeholder pages.' : 'Placeholder markers vary.',
    },
    {
      capability: 'Workflow / state-machine generation',
      generator: '(none dedicated)',
      productionWired: 'NO',
      coverage: 'NO_SUPPORT',
      failureMode: 'Workflows from contract appear as module labels only — no step engine',
      repairAvailable: 'engineering-intelligence-runtime (EIAA-gated, not auto-run)',
      notes: 'Contract primaryWorkflows are planning inputs, not generated state machines.',
    },
    {
      capability: 'Persistence / local storage wiring',
      generator: 'modular-feature-module-generator.ts (service layer)',
      productionWired: 'PARTIAL',
      coverage: 'NO_SUPPORT',
      failureMode: persistenceOmitted
        ? 'persistence module never materialized; services return empty arrays by policy'
        : 'Persistence module handling changed — re-verify',
      repairAvailable: 'None production-wired for data persistence',
      notes: emptyServiceLayer ? 'Service list*Records() intentionally returns [].' : 'Service layer pattern changed.',
    },
    {
      capability: 'Form submission + validation wiring',
      generator: 'modular-feature-module-generator.ts (validation.ts stub)',
      productionWired: 'YES',
      coverage: 'FALLBACK_SUPPORT',
      failureMode: 'validation.ts exists but forms without submit handlers in default CRUD shell',
      repairAvailable: 'build-reality-autofix-engine-v1 (syntax/compile only)',
      notes: 'Static inspection marks interactive if data-interaction-control present — not functional submit.',
    },
    {
      capability: 'Scheduling / calendar logic',
      generator: '(none dedicated)',
      productionWired: 'NO',
      coverage: 'NO_SUPPORT',
      failureMode: 'Booking/scheduling prompts map to generic modules without calendar behavior',
      repairAvailable: 'EIAA-gated Engineering Intelligence only',
      notes: 'Profile map may include booking modules as CRUD shells.',
    },
    {
      capability: 'Aggregation / reporting / dashboard computation',
      generator: 'informational module branch (dashboard/reports/analytics)',
      productionWired: 'YES',
      coverage: 'REPORT_ONLY_SUPPORT',
      failureMode: 'Informational modules omit Manage button — static dashboard cards only',
      repairAvailable: 'None',
      notes: 'isInformationalFeatureModule excludes interaction controls.',
    },
    {
      capability: 'Authentication / role / permission handling',
      generator: 'profile-feature-map + modular router (auth excluded from nav)',
      productionWired: 'PARTIAL',
      coverage: 'FALLBACK_SUPPORT',
      failureMode: 'auth may exist as module folder but not reachable via feature router nav',
      repairAvailable: 'CBGA module plan repair',
      notes: 'Blueprint social auth buttons are disabled placeholders.',
    },
    {
      capability: 'Prompt-bounded module approval (drop unauthorized modules)',
      generator: 'prompt-bounded-module-resolver.ts',
      productionWired: 'YES',
      coverage: 'FULL_SUPPORT',
      failureMode: 'Silent continue on blocked candidates — accumulates in blockedModules',
      repairAvailable: 'contract-bound-generation-authority-v4',
      notes: moduleResolver.includes('continue') ? 'Blocked modules skipped without failing entire build.' : 'Skip pattern changed.',
    },
    {
      capability: 'Sample / demo business records',
      generator: 'approved-sample-data-plan + demo-data.ts',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Default ApprovedSampleDataPlan has approvedSamplesPresent:false — empty states only',
      repairAvailable: 'CBGA sample data plan composition only',
      notes: materialization.includes('approvedSampleDataPlan') ? 'Envelope sample policy respected.' : 'Sample plan wiring missing.',
    },
    {
      capability: 'Interaction proof (runtime behavioral)',
      generator: 'live-preview-interaction-proof-v1 (Playwright, post-build handler)',
      productionWired: 'PARTIAL',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Generic first-button click — not workflow-specific; requires running dev server',
      repairAvailable: 'preview recovery (runtime restart only)',
      notes: 'Not invoked by this audit script — classified separately.',
    },
    {
      capability: 'Interaction proof (pipeline structural)',
      generator: 'interaction-proof-engine (ASE artifact)',
      productionWired: 'YES',
      coverage: 'SIMULATED_SUPPORT',
      failureMode: 'Simulated handler proof from pipeline artifacts — not live browser',
      repairAvailable: 'autonomous-debugging-engine (SIMULATED)',
      notes: 'Used by Live Preview Gate — can unlock preview without behavioral proof.',
    },
    {
      capability: 'Feature contract reality scoring',
      generator: 'feature-contract-reality/*',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Static source markers (data-interaction-control) treated as interactive — not runtime mutation',
      repairAvailable: 'None — audit only',
      notes: 'Does not execute handlers or verify persistence.',
    },
    {
      capability: 'Build compile repair',
      generator: 'build-reality-autofix-engine-v1',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'Deterministic TS/JS patches — does not invent missing business logic',
      repairAvailable: 'AEO auto-run when wired',
      notes: 'Wired in npm build autofix loop.',
    },
    {
      capability: 'Missing capability code generation',
      generator: 'engineering-intelligence-runtime',
      productionWired: 'YES',
      coverage: 'PARTIAL_SUPPORT',
      failureMode: 'EIAA-gated; never auto-run; mayChangeProductIdentity on some paths',
      repairAvailable: 'AEO routes after safe repairs exhausted',
      notes: 'Not proven in offline materialization-only audit.',
    },
    {
      capability: 'GPCA / constitutional compliance audit',
      generator: 'generation-pipeline-compliance-authority-v1',
      productionWired: 'YES',
      coverage: 'REPORT_ONLY_SUPPORT',
      failureMode: 'Blocks non-compliant output — does not generate missing features',
      repairAvailable: 'None (audit gate only)',
      notes: 'safeToRunAutomatically:false in AEO registry.',
    },
  ];
}
