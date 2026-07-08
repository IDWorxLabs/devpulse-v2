/** Service adapter for auth — LISA — Locked In Syndrome App */
import type { AuthRecord } from './auth.types';

const DEMO_AUTH_RECORDS: AuthRecord[] = [
  { id: 'auth-1', label: 'Sample Auth record', createdAt: new Date().toISOString() },
  { id: 'auth-2', label: 'Auth preview entry', createdAt: new Date().toISOString() },
];

export function listAuthRecords(): AuthRecord[] {
  return DEMO_AUTH_RECORDS;
}
