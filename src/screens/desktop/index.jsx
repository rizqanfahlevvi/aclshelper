import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icons } from '../../components/base';
import { RhythmStrip, EkgImage } from '../../components/acls';
import {
  ACLS_ALGORITHMS, ACLS_DRUGS, ACLS_RHYTHMS, ACLS_HS_TS,
  ACLS_FLOW_ARREST, ACLS_FLOW_BRADY, ACLS_FLOW_TACHY,
  ACLS_FLOW_BHJD, ACLS_FLOW_SKA, ACLS_FLOW_ROSC,
  ACLS_FLOW_OPIOID, ACLS_FLOW_ANAPHYLAXIS, ACLS_FLOW_PREGNANCY,
  ACLS_FLOW_DROWNING, ACLS_FLOW_HYPOTHERMIA,
} from '../../data';

/* ============================================================
   Sidebar
   ============================================================ */
const SIDEBAR_NAV = [
  { key: "dashboard", label: "Beranda",     desc: "Ikhtisar & akses cepat",  icon: Icons.house },
  { key: "algo",      label: "Algoritma",   desc: "14 protokol ACLS",        icon: Icons.algo },
  { key: "drugs",     label: "Obat",        desc: "25 obat emergensi",       icon: Icons.pill },
  { key: "ekg",       label: "Pustaka EKG", desc: "16 ritme kardiologi",     icon: Icons.ekg },
  { key: "hsts",      label: "Hs & Ts",     desc: "10 penyebab reversibel",  icon: Icons.clipboard },
];
const SIDEBAR_QUICK = [
  { key: "bhjd",        label: "BHJD Dewasa",     tint: "var(--accent)" },
  { key: "vfvt",        label: "VF / pVT",         tint: "var(--danger)" },
  { key: "pea",         label: "PEA / Asistol",    tint: "var(--info)" },
  { key: "brady",       label: "Bradikardi",       tint: "var(--warning)" },
  { key: "tachy",       label: "Takikardi",        tint: "var(--tint-neuro)" },
  { key: "ska",         label: "SKA / STEMI",      tint: "var(--tint-vital)" },
  { key: "opioid",      label: "Overdosis Opioid", tint: "var(--tint-neuro)" },
  { key: "anaphylaxis", label: "Anafilaksis",      tint: "var(--danger)" },
  { key: "pregnancy",   label: "Henti Kehamilan",  tint: "var(--tint-vital)" },
  { key: "drowning",    label: "Tenggelam",        tint: "var(--info)" },
  { key: "hypothermia", label: "Hipotermia Berat", tint: "var(--accent)" },
];

export function DesktopSidebar({ active, onChange, onOpenCpr, collapsed = false }) {
  const [query, setQuery] = React.useState('');
  const q = query.trim().toLowerCase();
  const navItems = q ? SIDEBAR_NAV.filter(it => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)) : SIDEBAR_NAV;
  const quickItems = q ? SIDEBAR_QUICK.filter(it => it.label.toLowerCase().includes(q)) : SIDEBAR_QUICK;
  const noResults = q && navItems.length === 0 && quickItems.length === 0;
  return (
    <aside className={collapsed ? 'acls-sidebar acls-sidebar--collapsed' : 'acls-sidebar'}>
      {!collapsed && (
        <div style={{ padding: '10px 12px 4px', flexShrink: 0 }}>
          <div className="acls-sidebar-search" style={{ margin: 0, animation: 'acls-fadeslide 200ms var(--ease-out) both' }}>
            <Icons.search size={14} stroke={2}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari…"
              style={{ flex: 1, minWidth: 0, background: 'none', border: 0, outline: 'none',
                color: 'var(--label-primary)', fontSize: 13, fontFamily: 'inherit' }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0,
                  color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center',
                  lineHeight: 1, flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="acls-sidebar-nav">
        {(collapsed ? SIDEBAR_NAV : navItems).map(it => (
          <button key={it.key} onClick={() => onChange(it.key)}
            className={"acls-sidebar-item " + (active === it.key ? "active" : "")}
            style={{ padding: '0 10px', height: 48 }}
            title={collapsed ? it.label : undefined}>
            <div style={{ width: 20, height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              <it.icon size={18} stroke={1.9}/>
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0,
                animation: 'acls-fadeslide 180ms var(--ease-out) both' }}>
                <span style={{ lineHeight: 1.3 }}>{it.label}</span>
                <span className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 400,
                  textTransform: 'none', letterSpacing: 0, lineHeight: 1.2 }}>{it.desc}</span>
              </div>
            )}
          </button>
        ))}

        {!collapsed && (
          <>
            {noResults && (
              <div style={{ padding: '12px 18px', color: 'var(--label-tertiary)', fontSize: 13 }}>Tidak ditemukan</div>
            )}
            {quickItems.length > 0 && (
              <>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "14px 18px 4px" }}>AKSES CEPAT</div>
                {quickItems.map(it => (
                  <button key={it.key} onClick={() => onChange("algo", it.key)} className="acls-sidebar-item">
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: it.tint, marginLeft: 5, marginRight: 5, flexShrink: 0 }}/>
                    <span>{it.label}</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      <div style={{ padding: collapsed ? '10px 8px 20px' : '10px 14px 16px', marginTop: 'auto' }}>
        {collapsed ? (
          <button onClick={onOpenCpr}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--danger)',
              color: '#fff', border: 0, cursor: 'pointer', margin: '0 auto', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(255,59,48,0.35)' }}>
            <Icons.boltFill size={20}/>
          </button>
        ) : (
          <button onClick={onOpenCpr} className="ios-btn block"
            style={{ background: "var(--danger)", color: "#fff", height: 46,
              borderRadius: 12, fontSize: 15, fontWeight: 700, display: "flex", gap: 8,
              boxShadow: "0 8px 20px rgba(255,59,48,0.25)",
              justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Icons.boltFill size={18}/> Code Blue
          </button>
        )}
      </div>
    </aside>
  );
}

/* ============================================================
   Topbar
   ============================================================ */
export function DesktopTopbar({ crumb }) {
  return (
    <div className="acls-topbar">
      <div className="t-footnote" style={{ color: "var(--label-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icons.chevR size={12} stroke={2}/>}
            <span style={{ color: i === crumb.length - 1 ? "var(--label-primary)" : "inherit", fontWeight: i === crumb.length - 1 ? 600 : 400 }}>{c}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard
   ============================================================ */
export function DesktopDashboard({ onPick, onOpenCpr }) {
  const [spotlight, setSpotlight] = useState(0);
  const [dir, setDir] = useState('right');
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);

  const switchTo = (idx, direction = 'right') => {
    setDir(direction);
    setSpotlight(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDir('right');
      setSpotlight(s => (s + 1) % 2);
    }, 7000);
  };
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDir('right');
      setSpotlight(s => (s + 1) % 2);
    }, 7000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) switchTo((spotlight + 1) % 2, delta < 0 ? 'right' : 'left');
    touchStartX.current = null;
  };
  return (
    <div style={{ padding: "16px 24px 32px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 20, animation: 'acls-fadeslide 360ms var(--ease-out) both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,59,48,0.10)', borderRadius: 20, padding: '4px 12px', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)',
            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your daily Cardiac Problem Companion
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ animation: 'acls-fadeslide 400ms 40ms var(--ease-out) both' }}>
            <div style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', fontWeight: 800, lineHeight: 1.0,
              letterSpacing: '-0.03em', marginBottom: 8 }}>
              <span style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #FF6830 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ACLS
              </span>
              {' '}
              <span style={{ color: 'var(--label-primary)' }}>Helper</span>
            </div>
            <div className="t-callout" style={{ color: 'var(--label-secondary)', maxWidth: 380 }}>
              Alat bantu kognitif cepat untuk ACLS, code blue, dan manajemen irama emergensi.
            </div>
            <a href="https://id.linkedin.com/in/rizqanfahlevvi/"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
                textDecoration: 'none' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0A66C2',
                letterSpacing: '0.06em', textTransform: 'uppercase' }}>Made by Rizqanfahlevvi</span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: 10, flexShrink: 0,
            animation: 'acls-fadeslide 400ms 80ms var(--ease-out) both' }}>
            {[
              { value: '14',   label: 'Algoritma',  color: 'var(--danger)',  screen: 'algo' },
              { value: '25',   label: 'Obat',       color: 'var(--warning)', screen: 'drugs' },
              { value: '16',   label: 'EKG Rhythm', color: 'var(--info)',    screen: 'ekg' },
              { value: '2025', label: 'Panduan',    color: 'var(--success)', screen: null },
            ].map(({ value, label, color, screen }) => (
              <div key={label} onClick={() => screen && onPick(screen)}
                style={{ background: 'var(--fill-secondary)',
                  borderRadius: 12, padding: '10px 14px', minWidth: 90,
                  transition: 'transform 160ms', cursor: screen ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (screen) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DesktopTopbar crumb={['Beranda']}/>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: 14,
        animation: 'acls-fadeslide 400ms 120ms var(--ease-out) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ overflow: 'hidden', borderRadius: 16, flex: 1 }}
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {spotlight === 0
              ? <button key="cb" onClick={onOpenCpr}
                  style={{ width: '100%', minHeight: 140, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 16px',
                    background: 'linear-gradient(135deg, var(--danger), #c81e10)', color: '#fff',
                    borderRadius: 16, border: 0, cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255,59,48,0.30)',
                    animation: `acls-slide-from-${dir} 280ms var(--ease-out) both` }}>
                  <Icons.boltFill size={26}/>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Code Blue</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>CPR Workspace</div>
                  </div>
                </button>
              : <a key="sw" href="https://saweria.co/rizqanfahlevvi" target="_blank" rel="noopener noreferrer"
                  style={{ width: '100%', minHeight: 140, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 16px',
                    background: 'linear-gradient(135deg, #FF9500, #E67300)', color: '#fff',
                    borderRadius: 16, border: 0, cursor: 'pointer', textDecoration: 'none',
                    boxShadow: '0 8px 20px rgba(255,149,0,0.30)',
                    animation: `acls-slide-from-${dir} 280ms var(--ease-out) both` }}>
                  <Icons.coffee size={26} stroke={2}/>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Dukung</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>saweria.co</div>
                  </div>
                </a>
            }
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {[0, 1].map(i => (
              <div key={i} onClick={() => switchTo(i, i > spotlight ? 'right' : 'left')}
                style={{
                  width: spotlight === i ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                  background: spotlight === i
                    ? (i === 0 ? 'var(--danger)' : '#FF9500')
                    : 'var(--fill-tertiary)',
                  transition: 'width 200ms var(--ease-out), background 200ms'
                }}/>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { key: "vfvt",  label: "VF / pVT",       sub: "Shockable rhythm",   tint: "var(--danger)",     icon: <Icons.boltFill size={16}/> },
            { key: "pea",   label: "PEA / Asystole", sub: "Non-shockable",      tint: "var(--info)",       icon: <Icons.flatline size={16} stroke={2.2}/> },
            { key: "brady", label: "Bradikardi",     sub: "HR < 50",            tint: "var(--warning)",    icon: <Icons.slow size={16} stroke={2.2}/> },
            { key: "tachy", label: "Takikardi",      sub: "HR > 150",           tint: "var(--tint-neuro)", icon: <Icons.fast size={16} stroke={2.2}/> },
          ].map(c => (
            <button key={c.key} onClick={() => onPick("algo", c.key)} className="acls-desk-quick">
              <span className="glyph" style={{ background: c.tint, color: "#fff" }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-callout" style={{ fontWeight: 600 }}>{c.label}</div>
                <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 1 }}>{c.sub}</div>
              </div>
              <Icons.chevR size={12} stroke={2.4} style={{ color: "var(--label-tertiary)", flexShrink: 0 }}/>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="acls-card-lg">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", whiteSpace: "nowrap" }}>ALGORITMA UTAMA</div>
              <div className="t-title-3" style={{ marginTop: 2 }}>Adult Cardiac Arrest</div>
            </div>
            <button onClick={() => onPick("algo", "arrest")} style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Lihat lengkap →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ACLS_FLOW_ARREST.slice(0, 5).map((s, i) => (
              <React.Fragment key={i}>
                <div className="acls-flow-mini">
                  <span className="num">{i + 1}</span>
                  <div>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{s.title}</div>
                    {s.sub && <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>{s.sub}</div>}
                  </div>
                </div>
                {i < 4 && <div style={{ marginLeft: 17, height: 12, borderLeft: "2px dashed var(--separator)" }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="acls-card-lg">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", whiteSpace: "nowrap" }}>OBAT CODE BLUE</div>
              <div className="t-title-3" style={{ marginTop: 2 }}>Referensi cepat</div>
            </div>
            <button onClick={() => onPick("drugs")} style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Semua obat →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACLS_DRUGS.slice(0, 4).map(d => (
              <button key={d.key} onClick={() => onPick("drugs", d.key)} className="acls-drug-mini">
                <span className="glyph" style={{ background: d.tint }}><Icons.pill size={14} stroke={2}/></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>{d.dose}</div>
                </div>
                <Icons.chevR size={12} stroke={2.4} style={{ color: "var(--label-tertiary)" }}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }} className="acls-card-lg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", whiteSpace: "nowrap" }}>PUSTAKA IRAMA</div>
            <div className="t-title-3" style={{ marginTop: 2 }}>Kenali sekilas</div>
          </div>
          <button onClick={() => onPick("ekg")} style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Pustaka EKG →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {ACLS_RHYTHMS.slice(0, 4).map(r => (
            <button key={r.key} onClick={() => onPick("ekg", r.key)} className="acls-ekg-mini">
              <RhythmStrip kind={r.key} width={220} height={48} color={r.tint}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <div className="t-callout" style={{ fontWeight: 600 }}>{r.short}</div>
                <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>{r.severity}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: "10px 16px", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div className="t-caption-2" style={{ color: "var(--label-tertiary)" }}>ACLS Helper · v1.1 · Bagian dari ekosistem MDKit · penilaian klinis tetap diperlukan.</div>
        <div className="t-caption-2" style={{ color: "var(--label-tertiary)" }}>Sumber: PERKI 2021 + AHA 2025 · terakhir diperbarui 2026-05</div>
      </div>
    </div>
  );
}

/* ============================================================
   Algorithm — split panel
   ============================================================ */
export function DesktopAlgorithm({ id, onPick }) {
  const algo = ACLS_ALGORITHMS.find(a => a.key === id) || ACLS_ALGORITHMS[0];
  const flow =
    id === "brady"       ? ACLS_FLOW_BRADY :
    id === "tachy"       ? ACLS_FLOW_TACHY :
    id === "bhjd"        ? ACLS_FLOW_BHJD :
    id === "ska"         ? ACLS_FLOW_SKA :
    id === "rosc"        ? ACLS_FLOW_ROSC :
    id === "opioid"      ? ACLS_FLOW_OPIOID :
    id === "anaphylaxis" ? ACLS_FLOW_ANAPHYLAXIS :
    id === "pregnancy"   ? ACLS_FLOW_PREGNANCY :
    id === "drowning"    ? ACLS_FLOW_DROWNING :
    id === "hypothermia" ? ACLS_FLOW_HYPOTHERMIA :
    ACLS_FLOW_ARREST;
  const [selected, setSelected] = useState(0);
  useEffect(() => { setSelected(0); }, [id]);
  const step = flow[selected];
  const TONE_MAP = { action: "var(--accent)", shock: "var(--danger)", drug: "var(--tint-drug)", note: "var(--tint-theory)", outcome: "var(--success)", decision: "var(--warning)" };
  const currentTone = step ? (TONE_MAP[step.kind] || "var(--accent)") : "var(--accent)";

  const activeRef = useRef(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [selected]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, flow.length - 1));
      if (e.key === 'ArrowUp')   setSelected(s => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flow.length]);

  const relatedDrug = useMemo(() => {
    if (!step) return null;
    const txt = (step.title || "").toLowerCase();
    return ACLS_DRUGS.find(d => txt.includes(d.name.toLowerCase().split(" ")[0]));
  }, [selected, id]);

  const [algoQ, setAlgoQ] = useState('');
  const filteredAlgos = useMemo(() => {
    const q = algoQ.trim().toLowerCase();
    return q
      ? ACLS_ALGORITHMS.filter(a => (a.label + ' ' + (a.sub || '')).toLowerCase().includes(q))
      : ACLS_ALGORITHMS;
  }, [algoQ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={id ? ['Algoritma', algo.label] : ['Algoritma']}/>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", flex: 1, overflow: "hidden" }}>

        {/* LEFT: algo list */}
        <div style={{ borderRight: "0.5px solid var(--separator-opaque)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
            <div className="acls-sidebar-search" style={{ margin: 0 }}>
              <Icons.search size={13} stroke={2}/>
              <input value={algoQ} onChange={e => setAlgoQ(e.target.value)} placeholder="Cari algoritma…"
                style={{ flex: 1, background: 'none', border: 0, outline: 'none',
                  color: 'var(--label-primary)', fontSize: 13, fontFamily: 'inherit' }}/>
              {algoQ && <button onClick={() => setAlgoQ('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0,
                  color: 'var(--label-tertiary)', display: 'flex' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>}
            </div>
          </div>
          <div style={{ overflowY: "auto", padding: "0 12px 16px", flex: 1 }}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "0 6px 8px" }}>
              ALGORITMA · {filteredAlgos.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filteredAlgos.length === 0
                ? <div style={{ padding: '8px 6px', color: 'var(--label-tertiary)', fontSize: 13 }}>Tidak ditemukan</div>
                : filteredAlgos.map(a => (
                <button key={a.key} onClick={() => onPick('algo', a.key)}
                  className={"acls-list-item " + (id === a.key ? "active" : "")}>
                  <span style={{ width: 6, height: 30, borderRadius: 3, background: a.tint, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{a.label}</div>
                    <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: flow view or placeholder */}
        {!id ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, color: "var(--label-tertiary)" }}>
            <Icons.algo size={48} stroke={1} style={{ opacity: 0.25 }}/>
            <div className="t-callout">Pilih algoritma dari daftar</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", overflow: "hidden" }}>
            <div style={{ overflowY: "auto", padding: "20px 24px 40px", borderRight: "0.5px solid var(--separator-opaque)" }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>ALUR ALGORITMA</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <h2 className="t-title-1" style={{ margin: "4px 0 4px" }}>{algo.label}</h2>
                <span className="ios-tag" style={{ background: algo.tint + "1F", color: algo.tint, textTransform: "uppercase" }}>{algo.tag}</span>
              </div>
              <div className="t-footnote" style={{ color: "var(--label-secondary)", marginBottom: 16 }}>{algo.sub} · sumber: {algo.source || "AHA 2025"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {flow.map((s, i) => {
                  const active = selected === i;
                  const tone = TONE_MAP[s.kind] || "var(--accent)";
                  const connColor = i < selected ? "var(--accent)" : (i === selected ? tone : "var(--separator)");
                  return (
                    <React.Fragment key={i}>
                      <button ref={active ? activeRef : null}
                        onClick={() => setSelected(i)} className={"acls-desk-flowstep" + (active ? " active" : "")}
                        style={{ background: active ? tone + "14" : "var(--bg-tertiary)", boxShadow: active ? "inset 0 0 0 1px " + tone : "var(--shadow-1)" }}>
                        <span className="kind" style={{ background: tone + "1F", color: tone }}>{s.kind === "decision" ? "?" : s.kind === "shock" ? "⚡" : i + 1}</span>
                        <div style={{ textAlign: "left", flex: 1 }}>
                          <div className="t-callout" style={{ fontWeight: 600 }}>{s.title}</div>
                          {s.sub && <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>{s.sub}</div>}
                          {s.kind === "decision" && <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 4 }}>{s.q}</div>}
                        </div>
                      </button>
                      {i < flow.length - 1 && <div style={{ marginLeft: 20, height: 16, borderLeft: "2px dashed " + connColor, transition: "border-color 200ms" }}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: "20px 24px 40px", background: "var(--bg-secondary)" }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>LANGKAH {selected + 1} DARI {flow.length}</div>
                <div className="t-caption-2" style={{ color: currentTone, fontWeight: 700 }}>{step.kind?.toUpperCase()}</div>
              </div>
              <div style={{ height: 3, background: 'var(--fill-secondary)', borderRadius: 2, margin: '6px 0 14px' }}>
                <div style={{ width: ((selected + 1) / flow.length * 100) + '%', height: '100%',
                  background: currentTone, borderRadius: 2, transition: 'width 300ms var(--ease-out)' }}/>
              </div>
              <h3 className="t-title-2" style={{ margin: "0 0 6px" }}>{step.title}</h3>
              {step.sub && <div className="t-callout" style={{ color: "var(--label-primary)" }}>{step.sub}</div>}
              {step.kind === "decision" && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => {
                      const target = step.yes?.targetIndex ?? Math.min(selected + 1, flow.length - 1);
                      setSelected(target);
                    }}
                    style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,59,48,0.10)",
                      boxShadow: "inset 0 0 0 0.5px " + step.yes.tint + "55", border: 0, cursor: "pointer",
                      textAlign: "left", transition: "opacity 150ms" }}
                  >
                    <div className="t-caption-2" style={{ color: step.yes.tint, fontWeight: 700 }}>YES →</div>
                    <div className="t-headline" style={{ color: step.yes.tint, marginTop: 4 }}>{step.yes.label}</div>
                  </button>
                  <button
                    onClick={() => {
                      const target = step.no?.targetIndex ?? Math.min(selected + 2, flow.length - 1);
                      setSelected(target);
                    }}
                    style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,122,255,0.08)",
                      boxShadow: "inset 0 0 0 0.5px " + step.no.tint + "55", border: 0, cursor: "pointer",
                      textAlign: "left", transition: "opacity 150ms" }}
                  >
                    <div className="t-caption-2" style={{ color: step.no.tint, fontWeight: 700 }}>NO →</div>
                    <div className="t-headline" style={{ color: step.no.tint, marginTop: 4 }}>{step.no.label}</div>
                  </button>
                </div>
              )}
              {step.pearls && (
                <div style={{ marginTop: 14 }}>
                  <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>CATATAN KLINIS</div>
                  <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 12, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", lineHeight: 1.5 }} className="t-footnote">{step.pearls}</div>
                </div>
              )}
              {relatedDrug && (
                <div style={{ marginTop: 18 }}>
                  <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>OBAT TERKAIT</div>
                  <button onClick={() => onPick("drugs", relatedDrug.key)} className="acls-card-lg" style={{ marginTop: 4, textAlign: "left", width: "100%", border: 0, cursor: "pointer", display: "block" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: relatedDrug.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.pill size={18} stroke={2}/></span>
                      <div style={{ flex: 1 }}>
                        <div className="t-headline">{relatedDrug.name}</div>
                        <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>{relatedDrug.class}</div>
                      </div>
                      <Icons.chevR size={14} stroke={2.4} style={{ color: "var(--label-tertiary)" }}/>
                    </div>
                    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "linear-gradient(180deg, " + relatedDrug.tint + "10, " + relatedDrug.tint + "04)" }}>
                      <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DOSIS</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: relatedDrug.tint, marginTop: 2 }}>{relatedDrug.dose}</div>
                      <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 8 }}>PENGULANGAN</div>
                      <div className="t-footnote">{relatedDrug.repeat}</div>
                    </div>
                  </button>
                </div>
              )}
              <div style={{ marginTop: 18 }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DIFERENSIAL</div>
                <button onClick={() => onPick("hsts")} className="acls-card-lg" style={{ marginTop: 4, textAlign: "left", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%", border: 0 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--tint-theory)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.clipboard size={18} stroke={2}/></span>
                  <div style={{ flex: 1 }}>
                    <div className="t-headline">Hs &amp; Ts — Penyebab reversibel</div>
                    <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>10 mnemonic penyebab · cari sistematis</div>
                  </div>
                  <Icons.chevR size={14} stroke={2.4} style={{ color: "var(--label-tertiary)" }}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Drugs — split panel
   ============================================================ */
export function DesktopDrugs({ initialId, onPick }) {
  const [selectedKey, setSelectedKey] = useState(initialId || ACLS_DRUGS[0].key);
  const [drugQ, setDrugQ] = useState('');
  const d = ACLS_DRUGS.find(x => x.key === selectedKey) || ACLS_DRUGS[0];
  const filteredDrugs = drugQ.trim()
    ? ACLS_DRUGS.filter(it => it.name.toLowerCase().includes(drugQ.toLowerCase()) || (it.class || '').toLowerCase().includes(drugQ.toLowerCase()))
    : ACLS_DRUGS;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Obat']}/>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, overflow: "hidden" }}>
      <div style={{ borderRight: "0.5px solid var(--separator-opaque)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <div className="acls-sidebar-search" style={{ margin: 0 }}>
            <Icons.search size={13} stroke={2}/>
            <input value={drugQ} onChange={e => setDrugQ(e.target.value)} placeholder="Cari obat…"
              style={{ flex: 1, background: 'none', border: 0, outline: 'none',
                color: 'var(--label-primary)', fontSize: 13, fontFamily: 'inherit' }}/>
            {drugQ && <button onClick={() => setDrugQ('')}
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'var(--label-tertiary)', display: 'flex' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "0 12px 16px", flex: 1 }}>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "0 6px 8px" }}>OBAT ACLS · {filteredDrugs.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredDrugs.length === 0
              ? <div style={{ padding: '8px 6px', color: 'var(--label-tertiary)', fontSize: 13 }}>Tidak ditemukan</div>
              : filteredDrugs.map(it => (
              <button key={it.key} onClick={() => setSelectedKey(it.key)} className={"acls-list-item " + (selectedKey === it.key ? "active" : "")}>
                <span style={{ width: 6, height: 30, borderRadius: 3, background: it.tint, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div className="t-callout" style={{ fontWeight: 600 }}>{it.name}</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)" }}>{it.class}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ overflowY: "auto", padding: "20px 28px 40px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: d.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px " + d.tint + "33" }}>
            <Icons.pill size={34} stroke={2}/>
          </div>
          <div>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>REFERENSI OBAT</div>
            <h2 className="t-title-1" style={{ margin: "2px 0 2px" }}>{d.name}</h2>
            <div className="t-callout" style={{ color: "var(--label-secondary)" }}>{d.class}</div>
          </div>
        </div>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="acls-card-lg">
            <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>INDIKASI</div>
            <div className="t-body" style={{ marginTop: 4, lineHeight: 1.45 }}>{d.indication}</div>
          </div>
          <div className="acls-card-lg" style={{ background: "linear-gradient(180deg, " + d.tint + "12, " + d.tint + "04)" }}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DOSIS</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: d.tint, marginTop: 6 }}>{d.dose}</div>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 14 }}>PENGULANGAN</div>
            <div className="t-callout" style={{ marginTop: 2 }}>{d.repeat}</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }} className="acls-card-lg">
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>PERSIAPAN</div>
          <div className="t-body" style={{ marginTop: 4, lineHeight: 1.45 }}>{d.prep}</div>
        </div>
        <div style={{ marginTop: 14 }} className="acls-card-lg">
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>CATATAN KLINIS</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {d.pearls.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: d.tint + "22", color: d.tint, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{i + 1}</span>
                <span className="t-footnote" style={{ flex: 1, lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(255,149,0,0.10)", boxShadow: "inset 0 0 0 0.5px rgba(255,149,0,0.30)" }}>
          <div className="t-caption-2" style={{ color: "var(--warning)", fontWeight: 700 }}>KONTRAINDIKASI &amp; PERHATIAN</div>
          <div className="t-footnote" style={{ marginTop: 4, lineHeight: 1.5 }}>{d.contra}</div>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ============================================================
   ECG Library
   ============================================================ */
const EKG_SEVERITY_LABELS = { shockable: 'Shockable', 'non-shockable': 'Non-shock', stable: 'Stabil', unstable: 'Tdk stabil', critical: 'Kritis', normal: 'Normal' };
const D_MORPH_FIELDS = [
  { key: 'rate',        label: 'Rate' },
  { key: 'rhythm',      label: 'Irama' },
  { key: 'pWave',       label: 'Gel. P' },
  { key: 'prInterval',  label: 'Interval PR' },
  { key: 'qrsDuration', label: 'Durasi QRS' },
  { key: 'stT',         label: 'ST / T' },
];

export function DesktopEkg({ initialId, onPick }) {
  const [selectedKey, setSelectedKey] = useState(initialId || ACLS_RHYTHMS[0].key);
  const [ekgFilter, setEkgFilter] = useState('all');
  const r = ACLS_RHYTHMS.find(x => x.key === selectedKey) || ACLS_RHYTHMS[0];
  const filteredRhythms = ekgFilter === 'all' ? ACLS_RHYTHMS : ACLS_RHYTHMS.filter(it => it.severity === ekgFilter);
  const allSeverities = [...new Set(ACLS_RHYTHMS.map(r => r.severity))];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Pustaka EKG']}/>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, overflow: "hidden" }}>
      <div style={{ borderRight: "0.5px solid var(--separator-opaque)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 12px 8px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {['all', ...allSeverities].map(f => (
              <button key={f} onClick={() => setEkgFilter(f)}
                className={`ios-btn sm pill${ekgFilter === f ? ' active' : ''}`}
                style={{ fontSize: 11, height: 26, padding: '0 9px' }}>
                {f === 'all' ? 'Semua' : (EKG_SEVERITY_LABELS[f] || f)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "0 12px 16px", flex: 1 }}>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "0 6px 8px" }}>IRAMA · {filteredRhythms.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredRhythms.map(it => (
              <button key={it.key} onClick={() => setSelectedKey(it.key)} className={"acls-list-item " + (selectedKey === it.key ? "active" : "")}
                style={{ flexDirection: "column", alignItems: "stretch", padding: 8, gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="t-callout" style={{ fontWeight: 600 }}>{it.short}</span>
                  <span className="ios-tag" style={{ background: it.tint + "22", color: it.tint, textTransform: "uppercase" }}>{it.severity}</span>
                </div>
                <RhythmStrip kind={it.key} width={260} height={30} color={it.tint} grid={false}/>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ overflowY: "auto", padding: "20px 28px 40px" }}>
        <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>ANALISIS IRAMA</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
          <h2 className="t-title-1" style={{ margin: "2px 0 0" }}>{r.name}</h2>
          <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase", flexShrink: 0, marginLeft: 12 }}>
            {EKG_SEVERITY_LABELS[r.severity] || r.severity}
          </span>
        </div>

        <EkgImage rhythm={r} style={{ marginTop: 16, marginBottom: 20, minHeight: 100 }} />

        {(r.definition || r.features) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {r.definition && (
              <div className="acls-card-lg">
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 6 }}>DEFINISI</div>
                <div className="t-body" style={{ lineHeight: 1.5 }}>{r.definition}</div>
              </div>
            )}
            <div className="acls-card-lg">
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 6 }}>CIRI PENGENALAN</div>
              <div className="t-body" style={{ lineHeight: 1.45 }}>{r.features}</div>
            </div>
          </div>
        )}

        {D_MORPH_FIELDS.some(f => r.morphology?.[f.key]) && (
          <div style={{ marginBottom: 20 }}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 8 }}>MORFOLOGI EKG</div>
            <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {D_MORPH_FIELDS.filter(f => r.morphology?.[f.key]).map((f, i) => (
                  <div key={f.key} style={{ padding: "9px 14px", borderTop: i >= 2 ? "0.5px solid var(--separator)" : "none", borderRight: i % 2 === 0 ? "0.5px solid var(--separator)" : "none" }}>
                    <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 3 }}>{f.label}</div>
                    <div className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.4 }}>{r.morphology[f.key]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(r.criteria?.length > 0 || (r.management?.immediate?.length || r.management?.drugs?.length || r.management?.notes?.length)) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {r.criteria?.length > 0 && (
              <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden" }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "10px 14px 8px", borderBottom: "0.5px solid var(--separator)" }}>KRITERIA DIAGNOSTIK</div>
                {r.criteria.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                    <span style={{ color: r.tint, fontWeight: 700, flexShrink: 0, fontSize: 12, marginTop: 2 }}>✓</span>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
            {(r.management?.immediate?.length || r.management?.drugs?.length || r.management?.notes?.length) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {r.management.immediate?.length > 0 && (
                  <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden", background: r.tint + "08", boxShadow: "inset 0 0 0 0.5px " + r.tint + "33" }}>
                    <div className="t-caption-2" style={{ color: r.tint, fontWeight: 700, padding: "10px 14px 8px", borderBottom: "0.5px solid " + r.tint + "25" }}>TINDAKAN SEGERA</div>
                    {r.management.immediate.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid " + r.tint + "20" : "none", alignItems: "flex-start" }}>
                        <span className="t-caption-2" style={{ color: r.tint, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                        <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {r.management.drugs?.length > 0 && (
                  <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, padding: "10px 14px 8px", borderBottom: "0.5px solid var(--separator)" }}>OBAT-OBATAN</div>
                    {r.management.drugs.map((drug, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                        <span className="t-footnote" style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>💊</span>
                        <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{drug}</span>
                      </div>
                    ))}
                  </div>
                )}
                {r.management.notes?.length > 0 && (
                  <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, padding: "10px 14px 8px", borderBottom: "0.5px solid var(--separator)" }}>CATATAN KLINIS</div>
                    {r.management.notes.map((note, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                        <span className="t-footnote" style={{ color: "var(--label-tertiary)", flexShrink: 0, marginTop: 1 }}>•</span>
                        <span className="t-footnote" style={{ color: "var(--label-secondary)", lineHeight: 1.45 }}>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(r.ddx?.length > 0 || r.pitfalls?.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {r.ddx?.length > 0 && (
              <div className="acls-card-lg" style={{ padding: 0, overflow: "hidden" }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "10px 14px 8px", borderBottom: "0.5px solid var(--separator)" }}>DIAGNOSIS BANDING</div>
                {r.ddx.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--label-tertiary)", flexShrink: 0, fontSize: 13, marginTop: 2 }}>↔</span>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
            {r.pitfalls?.length > 0 && (
              <div style={{ background: "rgba(255,196,0,0.10)", borderRadius: 12, border: "0.5px solid rgba(255,196,0,0.45)", overflow: "hidden" }}>
                <div className="t-caption-2" style={{ color: "#b38600", fontWeight: 700, padding: "10px 14px 8px", borderBottom: "0.5px solid rgba(255,196,0,0.3)" }}>⚠️ PITFALLS &amp; PEARLS</div>
                {r.pitfalls.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 14px", borderTop: i > 0 ? "0.5px solid rgba(255,196,0,0.2)" : "none", alignItems: "flex-start" }}>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {r.references?.length > 0 && (
          <div>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 8 }}>REFERENSI</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {r.references.map((ref, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--label-tertiary)", lineHeight: 1.5, paddingLeft: 10, borderLeft: "2px solid var(--fill-secondary)" }}>
                  {ref.url
                    ? <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{ref.text}</a>
                    : ref.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/* ============================================================
   Hs & Ts
   ============================================================ */
export function DesktopHsTs({ onPick }) {
  const [exp, setExp] = useState(new Set());
  const toggle = (key) => setExp(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Hs & Ts']}/>
      <div style={{ padding: "20px 28px 40px", overflowY: "auto", flex: 1 }}>
      <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DIFERENSIAL</div>
      <h2 className="t-title-1" style={{ margin: "2px 0 6px" }}>Hs &amp; Ts — Penyebab reversibel</h2>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div className="t-callout" style={{ color: "var(--label-secondary)" }}>Ketuk untuk melihat clue klinis + tatalaksana. Cari sistematis tiap rhythm check.</div>
        {exp.size > 0 && <button onClick={() => setExp(new Set())}
          style={{ fontSize: 12, color: "var(--accent)", background: "none", border: 0, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
          Tutup semua
        </button>}
      </div>
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {["H","T"].map(g => (
          <div key={g}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 8 }}>{g === "H" ? "5 H's" : "5 T's"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACLS_HS_TS.filter(x => x.group === g).map(c => {
                const open = exp.has(c.key);
                return (
                  <button key={c.key} onClick={() => toggle(c.key)} className="acls-card-lg"
                    style={{ textAlign: "left", border: open ? "1px solid " + c.tint + "44" : "1px solid transparent",
                      cursor: "pointer", width: "100%", padding: "14px 16px",
                      background: open ? c.tint + "08" : "var(--bg-tertiary)", transition: "background 150ms, border-color 150ms" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: c.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{g}</span>
                      <div className="t-headline" style={{ flex: 1 }}>{c.name}</div>
                      <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform var(--dur-fast)", color: open ? c.tint : "var(--label-tertiary)" }}><Icons.chevDown size={16} stroke={2}/></span>
                    </div>
                    {open && (
                      <div style={{ marginTop: 10, paddingLeft: 40, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div className="t-footnote" style={{ color: "var(--label-secondary)", lineHeight: 1.5 }}><strong style={{ color: "var(--label-primary)" }}>Clue: </strong>{c.clue}</div>
                        <div className="t-footnote" style={{ color: "var(--label-secondary)", lineHeight: 1.5 }}><strong style={{ color: c.tint }}>Rx: </strong>{c.rx}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}