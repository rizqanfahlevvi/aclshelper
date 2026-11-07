import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fw } from '../../../lib/settings';
import { CalcSteps, type CalcStep } from '../../../components/clinical';

/* ============================================================
   Blok UI bersama modul Koreksi Elektrolit (Na/K/Ca/Mg) — port dari
   ICU Helper (ElektroUI.tsx) ke token ACLS. Tanpa Tailwind; semua
   warna via token (light/dark otomatis) dan semua ukuran teks dalam
   rem / kelas .t-* agar ikut slider "Ukuran Font" (root font-size).
   ============================================================ */

type StrSetter = Dispatch<SetStateAction<string>> | ((v: string) => void);

export type Tone = 'blue' | 'red' | 'amber' | 'emerald' | 'slate' | 'cyan';

/** Warna dasar tiap tone (token ACLS). */
const TONE_BASE: Record<Tone, string> = {
  blue: 'var(--sys-blue)',
  red: 'var(--danger)',
  amber: 'var(--warning)',
  emerald: 'var(--success)',
  slate: 'var(--label-tertiary)',
  cyan: 'var(--sys-cyan)',
};

/** Warna teks/aksen berkontras cukup di light & dark (dicampur dengan label-primary). */
export const toneText = (t: Tone) =>
  t === 'slate' ? 'var(--label-secondary)' : `color-mix(in srgb, ${TONE_BASE[t]} 72%, var(--label-primary))`;
export const toneBg = (t: Tone, pct = 8) =>
  t === 'slate' ? 'var(--fill-quaternary)' : `color-mix(in srgb, ${TONE_BASE[t]} ${pct}%, transparent)`;
export const toneBorder = (t: Tone, pct = 30) =>
  t === 'slate' ? 'var(--separator)' : `color-mix(in srgb, ${TONE_BASE[t]} ${pct}%, transparent)`;
export const toneAccent = (t: Tone) => TONE_BASE[t];

const monoNum: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontWeight: fw(700) };

/* ── Input ──────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%', minWidth: 0, background: 'var(--bg-primary)', border: 0, borderRadius: 8,
  padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: fw(600),
  fontSize: '0.875rem', color: 'var(--label-primary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
  outline: 'none',
};
export const selectStyle: React.CSSProperties = { ...inputStyle, fontFamily: 'inherit', cursor: 'pointer', flex: 1 };

/** Panel yang membungkus baris-baris input (dipisah garis tipis). */
export function InputPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 12, background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
      display: 'flex', flexDirection: 'column',
    }} className="elektro-input-panel">
      {children}
    </div>
  );
}

export function FieldRow({ label, sub, children }: { label: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: '0.5px solid var(--separator)' }} className="elektro-row">
      <span style={{ flexShrink: 0, maxWidth: '55%' }}>
        <span className="t-footnote" style={{ display: 'block', fontWeight: fw(600), color: 'var(--label-primary)' }}>{label}</span>
        {sub && <span className="t-caption-2" style={{ display: 'block', color: 'var(--label-tertiary)', marginTop: 1 }}>{sub}</span>}
      </span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function NumField({ value, onChange, placeholder, unit, step = 'any' }: { value: string; onChange: StrSetter; placeholder?: string; unit?: string; step?: string }) {
  return (
    <>
      <input type="number" inputMode="decimal" step={step} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} style={{ ...inputStyle, maxWidth: 140 }} />
      {unit !== undefined && <span className="t-caption-1" style={{ width: 52, flexShrink: 0, color: 'var(--label-tertiary)', fontWeight: fw(600) }}>{unit}</span>}
    </>
  );
}

export function SelectField<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as T)} style={{ ...selectStyle, maxWidth: 220 }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export interface ChipOption { value: string; label: string; note?: string }

const chipStyle = (on: boolean, tone: Tone = 'blue'): React.CSSProperties => ({
  padding: '6px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
  border: `1px solid ${on ? toneBorder(tone, 45) : 'var(--separator)'}`,
  background: on ? toneBg(tone, 14) : 'var(--bg-primary)',
  color: on ? toneText(tone) : 'var(--label-secondary)',
  fontWeight: on ? fw(600) : fw(400), transition: 'all 150ms',
});

/** Input target + chip rujukan. Pengguna bisa mengetik bebas atau memilih saran ber-referensi. */
export function TargetField({ label, sub, value, onChange, unit, step, options }: {
  label: React.ReactNode; sub?: React.ReactNode; value: string; onChange: StrSetter; unit: string; step?: string; options: ChipOption[];
}) {
  const active = options.find(o => o.value === value);
  return (
    <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--separator)' }} className="elektro-row">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ flexShrink: 0, maxWidth: '55%' }}>
          <span className="t-footnote" style={{ display: 'block', fontWeight: fw(600), color: 'var(--label-primary)' }}>{label}</span>
          {sub && <span className="t-caption-2" style={{ display: 'block', color: 'var(--label-tertiary)', marginTop: 1 }}>{sub}</span>}
        </span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
          <NumField value={value} onChange={onChange} unit={unit} step={step} />
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {options.map(o => (
          <button key={o.value + o.label} type="button" onClick={() => onChange(o.value)} className="t-caption-2" style={chipStyle(value === o.value)}>
            {o.value} · {o.label}
          </button>
        ))}
      </div>
      {active?.note && <p className="t-caption-2" style={{ margin: '6px 0 0', fontStyle: 'italic', color: 'var(--label-secondary)', lineHeight: 1.45 }}>{active.note}</p>}
    </div>
  );
}

/** Helper state untuk Set toggle. */
export function useToggleSet(initial: string[] = []) {
  const [set, setSet] = useState<Set<string>>(new Set(initial));
  const toggle = (s: string) => setSet(prev => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });
  return [set, toggle, setSet] as const;
}

/** Daftar toggle (checklist) — gejala, faktor risiko, temuan EKG. */
export function ToggleList({ title, hint, items, selected, onToggle, tone = 'blue' }: {
  title: React.ReactNode; hint?: React.ReactNode; items: string[]; selected: Set<string>; onToggle: (s: string) => void; tone?: Tone;
}) {
  return (
    <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--separator)' }} className="elektro-row">
      <div className="t-footnote" style={{ fontWeight: fw(600), color: 'var(--label-primary)', marginBottom: 2 }}>{title}</div>
      {hint && <p className="t-caption-2" style={{ margin: '0 0 8px', color: 'var(--label-tertiary)', lineHeight: 1.45 }}>{hint}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(s => (
          <button key={s} type="button" onClick={() => onToggle(s)} className="t-caption-1" style={chipStyle(selected.has(s), tone)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tombol "Hitung Koreksi" — hasil tampil setelah ditekan, lalu ikut berubah live. */
export function CalcButton({ onClick, tone }: { onClick: () => void; tone: Tone }) {
  return (
    <button type="button" onClick={onClick} className="t-subheadline" style={{
      width: '100%', marginTop: 14, padding: '13px 16px', borderRadius: 14, border: 0, cursor: 'pointer',
      background: toneAccent(tone), color: 'var(--label-on-color)', fontWeight: fw(700),
      boxShadow: `0 4px 12px ${toneBorder(tone, 30)}`,
    }}>
      Hitung Koreksi
    </button>
  );
}

/* ── Hasil ──────────────────────────────────────────────────── */

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="t-footnote" style={{ fontWeight: fw(700), textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--label-secondary)', paddingTop: 6 }}>{children}</div>;
}

/** Kartu ber-tone (latar tipis + garis). */
export function Card({ tone = 'slate', children, plain }: { tone?: Tone; children: React.ReactNode; plain?: boolean }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 16, textAlign: 'left',
      background: plain ? 'var(--bg-primary)' : toneBg(tone),
      boxShadow: `inset 0 0 0 1px ${plain ? 'var(--separator)' : toneBorder(tone, 25)}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>{children}</div>
  );
}

export function Eyebrow({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <div className="t-caption-1" style={{ fontWeight: fw(700), textTransform: 'uppercase', letterSpacing: '0.04em', color: toneText(tone) }}>{children}</div>;
}

export function BigNumber({ tone, children, size = 'lg' }: { tone: Tone; children: React.ReactNode; size?: 'lg' | 'md' }) {
  return <div style={{ ...monoNum, fontWeight: fw(800), fontSize: size === 'lg' ? '1.5rem' : '1.25rem', lineHeight: 1.2, color: tone === 'slate' ? 'var(--label-primary)' : toneText(tone) }}>{children}</div>;
}

export function SmallText({ children, tone, italic, mono, strong }: { children: React.ReactNode; tone?: Tone; italic?: boolean; mono?: boolean; strong?: boolean }) {
  return (
    <p className="t-caption-1" style={{
      margin: 0, lineHeight: 1.5, color: tone ? toneText(tone) : 'var(--label-secondary)',
      fontStyle: italic ? 'italic' : undefined, fontFamily: mono ? 'var(--font-mono)' : undefined,
      fontWeight: strong ? fw(700) : undefined,
    }}>{children}</p>
  );
}

export interface MiniBoxData { title: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean }

/** Tiga kotak ringkas di bawah angka utama. */
export function MiniBoxes({ tone, boxes }: { tone: Tone; boxes: MiniBoxData[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${boxes.length}, minmax(0, 1fr))`, gap: 8, marginTop: 6 }}>
      {boxes.map((b, i) => (
        <div key={i} style={{
          padding: '8px 9px', borderRadius: 10, background: 'var(--bg-primary)', minWidth: 0,
          boxShadow: `inset 0 0 0 ${b.strong ? 1 : 0.5}px ${b.strong ? toneBorder(tone, 50) : toneBorder(tone, 25)}`,
        }}>
          <div className="t-caption-2" style={{ fontWeight: fw(700), color: toneText(tone) }}>{b.title}</div>
          <div style={{ ...monoNum, fontSize: '0.875rem', color: 'var(--label-primary)', marginTop: 2, overflowWrap: 'anywhere' }}>{b.value}</div>
          {b.sub && <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>{b.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/** Rincian langkah perhitungan (rumus + substitusi). Membungkus CalcSteps klinis ACLS. */
export function Steps({ steps, title = 'Rincian Perhitungan (Langkah demi Langkah)', footer, tone = 'blue' }: {
  steps: CalcStep[]; title?: string; footer?: string; tone?: Tone;
}) {
  return <CalcSteps steps={steps} title={title} footer={footer} tint={tone === 'slate' ? 'var(--label-secondary)' : toneText(tone)} />;
}

export type FlowState = 'now' | 'todo' | 'done' | 'skip';
export interface FlowStep { title: string; body: React.ReactNode; state?: FlowState }

/**
 * "Alur Strategi Koreksi" — urutan langkah klinis bernomor. Langkah yang relevan untuk
 * pasien ini ditandai 'now' (aktif), yang tidak relevan 'skip' (dipudarkan).
 */
export function StrategyFlow({ title = '🧭 Alur Strategi Koreksi', steps }: { title?: string; steps: FlowStep[] }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--bg-primary)', boxShadow: 'inset 0 0 0 1px var(--separator)' }}>
      <div className="t-footnote" style={{ fontWeight: fw(700), textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--label-secondary)', marginBottom: 10 }}>{title}</div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => {
          const st = s.state ?? 'todo';
          const badgeBg = st === 'now' ? 'var(--sys-blue)' : st === 'done' ? 'var(--success)' : 'var(--fill-primary)';
          const badgeFg = st === 'now' || st === 'done' ? 'var(--label-on-color)' : 'var(--label-primary)';
          return (
            <li key={i} style={{ display: 'flex', gap: 10, opacity: st === 'skip' ? 0.5 : 1 }}>
              <span className="t-caption-1" style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: badgeBg, color: badgeFg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: fw(700),
              }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-footnote" style={{ fontWeight: fw(700), color: st === 'now' ? toneText('blue') : 'var(--label-primary)' }}>
                  {s.title}{st === 'skip' && <span className="t-caption-2" style={{ marginLeft: 4, fontWeight: fw(400), fontStyle: 'italic' }}>(tidak relevan saat ini)</span>}
                </div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5, marginTop: 2 }}>{s.body}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Kotak info kecil berwarna. */
export function InfoBox({ tone = 'slate', title, children }: { tone?: Tone; title?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="t-caption-1" style={{
      padding: '10px 12px', borderRadius: 12, lineHeight: 1.5, textAlign: 'left',
      background: toneBg(tone, 10), boxShadow: `inset 0 0 0 1px ${toneBorder(tone, 30)}`,
      color: tone === 'slate' ? 'var(--label-secondary)' : 'var(--label-primary)',
    }}>
      {title && <div className="t-footnote" style={{ fontWeight: fw(700), marginBottom: 3, color: toneText(tone) }}>{title}</div>}
      {children}
    </div>
  );
}

/** Judul InfoBox dengan ikon peringatan. */
export function WarnTitle({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} />{children}</span>;
}

/** Daftar butir (ul) dengan gaya seragam. */
export function Bullets({ items, ordered }: { items: React.ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="t-caption-1" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--label-secondary)', lineHeight: 1.5 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </Tag>
  );
}

export function RefLine({ children }: { children: React.ReactNode }) {
  return <p className="t-caption-2" style={{ margin: 0, fontStyle: 'italic', textAlign: 'center', color: 'var(--label-tertiary)', borderTop: '0.5px solid var(--separator)', paddingTop: 10, lineHeight: 1.5 }}>📚 {children}</p>;
}

/** Peringatan input NON-BLOCKING (amber). Render null bila tidak ada pesan. */
export function InputWarning({ messages }: { messages: (string | null)[] }) {
  const list = messages.filter((m): m is string => !!m);
  if (list.length === 0) return null;
  return (
    <InfoBox tone="amber">
      {list.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: i ? 4 : 0 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2, color: toneText('amber') }} />
          <span>{m}</span>
        </div>
      ))}
    </InfoBox>
  );
}

/** Tumpukan hasil dengan jarak seragam. */
export function ResultStack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>{children}</div>;
}

export const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '–');
