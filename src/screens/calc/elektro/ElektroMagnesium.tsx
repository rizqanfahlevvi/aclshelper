import { useState } from 'react';
import { Accordion, Disclaimer, type CalcStep } from '../../../components/clinical';
import { mgMgdlToMeq, mgMgdlToMmol, mgso4DoseToTarget, mgInfusionHours, mgInfusionAfterBolus, MEQ_PER_G_MGSO4, MG_RISE_MEQ_PER_G } from '../../../lib/electrolytes';
import { weightPlausibilityWarning, rangeWarning } from '../../../lib/validation';
import {
  InputPanel, FieldRow, NumField, TargetField, ToggleList, useToggleSet, CalcButton, StrategyFlow, InfoBox, RefLine,
  Card, Eyebrow, BigNumber, SmallText, MiniBoxes, Steps, SectionTitle, Bullets, InputWarning, ResultStack, fmt, type FlowStep,
} from './ElektroUI';

/* Koreksi Magnesium — port dari ICU Helper (ElektroMagnesium.tsx, versi final teraudit).
   Angka & rumus identik; logika murni di src/lib/electrolytes.ts. */

const MG_SX = ['Aritmia / torsades / hemodinamik tidak stabil', 'Kejang / tetani', 'Hipokalemia atau hipokalsemia refrakter'];
const MG_TARGETS = [
  { value: '1.8', label: 'Batas bawah normal', note: 'Rentang normal ±1.8–2.3 mg/dL (= 1.5–1.9 mEq/L; Hansen 2018). Rentang lab bervariasi.' },
  { value: '2.0', label: 'Tengah rentang normal', note: 'Di tengah rentang normal; memberi ruang bila Mg turun lagi akibat kehilangan yang berlanjut.' },
];

function useMagnesiumState() {
  const [target, setTarget] = useState('2.0');
  const [sx, toggleSx] = useToggleSet();
  return { target, setTarget, sx, toggleSx };
}
type MagnesiumState = ReturnType<typeof useMagnesiumState>;

function MagnesiumInputs({ s, mg }: { s: MagnesiumState; mg: string }) {
  const mv = parseFloat(mg);
  if (!(mv > 0) || mv > 2.6) return null;
  return (
    <>
      <TargetField label="Target Mg" sub="ketik atau pilih rujukan" value={s.target} onChange={s.setTarget} unit="mg/dL" step="0.1" options={MG_TARGETS} />
      <ToggleList title="Gejala / Konteks" hint="Gejala bermakna → jalur IV meski Mg tidak terlalu rendah." items={MG_SX} selected={s.sx} onToggle={s.toggleSx} tone="red" />
    </>
  );
}

export function MagnesiumCalc() {
  const [bw, setBw] = useState('');
  const [mg, setMg] = useState('');
  const [egfr, setEgfr] = useState('');
  const [shown, setShown] = useState(false);
  const s = useMagnesiumState();

  return (
    <div>
      <InputPanel>
        <FieldRow label="Berat Badan" sub="untuk batas 1.5 mEq/kg"><NumField value={bw} onChange={setBw} placeholder="70" unit="kg" /></FieldRow>
        <FieldRow label="Mg Serum"><NumField value={mg} onChange={setMg} placeholder="1.7" unit="mg/dL" step="0.1" /></FieldRow>
        <FieldRow label="eGFR / CrCl" sub="opsional"><NumField value={egfr} onChange={setEgfr} placeholder="Opsional" unit="mL/min" step="1" /></FieldRow>
        <MagnesiumInputs s={s} mg={mg} />
      </InputPanel>
      <CalcButton onClick={() => setShown(true)} tone="emerald" />
      {shown && (
        <ResultStack>
          <InputWarning messages={[weightPlausibilityWarning(parseFloat(bw)), rangeWarning(parseFloat(mg), 0.5, 6, 'Mg', ' mg/dL')]} />
          <MagnesiumResult s={s} mg={mg} egfr={egfr} bw={bw} />
          <MgTheory />
        </ResultStack>
      )}
    </div>
  );
}

function MagnesiumResult({ s, mg, egfr, bw }: { s: MagnesiumState; mg: string; egfr: string; bw: string }) {
  const mv = parseFloat(mg);
  if (!(mv > 0)) return <InfoBox>Isi Mg serum untuk menghitung.</InfoBox>;
  const w = parseFloat(bw);
  const eg = parseFloat(egfr);
  const renal = eg > 0 && eg < 30;
  const meq = mgMgdlToMeq(mv);
  const mmol = mgMgdlToMmol(mv);

  const toxBox = (
    <InfoBox tone="red" title="⚠ Toksisitas Mg">
      Mg sangat tinggi (&gt;4–5 mmol/L) → kelemahan otot, depresi napas, hingga henti jantung. Antidot: Ca IV 100–200 mg elemental dalam 5–10 menit (≈ 10–20 mL Ca glukonat 10%). Pantau refleks patela & laju napas selama infus Mg (Hansen 2018).
    </InfoBox>
  );

  if (mv > 2.6) {
    return (
      <>
        <InfoBox tone="amber" title={`Mg ${mv} mg/dL — di atas rentang normal`}>Hentikan sumber Mg (infus, antasida/laksatif ber-Mg). Risiko meningkat pada gangguan ginjal.</InfoBox>
        {toxBox}
      </>
    );
  }

  const tParsed = parseFloat(s.target);
  const tgt = tParsed >= 1.5 && tParsed <= 2.6 ? tParsed : 2.0;
  const urgent = s.sx.has(MG_SX[0]);
  const symptomatic = s.sx.size > 0;
  const iv = mmol < 0.5 || symptomatic;
  const dose = mgso4DoseToTarget(mv, tgt, w);
  // Bolus darurat 2 g ikut dihitung dalam batas 1.5 mEq/kg (Hansen 2018).
  const plan = mgInfusionAfterBolus(dose.grams, dose.maxGrams, urgent, w > 0);
  const inf = plan.infusion;
  const hrs = mgInfusionHours(inf);
  const hrsText = hrs.max ? `${hrs.min}–${hrs.max}` : `>${hrs.min}`;
  const bodyDefLo = w > 0 ? 1 * w : NaN;   // defisit tubuh 1–2 mEq/kg (Hansen 2018) — konteks
  const bodyDefHi = w > 0 ? 2 * w : NaN;

  if (dose.grams === 0 && !symptomatic) {
    return (
      <InfoBox tone="emerald" title={`✅ Mg ${mv} mg/dL (${fmt(meq, 2)} mEq/L) — sudah ≥ target ${tgt}`}>
        Mg serum dapat normal walau Mg tubuh total kurang. Pada pasien berisiko dengan gejala khas, terapi tetap dapat dipertimbangkan (Hansen 2018).
      </InfoBox>
    );
  }

  // ① Langkah dasar
  const basic: CalcStep[] = [
    { label: 'Langkah 1 — Konversi satuan:', formula: `mmol/L = ${mv} × 10 ÷ 24.305 = ${fmt(mmol, 2)}\nmEq/L = mmol/L × 2 = ${fmt(meq, 2)}`, note: `Ambang IV: Mg <0.5 mmol/L (≈1.2 mg/dL) atau gejala bermakna → pasien ini: ${iv ? 'IV' : 'oral cukup'}.` },
    { label: 'Langkah 2 — Selisih ke target:', formula: `Target ${tgt} mg/dL = ${fmt(mgMgdlToMeq(tgt), 2)} mEq/L\nΔMg = ${fmt(mgMgdlToMeq(tgt), 2)} − ${fmt(meq, 2)} = ${fmt(dose.deltaMeq, 2)} mEq/L` },
    { label: 'Langkah 3 — Kebutuhan MgSO₄ (aturan empiris ICU):', formula: `1 g MgSO₄ (${MEQ_PER_G_MGSO4} mEq) ≈ +${MG_RISE_MEQ_PER_G} mEq/L\nKebutuhan = ${fmt(dose.deltaMeq, 2)} ÷ ${MG_RISE_MEQ_PER_G} = ${fmt(dose.rawGrams, 2)} g → dibulatkan ${dose.capped ? `${Math.ceil(dose.rawGrams * 2) / 2} g` : `${dose.grams} g`}\nBatas hipomagnesemia berat 1.5 mEq/kg = ${w > 0 ? `${fmt(dose.maxGrams, 1)} g` : '(isi BB)'}${dose.capped ? ` → DIBATASI ${dose.grams} g` : ''}`, note: 'Kenaikan dinilai dalam 18–30 jam; distribusi Mg ke jaringan lambat dan ekskresi ginjal cepat (Hansen 2018).' },
    { label: 'Langkah 4 — Konteks: defisit Mg tubuh:', formula: w > 0 ? `≈ 1–2 mEq/kg × ${w} kg = ${fmt(bodyDefLo, 0)}–${fmt(bodyDefHi, 0)} mEq\n≈ ${fmt(bodyDefLo / MEQ_PER_G_MGSO4, 1)}–${fmt(bodyDefHi / MEQ_PER_G_MGSO4, 1)} g MgSO₄` : 'Isi BB untuk menghitung', note: 'Mg serum hanya 0.3% Mg tubuh. Defisit tubuh jauh lebih besar dari kebutuhan Langkah 3, dan sebagian besar Mg IV terbuang lewat ginjal — itulah sebabnya penggantian berulang beberapa hari dengan Mg serial.' },
  ];

  // ② Cara pemberian
  const give: CalcStep[] = [];
  if (urgent) give.push({ label: 'Langkah P1 — Bolus darurat:', formula: '2 g MgSO₄ (16 mEq) IV dalam 2–15 menit\n= 10 mL MgSO₄ 20% = 5 mL MgSO₄ 40%', note: 'Untuk aritmia berat/tidak stabil, lalu lanjutkan infus kontinu.' });
  give.push({ label: `Langkah P${urgent ? 2 : 1} — Volume & durasi infus:`, formula: `${urgent ? `Infus = ${plan.reducedForCap ? `batas ${fmt(dose.maxGrams, 1)} − bolus 2 = ${inf} g (kebutuhan ${dose.grams} g dipangkas)` : `${inf} g`} · total bolus + infus = ${plan.total} g\n` : ''}${inf} g = ${fmt(inf / 0.2, 1)} mL MgSO₄ 20% = ${fmt(inf / 0.4, 1)} mL MgSO₄ 40%\nDurasi ${hrsText} jam → ${hrs.max ? `${fmt(inf / hrs.max, 2)}–${fmt(inf / hrs.min, 2)}` : `≤${fmt(inf / hrs.min, 2)}`} g/jam`, note: renal ? `eGFR ${eg}: risiko hipermagnesemia — dosis harus disesuaikan & dipantau ketat; tidak ada angka baku (mis. mulai separuh dosis lalu titrasi dengan Mg serial).` : 'Dosis <6 g dalam 8–12 jam; dosis lebih besar >25 jam (Hansen 2018).' });

  const flow: FlowStep[] = [
    { title: 'Konfirmasi & pahami keterbatasan', body: 'Mg serum (0.3% Mg tubuh) bisa normal meski defisit intrasel; hipoalbuminemia menurunkan Mg total palsu. Pasien berisiko + gejala khas dapat diterapi walau Mg normal (Hansen 2018).' },
    { title: `Hitung dasar: Δ ${fmt(dose.deltaMeq, 2)} mEq/L → MgSO₄ ${dose.grams} g`, body: 'Lihat ① Hasil Dasar.', state: 'now' },
    { title: 'Cari penyebab', body: 'GI: diare, NGT, fistula, pankreatitis. Ginjal: diuretik loop, aminoglikosida, cisplatin, siklosporin, diuresis osmotik, cairan NaCl lama. Lain: KAD, alkoholisme, kelaparan, PPI.' },
    { title: 'Darurat: 2 g MgSO₄ IV dalam 2–15 menit', body: 'Untuk aritmia berat / hemodinamik tidak stabil (mis. torsades), lalu infus kontinu.', state: urgent ? 'now' : 'skip' },
    { title: `Rute: ${iv ? `IV ${urgent ? `bolus 2 g + infus ${inf} g` : `${inf} g`} MgSO₄ (infus ${hrsText} jam)` : 'ORAL'}`, body: iv ? <>Dalam NaCl 0.9%/D5W.{(dose.capped || plan.reducedForCap) && <strong> Total dibatasi 1.5 mEq/kg{urgent ? ' (termasuk bolus 2 g)' : ''}.</strong>}</> : <>Mg ≥0.5 mmol/L tanpa gejala bermakna → suplemen oral (dosis sesuai sediaan). Estimasi IV bila oral tidak mungkin: {dose.grams} g.</>, state: 'now' },
    { title: 'Sesuaikan dengan fungsi ginjal', body: renal ? <strong>eGFR {eg} — dosis harus dikurangi & dipantau ketat (refleks patela, napas, Mg serial).</strong> : 'Isi eGFR. Gagal ginjal → risiko hipermagnesemia; Mg umumnya tidak dianjurkan kecuali defisiensi berat, dengan dosis disesuaikan.', state: renal ? 'now' : 'todo' },
    { title: 'Pantau & koreksi elektrolit terkait', body: 'Mg ulang (efek penuh 18–30 jam). Hipomagnesemia menyebabkan hipokalemia (kebocoran K ginjal via ROMK) & hipokalsemia (PTH terhambat) — koreksi K & Ca bersamaan.' },
  ];

  return (
    <>
      {mv < 1.0 && (
        <InfoBox tone="amber" title={`Mg ${mv} mg/dL sangat rendah — periksa satuan`}>
          Kalkulator memakai <strong>mg/dL</strong>. Bila lab melaporkan dalam mmol/L (normal ±0.75–0.95 mmol/L), nilai {mv} bisa jadi normal — kalikan 2.43 untuk mg/dL ({fmt(mv * 2.43, 2)} mg/dL). Dosis di bawah hanya benar bila {mv} memang mg/dL.
        </InfoBox>
      )}
      {/* ① HASIL DASAR */}
      <Card tone="emerald">
        <Eyebrow tone="emerald">① Hasil Dasar · Hipomagnesemia · Mg {mv} → target {tgt} mg/dL</Eyebrow>
        <BigNumber tone="emerald">Kebutuhan MgSO₄: {dose.grams} g</BigNumber>
        <SmallText>= ΔMg {fmt(dose.deltaMeq, 2)} mEq/L ÷ 0.15 per gram{dose.capped ? ' (dibatasi 1.5 mEq/kg)' : ''}</SmallText>
        <MiniBoxes tone="emerald" boxes={[
          { title: 'Mg serum', value: `${fmt(mmol, 2)} mmol/L`, sub: `${fmt(meq, 2)} mEq/L` },
          { title: 'Δ ke target', value: `${fmt(dose.deltaMeq, 2)} mEq/L`, sub: iv ? 'jalur IV' : 'oral cukup', strong: true },
          { title: 'Defisit tubuh', value: w > 0 ? `${fmt(bodyDefLo, 0)}–${fmt(bodyDefHi, 0)}` : '–', sub: 'mEq · konteks' },
        ]} />
      </Card>
      <Steps tone="emerald" title="🧮 Langkah Dasar — dari input ke kebutuhan MgSO₄" steps={basic} footer="Aturan empiris pasien kritis — respons individual bervariasi; titrasi dengan Mg serial." />

      {/* ② CARA PEMBERIAN */}
      <SectionTitle>② Cara Pemberian</SectionTitle>
      <Card plain>
        <SmallText strong>{iv ? `IV (${mmol < 0.5 ? 'Mg <0.5 mmol/L' : 'bergejala'})` : 'Oral dianjurkan — estimasi IV bila oral tidak mungkin'}</SmallText>
        <BigNumber tone="slate" size="md">{urgent ? '2 g bolus → ' : ''}{inf > 0 ? `MgSO₄ ${inf} g dalam ${hrsText} jam` : 'tanpa infus lanjutan (Mg ≥ target)'}</BigNumber>
        <SmallText>{urgent ? `Total ${plan.total} g · ` : ''}{fmt(inf / 0.2, 1)} mL MgSO₄ 20% · {fmt(inf / 0.4, 1)} mL MgSO₄ 40%{renal ? ' · ⚠ eGFR <30: kurangi & pantau' : ''}</SmallText>
        <Steps tone="slate" title="🧮 Rincian pemberian" steps={give} />
      </Card>
      {toxBox}
      <StrategyFlow steps={flow} />
      <Accordion title="📖 Dasar rujukan hipomagnesemia">
        <Bullets items={[
          'Defisit Mg tubuh dapat 1–2 mEq/kg. Ringan/tanpa gejala → oral; IV bila Mg <0.5 mmol/L atau gejala bermakna.',
          '1 g MgSO₄ IV menaikkan Mg serum ±0.15 mEq/L dalam 18–30 jam (aturan empiris ICU).',
          'Hipomagnesemia berat: hingga 1.5 mEq/kg; <6 g dalam 8–12 jam, lebih besar >25 jam. Darurat: 16 mEq (2 g) dalam 2–15 menit lalu infus.',
          'Praktik pengganti Mg sebagian besar berasal dari uji infark miokard (bolus 2 g lalu infus hingga 16 g/24 jam).',
        ]} />
      </Accordion>
      <RefLine>Hansen BA, Bruserud Ø. Hypomagnesemia in critically ill patients. J Intensive Care 2018;6:21 · Turner J, et al. Endocr Connect 2016;5:G7</RefLine>
      <Disclaimer />
    </>
  );
}

function MgTheory() {
  return (
    <Accordion title="📖 Teori & Referensi: Koreksi Magnesium">
      <Bullets items={[
        <><strong>Magnesium:</strong> Mg serum tidak mencerminkan Mg tubuh total. IV bila &lt;0.5 mmol/L (≈1.2 mg/dL) atau bergejala; 1 g MgSO₄ ≈ +0.15 mEq/L (18–30 jam); maksimal 1.5 mEq/kg; &lt;6 g dalam 8–12 jam. Aritmia tidak stabil: 2 g dalam 2–15 menit. Gangguan ginjal: sesuaikan & pantau. <em>(Hansen 2018)</em></>,
      ]} />
      <div style={{ marginTop: 10 }}>
        <SmallText italic>📚 Hansen BA, Bruserud Ø. J Intensive Care 2018;6:21</SmallText>
      </div>
    </Accordion>
  );
}
