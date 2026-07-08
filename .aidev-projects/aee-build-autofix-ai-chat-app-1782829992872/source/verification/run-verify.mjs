import { get as httpGet } from 'node:http';

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
    process.stdout.write(JSON.stringify({ verificationRunId: 'verify-missing-url', passCount: 0, failCount: 1, skippedCount: 0, testsExecuted: 0, checksExecuted: 1, verificationSucceeded: false, startedAt, completedAt: new Date().toISOString() }) + '\n');
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
    verificationRunId: `verify-${workspaceId}-${Date.now()}`,
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
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(verificationSucceeded ? 0 : 1);
}

main();

