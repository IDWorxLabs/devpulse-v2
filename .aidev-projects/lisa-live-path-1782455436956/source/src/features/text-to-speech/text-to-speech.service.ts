/** Service adapter for text-to-speech — LISA — Locked In Syndrome App */
import type { TextToSpeechRecord } from './text-to-speech.types';

const DEMO_TEXT_TO_SPEECH_RECORDS: TextToSpeechRecord[] = [
  { id: 'text-to-speech-1', label: 'Sample Text To Speech record', createdAt: new Date().toISOString() },
  { id: 'text-to-speech-2', label: 'Text To Speech preview entry', createdAt: new Date().toISOString() },
];

export function listTextToSpeechRecords(): TextToSpeechRecord[] {
  return DEMO_TEXT_TO_SPEECH_RECORDS;
}
