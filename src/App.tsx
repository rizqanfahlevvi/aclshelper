import { useState, useEffect, useRef } from 'react';
import { BottomNav, CPRTimer } from './components/acls';
import { Icons } from './components/base';
import type { Tab, DeskScreen, NavFrame, DeskView, NavStack, CprRhythm } from './types';
import { useFavorites } from './utils/favorites';
import { ACLS_ALGORITHMS, ACLS_DRUGS, ACLS_RHYTHMS } from './data';
import { CALCULATORS } from './data/calculators';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
import {
  MobileHome, MobileAlgoList, MobileAlgorithmDetail,
  MobileDrugList, MobileDrugDetail,
  MobileEkgList, MobileEkgDetail,
  MobileHsTs, InstallPopup, SpeedDial,
} from './screens/mobile';
import {
  DesktopSidebar, DesktopDashboard,
  DesktopAlgorithm, DesktopDrugs, DesktopEkg, DesktopHsTs,
} from './screens/desktop';
import { MobileCalcList, MobileCalcDetail, DesktopCalc } from './screens/calc';
import { PalsScreen, VasoScreen, RoscScreen, DefibScreen, PedsScreen, DesktopDefib, DesktopPeds } from './screens/tools';
import { TheoryScreen, DesktopTheory } from './screens/theory';
import { AboutScreen } from './screens/about';
import { SearchModal } from './screens/search';
import { useAuth } from './context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { ProfilePopup } from './auth/ProfilePopup';
import { AdminPage } from './auth/AdminPage';

const FEEDBACK_GAS_URL = 'https://script.google.com/macros/s/AKfycbxbWDxYKapZO4KXt1ovfT_neb3_R5UenGySUnOZ5UYbCAjGEkX3kdwWrltogq44522a/exec';

function useBreakpoint() {
  const get = () => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  };
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const handler = () => setBp(get());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return bp;
}

/* ============================================================
   HASH ROUTING
   ============================================================ */
function stateToHash(bp: string, tab: Tab, stack: NavStack, deskView: DeskView): string {
  if (bp === 'desktop') {
    const { screen, id } = deskView;
    if (screen === 'dashboard') return '/';
    if (screen === 'algo' && id === 'pals')      return '/pals';
    if (screen === 'algo' && id === 'rosc-care') return '/rosc';
    if (screen === 'calc' && id === 'vaso')       return '/vaso';
    return id ? `/${screen}/${id}` : `/${screen}`;
  }
  const frame = stack[tab][stack[tab].length - 1];
  const screen = frame.screen;
  const id = 'id' in frame ? frame.id : undefined;
  if (screen === 'home')     return '/';
  if (screen === 'algoList') return '/algo';
  if (screen === 'algo')     return `/algo/${id}`;
  if (screen === 'drugList') return '/drugs';
  if (screen === 'drug')     return `/drugs/${id}`;
  if (screen === 'ekgList')  return '/ekg';
  if (screen === 'ekg')      return `/ekg/${id}`;
  if (screen === 'hsts')     return '/hsts';
  if (screen === 'calcList') return '/calc';
  if (screen === 'calc')     return `/calc/${id}`;
  if (screen === 'pals')     return '/pals';
  if (screen === 'vaso')     return '/vaso';
  if (screen === 'rosc')     return '/rosc';
  if (screen === 'theory')   return '/theory';
  if (screen === 'about')    return '/about';
  return '/';
}

function hashToNav(hash: string): { tab: Tab; frame: NavFrame; deskScreen: DeskScreen; deskId: string | null } {
  const path = hash.replace(/^#\/?/, '');
  const [section = '', id = null] = path.split('/');
  switch (section) {
    case 'algo':  return { tab: 'algo',  frame: id ? { screen: 'algo', id }  : { screen: 'algoList' }, deskScreen: 'algo',      deskId: id  };
    case 'drugs': return { tab: 'drugs', frame: id ? { screen: 'drug', id }  : { screen: 'drugList' }, deskScreen: 'drugs',     deskId: id  };
    case 'ekg':   return { tab: 'tools', frame: id ? { screen: 'ekg',  id }  : { screen: 'ekgList'  }, deskScreen: 'ekg',       deskId: id  };
    case 'hsts':  return { tab: 'home',  frame: { screen: 'hsts' },                                        deskScreen: 'hsts',      deskId: null };
    case 'calc':  return { tab: 'home',  frame: id ? { screen: 'calc', id }  : { screen: 'calcList' },   deskScreen: 'calc',      deskId: id          };
    case 'pals':   return { tab: 'algo',  frame: { screen: 'pals' },                                        deskScreen: 'algo',      deskId: 'pals'      };
    case 'vaso':   return { tab: 'home',  frame: { screen: 'vaso' },                                        deskScreen: 'calc',      deskId: 'vaso'      };
    case 'rosc':   return { tab: 'algo',  frame: { screen: 'rosc' },                                        deskScreen: 'algo',      deskId: 'rosc-care' };
    case 'theory': return { tab: 'home',  frame: { screen: 'theory' },                                      deskScreen: 'theory',    deskId: null        };
    case 'about':  return { tab: 'home',  frame: { screen: 'about'  },                                      deskScreen: 'about',     deskId: null        };
    default:       return { tab: 'home',  frame: { screen: 'home' },                                        deskScreen: 'dashboard', deskId: null };
  }
}

// Compute initial nav state from URL (once on module load)
const _initNav = (() => {
  const n = hashToNav(window.location.hash);
  return {
    tab: n.tab,
    stack: {
      home:  n.tab === 'home'  && n.frame.screen !== 'home'    ? [{ screen: 'home' },    n.frame] : [{ screen: 'home' }],
      algo:  n.tab === 'algo'  && n.frame.screen !== 'algoList'? [{ screen: 'algoList' },n.frame] : [{ screen: 'algoList' }],
      drugs: n.tab === 'drugs' && n.frame.screen !== 'drugList'? [{ screen: 'drugList' },n.frame] : [{ screen: 'drugList' }],
      tools: n.tab === 'tools' && n.frame.screen !== 'ekgList' ? [{ screen: 'ekgList' }, n.frame] : [{ screen: 'ekgList' }],
    },
    deskView: n.deskId ? { screen: n.deskScreen, id: n.deskId } : { screen: n.deskScreen },
  };
})();

function useClock() {
  const fmt = () => {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0') + ':' +
           d.getSeconds().toString().padStart(2, '0');
  };
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

/* ============================================================
   FEEDBACK MODAL
   ============================================================ */
interface FeedbackModalProps {
  onClose: () => void;
  currentPage: string;
  currentUrl: string;
}

const PRODUK_OPTIONS = [
  'ACLS Helper',
  'ICU Helper',
  'ResNeo Helper',
  'PICNIC Helper',
  'MD Kit (Keseluruhan)',
];

const SUMBER_OPTIONS = [
  'Media Sosial (IG/WA/dll)',
  'Rekan / Kolega',
  'Google / Internet',
  'Institusi / RS',
  'Lainnya',
];

const KONTAK_OPTIONS = ['WhatsApp', 'Instagram', 'Email', 'LinkedIn'];

type FeedbackType = 'bug' | 'fitur' | 'komentar' | '';

function FeedbackModal({ onClose, currentPage, currentUrl }: FeedbackModalProps) {
  const [produk, setProduk] = useState('ACLS Helper');
  const [nama, setNama] = useState('');
  const [kontakType, setKontakType] = useState('WhatsApp');
  const [kontakVal, setKontakVal] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [jenis, setJenis] = useState<FeedbackType>('');
  const [sumber, setSumber] = useState('');
  const [pesan, setPesan] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const canSubmit = nama.trim().length > 0 && pesan.trim().length > 0 && status === 'idle';

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('sending');
    try {
      const params = new URLSearchParams({
        timestamp: new Date().toISOString(),
        produk,
        type: jenis || '-',
        rating: rating > 0 ? String(rating) : '-',
        nama: nama.trim(),
        kontak: kontakVal.trim() ? `${kontakType}: ${kontakVal.trim()}` : '-',
        sumber: sumber || '-',
        message: pesan.trim(),
        page: currentPage,
        url: currentUrl,
      });
      const url = FEEDBACK_GAS_URL + '?' + params.toString();
      const res = await fetch(url, { method: 'GET', mode: 'no-cors' });
      // no-cors always resolves — treat as success
      void res;
      setStatus('success');
    } catch (_) {
      setStatus('error');
    }
  };

  const jenisOptions: Array<{ key: FeedbackType; label: string; icon: string }> = [
    { key: 'bug',      label: 'Bug / Error Konten', icon: '⊘' },
    { key: 'fitur',    label: 'Saran Fitur Baru',   icon: '✦' },
    { key: 'komentar', label: 'Komentar Bebas',      icon: '◻' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} onClick={onClose}/>

      {/* Modal card — centered with equal margins */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 401,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        pointerEvents: 'none',
      }}>
      <div style={{
        width: '100%', maxWidth: 480,
        maxHeight: 'calc(100dvh - 48px)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-primary)',
        borderRadius: 22,
        boxShadow: '0 8px 48px rgba(0,0,0,0.28), 0 0 0 0.5px var(--separator)',
        animation: 'acls-fadein 260ms var(--ease-out) both',
        pointerEvents: 'auto',
      }}>


        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 10px', flexShrink: 0,
          borderBottom: '0.5px solid var(--separator)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
              display: 'inline-block', flexShrink: 0 }}/>
            <span style={{ fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.04em',
              color: 'var(--label-primary)' }}>FEEDBACK ACLS HELPER</span>
          </div>
          <button onClick={onClose} style={{ background: 'var(--fill-quaternary)', border: 0,
            borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
            color: 'var(--label-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
            ✕ Tutup
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 32px',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
              <div className="t-title-3" style={{ fontWeight: 700, marginBottom: 8 }}>Terima kasih!</div>
              <div className="t-body" style={{ color: 'var(--label-secondary)', marginBottom: 24 }}>
                Feedback kamu sudah kami terima dan akan sangat membantu pengembangan ACLS Helper.
              </div>
              <button onClick={onClose} style={{
                padding: '12px 28px', borderRadius: 12, border: 0, cursor: 'pointer',
                background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: '0.9375rem',
              }}>Tutup</button>
            </div>
          ) : (
            <>
              {/* Quote */}
              <div style={{ background: 'var(--fill-quaternary)', borderRadius: 12, padding: '14px 16px',
                marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
                <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  ACLS Helper dibuat berdasarkan pengalaman dan bantuan dari AI, namun dalam penyempurnaannya,
                  saya sangat memerlukan bantuan rekan-rekan sejawat terutama dalam hal pengembangan.
                  Berikan kritik, saran, dan ide fitur untuk ACLS Helper maupun MD Kit secara keseluruhan 🙂
                </div>
                <div className="t-caption-1" style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>— Rizqan</div>
              </div>

              {/* Current page chip */}
              {currentPage && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                  background: 'var(--accent-tint)', borderRadius: 20, padding: '4px 12px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                    display: 'inline-block', flexShrink: 0 }}/>
                  <span className="t-caption-2" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    ACLS Helper — {currentPage}
                  </span>
                </div>
              )}

              {/* Produk */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  FEEDBACK UNTUK <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select value={produk} onChange={e => setProduk(e.target.value)} style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: 'var(--label-primary)',
                  fontSize: '0.9375rem', appearance: 'none',
                }}>
                  {PRODUK_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Nama */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  NAMA <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  value={nama} onChange={e => setNama(e.target.value)}
                  placeholder="Nama kamu..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                    color: 'var(--label-primary)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Kontak */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  KONTAK <span style={{ color: 'var(--label-quaternary)' }}>(OPSIONAL)</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={kontakType} onChange={e => setKontakType(e.target.value)} style={{
                    padding: '11px 12px', borderRadius: 10, border: '1px solid var(--separator)',
                    background: 'var(--fill-quaternary)', color: 'var(--label-primary)',
                    fontSize: '0.9375rem', flexShrink: 0, appearance: 'none',
                  }}>
                    {KONTAK_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <input
                    value={kontakVal} onChange={e => setKontakVal(e.target.value)}
                    placeholder="No. WA / username IG / Email"
                    style={{ flex: 1, padding: '11px 14px', borderRadius: 10,
                      border: '1px solid var(--separator)', background: 'var(--fill-quaternary)',
                      color: 'var(--label-primary)', fontSize: '0.9375rem', minWidth: 0 }}
                  />
                </div>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  BERI RATING <span style={{ color: 'var(--label-quaternary)' }}>(OPSIONAL)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      onClick={() => setRating(r => r === n ? 0 : n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2,
                        fontSize: '1.5rem', lineHeight: 1,
                        filter: n <= (hoverRating || rating) ? 'none' : 'grayscale(1) opacity(0.35)',
                        transform: n <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)',
                        transition: 'filter 120ms, transform 120ms' }}>
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="t-caption-1" style={{ color: 'var(--label-secondary)', marginLeft: 4 }}>
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              {/* Jenis Feedback */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                  JENIS FEEDBACK
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {jenisOptions.map(o => (
                    <button key={o.key}
                      onClick={() => setJenis(j => j === o.key ? '' : o.key)}
                      style={{
                        padding: '8px 14px', borderRadius: 10, border: 0, cursor: 'pointer',
                        background: jenis === o.key ? 'var(--accent)' : 'var(--fill-quaternary)',
                        color: jenis === o.key ? '#fff' : 'var(--label-primary)',
                        fontSize: '0.8125rem', fontWeight: jenis === o.key ? 600 : 400,
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'background 150ms, color 150ms',
                        boxShadow: jenis === o.key ? 'none' : 'inset 0 0 0 0.5px var(--separator)',
                      }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>{o.icon}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sumber */}
              <div style={{ marginBottom: 14 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  DARI MANA ANDA MENEMUKAN ACLS HELPER? <span style={{ color: 'var(--label-quaternary)' }}>(OPSIONAL)</span>
                </label>
                <select value={sumber} onChange={e => setSumber(e.target.value)} style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--separator)',
                  background: 'var(--fill-quaternary)', color: sumber ? 'var(--label-primary)' : 'var(--label-tertiary)',
                  fontSize: '0.9375rem', appearance: 'none',
                }}>
                  <option value="">Pilih salah satu...</option>
                  {SUMBER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Pesan */}
              <div style={{ marginBottom: 20 }}>
                <label className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 700,
                  letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  PESAN <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  value={pesan} onChange={e => setPesan(e.target.value.slice(0, 1000))}
                  placeholder="Deskripsikan feedback kamu..."
                  rows={4}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: `1px solid ${pesan.length > 0 ? 'var(--accent)' : 'var(--separator)'}`,
                    background: 'var(--fill-quaternary)', color: 'var(--label-primary)',
                    fontSize: '0.9375rem', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)', lineHeight: 1.5,
                    outline: 'none', transition: 'border-color 150ms' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span/>
                  <span className="t-caption-2" style={{ color: 'var(--label-quaternary)' }}>
                    {pesan.length} / 1000
                  </span>
                </div>
              </div>

              {status === 'error' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)',
                  marginBottom: 14, color: 'var(--danger)', fontSize: '0.875rem' }}>
                  Gagal mengirim. Periksa koneksi internet dan coba lagi.
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 0,
                  background: canSubmit ? 'var(--accent)' : 'var(--fill-secondary)',
                  color: canSubmit ? '#fff' : 'var(--label-quaternary)',
                  fontSize: '1rem', fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 200ms, color 200ms',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {status === 'sending' ? (
                  <>
                    <Icons.reset size={16} stroke={2} style={{ animation: 'acls-spin 0.8s linear infinite' }}/>
                    Mengirim...
                  </>
                ) : 'Kirim →'}
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

interface AppTopBarProps {
  theme: string;
  onToggleTheme: () => void;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  onGoHome?: () => void;
  fontScale: number;
  onFontScaleChange: (v: number) => void;
  onSearch?: () => void;
  onOpenProfile?: () => void;
  userInitial?: string;
}
function AppTopBar({ theme, onToggleTheme, onOpenSidebar, sidebarOpen = false, onGoHome, fontScale, onFontScaleChange, onSearch, onOpenProfile, userInitial }: AppTopBarProps) {
  const [fontPopoverOpen, setFontPopoverOpen] = useState(false);
  const time = useClock();
  const [updateState, setUpdateState] = useState('idle'); // idle | checking

  const checkUpdate = async () => {
    if (updateState !== 'idle') return;
    setUpdateState('checking');
    try {
      // 1. Minta SW baru dari server (lewati cache HTTP)
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.update();
      // 2. Bersihkan semua cache Workbox agar reload tidak sajikan aset lama
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (_) {}
    // 3. Selalu reload — jaminan pengguna dapat versi terbaru
    window.location.reload();
  };

  return (
    <div style={{
      height: 'calc(52px + env(safe-area-inset-top))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'env(safe-area-inset-top) 16px 0',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenSidebar && (
          <button onClick={onOpenSidebar}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--fill-tertiary)',
              border: 0, cursor: 'pointer', color: 'var(--label-secondary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              style={{ position: 'absolute', transition: 'opacity 180ms, transform 220ms var(--ease-out)',
                opacity: sidebarOpen ? 0 : 1, transform: sidebarOpen ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              style={{ position: 'absolute', transition: 'opacity 180ms, transform 220ms var(--ease-out)',
                opacity: sidebarOpen ? 1 : 0, transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(90deg)' }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <button onClick={onGoHome}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'none', border: 0, padding: 0,
            cursor: onGoHome ? 'pointer' : 'default' }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--danger)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.022em', color: 'var(--label-primary)' }}>
            ACLS Helper
          </span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--label-secondary)',
          letterSpacing: '0.02em',
        }}>
          {time}
        </span>
        {onSearch && (
          <button onClick={onSearch} title="Pencarian global (Ctrl+K)"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--fill-tertiary)',
              border: 0, cursor: 'pointer', color: 'var(--label-secondary)',
            }}
            aria-label="Pencarian global">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        )}
        <button
          onClick={checkUpdate}
          title={updateState === 'checking' ? 'Memeriksa pembaruan...' : 'Cek pembaruan'}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--fill-tertiary)',
            border: 0, cursor: updateState === 'idle' ? 'pointer' : 'default',
            color: 'var(--label-secondary)',
          }}
          aria-label="Cek pembaruan">
          <Icons.reset size={15} stroke={2}
            style={{ animation: updateState === 'checking' ? 'acls-spin 0.8s linear infinite' : 'none' }}/>
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setFontPopoverOpen(o => !o)}
            title="Ukuran teks"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: fontPopoverOpen || fontScale !== 1 ? 'var(--accent-tint)' : 'var(--fill-tertiary)',
              border: 0, cursor: 'pointer',
              color: fontPopoverOpen || fontScale !== 1 ? 'var(--accent)' : 'var(--label-secondary)',
              transition: 'background 200ms, color 200ms',
            }}
            aria-label="Ubah ukuran teks">
            <span style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>A</span>
          </button>

          {fontPopoverOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setFontPopoverOpen(false)}/>
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                zIndex: 200,
                background: 'var(--bg-secondary)',
                borderRadius: 18,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 0.5px var(--separator)',
                padding: '16px 18px',
                width: 288,
                animation: 'acls-fadeslide 200ms var(--ease-out) both',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="t-footnote" style={{ fontWeight: 600, color: 'var(--label-secondary)' }}>Ukuran Teks</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
                    {Math.round(fontScale * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--label-tertiary)', fontFamily: 'var(--font-sans)', flexShrink: 0, lineHeight: 1 }}>A</span>
                  <input
                    type="range"
                    min={0.75}
                    max={1.5}
                    step={0.05}
                    value={fontScale}
                    onChange={e => onFontScaleChange(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }}
                  />
                  <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--label-tertiary)', fontFamily: 'var(--font-sans)', flexShrink: 0, lineHeight: 1 }}>A</span>
                </div>
                {fontScale !== 1 && (
                  <button
                    onClick={() => onFontScaleChange(1)}
                    style={{
                      marginTop: 14, width: '100%', padding: '9px', borderRadius: 10,
                      background: 'var(--fill-quaternary)', border: 'none', cursor: 'pointer',
                      color: 'var(--label-secondary)', fontSize: '0.8125rem', fontWeight: 500,
                    }}
                  >
                    Reset ke Normal
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <button
          onClick={onToggleTheme}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--fill-tertiary)',
            border: 0, cursor: 'pointer',
            color: 'var(--label-secondary)',
          }}
          aria-label="Toggle tema">
          {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
        </button>
        {onOpenProfile && userInitial && (
          <button
            onClick={onOpenProfile}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent)',
              border: 0, cursor: 'pointer',
              color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
            }}
            aria-label="Profil">
            {userInitial}
          </button>
        )}
      </div>
    </div>
  );
}

const ACCENT = { color: '#30B0C7', dark: '#40C8E0' };

const MOBILE_MENU = [
  { key: 'home',   label: 'Beranda',     desc: 'Ikhtisar & akses cepat',       icon: Icons.house },
  { key: 'algo',   label: 'Algoritma',   desc: '14 protokol ACLS',             icon: Icons.algo },
  { key: 'drugs',  label: 'Obat',        desc: '25 obat emergensi',            icon: Icons.pill },
  { key: 'tools',  label: 'Pustaka EKG', desc: '16 ritme kardiologi',          icon: Icons.ekg },
  { key: 'theory', label: 'Teori',       desc: 'Sistem konduksi jantung',      icon: Icons.activity },
  { key: 'hsts',   label: 'Hs & Ts',     desc: '10 penyebab reversibel',       icon: Icons.clipboard },
  { key: 'calc',   label: 'Kalkulator',  desc: '13 kalkulator klinis',         icon: Icons.calculator },
  { key: 'about',  label: 'Tentang',     desc: 'Versi & changelog',            icon: Icons.info },
];
const MOBILE_QUICK = [
  { key: 'bhjd',        label: 'BHJD Dewasa',     tint: 'var(--accent)' },
  { key: 'vfvt',        label: 'VF / pVT',         tint: 'var(--danger)' },
  { key: 'pea',         label: 'PEA / Asistol',    tint: 'var(--info)' },
  { key: 'brady',       label: 'Bradikardi',       tint: 'var(--warning)' },
  { key: 'tachy',       label: 'Takikardi',        tint: 'var(--tint-neuro)' },
  { key: 'ska',         label: 'SKA / STEMI',      tint: 'var(--tint-vital)' },
  { key: 'opioid',      label: 'Overdosis Opioid', tint: 'var(--tint-neuro)' },
  { key: 'anaphylaxis', label: 'Anafilaksis',      tint: 'var(--danger)' },
  { key: 'pregnancy',   label: 'Henti Kehamilan',  tint: 'var(--tint-vital)' },
  { key: 'drowning',    label: 'Tenggelam',        tint: 'var(--info)' },
  { key: 'hypothermia', label: 'Hipotermia Berat', tint: 'var(--accent)' },
];

function resolveFavMobile(f: { type: string; key: string }): { label: string; tint: string; screen: string } | null {
  if (f.type === 'algo') { const x = ACLS_ALGORITHMS.find(a => a.key === f.key); return x ? { label: x.label, tint: x.tint, screen: 'algo' } : null; }
  if (f.type === 'drug') { const x = ACLS_DRUGS.find(d => d.key === f.key); return x ? { label: x.name, tint: x.tint, screen: 'drug' } : null; }
  if (f.type === 'ekg')  { const x = ACLS_RHYTHMS.find(r => r.key === f.key); return x ? { label: x.name, tint: x.tint, screen: 'ekg' } : null; }
  if (f.type === 'calc') { const x = CALCULATORS.find(c => c.key === f.key); return x ? { label: x.name, tint: x.tint, screen: 'calc' } : null; }
  return null;
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (key: string, id?: string) => void;
  onFeedback: () => void;
  onSearch: () => void;
}
function MobileSidebar({ open, onClose, activeTab, onNavigate, onFeedback, onSearch }: MobileSidebarProps) {
  const { favs } = useFavorites();
  const favResolved = favs
    .map((f: { type: string; key: string }) => { const info = resolveFavMobile(f); return info ? { ...f, ...info } : null; })
    .filter((x): x is { type: string; key: string; label: string; tint: string; screen: string } => x !== null);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 260ms var(--ease-out)' }}
        onClick={onClose}/>
      <div style={{ position: 'fixed', top: 52, bottom: 0, left: 0, zIndex: 160,
        width: 264, background: 'var(--bg-tertiary)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 280ms var(--ease-out)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '4px 0 32px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '10px 14px 8px' }}>
          <button onClick={() => { onSearch(); onClose(); }}
            className="acls-sidebar-search"
            style={{ margin: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Icons.search size={14} stroke={2} style={{ flexShrink: 0 }}/>
            <span style={{ flex: 1, color: 'var(--label-tertiary)', fontSize: '0.8125rem' }}>Cari semua konten…</span>
          </button>
        </div>
        <nav className="acls-sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {MOBILE_MENU.map(it => (
            <button key={it.key}
              className={'acls-sidebar-item ' + (activeTab === it.key ? 'active' : '')}
              style={{ padding: '8px 10px' }}
              onClick={() => { onNavigate(it.key); onClose(); }}>
              <div style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <it.icon size={18} stroke={1.9}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span style={{ lineHeight: 1.3 }}>{it.label}</span>
                <span className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 400,
                  textTransform: 'none', letterSpacing: 0 }}>{it.desc}</span>
              </div>
            </button>
          ))}
          {favResolved.length > 0 ? (
            <>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '14px 18px 4px' }}>FAVORIT</div>
              {favResolved.map(f => (
                <button key={f.type + f.key} className="acls-sidebar-item"
                  style={{ padding: '8px 10px' }}
                  onClick={() => { onNavigate(f.screen, f.key); onClose(); }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: f.tint,
                    marginLeft: 6, marginRight: 6, flexShrink: 0 }}/>
                  <span>{f.label}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '14px 18px 4px' }}>AKSES CEPAT</div>
              {MOBILE_QUICK.map(it => (
                <button key={it.key} className="acls-sidebar-item"
                  style={{ padding: '8px 10px' }}
                  onClick={() => { onNavigate('algo', it.key); onClose(); }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: it.tint,
                    marginLeft: 6, marginRight: 6, flexShrink: 0 }}/>
                  <span>{it.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>
        <div style={{ padding: '10px 14px 16px' }}>
          <button onClick={() => { onFeedback(); onClose(); }}
            style={{ background: 'var(--fill-quaternary)', color: 'var(--label-primary)', height: 46, width: '100%',
              borderRadius: 12, fontSize: '0.9375rem', fontWeight: 600, display: 'flex', gap: 8,
              boxShadow: 'inset 0 0 0 0.5px var(--separator)', border: 0, cursor: 'pointer',
              justifyContent: 'center', alignItems: 'center' }}>
            <Icons.chat size={17} stroke={2}/> Kirim Feedback
          </button>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SESSION FEEDBACK POPUP
   ============================================================ */
function SessionFeedbackPopup({ onClose }: { onClose: (andOpenFeedback?: boolean) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      background: 'rgba(0,0,0,0.40)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'acls-fadein 200ms ease both',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--material-thick)',
        backdropFilter: 'var(--blur-strong)',
        WebkitBackdropFilter: 'var(--blur-strong)',
        borderRadius: 26,
        border: '0.5px solid var(--separator)',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        animation: 'acls-fadein 250ms var(--ease-out) both',
        transform: 'translateZ(0)',
      }}>

        {/* Body */}
        <div style={{ padding: '16px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), #5856D6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,122,255,0.35)',
            }}>
              <Icons.heartFill size={22} style={{ color: '#fff' }}/>
            </div>
            <div>
              <div className="t-title-3" style={{ fontWeight: 700 }}>Hei, sebentar! 👋</div>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>
                Bantu ACLS Helper jadi lebih baik
              </div>
            </div>
          </div>
          <div className="t-callout" style={{ color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
            Apakah ada masukan, bug, atau fitur yang ingin kamu usulkan? Atau kamu bisa mendukung pengembangan aplikasi ini — gratis untuk semua tenaga kesehatan 🙏
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => onClose(true)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none',
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                fontSize: '0.9375rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(0,122,255,0.30)',
              }}
            >
              <Icons.chat size={17} stroke={2} style={{ color: '#fff' }}/>
              Beri Feedback
            </button>
            <a
              href="https://saweria.co/rizqanfahlevvi"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClose()}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #FF9500, #E67300)', color: '#fff', cursor: 'pointer',
                fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(255,149,0,0.30)',
              }}
            >
              <Icons.coffee size={17} stroke={2} style={{ color: '#fff' }}/>
              Dukung Pengembang
            </a>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => onClose()}
            style={{
              width: '100%', padding: '10px', border: 'none', background: 'none',
              cursor: 'pointer', color: 'var(--label-tertiary)', fontSize: '0.875rem',
              fontWeight: 500, marginBottom: 4,
            }}
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [theme, setTheme] = useState('light');

  const { user, userProfile, isAuthorized } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [subBannerOpen, setSubBannerOpen] = useState(true);
  const userInitial = (userProfile?.namaLengkap || userProfile?.username || user?.email || '?').trim().slice(0, 1).toUpperCase();

  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem('acls_font_scale') || '');
    return !isNaN(saved) && saved >= 0.75 && saved <= 1.5 ? saved : 1;
  });
  useEffect(() => {
    document.documentElement.style.fontSize = fontScale === 1 ? '' : `calc(clamp(13px, 1.5vw, 15px) * ${fontScale})`;
    localStorage.setItem('acls_font_scale', String(fontScale));
  }, [fontScale]);

  /* Ref always holds latest nav state — used by popstate to avoid stale closures */
  const navRef = useRef<{ cprOpen: boolean; bp: string; tab?: Tab; stack?: NavStack; deskView?: DeskView }>({ cprOpen: false, bp: 'mobile' });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    root.style.setProperty('--accent', isDark ? ACCENT.dark : ACCENT.color);
    root.style.setProperty('--accent-fg', '#fff');
    root.style.setProperty('--accent-tint', ACCENT.color + '1F');
    root.style.setProperty('--label-link', isDark ? ACCENT.dark : ACCENT.color);
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTheme(t => t === 'light' ? 'dark' : 'light');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  };

  /* Desktop state — initialised from URL hash (declared early — used in effects below) */
  const [deskView, setDeskView] = useState<DeskView>(_initNav.deskView);
  const desktopPick = (screen: string, id?: string) => {
    const newView: DeskView = { screen: screen as DeskScreen, id };
    if (screen !== 'dashboard') {
      window.history.pushState(null, '', '#' + stateToHash('desktop', tab, stack, newView));
    }
    setDeskView(newView);
  };

  /* Mobile nav state — initialised from URL hash */
  const [tab, setTab] = useState<Tab>(_initNav.tab);
  const [stack, setStack] = useState<NavStack>(_initNav.stack as NavStack);
  const topFrame = stack[tab][stack[tab].length - 1];

  const nav = {
    push: (frame: NavFrame) => {
      const ns: NavStack = { ...stack, [tab]: [...stack[tab], frame] };
      window.history.pushState(null, '', '#' + stateToHash(bp, tab, ns, deskView));
      setStack(s => ({ ...s, [tab]: [...s[tab], frame] }));
    },
    pop: () => setStack(s => {
      const cur = s[tab];
      if (cur.length <= 1) return s;
      return { ...s, [tab]: cur.slice(0, -1) };
    }),
  };

  const openAlgoFromHome = (id: string) => {
    const ns: NavStack = { ...stack, algo: [{ screen: 'algoList' }, { screen: 'algo', id }] };
    window.history.pushState(null, '', '#' + stateToHash(bp, 'algo', ns, deskView));
    setTab('algo');
    setStack(() => ns);
  };

  const [cprOpen, setCprOpen] = useState(false);
  const [cprRhythm, setCprRhythm] = useState<CprRhythm | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const openCPR = (rhythm: CprRhythm | null = null) => {
    window.history.pushState(null, '', location.href);
    setCprRhythm(rhythm);
    setCprOpen(true);
  };

  const closeCPR = () => {
    setCprOpen(false);
    setCprRhythm(null);
  };

  const onSpeedDialPick = (key: CprRhythm) => {
    setFabOpen(false);
    openCPR(key);
  };

  const mobileNavFromSidebar = (key: string, id?: string) => {
    if (key === 'hsts') {
      window.history.pushState(null, '', '#/hsts');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'hsts' }] }));
    } else if (key === 'calc') {
      window.history.pushState(null, '', '#/calc');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'calcList' }] }));
    } else if (key === 'theory') {
      window.history.pushState(null, '', '#/theory');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'theory' }] }));
    } else if (key === 'about') {
      window.history.pushState(null, '', '#/about');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'about' }] }));
    } else if (key === 'rosc') {
      window.history.pushState(null, '', '#/rosc');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'rosc' }] }));
    } else if (key === 'defib') {
      window.history.pushState(null, '', '#/defib');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'defib' }] }));
    } else if (key === 'peds') {
      window.history.pushState(null, '', '#/peds');
      setTab('home');
      setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'peds' }] }));
    } else if (key === 'algo' && id) {
      openAlgoFromHome(id);
    } else {
      if (key !== 'home') {
        const pathMap: Record<string, string> = { algo: '/algo', drugs: '/drugs', tools: '/ekg' };
        const path = pathMap[key] || '/';
        window.history.pushState(null, '', '#' + path);
      }
      setTab(key as Tab);
    }
  };

  /* Browser back/forward — restore state from URL hash */
  useEffect(() => {
    const handle = () => {
      const { cprOpen: isCprOpen, bp: currentBp } = navRef.current;
      if (isCprOpen) { setCprOpen(false); setCprRhythm(null); return; }
      const n = hashToNav(window.location.hash);
      if (currentBp === 'mobile' || currentBp === 'tablet') {
        const base: Record<string, string> = { home: 'home', algo: 'algoList', drugs: 'drugList', tools: 'ekgList' };
        setTab(n.tab);
        setStack(s => ({
          ...s,
          [n.tab]: n.frame.screen === base[n.tab]
            ? [{ screen: base[n.tab] } as NavFrame]
            : [{ screen: base[n.tab] } as NavFrame, n.frame],
        }));
      } else {
        setDeskView(n.deskId ? { screen: n.deskScreen, id: n.deskId } : { screen: n.deskScreen });
      }
    };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, []);

  /* Keep URL in sync with nav state (replaceState — no extra history entries) */
  useEffect(() => {
    const path = stateToHash(bp, tab, stack, deskView);
    const newHash = '#' + path;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [bp, tab, stack, deskView]);

  /* PWA install prompt */
  const deferredPromptRef = useRef(null);
  const [installOpen, setInstallOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return;
    if (localStorage.getItem('acls_install_dismissed')) return;
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setTimeout(() => setInstallOpen(true), 1200);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (isIOS) setTimeout(() => setInstallOpen(true), 1200);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sessionPopupOpen, setSessionPopupOpen] = useState(false);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const handleSearchNavigate = (type: string, id: string) => {
    setSearchOpen(false);
    if (bp === 'desktop') {
      if (type === 'algo')  desktopPick('algo', id);
      if (type === 'drug')  desktopPick('drugs', id);
      if (type === 'ekg')   desktopPick('ekg', id);
      if (type === 'calc')  desktopPick('calc', id);
    } else {
      if (type === 'algo') {
        setTab('algo');
        setStack(s => ({ ...s, algo: [{ screen: 'algoList' }, { screen: 'algo', id }] }));
      } else if (type === 'drug') {
        setTab('drugs');
        setStack(s => ({ ...s, drugs: [{ screen: 'drugList' }, { screen: 'drug', id }] }));
      } else if (type === 'ekg') {
        setTab('tools');
        setStack(s => ({ ...s, tools: [{ screen: 'ekgList' }, { screen: 'ekg', id }] }));
      } else if (type === 'calc') {
        setTab('home');
        setStack(s => ({ ...s, home: [{ screen: 'home' }, { screen: 'calc', id }] }));
      }
    }
  };
  useEffect(() => {
    if (sessionStorage.getItem('acls_session_popup_shown')) return;
    const t = setTimeout(() => setSessionPopupOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);
  const closeSessionPopup = (andOpenFeedback = false) => {
    sessionStorage.setItem('acls_session_popup_shown', '1');
    setSessionPopupOpen(false);
    if (andOpenFeedback) setTimeout(() => setFeedbackOpen(true), 200);
  };

  const getCurrentPageLabel = (): string => {
    if (bp === 'mobile' || bp === 'tablet') {
      const f = topFrame;
      if (f.screen === 'algo' && 'id' in f) return `Algoritma — ${f.id}`;
      if (f.screen === 'drug' && 'id' in f) return `Obat — ${f.id}`;
      if (f.screen === 'ekg' && 'id' in f) return `EKG — ${f.id}`;
      if (f.screen === 'calc' && 'id' in f) return `Kalkulator — ${f.id}`;
      if (f.screen === 'theory') return 'Teori';
      if (f.screen === 'hsts') return 'Hs & Ts';
      return 'Beranda';
    } else {
      const v = deskView;
      if (v.screen === 'algo') return v.id ? `Algoritma — ${v.id}` : 'Algoritma';
      if (v.screen === 'drugs') return v.id ? `Obat — ${v.id}` : 'Obat';
      if (v.screen === 'ekg') return v.id ? `EKG — ${v.id}` : 'EKG';
      if (v.screen === 'calc') return v.id ? `Kalkulator — ${v.id}` : 'Kalkulator';
      if (v.screen === 'theory') return 'Teori';
      if (v.screen === 'hsts') return 'Hs & Ts';
      return 'Dashboard';
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => { setSidebarCollapsed(bp !== 'desktop'); }, [bp]);
  useEffect(() => { navRef.current = { tab, stack, cprOpen, bp, deskView }; });

  const renderMobile = () => {
    const f = topFrame;
    if (tab === 'home') {
      if (f.screen === 'algo') return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === 'drugList') return <MobileDrugList nav={nav}/>;
      if (f.screen === 'drug') return <MobileDrugDetail nav={nav} id={f.id}/>;
      if (f.screen === 'ekgList') return <MobileEkgList nav={nav}/>;
      if (f.screen === 'ekg') return <MobileEkgDetail nav={nav} id={f.id}/>;
      if (f.screen === 'hsts') return <MobileHsTs nav={nav}/>;
      if (f.screen === 'calcList') return <MobileCalcList nav={nav}/>;
      if (f.screen === 'calc') return <MobileCalcDetail nav={nav} id={f.id}/>;
      if (f.screen === 'vaso') return <VasoScreen nav={nav} isMobile/>;
      if (f.screen === 'rosc') return <RoscScreen nav={nav} isMobile/>;
      if (f.screen === 'defib') return <DefibScreen nav={nav} isMobile/>;
      if (f.screen === 'peds') return <PedsScreen nav={nav} isMobile/>;
      if (f.screen === 'theory') return <TheoryScreen nav={nav} isMobile/>;
      if (f.screen === 'about') return <AboutScreen nav={nav} isMobile onFeedback={() => { nav.pop(); setTimeout(() => setFeedbackOpen(true), 200); }}/>;
      return <MobileHome
        nav={{ push: (fr) => { if (fr.screen === 'algo') { openAlgoFromHome(fr.id); return; } nav.push(fr); }, pop: nav.pop }}
        openCPR={() => openCPR()}/>;
    }
    if (tab === 'algo') {
      if (f.screen === 'algo') return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === 'hsts') return <MobileHsTs nav={nav}/>;
      if (f.screen === 'pals') return <PalsScreen nav={nav} isMobile/>;
      if (f.screen === 'rosc') return <RoscScreen nav={nav} isMobile/>;
      return <MobileAlgoList nav={nav}/>;
    }
    if (tab === 'drugs') {
      if (f.screen === 'drug') return <MobileDrugDetail nav={nav} id={f.id}/>;
      return <MobileDrugList nav={nav}/>;
    }
    if (tab === 'tools') {
      if (f.screen === 'ekg') return <MobileEkgDetail nav={nav} id={f.id}/>;
      if (f.screen === 'drug') return <MobileDrugDetail nav={nav} id={f.id}/>;
      return <MobileEkgList nav={nav}/>;
    }
    return null;
  };

  const renderDesktop = () => {
    const v = deskView;
    if (v.screen === 'algo')  return <DesktopAlgorithm id={v.id} onPick={desktopPick}/>;
    if (v.screen === 'drugs') return <DesktopDrugs initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === 'ekg')   return <DesktopEkg initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === 'hsts')   return <DesktopHsTs onPick={desktopPick}/>;
    if (v.screen === 'calc')   return <DesktopCalc initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === 'theory') return <DesktopTheory/>;
    if (v.screen === 'defib')  return <DesktopDefib/>;
    if (v.screen === 'peds')   return <DesktopPeds/>;
    if (v.screen === 'about')  return <AboutScreen isMobile={false} onFeedback={() => setFeedbackOpen(true)}/>;
    return <DesktopDashboard onPick={desktopPick} onOpenCpr={() => openCPR()}/>;
  };

  const screenKey = tab + '-' + topFrame.screen + '-' + (('id' in topFrame ? topFrame.id : '') || '');

  if (adminOpen) {
    return <AdminPage onBack={() => setAdminOpen(false)}/>;
  }

  const isLocked = !!user && !isAuthorized;
  const isCalcScreen = topFrame.screen === 'calc' || topFrame.screen === 'calcList' || topFrame.screen === 'vaso'
    || (bp === 'desktop' && (deskView.screen === 'calc'));
  const waLockLink = `https://wa.me/6287749076019?text=${encodeURIComponent(
    'Hai dok, saya sudah daftar ACLS Helper MD Kit, username saya ' + (userProfile?.username || userProfile?.email || '')
  )}`;

  const lockedOverlay = isLocked && isCalcScreen && (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, background: 'var(--bg-secondary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
          background: 'rgba(255,149,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--label-primary)', marginBottom: 8 }}>
          Fitur Terkunci
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--label-secondary)', lineHeight: 1.55, marginBottom: 20 }}>
          Anda belum mengaktifkan langganan. Silakan hubungi kami via WhatsApp untuk verifikasi dan aktivasi akses.
        </div>
        <a href={waLockLink} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
          background: 'linear-gradient(135deg,#FF9500,#E67300)', color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
        }}>Hubungi via WhatsApp</a>
      </div>
    </div>
  );

  const subBanner = subBannerOpen && userProfile && (userProfile.subscriptionStatus === 'trial' || userProfile.subscriptionStatus === 'active') && (() => {
    const isTrial = userProfile.subscriptionStatus === 'trial';
    const expiredRaw = userProfile.subscriptionExpiredAt;
    const expDate = expiredRaw && (expiredRaw as any).toDate ? (expiredRaw as any).toDate() : null;
    const expLabel = expDate ? expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: isTrial ? 'rgba(255,149,0,0.12)' : 'rgba(52,199,89,0.12)',
        borderBottom: '0.5px solid var(--separator)', flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: '0.8125rem', color: isTrial ? 'var(--warning)' : 'var(--success)', lineHeight: 1.4 }}>
          {isTrial
            ? `Anda sedang dalam masa Trial.${expLabel ? ` Akses Anda dibatasi hingga ${expLabel}.` : ''}`
            : `Terima kasih telah berlangganan!${expLabel ? ` Status aktif hingga ${expLabel}.` : ''}`}
        </span>
        {isTrial && (
          <a href={waLockLink} target="_blank" rel="noopener noreferrer" style={{
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', whiteSpace: 'nowrap', textDecoration: 'underline',
          }}>WA</a>
        )}
        <button onClick={() => setSubBannerOpen(false)} style={{
          background: 'none', border: 0, cursor: 'pointer', color: 'var(--label-tertiary)',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    );
  })();

  /* ── MOBILE ──────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="acls-app-mobile">
        <div className="acls-mobile-statusbar">
          <AppTopBar theme={theme} onToggleTheme={toggleTheme} onOpenSidebar={() => setMobileSidebarOpen(o => !o)} sidebarOpen={mobileSidebarOpen} onGoHome={() => { setTab('home'); setFabOpen(false); }} fontScale={fontScale} onFontScaleChange={setFontScale}
            onOpenProfile={user ? () => setProfileOpen(true) : undefined} userInitial={user ? userInitial : undefined}/>
          {subBanner}
        </div>

        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={tab}
          onNavigate={mobileNavFromSidebar}
          onFeedback={() => { setFeedbackOpen(true); setMobileSidebarOpen(false); }}
          onSearch={() => setSearchOpen(true)}/>

        <div className="acls-mobile-content" key={screenKey}
          style={subBanner ? { top: 'calc(52px + env(safe-area-inset-top) + 44px)' } : undefined}>
          {lockedOverlay}
          {renderMobile()}
        </div>

        {cprOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-secondary)',
            animation: 'acls-overlay-in 280ms var(--ease-out) both', paddingTop: 'calc(52px + env(safe-area-inset-top))' }}>
            <CPRTimer isMobile initialRhythm={cprRhythm} onClose={closeCPR}/>
          </div>
        )}

        {installOpen && !cprOpen && (
          <InstallPopup
            deferredPrompt={deferredPromptRef.current}
            onClose={() => setInstallOpen(false)}
            onDismiss={() => {
              localStorage.setItem('acls_install_dismissed', '1');
              setInstallOpen(false);
            }}
          />
        )}

        {fabOpen && !cprOpen && (
          <SpeedDial onClose={() => setFabOpen(false)} onPick={onSpeedDialPick}/>
        )}

        {feedbackOpen && (
          <FeedbackModal
            onClose={() => setFeedbackOpen(false)}
            currentPage={getCurrentPageLabel()}
            currentUrl={window.location.href}
          />
        )}

        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleSearchNavigate}/>

        <ProfilePopup
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          onLogout={async () => {
            await signOut(auth);
            setProfileOpen(false);
          }}
          onOpenAdmin={() => {
            setProfileOpen(false);
            setAdminOpen(true);
          }}
        />

        {sessionPopupOpen && <SessionFeedbackPopup onClose={closeSessionPopup}/>}

        {!cprOpen && (
          <>
            {/* Lainnya sheet — slides up above bottom nav */}
            {moreSheetOpen && (
              <>
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0,
                  bottom: 'calc(60px + env(safe-area-inset-bottom))',
                  zIndex: 180,
                  background: 'rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }} onClick={() => setMoreSheetOpen(false)}/>
                <div style={{
                  position: 'fixed', bottom: 'calc(60px + env(safe-area-inset-bottom))', left: 0, right: 0,
                  zIndex: 181, padding: '0 12px 8px',
                  animation: 'acls-fadeslide 200ms var(--ease-out) both',
                }}>
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 18,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 0.5px var(--separator)',
                    overflow: 'hidden',
                    padding: 10,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}>
                    {([
                      { key: 'tools',  label: 'Pustaka EKG',  IconC: Icons.ekg,        bg: 'var(--accent-tint)',        color: 'var(--accent)'   },
                      { key: 'hsts',   label: 'Hs & Ts',      IconC: Icons.clipboard,  bg: 'rgba(10,132,255,0.12)',    color: 'var(--info)'     },
                      { key: 'calc',   label: 'Kalkulator',   IconC: Icons.calculator, bg: 'rgba(175,82,222,0.14)',    color: '#AF52DE'         },
                      { key: 'theory', label: 'Teori',        IconC: Icons.activity,   bg: 'rgba(52,199,89,0.14)',     color: 'var(--success)'  },
                      { key: 'defib',  label: 'Defibrilasi',  IconC: Icons.boltFill,   bg: 'rgba(255,59,48,0.12)',     color: 'var(--danger)'   },
                      { key: 'peds',   label: 'Pediatrik',    IconC: Icons.heart,      bg: 'rgba(48,176,199,0.14)',    color: '#30B0C7'         },
                    ] as const).map(({ key, label, IconC, bg, color }) => (
                      <button key={key}
                        onClick={() => {
                          setMoreSheetOpen(false);
                          setFabOpen(false);
                          mobileNavFromSidebar(key);
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '12px 8px',
                          background: 'var(--fill-quaternary)', borderRadius: 12,
                          border: 'none', cursor: 'pointer',
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconC size={20} stroke={1.9} style={{ color }}/>
                        </div>
                        <span className="t-caption-2" style={{ fontWeight: 600, color: 'var(--label-primary)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="acls-mobile-bottomnav">
              <BottomNav
                active={tab}
                moreActive={tab === 'tools' || (tab === 'home' && (['hsts','calcList','calc','vaso','rosc','defib','peds','theory'] as string[]).includes(topFrame.screen))}
                onChange={(k) => {
                  setFabOpen(false);
                  setMoreSheetOpen(false);
                  if (k === 'home') {
                    window.history.replaceState(null, '', '#/');
                    setStack(s => ({ ...s, home: [{ screen: 'home' }] }));
                  } else {
                    const pathMap: Record<string, string> = { algo: '/algo', drugs: '/drugs' };
                    const path = pathMap[k] || '/';
                    window.history.pushState(null, '', '#' + path);
                  }
                  setTab(k as Tab);
                }}
                onMore={() => { setFabOpen(false); setMoreSheetOpen(o => !o); }}
                fabShape="circle"
                accent="var(--danger)"
                fabOpen={fabOpen}
                onFabClick={() => { setMoreSheetOpen(false); setFabOpen(o => !o); }}/>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ── TABLET + DESKTOP ─────────────────────────────────────────── */
  return (
    <div className="acls-app-desktop">
      {/* Full-width topbar — same structure as mobile */}
      <AppTopBar theme={theme} onToggleTheme={toggleTheme} onGoHome={() => setDeskView({ screen: 'dashboard' })}
        onOpenSidebar={() => setSidebarCollapsed(c => !c)} sidebarOpen={!sidebarCollapsed}
        fontScale={fontScale} onFontScaleChange={setFontScale}
        onOpenProfile={user ? () => setProfileOpen(true) : undefined} userInitial={user ? userInitial : undefined}/>
      {subBanner}

      <div className="acls-desktop-body">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          active={deskView.screen}
          onChange={(screen, id) => desktopPick(screen, id)}
          onFeedback={() => setFeedbackOpen(true)}
          onSearch={() => setSearchOpen(true)}/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {/* Content area — CPR panel renders here (absolute) so sidebar stays visible */}
          <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
            {lockedOverlay}
            {renderDesktop()}

            {cprOpen && (
              <>
                {/* Blur backdrop over content area */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 10,
                  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)' }}
                  onClick={closeCPR}/>
                {/* CPR panel — centered, max-width 900px */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 11,
                  display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 'min(900px, 100%)', height: '100%',
                    background: 'var(--bg-secondary)', pointerEvents: 'all',
                    animation: 'acls-overlay-in 280ms var(--ease-out) both',
                    boxShadow: 'var(--shadow-2), 0 0 0 0.5px var(--separator)' }}>
                    <CPRTimer isMobile={false} initialRhythm={cprRhythm} onClose={closeCPR}/>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {feedbackOpen && (
        <FeedbackModal
          onClose={() => setFeedbackOpen(false)}
          currentPage={getCurrentPageLabel()}
          currentUrl={window.location.href}
        />
      )}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleSearchNavigate}/>
      <ProfilePopup
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={async () => {
          await signOut(auth);
          setProfileOpen(false);
        }}
        onOpenAdmin={() => {
          setProfileOpen(false);
          setAdminOpen(true);
        }}
      />
      {sessionPopupOpen && <SessionFeedbackPopup onClose={closeSessionPopup}/>}
    </div>
  );
}
