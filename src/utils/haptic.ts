/* ============================================================
   ACLS Helper — Haptic feedback via navigator.vibrate
   No-op di desktop & browser yang tidak support.
   ============================================================ */

let _enabled = true;

const v = (pattern: number | number[]): void => {
  if (!_enabled) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (_) {}
};

export const haptic = {
  setEnabled: (val: boolean): void => { _enabled = !!val; },
  isEnabled: () => _enabled,

  shock:      () => v(120),
  epi:        () => v([50, 30, 50]),
  amio:       () => v([60, 40, 60, 40, 60]),
  pulseTick:  () => v(15),
  pulseEnd:   () => v([100, 50, 200]),
  cycleEnd:   () => v([200, 80, 200]),
  epiDue:     () => v([100, 60, 100, 60, 100]),
  rosc:       () => v([60, 40, 60, 40, 60, 40, 120]),
  monitorOn:  () => v(40),
};
