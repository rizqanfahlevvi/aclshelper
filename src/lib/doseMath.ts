/* ============================================================
   Matematika dosis — fungsi murni & teruji, dipakai bersama oleh
   vaso-drip, dosis PALS, dan kalkulator infus generik agar satu
   sumber kebenaran dan bisa diuji unit.
   ============================================================ */

/** Dosis pediatrik berbasis BB dengan clamp min/maks (mg/kg, mcg/kg, J/kg). */
export function palsDose(dosePerKg: number, weight: number, min?: number, max?: number): {
  raw: number; clamped: number; isClamped: boolean;
} {
  const raw = dosePerKg * weight;
  const lo = min ?? -Infinity;
  const hi = max ?? Infinity;
  const clamped = Math.min(hi, Math.max(lo, raw));
  return { raw, clamped, isClamped: Math.abs(clamped - raw) > 0.0001 };
}

/** Konsentrasi larutan dalam basis per-mL.
 *  unit 'mg' → dikonversi ke mcg/mL; 'unit' → tetap unit/mL. */
export function infusionConc(amount: number, volumeMl: number, unit: 'mg' | 'unit'): number {
  if (volumeMl <= 0) return 0;
  return unit === 'mg' ? (amount * 1000) / volumeMl : amount / volumeMl;
}

/** Laju pompa (mL/jam) dari dosis.
 *  dose: mcg/kg/min (perKg=true) atau mcg/min / unit/min (perKg=false).
 *  concPerMl harus dalam basis yang sama (mcg/mL atau unit/mL). */
export function infusionRateMlHr(dose: number, weight: number, concPerMl: number, perKg: boolean): number {
  const rateBaseMin = perKg ? dose * weight : dose;
  return concPerMl > 0 ? (rateBaseMin / concPerMl) * 60 : 0;
}
