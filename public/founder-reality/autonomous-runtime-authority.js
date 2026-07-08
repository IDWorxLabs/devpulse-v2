/**
 * Autonomous Runtime Authority V1 — Command Center operator visibility.
 */
(function initAutonomousRuntimeAuthority(global) {
  const STRIP_ID = 'runtime-authority-strip';

  function formatAge(ageMs) {
    if (!Number.isFinite(ageMs) || ageMs < 0) return 'unknown';
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  }

  function renderStrip(payload) {
    const strip = document.getElementById(STRIP_ID);
    if (!strip || !payload) return;
    const state = payload.state;
    if (!state) {
      strip.textContent = 'Runtime Authority: verifying…';
      strip.dataset.health = 'unknown';
      return;
    }
    const parts = [
      `Runtime ${state.health}`,
      `pid ${state.authoritativePid}`,
      `port ${state.port}`,
      `age ${formatAge(state.ageMs)}`,
      state.gitCommit ? `commit ${state.gitCommit}` : null,
      state.sourceFingerprint ? `fp ${state.sourceFingerprint}` : null,
      state.restartCount ? `restarts ${state.restartCount}` : null,
    ].filter(Boolean);
    strip.textContent = parts.join(' · ');
    strip.dataset.health = state.health;
    strip.title = [
      state.lastRecoveryReason ? `Last recovery: ${state.lastRecoveryReason}` : null,
      state.ready ? 'Authoritative runtime READY' : 'Runtime verification in progress',
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function refreshRuntimeAuthority() {
    try {
      const res = await fetch('/api/runtime/authority', { cache: 'no-store' });
      if (!res.ok) return null;
      const payload = await res.json();
      renderStrip(payload);
      if (global.RuntimeBannerTruthReconciliation && global.RuntimeBannerTruthReconciliation.normalizeRuntimeAuthorityPayload) {
        global.__runtimeAuthorityPayload = payload;
        if (typeof global.__applyRuntimeAuthorityBanner === 'function') {
          global.__applyRuntimeAuthorityBanner(payload);
        }
      }
      return payload;
    } catch {
      const strip = document.getElementById(STRIP_ID);
      if (strip) strip.textContent = 'Runtime Authority: unreachable';
    }
    return null;
  }

  global.AutonomousRuntimeAuthority = {
    refreshRuntimeAuthority,
    renderStrip,
  };

  refreshRuntimeAuthority();
  setInterval(refreshRuntimeAuthority, 15_000);
})(window);
