/* ============================================================
   ACLS Helper · Data module
   Berdasarkan: PERKI 2021 · Cetakan 2021 (diselaraskan AHA 2025)
   + AHA 2025 Guidelines for CPR and ECC (akuan internasional)

   Bilingual: istilah klinis EN/akronim, narasi ID.
   ============================================================ */

/* ------------------------------------------------------------
   SUMBER & METADATA
   ------------------------------------------------------------ */
export const ACLS_SOURCES = [
  { key: "perki", short: "PERKI 2021", long: "Buku Panduan Kursus BHJL & BHJD — Perhimpunan Dokter Spesialis Kardiovaskular Indonesia, Cetakan 2021 (diselaraskan AHA 2025 Guidelines)" },
  { key: "aha",   short: "AHA 2025",  long: "American Heart Association Guidelines for CPR and Emergency Cardiovascular Care, 2025" },
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
  /* Algoritma Utama */
  { key: "bhjd",      label: "BHJD Dewasa",              sub: "Bantuan Hidup Jantung Dasar · CABD",      tint: "var(--accent)",      tag: "BLS",                   source: "PERKI 2021" },
  { key: "arrest",    label: "Henti Jantung Dewasa",     sub: "Algoritma utama BHJL · AHA 2025",         tint: "var(--danger)",      tag: "Code Blue",             source: "PERKI 2021" },
  { key: "vfvt",      label: "VF / pVT",                 sub: "Jalur shockable rhythm",                  tint: "var(--danger)",      tag: "Shockable",             source: "PERKI 2021" },
  { key: "pea",       label: "PEA / Asistol",            sub: "Jalur non-shockable rhythm",              tint: "var(--info)",        tag: "Non-shockable",         source: "PERKI 2021" },
  { key: "brady",     label: "Bradikardi",               sub: "HR < 50 · simptomatik",                   tint: "var(--warning)",     tag: "Stabil / Tidak stabil", source: "PERKI 2021" },
  { key: "tachy",     label: "Takikardi",                sub: "QRS sempit vs lebar",                     tint: "var(--tint-neuro)",  tag: "Stabil / Tidak stabil", source: "PERKI 2021" },
  { key: "ska",       label: "Sindrom Koroner Akut",     sub: "STEMI · NSTEMI · UAP",                    tint: "var(--tint-vital)",  tag: "SKA",                   source: "PERKI 2021" },
  { key: "rosc",      label: "Pasca Henti Jantung",      sub: "TTM 32–37,5°C · MAP · neuroproteksi",     tint: "var(--success)",     tag: "Pemulihan",             source: "PERKI 2021" },
  { key: "hsts",      label: "Hs & Ts",                  sub: "10 penyebab reversibel",                  tint: "var(--tint-theory)", tag: "Diferensial",           source: "AHA 2025" },
  /* Keadaan Khusus (AHA 2025 Part 10) */
  { key: "opioid",    label: "Overdosis Opioid",         sub: "Nalokson sebelum RJP · ventilasi dulu",   tint: "var(--tint-neuro)",  tag: "Keadaan Khusus",        source: "AHA 2025" },
  { key: "anaphylaxis", label: "Anafilaksis",            sub: "Epinefrin IM · airway · kortikosteroid",  tint: "var(--danger)",      tag: "Keadaan Khusus",        source: "AHA 2025" },
  { key: "pregnancy", label: "Henti Jantung Kehamilan",  sub: "LUD · RCD ≤ 5 menit · tim obstetri",     tint: "var(--tint-vital)",  tag: "Keadaan Khusus",        source: "AHA 2025" },
  { key: "drowning",  label: "Tenggelam",                sub: "Ventilasi prioritas · hipotermia",        tint: "var(--info)",        tag: "Keadaan Khusus",        source: "AHA 2025" },
  { key: "hypothermia", label: "Hipotermia Berat",       sub: "RJP terus · ECMO · 'not dead until warm'", tint: "var(--accent)",    tag: "Keadaan Khusus",        source: "AHA 2025" },
];

/* ------------------------------------------------------------
   BHJD (BLS) — Dewasa, sesuai PERKI 2025
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
  { kind: "note", title: "Kecurigaan Overdosis Opioid?", sub: "Napas tidak ada / tidak adekuat sebelum kolaps",
    pearls: "AHA 2025: berikan nalokson 2 mg intranasal atau 0,4 mg IV SEBELUM memulai RJP bila ada kecurigaan opioid. Lanjutkan napas buatan + RJP segera setelahnya." },
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
    pearls: "AHA 2025: TTM 32–37,5°C (cegah demam ≥37,7°C) · MAP ≥ 65 mmHg · SpO₂ 92–98% · EtCO₂ 35–45 · cari & atasi etiologi." },
];

/* ------------------------------------------------------------
   BRADIKARDI (PERKI 2025)
   ------------------------------------------------------------ */
export const ACLS_FLOW_BRADY = [
  // [0] Box 1 — AHA 2025
  {
    kind: "action",
    title: "Identifikasi & nilai",
    sub: "HR < 50/mnt · ABC · O₂ · akses IV · monitor · EKG 12-sandapan",
    pearls: "Bradikardi simptomatik: ada tanda hipoperfusi (hipotensi, AMS, syok, nyeri dada iskemik, gagal jantung akut). Bradikardi asimtomatik tidak memerlukan terapi akut.",
  },
  // [1] Box 2 — decision: ada compromise?
  {
    kind: "decision",
    title: "Cardiopulmonary compromise?",
    q: "Ada hipotensi · gangguan kesadaran · syok · nyeri dada iskemik · gagal jantung akut?",
    yes: { label: "Ya — stabilisasi ABC dulu", tint: "var(--danger)", targetIndex: 2 },
    no:  { label: "Monitor · observasi · cari etiologi", tint: "var(--success)", targetIndex: 8 },
  },
  // [2] Box 3 — AHA 2025 ← BARU (sebelumnya tidak ada)
  {
    kind: "action",
    title: "Stabilisasi ABC (Box 3 AHA 2025)",
    sub: "Jaga jalan napas · beri O₂ · ventilasi tekanan positif jika perlu · pasang monitor kardiorespiratori · pantau nadi",
    pearls: "Jika bradikardi membaik setelah O₂ + airway management → tidak perlu Atropin. Nilai ulang sebelum melanjutkan ke terapi farmakologis.",
  },
  // [3] Box 4 — decision: masih persists? ← BARU (sebelumnya tidak ada)
  {
    kind: "decision",
    title: "Bradikardi persists dengan compromise?",
    q: "Setelah stabilisasi ABC: masih ada hipotensi / AMS / syok / nyeri dada / gagal jantung akut?",
    yes: { label: "Ya — lanjut Atropin", tint: "var(--danger)", targetIndex: 4 },
    no:  { label: "Tidak — observasi & etiologi", tint: "var(--success)", targetIndex: 8 },
  },
  // [4] Box 5a — Atropin (digeser dari index [2])
  {
    kind: "drug",
    title: "Sulfas Atropin",
    sub: "1 mg IV bolus · ulang tiap 3–5 menit · maks 3 mg · jika gagal → TCP dan/atau vasopressor",
    pearls: "TIDAK efektif pada AV block infranodal (Mobitz II / derajat 3) — siapkan TCP segera. Dosis < 0,5 mg dapat paradoks memperlambat HR.",
  },
  // [5] Box 5b — TCP (digeser dari index [3])
  {
    kind: "action",
    title: "Pacu jantung transkutan (TCP)",
    sub: "Demand mode · rate 60–80/mnt · mulai output rendah, naikkan sampai capture · sedasi/analgesi",
    pearls: "PERKI: TCP pilihan utama bila atropin gagal atau AV block infranodal. Konfirmasi capture mekanikal (nadi teraba), bukan hanya elektrikal (spike di monitor).",
  },
  // [6] Box 5c — Dopamin / Epi drip (digeser dari index [4])
  {
    kind: "drug",
    title: "Drip Dopamin atau Epinefrin",
    sub: "Dopamin 2–20 mcg/kg/mnt IV · atau Epinefrin 2–10 mcg/mnt IV",
    pearls: "Dopamin: efek kronotropik dominan di dosis 5–10 mcg/kg/mnt. Epinefrin: alternatif bila tidak ada dopamin atau syok berat. Titrasi sesuai respons HR dan TD.",
  },
  // [7] Box 6 — Konsul (digeser dari index [5])
  {
    kind: "outcome",
    title: "Konsul kardiologi",
    sub: "Pacu transvena · cari etiologi (iskemia, elektrolit, obat)",
    pearls: "Pacu permanent bila high-degree AV block menetap setelah koreksi penyebab reversibel.",
  },
  // [8] Box 7 — Monitor & etiologi ← BARU (endpoint NO dari Box 2 & Box 4)
  {
    kind: "action",
    title: "Identifikasi & atasi penyebab (Box 7)",
    sub: "Support ABC · EKG 12-sandapan · lab elektrolit · observasi ketat",
    pearls: [
      "Hipoksia — paling sering, atasi O₂ dan airway.",
      "Iskemia miokard — EKG, troponin, pertimbangkan revaskularisasi.",
      "Gangguan elektrolit — hiperkalemia (tall T, wide QRS), hipokalsemia.",
      "Obat-obatan — β-blocker, CCB, digoksin, antiaritmia (periksa riwayat obat).",
      "Hipotiroid — TSH bila klinis sesuai.",
      "AV block infranodal (Mobitz II / derajat 3) — atropin tidak efektif, siapkan pacing segera.",
    ],
  },
];

/* ------------------------------------------------------------
   TAKIKARDI (PERKI 2025)
   ------------------------------------------------------------ */
export const ACLS_FLOW_TACHY = [
  // [0] Box 1 — AHA 2025: Assess appropriateness
  {
    kind: "action",
    title: "Identifikasi & nilai",
    sub: "HR ≥ 150/mnt · nilai klinis · apakah takiaritmia?",
    pearls: "Pertanyaan kunci: apakah HR ini proporsional terhadap kondisi klinis (demam, nyeri, hipovolemi)? Sinus takikardi sebagai respons fisiologis tidak memerlukan antiaritmia.",
  },
  // [1] Box 2 — AHA 2025: Initial assessment & support ← BARU (sebelumnya tidak ada)
  {
    kind: "action",
    title: "Stabilisasi awal (Box 2 AHA 2025)",
    sub: "Jaga jalan napas · O₂ bila hipoksemi · monitor EKG & TD & oksimetri · akses IV · EKG 12-sandapan",
    pearls: [
      "AHA 2025 Box 2: langkah ini wajib sebelum decision stabil/tidak stabil.",
      "EKG 12-sandapan kritis: tentukan QRS sempit/lebar, regular/ireguler, ada delta wave (WPW)?",
      "Pasang defibrilator/kardioverter dalam jangkauan sebelum terapi apapun.",
    ],
  },
  // [2] Box 3 — decision: ada compromise? ← digeser dari index [1]
  {
    kind: "decision",
    title: "Persistent tachyarrhythmia dengan compromise?",
    q: "Ada hipotensi · AMS · syok · nyeri dada iskemik · gagal jantung akut?",
    yes: { label: "Tidak stabil — kardioversi segera", tint: "var(--danger)", targetIndex: 3 },
    no:  { label: "Stabil — analisis QRS", tint: "var(--success)", targetIndex: 5 },
  },
  // [3] Box 6 — kardioversi (tidak stabil) ← digeser dari index [2]
  {
    kind: "shock",
    title: "Kardioversi tersinkron (Box 6)",
    sub: "Sedasi bila memungkinkan · QRS sempit reguler: pertimbangkan adenosin dulu",
    pearls: [
      "PERKI: sedasi midazolam 1–2 mg IV + analgetik (fentanil/morfin) bila sadar.",
      "Energi: A-fib 120–200 J bifasik · A-flutter/SVT 50–100 J · VT monomorfik 100 J.",
      "Sinkronisasi WAJIB (mode 'sync'); bila gagal sinkron dan pasien memburuk → defibrilasi asinkron.",
      "Polimorfik VT tidak stabil: TIDAK bisa disinkron → defibrilasi dosis tinggi (asinkron).",
    ],
  },
  // [4] Box 7 — refrakter (setelah kardioversi gagal)
  {
    kind: "action",
    title: "Jika refrakter (Box 7)",
    sub: "Pertimbangkan: naikkan energi · tambah antiaritmia · konsul spesialis",
    pearls: [
      "Cari penyebab yang bisa dikoreksi (iskemia, elektrolit, obat).",
      "Antiaritmia IV sebelum kardioversi ulang dapat meningkatkan keberhasilan.",
      "Konsul kardiologi/elektrofisiologi segera bila kardioversi ≥ 3× gagal.",
    ],
  },
  // [5] Box 4 — decision: QRS lebar atau sempit? (stabil)
  {
    kind: "decision",
    title: "QRS lebar atau sempit?",
    q: "Durasi QRS pada EKG 12-sandapan",
    yes: { label: "Lebar ≥ 0,12 dtk → VT / SVT aberan", tint: "var(--tint-neuro)", targetIndex: 8 },
    no:  { label: "Sempit < 0,12 dtk → SVT", tint: "var(--info)", targetIndex: 6 },
  },
  // [6] Box 5a — QRS sempit stabil: manuver vagal + adenosin
  {
    kind: "action",
    title: "QRS sempit reguler · Manuver Vagal",
    sub: "Valsava · pijat sinus karotis (unilateral) · cold water immersion",
    pearls: [
      "PERKI: manuver vagal menghentikan ~25% PSVT. Lakukan saat monitor EKG berjalan.",
      "Hindari pijat sinus karotis: bilateral, pada pasien dengan bruit, atau riwayat stroke.",
      "Modified Valsava (recumbent + passive leg raise setelah strain) lebih efektif.",
    ],
  },
  // [7] Box 5b — Adenosin
  {
    kind: "drug",
    title: "Adenosin 6 mg IV bolus cepat",
    sub: "Flush NaCl 20 mL segera · lengan diangkat · dosis ke-2: 12 mg bila tidak respons",
    pearls: [
      "Defibrilator harus siap sebelum pemberian — dapat memicu VF pada WPW + AF.",
      "Hindari pada asma berat (bronkospasme).",
      "Kurangi dosis menjadi 3 mg bila: pakai dipiridamol/karbamazepin, pasca transplantasi jantung, atau akses vena sentral.",
      "QRS lebar: adenosin hanya bila regular DAN monomorfik (untuk diagnostik/terapi SVT aberan).",
      "QRS ireguler lebar (AF + WPW) → KONTRAINDIKASI adenosin (risiko VF).",
    ],
  },
  // [8] Box 8 — QRS lebar stabil: antiaritmia ← DIPERBARUI (tambah Procainamide)
  {
    kind: "drug",
    title: "QRS lebar stabil · Antiaritmia IV (Box 8)",
    sub: "Prokainamid 20–50 mg/mnt (maks 17 mg/kg) · atau Amiodaron 150 mg/10 mnt · konsul spesialis",
    pearls: [
      "AHA 2025: pertimbangkan adenosin hanya bila QRS lebar REGULAR dan MONOMORFIK.",
      "Prokainamid: loading 20–50 mg/mnt IV → hentikan bila aritmia terminasi, QRS melebar >50%, hipotensi, atau maks 17 mg/kg. Maintenance 1–4 mg/mnt. HINDARI pada QT memanjang atau CHF.",
      "Amiodaron: 150 mg IV dalam 10 menit, dapat diulang. Maintenance 1 mg/mnt × 6 jam.",
      "Jangan berikan dua antiaritmia IV bersamaan tanpa konsul — risiko proaritmia.",
      "QRS lebar ireguler POLIMORFIK (TdP) → defibrilasi, bukan kardioversi atau antiaritmia Kelas I.",
    ],
  },
  // [9] Box AF — AF dengan rate cepat (QRS sempit ireguler) ← BARU
  {
    kind: "action",
    title: "QRS sempit IREGULER · Fibrilasi Atrium",
    sub: "Rate control: diltiazem atau β-blocker IV · rhythm control: kardioversi bila tidak stabil · antikoagulasi",
    pearls: [
      "Identifikasi: irama tidak teratur (irregularly irregular), tidak ada gelombang P, garis dasar bergetar.",
      "Rate control akut: diltiazem 0,25 mg/kg IV bolus atau metoprolol 2,5–5 mg IV. Alternatif: digoksin atau amiodaron pada CHF.",
      "Kardioversi elektrik: hanya bila tidak stabil ATAU durasi AF jelas < 48 jam.",
      "AF > 48 jam atau durasi tidak diketahui: JANGAN kardioversi tanpa antikoagulasi adekuat (risiko emboli) — kecuali hemodinamik tidak stabil.",
      "WPW + AF: HINDARI adenosin, digoksin, diltiazem, verapamil, β-blocker IV → gunakan amiodaron atau kardioversi segera.",
    ],
  },
  // [10] Konsul & follow-up
  {
    kind: "outcome",
    title: "Konsul kardiologi",
    sub: "Cari etiologi · pertimbangkan ablasi / EP study · antikoagulasi jangka panjang",
    pearls: [
      "WPW dengan AF atau SVT refrakter → ablasi kateter (kuratif >95%).",
      "VT pada penyakit jantung struktural → ICD + konsul EP.",
      "AF: stratifikasi risiko emboli (CHA₂DS₂-VASc ≥ 2 → DOAC).",
    ],
  },
];

/* ------------------------------------------------------------
   SKA (Sindrom Koroner Akut · PERKI 2025)
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
   PASCA HENTI JANTUNG (Perawatan Pasca Henti Jantung · PERKI 2025)
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
    yes: { label: "TTM 32–37,5°C × ≥ 24 jam", tint: "var(--info)" },
    no:  { label: "Observasi · ICU · cegah demam", tint: "var(--success)" } },
  { kind: "action", title: "Targeted Temperature Management (TTM)", sub: "32–37,5°C · cegah demam ≥ 37,7°C · minimal 24 jam (direkomendasikan 36–48 jam)",
    pearls: "AHA 2025: TTM 32–37,5°C (bukan hanya 32–34°C). Cegah demam ≥37,7°C selama 72 jam pasca-ROSC. Rewarming bertahap ≤0,25°C/jam. Sedasi & analgetik selama TTM." },
  { kind: "outcome", title: "Cari & atasi etiologi", sub: "Echo · CT · lab · konsul multidisiplin",
    pearls: "Prognostikasi neurologis ditunda ≥ 72 jam pasca-TTM. Hindari withdrawal of care dini." },
];

/* ------------------------------------------------------------
   OVERDOSIS OPIOID — Keadaan Khusus (AHA 2025 Part 10)
   ------------------------------------------------------------ */
export const ACLS_FLOW_OPIOID = [
  { kind: "action", title: "Kenali overdosis opioid", sub: "Napas lambat / tidak ada · miosis · tidak responsif",
    pearls: "Trias klasik: miosis (pupil pinpoint) · penurunan kesadaran · depresi napas. Tanyakan riwayat opioid, temukan jarum/obat." },
  { kind: "action", title: "Aktifkan bantuan · panggil SPGDT / 119",
    sub: "Jangan tinggalkan pasien sendirian",
    pearls: "Minta AED. Pre-hospital: hubungi 119 segera. Rumah sakit: Code Blue." },
  { kind: "decision", title: "Ada nadi?", q: "Nadi karotis teraba?",
    yes: { label: "Henti napas saja — nalokson + ventilasi", tint: "var(--warning)" },
    no:  { label: "Henti jantung — RJP segera", tint: "var(--danger)" } },
  { kind: "drug", title: "Nalokson 2 mg Intranasal (atau 0,4 mg IV/IO)", sub: "Berikan sebelum atau saat memulai RJP bila curiga opioid",
    pearls: "AHA 2025: nalokson IM/IN dapat diberikan oleh orang awam. Dosis 2 mg IN via atomizer (1 mg per nostril) atau 0,4 mg IV. Onset IN 3–5 menit; IV/IM 1–2 menit. Ulangi tiap 2–3 menit bila perlu (maks tidak ditetapkan, titrasi efek)." },
  { kind: "action", title: "Mulai RJP berkualitas tinggi", sub: "100–120/mnt · kedalaman 5–6 cm · 30:2",
    pearls: "Jangan tunda RJP untuk mendapatkan nalokson. Kedua tindakan dapat dilakukan bersamaan." },
  { kind: "action", title: "Buka jalan napas · beri ventilasi BVM", sub: "O₂ 100% · 1 napas/6 detik (10/menit)",
    pearls: "Hiperoksi sering diperlukan pada overdosis opioid karena sudah ada hipoksia berkepanjangan. Pertimbangkan airway adjunct (OPA/NPA)." },
  { kind: "decision", title: "Respons terhadap nalokson?", q: "Pasien sadar · napas adekuat · SpO₂ ≥ 94%?",
    yes: { label: "Monitor ketat 2–4 jam · nalokson re-dosing", tint: "var(--success)" },
    no:  { label: "Lanjut RJP · cari penyebab lain", tint: "var(--danger)" } },
  { kind: "note", title: "Perhatian post-nalokson", sub: "Awas resedasi saat nalokson habis",
    pearls: "Waktu paruh opioid sering melebihi nalokson (30–90 menit). Siapkan drip nalokson 0,4–0,8 mg/jam bila opioid long-acting (fentanil, metadon). Pertimbangkan observasi 4–8 jam." },
  { kind: "outcome", title: "Rujuk & edukasi", sub: "Detoksifikasi · program MOUD · edukasi keluarga",
    pearls: "Setiap pasien overdosis opioid harus ditawari terapi medis berbasis bukti (metadon/buprenorfin). Resepkan nalokson take-home untuk keluarga/caregiver." },
];

/* ------------------------------------------------------------
   ANAFILAKSIS — Keadaan Khusus (AHA 2025 · PERKI BHJL)
   ------------------------------------------------------------ */
export const ACLS_FLOW_ANAPHYLAXIS = [
  { kind: "action", title: "Kenali anafilaksis", sub: "Onset cepat · multiorganic · setelah pajanan alergen",
    pearls: "Kriteria: (1) kulit/mukosa + satu organ lain (resp/kardio); atau (2) dua sistem+ setelah pajanan; atau (3) hipotensi setelah pajanan. Alergen umum: makanan, antibiotik, NSAID, media kontras, bisa serangga." },
  { kind: "drug", title: "Epinefrin 0,5 mg IM (anterolateral paha)", sub: "LINI PERTAMA — berikan segera tanpa menunggu akses IV",
    pearls: "Sediaan 1:1.000 (1 mg/mL). Dosis dewasa 0,5 mg IM anterolateral paha (vastus lateralis). Anak < 30 kg: 0,3 mg IM. Ulangi tiap 5–10 menit bila respons tidak adekuat. Epipens (auto-injector): 0,3 mg dan 0,15 mg." },
  { kind: "action", title: "Posisi berbaring · angkat kaki (bila hipotensi)", sub: "Jangan berdiri / duduk tiba-tiba → risiko 'empty heart'",
    pearls: "Hipotensi tanpa distres napas: posisi supine + kaki ditinggikan. Distres napas dominan: semi-sitting. Hamil: miring kiri." },
  { kind: "action", title: "O₂ aliran tinggi · akses IV besar · cairan IV", sub: "O₂ mask 8–12 L/mnt · NaCl 0,9% 1–2 L bolus",
    pearls: "Hipotensi persisten setelah epinefrin IM: bolus IV NaCl 0,9% 500 mL cepat, ulangi hingga MAP ≥ 65. Pasang monitor." },
  { kind: "decision", title: "Airway aman?", q: "Stridor · angioedema lidah / uvula · suara serak?",
    yes: { label: "Intubasi dini sebelum terlambat", tint: "var(--danger)" },
    no:  { label: "O₂ mask · monitor ketat", tint: "var(--success)" } },
  { kind: "drug", title: "Antihistamin H1 (Difenhidramin 50 mg IV)", sub: "Tambahan — bukan lini pertama · tidak gantikan epinefrin",
    pearls: "AHA 2025: antihistamin tidak mencegah atau mengobati syok anafilaksis dan angiodema berat. Diberikan sebagai adjuvan setelah epinefrin dosis pertama diberikan." },
  { kind: "drug", title: "Kortikosteroid (Metilprednisolon 125 mg IV)", sub: "Cegah reaksi bifasik · efek lambat 4–6 jam",
    pearls: "Reaksi bifasik terjadi pada 5–20% kasus, 1–72 jam setelah reaksi awal. Observasi minimal 4–6 jam (8–24 jam bila reaksi berat)." },
  { kind: "drug", title: "Epinefrin drip IV (bila henti jantung / syok refrakter)", sub: "Drip 1–10 μg/menit atau bolus IV 0,1 mg (1:10.000) perlahan",
    pearls: "Henti jantung akibat anafilaksis: protokol ACLS standar + epinefrin 1 mg IV/IO tiap 3–5 menit. Durasi RJP yang lama tetap layak — epinefrin IV pada anafilaksis sangat efektif." },
  { kind: "outcome", title: "Observasi & discharge plan", sub: "4–8 jam (reaksi ringan) · 24 jam (berat / bifasik)",
    pearls: "Resepkan auto-injector epinefrin (Epipen) saat pulang. Rujuk ke dokter spesialis alergi. Identifikasi gelang alergi. Edukasi menghindari alergen." },
];

/* ------------------------------------------------------------
   HENTI JANTUNG PADA KEHAMILAN — AHA 2025 Part 10
   ------------------------------------------------------------ */
export const ACLS_FLOW_PREGNANCY = [
  { kind: "action", title: "Aktifkan Kode Maternal Darurat", sub: "Panggil tim ACLS + tim obstetri + neonatologi",
    pearls: "AHA 2025: siapkan segera untuk Resusitasi Caesar Darurat (RCD/PMCD). Target RCD ≤ 5 menit dari henti jantung ibu bila RJP tidak menghasilkan ROSC." },
  { kind: "action", title: "RJP berkualitas tinggi · posisi tangan lebih tinggi", sub: "Satu jari di atas titik tengah sternum · kedalaman 5–6 cm",
    pearls: "Pada kehamilan > 20 minggu: kompresi di atas pusat sternum (uterus mendorong diafragma ke atas). Ganti compressor tiap 2 menit." },
  { kind: "action", title: "Manual Left Uterine Displacement (LUD)", sub: "Geser uterus ke kiri secara manual selama RJP",
    pearls: "LUD menghilangkan kompresi aortocaval (sindrom supine hipotensif) → meningkatkan venous return dan CO. Tidak perlu memiringkan ibu; meja CPR tetap datar." },
  { kind: "action", title: "O₂ 100% · akses IV/IO (di atas diafragma dianjurkan)', sub: 'Hindari jalur femoral jika uterus besar menekan vena cava",
    pearls: "Airway lanjut: intubasi (lebih sulit karena edema, berat badan). Gunakan ETT lebih kecil 0,5-1 ukuran. Preoksigenasi adekuat penting." },
  { kind: "decision", title: "ROSC dalam 4 menit?", q: "Nadi teraba · sirkulasi spontan kembali?",
    yes: { label: "Lanjut perawatan maternal-fetal", tint: "var(--success)" },
    no:  { label: "Siapkan RCD segera · target ≤ 5 mnt", tint: "var(--danger)" } },
  { kind: "shock", title: "Defibrilasi aman pada kehamilan", sub: "Bifasik 200 J · lepas monitor fetal · pad jauh dari uterus",
    pearls: "Defibrilasi TIDAK kontraindikasi pada kehamilan. Arus ke fetus minimal. Lepaskan monitor EFM sebelum shock." },
  { kind: "action", title: "Resusitasi Caesar Darurat (RCD)", sub: "Target < 5 menit dari henti jantung · di mana saja bila perlu",
    pearls: "AHA 2025: RCD adalah intervensi resusitasi ibu (bukan hanya untuk menyelamatkan bayi). Mengurangi kompresi aortocaval → meningkatkan keberhasilan RJP. Dapat dilakukan di IGD / ICU bila tidak ada kamar operasi tersedia." },
  { kind: "drug", title: "Obat ACLS standar (tidak kontraindikasi)", sub: "Epinefrin · amiodaron · dosis tidak diubah",
    pearls: "Epinefrin, amiodarone, dan defibrilasi digunakan dengan dosis standar. Jangan tunda atau kurangi dosis karena kekhawatiran fetal." },
  { kind: "outcome", title: "Pasca ROSC — ICU perinatal", sub: "Monitor fetal · TTM aman pada kehamilan · konsul multidisiplin",
    pearls: "TTM (32–37,5°C) dapat diterapkan pada ibu hamil pasca-ROSC; pantau kesejahteraan fetal ketat. Konsul kardiologi, obstetri, neonatologi, anestesi." },
];

/* ------------------------------------------------------------
   TENGGELAM (Drowning) — AHA 2025 Part 10
   ------------------------------------------------------------ */
export const ACLS_FLOW_DROWNING = [
  { kind: "action", title: "Keamanan & ekstraksi dari air", sub: "Jangan masuk air tanpa perlindungan · aktivasi SPGDT",
    pearls: "Bahaya bagi penyelamat: arus, kedalaman, panik korban. Gunakan alat bantu (pelampung, tali). Panggil 119 segera." },
  { kind: "action", title: "Mulai ventilasi penyelamatan di air (bila aman)", sub: "5 napas penyelamatan sesegera mungkin",
    pearls: "AHA 2025: napas penyelamatan adalah langkah pertama pada tenggelam. Penyebab utama henti jantung adalah asfiksia (bukan irama jantung primer). Ventilasi dini menyelamatkan jiwa." },
  { kind: "action", title: "Keluarkan dari air · posisi supine di permukaan keras", sub: "Minimal gerakan leher hanya bila ada kecurigaan trauma",
    pearls: "Jangan rutin imobilisasi servikal — risiko trauma leher pada tenggelam sangat rendah (<0,5%) kecuali ada mekanisme jelas (terjun, benturan). Imobilisasi tidak perlu menunda resusitasi." },
  { kind: "action", title: "Cek nadi + napas ≤ 10 detik", sub: "Bila tidak ada nadi/napas → mulai RJP segera",
    pearls: "Mungkin terasa sangat lambat akibat hipotermia. Konfirmasi 10 detik penuh. Pasang AED segera." },
  { kind: "action", title: "RJP 30:2 — prioritaskan ventilasi", sub: "Beri 5 napas awal sebelum memulai kompresi",
    pearls: "Berbeda dari henti jantung dewasa biasa — tenggelam adalah asfiksia primer. Beri 5 napas penyelamatan dulu, lalu 30:2. Keluarkan air dari saluran napas hanya jika obstruksi nyata (tidak perlu 'draining')." },
  { kind: "action", title: "Pasang AED · cek irama · defibrilasi bila shockable", sub: "Keringkan dada sebelum pasang pad",
    pearls: "Hipotermia berat dapat mengurangi efektivitas defibrilasi. Coba 1–3 kali shock; bila gagal saat suhu < 30°C, tunda defibrilasi lanjutan hingga suhu > 30°C." },
  { kind: "action", title: "Manajemen hipotermia (bila ada)', sub: 'Lepas pakaian basah · selimut hangat · hindari gerakan berlebihan",
    pearls: "Jangan anggap pasien meninggal tanpa mencoba resusitasi penuh ('not dead until warm and dead'). Target rewarming minimal 32°C sebelum menyatakan meninggal." },
  { kind: "drug", title: "Obat ACLS standar bila henti jantung", sub: "Epinefrin 1 mg IV/IO tiap 3–5 menit",
    pearls: "Etiologi: asfiksia → hipoksia → henti jantung (biasanya asistol/PEA). Cari Hs&Ts: hipotermia, hipoksia, hipovolemia. Pada hipotermia berat: efektivitas obat menurun." },
  { kind: "outcome", title: "ICU · monitoring paru · neuroproteksi", sub: "Awas ARDS, edema paru, aspirasi, sepsis",
    pearls: "Outcome tenggelam sangat bergantung pada durasi submersion dan waktu resusitasi. Submersion < 5 menit → prognosis baik. > 25 menit air tawar / > 30 menit air asin → prognosis buruk. Hipotermia dapat bersifat neuroprotektif." },
];

/* ------------------------------------------------------------
   HIPOTERMIA BERAT — AHA 2025 Part 10
   ------------------------------------------------------------ */
export const ACLS_FLOW_HYPOTHERMIA = [
  { kind: "action", title: "Kenali & ukur suhu inti", sub: "Termometer rektal / esofageal · bukan aksila/timpani",
    pearls: "Klasifikasi: I: 32–35°C (menggigil); II: 28–32°C (tidak menggigil, ataksia); III: 24–28°C (tidak sadar); IV: < 24°C (henti jantung)." },
  { kind: "action", title: "Cegah kehilangan panas lebih lanjut", sub: "Lepas pakaian basah · selimut hangat · lindungi dari angin",
    pearls: "Handle with care — gerakan berlebihan dapat memicu VF pada hipotermia berat. Transport secara hati-hati, posisi horizontal." },
  { kind: "action", title: "Cek nadi ≤ 60 detik pada hipotermia berat", sub: "Denyut sangat lemah dan lambat — jangan terburu-buru",
    pearls: "AHA 2025: pada suhu < 30°C, nadi dapat sangat lemah/lambat. Gunakan USG atau monitor jantung untuk konfirmasi henti jantung sebelum memulai RJP bila ragu." },
  { kind: "decision", title: "Henti jantung?", q: "Tidak ada nadi yang teraba",
    yes: { label: "Mulai RJP · tahan jangan hentikan", tint: "var(--danger)" },
    no:  { label: "Rewarming aktif · monitor ketat", tint: "var(--info)" } },
  { kind: "action", title: "RJP berkelanjutan · jangan hentikan", sub: "'Not dead until warm and dead' — terus RJP hingga suhu inti ≥ 32°C",
    pearls: "Hipotermia bersifat neuroprotektif — laporan kasus survival dengan neurologis baik setelah > 60 menit RJP. Ganti compressor tiap 2 menit. Hindari hiperventilasi (kurangi preload)." },
  { kind: "shock", title: "Defibrilasi terbatas pada suhu < 30°C", sub: "Coba 1 shock VF/pVT; tunda defibrilasi lebih lanjut hingga suhu ≥ 30°C",
    pearls: "Pada suhu < 30°C, defibrilasi seringkali tidak efektif. Berikan 1–3 shock; jika gagal, fokus pada rewarming. Di atas 30°C, defibrilasi berulang bila indikasi." },
  { kind: "drug", title: "Obat ACLS — dosis & interval diperpanjang", sub: "Pertimbangkan tidak memberikan obat bila suhu < 30°C",
    pearls: "AHA 2025: pada suhu < 30°C, metabolisme obat sangat lambat → akumulasi toksik. Tahan epinefrin/amiodaron. Di atas 30°C: berikan dengan interval lebih panjang (6–10 menit). Di atas 35°C: dosis normal." },
  { kind: "action", title: "Rewarming aktif internal", sub: "Cairan IV hangat (40–42°C) · O₂ hangat lembab · lavase rongga tubuh hangat",
    pearls: "ECMO (extracorporeal membrane oxygenation) adalah pilihan terbaik untuk henti jantung akibat hipotermia — target suhu > 32°C saat ROSC. Indikasi ECMO: suhu < 28°C, K+ serum < 12 mEq/L." },
  { kind: "outcome", title: "Target ROSC dengan suhu ≥ 32°C", sub: "ECMO preferred · ICU · monitor aritmia reperfusi",
    pearls: "Aritmia reperfusi (AF, VT/VF) sering terjadi saat rewarming — umumnya self-terminating saat suhu normal. Prognosis baik bila K+ < 12 mEq/L sebelum rewarming." },
];

/* ------------------------------------------------------------
   OBAT-OBATAN (per PERKI 2025 · AHA 2025)
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
    dose: "Henti jantung: 1 mg IV/IO (10 mL dari 1:10.000) · Anafilaksis: 0,5 mg IM anterolateral paha (1:1.000)",
    repeat: "Henti jantung: tiap 3–5 menit · Anafilaksis: tiap 5–10 menit bila perlu",
    prep: "Sediaan 1:1.000 (1 mg/mL) atau 1:10.000 (0,1 mg/mL). Bolus IV tanpa diencerkan; flush NaCl 0,9% 20 mL & angkat lengan 10–20 detik. Rute ETT: 2–2,5 mg diencerkan 10 mL NaCl 0,9%.",
    pearls: [
      "Henti jantung: berikan segera pada PEA/Asistol; pada VF/pVT setelah shock ke-2.",
      "Anafilaksis: 0,5 mg IM (deltoid atau anterolateral paha — vastus lateralis) dari sediaan 1:1.000. Sisi paha lebih disukai karena absorpsi lebih cepat.",
      "Drip pasca-ROSC/bradikardi tidak stabil: 2–10 μg/menit (titrasi ke MAP ≥ 65 mmHg).",
      "Jangan dicampur dengan larutan alkali (natrium bikarbonat).",
    ],
    contra: "Tidak ada kontraindikasi mutlak pada henti jantung atau anafilaksis.",
    source: "PERKI 2021 · Tabel 9.1 & 9.3 · AHA 2025",
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
    source: "PERKI 2025 · Tabel 9.1 & 9.3",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.3",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.2",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
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
    source: "PERKI 2025 · Tabel 9.4",
  },

  /* === Antidot / Keadaan Khusus (AHA 2025) === */
  {
    key: "naloxone",
    name: "Nalokson",
    altName: "Narcan",
    category: "Antidot · Keadaan Khusus",
    class: "Antagonis reseptor opioid",
    tint: "var(--tint-neuro)",
    indication: "Overdosis opioid dengan depresi napas atau henti jantung",
    dose: "2 mg intranasal (1 mg per nostril) ATAU 0,4 mg IV/IO/IM",
    repeat: "Ulangi tiap 2–3 menit bila tidak respons · titrasi efek",
    prep: "Intranasal (IN): 2 mg via atomizer nasal (lebih mudah diberikan awam). IV: 0,4 mg ampul 1 mL diencerkan NaCl 0,9%. Drip: 0,4–0,8 mg/jam bila opioid long-acting (metadon, fentanil patch).",
    pearls: [
      "AHA 2025: nalokson IN 2 mg direkomendasikan sebagai intervensi BLS untuk suspected opioid arrest — berikan sebelum atau saat memulai RJP.",
      "Waktu paruh singkat (30–90 mnt) — resedasi mungkin terjadi bila opioid long-acting; pasang drip kontinyu.",
      "Pada adiksi opioid kronis: dosis tinggi dapat memicu withdrawal akut (agitasi, muntah, nyeri). Titrasi perlahan 0,04–0,1 mg.",
      "NADA efek pada overdosis non-opioid (benzo, barbiturat, etanol).",
    ],
    contra: "Tidak ada kontraindikasi mutlak pada overdosis opioid mengancam jiwa.",
    source: "AHA 2025 Part 10.3",
  },
  {
    key: "calcium",
    name: "Kalsium Glukonat / Klorida",
    category: "Elektrolit · Antidot",
    class: "Kation divalen — stabilisasi membran",
    tint: "var(--tint-renal)",
    indication: "Hiperkalemia berat · toksisitas CCB · hipokalemia simtomatik · hipomagnesemia dengan hipokalsemia",
    dose: "Glukonat: 1–3 g IV (10–30 mL larutan 10%) · Klorida: 1 g IV (10 mL larutan 10%)",
    repeat: "Ulangi tiap 10–20 menit sesuai respons EKG dan kadar serum",
    prep: "Glukonat: aman via perifer · Klorida: lebih kuat 3× — hindari ekstravasasi (nekrosis); gunakan via sentral. Berikan perlahan 2–3 menit IV push.",
    pearls: [
      "Hiperkalemia: berikan bila QRS melebar, gelombang T tinggi peaked, atau K+ > 6,5 mEq/L. Onset 1–3 menit.",
      "Toksisitas CCB: Ca-klorida 1–3 g IV bolus perlahan; dapat diikuti drip 0,5–1 g/jam.",
      "Tidak menurunkan kadar K+ — hanya stabilisasi membran jantung sementara (30–60 menit).",
      "Hindari pencampuran dengan NaHCO₃ (presipitasi kalsium karbonat).",
    ],
    contra: "Hiperkalsemia · Digoxin toxicity (potentiasi) · hiperkalemia tanpa perubahan EKG (relatif).",
    source: "PERKI 2025 · AHA 2025",
  },
  {
    key: "nahco3",
    name: "Natrium Bikarbonat",
    altName: "NaHCO₃",
    category: "Buffer · Antidot",
    class: "Alkalinisasi sistemik",
    tint: "var(--tint-renal)",
    indication: "Asidosis metabolik berat (pH < 7,1) · overdosis TCA · hiperkalemia berat · alkalinisasi urin",
    dose: "1 mEq/kg IV bolus (bicnat 8,4% = 1 mEq/mL)",
    repeat: "Ulangi 0,5 mEq/kg tiap 10 menit · panduan ABG",
    prep: "Larutan 8,4% (1 mEq/mL) atau 4,2% (0,5 mEq/mL). Encerkan 1:1 dengan D5W bila via perifer. Jangan campur dengan kalsium (presipitasi), epinefrin, atau dopamin.",
    pearls: [
      "Tidak direkomendasikan rutin pada henti jantung (asidosis akan koreksi dengan RJP berkualitas).",
      "Overdosis TCA: alkalinisasi darah target pH 7,45–7,55 mempersempit QRS & stabilisasi irama.",
      "Hiperkalemia berat dengan QRS melebar: 50–100 mEq IV bolus (shift K+ ke intrasel).",
      "Hipercarbia worsening: bikarbonat menghasilkan CO₂ — pastikan ventilasi adekuat.",
    ],
    contra: "Asidosis respiratorik tidak terkoreksi · alkalosis metabolik · hipernatremia.",
    source: "PERKI 2025 · AHA 2025",
  },
  {
    key: "procainamide",
    name: "Prokainamid",
    category: "Antiaritmia",
    class: "Kelas IA · penghambat kanal Na+ dan K+",
    tint: "var(--tint-neuro)",
    indication: "VT stabil monomorfik dengan nadi (lini 2 setelah amiodaron) · SVT refrakter · AF dengan konduksi aksesori",
    dose: "20–50 mg/menit IV infus hingga aritmia terminasi, atau maks 17 mg/kg",
    repeat: "Maintenance: 1–4 mg/menit drip",
    prep: "Encerkan dalam 250–500 mL D5% atau NaCl 0,9%. Pemantauan EKG kontinyu wajib. Hentikan bila QRS melebar > 50%, hipotensi, atau aritmia baru.",
    pearls: [
      "Lebih efektif dari amiodaron untuk terminasi VT monomorfik stabil (beberapa RCT).",
      "Memperlambat konduksi → jangan pakai pada LBBB preexisting (kontraindikasi relatif).",
      "Dihindari pada QT memanjang (risiko TdP) dan MI akut.",
      "Metabolit aktif NAPA (N-asetilprokainamid) dapat menyebabkan lupus-like syndrome jangka panjang.",
    ],
    contra: "QT memanjang · Torsades de Pointes · AV block tinggi tanpa pacing · SLE.",
    source: "AHA 2025",
  },
  {
    key: "dextrose",
    name: "Dextrose 40% (D40%)",
    altName: "Glukosa 40%",
    category: "Antidot · Keadaan Khusus",
    class: "Karbohidrat intravena",
    tint: "var(--success)",
    indication: "Hipoglikemia berat (gula darah < 50 mg/dL dengan gejala) · tidak sadar akibat hipoglikemia",
    dose: "25–50 mL IV bolus (= 10–20 g glukosa) perlahan 2–3 menit",
    repeat: "Ulangi bila GDS < 70 mg/dL setelah 15 menit · drip D10% maintenance",
    prep: "Larutan D40% = 400 mg/mL. Hiperosmolar — gunakan vena besar, hindari vena kecil (risiko phlebitis/nekrosis). Cek GDS sebelum & 15 menit setelah pemberian.",
    pearls: [
      "Henti jantung akibat hipoglikemia: koreksi gula darah adalah bagian dari Hs (diferensial).",
      "Injeksi terlalu cepat dapat menyebabkan osmolalitas darah melonjak — berikan perlahan.",
      "Setelah sadar: berikan makanan per oral untuk cegah re-hipoglikemia (bila bisa menelan).",
      "Pada sulfonilurea OD: hipoglikemia dapat berulang berkali-kali — pertimbangkan drip D10% + oktreotid.",
    ],
    contra: "Hiperglikemia yang tidak terdiagnosis (pastikan cek GDS terlebih dahulu).",
    source: "PERKI 2025 · AHA 2025",
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

  /* Ritme tambahan — AHA 2025 / ESC 2023 */
  { key: "af",      name: "Fibrilasi Atrium", short: "AF",
    severity: "stable", tint: "var(--warning)",
    features: "Irama tidak regular (irregularly irregular) · tidak ada gelombang P yang jelas · garis isoelektrik bergetar (f-wave) · QRS sempit (kecuali aberansi).",
    action: "Kontrol laju: diltiazem/verapamil/β-blocker atau digoksin (CHF). Kontrol irama: kardioversi tersinkron bila tidak stabil. Antikoagulasi: CHADS₂-VASc ≥ 2 → DOAC." },
  { key: "flutter", name: "Flutter Atrium", short: "A-Flutter",
    severity: "stable", tint: "var(--warning)",
    features: "Gelombang gigi gergaji (sawtooth) di inferior leads (II, III, aVF) · laju atrium 250–350 · konduksi biasanya 2:1 → HR ~150 · regular.",
    action: "Tidak stabil: kardioversi tersinkron 50–100 J. Stabil: rate control (diltiazem/β-blocker). Hindari adenosin diagnostik saja (tidak terminasi)." },
  { key: "wellens", name: "Sindrom Wellens", short: "Wellens",
    severity: "critical", tint: "var(--danger)",
    features: "Tipe A: gelombang T bifasik di V2–V3 (positif lalu negatif). Tipe B: gelombang T negatif dalam di V2–V3. Terjadi saat BEBAS nyeri dada (post-angina). ST normal/minimal.",
    action: "JANGAN stress test (risiko VF) · konsul kardiologi segera · kateterisasi kritis (LAD stenosis berat hampir pasti)." },
  { key: "dewinter", name: "De Winter T-wave", short: "De Winter",
    severity: "critical", tint: "var(--danger)",
    features: "ST depresi naik (upsloping) di V1–V6 + gelombang T tinggi-simetris di prekordial + ST elevasi aVR (sering) · STEMI equivalen (LAD oklusi).",
    action: "Perlakukan sebagai STEMI: ASA + DAPT + antikoagulan + IKPP emergensi < 90 menit. Jangan menunggu — tidak ada evolusi ST elevasi klasik." },
  { key: "brugada", name: "Pola Brugada Tipe 1", short: "Brugada",
    severity: "critical", tint: "var(--danger)",
    features: "ST elevasi berbentuk 'coved' (kubah) ≥ 2 mm di V1–V2 + gelombang T negatif · bukan elevasi STEMI — ST turun secara bertahap (coved pattern).",
    action: "Rujuk elektrofisiologi · ICD bila ada riwayat syncope/VF. Hindari: sodium channel blocker, CCB, β-blocker, demam tinggi. Quinidine/isoproterenol untuk VF storm." },
  { key: "wpw",     name: "WPW — Wolff-Parkinson-White", short: "WPW",
    severity: "unstable", tint: "var(--danger)",
    features: "Interval PR pendek (< 120 ms) · gelombang delta (slurring awal QRS) · QRS sedikit melebar · ST-T inverse dari delta. EKG normal di antara episode.",
    action: "WPW + AF dengan konduksi cepat → KONTRAINDIKASI adenosin/verapamil/digoksin (dapat trigger VF). Gunakan prokainamid/amiodaron atau kardioversi segera. Konsul EP ablasi." },
  { key: "lbbb",    name: "LBBB Baru", short: "LBBB Baru",
    severity: "critical", tint: "var(--danger)",
    features: "QRS ≥ 0,12 dtk · pola RSR' di V5–V6 ('M-shape') · gelombang S di V1 · Sgarbossa criteria: konkordant ST ≥ 1 mm atau diskordant ST ≥ 25% QRS amplitude.",
    action: "LBBB BARU + gejala SKA = STEMI equivalen → IKPP emergensi. Gunakan kriteria Sgarbossa untuk identifikasi STEMI di LBBB. Jangan tunda reperfusi." },
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
