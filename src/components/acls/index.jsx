import { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, NavBar, SectionHeader } from '../base';
import { sfx } from '../../utils/sfx';
import { haptic } from '../../utils/haptic';

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
    } else if (kind === "af") {
      /* Atrial fibrillation: irregular R-R, fibrillatory baseline */
      const pts = [];
      const intervals = [38, 55, 42, 63, 35, 50, 45];
      let x = 0; let idx = 0;
      while (x <= w) {
        const qi = intervals[idx % intervals.length];
        for (let j = 0; j < qi && x + j <= w; j++) {
          const fib = Math.sin((x + j) * 1.7) * 1.5 + Math.sin((x + j) * 3.1) * 1.0;
          const p = j / qi; let y = cy + fib;
          if (p > 0.55 && p < 0.59) y = cy + 10;
          else if (p > 0.59 && p < 0.63) y = cy - 20;
          else if (p > 0.63 && p < 0.67) y = cy + 7;
          pts.push(`${x + j},${y}`);
        }
        x += qi; idx++;
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "flutter") {
      /* Atrial flutter: sawtooth P waves (f-waves), regular ~150 bpm QRS */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const pf = i % 15 / 15; /* f-wave cycle */
        const pq = i % 60 / 60; /* QRS cycle 2:1 */
        let y = cy + (pf < 0.5 ? -6 * pf / 0.5 + 3 : 3 - 3 * (pf - 0.5) / 0.5); /* sawtooth */
        if (pq > 0.55 && pq < 0.59) y = cy + 10;
        else if (pq > 0.59 && pq < 0.63) y = cy - 18;
        else if (pq > 0.63 && pq < 0.67) y = cy + 6;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "wellens") {
      /* Wellens Type B: deep symmetric T inversion in V2-V3, normal ST, normal QRS */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 80 / 80; let y = cy;
        if (p > 0.08 && p < 0.14) y = cy - Math.sin((p - 0.08) / 0.06 * Math.PI) * 3; /* small P */
        else if (p > 0.32 && p < 0.36) y = cy + 4;   /* Q */
        else if (p > 0.36 && p < 0.40) y = cy - 18;  /* R */
        else if (p > 0.40 && p < 0.44) y = cy + 4;   /* S */
        /* Deep symmetric negative T — Wellens */
        else if (p > 0.50 && p < 0.72) y = cy + Math.sin((p - 0.50) / 0.22 * Math.PI) * 16;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "dewinter") {
      /* De Winter: upsloping ST depression + tall symmetric T waves */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 70 / 70; let y = cy;
        if (p > 0.08 && p < 0.14) y = cy - Math.sin((p - 0.08) / 0.06 * Math.PI) * 3;
        else if (p > 0.30 && p < 0.34) y = cy + 10; /* Q dep + ST dep transition */
        else if (p > 0.34 && p < 0.37) y = cy - 16; /* R */
        else if (p > 0.37 && p < 0.44) y = cy + 5 + (p - 0.37) / 0.07 * 5; /* upsloping ST dep */
        /* Tall symmetric T */
        else if (p > 0.52 && p < 0.74) y = cy - Math.sin((p - 0.52) / 0.22 * Math.PI) * 18;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "brugada") {
      /* Brugada Type 1: coved ST elevation with negative T in V1-V2 */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 70 / 70; let y = cy;
        if (p > 0.08 && p < 0.14) y = cy - Math.sin((p - 0.08) / 0.06 * Math.PI) * 3;
        else if (p > 0.30 && p < 0.34) y = cy + 4;
        else if (p > 0.34 && p < 0.37) y = cy - 20; /* R peak */
        /* Coved pattern: descending ST that slopes down slowly to negative T */
        else if (p > 0.37 && p < 0.58) y = cy - 20 + (p - 0.37) / 0.21 * 26; /* descend through baseline */
        else if (p > 0.58 && p < 0.72) y = cy + 6 - Math.sin((p - 0.58) / 0.14 * Math.PI) * 6;
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "wpw") {
      /* WPW: short PR + delta wave slurring into QRS */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 65 / 65; let y = cy;
        if (p > 0.08 && p < 0.14) y = cy - Math.sin((p - 0.08) / 0.06 * Math.PI) * 4; /* P wave */
        /* Very short PR — delta wave slurring directly */
        else if (p > 0.18 && p < 0.26) y = cy - 4 - (p - 0.18) / 0.08 * 14; /* delta slur up */
        else if (p > 0.26 && p < 0.29) y = cy - 22; /* R peak */
        else if (p > 0.29 && p < 0.38) y = cy - 22 + (p - 0.29) / 0.09 * 28; /* wide S */
        else if (p > 0.50 && p < 0.65) y = cy - Math.sin((p - 0.50) / 0.15 * Math.PI) * 6; /* T */
        pts.push(`${i},${y}`);
      }
      out.push("M" + pts.join(" L"));
    } else if (kind === "lbbb") {
      /* LBBB: broad notched R in V5-V6, deep S in V1 */
      const pts = [];
      for (let i = 0; i <= w; i += 1) {
        const p = i % 80 / 80; let y = cy;
        if (p > 0.10 && p < 0.16) y = cy - Math.sin((p - 0.10) / 0.06 * Math.PI) * 3;
        /* No Q, broad M-shaped R (notched) */
        else if (p > 0.28 && p < 0.46) {
          const pp = (p - 0.28) / 0.18;
          y = cy - Math.sin(pp * Math.PI) * 18 + Math.sin(pp * 2 * Math.PI) * 6;
        }
        else if (p > 0.55 && p < 0.72) y = cy + Math.sin((p - 0.55) / 0.17 * Math.PI) * 8; /* discordant T */
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
export function BottomNav({ active, onChange, fabShape = "circle", onFabClick, accent, fabOpen }) {
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
        style={{
          width: fabWidth, height: 60, borderRadius: fabRadius,
          background: fabOpen ? '#B02020' : (accent || "var(--danger)"),
          animation: fabOpen ? 'none' : undefined,
          transition: 'background 200ms var(--ease-out)',
        }}
        onClick={onFabClick}
        aria-label="Code Blue">
        <span key={String(fabOpen)} style={{ display: 'inline-flex', animation: 'acls-fade-in 150ms var(--ease-out) both' }}>
          {fabOpen ? <Icons.cross size={24} stroke={2.4}/> : <Icons.boltFill size={26}/>}
        </span>
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

// AHA 2025: VF/pVT path — 6 langkah, loop kembali ke index 2 (Shock = AHA Step 5)
const VF_STEPS = [
  { kind:'shock', title:'Shock pertama (AHA Step 3)',         sub:'120–200J bifasik · 360J monofasik · pastikan semua menjauh',  cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit + IV/IO access (Step 4)',sub:'Bag-mask + O₂ · pasang IV/IO · pantau EtCO₂ · 100–120/mnt',  auto:true   },
  { kind:'shock', title:'Shock kedua (AHA Step 5)',           sub:'120–200J bifasik · 360J monofasik',                            cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit (Step 6)',               sub:'Epi 1mg q3–5 mnt · pertimbangkan intubasi/SGA · capnografi',   auto:true,  actions:['epi','airway'] },
  { kind:'shock', title:'Shock ketiga (AHA Step 7)',          sub:'120–200J bifasik · 360J monofasik',                            cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit (Step 8)',               sub:'Amiodarone 300mg IV/IO bolus · cari & atasi Hs & Ts',          auto:true,  actions:['amio','epi'] },
  // Setelah index 5: rhythm check → VF → wrap ke index 2 (Shock = Step 5)
];

// AHA 2025: PEA/Asistol path — Epi ASAP pertama, 3 langkah, loop ke index 1 (CPR = Step 10)
const PEA_STEPS = [
  { kind:'drug',  title:'Epinefrin ASAP (Step 9)',             sub:'1 mg IV/IO sesegera mungkin — prioritas pertama sebelum CPR 2 mnt', cta:'epi', urgent:true },
  { kind:'cpr',   title:'CPR 2 menit + IV/IO access (Step 10)',sub:'Epi 1mg q3–5 mnt · pertimbangkan intubasi/SGA · capnografi',        auto:true,  actions:['epi','airway'] },
  { kind:'cpr',   title:'CPR 2 menit (Step 11)',               sub:'Cari & atasi penyebab reversibel · Hs & Ts · Epi q3–5 mnt',          auto:true,  actions:['epi'] },
  // Setelah index 2: rhythm check → no ROSC → wrap ke index 1 (CPR = Step 10)
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

// Hanya 2 irama aktual — dipakai di rhythmCheck dan confirmRhythm picker
const RHYTHM_OPTS = [
  { key: "shockable",    label: "VF / pVT",       sub: "Irama shockable — defibrilasi segera",  color: "var(--danger)" },
  { key: "nonshockable", label: "PEA / Asistol",  sub: "Irama non-shockable — Epi ASAP",        color: "var(--info)" },
];

// Setup screen: 2 irama + state pra-keputusan (monitor belum terpasang)
const SETUP_OPTS = [
  ...RHYTHM_OPTS,
  { key: "awaiting", label: "Belum terpasang", sub: "AHA Box 1 — CPR sambil pasang monitor", color: "var(--label-secondary)" },
];

// AHA 2025 Box 1: CPR berlangsung sambil monitor dipasang — state pra-keputusan
const AWAIT_STEPS = [
  { kind:'cpr', title:'CPR berkualitas tinggi (AHA Box 1)', sub:'100–120/mnt · kedalaman 5–6 cm · BVM + O₂ · rasio 30:2', auto:true },
  { kind:'cpr', title:'Pasang monitor/defibrilator', sub:'Tempel pad anterior-lateral · jangan tunda CPR — pemasangan paralel', auto:true },
  { kind:'opt', title:'Akses IV/IO', sub:'Sambil CPR berlangsung · siapkan jalur untuk obat', auto:true },
];


function StepCard({ step, idx }) {
  const colMap = { shock:'var(--danger)', drug:'var(--warning)', opt:'var(--label-tertiary)', cpr:'var(--info)' };
  const lblMap = { shock:'Shock', drug:'Obat', opt:'Opsional', cpr:'CPR Aktif' };
  const color = colMap[step.kind] || 'var(--accent)';
  return (
    <div className="acls-step-card" style={{ borderLeft:`3px solid ${color}` }}>
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

export function CPRTimer({ onClose, isMobile = true, initialRhythm }) {
  const [phase, setPhase] = useState("setup");
  const [rhythm, setRhythm] = useState(null);

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [epiNextMs, setEpiNextMs] = useState(null);
  const [shocks, setShocks] = useState(0);
  const [amio, setAmio] = useState(0);
  const [intubated, setIntubated] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('acls_sound_enabled') === '1'; } catch { return false; }
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [pulseCheckOpen, setPulseCheckOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [shockCharging, setShockCharging] = useState(false);
  const [shockFlash, setShockFlash] = useState(false);
  const [pulseCountdown, setPulseCountdown] = useState(null);
  const [rhythmPickerOpen, setRhythmPickerOpen] = useState(false);

  const wallStartRef = useRef(null);
  const lastCycleRef = useRef(1);
  const epiAlertedRef = useRef(false);
  const shockTimeoutRef = useRef(null);
  const wasRunningRef = useRef(false);

  const nowWall = (offsetMs = 0) => {
    if (!wallStartRef.current) return "--:--:--";
    const t = new Date(wallStartRef.current.getTime() + offsetMs);
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
  };

  const [log, setLog] = useState([]);

  const startCPR = (selected) => {
    setStepIdx(0);
    wallStartRef.current = new Date();

    if (selected === 'awaiting') {
      // AHA Box 1: CPR dimulai tanpa konfirmasi irama — monitor sedang dipasang
      setRhythm(null);
      setPhase('unknownRhythm');
      setRunning(true);
      setEpiNextMs(null);
      setLog([
        { t: 0, wall: nowWall(0), action: 'CPR dimulai (AHA Box 1)', tone: 'info' },
        { t: 0, wall: nowWall(0), action: 'Pasang monitor segera — CPR jangan berhenti', tone: 'warn' },
      ]);
      return;
    }

    setRhythm(selected);
    setPhase('active');
    setRunning(true);
    const label = RHYTHM_OPTS.find(r => r.key === selected)?.label || selected;
    setLog([
      { t: 0, wall: nowWall(0), action: 'CPR dimulai', tone: 'info' },
      { t: 0, wall: nowWall(0), action: `Irama awal: ${label}`, tone: selected === 'shockable' ? 'danger' : 'info' },
    ]);
    if (selected === 'shockable') {
      setTimeout(() => setLog(l => [...l, { t: 0, wall: nowWall(0), action: 'Defibrilasi segera — siapkan defibrilator', tone: 'danger' }]), 100);
      setEpiNextMs(null); // VF/pVT: Epi di-arm setelah shock #2 (AHA Step 6)
    } else {
      setEpiNextMs(0); // PEA/Asistol: Epi ASAP (AHA Box 9)
    }
  };

  useEffect(() => {
    if (initialRhythm) startCPR(initialRhythm);
  }, []);

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

  // Sync sfx/haptic master toggle + localStorage persist
  useEffect(() => {
    try { localStorage.setItem('acls_sound_enabled', soundOn ? '1' : '0'); } catch (_) {}
    sfx.setEnabled(soundOn);
    haptic.setEnabled(soundOn);
  }, [soundOn]);

  // Cleanup shock charge timeout on unmount
  useEffect(() => {
    return () => { if (shockTimeoutRef.current) clearTimeout(shockTimeoutRef.current); };
  }, []);

  // 2-min cycle → rhythmCheck (only in active phase — unknownRhythm does NOT auto-transition)
  useEffect(() => {
    if (phase !== 'active') return;
    if (cycles !== lastCycleRef.current && cycles > 1) {
      lastCycleRef.current = cycles;
      setRunning(false);
      setPhase('rhythmCheck');
      sfx.cycleEnd();
      haptic.cycleEnd();
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
      setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: "⚠ Epinefrin berikutnya jatuh tempo", tone: "warn" }]);
      sfx.epiDue();
      haptic.epiDue();
    }
    if (epiNextMs != null && epiRemainMs > 0) epiAlertedRef.current = false;
  }, [epiReady, epiNextMs, epiRemainMs]);

  // VF/pVT: arm Epi setelah shock #2 masuk step 3 (AHA Box 6)
  useEffect(() => {
    if (rhythm === 'shockable' && phase === 'active' && stepIdx === 3 && epiNextMs === null) {
      setEpiNextMs(0);
    }
  }, [stepIdx, rhythm, phase, epiNextMs]);

  // Pulse check countdown — ticks tiap detik, pause timer CPR selama check
  useEffect(() => {
    if (pulseCountdown === null || pulseCountdown <= 0) return;
    const id = setTimeout(() => {
      const next = pulseCountdown - 1;
      setPulseCountdown(next);
      if (next > 0) {
        if (next <= 3) { sfx.pulseTickUrgent(); } else { sfx.pulseTick(); }
        haptic.pulseTick();
      } else {
        sfx.pulseEnd();
        haptic.pulseEnd();
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [pulseCountdown]);

  const steps =
    phase === 'unknownRhythm' ? AWAIT_STEPS :
    rhythm === 'shockable'   ? VF_STEPS    :
    rhythm === 'nonshockable'? PEA_STEPS   :
    AWAIT_STEPS; // fallback aman
  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const curStep = steps[safeIdx];
  // unknownRhythm: stay at last step; VF: loop ke shock #5 (idx 2); PEA: loop ke CPR (idx 1)
  const wrapIdx =
    phase === 'unknownRhythm' ? steps.length - 1 :
    rhythm === 'shockable'   ? 2 : 1;
  const advanceStep = () => setStepIdx(idx => {
    const next = idx + 1;
    return next >= steps.length ? wrapIdx : next;
  });

  // Transition dari unknownRhythm → active setelah monitor terpasang
  const confirmRhythmFromUnknown = (selectedRhythm) => {
    setRhythm(selectedRhythm);
    setStepIdx(0);
    setPhase('active');
    setElapsedMs(0);
    lastCycleRef.current = 1;
    wallStartRef.current = new Date();
    const label = RHYTHM_OPTS.find(r => r.key === selectedRhythm)?.label || selectedRhythm;
    setLog(l => [...l, { t: 0, wall: nowWall(0), action: `Monitor terpasang · irama: ${label}`, tone: selectedRhythm === 'shockable' ? 'danger' : 'info' }]);
    if (selectedRhythm === 'nonshockable') {
      setEpiNextMs(0); // Epi ASAP untuk PEA/Asistol
    } else {
      setEpiNextMs(null); // VF: arm setelah shock #2
    }
    setRhythmPickerOpen(false);
    sfx.monitorOn();
    haptic.monitorOn();
  };

  // Shock handler: charge 1.8s → auto-deliver + screen flash
  const handleShock = () => {
    if (shockCharging) return;
    const shockNum = shocks + 1;
    setShockCharging(true);
    sfx.shockCharge();
    shockTimeoutRef.current = setTimeout(() => {
      sfx.shockDeliver();
      haptic.shock();
      setShockFlash(true);
      setTimeout(() => setShockFlash(false), 200);
      setShockCharging(false);
      setShocks(s => s + 1);
      const now = new Date();
      const wall = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const tSec = wallStartRef.current ? Math.floor((now - wallStartRef.current) / 1000) : 0;
      setLog(l => [...l, { t: tSec, wall, action: `Defibrilasi ${shockNum} — 120-200J bifasik / 360J monofasik`, tone: 'danger' }]);
      advanceStep();
    }, 1800);
  };

  // Epi handler — isAsap: pada drug step (advances step), false: pada cpr step (tidak advance)
  const handleEpi = (isAsap = false) => {
    const doseNum = epiDoses + 1;
    setEpiDoses(doseNum);
    setEpiNextMs(elapsedMs + 180000);
    epiAlertedRef.current = false;
    addLog(`Epinefrin ${doseNum}mg IV/IO${isAsap ? ' — SEGERA' : ''}`, 'warn');
    sfx.epi();
    haptic.epi();
    if (isAsap) advanceStep();
  };

  // Amio handler
  const handleAmio = () => {
    const dose = amio === 0 ? '300mg' : '150mg';
    setAmio(a => a + 1);
    addLog(`Amiodarone ${dose} IV/IO bolus`, 'info');
    sfx.amio();
    haptic.amio();
  };

  // Pulse check: pause timer, start 10-sec countdown
  const openPulseCheck = () => {
    wasRunningRef.current = running;
    setRunning(false);
    setPulseCountdown(10);
    setPulseCheckOpen(true);
    addLog('Cek nadi & irama ≤ 10 dtk', 'info');
  };
  const closePulseCheck = () => {
    setPulseCheckOpen(false);
    setPulseCountdown(null);
    if (wasRunningRef.current) setRunning(true);
  };

  const handleRhythmResult = (result) => {
    if (result === "rosc") {
      addLog("ROSC tercapai — alihkan ke post-cardiac arrest care", "success");
      setPhase("active");
      setRunning(false);
      return;
    }
    const label = RHYTHM_OPTS.find(r => r.key === result)?.label || result;
    setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action: `Cek irama siklus ${cycles}: ${label}`, tone: result === "shockable" ? "danger" : "info" }]);
    if (result !== rhythm) {
      setRhythm(result);
      // VF→PEA: Go to Step 10 = PEA[1] (CPR 2 mnt + Epi + Airway)
      // PEA→VF: Go to Step 5  = VF[2]  (Shock)
      setStepIdx(result === 'shockable' ? 2 : 1);
    } else {
      setStepIdx(idx => {
        const newSteps = result === 'shockable' ? VF_STEPS : PEA_STEPS;
        const wrapI = result === 'shockable' ? 2 : 1;
        const next = idx + 1;
        return next >= newSteps.length ? wrapI : next;
      });
    }
    setPhase("active");
    setRunning(true);
  };

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
          <div className="t-title-2" style={{ marginBottom: 4 }}>Bagaimana memulai?</div>
          <div className="t-footnote" style={{ color: "var(--label-secondary)", marginBottom: 20 }}>
            Pilih sesuai kondisi saat ini — monitor sudah menunjukkan irama, atau masih dipasang
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SETUP_OPTS.map(opt => (
              <button key={opt.key} onClick={() => startCPR(opt.key)}
                style={{ padding: "16px 18px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1), 0 0 0 0.5px " + opt.color + "40", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: opt.color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {opt.key === "shockable"    && <Icons.boltFill size={22} style={{ color: "#fff" }}/>}
                  {opt.key === "nonshockable" && <Icons.flatline size={22} stroke={2.2} style={{ color: "#fff" }}/>}
                  {opt.key === "awaiting"     && <Icons.heart size={22} stroke={2} style={{ color: "#fff" }}/>}
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

  /* === UNKNOWN RHYTHM PHASE — AHA Box 1 (monitor belum terpasang) === */
  if (phase === 'unknownRhythm') {
    return (
      <>
      <div className="cpr-workspace">
        <div className="cpr-header">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px 4px", gap:8 }}>
            <button onClick={onClose} className="ios-btn plain" style={{ height:32, padding:0, color:"var(--label-secondary)", fontSize:15 }}>
              <Icons.chevL size={18}/><span style={{ marginLeft:-2 }}>Keluar</span>
            </button>
            <div className="t-caption-2" style={{ color:"var(--info)", letterSpacing:0.5, whiteSpace:"nowrap" }}>
              <span style={{ display:"inline-block", width:7, height:7, borderRadius:4, background:"var(--info)", marginRight:5, verticalAlign:"middle", animation:"acls-blink 1s infinite" }}/>
              CODE BLUE · BOX 1
            </div>
            <button onClick={() => setSoundOn(s => !s)} style={{ display:'inline-flex', alignItems:'center', gap:4, height:28, padding:'0 10px', borderRadius:8, background:soundOn?'rgba(255,59,48,0.15)':'var(--fill-tertiary)', border:0, cursor:'pointer', flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn?'var(--danger)':'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {soundOn?<><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>:<><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
              </svg>
              <span style={{ fontSize:11, fontWeight:600, color:soundOn?'var(--danger)':'var(--label-secondary)', whiteSpace:'nowrap' }}>
                {soundOn ? `♩ ${CPR_BPM} BPM` : 'SENYAP'}
              </span>
            </button>
          </div>

          <StepCard step={curStep} idx={safeIdx}/>

          <div style={{ padding:"4px 16px 8px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"center" }}>
              <div>
                <div className="t-caption-2" style={{ color:"var(--label-secondary)" }}>DURASI CPR</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:32, fontWeight:700, color:"var(--label-primary)", lineHeight:1.1, fontFeatureSettings:'"tnum"', marginTop:1, letterSpacing:"-0.02em" }}>
                  {fmt(elapsed)}
                </div>
                <div className="t-caption-2" style={{ color:"var(--label-secondary)", marginTop:2 }}>siklus ke-{cycles}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div className="t-caption-2" style={{ color:"var(--label-secondary)" }}>TARGET</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:600, fontFeatureSettings:'"tnum"', marginTop:1, color:"var(--warning)" }}>Cek irama</div>
              </div>
            </div>
          </div>

          <div style={{ padding:"0 20px 12px", display:"flex", gap:10 }}>
            <button className="ios-btn gray sm" style={{ height:36, flex:1 }} onClick={() => setRunning(r => !r)}>
              {running ? <><Icons.pause size={13}/> Jeda</> : <><Icons.play size={13}/> Lanjut</>}
            </button>
          </div>
        </div>

        {/* Primary CTA — Monitor terpasang */}
        <div style={{ padding:'6px 16px 8px', display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
          <button onClick={() => setRhythmPickerOpen(true)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:16, background:'linear-gradient(135deg,var(--info),#005FCC)', color:'#fff', border:0, cursor:'pointer', boxShadow:'0 6px 18px rgba(0,122,255,0.30)', minHeight:70 }}>
            <Icons.check size={28} stroke={2.8}/>
            <div style={{ textAlign:'left', flex:1 }}>
              <div className="t-title-3" style={{ color:'#fff' }}>Monitor terpasang — cek irama</div>
              <div className="t-caption-2" style={{ opacity:0.88 }}>Ketuk untuk konfirmasi irama dan lanjutkan protokol</div>
            </div>
            <Icons.chevR size={16} stroke={2.2}/>
          </button>

          {/* CPR running indicator */}
          <div style={{ padding:'9px 13px', borderRadius:12, background:'var(--bg-tertiary)', boxShadow:'var(--shadow-1)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:9, height:9, borderRadius:5, background:'var(--info)', animation:'acls-blink 1s infinite', flexShrink:0 }}/>
            <span className="t-caption-1" style={{ color:'var(--info)', fontWeight:600, flex:1 }}>CPR berjalan · 100–120/mnt · jangan hentikan</span>
          </div>

          {/* Intubasi */}
          {!intubated && (
            <button className="cpr-action intubate" style={{ width:'100%', flexDirection:'row', alignItems:'center', gap:12, minHeight:52, padding:'10px 16px' }}
              onClick={() => { setIntubated(true); addLog('Intubasi ETT / SGA · konfirmasi EtCO₂ + auskultasi', 'info'); }}>
              <Icons.lungs size={22} stroke={2}/>
              <div style={{ textAlign:'left' }}>
                <div className="t-headline" style={{ color:'#fff' }}>Intubasi ETT / SGA</div>
                <div className="t-caption-2" style={{ opacity:0.85 }}>EtCO₂ · ventilasi 1×/6 dtk saat CPR kontinu</div>
              </div>
            </button>
          )}
          {intubated && (
            <div style={{ padding:'8px 12px', borderRadius:10, background:'rgba(52,199,89,0.10)', boxShadow:'0 0 0 0.5px rgba(52,199,89,0.4)', display:'flex', alignItems:'center', gap:8 }}>
              <Icons.check size={14} stroke={2.5} style={{ color:'var(--success)', flexShrink:0 }}/>
              <span className="t-caption-1" style={{ color:'var(--success)', fontWeight:600 }}>Airway lanjut terpasang · ventilasi 1×/6 dtk</span>
            </div>
          )}

          {/* Secondary row */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="cpr-action pulse" style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8, minHeight:44, padding:'8px 14px' }}
              onClick={openPulseCheck}>
              <Icons.heart size={18} stroke={2}/>
              <span className="t-caption-1" style={{ fontWeight:600, color:'#fff', whiteSpace:'nowrap' }}>Cek nadi</span>
            </button>
            <button className="cpr-action rosc" style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8, minHeight:44, padding:'8px 14px' }}
              onClick={() => { addLog('ROSC tercapai · post-cardiac arrest', 'success'); setRunning(false); sfx.rosc(); haptic.rosc(); }}>
              <Icons.check size={18} stroke={2.6}/>
              <span className="t-caption-1" style={{ fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>ROSC</span>
            </button>
          </div>
        </div>

        <div className="cpr-log">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px 4px' }}>
            <div className="t-caption-2" style={{ color:"var(--label-secondary)" }}>LOG KEJADIAN</div>
          </div>
          <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:6 }}>
            {[...log].reverse().slice(0,6).map((e,i) => {
              const tc = { info:"var(--label-primary)", warn:"var(--warning)", danger:"var(--danger)", success:"var(--success)" }[e.tone];
              return (
                <div key={i} className="t-footnote" style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"8px 12px", borderRadius:8, background:"var(--bg-tertiary)", boxShadow:"var(--shadow-1)" }}>
                  <span style={{ color:tc, fontWeight:600, flex:1, minWidth:0 }}>{e.action}</span>
                  <span style={{ color:"var(--label-tertiary)", fontFamily:"var(--font-mono)", fontFeatureSettings:'"tnum"', textAlign:"right", flexShrink:0, lineHeight:1.25 }}>
                    <div style={{ color:"var(--label-secondary)", fontWeight:600 }}>{e.wall}</div>
                    <div style={{ fontSize:10, opacity:0.85 }}>+{fmt(e.t)}</div>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rhythm picker modal */}
      {rhythmPickerOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:310, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setRhythmPickerOpen(false)}>
          <div style={{ width:'90%', maxWidth:400, background:'var(--bg-secondary)', borderRadius:20, padding:'24px 20px', animation:'acls-sheet-up 260ms var(--ease-out) both', display:'flex', flexDirection:'column', gap:12 }}
            onClick={e => e.stopPropagation()}>
            <div>
              <div className="t-title-3" style={{ marginBottom:4 }}>Irama yang terdeteksi?</div>
              <div className="t-footnote" style={{ color:'var(--label-secondary)' }}>Monitor terpasang — pilih irama untuk lanjutkan protokol</div>
            </div>
            {RHYTHM_OPTS.map(opt => (
              <button key={opt.key} onClick={() => confirmRhythmFromUnknown(opt.key)}
                style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-tertiary)', boxShadow:`var(--shadow-1), 0 0 0 0.5px ${opt.color}40`, textAlign:'left', border:0, cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:opt.color, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {opt.key === 'shockable' ? <Icons.boltFill size={22} style={{ color:'#fff' }}/> : <Icons.flatline size={22} stroke={2.2} style={{ color:'#fff' }}/>}
                </div>
                <div>
                  <div className="t-headline" style={{ color:opt.color }}>{opt.label}</div>
                  <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:2 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
            <button onClick={() => setRhythmPickerOpen(false)}
              style={{ height:36, width:'100%', borderRadius:10, background:'var(--fill-tertiary)', color:'var(--label-secondary)', fontSize:13, fontWeight:600, border:0, cursor:'pointer' }}>
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Pulse Check Modal with countdown */}
      {pulseCheckOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:310, background:'rgba(0,0,0,0.52)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={closePulseCheck}>
          <div style={{ width:'90%', maxWidth:400, background:'var(--bg-secondary)', borderRadius:20, padding:'24px 20px', animation:'acls-sheet-up 260ms var(--ease-out) both', display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}
            onClick={e => e.stopPropagation()}>
            <div className="t-title-3">Cek Nadi</div>
            {/* Ring countdown */}
            <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="120" height="120" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--fill-tertiary)" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={314}
                  strokeDashoffset={314 * (1 - (pulseCountdown ?? 0) / 10)}
                  style={{ transition:'stroke-dashoffset 1s linear, stroke 300ms' }}/>
              </svg>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:36, fontWeight:700, color:pulseCountdown > 3?'var(--success)':pulseCountdown>0?'var(--warning)':'var(--danger)', lineHeight:1 }}>{pulseCountdown ?? 0}</div>
                <div style={{ fontSize:10, color:'var(--label-tertiary)', marginTop:2 }}>dtk</div>
              </div>
            </div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', textAlign:'center' }}>Raba arteri karotis · jangan &gt; 10 detik</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }}>
              <button onClick={() => { setRhythmPickerOpen(true); closePulseCheck(); }}
                style={{ padding:'14px 18px', borderRadius:14, background:'rgba(52,199,89,0.12)', boxShadow:'0 0 0 1px rgba(52,199,89,0.5)', border:0, cursor:'pointer', display:'flex', alignItems:'center', gap:12, textAlign:'left' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'var(--success)', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icons.check size={20} stroke={2.6} style={{ color:'#fff' }}/>
                </div>
                <div>
                  <div className="t-headline" style={{ color:'var(--success)' }}>Ada nadi — konfirmasi irama</div>
                  <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginTop:1 }}>Pilih irama untuk lanjut atau ROSC</div>
                </div>
              </button>
              <button onClick={closePulseCheck}
                style={{ height:40, width:'100%', borderRadius:10, background:'var(--fill-tertiary)', color:'var(--label-secondary)', fontSize:13, fontWeight:600, border:0, cursor:'pointer' }}>
                Tidak ada nadi — lanjut CPR
              </button>
            </div>
          </div>
        </div>
      )}
      </>
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
            <div className="t-caption-2" style={{ color: "var(--info)", fontWeight: 700, marginBottom: 4 }}>LANGKAH BERIKUTNYA (AHA 2025)</div>
            <div className="t-caption-1" style={{ color: "var(--label-secondary)", lineHeight: 1.6 }}>
              {rhythm === "shockable" ? (
                <>
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>Jika masih VF/pVT:</span> Defibrilasi (Step 5) → CPR 2 mnt + Epi q3-5 mnt{shocks >= 2 ? " + Amiodarone 300mg" : ""}{"\n"}
                  <span style={{ color: "var(--info)", fontWeight: 600 }}>Jika non-shockable:</span> Lanjut ke Step 10 → CPR 2 mnt + Epi + Pertimbangkan airway
                </>
              ) : rhythm === "nonshockable" ? (
                <>
                  <span style={{ color: "var(--info)", fontWeight: 600 }}>Jika masih PEA/Asistol:</span> CPR 2 mnt + Epi q3-5 mnt + Cari & atasi Hs & Ts{"\n"}
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>Jika shockable:</span> Lanjut ke Step 5 → Defibrilasi segera
                </>
              ) : "Identifikasi irama sesegera mungkin · pastikan CPR berkualitas tinggi"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* === ACTIVE CPR PHASE — DESKTOP 2-COLUMN === */
  if (!isMobile) {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header row — full width */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '0.5px solid var(--separator)', flexShrink: 0, gap: 8 }}>
            <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: 'var(--label-secondary)', fontSize: 15 }}>
              <Icons.chevL size={18}/><span style={{ marginLeft: -2 }}>Keluar</span>
            </button>
            <div className="t-caption-2" style={{ color: 'var(--danger)', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: 'var(--danger)', marginRight: 5, verticalAlign: 'middle', animation: 'acls-blink 1s infinite' }}/>
              CODE BLUE
            </div>
            <button onClick={() => setSoundOn(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 8, background: soundOn ? 'rgba(255,59,48,0.15)' : 'var(--fill-tertiary)', border: 0, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn ? 'var(--danger)' : 'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {soundOn ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
                {soundOn ? `♩ ${CPR_BPM} BPM` : 'SENYAP'}
              </span>
            </button>
          </div>

          {/* 2-column body */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
            {/* LEFT: step + timer + actions */}
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StepCard step={curStep} idx={safeIdx}/>

              {/* Timer block */}
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>SIKLUS 2 MNT</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 700, color: cycleRemainingMs < 15000 ? 'var(--danger)' : 'var(--label-primary)', lineHeight: 1.1, fontFeatureSettings: '"tnum"', marginTop: 1, letterSpacing: '-0.02em' }}>
                      {fmtMs(cycleRemainingMs)}
                    </div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>tersisa · siklus {cycles}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>TOTAL</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 1 }}>{fmt(elapsed)}</div>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--fill-tertiary)', marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: cycleProgress * 100 + '%', background: cycleRemainingMs < 15000 ? 'var(--danger)' : 'var(--success)', borderRadius: 3, transition: 'width 50ms linear, background var(--dur-fast)' }}/>
                </div>
              </div>

              {/* Pause / Reset */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ios-btn gray sm" style={{ height: 40, flex: 1 }} onClick={() => setRunning(r => !r)}>
                  {running ? <><Icons.pause size={14}/> Jeda</> : <><Icons.play size={14}/> Lanjut</>}
                </button>
                <button className="ios-btn gray sm" style={{ height: 40, flex: 1 }} onClick={() => { setElapsedMs(0); lastCycleRef.current = 1; }}>
                  <Icons.reset size={14}/> Reset
                </button>
              </div>

              {/* Contextual actions */}
              <div key={stepIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'acls-fadeslide 200ms var(--ease-out) both' }}>
                {curStep.kind === 'shock' && (
                  <button className="cpr-action shock" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: '14px 18px', opacity: shockCharging ? 0.8 : 1 }}
                    onClick={handleShock} disabled={shockCharging}>
                    <Icons.boltFill size={32} style={{ animation: shockCharging ? 'acls-blink 0.4s infinite' : 'none' }}/>
                    <div style={{ textAlign: 'left' }}>
                      {shockCharging ? (
                        <>
                          <div className="t-title-3" style={{ color: '#fff' }}>CHARGING... 200J</div>
                          <div className="t-caption-2" style={{ opacity: 0.88 }}>Pastikan semua menjauh!</div>
                        </>
                      ) : (
                        <>
                          <div className="t-title-3" style={{ color: '#fff' }}>Defibrilasi</div>
                          <div className="t-caption-2" style={{ opacity: 0.88 }}>Bifasik 120–200J · Monofasik 360J</div>
                          <div className="t-caption-2" style={{ opacity: 0.72, marginTop: 1 }}>{shocks > 0 ? `${shocks}× sudah · ` : ''}Tandai &amp; lanjut →</div>
                        </>
                      )}
                    </div>
                  </button>
                )}
                {curStep.kind === 'drug' && curStep.cta === 'epi' && (
                  <button className={"cpr-action epi" + (curStep.urgent ? " epi-ready" : "")} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 70, padding: '14px 18px' }}
                    onClick={() => handleEpi(true)}>
                    <Icons.pill size={32} stroke={2}/>
                    <div style={{ textAlign: 'left' }}>
                      <div className="t-title-3" style={{ color: '#fff' }}>{curStep.urgent ? '⚡ Epinefrin ASAP' : 'Epinefrin 1 mg IV/IO'}</div>
                      <div className="t-caption-2" style={{ opacity: 0.85 }}>1 mg IV/IO · Dosis #{epiDoses + 1} · Tandai &amp; lanjut →</div>
                    </div>
                  </button>
                )}
                {curStep.kind === 'cpr' && (
                  <>
                    <div style={{ padding: '9px 13px', borderRadius: 12, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--info)', animation: 'acls-blink 1s infinite', flexShrink: 0 }}/>
                      <span className="t-caption-1" style={{ color: 'var(--info)', fontWeight: 600, flex: 1 }}>CPR berjalan · cek irama saat timer selesai</span>
                      {epiNextMs != null && !epiReady && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>Epi {fmt(Math.ceil(epiRemainMs / 1000))}</span>
                      )}
                    </div>
                    {curStep.actions?.includes('epi') && (
                      <button className={"cpr-action epi" + (epiReady ? " epi-ready" : "")} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px' }}
                        onClick={() => handleEpi(false)}>
                        <Icons.pill size={22} stroke={2}/>
                        <div style={{ textAlign: 'left' }}>
                          <div className="t-headline" style={{ color: '#fff' }}>Epinefrin 1 mg IV/IO</div>
                          <div className="t-caption-2" style={{ opacity: 0.85 }}>
                            {epiNextMs == null ? 'Dosis pertama — berikan segera' : epiReady ? '⚠ Jatuh tempo — berikan segera!' : `Next: ${fmt(Math.ceil(epiRemainMs / 1000))} · dosis #${epiDoses + 1}`}
                          </div>
                        </div>
                      </button>
                    )}
                    {curStep.actions?.includes('amio') && (
                      <button className="cpr-action midaz" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(180deg,#5856D6,#3B39B8)' }}
                        onClick={handleAmio}>
                        <Icons.syringe size={22} stroke={2}/>
                        <div style={{ textAlign: 'left' }}>
                          <div className="t-headline" style={{ color: '#fff' }}>Amiodarone {amio === 0 ? '300 mg' : '150 mg'} IV/IO</div>
                          <div className="t-caption-2" style={{ opacity: 0.85 }}>atau Lidokain 1–1.5 mg/kg bolus</div>
                        </div>
                      </button>
                    )}
                    {curStep.actions?.includes('airway') && !intubated && (
                      <button className="cpr-action intubate" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px' }}
                        onClick={() => { setIntubated(true); addLog('Intubasi ETT / SGA · konfirmasi EtCO₂ + auskultasi', 'info'); }}>
                        <Icons.lungs size={22} stroke={2}/>
                        <div style={{ textAlign: 'left' }}>
                          <div className="t-headline" style={{ color: '#fff' }}>Intubasi ETT / SGA</div>
                          <div className="t-caption-2" style={{ opacity: 0.85 }}>EtCO₂ · ventilasi 1×/6 dtk saat CPR kontinu</div>
                        </div>
                      </button>
                    )}
                    {curStep.actions?.includes('airway') && intubated && (
                      <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(52,199,89,0.10)', boxShadow: '0 0 0 0.5px rgba(52,199,89,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.check size={14} stroke={2.5} style={{ color: 'var(--success)', flexShrink: 0 }}/>
                        <span className="t-caption-1" style={{ color: 'var(--success)', fontWeight: 600 }}>Airway lanjut terpasang · ventilasi 1×/6 dtk</span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cpr-action pulse" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
                    onClick={openPulseCheck}>
                    <Icons.heart size={18} stroke={2}/>
                    <span className="t-caption-1" style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Cek nadi</span>
                  </button>
                  <button className="cpr-action rosc" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
                    onClick={() => { addLog('ROSC tercapai · post-cardiac arrest', 'success'); setRunning(false); sfx.rosc(); haptic.rosc(); }}>
                    <Icons.check size={18} stroke={2.6}/>
                    <span className="t-caption-1" style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>ROSC</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: log — all entries, scrollable */}
            <div style={{ borderLeft: '0.5px solid var(--separator)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--separator)', flexShrink: 0 }}>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>LOG KEJADIAN</div>
                <span className="t-caption-2" style={{ color: 'var(--label-tertiary)' }}>{log.length} item</span>
              </div>
              <div style={{ overflowY: 'auto', padding: '8px 12px 20px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {[...log].reverse().map((e, i) => {
                  const tc = { info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' }[e.tone];
                  return (
                    <div key={i} className="t-footnote" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)' }}>
                      <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                      <span style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum"', textAlign: 'right', flexShrink: 0, lineHeight: 1.25 }}>
                        <div style={{ color: 'var(--label-secondary)', fontWeight: 600 }}>{e.wall}</div>
                        <div style={{ fontSize: 10, opacity: 0.85 }}>+{fmt(e.t)}</div>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pulse Check Modal with countdown */}
        {pulseCheckOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={closePulseCheck}>
            <div style={{ width: '90%', maxWidth: 400, background: 'var(--bg-secondary)', borderRadius: 20, padding: '24px 20px', animation: 'acls-sheet-up 260ms var(--ease-out) both', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}
              onClick={e => e.stopPropagation()}>
              <div className="t-title-3">Cek Nadi</div>
              {/* Ring countdown */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--fill-tertiary)" strokeWidth="8"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={314}
                    strokeDashoffset={314 * (1 - (pulseCountdown ?? 0) / 10)}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms' }}/>
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>{pulseCountdown ?? 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--label-tertiary)', marginTop: 2 }}>dtk</div>
                </div>
              </div>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', textAlign: 'center' }}>Raba arteri karotis · jangan &gt; 10 detik</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <button onClick={() => { addLog('ROSC tercapai · post-cardiac arrest care', 'success'); setRunning(false); sfx.rosc(); haptic.rosc(); closePulseCheck(); }}
                  style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(52,199,89,0.12)', boxShadow: '0 0 0 1px rgba(52,199,89,0.5)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icons.check size={20} stroke={2.6} style={{ color: '#fff' }}/>
                  </div>
                  <div>
                    <div className="t-headline" style={{ color: 'var(--success)' }}>Ada nadi — ROSC</div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>Hentikan CPR · mulai post-cardiac arrest care</div>
                  </div>
                </button>
                <button onClick={closePulseCheck}
                  style={{ height: 40, width: '100%', borderRadius: 10, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: 13, fontWeight: 600, border: 0, cursor: 'pointer' }}>
                  Tidak ada nadi — lanjut CPR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shock flash overlay */}
        {shockFlash && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(255,220,0,0.25)', pointerEvents: 'none' }}/>
        )}

        {/* Log Modal */}
        {logModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLogModalOpen(false)}>
            <div style={{ width: '90%', maxWidth: 480, margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 16, maxHeight: '80dvh', display: 'flex', flexDirection: 'column', animation: 'acls-sheet-up 260ms var(--ease-out) both' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px 8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="t-title-3">Log Kejadian ({log.length})</div>
                  <button onClick={() => setLogModalOpen(false)}
                    style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--fill-tertiary)', border: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)' }}>
                    Tutup
                  </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...log].reverse().map((e, i) => {
                  const tc = { info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' }[e.tone];
                  return (
                    <div key={i} className="t-footnote" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)' }}>
                      <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                      <span style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum"', textAlign: 'right', flexShrink: 0, lineHeight: 1.25 }}>
                        <div style={{ color: 'var(--label-secondary)', fontWeight: 600 }}>{e.wall}</div>
                        <div style={{ fontSize: 10, opacity: 0.85 }}>+{fmt(e.t)}</div>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* === ACTIVE CPR PHASE === */
  return (
    <>
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
          <button onClick={() => setSoundOn(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 8, background: soundOn ? 'rgba(255,59,48,0.15)' : 'var(--fill-tertiary)', border: 0, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn ? 'var(--danger)' : 'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {soundOn ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
              {soundOn ? `♩ ${CPR_BPM} BPM` : 'SENYAP'}
            </span>
          </button>
        </div>

        <StepCard step={curStep} idx={safeIdx} />

        <div style={{ padding: "4px 16px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
            <div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>SIKLUS 2 MNT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 700, color: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--label-primary)", lineHeight: 1.1, fontFeatureSettings: '"tnum"', marginTop: 1, letterSpacing: "-0.02em" }}>
                {fmtMs(cycleRemainingMs)}
              </div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 2 }}>tersisa · siklus {cycles}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>TOTAL</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 1 }}>{fmt(elapsed)}</div>
            </div>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "var(--fill-tertiary)", marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: cycleProgress * 100 + "%", background: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--success)", borderRadius: 3, transition: "width 50ms linear, background var(--dur-fast)" }}/>
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
      <div key={stepIdx} style={{ padding: '6px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, animation: 'acls-fadeslide 200ms var(--ease-out) both' }}>

        {/* Shock step — bifasik + monofasik */}
        {curStep.kind === 'shock' && (
          <button className="cpr-action shock" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, padding: '14px 18px', opacity: shockCharging ? 0.8 : 1 }}
            onClick={handleShock} disabled={shockCharging}>
            <Icons.boltFill size={32} style={{ animation: shockCharging ? 'acls-blink 0.4s infinite' : 'none' }}/>
            <div style={{ textAlign: 'left' }}>
              {shockCharging ? (
                <>
                  <div className="t-title-3" style={{ color: '#fff' }}>CHARGING... 200J</div>
                  <div className="t-caption-2" style={{ opacity: 0.88 }}>Pastikan semua menjauh!</div>
                </>
              ) : (
                <>
                  <div className="t-title-3" style={{ color: '#fff' }}>Defibrilasi</div>
                  <div className="t-caption-2" style={{ opacity: 0.88 }}>Bifasik 120–200J · Monofasik 360J</div>
                  <div className="t-caption-2" style={{ opacity: 0.72, marginTop: 1 }}>{shocks > 0 ? `${shocks}× sudah · ` : ''}Tandai &amp; lanjut →</div>
                </>
              )}
            </div>
          </button>
        )}

        {/* Epi ASAP — PEA step 0, urgent pulsing */}
        {curStep.kind === 'drug' && curStep.cta === 'epi' && (
          <button className={"cpr-action epi" + (curStep.urgent ? " epi-ready" : "")} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 70, padding: '14px 18px' }}
            onClick={() => handleEpi(true)}>
            <Icons.pill size={32} stroke={2}/>
            <div style={{ textAlign: 'left' }}>
              <div className="t-title-3" style={{ color: '#fff' }}>{curStep.urgent ? '⚡ Epinefrin ASAP' : 'Epinefrin 1 mg IV/IO'}</div>
              <div className="t-caption-2" style={{ opacity: 0.85 }}>1 mg IV/IO · Dosis #{epiDoses + 1} · Tandai &amp; lanjut →</div>
            </div>
          </button>
        )}

        {/* CPR step — status indicator + secondary actions sesuai step */}
        {curStep.kind === 'cpr' && (
          <>
            <div style={{ padding: '9px 13px', borderRadius: 12, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--info)', animation: 'acls-blink 1s infinite', flexShrink: 0 }}/>
              <span className="t-caption-1" style={{ color: 'var(--info)', fontWeight: 600, flex: 1 }}>CPR berjalan · cek irama saat timer selesai</span>
              {epiNextMs != null && !epiReady && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>Epi {fmt(Math.ceil(epiRemainMs / 1000))}</span>
              )}
            </div>

            {/* Epi — selama step yang butuh epi */}
            {curStep.actions?.includes('epi') && (
              <button className={"cpr-action epi" + (epiReady ? " epi-ready" : "")} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px' }}
                onClick={() => handleEpi(false)}>
                <Icons.pill size={22} stroke={2}/>
                <div style={{ textAlign: 'left' }}>
                  <div className="t-headline" style={{ color: '#fff' }}>Epinefrin 1 mg IV/IO</div>
                  <div className="t-caption-2" style={{ opacity: 0.85 }}>
                    {epiNextMs == null ? 'Dosis pertama — berikan segera' : epiReady ? '⚠ Jatuh tempo — berikan segera!' : `Next: ${fmt(Math.ceil(epiRemainMs / 1000))} · dosis #${epiDoses + 1}`}
                  </div>
                </div>
              </button>
            )}

            {/* Amiodarone — selama step yang butuh amio */}
            {curStep.actions?.includes('amio') && (
              <button className="cpr-action midaz" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(180deg,#5856D6,#3B39B8)' }}
                onClick={handleAmio}>
                <Icons.syringe size={22} stroke={2}/>
                <div style={{ textAlign: 'left' }}>
                  <div className="t-headline" style={{ color: '#fff' }}>Amiodarone {amio === 0 ? '300 mg' : '150 mg'} IV/IO</div>
                  <div className="t-caption-2" style={{ opacity: 0.85 }}>atau Lidokain 1–1.5 mg/kg bolus</div>
                </div>
              </button>
            )}

            {/* Airway — selama step yang include airway */}
            {curStep.actions?.includes('airway') && !intubated && (
              <button className="cpr-action intubate" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px' }}
                onClick={() => { setIntubated(true); addLog('Intubasi ETT / SGA · konfirmasi EtCO₂ + auskultasi', 'info'); }}>
                <Icons.lungs size={22} stroke={2}/>
                <div style={{ textAlign: 'left' }}>
                  <div className="t-headline" style={{ color: '#fff' }}>Intubasi ETT / SGA</div>
                  <div className="t-caption-2" style={{ opacity: 0.85 }}>EtCO₂ · ventilasi 1×/6 dtk saat CPR kontinu</div>
                </div>
              </button>
            )}
            {curStep.actions?.includes('airway') && intubated && (
              <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(52,199,89,0.10)', boxShadow: '0 0 0 0.5px rgba(52,199,89,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.check size={14} stroke={2.5} style={{ color: 'var(--success)', flexShrink: 0 }}/>
                <span className="t-caption-1" style={{ color: 'var(--success)', fontWeight: 600 }}>Airway lanjut terpasang · ventilasi 1×/6 dtk</span>
              </div>
            )}
          </>
        )}

        {/* Secondary row — selalu tersedia */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cpr-action pulse" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
            onClick={openPulseCheck}>
            <Icons.heart size={18} stroke={2}/>
            <span className="t-caption-1" style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Cek nadi</span>
          </button>
          <button className="cpr-action rosc" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, padding: '8px 14px' }}
            onClick={() => { addLog('ROSC tercapai · post-cardiac arrest', 'success'); setRunning(false); sfx.rosc(); haptic.rosc(); }}>
            <Icons.check size={18} stroke={2.6}/>
            <span className="t-caption-1" style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>ROSC</span>
          </button>
        </div>

      </div>

      <div className="cpr-log">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 4px' }}>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>LOG KEJADIAN</div>
          {log.length > 6 && (
            <button onClick={() => setLogModalOpen(true)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', padding: '2px 0' }}>
              Tampilkan semua ({log.length})
            </button>
          )}
        </div>
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

    {/* === Pulse Check Modal with countdown === */}
    {pulseCheckOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={closePulseCheck}>
        <div style={{ width: '90%', maxWidth: 400, background: 'var(--bg-secondary)', borderRadius: 20, padding: '24px 20px', animation: 'acls-sheet-up 260ms var(--ease-out) both', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}
          onClick={e => e.stopPropagation()}>
          <div className="t-title-3">Cek Nadi</div>
          {/* Ring countdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--fill-tertiary)" strokeWidth="8"/>
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={314}
                strokeDashoffset={314 * (1 - (pulseCountdown ?? 0) / 10)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms' }}/>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>{pulseCountdown ?? 0}</div>
              <div style={{ fontSize: 10, color: 'var(--label-tertiary)', marginTop: 2 }}>dtk</div>
            </div>
          </div>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)', textAlign: 'center' }}>Raba arteri karotis · jangan &gt; 10 detik</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button onClick={() => { addLog('ROSC tercapai · post-cardiac arrest care', 'success'); setRunning(false); sfx.rosc(); haptic.rosc(); closePulseCheck(); }}
              style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(52,199,89,0.12)', boxShadow: '0 0 0 1px rgba(52,199,89,0.5)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.check size={20} stroke={2.6} style={{ color: '#fff' }}/>
              </div>
              <div>
                <div className="t-headline" style={{ color: 'var(--success)' }}>Ada nadi — ROSC</div>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>Hentikan CPR · mulai post-cardiac arrest care</div>
              </div>
            </button>
            <button onClick={closePulseCheck}
              style={{ height: 40, width: '100%', borderRadius: 10, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: 13, fontWeight: 600, border: 0, cursor: 'pointer' }}>
              Tidak ada nadi — lanjut CPR
            </button>
          </div>
        </div>
      </div>
    )}

    {/* === Shock flash overlay === */}
    {shockFlash && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(255,220,0,0.25)', pointerEvents: 'none' }}/>
    )}

    {/* === Full Log Modal === */}
    {logModalOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setLogModalOpen(false)}>
        <div style={{ width: '90%', maxWidth: 480, margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 16, maxHeight: '80dvh', display: 'flex', flexDirection: 'column', animation: 'acls-sheet-up 260ms var(--ease-out) both' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ padding: '16px 20px 8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="t-title-3">Log Kejadian ({log.length})</div>
              <button onClick={() => setLogModalOpen(false)}
                style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--fill-tertiary)', border: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)' }}>
                Tutup
              </button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...log].reverse().map((e, i) => {
              const tc = { info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' }[e.tone];
              return (
                <div key={i} className="t-footnote" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)' }}>
                  <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                  <span style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum"', textAlign: 'right', flexShrink: 0, lineHeight: 1.25 }}>
                    <div style={{ color: 'var(--label-secondary)', fontWeight: 600 }}>{e.wall}</div>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>+{fmt(e.t)}</div>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
