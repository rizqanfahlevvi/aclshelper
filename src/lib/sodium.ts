// Util perhitungan natrium (fungsi murni, mudah dites).
// Rujukan: Adrogué HJ, Madias NE. Hypernatremia. NEJM 2000;342:1493 ·
// Sterns RH. NEJM 2015;372:55 · Miller NE, et al. Am Fam Physician 2023;108:476.

/**
 * Fraksi Total Body Water (TBW) berbasis jenis kelamin & usia (Adrogué–Madías).
 * Pria dewasa 0.60 · wanita dewasa / pria lansia 0.50 · wanita lansia 0.45.
 * Ambang lansia = 65 tahun. Bila usia tidak diisi (NaN) → diperlakukan dewasa.
 */
export function tbwFactor(sex: 'm' | 'f', ageYears: number): number {
  const elderly = ageYears >= 65;
  if (sex === 'm') return elderly ? 0.5 : 0.6;
  return elderly ? 0.45 : 0.5;
}

/** Total Body Water (liter) = BB(kg) × faktor TBW. */
export function totalBodyWater(weightKg: number, sex: 'm' | 'f', ageYears: number): number {
  return weightKg * tbwFactor(sex, ageYears);
}

/**
 * Defisit air bebas (liter) pada hipernatremia.
 * Defisit = TBW × (Na aktual ÷ Na target − 1). Na target default 140.
 */
export function freeWaterDeficit(tbwL: number, currentNa: number, targetNa = 140): number {
  return tbwL * (currentNa / targetNa - 1);
}

/**
 * Adrogué–Madías: perubahan Na serum (mEq/L) akibat pemberian 1 L infusat.
 * ΔNa/L = (Na infusat − Na serum) ÷ (TBW + 1). Nilai NEGATIF = menurunkan Na serum.
 * Estimasi awal (sistem tertutup, tidak menghitung ongoing/insensible losses).
 */
export function adrogueDeltaNaPerLiter(infusateNa: number, serumNa: number, tbwL: number): number {
  return (infusateNa - serumNa) / (tbwL + 1);
}

/**
 * Target & batas kenaikan Na pada hiponatremia kronik (mEq/L).
 * Target minimal 4–8/24 jam (4–6 bila risiko ODS tinggi) — Verbalis 2013.
 * Batas 24 jam pertama 10 (8 bila risiko ODS tinggi); tiap 24 jam berikutnya 8 — Spasovski 2014.
 */
export function hypoNaRiseLimits(highOdsRisk: boolean): { goalLo: number; goalHi: number; limit24: number; limitNext24: number } {
  return highOdsRisk
    ? { goalLo: 4, goalHi: 6, limit24: 8, limitNext24: 8 }
    : { goalLo: 4, goalHi: 8, limit24: 10, limitNext24: 8 };
}

/**
 * Jumlah hari minimal untuk mencapai Na target bila kenaikan dibatasi: hari-1 ≤ min(target, batas 24 jam
 * pertama), hari berikutnya ≤ min(target, batas tiap 24 jam berikutnya) (Spasovski 2014).
 * (Sebelumnya batas hari ke-2 dst. tidak dihitung → jumlah hari kurang 1 bila target >8.)
 */
export function hypoDaysToNa(calcN: number, rise: number, lim: { limit24: number; limitNext24: number }, naTarget = 140): number {
  const total = naTarget - calcN;
  if (total <= 0) return 0;
  const first = Math.min(rise, lim.limit24);
  const next = Math.min(rise, lim.limitNext24);
  return total <= first ? 1 : 1 + Math.ceil((total - first) / next - 1e-9);
}

/** Pilihan cairan untuk koreksi hipernatremia beserta kandungan Na (mEq/L). */
export const NA_FLUIDS: { id: string; label: string; na: number; note: string }[] = [
  { id: 'oral', label: 'Air oral / via NGT', na: 0, note: 'Paling fisiologis bila saluran cerna berfungsi.' },
  { id: 'd5w', label: 'D5W (Dekstrosa 5%) IV', na: 0, note: 'Untuk defisit air murni; pantau glukosa.' },
  { id: 'half', label: 'NaCl 0.45% IV', na: 77, note: 'Bila butuh volume juga; menurunkan Na lebih lambat.' },
  { id: 'ns', label: 'NaCl 0.9% IV', na: 154, note: 'Untuk hipovolemia berat dulu sampai stabil; TIDAK untuk menurunkan Na bila Na <154.' },
];

export type UreaUnit = 'ureum' | 'bun';

/** Konversi ureum ↔ BUN (mg/dL): BUN = ureum × 28/60 = ureum ÷ 2.14. */
export const ureumToBun = (ureumMgDl: number) => (ureumMgDl * 28) / 60;

/**
 * Osmolalitas serum TERHITUNG & EFEKTIF (mOsm/kg), dari Na TERUKUR (bukan Na terkoreksi glukosa).
 *   Total   = 2 × Na + glukosa/18 + ureum/6   (BUN: ÷ 2.8)
 *   Efektif = 2 × Na + glukosa/18             — urea adalah osmol TIDAK efektif (bebas melintasi
 *             membran sel, tidak menarik air), sehingga tidak menentukan tonisitas (Spasovski 2014).
 * Glukosa kosong → NaN (tidak ditebak). Ureum kosong → total NaN, efektif tetap dihitung.
 */
export function serumOsmolality(naMeasured: number, glucoseMgDl: number, urea: number, unit: UreaUnit = 'ureum') {
  const glucoseTerm = glucoseMgDl > 0 ? glucoseMgDl / 18 : NaN;
  const ureaTerm = urea >= 0 && !isNaN(urea) ? urea / (unit === 'bun' ? 2.8 : 6) : NaN;
  const effective = 2 * naMeasured + glucoseTerm;
  return { glucoseTerm, ureaTerm, effective, total: effective + ureaTerm };
}

export type Tonicity = 'hipotonik' | 'isotonik' | 'hipertonik';

/** Klasifikasi tonisitas: <275 hipotonik · 275–295 isotonik · >295 hipertonik (mOsm/kg). */
export function tonicityClass(osm: number): Tonicity | null {
  if (isNaN(osm)) return null;
  if (osm < 275) return 'hipotonik';
  if (osm <= 295) return 'isotonik';
  return 'hipertonik';
}

/**
 * Koreksi Na terhadap hiperglikemia bila glukosa >100 mg/dL: Na + faktor × (glukosa − 100)/100.
 * Nilai utama memakai faktor 1.6 (Katz, NEJM 1973). Hillier (Am J Med 1999) menemukan rata-rata 2.4,
 * dan 4.0 lebih sesuai bila glukosa >400 — dikembalikan sebagai pembanding (ditampilkan sebagai rentang).
 */
export function glucoseCorrectedNa(na: number, glucoseMgDl: number): { value: number; corrected: boolean; hillier24: number; hillier40: number } {
  if (!isNaN(glucoseMgDl) && glucoseMgDl > 100) {
    const x = (glucoseMgDl - 100) / 100;
    return { value: na + 1.6 * x, corrected: true, hillier24: na + 2.4 * x, hillier40: na + 4.0 * x };
  }
  return { value: na, corrected: false, hillier24: na, hillier40: na };
}

export interface NaInput {
  weightKg: number; na: number; glucose: number; sex: 'm' | 'f'; age: number; onset: string;
  fluidId: string; odsRiskFactors: number; riseTarget: number; hyperTargetNa: number; hyperDropPer24: number;
  /** Opsional: ureum/BUN (mg/dL), osmolalitas terukur (mOsm/kg), Na analyzer gas darah (direct ISE). */
  urea?: number; ureaUnit?: UreaUnit; measuredOsm?: number; naDirect?: number;
}

/**
 * Konfirmasi tonisitas untuk hiponatremia.
 * - Osm TERUKUR <275 → pasti hipotonik. Osm efektif dari terukur ≈ terukur − ureum/6 (urea tak efektif).
 * - Osm TERHITUNG <275 → kemungkinan hipotonik; BELUM menyingkirkan osmol tak terukur (manitol, glisin,
 *   kontras) maupun pseudohiponatremia (Spasovski 2014).
 * - Na analyzer gas darah (direct ISE) normal sementara Na lab (indirect ISE) rendah → curiga
 *   pseudohiponatremia (lipid/protein tinggi). Normalnya kedua metode berbeda <±1 mmol/L (Vera 2022).
 */
export function naTonicity(na: number, glucose: number, urea: number, unit: UreaUnit, measuredOsm: number, naDirect: number) {
  const calc = serumOsmolality(na, glucose, urea, unit);
  const hasMeasured = measuredOsm > 0;
  const effFromMeasured = hasMeasured && !isNaN(calc.ureaTerm) ? measuredOsm - calc.ureaTerm : NaN;
  const gap = hasMeasured && !isNaN(calc.total) ? measuredOsm - calc.total : NaN;
  const hasDirect = naDirect > 0;
  const pseudoSuspect = hasDirect && naDirect >= 135 && na < 135;
  const calcClass = tonicityClass(calc.effective);
  const measuredClass = hasMeasured ? tonicityClass(measuredOsm) : null;
  // Status: terukur <275 (pasti) > curiga pseudo > efektif dari terukur <275 > terhitung <275 (kemungkinan) > bukan
  let status: 'pasti-hipotonik' | 'kemungkinan-hipotonik' | 'bukan-hipotonik' | 'curiga-pseudo' | 'belum-dinilai';
  if (measuredClass === 'hipotonik') status = 'pasti-hipotonik'; // pseudohiponatremia selalu ber-osm terukur normal
  else if (pseudoSuspect) status = 'curiga-pseudo';
  else if (hasMeasured && !isNaN(effFromMeasured) && effFromMeasured < 275) status = 'kemungkinan-hipotonik';
  else if (hasMeasured) status = 'bukan-hipotonik';
  else if (calcClass === 'hipotonik') status = 'kemungkinan-hipotonik';
  else if (calcClass) status = 'bukan-hipotonik';
  else status = 'belum-dinilai';
  return { ...calc, calcClass, hasMeasured, measuredOsm, measuredClass, effFromMeasured, gap, hasDirect, naDirect, naDiff: hasDirect ? naDirect - na : NaN, pseudoSuspect, status };
}


/**
 * Perhitungan lengkap koreksi Na (hipo/hiper) dari input — fungsi murni.
 * Hipo: defisit Na 24 jam = TBW × ΔNa target; volume NaCl 3% via metode defisit & Adrogué–Madías;
 *       konteks defisit total ke 140 = TBW × (140 − Na) (TIDAK diberikan sekaligus).
 * Hiper: defisit air bebas = TBW × (Na/Na target − 1); volume cairan hari ini via Adrogué–Madías.
 */
export function computeNa(i: NaInput) {
  if (!(i.weightKg > 0) || !(i.na > 0)) return null;
  const g = glucoseCorrectedNa(i.na, i.glucose);
  const calcN = g.value;
  const tbwF = tbwFactor(i.sex, i.age);
  const tbw = i.weightKg * tbwF;
  const naT = 140;
  const osm = naTonicity(i.na, i.glucose, i.urea ?? NaN, i.ureaUnit ?? 'ureum', i.measuredOsm ?? NaN, i.naDirect ?? NaN);
  const base = { naMeasured: i.na, calcN, hasHyper: g.corrected, naHillier24: g.hillier24, naHillier40: g.hillier40, glucose: i.glucose, tbwF, tbw, w: i.weightKg, osm };

  if (calcN < 135) {
    const odsAuto = calcN <= 105;
    const highOdsRisk = odsAuto || i.odsRiskFactors > 0;
    const lim = hypoNaRiseLimits(highOdsRisk);
    const rise = i.riseTarget > 0 ? i.riseTarget : 6;
    const d = Math.min(rise, naT - calcN);
    const deficit = d * tbw;                        // mEq Na untuk ΔNa 24 jam
    const v = (deficit * 1000) / 513;               // mL NaCl 3% (metode defisit)
    const amPerLiter = (513 - calcN) / (tbw + 1);   // Adrogué–Madías: ΔNa per 1 L NaCl 3%
    const vAM = (d / amPerLiter) * 1000;
    const totalDeficit = (naT - calcN) * tbw;       // konteks: defisit total ke 140
    return {
      type: 'hipo' as const, ...base,
      lim, rise, d, tgt: calcN + d, riseOverGoal: rise > lim.goalHi, riseOverLimit: rise > lim.limit24,
      highOdsRisk, odsAuto, isProfound: calcN < 125,
      bioClass: calcN < 125 ? 'berat (<125)' : calcN < 130 ? 'sedang (125–129)' : 'ringan (130–134)',
      deficit, v, rate: v / 24, vAM, rateAM: vAM / 24, amPerLiter,
      rateMax: (0.5 * tbw * 1000) / 513,            // mL/jam NaCl 3% setara +0.5 mEq/L/jam (metode defisit)
      totalDeficit, daysTo140: hypoDaysToNa(calcN, rise, lim, naT),
    };
  }
  if (calcN > 145) {
    const targetNa = i.hyperTargetNa >= 135 && i.hyperTargetNa <= 150 ? i.hyperTargetNa : naT;
    const deficit = Math.max(0, freeWaterDeficit(tbw, calcN, targetNa)); // L
    const maxDropPer24 = i.hyperDropPer24 > 0 ? i.hyperDropPer24 : (i.onset === 'akut' ? 24 : 10);
    const totalDrop = Math.max(0, calcN - targetNa);
    const targetDrop = Math.min(totalDrop, maxDropPer24);
    const fluid = NA_FLUIDS.find(f => f.id === i.fluidId) ?? NA_FLUIDS[1];
    const dNaPerL = adrogueDeltaNaPerLiter(fluid.na, calcN, tbw);
    const lowersNa = dNaPerL < 0;
    const volForTarget = lowersNa ? targetDrop / -dNaPerL : null; // L
    return {
      type: 'hiper' as const, ...base,
      targetNa, deficit, maxDropPer24, dropOverGuideline: i.onset !== 'akut' && maxDropPer24 > 10,
      totalDrop, targetDrop, days: Math.max(1, Math.ceil(totalDrop / maxDropPer24)),
      fluid, dNaPerL, lowersNa, volForTarget,
      rateMlHr: volForTarget !== null ? (volForTarget * 1000) / 24 : null,
    };
  }
  return { type: 'normal' as const, ...base };
}
export type NaResult = NonNullable<ReturnType<typeof computeNa>>;
