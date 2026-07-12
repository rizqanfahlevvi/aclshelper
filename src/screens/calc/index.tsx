import React, { useState, useMemo } from 'react';
import { Icons } from '../../components/base';
import type { Nav } from '../../types';
import { CALCULATORS } from '../../data/calculators';
import type { Calculator, CalcField } from '../../data/calculators';
import { Disclaimer, CalcSteps, ScoreBreakdown, InfoBullets, DoseRangeCard, Accordion } from '../../components/clinical';
import { fw } from '../../lib/settings';
import { useFavorites } from '../../utils/favorites';
import { VasoScreen, DefibScreen, PedsScreen, RoscScreen } from '../tools';

/* ============================================================
   CalcNumberField — stepper + direct text input
   ============================================================ */
function CalcNumberField({ field, num, step, onChange }: {
  field: CalcField;
  num: number;
  step: number;
  onChange: (val: number | string | boolean) => void;
}) {
  const [raw, setRaw] = React.useState('');
  const [editing, setEditing] = React.useState(false);

  const clamp = (v: number) => Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, v));
  const commit = (s: string) => {
    const v = parseFloat(s);
    if (!isNaN(v)) onChange(clamp(v));
    setEditing(false);
    setRaw('');
  };

  const btnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8, background: 'var(--fill-secondary)',
    border: 'none', cursor: 'pointer', fontSize: '1.125rem', fontWeight: fw(300),
    color: 'var(--label-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="t-callout" style={{ fontWeight: fw(500) }}>{field.label}</div>
          {field.unit && <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', textTransform: 'uppercase' }}>{field.unit}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={btnStyle} onClick={() => onChange(clamp(num - step))}>−</button>
          {editing ? (
            <input
              autoFocus
              type="number"
              value={raw}
              min={field.min} max={field.max}
              onChange={e => setRaw(e.target.value)}
              onBlur={e => commit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); if (e.key === 'Escape') { setEditing(false); setRaw(''); } }}
              style={{
                width: 72, textAlign: 'center', background: 'var(--bg-primary)', border: 'none',
                borderRadius: 8, padding: '6px 4px', fontSize: '1rem', fontWeight: fw(600),
                color: 'var(--label-primary)', fontFamily: 'var(--font-mono)',
                outline: '2px solid var(--accent)',
              }}
            />
          ) : (
            <div
              onClick={() => { setRaw(String(num)); setEditing(true); }}
              title="Ketuk untuk edit"
              style={{
                width: 72, textAlign: 'center', background: 'var(--bg-primary)',
                borderRadius: 8, padding: '6px 4px', fontSize: '1rem', fontWeight: fw(600),
                color: 'var(--label-primary)', fontFamily: 'var(--font-mono)',
                boxShadow: 'inset 0 0 0 0.5px var(--separator)', cursor: 'text',
              }}
            >
              {num}
            </div>
          )}
          <button style={btnStyle} onClick={() => onChange(clamp(num + step))}>+</button>
        </div>
      </div>
    </div>
  );
}

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
          background: value ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--fill-quaternary)',
          boxShadow: value ? 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent)' : 'inset 0 0 0 0.5px var(--separator)',
          cursor: 'pointer', transition: 'all 180ms',
        }}
        onClick={() => onChange(!value)}
      >
        <div style={{ flex: 1, marginRight: 12 }}>
          <div className="t-callout" style={{ fontWeight: fw(500) }}>{field.label}</div>
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
          background: value ? '#0056B3' : 'var(--fill-secondary)',
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
    return <CalcNumberField field={field} num={num} step={step} onChange={onChange}/>;
  }

  if (field.type === 'select') {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'var(--fill-quaternary)',
        boxShadow: 'inset 0 0 0 0.5px var(--separator)',
      }}>
        <div className="t-callout" style={{ fontWeight: fw(500), marginBottom: 8 }}>{field.label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(field.options || []).map(opt => {
            const selected = value === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => onChange(opt.value)}
                style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', transition: 'all 150ms',
                  background: selected ? 'var(--accent-tint)' : 'var(--fill-secondary)',
                  boxShadow: selected ? 'inset 0 0 0 1px var(--accent)' : 'none',
                  color: selected ? 'var(--accent)' : 'var(--label-primary)',
                }}
              >
                <span className="t-footnote" style={{ fontWeight: selected ? fw(600) : fw(400) }}>{opt.label}</span>
                {opt.description && (
                  <div className="t-caption-2" style={{
                    marginTop: 2, color: selected ? 'var(--accent)' : 'var(--label-tertiary)',
                    opacity: selected ? 0.9 : 0.85, lineHeight: 1.35,
                  }}>{opt.description}</div>
                )}
              </button>
            );
          })}
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
      borderRadius: 16,
      background: result.color,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            fontSize: '3rem', fontWeight: fw(800), fontFamily: 'var(--font-mono)',
            color: '#fff', lineHeight: 1, flexShrink: 0,
          }}>{result.score}</div>
          <div>
            <div style={{ fontWeight: fw(700), fontSize: '1.0625rem', color: '#fff' }}>{result.label}</div>
            {result.risk && (
              <div className="t-footnote" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{result.risk}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Tampilan hasil terpadu — dipakai mobile & desktop agar konsisten:
   kartu jawaban + kontribusi skor (bila skoring) + rincian langkah +
   disclaimer. ABG/RSI/vent/heparin memakai kartu kustomnya sendiri. */
function CalcResultView({ calc, result, values }: {
  calc: Calculator; result: ReturnType<Calculator['compute']>;
  values: Record<string, number | string | boolean>;
}) {
  if (calc.key === 'abg') return <><AbgResultCard result={result} values={values}/><Disclaimer/></>;
  if (calc.key === 'rsi') return <><RsiResultCard values={values}/><Disclaimer/></>;
  if (calc.key === 'vent' || calc.key === 'heparin') return <><StructuredResultCard result={result}/><Disclaimer/></>;
  if (calc.key === 'na-correction' && result.naHypoCard) return <><NaHypoResultCard calc={calc} result={result}/><Disclaimer/></>;
  return (
    <div style={{ marginBottom: 16 }}>
      {result.doseRange ? (
        <div style={{
          borderRadius: 16, padding: '16px', marginBottom: 4,
          background: 'var(--bg-tertiary)',
          boxShadow: `inset 0 0 0 1px ${calc.tint}33, var(--shadow-1)`,
        }}>
          <div className="t-caption-2" style={{ color: calc.tint, fontWeight: fw(700), letterSpacing: '0.04em' }}>
            {result.label.toUpperCase()}
          </div>
          {result.risk && (
            <div className="t-footnote" style={{ color: 'var(--label-secondary)', marginTop: 3 }}>{result.risk}</div>
          )}
          {result.targetInfo && <InfoBullets tint={calc.tint} {...result.targetInfo}/>}
          <DoseRangeCard tint={calc.tint} {...result.doseRange}/>
        </div>
      ) : (
        <>
          <CalcResultBadge result={result} tint={calc.tint}/>
          {result.targetInfo && <InfoBullets tint={calc.tint} {...result.targetInfo}/>}
        </>
      )}
      {result.breakdown && result.breakdown.length > 0 && (
        <ScoreBreakdown items={result.breakdown} total={Number(result.score)} tint={calc.tint}/>
      )}
      {result.steps ? (
        <CalcSteps steps={result.steps} footer={result.stepsFooter} tint={calc.tint}/>
      ) : result.detail && <CalcSteps detail={result.detail} tint={calc.tint}/>}
      <Disclaimer/>
    </div>
  );
}

/* ============================================================
   NaHypoResultCard — koreksi hiponatremia tergated-gejala
   (Spasovski 2014; Verbalis 2013): kartu utama ditentukan
   keparahan gejala (berat/sedang/ringan), bukan angka Na. Koreksi
   lanjutan (2 metode) & teori dikemas dalam accordion agar tidak
   bersaing secara visual dengan keputusan gejala yang lebih penting.
   ============================================================ */
function NaHypoResultCard({ calc, result }: { calc: Calculator; result: ReturnType<Calculator['compute']> }) {
  const card = result.naHypoCard!;
  const { primary } = card;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Kartu utama — tergated gejala LIVE */}
      <div style={{
        borderRadius: 16, padding: '16px', marginBottom: 10,
        background: primary.color, boxShadow: 'var(--shadow-1)',
      }}>
        <div className="t-caption-2" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: fw(700), letterSpacing: '0.04em' }}>
          {card.severity === 'berat' ? 'GEJALA BERAT' : card.severity === 'sedang' ? 'GEJALA SEDANG' : 'GEJALA RINGAN / TIDAK ADA'}
        </div>
        <div className="t-title-3" style={{ color: '#fff', fontWeight: fw(700), marginTop: 3 }}>{primary.title}</div>
        {primary.rateLabel && (
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(800), fontSize: '1.375rem', color: '#fff', marginTop: 8 }}>
            {primary.rateLabel}
          </div>
        )}
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {primary.bullets.map((b, i) => (
            <li key={i} className="t-footnote" style={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.45 }}>{b}</li>
          ))}
        </ul>
      </div>

      {result.targetInfo && <InfoBullets tint={calc.tint} {...result.targetInfo}/>}

      {result.doseRange && (
        <Accordion
          title="Koreksi Lanjutan (Dua Metode)"
          subtitle={card.severity === 'berat' ? 'Setelah gejala mereda — lanjutkan sesuai plafon 24 jam' : 'Estimasi kebutuhan volume NaCl 3% dalam 24 jam'}
          tint={calc.tint}
          defaultOpen={!card.collapseSlowCorrection}
        >
          <DoseRangeCard tint={calc.tint} {...result.doseRange}/>
          {result.steps && <CalcSteps steps={result.steps} footer={result.stepsFooter} tint={calc.tint}/>}
        </Accordion>
      )}

      <Accordion title="Teori & Referensi" tint={calc.tint} defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--label-primary)' }}>1. Dua sumbu keparahan.</strong> Biokimia (ringan 130–135, sedang 125–129, berat/profound &lt;125 mEq/L) dan gejala klinis adalah dua sumbu yang BERBEDA dan bisa tidak sejalan — indikasi NaCl 3% mengikuti gejala, bukan angka biokimia (Spasovski 2014).
          </p>
          <p className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--label-primary)' }}>2. Risiko ODS.</strong> Otak beradaptasi terhadap hiponatremia kronik dengan mengeluarkan osmolit — koreksi cepat pada otak yang sudah beradaptasi (kronik) menarik air keluar sel oligodendrosit → demielinisasi. Onset akut (&lt;48 jam) belum sempat beradaptasi penuh sehingga risiko ODS jauh lebih rendah pada kecepatan koreksi yang sama.
          </p>
          <p className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--label-primary)' }}>3. Terapi berbasis gejala.</strong> Berat → bolus 3% (hentikan krisis serebral, +4–6 mEq/L jam pertama). Sedang → infus tunggal 3%. Ringan/asimtomatik → cari & atasi penyebab (status volume), 3% BUKAN rutin.
          </p>
          <p className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--label-primary)' }}>4. Plafon & rescue.</strong> Plafon ≤10 mEq/L/24 jam (≤8 risiko tinggi ODS) berlaku di semua mode terapi. Bila terlampaui: STOP NaCl hipertonis, D5W ± desmopresin (DDAVP) untuk re-lowering terkontrol (Verbalis 2013).
          </p>
          <p className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--label-primary)' }}>5. Dua rumus & keterbatasan.</strong> Defisit (ΔNa×TBW÷513) dan Adrogué–Madías ((513−Na)/(TBW+1)) sering meleset dari respons aktual (dipengaruhi output urin & penyebab) — selalu ukur Na serial tiap 4–6 jam, jangan andalkan satu perhitungan awal (Adrogué &amp; Madias 2000; Sterns 2015; Adrogué/Tucker/Madias JAMA 2022).
          </p>
          <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginTop: 4 }}>{calc.source}</div>
        </div>
      </Accordion>
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
    { title: 'KRITERIA INKLUSI',          keys: inclusionKeys, accentColor: '#1E8E3E' },
    { title: 'KONTRAINDIKASI ABSOLUT',    keys: absKeys,       accentColor: '#BA1A1A' },
    { title: 'KONTRAINDIKASI RELATIF',    keys: relKeys,       accentColor: '#FFA000' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map(sec => (
        <div key={sec.title}>
          <div className="t-caption-2" style={{ color: sec.accentColor, padding: '0 0 8px', fontWeight: fw(700) }}>
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
   NaCorrectionFields — chip gejala (Berat/Sedang) + field standar.
   Keparahan dihitung LIVE oleh compute() setiap gejala di-toggle —
   komponen ini hanya menyediakan input, bukan menentukan keparahan.
   ============================================================ */
function NaCorrectionFields({ calc, values, setValues }: {
  calc: Calculator;
  values: Record<string, number | string | boolean>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, number | string | boolean>>>;
}) {
  const onChange = (k: string, val: number | string | boolean) => setValues(v => ({ ...v, [k]: val }));
  const SEVERE_KEYS = ['sxVomiting', 'sxCardioResp', 'sxSeizure', 'sxSomnolence', 'sxComaGcs8'];
  const MODERATE_KEYS = ['sxNausea', 'sxConfusion', 'sxHeadache'];
  const topKeys = ['currentNa', 'weight', 'sex', 'glucose'];
  const bottomKeys = ['onset', 'targetRise', 'highRisk'];
  const byKey = (k: string) => calc.fields.find(f => f.key === k);

  const chipGroups: Array<{ title: string; keys: string[]; accentColor: string }> = [
    { title: '🔴 Berat', keys: SEVERE_KEYS, accentColor: '#BA1A1A' },
    { title: '🟠 Sedang', keys: MODERATE_KEYS, accentColor: '#FFA000' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {topKeys.map(k => {
        const f = byKey(k);
        if (!f) return null;
        return (
          <CalcFieldInput key={k} field={f} value={values[k] ?? (f.type === 'checkbox' ? false : f.defaultValue ?? 0)} onChange={val => onChange(k, val)}/>
        );
      })}

      <div>
        <div className="t-callout" style={{ fontWeight: fw(600), marginBottom: 2 }}>Gejala Hiponatremia</div>
        <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>
          Tidak ada yang dicentang = ringan/asimtomatik. Keparahan mengikuti gejala TERBERAT yang tercentang.
        </div>
        {chipGroups.map(g => (
          <div key={g.title} style={{ marginBottom: 8 }}>
            <div className="t-caption-2" style={{ color: g.accentColor, fontWeight: fw(700), marginBottom: 6 }}>{g.title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {g.keys.map(k => {
                const f = byKey(k);
                if (!f) return null;
                const checked = Boolean(values[k]);
                return (
                  <button
                    key={k}
                    onClick={() => setValues(v => ({ ...v, [k]: !v[k] }))}
                    style={{
                      padding: '7px 12px', borderRadius: 999, border: 0, cursor: 'pointer',
                      fontSize: '0.8125rem', fontFamily: 'inherit', fontWeight: fw(checked ? 600 : 400),
                      background: checked ? g.accentColor : 'var(--fill-quaternary)',
                      color: checked ? '#fff' : 'var(--label-primary)',
                      boxShadow: checked ? 'none' : 'inset 0 0 0 0.5px var(--separator)',
                      transition: 'all 150ms',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {byKey('acuteDrop10') && (
        <CalcFieldInput field={byKey('acuteDrop10')!} value={values.acuteDrop10 ?? false} onChange={val => onChange('acuteDrop10', val)}/>
      )}

      <div style={{ borderTop: '0.5px solid var(--separator)', paddingTop: 4 }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>KOREKSI LANJUTAN — PENGATURAN</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bottomKeys.map(k => {
            const f = byKey(k);
            if (!f) return null;
            return (
              <CalcFieldInput key={k} field={f} value={values[k] ?? (f.type === 'checkbox' ? false : f.defaultValue ?? 0)} onChange={val => onChange(k, val)}/>
            );
          })}
        </div>
      </div>
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
  if (lines[1]) sections.push({ title: 'ANION GAP', content: lines[1], accent: agHigh ? '#FFA000' : '#1E8E3E' });
  if (lines[2]) sections.push({ title: 'EVALUASI KOMPENSASI', content: lines[2], accent: 'var(--label-secondary)' });
  if (lines[3]) sections.push({ title: 'STATUS KOMPENSASI', content: lines[3], accent: lines[3].includes('ADEKUAT') ? '#1E8E3E' : '#FFA000' });
  if (lines[4]) sections.push({ title: 'DELTA RATIO', content: lines[4], accent: '#9333EA' });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 16, marginBottom: 8,
        background: result.color, overflow: 'hidden',
      }}>
      <div style={{
        padding: '15px 17px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ textAlign: 'center', flexShrink: 0,
          padding: '8px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: fw(800), fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>
            {ph.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.625rem', fontWeight: fw(700), color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 3 }}>pH</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: fw(700), fontSize: '1rem', color: '#fff', marginBottom: 3 }}>{phLabel}</div>
          <div className="t-caption-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
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
          <div className="t-caption-2" style={{ color: s.accent, fontWeight: fw(700), marginBottom: 4 }}>{s.title}</div>
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
      fontSize: '0.5625rem', fontWeight: fw(700), letterSpacing: '0.06em',
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
          <div className="t-callout" style={{ fontWeight: fw(600), color: recommended ? accent : 'var(--label-primary)' }}>
            {label}
            {recommended && tag('REKOMEN', accent)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: fw(700), color: recommended ? accent : 'var(--label-primary)' }}>
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
      <div className="t-caption-2" style={{ color: accent, fontWeight: fw(700), marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );

  const checkItem = (text: string) => (
    <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
      <span style={{ color: '#1E8E3E', fontWeight: fw(700), flexShrink: 0 }}>✓</span>
      <span className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        borderRadius: 14, marginBottom: 12,
        background: '#FF6B35', overflow: 'hidden',
      }}>
      <div style={{
        padding: '13px 15px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ textAlign: 'center', flexShrink: 0,
          padding: '8px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: fw(800), fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>{wt}</div>
          <div style={{ fontSize: '0.625rem', fontWeight: fw(700), color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 2 }}>kg</div>
        </div>
        <div className="t-footnote" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          Semua dosis dihitung otomatis berdasarkan berat badan. Sesuaikan dengan kondisi klinis.
        </div>
      </div>
      </div>

      {section('1. PREOXYGENASI', '#1E8E3E', (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
          {checkItem('O₂ 100% via NRM atau BVM selama ≥3 menit')}
          {checkItem('Target SpO₂ >95% sebelum induksi')}
          {checkItem('Posisi sniffing: telinga sejajar sternal notch')}
        </div>
      ))}

      {section('2. PRETREATMENT (3 mnt sebelum RSI, opsional)', '#0056B3', (
        <>
          {dose('Fentanyl', 3, 'mcg', true, '#0056B3', 'respon simpatis, TIK')}
          {ctx === 'icp' && dose('Lidokain', 1.5, 'mg', true, '#003F87', 'TIK — IV lambat 2–3 menit')}
        </>
      ))}

      {section('3. INDUKSI (pilih 1)', 'var(--warning)', (
        <>
          {dose('Ketamin', 1.5, 'mg', inductionRec === 'ketamine', '#FFA000',
            ctx === 'hemodynamic' ? 'hemodinamik instabil, asma' : ctx === 'asthma' ? 'bronkospasme' : 'simpatomimetik')}
          {dose('Etomidat', 0.3, 'mg/1dp', inductionRec === 'etomidate', '#1E8E3E', 'hemodinamik netral')}
          {dose('Propofol', 1.5, 'mg', false, '#9333EA', 'awas hipotensi')}
        </>
      ))}

      {section('4. PARALITIK (berikan segera setelah induksi)', 'var(--danger)', (
        <>
          {!suxContra && dose('Suksinilkolin', 1.5, 'mg', paralytic === 'succinylcholine', '#BA1A1A', 'onset 45–60 dtk, durasi ~10 mnt')}
          {dose('Rokuronil', 1.2, 'mg', paralytic === 'rocuronium', '#FFA000', 'onset setara sux pada dosis ini')}
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 0 0 0.5px var(--separator)', marginTop: 4 }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 3 }}>REVERSAL ROKURONIL (emergensi)</div>
            <div className="t-footnote" style={{ color: 'var(--label-primary)' }}>
              Sugammadex <span style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(700) }}>{Math.round(16 * wt)} mg</span> IV (16 mg/kg) — reversal dalam ~3 menit
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
        borderRadius: 14, marginBottom: 8,
        background: result.color, overflow: 'hidden',
      }}>
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontSize: '1.6rem', fontWeight: fw(800), fontFamily: 'var(--font-mono)',
          color: '#fff', lineHeight: 1, flexShrink: 0,
        }}>{result.score}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: fw(700), fontSize: '1rem', color: '#fff' }}>{result.label}</div>
          {result.risk && (
            <div className="t-caption-1" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{result.risk}</div>
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
   CalcListItem — shared row component
   ============================================================ */
function CalcListItem({ name, description, tint, onClick }: {
  name: string; description: string; tint: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        background: 'var(--bg-primary)', border: 'none', cursor: 'pointer',
        textAlign: 'left', width: '100%',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 11, background: tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: `0 4px 12px ${tint}44`,
      }}>
        <Icons.calculator size={20} stroke={1.8} style={{ color: '#fff' }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-callout" style={{ fontWeight: fw(600) }}>{name}</div>
        <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>{description}</div>
      </div>
      <Icons.chevR size={16} stroke={2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
    </button>
  );
}

/* ============================================================
   MobileCalcList / MobileScoringList
   ============================================================ */
function groupByCategory(kind: 'scoring' | 'calculator'): Record<string, typeof CALCULATORS> {
  const g: Record<string, typeof CALCULATORS> = {};
  for (const c of CALCULATORS) {
    if (c.kind !== kind) continue;
    if (!g[c.category]) g[c.category] = [];
    g[c.category].push(c);
  }
  return g;
}

function MobileCalcKindList({ nav, kind, title, showPanduan }: { nav: Nav; kind: 'scoring' | 'calculator'; title: string; showPanduan?: boolean }) {
  const categories = useMemo(() => groupByCategory(kind), [kind]);
  const frameKey: 'calc' | 'scoring' = kind === 'scoring' ? 'scoring' : 'calc';

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-primary)',
        borderBottom: '0.5px solid var(--separator)',
        padding: '12px 16px 10px',
      }}>
        <div className="t-title-2" style={{ fontWeight: fw(700) }}>{title}</div>
      </div>

      {/* List */}
      <div style={{ paddingTop: 8 }}>
        {Object.entries(categories).map(([cat, calcs]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 16px 8px' }}>
              {cat.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {calcs.map(c => (
                <CalcListItem
                  key={c.key}
                  name={c.name}
                  description={c.description}
                  tint={c.tint}
                  onClick={() => nav.push({ screen: frameKey, id: c.key })}
                />
              ))}
            </div>
          </div>
        ))}

        {showPanduan && (
          <div style={{ marginBottom: 20 }}>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 16px 8px' }}>
              PANDUAN KLINIS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <CalcListItem name="Vasopressor"        description="Panduan & kalkulator vasopressor"     tint="#1E8E3E" onClick={() => nav.push({ screen: 'vaso'  })}/>
              <CalcListItem name="Panduan Defibrilasi" description="Energi defib & kardioversi per ritme" tint="#BA1A1A" onClick={() => nav.push({ screen: 'defib' })}/>
              <CalcListItem name="Post-ROSC Care"     description="Checklist pasca Return of Spontaneous Circulation" tint="#FFA000" onClick={() => nav.push({ screen: 'rosc'  })}/>
              <CalcListItem name="Referensi Pediatrik" description="Dosis PALS berbasis berat badan"      tint="#00838F" onClick={() => nav.push({ screen: 'peds'  })}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileCalcList({ nav }: { nav: Nav }) {
  return <MobileCalcKindList nav={nav} kind="calculator" title="Kalkulator" showPanduan/>;
}

export function MobileScoringList({ nav }: { nav: Nav }) {
  return <MobileCalcKindList nav={nav} kind="scoring" title="Skoring"/>;
}

/* ============================================================
   MobileCalcDetail
   ============================================================ */
export function MobileCalcDetail({ nav, id }: { nav: Nav; id: string }) {
  const calc = CALCULATORS.find(c => c.key === id);
  const { isFav: mIsFav, toggle: mToggle } = useFavorites();

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
  const isNaCorrection = calc.key === 'na-correction';

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
          <span className="t-callout" style={{ fontWeight: fw(500) }}>{calc.kind === 'scoring' ? 'Skoring' : 'Kalkulator'}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 13, background: calc.tint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 16px ${calc.tint}44`,
          }}>
            {calc.kind === 'scoring'
              ? <Icons.trending size={24} stroke={1.8} style={{ color: '#fff' }}/>
              : <Icons.calculator size={24} stroke={1.8} style={{ color: '#fff' }}/>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="t-title-2" style={{ margin: 0, fontWeight: fw(700) }}>{calc.name}</h2>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{calc.description}</div>
          </div>
          <button onClick={() => mToggle('calc', calc.key)} style={{
            width: 36, height: 36, borderRadius: 10, border: 0, cursor: 'pointer', flexShrink: 0,
            background: mIsFav('calc', calc.key) ? 'var(--accent-tint)' : 'var(--fill-tertiary)',
            color: mIsFav('calc', calc.key) ? 'var(--accent)' : 'var(--label-secondary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms',
          }}>
            <Icons.bookmark size={17} stroke={2}/>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
        {/* Fields — diisi dulu sebelum melihat hasil (alur baca alami:
            atas-ke-bawah, hasil menyusul di bawah setelah input) */}
        {isFibrinolytic ? (
          <FibrNolyticFields calc={calc} values={values} setValues={setValues}/>
        ) : isNaCorrection ? (
          <NaCorrectionFields calc={calc} values={values} setValues={setValues}/>
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

        {/* Result — tampilan terpadu (jawaban + kontribusi/langkah + disclaimer) */}
        {result && (
          <div style={{ marginTop: 16 }}>
            <CalcResultView calc={calc} result={result} values={values}/>
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={() => setValues(initValues)}
          style={{
            marginTop: 16, width: '100%', padding: '12px', borderRadius: 12,
            background: 'var(--fill-quaternary)', border: 'none', cursor: 'pointer',
            color: 'var(--label-secondary)', fontSize: '0.875rem', fontWeight: fw(500),
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
function DesktopCalcKindPanel({ kind, initialId, onPick }: { kind: 'scoring' | 'calculator'; initialId?: string; onPick: (type: string, id: string) => void }) {
  const kindItems = useMemo(() => CALCULATORS.filter(c => c.kind === kind), [kind]);
  const frameKey: 'calc' | 'scoring' = kind === 'scoring' ? 'scoring' : 'calc';
  const kindLabel = kind === 'scoring' ? 'Skoring' : 'Kalkulator';
  const [selectedKey, setSelectedKey] = useState(initialId || kindItems[0].key);
  const [calcQ, setCalcQ] = useState('');
  const isVaso   = kind === 'calculator' && selectedKey === 'vaso';
  const isDefib  = kind === 'calculator' && selectedKey === 'defib';
  const isRoscD  = kind === 'calculator' && selectedKey === 'rosc-tool';
  const isPedsD  = kind === 'calculator' && selectedKey === 'peds-tool';
  const isToolPanel = isVaso || isDefib || isRoscD || isPedsD;
  const calc = CALCULATORS.find(c => c.key === selectedKey) || kindItems[0];

  const PANDUAN_ITEMS = kind === 'calculator' ? [
    { key: 'vaso',      name: 'Vasopressor',         desc: 'Panduan & kalkulator vasopressor',          tint: '#1E8E3E' },
    { key: 'defib',     name: 'Panduan Defibrilasi',  desc: 'Energi defib & kardioversi per ritme',      tint: '#BA1A1A' },
    { key: 'rosc-tool', name: 'Post-ROSC Care',       desc: 'Checklist pasca Return of Spontaneous Circulation', tint: '#FFA000' },
    { key: 'peds-tool', name: 'Referensi Pediatrik',  desc: 'Dosis PALS berbasis berat badan',           tint: '#00838F' },
  ] : [];
  const filteredPanduan = calcQ.trim()
    ? PANDUAN_ITEMS.filter(p => p.name.toLowerCase().includes(calcQ.toLowerCase()) || p.desc.toLowerCase().includes(calcQ.toLowerCase()))
    : PANDUAN_ITEMS;
  const filtered = calcQ.trim()
    ? kindItems.filter(c =>
        c.name.toLowerCase().includes(calcQ.toLowerCase()) ||
        c.description.toLowerCase().includes(calcQ.toLowerCase())
      )
    : kindItems;

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
  const isNaCorrection = calc.key === 'na-correction';
  const { isFav: dIsFav, toggle: dToggle } = useFavorites();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="acls-topbar">
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--label-primary)', fontWeight: fw(600) }}>{kindLabel}</span>
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
                placeholder={kind === 'scoring' ? 'Cari skor…' : 'Cari kalkulator…'}
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
            {filtered.length === 0 && filteredPanduan.length === 0
              ? <div style={{ padding: '8px 6px', color: 'var(--label-tertiary)', fontSize: '0.8125rem' }}>Tidak ditemukan</div>
              : filtered.length > 0 && (
                  <>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '8px 6px 6px' }}>
                      {kindLabel.toUpperCase()} · {filtered.length}
                    </div>
                    {filtered.map(c => (
                      <button
                        key={c.key}
                        onClick={() => { setSelectedKey(c.key); onPick(frameKey, c.key); }}
                        className={'acls-list-item ' + (!isToolPanel && selectedKey === c.key ? 'active' : '')}
                      >
                        <span style={{ width: 6, height: 30, borderRadius: 3, background: c.tint, flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div className="t-callout" style={{ fontWeight: fw(600) }}>{c.name}</div>
                          <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{c.description}</div>
                        </div>
                      </button>
                    ))}
                  </>
                )
            }
            {filteredPanduan.length > 0 && (
              <>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '12px 6px 6px' }}>
                  PANDUAN KLINIS
                </div>
                {filteredPanduan.map(p => (
                  <button key={p.key}
                    onClick={() => { setSelectedKey(p.key); onPick('calc', p.key); }}
                    className={'acls-list-item ' + (selectedKey === p.key ? 'active' : '')}
                  >
                    <span style={{ width: 6, height: 30, borderRadius: 3, background: p.tint, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="t-callout" style={{ fontWeight: fw(600) }}>{p.name}</div>
                      <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{p.desc}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right panel: tool panels */}
        {isVaso   && <VasoScreen/>}
        {isDefib  && <DefibScreen isMobile={false}/>}
        {isRoscD  && <RoscScreen isMobile={false}/>}
        {isPedsD  && <PedsScreen isMobile={false}/>}
        <div style={{ overflowY: 'auto', padding: '20px 28px 40px', display: isToolPanel ? 'none' : undefined }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: calc.tint,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 18px ${calc.tint}44`,
            }}>
              {kind === 'scoring'
                ? <Icons.trending size={26} stroke={1.8} style={{ color: '#fff' }}/>
                : <Icons.calculator size={26} stroke={1.8} style={{ color: '#fff' }}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>{kind === 'scoring' ? 'SKORING KLINIS' : 'KALKULATOR KLINIS'}</div>
              <h2 className="t-title-1" style={{ margin: '2px 0 2px' }}>{calc.name}</h2>
              <div className="t-callout" style={{ color: 'var(--label-secondary)' }}>{calc.description}</div>
            </div>
            <button onClick={() => dToggle('calc', calc.key)} style={{
              width: 36, height: 36, borderRadius: 10, border: 0, cursor: 'pointer', flexShrink: 0,
              background: dIsFav('calc', calc.key) ? 'var(--accent-tint)' : 'var(--fill-tertiary)',
              color: dIsFav('calc', calc.key) ? 'var(--accent)' : 'var(--label-secondary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms',
            }}>
              <Icons.bookmark size={17} stroke={2}/>
            </button>
          </div>

          <CalcResultView calc={calc} result={result} values={values}/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {isFibrinolytic ? (
              <FibrNolyticFields calc={calc} values={values} setValues={setValues}/>
            ) : isNaCorrection ? (
              <NaCorrectionFields calc={calc} values={values} setValues={setValues}/>
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
              border: 'none', cursor: 'pointer', color: 'var(--label-secondary)', fontSize: '0.875rem', fontWeight: fw(500),
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

export function DesktopCalc({ initialId, onPick }: { initialId?: string; onPick: (type: string, id: string) => void }) {
  return <DesktopCalcKindPanel kind="calculator" initialId={initialId} onPick={onPick}/>;
}

export function DesktopScoring({ initialId, onPick }: { initialId?: string; onPick: (type: string, id: string) => void }) {
  return <DesktopCalcKindPanel kind="scoring" initialId={initialId} onPick={onPick}/>;
}
