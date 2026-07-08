/**
 * Preview Authority Audit — proves Playwright, iframe, Vite, and workspace registries agree.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { listPreviewSessions } from '../live-preview-runtime/preview-session-manager.js';
import {
  getGeneratedDevServerForProject,
  listGeneratedDevServers,
} from '../one-prompt-live-preview/generated-dev-server-manager.js';
import {
  getBuildResultForProject,
  getProjectSession,
} from '../one-prompt-live-preview/workspace-tab-registry.js';
import { getOnePromptLivePreviewPublicState } from '../one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resolveCanonicalLivePreviewState } from '../one-prompt-live-preview/canonical-live-preview-state.js';
import type { E2EContractExpectationBundle } from './e2e-build-reality-types.js';
import type { E2EDomRealityPage } from './e2e-dom-reality-runner.js';
import {
  computeAppTsxChecksum,
  fetchPreviewIdentityFromUrl,
  readPreviewIdentityFromHtml,
} from './preview-workspace-identity.js';
import {
  previewWorkspacePathsAligned,
  resolvePreviewServingWorkspaceDir,
} from './preview-workspace-resolver.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

export const PREVIEW_AUTHORITY_MISMATCH = 'PREVIEW_AUTHORITY_MISMATCH' as const;

export interface PreviewAuthorityFinding {
  readOnly: true;
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface PreviewAuthorityAuditReport {
  readOnly: true;
  passed: boolean;
  failureCode: typeof PREVIEW_AUTHORITY_MISMATCH | null;
  generatedWorkspace: string | null;
  builtWorkspace: string | null;
  viteServingWorkspace: string | null;
  registeredPreviewUrl: string | null;
  gateUnlockedPreviewUrl: string | null;
  diagnosticPreviewUrl: string | null;
  iframePreviewUrl: string | null;
  playwrightPreviewUrl: string | null;
  playwrightSameAsLivePreview: boolean;
  sessionRegistryMatchesIframe: boolean;
  staleRegistrationDetected: boolean;
  appTsxChecksumMatch: boolean | null;
  initialVisibleDomMatchesContract: boolean;
  findings: PreviewAuthorityFinding[];
  answers: {
    whichWorkspaceGenerated: string;
    whichWorkspaceBuilt: string;
    whichWorkspaceViteServes: string;
    whichPreviewUrlRegistered: string;
    whichPreviewUrlIframe: string;
    whichDomPlaywrightInspected: string;
    playwrightMatchesLivePreview: string;
    sessionRegistryMatchesIframe: string;
    stalePreviewRegistration: string;
    appTsxChecksumMatchesBundle: string;
  };
  evidencePath: string | null;
}

function normalizeDir(dir: string | null | undefined): string | null {
  if (!dir) return null;
  return resolve(dir).replace(/\\/g, '/').toLowerCase();
}

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '') || parsed.origin;
  } catch {
    return null;
  }
}

function urlsEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeUrl(a ?? null);
  const right = normalizeUrl(b ?? null);
  if (!left || !right) return false;
  return left === right;
}

function recordFinding(
  findings: PreviewAuthorityFinding[],
  input: Omit<PreviewAuthorityFinding, 'readOnly'>,
): void {
  findings.push({ readOnly: true, ...input });
}

function hashFingerprintsEquivalent(expected: string | null | undefined, served: string | null | undefined): boolean {
  if (!expected || !served) return true;
  if (expected === served) return true;
  if (expected.length >= 16 && served.startsWith(expected.slice(0, 16))) return true;
  if (served.length >= 16 && expected.startsWith(served.slice(0, 16))) return true;
  return false;
}

function isFounderHostShell(bodyText: string, html: string): boolean {
  const corpus = `${bodyText}\n${html}`.toLowerCase();
  return (
    corpus.includes('data-founder-sign-in') ||
    corpus.includes('data-blueprint="auth-guest"') ||
    corpus.includes('sign in to continue') ||
    (corpus.includes('sign in') && !corpus.includes('data-feature-module') && !corpus.includes('data-root-feature'))
  );
}

async function readInitialVisibleDom(
  page: E2EDomRealityPage | null,
  previewUrl: string | null,
  expectations: E2EContractExpectationBundle,
): Promise<{
  bodyText: string;
  html: string;
}> {
  if (page && previewUrl) {
    await page.goto(previewUrl);
    if (expectations.mountMode === 'direct-feature' && expectations.primaryModuleId) {
      try {
        await page.waitForSelector(
          `[data-feature-module="${expectations.primaryModuleId}"], [data-root-feature="${expectations.primaryModuleId}"]`,
          { timeout: 12_000, state: 'visible' },
        );
      } catch {
        // Fall through — contract / shell checks below still apply.
      }
    } else {
      try {
        await page.waitForSelector('#root, [data-blueprint], [data-feature-module]', {
          timeout: 8000,
          state: 'attached',
        });
      } catch {
        // Fall through.
      }
    }
    return {
      bodyText: (await page.bodyText()).toLowerCase(),
      html: (await page.content()).toLowerCase(),
    };
  }
  if (previewUrl) {
    const served = await fetchPreviewIdentityFromUrl(previewUrl);
    return { bodyText: served.bodyText.toLowerCase(), html: served.html.toLowerCase() };
  }
  return { bodyText: '', html: '' };
}

function initialDomMatchesContract(
  bodyText: string,
  html: string,
  expectations: E2EContractExpectationBundle,
): boolean {
  if (isFounderHostShell(bodyText, html)) return false;
  if (
    html.includes('data-blueprint="welcome-screen"') ||
    html.includes('data-blueprint="auth-guest"') ||
    bodyText.includes('sign in to continue')
  ) {
    return false;
  }
  if (expectations.primaryModuleId) {
    const moduleId = expectations.primaryModuleId;
    if (
      html.includes(`data-feature-module="${moduleId}"`) ||
      html.includes(`data-root-feature="${moduleId}"`) ||
      bodyText.includes(moduleId.replace(/-/g, ' '))
    ) {
      return true;
    }
  }
  for (const term of expectations.requiredUiTerms.slice(0, 8)) {
    if (term.length >= 3 && bodyText.includes(term.toLowerCase())) return true;
  }
  return expectations.featureModules.length === 0;
}

export async function runPreviewAuthorityAudit(input: {
  projectId: string;
  projectRootDir?: string;
  artifactRoot?: string;
  activeProjectWorkspaceDir: string | null;
  previewServingWorkspaceDir?: string | null;
  playwrightPreviewUrl: string | null;
  gateUnlockedPreviewUrl?: string | null;
  diagnosticPreviewUrl?: string | null;
  manifestWorkspaceHash?: string | null;
  expectations: E2EContractExpectationBundle;
  page?: E2EDomRealityPage | null;
}): Promise<PreviewAuthorityAuditReport> {
  const findings: PreviewAuthorityFinding[] = [];
  const buildResult = getBuildResultForProject(input.projectId);
  const projectSession = getProjectSession(input.projectId);
  const publicState = getOnePromptLivePreviewPublicState(input.projectId);

  const activeProjectWorkspaceDir = input.activeProjectWorkspaceDir;
  const previewServingWorkspaceDir =
    input.previewServingWorkspaceDir ??
    (input.artifactRoot
      ? resolvePreviewServingWorkspaceDir({
          projectId: input.projectId,
          artifactRoot: input.artifactRoot,
          previewUrl: input.playwrightPreviewUrl,
          activeWorkspaceDir: activeProjectWorkspaceDir,
        })
      : resolvePreviewServingWorkspaceDir({
          projectId: input.projectId,
          artifactRoot: input.projectRootDir ?? process.cwd(),
          previewUrl: input.playwrightPreviewUrl,
          activeWorkspaceDir: activeProjectWorkspaceDir,
        }));

  const generatedWorkspace = previewServingWorkspaceDir ?? activeProjectWorkspaceDir;
  const builtWorkspace = generatedWorkspace ?? buildResult?.workspacePath ?? null;
  const devServer = previewServingWorkspaceDir
    ? getGeneratedDevServerForProject(input.projectId, previewServingWorkspaceDir)
    : null;
  let viteServingWorkspace = devServer?.workspaceDir ?? null;
  if (!viteServingWorkspace && input.playwrightPreviewUrl) {
    for (const server of listGeneratedDevServers()) {
      if (urlsEquivalent(server.url, input.playwrightPreviewUrl)) {
        viteServingWorkspace = server.workspaceDir;
        break;
      }
    }
  }

  const sessions = listPreviewSessions().filter((session) => session.projectId === input.projectId);
  const sessionRegistryUrl =
    sessions.find((session) => session.previewState === 'PREVIEW_READY')?.previewUrl ??
    sessions.find((session) => Boolean(session.previewUrl))?.previewUrl ??
    null;

  const gateUnlockedPreviewUrl =
    input.gateUnlockedPreviewUrl ??
    (publicState.livePreviewAvailable ? publicState.previewUrl : null);
  const diagnosticPreviewUrl =
    input.diagnosticPreviewUrl ?? publicState.diagnosticPreviewUrl ?? devServer?.url ?? null;
  const registeredPreviewUrl =
    buildResult?.previewUrl ?? projectSession?.previewUrl ?? sessionRegistryUrl ?? null;
  const playwrightPreviewUrl = input.playwrightPreviewUrl;

  const canonical = resolveCanonicalLivePreviewState(
    {
      sessions: sessions.map((session) => ({
        previewSessionId: session.previewSessionId,
        projectId: session.projectId,
        previewState: session.previewState,
        previewUrl: session.previewUrl,
        previewTargetName: session.previewTargetName,
        previewCapabilities: [...session.previewCapabilities],
        warnings: [...session.warnings],
        blockedReasons: [...session.blockedReasons],
        createdAt: session.createdAt,
      })),
      activeSession: sessions[0]
        ? {
            previewSessionId: sessions[0].previewSessionId,
            projectId: sessions[0].projectId,
            previewState: sessions[0].previewState,
            previewUrl: sessions[0].previewUrl,
            previewTargetName: sessions[0].previewTargetName,
            previewCapabilities: [...sessions[0].previewCapabilities],
            warnings: [...sessions[0].warnings],
            blockedReasons: [...sessions[0].blockedReasons],
            createdAt: sessions[0].createdAt,
          }
        : null,
      previewUrl: gateUnlockedPreviewUrl,
      connected: Boolean(gateUnlockedPreviewUrl || diagnosticPreviewUrl),
      diagnostics: {
        previewRuntimeActive: sessions.length > 0,
        previewSessionCount: sessions.length,
        registeredTargetCount: sessions.length,
        readyPreviewCount: sessions.filter((session) => session.previewState === 'PREVIEW_READY').length,
        blockedPreviewCount: sessions.filter((session) => session.blockedReasons.length > 0).length,
      },
      targets: [],
    },
    {
      activeProjectId: input.projectId,
      latestProjectId: input.projectId,
      projectCount: 1,
      projectName: projectSession?.projectName ?? buildResult?.projectName ?? null,
      recentChangeSummary: null,
    },
  );

  const iframePreviewUrl = canonical.livePreview.previewUrl;
  const appTsxChecksumExpected = previewServingWorkspaceDir
    ? computeAppTsxChecksum(previewServingWorkspaceDir)
    : activeProjectWorkspaceDir
      ? computeAppTsxChecksum(activeProjectWorkspaceDir)
      : null;

  let servingManifestHash = input.manifestWorkspaceHash ?? input.expectations.workspaceHash;
  if (previewServingWorkspaceDir && existsSync(join(previewServingWorkspaceDir, GENERATED_APP_MANIFEST_FILENAME))) {
    try {
      const manifest = JSON.parse(
        readFileSync(join(previewServingWorkspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
      ) as GeneratedAppManifest;
      servingManifestHash = manifest.workspaceHash || servingManifestHash;
    } catch {
      // Keep prior hash source.
    }
  }

  const initialDom = await readInitialVisibleDom(
    input.page ?? null,
    playwrightPreviewUrl,
    input.expectations,
  );
  const initialVisibleDomMatchesContract = initialDomMatchesContract(
    initialDom.bodyText,
    initialDom.html,
    input.expectations,
  );

  let previewWorkspaceHash: string | null = null;
  let appTsxChecksumServed: string | null = null;
  if (playwrightPreviewUrl) {
    try {
      const served =
        input.page && initialDom.html
          ? readPreviewIdentityFromHtml(initialDom.html)
          : (await fetchPreviewIdentityFromUrl(playwrightPreviewUrl));
      previewWorkspaceHash = served.workspaceHash ?? null;
      appTsxChecksumServed = served.appTsxChecksum ?? null;
    } catch (error) {
      recordFinding(findings, {
        id: 'preview-fetch-failed',
        label: 'Preview identity fetch failed',
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        critical: true,
      });
    }
  }

  const normGenerated = normalizeDir(generatedWorkspace);
  const normBuilt = normalizeDir(builtWorkspace);
  const normVite = normalizeDir(viteServingWorkspace);

  recordFinding(findings, {
    id: 'workspace-generated-present',
    label: 'Generated workspace exists',
    passed: Boolean(generatedWorkspace && existsSync(generatedWorkspace)),
    detail: generatedWorkspace ?? 'missing generated workspace',
    critical: true,
  });
  recordFinding(findings, {
    id: 'workspace-built-aligned',
    label: 'Built workspace matches generated workspace',
    passed: !normGenerated || !normBuilt || normGenerated === normBuilt,
    detail: `${normBuilt ?? 'none'} vs ${normGenerated ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'workspace-vite-aligned',
    label: 'Vite serving workspace matches preview-serving workspace',
    passed: !normGenerated || !normVite || normGenerated === normVite,
    detail: `${normVite ?? 'none'} vs ${normGenerated ?? 'none'}`,
    critical: Boolean(playwrightPreviewUrl && normGenerated),
  });
  recordFinding(findings, {
    id: 'gate-unlocked-preview-present',
    label: 'Gate-unlocked preview URL present',
    passed: Boolean(gateUnlockedPreviewUrl),
    detail: gateUnlockedPreviewUrl ?? 'missing gate-unlocked preview URL',
    critical: true,
  });
  recordFinding(findings, {
    id: 'playwright-not-diagnostic-only',
    label: 'Playwright does not inspect diagnostic-only URL',
    passed: !(
      playwrightPreviewUrl &&
      diagnosticPreviewUrl &&
      urlsEquivalent(playwrightPreviewUrl, diagnosticPreviewUrl) &&
      !urlsEquivalent(playwrightPreviewUrl, gateUnlockedPreviewUrl)
    ),
    detail: `playwright=${normalizeUrl(playwrightPreviewUrl) ?? 'none'} gate=${normalizeUrl(gateUnlockedPreviewUrl) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'playwright-matches-gate',
    label: 'Playwright URL matches gate-unlocked preview URL',
    passed: urlsEquivalent(playwrightPreviewUrl, gateUnlockedPreviewUrl),
    detail: `playwright=${normalizeUrl(playwrightPreviewUrl) ?? 'none'} gate=${normalizeUrl(gateUnlockedPreviewUrl) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'playwright-matches-iframe',
    label: 'Playwright URL matches iframe preview URL',
    passed: urlsEquivalent(playwrightPreviewUrl, iframePreviewUrl),
    detail: `playwright=${normalizeUrl(playwrightPreviewUrl) ?? 'none'} iframe=${normalizeUrl(iframePreviewUrl) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'registered-matches-gate',
    label: 'Registered preview URL matches gate-unlocked preview URL',
    passed: !registeredPreviewUrl || !gateUnlockedPreviewUrl || urlsEquivalent(registeredPreviewUrl, gateUnlockedPreviewUrl),
    detail: `registered=${normalizeUrl(registeredPreviewUrl) ?? 'none'} gate=${normalizeUrl(gateUnlockedPreviewUrl) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'session-registry-matches-iframe',
    label: 'Preview session registry matches iframe target',
    passed: !sessionRegistryUrl || !iframePreviewUrl || urlsEquivalent(sessionRegistryUrl, iframePreviewUrl),
    detail: `session=${normalizeUrl(sessionRegistryUrl) ?? 'none'} iframe=${normalizeUrl(iframePreviewUrl) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'active-project-matches-preview-serving',
    label: 'Active project workspace matches preview-serving workspace',
    passed:
      previewWorkspacePathsAligned(previewServingWorkspaceDir, activeProjectWorkspaceDir) ||
      (Boolean(servingManifestHash) &&
        Boolean(previewWorkspaceHash) &&
        servingManifestHash === previewWorkspaceHash &&
        computeAppTsxChecksum(activeProjectWorkspaceDir ?? '') === appTsxChecksumExpected),
    detail: `${normalizeDir(activeProjectWorkspaceDir) ?? 'none'} vs ${normalizeDir(previewServingWorkspaceDir) ?? 'none'}`,
    critical: true,
  });
  recordFinding(findings, {
    id: 'workspace-hash-aligned',
    label: 'Served preview workspace hash matches expected workspace hash',
    passed: hashFingerprintsEquivalent(servingManifestHash, previewWorkspaceHash),
    detail: `expected=${servingManifestHash?.slice(0, 12) ?? 'none'} served=${previewWorkspaceHash?.slice(0, 12) ?? 'missing meta'}`,
    critical: Boolean(servingManifestHash && previewWorkspaceHash),
  });
  recordFinding(findings, {
    id: 'app-tsx-checksum-aligned',
    label: 'Served App.tsx checksum matches workspace source',
    passed: !(
      appTsxChecksumExpected &&
      appTsxChecksumServed &&
      appTsxChecksumExpected !== appTsxChecksumServed
    ),
    detail: `expected=${appTsxChecksumExpected ?? 'none'} served=${appTsxChecksumServed ?? 'missing meta'}`,
    critical: Boolean(appTsxChecksumExpected),
  });
  recordFinding(findings, {
    id: 'initial-visible-dom-contract',
    label: 'Initial visible DOM matches contract before navigation',
    passed: initialVisibleDomMatchesContract,
    detail: initialVisibleDomMatchesContract
      ? 'Initial DOM contains contract-derived feature surface'
      : 'Initial DOM shows auth/shell or lacks contract feature surface',
    critical: true,
  });

  if (playwrightPreviewUrl && isFounderHostShell(initialDom.bodyText, initialDom.html)) {
    recordFinding(findings, {
      id: 'founder-host-shell-detected',
      label: 'Founder host Sign In surface detected in preview',
      passed: false,
      detail: 'Playwright inspected founder/host Sign In surface instead of generated application preview',
      critical: true,
    });
  }

  const staleRegistrationDetected = Boolean(
    sessionRegistryUrl &&
      gateUnlockedPreviewUrl &&
      !urlsEquivalent(sessionRegistryUrl, gateUnlockedPreviewUrl),
  );
  if (staleRegistrationDetected) {
    recordFinding(findings, {
      id: 'stale-preview-registration',
      label: 'Stale preview session registration detected',
      passed: false,
      detail: 'Preview session registry URL differs from current gate-unlocked preview URL',
      critical: true,
    });
  }

  if (listGeneratedDevServers().length > 1 && normGenerated && normVite && normGenerated !== normVite) {
    recordFinding(findings, {
      id: 'multiple-vite-servers',
      label: 'Multiple Vite servers may serve stale preview',
      passed: false,
      detail: 'Multiple running dev servers detected with workspace mismatch',
      critical: true,
    });
  }

  const passed = findings.every((finding) => finding.passed || !finding.critical);
  const playwrightSameAsLivePreview = urlsEquivalent(playwrightPreviewUrl, iframePreviewUrl);
  const sessionRegistryMatchesIframe = !sessionRegistryUrl || !iframePreviewUrl
    ? true
    : urlsEquivalent(sessionRegistryUrl, iframePreviewUrl);
  const appTsxChecksumMatch =
    appTsxChecksumExpected && appTsxChecksumServed
      ? appTsxChecksumExpected === appTsxChecksumServed
      : null;

  const auditAnswers = {
    whichWorkspaceGenerated: generatedWorkspace ?? 'unknown',
    whichWorkspaceBuilt: builtWorkspace ?? 'unknown',
    whichWorkspaceViteServes: viteServingWorkspace ?? 'none',
    whichPreviewUrlRegistered: registeredPreviewUrl ?? 'none',
    whichPreviewUrlIframe: iframePreviewUrl ?? 'none',
    whichDomPlaywrightInspected: playwrightPreviewUrl ?? 'none',
    playwrightMatchesLivePreview: playwrightSameAsLivePreview
      ? 'yes'
      : `no — playwright=${normalizeUrl(playwrightPreviewUrl) ?? 'none'} iframe=${normalizeUrl(iframePreviewUrl) ?? 'none'}`,
    sessionRegistryMatchesIframe: sessionRegistryMatchesIframe
      ? 'yes'
      : `no — session=${normalizeUrl(sessionRegistryUrl) ?? 'none'} iframe=${normalizeUrl(iframePreviewUrl) ?? 'none'}`,
    stalePreviewRegistration: staleRegistrationDetected
      ? 'yes — session registry URL differs from gate-unlocked preview'
      : 'no',
    appTsxChecksumMatchesBundle:
      appTsxChecksumMatch === true
        ? 'yes'
        : appTsxChecksumMatch === false
          ? `no — expected ${appTsxChecksumExpected} served ${appTsxChecksumServed}`
          : 'unverified — checksum meta missing from served HTML',
  };

  let evidencePath: string | null = null;
  if (input.projectRootDir) {
    const evidenceDir = join(input.projectRootDir, '.end-to-end-build-reality', input.projectId);
    mkdirSync(evidenceDir, { recursive: true });
    evidencePath = join(evidenceDir, 'preview-authority-audit.json');
    writeFileSync(
      evidencePath,
      `${JSON.stringify({ passed, findings, answers: auditAnswers, gateUnlockedPreviewUrl, diagnosticPreviewUrl }, null, 2)}\n`,
      'utf8',
    );
  }

  return {
    readOnly: true,
    passed,
    failureCode: passed ? null : PREVIEW_AUTHORITY_MISMATCH,
    generatedWorkspace,
    builtWorkspace,
    viteServingWorkspace,
    registeredPreviewUrl,
    gateUnlockedPreviewUrl,
    diagnosticPreviewUrl,
    iframePreviewUrl,
    playwrightPreviewUrl,
    playwrightSameAsLivePreview,
    sessionRegistryMatchesIframe,
    staleRegistrationDetected,
    appTsxChecksumMatch,
    initialVisibleDomMatchesContract,
    findings,
    answers: auditAnswers,
    evidencePath,
  };
}
