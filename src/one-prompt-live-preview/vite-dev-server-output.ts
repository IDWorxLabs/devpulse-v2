/**
 * Strip ANSI escape codes from terminal output.
 */
export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Parse Vite dev server URL from npm/vite stdout or stderr.
 */
export function parseViteDevServerUrl(output: string): { port: number; url: string } | null {
  const cleaned = stripAnsi(output);
  const match = cleaned.match(
    /Local:\s+(https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):(\d+)(?:\/[^\s]*)?)/i,
  );
  if (!match) return null;

  const port = Number(match[2]);
  if (!Number.isFinite(port) || port <= 0) return null;

  let url = match[1];
  if (!url.endsWith('/')) url += '/';
  url = url.replace(/\/\/localhost/i, '//127.0.0.1').replace(/\/\/\[::1\]/i, '//127.0.0.1');
  return { port, url };
}

export function summarizeDevServerStartupFailure(stdout: string, stderr: string): string {
  const combined = stripAnsi(`${stdout}\n${stderr}`).trim();
  if (!combined) return 'Dev server failed to start — no output captured';

  const portBusy = /Port \d+ is in use/i.test(combined);
  const viteReady = /VITE.*ready in/i.test(combined);
  const parsed = parseViteDevServerUrl(combined);

  if (viteReady && !parsed) {
    return 'Vite reported ready but Live Preview URL could not be parsed from dev server output';
  }
  if (portBusy && !parsed) {
    return 'Dev server ports were busy and no reachable preview URL was detected';
  }

  const lastLine =
    combined
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .pop() ?? 'Dev server failed to start';

  return lastLine.length > 240 ? `${lastLine.slice(0, 237)}...` : lastLine;
}
