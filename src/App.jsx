import { useState, useEffect } from 'react';
import { StatusBar } from './components/base';
import { BottomNav, CPRTimer } from './components/acls';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakButton } from './components/tweaks';
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

const TWEAK_DEFAULTS = {
  accent: "teal",
  theme: "light",
  fabShape: "circle",
  showDesktop: true,
};

const ACCENTS = {
  teal: { color: "#30B0C7", dark: "#40C8E0", name: "Teal · Cyan" },
  red:  { color: "#FF3B30", dark: "#FF453A", name: "Red · Emergency" },
  blue: { color: "#007AFF", dark: "#0A84FF", name: "Blue · Clinical" },
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    if (t.theme === "dark") root.setAttribute("data-theme", "dark");
    else if (t.theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");

    const accent = ACCENTS[t.accent] || ACCENTS.teal;
    const isDark = t.theme === "dark" || (t.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.style.setProperty("--accent", isDark ? accent.dark : accent.color);
    root.style.setProperty("--accent-fg", "#fff");
    root.style.setProperty("--accent-tint", accent.color + "1F");
    root.style.setProperty("--label-link", isDark ? accent.dark : accent.color);
  }, [t.accent, t.theme]);

  /* Mobile nav state */
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState({
    home:  [{ screen: "home" }],
    algo:  [{ screen: "algoList" }],
    drugs: [{ screen: "drugList" }],
    tools: [{ screen: "ekgList" }],
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
    setTab("algo");
    setStack(s => ({ ...s, algo: [{ screen: "algoList" }, { screen: "algo", id }] }));
  };

  /* Sheet & CPR overlay */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cprOpen, setCprOpen] = useState(false);

  /* Desktop state */
  const [deskView, setDeskView] = useState({ screen: "dashboard" });
  const desktopPick = (screen, id) => setDeskView({ screen, id });

  const renderMobile = () => {
    const f = topFrame;
    if (tab === "home") {
      if (f.screen === "algo") return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === "drugList") return <MobileDrugList nav={nav}/>;
      if (f.screen === "drug") return <MobileDrugDetail nav={nav} id={f.id}/>;
      if (f.screen === "ekgList") return <MobileEkgList nav={nav}/>;
      if (f.screen === "ekg") return <MobileEkgDetail nav={nav} id={f.id}/>;
      if (f.screen === "hsts") return <MobileHsTs nav={nav}/>;
      return <MobileHome
        nav={{ push: (fr) => { if (fr.screen === "algo") { openAlgoFromHome(fr.id); return; } nav.push(fr); }, pop: nav.pop }}
        openSheet={() => setSheetOpen(true)}
        openCPR={() => setCprOpen(true)}/>;
    }
    if (tab === "algo") {
      if (f.screen === "algo") return <MobileAlgorithmDetail nav={nav} id={f.id}/>;
      if (f.screen === "hsts") return <MobileHsTs nav={nav}/>;
      return <MobileAlgoList nav={nav}/>;
    }
    if (tab === "drugs") {
      if (f.screen === "drug") return <MobileDrugDetail nav={nav} id={f.id}/>;
      return <MobileDrugList nav={nav}/>;
    }
    if (tab === "tools") {
      if (f.screen === "ekg") return <MobileEkgDetail nav={nav} id={f.id}/>;
      if (f.screen === "drug") return <MobileDrugDetail nav={nav} id={f.id}/>;
      return <MobileEkgList nav={nav}/>;
    }
    return null;
  };

  const renderDesktop = () => {
    const v = deskView;
    if (v.screen === "algo")  return <DesktopAlgorithm id={v.id || "arrest"} onPick={desktopPick}/>;
    if (v.screen === "drugs") return <DesktopDrugs initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === "ekg")   return <DesktopEkg initialId={v.id} onPick={desktopPick}/>;
    if (v.screen === "hsts")  return <DesktopHsTs onPick={desktopPick}/>;
    return <DesktopDashboard onPick={desktopPick} onOpenCpr={() => setCprOpen(true)}/>;
  };

  const screenKey = tab + "-" + topFrame.screen + "-" + (topFrame.id || "");
  const accentObj = ACCENTS[t.accent] || ACCENTS.teal;
  const algoLabel = (ACLS_ALGORITHMS.find(a => a.key === deskView.id) || {}).label || "Adult Cardiac Arrest";

  return (
    <div className="acls-canvas">
      {/* MOBILE PHONE */}
      <section className="acls-stage acls-stage-mobile" data-screen-label="Mobile · ACLS Helper">
        <div className="acls-stage-caption">
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>MOBILE · 390 × 844</div>
          <div className="t-headline">Bedside &amp; Code Blue</div>
        </div>
        <div className="phone-frame" data-screen-label={`Phone · ${tab}/${topFrame.screen}`}>
          <div className="notch"/>

          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
            background: "var(--material-chrome)",
            backdropFilter: "var(--blur-base)",
            WebkitBackdropFilter: "var(--blur-base)",
          }}>
            <StatusBar/>
          </div>

          <div className="phone-screen" style={{ paddingTop: 47, paddingBottom: 104 }} key={screenKey}>
            {renderMobile()}
          </div>

          {cprOpen && (
            <div style={{ position: "absolute", inset: 0, zIndex: 200, background: "var(--bg-secondary)" }}>
              <CPRTimer onClose={() => setCprOpen(false)}/>
            </div>
          )}

          {!cprOpen && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 100 }}>
              <BottomNav
                active={tab === "tools" ? "tools" : tab}
                onChange={(k) => setTab(k)}
                fabShape={t.fabShape}
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
                if (key === "cpr") { setCprOpen(true); return; }
                const map = { vf: "vfvt", pea: "pea", brady: "brady", tachy: "tachy" };
                setTab("algo");
                setStack(s => ({ ...s, algo: [{ screen: "algoList" }, { screen: "algo", id: map[key] }] }));
              }}
              onOpenCpr={() => { setSheetOpen(false); setCprOpen(true); }}/>
          )}
        </div>
      </section>

      {/* DESKTOP WORKSTATION */}
      {t.showDesktop && (
        <section className="acls-stage acls-stage-desktop" data-screen-label="Desktop · ACLS Helper">
          <div className="acls-stage-caption">
            <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DESKTOP · 1280 × 800</div>
            <div className="t-headline">Workstation klinis</div>
          </div>
          <div className="desktop-frame">
            <div className="desktop-chrome">
              <span style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#FF5F57" }}/>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#FEBC2E" }}/>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: "#28C840" }}/>
              </span>
              <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>aclshelper.mdkit.app</div>
              <span/>
            </div>
            <div className="desktop-body">
              <DesktopSidebar
                active={deskView.screen}
                onChange={(screen, id) => setDeskView({ screen, id })}
                onOpenCpr={() => setCprOpen(true)}/>
              <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-secondary)" }}>
                <DesktopTopbar crumb={
                  deskView.screen === "algo"  ? ["ACLS Helper", "Algoritma", algoLabel]
                  : deskView.screen === "drugs" ? ["ACLS Helper", "Obat"]
                  : deskView.screen === "ekg"   ? ["ACLS Helper", "Pustaka EKG"]
                  : deskView.screen === "hsts"  ? ["ACLS Helper", "Hs & Ts"]
                  : ["ACLS Helper", "Beranda"]
                }/>
                <div style={{ flex: 1, overflow: "hidden", background: "var(--bg-secondary)" }}>
                  {renderDesktop()}
                </div>
              </main>
            </div>
          </div>
        </section>
      )}

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Pengaturan ACLS Helper">
        <TweakSection label="Branding">
          <TweakColor
            label="Warna aksen"
            value={t.accent}
            options={[
              ["#30B0C7", "#1F8A9A", "#0E5E68"],
              ["#FF3B30", "#c81e10", "#7d0d05"],
              ["#007AFF", "#0058B8", "#003B7D"],
            ]}
            onChange={(v) => {
              const first = Array.isArray(v) ? v[0] : v;
              const key = first === "#30B0C7" ? "teal" : first === "#FF3B30" ? "red" : "blue";
              setTweak("accent", key);
            }}/>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "4px 12px 0" }}>
            Aktif: {accentObj.name}
          </div>
        </TweakSection>

        <TweakSection label="Tampilan">
          <TweakRadio
            label="Tema"
            value={t.theme}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
            onChange={(v) => setTweak("theme", v)}/>
        </TweakSection>

        <TweakSection label="FAB · Tombol Code Blue">
          <TweakRadio
            label="Bentuk"
            value={t.fabShape}
            options={[
              { value: "circle", label: "Circle" },
              { value: "squircle", label: "Squircle" },
              { value: "pill", label: "Pill" },
            ]}
            onChange={(v) => setTweak("fabShape", v)}/>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "4px 12px 0" }}>
            Ketuk = sheet cepat. Tekan-tahan (550 ms) = CPR Workspace.
          </div>
        </TweakSection>

        <TweakSection label="Canvas">
          <TweakToggle
            label="Tampilkan desktop"
            value={t.showDesktop}
            onChange={(v) => setTweak("showDesktop", v)}/>
        </TweakSection>

        <TweakSection label="Coba interaksi">
          <TweakButton label="Buka sheet Code Blue" onClick={() => setSheetOpen(true)}/>
          <TweakButton label="Buka CPR Workspace" onClick={() => setCprOpen(true)} secondary/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
