/** Service adapter for emergency-speech — LISA — Locked In Syndrome App */
import type { EmergencySpeechRecord } from './emergency-speech.types';

const DEMO_EMERGENCY_SPEECH_RECORDS: EmergencySpeechRecord[] = [
  { id: 'emergency-speech-1', label: 'Sample Emergency Speech record', createdAt: new Date().toISOString() },
  { id: 'emergency-speech-2', label: 'Emergency Speech preview entry', createdAt: new Date().toISOString() },
];

export function listEmergencySpeechRecords(): EmergencySpeechRecord[] {
  return DEMO_EMERGENCY_SPEECH_RECORDS;
}
