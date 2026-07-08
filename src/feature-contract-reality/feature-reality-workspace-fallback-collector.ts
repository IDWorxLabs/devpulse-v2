/**
 * Feature Contract Reality V1 — workspace-derived Feature Reality fallback.
 * When live runtime evidence is unavailable but generated source exists, derive
 * Feature Reality from static workspace inspection instead of aborting.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { listWorkspaceFeatureModuleIds } from '../prompt-faithful-generation/prompt-faithful-materialization-gate.js';
import { LISA_REQUIRED_MODULES } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { FeatureRealityCheck } from '../feature-reality-validation/feature-reality-validation-types.js';
import { registerWorkspaceDerivedFeatureRealityAssessment } from '../feature-reality-validation/feature-reality-validation-authority.js';
import { moduleIdToPascalCase } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { checkFeatureFileReality } from './feature-file-reality-checker.js';
import { checkFeatureRegistryReality } from './feature-route-reality-checker.js';
import { checkFeatureRenderReality } from './feature-render-reality-checker.js';
import { checkFeatureValidationReality } from './feature-validation-reality-checker.js';
import {
  checkFeatureInteractionReality,
  readFileUtf8,
} from './feature-interaction-reality-checker.js';

export type WorkspaceFeatureRealityEvidenceStatus =
  | 'PASS'
  | 'DEGRADED_WITH_WORKSPACE_EVIDENCE'
  | 'FAIL'
  | 'UNAVAILABLE';

export interface WorkspaceFeatureRealityFallbackResult {
  readOnly: true;
  status: WorkspaceFeatureRealityEvidenceStatus;
  available: boolean;
  passed: boolean;
  score: number;
  requiredModuleIds: string[];
  presentModuleIds: string[];
  missingModuleIds: string[];
  checks: FeatureRealityCheck[];
  blockers: string[];
  warnings: string[];
  findings: string[];
  interactionSignalsFound: string[];
  interactionSignalsMissing: string[];
  registryPresent: boolean;
  routesPresent: boolean;
  appRendersFeatures: boolean;
  manifestPresent: boolean;
}

export const LISA_WORKSPACE_INTERACTION_SIGNALS: ReadonlyArray<{
  id: string;
  label: string;
  patterns: RegExp[];
}> = [
  {
    id: 'blink-simulation',
    label: 'Blink simulation control',
    patterns: [/blink/i, /simulate.*blink/i, /blink-input-engine/i],
  },
  {
    id: 'gaze-selection',
    label: 'Gaze selection simulation',
    patterns: [/gaze/i, /dwell/i, /eye-tracking/i, /gaze-keyboard/i],
  },
  {
    id: 'phrase-selection',
    label: 'Phrase selection',
    patterns: [/quick-phrase/i, /phrase/i, /data-interaction-control/i],
  },
  {
    id: 'message-composition',
    label: 'Message composition',
    patterns: [/message/i, /composer/i, /typed message/i, /gaze-keyboard/i],
  },
  {
    id: 'speak-button',
    label: 'Speak button',
    patterns: [/speak/i, /text-to-speech/i, /speech synthesis/i],
  },
  {
    id: 'emergency-speech',
    label: 'Emergency speech',
    patterns: [/emergency/i, /emergency-speech/i, /need help/i],
  },
  {
    id: 'calibration-controls',
    label: 'Calibration controls',
    patterns: [/calibrat/i, /onboarding-calibration/i],
  },
  {
    id: 'settings-controls',
    label: 'Settings controls',
    patterns: [/accessibility-settings/i, /settings/i, /contrast/i, /dwell time/i],
  },
  {
    id: 'history-filtering',
    label: 'History filtering',
    patterns: [/communication-history/i, /filter/i, /search/i, /history/i],
  },
];

let lastWorkspaceFallback: WorkspaceFeatureRealityFallbackResult | null = null;

export function getLastWorkspaceFeatureRealityFallback(): WorkspaceFeatureRealityFallbackResult | null {
  return lastWorkspaceFallback;
}

export function resetWorkspaceFeatureRealityFallbackForTests(): void {
  lastWorkspaceFallback = null;
}

export function listProvenWorkspaceModuleIds(workspaceDir: string): string[] {
  const discovered = listWorkspaceFeatureModuleIds(workspaceDir);
  return discovered.filter((moduleId) => {
    const files = checkFeatureFileReality({ workspaceDir, featureId: moduleId });
    const registry = checkFeatureRegistryReality({
      workspaceDir,
      featureId: moduleId,
      contractId: `feature-${moduleId}`,
      route: `/${moduleId}`,
    });
    return files.filesPresent && registry.registryEntryPresent && registry.routePresent;
  });
}

export function workspaceHasGeneratedFeatureModules(workspaceDir: string): boolean {
  if (!workspaceDir || !existsSync(workspaceDir)) return false;
  const featuresDir = join(workspaceDir, 'src/features');
  if (!existsSync(featuresDir)) return false;
  return listWorkspaceFeatureModuleIds(workspaceDir).length > 0;
}

function readWorkspaceSourceCorpus(workspaceDir: string): string {
  const parts: string[] = [];
  const featuresDir = join(workspaceDir, 'src/features');
  if (!existsSync(featuresDir)) return '';
  for (const entry of readdirSync(featuresDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(featuresDir, entry.name);
    for (const file of readdirSync(dir)) {
      if (!/\.(tsx?|css)$/.test(file)) continue;
      try {
        parts.push(readFileSync(join(dir, file), 'utf8'));
      } catch {
        // skip unreadable files
      }
    }
  }
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (existsSync(appPath)) {
    try {
      parts.push(readFileSync(appPath, 'utf8'));
    } catch {
      // skip
    }
  }
  return parts.join('\n');
}

function checkWorkspaceShell(workspaceDir: string): {
  registryPresent: boolean;
  routesPresent: boolean;
  appRendersFeatures: boolean;
  manifestPresent: boolean;
} {
  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  const routesPath = join(workspaceDir, 'src/features/routes.ts');
  const routerPath = join(workspaceDir, 'src/features/FeatureAppRouter.tsx');
  const appPath = join(workspaceDir, 'src/App.tsx');
  const manifestPath = join(workspaceDir, '.generated-app-manifest.json');

  const registryPresent = existsSync(registryPath);
  const routesPresent = existsSync(routesPath);
  const routerPresent = existsSync(routerPath);
  const manifestPresent = existsSync(manifestPath);

  let appRendersFeatures = false;
  if (existsSync(appPath)) {
    const appSource = readFileSync(appPath, 'utf8');
    appRendersFeatures =
      appSource.includes('AppShell') ||
      appSource.includes('FeatureAppRouter') ||
      appSource.includes('FEATURE_REGISTRY') ||
      /data-feature-module/.test(appSource);
  }

  return {
    registryPresent: registryPresent && routerPresent,
    routesPresent: routesPresent || (registryPresent && routerPresent),
    appRendersFeatures: appRendersFeatures || routerPresent,
    manifestPresent,
  };
}

function scanInteractionSignals(corpus: string, isLisaContext: boolean): {
  found: string[];
  missing: string[];
} {
  const signals = isLisaContext ? LISA_WORKSPACE_INTERACTION_SIGNALS : LISA_WORKSPACE_INTERACTION_SIGNALS;
  const found: string[] = [];
  const missing: string[] = [];
  for (const signal of signals) {
    if (signal.patterns.some((pattern) => pattern.test(corpus))) {
      found.push(signal.label);
    } else {
      missing.push(signal.label);
    }
  }
  return { found, missing };
}

function buildModuleChecks(
  workspaceDir: string,
  moduleId: string,
): FeatureRealityCheck[] {
  const contractId = `feature-${moduleId}`;
  const route = `/${moduleId}`;
  const files = checkFeatureFileReality({ workspaceDir, featureId: moduleId });
  const registry = checkFeatureRegistryReality({
    workspaceDir,
    featureId: moduleId,
    contractId,
    route,
  });
  const render = checkFeatureRenderReality({ workspaceDir, featureId: moduleId });
  const validation = checkFeatureValidationReality({
    workspaceDir,
    featureId: moduleId,
    contractId,
  });
  const renderPath =
    render.componentPath ||
    join(workspaceDir, `src/features/${moduleId}/${moduleIdToPascalCase(moduleId)}Feature.tsx`);
  const validationPath =
    validation.validationPath ||
    join(workspaceDir, `src/features/${moduleId}/${moduleId}.validation.ts`);
  const interaction = checkFeatureInteractionReality({
    featureId: moduleId,
    componentSource: readFileUtf8(renderPath),
    validationSource: readFileUtf8(validationPath),
  });

  return [
    {
      id: `workspace-module-folder-${moduleId}`,
      category: 'discoverability',
      label: `Module folder exists: ${moduleId}`,
      featureId: moduleId,
      passed: existsSync(join(workspaceDir, 'src/features', moduleId)),
      detail: `src/features/${moduleId}`,
      critical: true,
    },
    {
      id: `workspace-module-files-${moduleId}`,
      category: 'execution',
      label: `Module source files: ${moduleId}`,
      featureId: moduleId,
      passed: files.filesPresent,
      detail: files.filesPresent
        ? 'component, types, service, validation, index present'
        : `missing: ${files.missingEvidence.join(', ')}`,
      critical: true,
    },
    {
      id: `workspace-module-registry-${moduleId}`,
      category: 'discoverability',
      label: `Feature registry entry: ${moduleId}`,
      featureId: moduleId,
      passed: registry.registryEntryPresent,
      detail: registry.registryEntryPresent ? 'registry.ts includes module' : 'registry entry missing',
      critical: true,
    },
    {
      id: `workspace-module-route-${moduleId}`,
      category: 'discoverability',
      label: `Route registry exposes: ${moduleId}`,
      featureId: moduleId,
      passed: registry.routePresent && registry.reachable,
      detail:
        registry.routePresent && registry.reachable
          ? `route ${route} reachable`
          : registry.failureReasons.join('; ') || 'route missing',
      critical: true,
    },
    {
      id: `workspace-module-render-${moduleId}`,
      category: 'ux',
      label: `Component renders: ${moduleId}`,
      featureId: moduleId,
      passed: render.rendered,
      detail: render.rendered ? render.componentPath : 'render markers missing',
      critical: false,
    },
    {
      id: `workspace-module-validation-${moduleId}`,
      category: 'persistence',
      label: `Validation metadata: ${moduleId}`,
      featureId: moduleId,
      passed: validation.validated,
      detail: validation.validated ? 'validation metadata present' : 'validation metadata missing',
      critical: false,
    },
    {
      id: `workspace-module-interaction-${moduleId}`,
      category: 'execution',
      label: `Interaction signal: ${moduleId}`,
      featureId: moduleId,
      passed: interaction.interactive,
      detail: interaction.interactive
        ? 'data-interaction-control or interactive markers present'
        : interaction.failureReasons.join('; ') || 'interaction markers missing',
      critical: false,
    },
  ];
}

export function collectWorkspaceFeatureRealityFallback(input: {
  workspaceDir: string;
  requiredModuleIds?: string[];
  contractId?: string;
  previewUrl?: string;
  registerAssessment?: boolean;
  isLisaContext?: boolean;
}): WorkspaceFeatureRealityFallbackResult {
  const workspaceDir = input.workspaceDir;
  if (!workspaceDir || !existsSync(workspaceDir)) {
    const unavailable: WorkspaceFeatureRealityFallbackResult = {
      readOnly: true,
      status: 'UNAVAILABLE',
      available: false,
      passed: false,
      score: 0,
      requiredModuleIds: input.requiredModuleIds ?? [],
      presentModuleIds: [],
      missingModuleIds: input.requiredModuleIds ?? [],
      checks: [],
      blockers: ['Workspace directory unavailable for Feature Reality fallback'],
      warnings: [],
      findings: [],
      interactionSignalsFound: [],
      interactionSignalsMissing: [],
      registryPresent: false,
      routesPresent: false,
      appRendersFeatures: false,
      manifestPresent: false,
    };
    lastWorkspaceFallback = unavailable;
    return unavailable;
  }

  const workspaceModules = listWorkspaceFeatureModuleIds(workspaceDir);
  const requiredModuleIds =
    input.requiredModuleIds && input.requiredModuleIds.length > 0
      ? [...new Set(input.requiredModuleIds)]
      : workspaceModules.length > 0
        ? workspaceModules
        : [];

  const isLisaContext =
    input.isLisaContext ??
    (requiredModuleIds.some((id) => LISA_REQUIRED_MODULES.includes(id)) ||
      workspaceModules.some((id) => LISA_REQUIRED_MODULES.includes(id)));

  const shell = checkWorkspaceShell(workspaceDir);
  const corpus = readWorkspaceSourceCorpus(workspaceDir);
  const interactionScan = scanInteractionSignals(corpus, isLisaContext);

  const checks: FeatureRealityCheck[] = [
    {
      id: 'workspace-feature-registry',
      category: 'discoverability',
      label: 'Feature registry present',
      featureId: null,
      passed: shell.registryPresent,
      detail: shell.registryPresent ? 'registry.ts and FeatureAppRouter present' : 'feature registry missing',
      critical: true,
    },
    {
      id: 'workspace-route-registry',
      category: 'discoverability',
      label: 'Route registry present',
      featureId: null,
      passed: shell.routesPresent,
      detail: shell.routesPresent ? 'routes.ts or router registry wiring present' : 'route registry missing',
      critical: true,
    },
    {
      id: 'workspace-app-renders-features',
      category: 'ux',
      label: 'App.tsx renders generated features',
      featureId: null,
      passed: shell.appRendersFeatures,
      detail: shell.appRendersFeatures
        ? 'App shell or FeatureAppRouter wiring detected'
        : 'App.tsx does not reference generated feature modules',
      critical: true,
    },
    {
      id: 'workspace-manifest',
      category: 'persistence',
      label: 'Generated app manifest present',
      featureId: null,
      passed: shell.manifestPresent,
      detail: shell.manifestPresent
        ? '.generated-app-manifest.json present'
        : 'manifest not yet written — workspace files may still prove modules',
      critical: false,
    },
  ];

  for (const moduleId of requiredModuleIds) {
    checks.push(...buildModuleChecks(workspaceDir, moduleId));
  }

  for (const signal of LISA_WORKSPACE_INTERACTION_SIGNALS) {
    const passed = signal.patterns.some((pattern) => pattern.test(corpus));
    checks.push({
      id: `workspace-interaction-${signal.id}`,
      category: 'execution',
      label: signal.label,
      featureId: null,
      passed,
      detail: passed
        ? `workspace source contains ${signal.label} signal`
        : `${signal.label} signal not found in workspace source`,
      critical: false,
    });
  }

  const presentModuleIds = requiredModuleIds.filter((moduleId) =>
    checks
      .filter((check) => check.featureId === moduleId && check.critical)
      .every((check) => check.passed),
  );
  const missingModuleIds = requiredModuleIds.filter((id) => !presentModuleIds.includes(id));

  const criticalFailures = checks.filter((check) => check.critical && !check.passed);
  const passedCritical = criticalFailures.length === 0;
  const hasWorkspaceFiles = workspaceHasGeneratedFeatureModules(workspaceDir);

  let status: WorkspaceFeatureRealityEvidenceStatus;
  if (!hasWorkspaceFiles && requiredModuleIds.length === 0) {
    status = 'UNAVAILABLE';
  } else if (missingModuleIds.length > 0 || !shell.registryPresent || !shell.appRendersFeatures) {
    status = 'FAIL';
  } else if (passedCritical) {
    status = 'DEGRADED_WITH_WORKSPACE_EVIDENCE';
  } else {
    status = 'FAIL';
  }

  const passedChecks = checks.filter((check) => check.passed).length;
  const score =
    checks.length === 0 ? 0 : Math.round((passedChecks / checks.length) * 100);

  const blockers =
    status === 'FAIL'
      ? [
          ...missingModuleIds.map((id) => `Required module missing or incomplete: ${id}`),
          ...criticalFailures
            .filter((check) => !check.featureId || missingModuleIds.includes(check.featureId!))
            .map((check) => check.detail),
        ].slice(0, 8)
      : [];

  const warnings =
    status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE'
      ? [
          'Feature Reality derived from workspace source — live runtime evidence deferred',
          ...(interactionScan.missing.length
            ? [`Interaction signals not yet proven in source: ${interactionScan.missing.slice(0, 4).join(', ')}`]
            : []),
          ...(!shell.manifestPresent ? ['Generated manifest not yet finalized'] : []),
        ]
      : [];

  const findings = [
    `Workspace modules discovered: ${workspaceModules.length}`,
    `Required modules proven: ${presentModuleIds.length}/${requiredModuleIds.length}`,
    `Interaction signals: ${interactionScan.found.length}/${LISA_WORKSPACE_INTERACTION_SIGNALS.length}`,
    `Evidence mode: ${status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' ? 'workspace-derived' : status}`,
  ];

  const result: WorkspaceFeatureRealityFallbackResult = {
    readOnly: true,
    status,
    available: status !== 'UNAVAILABLE',
    passed: status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' || status === 'PASS',
    score,
    requiredModuleIds,
    presentModuleIds,
    missingModuleIds,
    checks,
    blockers,
    warnings,
    findings,
    interactionSignalsFound: interactionScan.found,
    interactionSignalsMissing: interactionScan.missing,
    registryPresent: shell.registryPresent,
    routesPresent: shell.routesPresent,
    appRendersFeatures: shell.appRendersFeatures,
    manifestPresent: shell.manifestPresent,
  };

  if (input.registerAssessment !== false && result.available && result.checks.length > 0) {
    registerWorkspaceDerivedFeatureRealityAssessment({
      previewUrl: input.previewUrl ?? 'workspace://source-derived',
      contractId: input.contractId ?? 'workspace-feature-reality-fallback',
      checks: result.checks,
      evidenceStatus: result.status,
    });
  }

  lastWorkspaceFallback = result;
  return result;
}

export function hasSufficientWorkspaceFeatureEvidence(workspaceDir: string, requiredModuleIds: string[]): boolean {
  const fallback = collectWorkspaceFeatureRealityFallback({
    workspaceDir,
    requiredModuleIds,
    registerAssessment: false,
  });
  return fallback.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' || fallback.status === 'PASS';
}

export function buildEvidenceDimensionReport(input: {
  promptFaithfulnessScore?: number | null;
  promptFaithfulnessPassed?: boolean;
  workspaceMaterializationScore?: number | null;
  workspaceMaterializationPassed?: boolean;
  featureRealityStatus?: WorkspaceFeatureRealityEvidenceStatus | string | null;
  featureRealityScore?: number | null;
  livePreviewRealityPassed?: boolean | null;
  productionProofPassed?: boolean | null;
}): string {
  const lines = [
    '## Evidence dimensions',
    '',
    `**Prompt faithfulness:** ${
      input.promptFaithfulnessPassed
        ? `PASS (${input.promptFaithfulnessScore ?? 100}%)`
        : `FAIL (${input.promptFaithfulnessScore ?? 0}%)`
    }`,
    `**Workspace materialization:** ${
      input.workspaceMaterializationPassed
        ? `PASS (${input.workspaceMaterializationScore ?? 100}%)`
        : `INCOMPLETE (${input.workspaceMaterializationScore ?? 0}%)`
    }`,
    `**Feature reality:** ${
      input.featureRealityStatus === 'DEGRADED_WITH_WORKSPACE_EVIDENCE'
        ? `DEGRADED_WITH_WORKSPACE_EVIDENCE (${input.featureRealityScore ?? 0}% from workspace source)`
        : input.featureRealityStatus ?? 'UNAVAILABLE'
    }`,
    `**Live preview reality:** ${
      input.livePreviewRealityPassed === true
        ? 'PASS'
        : input.livePreviewRealityPassed === false
          ? 'FAIL or LOCKED'
          : 'PENDING'
    }`,
    `**Production proof:** ${
      input.productionProofPassed === true
        ? 'PASS'
        : input.productionProofPassed === false
          ? 'FAIL or NOT RUN'
          : 'PENDING'
    }`,
  ];
  return lines.join('\n');
}
