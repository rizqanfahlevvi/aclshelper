import React, { useState } from 'react';
import { fw } from '../lib/settings';

/* ============================================================
   Komponen klinis reusable — dipakai konsisten di semua fitur
   penghasil dosis/skor (kalkulator, vasopressor, PALS) agar
   rincian langkah, kontribusi skor, dan disclaimer seragam.
   Semua warna via token (tidak ada hex hardcoded).
   ============================================================ */

/* Blok "target koreksi aman" — judul + intro opsional + daftar poin.
   Tampil di atas kartu dosis untuk kalkulator dgn batas keamanan eksplisit
   (mis. koreksi Na: batas kenaikan/24 jam sebelum menentukan resep). */
export function InfoBullets({ title, intro, bullets, tint }: {
  title: string; intro?: string; bullets: string[]; tint?: string;
}) {
  const accent = tint || 'var(--accent)';
  return (
    <div style={{ marginTop: 10 }}>
      <div className="t-callout" style={{ fontWeight: fw(700), color: accent, marginBottom: 4 }}>{title}</div>
      {intro && (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', marginBottom: 6, lineHeight: 1.45 }}>{intro}</div>
      )}
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bullets.map((b, i) => (
          <li key={i} className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.45 }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/* Kartu highlight dosis/volume dengan 1+ metode berdampingan — angka besar
   mono di atas, lalu grid kartu per metode (nilai + laju + catatan), lalu
   catatan batas laju & footer. Dipakai kalkulator kompleks (koreksi Na). */
export function DoseRangeCard({ title, rangeLabel, methods, safetyNote, footer, tint }: {
  title: string; rangeLabel: string;
  methods: { label: string; value: string; rate: string; note: string }[];
  safetyNote?: string; footer?: string; tint?: string;
}) {
  const accent = tint || 'var(--accent)';
  return (
    <div style={{
      marginTop: 10, padding: '12px 14px', borderRadius: 12,
      background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
    }}>
      <div className="t-caption-2" style={{ color: accent, fontWeight: fw(700), marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(800), fontSize: '1.75rem', color: accent, lineHeight: 1.15, marginBottom: 10 }}>
        {rangeLabel}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${methods.length}, 1fr)`, gap: 8, marginBottom: (safetyNote || footer) ? 10 : 0 }}>
        {methods.map((m, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-primary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
            <div className="t-caption-2" style={{ fontWeight: fw(700), color: 'var(--label-primary)', textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(700), fontSize: '0.9375rem', color: 'var(--label-primary)', marginTop: 3 }}>{m.value}</div>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>{m.rate}</div>
            <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.3 }}>{m.note}</div>
          </div>
        ))}
      </div>
      {safetyNote && (
        <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4, marginBottom: footer ? 6 : 0 }}>{safetyNote}</div>
      )}
      {footer && (
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', fontStyle: 'italic', lineHeight: 1.4 }}>{footer}</div>
      )}
    </div>
  );
}

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
      <div className="t-caption-2" style={{ color: accent, fontWeight: fw(700), marginBottom: 8, letterSpacing: '0.04em' }}>
        {title}
      </div>
      {steps ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div className="t-caption-1" style={{ fontWeight: fw(700), color: 'var(--label-primary)', marginBottom: s.formula ? 3 : 0 }}>
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
                  fontWeight: isWarn ? fw(600) : fw(400),
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
      <div className="t-caption-2" style={{ color: accent, fontWeight: fw(700), marginBottom: 8, letterSpacing: '0.04em' }}>
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
                fontFamily: 'var(--font-mono)', fontWeight: fw(700), fontSize: '0.8125rem', flexShrink: 0,
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
        <span className="t-footnote" style={{ fontWeight: fw(700), color: 'var(--label-primary)' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: fw(800), fontSize: '0.9375rem', color: accent }}>
          {total} {unit}
        </span>
      </div>
    </div>
  );
}

/* Blok collapsible generik — dipakai untuk mengecilkan bagian sekunder
   (resep/rincian koreksi lambat saat gejala ringan, blok "Teori &
   Referensi") tanpa menyembunyikannya sepenuhnya. */
export function Accordion({ title, subtitle, tint, defaultOpen = false, children }: {
  title: string; subtitle?: string; tint?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accent = tint || 'var(--accent)';
  return (
    <div style={{
      marginTop: 10, borderRadius: 12, overflow: 'hidden',
      background: 'var(--fill-quaternary)', boxShadow: 'inset 0 0 0 0.5px var(--separator)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <div className="t-callout" style={{ fontWeight: fw(700), color: 'var(--label-primary)' }}>{title}</div>
          {subtitle && <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <span style={{
          color: accent, fontSize: '0.75rem', flexShrink: 0, marginLeft: 10,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms',
        }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
