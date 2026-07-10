import { describe, it, expect } from 'vitest';
import { palsDose, infusionConc, infusionRateMlHr } from './doseMath';

describe('palsDose (dosis pediatrik + clamp)', () => {
  it('epinefrin 0.01 mg/kg × 20 kg = 0.2 mg', () => {
    expect(palsDose(0.01, 20, undefined, 1).clamped).toBeCloseTo(0.2, 5);
  });
  it('dibatasi ke maks (epinefrin 0.01×150 = 1.5 → cap 1 mg)', () => {
    const r = palsDose(0.01, 150, undefined, 1);
    expect(r.clamped).toBe(1);
    expect(r.isClamped).toBe(true);
  });
  it('dibatasi ke minimum (atropin 0.02×3 = 0.06 → min 0.1)', () => {
    const r = palsDose(0.02, 3, 0.1, 1);
    expect(r.clamped).toBe(0.1);
    expect(r.isClamped).toBe(true);
  });
  it('tanpa clamp bila di dalam rentang', () => {
    expect(palsDose(2, 25).isClamped).toBe(false); // defibrilasi 2 J/kg
  });
});

describe('infusionConc', () => {
  it('4 mg / 50 mL = 80 mcg/mL', () => expect(infusionConc(4, 50, 'mg')).toBe(80));
  it('20 unit / 50 mL = 0.4 unit/mL', () => expect(infusionConc(20, 50, 'unit')).toBe(0.4));
  it('volume 0 → 0 (hindari bagi nol)', () => expect(infusionConc(4, 0, 'mg')).toBe(0));
});

describe('infusionRateMlHr', () => {
  it('norepi 0.1 mcg/kg/min, 70 kg, konsentrasi 80 mcg/mL → 5.25 mL/jam', () => {
    // (0.1×70)/80 ×60 = 5.25
    expect(infusionRateMlHr(0.1, 70, 80, true)).toBeCloseTo(5.25, 4);
  });
  it('non-per-kg (mcg/min): fenilefrin 100 mcg/min, konsentrasi 200 mcg/mL → 30 mL/jam', () => {
    expect(infusionRateMlHr(100, 999, 200, false)).toBeCloseTo(30, 4);
  });
  it('vasopressin unit/min: 0.03 U/min, konsentrasi 0.4 U/mL → 4.5 mL/jam', () => {
    expect(infusionRateMlHr(0.03, 1, 0.4, false)).toBeCloseTo(4.5, 4);
  });
  it('konsentrasi 0 → 0', () => expect(infusionRateMlHr(0.1, 70, 0, true)).toBe(0));
});
