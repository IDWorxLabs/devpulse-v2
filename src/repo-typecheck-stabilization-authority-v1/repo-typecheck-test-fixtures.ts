/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — validator fixtures.
 * Isolated mini TypeScript workspaces for validation only.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER } from './repo-typecheck-types.js';

export { REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER };

export interface RepoTypecheckFixtureWorkspace {
  readOnly: true;
  workspaceDir: string;
  fixtureId: string;
}

function writeFixturePackage(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'repo-typecheck-fixture',
        private: true,
        scripts: {
          typecheck: 'tsc --noEmit',
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(workspaceDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          noUnusedLocals: true,
        },
        include: ['src/**/*'],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

export function createRepoTypecheckFixtureWorkspace(rootDir: string, fixtureId: string): RepoTypecheckFixtureWorkspace {
  const workspaceDir = join(rootDir, fixtureId);
  mkdirSync(join(workspaceDir, 'src'), { recursive: true });
  writeFixturePackage(workspaceDir);
  return { readOnly: true, workspaceDir, fixtureId };
}

export function injectCleanFixture(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `export const stableValue = 42;\n`,
    'utf8',
  );
}

export function injectBrokenImportPathFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, 'src/helper.ts'), `export function helper(): string { return 'ok'; }\n`, 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `import { helper } from './helpr';\n\nexport const result = helper();\n`,
    'utf8',
  );
}

export function injectMissingExportFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, 'src/provider.ts'), `export const existing = 1;\n`, 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `import { missingSymbol } from './provider';\n\nexport const value = missingSymbol;\n`,
    'utf8',
  );
}

export function injectReadonlyMutationFixture(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `const cfg: Readonly<{ count: number }> = { count: 0 };\ncfg.count = 1;\nexport const total = cfg.count;\n`,
    'utf8',
  );
}

export function injectDuplicateIdentifierFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, 'src/module-a.ts'), `export const value = 'a';\n`, 'utf8');
  writeFileSync(join(workspaceDir, 'src/module-b.ts'), `export const value = 'b';\n`, 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `import { value } from './module-a';\nimport { value } from './module-b';\n\nexport const merged = value;\n`,
    'utf8',
  );
}

export function injectUnusedImportFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, 'src/unused-module.ts'), `export const unused = 1;\n`, 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `import { unused } from './unused-module';\n\nexport const main = 1;\n`,
    'utf8',
  );
}

export function injectMultipleDownstreamFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, 'src/shared.ts'), `export const base = 'shared';\n`, 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/consumer-a.ts'),
    `import { sharedFn } from './shared';\nexport const a = sharedFn();\n`,
    'utf8',
  );
  writeFileSync(
    join(workspaceDir, 'src/consumer-b.ts'),
    `import { sharedFn } from './shared';\nexport const b = sharedFn();\n`,
    'utf8',
  );
  writeFileSync(
    join(workspaceDir, 'src/consumer-c.ts'),
    `import { sharedFn } from './shared';\nexport const c = sharedFn();\n`,
    'utf8',
  );
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `export { a } from './consumer-a';\nexport { b } from './consumer-b';\nexport { c } from './consumer-c';\n`,
    'utf8',
  );
}

export function injectUnsafeFixture(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `const numeric: number = 'not-a-number';\nexport const value = numeric;\n`,
    'utf8',
  );
}

export function injectRegressionTrapFixture(workspaceDir: string): void {
  writeFileSync(join(workspaceDir, REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER), '1\n', 'utf8');
  writeFileSync(
    join(workspaceDir, 'src/index.ts'),
    `import { helper } from './helpr';\n\nexport const result = helper;\n`,
    'utf8',
  );
}

export function countSharedExportErrors(scanOutput: string): number {
  return (scanOutput.match(/sharedFn/g) ?? []).length;
}

export function fixtureHasMarker(workspaceDir: string, marker: string): boolean {
  return existsSync(join(workspaceDir, marker));
}
