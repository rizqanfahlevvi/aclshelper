import { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, NavBar, SectionHeader } from '../base';

/* ============================================================
   RhythmStrip — inline SVG ECG waveform
   ============================================================ */
export function RhythmStrip({ kind = "sinus", width = 260, height = 56, color = "var(--label-primary)", grid = true }) {
  const segments = useMemo(() => {
    const out = [];
    const w = width;
    const cy = height / 2;
    const seed = (s) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
    const rnd = seed(kind.length * 17 + 3);

    if (kind === "vf") {
      const pts = [];
      for (let i = 0; i <= w; i += 2) {
        const amp = (Math.sin(i * 0.5) + Math.sin(i * 1.13) + rnd() * 0.8) * 10;
        pts.push(`${i},${cy + amp}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "vt") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const t = i / 60; const p = t % 1;
        const y = p < 0.5 ? cy - Math.sin(p * Math.PI) * 20 : cy + Math.sin((p - 0.5) * Math.PI) * 14;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "torsades") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const t = i / 14; const env = Math.sin(i / 40) * 18;
        pts.push(`${i},${cy + Math.sin(t) * env}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "svt") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 30 / 30; let y = cy;
        if (p > 0.30 && p < 0.34) y = cy + 18;
        else if (p > 0.34 && p < 0.38) y = cy - 22;
        else if (p > 0.38 && p < 0.42) y = cy + 6;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "asys") {
      out.push(`M0 ${cy} L${w} ${cy}`);
    } else if (kind === "pea") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 90 / 90; let y = cy;
        if (p > 0.4 && p < 0.5) y = cy - 8;
        else if (p > 0.5 && p < 0.6) y = cy + 4;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "av3") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const pa = i % 35 / 35; const pq = i % 110 / 110; let y = cy;
        if (pa > 0.2 && pa < 0.3) y = cy - Math.sin((pa - 0.2) * 10 * Math.PI) * 4;
        if (pq > 0.45 && pq < 0.55) y = cy - 22;
        else if (pq > 0.55 && pq < 0.62) y = cy + 8;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "stemi") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 60 / 60; let y = cy - 4;
        if (p > 0.3 && p < 0.34) y = cy + 10;
        else if (p > 0.34 && p < 0.38) y = cy - 24;
        else if (p > 0.38 && p < 0.42) y = cy + 6;
        else if (p > 0.42 && p < 0.7) y = cy - 12;
        else if (p > 0.7 && p < 0.82) y = cy - 16 + Math.sin((p - 0.7) * 8) * 8;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "hyperk") {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 60 / 60; let y = cy;
        if (p > 0.3 && p < 0.34) y = cy - 18;
        else if (p > 0.34 && p < 0.38) y = cy + 6;
        else if (p > 0.55 && p < 0.72) y = cy - Math.sin((p - 0.55) / 0.17 * Math.PI) * 20;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else {
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 80 / 80; let y = cy;
        if (p > 0.10 && p < 0.18) y = cy - Math.sin((p - 0.10) * 12.5 * Math.PI) * 4;
        else if (p > 0.30 && p < 0.34) y = cy + 4;
        else if (p > 0.34 && p < 0.38) y = cy - 22;
        else if (p > 0.38 && p < 0.42) y = cy + 8;
        else if (p > 0.55 && p < 0.66) y = cy - Math.sin((p - 0.55) * 9 * Math.PI) * 6;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    }
    return out;
  }, [kind, width, height]);

  const gridLines = [];
  if (grid) {
    for (let x = 0; x < width; x += 10) gridLines.push(<line key={"v" + x} x1={x} y1={0} x2={x} y2={height} stroke="currentColor" strokeWidth="0.3" opacity={x % 50 === 0 ? 0.18 : 0.08} />);
    for (let y = 0; y < height; y += 10) gridLines.push(<line key={"h" + y} x1={0} y1={y} x2={width} y2={y} stroke="currentColor" strokeWidth="0.3" opacity={y % 50 === 0 ? 0.18 : 0.08} />);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: "block", color }} preserveAspectRatio="none">
      <rect x="0" y="0" width={width} height={height} fill="var(--bg-quaternary)" rx="8" />
      <g style={{ color: "var(--danger)" }}>{gridLines}</g>
      {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />)}
    </svg>
  );
}

/* ============================================================
   FlowStep
   ============================================================ */
export function FlowStep({ step, index, total, onAction }) {
  const tone = {
    action:   { tint: "var(--accent)",      label: "Tindakan",  bg: "var(--bg-tertiary)" },
    shock:    { tint: "var(--danger)",       label: "Shock",     bg: "rgba(255,59,48,0.10)" },
    drug:     { tint: "var(--tint-drug)",    label: "Obat",      bg: "var(--bg-tertiary)" },
    note:     { tint: "var(--tint-theory)", label: "Catatan",   bg: "var(--bg-tertiary)" },
    outcome:  { tint: "var(--success)",      label: "Hasil",     bg: "rgba(52,199,89,0.10)" },
    decision: { tint: "var(--warning)",      label: "Keputusan", bg: "var(--bg-tertiary)" },
  }[step.kind] || { tint: "var(--accent)", label: "Langkah", bg: "var(--bg-tertiary)" };

  if (step.kind === "decision") {
    return (
      <div className="flow-step decision">
        <div className="flow-tag" style={{ background: "rgba(255,149,0,0.14)", color: "var(--warning)" }}>Keputusan</div>
        <div className="t-headline" style={{ marginTop: 2 }}>{step.title}</div>
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{step.q}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button onClick={() => onAction && onAction("yes")} style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "rgba(255,59,48,0.10)", color: step.yes.tint, boxShadow: "inset 0 0 0 0.5px " + step.yes.tint + "40" }}>
            <div className="t-caption-2">YES</div>
            <div className="t-subheadline" style={{ fontWeight: 600, marginTop: 1 }}>{step.yes.label}</div>
          </button>
          <button onClick={() => onAction && onAction("no")} style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "rgba(0,122,255,0.08)", color: step.no.tint, boxShadow: "inset 0 0 0 0.5px " + step.no.tint + "40" }}>
            <div className="t-caption-2">NO</div>
            <div className="t-subheadline" style={{ fontWeight: 600, marginTop: 1 }}>{step.no.label}</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-step" style={{ background: tone.bg, boxShadow: "0 0 0 0.5px " + tone.tint + "30, var(--shadow-1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="flow-tag" style={{ background: tone.tint + "1F", color: tone.tint }}>{tone.label}</div>
        <span className="t-caption-2" style={{ color: "var(--label-tertiary)" }}>{index + 1} / {total}</span>
      </div>
      <div className="t-headline" style={{ marginTop: 6 }}>{step.title}</div>
      {step.sub && <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{step.sub}</div>}
      {step.pearls && (
        <div className="t-caption-1" style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "var(--fill-quaternary)", color: "var(--label-secondary)", lineHeight: 1.4 }}>{step.pearls}</div>
      )}
    </div>
  );
}

/* ============================================================
   FlowConnector
   ============================================================ */
export function FlowConnector({ tone = "var(--label-tertiary)" }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2px 0", color: tone }}>
      <Icons.flowArrow size={18} stroke={2} />
    </div>
  );
}

/* ============================================================
   BottomNav with center FAB
   ============================================================ */
export function BottomNav({ active, onChange, fabShape = "circle", onFabTap, onFabLongPress, accent }) {
  const longPressTimer = useRef(null);
  const handleStart = () => {
    if (onFabLongPress) {
      longPressTimer.current = setTimeout(() => { onFabLongPress(); longPressTimer.current = null; }, 550);
    }
  };
  const handleEnd = (fired) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      if (fired) onFabTap && onFabTap();
    }
  };
  const fabRadius = fabShape === "circle" ? 30 : fabShape === "squircle" ? 18 : 30;
  const fabWidth = fabShape === "pill" ? 90 : 60;

  return (
    <div className="acls-bottomnav">
      {[
        { key: "home",  label: "Beranda",  icon: Icons.house,   iconFill: Icons.houseFill },
        { key: "algo",  label: "Algoritma",icon: Icons.algo,    iconFill: Icons.algoFill },
        { key: null,    label: "",         icon: null },
        { key: "drugs", label: "Obat",     icon: Icons.pill,    iconFill: Icons.pillFill },
        { key: "tools", label: "EKG",      icon: Icons.ekg,     iconFill: Icons.ekgFill },
      ].map((t, i) => {
        if (!t.icon) return <div key={i} />;
        const isActive = active === t.key;
        const I = isActive ? t.iconFill : t.icon;
        return (
          <button key={t.key} className={"nav-btn " + (isActive ? "active" : "")} onClick={() => onChange(t.key)}>
            <I size={24} />
            <span>{t.label}</span>
          </button>
        );
      })}
      <button
        className="acls-fab"
        style={{ width: fabWidth, height: 60, borderRadius: fabRadius, background: accent || "var(--danger)" }}
        onPointerDown={handleStart}
        onPointerUp={() => handleEnd(true)}
        onPointerLeave={() => handleEnd(false)}
        aria-label="Quick Code Blue">
        <Icons.boltFill size={26} />
        {fabShape === "pill" && <span style={{ marginLeft: 4, fontWeight: 700 }}>CODE</span>}
      </button>
    </div>
  );
}

/* ============================================================
   BottomSheet
   ============================================================ */
export function BottomSheet({ open, onClose, title, children, height }) {
  return (
    <div className={"acls-sheet-root " + (open ? "open" : "")}>
      <div className="acls-sheet-backdrop" onClick={onClose} />
      <div className="acls-sheet" style={{ maxHeight: height || "78%" }}>
        <div className="acls-sheet-handle" />
        {title && (
          <div style={{ padding: "4px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="t-title-3">{title}</div>
            <button onClick={onClose} className="nb-btn glyph" style={{ width: 30, height: 30, borderRadius: 15, background: "var(--fill-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.cross size={16} stroke={2.4} />
            </button>
          </div>
        )}
        <div style={{ overflowY: "auto", paddingBottom: 24 }}>{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   CPRTimer — full-screen workspace
   ============================================================ */
export function CPRTimer({ onClose }) {
  const [running, setRunning] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [epiNextMs, setEpiNextMs] = useState(null);
  const [shocks, setShocks] = useState(0);
  const [midaz, setMidaz] = useState(0);
  const [intubated, setIntubated] = useState(false);
  const wallStartRef = useRef(new Date());

  const nowWall = (offsetMs = 0) => {
    const t = new Date(wallStartRef.current.getTime() + offsetMs);
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
  };

  const [log, setLog] = useState([{ t: 0, wall: nowWall(0), action: "CPR dimulai", tone: "info" }]);
  const lastCycleRef = useRef(1);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsedMs(e => e + 50), 50);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = Math.floor(elapsedMs / 1000);
  const cycleElapsedMs = elapsedMs % 120000;
  const cycleRemainingMs = 120000 - cycleElapsedMs;
  const cycleProgress = cycleElapsedMs / 120000;
  const cycles = Math.floor(elapsedMs / 120000) + 1;

  useEffect(() => {
    if (cycles !== lastCycleRef.current && cycles > 1) {
      setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: `Siklus ${cycles} · cek irama`, tone: "danger" }]);
      lastCycleRef.current = cycles;
    }
  }, [cycles]);

  const fmtMs = (ms) => {
    const total = Math.floor(ms / 10);
    const m = Math.floor(total / 6000);
    const s = Math.floor(total % 6000 / 100);
    const c = total % 100;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
  };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const addLog = (action, tone = "info") => setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action, tone }]);

  const epiRemainMs = epiNextMs != null ? Math.max(0, epiNextMs - elapsedMs) : null;
  const epiReady = epiRemainMs != null && epiRemainMs === 0;
  const epiAlertedRef = useRef(false);

  useEffect(() => {
    if (epiReady && !epiAlertedRef.current) {
      epiAlertedRef.current = true;
      setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: "⚠︎ Epinephrine berikutnya jatuh tempo", tone: "warn" }]);
    }
    if (epiNextMs != null && epiRemainMs > 0) epiAlertedRef.current = false;
  }, [epiReady, epiNextMs, epiRemainMs]);

  return (
    <div className="cpr-workspace">
      <div className="cpr-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 4px", gap: 8 }}>
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: 15 }}>
            <Icons.chevL size={18} /><span style={{ marginLeft: -2 }}>Keluar</span>
          </button>
          <div className="t-caption-2" style={{ color: "var(--danger)", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "var(--danger)", marginRight: 5, verticalAlign: "middle", animation: "acls-blink 1s infinite" }} />
            CODE BLUE
          </div>
          <button className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--danger)", fontSize: 15, fontWeight: 600 }} onClick={onClose}>Akhiri</button>
        </div>

        <div style={{ position: "relative", padding: "0 20px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, alignItems: "flex-start", marginTop: 8 }}>
            <div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>SIKLUS 2 MNT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 700, color: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--label-primary)", lineHeight: 1, fontFeatureSettings: '"tnum"', marginTop: 2, letterSpacing: "-0.02em" }}>
                {fmtMs(cycleRemainingMs)}
              </div>
              <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 4 }}>tersisa · siklus {cycles}</div>
            </div>
            <div style={{ textAlign: "right", paddingTop: 2 }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>TOTAL</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 2 }}>{fmt(elapsed)}</div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 10 }}>TARGET</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--success)", whiteSpace: "nowrap" }}>100–120/mnt</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--fill-tertiary)", marginTop: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: cycleProgress * 100 + "%", background: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--success)", borderRadius: 4, transition: "width 50ms linear, background var(--dur-fast)" }} />
          </div>
        </div>

        <div style={{ padding: "0 20px 14px", display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="ios-btn gray sm" style={{ height: 38, flex: 1 }} onClick={() => setRunning(r => !r)}>
            {running ? <><Icons.pause size={14} /> Jeda</> : <><Icons.play size={14} /> Lanjut</>}
          </button>
          <button className="ios-btn gray sm" style={{ height: 38, flex: 1 }} onClick={() => { setElapsedMs(0); lastCycleRef.current = 1; }}>
            <Icons.reset size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="cpr-actions">
        <button className="cpr-action shock" onClick={() => { setShocks(s => s + 1); addLog("Defibrilasi 200 J", "danger"); }}>
          <Icons.boltFill size={28} />
          <span className="t-headline">Shock</span>
          <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>{shocks} diberikan</span>
        </button>
        <button
          className={"cpr-action epi" + (epiReady ? " epi-ready" : "")}
          onClick={() => { setEpiDoses(e => e + 1); setEpiNextMs(elapsedMs + 180000); addLog("Epinephrine 1 mg IV · next dose 3 mnt", "warn"); }}>
          <Icons.pill size={26} stroke={2} />
          <span className="t-headline">Epinephrine</span>
          {epiNextMs == null ? (
            <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>1 mg IV · q3–5 mnt</span>
          ) : epiReady ? (
            <span className="t-caption-2" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>● BERIKAN SEKARANG</span>
          ) : (
            <span className="t-caption-2" style={{ opacity: 0.92, whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontFeatureSettings: '"tnum"' }}>
              Next: {fmt(Math.ceil(epiRemainMs / 1000))} · dosis {epiDoses}
            </span>
          )}
        </button>
        <button className="cpr-action pulse" onClick={() => addLog("Cek nadi & irama ≤ 10 dtk", "info")}>
          <Icons.heart size={26} stroke={2} />
          <span className="t-headline">Cek nadi &amp; irama</span>
          <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>≤ 10 dtk</span>
        </button>
        <button className="cpr-action rosc" onClick={() => addLog("ROSC tercapai · post-cardiac care", "success")}>
          <Icons.check size={28} stroke={2.6} />
          <span className="t-headline">ROSC</span>
          <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>Akhiri siklus</span>
        </button>
        <button
          className={"cpr-action intubate" + (intubated ? " done" : "")}
          onClick={() => { if (intubated) { addLog("ETT dilepas / reposisi", "warn"); setIntubated(false); } else { addLog("Intubasi ETT · konfirmasi EtCO₂ + auskultasi", "info"); setIntubated(true); } }}>
          <Icons.lungs size={26} stroke={2} />
          <span className="t-headline">{intubated ? "Airway terpasang" : "Intubasi"}</span>
          <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>{intubated ? "Ventilasi 1×6 dtk" : "ETT / SGA · EtCO₂"}</span>
        </button>
        <button className="cpr-action midaz" onClick={() => { setMidaz(m => m + 1); addLog("Midazolam 2 mg IV · sedasi prosedur", "info"); }}>
          <Icons.syringe size={26} stroke={2} />
          <span className="t-headline">Midazolam</span>
          <span className="t-caption-2" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>
            {midaz === 0 ? "1–2,5 mg IV · pre-kardioversi" : `${midaz} dosis · 1–2,5 mg IV`}
          </span>
        </button>
      </div>

      <div className="cpr-log">
        <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "10px 20px 4px" }}>LOG KEJADIAN</div>
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[...log].reverse().slice(0, 6).map((e, i) => {
            const tone = { info: "var(--label-primary)", warn: "var(--warning)", danger: "var(--danger)", success: "var(--success)" }[e.tone];
            return (
              <div key={i} className="t-footnote" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderRadius: 8, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)" }}>
                <span style={{ color: tone, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                <span style={{ color: "var(--label-tertiary)", fontFamily: "var(--font-mono)", fontFeatureSettings: '"tnum"', textAlign: "right", flexShrink: 0, lineHeight: 1.25 }}>
                  <div style={{ color: "var(--label-secondary)", fontWeight: 600 }}>{e.wall}</div>
                  <div style={{ fontSize: 10, opacity: 0.85 }}>+{fmt(e.t)}</div>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
