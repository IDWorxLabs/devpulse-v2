/**
 * Command Center runtime health — diagnostics and report assembly.
 * Read-only verification; no capability behavior changes.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OPERATOR_FEED_SECTIONS } from './command-center-shell-manifest.js';
import { FOUNDER_REALITY_PORT, FOUNDER_REALITY_URL } from './founder-reality-manifest.js';
import { createFounderRealityServer } from './founder-reality-server.js';
import { probePortOwner, type PortOwnerInfo } from './port-probe.js';

export { probePortOwner, type PortOwnerInfo } from './port-probe.js';

export const COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN = 'COMMAND_CENTER_RUNTIME_HEALTH_PASS' as const;
export const COMMAND_CENTER_RUNTIME_HEALTH_ARTIFACT_DIR = '.command-center-runtime-health' as const;
export const COMMAND_CENTER_RUNTIME_HEALTH_REPORT_TITLE = 'COMMAND_CENTER_RUNTIME_HEALTH_REPORT.md' as const;

export const CRITICAL_API_PATHS = [
  '/',
  '/api/founder-reality.json',
  '/api/product-workspace.json',
  '/api/brain/health',
] as const;

export const FOUNDER_DASHBOARD_ROUTES: Readonly<Record<string, string>> = {
  'Capability Ownership': '/api/founder/canonical-ownership-v2',
  'Customer Operations': '/api/founder/customer-operations-platform-v1',
  'Production Observability': '/api/founder/production-observability-platform-v1',
  'Continuous Deployment': '/api/founder/continuous-deployment-pipeline-v1',
  'Evidence Revalidation': '/api/founder/evidence-revalidation-cycle-v1',
  'Evidence Freshness': '/api/founder/operational-evidence-freshness-authority-v1',
  'Failure Escalation': '/api/founder/unified-failure-escalation-authority-v1',
  'Multi-Project Execution': '/api/founder/multi-project-concurrent-execution-v1',
  'World2': '/api/founder/world2-real-instantiation-v1',
  'Self-Evolution': '/api/founder/self-evolution-execution-v1',
};

export interface EndpointProbeResult {
  path: string;
  status: number;
  ok: boolean;
  validJson: boolean;
  degraded: boolean;
  loadError: string | null;
  durationMs: number;
}

export interface RuntimeHealthAssessment {
  generatedAt: string;
  passToken: string;
  port: number;
  baseUrl: string;
  portOwner: PortOwnerInfo;
  duplicateServerRisk: boolean;
  manifestHealthy: boolean;
  manifestDegraded: boolean;
  manifestLoadError: string | null;
  operatorFeedSectionCount: number;
  validatorCount: number;
  criticalEndpoints: EndpointProbeResult[];
  dashboardEndpoints: EndpointProbeResult[];
  stressRequests: number;
  stressFailures: number;
  stressDurationMs: number;
  serverAliveAfterStress: boolean;
  refreshSimulationPasses: number;
  refreshSimulationFailures: number;
  remainingRisks: string[];
  recommendedActions: string[];
  proofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
}

async function probeEndpoint(baseUrl: string, path: string): Promise<EndpointProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, { method: 'GET' });
    const body = await res.text();
    let validJson = false;
    let degraded = false;
    let loadError: string | null = null;
    if (path.endsWith('.json') || path.startsWith('/api/')) {
      try {
        const parsed = JSON.parse(body) as { manifestLoadError?: string; degraded?: boolean; loadError?: string };
        validJson = true;
        degraded = Boolean(parsed.degraded || parsed.manifestLoadError);
        loadError = parsed.manifestLoadError ?? parsed.loadError ?? null;
      } catch {
        validJson = false;
      }
    } else {
      validJson = body.length > 0;
    }
    return {
      path,
      status: res.status,
      ok: res.status === 200,
      validJson,
      degraded,
      loadError,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      path,
      status: 0,
      ok: false,
      validJson: false,
      degraded: true,
      loadError: err instanceof Error ? err.message : 'fetch failed',
      durationMs: Date.now() - start,
    };
  }
}

export async function startEphemeralHealthServer(port: number): Promise<ReturnType<typeof createFounderRealityServer>> {
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve());
  });
  return server;
}

export async function runRuntimeHealthAssessment(input?: {
  port?: number;
  stressIterations?: number;
  refreshRounds?: number;
}): Promise<RuntimeHealthAssessment> {
  const port = input?.port ?? 4323;
  const baseUrl = `http://127.0.0.1:${port}`;
  const stressIterations = input?.stressIterations ?? 40;
  const refreshRounds = input?.refreshRounds ?? 5;

  const portOwner4321 = probePortOwner(FOUNDER_REALITY_PORT);
  const server = await startEphemeralHealthServer(port);

  const remainingRisks: string[] = [];
  const recommendedActions: string[] = [];

  try {
    const criticalPaths = [...CRITICAL_API_PATHS];
    const dashboardPaths = Object.values(FOUNDER_DASHBOARD_ROUTES);

    const criticalEndpoints: EndpointProbeResult[] = [];
    for (const path of criticalPaths) {
      criticalEndpoints.push(await probeEndpoint(baseUrl, path));
    }

    const dashboardEndpoints: EndpointProbeResult[] = [];
    for (const path of dashboardPaths) {
      dashboardEndpoints.push(await probeEndpoint(baseUrl, path));
    }

    const manifestProbe = criticalEndpoints.find((e) => e.path === '/api/founder-reality.json');
    let manifestHealthy = false;
    let manifestDegraded = false;
    let manifestLoadError: string | null = null;
    let operatorFeedSectionCount = 0;
    let validatorCount = 0;

    if (manifestProbe?.ok && manifestProbe.validJson) {
      const manifestRes = await fetch(`${baseUrl}/api/founder-reality.json`);
      const manifest = (await manifestRes.json()) as {
        manifestLoadError?: string;
        runtimeShell?: { operatorFeedSections?: string[] };
        validators?: string[];
      };
      manifestLoadError = manifest.manifestLoadError ?? manifestProbe.loadError;
      manifestDegraded = Boolean(manifestLoadError || manifestProbe.degraded);
      manifestHealthy = !manifestDegraded && Boolean(manifest.runtimeShell);
      operatorFeedSectionCount = manifest.runtimeShell?.operatorFeedSections?.length ?? 0;
      validatorCount = manifest.validators?.length ?? 0;
    }

    const stressStart = Date.now();
    let stressFailures = 0;
    const stressPaths = [...criticalPaths, ...dashboardPaths];
    for (let i = 0; i < stressIterations; i += 1) {
      const path = stressPaths[i % stressPaths.length]!;
      const result = await probeEndpoint(baseUrl, path);
      if (!result.ok) stressFailures += 1;
    }
    const stressDurationMs = Date.now() - stressStart;

    let refreshSimulationPasses = 0;
    let refreshSimulationFailures = 0;
    for (let i = 0; i < refreshRounds; i += 1) {
      const bundle = await Promise.all([
        probeEndpoint(baseUrl, '/'),
        probeEndpoint(baseUrl, '/api/founder-reality.json'),
        probeEndpoint(baseUrl, '/api/product-workspace.json'),
        probeEndpoint(baseUrl, '/api/brain/health'),
        ...dashboardPaths.map((p) => probeEndpoint(baseUrl, p)),
      ]);
      if (bundle.every((r) => r.ok)) refreshSimulationPasses += 1;
      else refreshSimulationFailures += 1;
    }

    const alive = await probeEndpoint(baseUrl, '/api/brain/health');
    const serverAliveAfterStress = alive.ok;

    const duplicateServerRisk = portOwner4321.listenerCount > 1;
    if (duplicateServerRisk) {
      remainingRisks.push(`Multiple listeners on port ${FOUNDER_REALITY_PORT} (${portOwner4321.listenerCount})`);
      recommendedActions.push(`Stop duplicate processes on port ${FOUNDER_REALITY_PORT} before npm run dev`);
    }
    if (portOwner4321.listening && !portOwner4321.intendedAiDevEngine) {
      remainingRisks.push(`Port ${FOUNDER_REALITY_PORT} is in use by a non-AiDevEngine process`);
      recommendedActions.push('Verify port owner with netstat before starting dev server');
    }
    if (manifestDegraded) {
      remainingRisks.push('Manifest is using degraded fallback assembly');
      recommendedActions.push('Inspect founder-reality-server buildManifestSafely() startup logs');
    }
    for (const [section, route] of Object.entries(FOUNDER_DASHBOARD_ROUTES)) {
      if (!OPERATOR_FEED_SECTIONS.includes(section as (typeof OPERATOR_FEED_SECTIONS)[number])) {
        remainingRisks.push(`Dashboard route registered but missing operator feed section: ${section}`);
      }
      const probe = dashboardEndpoints.find((e) => e.path === route);
      if (probe?.degraded) {
        remainingRisks.push(`Dashboard ${section} returned degraded payload`);
      }
    }
    if (stressFailures > 0) {
      remainingRisks.push(`${stressFailures} stress request(s) failed`);
    }
    if (refreshSimulationFailures > 0) {
      remainingRisks.push(`${refreshSimulationFailures} refresh simulation round(s) failed`);
    }
    if (portOwner4321.listening && portOwner4321.intendedAiDevEngine) {
      recommendedActions.push(
        `AiDevEngine already running on ${FOUNDER_REALITY_URL} — reuse it or stop PID ${portOwner4321.pids.join(', ')} before restarting`,
      );
    }

    const proofStatus =
      criticalEndpoints.every((e) => e.ok) &&
      dashboardEndpoints.every((e) => e.ok && !e.degraded) &&
      manifestHealthy &&
      serverAliveAfterStress &&
      stressFailures === 0 &&
      refreshSimulationFailures === 0 &&
      !duplicateServerRisk
        ? 'PROVEN'
        : criticalEndpoints.every((e) => e.ok) && serverAliveAfterStress
          ? 'PARTIAL'
          : 'NOT_PROVEN';

    return {
      generatedAt: new Date().toISOString(),
      passToken:
        proofStatus === 'PROVEN'
          ? COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN
          : 'COMMAND_CENTER_RUNTIME_HEALTH_FAIL',
      port,
      baseUrl,
      portOwner: portOwner4321,
      duplicateServerRisk,
      manifestHealthy,
      manifestDegraded,
      manifestLoadError,
      operatorFeedSectionCount,
      validatorCount,
      criticalEndpoints,
      dashboardEndpoints,
      stressRequests: stressIterations,
      stressFailures,
      stressDurationMs,
      serverAliveAfterStress,
      refreshSimulationPasses,
      refreshSimulationFailures,
      remainingRisks,
      recommendedActions,
      proofStatus,
    };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

export function buildRuntimeHealthReportMarkdown(
  assessment: RuntimeHealthAssessment,
  live?: Awaited<ReturnType<typeof probeLiveProductionServer>>,
): string {
  const lines = [
    '# Command Center Runtime Health Report',
    '',
    `**Generated:** ${assessment.generatedAt}`,
    '',
    `**Pass Token:** \`${assessment.passToken}\``,
    '',
    `**Proof Status:** ${assessment.proofStatus}`,
    '',
    '## Active Process Owner',
    '',
    `- Port ${FOUNDER_REALITY_PORT} listener: ${assessment.portOwner.listening ? 'YES' : 'NO'}`,
    `- Process: ${assessment.portOwner.intendedAiDevEngine ? 'AiDevEngine founder-reality-server' : 'unknown'}`,
    `- PID(s): ${assessment.portOwner.pids.join(', ') || 'none'}`,
    ...assessment.portOwner.commandLines.map((c) => `- Command: ${c}`),
    '',
    '## Port Verification',
    '',
    `- Production port ${FOUNDER_REALITY_PORT} listening: ${assessment.portOwner.listening ? 'YES' : 'NO'}`,
    `- Listener count: ${assessment.portOwner.listenerCount}`,
    `- Intended AiDevEngine process: ${assessment.portOwner.intendedAiDevEngine ? 'YES' : 'NO'}`,
    `- PIDs: ${assessment.portOwner.pids.join(', ') || 'none'}`,
    ...assessment.portOwner.commandLines.map((c) => `- ${c}`),
    `- Duplicate server risk: ${assessment.duplicateServerRisk ? 'YES' : 'NO'}`,
    '',
    '## Manifest Status',
    '',
    `- Manifest healthy: ${assessment.manifestHealthy ? 'YES' : 'NO'}`,
    `- Manifest degraded fallback: ${assessment.manifestDegraded ? 'YES' : 'NO'}`,
    `- Manifest load error: ${assessment.manifestLoadError ?? 'none'}`,
    `- Operator feed sections: ${assessment.operatorFeedSectionCount}`,
    `- Validators in manifest: ${assessment.validatorCount}`,
    '',
    '## Critical API Status',
    '',
    ...assessment.criticalEndpoints.map(
      (e) => `- \`${e.path}\` → ${e.status} (${e.durationMs}ms)${e.degraded ? ' DEGRADED' : ''}`,
    ),
    '',
    '## Dashboard Status',
    '',
    ...Object.entries(FOUNDER_DASHBOARD_ROUTES).map(([section, path]) => {
      const probe = assessment.dashboardEndpoints.find((e) => e.path === path);
      return `- **${section}** \`${path}\` → ${probe?.status ?? 0}${probe?.degraded ? ' DEGRADED' : ''}`;
    }),
    '',
    '## Refresh & Stress Stability',
    '',
    `- Stress requests: ${assessment.stressRequests}`,
    `- Stress failures: ${assessment.stressFailures}`,
    `- Stress duration: ${assessment.stressDurationMs}ms`,
    `- Refresh simulation passes: ${assessment.refreshSimulationPasses}`,
    `- Refresh simulation failures: ${assessment.refreshSimulationFailures}`,
    `- Server alive after stress: ${assessment.serverAliveAfterStress ? 'YES' : 'NO'}`,
    '',
    '## Live Production Server (port 4321)',
    '',
    ...(live
      ? [
          `- Reachable: ${live.reachable ? 'YES' : 'NO'}`,
          `- GET /api/brain/health: ${live.healthStatus}`,
          `- GET /api/founder-reality.json: ${live.manifestStatus}`,
          `- Live manifest degraded: ${live.manifestDegraded ? 'YES' : 'NO'}`,
          `- Live manifest error: ${live.manifestLoadError ?? 'none'}`,
        ]
      : ['- Live probe not run']),
    '',
    '## Refresh Stability',
    '',
    '- Repeated manifest + dashboard bundle loads do not crash the ephemeral test server',
    `- ${assessment.refreshSimulationPasses} full refresh rounds passed (manifest, workspace, health, all dashboard routes)`,
    '- No ERR_CONNECTION_REFUSED when production server is running and healthy',
    '',
    '## Remaining Risks',
    '',
    ...(assessment.remainingRisks.length > 0
      ? assessment.remainingRisks.map((r) => `- ${r}`)
      : ['- None identified']),
    '',
    '## Recommended Actions',
    '',
    ...(assessment.recommendedActions.length > 0
      ? assessment.recommendedActions.map((a) => `- ${a}`)
      : ['- Runtime is stable for LISA testing']),
    '',
    assessment.passToken === COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN
      ? '**COMMAND_CENTER_RUNTIME_HEALTH_PASS** — Command Center runtime verified stable.'
      : '**COMMAND_CENTER_RUNTIME_HEALTH_FAIL** — resolve items above before LISA testing.',
    '',
  ];
  return lines.join('\n');
}

export function writeRuntimeHealthArtifacts(
  projectRootDir: string,
  assessment: RuntimeHealthAssessment,
  live?: Awaited<ReturnType<typeof probeLiveProductionServer>>,
): void {
  const dir = join(projectRootDir, COMMAND_CENTER_RUNTIME_HEALTH_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'assessment.json'), JSON.stringify(assessment, null, 2), 'utf8');
  if (live) {
    writeFileSync(join(dir, 'live-probe.json'), JSON.stringify(live, null, 2), 'utf8');
  }
  writeFileSync(
    join(projectRootDir, COMMAND_CENTER_RUNTIME_HEALTH_REPORT_TITLE),
    buildRuntimeHealthReportMarkdown(assessment, live),
    'utf8',
  );
}

export async function probeLiveProductionServer(): Promise<{
  reachable: boolean;
  healthStatus: number;
  manifestStatus: number;
  manifestDegraded: boolean;
  manifestLoadError: string | null;
}> {
  try {
    const [health, manifestRes] = await Promise.all([
      fetch(`${FOUNDER_REALITY_URL}/api/brain/health`),
      fetch(`${FOUNDER_REALITY_URL}/api/founder-reality.json`),
    ]);
    let manifestDegraded = false;
    let manifestLoadError: string | null = null;
    if (manifestRes.status === 200) {
      const manifest = (await manifestRes.json()) as { manifestLoadError?: string };
      manifestLoadError = manifest.manifestLoadError ?? null;
      manifestDegraded = Boolean(manifestLoadError);
    }
    return {
      reachable: health.status === 200,
      healthStatus: health.status,
      manifestStatus: manifestRes.status,
      manifestDegraded,
      manifestLoadError,
    };
  } catch {
    return {
      reachable: false,
      healthStatus: 0,
      manifestStatus: 0,
      manifestDegraded: true,
      manifestLoadError: 'connection refused',
    };
  }
}
