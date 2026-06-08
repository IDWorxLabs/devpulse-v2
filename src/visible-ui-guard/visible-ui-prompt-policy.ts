/**
 * Future prompt policy — physical UI surfaces must declare guard requirements.
 */

export type VisibleUiPromptValidationResult = {
  valid: boolean;
  uiSurfaceDetected: boolean;
  missingRequirements: string[];
  warnings: string[];
};

const UI_SURFACE_WORDS =
  /\b(panel|button|card|form|input|approval|preview|toolbar|menu|drawer|modal|tab|control)\b/i;

const REQUIRED_PATTERNS: readonly { key: string; pattern: RegExp }[] = [
  { key: 'visible UI registration', pattern: /visible ui registration|register visible ui|visible_ui/i },
  { key: 'owner system id', pattern: /owner system id|ownersystemid|ownerSystemId/i },
  { key: 'mount target', pattern: /mount target|mountTarget|mount_target/i },
  { key: 'expected selector', pattern: /expected selector|expectedSelector|expected_selector/i },
  { key: 'browser visibility check', pattern: /browser visibility|visibility check|visible in browser/i },
  {
    key: 'clickability check',
    pattern: /clickability check|clickable proof|clickability proof|prove.*click/i,
  },
  { key: 'report entry', pattern: /report entry|guard report|ui guard report/i },
];

export function validatePromptHasVisibleUiRequirements(
  promptText: string,
): VisibleUiPromptValidationResult {
  const warnings: string[] = [];
  const missingRequirements: string[] = [];
  const uiSurfaceDetected = UI_SURFACE_WORDS.test(promptText);

  if (!uiSurfaceDetected) {
    return {
      valid: true,
      uiSurfaceDetected: false,
      missingRequirements: [],
      warnings: ['No physical UI surface keywords detected — guard requirements optional.'],
    };
  }

  for (const req of REQUIRED_PATTERNS) {
    if (!req.pattern.test(promptText)) {
      missingRequirements.push(req.key);
    }
  }

  const mentionsInteractive =
    /\b(button|input|approval|control|form submit|clickable)\b/i.test(promptText);
  if (mentionsInteractive && !/clickability check|clickable proof|clickability proof/i.test(promptText)) {
    if (!missingRequirements.includes('clickability check')) {
      missingRequirements.push('clickability check');
    }
  }

  if (missingRequirements.length > 0) {
    warnings.push(
      'Prompt creates UI surface but missing Visible UI Guard requirements — panels may not surface or be clickable.',
    );
  }

  return {
    valid: missingRequirements.length === 0,
    uiSurfaceDetected: true,
    missingRequirements,
    warnings,
  };
}
