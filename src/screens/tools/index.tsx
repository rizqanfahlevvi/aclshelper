import React, { useState, useMemo } from 'react';
import { Icons } from '../../components/base';
import type { Nav } from '../../types';
import {
  PALS_DRUGS, PALS_ALGORITHMS, VASOPRESSORS, ROSC_CHECKLIST,
  PALS_REFERENCES, VASOPRESSOR_REFERENCES, ROSC_REFERENCES,
} from '../../data/tools';
import type { PalsDrug, Vasopressor } from '../../data/tools';

/* ── helpers ─────────────────────────────────────────────── */
function calcPals(drug: PalsDrug, weight: number) {
  const raw = drug.dosePerKg * weight;
  const lo  = drug.min ?? -Infinity;
  const hi  = drug.max ??  Infinity;
  const clamped = Math.min(hi, Math.max(lo, raw));
  return { raw, clamped, isClamped: Math.abs(clamped - raw) > 0.0001 };
}

function fmt(n: number, unit: string) {
  const v = n < 0.1 ? n.toFixed(3) : n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n).toString();
  return `${v} ${unit}`;
}

function Stepper({ value, onChange, min = 1, max = 200, step = 1, unit = '' }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  const [raw, setRaw] = React.useState('');
  const [editing, setEditing] = React.useState(false);

  const commit = (s: string) => {
    const n = parseFloat(s);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
    setRaw('');
  };

  const btnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
    background: 'var(--fill-secondary)', color: 'var(--label-primary)',
    fontSize: '1.25rem', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button style={btnStyle} onClick={() => onChange(Math.min(max, Math.max(min, value - step)))}>−</button>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={raw}
          min={min} max={max}
          onChange={e => setRaw(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); if (e.key === 'Escape') { setEditing(false); setRaw(''); } }}
          style={{
            width: 64, height: 34, borderRadius: 9, border: 'none', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '1.0625rem', fontWeight: 700,
            background: 'var(--fill-secondary)', color: 'var(--label-primary)',
            outline: '2px solid var(--accent)', WebkitAppearance: 'none', MozAppearance: 'textfield' as never,
          }}
        />
      ) : (
        <div
          onClick={() => { setRaw(String(value)); setEditing(true); }}
          title="Ketuk untuk edit"
          style={{ minWidth: 60, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--label-primary)', cursor: 'text', borderRadius: 9, padding: '5px 4px', transition: 'background 120ms' }}
        >
          {value}{unit && <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 2, color: 'var(--label-secondary)' }}>{unit}</span>}
        </div>
      )}
      <button style={btnStyle} onClick={() => onChange(Math.min(max, Math.max(min, value + step)))}>+</button>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', background: 'var(--fill-quaternary)', borderRadius: 10, padding: 3, gap: 2, flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
            background: active === t ? 'var(--bg-primary)' : 'none',
            color: active === t ? 'var(--label-primary)' : 'var(--label-secondary)',
            boxShadow: active === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 150ms',
          }}>
          {t}
        </button>
      ))}
    </div>
  );
}

function RefList({ refs }: { refs: Array<{ text: string; url?: string }> }) {
  return (
    <div style={{ marginTop: 20, paddingTop: 14, borderTop: '0.5px solid var(--separator)' }}>
      <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8, letterSpacing: '0.06em' }}>REFERENSI</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {refs.map((r, i) => (
          <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', lineHeight: 1.55, paddingLeft: 10, borderLeft: '2px solid var(--fill-secondary)' }}>
            {r.url
              ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{r.text}</a>
              : r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PALS Screen
   ============================================================ */
export function PalsScreen({ nav, isMobile }: { nav?: Nav; isMobile?: boolean }) {
  const [weight, setWeight] = useState(20);
  const [tab, setTab] = useState('Dosis');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Back nav */}
      {isMobile && nav && (
        <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
          <button onClick={nav.pop}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icons.chevL size={16} stroke={2.5}/>
            <span className="t-callout" style={{ fontWeight: 500 }}>Algoritma</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '8px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--danger) 35%, transparent)' }}>
            <Icons.heart size={22} stroke={1.9} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h2 className="t-title-2" style={{ margin: 0, fontWeight: 700 }}>PALS</h2>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Pediatric Advanced Life Support</div>
          </div>
        </div>

        {/* Weight input */}
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
          boxShadow: 'inset 0 0 0 0.5px var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-callout" style={{ fontWeight: 600 }}>Berat Badan Pasien</div>
            <div className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>3–100 kg</div>
          </div>
          <Stepper value={weight} onChange={setWeight} min={3} max={100} unit="kg"/>
        </div>

        <div style={{ marginTop: 10 }}>
          <TabBar tabs={['Dosis', 'Algoritma']} active={tab} onChange={setTab}/>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        {tab === 'Dosis' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PALS_DRUGS.map(drug => {
              const { clamped, isClamped } = calcPals(drug, weight);
              const rawVal = drug.dosePerKg * weight;
              const unit = drug.doseUnit.split('/')[0]; // 'mg', 'J', etc.
              return (
                <div key={drug.key} style={{ padding: '12px 14px', borderRadius: 14,
                  background: 'var(--bg-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.07), inset 0 0 0 0.5px var(--separator)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-callout" style={{ fontWeight: 700 }}>{drug.name}</div>
                      <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>{drug.indication}</div>
                    </div>
                    <span style={{ marginLeft: 8, padding: '3px 8px', borderRadius: 6,
                      background: drug.tint + '18', color: drug.tint, fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                      {drug.route}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10,
                    background: drug.tint + '12', boxShadow: `inset 0 0 0 0.5px ${drug.tint}44` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="t-caption-2" style={{ color: drug.tint, fontWeight: 600 }}>
                        {drug.dosePerKg} {drug.doseUnit} × {weight} kg
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.125rem', color: drug.tint }}>
                        {fmt(clamped, unit)}
                      </span>
                    </div>
                    {isClamped && (
                      <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginTop: 2 }}>
                        Kalkulasi: {fmt(rawVal, unit)} → dibatasi ke {clamped === (drug.min ?? clamped) ? 'minimum' : 'maksimum'}
                      </div>
                    )}
                  </div>
                  {drug.concentration && (
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 6 }}>
                      Konsentrasi: {drug.concentration}
                    </div>
                  )}
                  {drug.notes && (
                    <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 4, lineHeight: 1.45 }}>{drug.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PALS_ALGORITHMS.map(algo => (
              <div key={algo.key} style={{ borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07), inset 0 0 0 0.5px var(--separator)' }}>
                <div style={{ padding: '10px 14px', background: algo.tint + '18',
                  borderBottom: `0.5px solid ${algo.tint}44` }}>
                  <div className="t-callout" style={{ fontWeight: 700, color: algo.tint }}>{algo.title}</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '10px 14px' }}>
                  {algo.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < algo.steps.length - 1 ? 8 : 0 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 10, background: algo.tint + '22',
                        color: algo.tint, fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span className="t-footnote" style={{ lineHeight: 1.5, flex: 1, color: 'var(--label-primary)' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <RefList refs={PALS_REFERENCES}/>
      </div>
    </div>
  );
}

/* ============================================================
   Vasopressor Screen
   ============================================================ */
function VasoCalcPanel({ vasoPressors }: { vasoPressors: Vasopressor[] }) {
  const [weight, setWeight] = useState(70);
  const [selKey, setSelKey] = useState(vasoPressors[0]?.key || 'norepi');
  const [dose, setDose] = useState(vasoPressors[0]?.doseMin ?? 0.1);
  const [method, setMethod] = useState<'syringe' | 'infus'>('syringe');
  const [presetIdx, setPresetIdx] = useState(0);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [customVolume, setCustomVolume] = useState<number | null>(null);

  const sel = vasoPressors.find(v => v.key === selKey) || vasoPressors[0];
  const needsWeight = sel?.doseUnit === 'mcg/kg/min';

  const presetsForMethod = (sel?.stockPresets || []).filter(p => p.method === method);
  const activePreset = presetsForMethod[presetIdx] || presetsForMethod[0];
  const usingCustom = customAmount !== null && customVolume !== null && customVolume > 0;

  const amount   = usingCustom ? customAmount!  : (activePreset?.amount ?? 0);
  const volumeMl = usingCustom ? customVolume!  : (activePreset?.volumeMl ?? 1);
  const amountUnit = sel?.doseUnit === 'unit/min' ? 'unit' : 'mg';

  // Konsentrasi dasar dalam basis mcg/mL (atau unit/mL untuk vasopressin)
  const concPerMl = amountUnit === 'mg'
    ? (amount * 1000) / volumeMl   // mg → mcg
    : amount / volumeMl;           // unit tetap unit

  // Laju dasar per menit, dalam basis yang sama dengan concPerMl (mcg/mnt atau unit/mnt)
  const rateBaseMin = needsWeight ? dose * weight : dose;
  const mlPerHour = concPerMl > 0 ? (rateBaseMin / concPerMl) * 60 : 0;
  const syringeVol = usingCustom ? customVolume! : volumeMl;
  const durationHr = mlPerHour > 0 ? syringeVol / mlPerHour : 0;

  const concLabel = amountUnit === 'mg' ? `${concPerMl.toFixed(1)} mcg/mL` : `${concPerMl.toFixed(2)} unit/mL`;

  const selectDrug = (v: Vasopressor) => {
    setSelKey(v.key);
    setDose(v.doseMin);
    setPresetIdx(0);
    setCustomAmount(null);
    setCustomVolume(null);
    const hasMethod = v.stockPresets.some(p => p.method === method);
    if (!hasMethod && v.stockPresets[0]) setMethod(v.stockPresets[0].method);
  };

  if (!sel) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Pilih obat */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
        <div className="t-callout" style={{ fontWeight: 600, marginBottom: 8 }}>Obat</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {vasoPressors.map(v => (
            <button key={v.key} onClick={() => selectDrug(v)}
              style={{ padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: selKey === v.key ? v.tint + '18' : 'var(--fill-secondary)',
                boxShadow: selKey === v.key ? `inset 0 0 0 1px ${v.tint}55` : 'none',
                color: selKey === v.key ? v.tint : 'var(--label-primary)', fontSize: '0.8125rem', fontWeight: selKey === v.key ? 700 : 400 }}>
              {v.name} <span style={{ color: 'var(--label-secondary)', fontWeight: 400, fontSize: '0.75rem' }}>{v.doseRange}</span>
            </button>
          ))}
        </div>
      </div>

      {needsWeight && (
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
          boxShadow: 'inset 0 0 0 0.5px var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="t-callout" style={{ fontWeight: 600 }}>Berat Badan</div>
          <Stepper value={weight} onChange={setWeight} min={30} max={200} step={5} unit="kg"/>
        </div>
      )}

      {/* Alat pemberian */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
        <div className="t-callout" style={{ fontWeight: 600, marginBottom: 8 }}>Alat Pemberian</div>
        <TabBar tabs={['Syringe Pump', 'Infus Pump']}
          active={method === 'syringe' ? 'Syringe Pump' : 'Infus Pump'}
          onChange={t => { setMethod(t === 'Syringe Pump' ? 'syringe' : 'infus'); setPresetIdx(0); setCustomAmount(null); setCustomVolume(null); }}/>
      </div>

      {/* Konsentrasi / pengenceran */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
        <div className="t-callout" style={{ fontWeight: 600, marginBottom: 8 }}>Konsentrasi Pengenceran</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: presetsForMethod.length ? 8 : 0 }}>
          {presetsForMethod.map((p, i) => (
            <button key={p.label} onClick={() => { setPresetIdx(i); setCustomAmount(null); setCustomVolume(null); }}
              style={{ padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: !usingCustom && presetIdx === i ? sel.tint + '18' : 'var(--fill-secondary)',
                boxShadow: !usingCustom && presetIdx === i ? `inset 0 0 0 1px ${sel.tint}55` : 'none',
                color: !usingCustom && presetIdx === i ? sel.tint : 'var(--label-primary)',
                fontSize: '0.8125rem', fontWeight: !usingCustom && presetIdx === i ? 700 : 400 }}>
              {p.label}
            </button>
          ))}
          {!presetsForMethod.length && (
            <div className="t-caption-1" style={{ color: 'var(--label-tertiary)' }}>
              Tidak ada preset untuk {method === 'syringe' ? 'syringe pump' : 'infus pump'} — gunakan kustom di bawah.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" placeholder={`Jumlah (${amountUnit})`} value={customAmount ?? ''}
            onChange={e => setCustomAmount(e.target.value === '' ? null : parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 0, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--separator)',
              background: 'var(--bg-primary)', color: 'var(--label-primary)', fontSize: '0.8125rem' }}/>
          <span className="t-caption-1" style={{ color: 'var(--label-tertiary)' }}>dalam</span>
          <input type="number" placeholder="mL" value={customVolume ?? ''}
            onChange={e => setCustomVolume(e.target.value === '' ? null : parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 0, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--separator)',
              background: 'var(--bg-primary)', color: 'var(--label-primary)', fontSize: '0.8125rem' }}/>
          <span className="t-caption-1" style={{ color: 'var(--label-tertiary)' }}>mL</span>
        </div>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginTop: 6 }}>
          Konsentrasi terpakai: <strong style={{ color: sel.tint }}>{concLabel}</strong>. Selalu verifikasi dengan protokol/instruksi apoteker setempat — konsentrasi dapat berbeda antar RS.
        </div>
      </div>

      {/* Dosis */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="t-callout" style={{ fontWeight: 600 }}>Dosis</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>{dose.toFixed(3)} {sel.doseUnit}</div>
        </div>
        <input type="range" min={sel.doseMin} max={sel.doseMax} step={(sel.doseMax - sel.doseMin) / 100}
          value={dose} onChange={e => setDose(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: sel.tint }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{sel.doseMin}</span>
          <span className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{sel.doseMax}</span>
        </div>
      </div>

      {/* Hasil */}
      <div style={{ padding: '12px 14px', borderRadius: 12, background: sel.tint + '12',
        boxShadow: `inset 0 0 0 1px ${sel.tint}33` }}>
        <div className="t-caption-2" style={{ color: sel.tint, fontWeight: 700, marginBottom: 8 }}>HASIL KALKULASI</div>
        {[
          needsWeight
            ? [`${dose.toFixed(3)} ${sel.doseUnit.replace('/kg/min', '')} × ${weight} kg`, `= ${rateBaseMin.toFixed(2)} ${amountUnit === 'unit' ? 'unit' : 'mcg'}/mnt`]
            : [`Dosis`, `= ${rateBaseMin.toFixed(2)} ${amountUnit === 'unit' ? 'unit' : 'mcg'}/mnt`],
          [`Konsentrasi (${amount} ${amountUnit} / ${volumeMl} mL)`, `= ${concLabel}`],
          ['Laju syringe/infus pump', `= ${mlPerHour.toFixed(2)} mL/jam`],
        ].map(([label, value], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            borderTop: i > 0 ? `0.5px solid ${sel.tint}22` : 'none', paddingTop: i > 0 ? 6 : 0, marginTop: i > 0 ? 6 : 0 }}>
            <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: sel.tint }}>{value}</span>
          </div>
        ))}
        {durationHr > 0 && isFinite(durationHr) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            borderTop: `0.5px solid ${sel.tint}22`, paddingTop: 6, marginTop: 6 }}>
            <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Perkiraan habis dalam</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: sel.tint }}>
              {durationHr < 1 ? `${Math.round(durationHr * 60)} mnt` : `${durationHr.toFixed(1)} jam`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function VasoScreen({ nav, isMobile }: { nav?: Nav; isMobile?: boolean }) {
  const [tab, setTab] = useState('Referensi');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {isMobile && nav && (
        <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
          <button onClick={nav.pop}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icons.chevL size={16} stroke={2.5}/>
            <span className="t-callout" style={{ fontWeight: 500 }}>Kalkulator</span>
          </button>
        </div>
      )}

      <div style={{ padding: '8px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1E8E3E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--success) 35%, transparent)' }}>
            <Icons.droplet size={22} stroke={1.9} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h2 className="t-title-2" style={{ margin: 0, fontWeight: 700 }}>Vasopressor & Inotrope</h2>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Panduan titrasi infus vasoaktif</div>
          </div>
        </div>
        <TabBar tabs={['Referensi', 'Kalkulator']} active={tab} onChange={setTab}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        {tab === 'Referensi' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VASOPRESSORS.map(v => (
              <div key={v.key} style={{ borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07), inset 0 0 0 0.5px var(--separator)', background: 'var(--bg-primary)' }}>
                <div style={{ padding: '10px 14px', background: v.tint + '12', borderBottom: `0.5px solid ${v.tint}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="t-callout" style={{ fontWeight: 700, color: v.tint }}>{v.name}</span>
                      {v.altName && <span className="t-caption-1" style={{ color: 'var(--label-secondary)', marginLeft: 6 }}>({v.altName})</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: v.tint }}>{v.doseRange}</span>
                  </div>
                  <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>{v.mechanism}</div>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <div className="t-footnote" style={{ lineHeight: 1.5, marginBottom: 8 }}>{v.indication}</div>
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--fill-quaternary)', marginBottom: 8 }}>
                    <span className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>Titrasi: </span>
                    <span className="t-caption-1">{v.titration}</span>
                  </div>
                  {v.pearls.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: v.tint, flexShrink: 0 }}>•</span>
                      <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{p}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'color-mix(in srgb, var(--warning) 8%, transparent)' }}>
                    <span className="t-caption-2" style={{ color: 'var(--warning)' }}>Efek samping: </span>
                    <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{v.sideEffects}</span>
                  </div>
                </div>
              </div>
            ))}
            <RefList refs={VASOPRESSOR_REFERENCES}/>
          </div>
        ) : (
          <VasoCalcPanel vasoPressors={VASOPRESSORS}/>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Post-ROSC Checklist Screen
   ============================================================ */
export function RoscScreen({ nav, isMobile }: { nav?: Nav; isMobile?: boolean }) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(sessionStorage.getItem('acls_rosc_checks') || '[]')); }
    catch { return new Set<string>(); }
  });
  const [roscTime, setRoscTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const totalItems = useMemo(() => ROSC_CHECKLIST.reduce((acc, s) => acc + s.items.length, 0), []);
  const doneCount = checked.size;

  const toggle = (key: string) => setChecked(prev => {
    const next = new Set<string>(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    sessionStorage.setItem('acls_rosc_checks', JSON.stringify([...next]));
    return next;
  });

  const startRosc = () => {
    setRoscTime(Date.now());
    setElapsed(0);
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return id;
  };

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const iconMap: Record<string, (p: { size?: number; stroke?: number; style?: React.CSSProperties }) => React.ReactElement> = {
    lungs: Icons.lungs, activity: Icons.activity, heart: Icons.heart,
    droplet: Icons.droplet, syringe: Icons.syringe,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {isMobile && nav && (
        <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
          <button onClick={nav.pop}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icons.chevL size={16} stroke={2.5}/>
            <span className="t-callout" style={{ fontWeight: 500 }}>Algoritma</span>
          </button>
        </div>
      )}

      <div style={{ padding: '8px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--warning)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--warning) 35%, transparent)' }}>
            <Icons.activity size={22} stroke={1.9} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h2 className="t-title-2" style={{ margin: 0, fontWeight: 700 }}>Post-ROSC Care</h2>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Perawatan pasca Return of Spontaneous Circulation</div>
          </div>
        </div>

        {/* Progress + timer */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '8px 12px', borderRadius: 12, background: 'var(--fill-quaternary)',
            boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>PROGRES</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: doneCount === totalItems ? '#1E8E3E' : 'var(--label-primary)' }}>{doneCount}</span>
              <span className="t-footnote" style={{ color: 'var(--label-secondary)' }}>/ {totalItems} item</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--fill-secondary)', marginTop: 4 }}>
              <div style={{ height: '100%', borderRadius: 2, background: doneCount === totalItems ? '#1E8E3E' : 'var(--warning)',
                width: `${(doneCount / totalItems) * 100}%`, transition: 'width 300ms' }}/>
            </div>
          </div>
          <button onClick={() => roscTime ? (setRoscTime(null)) : startRosc()}
            style={{ padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: roscTime ? 'color-mix(in srgb, var(--danger) 10%, transparent)' : 'color-mix(in srgb, var(--success) 10%, transparent)',
              color: roscTime ? 'var(--danger)' : '#1E8E3E' }}>
            <div className="t-caption-2" style={{ fontWeight: 700 }}>{roscTime ? 'ROSC' : 'Catat'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, marginTop: 2 }}>
              {roscTime ? fmtElapsed(elapsed) : 'ROSC'}
            </div>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        {ROSC_CHECKLIST.map(section => {
          const SectionIcon = iconMap[section.icon] || Icons.activity;
          return (
            <div key={section.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                <SectionIcon size={16} stroke={2} style={{ color: section.tint }}/>
                <span className="t-caption-2" style={{ color: section.tint, fontWeight: 700 }}>{section.title.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.items.map(item => {
                  const done = checked.has(item.key);
                  return (
                    <div key={item.key}
                      onClick={() => toggle(item.key)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                        borderRadius: 12, cursor: 'pointer', transition: 'all 150ms',
                        background: done ? section.tint + '10' : 'var(--bg-primary)',
                        boxShadow: done ? `inset 0 0 0 1px ${section.tint}44` : 'inset 0 0 0 0.5px var(--separator)',
                      }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 1,
                        background: done ? section.tint : 'var(--fill-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: done ? `0 2px 6px ${section.tint}44` : 'none',
                        transition: 'all 200ms' }}>
                        {done && <Icons.check size={12} stroke={3} style={{ color: '#fff' }}/>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <span className="t-callout" style={{ fontWeight: done ? 600 : 500, color: done ? 'var(--label-primary)' : 'var(--label-primary)' }}>{item.label}</span>
                          {item.target && (
                            <span style={{ padding: '2px 8px', borderRadius: 6, background: section.tint + '18',
                              color: section.tint, fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                              {item.target}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2, lineHeight: 1.4 }}>{item.note}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={() => { setChecked(new Set()); sessionStorage.removeItem('acls_rosc_checks'); }}
          style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'var(--fill-quaternary)', color: 'var(--label-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
          Reset semua
        </button>
        <RefList refs={ROSC_REFERENCES}/>
      </div>
    </div>
  );
}

/* ============================================================
   DefibScreen — Panduan Defibrilasi & Kardioversi
   ============================================================ */
const DEFIB_RHYTHMS = [
  {
    key: 'af',
    label: 'Fibrilasi Atrium',
    energy: { bifasik: '100–200 J', monofasik: '200 J' },
    note: 'Titrasi naik jika tidak berhasil konversi',
    color: '#0056B3',
  },
  {
    key: 'flutter',
    label: 'Atrial Flutter',
    energy: { bifasik: '50–100 J', monofasik: '100–200 J' },
    note: 'Umumnya lebih mudah dikonversi, energi lebih rendah',
    color: '#00838F',
  },
  {
    key: 'svt',
    label: 'SVT',
    energy: { bifasik: '50–100 J', monofasik: '100–200 J' },
    note: 'Eskalasi energi jika tidak berhasil',
    color: '#003F87',
  },
  {
    key: 'vt-mono',
    label: 'VT Monomorfik',
    energy: { bifasik: '100 J', monofasik: '200 J' },
    note: 'Pasien stabil → pertimbangkan obat dulu; tidak stabil → kardioversi segera',
    color: '#FFA000',
  },
  {
    key: 'tdp',
    label: 'TdP / VT Polimorfik',
    energy: { bifasik: 'TIDAK SYNC', monofasik: 'TIDAK SYNC' },
    note: '⚠ Perlakukan seperti VF — defibrilasi asinkron',
    color: '#BA1A1A',
    isVf: true,
  },
];

const DEFIB_STEPS_DEFIB = [
  'Pad/paddle anterolateral — gel konduktif cukup',
  'Pilih energi (lihat tabel di atas)',
  'Charge — lanjutkan CPR saat charging',
  '"Semua menjauh!" — konfirmasi visual',
  'Deliver — segera lanjutkan CPR 2 menit',
];
const DEFIB_STEPS_CARDIO = [
  'Pad/paddle anterolateral — gel konduktif cukup',
  'Aktifkan mode SYNC — verifikasi marker pada gelombang R',
  'Pilih energi (lihat tabel di atas)',
  'Charge',
  '"Semua menjauh!" — tahan tombol hingga discharge (ada jeda setelah R)',
];

export function DefibScreen({ nav, isMobile }: { nav?: Nav; isMobile?: boolean }) {
  const [tab, setTab] = useState<'defib' | 'cardio'>('defib');
  const [isPeds, setIsPeds] = useState(false);
  const [selectedRhythm, setSelectedRhythm] = useState<string | null>(null);

  const steps = tab === 'defib' ? DEFIB_STEPS_DEFIB : DEFIB_STEPS_CARDIO;

  return (
    <div style={{ paddingBottom: 40 }}>
      {isMobile && nav && (
        <div style={{ padding: '8px 16px 0' }}>
          <button onClick={nav.pop} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icons.chevL size={16} stroke={2.5}/>
            <span className="t-callout" style={{ fontWeight: 500 }}>Kembali</span>
          </button>
        </div>
      )}

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)', borderBottom: '0.5px solid var(--separator)', padding: '10px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#BA1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--danger) 30%, transparent)', flexShrink: 0 }}>
            <Icons.boltFill size={20} style={{ color: '#fff' }}/>
          </div>
          <div>
            <div className="t-title-2" style={{ fontWeight: 700 }}>Panduan Defibrilasi</div>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Energi per ritme · AHA 2020</div>
          </div>
        </div>
        {/* Tab + Dewasa/Peds row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--fill-tertiary)', borderRadius: 10, padding: 3, flex: 1 }}>
            {([{ key: 'defib', label: 'Defibrilasi' }, { key: 'cardio', label: 'Kardioversi' }] as const).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedRhythm(null); }}
                style={{ height: 32, borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 150ms',
                  background: tab === t.key ? 'var(--bg-primary)' : 'transparent',
                  color: tab === t.key ? 'var(--label-primary)' : 'var(--label-secondary)',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px var(--separator)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', background: 'var(--fill-tertiary)', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['Dewasa', 'Anak'] as const).map(p => (
              <button key={p} onClick={() => setIsPeds(p === 'Anak')}
                style={{ height: 32, padding: '0 10px', borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600, transition: 'all 150ms', whiteSpace: 'nowrap',
                  background: (isPeds ? 'Anak' : 'Dewasa') === p ? 'var(--bg-primary)' : 'transparent',
                  color: (isPeds ? 'Anak' : 'Dewasa') === p ? 'var(--label-primary)' : 'var(--label-secondary)',
                  boxShadow: (isPeds ? 'Anak' : 'Dewasa') === p ? '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px var(--separator)' : 'none' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        {/* ── DEFIBRILASI tab ── */}
        {tab === 'defib' && (
          <>
            {!isPeds ? (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'color-mix(in srgb, var(--danger) 7%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--danger) 20%, transparent)', marginBottom: 12 }}>
                <div className="t-caption-2" style={{ color: '#BA1A1A', marginBottom: 6 }}>VF / pVT — ASINKRON</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>BIFASIK</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#BA1A1A', marginTop: 2 }}>120–200 J</div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>Sesuai rekomendasi alat</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>MONOFASIK</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#BA1A1A', marginTop: 2 }}>360 J</div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>Dosis tetap, ulangi 360 J</div>
                  </div>
                </div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 8 }}>Ulangi setiap 2 menit jika tidak ada ROSC. Eskalasi energi jika bifasik gagal.</div>
              </div>
            ) : (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'color-mix(in srgb, var(--danger) 7%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--danger) 20%, transparent)', marginBottom: 12 }}>
                <div className="t-caption-2" style={{ color: '#BA1A1A', marginBottom: 8 }}>DEFIBRILASI PEDIATRIK — ASINKRON</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>DOSIS 1</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#BA1A1A', marginTop: 2 }}>2 J/kg</div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>Syok pertama</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>DOSIS 2+</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#BA1A1A', marginTop: 2 }}>4 J/kg</div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>Maks 10 J/kg atau dosis dewasa</div>
                  </div>
                </div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 8 }}>Bifasik atau monofasik. Gunakan pad pediatrik jika tersedia (&lt;10 kg).</div>
              </div>
            )}
          </>
        )}

        {/* ── KARDIOVERSI tab ── */}
        {tab === 'cardio' && (
          <>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 10%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--warning) 25%, transparent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>⚠</span>
              <span className="t-caption-1" style={{ color: 'var(--label-primary)', fontWeight: 600 }}>MODE SINKRON harus aktif — verifikasi sync marker pada gelombang R sebelum discharge</span>
            </div>

            {!isPeds ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {DEFIB_RHYTHMS.map(r => (
                  <button key={r.key} onClick={() => setSelectedRhythm(sel => sel === r.key ? null : r.key)}
                    style={{ padding: '12px 14px', borderRadius: 12, border: 0, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 150ms',
                      background: selectedRhythm === r.key ? r.color + '12' : 'var(--bg-primary)',
                      boxShadow: selectedRhythm === r.key ? `inset 0 0 0 1.5px ${r.color}55` : 'inset 0 0 0 0.5px var(--separator)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t-callout" style={{ fontWeight: 600, color: r.isVf ? '#BA1A1A' : 'var(--label-primary)' }}>{r.label}</span>
                      {r.isVf
                        ? <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#BA1A1A', background: 'color-mix(in srgb, var(--danger) 12%, transparent)', padding: '2px 8px', borderRadius: 6 }}>ASYNC</span>
                        : <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: r.color, background: r.color + '15', padding: '2px 8px', borderRadius: 6 }}>SYNC</span>
                      }
                    </div>
                    {selectedRhythm === r.key && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--fill-quaternary)' }}>
                            <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>BIFASIK</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: r.isVf ? '#BA1A1A' : r.color }}>{r.energy.bifasik}</div>
                          </div>
                          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--fill-quaternary)' }}>
                            <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>MONOFASIK</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: r.isVf ? '#BA1A1A' : r.color }}>{r.energy.monofasik}</div>
                          </div>
                        </div>
                        <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{r.note}</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'color-mix(in srgb, var(--warning) 7%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--warning) 20%, transparent)', marginBottom: 12 }}>
                <div className="t-caption-2" style={{ color: '#FFA000', marginBottom: 8 }}>KARDIOVERSI PEDIATRIK — SINKRON</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>DOSIS 1</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#FFA000', marginTop: 2 }}>0.5–1 J/kg</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>DOSIS 2+</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#FFA000', marginTop: 2 }}>2 J/kg</div>
                  </div>
                </div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 8 }}>Berlaku untuk semua ritme supraventrikular. Pastikan mode SYNC aktif.</div>
              </div>
            )}
          </>
        )}

        {/* Langkah Prosedur */}
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>LANGKAH PROSEDUR</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--fill-quaternary)' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: tab === 'defib' ? '#BA1A1A' : '#FFA000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff' }}>{i + 1}</span>
              </div>
              <span className="t-callout" style={{ color: 'var(--label-primary)', flex: 1 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PedsScreen — Referensi Pediatrik
   ============================================================ */
const BROSELOW_BANDS = [
  { max: 5,  color: '#8E8E93', label: 'Abu-abu',  textColor: '#fff' },
  { max: 7,  color: '#FF2D55', label: 'Pink',      textColor: '#fff' },
  { max: 9,  color: '#FF3B30', label: 'Merah',     textColor: '#fff' },
  { max: 11, color: '#AF52DE', label: 'Ungu',      textColor: '#fff' },
  { max: 14, color: '#FFD60A', label: 'Kuning',    textColor: '#000' },
  { max: 18, color: '#E5E5EA', label: 'Putih',     textColor: '#000' },
  { max: 23, color: '#007AFF', label: 'Biru',      textColor: '#fff' },
  { max: 29, color: '#FF9500', label: 'Oranye',    textColor: '#fff' },
  { max: 36, color: '#34C759', label: 'Hijau',     textColor: '#fff' },
  { max: Infinity, color: '#636366', label: '>36 kg', textColor: '#fff' },
];

function getBroselow(w: number) {
  return BROSELOW_BANDS.find(b => w <= b.max) || BROSELOW_BANDS[BROSELOW_BANDS.length - 1];
}

function getAgeEst(w: number): string {
  if (w < 5)  return '< 1 tahun';
  if (w <= 7)  return '1 tahun';
  if (w <= 9)  return '2 tahun';
  if (w <= 11) return '3 tahun';
  if (w <= 14) return '4–5 tahun';
  if (w <= 18) return '6–8 tahun';
  if (w <= 23) return '9–10 tahun';
  if (w <= 29) return '11–12 tahun';
  return '≥ 13 tahun';
}

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function d(v: number) { return v < 0.1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v).toString(); }

export function PedsScreen({ nav, isMobile }: { nav?: Nav; isMobile?: boolean }) {
  const [weight, setWeight] = useState(20);
  const [tab, setTab] = useState<'obat' | 'prosedur'>('obat');

  const band = getBroselow(weight);
  const ageEst = getAgeEst(weight);

  const epiIv  = clamp(0.01 * weight, 0, 1);
  const epiEtt = clamp(0.1  * weight, 0, 2.5);
  const atropin = clamp(0.02 * weight, 0.1, 0.5);
  const adenosin1 = clamp(0.1 * weight, 0, 6);
  const adenosin2 = clamp(0.2 * weight, 0, 12);
  const amio = clamp(5 * weight, 0, 300);
  const lido = clamp(1 * weight, 0, 100);
  const sux  = clamp((weight < 10 ? 2 : 1.5) * weight, 0, 150);
  const rocu = 1.2 * weight;
  const defib1 = 2 * weight;
  const defib2 = clamp(4 * weight, 0, Math.min(10 * weight, 360));
  const ns20 = clamp(20 * weight, 0, 1000);
  const d10  = 5 * weight;

  const DRUGS = [
    { name: 'Epinefrin IV',        val: epiIv,      unit: 'mg',  note: `${d(epiIv / 0.1)} mL (1:10.000)`, capped: epiIv === 1 },
    { name: 'Epinefrin ETT',       val: epiEtt,     unit: 'mg',  note: '0.1 mg/kg via ETT', capped: epiEtt === 2.5 },
    { name: 'Atropin',             val: atropin,    unit: 'mg',  note: `${d(atropin / 0.5)} mL (0.5 mg/mL)`, capped: atropin === 0.1 || atropin === 0.5 },
    { name: 'Adenosin (1st)',      val: adenosin1,  unit: 'mg',  note: 'Bolus cepat', capped: adenosin1 === 6 },
    { name: 'Adenosin (2nd)',      val: adenosin2,  unit: 'mg',  note: 'Jika 1st gagal', capped: adenosin2 === 12 },
    { name: 'Amiodarone',         val: amio,       unit: 'mg',  note: 'Bolus IV (VF/pVT maks 300 mg)', capped: amio === 300 },
    { name: 'Lidokain',           val: lido,       unit: 'mg',  note: 'IV bolus', capped: lido === 100 },
    { name: 'Suksinilkolin',      val: sux,        unit: 'mg',  note: weight < 10 ? '2 mg/kg (<10 kg)' : '1.5 mg/kg', capped: sux === 150 },
    { name: 'Rokuronil',          val: rocu,       unit: 'mg',  note: '1.2 mg/kg RSI', capped: false },
    { name: 'Defib 1st',          val: defib1,     unit: 'J',   note: '2 J/kg', capped: false },
    { name: 'Defib 2nd+',         val: defib2,     unit: 'J',   note: 'Maks 10 J/kg atau 360 J', capped: defib2 === Math.min(10 * weight, 360) && defib2 < 4 * weight + 0.01 },
    { name: 'Cairan NS',          val: ns20,       unit: 'mL',  note: '20 mL/kg bolus', capped: ns20 === 1000 },
    { name: 'D10% (hipoglikemia)', val: d10,       unit: 'mL',  note: '5 mL/kg', capped: false },
  ];

  // Age in years for prosedur formulas (rough estimate from weight)
  const ageYr = weight < 5 ? 0 : weight <= 7 ? 1 : weight <= 9 ? 2 : weight <= 11 ? 3 : weight <= 14 ? 5 : weight <= 18 ? 7 : weight <= 23 ? 10 : weight <= 29 ? 12 : 14;
  const ettUncuffed = (ageYr / 4 + 4).toFixed(1);
  const ettCuffed   = (ageYr / 4 + 3.5).toFixed(1);
  const ettDepth    = (ageYr / 2 + 12).toFixed(1);
  const sbpNormal   = `${70 + 2 * ageYr} mmHg`;
  const mapNormal   = `${Math.round(55 + 1.5 * ageYr)} mmHg`;

  return (
    <div style={{ paddingBottom: 40 }}>
      {isMobile && nav && (
        <div style={{ padding: '8px 16px 0' }}>
          <button onClick={nav.pop} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icons.chevL size={16} stroke={2.5}/>
            <span className="t-callout" style={{ fontWeight: 500 }}>Kembali</span>
          </button>
        </div>
      )}

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)', borderBottom: '0.5px solid var(--separator)', padding: '10px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px color-mix(in srgb, var(--sys-teal) 35%, transparent)', flexShrink: 0 }}>
            <Icons.heart size={20} stroke={1.8} style={{ color: '#fff' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-title-2" style={{ fontWeight: 700 }}>Referensi Pediatrik</div>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Dosis berbasis berat badan · PALS 2020</div>
          </div>
          {/* Broselow band badge */}
          <div style={{ padding: '4px 12px', borderRadius: 10, background: band.color, flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: band.textColor }}>{band.label}</span>
          </div>
        </div>

        {/* Weight stepper + age */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>BERAT BADAN</div>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Est. usia: {ageEst}</div>
          </div>
          <Stepper value={weight} onChange={setWeight} min={3} max={80} step={1} unit=" kg"/>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--fill-tertiary)', borderRadius: 10, padding: 3 }}>
          {([{ key: 'obat', label: 'Obat & Dosis' }, { key: 'prosedur', label: 'Prosedur' }] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ height: 32, borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 150ms',
                background: tab === t.key ? 'var(--bg-primary)' : 'transparent',
                color: tab === t.key ? 'var(--label-primary)' : 'var(--label-secondary)',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px var(--separator)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        {tab === 'obat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DRUGS.map(drug => (
              <div key={drug.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{drug.name}</div>
                  <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{drug.note}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: '#00838F' }}>{d(drug.val)}</span>
                  <span className="t-caption-1" style={{ color: 'var(--label-secondary)', marginLeft: 3 }}>{drug.unit}</span>
                  {drug.capped && <div style={{ fontSize: '0.625rem', color: 'var(--warning)', fontWeight: 700 }}>MAKS</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'prosedur' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', paddingLeft: 2 }}>AIRWAY</div>
            {[
              { label: 'ETT Tanpa Cuff (≤8 thn)', val: `${ettUncuffed} mm`, note: '(usia/4) + 4' },
              { label: 'ETT Dengan Cuff',          val: `${ettCuffed} mm`,  note: '(usia/4) + 3.5' },
              { label: 'Kedalaman ETT',             val: `${ettDepth} cm`,   note: '(usia/2) + 12' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
                <div>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{item.label}</div>
                  <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{item.note}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: '#00838F' }}>{item.val}</span>
              </div>
            ))}

            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', paddingLeft: 2, marginTop: 6 }}>HEMODINAMIK NORMAL</div>
            {[
              { label: 'Tekanan Darah Sistolik', val: sbpNormal, note: '70 + (2 × usia thn)' },
              { label: 'MAP Normal',              val: mapNormal, note: '55 + (1.5 × usia thn)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'var(--bg-primary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
                <div>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{item.label}</div>
                  <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{item.note}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: '#00838F' }}>{item.val}</span>
              </div>
            ))}

            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', paddingLeft: 2, marginTop: 6 }}>LAJU JANTUNG NORMAL</div>
            {[
              { age: '< 1 tahun',  hr: '100–160 bpm' },
              { age: '1–2 tahun',  hr: '90–150 bpm'  },
              { age: '3–5 tahun',  hr: '80–140 bpm'  },
              { age: '6–12 tahun', hr: '70–120 bpm'  },
              { age: '> 12 tahun', hr: '60–100 bpm'  },
            ].map(item => (
              <div key={item.age} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderRadius: 10, background: 'var(--fill-quaternary)' }}>
                <span className="t-callout" style={{ color: 'var(--label-primary)' }}>{item.age}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: '#00838F' }}>{item.hr}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Desktop Wrappers
   ============================================================ */
function DesktopToolShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="acls-topbar">
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--label-primary)', fontWeight: 600 }}>{title}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 900, width: '100%', margin: '0 auto', alignSelf: 'stretch' }}>
        {children}
      </div>
    </div>
  );
}

export function DesktopPals({ onPick: _onPick }: { onPick?: (type: string, id: string) => void }) {
  return (
    <DesktopToolShell title="PALS">
      <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PalsScreen isMobile={false}/>
      </div>
    </DesktopToolShell>
  );
}

export function DesktopVaso({ onPick: _onPick }: { onPick?: (type: string, id: string) => void }) {
  return (
    <DesktopToolShell title="Vasopressor & Inotrope">
      <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <VasoScreen isMobile={false}/>
      </div>
    </DesktopToolShell>
  );
}

export function DesktopRosc({ onPick: _onPick }: { onPick?: (type: string, id: string) => void }) {
  return (
    <DesktopToolShell title="Post-ROSC Care">
      <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <RoscScreen isMobile={false}/>
      </div>
    </DesktopToolShell>
  );
}

export function DesktopDefib({ onPick: _onPick }: { onPick?: (type: string, id: string) => void }) {
  return (
    <DesktopToolShell title="Panduan Defibrilasi">
      <div style={{ padding: '0 28px', maxWidth: 640 }}>
        <DefibScreen isMobile={false}/>
      </div>
    </DesktopToolShell>
  );
}

export function DesktopPeds({ onPick: _onPick }: { onPick?: (type: string, id: string) => void }) {
  return (
    <DesktopToolShell title="Referensi Pediatrik">
      <div style={{ padding: '0 28px', maxWidth: 640 }}>
        <PedsScreen isMobile={false}/>
      </div>
    </DesktopToolShell>
  );
}
