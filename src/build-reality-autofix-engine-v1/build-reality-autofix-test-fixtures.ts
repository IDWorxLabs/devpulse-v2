/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — validator fault injection fixtures.
 * Used only by validation harness — not production app logic.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BUILD_REALITY_AUTOFIX_INJECT_MARKER = 'BUILD_REALITY_AUTOFIX_INJECT' as const;
export const BUILD_REALITY_AUTOFIX_DOM_MARKER = 'BUILD_REALITY_AUTOFIX_DOM_FAULT' as const;

export interface AutofixFixtureWorkspace {
  readOnly: true;
  workspaceDir: string;
  primaryModuleId: string;
}

export function createAutofixFixtureWorkspace(rootDir: string, fixtureId: string): AutofixFixtureWorkspace {
  const workspaceDir = join(rootDir, fixtureId);
  const primaryModuleId = 'demo-feature';
  mkdirSync(join(workspaceDir, 'src/features', primaryModuleId), { recursive: true });

  writeFileSync(
    join(workspaceDir, 'universal-feature-contract.json'),
    `${JSON.stringify(
      {
        contractId: fixtureId,
        entities: [{ slug: primaryModuleId, label: 'Demo Feature' }],
        actions: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(workspaceDir, 'src/features/demo-feature/DemoFeature.tsx'),
    `export default function DemoFeature() {
  return (
    <section data-feature-module="demo-feature" data-modular-feature-v1="true">
      <h1>Demo Feature</h1>
      <output data-testid="demo-feature-display">0</output>
      <div role="group">
        <button type="button" data-digit="2">2</button>
        <button type="button" data-operator="+">+</button>
        <button type="button" data-digit="3">3</button>
        <button type="button">=</button>
      </div>
    </section>
  );
}
`,
    'utf8',
  );

  writeFileSync(
    join(workspaceDir, 'src/features/demo-feature/index.ts'),
    `export { default } from './DemoFeature';\n`,
    'utf8',
  );

  writeFileSync(
    join(workspaceDir, 'src/features/registry.ts'),
    `export const featureRegistry = [
  { id: 'demo-feature', route: '/features/demo-feature', name: 'Demo Feature', sourcePath: './demo-feature' },
] as const;
`,
    'utf8',
  );

  writeFileSync(
    join(workspaceDir, 'src/App.tsx'),
    `import DemoFeature from './features/demo-feature';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="demo-feature" data-feature-module="demo-feature">
      <DemoFeature />
    </main>
  );
}
`,
    'utf8',
  );

  return { readOnly: true, workspaceDir, primaryModuleId };
}

export function injectImportExportMismatch(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/App.tsx'),
    `import __buildRealityAutofixBroken from './features/__broken_export__';
import DemoFeature from './features/demo-feature';

export default function App() {
  void __buildRealityAutofixBroken; /* ${BUILD_REALITY_AUTOFIX_INJECT_MARKER} */
  return (
    <main data-direct-feature-app="true" data-root-feature="demo-feature" data-feature-module="demo-feature">
      <DemoFeature />
    </main>
  );
}
`,
    'utf8',
  );
}

export function validateImportExportFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
  typescriptOutput: string | null;
} {
  const appPath = join(workspaceDir, 'src/App.tsx');
  const source = readFileSync(appPath, 'utf8');
  const broken =
    source.includes('__broken_export__') ||
    source.includes('__buildRealityAutofixBroken') ||
    source.includes(BUILD_REALITY_AUTOFIX_INJECT_MARKER);
  return {
    passed: !broken,
    detail: broken ? 'Import/export mismatch still present' : 'Import/export fixture valid',
    typescriptOutput: broken ? "Cannot find module './features/__broken_export__'" : null,
  };
}

export function injectMissingModule(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/App.tsx'),
    `import MissingFeature from './features/__missing_module__/MissingFeature';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="demo-feature" data-feature-module="demo-feature">
      <MissingFeature />
    </main>
  );
}
`,
    'utf8',
  );
}

export function validateMissingModuleFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
  typescriptOutput: string | null;
} {
  const missingDir = join(workspaceDir, 'src/features/__missing_module__');
  const appSource = readFileSync(join(workspaceDir, 'src/App.tsx'), 'utf8');
  const stillBroken = appSource.includes('__missing_module__') && !existsSync(missingDir);
  return {
    passed: !stillBroken,
    detail: stillBroken ? 'Missing module still unresolved' : 'Missing module fixture valid',
    typescriptOutput: stillBroken ? "Cannot find module './features/__missing_module__/MissingFeature'" : null,
  };
}

export function injectRootMountMismatch(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, 'src/App.tsx'),
    `import WelcomeScreen from './screens/WelcomeScreen';

export default function App() {
  const [phase, setPhase] = useState<'welcome' | 'main'>('welcome');
  if (phase === 'welcome') {
    return <WelcomeScreen data-blueprint="welcome-screen" onContinue={() => setPhase('main')} />;
  }
  return <main data-blueprint="app-shell">Features</main>;
}
`,
    'utf8',
  );
}

export function validateRootMountFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
} {
  const source = readFileSync(join(workspaceDir, 'src/App.tsx'), 'utf8');
  const blueprint =
    source.includes('WelcomeScreen') ||
    source.includes('data-blueprint="welcome-screen"') ||
    source.includes("phase === 'welcome'");
  const direct =
    source.includes('data-direct-feature-app') &&
    source.includes('data-root-feature="demo-feature"') &&
    source.includes('DemoFeature');
  return {
    passed: direct && !blueprint,
    detail: direct && !blueprint ? 'Root mount matches contract-primary feature' : 'Blueprint shell still primary',
  };
}

export function injectDomInteractionFailure(workspaceDir: string): void {
  const featurePath = join(workspaceDir, 'src/features/demo-feature/DemoFeature.tsx');
  let source = readFileSync(featurePath, 'utf8');
  source = source.replace(/data-digit="2"/, `data-digit={undefined} /* ${BUILD_REALITY_AUTOFIX_DOM_MARKER} */`);
  source = source.replace(/data-operator="\+"/, `data-operator={undefined} /* ${BUILD_REALITY_AUTOFIX_DOM_MARKER} */`);
  writeFileSync(featurePath, source, 'utf8');
}

export function validateDomInteractionFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
  domFailureDetail: string | null;
} {
  const source = readFileSync(join(workspaceDir, 'src/features/demo-feature/DemoFeature.tsx'), 'utf8');
  const broken =
    source.includes(BUILD_REALITY_AUTOFIX_DOM_MARKER) ||
    source.includes('data-digit={undefined}') ||
    source.includes('data-operator={undefined}');
  return {
    passed: !broken && source.includes('data-digit="2"') && source.includes('data-operator="+"'),
    detail: broken ? 'DOM interaction selectors still broken' : 'DOM interaction selectors valid',
    domFailureDetail: broken ? 'button-sequence failed — data-digit/data-operator missing' : null,
  };
}

export function validatePassingFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
} {
  const root = validateRootMountFixture(workspaceDir);
  const dom = validateDomInteractionFixture(workspaceDir);
  const imports = validateImportExportFixture(workspaceDir);
  return {
    passed: root.passed && dom.passed && imports.passed,
    detail: `root=${root.passed} dom=${dom.passed} imports=${imports.passed}`,
  };
}

export function createPlaywrightUnavailableEvidence(): {
  passed: boolean;
  detail: string;
  playwrightDetail: string;
} {
  const detail =
    "browserType.launch: Executable doesn't exist at .../chrome-headless-shell.exe — run npx playwright install chromium";
  return {
    passed: false,
    detail,
    playwrightDetail: detail,
  };
}

export function createUnknownUnsafeEvidence(): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: false,
    detail: 'unsafe corrupt destructive unknown failure — no contract-backed repair path',
  };
}

export function injectValidatorHarnessFailure(workspaceDir: string): void {
  writeFileSync(
    join(workspaceDir, '.build-reality-autofix-harness.json'),
    JSON.stringify({ repaired: false, corrupt: true }, null, 2),
    'utf8',
  );
}

export function validateValidatorHarnessFixture(workspaceDir: string): {
  passed: boolean;
  detail: string;
  validatorHarnessDetail: string | null;
} {
  const markerPath = join(workspaceDir, '.build-reality-autofix-harness.json');
  if (!existsSync(markerPath)) {
    return { passed: true, detail: 'Harness marker valid', validatorHarnessDetail: null };
  }
  try {
    const marker = JSON.parse(readFileSync(markerPath, 'utf8')) as { repaired?: boolean; corrupt?: boolean };
    const broken = marker.corrupt === true && marker.repaired !== true;
    return {
      passed: !broken,
      detail: broken ? 'Validator harness lost state' : 'Harness marker valid',
      validatorHarnessDetail: broken ? 'Validator harness failure — harness lost state or misread evidence' : null,
    };
  } catch {
    return {
      passed: false,
      detail: 'Validator harness marker corrupt',
      validatorHarnessDetail: 'Validator harness failure — corrupt harness marker',
    };
  }
}
