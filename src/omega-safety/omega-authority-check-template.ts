/**
 * OMEGA authority check template — pre-implementation safety checklist.
 */

export function formatOmegaAuthorityCheckTemplate(): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  OMEGA AUTHORITY CHECK');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push('1. What system does this prompt build?');
  lines.push('2. What authority owns it?');
  lines.push('3. Does it change any existing authority?');
  lines.push('4. Does it change answer authority?');
  lines.push('5. Does it change startup path?');
  lines.push('6. Does it create execution?');
  lines.push('7. Does it create AI/autonomy?');
  lines.push('8. Does it create connect modules?');
  lines.push('9. Does it use Task Governor where needed?');
  lines.push('10. What validation mode is required?');
  lines.push('11. Is this one authority, one capability wave, or one vertical slice?');
  lines.push('');
  lines.push('Rule: One OMEGA prompt = one system authority.');
  lines.push('Default validation: FAST_FEATURE_CHECK + typecheck.');
  lines.push('───────────────────────────────────────────────────');

  return lines.join('\n');
}
