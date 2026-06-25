/**
 * Shared runtime files for universal generated apps.
 */

import type { GeneratedWorkspaceFile } from './code-generation-engine-types.js';

export function buildSharedRuntimeFiles(contractId: string, appTitle = 'Generated App'): GeneratedWorkspaceFile[] {
  const title = appTitle.replace(/</g, '');
  return [
    {
      relativePath: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      relativePath: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: false },
});
`,
    },
    {
      relativePath: 'tsconfig.json',
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: 'force',
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'tsconfig.node.json',
      content: `${JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler' }, include: ['vite.config.ts'] }, null, 2)}\n`,
    },
    { relativePath: 'src/vite-env.d.ts', content: `/// <reference types="vite/client" />\n` },
    {
      relativePath: 'src/main.tsx',
      content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    },
  ];
}
