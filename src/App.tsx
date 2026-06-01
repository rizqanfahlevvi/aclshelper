import { useState, useEffect, useRef } from 'react';
import { BottomNav, CPRTimer } from './components/acls';
import { Icons } from './components/base';
import type { Tab, DeskScreen, NavFrame, DeskView, NavStack, CprRhythm } from './types';

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
    case 'calc':  return { tab: 'home',  frame: id ? { screen: 'calc', id }  : { screen: 'calcList' },   deskScreen: 'calc',      deskId: id  };
    default:      return { tab: 'home',  frame: { screen: 'home' },                                        deskScreen: 'dashboard', deskId: null };
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

interface AppTopBarProps {
  theme: string;
  onToggleTheme: () => void;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  onGoHome?: () => void;
}
function AppTopBar({ theme, onToggleTheme, onOpenSidebar, sidebarOpen = false, onGoHome }: AppTopBarProps) {
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
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.022em', color: 'var(--label-primary)' }}>
            ACLS Helper
          </span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--label-secondary)',
          letterSpacing: '0.02em',
        }}>
          {time}
        </span>
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
      </div>
    </div>
  );
}

const ACCENT = { color: '#30B0C7', dark: '#40C8E0' };

const MOBILE_MENU = [
  { key: 'home',  label: 'Beranda',     desc: 'Ikhtisar & akses cepat', icon: Icons.house },
  { key: 'algo',  label: 'Algoritma',   desc: '14 protokol ACLS',       icon: Icons.algo },
  { key: 'drugs', label: 'Obat',        desc: '25 obat emergensi',      icon: Icons.pill },
  { key: 'tools', label: 'Pustaka EKG', desc: '16 ritme kardiologi',    icon: Icons.ekg },
  { key: 'hsts',  label: 'Hs & Ts',     desc: '10 penyebab reversibel', icon: Icons.clipboard },
  { key: 'calc',  label: 'Kalkulator',  desc: '8 skoring kardiovaskular', icon: Icons.calculator },
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

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (key: string, id?: string) => void;
  onOpenCpr: () => void;
}
function MobileSidebar({ open, onClose, activeTab, onNavigate, onOpenCpr }: MobileSidebarProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const menuFiltered = q ? MOBILE_MENU.filter(it => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)) : MOBILE_MENU;
  const quickFiltered = q ? MOBILE_QUICK.filter(it => it.label.toLowerCase().includes(q)) : MOBILE_QUICK;
  const noResults = q && menuFiltered.length === 0 && quickFiltered.length === 0;
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
        <div style={{ padding: '10px 14px 0' }}>
          <div className="acls-sidebar-search">
            <Icons.search size={14} stroke={2}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari…"
              style={{ flex: 1, background: 'none', border: 0, outline: 'none',
                color: 'var(--label-primary)', fontSize: 13, fontFamily: 'inherit' }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0,
                  color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <nav className="acls-sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {noResults && (
            <div style={{ padding: '12px 18px', color: 'var(--label-tertiary)', fontSize: 13 }}>Tidak ditemukan</div>
          )}
          {menuFiltered.map(it => (
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
          {quickFiltered.length > 0 && (
            <>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '14px 18px 4px' }}>AKSES CEPAT</div>
              {quickFiltered.map(it => (
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
          <button onClick={() => { onOpenCpr(); onClose(); }}
            style={{ background: 'var(--danger)', color: '#fff', height: 46, width: '100%',
              borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'flex', gap: 8,
              boxShadow: '0 8px 20px rgba(255,59,48,0.25)', border: 0, cursor: 'pointer',
              justifyContent: 'center', alignItems: 'center' }}>
            <Icons.heartFill size={18}/> Code Blue
          </button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [theme, setTheme] = useState('light');

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
      return <MobileHome
        nav={{ push: (fr) => { if (fr.screen === 'algo') { openAlgoFromHome(fr.id); return; } nav.push(fr); }, pop: nav.pop }}
        openCPR={() => openCPR()}/>;
    }
    if (tab === 'algo') {
      if (f.screen === 'algo') return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === 'hsts') return <MobileHsTs nav={nav}/>;
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
    if (v.screen === 'hsts')  return <DesktopHsTs onPick={desktopPick}/>;
    if (v.screen === 'calc')  return <DesktopCalc initialId={v.id} onPick={desktopPick}/>;
    return <DesktopDashboard onPick={desktopPick} onOpenCpr={() => openCPR()}/>;
  };

  const screenKey = tab + '-' + topFrame.screen + '-' + (('id' in topFrame ? topFrame.id : '') || '');

  /* ── MOBILE ──────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="acls-app-mobile">
        <div className="acls-mobile-statusbar">
          <AppTopBar theme={theme} onToggleTheme={toggleTheme} onOpenSidebar={() => setMobileSidebarOpen(o => !o)} sidebarOpen={mobileSidebarOpen} onGoHome={() => { setTab('home'); setFabOpen(false); }}/>
        </div>

        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={tab}
          onNavigate={mobileNavFromSidebar}
          onOpenCpr={() => { openCPR(); setMobileSidebarOpen(false); }}/>

        <div className="acls-mobile-content" key={screenKey}>
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

        {!cprOpen && (
          <div className="acls-mobile-bottomnav">
            <BottomNav
              active={tab === 'tools' ? 'tools' : tab}
              onChange={(k) => {
                setFabOpen(false);
                if (k !== 'home') {
                  const pathMap: Record<string, string> = { algo: '/algo', drugs: '/drugs', tools: '/ekg' };
                  const path = pathMap[k] || '/';
                  window.history.pushState(null, '', '#' + path);
                }
                setTab(k as Tab);
              }}
              fabShape="circle"
              accent="var(--danger)"
              fabOpen={fabOpen}
              onFabClick={() => setFabOpen(o => !o)}/>
          </div>
        )}
      </div>
    );
  }

  /* ── TABLET + DESKTOP ─────────────────────────────────────────── */
  return (
    <div className="acls-app-desktop">
      {/* Full-width topbar — same structure as mobile */}
      <AppTopBar theme={theme} onToggleTheme={toggleTheme} onGoHome={() => setDeskView({ screen: 'dashboard' })}
        onOpenSidebar={() => setSidebarCollapsed(c => !c)} sidebarOpen={!sidebarCollapsed}/>

      <div className="acls-desktop-body">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          active={deskView.screen}
          onChange={(screen, id) => desktopPick(screen, id)}
          onOpenCpr={() => openCPR()}/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {/* Content area — CPR panel renders here (absolute) so sidebar stays visible */}
          <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
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
    </div>
  );
}
