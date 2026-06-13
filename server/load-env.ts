/**
 * Phase 26.1 — Load .env into process.env before any LLM provider reads run.
 * This module must be imported first in server/founder-reality-server.ts.
 */

import dotenv from 'dotenv';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

dotenv.config({ path: join(ROOT_DIR, '.env') });
