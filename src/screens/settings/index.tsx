import React, { useState, useEffect } from 'react';
import {
  Type, Check, ChevronDown, Sun, Moon, BookOpen, RotateCw,
  ShieldAlert, Vibrate, HardDrive, Palette, Monitor,
} from 'lucide-react';
import type { Nav } from '../../types';
import {
  useSettings, setSetting, resetSettings, haptic,
  FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_WEIGHT_MIN, FONT_WEIGHT_MAX,
  type FontFamily,
} from '../../lib/settings';
import { fontFamilyStack } from '../../lib/fontLoader';
import {
  getStorageEstimate, refreshCacheAndReload, performHardReset,
  type StorageEstimateInfo,
} from '../../lib/cacheUtils';

interface SettingsProps { isMobile?: boolean; nav?: Nav; }

const FONT_OPTIONS: { id: FontFamily; label: string; sub: string }[] = [
  { id: 'lexend',        label: 'Lexend (Default)',   sub: 'Spasi klinis optimal' },
  { id: 'inter',         label: 'Inter',              sub: 'Sans serba guna' },
  { id: 'roboto',        label: 'Roboto',             sub: 'Tipografi UI familiar' },
  { id: 'jetbrains',     label: 'JetBrains Mono',     sub: 'Angka kontras tinggi' },
  { id: 'poppins',       label: 'Poppins',            sub: 'Geometris & modern' },
  { id: 'montserrat',    label: 'Montserrat',         sub: 'Elegan & terstruktur' },
  { id: 'plus-jakarta',  label: 'Plus Jakarta Sans',  sub: 'Fleksibel & terbaca' },
  { id: 'outfit',        label: 'Outfit',             sub: 'Bersih & tech-forward' },
  { id: 'space-grotesk', label: 'Space Grotesk',      sub: 'Tebal & futuristik' },
  { id: 'fira-code',     label: 'Fira Code',          sub: 'Gaya terminal' },
  { id: 'quicksand',     label: 'Quicksand',          sub: 'Membulat & ramah' },
  { id: 'system',        label: 'System UI',          sub: 'Bawaan sistem operasi' },
];

function fontWeightLabel(w: number): string {
  if (w === 0) return 'Normal';
  if (w < 0) return `${w <= -200 ? 'Sangat Tipis' : 'Tipis'} (${w})`;
  return `${w >= 300 ? 'Sangat Tebal' : w >= 150 ? 'Tebal' : 'Medium'} (+${w})`;
}

/* ── UI primitives (native, token ACLS) ─────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 4px 6px', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)', borderRadius: 16,
  boxShadow: 'var(--shadow-1), 0 0 0 0.5px var(--glass-border)',
};

function Toggle({ on, onChange, ariaLabel }: { on: boolean; onChange: (v: boolean) => void; ariaLabel: string }) {
  return (
    <button onClick={() => { onChange(!on); haptic(); }} role="switch" aria-checked={on} aria-label={ariaLabel}
      style={{ position: 'relative', flexShrink: 0, width: 44, height: 26, borderRadius: 999, border: 0,
        cursor: 'pointer', padding: 0, background: on ? 'var(--accent)' : 'var(--fill-secondary)', transition: 'background 200ms' }}>
      <span style={{ position: 'absolute', top: 2, left: 2, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transform: on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 200ms var(--ease-spring)' }}/>
    </button>
  );
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={() => { onClick(); haptic(); }}
      style={{ flex: 1, padding: '11px 8px', borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: '0.875rem', fontWeight: 700, transition: 'all 150ms',
        border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
        background: active ? 'var(--accent-tint)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--label-secondary)' }}>
      {children}
    </button>
  );
}

export function SettingsScreen({ isMobile = true, nav }: SettingsProps) {
  const s = useSettings();
  const [fontOpen, setFontOpen] = useState(false);
  const [estimate, setEstimate] = useState<StorageEstimateInfo>({ used: '—', quota: '—', percentage: 0 });

  useEffect(() => { getStorageEstimate().then(setEstimate); }, []);

  const activeFont = FONT_OPTIONS.find(o => o.id === s.fontFamily) || FONT_OPTIONS[0];

  const handleRefresh = () => { haptic(60); refreshCacheAndReload(); };
  const handleReset = () => {
    if (window.confirm('Kembalikan semua pengaturan ke setelan awal dan bersihkan cache aplikasi? Preferensi tampilan Anda akan hilang.')) {
      resetSettings();
      performHardReset();
    }
  };

  const content = (
    <div style={{ maxWidth: isMobile ? undefined : 600, margin: '0 auto', padding: '16px 16px 40px',
      display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── PENGATURAN TAMPILAN ── */}
      <div>
        <SectionLabel>PENGATURAN TAMPILAN</SectionLabel>

        {/* Jenis Font */}
        <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Type size={16} style={{ color: 'var(--accent)' }}/>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Jenis Font</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
            Pilih tipografi yang paling nyaman dibaca saat kondisi darurat atau pencahayaan minim.
          </p>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setFontOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--fill-quaternary)', border: '1px solid var(--glass-border)', borderRadius: 12,
                padding: '11px 14px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--label-primary)', fontFamily: fontFamilyStack(activeFont.id) }}>
                  {activeFont.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 1 }}>{activeFont.sub}</div>
              </div>
              <ChevronDown size={18} style={{ color: 'var(--label-tertiary)', flexShrink: 0,
                transform: fontOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }}/>
            </button>

            {fontOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setFontOpen(false)}/>
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                  background: 'var(--bg-elevated)', border: '0.5px solid var(--glass-border)', borderRadius: 14,
                  boxShadow: 'var(--shadow-modal)', maxHeight: '52vh', overflowY: 'auto', padding: 6,
                  animation: 'acls-fadeslide 180ms var(--ease-out) both' }}>
                  {FONT_OPTIONS.map(opt => {
                    const sel = s.fontFamily === opt.id;
                    return (
                      <button key={opt.id}
                        onClick={() => { setSetting('fontFamily', opt.id); setFontOpen(false); haptic(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 10, border: 0, cursor: 'pointer', textAlign: 'left',
                          background: sel ? 'var(--accent-tint)' : 'transparent' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: sel ? 700 : 500,
                            color: sel ? 'var(--accent)' : 'var(--label-primary)', fontFamily: fontFamilyStack(opt.id) }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)' }}>{opt.sub}</div>
                        </div>
                        {sel && <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ukuran Font */}
        <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Ukuran Font</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)',
              background: 'var(--accent-tint)', padding: '2px 9px', borderRadius: 999 }}>
              {Math.round(s.fontScale * 100)}%
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
            Perjelas angka dosis & parameter klinis di layar Anda.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--label-tertiary)' }}>A</span>
            <input type="range" min={FONT_SCALE_MIN} max={FONT_SCALE_MAX} step={0.05} value={s.fontScale}
              onChange={e => setSetting('fontScale', parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }}/>
            <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--label-tertiary)' }}>A</span>
          </div>
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'var(--fill-quaternary)',
            border: '0.5px solid var(--glass-border)' }}>
            <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 4 }}>PREVIEW</div>
            <div style={{ fontSize: `calc(0.875rem * ${s.fontScale})`, color: 'var(--label-primary)', lineHeight: 1.55 }}>
              Dosis: <strong style={{ color: 'var(--accent)' }}>1.25 mL</strong> bolus IV lambat dalam 5 menit.
            </div>
          </div>
        </div>

        {/* Ketebalan Font */}
        <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Ketebalan Font</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)',
              background: 'var(--accent-tint)', padding: '2px 9px', borderRadius: 999 }}>
              {fontWeightLabel(s.fontWeight)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
            Sesuaikan ketebalan teks isi. Judul & angka tebal tetap sesuai desain.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 300, color: 'var(--label-tertiary)' }}>Tipis</span>
            <input type="range" min={FONT_WEIGHT_MIN} max={FONT_WEIGHT_MAX} step={50} value={s.fontWeight}
              onChange={e => setSetting('fontWeight', parseInt(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }}/>
            <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: 'var(--label-tertiary)' }}>Tebal</span>
          </div>
        </div>

        {/* Reading Mode */}
        <div style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} style={{ color: 'var(--accent)' }}/>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Reading Mode</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              Tipografi serif kontras tinggi & spasi longgar — hanya di halaman teori/algoritma.
            </p>
          </div>
          <Toggle on={s.readingMode} onChange={v => setSetting('readingMode', v)} ariaLabel="Reading Mode"/>
        </div>
      </div>

      {/* ── TEMA & WARNA ── */}
      <div>
        <SectionLabel>TEMA & WARNA</SectionLabel>

        <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Mode Tampilan</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', margin: '4px 0 12px', lineHeight: 1.4 }}>
            Gunakan mode gelap saat bertugas di ruangan minim cahaya.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 12, background: 'var(--fill-quaternary)',
            border: '0.5px solid var(--glass-border)', marginBottom: s.themeMode === 'system' ? 0 : 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={16} style={{ color: 'var(--label-secondary)' }}/>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--label-primary)' }}>Ikuti Sistem</span>
            </div>
            <Toggle on={s.themeMode === 'system'}
              onChange={v => setSetting('themeMode', v ? 'system' : 'dark')} ariaLabel="Ikuti tema sistem"/>
          </div>
          {s.themeMode !== 'system' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <SegButton active={s.themeMode === 'light'} onClick={() => setSetting('themeMode', 'light')}>
                <Sun size={15}/> Terang
              </SegButton>
              <SegButton active={s.themeMode === 'dark'} onClick={() => setSetting('themeMode', 'dark')}>
                <Moon size={15}/> Gelap
              </SegButton>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={16} style={{ color: 'var(--accent)' }}/>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Skema Warna</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', margin: '4px 0 12px', lineHeight: 1.4 }}>
            Mode kontras tinggi memonokromkan kategori; warna bahaya & tombol emergency tetap.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <SegButton active={!s.bwMode} onClick={() => setSetting('bwMode', false)}>Berwarna</SegButton>
            <SegButton active={s.bwMode} onClick={() => setSetting('bwMode', true)}>Hitam-Putih</SegButton>
          </div>
        </div>
      </div>

      {/* ── FEEDBACK ── */}
      <div>
        <SectionLabel>FEEDBACK</SectionLabel>
        <div style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Vibrate size={16} style={{ color: 'var(--accent)' }}/>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Getaran (Haptics)</span>
          </div>
          <Toggle on={s.haptics} onChange={v => setSetting('haptics', v)} ariaLabel="Feedback getaran"/>
        </div>
      </div>

      {/* ── PENYIMPANAN ── */}
      <div>
        <SectionLabel>PENYIMPANAN & CACHE</SectionLabel>
        <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardDrive size={16} style={{ color: 'var(--accent)' }}/>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Update App & Cache</span>
            </div>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: 'var(--label-secondary)', background: 'var(--fill-tertiary)', padding: '2px 8px', borderRadius: 999 }}>
              {estimate.used}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Aplikasi berjalan offline. Jika ada kendala atau ingin memuat versi terbaru, segarkan cache.
          </p>
          <button onClick={handleRefresh}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700, fontSize: '0.875rem',
              padding: '12px', borderRadius: 12, border: 0, cursor: 'pointer' }}>
            <RotateCw size={16}/> Segarkan Cache & Muat Ulang
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <Check size={13} style={{ color: 'var(--success)' }}/>
            <span style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', fontWeight: 500 }}>
              Pengaturan Anda tidak akan hilang
            </span>
          </div>
        </div>

        {/* Reset */}
        <div style={{ ...cardStyle, padding: 16,
          boxShadow: 'var(--shadow-1), 0 0 0 0.5px color-mix(in srgb, var(--danger) 25%, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldAlert size={16} style={{ color: 'var(--danger)' }}/>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--danger)' }}>Reset Aplikasi</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
            Kembalikan seluruh preferensi ke setelan awal dan bersihkan cache. Tindakan ini tidak bisa dibatalkan.
          </p>
          <button onClick={handleReset}
            style={{ width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              color: 'var(--danger)', fontWeight: 700, fontSize: '0.8125rem' }}>
            Reset Semua Pengaturan
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center',
          padding: '10px 16px', borderBottom: '0.5px solid var(--separator)',
          flexShrink: 0, background: 'var(--bg-primary)', height: 52 }}>
          <button onClick={() => nav?.pop()}
            style={{ height: 32, padding: '0 4px', background: 'none', border: 0, cursor: 'pointer',
              color: 'var(--label-secondary)', display: 'flex', alignItems: 'center', gap: 2, fontSize: '1rem', zIndex: 1 }}>
            <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }}/><span style={{ marginLeft: -2 }}>Kembali</span>
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: '0.9375rem', fontWeight: 600, color: 'var(--label-primary)', pointerEvents: 'none' }}>Pengaturan</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {content}
    </div>
  );
}
