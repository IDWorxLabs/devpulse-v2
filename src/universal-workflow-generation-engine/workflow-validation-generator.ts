/** Universal Workflow Generation Engine V1 — validation helpers */
export function validationBeforeTransition(eventType: string): boolean {
  return ['SUBMIT', 'COMPLETE', 'NEXT', 'APPROVE', 'REJECT'].includes(eventType);
}
