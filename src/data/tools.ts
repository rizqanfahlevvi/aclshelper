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
    tint: '#BA1A1A',
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
    tint: '#9333EA',
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
    tint: '#0056B3',
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
    tint: '#FFA000',
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
    tint: '#1E8E3E',
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
    tint: '#00838F',
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
    tint: '#BA1A1A',
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
    tint: '#FFA000',
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
    tint: '#F9A825',
    notes: 'Gunakan D10W pada neonatus. Target glukosa 70-180 mg/dL.',
  },
];

/* ------------------------------------------------------------
   2. VASOPRESSORS — Vasopressor & inotrope reference
   ------------------------------------------------------------ */
export interface VasoStockPreset {
  label: string;              // e.g. '4 mg dalam 50 mL (pekat)'
  method: 'syringe' | 'infus'; // syringe pump (pekat, vol kecil) vs infus pump/gravitasi (bag, vol besar)
  amount: number;              // jumlah obat dilarutkan
  amountUnit: 'mg' | 'unit';   // satuan dasar obat (dikonversi ke mcg bila perlu)
  volumeMl: number;            // total volume pelarut (mL)
}

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
  stockPresets: VasoStockPreset[]; // preset pengenceran umum (syringe pump & infus pump)
}

export const VASOPRESSORS: Vasopressor[] = [
  {
    key: 'norepi',
    name: 'Norepinefrin',
    tint: '#BA1A1A',
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
    stockPresets: [
      { label: '4 mg dalam 50 mL NS/D5% (80 mcg/mL)',  method: 'syringe', amount: 4, amountUnit: 'mg', volumeMl: 50 },
      { label: '8 mg dalam 50 mL NS/D5% (160 mcg/mL, pekat)', method: 'syringe', amount: 8, amountUnit: 'mg', volumeMl: 50 },
      { label: '4 mg dalam 100 mL NS/D5% (40 mcg/mL)',  method: 'infus',   amount: 4, amountUnit: 'mg', volumeMl: 100 },
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
    stockPresets: [
      { label: '1 mg dalam 50 mL NS/D5% (20 mcg/mL)',  method: 'syringe', amount: 1, amountUnit: 'mg', volumeMl: 50 },
      { label: '4 mg dalam 50 mL NS/D5% (80 mcg/mL, pekat)', method: 'syringe', amount: 4, amountUnit: 'mg', volumeMl: 50 },
      { label: '1 mg dalam 250 mL NS/D5% (4 mcg/mL)',  method: 'infus',   amount: 1, amountUnit: 'mg', volumeMl: 250 },
    ],
  },
  {
    key: 'dopamin',
    name: 'Dopamin',
    tint: '#9333EA',
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
    stockPresets: [
      { label: '200 mg dalam 50 mL NS/D5% (4 mg/mL)',  method: 'syringe', amount: 200, amountUnit: 'mg', volumeMl: 50 },
      { label: '400 mg dalam 50 mL NS/D5% (8 mg/mL, pekat)', method: 'syringe', amount: 400, amountUnit: 'mg', volumeMl: 50 },
      { label: '400 mg dalam 250 mL NS/D5% (1.6 mg/mL)', method: 'infus',   amount: 400, amountUnit: 'mg', volumeMl: 250 },
    ],
  },
  {
    key: 'dobut',
    name: 'Dobutamin',
    tint: '#0056B3',
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
    stockPresets: [
      { label: '250 mg dalam 50 mL NS/D5% (5 mg/mL)',  method: 'syringe', amount: 250, amountUnit: 'mg', volumeMl: 50 },
      { label: '250 mg dalam 250 mL NS/D5% (1 mg/mL)', method: 'infus',   amount: 250, amountUnit: 'mg', volumeMl: 250 },
    ],
  },
  {
    key: 'vasopresin',
    name: 'Vasopressin',
    tint: '#1E8E3E',
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
    stockPresets: [
      { label: '20 unit dalam 50 mL NS/D5% (0.4 unit/mL)', method: 'syringe', amount: 20, amountUnit: 'unit', volumeMl: 50 },
      { label: '40 unit dalam 50 mL NS/D5% (0.8 unit/mL, pekat)', method: 'syringe', amount: 40, amountUnit: 'unit', volumeMl: 50 },
      { label: '20 unit dalam 100 mL NS/D5% (0.2 unit/mL)', method: 'infus', amount: 20, amountUnit: 'unit', volumeMl: 100 },
    ],
  },
  {
    key: 'phenyl',
    name: 'Fenilefrin',
    tint: '#FFA000',
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
    stockPresets: [
      { label: '10 mg dalam 50 mL NS/D5% (200 mcg/mL)', method: 'syringe', amount: 10, amountUnit: 'mg', volumeMl: 50 },
      { label: '10 mg dalam 250 mL NS/D5% (40 mcg/mL)', method: 'infus',   amount: 10, amountUnit: 'mg', volumeMl: 250 },
    ],
  },
  {
    key: 'milrinon',
    name: 'Milrinon',
    tint: '#00838F',
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
    stockPresets: [
      { label: '20 mg dalam 50 mL NS/D5% (400 mcg/mL, pekat)', method: 'syringe', amount: 20, amountUnit: 'mg', volumeMl: 50 },
      { label: '20 mg dalam 100 mL NS/D5% (200 mcg/mL)', method: 'infus', amount: 20, amountUnit: 'mg', volumeMl: 100 },
    ],
  },
  {
    key: 'isopro',
    name: 'Isoproterenol',
    tint: '#B6171E',
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
    stockPresets: [
      { label: '1 mg dalam 50 mL NS/D5% (20 mcg/mL)',  method: 'syringe', amount: 1, amountUnit: 'mg', volumeMl: 50 },
      { label: '1 mg dalam 250 mL NS/D5% (4 mcg/mL)',  method: 'infus',   amount: 1, amountUnit: 'mg', volumeMl: 250 },
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
    tint: '#00838F',
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
    tint: '#BA1A1A',
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
    tint: '#BA1A1A',
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
    tint: '#0056B3',
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
    tint: '#9333EA',
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
    tint: '#1E8E3E',
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
    tint: '#BA1A1A',
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
    tint: '#0056B3',
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
    tint: '#FFA000',
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
    tint: '#9333EA',
    steps: [
      'Nilai stabilitas: ada nadi? perfusi adekuat?',
      'Manuver vagal (ice bag di wajah bayi, Valsalva pada anak)',
      'Adenosin 0.1 mg/kg (maks 6 mg) IV cepat — jika ada nadi & stabil',
      'Dosis ke-2: Adenosin 0.2 mg/kg (maks 12 mg)',
      'Jika tidak stabil: Kardioversi sinkron 0.5-1 J/kg dengan sedasi',
    ],
  },
];

/* ============================================================
   Reference arrays — used by tools/theory screens
   ============================================================ */
export const PALS_REFERENCES: Array<{ text: string; url?: string }> = [
  { text: 'Topjian AA, et al. Part 4: Pediatric Basic and Advanced Life Support: 2020 American Heart Association Guidelines for CPR and ECC. Circulation. 2020;142(16_suppl_2):S469–S523.', url: 'https://doi.org/10.1161/CIR.0000000000000901' },
  { text: 'Kudenchuk PJ, et al. Amiodarone for Resuscitation after Out-of-Hospital Cardiac Arrest due to Ventricular Fibrillation (ALIVE trial). N Engl J Med. 2002;346:884–890.', url: 'https://doi.org/10.1056/NEJMoa013029' },
  { text: 'Weiss SL, et al. Surviving Sepsis Campaign International Guidelines for Septic Shock and Organ Dysfunction in Children. Pediatr Crit Care Med. 2020;21(2):e52–e106.', url: 'https://doi.org/10.1097/PCC.0000000000002198' },
];

export const VASOPRESSOR_REFERENCES: Array<{ text: string; url?: string }> = [
  { text: 'Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063–e1143.', url: 'https://doi.org/10.1097/CCM.0000000000005337' },
  { text: 'De Backer D, et al. Comparison of Dopamine and Norepinephrine in the Treatment of Shock. N Engl J Med. 2010;362:779–789.', url: 'https://doi.org/10.1056/NEJMoa0907895' },
  { text: 'Russell JA, et al. Vasopressin versus Norepinephrine Infusion in Patients with Septic Shock (VASST Trial). N Engl J Med. 2008;358:877–887.', url: 'https://doi.org/10.1056/NEJMoa067373' },
  { text: 'van Diepen S, et al. Contemporary Management of Cardiogenic Shock: A Scientific Statement from the AHA. Circulation. 2017;136:e232–e268.', url: 'https://doi.org/10.1161/CIR.0000000000000525' },
];

export const ROSC_REFERENCES: Array<{ text: string; url?: string }> = [
  { text: 'Panchal AR, et al. Part 3: Adult Basic and Advanced Life Support — 2020 AHA Guidelines for CPR and ECC. Circulation. 2020;142(16_suppl_2):S366–S468.', url: 'https://doi.org/10.1161/CIR.0000000000000916' },
  { text: 'Nolan JP, et al. ERC and ESICM Guidelines 2021: Post-resuscitation care. Resuscitation. 2021;161:220–269.', url: 'https://doi.org/10.1016/j.resuscitation.2021.02.012' },
  { text: 'Nielsen N, et al. Targeted Temperature Management at 33°C versus 36°C after Cardiac Arrest (TTM Trial). N Engl J Med. 2013;369:2197–2206.', url: 'https://doi.org/10.1056/NEJMoa1310519' },
  { text: 'Dankiewicz J, et al. Hypothermia versus Normothermia after Out-of-Hospital Cardiac Arrest (TTM2 Trial). N Engl J Med. 2021;384:2373–2383.', url: 'https://doi.org/10.1056/NEJMoa2100591' },
  { text: 'Ibanez B, et al. 2017 ESC Guidelines for the management of STEMI. Eur Heart J. 2018;39:119–177.', url: 'https://doi.org/10.1093/eurheartj/ehx393' },
];

export const HS_TS_REFERENCES: Array<{ text: string; url?: string }> = [
  { text: 'Panchal AR, et al. Part 3: Adult Basic and Advanced Life Support — 2020 AHA Guidelines for CPR and ECC. Circulation. 2020;142(16_suppl_2):S366–S468.', url: 'https://doi.org/10.1161/CIR.0000000000000916' },
  { text: 'PERKI. Panduan Resusitasi Jantung Paru: Bantuan Hidup Jantung Lanjutan. Edisi 2021. Perhimpunan Dokter Spesialis Kardiovaskular Indonesia.' },
  { text: 'Konstantinides SV, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism. Eur Heart J. 2020;41(4):543–603.', url: 'https://doi.org/10.1093/eurheartj/ehz405' },
  { text: 'Lavonas EJ, et al. Part 10: Special Circumstances of Resuscitation — 2015 AHA Guidelines Update for CPR and ECC. Circulation. 2015;132(18 suppl 2):S501–S518.', url: 'https://doi.org/10.1161/CIR.0000000000000264' },
];
