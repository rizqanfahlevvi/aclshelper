import React, { useState, useMemo } from 'react';
import { Icons } from '../../components/base';
import type { Nav } from '../../types';
import { CALCULATORS } from '../../data/calculators';
import type { Calculator, CalcField } from '../../data/calculators';
import { VasoScreen } from '../tools';

/* ============================================================
   CalcFieldInput
   ============================================================ */
function CalcFieldInput({ field, value, onChange }: {
  field: CalcField;
  value: number | string | boolean;
  onChange: (val: number | string | boolean) => void;
}) {
  if (field.type === 'checkbox') {
    return (
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: 12,
          background: value ? 'rgba(0,122,255,0.08)' : 'var(--fill-quaternary)',
          boxShadow: value ? 'inset 0 0 0 1px rgba(0,122,255,0.25)' : 'inset 0 0 0 0.5px var(--separator)',
          cursor: 'pointer', transition: 'all 180ms',
        }}
        onClick={() => onChange(!value)}
      >
        <div style={{ flex: 1, marginRight: 12 }}>
          <div className="t-callout" style={{ fontWeight: 500 }}>{field.label}</div>
          {field.description && (
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>{field.description}</div>
          )}
          {field.points !== undefined && (
            <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginTop: 1 }}>
              {field.points > 0 ? `+${field.points} poin` : `${field.points} poin`}
            </div>
          )}
        </div>
        <div style={{
          width: 30, height: 18, borderRadius: 9,
          background: value ? '#007AFF' : 'var(--fill-secondary)',
          transition: 'background 200ms', flexShrink: 0, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 2, width: 14, height: 14, borderRadius: 7, background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            left: value ? 14 : 2, transition: 'left 200ms',
          }}/>
        </div>
      </div>
    );
  }

  if (field.type === 'number') {
    const num = Number(value) || 0;
    const step = field.step || 1;
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-callout" style={{ fontWeight: 500 }}>{field.label}</div>
            {field.unit && <div className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{field.unit}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onChange(Math.max(field.min ?? -Infinity, num - step))}
              style={{
                width: 30, height: 30, borderRadius: 8, background: 'var(--fill-secondary)',
                border: 'none', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 300,
                color: 'var(--label-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <input
              type="number"
              value={num}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange(Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, v)));
              }}
              style={{
                width: 64, textAlign: 'center', background: 'var(--bg-primary)', border: 'none',
                borderRadius: 8, padding: '6px 4px', fontSize: '1rem', fontWeight: 600,
                color: 'var(--label-primary)', fontFamily: 'var(--font-mono)',
                boxShadow: 'inset 0 0 0 0.5px var(--separator)', outline: 'none',
              }}
            />
            <button
              onClick={() => onChange(Math.min(field.max ?? Infinity, num + step))}
              style={{
                width: 30, height: 30, borderRadius: 8, background: 'var(--fill-secondary)',
                border: 'none', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 300,
                color: 'var(--label-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)',
      }}>
        <div className="t-callout" style={{ fontWeight: 500, marginBottom: 8 }}>{field.label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(field.options || []).map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              style={{
                textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none',
                cursor: 'pointer', transition: 'all 150ms',
                background: value === opt.value ? 'var(--accent-tint)' : 'var(--fill-secondary)',
                boxShadow: value === opt.value ? 'inset 0 0 0 1px var(--accent)' : 'none',
                color: value === opt.value ? 'var(--accent)' : 'var(--label-primary)',
              }}
            >
              <span className="t-footnote" style={{ fontWeight: value === opt.value ? 600 : 400 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/* ============================================================
   CalcResultBadge
   ============================================================ */
function CalcResultBadge({ result }: { result: ReturnType<Calculator['compute']>; tint: string }) {
  return (
    <div style={{
      borderRadius: 17, marginBottom: 16,
      background: `linear-gradient(135deg, ${result.color}cc, ${result.color}44)`,
      padding: '1.5px',
    }}>
    <div style={{
      padding: '19px 19px', borderRadius: 16,
      background: result.color + '14',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
          color: 'var(--label-primary)', lineHeight: 1, flexShrink: 0,
        }}>{result.score}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: result.color, display: 'inline-block', flexShrink: 0 }}/>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--label-primary)' }}>{result.label}</div>
          </div>
          {result.risk && (
            <div className="t-footnote" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>{result.risk}</div>
          )}
        </div>
      </div>
      {result.detail && (
        <div className="t-caption-1" style={{
          color: 'var(--label-secondary)',
          borderTop: `0.5px solid ${result.color}44`,
          paddingTop: 8, marginTop: 4,
        }}>{result.detail}</div>
      )}
    </div>
    </div>
  );
}

/* ============================================================
   FibrNolyticFields — special grouped layout
   ============================================================ */
function FibrNolyticFields({ calc, values, setValues }: {
  calc: Calculator;
  values: Record<string, number | string | boolean>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, number | string | boolean>>>;
}) {
  const inclusionKeys = ['stemiDiagnosis', 'onsetLt12h', 'noPci'];
  const absKeys = ['priorHemorrhagicStroke', 'strokeLast3m', 'structuralCns', 'intracranialNeoplasm', 'majorTrauma', 'activeBleeding', 'aorticDissection', 'abdominalAortic', 'severeHtn'];
  const relKeys = ['htn', 'strokeOver3m', 'cpr', 'majorSurgery', 'internalBleeding', 'pregnancy', 'activePeptic', 'anticoagulant'];

  const sections: Array<{ title: string; keys: string[]; accentColor: string }> = [
    { title: 'KRITERIA INKLUSI',          keys: inclusionKeys, accentColor: '#34C759' },
    { title: 'KONTRAINDIKASI ABSOLUT',    keys: absKeys,       accentColor: '#FF3B30' },
    { title: 'KONTRAINDIKASI RELATIF',    keys: relKeys,       accentColor: '#FF9500' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map(sec => (
        <div key={sec.title}>
          <div className="t-caption-2" style={{ color: sec.accentColor, padding: '0 0 8px', fontWeight: 700 }}>
            {sec.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sec.keys.map(k => {
              const f = calc.fields.find(x => x.key === k);
              if (!f) return null;
              return (
                <div
                  key={k}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: values[k] ? sec.accentColor + '12' : 'var(--fill-quaternary)',
                    boxShadow: values[k] ? `inset 0 0 0 1px ${sec.accentColor}44` : 'inset 0 0 0 0.5px var(--separator)',
                    cursor: 'pointer', transition: 'all 180ms',
                  }}
                  onClick={() => setValues(v => ({ ...v, [k]: !v[k] }))}
                >
                  <span className="t-footnote" style={{ flex: 1, marginRight: 10, lineHeight: 1.4 }}>{f.label}</span>
                  <div style={{
                    width: 28, height: 17, borderRadius: 8.5, flexShrink: 0,
                    background: values[k] ? sec.accentColor : 'var(--fill-secondary)',
                    transition: 'background 200ms', position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: 1.5, width: 14, height: 14, borderRadius: 7, background: '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      left: values[k] ? 12 : 1.5, transition: 'left 200ms',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   AbgResultCard
   ============================================================ */
function AbgResultCard({ result, values }: { result: ReturnType<Calculator['compute']>; values: Record<string, number | string | boolean> }) {
  const lines = (result.detail || '').split('\n').filter(Boolean);
  const ph   = Number(values.ph)   || 7.40;
  const pco2 = Number(values.pco2) || 40;
  const hco3 = Number(values.hco3) || 24;
  const na   = Number(values.na)   || 140;
  const cl   = Number(values.cl)   || 104;
  const ag   = na - (cl + hco3);
  const agHigh = ag > 12;

  const phState = ph < 7.35 ? 'acidemia' : ph > 7.45 ? 'alkalemia' : 'normal';
  const phLabel = phState === 'normal' ? 'Normal' : phState === 'acidemia' ? 'Asidemia' : 'Alkalemia';

  const sections: Array<{ title: string; content: string; accent: string }> = [];
  if (lines[0]) sections.push({ title: 'GANGGUAN PRIMER', content: lines[0], accent: result.color });
  if (lines[1]) sections.push({ title: 'ANION GAP', content: lines[1], accent: agHigh ? '#FF9500' : '#34C759' });
  if (lines[2]) sections.push({ title: 'EVALUASI KOMPENSASI', content: lines[2], accent: 'var(--label-secondary)' });
  if (lines[3]) sections.push({ title: 'STATUS KOMPENSASI', content: lines[3], accent: lines[3].includes('ADEKUAT') ? '#34C759' : '#FF9500' });
  if (lines[4]) sections.push({ title: 'DELTA RATIO', content: lines[4], accent: '#AF52DE' });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 17, marginBottom: 8,
        background: `linear-gradient(135deg, ${result.color}cc, ${result.color}44)`,
        padding: '1.5px',
      }}>
      <div style={{
        padding: '15px 17px', borderRadius: 16,
        background: result.color + '14',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ textAlign: 'center', flexShrink: 0,
          padding: '8px 14px', borderRadius: 10, background: result.color + '22' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--label-primary)', lineHeight: 1 }}>
            {ph.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: result.color, letterSpacing: '0.06em', marginTop: 3 }}>pH</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: result.color, display: 'inline-block', flexShrink: 0 }}/>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)' }}>{phLabel}</div>
          </div>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>
            PaCO₂ {pco2} mmHg · HCO₃⁻ {hco3} mEq/L
          </div>
        </div>
      </div>
      </div>
      {sections.map((s, i) => (
        <div key={i} style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 6,
          background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
        }}>
          <div className="t-caption-2" style={{ color: s.accent, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
          <div className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.5 }}>{s.content}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   RsiResultCard
   ============================================================ */
function RsiResultCard({ values }: { values: Record<string, number | string | boolean> }) {
  const wt = Math.max(10, Math.min(200, Number(values.weight) || 70));
  const ctx = String(values.context || 'routine');
  const suxContra = Boolean(values.suxContra);

  const inductionRec = ctx === 'hemodynamic' || ctx === 'asthma' ? 'ketamine' : 'etomidate';
  const paralytic = suxContra ? 'rocuronium' : 'succinylcholine';

  const tag = (text: string, color: string) => (
    <span style={{
      fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.06em',
      background: color + '22', color, borderRadius: 4, padding: '2px 6px',
      marginLeft: 6, verticalAlign: 'middle',
    }}>{text}</span>
  );

  const dose = (label: string, mgKg: number, unit: string, recommended: boolean, accent: string, note?: string) => {
    const total = unit === 'mcg' ? Math.round(mgKg * wt) : unit === 'mg/1dp' ? (mgKg * wt).toFixed(1) : Math.round(mgKg * wt);
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 6,
        background: recommended ? accent + '12' : 'var(--fill-quaternary)',
        boxShadow: recommended ? `inset 0 0 0 1px ${accent}44` : 'inset 0 0 0 0.5px var(--separator)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="t-callout" style={{ fontWeight: 600, color: recommended ? accent : 'var(--label-primary)' }}>
            {label}
            {recommended && tag('REKOMEN', accent)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: recommended ? accent : 'var(--label-primary)' }}>
            {total} {unit === 'mg/1dp' ? 'mg' : unit}
          </div>
        </div>
        <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>
          {unit === 'mcg' ? `${mgKg} mcg/kg × ${wt} kg` : `${mgKg} mg/kg × ${wt} kg`}{note ? ` · ${note}` : ''}
        </div>
      </div>
    );
  };

  const section = (title: string, accent: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <div className="t-caption-2" style={{ color: accent, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );

  const checkItem = (text: string) => (
    <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
      <span style={{ color: '#34C759', fontWeight: 700, flexShrink: 0 }}>✓</span>
      <span className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 15, marginBottom: 12,
        background: 'linear-gradient(135deg, #FF6B35cc, #FF6B3544)',
        padding: '1.5px',
      }}>
      <div style={{
        padding: '13px 15px', borderRadius: 14,
        background: '#FF6B3514',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ textAlign: 'center', flexShrink: 0,
          padding: '8px 12px', borderRadius: 10, background: '#FF6B3522' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--label-primary)', lineHeight: 1 }}>{wt}</div>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#FF6B35', letterSpacing: '0.06em', marginTop: 2 }}>kg</div>
        </div>
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>
          Semua dosis dihitung otomatis berdasarkan berat badan. Sesuaikan dengan kondisi klinis.
        </div>
      </div>
      </div>

      {section('1. PREOXYGENASI', '#34C759', (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
          {checkItem('O₂ 100% via NRM atau BVM selama ≥3 menit')}
          {checkItem('Target SpO₂ >95% sebelum induksi')}
          {checkItem('Posisi sniffing: telinga sejajar sternal notch')}
        </div>
      ))}

      {section('2. PRETREATMENT (3 mnt sebelum RSI, opsional)', '#007AFF', (
        <>
          {dose('Fentanyl', 3, 'mcg', true, '#007AFF', 'respon simpatis, TIK')}
          {ctx === 'icp' && dose('Lidokain', 1.5, 'mg', true, '#5856D6', 'TIK — IV lambat 2–3 menit')}
        </>
      ))}

      {section('3. INDUKSI (pilih 1)', 'var(--warning)', (
        <>
          {dose('Ketamin', 1.5, 'mg', inductionRec === 'ketamine', '#FF9500',
            ctx === 'hemodynamic' ? 'hemodinamik instabil, asma' : ctx === 'asthma' ? 'bronkospasme' : 'simpatomimetik')}
          {dose('Etomidat', 0.3, 'mg/1dp', inductionRec === 'etomidate', '#34C759', 'hemodinamik netral')}
          {dose('Propofol', 1.5, 'mg', false, '#AF52DE', 'awas hipotensi')}
        </>
      ))}

      {section('4. PARALITIK (berikan segera setelah induksi)', 'var(--danger)', (
        <>
          {!suxContra && dose('Suksinilkolin', 1.5, 'mg', paralytic === 'succinylcholine', '#FF3B30', 'onset 45–60 dtk, durasi ~10 mnt')}
          {dose('Rokuronil', 1.2, 'mg', paralytic === 'rocuronium', '#FF9500', 'onset setara sux pada dosis ini')}
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 0 0 0.5px var(--separator)', marginTop: 4 }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 3 }}>REVERSAL ROKURONIL (emergensi)</div>
            <div className="t-footnote" style={{ color: 'var(--label-primary)' }}>
              Sugammadex <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{Math.round(16 * wt)} mg</span> IV (16 mg/kg) — reversal dalam ~3 menit
            </div>
          </div>
        </>
      ))}
    </div>
  );
}

/* ============================================================
   StructuredResultCard — header badge + detail lines as sections
   (dipakai untuk kalkulator dengan output multi-baris: vent, heparin)
   ============================================================ */
function StructuredResultCard({ result }: { result: ReturnType<Calculator['compute']> }) {
  const lines = (result.detail || '').split('\n').filter(Boolean);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 17, marginBottom: 8,
        background: `linear-gradient(135deg, ${result.color}cc, ${result.color}44)`,
        padding: '1.5px',
      }}>
      <div style={{
        padding: '15px 17px', borderRadius: 16,
        background: result.color + '14',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
          color: 'var(--label-primary)', lineHeight: 1, flexShrink: 0,
        }}>{result.score}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: result.color, display: 'inline-block', flexShrink: 0 }}/>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--label-primary)' }}>{result.label}</div>
          </div>
          {result.risk && (
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>{result.risk}</div>
          )}
        </div>
      </div>
      </div>
      {lines.map((line, i) => (
        <div key={i} style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 6,
          background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
        }}>
          <div className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.5 }}>{line}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MobileCalcList
   ============================================================ */
export function MobileCalcList({ nav }: { nav: Nav }) {
  const categories = useMemo(() => {
    const cats: Record<string, typeof CALCULATORS> = {};
    for (const c of CALCULATORS) {
      if (!cats[c.category]) cats[c.category] = [];
      cats[c.category].push(c);
    }
    return cats;
  }, []);

  return (
    <div style={{ overflowY: 'auto', padding: '12px 0 40px' }}>
      <div style={{ padding: '0 16px 16px' }}>
        <div className="t-title-2" style={{ fontWeight: 700, marginBottom: 4 }}>Kalkulator</div>
        <div className="t-footnote" style={{ color: 'var(--label-secondary)' }}>Skoring klinis & kalkulator kardiovaskular</div>
      </div>
      {Object.entries(categories).map(([cat, calcs]) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 16px 8px' }}>
            {cat.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {calcs.map(c => (
              <button
                key={c.key}
                onClick={() => nav.push({ screen: 'calc', id: c.key })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: 'var(--bg-primary)', border: 'none', cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11, background: c.tint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: `0 4px 12px ${c.tint}44`,
                }}>
                  <Icons.calculator size={20} stroke={1.8} style={{ color: '#fff' }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>{c.description}</div>
                </div>
                <Icons.chevR size={16} stroke={2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
              </button>
            ))}
          </div>
        </div>
      ))}
      {/* Panduan Klinis */}
      <div style={{ marginBottom: 24 }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 16px 8px' }}>
          PANDUAN KLINIS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button
            onClick={() => nav.push({ screen: 'vaso' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
              background: 'var(--bg-primary)', border: 'none', cursor: 'pointer',
              textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 11, background: '#34C759',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(52,199,89,0.35)',
            }}>
              <Icons.calculator size={20} stroke={1.8} style={{ color: '#fff' }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-callout" style={{ fontWeight: 600 }}>Vasopressor</div>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>Panduan & kalkulator vasopressor</div>
            </div>
            <Icons.chevR size={16} stroke={2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MobileCalcDetail
   ============================================================ */
export function MobileCalcDetail({ nav, id }: { nav: Nav; id: string }) {
  const calc = CALCULATORS.find(c => c.key === id);

  const initValues = useMemo(() => {
    if (!calc) return {};
    const v: Record<string, number | string | boolean> = {};
    for (const f of calc.fields) {
      if (f.defaultValue !== undefined) v[f.key] = f.defaultValue;
      else if (f.type === 'checkbox') v[f.key] = false;
      else if (f.type === 'number')   v[f.key] = f.min ?? 0;
      else if (f.type === 'select')   v[f.key] = f.options?.[0]?.value ?? 0;
    }
    return v;
  }, [calc]);

  const [values, setValues] = useState<Record<string, number | string | boolean>>(initValues);

  const result = useMemo(() => {
    if (!calc) return null;
    return calc.compute(values);
  }, [calc, values]);

  if (!calc) return <div style={{ padding: 24 }}>Kalkulator tidak ditemukan</div>;

  const isFibrinolytic = calc.key === 'fibrinolytic';
  const isAbg = calc.key === 'abg';
  const isRsi = calc.key === 'rsi';
  const isStructured = calc.key === 'vent' || calc.key === 'heparin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 16px 12px', flexShrink: 0 }}>
        <button
          onClick={nav.pop}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', marginBottom: 8,
          }}
        >
          <Icons.chevL size={16} stroke={2.5}/>
          <span className="t-callout" style={{ fontWeight: 500 }}>Kalkulator</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 13, background: calc.tint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 16px ${calc.tint}44`,
          }}>
            <Icons.calculator size={24} stroke={1.8} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h2 className="t-title-2" style={{ margin: 0, fontWeight: 700 }}>{calc.name}</h2>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{calc.description}</div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        {/* Result / custom cards */}
        {isAbg && result ? (
          <AbgResultCard result={result} values={values}/>
        ) : isRsi ? (
          <RsiResultCard values={values}/>
        ) : isStructured && result ? (
          <StructuredResultCard result={result}/>
        ) : (
          result && <CalcResultBadge result={result} tint={calc.tint}/>
        )}

        {/* Fields */}
        {isFibrinolytic ? (
          <FibrNolyticFields calc={calc} values={values} setValues={setValues}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calc.fields.map(f => (
              <CalcFieldInput
                key={f.key}
                field={f}
                value={values[f.key] ?? (f.type === 'checkbox' ? false : f.defaultValue ?? 0)}
                onChange={val => setValues(v => ({ ...v, [f.key]: val }))}
              />
            ))}
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={() => setValues(initValues)}
          style={{
            marginTop: 16, width: '100%', padding: '12px', borderRadius: 12,
            background: 'var(--fill-quaternary)', border: 'none', cursor: 'pointer',
            color: 'var(--label-secondary)', fontSize: '0.875rem', fontWeight: 500,
          }}
        >
          Reset
        </button>

        {/* Notes */}
        {calc.notes && calc.notes.length > 0 && (
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 12,
            background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
          }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 6 }}>CATATAN KLINIS</div>
            {calc.notes.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < calc.notes!.length - 1 ? 6 : 0 }}>
                <span style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}>•</span>
                <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{n}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{calc.source}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DesktopCalc
   ============================================================ */
export function DesktopCalc({ initialId, onPick }: { initialId?: string; onPick: (type: string, id: string) => void }) {
  const [selectedKey, setSelectedKey] = useState(initialId || CALCULATORS[0].key);
  const [calcQ, setCalcQ] = useState('');
  const isVaso = selectedKey === 'vaso';
  const calc = CALCULATORS.find(c => c.key === selectedKey) || CALCULATORS[0];
  const filteredVaso = calcQ.trim() ? 'Vasopressor'.toLowerCase().includes(calcQ.toLowerCase()) : true;
  const filtered = calcQ.trim()
    ? CALCULATORS.filter(c =>
        c.name.toLowerCase().includes(calcQ.toLowerCase()) ||
        c.description.toLowerCase().includes(calcQ.toLowerCase())
      )
    : CALCULATORS;

  const initValues = useMemo(() => {
    const v: Record<string, number | string | boolean> = {};
    for (const f of calc.fields) {
      if (f.defaultValue !== undefined) v[f.key] = f.defaultValue;
      else if (f.type === 'checkbox') v[f.key] = false;
      else if (f.type === 'number')   v[f.key] = f.min ?? 0;
      else if (f.type === 'select')   v[f.key] = f.options?.[0]?.value ?? 0;
    }
    return v;
  }, [calc.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const [values, setValues] = useState<Record<string, number | string | boolean>>(initValues);

  React.useEffect(() => {
    setValues(initValues);
  }, [calc.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => calc.compute(values), [calc, values]);
  const isFibrinolytic = calc.key === 'fibrinolytic';
  const isAbg = calc.key === 'abg';
  const isRsi = calc.key === 'rsi';
  const isStructured = calc.key === 'vent' || calc.key === 'heparin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="acls-topbar">
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--label-primary)', fontWeight: 600 }}>Kalkulator</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Left panel: list */}
        <div style={{ borderRight: '0.5px solid var(--separator-opaque)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 12px 8px', flexShrink: 0 }}>
            <div className="acls-sidebar-search" style={{ margin: 0 }}>
              <Icons.search size={13} stroke={2}/>
              <input
                value={calcQ}
                onChange={e => setCalcQ(e.target.value)}
                placeholder="Cari kalkulator…"
                style={{
                  flex: 1, background: 'none', border: 0, outline: 'none',
                  color: 'var(--label-primary)', fontSize: '0.8125rem', fontFamily: 'inherit',
                }}
              />
              {calcQ && (
                <button
                  onClick={() => setCalcQ('')}
                  style={{
                    background: 'none', border: 0, cursor: 'pointer', padding: 0,
                    color: 'var(--label-tertiary)', display: 'flex',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px 16px' }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 6px 8px' }}>
              KALKULATOR · {filtered.length}
            </div>
            {filtered.length === 0 && !filteredVaso
              ? <div style={{ padding: '8px 6px', color: 'var(--label-tertiary)', fontSize: '0.8125rem' }}>Tidak ditemukan</div>
              : filtered.map(c => (
                <button
                  key={c.key}
                  onClick={() => { setSelectedKey(c.key); onPick('calc', c.key); }}
                  className={'acls-list-item ' + (!isVaso && selectedKey === c.key ? 'active' : '')}
                >
                  <span style={{ width: 6, height: 30, borderRadius: 3, background: c.tint, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{c.description}</div>
                  </div>
                </button>
              ))
            }
            {filteredVaso && (
              <>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '10px 6px 8px' }}>
                  PANDUAN KLINIS
                </div>
                <button
                  onClick={() => { setSelectedKey('vaso'); onPick('calc', 'vaso'); }}
                  className={'acls-list-item ' + (isVaso ? 'active' : '')}
                >
                  <span style={{ width: 6, height: 30, borderRadius: 3, background: '#34C759', flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div className="t-callout" style={{ fontWeight: 600 }}>Vasopressor</div>
                    <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Panduan & kalkulator vasopressor</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        {isVaso && <VasoScreen/>}
        <div style={{ overflowY: 'auto', padding: '20px 28px 40px', display: isVaso ? 'none' : undefined }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: calc.tint,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 18px ${calc.tint}44`,
            }}>
              <Icons.calculator size={26} stroke={1.8} style={{ color: '#fff' }}/>
            </div>
            <div>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>KALKULATOR KLINIS</div>
              <h2 className="t-title-1" style={{ margin: '2px 0 2px' }}>{calc.name}</h2>
              <div className="t-callout" style={{ color: 'var(--label-secondary)' }}>{calc.description}</div>
            </div>
          </div>

          {isAbg ? (
            <AbgResultCard result={result} values={values}/>
          ) : isRsi ? (
            <RsiResultCard values={values}/>
          ) : isStructured ? (
            <StructuredResultCard result={result}/>
          ) : (
            <CalcResultBadge result={result} tint={calc.tint}/>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {isFibrinolytic ? (
              <FibrNolyticFields calc={calc} values={values} setValues={setValues}/>
            ) : (
              calc.fields.map(f => (
                <CalcFieldInput
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? (f.type === 'checkbox' ? false : f.defaultValue ?? 0)}
                  onChange={val => setValues(v => ({ ...v, [f.key]: val }))}
                />
              ))
            )}
          </div>

          <button
            onClick={() => setValues(initValues)}
            style={{
              padding: '10px 20px', borderRadius: 10, background: 'var(--fill-quaternary)',
              border: 'none', cursor: 'pointer', color: 'var(--label-secondary)', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            Reset
          </button>

          {calc.notes && calc.notes.length > 0 && (
            <div style={{
              marginTop: 20, padding: '14px 16px', borderRadius: 12,
              background: 'rgba(0,0,0,0.03)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
            }}>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>CATATAN KLINIS</div>
              {calc.notes.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < calc.notes!.length - 1 ? 6 : 0 }}>
                  <span style={{ color: 'var(--label-tertiary)' }}>•</span>
                  <span className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, flex: 1 }}>{n}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, color: 'var(--label-tertiary)', fontSize: '0.6875rem' }}>{calc.source}</div>
        </div>
      </div>
    </div>
  );
}
