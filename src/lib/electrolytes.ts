// Util perhitungan koreksi Kalium, Kalsium, Magnesium (fungsi murni, mudah dites).
// Rujukan (diverifikasi di PubMed):
// · Kardalas E, et al. Hypokalemia: a clinical update. Endocr Connect 2018;7:R135 (doi:10.1530/EC-18-0109)
// · Kruse JA, Carlson RW. Arch Intern Med 1990;150:613 (KCl 20 mEq → K naik rata-rata 0.25 mmol/L)
// · Adrogué HJ, Madias NE. Am J Med 1981;71:456 (K ↔ pH, ~0.6 mEq/L per 0.1 pH, rentang lebar)
// · Ford S, et al. Aust Prescr 2026;49:194 (doi:10.18773/austprescr.2026.040) — hiperkalemia akut
// · Turner J, et al. SfE Emergency Guidance: acute hypocalcaemia. Endocr Connect 2016;5:G7
// · Walsh J, et al. SfE Emergency Guidance: acute hypercalcaemia. Endocr Connect 2016;5:G9
// · Hansen BA, Bruserud Ø. Hypomagnesemia in critically ill patients. J Intensive Care 2018;6:21

// ─── Kalium ────────────────────────────────────────────────────────────────

export type HypoKSeverity = 'ringan' | 'sedang' | 'berat';

/** Ringan 3.0–3.4 · sedang 2.5–2.9 · berat <2.5 mEq/L (Kardalas 2018: berat/mengancam jiwa <2.5). */
export function hypoKSeverity(k: number): HypoKSeverity {
  if (k < 2.5) return 'berat';
  if (k < 3.0) return 'sedang';
  return 'ringan';
}

/**
 * Estimasi defisit K total tubuh (mEq): tiap penurunan 1 mEq/L ≈ 200–400 mEq
 * (Kardalas 2018), diskalakan linier ke BB terhadap acuan 70 kg.
 * Hanya berlaku bila tidak ada pergeseran transseluler (insulin, β-agonis, alkalosis).
 */
export function kDeficitRange(currentK: number, targetK: number, weightKg: number): { delta: number; lo: number; hi: number } {
  const delta = Math.max(0, targetK - currentK);
  const scale = weightKg > 0 ? weightKg / 70 : 1;
  return { delta, lo: delta * 200 * scale, hi: delta * 400 * scale };
}

/** Kenaikan rata-rata K serum per infus 20 mEq KCl pada pasien ICU (Kruse & Carlson 1990). */
export const K_RISE_PER_20_MEQ = 0.25;

/**
 * Perkiraan empiris KCl IV untuk mencapai target (Kruse & Carlson 1990):
 * jumlah infus 20 mEq = ceil(ΔK ÷ 0.25). Untuk RENCANA BERTAHAP, bukan diberikan sekaligus.
 */
export function kclEmpiricPlan(currentK: number, targetK: number): { delta: number; doses20: number; totalMeq: number } {
  const delta = Math.max(0, targetK - currentK);
  const doses20 = delta > 0 ? Math.ceil(delta / K_RISE_PER_20_MEQ - 1e-9) : 0;
  return { delta, doses20, totalMeq: doses20 * 20 };
}

/** Kebutuhan K rumatan harian dewasa ±1 mmol/kg/hari (NICE CG174; obesitas → BB ideal). */
export const K_MAINT_MEQ_PER_KG_DAY = 1;

/** Faktor defisit K × BB (≈ ruang ekstrasel) — 0.4 (materi kasus NEJM 2015, Gumz et al.; GlobalRPh). */
export const K_DEFICIT_FACTOR = 0.4;

/**
 * "Protokol 24 jam" (gaya protokol RS): defisit ekstrasel + rumatan harian.
 *   Defisit = 0.4 × (K target − K) × BB
 *   Rumatan = mEq/kg/hari × BB
 * Hasil dibulatkan ke paket terdekat (kelipatan `pkg`, minimal satu paket).
 * Catatan: faktor ini TIDAK mewakili defisit total tubuh (98% K intrasel) — rencana ini
 * bekerja karena diulang harian dengan K serial.
 */
export function kProtocol24h(currentK: number, targetK: number, weightKg: number, factor = K_DEFICIT_FACTOR, maintPerKgDay = K_MAINT_MEQ_PER_KG_DAY, pkg = 50): { delta: number; deficit: number; maint: number; raw: number; rounded: number; ratePerHr: number } {
  const delta = Math.max(0, targetK - currentK);
  const deficit = factor * delta * weightKg;
  const maint = maintPerKgDay * weightKg;
  const raw = deficit + maint;
  const rounded = raw > 0 ? Math.max(pkg, Math.round(raw / pkg) * pkg) : 0;
  return { delta, deficit, maint, raw, rounded, ratePerHr: rounded / 24 };
}

/**
 * Perkiraan K bila pH dinormalkan ke 7.40: rata-rata ~0.6 mEq/L per 0.1 unit pH
 * (Adrogué & Madias 1981; rentang 0.2–1.7, terutama pada asidosis mineral/non-anion-gap).
 */
export function kAtNormalPh(k: number, ph: number): number {
  return k - ((7.4 - ph) / 0.1) * 0.6;
}

export type HyperKSeverity = 'batas' | 'ringan' | 'sedang' | 'berat';

/** 5.0–5.4 di atas normal · 5.5–5.9 ringan · 6.0–6.4 sedang · ≥6.5 berat (UKKA; Ford 2026). */
export function hyperKSeverity(k: number): HyperKSeverity {
  if (k >= 6.5) return 'berat';
  if (k >= 6.0) return 'sedang';
  if (k >= 5.5) return 'ringan';
  return 'batas';
}

/** mg/dL glukosa → mmol/L. */
export const glucoseMgdlToMmol = (mgdl: number) => mgdl / 18;

// ─── Kalsium ───────────────────────────────────────────────────────────────

/** Ca terkoreksi albumin (Payne): Ca + 0.8 × (4.0 − albumin g/dL), mg/dL. */
export function correctedCalcium(caMgDl: number, albuminGdl: number): number {
  return caMgDl + 0.8 * (4 - albuminGdl);
}

/** Ca mg/dL → mmol/L (÷ 4.008). */
export const caMgdlToMmol = (mgdl: number) => mgdl / 4.008;

/** Ca glukonat 10%: 93 mg Ca elemental per 10 mL (2.33 mmol; 4.65 mEq). */
export const CA_GLUCONATE_ELEMENTAL_MG_PER_ML = 9.3;

/** Ambang SfE 2016: Ca terkoreksi <1.9 mmol/L (= 7.6 mg/dL) dan/atau bergejala = berat. */
export const HYPOCA_SEVERE_MMOL = 1.9;

/**
 * Infus rumatan SfE 2016: 100 mL Ca glukonat 10% dalam 1 L NaCl 0.9%/D5W (total ±1100 mL),
 * laju 50–100 mL/jam. Mengembalikan Ca elemental mg/jam dan mg/kg/jam pada laju tsb.
 */
export function caGluconateInfusion(rateMlPerHr: number, weightKg: number): { mgPerHr: number; mgPerKgPerHr: number; concMgPerMl: number } {
  const concMgPerMl = (100 * CA_GLUCONATE_ELEMENTAL_MG_PER_ML) / 1100;
  const mgPerHr = rateMlPerHr * concMgPerMl;
  return { concMgPerMl, mgPerHr, mgPerKgPerHr: weightKg > 0 ? mgPerHr / weightKg : 0 };
}

export type HyperCaSeverity = 'ringan' | 'sedang' | 'berat';

/** SfE 2016: <3.0 mmol/L (<12 mg/dL) · 3.0–3.5 (12–14) · >3.5 mmol/L (>14 mg/dL). */
export function hyperCaSeverity(corrCaMgDl: number): HyperCaSeverity {
  const mmol = caMgdlToMmol(corrCaMgDl);
  if (mmol > 3.5) return 'berat';
  if (mmol >= 3.0) return 'sedang';
  return 'ringan';
}

// ─── Magnesium ─────────────────────────────────────────────────────────────

/** Mg mg/dL → mEq/L (mmol/L = mg/dL × 10 ÷ 24.305; mEq = mmol × 2). */
export const mgMgdlToMeq = (mgdl: number) => (mgdl * 10 / 24.305) * 2;
/** Mg mg/dL → mmol/L. */
export const mgMgdlToMmol = (mgdl: number) => mgdl * 10 / 24.305;

/** 1 g MgSO₄·7H₂O = 8.12 mEq = 4.06 mmol Mg. */
export const MEQ_PER_G_MGSO4 = 8.12;

/** Aturan empiris pasien kritis: 1 g MgSO₄ IV menaikkan Mg serum ±0.15 mEq/L dalam 18–30 jam (Hansen 2018). */
export const MG_RISE_MEQ_PER_G = 0.15;

/** Batas dosis pada hipomagnesemia berat: s/d 1.5 mEq/kg (Hansen 2018) → gram MgSO₄. */
export function mgMaxDoseGrams(weightKg: number): number {
  return (1.5 * weightKg) / MEQ_PER_G_MGSO4;
}

/**
 * Perkiraan gram MgSO₄ IV untuk mencapai target (mg/dL), dibulatkan ke 0.5 g ke atas,
 * dibatasi 1.5 mEq/kg. Untuk hipomagnesemia ringan–sedang pasien kritis (Hansen 2018).
 */
export function mgso4DoseToTarget(currentMgDl: number, targetMgDl: number, weightKg: number): { deltaMeq: number; rawGrams: number; grams: number; capped: boolean; maxGrams: number } {
  const deltaMeq = Math.max(0, mgMgdlToMeq(targetMgDl) - mgMgdlToMeq(currentMgDl));
  const rawGrams = deltaMeq / MG_RISE_MEQ_PER_G;
  const rounded = rawGrams > 0 ? Math.ceil(rawGrams * 2 - 1e-9) / 2 : 0;
  const maxGrams = mgMaxDoseGrams(weightKg);
  const capped = weightKg > 0 && rounded > maxGrams;
  const grams = capped ? Math.floor(maxGrams * 2) / 2 : rounded;
  return { deltaMeq, rawGrams, grams, capped, maxGrams };
}

/**
 * Bila bolus darurat 2 g diberikan (aritmia/tidak stabil), total bolus + infus tidak boleh melampaui batas
 * 1.5 mEq/kg (Hansen 2018): infus = min(kebutuhan, batas − 2 g), dibulatkan ke bawah per 0.5 g.
 */
export const MG_BOLUS_G = 2;
export function mgInfusionAfterBolus(needGrams: number, maxGrams: number, urgent: boolean, weightKnown: boolean): { infusion: number; total: number; reducedForCap: boolean } {
  if (!urgent) return { infusion: needGrams, total: needGrams, reducedForCap: false };
  const room = weightKnown ? Math.max(0, Math.floor((maxGrams - MG_BOLUS_G) * 2 + 1e-9) / 2) : Infinity;
  const infusion = Math.min(needGrams, room);
  return { infusion, total: infusion + MG_BOLUS_G, reducedForCap: infusion < needGrams };
}

/** Durasi infus (Hansen 2018): dosis <6 g dalam 8–12 jam; dosis lebih besar >25 jam. */
export function mgInfusionHours(grams: number): { min: number; max: number | null } {
  return grams < 6 ? { min: 8, max: 12 } : { min: 25, max: null };
}
