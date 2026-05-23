import { useState, useEffect, useRef } from 'react';
import { BottomNav, CPRTimer } from './components/acls';
import {
  MobileHome, MobileAlgoList, MobileAlgorithmDetail,
  MobileDrugList, MobileDrugDetail,
  MobileEkgList, MobileEkgDetail,
  MobileHsTs,
} from './screens/mobile';
import {
  DesktopSidebar, DesktopTopbar, DesktopDashboard,
  DesktopAlgorithm, DesktopDrugs, DesktopEkg, DesktopHsTs,
} from './screens/desktop';
import { ACLS_ALGORITHMS } from './data';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

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

function AppTopBar({ theme, onToggleTheme }) {
  const time = useClock();
  return (
    <div style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--material-chrome)',
      backdropFilter: 'var(--blur-base)',
      WebkitBackdropFilter: 'var(--blur-base)',
      borderBottom: '0.5px solid var(--separator)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

export default function App() {
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    root.style.setProperty('--accent', isDark ? ACCENT.dark : ACCENT.color);
    root.style.setProperty('--accent-fg', '#fff');
    root.style.setProperty('--accent-tint', ACCENT.color + '1F');
    root.style.setProperty('--label-link', isDark ? ACCENT.dark : ACCENT.color);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  /* Mobile nav state */
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState({
    home:  [{ screen: 'home' }],
    algo:  [{ screen: 'algoList' }],
    drugs: [{ screen: 'drugList' }],
    tools: [{ screen: 'ekgList' }],
  });
  const topFrame = stack[tab][stack[tab].length - 1];

  const nav = {
    push: (frame) => setStack(s => ({ ...s, [tab]: [...s[tab], frame] })),
    pop: () => setStack(s => {
      const cur = s[tab];
      if (cur.length <= 1) return s;
      return { ...s, [tab]: cur.slice(0, -1) };
    }),
  };

  const openAlgoFromHome = (id) => {
    setTab('algo');
    setStack(s => ({ ...s, algo: [{ screen: 'algoList' }, { screen: 'algo', id }] }));
  };

  const [cprOpen, setCprOpen] = useState(false);

  /* Desktop state */
  const [deskView, setDeskView] = useState({ screen: 'dashboard' });
  const desktopPick = (screen, id) => setDeskView({ screen, id });

  const renderMobile = () => {
    const f = topFrame;
    if (tab === 'home') {
      if (f.screen === 'algo') return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === 'drugList') return <MobileDrugList nav={nav}/>;
      if (f.screen === 'drug') return <MobileDrugDetail nav={nav} id={f.id}/>;
      if (f.screen === 'ekgList') return <MobileEkgList nav={nav}/>;
      if (f.screen === 'ekg') return <MobileEkgDetail nav={nav} id={f.id}/>;
      if (f.screen === 'hsts') return <MobileHsTs nav={nav}/>;
      return <MobileHome
        nav={{ push: (fr) => { if (fr.screen === 'algo') { openAlgoFromHome(fr.id); return; } nav.push(fr); }, pop: nav.pop }}
        openCPR={() => setCprOpen(true)}/>;
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
    if (v.screen === 'algo')  return <DesktopAlgorithm id={v.id || 'arrest'} onPick={desktopPick}/>;
    if (v.screen === 'drugs') return <DesktopDrugs initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === 'ekg')   return <DesktopEkg initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === 'hsts')  return <DesktopHsTs onPick={desktopPick}/>;
    return <DesktopDashboard onPick={desktopPick} onOpenCpr={() => setCprOpen(true)}/>;
  };

  const screenKey = tab + '-' + topFrame.screen + '-' + (topFrame.id || '');
  const algoLabel = (ACLS_ALGORITHMS.find(a => a.key === deskView.id) || {}).label || 'Adult Cardiac Arrest';

  if (isMobile) {
    return (
      <div className="acls-app-mobile">
        <div className="acls-mobile-statusbar">
          <AppTopBar theme={theme} onToggleTheme={toggleTheme}/>
        </div>

        <div className="acls-mobile-content" key={screenKey}>
          {renderMobile()}
        </div>

        {cprOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-secondary)' }}>
            <CPRTimer onClose={() => setCprOpen(false)}/>
          </div>
        )}

        {!cprOpen && (
          <div className="acls-mobile-bottomnav">
            <BottomNav
              active={tab === 'tools' ? 'tools' : tab}
              onChange={(k) => setTab(k)}
              fabShape="circle"
              accent="var(--danger)"
              onFabClick={() => setCprOpen(true)}/>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="acls-app-desktop">
      <DesktopSidebar
        active={deskView.screen}
        onChange={(screen, id) => setDeskView({ screen, id })}
        onOpenCpr={() => setCprOpen(true)}/>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        <DesktopTopbar crumb={
          deskView.screen === 'algo'  ? ['ACLS Helper', 'Algoritma', algoLabel]
          : deskView.screen === 'drugs' ? ['ACLS Helper', 'Obat']
          : deskView.screen === 'ekg'   ? ['ACLS Helper', 'Pustaka EKG']
          : deskView.screen === 'hsts'  ? ['ACLS Helper', 'Hs & Ts']
          : ['ACLS Helper', 'Beranda']
        }/>
        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {renderDesktop()}
        </div>
      </main>

      {cprOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-secondary)' }}>
          <CPRTimer onClose={() => setCprOpen(false)}/>
        </div>
      )}
    </div>
  );
}
