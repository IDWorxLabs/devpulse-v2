/**
 * Persistent Project Reality V1 — on-disk project workspace validator.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_PROJECT_FILE_INDEX_FILENAME,
  PROJECT_JSON_FILENAME,
  SOURCE_DIR,
  type PersistentProjectExportMetadata,
  type PersistentProjectFileIndex,
  type PersistentProjectRecord,
} from './persistent-project-reality-types.js';
import { persistentProjectPaths } from './persistent-project-reality-paths.js';
import type { ProjectRegistryRecord } from '../project-registry-v1/project-registry-v1-types.js';

export interface PersistentProjectRealityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function verifyPersistentProjectReality(input: {
  projectRootDir: string;
  projectId: string;
  manifest: GeneratedAppManifest;
  registryRecord?: ProjectRegistryRecord | null;
}): PersistentProjectRealityCheck[] {
  const checks: PersistentProjectRealityCheck[] = [];
  const paths = persistentProjectPaths(input.projectRootDir, input.projectId);

  function check(name: string, condition: boolean, detail: string): void {
    checks.push({ name, passed: condition, detail });
  }

  check('persistent project root exists', existsSync(paths.root), paths.root);
  check('project.json exists', existsSync(paths.projectJson), PROJECT_JSON_FILENAME);
  check('source root exists', existsSync(paths.source), SOURCE_DIR);
  check('package.json in source root', existsSync(join(paths.source, 'package.json')), 'package.json');
  check('src/ in source root', existsSync(join(paths.source, 'src')), 'src/');
  check('.aidev metadata dir exists', existsSync(paths.aidev), '.aidev');
  check(
    'metadata separate from source',
    existsSync(paths.aidev) && !existsSync(join(paths.source, '.aidev')),
    `${paths.aidev}`,
  );

  if (!existsSync(paths.projectJson)) {
    return checks;
  }

  const projectRecord = JSON.parse(readFileSync(paths.projectJson, 'utf8')) as PersistentProjectRecord;
  check('project.json has projectId', projectRecord.projectId === input.projectId, projectRecord.projectId);
  check(
    'project.json links manifest path',
    Boolean(projectRecord.manifestPath) && existsSync(join(input.projectRootDir, projectRecord.manifestPath)),
    projectRecord.manifestPath,
  );
  check(
    'project.json links build history when recorded',
    !input.manifest.buildHistoryRecorded ||
      (Boolean(projectRecord.buildHistoryRecordPath) &&
        existsSync(
          join(
            input.projectRootDir,
            (projectRecord.buildHistoryRecordPath ?? '').replace(/\\/g, '/'),
          ),
        )),
    projectRecord.buildHistoryRecordPath ?? 'none',
  );

  if (existsSync(paths.projectFileIndex)) {
    const fileIndex = JSON.parse(readFileSync(paths.projectFileIndex, 'utf8')) as PersistentProjectFileIndex;
    check(
      'project file index disk-backed',
      fileIndex.sourceFiles.length > 0 && Object.keys(fileIndex.fileHashes).length > 0,
      `${fileIndex.sourceFiles.length} source files`,
    );
    const sample = fileIndex.sourceFiles[0];
    if (sample) {
      const diskPath = join(paths.source, sample.relativePath.replace(/^source\//, ''));
      check('file index hash matches disk', existsSync(diskPath), diskPath);
    }
  } else {
    check('project file index exists', false, AIDEV_PROJECT_FILE_INDEX_FILENAME);
  }

  if (existsSync(paths.exportMetadata)) {
    const exportMeta = JSON.parse(readFileSync(paths.exportMetadata, 'utf8')) as PersistentProjectExportMetadata;
    const exportHonest =
      !exportMeta.exportReady ||
      (existsSync(join(paths.source, 'package.json')) && existsSync(join(paths.source, 'src')));
    check('export metadata accurate', exportHonest, String(exportMeta.exportReady));
  } else {
    check('export metadata exists', false, AIDEV_EXPORT_METADATA_FILENAME);
  }

  check(
    'manifest records persistent project reality',
    input.manifest.persistentProjectRealityStatus === 'PASS' &&
      input.manifest.persistentProjectId === input.projectId,
    input.manifest.persistentProjectRealityStatus ?? 'missing',
  );

  if (input.registryRecord) {
    check(
      'registry records persistent workspace path',
      Boolean(input.registryRecord.persistentWorkspacePath),
      input.registryRecord.persistentWorkspacePath ?? 'missing',
    );
    check(
      'registry records source root',
      Boolean(input.registryRecord.sourceRoot),
      input.registryRecord.sourceRoot ?? 'missing',
    );
  }

  const tempOnly =
    existsSync(join(input.projectRootDir, '.generated-builder-workspaces', input.projectId, 'package.json')) &&
    !existsSync(join(paths.source, 'package.json'));
  check('source not only in temporary build workspace', !tempOnly, 'persistent source required');

  return checks;
}

export function persistentProjectWorkspaceExists(projectRootDir: string, projectId: string): boolean {
  const paths = persistentProjectPaths(projectRootDir, projectId);
  return (
    existsSync(paths.projectJson) &&
    existsSync(join(paths.source, 'package.json')) &&
    existsSync(join(paths.source, 'src'))
  );
}
