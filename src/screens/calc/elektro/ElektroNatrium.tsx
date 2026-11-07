import { useMemo, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Accordion, Disclaimer, type CalcStep } from '../../../components/clinical';
import { fw } from '../../../lib/settings';
import { computeNa, glucoseCorrectedNa, NA_FLUIDS, type NaResult, type UreaUnit } from '../../../lib/sodium';
import { weightPlausibilityWarning, rangeWarning } from '../../../lib/validation';
import {
  InputPanel, FieldRow, NumField, SelectField, TargetField, ToggleList, useToggleSet, CalcButton, StrategyFlow, InfoBox, WarnTitle, RefLine,
  Card, Eyebrow, BigNumber, SmallText, MiniBoxes, Steps, SectionTitle, Bullets, InputWarning, ResultStack, toneText, toneBg, toneBorder, fmt,
  selectStyle, type FlowStep, type Tone,
} from './ElektroUI';

/* Koreksi Natrium — port dari ICU Helper (ElektroNatrium.tsx + bagian Na di
   KalkulatorElektro.tsx, versi final teraudit). Angka & rumus identik;
   logika murni di src/lib/sodium.ts (computeNa). */

// Klasifikasi gejala hiponatremia (Spasovski 2014, ERBP/ESE/ESICM).
// Indikasi NaCl 3% ditentukan oleh GEJALA, bukan angka natrium semata.
const SEVERE_SX = ['Muntah', 'Distres kardiorespirasi', 'Kejang', 'Kantuk dalam / somnolen abnormal', 'Penurunan kesadaran / koma (GCS ≤8)'];
const MODERATE_SX = ['Mual (tanpa muntah)', 'Bingung / konfusi', 'Nyeri kepala'];
// Faktor risiko ODS selain Na ≤105 (Verbalis 2013).
const ODS_RISK = ['Hipokalemia', 'Alkoholisme', 'Malnutrisi', 'Penyakit hati lanjut'];

const NA_RISE_OPTIONS = [
  { value: '4', label: 'Risiko ODS tinggi', note: 'Risiko ODS tinggi: target 4–6 mEq/L/24 jam, batas 8 (Verbalis 2013).' },
  { value: '6', label: 'Standar kronik', note: 'Target minimal 4–8 mEq/L/24 jam; cukup untuk mengurangi risiko klinis (Verbalis 2013).' },
  { value: '8', label: 'Batas atas target', note: 'Batas atas target risiko normal. Batas absolut 24 jam pertama 10 mEq/L, lalu 8 tiap 24 jam berikutnya (Spasovski 2014).' },
];
const HYPER_TARGET_OPTIONS = [
  { value: '140', label: 'Formula klasik', note: 'Rumus defisit air bebas Adrogué–Madías memakai Na target 140.' },
  { value: '145', label: 'Batas atas normal', note: 'Target lebih konservatif (volume air lebih kecil); tetap koreksi bertahap hari berikutnya bila perlu.' },
];
const HYPER_DROP_OPTIONS = [
  { value: '8', label: 'Kronik konservatif', note: 'Kronik/tidak tahu onset: 8–10 mEq/L/24 jam (~0.5 mEq/L/jam) — mencegah edema serebri.' },
  { value: '10', label: 'Kronik (pedoman)', note: 'Batas umum hipernatremia kronik ≤10 mEq/L/24 jam (Adrogué–Madías 2000).' },
  { value: '24', label: 'Akut <48 jam', note: 'Onset jelas <48 jam: boleh ~1 mEq/L/jam karena otak belum beradaptasi.' },
];

type Severity = 'berat' | 'sedang' | 'ringan';

export function NatriumCalc() {
  const [bw, setBw] = useState('');
  const [na, setNa] = useState('');
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [age, setAge] = useState('');
  const [glu, setGlu] = useState('');
  const [onset, setOnset] = useState<'kronik' | 'akut'>('kronik');
  const [naFluid, setNaFluid] = useState('d5w');
  const [symptoms, toggleSymptom] = useToggleSet();
  const [odsFactors, toggleOds] = useToggleSet();
  const [naRise, setNaRise] = useState('6');
  const [hyperTarget, setHyperTarget] = useState('140');
  const [hyperDrop, setHyperDrop] = useState('10');
  const [ureum, setUreum] = useState('');
  const [ureaUnit, setUreaUnit] = useState<UreaUnit>('ureum');
  const [naDirect, setNaDirect] = useState('');
  const [measuredOsm, setMeasuredOsm] = useState('');
  const [shown, setShown] = useState(false);

  const res = useMemo(() => computeNa({
    weightKg: parseFloat(bw), na: parseFloat(na), glucose: parseFloat(glu),
    sex, age: parseFloat(age), onset, fluidId: naFluid,
    odsRiskFactors: odsFactors.size, riseTarget: parseFloat(naRise),
    hyperTargetNa: parseFloat(hyperTarget), hyperDropPer24: parseFloat(hyperDrop),
    urea: parseFloat(ureum), ureaUnit, measuredOsm: parseFloat(measuredOsm), naDirect: parseFloat(naDirect),
  }), [bw, na, glu, age, sex, onset, naFluid, odsFactors, naRise, hyperTarget, hyperDrop, ureum, ureaUnit, measuredOsm, naDirect]);

  // Na terkoreksi glukosa untuk menentukan input mana yang relevan (hipo vs hiper) sebelum dihitung.
  const naPreview = parseFloat(na) > 0 ? glucoseCorrectedNa(parseFloat(na), parseFloat(glu)).value : NaN;

  // Keparahan diturunkan LIVE dari checklist gejala.
  const naSeverity: Severity =
    SEVERE_SX.some(s => symptoms.has(s)) ? 'berat'
    : MODERATE_SX.some(s => symptoms.has(s)) ? 'sedang'
    : 'ringan';

  return (
    <div>
      <InputPanel>
        <FieldRow label="Berat Badan"><NumField value={bw} onChange={setBw} placeholder="70" unit="kg" /></FieldRow>
        <FieldRow label="Na Serum"><NumField value={na} onChange={setNa} placeholder="135" unit="mEq/L" /></FieldRow>
        <FieldRow label="Jenis Kelamin">
          <SelectField<'m' | 'f'> value={sex} onChange={setSex} options={[{ value: 'm', label: 'Laki-laki' }, { value: 'f', label: 'Perempuan' }]} />
        </FieldRow>
        <FieldRow label="Usia" sub="untuk faktor TBW"><NumField value={age} onChange={setAge} placeholder="Opsional" unit="tahun" /></FieldRow>
        <FieldRow label="Glukosa GDS"><NumField value={glu} onChange={setGlu} placeholder="Opsional" unit="mg/dL" /></FieldRow>
        <FieldRow label={ureaUnit === 'ureum' ? 'Ureum' : 'BUN'} sub="untuk osmolalitas terhitung">
          <input type="number" inputMode="decimal" value={ureum} onChange={e => setUreum(e.target.value)} placeholder="Opsional"
            style={{ ...selectStyle, cursor: 'text', fontFamily: 'var(--font-mono)', maxWidth: 110 }} />
          <select value={ureaUnit} onChange={e => setUreaUnit(e.target.value as UreaUnit)} style={{ ...selectStyle, flex: '0 0 auto', width: 84, textAlign: 'left' }}>
            <option value="ureum">Ureum</option>
            <option value="bun">BUN</option>
          </select>
        </FieldRow>
        {naPreview < 135 && (
          <>
            <FieldRow label="Na gas darah" sub="analyzer gas darah (direct ISE), opsional"><NumField value={naDirect} onChange={setNaDirect} placeholder="Opsional" unit="mEq/L" /></FieldRow>
            <FieldRow label="Osm terukur" sub="bila lab memeriksa, opsional"><NumField value={measuredOsm} onChange={setMeasuredOsm} placeholder="Opsional" unit="mOsm" /></FieldRow>
          </>
        )}
        <FieldRow label="Onset">
          <SelectField<'kronik' | 'akut'> value={onset} onChange={v => { setOnset(v); setHyperDrop(v === 'akut' ? '24' : '10'); }}
            options={[{ value: 'kronik', label: 'Kronik / Tidak tahu' }, { value: 'akut', label: 'Akut (<48 jam)' }]} />
        </FieldRow>
        {naPreview > 145 && (
          <>
            <FieldRow label="Cairan koreksi">
              <SelectField value={naFluid} onChange={setNaFluid} options={NA_FLUIDS.map(f => ({ value: f.id, label: `${f.label} (${f.na} mEq/L)` }))} />
            </FieldRow>
            <TargetField label="Target Na akhir" sub="untuk rumus defisit air" value={hyperTarget} onChange={setHyperTarget} unit="mEq/L" step="1" options={HYPER_TARGET_OPTIONS} />
            <TargetField label="Batas penurunan / 24 jam" sub="kecepatan koreksi" value={hyperDrop} onChange={setHyperDrop} unit="mEq/L" step="1" options={HYPER_DROP_OPTIONS} />
          </>
        )}
        {naPreview < 135 && (
          <>
            <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--separator)' }} className="elektro-row">
              <div className="t-footnote" style={{ fontWeight: fw(600), color: 'var(--label-primary)', marginBottom: 2 }}>Gejala Hiponatremia</div>
              <p className="t-caption-2" style={{ margin: '0 0 8px', color: 'var(--label-tertiary)', lineHeight: 1.45 }}>Centang gejala yang <em>plausibel disebabkan</em> hiponatremia. Indikasi NaCl 3% ditentukan oleh gejala, bukan angka Na semata.</p>
              <SymptomGroup label="🔴 Berat" tone="red" items={SEVERE_SX} selected={symptoms} onToggle={toggleSymptom} />
              <SymptomGroup label="🟠 Sedang" tone="amber" items={MODERATE_SX} selected={symptoms} onToggle={toggleSymptom} />
              <p className="t-caption-2" style={{ margin: '8px 0 0', fontStyle: 'italic', color: 'var(--label-tertiary)' }}>Tidak ada yang dicentang = ringan / asimtomatik → 3% tidak rutin diindikasikan.</p>
            </div>
            <TargetField label="Target kenaikan Na / 24 jam" sub="koreksi lambat (bila diputuskan)" value={naRise} onChange={setNaRise} unit="mEq/L" step="1" options={NA_RISE_OPTIONS} />
            <ToggleList title="Faktor Risiko ODS" hint="Na ≤105 otomatis dihitung berisiko tinggi. Risiko tinggi → batas 8 mEq/L/24 jam (Verbalis 2013)." items={ODS_RISK} selected={odsFactors} onToggle={toggleOds} tone="amber" />
          </>
        )}
      </InputPanel>
      <CalcButton onClick={() => setShown(true)} tone="cyan" />
      {shown && (
        <ResultStack>
          <InputWarning messages={[weightPlausibilityWarning(parseFloat(bw)), rangeWarning(parseFloat(na), 100, 180, 'Na', ' mEq/L')]} />
          {res
            ? <NatriumResult r={res} na={na} glu={glu} ureum={ureum} ureaUnit={ureaUnit} sex={sex} age={age} onset={onset} naSeverity={naSeverity} odsFactors={odsFactors} />
            : <InfoBox>Isi berat badan dan Na serum untuk menghitung.</InfoBox>}
          <NaTheory />
        </ResultStack>
      )}
    </div>
  );
}

function SymptomGroup({ label, tone, items, selected, onToggle }: { label: string; tone: Tone; items: string[]; selected: Set<string>; onToggle: (s: string) => void }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="t-caption-2" style={{ fontWeight: fw(700), textTransform: 'uppercase', letterSpacing: '0.05em', color: toneText(tone), marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(s => {
          const on = selected.has(s);
          return (
            <button key={s} type="button" onClick={() => onToggle(s)} className="t-caption-1" style={{
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${on ? toneBorder(tone, 45) : 'var(--separator)'}`,
              background: on ? toneBg(tone, 14) : 'var(--bg-primary)',
              color: on ? toneText(tone) : 'var(--label-secondary)', fontWeight: on ? fw(600) : fw(400),
            }}>{s}</button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  r: NaResult; na: string; glu: string; ureum: string; ureaUnit: string; sex: string; age: string; onset: string;
  naSeverity: Severity; odsFactors: Set<string>;
}

const glucoseStep = (r: NaResult, na: string, glu: string): CalcStep => ({
  label: 'Langkah 0 — Koreksi Na terhadap hiperglikemia:',
  formula: `Na terkoreksi = Na + 1.6 × (glukosa − 100) ÷ 100   (Katz 1973)\n= ${na} + 1.6 × (${glu} − 100) ÷ 100 = ${fmt(r.calcN, 1)} mEq/L\nPembanding Hillier 1999: faktor 2.4 → ${fmt(r.naHillier24, 1)}${r.glucose > 400 ? ` · faktor 4.0 (glukosa >400) → ${fmt(r.naHillier40, 1)}` : ''} mEq/L`,
  note: r.glucose > 400
    ? `Glukosa >400: faktor 1.6 kemungkinan MENGECILKAN koreksi — Na sebenarnya bisa ${fmt(r.calcN, 1)}–${fmt(r.naHillier40, 1)} mEq/L. Perhitungan memakai 1.6 (konvensi); pertimbangkan rentang ini sebelum memutuskan kategori & terapi.`
    : 'Glukosa menarik air keluar sel sehingga Na terukur rendah "palsu". Perhitungan memakai faktor 1.6 (sampai glukosa 400 masih sesuai menurut Hillier 1999); rentang di atas sebagai pembanding.',
});
const tbwStep = (r: NaResult, sex: string, age: string): CalcStep => ({
  label: 'Langkah 1 — Total Body Water (TBW):',
  formula: `TBW = faktor × BB = ${r.tbwF} × ${r.w} kg = ${fmt(r.tbw, 1)} L`,
  note: `Faktor ${r.tbwF} (${sex === 'm' ? 'pria' : 'wanita'}${age ? `, ${age} th` : ''}; lansia ≥65 th memakai faktor lebih kecil). Pada dehidrasi berat TBW nyata bisa lebih rendah.`,
});

type Osm = NaResult['osm'];
const ureaLabel = (unit: string) => (unit === 'bun' ? 'BUN/2.8' : 'Ureum/6');

/** Langkah 0b — osmolalitas serum terhitung (efektif & total), plus terukur & Na direct bila ada. */
const osmStep = (o: Osm, na: string, glu: string, ureaUnit: string): CalcStep => {
  if (isNaN(o.effective)) {
    return { label: 'Langkah 0b — Osmolalitas serum (konfirmasi tonisitas):', formula: 'Isi glukosa (dan ureum) untuk menghitung osmolalitas.', note: 'Langkah pertama pedoman: memastikan hiponatremia HIPOTONIK (osmolalitas <275 mOsm/kg) sebelum memilih terapi.' };
  }
  const lines = [
    `Efektif = 2 × Na + Glukosa/18 = 2 × ${na} + ${glu}/18 = ${fmt(o.effective, 1)} mOsm/kg → ${o.calcClass}`,
  ];
  if (!isNaN(o.total)) lines.push(`Total   = efektif + ${ureaLabel(ureaUnit)} = ${fmt(o.effective, 1)} + ${fmt(o.ureaTerm, 1)} = ${fmt(o.total, 1)} mOsm/kg`);
  if (o.hasMeasured) {
    lines.push(`Terukur = ${o.measuredOsm} mOsm/kg → ${o.measuredClass}${!isNaN(o.effFromMeasured) ? ` · efektif ≈ ${o.measuredOsm} − ${fmt(o.ureaTerm, 1)} = ${fmt(o.effFromMeasured, 1)}` : ''}`);
    if (!isNaN(o.gap)) lines.push(`Osmolar gap = terukur − total = ${o.measuredOsm} − ${fmt(o.total, 1)} = ${fmt(o.gap, 1)}`);
  }
  if (o.hasDirect) lines.push(`Na gas darah ${o.naDirect} − Na lab ${na} = ${o.naDiff > 0 ? '+' : ''}${fmt(o.naDiff, 1)} mEq/L`);
  return {
    label: 'Langkah 0b — Osmolalitas serum (konfirmasi tonisitas):',
    formula: lines.join('\n'),
    note: 'Urea bebas melintasi membran sel (osmol tidak efektif) — yang menentukan tonisitas adalah osmolalitas EFEKTIF. Osm terhitung <275 belum menyingkirkan osmol tak terukur (manitol, glisin, kontras) maupun pseudohiponatremia; osm TERUKUR <275 selalu berarti hipotonik (Spasovski 2014).',
  };
};

/** Banner status tonisitas di atas hasil hiponatremia. */
function TonicityBanner({ o, na }: { o: Osm; na: string }) {
  const directLine = o.hasDirect && o.status !== 'curiga-pseudo'
    ? <p style={{ margin: '4px 0 0' }}>Na gas darah {o.naDirect} vs Na lab {na}: selisih {o.naDiff > 0 ? '+' : ''}{fmt(o.naDiff, 1)} mEq/L. Normalnya kedua metode berbeda rata-rata &lt;±1 mmol/L (Vera 2022); selisih jauh lebih besar berarti sebagian penurunan Na lab kemungkinan artefak (lipid/protein tinggi).</p>
    : null;
  const gapLine = o.hasMeasured && !isNaN(o.gap)
    ? <p style={{ margin: '4px 0 0' }}>Osmolar gap {fmt(o.gap, 1)} mOsm/kg{o.gap > 10 ? ' — meningkat: curiga osmol tak terukur (manitol, alkohol toksik, glisin) atau pseudohiponatremia.' : '.'}</p>
    : null;
  switch (o.status) {
    case 'pasti-hipotonik':
      return <InfoBox tone="emerald" title={`✓ Hiponatremia HIPOTONIK terkonfirmasi (osm terukur ${o.measuredOsm} <275)`}>Lanjutkan alur di bawah.{gapLine}{directLine}</InfoBox>;
    case 'kemungkinan-hipotonik':
      return <InfoBox tone="blue" title={`Kemungkinan hipotonik — osm efektif ${o.hasMeasured && !isNaN(o.effFromMeasured) ? `≈${fmt(o.effFromMeasured, 1)} (dari terukur)` : `terhitung ${fmt(o.effective, 1)}`} mOsm/kg`}>Belum menyingkirkan osmol tak terukur (manitol, glisin pasca-TURP, kontras) dan pseudohiponatremia. Bila ada analyzer gas darah, isi Na gas darah untuk pembanding.{gapLine}{directLine}</InfoBox>;
    case 'curiga-pseudo':
      return <InfoBox tone="red" title={<WarnTitle>Curiga PSEUDOhiponatremia</WarnTitle>}>Na gas darah (direct ISE) {o.naDirect} sudah normal, sedangkan Na lab (indirect ISE) {na} rendah. Indirect ISE menganggap air plasma 93% — trigliserida/protein sangat tinggi membuat Na tampak rendah palsu (El Hage 2018). <strong>Jangan koreksi berdasarkan Na lab.</strong> Periksa trigliserida, kolesterol, protein total.{gapLine}</InfoBox>;
    case 'bukan-hipotonik':
      return <InfoBox tone="red" title={<WarnTitle>BUKAN hiponatremia hipotonik ({o.hasMeasured ? `osm terukur ${o.measuredOsm}` : `osm efektif ${fmt(o.effective, 1)}`} → {o.hasMeasured ? o.measuredClass : o.calcClass})</WarnTitle>}>Jangan berikan NaCl 3% berdasarkan angka Na ini. Cari penyebab: hiperglikemia (lihat Na terkoreksi), manitol, glisin/sorbitol (irigasi TURP), kontras, atau pseudohiponatremia (lipid/protein tinggi — bandingkan dengan Na gas darah).{gapLine}{directLine}</InfoBox>;
    default:
      return <InfoBox tone="slate" title="Tonisitas belum dinilai">Isi glukosa dan ureum (panel lab rutin) untuk menghitung osmolalitas efektif — langkah pertama memastikan hiponatremia hipotonik.</InfoBox>;
  }
}

const TONICITY_SCALE = [
  { key: 'hipotonik', label: 'Hipotonik', range: '<275', causes: 'Hiponatremia "sejati" (kelebihan air relatif) — lanjutkan penilaian status volume, osmolalitas & Na urin.' },
  { key: 'isotonik', label: 'Isotonik', range: '275–295', causes: 'Pseudohiponatremia (trigliserida/protein sangat tinggi); cairan irigasi isotonik (glisin/sorbitol/manitol, mis. TURP).' },
  { key: 'hipertonik', label: 'Hipertonik', range: '>295', causes: 'Hiperglikemia, manitol, kontras radiologi — air tertarik keluar sel sehingga Na terencerkan (koreksi Na terhadap glukosa).' },
] as const;

/**
 * Skala tonisitas (mOsm/kg): hipotonik <275 · isotonik 275–295 · hipertonik >295 (Spasovski 2014).
 * Menyorot kategori pasien — dari osm TERUKUR bila ada, selain itu osm EFEKTIF terhitung.
 */
function TonicityScale({ o }: { o: Osm }) {
  if (isNaN(o.effective) && !o.hasMeasured) return null;
  const val = o.hasMeasured ? o.measuredOsm : o.effective;
  const cls = o.hasMeasured ? o.measuredClass : o.calcClass;
  return (
    <Card plain>
      <div className="t-caption-1" style={{ fontWeight: fw(700), textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--label-secondary)' }}>Kategori osmolalitas serum</div>
      <SmallText>Pasien: <strong style={{ fontFamily: 'var(--font-mono)' }}>{fmt(val, 1)} mOsm/kg</strong> ({o.hasMeasured ? 'terukur' : 'efektif terhitung'}) → <strong>{cls}</strong></SmallText>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {TONICITY_SCALE.map(t => {
          const on = t.key === cls;
          return (
            <div key={t.key} style={{
              padding: '8px 9px', borderRadius: 10, minWidth: 0, opacity: on ? 1 : 0.7,
              background: on ? toneBg('blue', 10) : 'var(--fill-quaternary)',
              boxShadow: `inset 0 0 0 1px ${on ? toneBorder('blue', 55) : 'var(--separator)'}`,
            }}>
              <div className="t-caption-1" style={{ fontWeight: fw(700), color: on ? toneText('blue') : 'var(--label-primary)' }}>{on ? '▶ ' : ''}{t.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(700), fontSize: '0.875rem', color: 'var(--label-primary)' }}>{t.range}</div>
              <div className="t-caption-2" lang="id" style={{ color: 'var(--label-secondary)', marginTop: 3, lineHeight: 1.35, overflowWrap: 'anywhere', hyphens: 'auto' }}>{t.causes}</div>
            </div>
          );
        })}
      </div>
      <SmallText italic>Satuan mOsm/kg. Osm terhitung &lt;275 tetap perlu konfirmasi (osmol tak terukur & pseudohiponatremia tidak terdeteksi rumus) — osm terukur &lt;275 selalu hipotonik (Spasovski 2014).</SmallText>
    </Card>
  );
}

function NatriumResult(p: Props) {
  const { r } = p;
  if (r.type === 'hipo') return <HypoNa {...p} r={r} />;
  if (r.type === 'hiper') return <HyperNa {...p} r={r} />;
  return (
    <>
      <InfoBox tone="emerald" title={`✅ Na ${fmt(r.calcN, 1)} mEq/L — dalam rentang normal`}>
        {r.hasHyper ? `Na terukur ${p.na} terkoreksi glukosa ${p.glu} mg/dL menjadi ${fmt(r.calcN, 1)} mEq/L.` : 'Tidak perlu koreksi.'}
      </InfoBox>
      {r.hasHyper && <TonicityScale o={r.osm} />}
    </>
  );
}

/** Kartu terapi berbasis gejala (judul + daftar butir + rujukan). */
function SxCard({ tone, title, items, refText, icon }: { tone: Tone; title: ReactNode; items: ReactNode[]; refText: string; icon?: 'warn' | 'info' }) {
  return (
    <Card tone={tone}>
      <div className="t-footnote" style={{ fontWeight: fw(700), color: toneText(tone) }}>
        {icon === 'info' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Info size={15} />{title}</span> : <WarnTitle>{title}</WarnTitle>}
      </div>
      <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-primary)', boxShadow: `inset 0 0 0 0.5px ${toneBorder(tone, 35)}` }}>
        <Bullets items={items} />
      </div>
      <SmallText italic>📚 {refText}</SmallText>
    </Card>
  );
}

function HypoNa({ r, na, glu, ureaUnit, sex, age, onset, naSeverity, odsFactors }: Props & { r: Extract<NaResult, { type: 'hipo' }> }) {
  const o = r.osm;
  const tonicityOk = o.status === 'pasti-hipotonik' || o.status === 'kemungkinan-hipotonik' || o.status === 'belum-dinilai';
  // ① Langkah dasar
  const basic: CalcStep[] = [];
  if (r.hasHyper) basic.push(glucoseStep(r, na, glu));
  basic.push(osmStep(o, na, glu, ureaUnit));
  basic.push(
    tbwStep(r, sex, age),
    { label: `Langkah 2 — Target kenaikan Na 24 jam (${onset === 'akut' ? 'akut' : 'kronik'}):`, formula: `ΔNa = +${fmt(r.d, 1)} mEq/L (anjuran ${r.lim.goalLo}–${r.lim.goalHi}; batas ${r.lim.limit24}${r.highOdsRisk ? ', risiko ODS tinggi' : ''})\nNa target 24 jam = ${fmt(r.calcN, 1)} + ${fmt(r.d, 1)} = ${fmt(r.tgt, 1)} mEq/L`, note: onset === 'akut' ? 'Onset akut (<48 jam) terdokumentasi: otak belum beradaptasi → risiko ODS rendah; bahaya utama edema serebri.' : 'Kronik/tidak tahu: otak sudah beradaptasi → kecepatan dibatasi untuk mencegah ODS.' },
    { label: 'Langkah 3 — Defisit Na untuk target 24 jam:', formula: `Defisit = TBW × ΔNa = ${fmt(r.tbw, 1)} × ${fmt(r.d, 1)} = ${fmt(r.deficit, 0)} mEq`, note: 'Jumlah Na yang menaikkan seluruh air tubuh sebesar ΔNa — inilah yang dikejar hari ini.' },
    { label: 'Langkah 4 — Konteks: defisit total ke 140:', formula: `Defisit total = TBW × (140 − Na) = ${fmt(r.tbw, 1)} × (140 − ${fmt(r.calcN, 1)}) = ${fmt(r.totalDeficit, 0)} mEq\nHari-1 ≤ +${fmt(Math.min(r.rise, r.lim.limit24), 0)}, hari berikutnya ≤ +${fmt(Math.min(r.rise, r.lim.limitNext24), 0)} mEq/L → ≥${r.daysTo140} hari`, note: 'Rumus "defisit natrium" klasik ini TIDAK diberikan sekaligus — memberikannya dalam 24 jam akan melampaui batas ODS. Dipakai hanya untuk memahami besarnya masalah.' },
  );

  // ② Cara pemberian — estimasi NaCl 3% (koreksi lambat)
  const give: CalcStep[] = [
    { label: 'Langkah P1 — Volume via metode defisit:', formula: `NaCl 3% = 513 mEq Na/L\nVolume = ${fmt(r.deficit, 0)} ÷ 513 × 1000 = ${fmt(r.v, 0)} mL`, note: 'Batas bawah (tidak memperhitungkan dilusi oleh air yang ikut masuk).' },
    { label: 'Langkah P2 — Volume via Adrogué–Madías:', formula: `ΔNa per 1 L NaCl 3% = (513 − Na) ÷ (TBW + 1)\n= (513 − ${fmt(r.calcN, 1)}) ÷ (${fmt(r.tbw, 1)} + 1) = ${fmt(r.amPerLiter, 1)} mEq/L per L\nVolume = ${fmt(r.d, 1)} ÷ ${fmt(r.amPerLiter, 1)} × 1000 = ${fmt(r.vAM, 0)} mL`, note: 'Memperhitungkan dilusi → batas atas. Bila juga diberi KCl, K ikut menaikkan Na (pakai Na+K infusat).' },
    { label: 'Langkah P3 — Laju 24 jam:', formula: `Defisit: ${fmt(r.v, 0)} ÷ 24 = ${fmt(r.rate, 1)} mL/jam · Adrogué: ${fmt(r.vAM, 0)} ÷ 24 = ${fmt(r.rateAM, 1)} mL/jam\nLaju setara +0.5 mEq/L/jam = ${fmt(r.rateMax, 1)} mL/jam (puncak sesaat, bukan laju 24 jam)`, note: `Kecepatan rata-rata ${fmt(r.d / 24, 2)} mEq/L/jam. Laju +0.5 mEq/L/jam bila dipertahankan 24 jam = +12 mEq/L, MELAMPAUI batas ${r.lim.limit24}/24 jam — total kenaikan 24 jam tetap yang menentukan.` },
  ];

  const flow: FlowStep[] = [
    { title: o.status === 'pasti-hipotonik' ? '✓ Hipotonik terkonfirmasi (osm terukur)' : o.status === 'kemungkinan-hipotonik' ? `Kemungkinan hipotonik (osm efektif ${fmt(o.hasMeasured && !isNaN(o.effFromMeasured) ? o.effFromMeasured : o.effective, 0)})` : o.status === 'belum-dinilai' ? 'Pastikan hiponatremia hipotonik' : '⚠ Belum terbukti hipotonik — hentikan dulu', body: <>Osmolalitas efektif &lt;275 mOsm/kg (terhitung: 2×Na + glukosa/18; urea tidak dihitung karena tidak efektif){r.hasHyper ? `; Na terkoreksi glukosa ${fmt(r.calcN, 1)}` : ''}. Singkirkan pseudohiponatremia: bandingkan dengan Na analyzer gas darah (direct ISE).</>, state: o.status === 'pasti-hipotonik' ? 'done' : 'now' },
    { title: `Hitung dasar: target +${fmt(r.d, 1)} → defisit ${fmt(r.deficit, 0)} mEq`, body: `Lihat ① Hasil Dasar. Batas ${r.lim.limit24} mEq/L di 24 jam pertama, ${r.lim.limitNext24} tiap 24 jam berikutnya.`, state: r.riseOverLimit ? 'now' : 'todo' },
    { title: `Nilai gejala → ${naSeverity.toUpperCase()}`, body: naSeverity === 'berat' ? 'Bolus NaCl 3% 150 mL/20 menit, ulang s/d gejala reda atau Na naik ~5 (target jam-1 +4–6).' : naSeverity === 'sedang' ? 'Infus tunggal NaCl 3% 150 mL/20 menit, lalu re-evaluasi.' : 'NaCl 3% tidak rutin. Fokus penyebab & status volume.', state: 'now' },
    { title: `Onset: ${onset === 'akut' ? 'akut (<48 jam)' : 'kronik / tidak tahu'}`, body: onset === 'akut' ? 'Risiko ODS rendah; bahaya utama edema serebri.' : 'Otak sudah beradaptasi → batasi kecepatan koreksi (risiko ODS). Jika ragu, perlakukan sebagai kronik.' },
    { title: 'Tentukan status volume & atasi penyebab', body: 'Hipovolemik → NaCl 0.9%; euvolemik/SIADH → restriksi cairan; hipervolemik → restriksi + terapi penyakit dasar. Hentikan obat pemicu (tiazid, SSRI, dll).' },
    { title: 'Pantau & cegah overkoreksi', body: <>Na tiap 4–6 jam (tiap 20 menit saat bolus). Waspadai diuresis air (urin encer banyak) setelah penyebab teratasi → Na melonjak. Bila melewati batas: hentikan hipertonik, D5W ± desmopressin (lihat Rescue Protocol).{odsFactors.has('Hipokalemia') ? ' Koreksi KCl ikut menaikkan Na — hitung dalam target.' : ''}</> },
  ];

  const calcBox = (
    <Card tone="blue">
      <SmallText tone="blue" strong>Koreksi lambat NaCl 3% — untuk mencapai +{fmt(r.d, 1)} mEq/L dalam 24 jam</SmallText>
      <BigNumber tone="blue">{fmt(Math.min(r.v, r.vAM), 0)} – {fmt(Math.max(r.v, r.vAM), 0)} mL / 24 jam</BigNumber>
      <MiniBoxes tone="blue" boxes={[
        { title: 'Metode defisit', value: `${fmt(r.v, 0)} mL · ${fmt(r.rate, 1)} mL/jam`, sub: 'batas bawah' },
        { title: 'Adrogué–Madías', value: `${fmt(r.vAM, 0)} mL · ${fmt(r.rateAM, 1)} mL/jam`, sub: 'memperhitungkan dilusi' },
      ]} />
      <SmallText>Laju setara +0.5 mEq/L/jam = <strong>{fmt(r.rateMax, 1)} mL/jam</strong> hanya sebagai puncak sesaat — total 24 jam tetap ≤{r.lim.limit24} mEq/L. Mulai dari estimasi lebih rendah, titrasi dengan Na serial tiap 4–6 jam; vena sentral bila memungkinkan.</SmallText>
      <Steps tone="blue" title="🧮 Rincian volume & laju" steps={give} footer="Kedua rumus estimasi awal — respons nyata dipengaruhi output urin (diuresis air) dan penyebab hiponatremia." />
    </Card>
  );

  return (
    <>
      <TonicityBanner o={o} na={na} />
      <TonicityScale o={o} />
      {/* ① HASIL DASAR */}
      <Card tone="cyan">
        <Eyebrow tone="cyan">① Hasil Dasar · Hiponatremia biokimia {r.bioClass} · gejala {naSeverity} · Na {fmt(r.calcN, 1)} → {fmt(r.tgt, 1)} (24 jam)</Eyebrow>
        {r.hasHyper && <SmallText tone="cyan">Na terukur {na} → terkoreksi glukosa {fmt(r.calcN, 1)} mEq/L.</SmallText>}
        <BigNumber tone="cyan">Defisit Na: {fmt(r.deficit, 0)} mEq</BigNumber>
        <SmallText>= TBW {fmt(r.tbw, 1)} L × ΔNa +{fmt(r.d, 1)} mEq/L (target 24 jam)</SmallText>
        {!isNaN(o.effective) && <SmallText tone="cyan">Osm efektif {fmt(o.effective, 1)}{!isNaN(o.total) ? ` · total ${fmt(o.total, 1)}` : ''}{o.hasMeasured ? ` · terukur ${o.measuredOsm}` : ''} mOsm/kg</SmallText>}
        <MiniBoxes tone="cyan" boxes={[
          { title: 'TBW', value: `${fmt(r.tbw, 1)} L`, sub: `${r.tbwF} × ${r.w} kg` },
          { title: 'Batas 24 jam', value: `≤${r.lim.limit24} mEq/L`, sub: `lalu ≤${r.lim.limitNext24}/24 jam`, strong: true },
          { title: 'Defisit ke 140', value: `${fmt(r.totalDeficit, 0)} mEq`, sub: `konteks · ≥${r.daysTo140} hari` },
        ]} />
        {r.riseOverLimit && <SmallText tone="red" strong>⚠ Target +{r.rise} melebihi batas {r.lim.limit24} mEq/L/24 jam{r.highOdsRisk ? ' untuk pasien risiko ODS tinggi' : ''} — turunkan target.</SmallText>}
        {!r.riseOverLimit && r.riseOverGoal && <SmallText tone="amber">Target di atas anjuran {r.lim.goalLo}–{r.lim.goalHi} mEq/L; masih di bawah batas, tetapi sisakan ruang untuk kenaikan tak terduga (diuresis air).</SmallText>}
      </Card>

      {r.highOdsRisk && (
        <InfoBox tone="red" title={<WarnTitle>Risiko tinggi ODS ({[r.odsAuto ? 'Na ≤105' : null, ...odsFactors].filter(Boolean).join(', ')})</WarnTitle>}>
          Batasi kenaikan Na ≤8 mEq/L / 24 jam; target dianjurkan {r.lim.goalLo}–{r.lim.goalHi}. <em style={{ opacity: 0.8 }}>📚 Sterns RH. NEJM 2015 · Verbalis JG. Am J Med 2013</em>
        </InfoBox>
      )}

      <Steps tone="blue" title="🧮 Langkah Dasar — dari input ke defisit Na" steps={basic} />

      {/* ② CARA PEMBERIAN */}
      <SectionTitle>② Cara Pemberian — ditentukan GEJALA{tonicityOk ? '' : ' (TUNDA sampai tonisitas jelas)'}</SectionTitle>

      {naSeverity === 'berat' && (
        <SxCard tone="red" title="GEJALA BERAT — BOLUS NaCl 3% SEGERA" refText="Spasovski G. NDT 2014;29(Suppl 2):i1 · Sterns RH. NEJM 2015;372:55" items={[
          <><strong>Bolus NaCl 3%: 150 mL IV dalam 20 menit</strong> (alternatif 100 mL/10 menit).</>,
          'Cek Na ulang tiap 20 menit; ulangi bolus hingga 2–3× sampai gejala membaik atau Na naik ~5 mEq/L.',
          <>Target jam pertama: <strong>+4–6 mEq/L</strong> untuk menghentikan krisis serebral — <strong>bukan</strong> menormalkan Na.</>,
          <>Setelah krisis reda: STOP hipertonik. Total kenaikan <strong>≤ {r.lim.limit24} mEq/L / 24 jam</strong>.</>,
        ]} />
      )}
      {naSeverity === 'sedang' && (
        <SxCard tone="amber" title="GEJALA SEDANG — INFUS TUNGGAL NaCl 3%" refText="Spasovski G. NDT 2014;29(Suppl 2):i1" items={[
          <><strong>Infus tunggal NaCl 3% 150 mL dalam 20 menit</strong>, lalu cek Na ulang & re-evaluasi.</>,
          <>Target kenaikan {r.lim.goalLo}–{r.lim.goalHi} mEq/L / 24 jam; batas <strong>≤ {r.lim.limit24} mEq/L / 24 jam</strong>.</>,
          'Cari & atasi penyebab bersamaan (obat pemicu, SIADH, status volume).',
        ]} />
      )}
      {naSeverity === 'ringan' && (
        <Card tone="emerald">
          <div className="t-footnote" style={{ fontWeight: fw(700), color: toneText('emerald') }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Info size={15} />Ringan / asimtomatik — NaCl 3% TIDAK rutin diindikasikan</span>
          </div>
          <SmallText>Prioritas: <strong>cari & atasi penyebab</strong>, hentikan obat/cairan hipotonik pemicu. Pilih terapi sesuai status volume:</SmallText>
          <Bullets items={[
            <><strong>Hipovolemik</strong> → NaCl 0.9% (isotonik) + atasi sumber kehilangan.</>,
            <><strong>Euvolemik / SIADH</strong> → restriksi cairan (mis. &lt;800–1000 mL/hari).</>,
            <><strong>Hipervolemik</strong> (gagal jantung/sirosis) → restriksi cairan + terapi penyakit dasar.</>,
          ]} />
          <SmallText><strong>Pengecualian:</strong> bila penurunan <strong>akut</strong> terdokumentasi &gt;10 mEq/L meski gejala ringan, pertimbangkan infus tunggal 150 mL 3%.</SmallText>
          {r.isProfound && <SmallText tone="emerald" strong>Na &lt;125 (profound): tetap perlu evaluasi & mungkin koreksi lambat hati-hati — pertimbangkan konsul.</SmallText>}
          <SmallText italic>📚 Spasovski G. NDT 2014;29(Suppl 2):i1 · Verbalis JG. Am J Med 2013;126:S1</SmallText>
        </Card>
      )}

      {naSeverity === 'ringan'
        ? <Accordion title="🧮 Estimasi koreksi lambat NaCl 3% (buka bila koreksi aktif diputuskan)">{calcBox}</Accordion>
        : calcBox}

      <Accordion title="⚠ Rescue Protocol (Overcorrection)">
        <SmallText>Jika Na naik &gt; 8-10 mEq/L dalam 24 jam (risiko ODS tinggi):</SmallText>
        <div style={{ marginTop: 6 }}>
          <Bullets ordered items={[
            <><strong>STOP</strong> semua cairan saline hipertonik (NaCl 3%).</>,
            <><strong>Konsul ICU/Nefrologi segera.</strong></>,
            <><strong>DDAVP (Desmopressin):</strong> 2–4 µg SC/IV tiap 6–8 jam (menghentikan water loss ginjal).</>,
            <><strong>D5W (Dekstrosa 5%):</strong> infus lambat (3 mL/kg/jam) untuk "re-lower" Na.</>,
            'Target: Na absolut tidak melebihi (Na Awal + 8) mEq/L dalam 24 jam pertama.',
          ]} />
        </div>
        <div style={{ marginTop: 8 }}><SmallText italic>📚 Verbalis JG et al. Am J Med 2013;126:S1-42</SmallText></div>
      </Accordion>

      <StrategyFlow steps={flow} />
      <RefLine>Spasovski G. NDT 2014;29(Suppl 2):i1 · Verbalis JG. Am J Med 2013;126:S1 · Adrogué HJ, Madias NE. NEJM 2000;342:1581 · Sterns RH. NEJM 2015;372:55 · Adrogué HJ, Tucker BM, Madias NE. JAMA 2022;328:280</RefLine>
      <Disclaimer />
    </>
  );
}

function HyperNa({ r, na, glu, ureaUnit, sex, age, onset }: Props & { r: Extract<NaResult, { type: 'hiper' }> }) {
  const basic: CalcStep[] = [];
  if (r.hasHyper) basic.push(glucoseStep(r, na, glu));
  if (!isNaN(r.osm.effective)) basic.push({ ...osmStep(r.osm, na, glu, ureaUnit), label: 'Langkah 0b — Osmolalitas serum:', note: 'Hipernatremia selalu berarti hipertonisitas (defisit air relatif). Osmolalitas di sini sebagai gambaran beratnya.' });
  basic.push(
    tbwStep(r, sex, age),
    { label: 'Langkah 2 — Defisit air bebas:', formula: `Defisit = TBW × (Na ÷ Na target − 1)\n= ${fmt(r.tbw, 1)} × (${fmt(r.calcN, 1)} ÷ ${r.targetNa} − 1) = ${fmt(r.deficit, 2)} L`, note: 'Air yang hilang relatif terhadap Na. Belum termasuk IWL & kehilangan yang berlanjut.' },
    { label: 'Langkah 3 — Batas penurunan & target hari ini:', formula: `ΔNa total = ${fmt(r.calcN, 1)} − ${r.targetNa} = ${fmt(r.totalDrop, 1)} mEq/L\nBatas ${r.maxDropPer24} mEq/L/24 jam (${fmt(r.maxDropPer24 / 24, 2)}/jam) → hari ini turunkan ${fmt(r.targetDrop, 1)} mEq/L\nTotal ±${r.days} hari`, note: onset === 'akut' ? 'Onset akut (<48 jam) boleh ~1 mEq/L/jam.' : 'Kronik/tidak tahu ≤10 mEq/L/24 jam (~0.5/jam) — mencegah edema serebri. Jika ragu onset → perlakukan sebagai kronik.' },
  );

  const give: CalcStep[] = [
    { label: 'Langkah P1 — Efek 1 L cairan (Adrogué–Madías):', formula: `ΔNa/L = (Na infusat − Na serum) ÷ (TBW + 1)\n= (${r.fluid.na} − ${fmt(r.calcN, 1)}) ÷ (${fmt(r.tbw, 1)} + 1) = ${fmt(r.dNaPerL, 2)} mEq/L per L` },
  ];
  if (r.lowersNa && r.volForTarget !== null && r.rateMlHr !== null) {
    give.push({ label: 'Langkah P2 — Volume & laju hari ini:', formula: `Volume = target hari ini ÷ |ΔNa/L| = ${fmt(r.targetDrop, 1)} ÷ ${fmt(Math.abs(r.dNaPerL), 2)} = ${fmt(r.volForTarget, 2)} L\nLaju = ${fmt(r.volForTarget * 1000, 0)} ÷ 24 = ${fmt(r.rateMlHr, 0)} mL/jam`, note: 'Tambahkan IWL (~30–40 mL/jam) & kehilangan berlanjut pada laju total.' });
  }

  const flow: FlowStep[] = [
    { title: 'Klasifikasi status volume & penyebab', body: 'Hipovolemik (GI, diuretik, diuresis osmotik) · euvolemik (Diabetes Insipidus, insensible loss) · hipervolemik (iatrogenik NaHCO₃/hipertonik). Osmolalitas urin membantu.' },
    { title: 'Syok / hipovolemia berat? → NaCl 0.9% dulu', body: 'Stabilkan hemodinamik dengan isotonik, baru ganti ke air bebas.' },
    { title: `Hitung dasar: defisit air ${fmt(r.deficit, 2)} L, hari ini −${fmt(r.targetDrop, 1)} mEq/L`, body: 'Lihat ① Hasil Dasar.', state: 'now' },
    { title: `Pilih cairan: ${r.fluid.label}`, body: <>{r.rateMlHr !== null ? `±${fmt(r.rateMlHr, 0)} mL/jam` : 'Cairan ini tidak menurunkan Na — pilih cairan hipotonik'}. Air oral/NGT &gt; D5W &gt; NaCl 0.45%.{r.dropOverGuideline ? ' ⚠ Batas melebihi pedoman kronik (≤10).' : ''}</>, state: 'now' },
    { title: 'Tambahkan IWL & kehilangan berlanjut', body: 'IWL ±30–40 mL/jam + urin encer (DI) + GI loss — tambahkan pada laju total, bukan bagian dari defisit.' },
    { title: 'Pantau Na tiap 2–4 jam & hitung ULANG', body: 'Atasi penyebab: DI sentral → desmopressin; nefrogenik → tiazid + NSAID. Waspadai edema serebri bila penurunan terlalu cepat.' },
  ];

  return (
    <>
      {/* ① HASIL DASAR */}
      <Card tone="red">
        <Eyebrow tone="red">① Hasil Dasar · Hipernatremia {onset === 'akut' ? '(akut)' : '(kronik / tidak tahu)'} · Na {fmt(r.calcN, 1)} → {r.targetNa}</Eyebrow>
        {r.hasHyper && <SmallText tone="red">Na terukur {na} → terkoreksi glukosa {fmt(r.calcN, 1)} mEq/L.</SmallText>}
        <BigNumber tone="red">Defisit air bebas: {fmt(r.deficit, 2)} L</BigNumber>
        <SmallText>= TBW {fmt(r.tbw, 1)} L × ({fmt(r.calcN, 1)} ÷ {r.targetNa} − 1)</SmallText>
        <MiniBoxes tone="red" boxes={[
          { title: 'TBW', value: `${fmt(r.tbw, 1)} L`, sub: `${r.tbwF} × ${r.w} kg` },
          { title: 'Hari ini', value: `−${fmt(r.targetDrop, 1)} mEq/L`, sub: `batas ${r.maxDropPer24}/24 jam`, strong: true },
          { title: 'ΔNa total', value: `${fmt(r.totalDrop, 1)} mEq/L`, sub: `±${r.days} hari` },
        ]} />
        {r.dropOverGuideline && <SmallText tone="red" strong>⚠ Melebihi batas pedoman hipernatremia kronik (≤10 mEq/L/24 jam). Bukti observasional terbaru belum konsisten (Chauhan 2019: koreksi cepat tidak terkait edema serebri; Chacon-Palma 2025: koreksi lambat terkait mortalitas lebih rendah) — ikuti pedoman kecuali ada alasan kuat.</SmallText>}
      </Card>

      <Steps tone="red" title="🧮 Langkah Dasar — dari input ke defisit air" steps={basic} />
      <TonicityScale o={r.osm} />

      {/* ② CARA PEMBERIAN */}
      <SectionTitle>② Cara Pemberian</SectionTitle>
      <Card plain>
        <SmallText strong>Cairan: {r.fluid.label} ({r.fluid.na} mEq/L)</SmallText>
        {r.lowersNa && r.volForTarget !== null && r.rateMlHr !== null ? (
          <>
            <BigNumber tone="slate">{fmt(r.volForTarget, 2)} L / 24 jam ≈ {fmt(r.rateMlHr, 0)} mL/jam</BigNumber>
            <SmallText>1 L menurunkan Na {fmt(Math.abs(r.dNaPerL), 2)} mEq/L · + IWL (~30–40 mL/jam) & kehilangan berlanjut. {r.fluid.note}</SmallText>
          </>
        ) : (
          <InfoBox tone="amber"><strong>NaCl 0.9% tidak menurunkan Na</strong> pada Na &lt; 154 (ΔNa/L = +{fmt(r.dNaPerL, 2)}). Gunakan hanya untuk resusitasi hipovolemia sampai stabil, lalu ganti ke air bebas (D5W/oral/0.45%).</InfoBox>
        )}
        <Steps tone="slate" title="🧮 Rincian cairan" steps={give} footer="Estimasi awal (sistem tertutup). Cek Na tiap 2–4 jam & hitung ULANG dengan Na terbaru." />
      </Card>

      <Accordion title="🔎 Klasifikasi Status Volume & Penyebab">
        <Bullets items={[
          <><strong>Hipovolemik</strong> (defisit air &gt; Na): GI losses, diuretik, luka bakar, diuresis osmotik (DKA/HHS, manitol) → NaCl 0.9% dulu bila syok, lalu air bebas.</>,
          <><strong>Euvolemik:</strong> Diabetes Insipidus (sentral: defisit ADH → <em>desmopressin</em>; nefrogenik: ginjal tak respons ADH → <em>tiazid + NSAID</em>), insensible losses.</>,
          <><strong>Hipervolemik</strong> (biasanya iatrogenik): NaHCO₃ hipertonik, NaCl 3%/HTS, resusitasi tinggi Na → hentikan sumber, ± diuretik.</>,
          <><strong>Evaluasi osmolalitas urin:</strong> &lt;300 mOsm/kg → curiga DI (uji desmopressin bedakan sentral vs nefrogenik); &gt;800 → kehilangan ekstrarenal; 300–800 → kehilangan renal parsial.</>,
        ]} />
      </Accordion>
      <Accordion title="⚠ Interaksi dengan Oliguria / AKI">
        <Bullets items={[
          <>Volume koreksi bisa besar (liter/24 jam). Bila UOP tidak mengimbangi (khususnya AKI intrinsik/ATN), risiko <strong>volume overload</strong> nyata.</>,
          <>Bedakan: <strong>pre-renal</strong> (butuh cairan, jangan dibatasi) · <strong>intrinsik</strong> (rencana volume dikompromikan dengan balans) · <strong>post-renal</strong> (atasi obstruksi).</>,
          <>Pada AKI oliguria dengan kebutuhan koreksi Na signifikan, <strong>CRRT</strong> dapat menangani volume + kecepatan koreksi Na sekaligus.</>,
        ]} />
      </Accordion>
      <InfoBox title="Monitoring">Na serum tiap <strong>2–4 jam</strong> selama koreksi aktif · hitung ulang defisit berkala · awasi tanda edema serebri (nyeri kepala, mual, penurunan kesadaran, kejang) bila kecepatan terlampaui.</InfoBox>

      <StrategyFlow steps={flow} />
      <RefLine>Adrogué HJ, Madias NE. NEJM 2000;342:1493 · Sterns RH. NEJM 2015;372:55 · Miller NE, et al. Am Fam Physician 2023;108:476</RefLine>
      <Disclaimer />
    </>
  );
}

/** Teori & Referensi natrium (dari halaman Koreksi Elektrolit ICU Helper). */
function NaTheory() {
  return (
    <Accordion title="📖 Teori & Referensi: Koreksi Natrium">
      <Bullets items={[
        <><strong>Hiponatremia — dua sumbu keparahan:</strong> (1) biokimia: ringan 130–135, sedang 125–129, berat/profound &lt;125 mEq/L; (2) gejala. Keduanya bisa tidak sejalan — dan <strong>indikasi NaCl 3% ditentukan oleh GEJALA, bukan angka</strong>. Gejala berat: muntah, distres kardiorespirasi, kejang, penurunan kesadaran/koma. Gejala sedang: mual tanpa muntah, bingung, nyeri kepala. <em>(Spasovski 2014)</em></>,
        <><strong>Patofisiologi & dasar risiko ODS:</strong> Pada hiponatremia <strong>kronik</strong> (&gt;48 jam) otak beradaptasi dengan mengeluarkan osmol; koreksi terlalu cepat → <em>Osmotic Demyelination Syndrome</em>. Pada <strong>akut</strong> (&lt;48 jam) otak belum beradaptasi → risiko ODS rendah, bahaya utama justru edema serebri. Karena itu onset akut/kronik menentukan <strong>kecepatan aman</strong>, bukan apakah pakai 3%. <em>(Sterns 2015)</em></>,
        <><strong>Terapi berbasis gejala:</strong> Berat → bolus NaCl 3% 150 mL/20 mnt (ulangi s/d +5 mEq/L atau gejala reda; target jam-1 +4–6). Sedang → infus tunggal 150 mL 3%, lalu re-evaluasi. Ringan/asimtomatik → <strong>bukan 3%</strong>: atasi penyebab; hipovolemik→NaCl 0.9%, euvolemik/SIADH→restriksi cairan, hipervolemik→restriksi + penyakit dasar. <em>(Spasovski 2014; Verbalis 2013)</em></>,
        <><strong>Plafon kecepatan & ODS:</strong> Batas ≤10 mEq/L/24 jam (≤8 pada risiko tinggi: Na ≤105, hipokalemia, alkoholisme, malnutrisi, penyakit hati lanjut) berlaku di <strong>semua</strong> mode — yang berubah menurut gejala adalah target & metode, bukan plafon. Bila overcorrection: STOP hipertonik, D5W ± desmopressin (DDAVP) untuk re-lowering. <em>(Sterns 2015; Verbalis 2013)</em></>,
        <><strong>Dua rumus estimasi (koreksi lambat):</strong> Metode defisit = TBW × ΔNa ÷ 513 (TBW = 0.6 × BB pria / 0.5 × BB wanita); Adrogué–Madías = ΔNa per 1 L 3% = (513 − Na)/(TBW+1). Keduanya estimasi kasar yang sering meleset (mengabaikan output urin/diuresis air) → <strong>wajib ukur Na serial tiap 4–6 jam</strong>. <em>(Adrogué–Madías 2000; Sterns 2015)</em></>,
        <><strong>Hipernatremia — definisi & penyebab:</strong> Na &gt;145 mEq/L (berat &gt;160). Hampir selalu mencerminkan <strong>defisit air relatif</strong>, bukan kelebihan natrium murni. Klasifikasi status volume: hipovolemik (GI losses, diuretik, luka bakar, diuresis osmotik DKA/HHS/manitol) · euvolemik (Diabetes Insipidus sentral/nefrogenik, insensible losses) · hipervolemik (iatrogenik: NaHCO₃/NaCl 3%). <em>(Miller 2023; Adrogué–Madías 2000)</em></>,
        <><strong>Hipernatremia — evaluasi & tatalaksana:</strong> Osmolalitas urin &lt;300 curiga DI (uji desmopressin: sentral vs nefrogenik), &gt;800 kehilangan ekstrarenal, 300–800 renal parsial. Empat langkah: (1) defisit air = TBW × (Na/140 − 1); TBW = BB × 0.6 (pria dewasa)/0.5 (wanita dewasa/pria lansia)/0.45 (wanita lansia); (2) kecepatan — kronik/tak tahu maks 8–10 mEq/L/24 jam (~0.5/jam), akut boleh ~1/jam (jika ragu → kronik); (3) cairan: air oral/NGT &gt; D5W &gt; NaCl 0.45% &gt; NaCl 0.9% dulu bila hipovolemia berat — prediksi Adrogué–Madías ΔNa/L = (Na infusat − Na serum)/(TBW+1); (4) atasi penyebab (DI sentral→desmopressin, nefrogenik→tiazid+NSAID). <strong>Cek Na tiap 2–4 jam & hitung ULANG defisit</strong>. Pada AKI oliguria, CRRT dapat menangani volume + kecepatan sekaligus. <em>(Adrogué–Madías 2000; Sterns 2015; Miller 2023)</em></>,
        <><strong>Osmolalitas & tonisitas (langkah pertama hiponatremia):</strong> Osm efektif = 2×Na + glukosa/18; osm total = efektif + ureum/6 (BUN/2.8). Urea adalah osmol tidak efektif → yang menentukan tonisitas adalah osm efektif. Osm <strong>terukur</strong> &lt;275 selalu hipotonik; osm <strong>terhitung</strong> &lt;275 belum menyingkirkan osmol tak terukur (manitol, glisin, kontras) maupun pseudohiponatremia <em>(Spasovski 2014)</em>. Pseudohiponatremia: Na lab (indirect ISE) rendah palsu pada lipid/protein tinggi, sedangkan Na analyzer gas darah (direct ISE) tidak terpengaruh; normalnya kedua metode berbeda rata-rata &lt;±1 mmol/L <em>(El Hage 2018; Vera 2022)</em>.</>,
        <><strong>Bukti terbaru kecepatan koreksi Na:</strong> Meta-analisis 7 kohort (6.032 pasien hiponatremia berat): ODS 0.48%; koreksi cepat meningkatkan risiko ODS (RR 3.9) tetapi berkaitan dengan mortalitas RS lebih rendah (RR 0.51) — ODS juga dapat terjadi pada koreksi lambat <em>(See 2024)</em>. Batas pedoman tetap dipakai; jangan menunda terapi gejala berat demi "terlalu hati-hati". Pada hipernatremia, data observasional bertentangan (Chauhan 2019 vs Chacon-Palma 2025).</>,
      ]} />
      <div style={{ marginTop: 10 }}>
        <SmallText italic>📚 <strong>Hiponatremia:</strong> Spasovski G, et al. Eur J Endocrinol 2014;170:G1 / Nephrol Dial Transplant 2014;29(Suppl 2):i1 · Verbalis JG, et al. Am J Med 2013;126(10 Suppl 1):S1 · Adrogué HJ, Madias NE. NEJM 2000;342:1581 · Adrogué HJ, Tucker BM, Madias NE. JAMA 2022;328:280 · See XY, et al. J Crit Care Med 2024;10:209 · El Hage L, et al. AACE Clin Case Rep 2018;5:e172 · Vera MA, et al. Lab Med 2022;53:e105. <strong>Hipernatremia:</strong> Adrogué HJ, Madias NE. NEJM 2000;342:1493 · Miller NE, et al. Am Fam Physician 2023;108:476 · Chauhan K, et al. CJASN 2019;14:656 · Chacon-Palma G, et al. Kidney360 2025;6:1305. <strong>Umum:</strong> Sterns RH. NEJM 2015;372:55.</SmallText>
      </div>
    </Accordion>
  );
}
