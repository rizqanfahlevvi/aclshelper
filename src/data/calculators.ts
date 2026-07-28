/* ============================================================
   ACLS Helper — Kalkulator & Skoring Kardiovaskular
   ============================================================ */
import { infusionConc, infusionRateMlHr } from '../lib/doseMath';
import type { CalcStep } from '../components/clinical';

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
  options?: { label: string; value: string | number; description?: string }[];
  points?: number;
  description?: string;
}

export interface CalcResult {
  score: number | string;
  label: string;
  risk?: string;
  color: string;
  detail?: string;
  /* Kontribusi per-parameter untuk skoring (input → poin). Ditampilkan
     via ScoreBreakdown agar dokter melihat asal skor, bukan hanya total. */
  breakdown?: { label: string; points: number }[];
  /* Rincian langkah terstruktur (label + rumus tersubstitusi + catatan),
     alternatif dari `detail` string untuk kalkulator kompleks (elektrolit). */
  steps?: CalcStep[];
  stepsFooter?: string;
  /* Blok "target koreksi aman" (judul + intro + bullet) yang tampil
     sebelum kartu dosis — dipakai kalkulator dgn batas keamanan eksplisit
     (mis. koreksi Na). */
  targetInfo?: { title: string; intro?: string; bullets: string[] };
  /* Kartu highlight dosis/volume, opsional dengan >1 metode berdampingan
     (mis. rentang dua metode koreksi Na). Menggantikan badge skor generik
     saat ada — dipakai untuk kalkulator dgn resep obat yang kompleks. */
  doseRange?: {
    title: string;
    rangeLabel: string;
    methods: { label: string; value: string; rate: string; note: string }[];
    safetyNote?: string;
    footer?: string;
  };
  /* Kartu keparahan-gated khusus koreksi hiponatremia (na-correction) —
     indikasi NaCl 3% ditentukan GEJALA, bukan angka Na (Spasovski 2014).
     Dikonsumsi oleh NaResultCard, bukan render generik. */
  naHypoCard?: {
    severity: 'berat' | 'sedang' | 'ringan';
    autoHighRisk: boolean;
    manualHighRisk: boolean;
    highRiskFinal: boolean;
    acuteExceptionApplied: boolean;
    limitLo: number;
    limitHi: number;
    onsetLabel: string;
    primary: { title: string; color: string; rateLabel?: string; bullets: string[] };
    collapseSlowCorrection: boolean;
  };
}

export interface Calculator {
  key: string;
  name: string;
  short: string;
  kind: 'scoring' | 'calculator';
  category: string;
  tint: string;
  description: string;
  source: string;
  fields: CalcField[];
  compute: (values: Record<string, number | string | boolean>) => CalcResult;
  notes?: string[];
}

/* Palet warna Rich Clinical — sumber tunggal untuk tint kategori & warna
   hasil (risk band). green/amber/red = band risiko rendah/sedang/tinggi. */
const C = {
  green:  '#1E8E3E',
  amber:  '#FFA000',
  red:    '#BA1A1A',
  blue:   '#0056B3',
  purple: '#9333EA',
  teal:   '#00838F',
  indigo: '#003F87',
  orange: '#FF6B35',
  gold:   '#F9A825',
} as const;

export const CALCULATORS: Calculator[] = [
  /* ------------------------------------------------------------------ */
  /* 1. CHA₂DS₂-VASc                                                      */
  /* ------------------------------------------------------------------ */
  {
    key: 'chads2vasc',
    kind: 'scoring',
    name: 'CHA₂DS₂-VASc',
    short: 'CHA₂DS₂-VASc',
    category: 'Fibrilasi Atrium',
    tint: C.blue,
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
      const breakdown = [
        { label: 'Gagal jantung / disfungsi LV', points: vals.chf ? 1 : 0 },
        { label: 'Hipertensi',                    points: vals.hypertension ? 1 : 0 },
        { label: 'Usia ≥ 75 tahun',               points: vals.age75 ? 2 : 0 },
        { label: 'Diabetes melitus',              points: vals.diabetes ? 1 : 0 },
        { label: 'Stroke / TIA / TE',             points: vals.stroke ? 2 : 0 },
        { label: 'Penyakit vaskular',             points: vals.vascular ? 1 : 0 },
        { label: 'Usia 65–74 tahun',              points: vals.age6574 ? 1 : 0 },
        { label: 'Jenis kelamin perempuan',       points: vals.female ? 1 : 0 },
      ];
      // Klasifikasi berbasis skor non-gender: jenis kelamin perempuan hanya
      // menaikkan ambang, bukan risiko itu sendiri. Laki-laki skor 1 dan
      // perempuan skor 2 (1 dari gender) sama-sama "pertimbangkan"; laki-laki
      // ≥2 / perempuan ≥3 baru "direkomendasikan" (AHA/ACC/HRS).
      const nonSexScore = score - (vals.female ? 1 : 0);
      if (nonSexScore <= 0) return { score, breakdown, label: 'Risiko Rendah',  risk: 'Antikoagulan umumnya tidak direkomendasikan',                         color: C.green };
      if (nonSexScore === 1) return { score, breakdown, label: 'Risiko Sedang',  risk: 'Pertimbangkan antikoagulan oral',                                     color: C.amber };
      return                        { score, breakdown, label: 'Risiko Tinggi',  risk: 'Antikoagulan oral direkomendasikan (kecuali kontraindikasi)',          color: C.red };
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
    kind: 'scoring',
    name: 'HAS-BLED',
    short: 'HAS-BLED',
    category: 'Fibrilasi Atrium',
    tint: C.amber,
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
      const breakdown = [
        { label: 'Hipertensi tidak terkontrol',   points: vals.hypertension ? 1 : 0 },
        { label: 'Gangguan ginjal / hati',        points: vals.renalLiver ? 1 : 0 },
        { label: 'Riwayat stroke',                points: vals.stroke ? 1 : 0 },
        { label: 'Riwayat / predisposisi perdarahan', points: vals.bleedHistory ? 1 : 0 },
        { label: 'INR labil (TTR <60%)',          points: vals.labileinr ? 1 : 0 },
        { label: 'Usia > 65 tahun',               points: vals.elderly ? 1 : 0 },
        { label: 'Obat / alkohol',                points: vals.drugs ? 1 : 0 },
      ];
      if (score <= 1) return { score, breakdown, label: 'Risiko Rendah',  risk: 'Perdarahan mayor <1%/tahun',                                                        color: C.green };
      if (score === 2) return { score, breakdown, label: 'Risiko Sedang', risk: 'Perdarahan mayor ~1.9%/tahun',                                                       color: C.amber };
      return                 { score, breakdown, label: 'Risiko Tinggi',  risk: 'Perdarahan mayor ≥3%/tahun — koreksi faktor risiko yang dapat dimodifikasi',         color: C.red };
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
    kind: 'scoring',
    name: 'HEART Score',
    short: 'HEART',
    category: 'ACS / Koroner',
    tint: C.red,
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
      const breakdown = [
        { label: 'Riwayat',       points: Number(vals.history) || 0 },
        { label: 'EKG',           points: Number(vals.ekg) || 0 },
        { label: 'Usia',          points: Number(vals.age) || 0 },
        { label: 'Faktor risiko', points: Number(vals.riskfactors) || 0 },
        { label: 'Troponin',      points: Number(vals.troponin) || 0 },
      ];
      if (score <= 3) return { score, breakdown, label: 'Risiko Rendah',  risk: 'MACE <2% — pertimbangkan early discharge',               color: C.green };
      if (score <= 6) return { score, breakdown, label: 'Risiko Sedang',  risk: 'MACE ~12-17% — observasi & pemeriksaan lanjutan',        color: C.amber };
      return               { score, breakdown, label: 'Risiko Tinggi',  risk: 'MACE ~50-65% — evaluasi kardiak segera / invasif',       color: C.red };
    },
    notes: [
      'Untuk nyeri dada akut tak terdiferensiasi di IGD — BUKAN untuk STEMI (yang butuh reperfusi langsung)',
      'MACE = infark miokard, PCI/CABG, atau kematian dalam 6 minggu',
      'Skor 0–3: risiko rendah, banyak protokol memulangkan setelah troponin serial negatif; 4–6: observasi/uji lanjutan; ≥7: strategi invasif',
      'Gunakan troponin high-sensitivity serial sesuai protokol lokal; korelasikan dengan gambaran klinis',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 4. GRACE Score                                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'grace',
    kind: 'scoring',
    name: 'GRACE Score',
    short: 'GRACE',
    category: 'ACS / Koroner',
    tint: C.purple,
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
      // Age
      const age = Number(vals.age) || 0;
      const agePts = age < 30 ? 0 : age < 40 ? 8 : age < 50 ? 25 : age < 60 ? 41 : age < 70 ? 58 : age < 80 ? 75 : 91;
      // HR
      const hr = Number(vals.hr) || 0;
      const hrPts = hr < 50 ? 0 : hr < 70 ? 3 : hr < 90 ? 9 : hr < 110 ? 15 : hr < 150 ? 24 : hr < 200 ? 38 : 46;
      // SBP
      const sbp = Number(vals.sbp) || 0;
      const sbpPts = sbp < 80 ? 58 : sbp < 100 ? 53 : sbp < 120 ? 43 : sbp < 140 ? 34 : sbp < 160 ? 24 : sbp < 200 ? 10 : 0;
      // Creatinine
      const cr = Number(vals.creatinine) || 0;
      const crPts = cr < 0.4 ? 1 : cr < 0.8 ? 4 : cr < 1.2 ? 7 : cr < 1.6 ? 10 : cr < 2.0 ? 13 : cr < 4.0 ? 21 : 28;
      // Killip
      const killip = Number(vals.killip) || 0;
      const killipPts = [0, 20, 39, 59][killip] || 0;
      // Checkboxes
      const caPts = vals.cardiacArrest ? 39 : 0;
      const stPts = vals.stDeviation ? 28 : 0;
      const enzPts = vals.enzymes ? 14 : 0;

      const score = agePts + hrPts + sbpPts + crPts + killipPts + caPts + stPts + enzPts;
      const breakdown = [
        { label: `Usia ${age} th`,           points: agePts },
        { label: `Laju jantung ${hr} bpm`,   points: hrPts },
        { label: `Sistolik ${sbp} mmHg`,     points: sbpPts },
        { label: `Kreatinin ${cr} mg/dL`,    points: crPts },
        { label: `Killip kelas ${killip + 1}`, points: killipPts },
        { label: 'Henti jantung saat masuk', points: caPts },
        { label: 'Deviasi segmen ST',        points: stPts },
        { label: 'Peningkatan enzim jantung', points: enzPts },
      ];

      let label: string, risk: string, color: string;
      if      (score <= 108) { label = 'Risiko Rendah'; risk = 'Mortalitas di RS <1% — pertimbangkan intervensi dini';            color = C.green; }
      else if (score <= 140) { label = 'Risiko Sedang'; risk = 'Mortalitas di RS 1-3% — revaskularisasi dini direkomendasikan';   color = C.amber; }
      else                   { label = 'Risiko Tinggi'; risk = 'Mortalitas di RS >3% — revaskularisasi segera';                   color = C.red; }
      return { score, breakdown, label, risk, color };
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
    kind: 'calculator',
    name: 'Mean Arterial Pressure',
    short: 'MAP',
    category: 'Hemodinamik',
    tint: C.green,
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
      const detail = [
        `MAP = DBP + (SBP − DBP)/3`,
        `= ${dbp} + (${sbp} − ${dbp})/3 = ${score} mmHg`,
        `\nSetara diastol + ⅓ tekanan nadi (perkiraan; monitor arteri lebih akurat pada HR ekstrem/aritmia)`,
      ].join('\n');
      if      (map < 60)  return { score, detail, label: 'Hipoperfusi',  risk: 'Perfusi organ terancam — tangani penyebab',                   color: C.red };
      else if (map < 70)  return { score, detail, label: 'Borderline',   risk: 'Pertahankan MAP ≥65 mmHg pada syok',                          color: C.amber };
      else if (map <= 100) return { score, detail, label: 'Normal',       risk: 'Target MAP tercapai',                                         color: C.green };
      else                return { score, detail, label: 'Hipertensi',   risk: 'Pertimbangkan titrasi antihipertensi',                        color: C.amber };
    },
    notes: [
      'MAP ≈ tekanan pendorong perfusi organ; target umum syok ≥ 65 mmHg (SSC 2021)',
      'Rumus diastol + ⅓ tekanan nadi meng-underestimasi MAP pada takikardia berat — pengukuran arteri langsung lebih akurat',
      'Target individual: pertimbangkan 80–85 mmHg pada hipertensi kronik / cedera ginjal akut',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 6. Shock Index                                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'si',
    kind: 'calculator',
    name: 'Shock Index',
    short: 'SI',
    category: 'Hemodinamik',
    tint: C.red,
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
      const detail = [
        `Shock Index = HR / SBP`,
        `= ${hr} / ${sbp} = ${score}`,
        `\nNormal 0.5–0.7. SI naik lebih dini daripada TD/HR tunggal pada perdarahan/sepsis`,
      ].join('\n');
      if      (si < 0.6)  return { score, detail, label: 'Normal',              risk: 'Risiko rendah',                             color: C.green };
      else if (si < 1.0)  return { score, detail, label: 'Normal-Tinggi',       risk: 'Awasi ketat',                               color: C.amber };
      else if (si < 1.5)  return { score, detail, label: 'Syok Ringan-Sedang',  risk: 'Resusitasi agresif diindikasikan',          color: C.amber };
      else                return { score, detail, label: 'Syok Berat',          risk: 'Resusitasi masif — perhatian khusus',       color: C.red };
    },
    notes: [
      'Rentang normal 0.5–0.7; SI ≥ 0.9–1.0 berkaitan dengan kebutuhan transfusi masif & mortalitas lebih tinggi',
      'Lebih sensitif dari HR atau TD sendiri untuk syok tersamar (pasien muda/kompensasi)',
      'Kurang andal pada: pemakaian beta-blocker, pacu jantung, atau hipertensi kronik (SBP basal tinggi)',
      'Shock Index Termodifikasi (MAP sebagai penyebut) & Age-SI dapat lebih spesifik pada populasi tertentu',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 7. CrCl Cockcroft-Gault                                             */
  /* ------------------------------------------------------------------ */
  {
    key: 'crcl',
    kind: 'calculator',
    name: 'CrCl Cockcroft-Gault',
    short: 'CrCl',
    category: 'Fungsi Ginjal',
    tint: C.teal,
    description: 'Estimasi klirens kreatinin (Cockcroft-Gault)',
    source: 'AHA/ACC Guidelines 2022-2025',
    fields: [
      { key: 'age',        label: 'Usia',              type: 'number',  unit: 'tahun',  min: 18,  max: 110,  defaultValue: 65  },
      { key: 'weight',     label: 'Berat Badan Aktual', type: 'number', unit: 'kg',     min: 20,  max: 300,  defaultValue: 70  },
      { key: 'height',     label: 'Tinggi Badan',       type: 'number', unit: 'cm',     min: 120, max: 220,  defaultValue: 170,
        description: 'Untuk hitung berat ideal (IBW) — pakai bila memilih basis Ideal/Adjusted' },
      { key: 'creatinine', label: 'Kreatinin Serum',   type: 'number',  unit: 'mg/dL',  min: 0.1, max: 20,   step: 0.1, defaultValue: 1.0 },
      { key: 'weightBasis', label: 'Basis Berat', type: 'select', defaultValue: 'actual',
        description: 'Berat aktual meng-overestimasi klirens pada obesitas — gunakan IBW/Adjusted bila BB ≫ ideal',
        options: [
          { label: 'Aktual', value: 'actual' },
          { label: 'Ideal (IBW)', value: 'ideal' },
          { label: 'Adjusted (obesitas)', value: 'adjusted' },
        ] },
      { key: 'female',     label: 'Jenis Kelamin Perempuan', type: 'checkbox' },
    ],
    compute: (vals) => {
      const age = Number(vals.age)        || 0;
      const actualWt = Number(vals.weight) || 0;
      const height = Number(vals.height)  || 170;
      const cr  = Number(vals.creatinine) || 1;
      const basis = String(vals.weightBasis || 'actual');
      const sex = vals.female ? 0.85 : 1;

      // Ideal Body Weight (Devine); Adjusted = IBW + 0.4×(aktual − IBW)
      const ibw = (vals.female ? 45.5 : 50) + 0.91 * (height - 152.4);
      const adjBw = ibw + 0.4 * (actualWt - ibw);
      const wt = basis === 'ideal' ? ibw
        : basis === 'adjusted' ? adjBw
        : actualWt;
      const wtUsed = Math.max(0, wt);

      const crcl = ((140 - age) * wtUsed) / (72 * cr) * sex;
      const score = Math.round(crcl) + ' mL/min';
      const basisNote = basis === 'actual' ? `Berat dipakai: aktual ${Math.round(actualWt)} kg`
        : basis === 'ideal' ? `Berat dipakai: IBW ${Math.round(ibw)} kg (dari tinggi ${height} cm)`
        : `Berat dipakai: AdjBW ${Math.round(adjBw)} kg (IBW ${Math.round(ibw)} + 0.4×selisih)`;
      const detail = `${basisNote}\nCockcroft-Gault: (140−usia)×BB / (72×Cr)${vals.female ? ' × 0.85' : ''}`;

      if      (crcl < 15)  return { score, label: 'Gagal Ginjal Berat',           risk: 'Pertimbangkan HD — sesuaikan dosis semua obat ginjal',     color: C.red, detail };
      else if (crcl < 30)  return { score, label: 'Gagal Ginjal Sedang-Berat',    risk: 'Penyesuaian dosis signifikan diperlukan',                  color: C.red, detail };
      else if (crcl < 60)  return { score, label: 'Gagal Ginjal Sedang',          risk: 'Sesuaikan dosis — kontraindikasi beberapa obat',           color: C.amber, detail };
      else if (crcl < 90)  return { score, label: 'Gagal Ginjal Ringan',          risk: 'Pantau fungsi ginjal',                                     color: C.amber, detail };
      else                 return { score, label: 'Normal / Sedikit Menurun',     risk: 'Dosis standar umumnya aman',                              color: C.green, detail };
    },
    notes: [
      'Berat aktual meng-overestimasi klirens pada obesitas — gunakan IBW (bila BB < ideal, pakai berat aktual) atau AdjBW',
      'AdjBW = IBW + 0.4 × (berat aktual − IBW), dipakai bila berat aktual > 120–130% IBW',
      'Cockcroft-Gault memperkirakan CrCl, bukan eGFR — untuk dosing obat, banyak label memakai CrCl C-G',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 8. Fibrinolytic STEMI Checklist                                     */
  /* ------------------------------------------------------------------ */
  {
    key: 'fibrinolytic',
    kind: 'calculator',
    name: 'Fibrinolisis STEMI',
    short: 'Fibrinolisis',
    category: 'ACS / Koroner',
    tint: C.red,
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
      if (hasAbsolute)      return { score: '✗',  label: 'KONTRAINDIKASI ABSOLUT',           risk: 'Fibrinolisis TIDAK boleh diberikan',                              color: C.red, detail: 'Terdapat kontraindikasi absolut — pertimbangkan PCI rescue' };
      if (relCount >= 2)    return { score: '△',  label: 'Risiko Tinggi — Pertimbangkan Ulang', risk: `${relCount} kontraindikasi relatif — timbang risiko vs manfaat`, color: C.amber, detail: 'Diskusi dengan kardiolog sebelum memberikan fibrinolisis' };
      if (relCount === 1)   return { score: '△',  label: 'Kontraindikasi Relatif',           risk: '1 kontraindikasi relatif — pertimbangkan risiko',                color: C.amber, detail: 'Fibrinolisis dapat diberikan dengan hati-hati' };
      return                       { score: '✓',  label: 'DAPAT DIBERIKAN',                  risk: 'Tidak ada kontraindikasi terdeteksi',                            color: C.green, detail: 'Fibrinolisis dapat dilanjutkan' };
    },
    notes: [
      'Checklist berdasarkan ACC/AHA Guidelines STEMI 2013 + update 2022',
      'Kontraindikasi relatif bukan berarti fibrinolisis tidak boleh — timbang risiko perdarahan vs manfaat reperfusi',
      'Target door-to-needle ≤30 menit',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 9. ABG / Acid-Base Interpreter                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'abg',
    kind: 'calculator',
    name: 'ABG / Asidosis-Alkalosis',
    short: 'ABG',
    category: 'Kritis',
    tint: C.purple,
    description: 'Interpretasi gas darah arteri step-by-step',
    source: 'Brandis Acid-Base; AHA/ACCP Critical Care Guidelines',
    fields: [
      { key: 'ph',   label: 'pH Darah',       type: 'number', min: 6.5,  max: 8.0,  step: 0.01, defaultValue: 7.40, unit: '' },
      { key: 'pco2', label: 'PaCO₂',          type: 'number', min: 5,    max: 120,  step: 1,    defaultValue: 40,   unit: 'mmHg' },
      { key: 'hco3', label: 'HCO₃⁻',         type: 'number', min: 1,    max: 60,   step: 0.5,  defaultValue: 24,   unit: 'mEq/L' },
      { key: 'na',   label: 'Na⁺ (opsional)', type: 'number', min: 100,  max: 180,  step: 1,    defaultValue: 140,  unit: 'mEq/L' },
      { key: 'cl',   label: 'Cl⁻ (opsional)', type: 'number', min: 60,   max: 140,  step: 1,    defaultValue: 104,  unit: 'mEq/L' },
    ],
    compute: (v) => {
      const ph   = Number(v.ph)   || 7.40;
      const pco2 = Number(v.pco2) || 40;
      const hco3 = Number(v.hco3) || 24;
      const na   = Number(v.na)   || 140;
      const cl   = Number(v.cl)   || 104;

      // Step 1 — pH state
      const phState = ph < 7.35 ? 'acidemia' : ph > 7.45 ? 'alkalemia' : 'normal';

      // Step 2 — Primary disorder
      let primary = '';
      let primaryCode = '';
      if (phState === 'acidemia') {
        if (pco2 > 45 && hco3 >= 22)         { primary = 'Asidosis Respiratorik'; primaryCode = 'resp-acid'; }
        else if (hco3 < 22 && pco2 <= 45)    { primary = 'Asidosis Metabolik';    primaryCode = 'met-acid';  }
        else if (pco2 > 45 && hco3 < 22)     { primary = 'Asidosis Campuran (Respiratorik + Metabolik)'; primaryCode = 'mixed-acid'; }
        else                                  { primary = 'Asidosis Respiratorik'; primaryCode = 'resp-acid'; }
      } else if (phState === 'alkalemia') {
        if (pco2 < 35 && hco3 <= 26)         { primary = 'Alkalosis Respiratorik'; primaryCode = 'resp-alk'; }
        else if (hco3 > 26 && pco2 >= 35)    { primary = 'Alkalosis Metabolik';    primaryCode = 'met-alk';  }
        else if (pco2 < 35 && hco3 > 26)     { primary = 'Alkalosis Campuran (Respiratorik + Metabolik)'; primaryCode = 'mixed-alk'; }
        else                                  { primary = 'Alkalosis Respiratorik'; primaryCode = 'resp-alk'; }
      } else {
        // pH normal — bisa (a) gangguan kronik terkompensasi penuh, atau
        // (b) gangguan campuran yang saling meniadakan. Keduanya
        // menghasilkan pola sama; korelasikan dengan klinis.
        if (pco2 > 45 && hco3 > 26)          { primary = 'Resp. Asidosis kronik terkompensasi ATAU campuran (Resp. Asidosis + Met. Alkalosis)'; primaryCode = 'comp'; }
        else if (pco2 < 35 && hco3 < 22)     { primary = 'Resp. Alkalosis kronik terkompensasi ATAU campuran (Resp. Alkalosis + Met. Asidosis)'; primaryCode = 'comp'; }
        else                                  { primary = 'Normal'; primaryCode = 'normal'; }
      }

      // Step 3 — Anion Gap
      const ag = na - (cl + hco3);
      const agHigh = ag > 12;
      const agLine = `AG = ${na} − (${cl} + ${hco3}) = ${ag} mEq/L ${agHigh ? '↑ TINGGI (>12)' : ag < 8 ? '↓ RENDAH (<8)' : '(Normal 8–12)'}`;

      // Step 4 — Expected compensation
      let compLine = '';
      let compStatus = '';
      if (primaryCode === 'met-acid') {
        const expPco2Low  = Math.round(1.5 * hco3 + 8 - 2);
        const expPco2High = Math.round(1.5 * hco3 + 8 + 2);
        compLine = `Expected PaCO₂ (Winter's) = ${expPco2Low}–${expPco2High} mmHg, actual = ${pco2} mmHg`;
        compStatus = pco2 >= expPco2Low && pco2 <= expPco2High
          ? 'Kompensasi respiratorik ADEKUAT'
          : pco2 < expPco2Low ? 'Kompensasi respiratorik BERLEBIH → kemungkinan Mixed Respiratory Alkalosis'
          : 'Kompensasi respiratorik KURANG → kemungkinan Mixed Respiratory Acidosis';
      } else if (primaryCode === 'met-alk') {
        const expPco2Low  = Math.round(0.7 * (hco3 - 24) + 40 - 5);
        const expPco2High = Math.round(0.7 * (hco3 - 24) + 40 + 5);
        compLine = `Expected PaCO₂ = ${expPco2Low}–${expPco2High} mmHg, actual = ${pco2} mmHg`;
        compStatus = pco2 >= expPco2Low && pco2 <= expPco2High
          ? 'Kompensasi respiratorik ADEKUAT'
          : pco2 < expPco2Low ? 'Hiperventilasi melebihi kompensasi → Mixed Respiratory Alkalosis'
          : 'Hipoventilasi → Mixed Respiratory Acidosis';
      } else if (primaryCode === 'resp-acid') {
        const expHco3Acute   = Math.round(24 + (pco2 - 40) / 10);
        const expHco3Chronic = Math.round(24 + 3.5 * (pco2 - 40) / 10);
        compLine = `Expected HCO₃⁻: Akut ≈ ${expHco3Acute} | Kronik ≈ ${expHco3Chronic} mEq/L, actual = ${hco3}`;
        const deltaFromAcute   = Math.abs(hco3 - expHco3Acute);
        const deltaFromChronic = Math.abs(hco3 - expHco3Chronic);
        compStatus = deltaFromAcute <= 2 ? 'Sesuai asidosis respiratorik AKUT'
          : deltaFromChronic <= 3 ? 'Sesuai asidosis respiratorik KRONIK'
          : hco3 > expHco3Chronic + 3 ? 'HCO₃⁻ tinggi melebihi kompensasi → Mixed Metabolic Alkalosis'
          : 'HCO₃⁻ rendah dari kompensasi → Mixed Metabolic Acidosis';
      } else if (primaryCode === 'resp-alk') {
        const expHco3Acute   = Math.round(24 - (40 - pco2) / 5);
        const expHco3Chronic = Math.round(24 - 5 * (40 - pco2) / 10);
        compLine = `Expected HCO₃⁻: Akut ≈ ${expHco3Acute} | Kronik ≈ ${expHco3Chronic} mEq/L, actual = ${hco3}`;
        compStatus = Math.abs(hco3 - expHco3Acute) <= 2 ? 'Sesuai alkalosis respiratorik AKUT'
          : Math.abs(hco3 - expHco3Chronic) <= 3 ? 'Sesuai alkalosis respiratorik KRONIK'
          : hco3 < expHco3Chronic - 3 ? 'HCO₃⁻ rendah → Mixed Metabolic Acidosis'
          : 'HCO₃⁻ tinggi → Mixed Metabolic Alkalosis';
      }

      // Step 5 — Delta-Delta ratio (for high AG metabolic acidosis)
      let deltaLine = '';
      if (primaryCode === 'met-acid' && agHigh) {
        const deltaAg  = ag - 12;
        const deltaHco3 = 24 - hco3;
        const ratio = deltaHco3 !== 0 ? (deltaAg / deltaHco3).toFixed(2) : '—';
        const ratioNum = Number(ratio);
        const ddInterp = ratioNum < 0.4 ? 'Normal AG acidosis tambahan (mixed)'
          : ratioNum < 0.8 ? 'Mixed High AG + Normal AG acidosis'
          : ratioNum <= 2  ? 'High AG Metabolic Acidosis murni'
          : 'Underlying Metabolic Alkalosis (HCO₃ lebih tinggi dari expected)';
        deltaLine = `Delta ratio (ΔAG/ΔHCO₃) = ${deltaAg}/${deltaHco3} = ${ratio} → ${ddInterp}`;
      }

      const color = phState === 'acidemia' ? C.red : phState === 'alkalemia' ? C.blue : C.green;
      const score = phState === 'normal' ? 'Normal' : phState === 'acidemia' ? 'Asidemia' : 'Alkalemia';

      const detail = [primary, agLine, compLine, compStatus, deltaLine].filter(Boolean).join('\n');
      return { score, label: primary, color, detail };
    },
    notes: [
      'Masukkan nilai Na⁺ dan Cl⁻ untuk menghitung Anion Gap',
      'Kompensasi dihitung berdasarkan Winter\'s formula (met. acidosis), 0.7×ΔHCO₃ (met. alkalosis), dan formula akut/kronik untuk gangguan respiratorik',
      'Delta-delta ratio dihitung otomatis bila AG tinggi (>12)',
      'Interpretasi ini bersifat panduan — korelasikan dengan klinis pasien',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 10. RSI — Rapid Sequence Intubation                                 */
  /* ------------------------------------------------------------------ */
  {
    key: 'rsi',
    kind: 'calculator',
    name: 'RSI — Intubasi Cepat',
    short: 'RSI',
    category: 'Prosedur',
    tint: C.orange,
    description: 'Dosis pretreatment, induksi & paralitik — IBW utk agen induksi, BB aktual utk paralitik',
    source: 'Roberts & Hedges Emergency Medicine; UpToDate RSI 2024; Devine BJ. Drug Intell Clin Pharm 1974;8:650 (formula IBW)',
    fields: [
      { key: 'weight', label: 'Berat Badan Aktual', type: 'number', min: 10, max: 200, step: 1, defaultValue: 70, unit: 'kg' },
      { key: 'sex', label: 'Jenis Kelamin', type: 'select', defaultValue: 'male',
        options: [{ label: 'Laki-laki', value: 'male' }, { label: 'Perempuan', value: 'female' }] },
      { key: 'height', label: 'Tinggi Badan', type: 'number', min: 120, max: 220, step: 1, defaultValue: 170, unit: 'cm',
        description: 'Untuk hitung berat ideal (IBW) — dipakai agen pretreatment/induksi pada obesitas, BUKAN suksinilkolin/rokuronil/sugammadex' },
      {
        key: 'context', label: 'Konteks Klinis', type: 'select', defaultValue: 'routine',
        options: [
          { label: 'Rutin / Airway Protection',        value: 'routine' },
          { label: 'Instabilitas Hemodinamik',         value: 'hemodynamic' },
          { label: 'TIK Meningkat / Trauma Kepala',    value: 'icp' },
          { label: 'Asma / Bronkospasme',              value: 'asthma' },
        ],
      },
      {
        key: 'suxContra', label: 'Suksinilkolin dikontraindikasikan?', type: 'checkbox',
        description: 'Hiperkalemia, rhabdomiolisis, cedera tulang belakang kronik, luka bakar >24 jam, denervasi',
      },
    ],
    compute: (v) => {
      const wt = Math.max(10, Math.min(200, Number(v.weight) || 70));
      const sex = String(v.sex || 'male');
      const height = Math.max(120, Math.min(220, Number(v.height) || 170));
      const ctx = String(v.context || 'routine');
      const suxContra = Boolean(v.suxContra);

      // Ideal Body Weight (Devine 1974 — formula sama dgn crcl/vent di app
      // ini). Dipakai utk agen pretreatment/induksi (fentanyl, lidokain,
      // ketamin, etomidat, propofol) HANYA bila BB aktual > IBW (obesitas);
      // paralitik (suksinilkolin/rokuronil) & sugammadex tetap pakai BB
      // aktual — sesuai notes yang sudah ada sebelumnya (dulu tidak
      // benar-benar diterapkan di compute(), hanya teks).
      const ibw = Math.max(0, (sex === 'female' ? 45.5 : 50) + 0.91 * (height - 152.4));
      // Ambang 120% IBW — sama dgn konvensi AdjBW yang sudah dipakai `crcl`
      // di app ini ("dipakai bila berat aktual > 120–130% IBW"). BB aktual
      // sedikit di atas IBW itu NORMAL, bukan obesitas — jangan alihkan ke
      // IBW kecuali BB aktual jelas melebihi ambang ini.
      const isObese = ibw > 0 && wt > ibw * 1.2;
      const inductionWt = isObese ? ibw : wt;

      // Recommended induction agent per context
      const inductionRec = ctx === 'hemodynamic' ? 'ketamine' : ctx === 'asthma' ? 'ketamine' : 'etomidate';
      const paralytic = suxContra ? 'rocuronium' : 'succinylcholine';

      const shockWarning = ctx === 'hemodynamic'
        ? '\n⚠️ Instabilitas hemodinamik: pertimbangkan dosis induksi lebih RENDAH dari dosis rutin di atas ("shock dose") dan/atau resusitasi cairan/vasopressor sebelum induksi — dosis di atas dihitung untuk pasien hemodinamik stabil.'
        : '';

      // Summary for CalcResult (actual detail rendered by RsiResultCard)
      return {
        score: `${wt} kg`,
        label: `${inductionRec === 'ketamine' ? 'Ketamin' : 'Etomidat'} + ${paralytic === 'rocuronium' ? 'Rokuronil' : 'Suksinilkolin'}`,
        color: C.orange,
        detail: [
          isObese ? `IBW dipakai utk agen induksi: ${inductionWt.toFixed(1)} kg (BB aktual ${wt} kg, tinggi ${height} cm)` : null,
          `Fentanyl pretreatment: ${Math.round(3 * inductionWt)} mcg IV`,
          `Ketamin: ${Math.round(1.5 * inductionWt)} mg IV`,
          `Etomidat: ${(0.3 * inductionWt).toFixed(1)} mg IV`,
          `Propofol: ${Math.round(1.5 * inductionWt)} mg IV`,
          `Suksinilkolin (BB aktual): ${Math.round(1.5 * wt)} mg IV`,
          `Rokuronil (BB aktual): ${Math.round(1.2 * wt)} mg IV`,
          `Sugammadex reversal (BB aktual): ${Math.round(16 * wt)} mg IV`,
        ].filter(Boolean).join('\n') + shockWarning,
      };
    },
    notes: [
      'Dosis agen pretreatment/induksi (fentanyl, lidokain, ketamin, etomidat, propofol) dihitung dari IBW (Devine) bila BB aktual > ideal; suksinilkolin, rokuronil & sugammadex tetap dari BB AKTUAL',
      'Instabilitas hemodinamik: pertimbangkan reduksi dosis induksi ("shock dose") sesuai judgment klinis — kalkulator ini TIDAK otomatis menurunkan angka di atas',
      'Rokuronil dosis tinggi (1.2 mg/kg) memiliki onset setara suksinilkolin — pilih bila sux dikontraindikasikan',
      'Sugammadex 16 mg/kg dapat mereversibel rokuronil dalam 3 menit (simpan sebagai "cannot intubate, cannot oxygenate" backup)',
      'Etomidat dikontraindikasikan relatif pada sepsis — pertimbangkan ketamin sebagai alternatif',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 11. TIMI Risk Score for UA/NSTEMI                                   */
  /* ------------------------------------------------------------------ */
  {
    key: 'timi-ua',
    kind: 'scoring',
    name: 'TIMI UA/NSTEMI',
    short: 'TIMI UA',
    category: 'ACS / Koroner',
    tint: C.orange,
    description: 'Risiko 14 hari MACE pada UA/NSTEMI',
    source: 'Antman et al. JAMA 2000; AHA/ACC Guidelines',
    fields: [
      { key: 'age65',      label: 'Usia ≥ 65 tahun',                               type: 'checkbox', points: 1 },
      { key: 'riskFactor', label: '≥ 3 faktor risiko KAD',                         type: 'checkbox', points: 1,
        description: 'Riwayat keluarga, hipertensi, hiperkolesterol, DM, perokok aktif' },
      { key: 'stenosis',   label: 'Stenosis koroner ≥ 50% yang diketahui',         type: 'checkbox', points: 1 },
      { key: 'stChange',   label: 'Deviasi segmen ST ≥ 0.5 mm pada EKG',           type: 'checkbox', points: 1 },
      { key: 'angina2',    label: '≥ 2 episode angina dalam 24 jam terakhir',       type: 'checkbox', points: 1 },
      { key: 'aspirin',    label: 'Penggunaan Aspirin dalam 7 hari terakhir',       type: 'checkbox', points: 1 },
      { key: 'marker',     label: 'Peningkatan marker jantung (Troponin / CK-MB)', type: 'checkbox', points: 1 },
    ],
    compute: (v) => {
      const score = (['age65','riskFactor','stenosis','stChange','angina2','aspirin','marker'] as const)
        .reduce((s, k) => s + (v[k] ? 1 : 0), 0);
      const riskMap: Record<number, { pct: string; label: string; color: string }> = {
        0: { pct: '5%',  label: 'Risiko Rendah',          color: C.green },
        1: { pct: '5%',  label: 'Risiko Rendah',          color: C.green },
        2: { pct: '8%',  label: 'Risiko Rendah',          color: C.green },
        3: { pct: '13%', label: 'Risiko Menengah',        color: C.amber },
        4: { pct: '20%', label: 'Risiko Menengah',        color: C.amber },
        5: { pct: '26%', label: 'Risiko Tinggi',          color: C.red },
        6: { pct: '41%', label: 'Risiko Sangat Tinggi',   color: C.red },
        7: { pct: '41%', label: 'Risiko Sangat Tinggi',   color: C.red },
      };
      const r = riskMap[score] || riskMap[7];
      const breakdown = [
        { label: 'Usia ≥ 65 tahun',            points: v.age65 ? 1 : 0 },
        { label: '≥ 3 faktor risiko KAD',      points: v.riskFactor ? 1 : 0 },
        { label: 'Stenosis koroner ≥ 50%',     points: v.stenosis ? 1 : 0 },
        { label: 'Deviasi ST ≥ 0.5 mm',        points: v.stChange ? 1 : 0 },
        { label: '≥ 2 episode angina / 24 jam', points: v.angina2 ? 1 : 0 },
        { label: 'Aspirin dalam 7 hari',       points: v.aspirin ? 1 : 0 },
        { label: 'Marker jantung meningkat',   points: v.marker ? 1 : 0 },
      ];
      return {
        score,
        breakdown,
        label: r.label,
        risk: `Risiko MACE 14 hari: ${r.pct}`,
        color: r.color,
        detail: score <= 2
          ? 'Pertimbangkan observasi + strategi konservatif dengan evaluasi ulang'
          : score <= 4
          ? 'Pertimbangkan early invasive strategy dalam 24–48 jam (angiografi)'
          : 'Strategi invasif dini direkomendasikan (angiografi segera)',
      };
    },
    notes: [
      'TIMI UA/NSTEMI memprediksi gabungan: kematian, MI baru, atau iskemia berat yang butuh revaskularisasi darurat dalam 14 hari',
      'Skor ≥3 → strategi invasif dini (NSTEMI ESC Grade I-A)',
      'Faktor risiko KAD: riwayat keluarga 1st-degree, HTN, hiperlipidemia, DM, merokok aktif',
      'Gunakan bersama GRACE score untuk stratifikasi lebih komprehensif',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 12. TIMI Risk Score for STEMI                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'timi-stemi',
    kind: 'scoring',
    name: 'TIMI STEMI',
    short: 'TIMI STEMI',
    category: 'ACS / Koroner',
    tint: C.red,
    description: 'Prediksi mortalitas 30 hari pada STEMI',
    source: 'Morrow et al. Circulation 2000; InTIME II Trial',
    fields: [
      { key: 'age',       label: 'Usia',                            type: 'select', defaultValue: 'lt65',
        options: [
          { label: '< 65 tahun',   value: 'lt65'  },
          { label: '65–74 tahun',  value: '65-74' },
          { label: '≥ 75 tahun',   value: 'gte75' },
        ] },
      { key: 'dm_htn',    label: 'DM, Hipertensi, atau Angina',      type: 'checkbox', points: 1 },
      { key: 'sbpLow',    label: 'Tekanan Sistolik < 100 mmHg',      type: 'checkbox', points: 3 },
      { key: 'hrHigh',    label: 'Laju Jantung > 100 bpm',           type: 'checkbox', points: 2 },
      { key: 'killip',    label: 'Killip Kelas II–IV',               type: 'checkbox', points: 2,
        description: 'Kelas II: ronki / S3; III: edema paru; IV: syok kardiogenik' },
      { key: 'weightLow', label: 'Berat Badan < 67 kg',              type: 'checkbox', points: 1 },
      { key: 'anterior',  label: 'Elevasi ST anterior atau LBBB',    type: 'checkbox', points: 1 },
      { key: 'timeDelay', label: 'Waktu ke reperfusi > 4 jam',       type: 'checkbox', points: 1 },
    ],
    compute: (v) => {
      const agePts = v.age === 'gte75' ? 3 : v.age === '65-74' ? 2 : 0;
      const score = agePts +
        (v.dm_htn ? 1 : 0) + (v.sbpLow ? 3 : 0) + (v.hrHigh ? 2 : 0) +
        (v.killip ? 2 : 0) + (v.weightLow ? 1 : 0) + (v.anterior ? 1 : 0) + (v.timeDelay ? 1 : 0);
      const breakdown = [
        { label: 'Usia (≥75: 3 · 65–74: 2)', points: agePts },
        { label: 'DM / HTN / Angina',        points: v.dm_htn ? 1 : 0 },
        { label: 'Sistolik < 100 mmHg',      points: v.sbpLow ? 3 : 0 },
        { label: 'Laju jantung > 100 bpm',   points: v.hrHigh ? 2 : 0 },
        { label: 'Killip kelas II–IV',       points: v.killip ? 2 : 0 },
        { label: 'Berat badan < 67 kg',      points: v.weightLow ? 1 : 0 },
        { label: 'ST anterior / LBBB',       points: v.anterior ? 1 : 0 },
        { label: 'Waktu ke reperfusi > 4 jam', points: v.timeDelay ? 1 : 0 },
      ];

      // 30-day mortality per skor (Morrow et al. Circulation 2000, InTIME II).
      // Pemetaan per-skor eksak — jangan pakai "score <= max" karena skor 0
      // dan 1 punya mortalitas berbeda (0.8% vs 1.6%).
      const mortalityByScore: Record<number, [string, string, string]> = {
        0: ['0.8%',  'Risiko Rendah',    C.green],
        1: ['1.6%',  'Risiko Rendah',    C.green],
        2: ['2.2%',  'Risiko Rendah',    C.green],
        3: ['4.4%',  'Risiko Menengah',  C.amber],
        4: ['7.3%',  'Risiko Menengah',  C.amber],
        5: ['12.4%', 'Risiko Tinggi',    C.red],
        6: ['16.1%', 'Risiko Tinggi',    C.red],
        7: ['23.4%', 'Risiko Tinggi',    C.red],
        8: ['26.8%', 'Risiko Sangat Tinggi', C.red],
      };
      const [pct, label, color] = score >= 9
        ? ['35.9%', 'Risiko Sangat Tinggi', C.red]
        : mortalityByScore[score];

      return {
        score,
        breakdown,
        label,
        risk: `Mortalitas 30 hari: ${pct}`,
        color,
        detail: score <= 3
          ? 'Reperfusi segera, standar perawatan STEMI. Pertimbangkan fibrinolisis jika PCI tidak tersedia'
          : score <= 5
          ? 'PCI primer lebih diutamakan daripada fibrinolisis. Monitoring intensif 24–48 jam'
          : 'Risiko tinggi — pertimbangkan IABP, dukungan hemodinamik, atau transfer emergensi ke pusat PCI',
      };
    },
    notes: [
      'TIMI STEMI memprediksi mortalitas 30 hari; skor lebih tinggi = mortalitas lebih tinggi',
      'Killip I: tidak ada gagal jantung; II: ronki, S3, atau JVD; III: edema paru akut; IV: syok kardiogenik',
      'Skor ≥5 → pertimbangkan PCI primer lebih aktif, transfer ke pusat kardiologi tersier jika diperlukan',
      'Gunakan bersama GRACE dan strategi reperfusi untuk pengambilan keputusan STEMI',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 13. Wells Score for PE                                              */
  /* ------------------------------------------------------------------ */
  {
    key: 'wells-pe',
    kind: 'scoring',
    name: 'Wells Score PE',
    short: 'Wells PE',
    category: 'Tromboembolisme',
    tint: C.indigo,
    description: 'Probabilitas klinis emboli paru (PE)',
    source: 'Wells et al. Lancet 1999; Thromb Haemost 2000',
    fields: [
      { key: 'dvtSigns',   label: 'Tanda/gejala klinis DVT',                             type: 'checkbox', points: 3,
        description: 'Nyeri tekan ekstremitas bawah + pembengkakan' },
      { key: 'altDx',      label: 'Diagnosis alternatif kurang mungkin dari PE',          type: 'checkbox', points: 3 },
      { key: 'hrHigh',     label: 'Denyut jantung > 100 bpm',                            type: 'checkbox', points: 2 },
      { key: 'immobile',   label: 'Imobilisasi atau operasi dalam 4 minggu terakhir',    type: 'checkbox', points: 2 },
      { key: 'priorDvtPe', label: 'DVT atau PE sebelumnya',                              type: 'checkbox', points: 2 },
      { key: 'hemoptysis', label: 'Hemoptisis',                                          type: 'checkbox', points: 1 },
      { key: 'malignancy', label: 'Keganasan aktif',                                     type: 'checkbox', points: 1,
        description: 'Terapi dalam 6 bulan terakhir atau paliatif' },
    ],
    compute: (v) => {
      const score = (v.dvtSigns ? 3 : 0) + (v.altDx ? 3 : 0) + (v.hrHigh ? 2 : 0) +
        (v.immobile ? 2 : 0) + (v.priorDvtPe ? 2 : 0) + (v.hemoptysis ? 1 : 0) + (v.malignancy ? 1 : 0);
      const breakdown = [
        { label: 'Tanda/gejala klinis DVT',        points: v.dvtSigns ? 3 : 0 },
        { label: 'Dx alternatif kurang mungkin',   points: v.altDx ? 3 : 0 },
        { label: 'Denyut jantung > 100 bpm',       points: v.hrHigh ? 2 : 0 },
        { label: 'Imobilisasi / operasi ≤ 4 mgg',  points: v.immobile ? 2 : 0 },
        { label: 'DVT / PE sebelumnya',            points: v.priorDvtPe ? 2 : 0 },
        { label: 'Hemoptisis',                     points: v.hemoptysis ? 1 : 0 },
        { label: 'Keganasan aktif',                points: v.malignancy ? 1 : 0 },
      ];

      // Two-level Wells (most commonly used in ED)
      if (score > 4) {
        return {
          score,
          breakdown,
          label: 'PE Likely — Lakukan CT-PA',
          risk: `Skor ${score} > 4 — probabilitas PE tinggi`,
          color: C.red,
          detail: 'CT pulmonary angiography (CT-PA) direkomendasikan sebagai langkah diagnostik berikutnya. Pertimbangkan antikoagulasi empiris sambil menunggu hasil imaging jika tidak ada kontraindikasi',
        };
      }
      return {
        score,
        breakdown,
        label: 'PE Unlikely — Periksa D-Dimer',
        risk: `Skor ${score} ≤ 4 — probabilitas PE rendah`,
        color: score <= 1 ? C.green : C.amber,
        detail: score <= 1
          ? 'Pertimbangkan PERC Rule: jika semua 8 kriteria PERC terpenuhi, PE dapat disingkirkan tanpa D-dimer. Jika tidak, lakukan D-dimer'
          : 'D-dimer sensitif; jika negatif (<500 ng/mL), PE dapat disingkirkan. Jika positif → CT-PA',
      };
    },
    notes: [
      'Two-level Wells (PE Likely vs Unlikely, cut-off 4) lebih direkomendasikan dibanding three-level untuk penggunaan klinis sehari-hari',
      'Jika Wells ≤1 DAN PERC negatif → PE dapat disingkirkan tanpa D-dimer (ESC 2019)',
      'D-dimer age-adjusted: batas atas = usia × 10 mcg/L untuk pasien ≥50 tahun',
      'Pertimbangkan antikoagulasi empiris pada skor tinggi atau kondisi pasien tidak stabil',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 14. Ventilasi Mekanik — ARDSnet Tidal Volume & P/F                  */
  /* ------------------------------------------------------------------ */
  {
    key: 'vent',
    kind: 'calculator',
    name: 'Ventilasi Mekanik (ARDSnet)',
    short: 'Ventilator',
    category: 'Kritis',
    tint: C.blue,
    description: 'Volume tidal berbasis PBW & rasio P/F (Berlin)',
    source: 'ARDSNet NEJM 2000; Berlin Definition JAMA 2012',
    fields: [
      { key: 'sex',    label: 'Jenis Kelamin', type: 'select', defaultValue: 'male',
        options: [{ label: 'Laki-laki', value: 'male' }, { label: 'Perempuan', value: 'female' }] },
      { key: 'height', label: 'Tinggi Badan', type: 'number', min: 120, max: 220, step: 1, defaultValue: 170, unit: 'cm' },
      { key: 'pao2',   label: 'PaO₂ (opsional)', type: 'number', min: 20, max: 600, step: 1, defaultValue: 90, unit: 'mmHg' },
      { key: 'fio2',   label: 'FiO₂ (opsional)', type: 'number', min: 21, max: 100, step: 1, defaultValue: 50, unit: '%' },
    ],
    compute: (v) => {
      const sex = String(v.sex || 'male');
      const height = Math.max(120, Math.min(220, Number(v.height) || 170));
      const pao2 = Number(v.pao2) || 0;
      const fio2 = Number(v.fio2) || 0;

      // Predicted Body Weight (Devine / ARDSnet)
      const pbw = (sex === 'female' ? 45.5 : 50) + 0.91 * (height - 152.4);
      const pbwR = Math.round(pbw * 10) / 10;
      const vt6 = Math.round(6 * pbw);
      const vt4 = Math.round(4 * pbw);
      const vt8 = Math.round(8 * pbw);

      // P/F ratio & Berlin severity
      let pfLine = '';
      let severity = '';
      let color: string = C.blue;
      if (pao2 > 0 && fio2 >= 21) {
        const pf = Math.round(pao2 / (fio2 / 100));
        if (pf >= 300)      { severity = 'Normal / non-ARDS'; color = C.green; }
        else if (pf >= 200) { severity = 'ARDS Ringan (200–300)'; color = C.gold; }
        else if (pf >= 100) { severity = 'ARDS Sedang (100–200)'; color = C.amber; }
        else                { severity = 'ARDS Berat (<100)'; color = C.red; }
        pfLine = `P/F = ${pao2} / ${(fio2 / 100).toFixed(2)} = ${pf} mmHg → ${severity}`;
      }

      const detail = [
        `PBW = ${pbwR} kg (${sex === 'female' ? 'P' : 'L'}, ${height} cm)`,
        `Vt target 6 mL/kg = ${vt6} mL (rentang ${vt4}–${vt8} mL)`,
        `Target plateau pressure < 30 cmH₂O`,
        pfLine,
      ].filter(Boolean).join('\n');

      return { score: `${vt6} mL`, label: severity || `Vt 6 mL/kg PBW`, color, detail };
    },
    notes: [
      'PBW (Predicted Body Weight) dihitung dari tinggi badan & jenis kelamin — bukan berat aktual',
      'Strategi lung-protective ARDSnet: Vt 6 mL/kg PBW, plateau pressure ≤30 cmH₂O',
      'Turunkan Vt hingga 4 mL/kg jika plateau >30 cmH₂O; target pH ≥7.30 (permissive hypercapnia)',
      'Rasio P/F memerlukan PEEP ≥5 cmH₂O untuk klasifikasi ARDS Berlin',
      'Pertimbangkan posisi prone bila P/F <150 dan ventilasi proteksi optimal',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 15. Heparin Drip — Weight-Based (Raschke Nomogram)                  */
  /* ------------------------------------------------------------------ */
  {
    key: 'heparin',
    kind: 'calculator',
    name: 'Heparin Drip (Berbasis BB)',
    short: 'Heparin',
    category: 'Tromboembolisme',
    tint: C.purple,
    description: 'Bolus & infus heparin tak terfraksi (UFH) per protokol',
    source: 'Raschke et al. Ann Intern Med 1993; CHEST/AHA Guidelines',
    fields: [
      { key: 'weight',     label: 'Berat Badan', type: 'number', min: 30, max: 200, step: 1, defaultValue: 70, unit: 'kg' },
      { key: 'indication', label: 'Indikasi', type: 'select', defaultValue: 'vte',
        options: [
          { label: 'VTE (DVT / PE)', value: 'vte' },
          { label: 'ACS / Sindrom Koroner Akut', value: 'acs' },
        ] },
    ],
    compute: (v) => {
      const wt = Math.max(30, Math.min(200, Number(v.weight) || 70));
      const ind = String(v.indication || 'vte');

      let bolusPerKg: number, bolusCap: number, ratePerKg: number, rateCap: number;
      if (ind === 'acs') {
        bolusPerKg = 60; bolusCap = 4000; ratePerKg = 12; rateCap = 1000;
      } else {
        bolusPerKg = 80; bolusCap = 10000; ratePerKg = 18; rateCap = Infinity;
      }
      const bolus = Math.min(Math.round(bolusPerKg * wt), bolusCap);
      const rate  = Math.min(Math.round(ratePerKg * wt), rateCap);

      const indLabel = ind === 'acs' ? 'ACS' : 'VTE';
      const detail = [
        `Bolus awal: ${bolus} unit IV (${bolusPerKg} U/kg${bolus === bolusCap ? `, maks ${bolusCap}` : ''})`,
        `Infus awal: ${rate} unit/jam (${ratePerKg} U/kg/jam${rate === rateCap && rateCap !== Infinity ? `, maks ${rateCap}` : ''})`,
        `Cek aPTT awal dalam 6 jam, lalu titrasi per nomogram`,
        `Target aPTT 1.5–2.5× kontrol (atau anti-Xa 0.3–0.7 IU/mL)`,
      ].join('\n');

      return { score: `${bolus} U`, label: `Bolus + ${rate} U/jam (${indLabel})`, color: C.purple, detail };
    },
    notes: [
      'Protokol VTE (Raschke): bolus 80 U/kg, infus 18 U/kg/jam',
      'Protokol ACS: bolus 60 U/kg (maks 4000 U), infus 12 U/kg/jam (maks 1000 U/jam)',
      'Titrasi berbasis aPTT setiap 6 jam hingga 2 nilai terapeutik berturut, lalu setiap 24 jam',
      'Pantau trombosit (risiko HIT) pada hari ke-4 hingga ke-14',
      'Protokol institusi dapat berbeda — selalu verifikasi dengan nomogram lokal',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 16. Fluid Resuscitation                                              */
  /* ------------------------------------------------------------------ */
  {
    key: 'fluid',
    kind: 'calculator',
    name: 'Resusitasi Cairan',
    short: 'Cairan',
    category: 'Kritis',
    tint: C.teal,
    description: 'Parkland formula, sepsis bolus, dan maintenance pediatrik',
    source: 'AHA/ATLS/ILCOR Guidelines',
    fields: [
      {
        key: 'mode',
        label: 'Mode Kalkulasi',
        type: 'select',
        defaultValue: 'parkland',
        options: [
          { label: 'Luka Bakar — Parkland', value: 'parkland' },
          { label: 'Sepsis — Bolus 30 mL/kg', value: 'sepsis' },
          { label: 'Maintenance Pediatrik — Holliday-Segar', value: 'maintenance' },
        ],
      },
      { key: 'weight', label: 'Berat Badan', type: 'number', unit: 'kg', min: 1, max: 200, step: 1, defaultValue: 70 },
      { key: 'tbsa', label: 'Luas Permukaan Bakar (%) — khusus Parkland', type: 'number', unit: '%', min: 1, max: 99, step: 1, defaultValue: 20 },
    ],
    compute: (vals) => {
      const mode = String(vals.mode || 'parkland');
      const weight = Number(vals.weight) || 70;
      const tbsa = Number(vals.tbsa) || 20;

      if (mode === 'parkland') {
        const total24h = 4 * weight * tbsa;
        const first8h = total24h / 2;
        const next16h = total24h / 2;
        const rate8h = Math.round(first8h / 8);
        const rate16h = Math.round(next16h / 16);
        return {
          score: `${total24h} mL / 24 jam`,
          label: 'Ringer Laktat',
          color: C.teal,
          detail: `8 jam pertama: ${first8h} mL (${rate8h} mL/jam)\n16 jam berikutnya: ${next16h} mL (${rate16h} mL/jam)\nCatatan: Hitung dari waktu cedera, bukan waktu masuk`,
        };
      }

      if (mode === 'sepsis') {
        const bolus = 30 * weight;
        return {
          score: `${bolus} mL bolus`,
          label: 'NaCl 0.9% / RL',
          color: C.teal,
          detail: `Berikan dalam 30 menit\nNilai ulang setelah bolus (tanda perfusi, urin output)\nUlangi jika masih ada tanda hipoperfusi`,
        };
      }

      // maintenance — Holliday-Segar 4-2-1 rule
      let hourly: number;
      if (weight <= 10) {
        hourly = 4 * weight;
      } else if (weight <= 20) {
        hourly = 40 + 2 * (weight - 10);
      } else {
        hourly = 60 + 1 * (weight - 20);
      }
      const daily = hourly * 24;
      return {
        score: `${hourly} mL/jam`,
        label: 'Cairan Maintenance',
        color: C.teal,
        detail: `Per 24 jam: ${daily} mL\nFormula: 4 mL/kg untuk 10 kg pertama + 2 mL/kg untuk 10 kg berikutnya + 1 mL/kg untuk sisanya\nKoreksi berdasarkan kondisi klinis`,
      };
    },
    notes: [
      'Parkland: 4 mL × BB × %TBSA Ringer Laktat/24 jam, dihitung dari WAKTU CEDERA — setengah pertama dalam 8 jam. Titrasi ke urin output 0.5–1 mL/kg/jam (dewasa); rumus hanya titik awal',
      'Sepsis: bolus 30 mL/kg kristaloid (SSC 2021) untuk hipotensi/laktat ≥4, lalu NILAI ULANG responsivitas cairan — hindari kelebihan cairan',
      'Holliday-Segar (4-2-1) untuk MAINTENANCE rumatan anak, bukan resusitasi; tambahkan penggantian defisit & kehilangan berkelanjutan terpisah',
      'Semua rumus adalah estimasi awal — sesuaikan dengan tanda perfusi, produksi urin, dan status volume aktual',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 17. CPP — Cerebral Perfusion Pressure                               */
  /* ------------------------------------------------------------------ */
  {
    key: 'cpp',
    kind: 'calculator',
    name: 'CPP — Tekanan Perfusi Serebral',
    short: 'CPP',
    category: 'Neuro',
    tint: C.purple,
    description: 'Cerebral Perfusion Pressure = MAP − ICP',
    source: 'Neurocritical Care Guidelines',
    fields: [
      { key: 'sbp', label: 'Tekanan Sistolik', type: 'number', unit: 'mmHg', min: 40, max: 300, step: 1, defaultValue: 120 },
      { key: 'dbp', label: 'Tekanan Diastolik', type: 'number', unit: 'mmHg', min: 0, max: 200, step: 1, defaultValue: 80 },
      { key: 'icp', label: 'ICP (Tekanan Intrakranial)', type: 'number', unit: 'mmHg', min: 0, max: 80, step: 1, defaultValue: 10 },
    ],
    compute: (vals) => {
      const sbp = Number(vals.sbp) || 120;
      const dbp = Number(vals.dbp) || 80;
      const icp = Number(vals.icp) || 10;
      const map = (sbp + 2 * dbp) / 3;
      const cpp = map - icp;
      const colorHex = cpp >= 60 ? C.green : cpp >= 50 ? C.amber : C.red;
      const label = cpp >= 60 ? 'CPP Adekuat' : cpp >= 50 ? 'CPP Batas' : 'CPP Kritis — Risiko Iskemia Serebral';
      return {
        score: `${Math.round(cpp)} mmHg`,
        label,
        color: colorHex,
        detail: `MAP: ${Math.round(map)} mmHg\nICP: ${icp} mmHg\nCPP = MAP − ICP = ${Math.round(map)} − ${icp} = ${Math.round(cpp)} mmHg\n\nTarget CPP: 60–70 mmHg (TBI), >50 mmHg (minimum)\nJika CPP rendah: ↑ MAP (vasopresor) atau ↓ ICP (head elevation, osmotherapy, drainage)`,
      };
    },
    notes: [
      'CPP = MAP − ICP; target 60–70 mmHg pada cedera otak traumatik (BTF 2016). Hindari CPP <50 (iskemia) & upaya agresif >70 dengan cairan/pressor (risiko ARDS)',
      'MAP harus di-zero pada level tragus/foramen Monro (bukan level jantung) agar CPP akurat pada pasien neurokritis',
      'Target harus individual sesuai status autoregulasi (mis. indeks PRx) bila tersedia',
      'CPP rendah: naikkan MAP (vasopresor) atau turunkan ICP (elevasi kepala 30°, osmoterapi, drainase LCS, sedasi)',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 18. QTc — Koreksi Interval QT                                       */
  /* ------------------------------------------------------------------ */
  {
    key: 'qtc',
    kind: 'calculator',
    name: 'QTc — Koreksi Interval QT',
    short: 'QTc',
    category: 'Aritmia',
    tint: C.purple,
    description: 'QT terkoreksi (Bazett & Fridericia) — risiko Torsades',
    source: 'Bazett 1920; Fridericia 1920; AHA/ACC/HRS',
    fields: [
      { key: 'qt', label: 'Interval QT terukur', type: 'number', unit: 'ms', min: 200, max: 800, step: 5, defaultValue: 400 },
      { key: 'hr', label: 'Laju Jantung', type: 'number', unit: 'bpm', min: 30, max: 250, step: 1, defaultValue: 60 },
      { key: 'female', label: 'Jenis Kelamin Perempuan', type: 'checkbox' },
    ],
    compute: (v) => {
      const qt = Number(v.qt) || 400;
      const hr = Math.max(20, Number(v.hr) || 60);
      const rr = 60 / hr; // detik
      const qtSec = qt / 1000;
      const bazett = Math.round((qtSec / Math.sqrt(rr)) * 1000);
      const frid = Math.round((qtSec / Math.cbrt(rr)) * 1000);
      const female = Boolean(v.female);
      const prolongThresh = female ? 470 : 450;

      let label: string, color: string, risk: string;
      if (bazett >= 500)              { label = 'QTc Sangat Panjang'; color = C.red;   risk = 'Risiko tinggi Torsades de Pointes — hentikan obat pemanjang QT, koreksi K⁺/Mg²⁺'; }
      else if (bazett >= prolongThresh) { label = 'QTc Memanjang';    color = C.amber; risk = `Di atas batas (${prolongThresh} ms untuk ${female ? 'perempuan' : 'laki-laki'}) — waspadai obat & elektrolit`; }
      else                            { label = 'QTc Normal';        color = C.green; risk = 'Dalam batas normal'; }

      return {
        score: `${bazett} ms`,
        label,
        risk,
        color,
        detail: `Bazett (paling umum): QTc = QT/√RR = ${bazett} ms\nFridericia (lebih baik pada takikardi): QTc = QT/∛RR = ${frid} ms\nRR = 60/${hr} = ${rr.toFixed(2)} s\n\nAmbang memanjang: >450 ms (L) / >470 ms (P). >500 ms → risiko Torsades bermakna\nBazett cenderung over-koreksi saat takikardi & under-koreksi saat bradikardi`,
      };
    },
    notes: [
      'Bazett paling banyak dipakai klinis tetapi kurang akurat pada HR ekstrem — Fridericia lebih stabil pada takikardi',
      'QTc >500 ms atau kenaikan >60 ms dari baseline: risiko Torsades bermakna',
      'Koreksi hipokalemia, hipomagnesemia, hipokalsemia; tinjau ulang obat pemanjang QT (antiaritmia, antiemetik, makrolida, antipsikotik)',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 19a. Koreksi Kalium (defisit, batas laju, protokol hiperkalemia)    */
  /* ------------------------------------------------------------------ */
  {
    key: 'k-correction',
    kind: 'calculator',
    name: 'Koreksi Kalium',
    short: 'Koreksi K',
    category: 'Elektrolit',
    tint: C.amber,
    description: 'Defisit K, batas laju KCl, dan protokol hiperkalemia',
    source: 'Cohn JN et al. Arch Intern Med 2000;160:2429; Macdonald JE. Heart 2004;90:1098; UK Kidney Association Hyperkalaemia Guideline 2023',
    fields: [
      { key: 'currentK', label: 'Kalium saat ini', type: 'number', unit: 'mEq/L', min: 1.5, max: 8, step: 0.1, defaultValue: 3.0 },
      { key: 'weight', label: 'Berat Badan', type: 'number', unit: 'kg', min: 20, max: 200, step: 1, defaultValue: 70 },
      { key: 'ph', label: 'pH arteri (opsional)', type: 'number', min: 6.8, max: 7.8, step: 0.01, defaultValue: 7.40,
        description: 'Biarkan 7.40 bila tidak ada data — tidak mengubah hasil' },
      { key: 'gds', label: 'GDS pre-koreksi (opsional, khusus hiperkalemia)', type: 'number', unit: 'mg/dL', min: 0, max: 600, step: 1, defaultValue: 0,
        description: 'Isi untuk panduan dosis insulin+dekstrosa spesifik' },
    ],
    compute: (v) => {
      const k = Number(v.currentK) || 3.0;
      const wt = Number(v.weight) || 70;
      const ph = Number(v.ph) || 7.40;
      const gds = Number(v.gds) || 0;
      const hasPh = Math.abs(ph - 7.40) > 0.001;
      const isAcidosis = hasPh && ph < 7.35;

      // pH-adjustment: asidemia menggeser K keluar sel → K serum tampak
      // lebih tinggi dari status intrasel/total tubuh sesungguhnya.
      const kCorr = k + 0.6 * ((ph - 7.40) / 0.1);
      const phStep: CalcStep | null = hasPh ? {
        label: 'Penyesuaian efek pH',
        formula: `K "sebenarnya" pada pH 7.40 ≈ K + 0.6 × ((pH − 7.40)/0.1)\n= ${k} + 0.6 × ((${ph} − 7.40)/0.1) = ${kCorr.toFixed(2)} mEq/L`,
        note: isAcidosis
          ? 'PERINGATAN: asidosis menggeser K keluar sel — koreksi asidosis akan MENURUNKAN K serum. Koreksi K harus mendahului/bersamaan koreksi asidosis.'
          : 'Aturan kasar (~0.6 mEq/L per 0.1 unit pH) — total K tubuh bisa berbeda dari estimasi ini; selalu korelasikan klinis.',
      } : null;

      if (k < 3.5) {
        // ── HIPOKALEMIA ──
        const scale = wt / 70;
        const defLo = (3.5 - k) * 100 * scale;
        const defHi = (3.5 - k) * 200 * scale;
        const hrsLo = defLo / 10; // pada laju maksimal perifer 10 mEq/jam
        const hrsHi = defHi / 10;

        const steps: CalcStep[] = [
          {
            label: 'Langkah 1 — Estimasi defisit total tubuh (kasar)',
            formula: `Defisit ≈ (3.5 − K) × 100–200 × (BB/70)\n= (3.5 − ${k}) × 100–200 × (${wt}/70) = ${defLo.toFixed(0)}–${defHi.toFixed(0)} mEq`,
            note: 'ESTIMASI KASAR (Cohn et al. 2000) — hubungan K serum ↔ defisit total tubuh TIDAK linear (cadangan intrasel besar). Jangan berikan seluruh defisit sekaligus; nilai ulang K serial.',
          },
          {
            label: 'Langkah 2 — Batas laju infus KCl',
            formula: `Vena perifer: maks 10 mEq/jam\nVena sentral: maks 20 mEq/jam`,
            note: `Pada laju maksimal perifer, ${defLo.toFixed(0)}–${defHi.toFixed(0)} mEq membutuhkan ≈ ${hrsLo.toFixed(1)}–${hrsHi.toFixed(1)} jam. Berikan bertahap (~40% dulu), cek K ulang: <2.5 tiap 1–2j, 2.5–3.0 tiap 2–4j.`,
          },
          ...(phStep ? [phStep] : []),
        ];

        return {
          score: `${defLo.toFixed(0)}–${defHi.toFixed(0)} mEq`,
          label: k < 2.5 ? 'Hipokalemia Berat' : 'Hipokalemia',
          risk: 'Vena perifer ≤10 mEq/jam · vena sentral ≤20 mEq/jam',
          color: k < 2.5 ? C.red : C.amber,
          targetInfo: {
            title: 'Batas Laju Aman Infus KCl',
            bullets: [
              'Vena perifer: maksimal 10 mEq/jam.',
              'Vena sentral: maksimal 20 mEq/jam.',
              'Berikan bertahap (~40% dari estimasi dulu), evaluasi ulang sebelum melanjutkan.',
            ],
          },
          doseRange: {
            title: 'Estimasi Defisit Kalium Total (Kasar)',
            rangeLabel: `${defLo.toFixed(0)} – ${defHi.toFixed(0)} mEq`,
            methods: [
              { label: 'Estimasi Defisit', value: `${defLo.toFixed(0)}–${defHi.toFixed(0)} mEq`, rate: `≈${hrsLo.toFixed(1)}–${hrsHi.toFixed(1)} jam pada laju perifer maks`, note: 'linear kasar — hubungan sebenarnya non-linear (Cohn 2000)' },
            ],
            footer: 'Cek K ulang: <2.5 tiap 1–2 jam, 2.5–3.0 tiap 2–4 jam.',
          },
          steps,
          stepsFooter: 'Distribusi K butuh 4–6 jam — jangan berikan seluruh estimasi defisit sekaligus. Bila hipokalemia refrakter meski dikoreksi, periksa Mg (hipomagnesemia menyebabkan kebocoran K ginjal): MgSO4 2 g IV dalam 100 mL NS (20–30 menit).',
        };
      }

      if (k > 5.0) {
        // ── HIPERKALEMIA ──
        const severe = k > 6.0;
        const insulinStep: CalcStep = gds > 0
          ? (gds >= 126
            ? { label: 'Langkah 2A — Insulin + Dekstrosa (GDS pre-koreksi diketahui)',
                formula: `GDS = ${gds} mg/dL (≥126)\nInsulin Reguler 10 IU + Dekstrosa 50% 50 mL (atau D40% 25 mL) IV bolus`,
                note: 'GDS sudah cukup tinggi — tidak perlu infus dekstrosa lanjutan. Monitor GDS tiap 30 menit.' }
            : { label: 'Langkah 2A — Insulin + Dekstrosa (GDS pre-koreksi diketahui)',
                formula: `GDS = ${gds} mg/dL (<126)\nInsulin Reguler 10 IU + Dekstrosa 50% 50 mL (atau D40% 25 mL) IV bolus\n+ WAJIB Dekstrosa 10% 50 mL/jam selama 5 jam (total 25 g)`,
                note: 'GDS belum cukup tinggi — risiko hipoglikemia lanjut TINGGI tanpa infus dekstrosa susulan. Monitor GDS tiap 30 menit.' })
          : { label: 'Langkah 2A — Insulin + Dekstrosa',
              formula: `Insulin Reguler 10 IU + Dekstrosa 50% 50 mL (atau D40% 25 mL) IV bolus`,
              note: 'Isi GDS pre-koreksi untuk panduan spesifik apakah perlu dekstrosa lanjutan (protokol UK Kidney Association 2023, diadaptasi — konfirmasi cutoff dgn protokol institusi Anda).' };

        const steps: CalcStep[] = [
          ...(phStep ? [phStep] : []),
          { label: 'Langkah 1 — Stabilisasi membran (bila perubahan EKG)',
            formula: 'Ca Glukonat 10% 10 mL IV (3–5 menit)',
            note: 'Ulangi bila EKG belum membaik dalam 5–10 menit. Tidak menurunkan K — hanya menstabilkan membran sel jantung sementara.' },
          insulinStep,
          { label: 'Langkah 2B — Salbutamol nebulisasi',
            formula: '10–20 mg (2.5–5 ampul @2.5 mg)',
            note: 'Onset 15–30 menit, efek sinergis dengan insulin. Tidak efektif sebagai monoterapi pada ~40% pasien.' },
          { label: 'Langkah 2C — Natrium Bikarbonat',
            formula: 'NaHCO₃ 8.4% 50 mEq IV — HANYA bila asidosis metabolik pH < 7.2',
            note: isAcidosis ? 'pH saat ini menunjukkan asidosis — NaHCO₃ dapat dipertimbangkan.' : 'Tidak efektif sebagai monoterapi pada pH normal — jangan berikan rutin.' },
        ];

        return {
          score: `${k.toFixed(1)} mEq/L`,
          label: `Hiperkalemia ${severe ? 'Berat' : 'Sedang'}`,
          risk: severe ? 'K >6.0 — emergensi, tata laksana segera' : 'K 5.1–6.0 — tata laksana & monitoring ketat',
          color: severe ? C.red : C.amber,
          steps,
          stepsFooter: 'Alternatif ICU: infus insulin kontinu (Reguler 50 IU + NaCl0.9% 48mL = 1 IU/mL; laju 1.5–2 mL/jam × 6 jam; dampingi D10% 50–100 mL/jam bila puasa; STOP bila K<4.5 atau GDS<100).',
        };
      }

      // ── NORMAL ──
      return {
        score: `${k.toFixed(1)} mEq/L`,
        label: 'Kalium Normal',
        color: C.green,
        steps: phStep ? [phStep] : undefined,
      };
    },
    notes: [
      'Defisit K adalah ESTIMASI KASAR (Cohn et al. Arch Intern Med 2000) — hubungan serum↔total tubuh tidak linear; jangan menunda tata laksana hiperkalemia bermakna menunggu perhitungan presisi',
      'Batas laju KCl: vena perifer ≤10 mEq/jam, vena sentral ≤20 mEq/jam (nyeri/flebitis & risiko aritmia bila terlampaui)',
      'Selalu nilai K bersama pH — asidemia menggeser K keluar sel, menciptakan hiperkalemia semu (Adrogué HJ, Madias NE)',
      'Hipokalemia refrakter → cek Mg (hipomagnesemia menyebabkan kebocoran K ginjal, Huang CL & Kuo E. JASN 2007;18:2649)',
      'Protokol insulin+dekstrosa hiperkalemia diadaptasi dari UK Kidney Association Guideline 2023 — konfirmasi cutoff GDS & regimen dekstrosa lanjutan dengan protokol institusi Anda',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 19b. Koreksi Kalsium (albumin, ionized, protokol hipo/hiperkalsemia) */
  /* ------------------------------------------------------------------ */
  {
    key: 'ca-correction',
    kind: 'calculator',
    name: 'Koreksi Kalsium',
    short: 'Koreksi Ca',
    category: 'Elektrolit',
    tint: C.teal,
    description: 'Kalsium terkoreksi albumin, estimasi ionized, protokol tata laksana',
    source: 'Payne RB. BMJ 1973;4:643; Cooper MS. BMJ 2003;326:1424; Bilezikian JP. NEJM 2022;386:1476',
    fields: [
      { key: 'ca', label: 'Kalsium total', type: 'number', unit: 'mg/dL', min: 4, max: 16, step: 0.1, defaultValue: 8.5 },
      { key: 'albumin', label: 'Albumin', type: 'number', unit: 'g/dL', min: 1, max: 6, step: 0.1, defaultValue: 4.0 },
      { key: 'ph', label: 'pH arteri (opsional)', type: 'number', min: 6.8, max: 7.8, step: 0.01, defaultValue: 7.40,
        description: 'Biarkan 7.40 bila tidak ada data — tidak mengubah hasil' },
    ],
    compute: (v) => {
      const ca = Number(v.ca) || 8.5;
      const alb = Number(v.albumin) || 4.0;
      const ph = Number(v.ph) || 7.40;
      const hasPh = Math.abs(ph - 7.40) > 0.001;

      const corr = ca + 0.8 * (4.0 - alb);
      const ionizedBase = corr * 0.125;
      const ionized = hasPh ? ionizedBase + (7.40 - ph) * 0.5 : ionizedBase;

      const steps: CalcStep[] = [
        {
          label: 'Langkah 1 — Kalsium terkoreksi albumin (Payne 1973)',
          formula: `Ca terkoreksi = Ca + 0.8 × (4.0 − albumin)\n= ${ca} + 0.8 × (4.0 − ${alb}) = ${corr.toFixed(2)} mg/dL`,
          note: 'Pada hipoalbuminemia, Ca total terukur rendah palsu (sebagian besar Ca terikat albumin) — koreksi ini memperkirakan Ca "seolah" albumin normal.',
        },
        {
          label: 'Langkah 2 — Estimasi Ca ionized',
          formula: `Ca ionized (mmol/L) ≈ Ca terkoreksi (mg/dL) × 0.125\n= ${corr.toFixed(2)} × 0.125 = ${ionizedBase.toFixed(3)} mmol/L`,
          note: 'Faktor 0.125 ≈ konversi mg/dL→mmol/L (÷4.008) × fraksi ionized (~50%) dari Ca terkoreksi total. Estimasi kasar — pengukuran ionized langsung adalah baku emas, terutama pada sakit kritis.',
        },
        ...(hasPh ? [{
          label: 'Langkah 2b — Penyesuaian efek pH pada ionized',
          formula: `Ionized (pH-adjusted) = ${ionizedBase.toFixed(3)} + (7.40 − ${ph}) × 0.5\n= ${ionized.toFixed(3)} mmol/L`,
          note: 'Asidosis mengurangi ikatan Ca-albumin → ionized naik. Koefisien 0.5 diadaptasi dari referensi klinis — belum diverifikasi independen ke sumber primer, gunakan sebagai perkiraan kasar.',
        }] : []),
      ];

      if (corr < 8.5 || (hasPh && ionized < 1.12)) {
        return {
          score: `${corr.toFixed(1)} mg/dL`,
          label: 'Hipokalsemia (terkoreksi)',
          risk: `Ionized ≈ ${ionized.toFixed(2)} mmol/L`,
          color: corr < 7.0 ? C.red : C.amber,
          targetInfo: {
            title: 'Pilihan Koreksi Hipokalsemia',
            bullets: [
              'Ca Glukonat 10% (perifer/sentral): 1 ampul (10 mL) = 4.65 mEq.',
              'Emergensi (kejang/tetani): 1–2 ampul IV lambat 5–10 menit + monitor EKG.',
              'Sedang: 1 ampul dalam 100 mL NS/D5W → infus 30–60 menit.',
              'Ca Klorida 10% (HANYA via CVC): 1 ampul = 13.6 mEq (3× lebih poten); indikasi syok/henti jantung/transfusi masif.',
              '⚠️ Jangan campur dengan NaHCO₃/fosfat; hati-hati pada pasien digitalis (risiko toksisitas meningkat).',
            ],
          },
          steps,
          stepsFooter: 'Ca ionized terukur langsung adalah baku emas bila tersedia — estimasi di atas hanya perkiraan awal.',
        };
      }
      if (corr > 10.5) {
        return {
          score: `${corr.toFixed(1)} mg/dL`,
          label: 'Hiperkalsemia (terkoreksi)',
          risk: `Ionized ≈ ${ionized.toFixed(2)} mmol/L`,
          color: corr > 14 ? C.red : C.amber,
          targetInfo: {
            title: 'Protokol Hiperkalsemia (>10.5 mg/dL)',
            bullets: [
              'Hidrasi: NaCl 0.9% 200–500 mL/jam (target urin 100–150 mL/jam).',
              'Furosemide 20–40 mg IV — HANYA setelah euvolemia tercapai.',
              'Kalsitonin 4–8 IU/kg SC/IM tiap 12 jam (onset cepat).',
              'Zoledronat 4 mg IV dalam 15 menit (onset lambat ~48 jam).',
              'Denosumab 120 mg SC bila gagal ginjal (bifosfonat kontraindikasi relatif).',
            ],
          },
          steps,
          stepsFooter: 'Hiperkalsemia berat/simtomatik: pertimbangkan dialisis bila gagal ginjal berat atau gagal terapi medis.',
        };
      }
      return { score: `${corr.toFixed(1)} mg/dL`, label: 'Kalsium Normal (terkoreksi)', risk: `Ionized ≈ ${ionized.toFixed(2)} mmol/L`, color: C.green, steps };
    },
    notes: [
      'Koreksi Payne hanya perkiraan — Ca ionized terukur langsung adalah baku emas, terutama pada sakit kritis/asidosis-alkalosis',
      'Estimasi ionized (×0.125) adalah pendekatan kasar, BUKAN pengganti pengukuran ionized langsung bila tersedia',
      'Ca Klorida HANYA melalui akses vena sentral (sangat mengiritasi vena perifer)',
      'Hati-hati pemberian Ca pada pasien digitalis — dapat mencetuskan toksisitas/aritmia',
      'Hiperkalsemia berat/simtomatik: pertimbangkan dialisis bila gagal ginjal berat atau gagal terapi medis',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 19c. Koreksi Magnesium (dosis tetap per keparahan)                  */
  /* ------------------------------------------------------------------ */
  {
    key: 'mg-correction',
    kind: 'calculator',
    name: 'Koreksi Magnesium',
    short: 'Koreksi Mg',
    category: 'Elektrolit',
    tint: C.green,
    description: 'Dosis MgSO4 tetap per keparahan + penyesuaian gagal ginjal',
    source: 'de Baaij JH et al. Physiol Rev 2015;95:1; Huang CL, Kuo E. JASN 2007;18:2649',
    fields: [
      { key: 'mg', label: 'Magnesium serum', type: 'number', unit: 'mg/dL', min: 0.5, max: 4, step: 0.1, defaultValue: 1.5 },
      { key: 'symptomatic', label: 'Gejala berat (aritmia/Torsades/kejang)', type: 'checkbox' },
      { key: 'egfr', label: 'eGFR/CrCl (opsional)', type: 'number', unit: 'mL/min', min: 0, max: 150, step: 1, defaultValue: 0,
        description: 'Isi bila ada gangguan ginjal — memicu penyesuaian dosis' },
    ],
    compute: (v) => {
      const mg = Number(v.mg) || 1.5;
      const symptomatic = Boolean(v.symptomatic);
      const egfr = Number(v.egfr) || 0;
      const renalCaution = egfr > 0 && egfr < 30;

      if (mg < 1.7) {
        const doseAmount = symptomatic ? '2 g IV' : '1–2 g IV';
        const doseDetail = symptomatic
          ? 'Bolus lambat 5–10 menit (gejala berat)'
          : 'Dalam 50–100 mL NS/D5W selama 1 jam';
        const doseLabel = symptomatic
          ? 'MgSO4 2 g IV bolus lambat (5–10 menit)'
          : 'MgSO4 1–2 g IV dalam 50–100 mL NS/D5W selama 1 jam';

        const steps: CalcStep[] = [
          { label: 'Langkah 1 — Klasifikasi', formula: `Mg ${mg} mg/dL < 1.7 mg/dL → Hipomagnesemia`,
            note: 'Rentang normal umum 1.7–2.2 mg/dL — bervariasi antar laboratorium/assay.' },
          { label: `Langkah 2 — Dosis (${symptomatic ? 'gejala berat' : 'asimtomatik/ringan-sedang'})`,
            formula: doseLabel,
            note: 'Dosis TETAP berdasarkan keparahan klinis, bukan formula per berat badan — sesuai praktik replacement Mg standar (berbeda dari protokol eklampsia yang punya regimen tersendiri).' },
          ...(renalCaution ? [{
            label: 'Langkah 3 — Penyesuaian gagal ginjal',
            formula: `eGFR ${egfr} mL/min < 30 → turunkan dosis ~50%`,
            note: 'Pantau ketat: refleks patela tiap 1 jam (hilang bila Mg >4 mg/dL — tanda toksisitas dini), laju napas tiap 30 menit (depresi napas bila Mg >5 mg/dL). Hentikan infus bila salah satu muncul.',
          }] : []),
        ];

        return {
          score: doseAmount,
          label: symptomatic ? 'Hipomagnesemia — Gejala Berat' : 'Hipomagnesemia',
          risk: renalCaution ? `${doseDetail} · eGFR <30, pantau ketat` : doseDetail,
          color: symptomatic ? C.red : C.amber,
          targetInfo: {
            title: 'Panduan Dosis & Pemantauan Toksisitas',
            bullets: [
              'Asimtomatik/ringan-sedang: 1–2 g IV dalam 50–100 mL NS/D5W selama 1 jam.',
              'Gejala berat (aritmia/Torsades/kejang): 2 g IV bolus lambat 5–10 menit.',
              'Toksisitas bertahap: hiporefleksia (>4 mg/dL) → depresi napas (>5 mg/dL) → henti jantung (>10 mg/dL).',
            ],
          },
          steps,
          stepsFooter: 'Hipomagnesemia sering menyertai hipokalemia refrakter (kebocoran K ginjal) — koreksi Mg dapat memperbaiki K tanpa infus K berlebih.',
        };
      }

      return { score: `${mg.toFixed(1)} mg/dL`, label: 'Magnesium Normal', color: C.green,
        risk: 'Rentang umum 1.7–2.2 mg/dL (bervariasi antar lab)' };
    },
    notes: [
      'Dosis MgSO4 di sini bersifat TETAP per keparahan (bukan per kg BB) — mengikuti pola replacement standar; BERBEDA dari protokol MgSO4 pre-eklampsia/eklampsia (loading + maintenance khusus, tidak dicakup kalkulator ini)',
      'Toksisitas Mg: hiporefleksia (>4 mg/dL) → depresi napas (>5 mg/dL) → henti jantung (>10 mg/dL); pada gagal ginjal risiko akumulasi meningkat',
      'Hipomagnesemia adalah penyebab tersering hipokalemia REFRAKTER — selalu periksa Mg bila K sulit dikoreksi',
      'Kalsium Glukonat 10% harus tersedia sebagai antidot bila terjadi toksisitas Mg berat',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 20. VIS — Vasoactive-Inotropic Score                                */
  /* ------------------------------------------------------------------ */
  {
    key: 'vis',
    kind: 'calculator',
    name: 'VIS — Vasoactive-Inotropic Score',
    short: 'VIS',
    category: 'Hemodinamik',
    tint: C.red,
    description: 'Beban dukungan vasoaktif kumulatif (keparahan syok)',
    source: 'Gaies et al. Pediatr Crit Care Med 2010',
    fields: [
      { key: 'dopamine', label: 'Dopamin', type: 'number', unit: 'mcg/kg/min', min: 0, max: 50, step: 0.5, defaultValue: 0 },
      { key: 'dobutamine', label: 'Dobutamin', type: 'number', unit: 'mcg/kg/min', min: 0, max: 50, step: 0.5, defaultValue: 0 },
      { key: 'epinephrine', label: 'Epinefrin', type: 'number', unit: 'mcg/kg/min', min: 0, max: 5, step: 0.01, defaultValue: 0 },
      { key: 'norepinephrine', label: 'Norepinefrin', type: 'number', unit: 'mcg/kg/min', min: 0, max: 5, step: 0.01, defaultValue: 0 },
      { key: 'milrinone', label: 'Milrinon', type: 'number', unit: 'mcg/kg/min', min: 0, max: 2, step: 0.05, defaultValue: 0 },
      { key: 'vasopressin', label: 'Vasopressin', type: 'number', unit: 'U/kg/min', min: 0, max: 0.01, step: 0.0001, defaultValue: 0 },
    ],
    compute: (v) => {
      const dop = Number(v.dopamine) || 0;
      const dob = Number(v.dobutamine) || 0;
      const epi = Number(v.epinephrine) || 0;
      const ne = Number(v.norepinephrine) || 0;
      const mil = Number(v.milrinone) || 0;
      const vaso = Number(v.vasopressin) || 0;
      const vis = dop + dob + 100 * epi + 100 * ne + 10 * mil + 10000 * vaso;
      const visR = Math.round(vis * 10) / 10;

      let label: string, color: string, risk: string;
      if (vis >= 20)       { label = 'VIS Tinggi'; color = C.red;   risk = 'Dukungan vasoaktif berat — konsisten dengan luaran lebih buruk; re-evaluasi sumber syok'; }
      else if (vis >= 10)  { label = 'VIS Sedang'; color = C.amber; risk = 'Dukungan sedang — pantau tren; VIS puncak 24–48 jam paling prognostik'; }
      else if (vis > 0)    { label = 'VIS Rendah'; color = C.green; risk = 'Dukungan vasoaktif ringan'; }
      else                 { label = 'Tanpa Vasoaktif'; color = C.green; risk = 'Tidak ada obat vasoaktif aktif'; }

      return {
        score: `${visR}`,
        label,
        risk,
        color,
        detail: `VIS = dopamin + dobutamin + 100×epi + 100×norepi + 10×milrinon + 10000×vasopressin\n= ${dop} + ${dob} + 100×${epi} + 100×${ne} + 10×${mil} + 10000×${vaso}\n= ${visR}\n\nAmbang kasar: <10 rendah, 10–20 sedang, >20 tinggi. Nilai PUNCAK dalam 24–48 jam paling berkorelasi dengan luaran`,
      };
    },
    notes: [
      'VIS awalnya divalidasi pada bedah jantung anak; dipakai luas sebagai penanda keparahan syok di ICU',
      'Semua dosis dalam mcg/kg/min kecuali vasopressin (U/kg/min) — pastikan satuan benar sebelum menghitung',
      'Untuk dewasa, "Norepinephrine Equivalent" adalah alternatif; VIS tetap berguna sebagai tren beban vasoaktif',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 21. Konverter Laju Infus (dosis ↔ mL/jam)                           */
  /* ------------------------------------------------------------------ */
  {
    key: 'infusion',
    kind: 'calculator',
    name: 'Konverter Laju Infus',
    short: 'Infus',
    category: 'Hemodinamik',
    tint: C.blue,
    description: 'Dosis berbasis BB → mL/jam untuk konsentrasi apa pun',
    source: 'Perhitungan farmakologi standar',
    fields: [
      { key: 'dose', label: 'Dosis', type: 'number', unit: 'mcg/kg/min', min: 0, max: 100, step: 0.01, defaultValue: 0.1 },
      { key: 'weight', label: 'Berat Badan', type: 'number', unit: 'kg', min: 1, max: 250, step: 1, defaultValue: 70 },
      { key: 'amount', label: 'Jumlah Obat dilarutkan', type: 'number', unit: 'mg', min: 0.1, max: 5000, step: 0.1, defaultValue: 4 },
      { key: 'volume', label: 'Volume Pelarut Total', type: 'number', unit: 'mL', min: 1, max: 1000, step: 1, defaultValue: 50 },
    ],
    compute: (v) => {
      const dose = Number(v.dose) || 0;
      const wt = Number(v.weight) || 70;
      const amount = Number(v.amount) || 1;   // mg
      const volume = Number(v.volume) || 1;   // mL
      const concMcgMl = infusionConc(amount, volume, 'mg'); // mcg/mL
      const rateMlHr = infusionRateMlHr(dose, wt, concMcgMl, true);

      return {
        score: `${rateMlHr.toFixed(1)} mL/jam`,
        label: 'Laju Pompa Infus',
        color: C.blue,
        detail: `Konsentrasi = ${amount} mg / ${volume} mL = ${concMcgMl.toFixed(1)} mcg/mL\nLaju dosis = ${dose} mcg/kg/min × ${wt} kg = ${(dose * wt).toFixed(2)} mcg/min\nmL/jam = (dosis × BB × 60) / konsentrasi = ${rateMlHr.toFixed(1)} mL/jam\n\nUntuk obat non-preset. Selalu verifikasi konsentrasi & satuan sesuai protokol RS`,
      };
    },
    notes: [
      'Rumus: mL/jam = (mcg/kg/min × kg × 60) / (mcg/mL)',
      'Untuk obat dosis mcg/min (bukan per-kg), abaikan berat badan (anggap BB = 1) atau gunakan modul vasopressor',
      'Konsentrasi berbeda antar RS — konfirmasi sediaan dengan apoteker/protokol setempat',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 22. Ukuran ETT & Kedalaman Pediatrik (berbasis usia)                */
  /* ------------------------------------------------------------------ */
  {
    key: 'ett-peds',
    kind: 'calculator',
    name: 'ETT Pediatrik (berbasis usia)',
    short: 'ETT Anak',
    category: 'Pediatrik',
    tint: C.teal,
    description: 'Ukuran & kedalaman ETT, perkiraan BB (usia ≥ 1 tahun)',
    source: 'APLS / PALS; Cole formula',
    fields: [
      { key: 'age', label: 'Usia', type: 'number', unit: 'tahun', min: 1, max: 14, step: 1, defaultValue: 4 },
    ],
    compute: (v) => {
      const age = Math.max(1, Math.min(14, Number(v.age) || 4));
      const uncuffed = age / 4 + 4;          // Cole
      const cuffed = age / 4 + 3.5;
      const depth = age / 2 + 12;             // cm di bibir
      // perkiraan BB (APLS): 1-5 th (2×usia+8) atau (usia+4)×2; 6-12 th (3×usia+7)
      const weight = age <= 5 ? (age + 4) * 2 : 3 * age + 7;

      return {
        score: `${uncuffed.toFixed(1)} mm`,
        label: `ETT tanpa balon ${uncuffed.toFixed(1)} / dengan balon ${cuffed.toFixed(1)}`,
        color: C.teal,
        detail: `Usia ${age} th\nETT tanpa balon (ID) = usia/4 + 4 = ${uncuffed.toFixed(1)} mm\nETT dengan balon (ID) = usia/4 + 3.5 = ${cuffed.toFixed(1)} mm\nKedalaman di bibir = usia/2 + 12 = ${depth.toFixed(1)} cm (≈ ID × 3)\nPerkiraan BB = ${weight} kg\n\nSiapkan juga ukuran ±0.5 mm. Konfirmasi posisi dengan auskultasi, EtCO₂, dan foto toraks`,
      };
    },
    notes: [
      'Formula usia untuk ≥ 1 tahun. Neonatus/bayi: gunakan berat & panjang (pita Broselow di menu Pediatrik)',
      'ETT dengan balon kini rutin dipakai pada anak (kecuali neonatus) — pantau tekanan cuff < 20–25 cmH₂O',
      'Kedalaman bibir ≈ ukuran ETT (ID) × 3 sebagai cek silang cepat',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 23. Koreksi Natrium (hipo & hipernatremia — hindari ODS)            */
  /* ------------------------------------------------------------------ */
  {
    key: 'na-correction',
    kind: 'calculator',
    name: 'Koreksi Natrium (Hipo/Hipernatremia)',
    short: 'Koreksi Na',
    category: 'Elektrolit',
    tint: C.blue,
    description: 'Indikasi NaCl 3% berbasis gejala + dua metode koreksi lambat',
    source: 'Spasovski G. NDT 2014;29(Suppl 2):i1; Verbalis JG. Am J Med 2013;126(10 Suppl 1):S1; Adrogué & Madias NEJM 2000;342:1493 & 1581; Sterns RH NEJM 2015;372:55; Adrogué HJ, Tucker BM, Madias NE. JAMA 2022;328:280',
    fields: [
      { key: 'currentNa', label: 'Natrium saat ini', type: 'number', unit: 'mEq/L', min: 100, max: 180, step: 1, defaultValue: 118 },
      { key: 'weight', label: 'Berat Badan', type: 'number', unit: 'kg', min: 20, max: 200, step: 1, defaultValue: 70 },
      { key: 'sex', label: 'Jenis Kelamin', type: 'select', defaultValue: 'male',
        options: [{ label: 'Laki-laki', value: 'male' }, { label: 'Perempuan', value: 'female' }] },
      { key: 'glucose', label: 'Glukosa (opsional)', type: 'number', unit: 'mg/dL', min: 0, max: 1500, step: 10, defaultValue: 0,
        description: 'Isi bila hiperglikemia — Na dikoreksi dulu (Katz) sebelum dievaluasi' },
      // Checklist gejala (khusus hiponatremia) — dirender sebagai chip oleh
      // NaCorrectionFields, BUKAN loop CalcFieldInput generik. Keparahan
      // ditentukan GEJALA (Spasovski 2014), bukan angka Na.
      { key: 'sxVomiting',   label: 'Muntah', type: 'checkbox' },
      { key: 'sxCardioResp', label: 'Distres Kardiorespirasi', type: 'checkbox' },
      { key: 'sxSeizure',    label: 'Kejang', type: 'checkbox' },
      { key: 'sxSomnolence', label: 'Kantuk Dalam / Somnolen Abnormal', type: 'checkbox' },
      { key: 'sxComaGcs8',   label: 'Penurunan Kesadaran / Koma (GCS ≤8)', type: 'checkbox' },
      { key: 'sxNausea',     label: 'Mual (tanpa muntah)', type: 'checkbox' },
      { key: 'sxConfusion',  label: 'Bingung / Konfusi', type: 'checkbox' },
      { key: 'sxHeadache',   label: 'Nyeri Kepala', type: 'checkbox' },
      { key: 'acuteDrop10', label: 'Penurunan Na akut >10 mEq/L dalam <48 jam', type: 'checkbox',
        description: 'Berlaku meski gejala saat ini ringan/tidak ada — pengecualian pemberian infus tunggal 3%' },
      { key: 'onset', label: 'Onset (khusus hiponatremia)', type: 'select', defaultValue: 'kronik',
        options: [
          { label: 'Kronik / tidak diketahui', value: 'kronik', description: 'Batas aman: 6–8 mEq/L / 24 jam' },
          { label: 'Akut (< 48 jam)', value: 'akut', description: 'Batas aman: 10–12 mEq/L / 24 jam (risiko ODS jauh lebih rendah)' },
        ] },
      { key: 'targetRise', label: 'Target kenaikan / 24 jam (hiponatremia)', type: 'number', unit: 'mEq/L', min: 1, max: 12, step: 1, defaultValue: 6,
        description: 'Untuk koreksi lanjutan setelah krisis akut tertangani — dibatasi otomatis ke batas aman di bawah' },
      { key: 'highRisk', label: 'Faktor Risiko Tambahan ODS', type: 'checkbox',
        description: 'Hipokalemia, alkoholisme, malnutrisi, penyakit hati lanjut/sirosis, pasca-transplan hati (di luar Na≤105 yang terdeteksi otomatis)' },
    ],
    compute: (v) => {
      const na = Number(v.currentNa) || 118;
      const wt = Number(v.weight) || 70;
      const female = String(v.sex || 'male') === 'female';
      const highRisk = Boolean(v.highRisk);
      const onset = String(v.onset || 'kronik');
      const rawTarget = Number(v.targetRise) || 6;
      const glucose = Number(v.glucose) || 0;

      // Langkah 0 (opsional) — koreksi Na terhadap hiperglikemia (Katz 1973 /
      // Hillier 1999): +1.6 mEq/L per 100 mg/dL glukosa di atas 100; faktor
      // 2.4 lebih akurat bila glukosa sangat tinggi (>400 mg/dL).
      const hasHyper = glucose > 100;
      const glucoseFactor = glucose > 400 ? 2.4 : 1.6;
      const calcN = hasHyper ? na + glucoseFactor * ((glucose - 100) / 100) : na;

      // Total Body Water (Watson sederhana): 0.6 L/kg (L), 0.5 (P)
      const tbwFactor = female ? 0.5 : 0.6;
      const tbw = wt * tbwFactor;

      const hyperStep: CalcStep | null = hasHyper ? {
        label: 'Langkah 0 — Koreksi Na terhadap hiperglikemia (Katz/Hillier)',
        formula: `Na terkoreksi = Na terukur + ${glucoseFactor} × (Glukosa − 100)/100\n= ${na} + ${glucoseFactor} × (${glucose} − 100)/100 = ${calcN.toFixed(1)} mEq/L`,
        note: 'Hiperglikemia menarik air ke ekstrasel → hiponatremia dilusional palsu; evaluasi selanjutnya memakai Na terkoreksi ini.',
      } : null;
      const tbwStep: CalcStep = {
        label: 'Langkah 1 — Total Body Water (TBW)',
        formula: `TBW = ${tbwFactor} × BB = ${tbwFactor} × ${wt} kg = ${tbw.toFixed(1)} L`,
        note: `Faktor ${tbwFactor} untuk ${female ? 'perempuan' : 'laki-laki'} dewasa (Watson). Estimasi kasar — dehidrasi/geriatri dapat menurunkan TBW aktual.`,
      };

      if (calcN < 135) {
        // ── HIPONATREMIA ──
        // Keparahan klinis ditentukan GEJALA, bukan angka Na (Spasovski
        // 2014 ERBP/ESE/ESICM; Verbalis 2013) — indikasi NaCl 3% (bolus vs
        // infus tunggal vs tidak rutin) mengikuti kelompok gejala terberat
        // yang tercentang, dihitung live setiap render (bukan dibekukan).
        const SEVERE_KEYS = ['sxVomiting', 'sxCardioResp', 'sxSeizure', 'sxSomnolence', 'sxComaGcs8'];
        const MODERATE_KEYS = ['sxNausea', 'sxConfusion', 'sxHeadache'];
        const severe = SEVERE_KEYS.some(k => Boolean(v[k]));
        const moderate = !severe && MODERATE_KEYS.some(k => Boolean(v[k]));
        const severity: 'berat' | 'sedang' | 'ringan' = severe ? 'berat' : moderate ? 'sedang' : 'ringan';
        const acuteException = severity === 'ringan' && Boolean(v.acuteDrop10);

        // Flag risiko tinggi ODS: otomatis bila Na ≤105, DITAMBAH faktor
        // manual (hipokalemia, alkoholisme, malnutrisi, penyakit hati lanjut).
        const autoHighRisk = calcN <= 105;
        const manualHighRisk = highRisk;
        const highRiskFinal = autoHighRisk || manualHighRisk;

        // Plafon kecepatan koreksi berlaku di SEMUA mode (bolus/infus
        // tunggal/lambat) — onset menentukan batas, BUKAN indikasi 3%.
        const limitBase = onset === 'akut' ? { lo: 10, hi: 12 } : { lo: 6, hi: 8 };
        const limit24 = highRiskFinal ? limitBase.lo : limitBase.hi;
        const target = Math.min(rawTarget, limit24);
        const capped = rawTarget > limit24;
        const naT = 140;
        const d = Math.max(0, Math.min(target, naT - calcN));

        // Kartu utama tergated-gejala (bolus / infus tunggal / alur-penyebab).
        let primary: { title: string; color: string; rateLabel?: string; bullets: string[] };
        if (severity === 'berat') {
          primary = {
            title: 'Bolus NaCl 3% — Gejala Berat (Krisis Serebral Akut)',
            color: C.red,
            rateLabel: '150 mL / 20 menit (≈450 mL/jam)',
            bullets: [
              'Bolus NaCl 3% 150 mL IV dalam 20 menit (alternatif: 100 mL dalam 10 menit).',
              'Ulangi tiap 20 menit sampai gejala mereda ATAU Na naik ~5 mEq/L dari nilai awal.',
              'Target kenaikan jam pertama: +4–6 mEq/L — tujuannya menghentikan krisis serebral, BUKAN menormalkan Na.',
              'Setelah gejala mereda: STOP NaCl hipertonis, lanjutkan sesuai plafon 24 jam (bagian "Koreksi Lanjutan" di bawah).',
            ],
          };
        } else if (severity === 'sedang') {
          primary = {
            title: 'Infus Tunggal NaCl 3% — Gejala Sedang',
            color: C.amber,
            rateLabel: '150 mL / 20 menit (≈450 mL/jam), satu kali',
            bullets: [
              'Infus tunggal NaCl 3% 150 mL dalam 20 menit.',
              'Cek Na ulang setelah infus, re-evaluasi gejala & rencana lanjutan.',
              `Target kenaikan: ~5 mEq/L dalam 24 jam (dalam plafon aman ${limitBase.lo}–${limitBase.hi} mEq/L).`,
            ],
          };
        } else if (acuteException) {
          primary = {
            title: 'Pengecualian: Penurunan Akut Terdokumentasi >10 mEq/L',
            color: C.amber,
            rateLabel: '150 mL / 20 menit (≈450 mL/jam), satu kali',
            bullets: [
              'Meski gejala saat ini ringan/tidak ada, penurunan akut >10 mEq/L dalam <48 jam berisiko — pertimbangkan infus tunggal NaCl 3% 150 mL dalam 20 menit.',
              'Cek Na ulang setelah infus; re-evaluasi kebutuhan lanjutan.',
            ],
          };
        } else {
          primary = {
            title: 'NaCl 3% TIDAK Rutin Diindikasikan',
            color: C.green,
            bullets: [
              'Cari & atasi penyebab yang mendasari — bukan berikan NaCl 3% secara rutin.',
              'Hipovolemik: NaCl 0.9% isotonis.',
              'Euvolemik (mis. SIADH): restriksi cairan ± terapi penyebab.',
              'Hipervolemik: restriksi cairan + tata laksana penyakit dasar (gagal jantung/hati/ginjal).',
            ],
          };
        }

        // Metode 1 — Defisit: ΔNa × TBW ÷ 513 (NaCl 3% = 513 mEq/L)
        const deficitMeq = d * tbw;
        const volDeficit = (deficitMeq / 513) * 1000;
        const rateDeficit = volDeficit / 24;

        // Metode 2 — Adrogué-Madías: ΔNa per 1 L NaCl 3% = (513 − Na)/(TBW+1)
        const amPerLiter = (513 - calcN) / (tbw + 1);
        const volAM = amPerLiter > 0 ? (d / amPerLiter) * 1000 : 0;
        const rateAM = volAM / 24;

        const volMin = Math.min(volDeficit, volAM);
        const volMax = Math.max(volDeficit, volAM);
        const rateMin = volMin / 24;
        const rateMax = volMax / 24;
        const rateSafetyCap = (0.5 * tbw * 1000) / 513; // setara laju kenaikan 0.5 mEq/L/jam

        const steps: CalcStep[] = [
          ...(hyperStep ? [hyperStep] : []),
          tbwStep,
          {
            label: `Langkah 2 — Target kenaikan Na (${onset === 'akut' ? 'akut' : 'kronik'})`,
            formula: `ΔNa = ${d.toFixed(1)} mEq/L (batas aman ${limitBase.lo}–${limitBase.hi} mEq/L/24j${highRiskFinal ? ', risiko tinggi ODS → pakai batas bawah' : ''})\nTarget Na = ${calcN.toFixed(1)} + ${d.toFixed(1)} = ${(calcN + d).toFixed(1)} mEq/L`,
            note: capped ? `Target diminta ${rawTarget} mEq/L → dibatasi ke ${target} mEq/L (batas aman).` : undefined,
          },
          {
            label: 'Langkah 3 — Defisit natrium yang perlu diberikan',
            formula: `Defisit Na = TBW × ΔNa = ${tbw.toFixed(1)} × ${d.toFixed(1)} = ${deficitMeq.toFixed(0)} mEq`,
          },
          {
            label: 'Langkah 4a — Volume via Metode Defisit',
            formula: `NaCl 3% = 513 mEq Na/L\nVolume = ${deficitMeq.toFixed(0)} ÷ 513 × 1000 = ${volDeficit.toFixed(0)} mL → ${rateDeficit.toFixed(1)} mL/jam`,
          },
          {
            label: 'Langkah 4b — Volume via Adrogué-Madías',
            formula: `Kenaikan Na per 1 L NaCl 3% = (513 − Na)/(TBW+1) = (513 − ${calcN.toFixed(1)})/(${tbw.toFixed(1)}+1) = ${amPerLiter.toFixed(2)} mEq/L\nVolume = ${d.toFixed(1)} ÷ ${amPerLiter.toFixed(2)} × 1000 = ${volAM.toFixed(0)} mL → ${rateAM.toFixed(1)} mL/jam`,
            note: 'Metode ini memperhitungkan dilusi cairan yang ikut masuk, sehingga volumenya biasanya lebih tinggi dari metode defisit.',
          },
          {
            label: 'Langkah 5 — Rentang laju infus (dua metode)',
            formula: `${volMin.toFixed(0)}–${volMax.toFixed(0)} mL / 24 jam → ${rateMin.toFixed(1)}–${rateMax.toFixed(1)} mL/jam`,
            note: `Batas laju absolut ≈ ${rateSafetyCap.toFixed(1)} mL/jam (setara 0.5 mEq/L/jam) — jangan dilampaui di luar kondisi emergensi bergejala. Mulai dari estimasi lebih rendah, titrasi berdasar Na serial. Cek Na tiap 4–6 jam.`,
          },
        ];

        const severityLabel = severity === 'berat' ? 'Gejala Berat' : severity === 'sedang' ? 'Gejala Sedang' : acuteException ? 'Ringan — Penurunan Akut >10' : 'Ringan / Asimtomatik';

        return {
          score: primary.rateLabel || 'Tanpa 3% rutin',
          label: `Hiponatremia ${onset === 'akut' ? 'Akut' : 'Kronik'} — ${severityLabel}`,
          risk: primary.bullets[0],
          color: primary.color,
          naHypoCard: {
            severity, autoHighRisk, manualHighRisk, highRiskFinal,
            acuteExceptionApplied: acuteException,
            limitLo: limitBase.lo, limitHi: limitBase.hi,
            onsetLabel: onset === 'akut' ? 'Akut' : 'Kronik',
            primary,
            collapseSlowCorrection: severity === 'ringan' && !acuteException,
          },
          targetInfo: {
            title: 'Target Koreksi Aman (Batas 24 Jam)',
            intro: 'Peningkatan maksimal yang direkomendasikan untuk mencegah Osmotic Demyelination Syndrome (ODS):',
            bullets: [
              `Target Kenaikan Maksimal: ${limitBase.lo}–${limitBase.hi} mEq/L dalam 24 jam${highRiskFinal ? ' (risiko tinggi ODS → pakai batas bawah)' : ''}.`,
              `Target Na Sementara: ~${(calcN + d).toFixed(1)} mEq/L (dari ${calcN.toFixed(1)} mEq/L).`,
              ...(autoHighRisk ? ['⚠ Risiko Tinggi ODS terdeteksi OTOMATIS (Na ≤105 mEq/L) — plafon diturunkan ke batas bawah.'] : []),
            ],
          },
          doseRange: {
            title: 'Koreksi Lanjutan — Estimasi Kebutuhan Volume (Rentang 2 Metode)',
            rangeLabel: `${volMin.toFixed(0)} – ${volMax.toFixed(0)} mL`,
            methods: [
              { label: 'Metode Defisit', value: `${volDeficit.toFixed(0)} mL`, rate: `Laju ${rateDeficit.toFixed(1)} mL/jam · 24 jam`, note: 'konservatif (batas bawah)' },
              { label: 'Adrogué–Madías', value: `${volAM.toFixed(0)} mL`, rate: `Laju ${rateAM.toFixed(1)} mL/jam · 24 jam`, note: 'memperhitungkan dilusi (batas atas)' },
            ],
            safetyNote: `Batas atas laju absolut: ${rateSafetyCap.toFixed(1)} mL/jam (setara kecepatan koreksi 0.5 mEq/L/jam) — jangan dilampaui di luar kondisi emergensi bergejala.`,
            footer: 'Mulai dari estimasi lebih rendah, titrasi berdasarkan Na serial. Gunakan vena sentral jika memungkinkan. Periksa Na tiap 4–6 jam.',
          },
          steps,
          stepsFooter: 'Kedua rumus adalah estimasi awal — respons nyata dipengaruhi output urin & penyebab hiponatremia. Nilai ulang dengan Na serial tiap 4–6 jam.',
        };
      }

      if (calcN > 145) {
        // ── HIPERNATREMIA — Defisit Air Bebas (Free Water Deficit) ──
        const naT = 140;
        const fwd = tbw * (calcN / naT - 1);
        const rate = (fwd * 1000) / 48; // dibagi 48 jam agar penurunan ≤10 mEq/L/24 jam

        const steps: CalcStep[] = [
          ...(hyperStep ? [hyperStep] : []),
          tbwStep,
          {
            label: 'Langkah 2 — Defisit Air Bebas (Free Water Deficit)',
            formula: `Defisit = TBW × (Na/140 − 1)\n= ${tbw.toFixed(1)} × (${calcN.toFixed(1)}/140 − 1) = ${fwd.toFixed(2)} L`,
          },
          {
            label: 'Langkah 3 — Laju pemberian',
            formula: `Laju = ${fwd.toFixed(2)} L × 1000 ÷ 48 jam = ${rate.toFixed(0)} mL/jam`,
            note: 'Dibagi rata 48 jam agar penurunan Na ≤ 10 mEq/L per 24 jam (hindari edema serebri). Tambahkan Insensible Water Loss (~30–40 mL/jam) & ongoing loss pada laju TOTAL cairan — laju di atas hanya komponen air bebas.',
          },
        ];

        return {
          score: `${rate.toFixed(0)} mL/jam`,
          label: 'Defisit Air Bebas (Hipernatremia)',
          risk: `Defisit ${fwd.toFixed(2)} L, target penurunan ≤10 mEq/L/24 jam`,
          color: calcN > 160 ? C.red : C.amber,
          targetInfo: {
            title: 'Pilihan Cairan & Kecepatan Koreksi',
            bullets: [
              'Pilihan utama: D5W (Dekstrosa 5%) atau air enteral (NGT) bila stabil.',
              'Hipovolemia berat/syok: atasi dulu dengan NaCl 0.9% isotonis hingga hemodinamik stabil, baru berikan defisit air bebas.',
              'Target penurunan Na maksimal: 10 mEq/L dalam 24 jam — defisit diberikan bertahap selama 48 jam.',
            ],
          },
          doseRange: {
            title: 'Defisit Air Bebas (Free Water Deficit)',
            rangeLabel: `${fwd.toFixed(2)} L`,
            methods: [
              { label: 'Laju Infus (48 jam)', value: `${rate.toFixed(0)} mL/jam`, rate: `Total ${(fwd * 1000).toFixed(0)} mL / 48 jam`, note: 'tambahkan IWL ~30–40 mL/jam pada laju total cairan' },
            ],
            footer: 'Cek Na tiap 4–6 jam; rumus ini estimasi awal.',
          },
          steps,
          stepsFooter: 'Cairan: D5W atau air enteral (NGT) bila stabil; atasi hipovolemia berat dengan NaCl 0.9% dulu. Cek Na tiap 4–6 jam; rumus ini estimasi awal.',
        };
      }

      // ── NORMAL ──
      return {
        score: `${calcN.toFixed(1)} mEq/L`,
        label: 'Natrium Normal',
        color: C.green,
        steps: hyperStep ? [hyperStep] : undefined,
      };
    },
    notes: [
      'Indikasi NaCl 3% (bolus/infus tunggal/tidak rutin) ditentukan KEPARAHAN GEJALA, bukan angka Na — lihat kartu di atas (Spasovski/ERBP-ESE-ESICM NDT 2014; Verbalis. Am J Med 2013;126:S1)',
      'Rescue overcorrection (>8–10 mEq/L/24j atau melewati plafon): STOP NaCl hipertonis, konsul ICU/nefrologi, pertimbangkan D5W ± desmopresin (DDAVP) untuk menurunkan kembali Na (Verbalis JG. Am J Med 2013;126:S1)',
      'Hipernatremia: bila ada hipovolemia berat/syok, atasi dulu dengan NaCl 0.9% isotonis hingga stabil, baru berikan defisit air bebas',
      'Batas aman koreksi hiponatremia: ≤ 8 mEq/L/24 jam kronik (≤ 6 risiko tinggi ODS) atau ≤ 12 (≤10 risiko tinggi) akut; ≤ 18 mEq/L/48 jam',
      'Koreksi hipokalemia bersamaan juga menaikkan Na — perhitungkan saat menilai laju kenaikan aktual',
    ],
  },
];
