/* ============================================================
   ACLS Helper · Data module
   Berdasarkan: PERKI 2021 · Cetakan 2021 (diselaraskan AHA 2025)
   + AHA 2025 Guidelines for CPR and ECC (akuan internasional)

   Bilingual: istilah klinis EN/akronim, narasi ID.
   ============================================================ */

import type { Algorithm, Drug, Rhythm, FlowStep } from '../types';

/* ------------------------------------------------------------
   SUMBER & METADATA
   ------------------------------------------------------------ */
export const ACLS_SOURCES: Array<{ key: string; short: string; long: string }> = [
  { key: "perki", short: "PERKI 2021", long: "Buku Panduan Kursus BHJL & BHJD — Perhimpunan Dokter Spesialis Kardiovaskular Indonesia, Cetakan 2021 (diselaraskan AHA 2025 Guidelines)" },
  { key: "aha",   short: "AHA 2025",  long: "American Heart Association Guidelines for CPR and Emergency Cardiovascular Care, 2025" },
];

/* ------------------------------------------------------------
   QUICK ACTIONS (Code Blue FAB sheet)
   ------------------------------------------------------------ */
export const ACLS_QUICK_ACTIONS: Array<{ key: string; label: string; sub: string; tint: string; glyph: string }> = [
  { key: "vf",    label: "VF / pVT",        sub: "Irama shockable",        tint: "var(--danger)",     glyph: "shock" },
  { key: "pea",   label: "PEA / Asistol",   sub: "Irama non-shockable",    tint: "var(--info)",       glyph: "flatline" },
  { key: "brady", label: "Bradikardi",      sub: "HR < 50 · simptomatik",  tint: "var(--warning)",    glyph: "slow" },
  { key: "tachy", label: "Takikardi",       sub: "HR > 150 · dengan nadi", tint: "var(--tint-neuro)", glyph: "fast" },
  { key: "cpr",   label: "CPR Workspace",   sub: "Resusitasi aktif",       tint: "var(--success)",    glyph: "timer" },
];

/* ------------------------------------------------------------
   ALGORITHM CATALOG
   ------------------------------------------------------------ */
export const ACLS_ALGORITHMS: Algorithm[] = [
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
export const ACLS_FLOW_BHJD: FlowStep[] = [
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
export const ACLS_FLOW_ARREST: FlowStep[] = [
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
export const ACLS_FLOW_BRADY: FlowStep[] = [
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
export const ACLS_FLOW_TACHY: FlowStep[] = [
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
export const ACLS_FLOW_SKA: FlowStep[] = [
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
export const ACLS_FLOW_ROSC: FlowStep[] = [
  // [0] Box 1 — ROSC diperoleh
  {
    kind: "outcome",
    title: "ROSC tercapai (Box 1)",
    sub: "Resusitasi berlanjut di fase pasca-ROSC — banyak langkah dapat berjalan paralel",
    pearls: "Tandai waktu ROSC. Fase ini adalah 'resusitasi berkelanjutan' — bukan akhir penanganan.",
  },
  // [1] Box 2 — Manajemen airway + oksigenasi + hemodinamik
  {
    kind: "action",
    title: "Manajemen airway + oksigenasi + hemodinamik (Box 2)",
    sub: "Nilai airway · konfirmasi ETT · target SpO₂ 90–98% · PaCO₂ 35–45 · MAP ≥ 65 mmHg",
    pearls: [
      "Airway: nilai posisi ETT/SGA dengan capnografi gelombang. Ganti bila perlu.",
      "Oksigenasi: pertahankan FiO₂ 100% sampai SpO₂/PaO₂ bisa diukur reliabel, lalu titrasi ke SpO₂ 90–98% (PaO₂ 60–105 mmHg).",
      "Ventilasi: atur minute ventilation untuk target PaCO₂ 35–45 mmHg (kecuali asidemia berat).",
      "Hemodinamik: vasopressor dan/atau resusitasi cairan untuk MAP ≥ 65 mmHg.",
      "HINDARI: hiperoksemia (SpO₂ > 98%), hipokapnia (PaCO₂ < 35), hiperkapnia berat.",
    ],
  },
  // [2] Box 3 — Pemeriksaan diagnostik awal
  {
    kind: "action",
    title: "Pemeriksaan diagnostik awal (Box 3)",
    sub: "EKG 12-sandapan · CT scan · USG bedside / ekokardiografi",
    pearls: [
      "EKG: cari ST elevasi, iskemia, aritmia — pertimbangkan kateterisasi emergensi bila STEMI.",
      "CT kepala/thorax/abdomen: tentukan penyebab arrest atau komplikasi resusitasi.",
      "USG bedside (POCUS/RUSH): identifikasi tamponade, pneumotoraks, hipovolemia, disfungsi ventrikel.",
      "Indikasi angiografi koroner emergensi: ST elevasi persisten · syok kardiogenik · aritmia ventrikel berulang/refrakter · iskemia miokard berat.",
    ],
  },
  // [3] Box 4 — Atasi etiologi + pertimbangkan intervensi koroner
  {
    kind: "action",
    title: "Atasi etiologi arrest + komplikasi (Box 4)",
    sub: "Cari & koreksi Hs & Ts · pertimbangkan angiografi koroner emergensi / MCS",
    pearls: [
      "Indikasi angiografi koroner emergensi: STEMI persisten · syok kardiogenik · aritmia ventrikel refrakter.",
      "Mechanical Circulatory Support (MCS): IABP, Impella, ECMO-VA bila syok kardiogenik refrakter.",
      "Antibiotik: pertimbangkan pada pasien aspirasi atau infeksi sebagai etiologi.",
      "Target metabolik selama perawatan ICU: PaO₂ 60–105 · PaCO₂ 35–45 · glukosa 70–180 mg/dL · MAP ≥ 65.",
    ],
  },
  // [4] Box 5 — Nilai kesadaran (off sedasi)
  {
    kind: "action",
    title: "Nilai kesadaran pasien (Box 5)",
    sub: "Nilai off sedasi dan neuromuscular blockade bila memungkinkan",
    pearls: "Tujuan: tentukan apakah pasien dapat mengikuti perintah — menentukan jalur manajemen selanjutnya (TTM vs monitoring biasa).",
  },
  // [5] Box 6 — Decision: follows commands?
  {
    kind: "decision",
    title: "Pasien mengikuti perintah?",
    q: "Dapat mengikuti perintah sederhana saat off sedasi dan neuromuscular blockade?",
    yes: { label: "Ya — lanjut perawatan kritis standar", tint: "var(--success)", targetIndex: 10 },
    no:  { label: "Tidak / tidak dapat dinilai — TTM + EEG", tint: "var(--warning)", targetIndex: 6 },
  },
  // [6] Box 7 — Perawatan kritis berkelanjutan (untuk yang tidak follows commands)
  {
    kind: "action",
    title: "Perawatan kritis berkelanjutan (Box 7)",
    sub: "Sedasi · ventilasi protektif · target metabolik ketat · antibiotik bila perlu",
    pearls: [
      "Target ketat: PaO₂ 60–105 mmHg · PaCO₂ 35–45 mmHg · glukosa 70–180 mg/dL · MAP ≥ 65 mmHg.",
      "Hindari hipoglikemia (< 70) DAN hiperglikemia (> 180) — keduanya memperburuk outcome neurologis.",
      "Elektrolit: pertahankan K 3,5–5,0 mEq/L. Cegah hipernatremia (TTM dapat menyebabkan natriuresis).",
      "Pertimbangkan antibiotik empiris bila ada tanda infeksi atau aspirasi.",
    ],
  },
  // [7] Box 8 — Kontrol suhu (TTM)
  {
    kind: "action",
    title: "Strategi kontrol suhu / TTM (Box 8)",
    sub: "Target 32–37,5°C · mulai sesegera mungkin · pertahankan 24 jam minimum",
    pearls: [
      "AHA 2025: TTM diindikasikan bila pasien tidak mengikuti perintah setelah ROSC.",
      "Target suhu: 32°C–37,5°C. Cegah demam (≥ 37,7°C) setidaknya 72 jam pasca-ROSC.",
      "Metode: selimut pendingin eksternal, kateter pendingin intravaskular, es / kantong es.",
      "Pantau suhu inti secara kontinyu: probe esofageal, kateter urin bersuhu.",
      "PERKI 2021: pasien koma → TTM 32–36°C selama 24 jam. AHA 2025 memperluas target hingga 37,5°C.",
    ],
  },
  // [8] Box 9 — EEG
  {
    kind: "action",
    title: "EEG — evaluasi seizure (Box 9)",
    sub: "EEG untuk pasien yang tidak mengikuti perintah · cari status epileptikus nonkonvulsif",
    pearls: [
      "Status epileptikus nonkonvulsif (NCSE) terjadi pada 10–30% pasien koma pasca-ROSC.",
      "NCSE memperburuk cedera otak sekunder — harus dideteksi dan diterapi segera.",
      "EEG kontinyu lebih sensitif dari EEG rutin. Bila tidak tersedia: EEG standar 20–30 menit.",
      "Terapi seizure: levetiracetam atau valproat IV lini pertama; fenobarbital atau propofol untuk refrakter.",
    ],
  },
  // [9] Box 10 — Angiografi koroner (bila tepat)
  {
    kind: "action",
    title: "Angiografi koroner (Box 10 & 13)",
    sub: "Bila ada indikasi: STEMI · syok · aritmia ventrikel refrakter · iskemia berat",
    pearls: [
      "Tidak semua pasien post-ROSC perlu angiografi emergensi — seleksi berdasarkan EKG dan klinis.",
      "Pasien tanpa STEMI dan tanpa syok kardiogenik: angiografi dapat ditunda (elektif) setelah stabilisasi neurologis.",
      "MCS (IABP/Impella/ECMO-VA) dapat dijadikan jembatan ke angiografi pada syok berat.",
    ],
  },
  // [10] Box 12 — Perawatan kritis (untuk yang follows commands)
  {
    kind: "action",
    title: "Perawatan kritis — pasien responsif (Box 12)",
    sub: "Monitoring ketat · target metabolik · cari etiologi · rehabilitasi dini",
    pearls: [
      "Meski mengikuti perintah, pasien tetap berisiko deteriorasi — monitoring ICU 24–48 jam minimal.",
      "Target metabolik tetap sama: MAP ≥ 65, SpO₂ 90–98%, glukosa 70–180.",
      "Mulai mobilisasi dan rehabilitasi dini bila hemodinamik stabil.",
    ],
  },
  // [11] Box 11 — Prognostikasi
  {
    kind: "action",
    title: "Prognostikasi multimodal (Box 11)",
    sub: "Tunda ≥ 72 jam dari ROSC atau setelah normotermia · pendekatan multimodal",
    pearls: [
      "AHA 2025: jangan prognostikasi terlalu dini — sedasi dan TTM dapat menutupi tanda neurologis.",
      "Waktu prognostikasi: ≥ 72 jam dari ROSC ATAU ≥ 72 jam setelah mencapai normotermia (mana yang lebih lama).",
      "Modalitas: pemeriksaan neurologis · EEG · SSEP (Somatosensory Evoked Potentials) · CT/MRI otak · biomarker (NSE, S100B).",
      "Keputusan withdrawing/withholding therapy: butuh konsensus tim multidisiplin + keluarga.",
    ],
  },
];

/* ------------------------------------------------------------
   OVERDOSIS OPIOID — Keadaan Khusus (AHA 2025 Part 10)
   ------------------------------------------------------------ */
export const ACLS_FLOW_OPIOID: FlowStep[] = [
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
export const ACLS_FLOW_ANAPHYLAXIS: FlowStep[] = [
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
export const ACLS_FLOW_PREGNANCY: FlowStep[] = [
  // [0] Box 1 — Mulai BLS/ALS
  {
    kind: "action",
    title: "Mulai BLS/ALS segera (Box 1)",
    sub: "RJP berkualitas tinggi · LUD manual terus-menerus · AED/defibrilasi sesuai indikasi",
    pearls: [
      "LUD (Left Uterine Displacement): geser uterus ke kiri secara manual selama RJP bila fundus ≥ umbilikus — mengurangi kompresi aortocaval.",
      "Meja CPR tetap DATAR — jangan miringkan ibu. LUD manual lebih efektif dari posisi miring.",
      "Defibrilasi TIDAK kontraindikasi pada kehamilan — arus ke fetus minimal. Lepas monitor EFM sebelum shock.",
      "Dosis obat ACLS (epinefrin, amiodarone) tidak diubah pada kehamilan.",
    ],
  },
  // [1] Box 2 — Aktifkan tim + tentukan konteks
  {
    kind: "action",
    title: "Aktifkan tim henti jantung kehamilan (Box 2)",
    sub: "Panggil: anestesi · obstetri · neonatologi · ICU · farmasi",
    pearls: [
      "Tandai waktu henti jantung — target RCD (Resusitasi Caesar Darurat) ≤ 5 menit dari henti jantung.",
      "Cari & atasi etiologi arrest (lihat mnemonic A–H di bawah).",
    ],
  },
  // [2] Etiologi khas kehamilan — mnemonic A-H
  {
    kind: "note",
    title: "Etiologi Henti Jantung Kehamilan (A–H)",
    sub: "Anesthetic · Bleeding · Cardiovascular · Drugs · Embolic · Fever · General H&T · Hypertension",
    pearls: [
      "A — Anesthetic complications: blok tinggi, toksisitas LA (LAST) → lipid emulsion 20%.",
      "B — Bleeding: koagulopati, solusio, ruptur uterus → massive transfusion protocol (MTP).",
      "C — Cardiovascular: kardiomiopati peripartum, diseksi aorta, infark miokard.",
      "D — Drugs: magnesium toksik, oksitosin, opioid, dinoproston.",
      "E — Embolic: emboli cairan amnion (AFE) atau emboli paru → MTP jika AFE.",
      "F — Fever: sepsis (korioamnionitis, endometritis) → antibiotik segera.",
      "G — General H's & T's: penyebab reversibel umum (hipoksia, hipo/hiperkalemia, tamponade, dll).",
      "H — Hypertension: preeklampsia berat, eklampsia → MgSO4 STOP + kalsium glukonat.",
    ],
  },
  // [3] Box 2a — Jika henti saat KEHAMILAN (bukan saat persalinan)
  {
    kind: "action",
    title: "Optimasi resusitasi saat kehamilan (Box 3)",
    sub: "Airway dini · IV di atas diafragma · stop MgSO₄ + beri kalsium · lepas monitor EFM",
    pearls: [
      "Akses IV/IO: pilih vena di ATAS diafragma (antekubital, sentral atas) — uterus besar menekan vena cava inferior.",
      "Jika sedang infus MgSO₄: HENTIKAN segera, berikan kalsium glukonat 1 g IV (antagonis Mg).",
      "Lepas semua monitor EFM (cardiotocograph) — tidak ada manfaat saat henti jantung, mengganggu tim.",
      "Aktifkan MTP jika dicurigai emboli cairan amnion (AFE): koagulopati berat, bronkospasme, sianosis mendadak saat persalinan.",
      "Airway: intubasi lebih sulit pada kehamilan (edema, jarak mulut-glotis pendek) — gunakan ETT 0,5–1 ukuran lebih kecil, preoksigenasi adekuat.",
    ],
  },
  // [4] Box 4 — Decision: ROSC dalam 4–5 menit?
  {
    kind: "decision",
    title: "ROSC tercapai dalam 4–5 menit?",
    q: "Sirkulasi spontan kembali sebelum batas waktu RCD?",
    yes: { label: "Ya — lanjut perawatan maternal-fetal", tint: "var(--success)", targetIndex: 8 },
    no:  { label: "Tidak — siapkan RCD segera", tint: "var(--danger)", targetIndex: 5 },
  },
  // [5] Box 6 — Persiapan RCD (jika saat persalinan, langsung ke sini)
  {
    kind: "action",
    title: "Persiapan Resusitasi Caesar Darurat / RCD (Box 6)",
    sub: "Target insisi ≤ 5 menit dari henti jantung · dapat dilakukan di IGD/ICU bila perlu",
    pearls: [
      "RCD adalah intervensi RESUSITASI IBU — bukan semata untuk menyelamatkan bayi.",
      "Mengeluarkan uterus mengurangi kompresi aortocaval → meningkatkan cardiac output → meningkatkan keberhasilan RJP.",
      "Tidak perlu menunggu OK/kamar operasi — lakukan di tempat (IGD, ICU) bila kondisi kritis.",
      "Fundus ≥ umbilikus: indikasi RCD. Fundus < umbilikus: RCD tidak membantu secara hemodinamik.",
    ],
  },
  // [6] Box 5 — Lanjut ALS selama persiapan RCD
  {
    kind: "action",
    title: "Lanjut ALS selama persiapan RCD (Box 5)",
    sub: "RJP tidak berhenti · epinefrin sesuai protokol · defibrilasi sesuai indikasi",
    pearls: "RJP dan ALS harus terus berjalan paralel dengan persiapan RCD — jangan ada interupsi untuk prosedur.",
  },
  // [7] Box 7 — Resusitasi neonatus
  {
    kind: "outcome",
    title: "Resusitasi neonatus (Box 7)",
    sub: "Gunakan Algoritma Resusitasi Neonatus · panggil neonatologi",
    pearls: [
      "Tim neonatologi harus sudah hadir sebelum RCD dilakukan.",
      "Neonatus pasca-RCD berisiko asfiksia — perlu resusitasi neonatus lengkap.",
      "Prognosis neonatus tergantung usia gestasi, durasi henti jantung ibu, dan kecepatan RCD.",
    ],
  },
  // [8] Pasca-ROSC — perawatan maternal-fetal
  {
    kind: "outcome",
    title: "Pasca-ROSC — Perawatan ICU perinatal",
    sub: "Monitor fetal · TTM 32–37,5°C aman pada kehamilan · konsul multidisiplin",
    pearls: [
      "TTM (32–37,5°C) dapat diterapkan pada ibu hamil pasca-ROSC — pantau kesejahteraan fetal secara ketat.",
      "Target: MAP ≥ 65 mmHg · SpO₂ 90–98% · PaCO₂ 35–45 mmHg · glukosa 70–180 mg/dL.",
      "Konsultasi wajib: kardiologi, obstetri, neonatologi, anestesi, ICU.",
      "Jika RCD sudah dilakukan: lanjut perawatan neonatus paralel dengan perawatan ibu.",
    ],
  },
];

/* ------------------------------------------------------------
   TENGGELAM (Drowning) — AHA 2025 Part 10
   ------------------------------------------------------------ */
export const ACLS_FLOW_DROWNING: FlowStep[] = [
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
export const ACLS_FLOW_HYPOTHERMIA: FlowStep[] = [
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
export const ACLS_DRUGS: Drug[] = [
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
export const ACLS_RHYTHMS: Rhythm[] = [
  /* ── NSR — referensi normal ── */
  {
    key: "nsr",
    name: "Normal Sinus Rhythm",
    short: "NSR",
    severity: "normal",
    tint: "var(--success)",
    imageFile: "nsr.jpg",
    imageCredit: "LITFL · CC BY-NC-SA",
    features: "Laju 60–100 bpm · P sebelum setiap QRS · PR 120–200ms · QRS <120ms · irama regular.",
    action: "Tidak diperlukan intervensi. Pertahankan kondisi fisiologis normal.",

    definition: "Normal Sinus Rhythm (NSR) adalah irama jantung normal dimana impuls listrik berasal dari SA Node, menyebar melalui sistem konduksi His-Purkinje secara teratur, menghasilkan koordinasi kontraksi atrium dan ventrikel yang optimal. NSR merupakan standar referensi untuk interpretasi semua irama EKG.",

    conductionSystem: [
      { name: "SA Node", location: "Atrium kanan atas dekat SVC", rate: "60–100 bpm", role: "Pacemaker dominan — inisiasi impuls listrik jantung", current: "Funny current (If)" },
      { name: "AV Node", location: "Segitiga Koch, septum interatrial", rate: "40–60 bpm", role: "Delay konduksi 120–200ms — memastikan pengisian ventrikel sebelum kontraksi", current: "Gating Ca2+ channel" },
      { name: "Bundle of His", location: "Septum interventrikular atas", rate: "40–60 bpm", role: "Satu-satunya jalur konduksi atrium ke ventrikel (kecuali jalur aksesori)" },
      { name: "Bundle Branch (L+R)", location: "Septum interventrikular", rate: "20–40 bpm", role: "Distribusi ke ventrikel kiri (3 fasikulus) dan kanan" },
      { name: "Serat Purkinje", location: "Subendokardium ventrikel", rate: "15–40 bpm", role: "Aktivasi miokard ventrikel — konduksi tercepat (4 m/s)" },
    ],

    waveCorrelations: [
      { wave: "Gel. P", event: "Depolarisasi atrium", duration: "80–100 ms", normal: "Upright di I, II; inverted di aVR; amplitudo <2.5mm; durasi <120ms" },
      { wave: "Segmen PR", event: "Delay konduksi AV Node", duration: "120–200 ms", normal: "Isoelektrik; memanjang = AV block; memendek = pre-excitation (WPW)" },
      { wave: "Kompleks QRS", event: "Depolarisasi ventrikel", duration: "<120 ms", normal: "Positif di I, II, V5-V6; negatif di aVR, V1; Q kecil di lateral normal" },
      { wave: "Segmen ST", event: "Plateau depolarisasi (fase 2)", duration: "Isoelektrik", normal: "±1mm dari isoelektrik; elevasi/depresi >1mm = patologi" },
      { wave: "Gel. T", event: "Repolarisasi ventrikel", duration: "Asimetrik", normal: "Upright di I, II, V3-V6; amplitudo <5mm (limb), <10mm (precordial)" },
      { wave: "Interval QT", event: "Total sistol ventrikel", duration: "<440ms pria / <460ms wanita", normal: "QTc >500ms = risiko TdP tinggi; koreksi Bazett: QTc = QT/√RR" },
      { wave: "Gel. U", event: "Repolarisasi serat Purkinje", duration: "Kecil, setelah T", normal: "Prominent U wave = hipokalemia, bradikardi" },
    ],

    morphology: {
      rate: "60–100 bpm",
      rhythm: "Regular — variasi P-P interval <160ms",
      pWave: "Positif di I dan II; negatif di aVR; morfologi konstan; satu P sebelum setiap QRS",
      prInterval: "120–200ms (3–5 kotak kecil); konstan beat-to-beat",
      qrsDuration: "<120ms (<3 kotak kecil); sempit; positif di I, II, V5-V6",
      stSegment: "Isoelektrik ±1mm",
      tWave: "Upright di I, II, V3-V6; asimetrik (naik lambat, turun cepat)",
      qtInterval: "QTc <440ms (pria), <460ms (wanita)",
      axis: "Normal axis: 0° hingga +90°",
    },

    criteria: [
      "Laju 60–100 bpm pada orang dewasa",
      "Irama regular (variasi P-P <160ms)",
      "Gelombang P ada sebelum setiap QRS dengan rasio 1:1",
      "Morfologi P normal: bulat, upright di lead I dan II, inverted di aVR",
      "Axis P normal: 0° hingga +75°",
      "PR interval 120–200ms dan konstan pada setiap beat",
      "QRS duration <120ms, positif di I, II, V5-V6",
    ],

    ddx: [
      "Sinus Takikardi (NSR dengan HR >100 — bukan patologi irama)",
      "Sinus Bradikardi (NSR dengan HR <60 — atlet normal)",
      "Sinus Aritmia (variasi P-P siklik dengan respirasi — normal pada anak/dewasa muda)",
      "Ectopic Atrial Rhythm (morfologi P berbeda dari sinus)",
      "Junctional Rhythm (P retrograde atau tidak ada, HR 40–60)",
    ],

    management: {
      immediate: ["Tidak diperlukan intervensi pada NSR murni"],
      notes: [
        "NSR adalah target akhir semua tindakan resusitasi irama",
        "Konfirmasi NSR pasca-kardioversi atau pasca-ROSC sebelum declare stabil",
        "NSR dengan PR >200ms = first-degree AV block (bukan NSR murni)",
        "NSR dengan QRS >120ms = bundle branch block (perlu evaluasi)",
        "Laju <60 pada atlet muda = normal fisiologis (vagal tone tinggi)",
      ],
    },

    pitfalls: [
      "JANGAN anggap NSR = pasien aman — PEA adalah irama 'normal' tanpa nadi",
      "Selalu konfirmasi nadi saat melihat irama teratur di monitor",
      "NSR dengan ST elevasi = STEMI — irama normal bukan jaminan tidak ada infark",
      "Rate 60–100 pada pasien sepsis/trauma mungkin relatif bradikardi",
    ],

    references: [
      { text: "Hampton J, Adlam D. The ECG Made Practical 7e. Elsevier, 2019" },
      { text: "Surawicz B, Knilans T. Chou's Electrocardiography in Clinical Practice 6e. Elsevier, 2008" },
      { text: "Rawshani A. Clinical ECG Interpretation. ECGwaves.com, 2025" },
      { text: "LITFL ECG Library — Normal Sinus Rhythm. litfl.com, 2024", url: "https://litfl.com/normal-sinus-rhythm-ecg-library/" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "Pérez-Riera AR et al. Cardiac Conduction Diseases Review. PMC11395937, 2024" },
    ],
  },

  /* ── Ritme yang sudah ada ── */
  {
    key: "vf", name: "Fibrilasi Ventrikel", short: "VF",
    severity: "shockable", tint: "var(--danger)",
    imageFile: "vf.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Tidak ada QRS jelas · gelombang chaotic · amplitudo bervariasi.",
    action: "DEFIBRILASI segera (bifasik 200 J) · RJP · Epinefrin · Amiodaron.",
    definition: "Fibrilasi Ventrikel adalah aritmia fatal dimana aktivitas listrik ventrikel menjadi kacau dan tidak terkoordinasi (chaotic), menyebabkan ventrikel bergetar (quiver) tanpa menghasilkan curah jantung yang efektif. VF adalah penyebab utama kematian mendadak pada penyakit jantung koroner.",
    mechanism: "Multiple wavelet reentry atau mother rotor mechanism menghasilkan depolarisasi ventrikel acak 150–500 kali/menit. Tidak ada kontraksi terkoordinasi → cardiac output = 0. Amplitudo VF menurun seiring waktu (coarse → fine VF) akibat deplesi energi miokard.",
    morphology: {
      rate: "150–500 bpm (tidak terukur)",
      rhythm: "Ireguler total — tidak ada pola",
      pWave: "Tidak ada",
      prInterval: "Tidak teridentifikasi",
      qrsDuration: "Tidak ada QRS yang jelas",
      stT: "Tidak ada — defleksi chaotic amplitudo bervariasi",
    },
    criteria: [
      "Defleksi chaotic ireguler amplitudo bervariasi",
      "Tidak ada gelombang P, QRS, atau T yang dapat diidentifikasi",
      "Laju 150–500/menit",
      "Amplitudo menurun seiring durasi (coarse → fine → asistol)",
    ],
    ddx: [
      "Fine VF vs Asistol (konfirmasi 2 lead, cek gain, cek koneksi)",
      "Artefak gerak (pasien bergerak/tremor)",
      "TdP (polimorfik tapi masih ada QRS)",
    ],
    management: {
      immediate: [
        "Defibrilasi bifasik 200J SEGERA (minimize hands-off time)",
        "RJP berkualitas tinggi 2 menit pasca-shock",
        "Epinefrin 1mg IV/IO setiap 3–5 menit (setelah shock ke-2)",
        "Amiodaron 300mg IV/IO (setelah shock ke-3) atau Lidokain 1–1.5mg/kgBB",
      ],
      drugs: [
        "Epinefrin 1mg IV/IO q3–5 menit",
        "Amiodaron 300mg IV bolus → 150mg jika VF persisten",
        "Lidokain 1–1.5mg/kg IV (alternatif amiodaron)",
      ],
      notes: [
        "JANGAN pause RJP >10 detik untuk apapun",
        "Defibrilasi adalah prioritas #1 — setiap menit tanpa shock menurunkan survival 10%",
        "Cari dan koreksi penyebab reversibel (Hs & Ts)",
      ],
    },
    pitfalls: [
      "Jangan diagnosis VF dari 12-lead ECG saja — konfirmasi di rhythm strip",
      "Fine VF bisa terlihat seperti asistol — naikkan gain, cek 2 lead",
      "Jangan hentikan RJP untuk interpretasi EKG yang lama",
    ],
    references: [
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "Zipes DP et al. ACC/AHA/ESC Guidelines for VT/VF. JACC, 2006" },
      { text: "LITFL — Ventricular Fibrillation. litfl.com, 2024" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "vt", name: "Takikardi Ventrikel Monomorfik", short: "VT",
    severity: "shockable", tint: "var(--danger)",
    imageFile: "vt.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "QRS lebar > 0,12 detik · regular · laju 150–250.",
    action: "Tanpa nadi → defibrilasi. Stabil → amiodaron. Tidak stabil → kardioversi tersinkron.",
    definition: "VT monomorfik adalah takiaritmia ventrikel dengan QRS lebar (≥120ms) dan morfologi QRS yang konsisten beat-to-beat, laju 100–250 bpm. Merupakan aritmia ventrikel paling sering yang memerlukan penanganan emergensi; dapat dengan atau tanpa nadi.",
    mechanism: "Reentry circuit di jaringan miokard yang terparut (post-infark paling sering, juga kardiomiopati, ARVC, miokarditis). Morfologi QRS konstan mencerminkan satu fokus atau sirkuit reentry yang stabil. Mekanisme lain: triggered activity dan automatisitas abnormal akibat obat proaritmik atau elektrolit.",
    morphology: {
      rate: "100–250 bpm",
      rhythm: "Regular — interval R-R konstan",
      pWave: "AV dissociation — P berjalan independen dari QRS (patognomonik VT)",
      prInterval: "Tidak berlaku — P dan QRS tidak terkait",
      qrsDuration: "≥120ms — QRS lebar, morfologi konstan setiap beat",
      stT: "Diskordant dari QRS — T wave berlawanan arah dari defleksi QRS utama",
    },
    criteria: [
      "QRS ≥120ms dengan morfologi konstan setiap beat",
      "Laju 100–250 bpm, irama regular",
      "AV dissociation (atria dan ventrikel berdenyut independen)",
      "Capture beats atau fusion beats (patognomonik VT)",
      "Kriteria Brugada: tidak ada RS di prekordial, RS ≥100ms, AV dissociation, morfologi VT di V1 dan V6",
      "Kriteria Vereckei: aVR negatif, onset QRS ireguler, Vi/Vt ≤1",
    ],
    ddx: [
      "SVT dengan aberrasi (RBBB/LBBB pre-existing — AV association ada, P sebelum QRS)",
      "SVT dengan konduksi antidromik via jalur aksesori (WPW antidromic)",
      "Artefak — konfirmasi dengan cek nadi dan status klinis pasien segera",
    ],
    management: {
      immediate: [
        "Tanpa nadi → defibrilasi unsynchronized 200J bifasik segera (sama seperti VF)",
        "Ada nadi + tidak stabil (hipotensi, angina, penurunan kesadaran) → kardioversi tersinkron 100J",
        "Ada nadi + stabil hemodinamik → amiodaron 150mg IV selama 10 menit, lanjut infus 1mg/menit",
        "Cari dan koreksi penyebab: iskemia, elektrolit, obat proaritmik",
      ],
      drugs: [
        "Amiodaron 150mg IV bolus selama 10 menit → infus 1mg/menit 6 jam → 0.5mg/menit 18 jam",
        "Lidokain 1–1.5mg/kg IV bolus (alternatif di iskemia akut)",
        "Prokainamid 17mg/kg IV infus lambat (kontraindikasi jika QT memanjang)",
      ],
      notes: [
        "QRS lebar + takikardi = VT sampai terbukti sebaliknya — jangan berikan adenosin/verapamil empiris",
        "VT monomorfik stabil dengan kardiomiopati: evaluasi elektrofisiologi + ablasi kateter setelah stabilisasi",
        "Jika ragu antara VT dan SVT aberan: tangani sebagai VT (lebih aman)",
      ],
    },
    pitfalls: [
      "JANGAN berikan adenosin, verapamil, atau diltiazem — dapat menyebabkan kolaps hemodinamik di VT",
      "QRS lebar ≠ SVT dengan aberrasi — VT jauh lebih sering (>80% takiaritmia QRS lebar = VT)",
      "Kardioversi harus TERSINKRON jika ada nadi — unsynchronized berisiko R-on-T → VF",
      "Pasien sadar dengan VT stabil tetap perlu sedasi sebelum kardioversi",
    ],
    references: [
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "Brugada P et al. A new approach to differential diagnosis of regular tachycardia with wide QRS complex. Circulation, 1991;83(5):1649-1659" },
      { text: "Vereckei A et al. New algorithm using only lead aVR for differential diagnosis of wide QRS tachycardia. Heart Rhythm, 2008;5(1):89-98" },
      { text: "LITFL — Ventricular Tachycardia. litfl.com, 2024" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "torsades", name: "Torsade de Pointes", short: "TdP",
    severity: "shockable", tint: "var(--danger)",
    imageFile: "torsades.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "VT polimorfik · sumbu berputar (twisting) · QT memanjang prekursor.",
    action: "Mg 1–2 g IV · defibrilasi bila tanpa nadi · koreksi K/Mg · stop obat pemanjang QT.",
    definition: "Torsade de Pointes (TdP) adalah bentuk VT polimorfik khas yang terjadi pada background pemanjangan interval QT, ditandai sumbu QRS yang berputar (twisting) secara progresif di sekitar garis isoelektrik. Pertama dideskripsikan Dessertenne (1966): 'twisting of the points.' TdP sering self-terminating namun dapat berdegenerasi menjadi VF.",
    mechanism: "Early afterdepolarizations (EADs) akibat pemanjangan fase 3 repolarisasi pada kondisi QT panjang memicu triggered activity. Pola inisiasi khas 'short-long-short' cycle length. Penyebab acquired: obat-obatan (azitromisin, haloperidol, metadon, kloroquin), hipokalemia, hipomagnesia. Penyebab kongenital: Long QT Syndrome (LQTS) tipe 1-3.",
    morphology: {
      rate: "150–300 bpm, ireguler",
      rhythm: "Polimorfik ireguler — twisting axis sekitar garis isoelektrik",
      pWave: "Tidak dapat diidentifikasi selama episode TdP",
      prInterval: "Tidak berlaku selama episode — QT memanjang (>500ms) terlihat di beat sinus sebelumnya",
      qrsDuration: "Lebar, berubah morfologi secara siklik (twisting amplitudo dan arah)",
      stT: "Pra-onset: QTc memanjang dengan T-U abnormal; selama TdP: defleksi polimorfik twisting",
    },
    criteria: [
      "QT/QTc memanjang (>500ms) pada beat sinus sebelum onset",
      "VT polimorfik dengan sumbu berputar progressif (twisting of the points)",
      "Amplitudo QRS berfluktuasi seiring twisting axis",
      "Sering diinisiasi oleh pola 'short-long-short' RR interval",
      "Sering self-terminating (5–20 detik), dapat rekuren atau berdegenerasi ke VF",
    ],
    ddx: [
      "VF (tidak ada pola twisting, lebih chaotic, tidak ada QRS yang dikenali)",
      "VT polimorfik tanpa QT panjang (iskemia akut, Brugada, CPVT — konteks klinis berbeda)",
      "Artefak EKG (cek monitor, pergerakan pasien)",
    ],
    management: {
      immediate: [
        "Tanpa nadi → defibrilasi unsynchronized 200J segera",
        "Ada nadi: MgSO4 2g (20mL larutan 10%) IV bolus selama 15 menit → infus 1–2g/jam",
        "Koreksi elektrolit agresif: target K+ >4.5 mEq/L, Mg2+ >2 mEq/L",
        "Hentikan SEMUA obat pemanjang QT segera",
        "Tingkatkan laju jantung untuk memendekkan QT: isoproterenol infus 2–10 mcg/menit ATAU overdrive pacing 90–100 bpm",
      ],
      drugs: [
        "MgSO4 2g IV bolus 15 menit → infus 1–2g/jam (lini pertama acquired TdP)",
        "KCl IV: koreksi hipokalemia agresif (target K+ >4.5 mEq/L)",
        "Isoproterenol 2–10 mcg/menit IV infus (acquired TdP dengan bradikardi — kontraindikasi di LQTS kongenital)",
      ],
      notes: [
        "JANGAN amiodaron, prokainamid, sotalol, kloroquin, haloperidol — memperburuk QT",
        "Acquired TdP: singkirkan obat pemicu, koreksi elektrolit, tingkatkan HR dengan isoproterenol/pacing",
        "LQTS kongenital: konsul EP kardiologi, pertimbangkan ICD, hindari isoproterenol",
        "Selalu ukur QTc sebelum memberikan obat baru di pasien ICU/HCU",
      ],
    },
    pitfalls: [
      "Amiodaron KONTRAINDIKASI di TdP (memanjangkan QT lebih jauh)",
      "Jangan beri prokainamid, kloroquin, haloperidol, azitromisin pada QT sudah panjang",
      "TdP sering self-terminating — jangan abaikan, dapat rekuren dan degenerasi ke VF",
      "Hipomagnesemia berat dapat terjadi tanpa perubahan kadar Mg serum (Mg intraselular depleted)",
    ],
    references: [
      { text: "ESC 2022 Guidelines for Management of Ventricular Arrhythmias and SCD. Eur Heart J, 2022" },
      { text: "Dessertenne F. La tachycardie ventriculaire à deux foyers opposés variables. Arch Mal Coeur Vaiss, 1966;59:263-272" },
      { text: "LITFL — Torsades de Pointes. litfl.com, 2024" },
      { text: "Al-Khatib SM et al. AHA/ACC/HRS Guideline for Management of VT/VF. Circulation, 2018" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "svt", name: "Supraventricular Tachycardia", short: "SVT",
    severity: "stable", tint: "var(--warning)",
    imageFile: "svt.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "QRS sempit < 0,12 dtk · regular · laju 150–250 · gelombang P tersembunyi.",
    action: "Manuver vagal → adenosin 6/12 mg → CCB (verapamil/diltiazem) atau β-blocker.",
    definition: "SVT dalam konteks klinis emergensi merujuk pada AVNRT (AV Nodal Reentrant Tachycardia, 60% kasus) dan AVRT (AV Reentrant Tachycardia, 30%). Merupakan takiaritmia QRS sempit dengan mekanisme reentry yang melibatkan AV node ± jalur aksesori, onset dan offset mendadak (paroxysmal), laju 150–250 bpm.",
    mechanism: "AVNRT: reentry di dalam atau sekitar AV node menggunakan dua jalur konduksi berbeda kecepatan (fast dan slow pathway). AVRT: reentry melibatkan jalur aksesori (bundle of Kent). Biasanya diinisiasi oleh PAC atau PVC yang jatuh saat AV node dalam periode refraktori relatif → sirkuit reentry terbentuk.",
    morphology: {
      rate: "150–250 bpm",
      rhythm: "Regular — sangat reguler (interval R-R konstan)",
      pWave: "Tersembunyi di dalam QRS (AVNRT) atau retrograde segera setelah QRS (AVRT) — pseudo-R' di V1 atau pseudo-S di lead inferior",
      prInterval: "Tidak terukur (P di dalam QRS) atau RP < PR (P retrograde dekat QRS)",
      qrsDuration: "<120ms — QRS sempit, morfologi normal (kecuali aberrasi atau WPW antidromik)",
      stT: "Sering normal; ST depresi ringan mungkin ada saat takikardi (demand ischemia)",
    },
    criteria: [
      "Laju 150–250 bpm, onset dan offset mendadak (paroxysmal)",
      "QRS sempit (<120ms), irama sangat regular",
      "P wave tersembunyi (AVNRT) atau retrograde dekat setelah QRS (AVRT)",
      "Terminasi mendadak dengan adenosin atau manuver vagal (patognomonik reentry)",
    ],
    ddx: [
      "Sinus takikardi (P sebelum QRS, onset gradual, laju jarang >150, variasi dengan respirasi)",
      "Flutter atrium 2:1 (laju ~150, sawtooth di lead inferior — buka dengan karotid/adenosin)",
      "AF (ireguler, tidak ada P wave)",
      "VT dengan aberrasi (QRS lebar, AV dissociation, laju biasanya >180)",
    ],
    management: {
      immediate: [
        "Tidak stabil (hipotensi, sinkop, angina, edema paru) → kardioversi tersinkron 50–100J segera",
        "Stabil: manuver Valsalva modifikasi (supine 40mmHg 15 detik → prone 15 detik) — terminasi 43%",
        "Adenosin 6mg IV bolus cepat (1–2 detik) + flush NaCl 20mL → 12mg jika gagal → 12mg sekali lagi",
        "CCB: verapamil 5–10mg IV atau diltiazem 15–25mg IV (tidak ada CHF/hipotensi/WPW)",
      ],
      drugs: [
        "Adenosin 6mg IV cepat + flush NaCl 0.9% 20mL → 12mg → 12mg (kontraindikasi: asma, WPW-AF)",
        "Verapamil 5–10mg IV selama 2 menit (kontraindikasi: WPW, hipotensi, CHF, beta blocker IV sebelumnya)",
        "Diltiazem 15–25mg IV selama 2 menit (alternatif verapamil)",
        "Metoprolol 5mg IV q5 menit max 15mg (jika CCB kontraindikasi)",
      ],
      notes: [
        "Manuver vagal DULU sebelum obat — efektif 20–25%, tidak ada risiko",
        "Adenosin t½ sangat pendek (6–10 detik) — HARUS diberikan sangat cepat di vena antekubiti atau lebih proksimal",
        "JANGAN adenosin jika curiga WPW + AF (QRS lebar ireguler cepat) — risiko VF",
        "Setelah terminasi: EKG 12 lead untuk evaluasi delta wave (WPW), PR pendek, axis",
      ],
    },
    pitfalls: [
      "Flutter atrium 2:1 sering terlihat persis seperti SVT (HR ~150) — adenosin singkap sawtooth sementara",
      "JANGAN adenosin jika curiga WPW + AF — risiko VF fatal",
      "Verapamil KONTRAINDIKASI di SVT dengan QRS lebar yang belum dikonfirmasi bukan VT",
      "Adenosin harus diberikan cepat (1–2 detik) — injeksi lambat tidak efektif",
    ],
    references: [
      { text: "Page RL et al. ACC/AHA/HRS 2015 Guideline for SVT Management. JACC, 2016" },
      { text: "Appelboam A et al. Postural modification to standard Valsalva manoeuvre (REVERT trial). Lancet, 2015;386(10005):1747-1753" },
      { text: "LITFL — SVT. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "asys", name: "Asistol", short: "Asys",
    severity: "non-shockable", tint: "var(--info)",
    imageFile: "asys.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Flatline · konfirmasi 2 sandapan · cek koneksi & gain.",
    action: "RJP · Epinefrin 1 mg · cari Hs & Ts · JANGAN defibrilasi.",
    definition: "Asistol adalah tidak adanya aktivitas listrik jantung yang terdeteksi pada EKG, ditandai garis isoelektrik (flatline). Merupakan ritme non-shockable dengan prognosis paling buruk dari semua ritme arrest. Sering merupakan terminal rhythm dari VF fine yang tidak tertangani atau kegagalan primer sistem konduksi.",
    mechanism: "Kegagalan total automatisitas SA node, AV node, dan seluruh sistem His-Purkinje akibat hipoksia berat, asidosis, deplesi energi terminal, atau kerusakan struktural sistem konduksi. Dapat juga terjadi akibat fine VF yang tidak terdeteksi akibat gain monitor rendah.",
    morphology: {
      rate: "0 bpm — tidak ada aktivitas listrik",
      rhythm: "Tidak ada irama — garis isoelektrik flat",
      pWave: "Tidak ada",
      prInterval: "Tidak berlaku",
      qrsDuration: "Tidak ada QRS yang teridentifikasi",
      stT: "Tidak ada — konfirmasi di ≥2 lead dan cek gain monitor",
    },
    criteria: [
      "Tidak ada defleksi listrik yang bermakna di semua lead",
      "Garis isoelektrik/flatline dikonfirmasi di ≥2 lead",
      "Koneksi elektrode dikonfirmasi terpasang baik",
      "Gain monitor dikonfirmasi adekuat (tidak low gain menyembunyikan fine VF)",
      "Tidak ada nadi yang teraba",
    ],
    ddx: [
      "Fine VF (naikkan gain monitor, konfirmasi 2 lead — pola berbeda meski amplitudo kecil)",
      "Loose lead / artefak koneksi (cek pasang ulang elektrode)",
      "Low voltage QRS (obesitas, efusi perikardium, PPOK — bukan asistol sejati)",
      "P-wave asystole (ada P tapi tidak ada QRS — perlu transcutaneous pacing)",
    ],
    management: {
      immediate: [
        "RJP berkualitas tinggi segera — 100–120 kompresi/menit, kedalaman 5–6cm",
        "Epinefrin 1mg IV/IO setiap 3–5 menit",
        "Cari dan koreksi penyebab reversibel Hs & Ts secara agresif",
        "Transcutaneous pacing HANYA jika ada P wave tanpa QRS (P-wave asystole)",
        "JANGAN defibrilasi — tidak ada manfaat, dapat mencegah recovery ritme spontan",
      ],
      drugs: [
        "Epinefrin 1mg IV/IO bolus q3–5 menit (satu-satunya obat yang direkomendasikan)",
        "Atropin TIDAK direkomendasikan rutin untuk asistol (dihapus dari guideline AHA 2010)",
      ],
      notes: [
        "Konfirmasi asistol di ≥2 sandapan berbeda sebelum deklarasi",
        "Cek gain monitor — fine VF dapat tampak sebagai asistol di gain rendah",
        "Pertimbangkan menghentikan resusitasi jika tidak ada ROSC setelah 20–30 menit dengan upaya optimal dan tidak ada faktor reversibel",
        "Kecuali: hipotermia berat, overdosis obat, drowning — lanjutkan resusitasi lebih lama",
      ],
    },
    pitfalls: [
      "JANGAN defibrilasi asistol — tidak ada bukti manfaat dan dapat menghambat ROSC",
      "Fine VF bisa terlihat identik asistol — selalu naikkan gain dan cek 2 lead",
      "Loose lead adalah penyebab tersering 'false asystole' di monitor",
      "Jangan hentikan RJP berkepanjangan hanya untuk interpretasi irama",
    ],
    references: [
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
      { text: "LITFL — Asystole ECG. litfl.com, 2024" },
      { text: "Morrison LJ et al. Part 3: Ethics. AHA Guidelines for CPR. Circulation, 2010" },
    ],
  },
  {
    key: "pea", name: "Pulseless Electrical Activity", short: "PEA",
    severity: "non-shockable", tint: "var(--info)",
    imageFile: "pea.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Irama listrik teratur tanpa nadi mekanik.",
    action: "RJP · Epinefrin 1 mg · cari Hs & Ts agresif · USG bedside (RUSH).",
    definition: "PEA adalah kondisi dimana terdapat aktivitas listrik jantung yang terorganisasi pada EKG namun tanpa curah jantung yang menghasilkan nadi yang teraba. PEA bukan diagnosis irama melainkan diagnosis klinis — irama EKG dapat bervariasi. Prognosis bergantung pada kecepatan identifikasi dan koreksi penyebab.",
    mechanism: "Dekoupling elektromekanikal — impuls listrik ada namun tidak menghasilkan kontraksi mekanik yang efektif akibat: (1) preload sangat rendah (hipovolemia, tension PTX, tamponade); (2) afterload sangat tinggi (PE masif); (3) miokard tidak mampu berkontraksi (asidosis berat, hipoksia, hipotermia, obat-obatan); (4) kontraktilitas sangat rendah (infark luas, miokarditis).",
    morphology: {
      rate: "Bervariasi — tergantung irama yang ada (biasanya 30–100 bpm)",
      rhythm: "Bervariasi — dapat sinus, junctional, atau idioventricular",
      pWave: "Mungkin ada (jika irama sinus/junctional) — KUNCI: ada nadi atau tidak?",
      prInterval: "Bervariasi tergantung irama dasar",
      qrsDuration: "Sempit (supraventrikular) atau lebar (idioventricular/LBBB)",
      stT: "Bervariasi — mungkin ada perubahan ST/T tergantung penyebab (STEMI, PE)",
    },
    criteria: [
      "Aktivitas listrik jantung terorganisasi di EKG (bukan VF/asistol)",
      "Tidak ada nadi yang teraba di arteri besar (karotis, femoralis)",
      "Konfirmasi absent pulse ≤10 detik",
      "Irama bisa sempit atau lebar, cepat atau lambat",
    ],
    ddx: [
      "Pseudo-PEA: ada kontraksi lemah di USG bedside, tekanan arteri sangat rendah — tidak bisa diraba nadi",
      "Asistol dengan P-wave (konfirmasi gain monitor)",
      "VF fine (naikkan gain monitor)",
      "Severe shock dengan nadi lemah yang tidak teraba (ukur MAP invasif)",
    ],
    management: {
      immediate: [
        "RJP berkualitas tinggi segera — prioritas #1",
        "Epinefrin 1mg IV/IO setiap 3–5 menit",
        "USG bedside RUSH protocol SEGERA — identifikasi penyebab (tamponade, PTX, hipovolemia, PE)",
        "Hipovolemia → cairan bolus 30mL/kgBB NaCl 0.9%/RL cepat",
        "Tension PTX → dekompresi jarum segera (ICS 2 midklavikula atau ICS 4-5 anterior axillary line)",
        "Tamponade → perikardiosentesis",
        "PE masif → alteplase 50mg IV bolus selama RJP",
      ],
      drugs: [
        "Epinefrin 1mg IV/IO q3–5 menit",
        "NaCl 0.9% atau RL 30mL/kgBB bolus cepat (jika hipovolemia)",
        "Alteplase 50mg IV bolus (jika PE masif dikonfirmasi atau sangat dicurigai)",
      ],
      notes: [
        "PEA dengan QRS sempit dan laju normal = hampir pasti penyebab mekanik reversibel (tamponade, PTX, hipovolemia)",
        "PEA dengan QRS lebar dan laju lambat = prognosis lebih buruk (penyebab metabolik atau terminal)",
        "USG bedside adalah game-changer untuk PEA — identifikasi penyebab dalam detik",
        "Pseudo-PEA: ada kontraksi di echo → kurangi kedalaman kompresi, atasi penyebab mekanik segera",
      ],
    },
    pitfalls: [
      "Jangan fokus pada EKG — fokus pada mencari penyebab. PEA adalah diagnosis klinis bukan irama",
      "JANGAN abaikan USG bedside — tamponade dan PTX tidak terdeteksi tanpa USG/pemeriksaan fisik",
      "Pseudo-PEA: RJP penuh mungkin kontraproduktif jika ada kontraksi minimal — atasi penyebab mekanik",
      "Hipovolemia adalah penyebab PEA paling sering dan paling mudah dikoreksi",
    ],
    references: [
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "Lichtenstein DA. RUSH: Rapid Ultrasound in SHock. Chest, 2009;135(1):117-122" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
      { text: "Lavonas EJ et al. Part 10: Special Circumstances of Resuscitation. AHA Guidelines, 2015" },
    ],
  },
  {
    key: "av3", name: "AV Block Derajat 3", short: "CHB",
    severity: "unstable", tint: "var(--warning)",
    imageFile: "av3.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Disosiasi atrium & ventrikel · escape rhythm 30–40.",
    action: "Atropin sering gagal (infranodal) · pacu transkutan · dopamin/epi drip · konsul EP.",
    definition: "Complete Heart Block (CHB) / AV Block Derajat 3 adalah kondisi dimana tidak ada impuls dari atrium yang berhasil dihantarkan ke ventrikel. Atrium dan ventrikel berdenyut secara independen (disosiasi AV complete). Escape pacemaker mempertahankan sirkulasi minimal — laju dan morfologi escape bergantung pada lokasi blok.",
    mechanism: "Blok konduksi total pada AV node (nodal CHB — escape junctional 40–60 bpm, QRS sempit) atau sistem His-Purkinje (infranodal CHB — escape idioventricular 20–40 bpm, QRS lebar). Penyebab: infark inferior (blok AV nodal, biasanya reversibel), infark anterior (blok His-Purkinje, biasanya permanen), penyakit degeneratif Lev-Lenègre, obat (digitalis, beta blocker, CCB), miokarditis, post-bedah katup.",
    morphology: {
      rate: "Atrium: 60–100 bpm. Ventrikel: 20–60 bpm (escape rhythm)",
      rhythm: "Atrium regular, ventrikel regular — TIDAK ada hubungan P dengan QRS",
      pWave: "Normal morfologi, laju normal/takikardi, berjalan independen dari QRS",
      prInterval: "Bervariasi — tidak ada hubungan konstan antara P dan QRS (AV dissociation)",
      qrsDuration: "Sempit <120ms jika escape junctional (blok AV nodal); lebar ≥120ms jika escape idioventricular (blok infranodal)",
      stT: "Tergantung penyebab — mungkin ada ST elevasi (infark inferior/anterior), ST-T perubahan sesuai lead escape",
    },
    criteria: [
      "Disosiasi AV complete — P berjalan independen dari QRS",
      "Laju atrium (P-to-P) > laju ventrikel (R-to-R)",
      "Interval PP konstan, interval RR konstan, interval PR bervariasi setiap beat",
      "Escape ventrikel reguler dengan laju 20–60 bpm",
      "QRS sempit (junctional escape) atau lebar (idioventricular escape)",
    ],
    ddx: [
      "AV block derajat 2 Mobitz II (ada P yang dikonduksi dan diblok — bukan disosiasi complete)",
      "Isorhythmic AV dissociation (laju atrium ≈ laju ventrikel — bukan blok, dapat normal)",
      "Junctional rhythm dengan konduksi retrograde (P retrograde setelah QRS, bukan disosiasi)",
    ],
    management: {
      immediate: [
        "Atropin 0.5mg IV — efektif hanya untuk CHB AV nodal (infark inferior); lanjutkan ke TCP jika tidak respons",
        "Transcutaneous pacing (TCP) segera — elektrode paste, output mulai 80mA, naikkan sampai capture",
        "Dopamin 5–20 mcg/kgBB/menit IV infus (bridge ke pacing jika TCP tidak tersedia)",
        "Epinefrin 2–10 mcg/menit IV infus (alternatif dopamin)",
        "Transvenous pacing (TVP) definitif segera — konsul kardiologi intervensi",
      ],
      drugs: [
        "Atropin 0.5mg IV (efektif hanya untuk CHB AV nodal — biasanya infark inferior)",
        "Dopamin 5–20 mcg/kg/menit IV infus (chronotropic + vasopressor)",
        "Epinefrin 2–10 mcg/menit IV infus (alternatif jika dopamin tidak tersedia)",
      ],
      notes: [
        "CHB dengan infark inferior: biasanya reversibel (5–7 hari), responsif atropin — monitoring intensif, TCP jika simtomatik",
        "CHB dengan infark anterior: biasanya irreversibel, infranodal, tidak responsif atropin — TVP segera, likely permanent pacemaker",
        "Penyebab obat (beta blocker overdosis, CCB overdosis): antidot spesifik (glukagon, kalsium, lipid emulsion)",
        "Pacemaker permanen: CHB simtomatik adalah indikasi kelas I (ESC/AHA)",
      ],
    },
    pitfalls: [
      "Atropin dosis rendah (<0.5mg) dapat memperburuk CHB (refleks paradoksal) — selalu berikan minimum 0.5mg",
      "Infranodal CHB tidak responsif atropin — jangan tunda TCP menunggu respons atropin",
      "TCP tidak selalu efektif dan menyakitkan (ototomi, kebutuhan sedasi/analgesia) — siapkan TVP",
      "Jangan overlook penyebab reversibel: obat-obatan, elektrolit (hiperkalemia), iskemia akut",
    ],
    references: [
      { text: "Kusumoto FM et al. ACC/AHA/HRS 2018 Guideline on Bradycardia and Cardiac Conduction Delay. JACC, 2019" },
      { text: "Glikson M et al. ESC 2021 Guidelines on Cardiac Pacing and CRT. Eur Heart J, 2021" },
      { text: "LITFL — AV Block Third Degree. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "stemi", name: "Anterior STEMI", short: "STEMI",
    severity: "critical", tint: "var(--danger)",
    imageFile: "stemi.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "ST elevasi V1–V4 ≥ 2 mm · Q wave evolusi · resiprokal inferior.",
    action: "ASA + DAPT · antikoagulan · IKPP door-to-balloon < 90 menit.",
    definition: "Anterior STEMI adalah oklusi akut arteri koroner — umumnya LAD proksimal — menyebabkan iskemia transmural miokard ventrikel kiri anterior dan septal. Merupakan kedaruratan kardiovaskular time-critical: setiap menit keterlambatan reperfusi = jutaan kardiomiosit mati ('time is muscle').",
    mechanism: "Ruptur plak aterosklerotik di LAD menginisiasi kaskade trombosis → oklusi total → iskemia transmural. Arus cedera (injury current) menghasilkan ST elevasi. Evolusi: hiperakut T → ST elevasi → inversi T → Q wave patologis. LAD proksimal juga memperdarahi sistem konduksi → risiko VF, VT, CHB tinggi.",
    morphology: {
      rate: "Bervariasi — sinus takikardi (nyeri/stres) atau bradikardi (komplikasi konduksi)",
      rhythm: "Regular sinus kecuali komplikasi aritmia (VF, VT, CHB)",
      pWave: "Normal (kecuali ada komplikasi konduksi)",
      prInterval: "Normal 120–200ms; mungkin memanjang jika ada blok konduksi akibat LAD proksimal",
      qrsDuration: "Awalnya normal; Q wave patologis (QS pattern atau Q ≥40ms, ≥25% amplitudo R) berkembang dalam jam",
      stT: "ST elevasi konveks/coved ≥2mm di V1–V4; T hiperakut awal; resiprokal depresi ST di II, III, aVF; evolusi: ST kembali isoelektrik + T inversi",
    },
    criteria: [
      "ST elevasi ≥2mm di ≥2 lead prekordial berdekatan (V1–V4)",
      "Atau ST elevasi ≥1mm di ≥2 lead berdekatan lainnya",
      "Perubahan EKG dinamis (berkembang seiring waktu)",
      "Konteks klinis: nyeri dada tipikal, diaforesis, dispnea, elevasi biomarker (Troponin)",
      "Resiprokal: depresi ST di lead berlawanan (inferior atau lateral)",
    ],
    ddx: [
      "LBBB baru (STEMI equivalen — gunakan kriteria Sgarbossa/Smith-modified)",
      "De Winter T-wave (LAD oklusi tanpa ST elevasi klasik — STEMI equivalen)",
      "Perikarditis akut (elevasi konkaf 'saddle-shaped' di multiple lead, PR depresi, tidak ada resiprokal)",
      "Early repolarization (ST konkaf, J-point notching, stabil — tidak dinamis)",
      "Brugada (coved pattern V1-V2, tidak ada konteks klinis SKA)",
    ],
    management: {
      immediate: [
        "Aktivasi Cath Lab SEGERA — door-to-balloon <90 menit dari FMC (idealnya <60 menit)",
        "Antiplatelet ganda: ASA 300mg oral + ticagrelor 180mg oral (atau klopidogrel 600mg jika ticagrelor tidak tersedia)",
        "Antikoagulan: UFH 60–70 IU/kgBB IV bolus (max 5000 IU) → infus, atau enoksaparin 0.5mg/kgBB IV bolus",
        "O2 HANYA jika SpO2 <90% — jangan berikan rutin jika SpO2 normal",
        "Fibrinolisis jika PCI tidak tersedia dalam 120 menit dari FMC: alteplase atau streptokinase",
      ],
      drugs: [
        "Aspirin 300mg oral loading → 75–100mg/hari",
        "Ticagrelor 180mg oral loading → 90mg 2×/hari (preferred), atau klopidogrel 600mg → 75mg/hari",
        "UFH 60–70 IU/kgBB IV bolus (max 5000 IU) → infus 12–15 IU/kgBB/jam",
        "Morfin 2–4mg IV titrasi (nyeri berat — waspadai ↓absorpsi antiplatelet oral)",
      ],
      notes: [
        "Right-sided lead (V3R-V4R): deteksi RV involvement pada infark inferior (JANGAN nitrat jika RV infarct)",
        "Posterior leads (V7-V9): identifikasi STEMI posterior (depresi V1-V3 = mirror)",
        "ST elevasi di aVR + depresi difus ≥8 lead = LM atau LAD proksimal oklusi",
        "De Winter dan LBBB baru membutuhkan aktivasi Cath Lab sama cepatnya dengan STEMI klasik",
      ],
    },
    pitfalls: [
      "Jangan abaikan De Winter atau LBBB baru — bukan STEMI klasik tapi butuh PCI sama cepatnya",
      "JANGAN nitrat pada suspek infark RV — menyebabkan hipotensi refrakter berat",
      "ST elevasi aVR + depresi difus bukan inferior STEMI — curigai LM/proksimal LAD oklusi",
      "Morfin dapat mengurangi absorpsi antiplatelet oral — pertimbangkan IV antiplatelet jika tersedia",
    ],
    references: [
      { text: "Byrne RA et al. ESC 2023 Guidelines for Acute Myocardial Infarction with STEMI. Eur Heart J, 2023" },
      { text: "PERKI. Panduan Praktik Klinis Sindrom Koroner Akut, 2023" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "LITFL — ST Elevation Myocardial Infarction. litfl.com, 2024" },
    ],
  },
  {
    key: "hyperk", name: "EKG Hiperkalemia", short: "K↑",
    severity: "critical", tint: "var(--danger)",
    imageFile: "hyperk.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Peaked T → PR memanjang → QRS lebar → sine wave.",
    action: "Ca-glukonas 1 g · insulin + D5 · β-agonis · diuresis/dialisis.",
    definition: "Perubahan EKG hiperkalemia mencerminkan efek kadar kalium plasma tinggi (K+ >5.5 mEq/L) terhadap potensial membran kardiomiosit — mengganggu depolarisasi dan repolarisasi secara progresif. EKG adalah alat diagnosis bedside yang kritikal; namun kadar K+ dan perubahan EKG tidak selalu berkorelasi linier — aritmia fatal dapat terjadi bahkan dengan EKG yang 'tidak terlalu abnormal'.",
    mechanism: "Hiperkalemia mendepolarisasi parsial membran sel (potensial istirahat kurang negatif) → inaktivasi channel Na+ (konduksi melambat → QRS melebar) dan mempercepat repolarisasi fase 3 → gelombang T tinggi-sempit (peaked T). Pada K+ sangat tinggi: konduksi AV melambat, P menghilang, QRS sangat lebar → sine wave pattern → asistol atau VF.",
    morphology: {
      rate: "Normal hingga bradikardi progresif seiring kadar K+ meningkat",
      rhythm: "Sinus → ritme konduksi melambat → sine wave → asistol/VF",
      pWave: "Awalnya normal → mendatar → menghilang (K+ >7.0 mEq/L)",
      prInterval: "Memanjang progresif seiring kadar K+ meningkat",
      qrsDuration: "Melebar progresif: normal → >120ms → >160ms → sine wave (K+ >8 mEq/L)",
      stT: "Peaked T narrow-base simetris (tent-like): amplitudo >6mm limb lead, >8mm prekordial, basis sempit, simetris (berbeda dari T hiperakut STEMI yang asimetris dengan basis lebar)",
    },
    criteria: [
      "K+ ringan (5.5–6.5): peaked T wave narrow-base simetris di prekordial",
      "K+ sedang (6.5–7.5): PR memanjang, P wave mendatar/menghilang, QRS mulai melebar",
      "K+ berat (>7.5): QRS sangat lebar, P tidak ada, sine wave pattern",
      "K+ kritis (>8.5): sine wave, risiko VF, asistol, atau PEA",
      "EKG sangat bergantung pada kecepatan onset dan kadar Ca/Na serum",
    ],
    ddx: [
      "STEMI anterior/lateral (peaked T hiperakut — asimetris, basis lebar, disertai ST elevasi dan nyeri dada)",
      "Normal variant (peaked T di prekordial tanpa QRS melebar — konteks klinis normal)",
      "LBBB/RBBB (untuk pelebaran QRS — tanpa peaked T khas hiperkalemia)",
    ],
    management: {
      immediate: [
        "Kalsium glukonat 10% 10mL (1g) IV selama 2–3 menit → dapat diulang setelah 5 menit jika EKG belum membaik (stabilisasi membran — onset 1–3 menit, durasi 30–60 menit)",
        "Insulin regular 10 unit IV + Dekstrosa 40% 50mL IV (redistribusi K+ intrasel — onset 15–30 menit)",
        "Natrium bikarbonat 50 mEq IV jika asidosis metabolik berat pH <7.2",
        "Beta-2 agonis: salbutamol 10–20mg nebulisasi (redistribusi K+ — onset 30 menit)",
        "Furosemid 40–80mg IV (ekskresi renal — jika fungsi ginjal adekuat)",
        "Dialisis emergensi jika hiperkalemia berat tidak respons atau gagal ginjal berat",
      ],
      drugs: [
        "Kalsium glukonat 10% 1g IV (atau kalsium klorida 10% 0.5–1g IV — lebih poten, hindari ekstravasasi perifer)",
        "Insulin regular 10 unit IV + D40% 50mL (atau D10% 500mL dalam 1 jam)",
        "NaHCO3 50 mEq IV (jika asidosis metabolik berat)",
        "Kayexalate/patiromer oral (ekskresi GI — onset jam, jangan untuk emergensi akut)",
      ],
      notes: [
        "Kalsium bekerja dalam menit — berikan PERTAMA jika ada perubahan EKG atau K+ >7 mEq/L",
        "Insulin + dekstrosa: efek 15–60 menit, monitor glukosa setiap 30 menit (risiko hipoglikemia)",
        "Monitor EKG kontinu sampai K+ normal dan EKG kembali ke baseline",
        "Dialisis: satu-satunya terapi definitif pada gagal ginjal berat atau hiperkalemia refrakter",
      ],
    },
    pitfalls: [
      "EKG tidak berkorelasi sempurna dengan kadar K+ — VF/asistol bisa terjadi dengan EKG yang 'tidak terlalu abnormal'",
      "Jangan tunda kalsium sambil menunggu konfirmasi lab jika EKG sudah khas hiperkalemia",
      "Asidosis dan hiponatremia memperburuk toksisitas kardiak hiperkalemia",
      "Dekstrosa tanpa insulin dapat memperburuk hiperkalemia pada pasien dengan defisiensi insulin",
    ],
    references: [
      { text: "Mount DB. Fluid and Electrolyte Disturbances. NEJM, 2016;374:2261-2272" },
      { text: "Rossignol P et al. ESC Scientific Document on Hyperkalemia Management. Eur Heart J, 2020" },
      { text: "LITFL — Hyperkalaemia ECG Changes. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },

  /* Ritme tambahan — AHA 2025 / ESC 2023 */
  {
    key: "af", name: "Fibrilasi Atrium", short: "AF",
    severity: "stable", tint: "var(--warning)",
    imageFile: "af.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Irama tidak regular (irregularly irregular) · tidak ada gelombang P yang jelas · garis isoelektrik bergetar (f-wave) · QRS sempit (kecuali aberansi).",
    action: "Kontrol laju: diltiazem/verapamil/β-blocker atau digoksin (CHF). Kontrol irama: kardioversi tersinkron bila tidak stabil. Antikoagulasi: CHADS₂-VASc ≥ 2 → DOAC.",
    definition: "Fibrilasi Atrium (AF) adalah aritmia tersering secara global, ditandai aktivitas listrik atrium yang kacau (350–600/menit), tidak menghasilkan kontraksi atrium efektif. Konduksi ke ventrikel melalui AV node bersifat ireguler → irama ventrikel 'irregularly irregular'. Risiko utama: stroke tromboemboli (5× lebih tinggi dari populasi umum) dan gagal jantung.",
    mechanism: "Multiple wavelet reentry atau focal driver/rotor (sering di ostia vena pulmonalis) mempertahankan AF. Substrat: fibrosis atrium, dilatasi, peradangan, disfungsi autonomik. Stasis darah di atrium kiri (terutama left atrial appendage) → trombus → emboli sistemik. Dua strategi tata laksana: rate control vs rhythm control.",
    morphology: {
      rate: "Ventrikel: 100–160 bpm (tidak terkontrol); 60–100 (terkontrol). Atrium: 350–600 bpm",
      rhythm: "Irregularly irregular — khas AF; variasi R-R tanpa pola yang dapat diprediksi",
      pWave: "Tidak ada gelombang P yang jelas; baseline bergetar (f-wave, 350–600/menit, paling jelas di V1 dan lead inferior)",
      prInterval: "Tidak terukur — tidak ada P wave yang konsisten",
      qrsDuration: "Sempit <120ms (kecuali aberrasi konduksi atau WPW pre-excitation dengan QRS lebar ireguler cepat)",
      stT: "Sering normal; perubahan ST/T mungkin ada akibat demand ischemia atau penyakit penyerta",
    },
    criteria: [
      "Irama irregularly irregular (tidak ada pola keteraturan R-R)",
      "Tidak ada gelombang P yang dapat diidentifikasi",
      "Baseline bergetar (f-wave) — paling jelas di V1 dan lead inferior",
      "QRS sempit (kecuali aberrasi atau WPW)",
      "Variasi interval R-R tanpa pola",
    ],
    ddx: [
      "MAT — Multifocal Atrial Tachycardia (ada P wave ≥3 morfologi berbeda, R-R ireguler)",
      "Flutter atrium dengan konduksi variabel (ada sawtooth, R-R ireguler tapi ada periode reguler)",
      "Frequent PACs (ada P normal + P ektopik intermiten, bukan ireguler total)",
      "WPW + AF (QRS lebar ireguler sangat cepat >200 bpm — emergency kardioversi)",
    ],
    management: {
      immediate: [
        "Tidak stabil (hipotensi, ACS, gagal jantung akut) → kardioversi tersinkron 200J bifasik segera",
        "Stabil: tentukan onset (<48 jam vs ≥48 jam atau tidak diketahui)",
        "Rate control: diltiazem 15–25mg IV, atau metoprolol 5mg IV q5 menit (max 15mg), atau digoksin 0.5mg IV (CHF/hipotensi)",
        "Onset <48 jam + stabil: rhythm control — kardioversi tersinkron setelah heparinisasi",
        "Antikoagulasi: UFH IV sebelum kardioversi emergensi; DOAC jangka panjang CHADS₂VASc ≥2",
      ],
      drugs: [
        "Diltiazem 15–25mg IV selama 2 menit → infus 5–15mg/jam (rate control)",
        "Metoprolol 5mg IV q5 menit max 15mg (rate control)",
        "Digoksin 0.5mg IV → 0.25mg q6 jam (rate control pada CHF/hipotensi)",
        "UFH 5000 IU IV bolus → infus (target aPTT 60–80 detik) sebelum kardioversi",
      ],
      notes: [
        "Onset <48 jam → kardioversi dapat dilakukan tanpa antikoagulasi pra-kardioversi 3 minggu (tapi heparinisasi saat prosedur)",
        "Onset ≥48 jam atau tidak diketahui → antikoagulasi 3 minggu ATAU TEE terlebih dahulu untuk menyingkirkan trombus LAA",
        "WPW + AF = KONTRAINDIKASI diltiazem, verapamil, digoksin, adenosin → kardioversi atau prokainamid",
        "CHADS₂VASc ≥2 → DOAC (rivaroxaban, apixaban, dabigatran) — lebih baik dari warfarin kecuali kontraindikasi",
      ],
    },
    pitfalls: [
      "JANGAN adenosin, verapamil, diltiazem, digoksin di WPW+AF — risiko VF fatal",
      "WPW + AF: QRS sangat lebar, ireguler, sangat cepat (>200 bpm) → kardioversi SEGERA",
      "Rate control tidak mencegah stroke — antikoagulasi tetap diperlukan meski irama terkontrol",
      "Jangan lupa antikoagulasi sebelum kardioversi jika onset tidak jelas",
    ],
    references: [
      { text: "Joglar JA et al. ACC/AHA/ACCP/HRS 2023 Guideline for AF Diagnosis and Management. JACC, 2024" },
      { text: "Hindricks G et al. ESC 2020 Guidelines for Diagnosis and Management of AF. Eur Heart J, 2021" },
      { text: "LITFL — Atrial Fibrillation. litfl.com, 2024" },
      { text: "PERKI. Buku Panduan ACLS, 2021" },
    ],
  },
  {
    key: "flutter", name: "Flutter Atrium", short: "A-Flutter",
    severity: "stable", tint: "var(--warning)",
    imageFile: "flutter.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Gelombang gigi gergaji (sawtooth) di inferior leads (II, III, aVF) · laju atrium 250–350 · konduksi biasanya 2:1 → HR ~150 · regular.",
    action: "Tidak stabil: kardioversi tersinkron 50–100 J. Stabil: rate control (diltiazem/β-blocker). Hindari adenosin diagnostik saja (tidak terminasi).",
    definition: "Flutter atrium adalah takiaritmia atrium beraturan akibat makro-reentry circuit di atrium kanan, biasanya melingkari katup trikuspid melewati cavotricuspid isthmus (CTI-dependent/typical flutter). Laju atrium 250–350/menit (khas 300/menit). Konduksi AV 2:1 menghasilkan HR ~150 bpm. Risiko tromboemboli setara dengan AF.",
    mechanism: "Makro-reentry circuit di atrium kanan bergerak berlawanan arah jarum jam (counter-clockwise) melewati cavotricuspid isthmus (CTI) — titik perlambatan konduksi yang menjadi target ablasi. Konduksi AV menghasilkan blok fisiologis 2:1, 3:1, atau 4:1. Perubahan rasio konduksi terjadi mendadak → perubahan HR mendadak.",
    morphology: {
      rate: "Atrium 250–350 bpm (khas 300). Ventrikel: 150 bpm (konduksi 2:1), 100 (3:1), 75 (4:1)",
      rhythm: "Regular (konduksi AV konstan) atau ireguler (konduksi variabel)",
      pWave: "Sawtooth wave — gelombang gigi gergaji di lead inferior (II, III, aVF); flutter wave negatif di inferior (CCW/typical flutter), positif di V1; tidak ada isoelektrik antar gelombang",
      prInterval: "Tidak berlaku — P wave digantikan flutter waves; tidak ada garis isoelektrik di lead inferior",
      qrsDuration: "Sempit <120ms (kecuali aberrasi)",
      stT: "Sering tertutupi flutter wave yang superimpose pada ST-T",
    },
    criteria: [
      "Flutter wave (sawtooth) di lead inferior — negatif di II, III, aVF (typical CCW flutter)",
      "Flutter wave positif di V1",
      "Tidak ada isoelektrik antar flutter wave di lead inferior",
      "Laju atrium 250–350/menit, ventrikel biasanya 150 (konduksi 2:1)",
      "QRS sempit, reguler",
    ],
    ddx: [
      "SVT (laju ~150 mirip tapi tidak ada sawtooth — adenosin membuka sawtooth secara sementara)",
      "Sinus takikardi dengan laju ~150 (P sebelum QRS, onset gradual, laju biasanya <150)",
      "AF (ireguler, tidak ada sawtooth, tidak ada isoelektrik teratur)",
      "Flutter atipical (clockwise — sawtooth positif di inferior, negatif di V1)",
    ],
    management: {
      immediate: [
        "Tidak stabil → kardioversi tersinkron 50–100J bifasik (lebih mudah terminasi dari AF, energi lebih rendah)",
        "Stabil: rate control dengan diltiazem 15–25mg IV atau beta blocker",
        "Ablasi kateter CTI = terapi definitif (success rate >95%, prosedur 30–60 menit)",
        "Antikoagulasi: protokol sama dengan AF (CHADS₂VASc ≥2 → DOAC)",
      ],
      drugs: [
        "Diltiazem 15–25mg IV → infus 5–15mg/jam (rate control)",
        "Metoprolol 5mg IV q5 menit max 15mg (rate control)",
        "Ibutilide 1mg IV (rhythm control — kontraindikasi QT panjang, awasi TdP 4 jam pasca)",
      ],
      notes: [
        "Adenosin: HANYA untuk diagnostik (singkap sawtooth dengan memperlambat sementara) — BUKAN untuk terminasi",
        "Kardioversi flutter lebih mudah dan butuh energi lebih rendah dari AF",
        "Ablasi CTI: first-line untuk typical flutter (success rate >95%)",
        "Antikoagulasi tetap diperlukan — risiko stroke setara AF",
      ],
    },
    pitfalls: [
      "Flutter 2:1 sering disalah-diagnosis sebagai SVT (HR ~150, QRS sempit regular) — cari sawtooth di V1 dan lead inferior",
      "Adenosin tidak menghentikan flutter — hanya memperlambat sementara untuk visualisasi sawtooth diagnostik",
      "JANGAN verapamil jika curiga WPW (dapat konduksi aksesori sangat cepat → VF)",
      "Jangan lupakan antikoagulasi — risiko stroke setara AF",
    ],
    references: [
      { text: "Hindricks G et al. ESC 2020 Guidelines for Diagnosis and Management of AF (termasuk flutter). Eur Heart J, 2021" },
      { text: "Cosio FG. Atrial Flutter, Typical and Atypical: A Review. Arrhythm Electrophysiol Rev, 2017;6(2):55-62" },
      { text: "LITFL — Atrial Flutter. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
    ],
  },
  {
    key: "wellens", name: "Sindrom Wellens", short: "Wellens",
    severity: "critical", tint: "var(--danger)",
    imageFile: "wellens.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Tipe A: gelombang T bifasik di V2–V3 (positif lalu negatif). Tipe B: gelombang T negatif dalam di V2–V3. Terjadi saat BEBAS nyeri dada (post-angina). ST normal/minimal.",
    action: "JANGAN stress test (risiko VF) · konsul kardiologi segera · kateterisasi kritis (LAD stenosis berat hampir pasti).",
    definition: "Sindrom Wellens adalah pola perubahan gelombang T pada EKG yang menandakan stenosis kritis LAD proksimal, terjadi saat pasien bebas nyeri dada (inter-ictal/post-angina). Pertama dideskripsikan de Zwaan et al. (1982). Tanpa intervensi, 75% pasien mengalami infark anterior masif dalam minggu-minggu berikutnya.",
    mechanism: "Selama episode angina/iskemia LAD terjadi cedera transmural anterior; saat reperfusi spontan (nyeri hilang), sel miokard yang stun (stunned myocardium) atau efek memori repolarisasi menghasilkan perubahan gelombang T khas. Perubahan ini menandakan bahwa obstruksi LAD proximal signifikan masih ada dan risiko re-oklusi total sangat tinggi.",
    morphology: {
      rate: "Normal 60–100 bpm",
      rhythm: "Sinus normal",
      pWave: "Normal",
      prInterval: "Normal 120–200ms",
      qrsDuration: "Normal <120ms — TIDAK ada Q wave signifikan (penting untuk diagnosis)",
      stT: "Tipe A (25%): T bifasik positif-negatif di V2–V3 (cephalad upswing lalu reversal ke negatif). Tipe B (75%): T negatif dalam simetris di V2–V3 (deep symmetric inversion). ST isoelektrik atau elevasi minimal <1mm",
    },
    criteria: [
      "Tipe A: gelombang T bifasik (positif lalu negatif) di V2–V3",
      "Tipe B: gelombang T negatif dalam simetris di V2–V3 (deep symmetric inversion)",
      "Perubahan terjadi SAAT BEBAS NYERI atau setelah resolusi nyeri dada",
      "Tidak ada gelombang Q patologis",
      "ST isoelektrik atau elevasi minimal (<1mm)",
      "Tidak ada bundle branch block",
      "Riwayat nyeri dada sebelumnya (angina tidak stabil)",
    ],
    ddx: [
      "STEMI anterior (ada ST elevasi bermakna, nyeri aktif, dynamic changes)",
      "T inversi pasca-STEMI resolved (Q wave sudah ada, riwayat STEMI jelas)",
      "T inversi di RVH (V1-V3, tidak dalam, ada kriteria RVH lain)",
      "T inversi di Brugada (morfologi coved V1-V2 berbeda dari Wellens)",
      "Rate-dependent T changes (inversi T saat takikardi, membaik dengan normalisasi HR)",
    ],
    management: {
      immediate: [
        "RAWAT INAP segera — JANGAN discharge pasien dari IGD",
        "JANGAN stress test (exercise ECG atau farmakologis) — kontraindikasi absolut, risiko VF masif",
        "Konsul kardiologi intervensi SEGERA untuk kateterisasi jantung dan PCI terencana",
        "Antiplatelet ganda: ASA 300mg → 100mg/hari + ticagrelor 180mg → 90mg 2×/hari",
        "Antikoagulan: LMWH atau UFH sebagai bridge ke kateterisasi",
      ],
      drugs: [
        "Aspirin 300mg loading → 100mg/hari",
        "Ticagrelor 180mg loading → 90mg 2×/hari (atau klopidogrel 600mg → 75mg/hari)",
        "Enoksaparin 1mg/kgBB SC q12 jam",
        "Beta blocker: bisoprolol 2.5–5mg/hari (menurunkan demand O2 miokard)",
      ],
      notes: [
        "Pola Wellens dapat 'menghilang' saat nyeri kambuh kembali — EKG ulang wajib saat nyeri untuk dokumentasi",
        "Troponin mungkin normal atau sedikit meningkat — tidak menyingkirkan diagnosis",
        "Kateterisasi jantung: hampir selalu ditemukan stenosis LAD proximal kritis (>70%)",
        "Prognosis sangat baik jika ditangani (PCI/CABG) vs sangat buruk jika terlambat",
      ],
    },
    pitfalls: [
      "JANGAN stress test — kontraindikasi absolut, dapat memicu VF masif akibat LAD oklusi total saat exercise",
      "Tipe A sering terlewatkan karena T masih 'naik dulu' — perhatikan komponen negatif di bagian akhir gelombang T",
      "Pola Wellens hanya di V2-V3 — jangan abaikan karena tidak ada perubahan di semua lead",
      "Tidak ada gejala ≠ tidak berbahaya — 75% mengalami STEMI besar tanpa intervensi",
    ],
    references: [
      { text: "de Zwaan C et al. Characteristic electrocardiographic pattern indicating a critical stenosis high in the LAD coronary artery. Am Heart J, 1982;103(4):730-736" },
      { text: "Rhinehardt J et al. Electrocardiographic manifestations of Wellens' syndrome. Am J Emerg Med, 2002;20(7):638-643" },
      { text: "LITFL — Wellens Syndrome. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
    ],
  },
  {
    key: "dewinter", name: "De Winter T-wave", short: "De Winter",
    severity: "critical", tint: "var(--danger)",
    imageFile: "dewinter.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "ST depresi naik (upsloping) di V1–V6 + gelombang T tinggi-simetris di prekordial + ST elevasi aVR (sering) · STEMI equivalen (LAD oklusi).",
    action: "Perlakukan sebagai STEMI: ASA + DAPT + antikoagulan + IKPP emergensi < 90 menit. Jangan menunggu — tidak ada evolusi ST elevasi klasik.",
    definition: "Pola De Winter adalah STEMI equivalen yang mencerminkan oklusi LAD akut tanpa gambaran ST elevasi klasik, pertama dilaporkan de Winter et al. (NEJM, 2008). Ditemukan pada ~2% oklusi LAD akut — risiko missed diagnosis sangat tinggi karena pola ini tidak dikenal luas. Perlakukan seperti STEMI: aktivasi Cath Lab segera.",
    mechanism: "Varian distribusi arus cedera transmural anterior pada oklusi LAD akut — kemungkinan akibat perbedaan distribusi anatomis atau kanal ionik yang menyebabkan repolarisasi subendokardial mendominasi. ST depresi upsloping mencerminkan iskemia subendokardial masif; peaked T mencerminkan gradient repolarisasi yang berbeda dari STEMI klasik.",
    morphology: {
      rate: "Normal atau sinus takikardi (respons nyeri/stres)",
      rhythm: "Sinus regular",
      pWave: "Normal",
      prInterval: "Normal",
      qrsDuration: "Normal <120ms",
      stT: "ST depresi upsloping (ascending) ≥1–3mm di J-point pada V1–V6; T wave tinggi, simetris, positif (peaked) di lead yang sama; ST elevasi ≥1mm di aVR (diagnostik tambahan, sering ada); TIDAK ada ST elevasi di lead prekordial",
    },
    criteria: [
      "ST depresi upsloping (ascending) ≥1mm di J-point pada V1–V6",
      "T wave tinggi, simetris, positif (peaked) di lead V1–V6 yang sama (T tidak negatif)",
      "ST elevasi di aVR (sering — diagnostik tambahan)",
      "TIDAK ADA ST elevasi di lead prekordial (membedakan dari STEMI klasik)",
      "Klinis: presentasi ACS akut (nyeri dada, diaforesis, peningkatan Troponin)",
    ],
    ddx: [
      "Hiperkalemia (peaked T simetris — tapi konteks klinis berbeda, QRS mungkin lebar, tidak ada ST depresi upsloping khas)",
      "STEMI posterior (depresi V1-V3 — tapi T inversi; cek V7-V9 untuk konfirmasi)",
      "RV strain (depresi V1-V3 + S1Q3T3, takikardi — konteks PE)",
      "Early repolarization (T positif di V2-V4 tanpa ST depresi upsloping)",
    ],
    management: {
      immediate: [
        "Aktivasi Cath Lab SEGERA — perlakukan sebagai STEMI, target door-to-balloon <90 menit",
        "Antiplatelet ganda: ASA 300mg + ticagrelor 180mg (atau klopidogrel 600mg)",
        "Antikoagulan: UFH IV atau enoksaparin",
        "JANGAN observasi atau tunggu perubahan EKG ulang — ini adalah STEMI equivalen",
        "Fibrinolisis jika PCI tidak tersedia dalam 120 menit dari FMC",
      ],
      drugs: [
        "Aspirin 300mg oral loading → 100mg/hari",
        "Ticagrelor 180mg loading → 90mg 2×/hari",
        "UFH 60–70 IU/kgBB IV bolus (max 5000 IU)",
      ],
      notes: [
        "Pola De Winter STATIS — tidak berevolusi menjadi ST elevasi klasik (berbeda dari STEMI awal yang dinamis)",
        "Semua pasien dengan pola ini dalam registry de Winter mengalami LAD total occlusion saat kateterisasi",
        "2% dari semua oklusi LAD akut: kecil secara persentase tapi bermakna — 1 kasus terlewat = STEMI masif",
        "Edukasi staf IGD dan dokter jaga tentang pola ini sangat penting",
      ],
    },
    pitfalls: [
      "Sering missed — dokter mencari ST elevasi, tidak menemukan, mengira 'bukan STEMI'",
      "Pola statis — tidak menunggu evolusi (langsung aktivasi Cath Lab berdasarkan satu EKG)",
      "Peaked T di V1-V3 + ST depresi upsloping = De Winter sampai terbukti sebaliknya di konteks ACS",
      "Jangan berikan antasida/analgesik dan observasi — ini adalah kondisi mengancam jiwa",
    ],
    references: [
      { text: "de Winter RJ et al. A New ECG Sign of Proximal LAD Occlusion. NEJM, 2008;359(19):2071-2073" },
      { text: "Verouden NJ et al. Persistent precordial 'hyperacute' T-waves signify proximal LAD occlusion. Heart, 2009;95(20):1701-1706" },
      { text: "LITFL — De Winter T-wave. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
    ],
  },
  {
    key: "brugada", name: "Pola Brugada Tipe 1", short: "Brugada",
    severity: "critical", tint: "var(--danger)",
    imageFile: "brugada.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "ST elevasi berbentuk 'coved' (kubah) ≥ 2 mm di V1–V2 + gelombang T negatif · bukan elevasi STEMI — ST turun secara bertahap (coved pattern).",
    action: "Rujuk elektrofisiologi · ICD bila ada riwayat syncope/VF. Hindari: sodium channel blocker, CCB, β-blocker, demam tinggi. Quinidine/isoproterenol untuk VF storm.",
    definition: "Pola Brugada Tipe 1 berkaitan dengan sindrom Brugada — penyakit channelopathy ion channel (mutasi SCN5A pada ~20% kasus) yang menyebabkan risiko VF dan kematian mendadak pada jantung struktural normal. Pertama dideskripsikan Brugada bersaudara (JACC, 1992). Kejadian terutama malam hari saat vagal tone tinggi.",
    mechanism: "Mutasi SCN5A mengurangi arus natrium masuk (INa) fase 0 depolarisasi → gradien repolarisasi transmural abnormal di epikardium ventrikel kanan (fase 2 action potential lebih pendek di epikardium vs endokardium) → 'phase 2 reentry' → depolarisasi prematur → VF. Faktor pemicu: demam (↓INa lebih jauh), sodium channel blocker, makan besar (vagal tone tinggi), alkohol, bradikardia.",
    morphology: {
      rate: "Normal 60–100 bpm (aritmia terjadi episodik, terutama malam hari)",
      rhythm: "Sinus regular di antara episode VF/VT",
      pWave: "Normal (PR mungkin memanjang akibat gangguan konduksi atrium — SCN5A juga di atrium)",
      prInterval: "Normal atau memanjang (120–240ms)",
      qrsDuration: "Normal atau sedikit melebar; gambaran RBBB inkomplit mungkin ada di V1",
      stT: "COVED pattern: ST elevasi ≥2mm di V1–V2 berbentuk 'kubah' — ST naik kemudian turun secara bertahap (gradually descending) diikuti T wave negatif. Berbeda dari STEMI (cekung/konveks). Dapat spontan (tipe 1 spontan) atau hanya muncul saat provokasi (tipe 1 diinduksi)",
    },
    criteria: [
      "ST elevasi ≥2mm (0.2mV) dengan morfologi 'coved' (kubah) di ≥1 lead V1–V2",
      "Diikuti T wave negatif",
      "ST turun secara bertahap (gradually descending — bukan cekung seperti STEMI)",
      "Dapat dilihat di posisi standar V1-V2 atau posisi interkostal tinggi (V1-V2 di ICS 2-3)",
      "Dapat spontan atau diinduksi obat (ajmalin 1mg/kgBB IV, flekainid 2mg/kgBB oral)",
    ],
    ddx: [
      "STEMI anterior (ST cekung atau konveks, T positif, Q wave berkembang, konteks klinis SKA)",
      "RBBB dengan early repolarization (RSR' di V1 + ST elevasi konkaf, bukan coved pattern)",
      "Early repolarization (konkaf, notching J-point, tidak ada T negatif)",
      "Hiperkalemia (ST elevasi V1-V2 dengan peaked T, QRS lebar, konteks metabolik)",
      "Miokarditis akut (ST elevasi difus multiple lead, troponin tinggi, konteks inflamasi)",
    ],
    management: {
      immediate: [
        "Episode VF/VT: defibrilasi segera, RJP, ACLS standar",
        "VF storm: isoproterenol infus 0.01–0.02 mcg/kgBB/menit IV (mengurangi gradient repolarisasi) ATAU quinidine 200mg per oral",
        "Semua pasien Brugada: konsul elektrofisiologi kardiologi SEGERA",
        "Simtomatik (riwayat syncope, VF, aborted SCD) → ICD implantasi (kelas I)",
        "Asimtomatik dengan pola spontan: konsul EP, pertimbangkan EPS studi",
      ],
      drugs: [
        "Isoproterenol 0.01–0.02 mcg/kgBB/menit IV (akut VF storm — meningkatkan HR, mengurangi gradient repolarisasi)",
        "Quinidine 200mg oral (satu-satunya antiaritmia oral yang terbukti efektif untuk Brugada)",
        "HINDARI: flekainid, propafenon, ajmalin, prokainamid (sodium channel blocker — memperburuk dan trigger aritmia)",
      ],
      notes: [
        "Demam adalah trigger paling sering — antipiretik agresif (parasetamol) saat demam pada pasien Brugada dikenal",
        "Daftar obat yang harus dihindari: brugadadrugs.org",
        "ICD adalah satu-satunya terapi yang terbukti mencegah SCD pada Brugada simtomatik",
        "Skrining keluarga tingkat pertama — autosomal dominan dengan penetrance bervariasi",
      ],
    },
    pitfalls: [
      "Jangan salah diagnosis sebagai STEMI anterior (pola coved berbeda dari ST elevasi konveks STEMI)",
      "Demam dapat mengkonversi pola tipe 2/3 menjadi tipe 1 — periksa ulang EKG saat demam",
      "JANGAN sodium channel blocker (flekainid, propafenon) — dapat trigger VF fatal",
      "Amiodarone tidak efektif untuk pencegahan VF Brugada jangka panjang",
    ],
    references: [
      { text: "Brugada P, Brugada J. Right bundle branch block, persistent ST segment elevation and sudden cardiac death. JACC, 1992;20(6):1391-1396" },
      { text: "Wilde AAM et al. ESC 2022 Guidelines for Management of Ventricular Arrhythmias (Channelopathies). Eur Heart J, 2022" },
      { text: "LITFL — Brugada Syndrome. litfl.com, 2024" },
      { text: "Priori SG et al. HRS/EHRA/APHRS Expert Consensus Statement on Brugada Syndrome. Heart Rhythm, 2013" },
    ],
  },
  {
    key: "wpw", name: "WPW — Wolff-Parkinson-White", short: "WPW",
    severity: "unstable", tint: "var(--danger)",
    imageFile: "wpw.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "Interval PR pendek (< 120 ms) · gelombang delta (slurring awal QRS) · QRS sedikit melebar · ST-T inverse dari delta. EKG normal di antara episode.",
    action: "WPW + AF dengan konduksi cepat → KONTRAINDIKASI adenosin/verapamil/digoksin (dapat trigger VF). Gunakan prokainamid/amiodaron atau kardioversi segera. Konsul EP ablasi.",
    definition: "Wolff-Parkinson-White (WPW) adalah sindrom pre-eksitasi ventrikel akibat jalur konduksi aksesori (bundle of Kent) yang menghubungkan atrium dan ventrikel di luar sistem AV node normal. Risiko utama adalah AF dengan konduksi aksesori sangat cepat (>200 bpm) yang dapat berdegenerasi menjadi VF.",
    mechanism: "Jalur aksesori memiliki periode refraktori lebih pendek dari AV node. Pada AF, konduksi aksesori menghantarkan impuls atrium (400–600/menit) langsung ke ventrikel tanpa perlindungan AV node → RVR sangat cepat → VF. AVRT ortodromik (70%): konduksi anterograde via AV node (QRS sempit), retrograde via aksesori. AVRT antidromik (30%): anterograde via aksesori (QRS sangat lebar).",
    morphology: {
      rate: "Normal 60–100 bpm sinus rhythm; SANGAT cepat (>200 bpm) saat WPW-AF",
      rhythm: "Regular sinus rhythm; ireguler sangat cepat saat WPW-AF",
      pWave: "Normal morfologi di NSR",
      prInterval: "Pendek <120ms (pre-eksitasi via aksesori lebih cepat dari AV node)",
      qrsDuration: "Sedikit lebar (120–140ms): slurred onset (gelombang delta di awal QRS) akibat fusi konduksi AV node + aksesori",
      stT: "ST-T discordant dari gelombang delta — berlawanan arah dari delta dan QRS utama",
    },
    criteria: [
      "PR interval pendek (<120ms)",
      "Gelombang delta: slurring/slanting di awal QRS (upstroke lambat)",
      "QRS sedikit melebar (120–140ms) akibat fusi konduksi AV node + aksesori",
      "ST-T discordant (berlawanan arah delta dan QRS utama)",
      "EKG mungkin normal (concealed WPW — aksesori retrograde saja, tidak ada delta di sinus rhythm)",
    ],
    ddx: [
      "LBBB (QRS lebar tapi PR normal, tidak ada delta wave, slurring berbeda)",
      "Infark inferior (pseudo-Q di II, III, aVF dari delta negatif — mirip Q patologis)",
      "WPW antidromik (QRS sangat lebar, cepat, regular — menyerupai VT monomorfik)",
      "Hipertrofi ventrikel (QRS lebih lebar tapi tidak ada PR pendek/delta)",
    ],
    management: {
      immediate: [
        "WPW + AF konduksi cepat (>200 bpm, QRS lebar ireguler) → KARDIOVERSI TERSINKRON SEGERA",
        "KONTRAINDIKASI MUTLAK: adenosin, verapamil, diltiazem, digoksin, beta blocker pada WPW+AF",
        "Stabil + WPW+AF: prokainamid 17mg/kgBB IV infus lambat (memperlambat konduksi aksesori)",
        "AVRT stabil dengan QRS sempit: manuver vagal, adenosin BOLEH (bukan AF)",
        "Definitif: ablasi kateter RF jalur aksesori — kuratif >95%",
      ],
      drugs: [
        "Prokainamid 17mg/kgBB IV infus lambat (max 50mg/menit) — untuk WPW+AF stabil",
        "HINDARI: adenosin, verapamil, diltiazem, digoksin, beta blocker pada WPW+AF (mempercepat konduksi aksesori → VF)",
      ],
      notes: [
        "WPW + AF = salah satu emergency kardiologi paling berbahaya — dapat menyebabkan VF dalam menit",
        "Identifikasi WPW (delta wave, PR pendek) sebelum memberikan obat apapun untuk takiaritmia",
        "RF ablasi: pilihan definitif, success rate >95%, prosedur 1–2 jam, minimal komplikasi",
        "Skrining: ECG keluarga tingkat pertama jika ada riwayat SCD mendadak muda",
      ],
    },
    pitfalls: [
      "JANGAN adenosin pada WPW+AF — dapat menyebabkan VF fatal dengan memblok AV node sehingga semua konduksi via aksesori",
      "WPW+AF: QRS lebar, ireguler, sangat cepat — sering dianggap VT, lalu diberi amiodaron/adenosin (fatal)",
      "WPW antidromik sangat menyerupai VT monomorfik — EKG sinus rhythm sebelumnya kunci diagnosis",
      "Concealed WPW: EKG sinus normal (tidak ada delta) — hanya manifests saat AVRT",
    ],
    references: [
      { text: "Page RL et al. ACC/AHA/HRS 2015 Guideline for SVT Management (including WPW). JACC, 2016" },
      { text: "Wolff L, Parkinson J, White PD. Bundle-branch block with short P-R interval in healthy young people. Am Heart J, 1930;5:685" },
      { text: "LITFL — Wolff-Parkinson-White Syndrome. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
    ],
  },
  {
    key: "lbbb", name: "LBBB Baru", short: "LBBB Baru",
    severity: "critical", tint: "var(--danger)",
    imageFile: "lbbb.jpg", imageCredit: "LITFL · CC BY-NC-SA",
    features: "QRS ≥ 0,12 dtk · pola RSR' di V5–V6 ('M-shape') · gelombang S di V1 · Sgarbossa criteria: konkordant ST ≥ 1 mm atau diskordant ST ≥ 25% QRS amplitude.",
    action: "LBBB BARU + gejala SKA = STEMI equivalen → IKPP emergensi. Gunakan kriteria Sgarbossa untuk identifikasi STEMI di LBBB. Jangan tunda reperfusi.",
    definition: "LBBB baru (atau dianggap baru) disertai gejala ACS adalah STEMI equivalen yang memerlukan aktivasi Cath Lab segera. LBBB terjadi akibat blok konduksi total pada cabang kiri bundle of His → depolarisasi ventrikel kiri terjadi lambat via sel-sel miokard (bukan sistem His-Purkinje) → QRS sangat lebar ≥120ms.",
    mechanism: "Blok pada cabang kiri bundle of His → ventrikel kiri terdepolarisasi via konduksi sel-ke-sel dari ventrikel kanan (sangat lambat) → QRS sangat lebar. Pada iskemia LAD/LCx akut yang mengenai cabang kiri: LBBB baru muncul. Kriteria Sgarbossa/Smith-modified digunakan untuk mengidentifikasi STEMI superimposed pada LBBB.",
    morphology: {
      rate: "Bervariasi tergantung irama dasar",
      rhythm: "Sinus (atau sesuai irama dasar)",
      pWave: "Normal",
      prInterval: "Normal atau sedikit memanjang",
      qrsDuration: "≥120ms, biasanya 140–160ms — QRS sangat lebar",
      stT: "Pola LBBB: QRS positif di I, aVL, V5-V6 ('M-shape'/RSR'); QRS negatif di V1 (QS atau rS); ST-T discordant normal. Sgarbossa positif: (1) konkordant ST elevasi ≥1mm, (2) konkordant ST depresi ≥1mm di V1-V3, (3) diskordant ST elevasi ≥25% depth S-wave (Smith-modified)",
    },
    criteria: [
      "QRS ≥120ms (biasanya 140–160ms)",
      "Tidak ada septal Q wave di I, V5, V6",
      "R-wave plateau atau notched di V5-V6 ('M-shape')",
      "QS atau rS pattern di V1",
      "ST dan T wave discordant dari QRS (berlawanan arah — normal untuk LBBB)",
      "Sgarbossa: konkordant ST elevasi ≥1mm (paling spesifik), atau ST/S ratio ≥0.25 (Smith-modified, lebih sensitif)",
    ],
    ddx: [
      "RBBB (RSR' di V1, S lebar di V5-V6 — pola berbeda dari LBBB)",
      "LBBB lama vs baru (bandingkan EKG sebelumnya — kunci pengambilan keputusan)",
      "LVH berat dengan LBBB pattern (EKG identik — perlu klinis dan riwayat)",
      "Paced rhythm (artifact pacemaker spikes sebelum QRS lebar)",
    ],
    management: {
      immediate: [
        "LBBB baru + gejala ACS → aktivasi Cath Lab SEGERA (perlakukan sebagai STEMI)",
        "Antiplatelet ganda: ASA 300mg + ticagrelor 180mg atau klopidogrel 600mg",
        "Antikoagulan: UFH IV",
        "Gunakan kriteria Sgarbossa/Smith-modified untuk konfirmasi STEMI di LBBB",
        "Fibrinolisis jika PCI tidak tersedia ≤120 menit dari FMC",
      ],
      drugs: [
        "Aspirin 300mg loading → 100mg/hari",
        "Ticagrelor 180mg loading → 90mg 2×/hari",
        "UFH 60–70 IU/kgBB IV bolus (max 5000 IU)",
      ],
      notes: [
        "Bandingkan dengan EKG sebelumnya — LBBB lama tidak memerlukan aktivasi Cath Lab otomatis",
        "Sgarbossa 1 poin (konkordant ST elevasi ≥1mm) sudah sangat spesifik untuk STEMI di LBBB",
        "Smith-modified Sgarbossa: ST/S ratio ≥0.25 — lebih sensitif dari kriteria Sgarbossa klasik",
        "LBBB baru tanpa gejala: tetap memerlukan evaluasi menyeluruh (bukan auto-discharge)",
      ],
    },
    pitfalls: [
      "LBBB lama yang dianggap baru karena tidak ada EKG pembanding → over-treatment (tapi lebih baik aktifkan Cath Lab dari miss STEMI)",
      "LBBB baru tanpa gejala tidak secara otomatis = STEMI (perlu klinis dan biomarker)",
      "ST elevasi konkordant minimal sering terlewatkan — hitung dengan teliti (Sgarbossa)",
      "Paced rhythm mirip LBBB — cari pacemaker spike di EKG",
    ],
    references: [
      { text: "Sgarbossa EB et al. Electrocardiographic diagnosis of evolving AMI in the presence of LBBB. NEJM, 1996;334(8):481-487" },
      { text: "Smith SW et al. Diagnosis of STEMI in the presence of LBBB with the ST-elevation to S-wave ratio. Ann Emerg Med, 2012;60(6):766-776" },
      { text: "Byrne RA et al. ESC 2023 Guidelines for Acute Myocardial Infarction with STEMI. Eur Heart J, 2023" },
      { text: "LITFL — Left Bundle Branch Block. litfl.com, 2024" },
      { text: "AHA 2025 Guidelines for CPR and ECC. Circulation, 2025" },
    ],
  },
];

/* ------------------------------------------------------------
   Hs & Ts (diferensial reversibel · standar internasional)
   ------------------------------------------------------------ */
export const ACLS_HS_TS: Array<Record<string, string>> = [
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
export const ACLS_CPR_PROMPTS: Array<{ at: number; action: string; tone: string }> = [
  { at: 0,   action: "Mulai RJP · 100–120/menit", tone: "info" },
  { at: 30,  action: "Konfirmasi akses IV/IO",     tone: "info" },
  { at: 60,  action: "Cek kapnografi (EtCO₂ > 10)", tone: "info" },
  { at: 90,  action: "Siapkan shock / obat berikutnya", tone: "warn" },
  { at: 120, action: "Cek irama · cek nadi ≤ 10 dtk", tone: "danger" },
];
