import { useState, useEffect } from 'react';
import { StatusBar } from './components/base';
import { BottomNav, CPRTimer } from './components/acls';
import {
  MobileHome, MobileAlgoList, MobileAlgorithmDetail,
  MobileDrugList, MobileDrugDetail,
  MobileEkgList, MobileEkgDetail,
  MobileHsTs, FabQuickSheet,
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

export default function App() {
  const isMobile = useIsMobile();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.style.setProperty('--accent', '#30B0C7');
    root.style.setProperty('--accent-fg', '#fff');
    root.style.setProperty('--accent-tint', '#30B0C71F');
    root.style.setProperty('--label-link', '#30B0C7');
  }, []);

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

  const [sheetOpen, setSheetOpen] = useState(false);
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
        openSheet={() => setSheetOpen(true)}
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
          <StatusBar/>
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
              onFabTap={() => setSheetOpen(true)}
              onFabLongPress={() => { setSheetOpen(false); setCprOpen(true); }}/>
          </div>
        )}

        {!cprOpen && (
          <FabQuickSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onPickAction={(key) => {
              setSheetOpen(false);
              if (key === 'cpr') { setCprOpen(true); return; }
              const map = { vf: 'vfvt', pea: 'pea', brady: 'brady', tachy: 'tachy' };
              setTab('algo');
              setStack(s => ({ ...s, algo: [{ screen: 'algoList' }, { screen: 'algo', id: map[key] }] }));
            }}
            onOpenCpr={() => { setSheetOpen(false); setCprOpen(true); }}/>
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
