import React from 'react';

/* ============================================================
   Komponen klinis reusable — dipakai konsisten di semua fitur
   penghasil dosis/skor (kalkulator, vasopressor, PALS) agar
   rincian langkah, kontribusi skor, dan disclaimer seragam.
   Semua warna via token (tidak ada hex hardcoded).
   ============================================================ */

/* Disclaimer ringkas di titik-pakai — WAJIB pada fitur penghasil dosis. */
export function Disclaimer() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12,
      padding: '8px 11px', borderRadius: 10,
      background: 'color-mix(in srgb, var(--warning) 9%, transparent)',
    }}>
      <span style={{ flexShrink: 0, fontSize: '0.8125rem', lineHeight: 1.4 }}>⚠️</span>
      <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.45 }}>
        Alat bantu edukasi &amp; referensi cepat — <strong style={{ color: 'var(--label-primary)' }}>bukan pengganti
        penilaian klinis atau keputusan DPJP/intensivist</strong>. Nilai ulang sesuai kondisi pasien.
      </span>
    </div>
  );
}

export interface CalcStep {
  /** Judul langkah, mis. "Langkah 1 — Total Body Water (TBW)" */
  label: string;
  /** Baris rumus + substitusi angka (monospace). Gunakan \n untuk baris baru. */
  formula?: string;
  /** Catatan kecil di bawah rumus (kenapa faktor ini, batas aman, dll.) */
  note?: string;
}

interface CalcStepsProps {
  /** Bentuk lama: string \n-joined (dipakai 21 kalkulator lain, dipertahankan). */
  detail?: string;
  /** Bentuk baru: tiap langkah = label + rumus tersubstitusi + catatan. */
  steps?: CalcStep[];
  /** Catatan penutup di bawah semua langkah (disclaimer estimasi awal, dll.) */
  footer?: string;
  title?: string;
  tint?: string;
}

/* Rincian langkah perhitungan — dua mode:
   - steps: array {label, formula, note} → tiap langkah dirender terpisah
     dengan judul tebal + rumus mono + catatan kecil (dipakai kalkulator
     elektrolit Na/K/Ca/Mg).
   - detail: string \n-joined lama, tetap didukung agar 21 kalkulator lain
     tidak perlu diubah. */
export function CalcSteps({ detail, steps, footer, tint, title = 'RINCIAN PERHITUNGAN' }: CalcStepsProps) {
  const accent = tint || 'var(--accent)';
  return (
    <div style={{
      marginTop: 10, marginBottom: 4, padding: '12px 14px', borderRadius: 12,
      background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
    }}>
      <div className="t-caption-2" style={{ color: accent, fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
        {title}
      </div>
      {steps ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div className="t-caption-1" style={{ fontWeight: 700, color: 'var(--label-primary)', marginBottom: s.formula ? 3 : 0 }}>
                {s.label}
              </div>
              {s.formula && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.6,
                  color: 'var(--label-secondary)', whiteSpace: 'pre-line',
                  paddingLeft: 8, borderLeft: `2px solid ${accent}55`,
                }}>{s.formula}</div>
              )}
              {s.note && (
                <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 }}>
                  {s.note}
                </div>
              )}
            </div>
          ))}
          {footer && (
            <div className="t-caption-2" style={{
              color: 'var(--label-tertiary)', fontStyle: 'italic', lineHeight: 1.4,
              borderTop: '0.5px solid var(--separator)', paddingTop: 8, marginTop: 2,
            }}>{footer}</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(detail || '').split('\n').map(l => l.trimEnd()).map((ln, i) => {
            if (ln === '') return <div key={i} style={{ height: 2 }}/>;
            const isWarn = ln.startsWith('⚠️');
            const isCalc = ln.includes('=') || ln.includes('→');
            return (
              <div key={i} style={{
                display: 'flex', gap: 7, alignItems: 'baseline',
                fontSize: '0.8125rem', lineHeight: 1.5,
                color: isWarn ? 'var(--warning)' : 'var(--label-secondary)',
              }}>
                {!isWarn && <span style={{ color: accent, flexShrink: 0, fontSize: '0.625rem', marginTop: 1 }}>●</span>}
                <span style={{
                  fontFamily: isCalc && !isWarn ? 'var(--font-mono)' : 'inherit',
                  color: isWarn ? 'var(--warning)' : undefined,
                  fontWeight: isWarn ? 600 : 400,
                }}>{ln}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface BreakdownItem { label: string; points: number; }

/* Kontribusi tiap parameter pada skoring: input → poin, lalu total. */
export function ScoreBreakdown({ items, total, tint, unit = 'poin' }: {
  items: BreakdownItem[]; total: number; tint?: string; unit?: string;
}) {
  const accent = tint || 'var(--accent)';
  return (
    <div style={{
      marginTop: 10, marginBottom: 4, padding: '12px 14px', borderRadius: 12,
      background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
    }}>
      <div className="t-caption-2" style={{ color: accent, fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
        KONTRIBUSI SKOR
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it, i) => {
          const on = it.points > 0;
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
              opacity: on ? 1 : 0.5,
            }}>
              <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{it.label}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                color: on ? accent : 'var(--label-tertiary)',
              }}>{it.points > 0 ? `+${it.points}` : it.points}</span>
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginTop: 8, paddingTop: 8, borderTop: `0.5px solid ${accent}44`,
      }}>
        <span className="t-footnote" style={{ fontWeight: 700, color: 'var(--label-primary)' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9375rem', color: accent }}>
          {total} {unit}
        </span>
      </div>
    </div>
  );
}
