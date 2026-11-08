import { useState } from 'react';
import { Accordion, Disclaimer, type CalcStep } from '../../../components/clinical';
import {
  hypoKSeverity, kDeficitRange, kclEmpiricPlan, kProtocol24h, K_DEFICIT_FACTOR, kAtNormalPh, hyperKSeverity, K_RISE_PER_20_MEQ, glucoseMgdlToMmol,
} from '../../../lib/electrolytes';
import { weightPlausibilityWarning, rangeWarning } from '../../../lib/validation';
import {
  InputPanel, FieldRow, NumField, SelectField, TargetField, ToggleList, useToggleSet, CalcButton, StrategyFlow, InfoBox, WarnTitle, RefLine,
  Card, Eyebrow, BigNumber, SmallText, MiniBoxes, Steps, SectionTitle, Bullets, InputWarning, ResultStack, fmt, type FlowStep,
} from './ElektroUI';

/* Koreksi Kalium — port dari ICU Helper (ElektroKalium.tsx, versi final teraudit).
   Angka & rumus identik; logika murni di src/lib/electrolytes.ts. */

const K_HYPO_CTX = ['Perubahan EKG / aritmia', 'Gejala (lemah otot, paralisis, ileus)', 'Tidak bisa oral (muntah/NPO)', 'Gangguan ginjal berat / dialisis', 'Mendapat digoksin'];
const K_HYPER_CTX = ['Perubahan EKG (QRS lebar, bradikardia, ritme junctional, T tinggi)', 'Gangguan ginjal berat (AKI / CKD 4–5)', 'Curiga pseudohiperkalemia (hemolisis / hanya dari VBG)'];

const K_TARGETS = [
  { value: '3.5', label: 'Batas bawah normal', note: 'Rentang normal K serum 3.5–5.0 mEq/L (Kardalas 2018).' },
  { value: '3.6', label: 'Pasca-CABG', note: 'TIGHT-K (JAMA 2024, n=1690): suplementasi hanya bila K <3.6 non-inferior dibanding mempertahankan ≥4.5 untuk mencegah AF pasca-CABG — tanpa beda aritmia lain maupun mortalitas.' },
  { value: '4.0', label: 'Umum · IMA', note: 'IMA: mortalitas terendah pada K 3.5–<4.5; pada 4.5–<5.0 mortalitas ±2× (Goyal, JAMA 2012). Target 4.0 berada di tengah rentang aman.' },
];

const K_MAINT_OPTIONS = [
  { value: '1', label: 'NICE CG174', note: 'Rumatan ±1 mmol/kg/hari bila kebutuhan dipenuhi dari cairan IV (NICE CG174). Obesitas → pakai BB ideal. Pedoman ini tidak mencakup penyakit ginjal/hati berat.' },
  { value: '0', label: 'Sudah makan / nutrisi ber-K', note: 'Pasien makan atau mendapat nutrisi enteral/parenteral berisi K: rumatan sudah terpenuhi — hitung defisit saja.' },
];

function useKaliumState() {
  const [target, setTarget] = useState('4.0');
  const [access, setAccess] = useState<'perifer' | 'sentral'>('perifer');
  const [ctx, toggleCtx] = useToggleSet();
  const [maint, setMaint] = useState('1');     // protokol 24 jam: rumatan mEq/kg/hari
  return { target, setTarget, access, setAccess, ctx, toggleCtx, maint, setMaint };
}
type KaliumState = ReturnType<typeof useKaliumState>;

/** Baris input tambahan (ditampilkan sesuai nilai K: hipo atau hiper). */
function KaliumInputs({ s, k }: { s: KaliumState; k: string }) {
  const kv = parseFloat(k);
  if (isNaN(kv)) return null;
  if (kv < 3.5) {
    return (
      <>
        <TargetField label="Target K" sub="ketik atau pilih rujukan" value={s.target} onChange={s.setTarget} unit="mEq/L" step="0.1" options={K_TARGETS} />
        <TargetField label="Rumatan K" sub="kebutuhan harian" value={s.maint} onChange={s.setMaint} unit="mEq/kg" step="0.1" options={K_MAINT_OPTIONS} />
        <FieldRow label="Akses IV">
          <SelectField<'perifer' | 'sentral'> value={s.access} onChange={s.setAccess} options={[{ value: 'perifer', label: 'Vena perifer' }, { value: 'sentral', label: 'Vena sentral (CVC)' }]} />
        </FieldRow>
        <ToggleList title="Konteks Klinis" hint="Menentukan rute (oral vs IV) dan tingkat kehati-hatian." items={K_HYPO_CTX} selected={s.ctx} onToggle={s.toggleCtx} tone="amber" />
      </>
    );
  }
  if (kv > 5.0) {
    return <ToggleList title="Konteks Klinis" hint="Perubahan EKG menentukan perlu-tidaknya Ca IV; fungsi ginjal menentukan dosis insulin." items={K_HYPER_CTX} selected={s.ctx} onToggle={s.toggleCtx} tone="red" />;
  }
  return null;
}

export function KaliumCalc() {
  const [bw, setBw] = useState('');
  const [k, setK] = useState('');
  const [ph, setPh] = useState('');
  const [gds, setGds] = useState('');
  const [shown, setShown] = useState(false);
  const s = useKaliumState();

  return (
    <div>
      <InputPanel>
        <FieldRow label="Berat Badan"><NumField value={bw} onChange={setBw} placeholder="70" unit="kg" /></FieldRow>
        <FieldRow label="K Serum"><NumField value={k} onChange={setK} placeholder="3.5" unit="mEq/L" step="0.1" /></FieldRow>
        <FieldRow label="pH Arteri" sub="opsional"><NumField value={ph} onChange={setPh} placeholder="Opsional" unit="" step="0.01" /></FieldRow>
        <FieldRow label="GDS Pre-Koreksi" sub="opsional, untuk hiperkalemia"><NumField value={gds} onChange={setGds} placeholder="Opsional" unit="mg/dL" step="1" /></FieldRow>
        <KaliumInputs s={s} k={k} />
      </InputPanel>
      <CalcButton onClick={() => setShown(true)} tone="red" />
      {shown && (
        <ResultStack>
          <InputWarning messages={[weightPlausibilityWarning(parseFloat(bw)), rangeWarning(parseFloat(k), 1.5, 9, 'K', ' mEq/L')]} />
          <KaliumResult s={s} k={k} ph={ph} gds={gds} bw={bw} />
        </ResultStack>
      )}
      {/* Teori & Referensi selalu tampil (seperti ICU Helper), tidak menunggu "Hitung Koreksi" */}
      <div style={{ marginTop: 16 }}><KTheory /></div>
    </div>
  );
}

function KaliumResult({ s, k, ph, gds, bw }: { s: KaliumState; k: string; ph: string; gds: string; bw: string }) {
  const kv = parseFloat(k);
  const pv = parseFloat(ph);
  const w = parseFloat(bw);
  if (!(kv > 0)) return <InfoBox>Isi K serum untuk menghitung.</InfoBox>;
  const hasPh = pv > 6.5 && pv < 8;
  const kNorm = hasPh ? kAtNormalPh(kv, pv) : NaN;

  if (kv >= 3.5 && kv <= 5.0) {
    return (
      <InfoBox tone="emerald" title="✅ K dalam rentang normal (3.5–5.0 mEq/L)">
        Tidak perlu koreksi. Pasca-CABG, suplementasi rutin untuk mengejar K ≥4.5 tidak bermanfaat (TIGHT-K 2024).
      </InfoBox>
    );
  }

  return kv < 3.5
    ? <HypoK s={s} kv={kv} pv={pv} hasPh={hasPh} kNorm={kNorm} w={w} />
    : <HyperK s={s} kv={kv} pv={pv} hasPh={hasPh} kNorm={kNorm} gds={gds} />;
}

function HypoK({ s, kv, pv, hasPh, kNorm, w }: { s: KaliumState; kv: number; pv: number; hasPh: boolean; kNorm: number; w: number }) {
  const sev = hypoKSeverity(kv);
  const ecg = s.ctx.has(K_HYPO_CTX[0]);
  const symp = s.ctx.has(K_HYPO_CTX[1]);
  const noOral = s.ctx.has(K_HYPO_CTX[2]);
  const renal = s.ctx.has(K_HYPO_CTX[3]);
  const digoxin = s.ctx.has(K_HYPO_CTX[4]);

  const tParsed = parseFloat(s.target);
  const tgt = tParsed >= 3 && tParsed <= 5.5 ? tParsed : 4.0;
  const targetInvalid = !(tParsed >= 3 && tParsed <= 5.5);

  const ivReasons: string[] = [];
  if (sev === 'berat') ivReasons.push('K <2.5');
  if (ecg) ivReasons.push('perubahan EKG/aritmia');
  if (symp) ivReasons.push('bergejala');
  if (noOral) ivReasons.push('tidak bisa oral');
  const iv = ivReasons.length > 0;

  const plan = kclEmpiricPlan(kv, tgt);
  const def = kDeficitRange(kv, tgt, w);
  const sessionCap = renal ? 20 : 40;
  const sessionMeq = Math.min(plan.totalMeq, sessionCap);
  const rateMax = s.access === 'sentral' ? 20 : 10;
  const hours = sessionMeq / rateMax;
  const kAfter = kv + (sessionMeq / 20) * K_RISE_PER_20_MEQ;
  const remaining = Math.max(0, plan.totalMeq - sessionMeq);
  const tablets = Math.ceil(sessionMeq / 8);

  // Protokol 24 jam (defisit faktor × ΔK × BB + rumatan harian)
  const factor = K_DEFICIT_FACTOR;
  const mParsed = parseFloat(s.maint);
  const maintPerKg = mParsed >= 0 && mParsed <= 3 ? mParsed : 1;
  const ext = w > 0 ? kProtocol24h(kv, tgt, w, factor, maintPerKg) : null;
  const protoTooSlow = sev === 'berat' || ecg || symp;
  const hasW = w > 0;

  // ① Langkah dasar: dari input → defisit K → kebutuhan 24 jam
  const basicSteps: CalcStep[] = [];
  if (hasPh) {
    basicSteps.push({
      label: 'Langkah 0 — Pengaruh pH terhadap K (pergeseran transseluler):',
      formula: `K pada pH 7.40 ≈ K − ((7.40 − pH) ÷ 0.1) × 0.6\n= ${kv} − ((7.40 − ${pv}) ÷ 0.1) × 0.6 = ${fmt(kNorm, 2)} mEq/L`,
      note: pv < 7.35
        ? 'Asidosis: K serum "tertolong" oleh perpindahan K keluar sel — defisit sebenarnya LEBIH besar, dan K akan turun lagi saat asidosis dikoreksi.'
        : pv > 7.45 ? 'Alkalosis memindahkan K ke dalam sel; koreksi alkalosis akan ikut menaikkan K.' : 'pH normal — pergeseran transseluler minimal.',
    });
  }
  basicSteps.push({ label: 'Langkah 1 — Selisih ke target:', formula: `ΔK = K target − K aktual = ${tgt} − ${kv} = ${fmt(plan.delta, 2)} mEq/L` });
  if (ext) {
    basicSteps.push(
      { label: 'Langkah 2 — Defisit K:', formula: `Defisit = faktor × ΔK × BB\n= ${factor} × ${fmt(ext.delta, 2)} × ${w} = ${fmt(ext.deficit, 1)} mEq`, note: `Faktor ${factor} × BB (${fmt(factor * w, 0)} L) kira-kira ruang ekstrasel — rumus ini "mengisi" cairan di luar sel ke target.` },
      { label: 'Langkah 3 — Kebutuhan rumatan harian:', formula: `Rumatan = ${maintPerKg} mEq/kg/hari × ${w} kg = ${fmt(ext.maint, 0)} mEq/hari`, note: maintPerKg > 0 ? 'Kebutuhan normal harian bila asupan K hanya dari cairan IV (NICE CG174). Obesitas → BB ideal.' : 'Rumatan 0: pasien makan / nutrisi sudah mengandung K.' },
      { label: 'Langkah 4 — Total kebutuhan K 24 jam:', formula: `Total = defisit + rumatan = ${fmt(ext.deficit, 1)} + ${fmt(ext.maint, 0)} = ${fmt(ext.raw, 1)} mEq / 24 jam` },
    );
  }
  basicSteps.push({
    label: `Langkah ${ext ? 5 : 2} — Konteks: defisit K total tubuh:`,
    formula: `≈ ΔK × (200–400 mEq) × (BB ÷ 70)\n= ${fmt(plan.delta, 2)} × (200–400) × (${hasW ? w : 70} ÷ 70) = ${fmt(def.lo, 0)}–${fmt(def.hi, 0)} mEq`,
    note: '±98% K ada di dalam sel; K serum hanya "jendela kecil". Cadangan ini jauh lebih besar dari defisit Langkah 2 — itulah sebabnya koreksi diulang beberapa hari dengan K serial, bukan sekali (Kardalas 2018).',
  });

  // ② Koreksi per sesi (empiris ICU)
  const sessionSteps: CalcStep[] = [
    {
      label: 'Langkah S1 — Rencana empiris KCl:',
      formula: `Jumlah infus @20 mEq = ⌈ΔK ÷ 0.25⌉ = ⌈${fmt(plan.delta, 2)} ÷ 0.25⌉ = ${plan.doses20}\nTotal ≈ ${plan.doses20} × 20 = ${plan.totalMeq} mEq`,
      note: 'Pada pasien ICU, tiap 20 mEq KCl IV menaikkan K rata-rata 0.25 mmol/L (Kruse & Carlson 1990). Respons individual bervariasi — selalu cek ulang.',
    },
    {
      label: `Langkah S2 — Sesi 1 (${iv ? 'IV' : 'oral'}):`,
      formula: iv
        ? `Dosis sesi = min(total, ${sessionCap}) = ${sessionMeq} mEq\nLaju maks ${s.access} = ${rateMax} mEq/jam → durasi ≥ ${sessionMeq} ÷ ${rateMax} = ${fmt(hours, 1)} jam\nVolume KCl 7.46% (1 mEq/mL) = ${sessionMeq} mL\nPrediksi K setelah sesi ≈ ${kv} + (${sessionMeq} ÷ 20) × 0.25 = ${fmt(kAfter, 2)} mEq/L`
        : `Dosis sesi = ${sessionMeq} mEq ≈ ${tablets} tablet KSR 600 mg (8 mEq/tablet), dosis terbagi\nPrediksi K ≈ ${fmt(kAfter, 2)} mEq/L (aturan IV, untuk oral hanya kasar)`,
      note: renal ? 'Gangguan ginjal berat: sesi dibatasi 20 mEq — K diganti sangat hati-hati dan libatkan tim renal (Kardalas 2018).' : undefined,
    },
  ];

  const flow: FlowStep[] = [
    { title: 'Konfirmasi & rekam EKG', body: <>EKG dianjurkan untuk <strong>semua</strong> pasien hipokalemia (ST depresi, T datar, gelombang U, aritmia).{digoxin && <strong> Pasien digoksin: risiko aritmia lebih tinggi — monitor EKG kontinu.</strong>}</>, state: ecg || digoxin ? 'now' : 'todo' },
    { title: 'Cari & hentikan penyebab', body: 'Diuretik, muntah/NGT, diare, insulin/β-agonis (pergeseran ke sel), alkalosis. Tanpa ini K akan turun lagi.' },
    { title: 'Periksa & koreksi Magnesium', body: '>50% hipokalemia bermakna disertai defisiensi Mg; hipokalemia refrakter tidak akan terkoreksi sebelum Mg dikoreksi (Kardalas 2018). Gunakan kalkulator Koreksi Magnesium.' },
    { title: ext ? `Hitung dasar: defisit ${fmt(ext.deficit, 0)} + rumatan ${fmt(ext.maint, 0)} = ${fmt(ext.raw, 0)} mEq/24 jam` : 'Hitung dasar: isi BB', body: 'Lihat ① Hasil Dasar — angka ini menjadi pegangan sebelum memilih cara pemberian.', state: 'now' },
    { title: `Rute: ${iv ? 'INTRAVENA' : 'ORAL'}`, body: iv ? <>Alasan IV: {ivReasons.join(', ')}. Pada K &lt;2.5 / bergejala: monitor EKG kontinu & K serial.</> : 'K 2.5–3.4 tanpa gejala/EKG & bisa minum: oral cukup dan lebih aman (Kardalas 2018). Minum dengan 100–250 mL air, bersama/setelah makan.', state: 'now' },
    { title: protoTooSlow ? `Koreksi per sesi dulu: ${sessionMeq} mEq` : ext ? `Pilih cara pemberian: protokol ${ext.rounded} mEq/24 jam atau per sesi` : `Beri sesi 1: ${sessionMeq} mEq`, body: protoTooSlow ? <>Pasien ini ({sev === 'berat' ? 'K <2.5' : ecg ? 'EKG berubah' : 'bergejala'}) perlu koreksi aktif per sesi dengan monitor EKG; protokol 24 jam menyusul setelah keluar zona bahaya.</> : <>KCl dalam <strong>NaCl 0.9%</strong> (bukan dekstrosa — glukosa memicu insulin & menggeser K ke sel). Protokol 24 jam ≈{ext ? fmt(ext.ratePerHr, 1) : '–'} mEq/jam, atau per sesi ≤{rateMax} mEq/jam ({s.access}).</>, state: 'now' },
    { title: 'Cek ulang K → ulangi sampai target', body: 'Cek K minimal harian (lebih sering bila K <2.5 atau koreksi per sesi), lalu hitung ulang dari ① dengan K terbaru — jangan berikan seluruh rencana sekaligus.' },
    { title: `Pertahankan target ${tgt} mEq/L`, body: 'Atasi penyebab; pertimbangkan diuretik hemat-K bila hipokalemia akibat diuretik dan diuretik tetap diperlukan (Kardalas 2018).' },
  ];

  return (
    <>
      {hasPh && pv < 7.35 && (
        <InfoBox tone="red" title={<WarnTitle>Hipokalemia + asidosis</WarnTitle>}>
          Koreksi asidosis (mis. NaHCO₃, insulin pada KAD) akan menurunkan K lebih jauh. Koreksi K harus mendahului atau bersamaan.
        </InfoBox>
      )}

      {/* ① HASIL DASAR */}
      <Card tone="amber">
        <Eyebrow tone="amber">① Hasil Dasar · Hipokalemia {sev} · K {kv} → target {tgt} mEq/L</Eyebrow>
        {targetInvalid && <SmallText tone="amber">Target di luar 3.0–5.5 — dipakai 4.0.</SmallText>}
        {tgt > 4.5 && <SmallText tone="amber">Target &gt;4.5 tidak terbukti bermanfaat (TIGHT-K 2024) dan pada IMA berkaitan dengan mortalitas lebih tinggi (Goyal 2012).</SmallText>}
        {!hasW ? (
          <SmallText>Isi <strong>Berat Badan</strong> untuk menghitung defisit K.</SmallText>
        ) : ext && (
          <>
            {plan.delta === 0 && <SmallText>K sudah ≥ target — defisit 0; yang tersisa hanya kebutuhan rumatan.</SmallText>}
            <BigNumber tone="amber">Defisit K: {fmt(ext.deficit, 1)} mEq</BigNumber>
            <SmallText>= {factor} × ΔK {fmt(ext.delta, 2)} × {w} kg</SmallText>
            <MiniBoxes tone="amber" boxes={[
              { title: 'Rumatan', value: `${fmt(ext.maint, 0)} mEq`, sub: 'per hari' },
              { title: 'Total 24 jam', value: `${fmt(ext.raw, 1)} mEq`, sub: 'defisit + rumatan', strong: true },
              { title: 'Defisit tubuh', value: `${fmt(def.lo, 0)}–${fmt(def.hi, 0)}`, sub: 'mEq · konteks' },
            ]} />
          </>
        )}
      </Card>

      <Steps tone="amber" title="🧮 Langkah Dasar — dari input ke defisit K" steps={basicSteps} footer="Rumus defisit adalah estimasi; tidak memperhitungkan kehilangan yang berlanjut (diuretik, diare, NGT, insulin pada KAD) — tambahkan bila ada." />

      {/* ② CARA PEMBERIAN */}
      <SectionTitle>② Cara Pemberian</SectionTitle>

      {ext && (
        <Card tone="blue">
          <SmallText tone="blue" strong>Protokol 24 jam — total kebutuhan dibulatkan ke paket</SmallText>
          <BigNumber tone="blue">KCl {ext.rounded} mEq / 24 jam</BigNumber>
          <SmallText mono>{fmt(ext.raw, 1)} mEq → paket {ext.rounded} mEq · {ext.rounded} ÷ 24 = {fmt(ext.ratePerHr, 2)} mEq/jam · {ext.rounded} mL KCl 7.46%</SmallText>
          <SmallText italic>Dibulatkan ke kelipatan 50 mEq terdekat (minimal 50) — sesuaikan dengan paket di RS. Obesitas → BB ideal untuk rumatan. Cek K minimal harian; protokol diulang dengan K terbaru.</SmallText>
          {protoTooSlow && (
            <InfoBox tone="red" title="⚠ Kemungkinan terlalu lambat untuk pasien ini">
              {sev === 'berat' ? 'K <2.5' : ecg ? 'Perubahan EKG' : 'Bergejala'}: ≈{fmt(ext.ratePerHr, 1)} mEq/jam merata 24 jam. Pedoman menganjurkan KCl IV dengan monitor EKG dan koreksi aktif per sesi sampai keluar dari zona bahaya, baru lanjut protokol harian (Kardalas 2018).
            </InfoBox>
          )}
          {renal && maintPerKg > 0 && (
            <InfoBox tone="amber" title="Gangguan ginjal berat">Rumatan 1 mEq/kg/hari berasal dari pedoman yang tidak mencakup penyakit ginjal berat (NICE CG174) — pertimbangkan rumatan 0 dan titrasi dengan K serial.</InfoBox>
          )}
        </Card>
      )}

      {plan.totalMeq > 0 && (
        <>
          <Card plain>
            <SmallText strong>Koreksi per sesi (empiris ICU){protoTooSlow ? ' — DIDAHULUKAN untuk pasien ini' : ''}</SmallText>
            <BigNumber tone="slate">Sesi 1: {sessionMeq} mEq KCl {iv ? 'IV' : 'oral'}</BigNumber>
            {iv && <SmallText>≥ {fmt(hours, 1)} jam via {s.access} (≤{rateMax} mEq/jam) · {sessionMeq} mL KCl 7.46%</SmallText>}
            {!iv && <SmallText>≈ {tablets} tablet KSR 600 mg, terbagi</SmallText>}
            <SmallText>Perkiraan total ke target: <strong>{plan.totalMeq} mEq</strong> ({plan.doses20} × 20 mEq){remaining > 0 ? ` · sisa ±${remaining} mEq setelah sesi 1, cek K dulu` : ''}</SmallText>
          </Card>
          <Steps tone="slate" title="🧮 Rincian koreksi per sesi" steps={sessionSteps} footer="Estimasi awal. Respons nyata dipengaruhi kehilangan yang berlanjut, pergeseran transseluler, Mg, dan fungsi ginjal — titrasi dengan K serial." />
        </>
      )}

      {ext && plan.totalMeq > 0 && (
        <Steps tone="blue" title="⚖️ Mengapa angkanya berbeda?" steps={[
          { label: 'Tiga angka, tiga arti:', formula: `Defisit K (faktor ${factor})   : ${fmt(ext.deficit, 0)} mEq — mengisi ruang ekstrasel\nTotal 24 jam / protokol    : ${fmt(ext.raw, 0)} → ${ext.rounded} mEq (+ rumatan), ≈${fmt(ext.ratePerHr, 1)} mEq/jam\nEmpiris ICU (per sesi)     : ${plan.totalMeq} mEq untuk menaikkan K ke ${tgt}, ≤${rateMax} mEq/jam\nDefisit tubuh total        : ${fmt(def.lo, 0)}–${fmt(def.hi, 0)} mEq — cadangan intrasel, dikejar beberapa hari`, note: 'Defisit rumus kecil karena hanya ruang ekstrasel, tetapi rumatan membuat total harian mendekati angka empiris. Bedanya pada KECEPATAN: protokol merata 24 jam, per sesi cepat dengan monitor. Untuk ringan–sedang keduanya wajar; untuk K <2.5/EKG berubah/bergejala, protokol saja terlalu lambat.' },
        ]} footer="Data ICU: kenaikan K setelah 20–80 mEq IV sangat bervariasi antar-pasien (rata-rata +0.27 pada hipokalemia ringan, +0.45 pada sedang; Frenkel 2021) — yang menentukan adalah K serial." />
      )}

      <StrategyFlow steps={flow} />

      <Accordion title="📖 Dasar rujukan hipokalemia">
        <Bullets items={[
          'Berat/mengancam jiwa: K <2.5; 2.5–3.5 sering cukup oral; <2.5 → IV dengan monitor EKG kontinu & K serial; IV juga bila mual/muntah berat (Kardalas 2018).',
          'Tiap penurunan 1 mEq/L ≈ defisit 200–400 mEq — bisa meleset ke dua arah (Kardalas 2018).',
          '495 set infus KCl 20 mEq/100 mL NaCl di ICU: rata-rata +0.25 mmol/L per 20 mEq, laju 20 mEq/jam via vena sentral maupun perifer tanpa aritmia mengancam (Kruse & Carlson 1990). Banyak protokol RS tetap membatasi perifer ≤10 mEq/jam.',
          'Pelarut NaCl 0.9%, bukan dekstrosa 5% (Kardalas 2018).',
          <><strong>Rumus "faktor × ΔK × BB"</strong> (faktor 0.4) hanya memperkirakan ruang ekstrasel — tidak menggambarkan defisit total & tidak menghitung kehilangan berlanjut (GlobalRPh; materi kasus NEJM 2015). Dipakai sebagai rencana harian yang diulang dengan K serial.</>,
          <><strong>Rumatan</strong> ±1 mmol/kg/hari K bila kebutuhan dari cairan IV; obesitas → BB ideal; dibulatkan ke sediaan yang tersedia (NICE CG174).</>,
          'Respons ICU sangat bervariasi: rata-rata +0.27 (ringan) dan +0.45 mEq/L (sedang) setelah 20–80 mEq IV; kenaikan lebih besar pada kreatinin tinggi (Frenkel 2021, n=683).',
        ]} />
      </Accordion>

      <RefLine>Kardalas E. Endocr Connect 2018;7:R135 · Kruse JA, Carlson RW. Arch Intern Med 1990;150:613 · O'Brien B. JAMA 2024;332:979 (TIGHT-K) · Goyal A. JAMA 2012;307:157 · Frenkel A. J Clin Med 2021;10:1986 · NICE CG174 (2013, upd. 2017) · Gumz ML. NEJM 2015;373:60 · Adrogué HJ, Madias NE. Am J Med 1981;71:456</RefLine>
      <Disclaimer />
    </>
  );
}

function HyperK({ s, kv, pv, hasPh, kNorm, gds }: { s: KaliumState; kv: number; pv: number; hasPh: boolean; kNorm: number; gds: string }) {
  const sev = hyperKSeverity(kv);
  const ecg = s.ctx.has(K_HYPER_CTX[0]);
  const renal = s.ctx.has(K_HYPER_CTX[1]);
  const pseudo = s.ctx.has(K_HYPER_CTX[2]);
  const gv = parseFloat(gds);
  const hasG = gv > 0;
  const gMmol = hasG ? glucoseMgdlToMmol(gv) : NaN;

  const caIndicated = ecg || kv >= 6.5;
  const shiftIndicated = kv >= 6.0;
  const insulinU = renal ? 5 : 10;
  const skipDextroseBolus = hasG && gMmol > 14;
  const needFollowOn = hasG && gMmol < 7;
  const sevLabel = { batas: 'di atas normal (5.0–5.4)', ringan: 'ringan (5.5–5.9)', sedang: 'sedang (6.0–6.4)', berat: 'BERAT (≥6.5)' }[sev];
  const danger = sev === 'berat' || ecg;

  const steps: CalcStep[] = [];
  if (hasPh) {
    steps.push({
      label: 'Langkah 0 — Pengaruh pH:',
      formula: `K pada pH 7.40 ≈ ${kv} − ((7.40 − ${pv}) ÷ 0.1) × 0.6 = ${fmt(kNorm, 2)} mEq/L`,
      note: 'Rata-rata kasar (rentang 0.2–1.7 per 0.1 pH), terutama pada asidosis mineral; pada asidosis laktat/keto efeknya kecil (Adrogué & Madias 1981).',
    });
  }
  steps.push({ label: 'Langkah 1 — Klasifikasi:', formula: `K ${kv} → ${sevLabel}${ecg ? ' + perubahan EKG' : ''}`, note: 'EKG 12 sandapan bila K ≥6.0; monitor jantung kontinu bila K ≥6.5 atau EKG abnormal. Hingga separuh pasien hiperkalemia berat EKG-nya normal (Ford 2026).' });
  if (caIndicated) {
    steps.push({ label: 'Langkah 2 — Kalsium IV:', formula: 'Ca glukonat 10% 30 mL = 30 × 0.22 = 6.6 mmol Ca elemental, IV 5–10 menit\n(setara Ca klorida 10% 10 mL = 6.8 mmol — vena sentral/henti jantung)', note: 'Dosis lama 10 mL (2.2 mmol) sering tidak cukup; dapat diulang sekali setelah 10 menit bila EKG belum membaik. Efek 30–60 menit.' });
  }
  if (shiftIndicated) {
    steps.push({
      label: 'Langkah 3 — Insulin + dekstrosa:',
      formula: `Insulin reguler ${insulinU} unit IV${renal ? ' (dosis rendah: gangguan ginjal berat)' : ''}\nDekstrosa 25 g = D50% 50 mL = D40% 62.5 mL\n${hasG ? `GDS ${gv} mg/dL ÷ 18 = ${fmt(gMmol, 1)} mmol/L → ${skipDextroseBolus ? '>14: bolus dekstrosa boleh ditiadakan' : needFollowOn ? '<7: WAJIB lanjut D10% 50 mL/jam × 5 jam (= 250 mL = 25 g)' : '7–14: bolus 25 g saja'}` : 'Isi GDS untuk menentukan perlu-tidaknya infus D10% lanjutan'}\nPerkiraan K setelah insulin ≈ ${kv} − (0.65–1.4) = ${fmt(kv - 1.4, 1)}–${fmt(kv - 0.65, 1)} mEq/L`,
      note: 'Hipoglikemia terjadi hingga 30% (median 2 jam pasca-insulin); prediktor terkuat GDS awal <7 mmol/L (126 mg/dL) (Ford 2026).',
    });
    steps.push({ label: 'Langkah 4 — Salbutamol nebulisasi:', formula: `10–20 mg nebul → K turun 0.53–0.98 mEq/L\nPerkiraan setelah insulin + salbutamol ≈ ${fmt(kv - 1.4 - 0.98, 1)}–${fmt(kv - 0.65 - 0.53, 1)} mEq/L (sinergis, kasar)`, note: 'Onset <30 menit, puncak 90–120 menit. Hingga 40% pasien HD resisten; berkurang dengan β-bloker non-selektif.' });
  }

  const flow: FlowStep[] = [
    { title: 'Verifikasi: hiperkalemia sejati?', body: <>Hemolisis sampel, leukositosis/trombositosis berat → pseudohiperkalemia. K VBG biasanya 0.2–0.3 lebih rendah dari serum lab. Konfirmasi dengan sampel lab kecuali EKG berubah/tidak stabil.{pseudo && <strong> Anda menandai curiga pseudohiperkalemia — ulang sampel sebelum terapi bila pasien stabil & EKG normal.</strong>}</>, state: pseudo ? 'now' : 'todo' },
    { title: 'Lindungi jantung — Ca glukonat 10% 30 mL IV', body: caIndicated ? <>{ecg ? 'Ada perubahan EKG → prioritas pertama.' : 'K ≥6.5 → pertimbangkan meski EKG normal (Geldermann 2026).'} 5–10 menit via vena besar; ulang sekali setelah 10 menit bila EKG persisten. Henti jantung / vena sentral: Ca klorida 10% 10 mL.</> : 'Tidak diindikasikan: EKG normal dan K <6.5.', state: caIndicated ? 'now' : 'skip' },
    { title: 'Geser K ke dalam sel', body: shiftIndicated ? <>Insulin {insulinU} U + dekstrosa 25 g{needFollowOn ? ' + D10% 50 mL/jam × 5 jam' : ''}; tambah salbutamol nebul 10–20 mg. NaHCO₃ hanya sebagai tambahan bila ada asidosis metabolik (bukan laktat/keto){hasPh && pv < 7.35 ? ` — pH ${pv}` : ''}.</> : 'K <6.0: umumnya cukup konservatif (atasi penyebab, hentikan obat/asupan K) (Ford 2026).', state: shiftIndicated ? 'now' : 'skip' },
    { title: 'Keluarkan K dari tubuh', body: <>Hentikan obat pemicu (ACEi/ARB, MRA, NSAID, trimetoprim, diuretik hemat-K, suplemen K). Diuretik loop bila overload & ginjal merespons. Binder oral <strong>bukan</strong> terapi akut (onset lambat; polistiren sulfonat tidak dianjurkan). <strong>Dialisis</strong> bila refrakter, ESKD, atau AKI oligurik{renal ? ' — relevan pada pasien ini' : ''}.</>, state: renal ? 'now' : 'todo' },
    { title: 'Pantau & cegah rebound', body: <>K ulang <strong>1–2 jam</strong> (efek terapi), <strong>2–4 jam</strong> (rebound), dan 24 jam. {shiftIndicated && <>GDS tiap <strong>30 menit selama 2 jam, lalu tiap jam ≥6 jam</strong> (reset bila insulin diulang).</>}</> },
    { title: 'Cegah kambuh — target K <5.5', body: 'RAAS-i dapat dilanjutkan kembali bertahap setelah K <5.5 bila manfaatnya (gagal jantung, CKD proteinurik) lebih besar (Ford 2026).' },
  ];

  return (
    <>
      <Card tone={danger ? 'red' : 'amber'}>
        <Eyebrow tone={danger ? 'red' : 'amber'}>Hiperkalemia {sevLabel}{ecg ? ' · EKG berubah' : ''}</Eyebrow>
        <BigNumber tone="slate">K {kv} mEq/L</BigNumber>
        <SmallText>
          {caIndicated ? 'Ca IV → ' : ''}{shiftIndicated ? `insulin ${insulinU} U + dekstrosa 25 g + salbutamol → ` : 'konservatif → '}keluarkan K → pantau K 1–2 j & 2–4 j.
        </SmallText>
      </Card>

      <StrategyFlow steps={flow} />
      <Steps tone="red" steps={steps} footer="Insulin & salbutamol hanya MENGGESER K sementara — rebound sering terjadi; rencana pengeluaran K & penanganan penyebab tetap wajib." />

      <Accordion title="⏱ Alternatif ICU — Infus Insulin Kontinu">
        <Bullets items={[
          <><strong>Indikasi:</strong> K 5.5-6.5 tanpa perubahan EKG, mempertahankan efek pasca-bolus, hiperK perioperatif.</>,
          <><strong>Preparasi:</strong> Insulin Regular 50 IU + NaCl 0.9% 48 mL = 1 IU/mL.</>,
          <><strong>Rate:</strong> 1.5–2 mL/jam (= 1.5–2 IU/jam) selama 6 jam.</>,
          <><strong>Pairing Glukosa:</strong> D10% 50–100 mL/jam berjalan bersamaan (jika puasa), atau cek GDS ketat tiap 1-2 jam (jika sudah ada asupan).</>,
          <><strong>Stop:</strong> Jika K &lt;4.5 atau GDS &lt;100 mg/dL.</>,
          <em>📚 Dépret F. Ann Intensive Care 2019;9:32</em>,
        ]} />
      </Accordion>

      <Accordion title="📖 Dasar rujukan & pembaruan bukti hiperkalemia">
        <Bullets items={[
          <><strong>Ca IV:</strong> standar perawatan, tetapi berbasis konsensus; meta-analisis ILCOR 2025 tidak menemukan bukti kuat manfaat klinis. Mekanismenya kini dipahami sebagai pemulihan kecepatan konduksi (kanal Ca tipe-L), bukan "stabilisasi membran". Dosis terkini 30 mL Ca glukonat 10% (Ford 2026; Jessen 2025).</>,
          <><strong>Insulin-dekstrosa & salbutamol:</strong> menurunkan K rata-rata 0.7–1.2 mmol/L (Jessen 2025). Pertimbangkan insulin 5 U pada gangguan ginjal berat.</>,
          <><strong>NaHCO₃:</strong> tidak ada bukti kuat menurunkan K → tidak rutin; hanya tambahan bila asidosis metabolik (Jessen 2025; Ford 2026).</>,
          <><strong>Klasifikasi</strong> 5.5–5.9 / 6.0–6.4 / ≥6.5 mengikuti pedoman UK Kidney Association; K &lt;6 umumnya ditangani konservatif.</>,
        ]} />
      </Accordion>

      <RefLine>Ford S, et al. Aust Prescr 2026;49:194 · Jessen MK, et al. Resuscitation 2025;208:110489 · Geldermann N, et al. Emerg Med J 2026;43:305 · UK Kidney Association Hyperkalaemia Guideline 2023 · Adrogué HJ, Madias NE. Am J Med 1981;71:456</RefLine>
      <Disclaimer />
    </>
  );
}

/** Teori & Referensi kalium (dari halaman Koreksi Elektrolit ICU Helper). */
function KTheory() {
  return (
    <Accordion title="📖 Teori & Referensi: Koreksi Kalium">
      <Bullets items={[
        <><strong>Kalium — hipokalemia:</strong> Berat &lt;2.5 mEq/L. Tiap turun 1 mEq/L ≈ defisit 200–400 mEq (gambaran, bisa meleset). K 2.5–3.4 tanpa gejala/EKG → oral; &lt;2.5, bergejala, EKG berubah, atau tidak bisa oral → IV dengan monitor EKG. Empiris di ICU: 20 mEq KCl ≈ +0.25 mmol/L. Pelarut NaCl 0.9% (bukan dekstrosa). Koreksi Mg bersamaan. Target: rentang normal 3.5–5.0; IMA mortalitas terendah 3.5–&lt;4.5; pasca-CABG suplementasi hanya bila &lt;3.6. <em>(Kardalas 2018; Kruse 1990; Goyal 2012; TIGHT-K 2024)</em></>,
        <><strong>Kalium — hiperkalemia:</strong> Verifikasi (pseudohiperkalemia) → Ca glukonat 10% <strong>30 mL</strong> bila EKG berubah/K ≥6.5 → insulin 10 U (5 U pada gangguan ginjal berat) + dekstrosa 25 g (+ D10% 50 mL/jam × 5 jam bila GDS &lt;7 mmol/L) + salbutamol 10–20 mg nebul → keluarkan K (dialisis bila refrakter) → pantau K 1–2 j & 2–4 j, GDS tiap 30 mnt × 2 j lalu tiap jam ≥6 j. NaHCO₃ dan binder oral bukan terapi akut rutin. <em>(Ford 2026; Jessen 2025)</em></>,
      ]} />
      <div style={{ marginTop: 10 }}>
        <SmallText italic>📚 Kardalas E, et al. Endocr Connect 2018;7:R135 · Kruse JA, Carlson RW. Arch Intern Med 1990;150:613 · Goyal A, et al. JAMA 2012;307:157 · O'Brien B, et al. JAMA 2024;332:979 · Ford S, et al. Aust Prescr 2026;49:194 · Jessen MK, et al. Resuscitation 2025;208:110489.</SmallText>
      </div>
    </Accordion>
  );
}
