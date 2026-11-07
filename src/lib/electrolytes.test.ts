import { describe, it, expect } from 'vitest';
import {
  hypoKSeverity, kDeficitRange, kclEmpiricPlan, kAtNormalPh, hyperKSeverity, kProtocol24h,
  correctedCalcium, caMgdlToMmol, caGluconateInfusion, hyperCaSeverity,
  mgMgdlToMeq, mgso4DoseToTarget, mgMaxDoseGrams, mgInfusionHours, mgInfusionAfterBolus,
} from './electrolytes';
import { hypoNaRiseLimits, computeNa, serumOsmolality, tonicityClass, naTonicity, ureumToBun, hypoDaysToNa, glucoseCorrectedNa } from './sodium';

describe('Kalium — hipokalemia', () => {
  it('klasifikasi keparahan (Kardalas 2018)', () => {
    expect(hypoKSeverity(2.4)).toBe('berat');
    expect(hypoKSeverity(2.5)).toBe('sedang');
    expect(hypoKSeverity(2.9)).toBe('sedang');
    expect(hypoKSeverity(3.0)).toBe('ringan');
  });

  it('defisit 200–400 mEq per 1 mEq/L, skala BB/70', () => {
    // K 3.0 → 4.0, 70 kg: Δ1 → 200–400 mEq
    const a = kDeficitRange(3.0, 4.0, 70);
    expect(a.delta).toBeCloseTo(1);
    expect(a.lo).toBeCloseTo(200);
    expect(a.hi).toBeCloseTo(400);
    // K 2.8 → 4.0, 35 kg: Δ1.2 × 0.5 → 120–240 mEq
    const b = kDeficitRange(2.8, 4.0, 35);
    expect(b.lo).toBeCloseTo(120);
    expect(b.hi).toBeCloseTo(240);
    // target ≤ aktual → 0
    expect(kDeficitRange(4.2, 4.0, 70).hi).toBe(0);
  });

  it('rencana empiris KCl: 20 mEq ≈ +0.25 (Kruse 1990)', () => {
    expect(kclEmpiricPlan(3.0, 4.0)).toEqual({ delta: 1, doses20: 4, totalMeq: 80 });
    expect(kclEmpiricPlan(3.2, 4.0).doses20).toBe(4); // 0.8/0.25 = 3.2 → 4
    expect(kclEmpiricPlan(3.5, 4.0).doses20).toBe(2); // tepat 2, bukan 3 (galat float)
    expect(kclEmpiricPlan(3.7, 4.0).doses20).toBe(2); // 0.3/0.25 = 1.2 → 2
    expect(kclEmpiricPlan(4.1, 4.0).doses20).toBe(0);
  });

  it('protokol 24 jam: 0.4 × ΔK × BB + rumatan 1 mEq/kg/hari', () => {
    // K 2.8 → 4.0, 70 kg: 0.4 × 1.2 × 70 = 33.6 + 70 = 103.6 → paket 100 mEq (4.17 mEq/jam)
    const a = kProtocol24h(2.8, 4.0, 70);
    expect(a.deficit).toBeCloseTo(33.6);
    expect(a.maint).toBe(70);
    expect(a.raw).toBeCloseTo(103.6);
    expect(a.rounded).toBe(100);
    expect(a.ratePerHr).toBeCloseTo(4.167, 2);
    // 50 kg, K 3.2 → 4.0: 16 + 50 = 66 → 50
    expect(kProtocol24h(3.2, 4.0, 50).rounded).toBe(50);
    // tanpa rumatan, defisit kecil → minimal satu paket 50
    expect(kProtocol24h(3.2, 4.0, 70, undefined, 0).raw).toBeCloseTo(22.4);
    expect(kProtocol24h(3.2, 4.0, 70, undefined, 0).rounded).toBe(50);
    // K ≥ target, tanpa rumatan → 0
    expect(kProtocol24h(4.2, 4.0, 70, undefined, 0).rounded).toBe(0);
  });

  it('K pada pH dinormalkan (~0.6 per 0.1 pH)', () => {
    expect(kAtNormalPh(6.0, 7.2)).toBeCloseTo(4.8);
    expect(kAtNormalPh(3.0, 7.5)).toBeCloseTo(3.6);
  });
});

describe('Kalium — hiperkalemia', () => {
  it('klasifikasi keparahan', () => {
    expect(hyperKSeverity(5.4)).toBe('batas');
    expect(hyperKSeverity(5.5)).toBe('ringan');
    expect(hyperKSeverity(6.0)).toBe('sedang');
    expect(hyperKSeverity(6.4)).toBe('sedang');
    expect(hyperKSeverity(6.5)).toBe('berat');
  });
});

describe('Kalsium', () => {
  it('Ca terkoreksi albumin & konversi', () => {
    expect(correctedCalcium(7.0, 2.0)).toBeCloseTo(8.6);
    expect(caMgdlToMmol(7.6)).toBeCloseTo(1.896, 2); // ambang berat SfE ≈ 1.9 mmol/L
  });

  it('infus rumatan SfE: 100 mL Ca glukonat 10% / 1100 mL', () => {
    const lo = caGluconateInfusion(50, 70);
    expect(lo.concMgPerMl).toBeCloseTo(0.8455, 3);
    expect(lo.mgPerHr).toBeCloseTo(42.27, 1);
    expect(lo.mgPerKgPerHr).toBeCloseTo(0.604, 2);
    expect(caGluconateInfusion(100, 70).mgPerKgPerHr).toBeCloseTo(1.208, 2);
  });

  it('keparahan hiperkalsemia (SfE 2016)', () => {
    expect(hyperCaSeverity(11.9)).toBe('ringan');
    expect(hyperCaSeverity(12.1)).toBe('sedang');
    expect(hyperCaSeverity(14.1)).toBe('berat');
  });
});

describe('Magnesium', () => {
  it('konversi mg/dL → mEq/L', () => {
    expect(mgMgdlToMeq(1.2)).toBeCloseTo(0.9875, 3);
    expect(mgMgdlToMeq(2.0)).toBeCloseTo(1.6458, 3);
  });

  it('dosis MgSO₄ ke target (1 g ≈ +0.15 mEq/L, Hansen 2018)', () => {
    // Mg 1.2 → 2.0 mg/dL: Δ0.658 mEq/L ÷ 0.15 = 4.39 g → dibulatkan 4.5 g
    const a = mgso4DoseToTarget(1.2, 2.0, 70);
    expect(a.rawGrams).toBeCloseTo(4.389, 2);
    expect(a.grams).toBe(4.5);
    expect(a.capped).toBe(false);
    // Mg 0.5 → 2.2, 40 kg: 9.33 g → 9.5 g > batas 1.5 mEq/kg (7.39 g) → dibatasi 7.0 g
    const b = mgso4DoseToTarget(0.5, 2.2, 40);
    expect(b.capped).toBe(true);
    expect(b.grams).toBe(7);
    expect(mgMaxDoseGrams(70)).toBeCloseTo(12.93, 1);
    expect(mgso4DoseToTarget(2.1, 2.0, 70).grams).toBe(0);
  });

  it('durasi infus', () => {
    expect(mgInfusionHours(4.5)).toEqual({ min: 8, max: 12 });
    expect(mgInfusionHours(6)).toEqual({ min: 25, max: null });
  });
});

describe('Natrium — batas kenaikan hiponatremia', () => {
  it('risiko ODS normal vs tinggi (Verbalis 2013; Spasovski 2014)', () => {
    expect(hypoNaRiseLimits(false)).toEqual({ goalLo: 4, goalHi: 8, limit24: 10, limitNext24: 8 });
    expect(hypoNaRiseLimits(true)).toEqual({ goalLo: 4, goalHi: 6, limit24: 8, limitNext24: 8 });
  });
});

describe('Natrium — computeNa (hitung manual)', () => {
  const base = { glucose: NaN, sex: 'm' as const, age: NaN, onset: 'kronik', fluidId: 'd5w', odsRiskFactors: 0, riseTarget: 6, hyperTargetNa: 140, hyperDropPer24: 10 };
  it('hiponatremia: 60 kg pria, Na 118, target +6', () => {
    const r = computeNa({ ...base, weightKg: 60, na: 118 });
    if (!r || r.type !== 'hipo') throw new Error('harus hipo');
    expect(r.tbw).toBeCloseTo(36);
    expect(r.tgt).toBeCloseTo(124);
    expect(r.deficit).toBeCloseTo(216);          // 36 × 6
    expect(r.v).toBeCloseTo(421.05, 1);          // 216 ÷ 513 × 1000
    expect(r.amPerLiter).toBeCloseTo(10.676, 2); // (513 − 118) ÷ 37
    expect(r.vAM).toBeCloseTo(562.0, 0);         // 6 ÷ 10.676 × 1000
    expect(r.totalDeficit).toBeCloseTo(792);     // 36 × (140 − 118)
    expect(r.daysTo140).toBe(4);                 // ⌈22 ÷ 6⌉
  });
  it('hiponatremia: faktor risiko ODS → batas 8', () => {
    const r = computeNa({ ...base, weightKg: 60, na: 118, odsRiskFactors: 1, riseTarget: 10 });
    if (!r || r.type !== 'hipo') throw new Error('harus hipo');
    expect(r.lim.limit24).toBe(8);
    expect(r.riseOverLimit).toBe(true);
  });
  it('hipernatremia: 70 kg pria, Na 160 → 140, D5W, batas 10/24 jam', () => {
    const r = computeNa({ ...base, weightKg: 70, na: 160 });
    if (!r || r.type !== 'hiper') throw new Error('harus hiper');
    expect(r.deficit).toBeCloseTo(6.0);          // 42 × (160/140 − 1)
    expect(r.targetDrop).toBe(10);
    expect(r.days).toBe(2);
    expect(r.dNaPerL).toBeCloseTo(-3.721, 2);    // (0 − 160) ÷ 43
    expect(r.volForTarget).toBeCloseTo(2.6875, 3);
    expect(r.rateMlHr).toBeCloseTo(111.98, 1);
  });
  it('koreksi glukosa & normal', () => {
    const r = computeNa({ ...base, weightKg: 70, na: 132, glucose: 600 });
    expect(r?.type).toBe('normal');              // 132 + 1.6 × 5 = 140
    expect(r?.calcN).toBeCloseTo(140);
    expect(computeNa({ ...base, weightKg: 0, na: 120 })).toBeNull();
  });
});

describe('Osmolalitas serum (Na) — hitung manual', () => {
  it('total & efektif dari ureum (÷6) dan BUN (÷2.8)', () => {
    const a = serumOsmolality(118, 110, 40);           // 236 + 6.11 + 6.67
    expect(a.effective).toBeCloseTo(242.11, 1);
    expect(a.total).toBeCloseTo(248.78, 1);
    expect(serumOsmolality(140, 90, 14, 'bun').total).toBeCloseTo(290); // 280 + 5 + 5
    expect(ureumToBun(60)).toBeCloseTo(28);
    expect(serumOsmolality(130, NaN, 30).effective).toBeNaN(); // glukosa kosong → tidak ditebak
  });
  it('uremia: total tampak normal tetapi efektif hipotonik', () => {
    const u = serumOsmolality(128, 100, 180);          // 256 + 5.56 (+ 30)
    expect(u.total).toBeCloseTo(291.56, 1);
    expect(tonicityClass(u.total)).toBe('isotonik');
    expect(tonicityClass(u.effective)).toBe('hipotonik');
  });
  it('ambang tonisitas', () => {
    expect(tonicityClass(274.9)).toBe('hipotonik');
    expect(tonicityClass(275)).toBe('isotonik');
    expect(tonicityClass(295)).toBe('isotonik');
    expect(tonicityClass(295.1)).toBe('hipertonik');
  });
  it('status: pseudo, terukur, terhitung', () => {
    // Na gas darah (direct ISE) sudah normal → curiga pseudo
    expect(naTonicity(119, 100, 30, 'ureum', NaN, 137).status).toBe('curiga-pseudo');
    // El Hage 2018: Na lab 119 vs direct 132 → selisih 13 ditampilkan; status tetap dari osmolalitas
    const e = naTonicity(119, 100, 30, 'ureum', NaN, 132);
    expect(e.naDiff).toBe(13);
    expect(e.status).toBe('kemungkinan-hipotonik');
    // osm terukur 283 → efektif ≈ 283 − 5 = 278 → bukan hipotonik; gap = 283 − 248.56 = 34.4
    const m = naTonicity(119, 100, 30, 'ureum', 283, NaN);
    expect(m.status).toBe('bukan-hipotonik');
    expect(m.gap).toBeCloseTo(34.44, 1);
    // osm terukur 260 → pasti hipotonik, mengalahkan tanda pseudo
    expect(naTonicity(119, 100, 30, 'ureum', 260, 132).status).toBe('pasti-hipotonik');
    // hanya terhitung
    expect(naTonicity(118, 110, 40, 'ureum', NaN, NaN).status).toBe('kemungkinan-hipotonik');
    expect(naTonicity(130, 900, 40, 'ureum', NaN, NaN).status).toBe('bukan-hipotonik'); // hiperglikemia: 260 + 50
  });
});

describe('Audit — perbaikan', () => {
  it('hari ke Na 140 memperhitungkan batas hari ke-2 dst. (8/24 jam)', () => {
    const lim = { limit24: 10, limitNext24: 8 };
    expect(hypoDaysToNa(110, 10, lim)).toBe(4);   // 10 + 8 + 8 = 26 < 30 → hari ke-4
    expect(hypoDaysToNa(120.4, 10, lim)).toBe(3); // 19.6: 10 + 8 = 18 → hari ke-3
    expect(hypoDaysToNa(118, 6, lim)).toBe(4);    // 22: 6+6+6 = 18 → 4
    expect(hypoDaysToNa(132, 10, lim)).toBe(1);
    expect(hypoDaysToNa(118, 8, { limit24: 8, limitNext24: 8 })).toBe(3); // 22: 8+8+8
  });
  it('koreksi glukosa: 1.6 (Katz) + pembanding Hillier 2.4 / 4.0', () => {
    const g = glucoseCorrectedNa(125, 600);       // x = 5
    expect(g.value).toBeCloseTo(133);
    expect(g.hillier24).toBeCloseTo(137);
    expect(g.hillier40).toBeCloseTo(145);
  });
  it('Mg: bolus 2 g + infus tidak melampaui 1.5 mEq/kg', () => {
    // 40 kg: batas 7.39 g; kebutuhan 7.0 g → infus maks 5.0 g (7.39 − 2 = 5.39 → 5.0)
    const a = mgInfusionAfterBolus(7.0, mgMaxDoseGrams(40), true, true);
    expect(a.infusion).toBe(5);
    expect(a.total).toBe(7);
    expect(a.reducedForCap).toBe(true);
    // 70 kg, kebutuhan 4.5 g → tetap 4.5 g + bolus 2 g = 6.5 ≤ 12.9
    expect(mgInfusionAfterBolus(4.5, mgMaxDoseGrams(70), true, true)).toEqual({ infusion: 4.5, total: 6.5, reducedForCap: false });
    expect(mgInfusionAfterBolus(4.5, mgMaxDoseGrams(70), false, true).total).toBe(4.5);
  });
});
