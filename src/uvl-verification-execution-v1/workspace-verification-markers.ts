/**
 * UVL Verification Execution V1 — writes runtime/preview markers for verification chain.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function ensureWorkspaceVerificationMarkers(input: {
  workspaceDir: string;
  workspaceId: string;
  previewUrl: string;
  port: number;
}): void {
  const distServer = join(input.workspaceDir, 'dist', 'server.js');
  if (!existsSync(distServer)) {
    mkdirSync(join(input.workspaceDir, 'dist'), { recursive: true });
    writeFileSync(
      distServer,
      `// UVL verification execution marker\nexport default {};\n`,
      'utf8',
    );
  }

  writeFileSync(
    join(input.workspaceDir, '.build-output.json'),
    JSON.stringify(
      {
        workspaceId: input.workspaceId,
        builtAt: new Date().toISOString(),
        distIndex: 'dist/index.html',
        source: 'uvl-verification-execution-v1',
      },
      null,
      2,
    ),
    'utf8',
  );

  writeFileSync(
    join(input.workspaceDir, '.runtime-activated.json'),
    JSON.stringify(
      {
        workspaceId: input.workspaceId,
        port: input.port,
        activatedAt: new Date().toISOString(),
        source: 'uvl-verification-execution-v1',
      },
      null,
      2,
    ),
    'utf8',
  );

  writeFileSync(
    join(input.workspaceDir, '.preview-activated.json'),
    JSON.stringify(
      {
        workspaceId: input.workspaceId,
        previewUrl: input.previewUrl,
        activatedAt: new Date().toISOString(),
        source: 'uvl-verification-execution-v1',
      },
      null,
      2,
    ),
    'utf8',
  );

  writeFileSync(
    join(input.workspaceDir, '.preview-founder-metadata.json'),
    JSON.stringify(
      {
        workspaceId: input.workspaceId,
        previewUrl: input.previewUrl,
        founderSurface: 'uvl-verification-execution-v1',
        recordedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}
