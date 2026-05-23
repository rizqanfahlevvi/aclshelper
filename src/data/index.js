/* ============================================================
   ACLS Helper · Data module
   Berdasarkan: PERKI 2021 (Bantuan Hidup Jantung Lanjut & Dasar)
   + AHA Adult ACLS guidelines (acuan internasional)

   Bilingual: istilah klinis EN/akronim, narasi ID.
   ============================================================ */

/* ------------------------------------------------------------
   SUMBER & METADATA
   ------------------------------------------------------------ */
export const ACLS_SOURCES = [
  { key: "perki",  short: "PERKI 2021", long: "Buku Panduan Kursus BHJL & BHJD — Perhimpunan Dokter Spesialis Kardiovaskular Indonesia, 2021" },
  { key: "aha",    short: "AHA 2020",   long: "American Heart Association Guidelines for CPR and ECC, 2020 (focused update 2023)" },
];

/* ------------------------------------------------------------
   QUICK ACTIONS (Code Blue FAB sheet)
   ------------------------------------------------------------ */
export const ACLS_QUICK_ACTIONS = [
  { key: "vf",    label: "VF / pVT",        sub: "Irama shockable",        tint: "var(--danger)",     glyph: "shock" },
  { key: "pea",   label: "PEA / Asistol",   sub: "Irama non-shockable",    tint: "var(--info)",       glyph: "flatline" },
  { key: "brady", label: "Bradikardi",      sub: "HR < 50 · simptomatik",  tint: "var(--warning)",    glyph: "slow" },
  { key: "tachy", label: "Takikardi",       sub: "HR > 150 · dengan nadi", tint: "var(--tint-neuro)", glyph: "fast" },
  { key: "cpr",   label: "CPR Workspace",   sub: "Resusitasi aktif",       tint: "var(--success)",    glyph: "timer" },
];

/* ------------------------------------------------------------
   ALGORITHM CATALOG
   ------------------------------------------------------------ */
export const ACLS_ALGORITHMS = [
  { key: "bhjd",     label: "BHJD Dewasa",            sub: "Bantuan Hidup Jantung Dasar · CABD",      tint: "var(--accent)",      tag: "BLS",            source: "PERKI 2021" },
  { key: "arrest",   label: "Henti Jantung Dewasa",   sub: "Algoritma utama BHJL · AHA 2020",         tint: "var(--danger)",      tag: "Code Blue",      source: "PERKI 2021" },
  { key: "vfvt",     label: "VF / pVT",                sub: "Jalur shockable rhythm",                  tint: "var(--danger)",      tag: "Shockable",      source: "PERKI 2021" },
  { key: "pea",      label: "PEA / Asistol",           sub: "Jalur non-shockable rhythm",              tint: "var(--info)",        tag: "Non-shockable",  source: "PERKI 2021" },
  { key: "brady",    label: "Bradikardi",              sub: "HR < 50 · simptomatik",                   tint: "var(--warning)",     tag: "Stabil / Tidak stabil", source: "PERKI 2021" },
  { key: "tachy",    label: "Takikardi",               sub: "QRS sempit vs lebar",                     tint: "var(--tint-neuro)",  tag: "Stabil / Tidak stabil", source: "PERKI 2021" },
  { key: "ska",      label: "Sindrom Koroner Akut",    sub: "STEMI · NSTEMI · UAP",                    tint: "var(--tint-vital)",  tag: "SKA",            source: "PERKI 2021" },
  { key: "rosc",     label: "Pasca Henti Jantung",     sub: "Targeted temperature · MAP · perfusi",    tint: "var(--success)",     tag: "Pemulihan",      source: "PERKI 2021" },
  { key: "hsts",     label: "Hs & Ts",                 sub: "10 penyebab reversibel",                  tint: "var(--tint-theory)", tag: "Diferensial",    source: "AHA 2020" },
];

/* ------------------------------------------------------------
   BHJD (BLS) — Dewasa, sesuai PERKI 2021
   ------------------------------------------------------------ */
export const ACLS_FLOW_BHJD = [
  { kind: "action", title: "Pastikan keamanan", sub: "Aman diri · aman lingkungan · aman pasien",
    pearls: "DRSCAB tidak relevan jika tempat tidak aman. Cek bahaya kebakaran, listrik, dll." },
  { kind: "action", title: "Cek respons", sub: "Tepuk bahu · panggil pasien",
    pearls: "Jangan goyang berlebihan bila curiga trauma servikal." },
  { kind: "action", title: "Aktifkan SPGDT / panggil bantuan", sub: "Code Blue / 119 · minta AED",
    pearls: "Pre-hospital: 119. Rumah sakit: aktifkan Code Blue & minta troli emergensi + AED." },
  { kind: "action", title: "Cek napas + nadi karotis", sub: "Bersamaan · ≤ 10 detik",
    pearls: "Look-listen-feel + palpasi a. karotis. Gasping = abnormal → mulai RJP." },
  { kind: "decision", title: "Henti jantung?", q: "Tidak bernapas / gasping + nadi tidak teraba",
    yes: { label: "Mulai RJP", tint: "var(--danger)" },
    no:  { label: "Posisi mantap · observasi", tint: "var(--success)" } },
  { kind: "action", title: "Kompresi dada", sub: "100–120/menit · kedalaman 5–6 cm · recoil penuh",
    pearls: "1/3 AP diameter dada. Lokasi: 1/2 bawah sternum (di antara puting). Tangan dominan di atas." },
  { kind: "action", title: "Bantu napas 30:2", sub: "2 ventilasi tiap 30 kompresi · BVM",
    pearls: "Tanpa BVM & curiga COVID-19: kompresi saja (hands-only CPR)." },
  { kind: "action", title: "Pasang AED segera", sub: "Tempel pad · ikuti instruksi suara",
    pearls: "Jangan hentikan RJP sebelum AED siap analisis. Pad anterior–lateral atau anterior–posterior." },
  { kind: "decision", title: "Shockable?", q: "AED menyarankan shock?",
    yes: { label: "Beri shock 1× · lanjut RJP", tint: "var(--danger)" },
    no:  { label: "Lanjut RJP 2 menit", tint: "var(--info)" } },
  { kind: "outcome", title: "Lanjutkan RJP hingga…", sub: "ROSC / petugas BHJL tiba / lelah",
    pearls: "Tukar penolong tiap 2 menit untuk cegah kelelahan & menjaga kualitas kompresi." },
];

/* ------------------------------------------------------------
   HENTI JANTUNG DEWASA — algoritma utama (PERKI + AHA)
   ------------------------------------------------------------ */
export const ACLS_FLOW_ARREST = [
  { kind: "action", title: "Mulai RJP berkualitas tinggi", sub: "100–120/mnt · kedalaman 5–6 cm · recoil penuh · rasio 30:2",
    pearls: "Minimalkan interupsi kompresi. Ganti compressor tiap 2 menit. Hindari hiperventilasi." },
  { kind: "action", title: "Pasang monitor / defibrilator", sub: "Pad pediatrik bila < 8 thn / < 25 kg",
    pearls: "Bila tersedia: kapnografi (target EtCO₂ > 10 mmHg sebagai indikator kualitas RJP)." },
  { kind: "decision", title: "Cek irama", q: "Shockable (VF / pVT)?",
    yes: { label: "VF / pVT", tint: "var(--danger)" },
    no:  { label: "PEA / Asistol", tint: "var(--info)" } },
  { kind: "shock", title: "Defibrilasi", sub: "Bifasik 200 J · monofasik 360 J",
    pearls: "Lanjutkan RJP segera setelah shock — jangan cek nadi dulu. PERKI: 1 kejut bifasik ≥ 3 kejut monofasik." },
  { kind: "action", title: "RJP 2 menit · siklus 1", sub: "Akses IV/IO · pertimbangkan airway lanjut · kapnografi",
    pearls: "EtCO₂ < 10 mmHg = kualitas RJP buruk. ROSC: lonjakan EtCO₂ tiba-tiba ke > 35–40 mmHg." },
  { kind: "drug", title: "Epinefrin 1 mg IV/IO", sub: "Ulang setiap 3–5 menit",
    pearls: "PERKI: 1 mg (1 mL dari 1:1.000 atau 10 mL dari 1:10.000). Flush NaCl 0,9% 20 mL · angkat lengan 10–20 dtk." },
  { kind: "decision", title: "Cek irama", q: "VF/pVT masih ada?",
    yes: { label: "Defibrilasi lagi", tint: "var(--danger)" },
    no:  { label: "Cek nadi · ROSC?", tint: "var(--success)" } },
  { kind: "drug", title: "Amiodaron (atau Lidokain)", sub: "Amio 300 mg IV/IO bolus · dosis ke-2 150 mg",
    pearls: "Encerkan dengan D5% 20–30 mL (NaCl menyebabkan presipitasi). Pertimbangkan setelah shock ke-3." },
  { kind: "note", title: "Cari & atasi Hs & Ts", sub: "Diferensial reversibel",
    pearls: "Hipovolemia · Hipoksia · H⁺ asidosis · Hipo/Hiperkalemia · Hipotermia · Tension PTX · Tamponade · Toksin · Trombosis paru · Trombosis koroner" },
  { kind: "outcome", title: "ROSC", sub: "Lanjut Perawatan Pasca Henti Jantung",
    pearls: "Target temperatur 32–36°C · MAP ≥ 65 mmHg · SpO₂ 92–98% · EtCO₂ 35–45 · cari & atasi etiologi." },
];

/* ------------------------------------------------------------
   BRADIKARDI (PERKI 2021)
   ------------------------------------------------------------ */
export const ACLS_FLOW_BRADY = [
  { kind: "action", title: "Identifikasi & nilai", sub: "HR < 50 · ABC · O₂ · akses IV · EKG 12-sandapan",
    pearls: "Cari penyebab: hipoksia, iskemia, gangguan elektrolit (hiperkalemia), obat-obatan." },
  { kind: "decision", title: "Bradiaritmia persisten?", q: "Menyebabkan hipotensi, gangguan kesadaran, syok, nyeri dada, gagal jantung akut?",
    yes: { label: "Tidak stabil — terapi", tint: "var(--danger)" },
    no:  { label: "Monitor · observasi", tint: "var(--success)" } },
  { kind: "drug", title: "Sulfas Atropin", sub: "1 mg IV bolus · ulang tiap 3–5 menit · maks 3 mg (0,04 mg/kg)",
    pearls: "PERKI: tidak efektif pada AV block infranodal (Mobitz II / derajat 3) — siapkan pacing langsung." },
  { kind: "action", title: "Pacu jantung transkutan (TCP)", sub: "Capture: HR target 60–80 · sedasi nyeri",
    pearls: "Konfirmasi mechanical capture (palpasi nadi sesuai pace) — bukan hanya electrical capture." },
  { kind: "drug", title: "Drip Dopamin atau Epinefrin", sub: "Dopa 5–20 μg/kgBB/mnt · Epi 2–10 μg/mnt",
    pearls: "PERKI: bila TCP tidak tersedia. Titrasi ke MAP ≥ 65 mmHg & resolusi gejala." },
  { kind: "outcome", title: "Konsul kardiologi", sub: "Pacu transvena · cari etiologi (iskemia, elektrolit, obat)",
    pearls: "Pacu permanent bila high-degree AV block menetap setelah koreksi penyebab reversibel." },
];

/* ------------------------------------------------------------
   TAKIKARDI (PERKI 2021)
   ------------------------------------------------------------ */
export const ACLS_FLOW_TACHY = [
  { kind: "action", title: "Identifikasi & nilai", sub: "HR > 150 · ABC · O₂ · akses IV · EKG 12-sandapan",
    pearls: "Pasang monitor, oksimetri & TD. Tanyakan riwayat (palpitasi, obat, kafein, hipertiroid)." },
  { kind: "decision", title: "Stabil?", q: "Tidak ada hipotensi, AMS, iskemia, syok, gagal jantung akut?",
    yes: { label: "Stabil — lanjut analisis QRS", tint: "var(--success)" },
    no:  { label: "Tidak stabil — kardioversi", tint: "var(--danger)" } },
  { kind: "shock", title: "Kardioversi tersinkron", sub: "Atrial fib: 120–200 J · A-flutter / SVT: 50–100 J · VT mono: 100 J",
    pearls: "PERKI: sedasi midazolam + analgetik. Sinkronisasi WAJIB; bila gagal sinkron → kejut asinkron." },
  { kind: "decision", title: "QRS sempit / lebar?", q: "Durasi QRS",
    yes: { label: "Lebar ≥ 0,12 dtk · VT?", tint: "var(--tint-neuro)" },
    no:  { label: "Sempit < 0,12 dtk · SVT", tint: "var(--info)" } },
  { kind: "action", title: "QRS sempit reguler · Manuver Vagal", sub: "Valsava · pijat sinus karotis",
    pearls: "PERKI: manuver vagal menghentikan ~25% PSVT. Hindari pijat sinus karotis bilateral / bila ada bruit." },
  { kind: "drug", title: "Adenosin 6 mg IV cepat", sub: "Flush NaCl 20 mL · lengan diangkat · dosis ke-2: 12 mg",
    pearls: "Defibrilator harus siap. Hindari pada asma. Kurangi 3 mg bila pakai dipiridamol/karbamazepin atau akses sentral." },
  { kind: "drug", title: "QRS lebar stabil · Amiodaron", sub: "150 mg IV dalam 10 menit · ulang tiap 10 mnt prn",
    pearls: "Maks 2,2 g/24 jam. Maintenance: 1 mg/mnt × 6 jam, lalu 0,5 mg/mnt × 18 jam." },
  { kind: "outcome", title: "Konsul kardiologi", sub: "Cari etiologi · pertimbangkan ablasi / EP study",
    pearls: "Bila pre-eksitasi (WPW) dengan AF → hindari adenosin & CCB; gunakan amiodaron / kardioversi." },
];

/* ------------------------------------------------------------
   SKA (Sindrom Koroner Akut · PERKI 2021)
   ------------------------------------------------------------ */
export const ACLS_FLOW_SKA = [
  { kind: "action", title: "Kecurigaan SKA", sub: "Nyeri dada > 20 mnt · keringat dingin · sesak",
    pearls: "Wanita, lansia, diabetes: gejala atipikal (dispnea, fatigue, nyeri epigastrik) lebih sering." },
  { kind: "action", title: "EKG 12-sandapan ≤ 10 menit", sub: "Cari ST elevasi / depresi / LBBB baru",
    pearls: "Sandapan posterior (V7–V9) bila depresi ST V1–V3 (curiga STEMI posterior). RV: V4R bila inferior STEMI." },
  { kind: "decision", title: "Klasifikasi EKG?", q: "ST elevasi atau LBBB baru?",
    yes: { label: "STEMI · reperfusi segera", tint: "var(--danger)" },
    no:  { label: "NSTEMI / UAP", tint: "var(--warning)" } },
  { kind: "drug", title: "Aspirin 160–320 mg po kunyah", sub: "Loading awal · semua SKA",
    pearls: "Kontraindikasi: alergi aspirin aktif, perdarahan aktif. Cek tukak peptik aktif." },
  { kind: "drug", title: "DAPT — Clopidogrel / Ticagrelor", sub: "Clopi 300–600 mg po · Tica 180 mg po",
    pearls: "Ticagrelor lebih cepat onset. PERKI: hindari ticagrelor bila riwayat ICH atau gangguan hati berat." },
  { kind: "drug", title: "Antikoagulan", sub: "UFH bolus 60 IU/kg (maks 4.000) · Enoxaparin 1 mg/kg SC",
    pearls: "Fondaparinux 2,5 mg SC alternatif (NSTEMI). UFH pilihan pada IKPP yang akan segera dilakukan." },
  { kind: "action", title: "STEMI: reperfusi", sub: "IKPP < 90 mnt (door-to-balloon) · fibrinolitik bila tidak mungkin",
    pearls: "PERKI: Streptokinase 1,5 juta U IV 30–60 mnt · Alteplase 15 mg bolus + 0,75 mg/kg lalu 0,5 mg/kg." },
  { kind: "action", title: "Terapi tambahan", sub: "Nitrat SL · β-blocker · statin · O₂ bila SpO₂ < 90%",
    pearls: "Hindari nitrat bila TDS < 90, RV infark, atau pakai PDE5-inhibitor ≤ 24 jam." },
  { kind: "outcome", title: "Pemantauan & rujukan", sub: "ICCU / Cath Lab · cek troponin serial",
    pearls: "Troponin hs-cTn 0/3 jam atau 0/1 jam (PERKI mengikuti algoritma ESC)." },
];

/* ------------------------------------------------------------
   PASCA HENTI JANTUNG (Perawatan Pasca Henti Jantung · PERKI 2021)
   ------------------------------------------------------------ */
export const ACLS_FLOW_ROSC = [
  { kind: "action", title: "ROSC tercapai · stabilkan", sub: "Konfirmasi nadi · TD · saturasi · EKG 12-sandapan",
    pearls: "Lonjakan EtCO₂ tiba-tiba (> 35–40) sering jadi pertanda ROSC sebelum nadi teraba." },
  { kind: "action", title: "Airway & ventilasi", sub: "Target SpO₂ 92–98% · EtCO₂ 35–45 mmHg",
    pearls: "Hindari hiperoksia (kerusakan reperfusi) dan hipoventilasi (asidosis · vasodilatasi serebral)." },
  { kind: "action", title: "Hemodinamik", sub: "Target MAP ≥ 65 mmHg · cairan + vasopresor titrasi",
    pearls: "Pilihan vasopresor: norepinefrin (drip 0,1–0,5 μg/kg/mnt). Epi alternatif bila bradikardi." },
  { kind: "action", title: "EKG 12-sandapan · cari STEMI", sub: "Bila STEMI → IKPP emergensi",
    pearls: "PERKI: ~80% OHCA dengan ROSC menunjukkan penyebab kardiak; reperfusi dini menurunkan mortalitas." },
  { kind: "decision", title: "Pasien tetap koma?", q: "Tidak mengikuti perintah",
    yes: { label: "TTM 32–36°C × 24 jam", tint: "var(--info)" },
    no:  { label: "Observasi · ICU", tint: "var(--success)" } },
  { kind: "action", title: "Targeted Temperature Management", sub: "32–36°C × ≥ 24 jam · cegah demam",
    pearls: "Hindari demam 72 jam pertama. Sedasi & analgetik selama TTM. Rewarming bertahap 0,25°C/jam." },
  { kind: "outcome", title: "Cari & atasi etiologi", sub: "Echo · CT · lab · konsul multidisiplin",
    pearls: "Prognostikasi neurologis ditunda ≥ 72 jam pasca-TTM. Hindari withdrawal of care dini." },
];

/* ------------------------------------------------------------
   OBAT-OBATAN (per PERKI 2021 Bab IX)
   ------------------------------------------------------------ */
export const ACLS_DRUGS = [
  /* === Vasopresor / inotropik === */
  {
    key: "epi",
    name: "Epinefrin",
    altName: "Adrenalin",
    category: "Vasopresor · inotropik",
    class: "Adrenergik α + β",
    tint: "var(--danger)",
    indication: "Henti jantung (semua irama) · anafilaksis · bradikardi simtomatik · hipotensi berat",
    dose: "1 mg IV/IO (10 mL dari 1:10.000)",
    repeat: "Setiap 3–5 menit selama resusitasi",
    prep: "Sediaan 1:1.000 (1 mg/mL) atau 1:10.000 (0,1 mg/mL). Bolus tanpa diencerkan; flush NaCl 0,9% 20 mL & angkat lengan 10–20 detik. Rute ETT: 2–2,5 mg diencerkan 10 mL NaCl 0,9%.",
    pearls: [
      "Berikan segera pada PEA/Asistol; pada VF/pVT setelah shock ke-2.",
      "Drip bradikardi tidak stabil: 2–10 μg/menit (atau 0,1–0,5 μg/kg/menit pasca ROSC).",
      "Jangan dicampur dengan larutan alkali (natrium bikarbonat).",
    ],
    contra: "Tidak ada kontraindikasi mutlak pada henti jantung.",
    source: "PERKI 2021 · Tabel 9.1 & 9.3",
  },
  {
    key: "norepi",
    name: "Norepinefrin",
    category: "Vasopresor",
    class: "Adrenergik α1 + β1",
    tint: "var(--danger)",
    indication: "Syok septik (lini 1) · syok vasodilatasi · hipotensi pasca-ROSC · syok kardiogenik dengan nadi normal/tinggi",
    dose: "Drip 0,1–0,5 μg/kgBB/menit IV",
    repeat: "Titrasi ke MAP ≥ 65 mmHg",
    prep: "4 mg dalam 250 mL D5W = 16 μg/mL · jalur sentral lebih disukai. Ekstravasasi → fentolamin lokal.",
    pearls: [
      "Koreksi hipovolemia sebelum mulai (PERKI).",
      "Risiko aritmia lebih rendah daripada dopamin.",
      "Jangan dicampur larutan alkali (natrium bikarbonat).",
    ],
    contra: "Hipovolemia belum terkoreksi · trombosis mesenterik/perifer.",
    source: "PERKI 2021 · Tabel 9.1",
  },
  {
    key: "dopa",
    name: "Dopamin",
    category: "Vasopresor · inotropik",
    class: "Katekolamin · dose-dependent",
    tint: "var(--danger)",
    indication: "Bradikardi tidak stabil tidak respons atropin · syok kardiogenik dengan nadi rendah (< 50)",
    dose: "Infus 5–20 μg/kgBB/menit, titrasi",
    repeat: "Naikkan perlahan ke MAP ≥ 65 mmHg",
    prep: "400 mg dalam 250 mL D5W = 1.600 μg/mL · jalur sentral lebih disukai.",
    pearls: [
      "2–3 μg/kg/mnt: efek dopaminergik (renal, tidak rekomendasi rutin).",
      "5–10 μg/kg/mnt: dominan β1 (inotropik).",
      "> 10 μg/kg/mnt: dominan α (vasokonstriktor).",
      "Jangan dicampur larutan alkali.",
    ],
    contra: "Hipovolemia belum terkoreksi · feokromositoma · takiaritmia tidak terkoreksi.",
    source: "PERKI 2021 · Tabel 9.1 & 9.3",
  },
  {
    key: "dobu",
    name: "Dobutamin",
    category: "Inotropik",
    class: "Agonis β-non-selektif",
    tint: "var(--tint-neuro)",
    indication: "Gagal jantung akut dengan TDS 70–100 mmHg tanpa tanda syok · syok kardiogenik output rendah",
    dose: "Infus 2–20 μg/kgBB/menit, titrasi",
    repeat: "Pantau hemodinamik kontinyu",
    prep: "250 mg dalam 250 mL D5W = 1.000 μg/mL. Hindari pencampuran dengan larutan alkali.",
    pearls: [
      "Vasodilatasi β2 ringan → dapat turunkan SVR & MAP.",
      "Hindari sebagai mono-terapi pada syok hipotensi berat.",
      "Pasien usia lanjut responnya dapat menurun.",
    ],
    contra: "Syok karena toksin/obat · stenosis subaortik hipertrofik idiopatik · hipersensitif sulfit.",
    source: "PERKI 2021 · Tabel 9.1",
  },

  /* === Antiaritmia === */
  {
    key: "amio",
    name: "Amiodaron",
    category: "Antiaritmia",
    class: "Kelas III · penghambat kanal kalium",
    tint: "var(--tint-neuro)",
    indication: "Henti jantung VF/pVT refrakter · VT stabil · kontrol laju AF (terbatas)",
    dose: "300 mg IV bolus (henti jantung) · dosis ke-2 150 mg",
    repeat: "Maintenance: 1 mg/menit × 6 jam, lalu 0,5 mg/menit × 18 jam (maks 2,2 g/24 jam)",
    prep: "Encerkan dalam D5% 20–30 mL (NaCl menyebabkan presipitasi). Jangan campur dengan obat lain.",
    pearls: [
      "Pertimbangkan setelah shock ke-3 pada VF/pVT refrakter.",
      "VT stabil QRS lebar: drip 150 mg IV dalam 10 menit, ulang prn.",
      "Awasi hipotensi & bradikardi. Hindari pada AV block tinggi tanpa pacing.",
      "Turunkan dosis digoksin 50% bila kombinasi.",
    ],
    contra: "AV block 2°/3° tanpa pacing · bradikardi berat · hipotensi berat.",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "lido",
    name: "Lidokain",
    category: "Antiaritmia",
    class: "Kelas IB · penghambat kanal natrium",
    tint: "var(--tint-neuro)",
    indication: "VF/pVT (alternatif amiodaron) · VT stabil monomorfik",
    dose: "1–1,5 mg/kgBB IV bolus (henti jantung)",
    repeat: "0,5–0,75 mg/kgBB tiap 5–10 menit · maks 3 mg/kgBB",
    prep: "Maintenance drip 1–4 mg/menit (30–50 μg/kg/mnt) diencerkan dalam D5%/NaCl 0,9%. Rute ETT: 2–4 mg/kgBB.",
    pearls: [
      "Hindari pada bradikardi atau AV block tinggi tanpa pacing.",
      "Toksisitas: disartria, kejang, AMS → stop infus.",
      "Alternatif amiodaron pada henti jantung refrakter (PERKI).",
    ],
    contra: "Hipersensitif anestetik amide · AV block tinggi.",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "mg",
    name: "Magnesium Sulfat",
    category: "Antiaritmia khusus",
    class: "Elektrolit",
    tint: "var(--tint-renal)",
    indication: "Torsade de Pointes · hipomagnesemia · VF refrakter karena hipoMg",
    dose: "1–2 g IV (5–10 mL larutan 20%) diencerkan 10 mL D5%/NaCl",
    repeat: "Drip 0,5–1 g/jam untuk kontrol TdP berkelanjutan",
    prep: "TdP dengan nadi: loading 1–2 g dalam 50–100 mL D5% selama 5–60 menit. Encerkan; infus terlalu cepat → hipotensi.",
    pearls: [
      "Obat pilihan untuk Torsade de Pointes.",
      "Tidak rutin pada henti jantung tanpa kecurigaan hipoMg/TdP.",
      "Koreksi K+ bersamaan (sering hipokalemia menyertai hipoMg).",
    ],
    contra: "Insufisiensi renal berat (akumulasi) · AV block tinggi.",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "adenosine",
    name: "Adenosin",
    category: "Antiaritmia khusus",
    class: "Nukleosida endogen · penghambat AV",
    tint: "var(--info)",
    indication: "PSVT regular (lini 1) · diagnostik takikardi QRS lebar regular monomorfik",
    dose: "6 mg IV bolus cepat (1–3 detik)",
    repeat: "12 mg IV bila tidak respons (1–2 menit setelah dosis pertama)",
    prep: "Posisi mild-reverse Trendelenburg. Three-way pada vena brachialis/antekubital. Flush NaCl 20 mL bersamaan + lengan diangkat. Bila pakai ATP: dosis 10 mg / 20 mg.",
    pearls: [
      "Waktu paruh < 10 detik · efek flushing/dispnea transient.",
      "Tidak konversi AF/A-flutter (efek transient hanya bantu diagnosis).",
      "Kurangi 3 mg bila pakai dipiridamol/karbamazepin, pasca transplantasi jantung, atau jalur sentral.",
      "Defibrilator harus siap pada QRS lebar.",
    ],
    contra: "Asma berat · AV block 2°/3° tanpa pacing · WPW dengan AF (risiko VF).",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "atropine",
    name: "Sulfas Atropin",
    category: "Bradiaritmia",
    class: "Antikolinergik (parasimpatolitik)",
    tint: "var(--warning)",
    indication: "Bradikardi tidak stabil (lini 1) · AV block 1° / Mobitz I",
    dose: "1 mg IV bolus (4 ampul = 4×0,25 mg)",
    repeat: "Setiap 3–5 menit · maks 3 mg total (0,04 mg/kg)",
    prep: "Push cepat; dosis < 0,5 mg dapat menyebabkan bradikardi paradoksal. Interval 3 mnt + dosis > 0,04 mg/kg pada kondisi berat.",
    pearls: [
      "PERKI: tidak efektif pada AV block infranodal (Mobitz II / derajat 3) — siapkan pacing.",
      "Mekanisme: antagonis kompetitif asetilkolin di reseptor M.",
      "Hati-hati pada iskemia akut (takikardi berlebih).",
    ],
    contra: "AV block high-degree (Mobitz II / derajat 3) — pacing dulu.",
    source: "PERKI 2021 · Tabel 9.3",
  },
  {
    key: "verapamil",
    name: "Verapamil",
    category: "Antiaritmia",
    class: "Kelas IV · CCB non-dihidropiridin",
    tint: "var(--tint-neuro)",
    indication: "SVT lini 2 (setelah adenosin) · kontrol laju AF",
    dose: "2,5–5 mg IV bolus selama 2 menit",
    repeat: "5–10 mg IV setiap 15–30 menit · maks 20 mg",
    prep: "Lansia: berikan selama 3 menit. Alternatif: 5 mg tiap 15 mnt sampai total 30 mg.",
    pearls: [
      "Hindari pada AF/A-flutter pre-eksitasi (WPW).",
      "Hindari kombinasi dengan β-blocker IV (potensiasi bradikardi).",
      "Hati-hati pada gagal jantung sistolik (inotropik negatif).",
    ],
    contra: "Hipotensi · AV block tinggi · WPW dengan AF · gagal jantung berat.",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "diltiazem",
    name: "Diltiazem",
    category: "Antiaritmia",
    class: "Kelas IV · CCB non-dihidropiridin",
    tint: "var(--tint-neuro)",
    indication: "SVT lini 2 (setelah adenosin) · kontrol laju AF",
    dose: "15–20 mg (0,25 mg/kg) IV selama 2 menit",
    repeat: "Ulang 15 mnt kemudian: 20–25 mg (0,35 mg/kg)",
    prep: "Maintenance 5–15 mg/jam, titrasi laju nadi. Encerkan dengan D5%/NaCl 0,9%.",
    pearls: [
      "Lebih disukai daripada verapamil pada gagal jantung (efek inotropik negatif lebih ringan).",
      "Hindari pada WPW pre-eksitasi dengan AF.",
    ],
    contra: "Hipotensi · AV block tinggi · WPW dengan AF.",
    source: "PERKI 2021 · Tabel 9.2",
  },
  {
    key: "digoxin",
    name: "Digoksin",
    category: "Antiaritmia",
    class: "Glikosida jantung",
    tint: "var(--tint-drug)",
    indication: "Alternatif SVT setelah adenosin · kontrol laju AF pada CHF",
    dose: "4–6 μg/kg IV dalam 5 menit (≈ 0,5 mg pada dewasa)",
    repeat: "2–3 μg/kg setiap 4–8 jam · total 8–12 μg/kg dalam 8–16 jam",
    prep: "Cek kadar digoksin 4 jam pasca IV / 6 jam pasca oral. Turunkan dosis 50% bila kombinasi dengan amiodaron.",
    pearls: [
      "Onset lambat → bukan pilihan akut.",
      "Risiko toksisitas pada gangguan ginjal & elektrolit (hipoK/hipoMg).",
    ],
    contra: "AV block tinggi · WPW · hipokalemia berat.",
    source: "PERKI 2021 · Tabel 9.2",
  },

  /* === Antitrombotik untuk SKA === */
  {
    key: "asa",
    name: "Aspirin",
    category: "Antitrombotik · SKA",
    class: "Antiplatelet · COX-1 inhibitor",
    tint: "var(--tint-vital)",
    indication: "SKA (semua tipe) · pencegahan sekunder",
    dose: "160–320 mg po kunyah (loading)",
    repeat: "Maintenance 75–100 mg/hari po",
    prep: "Tablet kunyah untuk absorpsi cepat. Berikan ASAP pada kecurigaan SKA.",
    pearls: [
      "Menurunkan mortalitas SKA, reinfark, stroke non-fatal (PERKI).",
      "Hambat pembentukan thromboxan A2 → cegah agregasi platelet & konstriksi arteri.",
    ],
    contra: "Alergi aspirin · perdarahan aktif · ulkus peptik aktif.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "clopi",
    name: "Clopidogrel",
    category: "Antitrombotik · SKA",
    class: "Antiplatelet · antagonis P2Y12 (thienopyridine)",
    tint: "var(--tint-vital)",
    indication: "SKA · pasca-stent koroner · alternatif aspirin",
    dose: "Loading 300–600 mg po · 600 mg bila IKPP",
    repeat: "Maintenance 75 mg/hari po × 12 bulan (DAPT)",
    prep: "DAPT dengan aspirin pasca-IKPP. Stop 5 hari sebelum bedah besar.",
    pearls: [
      "Inaktif → aktif via CYP2C19 (variasi genetik mempengaruhi respons).",
      "Pertimbangkan loading 600 mg bila IKPP untuk onset lebih cepat.",
    ],
    contra: "Perdarahan aktif · ICH baru.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "tica",
    name: "Ticagrelor",
    category: "Antitrombotik · SKA",
    class: "Antiplatelet · antagonis P2Y12 reversibel",
    tint: "var(--tint-vital)",
    indication: "SKA · onset cepat · pasca IKPP",
    dose: "Loading 180 mg po",
    repeat: "Maintenance 90 mg po setiap 12 jam × 12 bulan",
    prep: "Tidak perlu aktivasi metabolik (reversibel). Stop 5 hari sebelum bedah.",
    pearls: [
      "Onset & offset lebih cepat daripada clopidogrel.",
      "Efek samping khas: dispnea (12%), bradikardi ringan.",
      "PERKI: hindari pada riwayat ICH atau gangguan hati berat.",
    ],
    contra: "ICH · perdarahan aktif · gangguan hati berat.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "ufh",
    name: "Heparin (UFH)",
    category: "Antitrombotik · SKA",
    class: "Antikoagulan parenteral",
    tint: "var(--tint-vital)",
    indication: "SKA · IKPP · trombosis arteri/vena",
    dose: "Bolus 60 IU/kg (maks 4.000 IU) IV",
    repeat: "Drip 12 IU/kg/jam (maks 1.000 IU/jam), titrasi aPTT 1,5–2,5× kontrol",
    prep: "Cek aPTT setiap 6 jam awalnya. Antidot: protamin sulfat 1 mg per 100 IU heparin.",
    pearls: [
      "Pilihan pada IKPP segera (mudah dihentikan).",
      "Kompleks dengan antitrombin → hambat faktor IIa, IXa, Xa, XIa, XIIa.",
      "Risiko HIT (heparin-induced thrombocytopenia) — pantau trombosit.",
    ],
    contra: "Perdarahan aktif · HIT · trombosit < 100.000.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "enox",
    name: "Enoxaparin (LMWH)",
    category: "Antitrombotik · SKA",
    class: "LMWH · inhibitor faktor Xa",
    tint: "var(--tint-vital)",
    indication: "NSTEMI / UAP · trombosis vena · profilaksis",
    dose: "1 mg/kg SC setiap 12 jam",
    repeat: "Sesuaikan pada CKD (eGFR < 30: 1 mg/kg sekali sehari)",
    prep: "Tidak perlu pemantauan aPTT rutin. Cek anti-Xa pada CKD, obesitas, hamil.",
    pearls: [
      "Onset lebih dapat diprediksi dibanding UFH.",
      "Pasien > 75 tahun: 0,75 mg/kg SC tiap 12 jam (tanpa bolus IV).",
    ],
    contra: "Perdarahan aktif · HIT · CKD stadium 5.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "strepto",
    name: "Streptokinase",
    category: "Antitrombotik · SKA",
    class: "Fibrinolitik (non-fibrin spesifik)",
    tint: "var(--danger)",
    indication: "STEMI bila IKPP tidak tersedia / DTB > 120 menit",
    dose: "1,5 juta unit IV selama 30–60 menit",
    repeat: "Tidak diulang (risiko antibodi)",
    prep: "Encerkan dalam 100 mL NaCl 0,9% / D5%. Pantau hipotensi (efek vasodilatasi).",
    pearls: [
      "Tidak dapat diulang dalam 6 bulan (antibodi netralisasi).",
      "Reaksi alergi (anafilaksis) ~5%; premedikasi steroid + antihistamin opsional.",
      "Target: door-to-needle ≤ 30 menit.",
    ],
    contra: "Riwayat ICH · perdarahan aktif · stroke iskemik < 3 bulan · TD > 180/110 tidak terkontrol · bedah besar < 3 minggu.",
    source: "PERKI 2021 · Tabel 9.4",
  },
  {
    key: "alteplase",
    name: "Alteplase (rt-PA)",
    category: "Antitrombotik · SKA",
    class: "Fibrinolitik (fibrin-spesifik)",
    tint: "var(--danger)",
    indication: "STEMI bila IKPP tidak tersedia · alternatif streptokinase",
    dose: "15 mg IV bolus, lalu 0,75 mg/kg (maks 50 mg) dalam 30 menit, lalu 0,5 mg/kg (maks 35 mg) dalam 60 menit",
    repeat: "Dapat diulang (tidak menimbulkan antibodi)",
    prep: "Total maksimal 100 mg dalam 90 menit. Berikan heparin bersamaan (UFH/enoxaparin).",
    pearls: [
      "Fibrin-spesifik → lebih efektif dibanding streptokinase, terutama anterior STEMI luas.",
      "Risiko ICH lebih tinggi (~0,9%); skrining ketat kontraindikasi.",
    ],
    contra: "Sama dengan streptokinase; ICH lebih tinggi pada lansia & hipertensi.",
    source: "PERKI 2021 · Tabel 9.4",
  },
];

/* ------------------------------------------------------------
   IRAMA EKG — sesuai BHJD Bab III + tambahan
   ------------------------------------------------------------ */
export const ACLS_RHYTHMS = [
  { key: "vf",      name: "Fibrilasi Ventrikel", short: "VF",
    severity: "shockable", tint: "var(--danger)",
    features: "Tidak ada QRS jelas · gelombang chaotic · amplitudo bervariasi.",
    action: "DEFIBRILASI segera (bifasik 200 J) · RJP · Epinefrin · Amiodaron." },
  { key: "vt",      name: "Takikardi Ventrikel Monomorfik", short: "VT",
    severity: "shockable", tint: "var(--danger)",
    features: "QRS lebar > 0,12 detik · regular · laju 150–250.",
    action: "Tanpa nadi → defibrilasi. Stabil → amiodaron. Tidak stabil → kardioversi tersinkron." },
  { key: "torsades", name: "Torsade de Pointes", short: "TdP",
    severity: "shockable", tint: "var(--danger)",
    features: "VT polimorfik · sumbu berputar (twisting) · QT memanjang prekursor.",
    action: "Mg 1–2 g IV · defibrilasi bila tanpa nadi · koreksi K/Mg · stop obat pemanjang QT." },
  { key: "svt",     name: "Supraventricular Tachycardia", short: "SVT",
    severity: "stable", tint: "var(--warning)",
    features: "QRS sempit < 0,12 dtk · regular · laju 150–250 · gelombang P tersembunyi.",
    action: "Manuver vagal → adenosin 6/12 mg → CCB (verapamil/diltiazem) atau β-blocker." },
  { key: "asys",    name: "Asistol", short: "Asys",
    severity: "non-shockable", tint: "var(--info)",
    features: "Flatline · konfirmasi 2 sandapan · cek koneksi & gain.",
    action: "RJP · Epinefrin 1 mg · cari Hs & Ts · JANGAN defibrilasi." },
  { key: "pea",     name: "Pulseless Electrical Activity", short: "PEA",
    severity: "non-shockable", tint: "var(--info)",
    features: "Irama listrik teratur tanpa nadi mekanik.",
    action: "RJP · Epinefrin 1 mg · cari Hs & Ts agresif · USG bedside (RUSH)." },
  { key: "av3",     name: "AV Block Derajat 3", short: "CHB",
    severity: "unstable", tint: "var(--warning)",
    features: "Disosiasi atrium & ventrikel · escape rhythm 30–40.",
    action: "Atropin sering gagal (infranodal) · pacu transkutan · dopamin/epi drip · konsul EP." },
  { key: "stemi",   name: "Anterior STEMI", short: "STEMI",
    severity: "critical", tint: "var(--danger)",
    features: "ST elevasi V1–V4 ≥ 2 mm · Q wave evolusi · resiprokal inferior.",
    action: "ASA + DAPT · antikoagulan · IKPP door-to-balloon < 90 menit." },
  { key: "hyperk",  name: "EKG Hiperkalemia", short: "K↑",
    severity: "critical", tint: "var(--danger)",
    features: "Peaked T → PR memanjang → QRS lebar → sine wave.",
    action: "Ca-glukonas 1 g · insulin + D5 · β-agonis · diuresis/dialisis." },
];

/* ------------------------------------------------------------
   Hs & Ts (diferensial reversibel · standar internasional)
   ------------------------------------------------------------ */
export const ACLS_HS_TS = [
  { key: "hypovol", group: "H", name: "Hipovolemia",            tint: "var(--info)",
    clue: "Trauma, perdarahan, dehidrasi · narrow PP · USG: IVC kolaps.",
    rx: "Bolus 30 mL/kg NaCl 0,9% / RL · transfusi · hentikan perdarahan." },
  { key: "hypoxia", group: "H", name: "Hipoksia",                tint: "var(--tint-resp)",
    clue: "Saturasi rendah · sianosis · obstruksi jalan napas.",
    rx: "Jalan napas · ventilasi · O₂ 100% · konfirmasi posisi ETT." },
  { key: "hion",    group: "H", name: "Ion Hidrogen (asidosis)", tint: "var(--tint-resp)",
    clue: "ABG: pH < 7,2 · CKD · DKA.",
    rx: "Ventilasi adekuat · NaHCO₃ 1 mEq/kg bila pH < 7,1." },
  { key: "hyperk",  group: "H", name: "Hiper-/Hipokalemia",     tint: "var(--danger)",
    clue: "Peaked T (hiper) · U-wave (hipo) · obat: digoksin, suksinilkolin.",
    rx: "Hiper: Ca-glukonas, insulin/D5, β-agonis. Hipo: KCl 10 mEq/jam." },
  { key: "hypoth",  group: "H", name: "Hipotermia",            tint: "var(--info)",
    clue: "Suhu inti < 30°C · tenggelam · paparan dingin.",
    rx: "Rewarming aktif · RJP terus sampai 32–34°C ('not dead until warm & dead')." },
  { key: "ptx",     group: "T", name: "Tension Pneumothorax",   tint: "var(--danger)",
    clue: "JVP ↑ · breath sound asimetris · trakea deviasi · pasca CVC.",
    rx: "Dekompresi jarum mid-klavikula ICS 4–5 · chest tube." },
  { key: "tamp",    group: "T", name: "Tamponade Jantung",      tint: "var(--danger)",
    clue: "Trias Beck · USG: efusi · pulsus paradoxus · pasca bedah jantung.",
    rx: "Perikardiosentesis · subxiphoid window." },
  { key: "tox",     group: "T", name: "Toksin / Obat",          tint: "var(--tint-neuro)",
    clue: "Riwayat overdosis · pupil pinpoint (opiat) · QT memanjang (TCA).",
    rx: "Antidot spesifik: naloxone, NaHCO₃ (TCA), lipid emulsion (LA tox)." },
  { key: "tpe",     group: "T", name: "Trombosis Paru (PE)",    tint: "var(--tint-neuro)",
    clue: "Riwayat DVT · takipnea pre-arrest · RV strain di USG.",
    rx: "Pertimbangkan tPA selama RJP; lanjutkan RJP ≥ 60–90 menit." },
  { key: "tcor",    group: "T", name: "Trombosis Koroner (AMI)", tint: "var(--danger)",
    clue: "Nyeri dada pre-arrest · STEMI di EKG pasca-ROSC.",
    rx: "ASA · antikoagulan · IKPP emergensi." },
];

/* ------------------------------------------------------------
   CPR Workspace timeline prompts (1 cycle 2 menit)
   ------------------------------------------------------------ */
export const ACLS_CPR_PROMPTS = [
  { at: 0,   action: "Mulai RJP · 100–120/menit", tone: "info" },
  { at: 30,  action: "Konfirmasi akses IV/IO",     tone: "info" },
  { at: 60,  action: "Cek kapnografi (EtCO₂ > 10)", tone: "info" },
  { at: 90,  action: "Siapkan shock / obat berikutnya", tone: "warn" },
  { at: 120, action: "Cek irama · cek nadi ≤ 10 dtk", tone: "danger" },
];
