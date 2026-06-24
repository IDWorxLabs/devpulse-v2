/**
 * Validation Runtime Audit V1 — validator registry from package.json + scripts/.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ValidatorRegistryEntry {
  validatorName: string;
  scriptPath: string;
  scriptFile: string;
  registeredInPackageJson: boolean;
  packageCommand: string | null;
}

export function loadPackageValidateScripts(projectRootDir: string): Map<string, string> {
  const pkgPath = join(projectRootDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const map = new Map<string, string>();
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    if (name.startsWith('validate:')) {
      map.set(name, command);
    }
  }
  return map;
}

export function buildValidatorRegistry(projectRootDir: string): readonly ValidatorRegistryEntry[] {
  const scriptsDir = join(projectRootDir, 'scripts');
  const packageScripts = loadPackageValidateScripts(projectRootDir);
  const scriptFiles = readdirSync(scriptsDir).filter(
    (f) => f.startsWith('validate-') && f.endsWith('.ts'),
  );

  const byFile = new Map<string, ValidatorRegistryEntry>();

  for (const scriptFile of scriptFiles) {
    const scriptPath = join(scriptsDir, scriptFile);
    const baseName = scriptFile.replace(/^validate-/, '').replace(/\.ts$/, '');
    const validatorName = `validate:${baseName}`;

    byFile.set(scriptFile, {
      validatorName,
      scriptPath,
      scriptFile,
      registeredInPackageJson: packageScripts.has(validatorName),
      packageCommand: packageScripts.get(validatorName) ?? null,
    });
  }

  for (const [validatorName, command] of packageScripts) {
    const match = command.match(/scripts\/(validate-[^.]+\.ts)/);
    const scriptFile = match?.[1];
    if (scriptFile && byFile.has(scriptFile)) {
      continue;
    }
    const inferredFile = `validate-${validatorName.replace('validate:', '')}.ts`;
    const scriptPath = join(scriptsDir, inferredFile);
    if (!byFile.has(inferredFile) && existsSync(scriptPath)) {
      byFile.set(inferredFile, {
        validatorName,
        scriptPath,
        scriptFile: inferredFile,
        registeredInPackageJson: true,
        packageCommand: command,
      });
    } else if (!scriptFile) {
      byFile.set(`__pkg__${validatorName}`, {
        validatorName,
        scriptPath: scriptFile ? join(scriptsDir, scriptFile) : scriptPath,
        scriptFile: scriptFile ?? inferredFile,
        registeredInPackageJson: true,
        packageCommand: command,
      });
    }
  }

  return [...byFile.values()].sort((a, b) => a.validatorName.localeCompare(b.validatorName));
}
