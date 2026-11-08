import { useState } from 'react';
import { Accordion, Disclaimer, type CalcStep } from '../../../components/clinical';
import {
  correctedCalcium, caMgdlToMmol, caGluconateInfusion, hyperCaSeverity,
  CA_GLUCONATE_ELEMENTAL_MG_PER_ML, HYPOCA_SEVERE_MMOL,
} from '../../../lib/electrolytes';
import { weightPlausibilityWarning, rangeWarning } from '../../../lib/validation';
import {
  InputPanel, FieldRow, NumField, TargetField, ToggleList, useToggleSet, CalcButton, StrategyFlow, InfoBox, RefLine,
  Card, Eyebrow, BigNumber, SmallText, MiniBoxes, Steps, SectionTitle, Bullets, InputWarning, ResultStack, fmt, type FlowStep,
} from './ElektroUI';

/* Koreksi Kalsium — port dari ICU Helper (ElektroKalsium.tsx, versi final teraudit).
   Angka & rumus identik; logika murni di src/lib/electrolytes.ts.
   Tambahan sesuai keputusan user: dosis kalsitonin & denosumab dari ACLS lama
   dicantumkan di langkah lini kedua hiperkalsemia. */

// Gejala/tanda hipokalsemia (SfE 2016).
const CA_SX = ['Parestesia perioral / jari', 'Tanda Trousseau / Chvostek', 'Tetani / spasme karpopedal', 'Laringospasme', 'QT memanjang / aritmia', 'Kejang'];
const CA_CTX = ['Gagal ginjal tahap akhir / dialisis', 'Mendapat digoksin / aritmia jantung'];

const CA_TARGETS = [
  { value: '8.4', label: 'SfE (2.1 mmol/L)', note: 'SfE 2016: Ca terkoreksi >2.1 mmol/L (8.4 mg/dL) dipakai sebagai ambang aman (mis. pasca-tiroidektomi boleh pulang). Infus dititrasi menuju normokalsemia.' },
  { value: '8.5', label: 'Batas bawah normal lab', note: 'Rentang rujukan bervariasi antar-laboratorium (umumnya ±8.5–10.5 mg/dL).' },
];
const RATE_OPTIONS = [
  { value: '50', label: 'SfE batas bawah', note: '50 mL/jam ≈ 42 mg Ca elemental/jam.' },
  { value: '100', label: 'SfE batas atas', note: '100 mL/jam ≈ 85 mg Ca elemental/jam.' },
];

function useKalsiumState() {
  const [target, setTarget] = useState('8.4');
  const [ica, setIca] = useState('');
  const [rate, setRate] = useState('50');
  const [sx, toggleSx] = useToggleSet();
  const [ctx, toggleCtx] = useToggleSet();
  return { target, setTarget, ica, setIca, rate, setRate, sx, toggleSx, ctx, toggleCtx };
}
type KalsiumState = ReturnType<typeof useKalsiumState>;

function corrOf(ca: string, alb: string): { corr: number; usedAlb: boolean } {
  const c = parseFloat(ca);
  const a = parseFloat(alb);
  if (!(c > 0)) return { corr: NaN, usedAlb: false };
  return a > 0 ? { corr: correctedCalcium(c, a), usedAlb: true } : { corr: c, usedAlb: false };
}

function KalsiumInputs({ s, ca, alb }: { s: KalsiumState; ca: string; alb: string }) {
  const { corr } = corrOf(ca, alb);
  const iv = parseFloat(s.ica);
  const hypo = corr < 8.5 || (iv > 0 && iv < 1.12);
  return (
    <>
      <FieldRow label="Ca ion terukur" sub="opsional, lebih akurat dari koreksi albumin">
        <NumField value={s.ica} onChange={s.setIca} placeholder="Opsional" unit="mmol/L" step="0.01" />
      </FieldRow>
      {hypo && (
        <>
          <ToggleList title="Gejala / Tanda Hipokalsemia" hint="Bergejala pada kadar berapa pun = BERAT (SfE 2016)." items={CA_SX} selected={s.sx} onToggle={s.toggleSx} tone="red" />
          <TargetField label="Target Ca terkoreksi" value={s.target} onChange={s.setTarget} unit="mg/dL" step="0.1" options={CA_TARGETS} />
          <TargetField label="Laju infus rumatan" sub="100 mL Ca glukonat 10% dalam 1 L" value={s.rate} onChange={s.setRate} unit="mL/jam" step="5" options={RATE_OPTIONS} />
          <ToggleList title="Konteks" items={CA_CTX} selected={s.ctx} onToggle={s.toggleCtx} />
        </>
      )}
    </>
  );
}

export function KalsiumCalc() {
  const [bw, setBw] = useState('');
  const [ca, setCa] = useState('');
  const [alb, setAlb] = useState('');
  const [shown, setShown] = useState(false);
  const s = useKalsiumState();

  return (
    <div>
      <InputPanel>
        <FieldRow label="Berat Badan" sub="untuk mg/kg/jam"><NumField value={bw} onChange={setBw} placeholder="70" unit="kg" /></FieldRow>
        <FieldRow label="Ca Total"><NumField value={ca} onChange={setCa} placeholder="8.5" unit="mg/dL" step="0.1" /></FieldRow>
        <FieldRow label="Albumin"><NumField value={alb} onChange={setAlb} placeholder="4.0" unit="g/dL" step="0.1" /></FieldRow>
        <KalsiumInputs s={s} ca={ca} alb={alb} />
      </InputPanel>
      <CalcButton onClick={() => setShown(true)} tone="slate" />
      {shown && (
        <ResultStack>
          <InputWarning messages={[
            weightPlausibilityWarning(parseFloat(bw)),
            rangeWarning(parseFloat(ca), 4, 18, 'Ca', ' mg/dL'),
            rangeWarning(parseFloat(alb), 1, 6, 'Albumin', ' g/dL'),
          ]} />
          <KalsiumResult s={s} ca={ca} alb={alb} bw={bw} />
        </ResultStack>
      )}
      {/* Teori & Referensi selalu tampil (seperti ICU Helper), tidak menunggu "Hitung Koreksi" */}
      <div style={{ marginTop: 16 }}><CaTheory /></div>
    </div>
  );
}

function KalsiumResult({ s, ca, alb, bw }: { s: KalsiumState; ca: string; alb: string; bw: string }) {
  const albN = parseFloat(alb);
  if (albN > 7) {
    // Albumin >7 g/dL tidak fisiologis → hampir pasti diisi dalam g/L (mis. 35 g/L = 3.5 g/dL).
    return (
      <InfoBox tone="amber" title={`Albumin ${alb} — periksa satuan`}>
        Kalkulator memakai albumin dalam <strong>g/dL</strong>. Nilai {alb} tampaknya dalam g/L — isi {fmt(albN / 10, 1)} g/dL. Dengan nilai g/L, Ca terkoreksi akan bernilai negatif dan tidak bermakna.
      </InfoBox>
    );
  }
  const { corr, usedAlb } = corrOf(ca, alb);
  if (!(corr > 0)) return <InfoBox>Isi Ca total untuk menghitung.</InfoBox>;
  const w = parseFloat(bw);
  const iv = parseFloat(s.ica);
  const hasIca = iv > 0;
  const mmol = caMgdlToMmol(corr);

  const corrStep: CalcStep = usedAlb
    ? { label: 'Langkah 1 — Ca terkoreksi albumin (Payne):', formula: `Ca terkoreksi = Ca + 0.8 × (4.0 − albumin)\n= ${ca} + 0.8 × (4.0 − ${alb}) = ${fmt(corr, 2)} mg/dL`, note: 'Albumin mengikat ±40% Ca; tiap 1 g/dL albumin di bawah 4.0 membuat Ca total tampak turun ±0.8 mg/dL. Di ICU koreksi ini TIDAK akurat: Payne hanya mengenali 5–15% pasien yang benar-benar hipokalsemia menurut Ca ion (Dickerson 2004; Özdemir 2026) — gunakan Ca ion terukur bila ada.' }
    : { label: 'Langkah 1 — Ca total (albumin tidak diisi):', formula: `Ca = ${ca} mg/dL (tanpa koreksi albumin)`, note: 'Isi albumin agar Ca dikoreksi — hipoalbuminemia membuat Ca total tampak rendah palsu.' };
  const mmolStep = (note?: string): CalcStep => ({ label: 'Langkah 2 — Konversi ke mmol/L:', formula: `${fmt(corr, 2)} ÷ 4.008 = ${fmt(mmol, 2)} mmol/L`, note });

  // Ca ion terukur mengalahkan Ca terkoreksi (rujukan iCa 1.12–1.32 mmol/L; Dickerson 2004).
  const icaHigh = hasIca && iv > 1.32;
  const icaNormal = hasIca && iv >= 1.12 && iv <= 1.32;

  // ── Hiperkalsemia ──
  if ((corr > 10.5 && !hasIca) || icaHigh) {
    const sev = hyperCaSeverity(corr);
    const sevText = { ringan: 'Ringan (<3.0 mmol/L / <12 mg/dL) — sering asimtomatik, biasanya tidak perlu koreksi segera', sedang: 'Sedang (3.0–3.5 mmol/L / 12–14 mg/dL) — terapi segera biasanya diindikasikan, terutama bila bergejala', berat: 'BERAT (>3.5 mmol/L / >14 mg/dL) — koreksi URGEN: risiko disritmia & koma' }[sev];
    const flow: FlowStep[] = [
      { title: 'Konfirmasi & EKG', body: 'Ca terkoreksi albumin; EKG untuk QT pendek / gangguan konduksi. Periksa fosfat, PTH, ureum-kreatinin.' },
      { title: `Hitung dasar: Ca ${fmt(corr, 2)} mg/dL (${fmt(mmol, 2)} mmol/L) → ${sev}`, body: 'Lihat ① Hasil Dasar.', state: 'now' },
      { title: 'Rehidrasi NaCl 0.9% 4–6 L / 24 jam', body: <>≈ 170–250 mL/jam. Pantau overload terutama pada gangguan ginjal & lansia.</>, state: sev === 'ringan' ? 'todo' : 'now' },
      { title: 'Bisfosfonat IV bila masih perlu', body: 'Zoledronat 4 mg dalam 15 menit, ATAU pamidronat 30–90 mg (sesuai beratnya) @20 mg/jam, ATAU ibandronat 2–4 mg. Lebih lambat / dosis dikurangi pada gangguan ginjal. Nadir Ca 2–4 hari.', state: sev === 'ringan' ? 'skip' : 'now' },
      { title: 'Lini kedua', body: <>Kalsitonin <strong>4–8 IU/kg SC/IM tiap 12 jam</strong> (onset cepat); denosumab <strong>120 mg SC</strong> (pilihan bila gagal ginjal — bisfosfonat kontraindikasi relatif); kalsimimetik (dosis sesuai label/spesialis); glukokortikoid (prednisolon 40 mg/hari) pada limfoma, penyakit granulomatosa, intoksikasi vitamin D. Dialisis bila gagal ginjal berat.<br /><em>Dosis kalsitonin & denosumab dipertahankan dari versi ACLS sebelumnya — konfirmasi dengan label/spesialis.</em></> },
      { title: 'Diuretik loop — BUKAN terapi rutin', body: 'Hanya bila terjadi overload cairan; tidak efektif untuk menurunkan Ca (SfE 2016).', state: 'skip' },
      { title: 'Cari penyebab', body: 'Ca tinggi + PTH tinggi → hiperparatiroid primer/tersier; Ca tinggi + PTH rendah → keganasan atau penyebab lain (vit D, granulomatosa, tiazid, litium, imobilisasi). 90% kasus = hiperparatiroid primer atau keganasan.' },
    ];
    return (
      <>
        <Card tone="red">
          <Eyebrow tone="red">① Hasil Dasar · Hiperkalsemia {sev}</Eyebrow>
          <BigNumber tone="red">Ca terkoreksi: {fmt(corr, 2)} mg/dL</BigNumber>
          <SmallText>= {fmt(mmol, 2)} mmol/L · {sevText}</SmallText>
          {icaHigh && <SmallText tone="red" strong>Dikonfirmasi Ca ion {iv} mmol/L (&gt;1.32).{corr <= 10.5 ? ' Ca terkoreksi tampak normal — derajat berdasarkan Ca terkoreksi mungkin meremehkan.' : ''}</SmallText>}
        </Card>
        <Steps tone="red" title="🧮 Langkah Dasar — dari input ke derajat hiperkalsemia" steps={[corrStep, mmolStep('Ambang SfE: <3.0 mmol/L ringan · 3.0–3.5 sedang · >3.5 berat.')]} />

        <SectionTitle>② Cara Pemberian</SectionTitle>
        <Card plain>
          <SmallText strong>Rehidrasi — langkah pertama{sev === 'ringan' ? ' (bila bergejala / dehidrasi)' : ''}</SmallText>
          <BigNumber tone="slate">NaCl 0.9% 4–6 L / 24 jam</BigNumber>
          <SmallText>≈ 167–250 mL/jam; lalu bisfosfonat IV bila masih perlu (zoledronat 4 mg/15 menit). Diuretik loop hanya bila overload.</SmallText>
          <Steps tone="slate" title="🧮 Rincian" steps={[{ label: 'Langkah P1 — Laju rehidrasi:', formula: '4–6 L ÷ 24 jam = 167–250 mL/jam', note: 'Sesuaikan dengan status volume, fungsi jantung & ginjal.' }]} />
        </Card>
        <StrategyFlow steps={flow} />
        <RefLine>Walsh J, Gittoes N, Selby P. SfE Endocrine Emergency Guidance: acute hypercalcaemia. Endocr Connect 2016;5:G9</RefLine>
        <Disclaimer />
      </>
    );
  }

  const icaLow = hasIca && iv < 1.12;
  if (icaNormal) {
    const disagree = corr < 8.5 || corr > 10.5;
    return (
      <InfoBox tone="emerald" title={`✅ Ca ion ${iv} mmol/L — normal`}>
        {disagree
          ? <>Ca terkoreksi albumin {fmt(corr, 2)} mg/dL tampak {corr < 8.5 ? 'rendah' : 'tinggi'}, tetapi Ca ion (fraksi aktif) normal → <strong>gangguan kalsium tidak terbukti</strong>; jangan memberi Ca IV / terapi hiperkalsemia hanya berdasarkan Ca terkoreksi. Koreksi albumin sering keliru pada pasien kritis (Dickerson 2004; Özdemir 2026).</>
          : `Ca terkoreksi ${fmt(corr, 2)} mg/dL juga normal.`}
      </InfoBox>
    );
  }
  if (corr >= 8.5 && !icaLow) {
    return (
      <InfoBox tone="emerald" title={`✅ Ca terkoreksi ${fmt(corr, 2)} mg/dL — dalam rentang normal`}>
        Ca terkoreksi normal <strong>tidak menyingkirkan</strong> hipokalsemia pada pasien kritis: di ICU, koreksi albumin hanya mengenali 15% pasien yang hipokalsemia menurut Ca ion (Özdemir 2026, n=250). Periksa Ca ion bila status kalsium memengaruhi tata laksana.
      </InfoBox>
    );
  }

  // ── Hipokalsemia ──
  const severe = mmol < HYPOCA_SEVERE_MMOL || s.sx.size > 0;
  const sevReason = [mmol < HYPOCA_SEVERE_MMOL ? 'kadar <1.9 mmol/L' : null, s.sx.size > 0 ? 'bergejala' : null].filter(Boolean).join(' + ');
  const eskd = s.ctx.has(CA_CTX[0]);
  const digoxin = s.ctx.has(CA_CTX[1]);
  const tParsed = parseFloat(s.target);
  const tgt = tParsed >= 7.5 && tParsed <= 10.5 ? tParsed : 8.4;
  const rParsed = parseFloat(s.rate);
  const rate = rParsed > 0 && rParsed <= 200 ? rParsed : 50;
  const inf = caGluconateInfusion(rate, w);
  const bagHours = 1100 / rate;
  const delta = Math.max(0, tgt - corr);
  const tone = severe ? 'red' : 'amber';

  const basic: CalcStep[] = [
    corrStep,
    mmolStep(`Ambang BERAT SfE: <${HYPOCA_SEVERE_MMOL} mmol/L (≈7.6 mg/dL) dan/atau bergejala → pasien ini ${severe ? `BERAT (${sevReason})` : 'RINGAN (asimtomatik, ≥1.9 mmol/L)'}.`),
    { label: 'Langkah 3 — Selisih ke target:', formula: `ΔCa = target − Ca terkoreksi = ${tgt} − ${fmt(corr, 2)} = ${fmt(delta, 2)} mg/dL (${fmt(caMgdlToMmol(delta), 2)} mmol/L)`, note: 'Tidak ada rumus dosis→kenaikan Ca yang andal; selisih ini dipakai untuk titrasi & kriteria berhenti, bukan untuk menghitung dosis sekaligus.' },
  ];
  if (hasIca) basic.push({ label: 'Langkah 4 — Ca ion terukur:', formula: `iCa ${iv} mmol/L (rentang rujukan lab umum ±1.12–1.32)${icaLow ? ' → RENDAH' : ''}`, note: 'Pada sakit kritis, iCa lebih akurat daripada koreksi albumin.' });

  const give: CalcStep[] = severe ? [
    { label: 'Langkah P1 — Bolus awal:', formula: `Ca glukonat 10% 10–20 mL = ${fmt(10 * CA_GLUCONATE_ELEMENTAL_MG_PER_ML, 0)}–${fmt(20 * CA_GLUCONATE_ELEMENTAL_MG_PER_ML, 0)} mg Ca elemental\ndalam 50–100 mL D5W, IV 10 menit, dengan monitor EKG`, note: 'Dapat diulang hingga pasien asimtomatik.' },
    { label: 'Langkah P2 — Infus rumatan:', formula: `100 mL Ca glukonat 10% (${fmt(100 * CA_GLUCONATE_ELEMENTAL_MG_PER_ML, 0)} mg) dalam 1 L NaCl 0.9%/D5W → ±1100 mL\nKonsentrasi = ${fmt(100 * CA_GLUCONATE_ELEMENTAL_MG_PER_ML, 0)} ÷ 1100 = ${fmt(inf.concMgPerMl, 2)} mg/mL\nLaju ${rate} mL/jam × ${fmt(inf.concMgPerMl, 2)} = ${fmt(inf.mgPerHr, 0)} mg/jam${w > 0 ? ` = ${fmt(inf.mgPerKgPerHr, 2)} mg/kg/jam` : ''}\n1 kantong habis ±${fmt(bagHours, 0)} jam`, note: `SfE: 50–100 mL/jam, titrasi menuju target ${tgt} mg/dL sampai terapi penyebab bekerja.` },
  ] : [
    { label: 'Langkah P1 — Terapi ringan:', formula: 'Suplemen kalsium oral + terapi penyebab', note: 'Vitamin D bila defisiensi; Mg bila hipomagnesemia. Ulang Ca dalam 24 jam (SfE 2016).' },
  ];

  const flow: FlowStep[] = [
    { title: 'Konfirmasi', body: <>Ca terkoreksi albumin{hasIca ? ` dan Ca ion ${iv} mmol/L` : ' — lebih baik Ca ion terukur bila ada'}. Periksa fosfat, PTH, ureum-kreatinin, vitamin D, <strong>magnesium</strong>.</> },
    { title: `Hitung dasar: Ca ${fmt(corr, 2)} mg/dL → ${severe ? 'BERAT' : 'ringan'}, Δ ke target ${fmt(delta, 2)}`, body: severe ? `Berat karena ${sevReason} — kegawatan medis.` : 'Asimtomatik dan ≥1.9 mmol/L.', state: 'now' },
    { title: 'Koreksi Mg bila rendah', body: 'Hipomagnesemia menghambat sekresi PTH → hipokalsemia refrakter. SfE: Mg IV 24 mmol/24 jam (= 6 g MgSO₄ dalam 500 mL NaCl 0.9%/D5W). Gunakan kalkulator Koreksi Magnesium.' },
    { title: 'Bolus Ca glukonat 10% 10–20 mL / 10 menit', body: 'Dalam 50–100 mL D5W, dengan monitor EKG; ulang sampai asimtomatik.', state: severe ? 'now' : 'skip' },
    { title: `Infus rumatan ${rate} mL/jam`, body: <>100 mL Ca glukonat 10% dalam 1 L → {fmt(inf.mgPerHr, 0)} mg Ca elemental/jam. Titrasi menuju target {tgt} mg/dL.{eskd && <strong> Gagal ginjal tahap akhir/dialisis: infus volume besar TIDAK dianjurkan — ikuti panduan KDOQI/konsul nefrologi.</strong>}</>, state: severe ? 'now' : 'skip' },
    { title: 'Oral + terapi penyebab', body: 'Suplemen kalsium oral; hipoparatiroid → alfakalsidol/kalsitriol 0.25–0.5 µg/hari (pantau ketat, risiko hiperkalsemia); defisiensi vitamin D → loading kole/ergokalsiferol.', state: severe ? 'todo' : 'now' },
  ];

  return (
    <>
      {/* ① HASIL DASAR */}
      <Card tone={tone}>
        <Eyebrow tone={tone}>① Hasil Dasar · Hipokalsemia {severe ? 'BERAT' : 'ringan'}</Eyebrow>
        <BigNumber tone="slate">Ca terkoreksi: {fmt(corr, 2)} mg/dL</BigNumber>
        <SmallText>{usedAlb ? `= ${ca} + 0.8 × (4.0 − ${alb})` : 'tanpa koreksi albumin'}</SmallText>
        <MiniBoxes tone={tone} boxes={[
          { title: 'mmol/L', value: fmt(mmol, 2), sub: 'ambang berat 1.9' },
          { title: 'Δ ke target', value: `${fmt(delta, 2)} mg/dL`, sub: `target ${tgt}`, strong: true },
          { title: hasIca ? 'Ca ion' : 'Keparahan', value: hasIca ? `${iv}` : severe ? 'BERAT' : 'Ringan', sub: hasIca ? (icaLow ? 'mmol/L · rendah' : 'mmol/L') : severe ? sevReason : 'asimtomatik' },
        ]} />
      </Card>
      <Steps tone="amber" title="🧮 Langkah Dasar — dari input ke derajat hipokalsemia" steps={basic} />

      {/* ② CARA PEMBERIAN */}
      <SectionTitle>② Cara Pemberian</SectionTitle>
      <Card plain>
        <SmallText strong>{severe ? 'Berat — IV dengan monitor EKG (SfE 2016)' : 'Ringan — oral + terapi penyebab'}</SmallText>
        <BigNumber tone="slate" size="md">{severe ? `Bolus 10–20 mL Ca glukonat 10% → infus ${rate} mL/jam` : 'Kalsium oral · ulang Ca 24 jam'}</BigNumber>
        {severe && <SmallText>{fmt(inf.mgPerHr, 0)} mg Ca elemental/jam{w > 0 ? ` (${fmt(inf.mgPerKgPerHr, 2)} mg/kg/jam)` : ''} · 1 kantong ±{fmt(bagHours, 0)} jam · titrasi ke {tgt} mg/dL</SmallText>}
        <Steps tone="slate" title="🧮 Rincian pemberian" steps={give} />
      </Card>

      <InfoBox tone="red" title="⚠ Keamanan Ca IV">
        Ca klorida 10% (10 mL = 6.8 mmol, ±3× Ca glukonat) hanya via vena sentral — lebih iritan; indikasi utamanya henti jantung / syok / transfusi masif. Jangan campur dengan NaHCO₃ atau fosfat (presipitasi). Efek samping: flebitis, hipotensi, aritmia.{digoxin ? ' Pasien digoksin/aritmia: monitor EKG kontinu selama Ca IV (SfE 2016).' : ' Pasien digoksin/aritmia perlu monitor EKG kontinu.'}
      </InfoBox>

      <StrategyFlow steps={flow} />

      <Accordion title="📖 Dasar rujukan hipokalsemia">
        <Bullets items={[
          'Gejala biasanya muncul bila Ca terkoreksi <±1.9 mmol/L, tetapi bergantung kecepatan penurunan (SfE 2016).',
          'Ca glukonat 10%: 10 mL = 93 mg Ca elemental (2.3 mmol; 4.65 mEq).',
          'Penyebab tersering di RS: pasca-tiroidektomi total; lainnya defisiensi vitamin D berat, hipomagnesemia (termasuk akibat PPI), obat sitotoksik, pankreatitis, rabdomiolisis, transfusi masif.',
        ]} />
      </Accordion>

      <RefLine>Turner J, Gittoes N, Selby P. SfE Endocrine Emergency Guidance: acute hypocalcaemia. Endocr Connect 2016;5:G7 · Payne RB. BMJ 1973 · Dickerson RN. JPEN 2004;28:133 · Özdemir E. PLoS One 2026;21:e0354233</RefLine>
      <Disclaimer />
    </>
  );
}

function CaTheory() {
  return (
    <Accordion title="📖 Teori & Referensi: Koreksi Kalsium">
      <Bullets items={[
        <><strong>Kalsium:</strong> Ca terkoreksi = Ca + 0.8 × (4.0 − albumin) — hanya perkiraan; gunakan Ca ion bila ada. Berat = &lt;1.9 mmol/L (7.6 mg/dL) dan/atau bergejala → Ca glukonat 10% 10–20 mL/10 menit lalu infus 100 mL/1 L @50–100 mL/jam; koreksi Mg. Hiperkalsemia: NaCl 0.9% 4–6 L/24 jam → bisfosfonat IV; diuretik loop hanya bila overload. <em>(SfE 2016)</em></>,
      ]} />
      <div style={{ marginTop: 10 }}>
        <SmallText italic>📚 Turner J, et al. Endocr Connect 2016;5:G7 · Walsh J, et al. Endocr Connect 2016;5:G9 · Dickerson RN. JPEN 2004;28:133 · Özdemir E. PLoS One 2026;21:e0354233</SmallText>
      </div>
    </Accordion>
  );
}
