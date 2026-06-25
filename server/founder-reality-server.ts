/**
 * DevPulse V2 Phase 10.3+ — Founder Reality Surface + Command Center Brain HTTP server.
 * Serves static surface and local brain API. No execution, no file writes.
 */

import './load-env.js';

import { readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFounderRealityManifest,
  FOUNDER_REALITY_HOST,
  FOUNDER_REALITY_PORT,
  FOUNDER_REALITY_URL,
} from './founder-reality-manifest.js';
import { handleBrainRespondRequest, sendBrainHealth, sendBrainOperationalTruth } from './brain-api-handler.js';
import {
  handleBuildFromPromptRequest,
  handleBuildLivePreviewStatusRequest,
} from './build-from-prompt-handler.js';
import {
  handleFounderTestRunRequest,
  handleFounderTestRunV2Request,
  handleFounderTestRunV3Request,
  handleFounderTestRunV4Request,
  handleFounderTestRuntimeStatusRequest,
  handleFounderTestResultRequest,
  handleFounderTestResultDebugRequest,
  handleFounderTestClientDeliveryTraceRequest,
  handleFounderTestPingRequest,
  handleFounderTestResultReportRequest,
  handleFounderTestResultDownloadRequest,
} from './founder-testing-handler.js';
import { buildFounderTestPingResponse, FOUNDER_TEST_SERVER_STARTED_AT } from './founder-test-server-process-metadata.js';
import { sendExecutionProofJson } from './execution-proof-handler.js';
import { sendFounderReviewJson } from './founder-review-handler.js';
import { sendRequirementDiscoveryJson } from './requirement-discovery-handler.js';
import { sendVerificationHubJson } from './verification-hub-handler.js';
import { sendTrustCalibrationJson } from './afla-trust-calibration-handler.js';
import {
  sendProductionReadinessGateV1Json,
  sendProductionReadinessJson,
} from './production-readiness-gate-handler.js';
import { sendCloudExecutionPathV1Json } from './cloud-execution-path-handler.js';
import { sendProductArchitectIntelligenceJson } from './product-architect-intelligence-handler.js';
import { sendLargeScaleValidationJson } from './large-scale-validation-handler.js';
import { sendWorld2RealInstantiationJson } from './world2-real-instantiation-handler.js';
import { sendMobileRuntimeValidationJson } from './mobile-runtime-validation-handler.js';
import { sendSelfEvolutionExecutionJson } from './self-evolution-execution-v1-handler.js';
import { sendCanonicalOwnershipV2Json } from './canonical-ownership-v2-handler.js';
import { sendMultiProjectConcurrentExecutionJson } from './multi-project-concurrent-execution-handler.js';
import { sendUnifiedFailureEscalationJson } from './unified-failure-escalation-handler.js';
import { sendOperationalEvidenceFreshnessJson } from './operational-evidence-freshness-handler.js';
import { sendCustomerOperationsJson } from './customer-operations-handler.js';
import { sendProductionObservabilityJson } from './production-observability-handler.js';
import { sendContinuousDeploymentJson } from './continuous-deployment-handler.js';
import { sendEvidenceRevalidationJson } from './evidence-revalidation-handler.js';
import { sendRealBuildExecutionPipelineJson } from './real-build-execution-pipeline-handler.js';
import { sendRealBuildExecutionPipelineV11Json } from './real-build-execution-pipeline-v11-handler.js';
import { sendUvlVerificationExecutionV1Json } from './uvl-verification-execution-v1-handler.js';
import { buildPortfolioInsightsDemo } from './portfolio-demo-data.js';
import { buildProductWorkspaceSnapshot } from './product-workspace-snapshot.js';
import {
  handleProjectRegistryMutation,
  sendProjectRegistryJson,
} from './project-registry-handler.js';
import {
  bootstrapProjectRegistryV1,
  resolveProjectRegistryRootDir,
  setDefaultProjectRegistryRootDir,
} from '../src/project-registry-v1/index.js';
import { probePortOwner } from './port-probe.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

function getRegistryRootDir(): string {
  return resolveProjectRegistryRootDir();
}
const PUBLIC_DIR = join(ROOT_DIR, 'public', 'founder-reality');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function loadValidatorScripts(): string[] {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
  return Object.keys(pkg.scripts ?? {})
    .filter((key) => key.startsWith('validate:'))
    .sort();
}

const VALIDATOR_SCRIPTS = loadValidatorScripts();

function buildManifestSafely(): { manifest: ReturnType<typeof buildFounderRealityManifest>; json: string } {
  try {
    const manifest = buildFounderRealityManifest(VALIDATOR_SCRIPTS);
    return { manifest, json: JSON.stringify(manifest, null, 2) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'manifest assembly failed';
    const manifest = buildFounderRealityManifest([]);
    const degraded = {
      ...manifest,
      currentStatus: `Command Center manifest degraded — ${message}`,
      manifestLoadError: message,
    };
    return { manifest: degraded, json: JSON.stringify(degraded, null, 2) };
  }
}

const { manifest: MANIFEST, json: MANIFEST_JSON } = buildManifestSafely();
setDefaultProjectRegistryRootDir(ROOT_DIR);
bootstrapProjectRegistryV1(getRegistryRootDir());

function buildProductWorkspaceJson(): string {
  return JSON.stringify(buildProductWorkspaceSnapshot(VALIDATOR_SCRIPTS), null, 2);
}

const PORTFOLIO_DEMO_JSON = JSON.stringify(buildPortfolioInsightsDemo(), null, 2);

function sendJson(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Phase': '11.1',
    'X-DevPulse-Shell': 'command-center-runtime',
  });
  res.end(body);
}

function sendText(res: ServerResponse, status: number, contentType: string, body: string): void {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Phase': '11.1',
    'X-DevPulse-Shell': 'command-center-runtime',
  });
  res.end(body);
}

function parseRequestUrl(req: IncomingMessage): URL {
  const hostHeader = req.headers.host ?? `localhost:${FOUNDER_REALITY_PORT}`;
  return new URL(req.url ?? '/', `http://${hostHeader}`);
}

function sendFounderDashboardSafe(res: ServerResponse, surface: string, run: () => void): void {
  try {
    run();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'dashboard handler failed';
    sendJson(
      res,
      200,
      JSON.stringify({
        readOnly: true,
        informationalOnly: true,
        degraded: true,
        loadError: message,
        ownerModule: surface,
      }),
    );
  }
}

async function runFounderDashboardSafeAsync(
  res: ServerResponse,
  surface: string,
  run: () => void | Promise<void>,
): Promise<void> {
  try {
    await run();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'dashboard handler failed';
    sendJson(
      res,
      200,
      JSON.stringify({
        readOnly: true,
        informationalOnly: true,
        degraded: true,
        loadError: message,
        ownerModule: surface,
      }),
    );
  }
}

function resolvePublicPath(urlPath: string): string | null {
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  if (normalized.includes('..')) return null;

  const filePath = join(PUBLIC_DIR, normalized.replace(/^\//, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

async function serveStaticFile(res: ServerResponse, filePath: string): Promise<void> {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  const content = await readFile(filePath);
  sendText(res, 200, contentType, content.toString('utf8'));
}

export function createFounderRealityServer() {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
    const requestUrl = parseRequestUrl(req);
    const urlPath = requestUrl.pathname;

    const forbiddenPaths = ['/api/exec', '/api/run-command', '/api/write', '/api/deploy', '/api/auto-fix'];
    if (forbiddenPaths.some((p) => urlPath.startsWith(p))) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden endpoint — no command or write access' }));
      return;
    }

    if (urlPath === '/api/brain/health' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendBrainHealth(res);
      return;
    }

    if (urlPath === '/api/brain/operational-truth' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendBrainOperationalTruth(res);
      return;
    }

    if (urlPath === '/api/brain/respond' && req.method === 'POST') {
      await handleBrainRespondRequest(req, res);
      return;
    }

    if (urlPath === '/api/build/from-prompt' && req.method === 'POST') {
      await handleBuildFromPromptRequest(req, res);
      return;
    }

    if (urlPath === '/api/projects/registry.json' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendProjectRegistryJson(res, getRegistryRootDir());
      return;
    }

    if (urlPath === '/api/projects/create' && req.method === 'POST') {
      await handleProjectRegistryMutation(req, res, 'create', getRegistryRootDir());
      return;
    }

    if (urlPath === '/api/projects/rename' && req.method === 'POST') {
      await handleProjectRegistryMutation(req, res, 'rename', getRegistryRootDir());
      return;
    }

    if (urlPath === '/api/projects/archive' && req.method === 'POST') {
      await handleProjectRegistryMutation(req, res, 'archive', getRegistryRootDir());
      return;
    }

    if (urlPath === '/api/projects/set-active' && req.method === 'POST') {
      await handleProjectRegistryMutation(req, res, 'set-active', getRegistryRootDir());
      return;
    }

    if (urlPath === '/api/build/live-preview' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      handleBuildLivePreviewStatusRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/run' && req.method === 'POST') {
      await handleFounderTestRunRequest(req, res, VALIDATOR_SCRIPTS);
      return;
    }

    if (urlPath === '/api/founder-test/runtime-status' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestRuntimeStatusRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/ping' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestPingRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/result' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestResultRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/result-debug' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestResultDebugRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/delivery-trace-client' && req.method === 'POST') {
      await handleFounderTestClientDeliveryTraceRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/result-report' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestResultReportRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/result-download' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        res.end();
        return;
      }
      handleFounderTestResultDownloadRequest(req, res);
      return;
    }

    if (urlPath === '/api/founder-test/run-v2' && req.method === 'POST') {
      await handleFounderTestRunV2Request(req, res, VALIDATOR_SCRIPTS);
      return;
    }

    if (urlPath === '/api/founder-test/run-v3' && req.method === 'POST') {
      await handleFounderTestRunV3Request(req, res, VALIDATOR_SCRIPTS);
      return;
    }

    if (urlPath === '/api/founder-test/run-v4' && req.method === 'POST') {
      await handleFounderTestRunV4Request(req, res, VALIDATOR_SCRIPTS);
      return;
    }

    if (urlPath === '/api/founder/execution-proof' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendExecutionProofJson(res, ROOT_DIR);
      return;
    }

    if (urlPath === '/api/founder/founder-review' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      const profile = requestUrl.searchParams.get('profile');
      sendFounderReviewJson(res, profile, ROOT_DIR);
      return;
    }

    if (urlPath === '/api/founder/requirement-discovery' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendRequirementDiscoveryJson(res, requestUrl.searchParams.get('prompt'), requestUrl.searchParams.get('domain'));
      return;
    }

    if (urlPath === '/api/founder/verification-hub' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendVerificationHubJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('prompt'),
        ROOT_DIR,
      );
      return;
    }

    if (urlPath === '/api/founder/trust-calibration' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendTrustCalibrationJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('prompt'),
      );
      return;
    }

    if (urlPath === '/api/founder/production-readiness-gate' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendProductionReadinessJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('prompt'),
      );
      return;
    }

    if (urlPath === '/api/founder/product-architect-intelligence' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendProductArchitectIntelligenceJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('prompt'),
      );
      return;
    }

    if (urlPath === '/api/founder/large-scale-validation' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendLargeScaleValidationJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('refresh') === 'true',
      );
      return;
    }

    if (urlPath === '/api/founder/world2-real-instantiation-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'world2-real-instantiation-v1', () =>
        sendWorld2RealInstantiationJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (urlPath === '/api/founder/mobile-runtime-validation-at-scale-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'mobile-runtime-validation-at-scale-v1', () =>
        sendMobileRuntimeValidationJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (urlPath === '/api/founder/self-evolution-execution-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'self-evolution-execution-v1', () =>
        sendSelfEvolutionExecutionJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (urlPath === '/api/founder/canonical-ownership-v2' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'canonical-ownership-v2', () =>
        sendCanonicalOwnershipV2Json(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/multi-project-concurrent-execution-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'multi-project-concurrent-execution-v1', () =>
        sendMultiProjectConcurrentExecutionJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/unified-failure-escalation-authority-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'unified-failure-escalation-authority-v1', () =>
        sendUnifiedFailureEscalationJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/operational-evidence-freshness-authority-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'operational-evidence-freshness-authority-v1', () =>
        sendOperationalEvidenceFreshnessJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/customer-operations-platform-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'customer-operations-platform-v1', () =>
        sendCustomerOperationsJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/production-observability-platform-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'production-observability-platform-v1', () =>
        sendProductionObservabilityJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/continuous-deployment-pipeline-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'continuous-deployment-pipeline-v1', () =>
        sendContinuousDeploymentJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (
      urlPath === '/api/founder/evidence-revalidation-cycle-v1' &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendFounderDashboardSafe(res, 'evidence-revalidation-cycle-v1', () =>
        sendEvidenceRevalidationJson(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (urlPath === '/api/founder/real-build-execution-pipeline' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendRealBuildExecutionPipelineJson(
        res,
        requestUrl.searchParams.get('profile'),
        requestUrl.searchParams.get('refresh') === 'true',
      );
      return;
    }

    if (urlPath === '/api/founder/real-build-execution-pipeline-v11' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendRealBuildExecutionPipelineV11Json(res, requestUrl.searchParams.get('refresh') === 'true');
      return;
    }

    if (urlPath === '/api/founder/production-readiness-gate-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendProductionReadinessGateV1Json(res, requestUrl.searchParams.get('refresh') === 'true', ROOT_DIR);
      return;
    }

    if (urlPath === '/api/founder/cloud-execution-path-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendCloudExecutionPathV1Json(res, requestUrl.searchParams.get('refresh') === 'true', ROOT_DIR);
      return;
    }

    if (urlPath === '/api/founder/uvl-verification-execution-v1' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      await runFounderDashboardSafeAsync(res, 'uvl-verification-execution-v1', () =>
        sendUvlVerificationExecutionV1Json(res, requestUrl.searchParams.get('refresh') === 'true'),
      );
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, JSON.stringify({
        error: 'Method not allowed — only GET /api/founder/execution-proof, GET /api/founder/founder-review, GET /api/founder/requirement-discovery, GET /api/founder/verification-hub, GET /api/founder/uvl-verification-execution-v1, GET /api/founder/production-readiness-gate-v1, GET /api/founder/cloud-execution-path-v1, GET /api/founder/trust-calibration, GET /api/founder/production-readiness-gate, GET /api/founder/product-architect-intelligence, GET /api/founder/large-scale-validation, GET /api/founder/real-build-execution-pipeline, GET /api/founder/real-build-execution-pipeline-v11, GET /api/brain/*, GET /api/build/live-preview, GET /api/projects/registry.json, POST /api/projects/create, POST /api/projects/rename, POST /api/projects/archive, POST /api/projects/set-active, POST /api/build/from-prompt, and POST /api/founder-test/* are supported',
        hint: 'Restart DevPulse with npm run dev if Brain POST returns read-only errors',
      }));
      return;
    }

    if (urlPath.includes('exec') || urlPath.includes('/write') || urlPath.includes('deploy')) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden endpoint' }));
      return;
    }

    if (urlPath === '/api/founder-reality.json') {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendJson(res, 200, MANIFEST_JSON);
      return;
    }

    if (urlPath === '/api/product-workspace.json') {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      try {
        sendJson(res, 200, buildProductWorkspaceJson());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'workspace snapshot failed';
        sendJson(
          res,
          200,
          JSON.stringify({
            productBrand: 'AiDevEngine',
            portfolioInsights: JSON.parse(PORTFOLIO_DEMO_JSON),
            workspaceError: message,
          }),
        );
      }
      return;
    }

    if (urlPath === '/api/portfolio-demo.json') {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendJson(res, 200, PORTFOLIO_DEMO_JSON);
      return;
    }

    const allowedStatic = ['/', '/index.html', '/styles.css', '/app.js'];
    if (!allowedStatic.includes(urlPath)) {
      sendJson(res, 404, JSON.stringify({ error: 'Not found' }));
      return;
    }

    const filePath = resolvePublicPath(urlPath);
    if (!filePath) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden path' }));
      return;
    }

    try {
      statSync(filePath);
      if (req.method === 'HEAD') {
        res.writeHead(200);
        res.end();
        return;
      }
      await serveStaticFile(res, filePath);
    } catch {
      sendJson(res, 404, JSON.stringify({ error: 'File not found' }));
    }
    } catch (err) {
      if (!res.headersSent) {
        const message = err instanceof Error ? err.message : 'internal server error';
        sendJson(res, 500, JSON.stringify({ error: message, degraded: true }));
      }
      console.error('[founder-reality-server] request failed:', err);
    }
  });
}

export function getFounderRealityManifest(): typeof MANIFEST {
  return MANIFEST;
}

export function getFounderRealityManifestJson(): string {
  return MANIFEST_JSON;
}

export function startFounderRealityServer(port = FOUNDER_REALITY_PORT, host = FOUNDER_REALITY_HOST): ReturnType<typeof createFounderRealityServer> {
  const server = createFounderRealityServer();
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      const owner = probePortOwner(port);
      console.error('');
      console.error(`[founder-reality-server] Port ${port} is already in use (EADDRINUSE).`);
      if (owner.pids.length > 0) {
        console.error(`  Existing listener PID(s): ${owner.pids.join(', ')}`);
        for (const line of owner.commandLines) {
          console.error(`  ${line}`);
        }
      }
      if (owner.intendedAiDevEngine) {
        console.error(`  AiDevEngine may already be running — open ${FOUNDER_REALITY_URL}`);
        console.error('  Stop the existing server before starting another npm run dev instance.');
      } else {
        console.error('  Another process owns this port. Free port 4321 or choose a different port.');
      }
      console.error('');
      process.exit(1);
    }
    console.error('[founder-reality-server] server error:', err);
  });
  server.listen(port, host, () => {
    const ping = buildFounderTestPingResponse();
    console.log('');
    console.log('DevPulse V2 — Command Center + Unified Brain');
    console.log('============================================');
    console.log('');
    console.log(`Open: ${FOUNDER_REALITY_URL}`);
    console.log('');
    console.log(`Listening: ${host}:${port} (pid ${String(ping.processId)}, started ${FOUNDER_TEST_SERVER_STARTED_AT})`);
    console.log('');
    console.log('Founder Test API routes registered:');
    console.log('  GET  /api/founder-test/ping');
    console.log('  GET  /api/founder-test/result');
    console.log('  GET  /api/founder-test/result-report');
    console.log('  GET  /api/founder-test/result-download');
    console.log('  GET  /api/founder-test/result-debug');
    console.log('  GET  /api/founder-test/runtime-status');
    console.log('  POST /api/founder-test/run');
    console.log('');
    console.log('Phase 11.1A Brain Runtime — POST /api/brain/respond + GET /api/brain/health');
    console.log('Phase 27.2 One-Prompt Live Preview — POST /api/build/from-prompt + GET /api/build/live-preview');
    console.log('If Brain fails with 405, stop stale servers on port 4321 and restart.');
    console.log('No execution, no external AI, no file modification.');
    console.log('');
  });
  return server;
}

if (process.argv[1]?.includes('founder-reality-server')) {
  startFounderRealityServer();
}

export { FOUNDER_REALITY_URL, FOUNDER_REALITY_PORT, FOUNDER_REALITY_HOST };
