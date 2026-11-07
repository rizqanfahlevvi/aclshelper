// Checklist penerimaan (angka = hitung manual) — dikunci sebagai tes agar
// perubahan rumus di masa depan langsung ketahuan.
import { describe, it, expect } from 'vitest';
import { kProtocol24h, kclEmpiricPlan, kDeficitRange, kAtNormalPh, correctedCalcium, mgso4DoseToTarget, mgInfusionAfterBolus, mgInfusionHours } from './electrolytes';
import { computeNa, naTonicity, glucoseCorrectedNa } from './sodium';

const NA_BASE = { onset: 'kronik', fluidId: 'd5w', odsRiskFactors: 0, hyperTargetNa: 140, hyperDropPer24: 10 } as const;

describe('Checklist penerimaan — Kalium', () => {
  it('70 kg, K 2.8 → 4.0: defisit 33.6 + rumatan 70 = 103.6 → paket 100 mEq (4.17 mEq/jam)', () => {
    const p = kProtocol24h(2.8, 4.0, 70);
    expect(p.deficit).toBeCloseTo(33.6, 5);
    expect(p.maint).toBe(70);
    expect(p.raw).toBeCloseTo(103.6, 5);
    expect(p.rounded).toBe(100);
    expect(p.ratePerHr.toFixed(2)).toBe('4.17');
  });
  it('empiris 100 mEq (5 × 20), sesi 1 = 40 mEq, defisit tubuh 240–480', () => {
    const e = kclEmpiricPlan(2.8, 4.0);
    expect(e.doses20).toBe(5);
    expect(e.totalMeq).toBe(100);
    expect(Math.min(e.totalMeq, 40)).toBe(40);
    const d = kDeficitRange(2.8, 4.0, 70);
    expect(d.lo).toBeCloseTo(240, 5);
    expect(d.hi).toBeCloseTo(480, 5);
  });
  it('pH 7.30 → K pada pH 7.40 ≈ 2.20', () => {
    expect(kAtNormalPh(2.8, 7.3).toFixed(2)).toBe('2.20');
  });
});

describe('Checklist penerimaan — Natrium', () => {
  it('hipo 60 kg pria, Na 118, GDS 110, ureum 40, +6', () => {
    const r = computeNa({ ...NA_BASE, weightKg: 60, na: 118, glucose: 110, sex: 'm', age: NaN, riseTarget: 6, urea: 40, ureaUnit: 'ureum' });
    if (!r || r.type !== 'hipo') throw new Error('harus hipo');
    expect(r.calcN.toFixed(1)).toBe('118.2');
    expect(r.tbw).toBeCloseTo(36, 5);
    expect(r.deficit.toFixed(0)).toBe('216');
    expect(r.v.toFixed(0)).toBe('421');
    expect(r.vAM.toFixed(0)).toBe('562');
    expect(r.totalDeficit.toFixed(0)).toBe('786');
    expect(r.daysTo140).toBe(4);
    expect(r.osm.effective.toFixed(1)).toBe('242.1');
    expect(r.osm.total.toFixed(1)).toBe('248.8');
    expect(r.osm.status).toBe('kemungkinan-hipotonik');
  });
  it('Na 110, target +10 → ≥4 hari (bukan 3)', () => {
    const r = computeNa({ ...NA_BASE, weightKg: 70, na: 110, glucose: NaN, sex: 'm', age: NaN, riseTarget: 10 });
    if (!r || r.type !== 'hipo') throw new Error('harus hipo');
    expect(r.daysTo140).toBe(4);
    expect(r.riseOverLimit).toBe(false);
  });
  it('uremia Na 128, GDS 100, ureum 180 → total 291.6 tetapi efektif 261.6 (hipotonik)', () => {
    const o = naTonicity(128, 100, 180, 'ureum', NaN, NaN);
    expect(o.total.toFixed(1)).toBe('291.6');
    expect(o.effective.toFixed(1)).toBe('261.6');
    expect(o.calcClass).toBe('hipotonik');
  });
  it('pseudo: Na lab 119, Na gas darah 137 → curiga pseudohiponatremia', () => {
    expect(naTonicity(119, 100, NaN, 'ureum', NaN, 137).status).toBe('curiga-pseudo');
  });
  it('glukosa: Na 125, GDS 600 → 133 (1.6) · 137 (2.4) · 145 (4.0)', () => {
    const g = glucoseCorrectedNa(125, 600);
    expect(g.value).toBeCloseTo(133, 5);
    expect(g.hillier24).toBeCloseTo(137, 5);
    expect(g.hillier40).toBeCloseTo(145, 5);
  });
  it('hiper 70 kg pria, Na 160 → 6.00 L; D5W 2.69 L/24 jam ≈ 112 mL/jam', () => {
    const r = computeNa({ ...NA_BASE, weightKg: 70, na: 160, glucose: NaN, sex: 'm', age: NaN, riseTarget: 6 });
    if (!r || r.type !== 'hiper') throw new Error('harus hiper');
    expect(r.deficit.toFixed(2)).toBe('6.00');
    expect(r.volForTarget?.toFixed(2)).toBe('2.69');
    expect(r.rateMlHr?.toFixed(0)).toBe('112');
  });
});

describe('Checklist penerimaan — Kalsium & Magnesium', () => {
  it('Ca 6.8 / albumin 2.5 → 8.00', () => {
    expect(correctedCalcium(6.8, 2.5).toFixed(2)).toBe('8.00');
  });
  it('Mg 1.0 → 2.0, 70 kg → 5.5 g (27.5 mL MgSO₄ 20%), 8–12 jam', () => {
    const d = mgso4DoseToTarget(1.0, 2.0, 70);
    expect(d.grams).toBe(5.5);
    expect(d.grams / 0.2).toBeCloseTo(27.5, 5);
    expect(mgInfusionHours(d.grams)).toEqual({ min: 8, max: 12 });
  });
  it('40 kg, Mg 0.5 + aritmia → bolus 2 + infus 5 = total 7 g', () => {
    const d = mgso4DoseToTarget(0.5, 2.0, 40);
    const p = mgInfusionAfterBolus(d.grams, d.maxGrams, true, true);
    expect(p.infusion).toBe(5);
    expect(p.total).toBe(7);
  });
});
