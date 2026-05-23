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
export function BottomNav({ active, onChange, fabShape = "circle", onFabClick, accent }) {
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
        onClick={onFabClick}
        aria-label="Code Blue">
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
   CPRTimer — full-screen workspace with AHA decision tree
   ============================================================ */

const CPR_BPM = 110;

const VF_STEPS = [
  { kind:'shock', title:'Defibrilasi pertama',           sub:'200J bifasik · pastikan semua menjauh',                    cta:'shock'               },
  { kind:'cpr',   title:'CPR 2 menit · IV/IO access',    sub:'Timer berjalan · cek irama setelah 2 mnt',                 auto:true                 },
  { kind:'shock', title:'Defibrilasi kedua',              sub:'200J bifasik',                                             cta:'shock'               },
  { kind:'drug',  title:'Epinefrin 1 mg IV/IO',           sub:'Sesegera mungkin · ulangi q3–5 mnt',                      cta:'epi'                 },
  { kind:'opt',   title:'Pertimbangkan intubasi',         sub:'ETT/SGA · EtCO₂ · ventilasi 1×/6 dtk',                   cta:'intubasi', skip:true },
  { kind:'cpr',   title:'CPR 2 menit',                    sub:'Cari & atasi Hs & Ts · Epinefrin q3–5 mnt',               auto:true                 },
  { kind:'shock', title:'Defibrilasi ketiga',             sub:'200J bifasik',                                             cta:'shock'               },
  { kind:'drug',  title:'Amiodarone 300 mg IV/IO',        sub:'atau Lidokain 1–1.5 mg/kg bolus',                         cta:'amio'                },
  { kind:'cpr',   title:'CPR 2 menit',                    sub:'Epinefrin q3–5 mnt · pertimbangkan penyebab reversibel',  auto:true                 },
];

const PEA_STEPS = [
  { kind:'cpr',   title:'CPR 2 menit · IV/IO access',    sub:'Minimal interupsi · 100–120/mnt',                         auto:true                 },
  { kind:'drug',  title:'Epinefrin 1 mg IV/IO — SEGERA', sub:'Sesegera mungkin · ulangi q3–5 mnt',                      cta:'epi'                 },
  { kind:'opt',   title:'Pertimbangkan intubasi',         sub:'ETT/SGA · EtCO₂ · cari & atasi Hs & Ts',                 cta:'intubasi', skip:true },
  { kind:'cpr',   title:'CPR 2 menit',                    sub:'Epinefrin q3–5 mnt · cari & atasi Hs & Ts',              auto:true                 },
];

function useMetronome(active) {
  const ctxRef = useRef(null);
  const schedRef = useRef(null);
  const nextRef = useRef(0);

  const stop = () => {
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null; }
  };

  useEffect(() => {
    if (!active) { stop(); return; }
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const interval = 60 / CPR_BPM;
      nextRef.current = ctx.currentTime + 0.05;

      const schedule = () => {
        const ctx2 = ctxRef.current;
        if (!ctx2) return;
        while (nextRef.current < ctx2.currentTime + 0.3) {
          try {
            const osc = ctx2.createOscillator();
            const gain = ctx2.createGain();
            osc.connect(gain); gain.connect(ctx2.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.18, nextRef.current);
            gain.gain.exponentialRampToValueAtTime(0.001, nextRef.current + 0.045);
            osc.start(nextRef.current); osc.stop(nextRef.current + 0.05);
          } catch(_) {}
          nextRef.current += interval;
        }
      };
      schedule();
      schedRef.current = setInterval(schedule, 100);
    } catch(_) {}
    return stop;
  }, [active]);
}

const RHYTHM_OPTS = [
  { key: "shockable",    label: "VF / pVT",        sub: "Irama shockable — defibrilasi segera",    color: "var(--danger)" },
  { key: "nonshockable", label: "PEA / Asistol",    sub: "Irama non-shockable — CPR + Epinefrin",  color: "var(--info)" },
  { key: "unknown",      label: "Belum terpasang",  sub: "Mulai CPR — pasang monitor segera",       color: "var(--label-secondary)" },
];

function getGuidance(rhythm, cycles, epiDoses, shocks, amio) {
  if (!rhythm || rhythm === "unknown") return { text: "Pasang monitor/defibrilator · CPR berkualitas tinggi · IV/IO access", color: "var(--label-secondary)" };
  if (rhythm === "shockable") {
    if (cycles === 1) return { text: `Defibrilasi 200J bifasik → CPR 2 mnt → IV/IO access${epiDoses === 0 ? " → Epinefrin 1mg setelah shock ke-2" : ""}`, color: "var(--danger)" };
    if (shocks >= 3 && amio === 0) return { text: "Amiodarone 300mg IV/IO atau Lidokain 1–1.5mg/kg · Epinefrin q3-5 mnt", color: "var(--warning)" };
    return { text: `Defibrilasi → CPR 2 mnt · Epinefrin ${epiDoses === 0 ? "segera" : "q3-5 mnt"} · Cari & atasi Hs & Ts`, color: "var(--danger)" };
  }
  if (rhythm === "nonshockable") {
    if (cycles === 1) return { text: "CPR segera · IV/IO ASAP · Epinefrin 1mg sesegera mungkin · Cari Hs & Ts", color: "var(--info)" };
    return { text: `Epinefrin ${epiDoses === 0 ? "SEGERA" : "q3-5 mnt"} · Cari & atasi Hs & Ts · cek irama tiap 2 mnt`, color: "var(--info)" };
  }
  return { text: "", color: "var(--label-secondary)" };
}

function StepCard({ step, idx }) {
  const colMap = { shock:'var(--danger)', drug:'var(--warning)', opt:'var(--label-tertiary)', cpr:'var(--info)' };
  const lblMap = { shock:'Shock', drug:'Obat', opt:'Opsional', cpr:'CPR Aktif' };
  const color = colMap[step.kind] || 'var(--accent)';
  return (
    <div style={{ margin:'0 16px 6px', padding:'10px 12px', borderRadius:12, background:'var(--bg-tertiary)', borderLeft:`3px solid ${color}`, boxShadow:'var(--shadow-1)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, color, background:color+'1F', padding:'1px 6px', borderRadius:99 }}>
          {lblMap[step.kind] || 'Langkah'}
        </span>
        <span style={{ fontSize:10, color:'var(--label-tertiary)' }}>Langkah {idx + 1}</span>
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--label-primary)', lineHeight:1.3 }}>{step.title}</div>
      {step.sub && <div style={{ fontSize:12, color:'var(--label-secondary)', marginTop:2, lineHeight:1.4 }}>{step.sub}</div>}
    </div>
  );
}

export function CPRTimer({ onClose }) {
  const [phase, setPhase] = useState("setup");
  const [rhythm, setRhythm] = useState(null);

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [epiNextMs, setEpiNextMs] = useState(null);
  const [shocks, setShocks] = useState(0);
  const [amio, setAmio] = useState(0);
  const [intubated, setIntubated] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const wallStartRef = useRef(null);
  const lastCycleRef = useRef(1);
  const epiAlertedRef = useRef(false);

  const nowWall = (offsetMs = 0) => {
    if (!wallStartRef.current) return "--:--:--";
    const t = new Date(wallStartRef.current.getTime() + offsetMs);
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
  };

  const [log, setLog] = useState([]);

  useMetronome(soundOn && running);

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
    if (phase !== "active") return;
    if (cycles !== lastCycleRef.current && cycles > 1) {
      lastCycleRef.current = cycles;
      setRunning(false);
      setPhase("rhythmCheck");
    }
  }, [cycles, phase]);

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

  useEffect(() => {
    if (epiReady && !epiAlertedRef.current) {
      epiAlertedRef.current = true;
      setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: "⚠ Epinephrine berikutnya jatuh tempo", tone: "warn" }]);
    }
    if (epiNextMs != null && epiRemainMs > 0) epiAlertedRef.current = false;
  }, [epiReady, epiNextMs, epiRemainMs]);

  const steps = rhythm === 'shockable' ? VF_STEPS : PEA_STEPS;
  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const curStep = steps[safeIdx];
  const advanceStep = () => setStepIdx(idx => {
    const next = idx + 1;
    if (next >= steps.length) return rhythm === 'shockable' ? 5 : 3;
    return next;
  });

  const startCPR = (selectedRhythm) => {
    setStepIdx(0);
    wallStartRef.current = new Date();
    setRhythm(selectedRhythm);
    setPhase("active");
    setRunning(true);
    const label = RHYTHM_OPTS.find(r => r.key === selectedRhythm)?.label || selectedRhythm;
    setLog([
      { t: 0, wall: nowWall(0), action: "CPR dimulai", tone: "info" },
      { t: 0, wall: nowWall(0), action: `Irama awal: ${label}`, tone: selectedRhythm === "shockable" ? "danger" : "info" },
    ]);
    if (selectedRhythm === "shockable") {
      setTimeout(() => setLog(l => [...l, { t: 0, wall: nowWall(0), action: "Defibrilasi segera — siapkan AED/defibrilator", tone: "danger" }]), 100);
    }
  };

  const handleRhythmResult = (result) => {
    if (result === "rosc") {
      addLog("ROSC tercapai — alihkan ke post-cardiac arrest care", "success");
      setPhase("active");
      setRunning(false);
      return;
    }
    const label = RHYTHM_OPTS.find(r => r.key === result)?.label || result;
    setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: `Siklus ${cycles} — irama: ${label}`, tone: result === "shockable" ? "danger" : "info" }]);
    if (result !== rhythm) {
      setRhythm(result);
      setStepIdx(0);
    } else {
      setStepIdx(idx => {
        const newSteps = result === 'shockable' ? VF_STEPS : PEA_STEPS;
        const next = idx + 1;
        if (next >= newSteps.length) return result === 'shockable' ? 5 : 3;
        return next;
      });
    }
    if (result === "shockable") {
      setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: "Defibrilasi — lanjut CPR 2 menit", tone: "danger" }]);
    }
    setPhase("active");
    setRunning(true);
  };

  const guidance = getGuidance(rhythm, cycles, epiDoses, shocks, amio);

  /* === SETUP PHASE === */
  if (phase === "setup") {
    return (
      <div className="cpr-workspace" style={{ justifyContent: "flex-start" }}>
        <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--separator)" }}>
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: 15 }}>
            <Icons.chevL size={18}/><span style={{ marginLeft: -2 }}>Keluar</span>
          </button>
          <div className="t-caption-2" style={{ color: "var(--danger)", letterSpacing: 0.5 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "var(--danger)", marginRight: 5, verticalAlign: "middle" }}/>
            CODE BLUE
          </div>
          <div style={{ width: 60 }}/>
        </div>

        <div style={{ padding: "24px 20px 16px" }}>
          <div className="t-title-2" style={{ marginBottom: 4 }}>Irama awal?</div>
          <div className="t-footnote" style={{ color: "var(--label-secondary)", marginBottom: 20 }}>
            Pasang monitor/defibrilator · CPR berkualitas tinggi sambil menunggu irama terdeteksi
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RHYTHM_OPTS.map(opt => (
              <button key={opt.key} onClick={() => startCPR(opt.key)}
                style={{ padding: "16px 18px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1), 0 0 0 0.5px " + opt.color + "40", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: opt.color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {opt.key === "shockable"    && <Icons.boltFill size={22} style={{ color: "#fff" }}/>}
                  {opt.key === "nonshockable" && <Icons.flatline size={22} stroke={2.2} style={{ color: "#fff" }}/>}
                  {opt.key === "unknown"      && <Icons.heart size={22} stroke={2} style={{ color: "#fff" }}/>}
                </div>
                <div>
                  <div className="t-headline" style={{ color: opt.color }}>{opt.label}</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "rgba(255,149,0,0.08)", boxShadow: "inset 0 0 0 0.5px rgba(255,149,0,0.3)" }}>
            <div className="t-caption-2" style={{ color: "var(--warning)", fontWeight: 700, marginBottom: 4 }}>PANDUAN AHA 2025</div>
            <div className="t-caption-1" style={{ color: "var(--label-secondary)", lineHeight: 1.5 }}>
              100–120 kompresi/mnt · kedalaman 5–6 cm · recoil penuh · rasio 30:2 · minimal interupsi
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* === RHYTHM CHECK PHASE === */
  if (phase === "rhythmCheck") {
    return (
      <div className="cpr-workspace" style={{ justifyContent: "flex-start" }}>
        <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--separator)" }}>
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: 15 }}>
            <Icons.chevL size={18}/><span style={{ marginLeft: -2 }}>Keluar</span>
          </button>
          <div className="t-caption-2" style={{ color: "var(--danger)", letterSpacing: 0.5 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "var(--danger)", marginRight: 5, verticalAlign: "middle", animation: "acls-blink 1s infinite" }}/>
            JEDA CEK IRAMA
          </div>
          <div style={{ width: 60 }}/>
        </div>

        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,59,48,0.08)", boxShadow: "inset 0 0 0 1px rgba(255,59,48,0.25)", marginBottom: 20 }}>
            <div className="t-headline" style={{ color: "var(--danger)" }}>Siklus {cycles} selesai</div>
            <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 4 }}>
              Hentikan kompresi &lt; 10 detik · cek irama di monitor · total: {fmt(elapsed)}
            </div>
          </div>

          <div className="t-subheadline" style={{ fontWeight: 600, marginBottom: 12 }}>Irama yang terdeteksi?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RHYTHM_OPTS.slice(0, 2).map(opt => (
              <button key={opt.key} onClick={() => handleRhythmResult(opt.key)}
                style={{ padding: "16px 18px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1), 0 0 0 0.5px " + opt.color + "40", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: opt.color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {opt.key === "shockable"    && <Icons.boltFill size={20} style={{ color: "#fff" }}/>}
                  {opt.key === "nonshockable" && <Icons.flatline size={20} stroke={2.2} style={{ color: "#fff" }}/>}
                </div>
                <div>
                  <div className="t-headline" style={{ color: opt.color }}>{opt.label}</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
            <button onClick={() => handleRhythmResult("rosc")}
              style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(52,199,89,0.10)", boxShadow: "0 0 0 1px rgba(52,199,89,0.4)", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--success)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.check size={22} stroke={2.6} style={{ color: "#fff" }}/>
              </div>
              <div>
                <div className="t-headline" style={{ color: "var(--success)" }}>ROSC — Ada nadi</div>
                <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>Hentikan resusitasi · mulai post-cardiac arrest care</div>
              </div>
            </button>
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(0,122,255,0.07)", boxShadow: "inset 0 0 0 0.5px rgba(0,122,255,0.25)" }}>
            <div className="t-caption-2" style={{ color: "var(--info)", fontWeight: 700, marginBottom: 4 }}>REKOMENDASI SIKLUS {cycles}</div>
            <div className="t-caption-1" style={{ color: "var(--label-secondary)", lineHeight: 1.5 }}>
              {rhythm === "shockable"    ? `Shockable: defibrilasi ke-${shocks + 1} · CPR 2 mnt · Epinefrin ${epiDoses === 0 ? "segera" : "jika sudah ≥ 3 mnt"}` : ""}
              {rhythm === "nonshockable" ? `Non-shockable: lanjut CPR · Epinefrin ${epiDoses === 0 ? "SEGERA" : "q3-5 mnt"} · Cari Hs & Ts` : ""}
              {rhythm === "unknown"      ? "Identifikasi irama sesegera mungkin · pastikan CPR berkualitas tinggi" : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* === ACTIVE CPR PHASE === */
  return (
    <div className="cpr-workspace">
      <div className="cpr-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 4px", gap: 8 }}>
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: 15 }}>
            <Icons.chevL size={18}/><span style={{ marginLeft: -2 }}>Keluar</span>
          </button>
          <div className="t-caption-2" style={{ color: "var(--danger)", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "var(--danger)", marginRight: 5, verticalAlign: "middle", animation: "acls-blink 1s infinite" }}/>
            CODE BLUE
          </div>
          <div style={{ width: 60 }}/>
        </div>

        <StepCard step={curStep} idx={safeIdx} />

        <div style={{ padding: "6px 20px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, alignItems: "flex-start", marginTop: 4 }}>
            <div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>SIKLUS 2 MNT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 42, fontWeight: 700, color: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--label-primary)", lineHeight: 1, fontFeatureSettings: '"tnum"', marginTop: 2, letterSpacing: "-0.02em" }}>
                {fmtMs(cycleRemainingMs)}
              </div>
              <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 3 }}>tersisa · siklus {cycles}</div>
            </div>
            <div style={{ textAlign: "right", paddingTop: 2 }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>TOTAL</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 2 }}>{fmt(elapsed)}</div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 8 }}>METRONOME</div>
              <button onClick={() => setSoundOn(s => !s)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 7px', borderRadius:7, background: soundOn ? 'rgba(255,59,48,0.12)' : 'var(--fill-tertiary)', border:0, cursor:'pointer', marginTop:3 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn ? 'var(--danger)' : 'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {soundOn
                    ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                    : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                  }
                </svg>
                <span style={{ fontSize:11, fontWeight:600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace:'nowrap' }}>
                  {soundOn ? `♩ ${CPR_BPM} BPM` : 'Aktifkan'}
                </span>
              </button>
            </div>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: "var(--fill-tertiary)", marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: cycleProgress * 100 + "%", background: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--success)", borderRadius: 4, transition: "width 50ms linear, background var(--dur-fast)" }}/>
          </div>
        </div>

        <div style={{ padding: "0 20px 12px", display: "flex", gap: 10 }}>
          <button className="ios-btn gray sm" style={{ height: 36, flex: 1 }} onClick={() => setRunning(r => !r)}>
            {running ? <><Icons.pause size={13}/> Jeda</> : <><Icons.play size={13}/> Lanjut</>}
          </button>
          <button className="ios-btn gray sm" style={{ height: 36, flex: 1 }} onClick={() => { setElapsedMs(0); lastCycleRef.current = 1; }}>
            <Icons.reset size={13}/> Reset
          </button>
        </div>
      </div>

      {/* === Contextual action panel — sesuai langkah algoritma === */}
      <div style={{ padding: '6px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>

        {/* Shock step */}
        {curStep.kind === 'shock' && (
          <button className="cpr-action shock" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: '14px 18px' }}
            onClick={() => { setShocks(s => s + 1); addLog(`Defibrilasi ${shocks + 1} × 200J bifasik`, 'danger'); advanceStep(); }}>
            <Icons.boltFill size={32}/>
            <div style={{ textAlign: 'left' }}>
              <div className="t-title-3" style={{ color: '#fff' }}>Defibrilasi — 200J bifasik</div>
              <div className="t-caption-2" style={{ opacity: 0.82 }}>{shocks > 0 ? `${shocks} sudah diberikan · ` : ''}Tandai &amp; lanjut</div>
            </div>
          </button>
        )}

        {/* Epi step */}
        {curStep.kind === 'drug' && curStep.cta === 'epi' && (
          <button className="cpr-action epi" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: '14px 18px' }}
            onClick={() => { setEpiDoses(e => e + 1); setEpiNextMs(elapsedMs + 180000); addLog(`Epinefrin ${epiDoses + 1}mg IV/IO · next 3 mnt`, 'warn'); advanceStep(); }}>
            <Icons.pill size={28} stroke={2}/>
            <div style={{ textAlign: 'left' }}>
              <div className="t-title-3" style={{ color: '#fff' }}>Epinefrin 1 mg IV/IO</div>
              <div className="t-caption-2" style={{ opacity: 0.82 }}>Dosis #{epiDoses + 1} · Tandai &amp; lanjut</div>
            </div>
          </button>
        )}

        {/* Amiodarone step */}
        {curStep.kind === 'drug' && curStep.cta === 'amio' && (
          <button className="cpr-action midaz" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: '14px 18px', background: 'linear-gradient(180deg,#5856D6,#3B39B8)' }}
            onClick={() => { setAmio(a => a + 1); addLog(`Amiodarone ${amio === 0 ? '300mg' : '150mg'} IV/IO bolus`, 'info'); advanceStep(); }}>
            <Icons.syringe size={28} stroke={2}/>
            <div style={{ textAlign: 'left' }}>
              <div className="t-title-3" style={{ color: '#fff' }}>Amiodarone {amio === 0 ? '300 mg' : '150 mg'} IV/IO</div>
              <div className="t-caption-2" style={{ opacity: 0.82 }}>Tandai &amp; lanjut</div>
            </div>
          </button>
        )}

        {/* Intubasi optional step */}
        {curStep.kind === 'opt' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cpr-action intubate" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, padding: '12px 16px' }}
              onClick={() => { setIntubated(true); addLog('Intubasi ETT · konfirmasi EtCO₂ + auskultasi', 'info'); advanceStep(); }}>
              <Icons.lungs size={26} stroke={2}/>
              <div style={{ textAlign: 'left' }}>
                <div className="t-headline" style={{ color: '#fff' }}>Intubasi ETT / SGA</div>
                <div className="t-caption-2" style={{ opacity: 0.82 }}>EtCO₂ · ventilasi 1×/6 dtk</div>
              </div>
            </button>
            <button style={{ height: 60, padding: '0 18px', borderRadius: 14, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: 14, fontWeight: 600, border: 0, cursor: 'pointer', flexShrink: 0 }}
              onClick={advanceStep}>Lewati</button>
          </div>
        )}

        {/* CPR running step — tampilkan status */}
        {curStep.kind === 'cpr' && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--info)', animation: 'acls-blink 1s infinite', flexShrink: 0 }}/>
            <span className="t-caption-1" style={{ color: 'var(--info)', fontWeight: 600, flex: 1 }}>CPR berjalan · cek irama saat timer selesai</span>
            {epiNextMs != null && !epiReady && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>Epi {fmt(Math.ceil(epiRemainMs / 1000))}</span>
            )}
          </div>
        )}

        {/* Epi jatuh tempo — muncul di atas secondary row saat countdown = 0 dan bukan step epi */}
        {epiReady && curStep.cta !== 'epi' && (
          <button className="cpr-action epi epi-ready" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, padding: '10px 16px' }}
            onClick={() => { setEpiDoses(e => e + 1); setEpiNextMs(elapsedMs + 180000); addLog(`Epinefrin ${epiDoses + 1}mg IV/IO · jatuh tempo`, 'warn'); }}>
            <Icons.pill size={22} stroke={2}/>
            <div style={{ textAlign: 'left' }}>
              <div className="t-headline" style={{ color: '#fff' }}>⚠ Epinefrin jatuh tempo!</div>
              <div className="t-caption-2" style={{ opacity: 0.85 }}>Dosis #{epiDoses + 1} · berikan segera</div>
            </div>
          </button>
        )}

        {/* Secondary row — selalu tersedia */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cpr-action pulse" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
            onClick={() => addLog('Cek nadi & irama ≤ 10 dtk', 'info')}>
            <Icons.heart size={18} stroke={2}/>
            <span className="t-caption-1" style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Cek nadi</span>
          </button>
          <button className="cpr-action rosc" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
            onClick={() => { addLog('ROSC tercapai · post-cardiac arrest', 'success'); setRunning(false); }}>
            <Icons.check size={18} stroke={2.6}/>
            <span className="t-caption-1" style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>ROSC</span>
          </button>
        </div>

      </div>

      <div className="cpr-log">
        <div className="t-caption-2" style={{ color: "var(--label-secondary)", padding: "10px 20px 4px" }}>LOG KEJADIAN</div>
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[...log].reverse().slice(0, 6).map((e, i) => {
            const tc = { info: "var(--label-primary)", warn: "var(--warning)", danger: "var(--danger)", success: "var(--success)" }[e.tone];
            return (
              <div key={i} className="t-footnote" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderRadius: 8, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)" }}>
                <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
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
