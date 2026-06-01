/* ============================================================
   ACLS Helper — Alat Klinis Tambahan
   ============================================================ */

/* ------------------------------------------------------------
   1. PALS_DRUGS — Weight-based pediatric drug dosing
   ------------------------------------------------------------ */
export interface PalsDrug {
  key: string;
  name: string;
  indication: string;
  dosePerKg: number;         // numeric multiplier
  doseUnit: string;          // 'mg/kg' | 'mcg/kg' | 'J/kg' | 'mL/kg'
  min?: number;              // minimum dose (absolute)
  max?: number;              // maximum dose (absolute)
  minMax?: string;           // human-readable min/max string
  route: string;             // 'IV/IO' | 'IV/IO/ET' | 'IM' | 'Defib'
  concentration?: string;    // e.g. '0.1 mg/mL (1:10.000)'
  tint: string;              // CSS color
  notes?: string;
}

export const PALS_DRUGS: PalsDrug[] = [
  {
    key: 'epinefrin',
    name: 'Epinefrin 1:10.000',
    indication: 'Henti jantung (semua irama)',
    dosePerKg: 0.01,
    doseUnit: 'mg/kg',
    max: 1,
    minMax: 'maks 1 mg',
    route: 'IV/IO/ET',
    concentration: '0.1 mg/mL (1:10.000)',
    tint: '#FF3B30',
    notes: 'Ulangi tiap 3-5 menit. ET: encerkan dg 3-5 mL NS.',
  },
  {
    key: 'amiodarone',
    name: 'Amiodarone',
    indication: 'VF/pVT refrakter',
    dosePerKg: 5,
    doseUnit: 'mg/kg',
    max: 300,
    minMax: 'maks 300 mg bolus',
    route: 'IV/IO',
    tint: '#AF52DE',
    notes: 'Untuk VF/pVT refrakter. Berikan pelan (10-20 mnt) jika ada nadi.',
  },
  {
    key: 'adenosin',
    name: 'Adenosin',
    indication: 'SVT (takikardi supraventrikular)',
    dosePerKg: 0.1,
    doseUnit: 'mg/kg',
    max: 6,
    minMax: 'maks 6 mg (dosis pertama)',
    route: 'IV/IO cepat',
    tint: '#007AFF',
    notes: 'Dosis kedua: 0.2 mg/kg (max 12 mg). Beri bolus cepat + flush NS.',
  },
  {
    key: 'atropin',
    name: 'Atropin',
    indication: 'Bradikardi simtomatis',
    dosePerKg: 0.02,
    doseUnit: 'mg/kg',
    min: 0.1,
    max: 1,
    minMax: 'min 0.1 mg; maks anak 0.5 mg, remaja 1 mg',
    route: 'IV/IO',
    tint: '#FF9500',
    notes: 'Dosis minimum 0.1 mg untuk hindari bradikardi paradoksikal.',
  },
  {
    key: 'kalsium-glukonat',
    name: 'Kalsium Glukonat 10%',
    indication: 'Hiperkalemia, hipokalsemia, hipermagnesemia, OD CCB',
    dosePerKg: 60,
    doseUnit: 'mg/kg',
    max: 3000,
    minMax: 'maks 3 g',
    route: 'IV/IO pelan',
    tint: '#34C759',
    notes: 'Hanya untuk hiperkalemia, hipokalsemia, hipermagnesemia, OD CCB.',
  },
  {
    key: 'magnesium-sulfat',
    name: 'Magnesium Sulfat',
    indication: 'Torsades de pointes, hipomagnesemia',
    dosePerKg: 25,
    doseUnit: 'mg/kg',
    max: 2000,
    minMax: '25-50 mg/kg; maks 2 g',
    route: 'IV/IO',
    tint: '#30B0C7',
    notes: 'Untuk torsades de pointes dan hipomagnesemia.',
  },
  {
    key: 'nalokson',
    name: 'Nalokson',
    indication: 'Reversal opioid',
    dosePerKg: 0.01,
    doseUnit: 'mg/kg',
    max: 0.4,
    minMax: 'maks 0.4 mg per dosis',
    route: 'IV/IO/IM',
    tint: '#FF6B35',
    notes: 'Untuk reversal opioid. Dapat diulang. Durasi lebih pendek dari opioid.',
  },
  {
    key: 'defibrilasi',
    name: 'Defibrilasi',
    indication: 'VF / pVT (irama shockable)',
    dosePerKg: 2,
    doseUnit: 'J/kg',
    max: 10,
    minMax: 'energi awal 2 J/kg; maks 10 J/kg atau 200 J',
    route: 'Defib',
    tint: '#FF3B30',
    notes: 'Kejutan ke-2 dan seterusnya: 4 J/kg (maks 10 J/kg atau 200 J).',
  },
  {
    key: 'kardioversi',
    name: 'Kardioversi Sinkron',
    indication: 'SVT/takikardi dengan nadi tidak stabil',
    dosePerKg: 0.5,
    doseUnit: 'J/kg',
    max: 2,
    minMax: '0.5-1 J/kg; maks 2 J/kg',
    route: 'Kardioversi',
    tint: '#FF9500',
    notes: 'Untuk SVT/takikardi dengan nadi tidak stabil. Sedasi jika memungkinkan.',
  },
  {
    key: 'glukosa',
    name: 'Glukosa',
    indication: 'Hipoglikemia',
    dosePerKg: 0.5,
    doseUnit: 'mL/kg',
    minMax: '0.5-1 g/kg (D10W: 5-10 mL/kg; D25W: 2-4 mL/kg)',
    route: 'IV/IO',
    tint: '#FFD60A',
    notes: 'Gunakan D10W pada neonatus. Target glukosa 70-180 mg/dL.',
  },
];

/* ------------------------------------------------------------
   2. VASOPRESSORS — Vasopressor & inotrope reference
   ------------------------------------------------------------ */
export interface Vasopressor {
  key: string;
  name: string;
  altName?: string;
  tint: string;
  indication: string;
  mechanism: string;         // receptor effects
  doseRange: string;         // e.g. '0.01–3 mcg/kg/min'
  doseUnit: string;          // 'mcg/kg/min' | 'unit/min' | 'mcg/min'
  doseMin: number;
  doseMax: number;
  titration: string;         // titration strategy
  sideEffects: string;
  pearls: string[];
}

export const VASOPRESSORS: Vasopressor[] = [
  {
    key: 'norepi',
    name: 'Norepinefrin',
    tint: '#FF3B30',
    indication: 'Vasopressor lini pertama pada syok septik & distribusi',
    mechanism: 'α₁ >> β₁ (vasokonstriksi kuat, inotrop sedang)',
    doseRange: '0.01–3 mcg/kg/min',
    doseUnit: 'mcg/kg/min',
    doseMin: 0.01,
    doseMax: 3,
    titration: 'Mulai 0.01-0.1, titrasi naik tiap 5-15 mnt sesuai MAP ≥65 mmHg',
    sideEffects: 'Iskemia perifer, reflek bradikardi, aritmia',
    pearls: [
      'Vasopressor pilihan pada sepsis (SSC 2021)',
      'Kombinasikan vasopressin 0.03 unit/min jika butuh dosis tinggi',
      'Gunakan akses sentral jika memungkinkan',
    ],
  },
  {
    key: 'epi',
    name: 'Epinefrin',
    altName: 'Adrenalin (infus)',
    tint: '#FF6B35',
    indication: 'Anafilaksis, syok kardiogenik, cardiac arrest',
    mechanism: 'α₁ + β₁ + β₂ (vasokonstriksi + inotrop + kronotropik kuat)',
    doseRange: '0.01–1 mcg/kg/min',
    doseUnit: 'mcg/kg/min',
    doseMin: 0.01,
    doseMax: 1,
    titration: 'Dosis rendah (β dominan): 0.01-0.1 | Dosis tinggi (α dominan): >0.1',
    sideEffects: 'Aritmia, iskemia miokard, hipokalemia, hiperlaktatemia',
    pearls: [
      'Pilihan pada syok kardiogenik yang refrakter',
      'IM 0.3-0.5 mg pada anafilaksis sebelum akses IV',
      'Laktasidosis bisa terjadi — bukan selalu tanda gagal terapi',
    ],
  },
  {
    key: 'dopamin',
    name: 'Dopamin',
    tint: '#AF52DE',
    indication: 'Syok kardiogenik, bradikardia simtomatis',
    mechanism: 'Dosis-dependen: D1 (1-5) → β1 (5-10) → α1 (>10) mcg/kg/min',
    doseRange: '1–20 mcg/kg/min',
    doseUnit: 'mcg/kg/min',
    doseMin: 1,
    doseMax: 20,
    titration: 'Mulai 5-10 mcg/kg/min, titrasi naik tiap 5-15 mnt sesuai respons',
    sideEffects: 'Aritmia, takikardi, iskemia miokard',
    pearls: [
      'Vasopressor alternatif (lebih banyak aritmia vs norepinefrin)',
      'Dosis rendah renal (1-3 mcg/kg/min) tidak terbukti proteksi ginjal',
      'Kurangi dosis bertahap saat weaning',
    ],
  },
  {
    key: 'dobut',
    name: 'Dobutamin',
    tint: '#007AFF',
    indication: 'Syok kardiogenik, gagal jantung akut dekompensasi',
    mechanism: 'β₁ >> β₂ (inotrop kuat, kronotropik sedang, vasodilasi ringan)',
    doseRange: '2–20 mcg/kg/min',
    doseUnit: 'mcg/kg/min',
    doseMin: 2,
    doseMax: 20,
    titration: 'Mulai 2-5 mcg/kg/min, titrasi naik tiap 10-15 mnt sesuai respons',
    sideEffects: 'Takikardi, aritmia, iskemia miokard, hipotensi (vasodilatasi)',
    pearls: [
      'Tidak punya efek vasokonstriksi — hindari pada hipotensi berat tanpa vasopressor',
      'Kombinasikan dengan norepinefrin pada syok kardiogenik',
      'Dapat memperburuk iskemia pada IHD',
    ],
  },
  {
    key: 'vasopresin',
    name: 'Vasopressin',
    tint: '#34C759',
    indication: 'Syok septik (add-on), syok vasodilatori refrakter',
    mechanism: 'V1 (vasokonstriksi langsung, tidak β-dependent)',
    doseRange: '0.01–0.04 unit/min',
    doseUnit: 'unit/min',
    doseMin: 0.01,
    doseMax: 0.04,
    titration: 'Dosis tetap 0.03-0.04 unit/mnt, tidak dititrasi',
    sideEffects: 'Iskemia koroner/mesenterik, hiponatremia, reflek bradikardi',
    pearls: [
      'Hemat norepinefrin (steroid-sparing analogy)',
      'Tidak dititrasi seperti katekolamin — dosis tetap',
      'Lebih dari 0.04 unit/mnt meningkatkan iskemia tanpa benefit tambahan',
    ],
  },
  {
    key: 'phenyl',
    name: 'Fenilefrin',
    tint: '#FF9500',
    indication: 'Hipotensi perioperatif, SVR rendah dengan takikardi',
    mechanism: 'Pure α₁ (vasokonstriksi murni, tidak ada efek inotrop)',
    doseRange: '50–300 mcg/mnt (atau 0.5-5 mcg/kg/mnt)',
    doseUnit: 'mcg/min',
    doseMin: 50,
    doseMax: 300,
    titration: 'Bolus 50-200 mcg atau infus 50-300 mcg/mnt',
    sideEffects: 'Reflex bradikardi, CO turun, iskemia perifer',
    pearls: [
      'Pilih jika pasien sudah takikardi dan tidak butuh inotrop',
      'Hindari pada gagal jantung dengan CO rendah',
      'Cocok untuk kasus SVT/takiaritmia dengan hipotensi',
    ],
  },
  {
    key: 'milrinon',
    name: 'Milrinon',
    tint: '#30B0C7',
    indication: 'Gagal jantung kanan berat, hipertensi pulmonal, post-operasi jantung',
    mechanism: 'PDE-3 inhibitor (↑cAMP → inotrop + vasodilatasi pulmonal & sistemik)',
    doseRange: '0.25–0.75 mcg/kg/min',
    doseUnit: 'mcg/kg/min',
    doseMin: 0.25,
    doseMax: 0.75,
    titration: 'Loading 50 mcg/kg/10 mnt (opsional), lanjut 0.375-0.75 mcg/kg/mnt',
    sideEffects: 'Hipotensi (sering), aritmia ventrikel, trombositopenia',
    pearls: [
      'Tidak bergantung reseptor β — efektif pada pasien yang sudah pakai β-bloker',
      'Awasi hipotensi terutama saat loading dose',
      'Kurangi dosis pada gagal ginjal (renal clearance)',
    ],
  },
  {
    key: 'isopro',
    name: 'Isoproterenol',
    tint: '#FF2D55',
    indication: 'AV blok komplit (sementara), torsades de pointes, bradikardia refrakter',
    mechanism: 'β₁ + β₂ (kronotropik dan inotrop kuat, vasodilatasi)',
    doseRange: '1–10 mcg/mnt',
    doseUnit: 'mcg/min',
    doseMin: 1,
    doseMax: 10,
    titration: 'Titrasi untuk target HR 60-70 bpm atau penekanan torsades',
    sideEffects: 'Takiaritmia, iskemia miokard, hipotensi (vasodilatasi)',
    pearls: [
      'Gunakan sementara sambil menunggu pacu jantung transvenous',
      'Untuk torsades: tingkatkan HR > 90 bpm untuk memendekan QT',
      'HINDARI pada stenosis aorta berat atau iskemia aktif',
    ],
  },
];

/* ------------------------------------------------------------
   3. ROSC_CHECKLIST — Post-Cardiac Arrest Care
   ------------------------------------------------------------ */
export interface RoscItem {
  key: string;
  label: string;
  target?: string;
  note?: string;
}

export interface RoscSection {
  key: string;
  title: string;
  icon: string;           // icon key from Icons
  tint: string;
  items: RoscItem[];
}

export const ROSC_CHECKLIST: RoscSection[] = [
  {
    key: 'ventilasi',
    title: 'Ventilasi & Oksigenasi',
    icon: 'lungs',
    tint: '#30B0C7',
    items: [
      {
        key: 'spo2',
        label: 'SpO2',
        target: '94-98%',
        note: 'FiO2 diturunkan bertahap setelah stabil',
      },
      {
        key: 'etco2',
        label: 'EtCO2',
        target: '35-45 mmHg',
        note: 'Hipokapnia menyebabkan vasokonstriksi serebral',
      },
      {
        key: 'tidal-volume',
        label: 'Volume tidal',
        target: '6-8 mL/kg IBW, RR 10-12x/mnt',
      },
      {
        key: 'hiperventilasi',
        label: 'Hindari hiperventilasi',
        note: 'Awasi EtCO2 dan AGD berkala',
      },
    ],
  },
  {
    key: 'hemodinamik',
    title: 'Hemodinamik',
    icon: 'activity',
    tint: '#FF3B30',
    items: [
      {
        key: 'map',
        label: 'MAP ≥65 mmHg',
        target: '≥65 mmHg',
        note: 'Beberapa guideline target MAP ≥80 jika ensefalopati post-anoksik',
      },
      {
        key: 'sbp',
        label: 'SBP ≥90 mmHg',
        target: '≥90 mmHg',
      },
      {
        key: 'ekg',
        label: '12-lead EKG segera',
        note: 'Singkirkan STEMI/LBBB baru',
      },
      {
        key: 'akses-iv',
        label: 'Akses IV/IO 2 jalur',
        note: 'Pertimbangkan akses sentral',
      },
      {
        key: 'volume-loading',
        label: 'Volume loading',
        note: 'Awasi tanda overload',
      },
    ],
  },
  {
    key: 'reperfusi',
    title: 'Reperfusi Koroner',
    icon: 'heart',
    tint: '#FF3B30',
    items: [
      {
        key: 'pci',
        label: 'Emergent PCI',
        target: 'STEMI atau LBBB baru',
        note: 'Waktu door-to-balloon ≤90 menit',
      },
      {
        key: 'angiografi',
        label: 'Pertimbangkan angiografi',
        note: 'NSTEMI dengan instabilitas hemodinamik refrakter',
      },
      {
        key: 'echo',
        label: 'Echokardiografi',
        note: 'Nilai fungsi sistolik dan penyebab henti jantung',
      },
      {
        key: 'fibrinolisis',
        label: 'Pertimbangkan fibrinolisis',
        note: 'Jika PCI tidak tersedia dalam 120 mnt',
      },
    ],
  },
  {
    key: 'suhu',
    title: 'Manajemen Suhu',
    icon: 'droplet',
    tint: '#007AFF',
    items: [
      {
        key: 'ttm',
        label: 'Target temperature management (TTM)',
        target: '32-36°C selama ≥24 jam',
        note: 'Hindari demam (>37.5°C) selama minimal 72 jam pasca henti jantung',
      },
      {
        key: 'pendinginan',
        label: 'Metode pendinginan',
        note: 'Selimut pendingin, cold saline (hindari), endovascular cooling',
      },
      {
        key: 'suhu-inti',
        label: 'Monitoring suhu inti',
        note: 'Rektal, esofageal, atau kateter urin',
      },
      {
        key: 'rewarming',
        label: 'Rewarming',
        target: '0.25°C/jam',
        note: 'Lambat, 0.25°C/jam setelah 24 jam TTM',
      },
    ],
  },
  {
    key: 'neurologi',
    title: 'Neurologi',
    icon: 'activity',
    tint: '#AF52DE',
    items: [
      {
        key: 'sedasi',
        label: 'Sedasi adekuat selama TTM',
        note: 'Propofol atau midazolam + fentanil',
      },
      {
        key: 'eeg',
        label: 'Monitor EEG',
        note: 'Jika ada kecurigaan kejang',
      },
      {
        key: 'ct-kepala',
        label: 'CT kepala',
        note: 'Jika suspek penyebab intrakranial',
      },
      {
        key: 'prognostikasi',
        label: 'Prognostikasi',
        note: 'Tunda ≥72 jam pasca ROSC (72 jam pasca rewarming jika TTM)',
      },
      {
        key: 'cegah-sekunder',
        label: 'Hindari hipotensi dan hipoksemia',
        note: 'Kerusakan otak sekunder',
      },
    ],
  },
  {
    key: 'metabolik',
    title: 'Metabolik & Lab',
    icon: 'syringe',
    tint: '#34C759',
    items: [
      {
        key: 'glukosa',
        label: 'Glukosa',
        target: '140-180 mg/dL',
        note: 'Hindari hipoglikemia dan hiperglikemia berat',
      },
      {
        key: 'elektrolit',
        label: 'Elektrolit',
        note: 'Koreksi K⁺, Mg²⁺, Ca²⁺',
      },
      {
        key: 'laktat',
        label: 'Laktat serial',
        note: 'Monitor perbaikan perfusi',
      },
      {
        key: 'kreatinin-lft',
        label: 'Kreatinin & LFT',
        note: 'Evaluasi disfungsi organ',
      },
      {
        key: 'troponin',
        label: 'Troponin serial',
        note: 'Nilai kerusakan miokard',
      },
    ],
  },
];

/* ------------------------------------------------------------
   4. PALS_ALGORITHMS — PALS algorithm overview
   ------------------------------------------------------------ */
export interface PalsAlgo {
  key: string;
  title: string;
  tint: string;
  steps: string[];
}

export const PALS_ALGORITHMS: PalsAlgo[] = [
  {
    key: 'vfvt',
    title: 'VF / pVT',
    tint: '#FF3B30',
    steps: [
      'CPR berkualitas tinggi — minimalkan interupsi',
      'Defibrilasi segera: 2 J/kg, kemudian 4 J/kg',
      'Epinefrin IV/IO: 0.01 mg/kg (maks 1 mg) tiap 3-5 menit',
      'Amiodarone: 5 mg/kg IV/IO (maks 300 mg) — jika VF/pVT refrakter',
      'Cari & tangani penyebab reversibel (Hs & Ts)',
    ],
  },
  {
    key: 'pea',
    title: 'PEA / Asistol',
    tint: '#007AFF',
    steps: [
      'CPR berkualitas tinggi — minimalkan interupsi',
      'Epinefrin IV/IO: 0.01 mg/kg (maks 1 mg) tiap 3-5 menit',
      'Cari & tangani penyebab reversibel (Hs & Ts) secara agresif',
      'Pertimbangkan atropin jika bradikardia simtomatis',
      'Konfirmasi ritme tiap 2 menit',
    ],
  },
  {
    key: 'brady',
    title: 'Bradikardi',
    tint: '#FF9500',
    steps: [
      'O2 dan jalan napas — pertahankan saturasi',
      'Monitor EKG — identifikasi jenis bradikardia',
      'Jika bradikardi simtomatis: Atropin 0.02 mg/kg IV/IO (min 0.1 mg)',
      'Jika tidak respons: Epinefrin infus atau Dopamin 2-20 mcg/kg/mnt',
      'Pacu jantung transtoraks/transvenous jika tidak respons terapi',
    ],
  },
  {
    key: 'svt',
    title: 'SVT / Takikardi',
    tint: '#AF52DE',
    steps: [
      'Nilai stabilitas: ada nadi? perfusi adekuat?',
      'Manuver vagal (ice bag di wajah bayi, Valsalva pada anak)',
      'Adenosin 0.1 mg/kg (maks 6 mg) IV cepat — jika ada nadi & stabil',
      'Dosis ke-2: Adenosin 0.2 mg/kg (maks 12 mg)',
      'Jika tidak stabil: Kardioversi sinkron 0.5-1 J/kg dengan sedasi',
    ],
  },
];
