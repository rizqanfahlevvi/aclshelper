/* ============================================================
   ACLS Helper — Kalkulator & Skoring Kardiovaskular
   ============================================================ */

export type FieldType = 'number' | 'select' | 'checkbox';

export interface CalcField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string | boolean;
  options?: { label: string; value: string | number }[];
  points?: number;
  description?: string;
}

export interface CalcResult {
  score: number | string;
  label: string;
  risk?: string;
  color: string;
  detail?: string;
}

export interface Calculator {
  key: string;
  name: string;
  short: string;
  category: string;
  tint: string;
  description: string;
  source: string;
  fields: CalcField[];
  compute: (values: Record<string, number | string | boolean>) => CalcResult;
  notes?: string[];
}

export const CALCULATORS: Calculator[] = [
  /* ------------------------------------------------------------------ */
  /* 1. CHA₂DS₂-VASc                                                      */
  /* ------------------------------------------------------------------ */
  {
    key: 'chads2vasc',
    name: 'CHA₂DS₂-VASc',
    short: 'CHA₂DS₂-VASc',
    category: 'Fibrilasi Atrium',
    tint: '#007AFF',
    description: 'Risiko stroke pada fibrilasi atrium non-valvular',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'chf',          label: 'Gagal Jantung / Disfungsi LV',                      type: 'checkbox', points: 1 },
      { key: 'hypertension', label: 'Hipertensi',                                         type: 'checkbox', points: 1 },
      { key: 'age75',        label: 'Usia ≥ 75 tahun',                                    type: 'checkbox', points: 2 },
      { key: 'diabetes',     label: 'Diabetes Melitus',                                   type: 'checkbox', points: 1 },
      { key: 'stroke',       label: 'Riwayat Stroke / TIA / TE',                          type: 'checkbox', points: 2 },
      { key: 'vascular',     label: 'Penyakit Vaskular (MI, PAD, plak aorta)',             type: 'checkbox', points: 1 },
      { key: 'age6574',      label: 'Usia 65–74 tahun',                                   type: 'checkbox', points: 1 },
      { key: 'female',       label: 'Jenis Kelamin Perempuan',                             type: 'checkbox', points: 1 },
    ],
    compute: (vals) => {
      let score = 0;
      if (vals.chf)          score += 1;
      if (vals.hypertension) score += 1;
      if (vals.age75)        score += 2;
      if (vals.diabetes)     score += 1;
      if (vals.stroke)       score += 2;
      if (vals.vascular)     score += 1;
      if (vals.age6574)      score += 1;
      if (vals.female)       score += 1;
      const femaleOnly = vals.female && score === 1;
      if (femaleOnly || score === 0) return { score, label: 'Risiko Rendah',  risk: 'Antikoagulan umumnya tidak direkomendasikan',                         color: '#34C759' };
      if (score === 1)               return { score, label: 'Risiko Sedang',  risk: 'Pertimbangkan antikoagulan oral',                                     color: '#FF9500' };
      return                                { score, label: 'Risiko Tinggi',  risk: 'Antikoagulan oral direkomendasikan (kecuali kontraindikasi)',          color: '#FF3B30' };
    },
    notes: [
      'Skor hanya berlaku untuk pasien dengan fibrilasi atrium non-valvular',
      'Perempuan mendapat 1 poin ekstra tetapi skor 1 murni karena jenis kelamin tidak meningkatkan risiko yang bermakna',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 2. HAS-BLED                                                          */
  /* ------------------------------------------------------------------ */
  {
    key: 'hasbled',
    name: 'HAS-BLED',
    short: 'HAS-BLED',
    category: 'Fibrilasi Atrium',
    tint: '#FF9500',
    description: 'Risiko perdarahan pada terapi antikoagulan',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'hypertension',  label: 'Hipertensi tidak terkontrol (sistolik >160 mmHg)',      type: 'checkbox', points: 1 },
      { key: 'renalLiver',    label: 'Gangguan ginjal atau hati berat',                        type: 'checkbox', points: 1 },
      { key: 'stroke',        label: 'Riwayat Stroke',                                         type: 'checkbox', points: 1 },
      { key: 'bleedHistory',  label: 'Riwayat perdarahan / predisposisi',                      type: 'checkbox', points: 1 },
      { key: 'labileinr',     label: 'INR labil (TTR <60%)',                                   type: 'checkbox', points: 1 },
      { key: 'elderly',       label: 'Usia > 65 tahun',                                        type: 'checkbox', points: 1 },
      { key: 'drugs',         label: 'Obat (antiplatelet, NSAID) atau alkohol',                type: 'checkbox', points: 1 },
    ],
    compute: (vals) => {
      let score = 0;
      if (vals.hypertension) score += 1;
      if (vals.renalLiver)   score += 1;
      if (vals.stroke)       score += 1;
      if (vals.bleedHistory) score += 1;
      if (vals.labileinr)    score += 1;
      if (vals.elderly)      score += 1;
      if (vals.drugs)        score += 1;
      if (score <= 1) return { score, label: 'Risiko Rendah',  risk: 'Perdarahan mayor <1%/tahun',                                                        color: '#34C759' };
      if (score === 2) return { score, label: 'Risiko Sedang', risk: 'Perdarahan mayor ~1.9%/tahun',                                                       color: '#FF9500' };
      return                 { score, label: 'Risiko Tinggi',  risk: 'Perdarahan mayor ≥3%/tahun — koreksi faktor risiko yang dapat dimodifikasi',         color: '#FF3B30' };
    },
    notes: [
      'Skor tinggi BUKAN kontraindikasi antikoagulan — gunakan untuk mengidentifikasi dan mengoreksi faktor risiko yang dapat dimodifikasi',
      'Evaluasi bersamaan dengan CHA₂DS₂-VASc: jika keduanya tinggi, optimasi faktor risiko sebelum memulai antikoagulan',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 3. HEART Score                                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'heart',
    name: 'HEART Score',
    short: 'HEART',
    category: 'ACS / Koroner',
    tint: '#FF3B30',
    description: 'Risiko MACE pada nyeri dada akut',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      {
        key: 'history',
        label: 'Riwayat',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: 'Tidak mencurigakan',             value: 0 },
          { label: 'Agak mencurigakan',               value: 1 },
          { label: 'Sangat mencurigakan',             value: 2 },
        ],
      },
      {
        key: 'ekg',
        label: 'EKG',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: 'Normal',                                          value: 0 },
          { label: 'LBBB/pacing/EKG normal tapi perubahan minor',    value: 1 },
          { label: 'Deviasi ST bermakna',                             value: 2 },
        ],
      },
      {
        key: 'age',
        label: 'Usia',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: '<45 tahun',    value: 0 },
          { label: '45-64 tahun', value: 1 },
          { label: '≥65 tahun',   value: 2 },
        ],
      },
      {
        key: 'riskfactors',
        label: 'Faktor Risiko',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: 'Tidak ada',                                                   value: 0 },
          { label: '1-2 faktor risiko atau riwayat PJK',                          value: 1 },
          { label: 'Aterosklerosis diketahui / ≥3 faktor risiko / diabetes',      value: 2 },
        ],
      },
      {
        key: 'troponin',
        label: 'Troponin',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: '≤ batas normal',       value: 0 },
          { label: '1-3× batas normal',    value: 1 },
          { label: '>3× batas normal',     value: 2 },
        ],
      },
    ],
    compute: (vals) => {
      const score = (Number(vals.history) || 0) + (Number(vals.ekg) || 0) + (Number(vals.age) || 0) + (Number(vals.riskfactors) || 0) + (Number(vals.troponin) || 0);
      if (score <= 3) return { score, label: 'Risiko Rendah',  risk: 'MACE <2% — pertimbangkan early discharge',               color: '#34C759' };
      if (score <= 6) return { score, label: 'Risiko Sedang',  risk: 'MACE ~12-17% — observasi & pemeriksaan lanjutan',        color: '#FF9500' };
      return               { score, label: 'Risiko Tinggi',  risk: 'MACE ~50-65% — evaluasi kardiak segera / invasif',       color: '#FF3B30' };
    },
  },

  /* ------------------------------------------------------------------ */
  /* 4. GRACE Score                                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'grace',
    name: 'GRACE Score',
    short: 'GRACE',
    category: 'ACS / Koroner',
    tint: '#AF52DE',
    description: 'Mortalitas di RS pada ACS (STEMI/NSTEMI/UA)',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'age',          label: 'Usia',                          type: 'number',  unit: 'tahun',  min: 18,  max: 110,  defaultValue: 65 },
      { key: 'hr',           label: 'Laju Jantung',                  type: 'number',  unit: 'bpm',    min: 20,  max: 250,  defaultValue: 80 },
      { key: 'sbp',          label: 'Tekanan Darah Sistolik',        type: 'number',  unit: 'mmHg',   min: 50,  max: 250,  defaultValue: 130 },
      { key: 'creatinine',   label: 'Kreatinin',                     type: 'number',  unit: 'mg/dL',  min: 0.1, max: 20,   step: 0.1, defaultValue: 1.0 },
      {
        key: 'killip',
        label: 'Kelas Killip',
        type: 'select',
        defaultValue: 0,
        options: [
          { label: 'Kelas I - Tidak ada gagal jantung',  value: 0 },
          { label: 'Kelas II - Ronki, JVP meningkat',    value: 1 },
          { label: 'Kelas III - Edema paru',             value: 2 },
          { label: 'Kelas IV - Syok kardiogenik',        value: 3 },
        ],
      },
      { key: 'cardiacArrest', label: 'Henti Jantung saat masuk',     type: 'checkbox' },
      { key: 'stDeviation',   label: 'Deviasi segmen ST',            type: 'checkbox' },
      { key: 'enzymes',       label: 'Peningkatan enzim jantung',    type: 'checkbox' },
    ],
    compute: (vals) => {
      let score = 0;
      // Age
      const age = Number(vals.age) || 0;
      if      (age < 30) score += 0;
      else if (age < 40) score += 8;
      else if (age < 50) score += 25;
      else if (age < 60) score += 41;
      else if (age < 70) score += 58;
      else if (age < 80) score += 75;
      else               score += 91;
      // HR
      const hr = Number(vals.hr) || 0;
      if      (hr < 50)  score += 0;
      else if (hr < 70)  score += 3;
      else if (hr < 90)  score += 9;
      else if (hr < 110) score += 15;
      else if (hr < 150) score += 24;
      else if (hr < 200) score += 38;
      else               score += 46;
      // SBP
      const sbp = Number(vals.sbp) || 0;
      if      (sbp < 80)  score += 58;
      else if (sbp < 100) score += 53;
      else if (sbp < 120) score += 43;
      else if (sbp < 140) score += 34;
      else if (sbp < 160) score += 24;
      else if (sbp < 200) score += 10;
      else                score += 0;
      // Creatinine
      const cr = Number(vals.creatinine) || 0;
      if      (cr < 0.4) score += 1;
      else if (cr < 0.8) score += 4;
      else if (cr < 1.2) score += 7;
      else if (cr < 1.6) score += 10;
      else if (cr < 2.0) score += 13;
      else if (cr < 4.0) score += 21;
      else               score += 28;
      // Killip
      const killip = Number(vals.killip) || 0;
      score += ([0, 20, 39, 59][killip] || 0);
      // Checkboxes
      if (vals.cardiacArrest) score += 39;
      if (vals.stDeviation)   score += 28;
      if (vals.enzymes)       score += 14;

      let label: string, risk: string, color: string;
      if      (score <= 108) { label = 'Risiko Rendah'; risk = 'Mortalitas di RS <1% — pertimbangkan intervensi dini';            color = '#34C759'; }
      else if (score <= 140) { label = 'Risiko Sedang'; risk = 'Mortalitas di RS 1-3% — revaskularisasi dini direkomendasikan';   color = '#FF9500'; }
      else                   { label = 'Risiko Tinggi'; risk = 'Mortalitas di RS >3% — revaskularisasi segera';                   color = '#FF3B30'; }
      return { score, label, risk, color };
    },
    notes: [
      'Berdasarkan GRACE 1.0 — registri multisenter 11.389 pasien ACS',
      'Prediksi mortalitas selama perawatan di rumah sakit pada ACS (STEMI, NSTEMI, UA)',
      'Skor >140: revaskularisasi dalam 24 jam direkomendasikan ACC/AHA',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 5. MAP                                                               */
  /* ------------------------------------------------------------------ */
  {
    key: 'map',
    name: 'Mean Arterial Pressure',
    short: 'MAP',
    category: 'Hemodinamik',
    tint: '#34C759',
    description: 'Mean Arterial Pressure — perfusi organ',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'sbp', label: 'Tekanan Darah Sistolik',  type: 'number', unit: 'mmHg', min: 40, max: 300, defaultValue: 120 },
      { key: 'dbp', label: 'Tekanan Darah Diastolik', type: 'number', unit: 'mmHg', min: 0,  max: 200, defaultValue: 80  },
    ],
    compute: (vals) => {
      const sbp = Number(vals.sbp) || 0;
      const dbp = Number(vals.dbp) || 0;
      const map = dbp + (sbp - dbp) / 3;
      const score = map.toFixed(1);
      if      (map < 60)  return { score, label: 'Hipoperfusi',  risk: 'Perfusi organ terancam — tangani penyebab',                   color: '#FF3B30' };
      else if (map < 70)  return { score, label: 'Borderline',   risk: 'Pertahankan MAP ≥65 mmHg pada syok',                          color: '#FF9500' };
      else if (map <= 100) return { score, label: 'Normal',       risk: 'Target MAP tercapai',                                         color: '#34C759' };
      else                return { score, label: 'Hipertensi',   risk: 'Pertimbangkan titrasi antihipertensi',                        color: '#FF9500' };
    },
  },

  /* ------------------------------------------------------------------ */
  /* 6. Shock Index                                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'si',
    name: 'Shock Index',
    short: 'SI',
    category: 'Hemodinamik',
    tint: '#FF3B30',
    description: 'Syok Index — keparahan syok hemodinamik',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'hr',  label: 'Laju Jantung',              type: 'number', unit: 'bpm',  min: 20, max: 300, defaultValue: 80  },
      { key: 'sbp', label: 'Tekanan Darah Sistolik',    type: 'number', unit: 'mmHg', min: 40, max: 300, defaultValue: 120 },
    ],
    compute: (vals) => {
      const hr  = Number(vals.hr)  || 0;
      const sbp = Number(vals.sbp) || 1;
      const si  = hr / sbp;
      const score = si.toFixed(2);
      if      (si < 0.6)  return { score, label: 'Normal',              risk: 'Risiko rendah',                             color: '#34C759' };
      else if (si < 1.0)  return { score, label: 'Normal-Tinggi',       risk: 'Awasi ketat',                               color: '#FF9500' };
      else if (si < 1.5)  return { score, label: 'Syok Ringan-Sedang',  risk: 'Resusitasi agresif diindikasikan',          color: '#FF9500' };
      else                return { score, label: 'Syok Berat',          risk: 'Resusitasi masif — perhatian khusus',       color: '#FF3B30' };
    },
  },

  /* ------------------------------------------------------------------ */
  /* 7. CrCl Cockcroft-Gault                                             */
  /* ------------------------------------------------------------------ */
  {
    key: 'crcl',
    name: 'CrCl Cockcroft-Gault',
    short: 'CrCl',
    category: 'Fungsi Ginjal',
    tint: '#30B0C7',
    description: 'Estimasi klirens kreatinin (Cockcroft-Gault)',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'age',        label: 'Usia',              type: 'number',  unit: 'tahun',  min: 18,  max: 110,  defaultValue: 65  },
      { key: 'weight',     label: 'Berat Badan',       type: 'number',  unit: 'kg',     min: 20,  max: 300,  defaultValue: 70  },
      { key: 'creatinine', label: 'Kreatinin Serum',   type: 'number',  unit: 'mg/dL',  min: 0.1, max: 20,   step: 0.1, defaultValue: 1.0 },
      { key: 'female',     label: 'Jenis Kelamin Perempuan', type: 'checkbox' },
    ],
    compute: (vals) => {
      const age = Number(vals.age)        || 0;
      const wt  = Number(vals.weight)     || 0;
      const cr  = Number(vals.creatinine) || 1;
      const sex = vals.female ? 0.85 : 1;
      const crcl = ((140 - age) * wt) / (72 * cr) * sex;
      const score = Math.round(crcl) + ' mL/min';
      if      (crcl < 15)  return { score, label: 'Gagal Ginjal Berat',           risk: 'Pertimbangkan HD — sesuaikan dosis semua obat ginjal',     color: '#FF3B30' };
      else if (crcl < 30)  return { score, label: 'Gagal Ginjal Sedang-Berat',    risk: 'Penyesuaian dosis signifikan diperlukan',                  color: '#FF3B30' };
      else if (crcl < 60)  return { score, label: 'Gagal Ginjal Sedang',          risk: 'Sesuaikan dosis — kontraindikasi beberapa obat',           color: '#FF9500' };
      else if (crcl < 90)  return { score, label: 'Gagal Ginjal Ringan',          risk: 'Pantau fungsi ginjal',                                     color: '#FF9500' };
      else                 return { score, label: 'Normal / Sedikit Menurun',     risk: 'Dosis standar umumnya aman',                              color: '#34C759' };
    },
  },

  /* ------------------------------------------------------------------ */
  /* 8. Fibrinolytic STEMI Checklist                                     */
  /* ------------------------------------------------------------------ */
  {
    key: 'fibrinolytic',
    name: 'Fibrinolisis STEMI',
    short: 'Fibrinolisis',
    category: 'ACS / Koroner',
    tint: '#FF3B30',
    description: 'Checklist fibrinolisis STEMI',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      // Inclusion criteria
      { key: 'stemiDiagnosis',          label: 'Elevasi ST ≥1mm di ≥2 lead yang berdekatan atau LBBB baru',                    type: 'checkbox' },
      { key: 'onsetLt12h',              label: 'Onset gejala <12 jam',                                                          type: 'checkbox' },
      { key: 'noPci',                   label: 'PCI tidak tersedia dalam 120 menit (door-to-balloon)',                           type: 'checkbox' },
      // Absolute contraindications
      { key: 'priorHemorrhagicStroke',  label: 'Riwayat stroke hemoragik kapanpun',                                             type: 'checkbox' },
      { key: 'strokeLast3m',            label: 'Stroke iskemik dalam 3 bulan terakhir',                                         type: 'checkbox' },
      { key: 'structuralCns',           label: 'Kelainan struktural SSP (AVM, aneurisma)',                                      type: 'checkbox' },
      { key: 'intracranialNeoplasm',    label: 'Neoplasma intrakranial',                                                        type: 'checkbox' },
      { key: 'majorTrauma',             label: 'Trauma kepala/wajah signifikan atau operasi dalam 3 bulan',                     type: 'checkbox' },
      { key: 'activeBleeding',          label: 'Perdarahan aktif (bukan menstruasi)',                                           type: 'checkbox' },
      { key: 'aorticDissection',        label: 'Dicurigai diseksi aorta',                                                      type: 'checkbox' },
      { key: 'abdominalAortic',         label: 'Operasi aorta abdominalis dalam 3 bulan',                                      type: 'checkbox' },
      { key: 'severeHtn',               label: 'Hipertensi berat tidak terkontrol (>180/110 yang tidak respons)',               type: 'checkbox' },
      // Relative contraindications
      { key: 'htn',                     label: 'Hipertensi ≥180/110 terkontrol',                                               type: 'checkbox' },
      { key: 'strokeOver3m',            label: 'Stroke iskemik >3 bulan atau demensia',                                        type: 'checkbox' },
      { key: 'cpr',                     label: 'CPR >10 menit',                                                                type: 'checkbox' },
      { key: 'majorSurgery',            label: 'Operasi mayor dalam 3 minggu',                                                 type: 'checkbox' },
      { key: 'internalBleeding',        label: 'Perdarahan internal dalam 2-4 minggu',                                         type: 'checkbox' },
      { key: 'pregnancy',               label: 'Kehamilan',                                                                    type: 'checkbox' },
      { key: 'activePeptic',            label: 'Ulkus peptikum aktif',                                                         type: 'checkbox' },
      { key: 'anticoagulant',           label: 'Terapi antikoagulan (INR >2-3)',                                               type: 'checkbox' },
    ],
    compute: (vals) => {
      const inclusionsMet = !!(vals.stemiDiagnosis && vals.onsetLt12h && vals.noPci);
      const absKeys = ['priorHemorrhagicStroke', 'strokeLast3m', 'structuralCns', 'intracranialNeoplasm', 'majorTrauma', 'activeBleeding', 'aorticDissection', 'abdominalAortic', 'severeHtn'];
      const hasAbsolute = absKeys.some(k => vals[k]);
      const relKeys = ['htn', 'strokeOver3m', 'cpr', 'majorSurgery', 'internalBleeding', 'pregnancy', 'activePeptic', 'anticoagulant'];
      const relCount = relKeys.filter(k => vals[k]).length;

      if (!inclusionsMet)   return { score: '-',  label: 'Kriteria Inklusi Tidak Terpenuhi', color: 'var(--label-tertiary)', detail: 'Pastikan semua kriteria inklusi terpenuhi' };
      if (hasAbsolute)      return { score: '✗',  label: 'KONTRAINDIKASI ABSOLUT',           risk: 'Fibrinolisis TIDAK boleh diberikan',                              color: '#FF3B30', detail: 'Terdapat kontraindikasi absolut — pertimbangkan PCI rescue' };
      if (relCount >= 2)    return { score: '△',  label: 'Risiko Tinggi — Pertimbangkan Ulang', risk: `${relCount} kontraindikasi relatif — timbang risiko vs manfaat`, color: '#FF9500', detail: 'Diskusi dengan kardiolog sebelum memberikan fibrinolisis' };
      if (relCount === 1)   return { score: '△',  label: 'Kontraindikasi Relatif',           risk: '1 kontraindikasi relatif — pertimbangkan risiko',                color: '#FF9500', detail: 'Fibrinolisis dapat diberikan dengan hati-hati' };
      return                       { score: '✓',  label: 'DAPAT DIBERIKAN',                  risk: 'Tidak ada kontraindikasi terdeteksi',                            color: '#34C759', detail: 'Fibrinolisis dapat dilanjutkan' };
    },
    notes: [
      'Checklist berdasarkan ACC/AHA Guidelines STEMI 2013 + update 2022',
      'Kontraindikasi relatif bukan berarti fibrinolisis tidak boleh — timbang risiko perdarahan vs manfaat reperfusi',
      'Target door-to-needle ≤30 menit',
    ],
  },
];
