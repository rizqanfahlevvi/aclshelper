// Util validasi input klinis (fungsi murni). Peringatan bersifat NON-BLOCKING —
// menandai nilai yang kemungkinan salah ketik/satuan agar dosis per-kg tidak
// diam-diam melipatganda, tanpa menghentikan perhitungan.

/**
 * Peringatan plausibilitas berat badan (kg) untuk pasien DEWASA.
 * Mengembalikan pesan bila berat di luar rentang lazim (indikasi salah satuan/typo),
 * atau null bila wajar. Ambang sengaja longgar agar hanya menangkap kesalahan kotor.
 */
export function weightPlausibilityWarning(weightKg: number): string | null {
  if (!(weightKg > 0)) return null;
  if (weightKg < 20) return 'Berat <20 kg tidak lazim untuk dewasa — pastikan satuan kg (bukan gram) dan bukan pasien anak.';
  if (weightKg > 300) return 'Berat >300 kg tidak lazim — periksa kemungkinan salah ketik.';
  return null;
}

/**
 * Peringatan generik bila nilai numerik di luar rentang fisiologis yang diharapkan.
 * label dipakai di pesan. Mengembalikan null bila dalam rentang atau input kosong.
 */
export function rangeWarning(value: number, min: number, max: number, label: string, unit = ''): string | null {
  if (isNaN(value)) return null;
  if (value < min || value > max) {
    return `${label} ${value}${unit} di luar rentang lazim (${min}–${max}${unit}) — periksa nilai/satuan.`;
  }
  return null;
}
