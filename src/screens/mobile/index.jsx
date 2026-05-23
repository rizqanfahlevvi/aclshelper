import React, { useState, useMemo } from 'react';
import {
  Icons, NavBar, LargeTitle, SearchField,
  SectionHeader, SectionFooter, List, Row, Pill, Alert,
} from '../../components/base';
import { RhythmStrip, FlowStep, FlowConnector, BottomSheet } from '../../components/acls';
import {
  ACLS_ALGORITHMS, ACLS_DRUGS, ACLS_RHYTHMS, ACLS_HS_TS,
  ACLS_QUICK_ACTIONS, ACLS_FLOW_ARREST, ACLS_FLOW_BRADY,
  ACLS_FLOW_TACHY, ACLS_FLOW_BHJD, ACLS_FLOW_SKA, ACLS_FLOW_ROSC,
} from '../../data';

/* ============================================================
   HOME
   ============================================================ */
export function MobileHome({ nav, openCPR }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...ACLS_ALGORITHMS.filter(a =>
        (a.label + ' ' + a.sub).toLowerCase().includes(q)
      ).map(a => ({ type: 'algo', key: a.key, label: a.label, sub: a.sub, tint: a.tint })),
      ...ACLS_DRUGS.filter(d =>
        (d.name + ' ' + (d.altName || '') + ' ' + (d.category || '')).toLowerCase().includes(q)
      ).map(d => ({ type: 'drug', key: d.key, label: d.name, sub: d.category || d.class, tint: d.tint })),
      ...ACLS_RHYTHMS.filter(r =>
        (r.name + ' ' + (r.short || '')).toLowerCase().includes(q)
      ).map(r => ({ type: 'rhythm', key: r.key, label: r.name, sub: r.short, tint: r.tint })),
    ].slice(0, 8);
  }, [query]);

  const iconFor = (type) => {
    if (type === 'algo') return <Icons.algo size={16} stroke={2.4}/>;
    if (type === 'drug') return <Icons.pill size={16} stroke={2.4}/>;
    return <Icons.ekg size={16} stroke={2.4}/>;
  };

  return (
    <>
      <NavBar/>
      <LargeTitle>ACLS Helper</LargeTitle>

      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Pill tone="teal">PERKI 2021</Pill>
        <Pill tone="gray">AHA 2020</Pill>
        <span className="t-footnote" style={{ color: "var(--label-secondary)", flex: 1, minWidth: 0 }}>
          Alat bantu kognitif bedside · bukan pengganti penilaian klinis
        </span>
      </div>

      <SearchField placeholder="Cari algoritma, obat, EKG…" value={query} onChange={setQuery}/>

      {query ? (
        <div style={{ padding: "8px 16px" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--label-secondary)" }}>
              <div className="t-headline" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
              <div className="t-footnote">Coba kata kunci lain</div>
            </div>
          ) : (
            <List>
              {results.map(r => (
                <Row key={r.type + r.key}
                  glyph={iconFor(r.type)} tint={r.tint}
                  label={r.label} sub={r.sub}
                  onClick={() => {
                    setQuery('');
                    if (r.type === 'algo') nav.push({ screen: 'algo', id: r.key });
                    else if (r.type === 'drug') nav.push({ screen: 'drug', id: r.key });
                    else nav.push({ screen: 'ekg', id: r.key });
                  }}
                />
              ))}
            </List>
          )}
        </div>
      ) : (
        <>
          <div style={{ padding: "0 16px 4px" }}>
            <button onClick={openCPR} className="acls-hero-emergency" style={{ width: "100%", textAlign: "left", padding: "16px 18px", borderRadius: 18, background: "linear-gradient(135deg, var(--danger), #c81e10)", color: "#fff", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 24px rgba(255,59,48,0.30)", transition: "transform 160ms, box-shadow 160ms" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(255,59,48,0.40)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,59,48,0.30)"; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.boltFill size={26}/>
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-headline" style={{ color: "#fff" }}>Aktifkan Code Blue</div>
                <div className="t-footnote" style={{ color: "rgba(255,255,255,0.85)", marginTop: 2 }}>Ketuk untuk masuk CPR Workspace · timer aktif</div>
              </div>
              <Icons.chevR size={16} stroke={2.4}/>
            </button>
          </div>

          <SectionHeader>Akses cepat</SectionHeader>
          <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "vfvt",  label: "VF / pVT",       sub: "Shockable",     tint: "var(--danger)",     icon: <Icons.boltFill size={22}/> },
              { key: "pea",   label: "PEA / Asystole", sub: "Non-shockable", tint: "var(--info)",       icon: <Icons.flatline size={22} stroke={2.2}/> },
              { key: "brady", label: "Bradikardi",     sub: "HR < 50",       tint: "var(--warning)",    icon: <Icons.slow size={22} stroke={2.2}/> },
              { key: "tachy", label: "Takikardi",      sub: "HR > 150",      tint: "var(--tint-neuro)", icon: <Icons.fast size={22} stroke={2.2}/> },
            ].map(c => (
              <button key={c.key} onClick={() => nav.push({ screen: "algo", id: c.key })}
                style={{ padding: "14px", borderRadius: 16, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", display: "flex", flexDirection: "column", gap: 10, minHeight: 100, transition: "transform 160ms, box-shadow 160ms" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
                <div>
                  <div className="t-headline">{c.label}</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{c.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <SectionHeader>Algoritma</SectionHeader>
          <List>
            {ACLS_ALGORITHMS.slice(0, 6).map(a => (
              <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
            ))}
          </List>

          <SectionHeader>Alat</SectionHeader>
          <List>
            <Row glyph={<Icons.timer size={16} stroke={2.4}/>} tint="var(--success)" label="CPR Workspace" sub="Resusitasi aktif · siklus 2 menit" onClick={openCPR}/>
            <Row glyph={<Icons.ekg size={16} stroke={2.4}/>} tint="var(--tint-resp)" label="Pustaka EKG" sub="VF · VT · TdP · SVT · STEMI" onClick={() => nav.push({ screen: "ekgList" })}/>
            <Row glyph={<Icons.pill size={16} stroke={2.4}/>} tint="var(--tint-drug)" label="Obat ACLS" sub="18 obat · PERKI 2021" onClick={() => nav.push({ screen: "drugList" })}/>
            <Row glyph={<Icons.clipboard size={16} stroke={2.4}/>} tint="var(--tint-theory)" label="Hs &amp; Ts" sub="10 penyebab reversibel" onClick={() => nav.push({ screen: "hsts" })}/>
          </List>

          <SectionFooter>
            ACLS Helper · v1.1 · 2026 · Bagian dari ekosistem MDKit<br/>
            Mengikuti PERKI 2021 (BHJL &amp; BHJD) + AHA 2020 — penilaian klinis tetap diperlukan.
          </SectionFooter>
          <div style={{ height: 24 }}/>
        </>
      )}
    </>
  );
}

/* ============================================================
   ALGORITHM LIST
   ============================================================ */
export function MobileAlgoList({ nav }) {
  return (
    <>
      <NavBar right={<button className="nb-btn glyph"><Icons.search size={18} stroke={2}/></button>}/>
      <LargeTitle>Algoritma</LargeTitle>
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Pill tone="red">Code Blue</Pill><Pill tone="blue">Non-shockable</Pill>
        <Pill tone="orange">Bradikardi</Pill><Pill tone="purple">Takikardi</Pill>
      </div>
      <SectionHeader>Algoritma utama</SectionHeader>
      <List>
        {ACLS_ALGORITHMS.filter(a => ["bhjd","arrest","vfvt","pea"].includes(a.key)).map(a => (
          <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
        ))}
      </List>
      <SectionHeader>Peri-arrest</SectionHeader>
      <List>
        {ACLS_ALGORITHMS.filter(a => ["brady","tachy","ska","rosc"].includes(a.key)).map(a => (
          <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
        ))}
      </List>
      <SectionHeader>Diferensial</SectionHeader>
      <List>
        <Row glyph={<Icons.clipboard size={16} stroke={2.4}/>} tint="var(--tint-theory)" label="Hs &amp; Ts" sub="10 penyebab reversibel" onClick={() => nav.push({ screen: "hsts" })}/>
      </List>
      <SectionFooter>Mengikuti AHA Adult ACLS guidelines 2020 + PERKI 2021 (BHJL & BHJD).</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   ALGORITHM DETAIL
   ============================================================ */
export function MobileAlgorithmDetail({ nav, id }) {
  const flow = id === "brady" ? ACLS_FLOW_BRADY : id === "tachy" ? ACLS_FLOW_TACHY : id === "bhjd" ? ACLS_FLOW_BHJD : id === "ska" ? ACLS_FLOW_SKA : id === "rosc" ? ACLS_FLOW_ROSC : ACLS_FLOW_ARREST;
  const algo = ACLS_ALGORITHMS.find(a => a.key === id) || ACLS_ALGORITHMS[0];
  return (
    <>
      <NavBar back="Algorithms" onBack={nav.pop} right={<button className="nb-btn glyph"><Icons.star size={18} stroke={2}/></button>}/>
      <div style={{ padding: "0 20px 12px" }}>
        <div className="t-title-2">{algo.label}</div>
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 4 }}>{algo.sub} · ketuk langkah untuk detail</div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill tone="red">{algo.tag}</Pill><Pill tone="gray">{algo.source || "AHA 2020"}</Pill>
        </div>
      </div>
      <div style={{ padding: "8px 16px 18px" }}>
        {flow.map((step, i) => (
          <React.Fragment key={i}>
            <FlowStep step={step} index={i} total={flow.length}/>
            {i < flow.length - 1 && <FlowConnector/>}
          </React.Fragment>
        ))}
      </div>
      <SectionFooter>Untuk panduan klinis — bukan pengganti penilaian klinis.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   DRUG LIST
   ============================================================ */
export function MobileDrugList({ nav }) {
  const [filter, setFilter] = useState("all");
  const drugs = ACLS_DRUGS.filter(d => {
    if (filter === "all") return true;
    if (filter === "vaso") return (d.category || "").match(/Vasopresor|Inotropik/);
    if (filter === "arrhythmia") return (d.category || "").match(/Antiaritmia|Bradiaritmia/);
    if (filter === "thrombo") return (d.category || "").includes("Antitrombotik");
    return true;
  });
  return (
    <>
      <NavBar right={<button className="nb-btn glyph"><Icons.search size={18} stroke={2}/></button>}/>
      <LargeTitle>Obat ACLS</LargeTitle>
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
        {[{ v: "all", label: "Semua" }, { v: "vaso", label: "Vasopresor" }, { v: "arrhythmia", label: "Antiaritmia" }, { v: "thrombo", label: "Antitrombotik" }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className="ios-btn sm pill"
            style={{ background: filter === f.v ? "var(--accent)" : "var(--fill-tertiary)", color: filter === f.v ? "var(--accent-fg)" : "var(--label-primary)", fontSize: 13, height: 30, padding: "0 14px", flexShrink: 0 }}>
            {f.label}
          </button>
        ))}
      </div>
      <SectionHeader>{drugs.length} obat · PERKI 2021</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {drugs.map(d => (
          <button key={d.key} onClick={() => nav.push({ screen: "drug", id: d.key })}
            style={{ padding: "12px 14px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start", border: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: d.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.pill size={20} stroke={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div className="t-headline">{d.name}</div>
                <Icons.chevR size={14} stroke={2.4} style={{ color: "var(--label-tertiary)", marginTop: 4 }}/>
              </div>
              <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 1 }}>{d.class}{d.altName ? " · " + d.altName : ""}</div>
              <div className="t-footnote" style={{ marginTop: 6, padding: "6px 8px", background: "var(--fill-quaternary)", borderRadius: 6, color: "var(--label-primary)", fontFamily: "var(--font-mono)" }}>{d.dose}</div>
            </div>
          </button>
        ))}
      </div>
      <SectionFooter>Sumber: PERKI 2021 · verifikasi dosis dengan apoteker / pharmacopoeia setempat.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   DRUG DETAIL
   ============================================================ */
export function MobileDrugDetail({ nav, id }) {
  const d = ACLS_DRUGS.find(x => x.key === id) || ACLS_DRUGS[0];
  return (
    <>
      <NavBar back="Drugs" onBack={nav.pop} right={<button className="nb-btn glyph"><Icons.star size={18} stroke={2}/></button>}/>
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: d.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.pill size={32} stroke={2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-title-2">{d.name}</div>
          {d.altName && <div className="t-footnote" style={{ color: "var(--label-tertiary)", marginTop: 1 }}>juga: {d.altName}</div>}
          <div className="t-subheadline" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{d.class}</div>
        </div>
      </div>
      <SectionHeader>Indikasi</SectionHeader>
      <div style={{ padding: "0 16px 12px" }}>
        <div className="t-body" style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", lineHeight: 1.4 }}>{d.indication}</div>
      </div>
      <SectionHeader>Dosis</SectionHeader>
      <div style={{ padding: "0 16px" }}>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(180deg, " + d.tint + "14, " + d.tint + "06)", boxShadow: "inset 0 0 0 0.5px " + d.tint + "33" }}>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>Dosis awal</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: d.tint, marginTop: 2 }}>{d.dose}</div>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 12 }}>Pengulangan</div>
          <div className="t-callout" style={{ marginTop: 2 }}>{d.repeat}</div>
        </div>
      </div>
      <SectionHeader>Persiapan</SectionHeader>
      <List><Row label="Cara persiapan" sub={d.prep} chev={false}/></List>
      <SectionHeader>Catatan klinis</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {d.pearls.map((p, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 10, background: "var(--accent-tint)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{i + 1}</span>
            <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.4 }}>{p}</span>
          </div>
        ))}
      </div>
      <SectionHeader>Kontraindikasi &amp; perhatian</SectionHeader>
      <div style={{ padding: "0 16px 16px" }}>
        <Alert kind="warn" title="Perhatian">{d.contra}</Alert>
      </div>
      <SectionFooter>{d.source ? d.source + " · " : ""}Verifikasi dosis dengan apoteker · konfirmasi compatibility (Y-site).</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   ECG LIST
   ============================================================ */
export function MobileEkgList({ nav }) {
  return (
    <>
      <NavBar right={<button className="nb-btn glyph"><Icons.search size={18} stroke={2}/></button>}/>
      <LargeTitle>Pustaka EKG</LargeTitle>
      <SectionHeader>Irama · {ACLS_RHYTHMS.length}</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {ACLS_RHYTHMS.map(r => (
          <button key={r.key} onClick={() => nav.push({ screen: "ekg", id: r.key })}
            style={{ padding: "10px 12px 12px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", border: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div className="t-headline">{r.name}</div>
                <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 1 }}>{r.short}</div>
              </div>
              <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>{r.severity}</span>
            </div>
            <RhythmStrip kind={r.key} width={320} height={48} color={r.tint}/>
          </button>
        ))}
      </div>
      <SectionFooter>Strip ilustratif · selalu konfirmasi dengan 12-lead EKG.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   ECG DETAIL
   ============================================================ */
export function MobileEkgDetail({ nav, id }) {
  const r = ACLS_RHYTHMS.find(x => x.key === id) || ACLS_RHYTHMS[0];
  return (
    <>
      <NavBar back="EKG" onBack={nav.pop} right={<button className="nb-btn glyph"><Icons.share size={18} stroke={1.8}/></button>}/>
      <div style={{ padding: "4px 20px 12px" }}>
        <div className="t-title-2">{r.name}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>{r.severity}</span>
        </div>
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ padding: 10, background: "var(--bg-tertiary)", borderRadius: 14, boxShadow: "var(--shadow-1)" }}>
          <RhythmStrip kind={r.key} width={340} height={140} color={r.tint}/>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", textAlign: "right", marginTop: 4 }}>Lead II · 25 mm/s · 10 mm/mV</div>
        </div>
      </div>
      <SectionHeader>Ciri pengenalan</SectionHeader>
      <div style={{ padding: "0 16px 12px" }}>
        <div className="t-body" style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", lineHeight: 1.4 }}>{r.features}</div>
      </div>
      <SectionHeader>Tindakan</SectionHeader>
      <div style={{ padding: "0 16px 16px" }}>
        <Alert kind={r.severity === "shockable" || r.severity === "critical" ? "danger" : r.severity === "stable" ? "info" : "warn"}
          title={r.severity === "shockable" ? "Defibrilasi" : r.severity === "non-shockable" ? "CPR + obat" : "Tatalaksana sesuai algoritma"}>
          {r.action}
        </Alert>
      </div>
      <SectionFooter>Lihat algoritma terkait untuk langkah lengkap.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   Hs & Ts
   ============================================================ */
export function MobileHsTs({ nav }) {
  const [expanded, setExpanded] = useState(null);
  const renderItem = (c, letter) => {
    const open = expanded === c.key;
    return (
      <button key={c.key} onClick={() => setExpanded(open ? null : c.key)}
        style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", border: 0, display: "flex", flexDirection: "column", gap: open ? 8 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: c.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{letter}</span>
          <span className="t-headline" style={{ flex: 1 }}>{c.name}</span>
          <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform var(--dur-fast)", color: "var(--label-tertiary)" }}><Icons.chevDown size={16} stroke={2}/></span>
        </div>
        {open && (
          <div style={{ paddingLeft: 38, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="t-footnote" style={{ color: "var(--label-secondary)" }}><strong style={{ color: "var(--label-primary)" }}>Clue:</strong> {c.clue}</div>
            <div className="t-footnote" style={{ color: "var(--label-secondary)" }}><strong style={{ color: c.tint }}>Rx:</strong> {c.rx}</div>
          </div>
        )}
      </button>
    );
  };
  return (
    <>
      <NavBar back="Algorithms" onBack={nav.pop} title="Hs &amp; Ts"/>
      <LargeTitle>Hs &amp; Ts</LargeTitle>
      <div style={{ padding: "0 20px 12px" }}>
        <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>10 penyebab reversibel · cari sistematis selama resusitasi · ketuk untuk tatalaksana.</div>
      </div>
      <SectionHeader>5 Hs</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ACLS_HS_TS.filter(x => x.group === "H").map(c => renderItem(c, "H"))}
      </div>
      <SectionHeader>5 Ts</SectionHeader>
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ACLS_HS_TS.filter(x => x.group === "T").map(c => renderItem(c, "T"))}
      </div>
      <SectionFooter>Cari sistematis tiap rhythm check pada cardiac arrest.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   FAB Quick Sheet
   ============================================================ */
export function FabQuickSheet({ open, onClose, onPickAction, onOpenCpr }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Code Blue Cepat" height="62%">
      <div style={{ padding: "0 16px 4px" }}>
        <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>
          Ketuk untuk akses cepat algoritma — tekan-tahan FAB membuka CPR Workspace langsung.
        </div>
      </div>
      <div style={{ padding: "14px 16px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ACLS_QUICK_ACTIONS.slice(0, 4).map(a => (
          <button key={a.key} onClick={() => onPickAction(a.key)}
            style={{ padding: "14px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", border: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 110 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: a.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {a.glyph === "shock" && <Icons.boltFill size={22}/>}
              {a.glyph === "flatline" && <Icons.flatline size={22} stroke={2.2}/>}
              {a.glyph === "slow" && <Icons.slow size={22} stroke={2.2}/>}
              {a.glyph === "fast" && <Icons.fast size={22} stroke={2.2}/>}
            </span>
            <div>
              <div className="t-headline">{a.label}</div>
              <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <button onClick={onOpenCpr} className="ios-btn block"
          style={{ background: "var(--danger)", color: "#fff", height: 56, borderRadius: 16, fontSize: 17, fontWeight: 700, display: "flex", gap: 10 }}>
          <Icons.boltFill size={22}/> Aktifkan CPR Workspace
        </button>
        <div className="t-caption-1" style={{ color: "var(--label-secondary)", textAlign: "center", marginTop: 8 }}>Siklus 2 menit · pengingat epinephrine · log shock</div>
      </div>
    </BottomSheet>
  );
}
