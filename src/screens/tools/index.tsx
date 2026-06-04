import { useState, useMemo } from 'react';
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
  const btn = (d: number) => ({
    onClick: () => onChange(Math.min(max, Math.max(min, value + d))),
    style: {
      width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
      background: 'var(--fill-secondary)', color: 'var(--label-primary)',
      fontSize: '1.25rem', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
    } as React.CSSProperties,
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button {...btn(-step)}>−</button>
      <div style={{ minWidth: 60, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--label-primary)' }}>
        {value}{unit && <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 2, color: 'var(--label-secondary)' }}>{unit}</span>}
      </div>
      <button {...btn(+step)}>+</button>
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
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,59,48,0.35)' }}>
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
  const perKgVaso = vasoPressors.filter(v => v.doseUnit === "mcg/kg/min");
  const [weight, setWeight] = useState(70);
  const [selKey, setSelKey] = useState(perKgVaso[0]?.key || 'norepi');
  const [dose, setDose] = useState(0.1);
  const sel = perKgVaso.find(v => v.key === selKey) || perKgVaso[0];

  const rateMcgMin  = dose * weight;
  const rateMgHr    = rateMcgMin * 60 / 1000;
  const concMcgMl   = (rateMgHr * 1000) / 250;   // std 250 mL bag

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="t-callout" style={{ fontWeight: 600 }}>Berat Badan</div>
        <Stepper value={weight} onChange={setWeight} min={30} max={200} step={5} unit="kg"/>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
        <div className="t-callout" style={{ fontWeight: 600, marginBottom: 8 }}>Obat (berbasis BB)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {perKgVaso.map(v => (
            <button key={v.key} onClick={() => { setSelKey(v.key); setDose(v.doseMin); }}
              style={{ padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: selKey === v.key ? v.tint + '18' : 'var(--fill-secondary)',
                boxShadow: selKey === v.key ? `inset 0 0 0 1px ${v.tint}55` : 'none',
                color: selKey === v.key ? v.tint : 'var(--label-primary)', fontSize: '0.8125rem', fontWeight: selKey === v.key ? 700 : 400 }}>
              {v.name} <span style={{ color: 'var(--label-secondary)', fontWeight: 400, fontSize: '0.75rem' }}>{v.doseRange}</span>
            </button>
          ))}
        </div>
      </div>

      {sel && (
        <>
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--fill-quaternary)',
            boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div className="t-callout" style={{ fontWeight: 600 }}>Dosis</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>{dose.toFixed(2)} {sel.doseUnit}</div>
            </div>
            <input type="range" min={sel.doseMin} max={sel.doseMax} step={(sel.doseMax - sel.doseMin) / 100}
              value={dose} onChange={e => setDose(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: sel.tint }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{sel.doseMin}</span>
              <span className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{sel.doseMax}</span>
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: sel.tint + '12',
            boxShadow: `inset 0 0 0 1px ${sel.tint}33` }}>
            <div className="t-caption-2" style={{ color: sel.tint, fontWeight: 700, marginBottom: 8 }}>HASIL KALKULASI</div>
            {[
              [`${dose.toFixed(3)} mcg/kg/mnt × ${weight} kg`, `= ${rateMcgMin.toFixed(1)} mcg/mnt`],
              ['mcg/mnt → mg/jam', `= ${rateMgHr.toFixed(2)} mg/jam`],
              ['Bag 250 mL (konsentrasi)', `= ${concMcgMl.toFixed(2)} mcg/mL → ${(rateMcgMin / concMcgMl * 60).toFixed(1)} mL/jam`],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                borderTop: i > 0 ? `0.5px solid ${sel.tint}22` : 'none', paddingTop: i > 0 ? 6 : 0, marginTop: i > 0 ? 6 : 0 }}>
                <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: sel.tint }}>{value}</span>
              </div>
            ))}
          </div>
        </>
      )}
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#34C759',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(52,199,89,0.35)' }}>
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
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,149,0,0.08)' }}>
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
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,149,0,0.35)' }}>
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
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: doneCount === totalItems ? '#34C759' : 'var(--label-primary)' }}>{doneCount}</span>
              <span className="t-footnote" style={{ color: 'var(--label-secondary)' }}>/ {totalItems} item</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--fill-secondary)', marginTop: 4 }}>
              <div style={{ height: '100%', borderRadius: 2, background: doneCount === totalItems ? '#34C759' : 'var(--warning)',
                width: `${(doneCount / totalItems) * 100}%`, transition: 'width 300ms' }}/>
            </div>
          </div>
          <button onClick={() => roscTime ? (setRoscTime(null)) : startRosc()}
            style={{ padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: roscTime ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)',
              color: roscTime ? 'var(--danger)' : '#34C759' }}>
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
