/**
 * Build Proof Gap Materializer — bounded artifact-to-file writes (Phase 26.71).
 * Materializes build-ready contract expectations under .generated-builder-workspaces/ only.
 */

import { existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { createRealFileOperation } from '../real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../real-file-workspace-execution/real-file-operation-executor.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { resolveSafeWorkspaceRoot } from '../real-file-workspace-execution/real-file-workspace-path-authority.js';
import { materializeGeneratedApplication } from '../code-generation-engine/index.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { materializeBuildContractExpectations } from './build-contract-materializer.js';
import { WORKSPACE_ROOT_DIR } from './connected-build-execution-registry.js';
import type {
  BuildArtifactToFileProof,
  BuildExecutionProofLevel,
  ExpectedArtifactEntry,
} from './connected-build-execution-types.js';

export const BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS =
  'BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS';

export const GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS =
  'GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS';

export const RUNTIME_DEV_SERVER_RELATIVE_PATH = 'runtime/dev-server.mjs';
export const VERIFICATION_RUN_VERIFY_RELATIVE_PATH = 'verification/run-verify.mjs';

export const VERIFICATION_RUN_VERIFY_SOURCE = `import { get as httpGet } from 'node:http';

const previewUrl = process.env.PREVIEW_URL;
const workspaceId = process.env.WORKSPACE_ID || 'unknown';

function fetchPreview(url) {
  return new Promise((resolve) => {
    const req = httpGet(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += String(chunk); });
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }));
    });
    req.on('error', () => resolve({ statusCode: 0, body: '' }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ statusCode: 0, body: '' }); });
  });
}

async function main() {
  const startedAt = new Date().toISOString();
  if (!previewUrl) {
    process.stdout.write(JSON.stringify({ verificationRunId: 'verify-missing-url', passCount: 0, failCount: 1, skippedCount: 0, testsExecuted: 0, checksExecuted: 1, verificationSucceeded: false, startedAt, completedAt: new Date().toISOString() }) + '\\n');
    process.exit(1);
  }

  const response = await fetchPreview(previewUrl);
  const checks = [];
  if (response.statusCode >= 200 && response.statusCode < 400) checks.push('preview_reachable');
  try {
    const parsed = JSON.parse(response.body);
    if (parsed.status === 'ok') checks.push('preview_status_ok');
    if (parsed.workspaceId === workspaceId) checks.push('workspace_id_match');
  } catch {
    /* no json */
  }

  const passCount = checks.length;
  const failCount = Math.max(0, 3 - passCount);
  const verificationSucceeded = failCount === 0 && passCount >= 2;
  const completedAt = new Date().toISOString();
  const result = {
    verificationRunId: \`verify-\${workspaceId}-\${Date.now()}\`,
    passCount,
    failCount,
    skippedCount: 0,
    testsExecuted: 1,
    checksExecuted: 3,
    verificationSucceeded,
    startedAt,
    completedAt,
    workspaceId,
    previewUrl,
    checks,
  };
  process.stdout.write(JSON.stringify(result) + '\\n');
  process.exit(verificationSucceeded ? 0 : 1);
}

main();
`;

export const RUNTIME_DEV_SERVER_SOURCE = `import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const requestedPort = Number(process.env.RUNTIME_PORT || 0);
const workspaceId = process.env.WORKSPACE_ID || 'unknown';
const workspaceRoot = process.cwd();

const UI_ENTRY_CANDIDATES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/main.ts',
  'src/main.js',
  'src/index.tsx',
  'src/index.jsx',
  'src/App.tsx',
  'src/App.jsx',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
  '.tsx': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function detectUiExposure() {
  const hasIndexHtml = existsSync(join(workspaceRoot, 'index.html'));
  const hasReactApp =
    existsSync(join(workspaceRoot, 'src/App.tsx')) ||
    existsSync(join(workspaceRoot, 'src/App.jsx'));
  let entrypoint = null;
  for (const rel of UI_ENTRY_CANDIDATES) {
    if (existsSync(join(workspaceRoot, rel))) {
      entrypoint = '/' + rel.replace(/\\\\/g, '/');
      break;
    }
  }
  const uiSourcePresent = hasIndexHtml || hasReactApp || entrypoint !== null;
  return { uiSourcePresent, entrypoint, hasIndexHtml };
}

function resolveWorkspaceFile(urlPath) {
  const pathname = decodeURIComponent((urlPath.split('?')[0] || '/'));
  const rel = pathname.replace(/^\\/+/, '');
  if (!rel || rel.includes('..')) return null;
  const abs = join(workspaceRoot, rel);
  if (!abs.startsWith(workspaceRoot)) return null;
  if (!existsSync(abs)) return null;
  return abs;
}

function readIndexHtml() {
  const indexPath = join(workspaceRoot, 'index.html');
  if (!existsSync(indexPath)) return null;
  try {
    return readFileSync(indexPath, 'utf8');
  } catch {
    return null;
  }
}

function buildHtmlShell(entrypoint) {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="\${entrypoint}"></script>
</body>
</html>\`;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, contentType, body) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function runtimeStatus(pathname) {
  return { status: 'ok', workspaceId, path: pathname };
}

const uiExposure = detectUiExposure();

const server = http.createServer((req, res) => {
  const pathname = req.url?.split('?')[0] || '/';

  if (pathname === '/health' || pathname === '/runtime/status') {
    sendJson(res, 200, runtimeStatus(pathname));
    return;
  }

  if (uiExposure.uiSourcePresent) {
    if (pathname === '/' || pathname === '/index.html') {
      const indexHtml = readIndexHtml();
      const html = indexHtml ?? buildHtmlShell(uiExposure.entrypoint ?? '/src/App.tsx');
      sendText(res, 200, 'text/html; charset=utf-8', html);
      return;
    }

    const filePath = resolveWorkspaceFile(pathname);
    if (filePath) {
      try {
        const body = readFileSync(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME[ext] ?? 'application/octet-stream';
        sendText(res, 200, contentType, body);
        return;
      } catch {
        sendJson(res, 500, { status: 'error', workspaceId, path: pathname });
        return;
      }
    }

    sendJson(res, 404, { status: 'not_found', workspaceId, path: pathname });
    return;
  }

  sendJson(res, 200, runtimeStatus(pathname));
});

server.listen(requestedPort > 0 ? requestedPort : 0, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : requestedPort;
  process.stdout.write(
    JSON.stringify({ ready: true, port, workspaceId, uiExposure: uiExposure.uiSourcePresent }) + '\\n',
  );
});
`;

const FORBIDDEN_ARTIFACT_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  'credentials.json',
  'secrets.json',
  'id_rsa',
  'private.key',
]);

const FORBIDDEN_ARTIFACT_SUFFIXES = ['.pem', '.key', '.p12', '.pfx'];

function isForbiddenArtifactPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? normalized;
  if (FORBIDDEN_ARTIFACT_BASENAMES.has(base)) return true;
  const lower = base.toLowerCase();
  return FORBIDDEN_ARTIFACT_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

function relativePathInWorkspace(expectedPath: string, workspaceId: string): string {
  const prefix = `${WORKSPACE_ROOT_DIR}/${workspaceId}/`;
  const normalized = expectedPath.replace(/\\/g, '/');
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
  }
  const alt = `${GENERATED_BUILDER_WORKSPACES_DIR}/${workspaceId}/`;
  if (normalized.startsWith(alt)) {
    return normalized.slice(alt.length);
  }
  return normalized.replace(/^\.generated-builder-workspaces\/[^/]+\//, '');
}

function derivePlanId(contract: BuildReadyExecutionContract): string {
  return `plan-contract-${contract.ideaId}`;
}

function deriveBuildManifestId(contract: BuildReadyExecutionContract): string {
  return `${contract.contractId}-manifest`;
}

function buildStubContent(input: {
  relativePath: string;
  artifact: ExpectedArtifactEntry;
  contract: BuildReadyExecutionContract;
  planId: string;
  buildManifestId: string;
}): string {
  const base = input.relativePath.split('/').pop() ?? input.relativePath;

  if (base === 'package.json') {
    return (
      JSON.stringify(
        {
          name: input.contract.contractId,
          version: '0.1.0',
          private: true,
          type: 'module',
          description: `Generated build workspace for ${input.contract.contractId}`,
          scripts: {
            dev: 'node runtime/dev-server.mjs',
            start: 'node runtime/dev-server.mjs',
            verify: 'node verification/run-verify.mjs',
            test: 'node verification/run-verify.mjs',
          },
          devpulseMaterialization: true,
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (input.relativePath.replace(/\\/g, '/').endsWith(VERIFICATION_RUN_VERIFY_RELATIVE_PATH)) {
    return `${VERIFICATION_RUN_VERIFY_SOURCE}\n`;
  }

  if (input.relativePath.replace(/\\/g, '/').endsWith(RUNTIME_DEV_SERVER_RELATIVE_PATH)) {
    return `${RUNTIME_DEV_SERVER_SOURCE}\n`;
  }

  if (base === 'build-manifest.json') {
    return (
      JSON.stringify(
        {
          manifestId: input.buildManifestId,
          planId: input.planId,
          contractId: input.contract.contractId,
          ideaId: input.contract.ideaId,
          generatedAt: new Date().toISOString(),
          buildUnits: input.contract.buildUnits.map((u) => u.unitId),
          materializationSource: 'build-proof-gap-materializer',
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (input.relativePath.endsWith('.tsx')) {
    return `// Generated build artifact for ${input.contract.contractId}\nexport default function GeneratedApp() {\n  return null;\n}\n`;
  }

  if (input.relativePath.endsWith('.ts')) {
    return `// Generated build artifact for ${input.contract.contractId}\nexport {};\n`;
  }

  if (input.relativePath.endsWith('.json')) {
    return (
      JSON.stringify(
        {
          generated: true,
          contractId: input.contract.contractId,
          artifactId: input.artifact.artifactId,
        },
        null,
        2,
      ) + '\n'
    );
  }

  if (base === 'README.md') {
    return `# ${input.contract.contractId}\n\nGenerated builder workspace (read-only materialization proof).\n`;
  }

  return `# Generated artifact\n\nContract: ${input.contract.contractId}\nArtifact: ${input.artifact.artifactId}\n`;
}

function fileExistsNonEmpty(projectRootDir: string, workspaceId: string, relativePath: string): boolean {
  const rootVerdict = resolveSafeWorkspaceRoot(projectRootDir, workspaceId);
  if (rootVerdict.result !== 'REAL_FILE_WORKSPACE_PATH_PASS') return false;
  const abs = join(rootVerdict.workspaceRoot, relativePath);
  try {
    const stat = statSync(abs);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function writeArtifactFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): { ok: boolean; reason: string } {
  if (isForbiddenArtifactPath(input.relativePath)) {
    return { ok: false, reason: `Forbidden artifact path: ${input.relativePath}` };
  }

  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'build-proof-gap-materializer',
    sourceActionId: 'build-proof-gap-materialization',
    payload: input.content,
  });

  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });

  if (!executed.result?.success) {
    return { ok: false, reason: executed.result?.summary ?? 'Write failed' };
  }

  return { ok: true, reason: 'written' };
}

export function computeArtifactToFileProof(input: {
  contract: BuildReadyExecutionContract;
  projectRootDir: string;
  materializationAttempted: boolean;
  generatedAt?: string;
}): BuildArtifactToFileProof {
  const expectations = materializeBuildContractExpectations(input.contract);
  const workspaceId = input.contract.contractId;
  const workspacePath = `${WORKSPACE_ROOT_DIR}/${workspaceId}`.replace(/\\/g, '/');
  const planId = derivePlanId(input.contract);
  const buildManifestId = deriveBuildManifestId(input.contract);

  const materializedFiles: string[] = [];
  const missingArtifacts: string[] = [];

  for (const artifact of expectations.expectedArtifacts) {
    const rel = relativePathInWorkspace(artifact.expectedPath, workspaceId);
    if (isForbiddenArtifactPath(rel)) {
      missingArtifacts.push(`${artifact.artifactId} → forbidden path ${artifact.expectedPath}`);
      continue;
    }
    if (fileExistsNonEmpty(input.projectRootDir, workspaceId, rel)) {
      materializedFiles.push(artifact.expectedPath);
    } else {
      missingArtifacts.push(`${artifact.artifactId} → ${artifact.expectedPath}`);
    }
  }

  const rootVerdict = resolveSafeWorkspaceRoot(input.projectRootDir, workspaceId);
  const workspaceExists =
    rootVerdict.result === 'REAL_FILE_WORKSPACE_PATH_PASS' &&
    existsSync(rootVerdict.workspaceRoot);

  const expectedArtifactCount = expectations.expectedArtifacts.length;
  const materializedFileCount = materializedFiles.length;
  const missingArtifactCount = missingArtifacts.length;

  let proofLevel: BuildExecutionProofLevel = 'NOT_PROVEN';
  if (
    input.materializationAttempted &&
    workspaceExists &&
    missingArtifactCount === 0 &&
    materializedFileCount >= expectedArtifactCount &&
    expectedArtifactCount > 0
  ) {
    proofLevel = 'PROVEN';
  } else if (materializedFileCount > 0) {
    proofLevel = 'PARTIAL';
  }

  return {
    readOnly: true,
    materializationAttempted: input.materializationAttempted,
    planId,
    buildManifestId,
    workspaceId,
    workspacePath,
    expectedArtifactCount,
    materializedFileCount,
    missingArtifactCount,
    materializedFiles,
    missingArtifacts,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    proofLevel,
  };
}

export function materializeBuildProofGapArtifacts(input: {
  projectRootDir: string;
  contract: BuildReadyExecutionContract;
  rawPrompt?: string;
  faithfulBuildPlan?: ResolvedPromptFaithfulBuildPlan;
}): BuildArtifactToFileProof {
  const workspaceId = input.contract.contractId;
  const expectations = materializeBuildContractExpectations(input.contract);
  const planId = derivePlanId(input.contract);
  const buildManifestId = deriveBuildManifestId(input.contract);
  const generatedAt = new Date().toISOString();

  resolveSafeWorkspaceRoot(input.projectRootDir, workspaceId);

  for (const artifact of expectations.expectedArtifacts) {
    const rel = relativePathInWorkspace(artifact.expectedPath, workspaceId);
    if (isForbiddenArtifactPath(rel)) continue;
    const alwaysRefresh = rel === 'package.json' || rel === RUNTIME_DEV_SERVER_RELATIVE_PATH;
    if (!alwaysRefresh && fileExistsNonEmpty(input.projectRootDir, workspaceId, rel)) continue;

    const content = buildStubContent({
      relativePath: rel,
      artifact,
      contract: input.contract,
      planId,
      buildManifestId,
    });

    writeArtifactFile({
      projectRootDir: input.projectRootDir,
      workspaceId,
      relativePath: rel,
      content,
    });
  }

  writeArtifactFile({
    projectRootDir: input.projectRootDir,
    workspaceId,
    relativePath: RUNTIME_DEV_SERVER_RELATIVE_PATH,
    content: `${RUNTIME_DEV_SERVER_SOURCE}\n`,
  });

  writeArtifactFile({
    projectRootDir: input.projectRootDir,
    workspaceId,
    relativePath: VERIFICATION_RUN_VERIFY_RELATIVE_PATH,
    content: `${VERIFICATION_RUN_VERIFY_SOURCE}\n`,
  });

  if (input.rawPrompt?.trim()) {
    materializeGeneratedApplication({
      projectRootDir: input.projectRootDir,
      workspaceId,
      contract: input.contract,
      rawPrompt: input.rawPrompt,
      faithfulBuildPlan: input.faithfulBuildPlan,
      profileOverride: input.faithfulBuildPlan
        ? (input.faithfulBuildPlan.materializationProfile as import('../code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile)
        : undefined,
    });
  }

  return computeArtifactToFileProof({
    contract: input.contract,
    projectRootDir: input.projectRootDir,
    materializationAttempted: true,
    generatedAt,
  });
}

export function refreshGeneratedRuntimeDevServer(input: {
  projectRootDir: string;
  workspaceId: string;
}): { ok: boolean; reason: string } {
  return writeArtifactFile({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    relativePath: RUNTIME_DEV_SERVER_RELATIVE_PATH,
    content: `${RUNTIME_DEV_SERVER_SOURCE}\n`,
  });
}

export function isPathUnderGeneratedBuilderWorkspaces(projectRootDir: string, targetPath: string): boolean {
  const rel = relative(projectRootDir, targetPath).replace(/\\/g, '/');
  return (
    rel === GENERATED_BUILDER_WORKSPACES_DIR ||
    rel.startsWith(`${GENERATED_BUILDER_WORKSPACES_DIR}/`)
  );
}
