import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../components/base';
import { RhythmStrip } from '../../components/acls';
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
export function DesktopSidebar({ active, onChange, onOpenCpr, collapsed = false, onToggleCollapse }) {
  const items = [
    { key: "dashboard", label: "Beranda",     desc: "Ikhtisar & akses cepat",  icon: Icons.house },
    { key: "algo",      label: "Algoritma",   desc: "14 protokol ACLS",        icon: Icons.algo },
    { key: "drugs",     label: "Obat",        desc: "25 obat emergensi",       icon: Icons.pill },
    { key: "ekg",       label: "Pustaka EKG", desc: "16 ritme kardiologi",     icon: Icons.ekg },
    { key: "hsts",      label: "Hs & Ts",     desc: "10 penyebab reversibel",  icon: Icons.clipboard },
  ];
  return (
    <aside className={collapsed ? 'acls-sidebar acls-sidebar--collapsed' : 'acls-sidebar'}>
      <div className="acls-sidebar-brand"
        style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0 12px' : '0 12px 0 14px', height: 52 }}>
        {!collapsed && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--danger), #c81e10)',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(255,59,48,0.25)', flexShrink: 0 }}>
              <Icons.boltFill size={18}/>
            </div>
            <div>
              <div className="t-headline" style={{ lineHeight: 1.1 }}>ACLS Helper</div>
              <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>MDKit · v1.1</div>
            </div>
          </div>
        )}
        <button onClick={onToggleCollapse}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--fill-tertiary)',
            border: 0, cursor: 'pointer', color: 'var(--label-secondary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {collapsed
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </button>
      </div>

      {!collapsed && (
        <div className="acls-sidebar-search">
          <Icons.search size={14} stroke={2}/><span className="t-footnote">Cari…</span><kbd>⌘K</kbd>
        </div>
      )}

      <nav className="acls-sidebar-nav">
        {!collapsed && <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "10px 18px 4px" }}>MENU</div>}
        {items.map(it => (
          <button key={it.key} onClick={() => onChange(it.key)}
            className={"acls-sidebar-item " + (active === it.key ? "active" : "")}
            style={{ justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? '10px' : undefined }}
            title={collapsed ? it.label : undefined}>
            <it.icon size={18} stroke={1.9}/>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span style={{ lineHeight: 1.3 }}>{it.label}</span>
                <span className="t-caption-2" style={{ color: 'var(--label-secondary)', fontWeight: 400,
                  textTransform: 'none', letterSpacing: 0, lineHeight: 1.2 }}>{it.desc}</span>
              </div>
            )}
          </button>
        ))}

        {!collapsed && (
          <>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "14px 18px 4px" }}>AKSES CEPAT</div>
            {[
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
            ].map(it => (
              <button key={it.key} onClick={() => onChange("algo", it.key)} className="acls-sidebar-item">
                <span style={{ width: 8, height: 8, borderRadius: 4, background: it.tint, marginLeft: 5, marginRight: 5, flexShrink: 0 }}/>
                <span>{it.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div style={{ padding: collapsed ? '10px 8px 16px' : '10px 14px 16px', marginTop: 'auto' }}>
        <button onClick={onOpenCpr} className="ios-btn block"
          style={{ background: "var(--danger)", color: "#fff", height: collapsed ? 40 : 46,
            borderRadius: 12, fontSize: 15, fontWeight: 700, display: "flex", gap: collapsed ? 0 : 8,
            whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(255,59,48,0.25)",
            justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Icons.boltFill size={18}/>
          {!collapsed && ' Code Blue'}
        </button>
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
  return (
    <div style={{ padding: "20px 28px 40px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 28, animation: 'acls-fadeslide 360ms var(--ease-out) both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,59,48,0.10)', borderRadius: 20, padding: '4px 12px', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)',
            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your daily Cardiac Problem Companion
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ animation: 'acls-fadeslide 400ms 40ms var(--ease-out) both' }}>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.0,
              letterSpacing: '-0.03em', marginBottom: 10 }}>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, flexShrink: 0,
            animation: 'acls-fadeslide 400ms 80ms var(--ease-out) both' }}>
            {[
              { value: '14',   label: 'Algoritma',  color: 'var(--danger)' },
              { value: '25',   label: 'Obat',       color: 'var(--warning)' },
              { value: '16',   label: 'EKG Rhythm', color: 'var(--info)' },
              { value: '2025', label: 'Panduan',    color: 'var(--success)' },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ background: 'var(--fill-secondary)',
                borderRadius: 14, padding: '12px 16px', minWidth: 110,
                transition: 'transform 160ms', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DesktopTopbar crumb={['Beranda']}/>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 14,
        animation: 'acls-fadeslide 400ms 120ms var(--ease-out) both' }}>
        <button onClick={onOpenCpr}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '22px 16px',
            background: 'linear-gradient(135deg, var(--danger), #c81e10)', color: '#fff',
            borderRadius: 16, border: 0, cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(255,59,48,0.30)',
            animation: 'acls-fab-ring 2.5s 1.5s infinite',
            transition: 'transform 160ms' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
          <Icons.boltFill size={28}/>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Code Blue</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>CPR Workspace</div>
          </div>
        </button>
        {[
          { key: "vfvt",  label: "VF / pVT",       sub: "Jalur shockable rhythm",  tint: "var(--danger)",     icon: <Icons.boltFill size={22}/> },
          { key: "pea",   label: "PEA / Asystole", sub: "Non-shockable rhythm",    tint: "var(--info)",       icon: <Icons.flatline size={22} stroke={2.2}/> },
          { key: "brady", label: "Bradikardi",     sub: "HR < 50 · simptomatik",   tint: "var(--warning)",    icon: <Icons.slow size={22} stroke={2.2}/> },
          { key: "tachy", label: "Takikardi",      sub: "HR > 150 · dengan nadi",  tint: "var(--tint-neuro)", icon: <Icons.fast size={22} stroke={2.2}/> },
        ].map(c => (
          <button key={c.key} onClick={() => onPick("algo", c.key)} className="acls-desk-quick">
            <span className="glyph" style={{ background: c.tint, color: "#fff" }}>{c.icon}</span>
            <div className="t-headline">{c.label}</div>
            <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{c.sub}</div>
            <span className="t-caption-2" style={{ color: c.tint, marginTop: 14, fontWeight: 600 }}>Buka algoritma →</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
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
        <div className="t-caption-2" style={{ color: "var(--label-tertiary)" }}>Sumber: PERKI 2025 + AHA 2025 · terakhir diperbarui 2026-05</div>
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

  const relatedDrug = useMemo(() => {
    if (!step) return null;
    const txt = (step.title || "").toLowerCase();
    return ACLS_DRUGS.find(d => txt.includes(d.name.toLowerCase().split(" ")[0]));
  }, [selected, id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Algoritma', algo.label]}/>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", flex: 1, overflow: "hidden" }}>
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
            const tone = { action: "var(--accent)", shock: "var(--danger)", drug: "var(--tint-drug)", note: "var(--tint-theory)", outcome: "var(--success)", decision: "var(--warning)" }[s.kind] || "var(--accent)";
            return (
              <React.Fragment key={i}>
                <button onClick={() => setSelected(i)} className={"acls-desk-flowstep" + (active ? " active" : "")}
                  style={{ background: active ? tone + "14" : "var(--bg-tertiary)", boxShadow: active ? "inset 0 0 0 1px " + tone : "var(--shadow-1)" }}>
                  <span className="kind" style={{ background: tone + "1F", color: tone }}>{s.kind === "decision" ? "?" : s.kind === "shock" ? "⚡" : i + 1}</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div className="t-callout" style={{ fontWeight: 600 }}>{s.title}</div>
                    {s.sub && <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>{s.sub}</div>}
                    {s.kind === "decision" && <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 4 }}>{s.q}</div>}
                  </div>
                </button>
                {i < flow.length - 1 && <div style={{ marginLeft: 20, height: 16, borderLeft: "2px dashed " + (selected === i || selected === i + 1 ? tone : "var(--separator)") }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ overflowY: "auto", padding: "20px 24px 40px", background: "var(--bg-secondary)" }}>
        <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>LANGKAH {selected + 1} DARI {flow.length}</div>
        <h3 className="t-title-2" style={{ margin: "4px 0 6px" }}>{step.title}</h3>
        {step.sub && <div className="t-callout" style={{ color: "var(--label-primary)" }}>{step.sub}</div>}
        {step.kind === "decision" && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,59,48,0.10)", boxShadow: "inset 0 0 0 0.5px " + step.yes.tint + "55" }}>
              <div className="t-caption-2" style={{ color: step.yes.tint, fontWeight: 700 }}>YES</div>
              <div className="t-headline" style={{ color: step.yes.tint, marginTop: 4 }}>{step.yes.label}</div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,122,255,0.08)", boxShadow: "inset 0 0 0 0.5px " + step.no.tint + "55" }}>
              <div className="t-caption-2" style={{ color: step.no.tint, fontWeight: 700 }}>NO</div>
              <div className="t-headline" style={{ color: step.no.tint, marginTop: 4 }}>{step.no.label}</div>
            </div>
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
    </div>
  );
}

/* ============================================================
   Drugs — split panel
   ============================================================ */
export function DesktopDrugs({ initialId, onPick }) {
  const [selectedKey, setSelectedKey] = useState(initialId || ACLS_DRUGS[0].key);
  const d = ACLS_DRUGS.find(x => x.key === selectedKey) || ACLS_DRUGS[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Obat']}/>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, overflow: "hidden" }}>
      <div style={{ borderRight: "0.5px solid var(--separator-opaque)", overflowY: "auto", padding: "16px 12px" }}>
        <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "0 6px 8px" }}>OBAT ACLS · {ACLS_DRUGS.length}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ACLS_DRUGS.map(it => (
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
export function DesktopEkg({ initialId, onPick }) {
  const [selectedKey, setSelectedKey] = useState(initialId || ACLS_RHYTHMS[0].key);
  const r = ACLS_RHYTHMS.find(x => x.key === selectedKey) || ACLS_RHYTHMS[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Pustaka EKG']}/>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, overflow: "hidden" }}>
      <div style={{ borderRight: "0.5px solid var(--separator-opaque)", overflowY: "auto", padding: "16px 12px" }}>
        <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "0 6px 8px" }}>IRAMA · {ACLS_RHYTHMS.length}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ACLS_RHYTHMS.map(it => (
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
      <div style={{ overflowY: "auto", padding: "20px 28px 40px" }}>
        <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>ANALISIS IRAMA</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h2 className="t-title-1" style={{ margin: "2px 0 6px" }}>{r.name}</h2>
          <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>{r.severity}</span>
        </div>
        <div style={{ marginTop: 18, padding: 14, background: "var(--bg-tertiary)", borderRadius: 16, boxShadow: "var(--shadow-1)" }}>
          <RhythmStrip kind={r.key} width={640} height={200} color={r.tint}/>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", textAlign: "right", marginTop: 6 }}>Lead II · 25 mm/s · 10 mm/mV</div>
        </div>
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="acls-card-lg">
            <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>PENGENALAN</div>
            <div className="t-body" style={{ marginTop: 6, lineHeight: 1.45 }}>{r.features}</div>
          </div>
          <div className="acls-card-lg" style={{ background: "linear-gradient(180deg, " + r.tint + "12, " + r.tint + "04)", boxShadow: "inset 0 0 0 0.5px " + r.tint + "33" }}>
            <div className="t-caption-2" style={{ color: r.tint, fontWeight: 700 }}>TINDAKAN</div>
            <div className="t-body" style={{ marginTop: 6, lineHeight: 1.45 }}>{r.action}</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ============================================================
   Hs & Ts
   ============================================================ */
export function DesktopHsTs({ onPick }) {
  const [exp, setExp] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DesktopTopbar crumb={['Hs & Ts']}/>
      <div style={{ padding: "20px 28px 40px", overflowY: "auto", flex: 1 }}>
      <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>DIFERENSIAL</div>
      <h2 className="t-title-1" style={{ margin: "2px 0 6px" }}>Hs &amp; Ts — Penyebab reversibel</h2>
      <div className="t-callout" style={{ color: "var(--label-secondary)" }}>Ketuk untuk melihat clue klinis + tatalaksana. Cari sistematis tiap rhythm check.</div>
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {["H","T"].map(g => (
          <div key={g}>
            <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginBottom: 8 }}>{g === "H" ? "5 H's" : "5 T's"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACLS_HS_TS.filter(x => x.group === g).map(c => {
                const open = exp === c.key;
                return (
                  <button key={c.key} onClick={() => setExp(open ? null : c.key)} className="acls-card-lg" style={{ textAlign: "left", border: 0, cursor: "pointer", width: "100%", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: c.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{g}</span>
                      <div className="t-headline" style={{ flex: 1 }}>{c.name}</div>
                      <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform var(--dur-fast)", color: "var(--label-tertiary)" }}><Icons.chevDown size={16} stroke={2}/></span>
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
