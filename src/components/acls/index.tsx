import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, NavBar, SectionHeader } from '../base';
import { sfx } from '../../utils/sfx';
import { haptic } from '../../utils/haptic';
import type { FlowStep as FlowStepType, CprRhythm, LogEntry, Rhythm } from '../../types';

/* ============================================================
   RhythmStrip — inline SVG ECG waveform
   ============================================================ */
export function RhythmStrip({ kind = "sinus", width = 260, height = 56, color = "var(--label-primary)", grid = true }) {
  const segments = useMemo(() => {
    const out = [];
    const w = width;
    const cy = height / 2;
    const seed = (s: number) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
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
   ConductionDiagram — cardiac conduction system schematic
   ============================================================ */
type NodeState = 'active' | 'blocked' | 'ectopic' | 'inactive' | 'dim';
interface ConductionState {
  sa: NodeState; av: NodeState; his: NodeState;
  lbb: NodeState; rbb: NodeState;
  raPath: NodeState; laPath: NodeState;
  rvFill: NodeState; lvFill: NodeState;
  ectopicLabel?: string;
  ectopicPos?: 'rv' | 'lv' | 'ra' | 'la';
  caption?: string;
}
const CD_COLORS: Record<NodeState, string> = {
  active:   '#34C759',
  blocked:  '#FF3B30',
  ectopic:  '#FF9500',
  inactive: 'var(--label-quaternary)',
  dim:      'var(--label-quaternary)',
};
const CONDUCTION_MAP: Record<string, ConductionState> = {
  nsr:      { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'Konduksi Normal' },
  af:       { sa:'inactive', av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'inactive', laPath:'inactive', rvFill:'active', lvFill:'active',
               caption:'Fibrilasi Atrium — SA inaktif, AV konduksi ireguler' },
  flutter:  { sa:'inactive', av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'ectopic', laPath:'inactive', rvFill:'active', lvFill:'active',
               ectopicPos:'ra', ectopicLabel:'Reentry RA',
               caption:'Flutter Atrium — sirkuit reentry RA' },
  svt:      { sa:'inactive', av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'inactive', laPath:'inactive', rvFill:'active', lvFill:'active',
               caption:'SVT — reentry nodal AV' },
  av3:      { sa:'active',   av:'blocked',  his:'inactive', lbb:'inactive', rbb:'inactive',
               raPath:'active', laPath:'active', rvFill:'ectopic', lvFill:'inactive',
               ectopicPos:'rv', ectopicLabel:'Escape IDV',
               caption:'AV Blok Komplit — escape idioventrikular' },
  vt:       { sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
               raPath:'inactive', laPath:'inactive', rvFill:'inactive', lvFill:'ectopic',
               ectopicPos:'lv', ectopicLabel:'Fokus VT',
               caption:'VT Monomorfik — fokus ektopik ventrikel' },
  vf:       { sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
               raPath:'inactive', laPath:'inactive', rvFill:'inactive', lvFill:'inactive',
               caption:'VF — aktivitas chaotic tanpa konduksi terorganisir' },
  torsades: { sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
               raPath:'inactive', laPath:'inactive', rvFill:'inactive', lvFill:'inactive',
               caption:'TdP — VT polimorfik terkait pemanjangan QT' },
  asys:     { sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
               raPath:'inactive', laPath:'inactive', rvFill:'inactive', lvFill:'inactive',
               caption:'Asistol — tidak ada aktivitas listrik' },
  pea:      { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'PEA — konduksi normal, tanpa output mekanik' },
  lbbb:     { sa:'active',   av:'active',   his:'active', lbb:'blocked',  rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'dim',
               caption:'LBBB — LBB terblokir, LV aktif via RBB (lambat)' },
  wpw:      { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'WPW — jalur aksesori + konduksi normal' },
  stemi:    { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'STEMI — konduksi normal, iskemia miokard' },
  hyperk:   { sa:'dim',      av:'dim',      his:'dim',    lbb:'dim',      rbb:'dim',
               raPath:'dim', laPath:'dim', rvFill:'dim', lvFill:'dim',
               caption:'Hiperkalemia — konduksi melambat di seluruh sistem' },
  brugada:  { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'blocked',
               raPath:'active', laPath:'active', rvFill:'dim', lvFill:'active',
               caption:'Brugada — pola RBB + repolarisasi abnormal RV' },
  wellens:  { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'Wellens — konduksi normal, perubahan reperfusi gelombang T' },
  dewinter: { sa:'active',   av:'active',   his:'active', lbb:'active',   rbb:'active',
               raPath:'active', laPath:'active', rvFill:'active', lvFill:'active',
               caption:'De Winter — konduksi normal, pola iskemia LAD proksimal' },
};

export function ConductionDiagram({ rhythmKey }: { rhythmKey: string }): React.ReactElement | null {
  const state = CONDUCTION_MAP[rhythmKey];
  if (!state) return null;
  const c = (s: NodeState) => CD_COLORS[s];

  const on = (s: NodeState) => s === 'active' || s === 'ectopic';
  const cs = (s: NodeState, delay: number): React.CSSProperties =>
    on(s) ? { animationDelay: `${delay}s` } : { display: 'none' };

  // SVG2 "Electrical conduction system of the heart" (Wikipedia)
  // Group transform: translate(124.58977,-184.54849)
  // Content bounds (transformed): x=160-895, y=62-672
  // Key coords (transformed space, used for overlay animation paths):
  //   SA node center: (215, 128)
  //   Internodal end / AV junction: (393, 220)
  //   AV node: (416, 225)
  //   His bifurcation: (445, 335)
  //   LBB endpoint: (617, 342)  RBB endpoint: (599, 381)
  //   Purkinje area: y=520-672

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 14, padding: '12px 14px 8px', boxShadow: 'var(--shadow-1)' }}>
      <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>
        SISTEM KONDUKSI JANTUNG
      </div>

      {/* SVG — viewBox crops the 940×780 SVG2 canvas to just the content area */}
      <svg viewBox="140 55 760 630" width="100%" style={{ display: 'block', overflow: 'visible' }}>

        {/* ── Static background: exact SVG2 paths (group transform applied) ── */}
        <g transform="translate(124.58977,-184.54849)">
          {/* Full conduction schematic shape — dim background */}
          <path
            d="M 256.18852,512.12165 C 256.18852,512.12165 305.45805,470.574 308.64555,435.8715 C 311.3118,406.8015 307.20555,389.93775 314.2893,393.14025 C 317.50305,394.59525 326.3193,420.504 337.9668,435.069 C 349.6218,449.63025 481.21305,572.29275 530.0493,643.69275 C 538.60305,656.20275 593.4018,724.79401 561.5268,762.29401 C 554.87055,770.12776 549.45555,779.72026 534.3393,782.91901 C 519.22305,786.11776 493.5543,782.12401 449.9568,776.64151 C 416.18055,772.39276 393.65055,764.01526 369.3768,763.04776 C 345.1068,762.06526 341.2293,762.07276 325.6893,753.34276 C 310.1568,744.59776 289.77555,735.86776 274.2393,732.94651 C 258.70305,730.03651 243.9768,720.08401 239.12055,716.19526 C 234.2643,712.32151 227.63805,711.58651 227.63805,711.58651 C 227.63805,711.58651 254.8218,730.03651 267.4443,734.89276 C 280.06305,739.74901 303.3618,746.54026 310.1568,750.42151 C 316.95555,754.31026 323.7468,758.19151 323.7468,758.19151 C 323.7468,758.19151 271.1943,751.88401 284.9193,755.27776 C 287.8818,756.00901 322.7793,766.92151 333.45555,765.94651 C 344.13555,764.98276 364.5243,767.89651 375.2043,770.80276 C 385.8843,773.72776 399.47055,773.72776 410.15805,777.60901 C 420.83055,781.49026 440.2518,782.45776 440.2518,782.45776 C 440.2518,782.45776 398.4993,799.94026 374.2293,799.94026 C 374.2293,799.94026 416.94555,797.02276 443.1618,786.34651 C 443.1618,786.34651 451.8993,783.42901 461.6043,785.36401 C 471.3168,787.31401 476.2143,787.60651 479.9643,790.41901 C 479.9643,790.41901 472.64055,801.26401 471.5268,803.54401 C 469.5393,807.61276 466.06305,813.32776 463.7343,815.78026 C 451.5393,828.64276 445.1193,840.94276 445.1193,840.94276 C 445.1193,840.94276 440.5893,846.66901 463.0893,825.10651 C 475.34805,813.35776 481.8393,800.73151 481.8393,800.73151 C 481.8393,800.73151 486.46305,812.33401 488.4018,829.79401 C 490.3443,847.27651 492.3093,851.20276 492.3093,851.20276 C 492.3093,851.20276 494.0268,834.98776 494.0268,826.98151 C 494.0268,816.66901 486.2943,799.04776 493.0893,793.23151 C 493.0893,793.23151 504.88305,816.03901 516.5268,834.48151 C 528.1818,852.93151 530.26305,850.17526 530.26305,850.17526 C 530.26305,850.17526 524.1243,842.37526 521.2143,830.73151 C 519.35805,823.30651 505.4793,802.74151 504.3393,794.16901 C 503.6868,789.27901 512.82555,795.25276 516.5268,792.29401 C 522.77805,787.29526 522.25305,807.68776 546.5268,823.23151 C 570.79305,838.75651 571.58055,838.19026 576.4293,844.02151 C 576.4293,844.02151 562.56555,827.11276 549.9468,815.46526 C 542.29305,808.40026 532.16805,800.40526 533.4018,795.10651 C 534.20055,791.66776 544.2918,791.22526 548.4018,787.60651 C 571.8393,766.98151 603.71427,736.98151 556.21305,666.04275 C 556.21305,666.04275 564.14055,667.299 569.9643,676.044 C 575.79555,684.7665 609.10677,716.08276 615.90177,723.85651 C 622.70052,731.61901 642.76677,760.47151 637.91802,780.87151 C 633.06177,801.25276 608.78427,816.78151 605.87427,835.22401 C 602.96802,853.67401 602.96802,856.59526 602.96802,856.59526 C 602.96802,856.59526 610.47552,822.96526 631.83927,803.54401 C 653.19177,784.12651 641.79927,744.94651 641.79927,744.94651 C 641.79927,744.94651 656.36052,773.10901 656.36052,791.54401 C 656.36052,809.99026 647.76927,821.71276 639.03177,830.45776 C 630.29427,839.19151 625.18302,855.75526 625.18302,855.75526 C 625.18302,855.75526 629.48802,841.25776 649.87302,828.65401 C 649.87302,828.65401 651.40302,841.02526 655.29177,844.91401 C 659.17302,848.80276 647.38677,836.99401 657.09927,816.60901 C 666.80052,796.22776 667.04052,772.12651 653.44677,753.68401 C 653.44677,753.68401 658.30302,759.50776 689.36427,760.47151 C 720.43302,761.45401 711.60177,760.20901 725.75052,762.41026 C 725.75052,762.41026 755.31177,762.02026 700.05177,756.59776 C 644.78052,751.17901 632.08302,721.64026 625.29177,714.84901 C 618.50427,708.054 548.2743,636.02025 533.71305,618.54525 C 519.1443,601.06275 439.10805,513.219 418.71555,496.044 C 394.3068,475.479 352.15305,426.14025 349.23555,417.4065 C 346.31805,408.66525 367.76805,418.8465 386.2143,437.29275 C 404.66055,455.74275 473.19555,517.0665 497.46555,551.04525 C 521.73555,585.02775 592.9143,662.0415 616.21302,678.54525 C 639.51177,695.05275 705.87177,711.94276 733.05177,726.50401 C 760.23177,741.05776 739.96302,724.79401 739.96302,724.79401 C 739.96302,724.79401 730.14552,718.73776 696.16302,706.119 C 696.16302,706.119 719.45802,702.23025 734.02677,690.579 C 748.58052,678.9315 755.18802,688.88025 766.83927,679.16775 C 766.83927,679.16775 753.44427,681.849 739.85052,682.81275 C 739.85052,682.81275 748.58052,668.24025 764.12427,662.424 C 764.12427,662.424 742.75677,673.1115 732.08802,682.81275 C 732.08802,682.81275 703.92552,703.19775 687.42177,700.284 C 670.92177,697.374 642.76677,677.9565 642.76677,677.9565 C 642.76677,677.9565 661.20927,669.2265 671.88927,666.30525 C 682.56552,663.3915 734.02677,669.2265 755.38302,645.924 C 755.38302,645.924 728.19552,662.424 689.36427,657.56775 C 689.36427,657.56775 693.26052,645.924 711.70302,638.15775 C 730.13802,630.38025 763.15677,607.089 769.94427,586.70025 C 769.94427,586.70025 740.81802,631.37025 699.07677,638.15775 C 699.07677,638.15775 703.92552,617.7765 712.67052,610.96275 C 721.40052,604.17525 768.01302,558.55275 769.94427,552.7215 C 769.94427,552.7215 720.43302,601.26525 709.75302,606.114 C 699.07677,610.96275 714.60927,574.07025 714.60927,574.07025 C 714.60927,574.07025 742.76427,536.214 747.61302,524.574 C 752.46927,512.91525 755.38302,508.0665 755.38302,508.0665 C 755.38302,508.0665 721.40052,559.52025 715.57677,564.37275 C 715.57677,564.37275 716.54427,530.39025 720.43302,515.829 C 724.31427,501.27525 744.70677,469.224 744.70677,469.224 L 750.53052,445.93275 C 750.53052,445.93275 732.08802,487.6815 720.43302,503.21025 C 720.43302,503.21025 716.89677,445.79025 710.04927,406.87275 C 710.04927,406.87275 722.76927,360.98775 713.96427,340.824 C 713.96427,340.824 721.02552,369.59775 705.39552,402.309 C 705.39552,402.309 685.76052,374.57775 683.16177,360.47775 C 680.55552,346.38525 682.09302,316.28026 682.09302,316.28026 L 678.14802,350.709 C 678.14802,350.709 661.78677,341.35275 660.75552,331.85026 C 659.73927,322.34776 651.13677,292.04026 651.13677,292.04026 L 638.04177,272.52901 C 638.04177,272.52901 653.34552,297.85276 654.22302,323.63401 C 654.22302,323.63401 645.63927,324.94276 636.60177,311.83651 C 627.56802,298.73026 602.49177,278.42401 602.49177,278.42401 C 602.49177,278.42401 631.71927,314.35276 636.99552,320.12776 C 642.27552,325.89901 651.24927,332.87776 655.27677,336.20776 C 659.29677,339.54151 672.40677,359.06025 677.71302,367.91025 C 683.02302,376.7565 699.11427,405.5115 701.49177,411.25275 C 703.73427,416.664 706.77552,431.83275 708.71427,445.419 C 710.66427,459.01275 715.57677,480.879 712.67052,504.18525 C 712.67052,504.18525 708.78927,566.31525 707.81427,569.2215 C 707.81427,569.2215 701.22177,607.014 694.59552,625.31025 C 691.67052,633.384 679.48302,651.1365 660.44802,658.55775 C 660.44802,658.55775 634.39677,671.1315 629.00427,670.239 C 623.61552,669.339 577.0968,620.44275 562.4643,602.29275 C 538.31805,572.334 453.24555,471.834 405.4593,431.454 C 377.8443,408.11775 380.39055,402.59025 326.3043,359.87775 C 326.3043,359.87775 289.4718,339.69151 282.2868,385.51275 C 275.09805,431.33025 277.6818,426.89025 267.57555,427.98525 L 267.9093,430.794 C 267.9093,430.794 272.03805,431.1915 275.2368,429.92775 C 275.2368,429.92775 268.0309,446.10934 256.34215,445.21684 L 255.61969,450.47809 C 255.61969,450.47809 265.34805,449.20275 268.7493,448.329 C 268.7493,448.329 263.12021,456.7355 256.83521,457.628 L 256.08901,461.32673 C 256.08901,461.32673 263.45805,460.089 267.3393,456.2115 C 267.3393,456.2115 259.7321,469.05682 247.8521,470.36557 L 248.54356,476.95427 C 248.54356,476.95427 273.8643,473.0865 277.4643,451.9815 C 282.1293,424.62525 288.0543,429.744 289.4718,430.434 C 300.6093,435.8715 284.28469,471.93173 253.00594,506.49923 L 256.18852,512.12165 z M 151.84003,516.09501 C 230.64253,536.75751 253.15753,506.22501 253.15753,506.22501 L 256.41628,511.84626 C 256.41628,511.84626 231.07378,543.97626 148.78003,524.56626 C 66.490014,505.15626 49.517514,395.99751 55.187514,367.16376 C 60.092514,342.25251 81.752514,284.58127 128.33503,276.94627 C 174.92128,269.30752 208.46878,295.07377 226.23253,327.71752 C 226.23253,327.71752 250.24378,362.01126 251.35378,408.29751 C 251.35378,408.29751 254.45583,428.78594 267.38958,427.80719 L 268.49858,430.8922 C 268.49858,430.8922 249.81253,433.86876 248.04628,423.73626 C 248.04628,423.73626 243.07378,442.27626 256.21003,445.12626 L 255.68128,450.70626 C 255.68128,450.70626 248.95378,450.44001 244.00378,439.89876 C 244.00378,439.89876 242.95429,457.50618 256.56679,457.60743 L 256.17322,461.29866 C 256.17322,461.29866 236.00503,463.86501 240.69628,435.12501 C 245.56378,405.32376 230.57503,354.85251 215.71378,337.77127 C 201.69253,321.65377 176.62378,281.48377 131.80003,288.48502 C 131.80003,288.48502 99.883766,308.67502 93.760014,336.47002 C 87.047514,366.95001 108.76002,394.13001 137.04628,431.60001 C 165.33253,469.07751 212.98378,475.66251 247.81003,470.33751 L 248.57503,477.20751 C 248.57503,477.20751 179.91253,499.30626 131.42128,437.22501 C 131.42128,437.22501 78.767514,382.46001 84.925014,338.23627 C 84.925014,338.23627 84.842514,322.38127 76.401264,335.80252 C 67.967514,349.22751 45.737514,389.37876 84.493764,463.59126 C 84.493764,463.59126 93.002514,482.49876 117.73377,501.73626 C 117.73377,501.73626 135.71878,511.86876 151.84003,516.09501 z M 109.55031,246.90445 C 109.55031,246.90445 109.98906,261.92695 104.24781,269.43445 C 98.506556,276.94195 85.295302,290.5582 85.295302,290.5582 L 91.880302,288.8707 C 91.880302,288.8707 106.90281,274.29445 108.22656,268.99195 C 109.55031,263.6932 111.75906,253.09195 109.55031,246.90445 M 109.55031,246.90445 C 109.55031,246.90445 109.98906,261.92695 104.24781,269.43445 C 98.506556,276.94195 85.295302,290.5582 85.295302,290.5582 L 91.880302,288.8707 C 91.880302,288.8707 106.90281,274.29445 108.22656,268.99195 C 109.55031,263.6932 111.75906,253.09195 109.55031,246.90445 z M 79.070302,259.71445 C 79.070302,259.71445 78.627802,294.1732 80.394052,299.4757 L 76.419052,301.68445 C 76.419052,301.68445 74.210302,274.7332 79.070302,259.71445 M 79.070302,259.71445 C 79.070302,259.71445 78.627802,294.1732 80.394052,299.4757 L 76.419052,301.68445 C 76.419052,301.68445 74.210302,274.7332 79.070302,259.71445 z M 74.652802,306.9832 C 74.652802,306.9832 52.122802,311.8432 44.172802,321.55945 C 36.219052,331.27945 36.219052,332.60695 36.219052,332.60695 C 36.219052,332.60695 42.402802,325.5382 49.471552,320.6782 C 56.540302,315.8182 72.444052,312.2857 72.444052,312.2857 L 74.652802,306.9832 M 74.652802,306.9832 C 74.652802,306.9832 52.122802,311.8432 44.172802,321.55945 C 36.219052,331.27945 36.219052,332.60695 36.219052,332.60695 C 36.219052,332.60695 42.402802,325.5382 49.471552,320.6782 C 56.540302,315.8182 72.444052,312.2857 72.444052,312.2857 L 74.652802,306.9832 z M 64.932802,324.6532 C 64.932802,324.6532 56.097802,331.72195 53.007802,336.13945 C 49.914052,340.55694 37.104052,360.87819 37.104052,360.87819 C 37.104052,360.87819 51.237802,339.22945 57.867802,333.9307 C 64.494052,328.6282 67.141552,327.30445 67.141552,327.30445 L 64.932802,324.6532 M 64.932802,324.6532 C 64.932802,324.6532 56.097802,331.72195 53.007802,336.13945 C 49.914052,340.55694 37.104052,360.87819 37.104052,360.87819 C 37.104052,360.87819 51.237802,339.22945 57.867802,333.9307 C 64.494052,328.6282 67.141552,327.30445 67.141552,327.30445 L 64.932802,324.6532 z M 98.416556,332.76445 C 98.416556,332.76445 97.917806,345.75819 103.41531,352.25694 C 108.91656,358.75569 122.91156,359.25444 122.91156,359.25444 C 122.91156,359.25444 107.41656,354.25944 104.91531,348.75819 C 102.41781,343.26069 102.41781,332.26195 102.41781,332.26195 L 98.416556,332.76445 M 98.416556,332.76445 C 98.416556,332.76445 97.917806,345.75819 103.41531,352.25694 C 108.91656,358.75569 122.91156,359.25444 122.91156,359.25444 C 122.91156,359.25444 107.41656,354.25944 104.91531,348.75819 C 102.41781,343.26069 102.41781,332.26195 102.41781,332.26195 L 98.416556,332.76445 z M 109.91406,321.26695 C 109.91406,321.26695 119.41281,329.76445 129.90907,330.2632 C 140.40532,330.7657 146.90407,326.76445 146.90407,326.76445 C 146.90407,326.76445 135.90907,331.26445 127.91032,327.2632 C 119.91156,323.2657 114.91281,318.26695 114.91281,318.26695 L 109.91406,321.26695 M 109.91406,321.26695 C 109.91406,321.26695 119.41281,329.76445 129.90907,330.2632 C 140.40532,330.7657 146.90407,326.76445 146.90407,326.76445 C 146.90407,326.76445 135.90907,331.26445 127.91032,327.2632 C 119.91156,323.2657 114.91281,318.26695 114.91281,318.26695 L 109.91406,321.26695 z M 111.91656,282.77695 C 111.91656,282.77695 122.40906,266.28445 138.90532,264.78445 C 138.90532,264.78445 120.41406,262.2832 108.41781,281.77945 L 111.91656,282.77695 M 111.91656,282.77695 C 111.91656,282.77695 122.40906,266.28445 138.90532,264.78445 C 138.90532,264.78445 120.41406,262.2832 108.41781,281.77945 L 111.91656,282.77695 z M 118.35906,282.07945 C 118.35906,282.07945 128.95657,285.89695 120.90531,311.32945 C 112.85031,336.76195 75.121552,353.29569 64.947802,346.93569 C 54.774052,340.57944 56.892802,313.02445 85.295302,290.5582 C 104.38656,275.4532 116.84406,281.09695 118.35906,282.07945 M 118.35906,282.07945 C 118.35906,282.07945 128.95657,285.89695 120.90531,311.32945 C 112.85031,336.76195 75.121552,353.29569 64.947802,346.93569 C 54.774052,340.57944 56.892802,313.02445 85.295302,290.5582 C 104.38656,275.4532 116.84406,281.09695 118.35906,282.07945 z M 121.42281,279.22195 C 121.42281,279.22195 112.61406,282.21445 111.07281,283.1557 C 109.53531,284.09695 121.93281,295.30195 121.93281,295.30195 C 121.93281,295.30195 113.03128,297.7815 122.35378,292.13775 L 114.0992,281.49479 M 112.59156,277.5757 C 112.59156,277.5757 110.30406,280.33195 108.60531,282.85195 L 111.41781,282.9682 C 111.41781,282.9682 112.37898,286.71806 114.43023,284.66681 L 112.59156,277.5757 M 98.937806,280.2157 C 98.937806,280.2157 96.830302,282.14695 94.719052,287.41945 L 82.124692,293.13351 C 82.124692,293.13351 91.906552,284.8432 94.426552,282.2632 L 98.937806,280.2157 M 78.594052,293.6257 C 78.594052,293.6257 79.149052,297.81445 80.071552,299.9707 L 77.607802,302.98945 C 77.607802,302.98945 76.932802,295.53445 76.992802,294.36445 L 78.594052,293.6257 M 61.554052,311.9707 C 61.554052,311.9707 70.060569,306.38028 75.745569,305.61903 L 72.982048,316.4837 C 72.982048,316.4837 66.417802,312.55945 59.975302,314.7832 L 61.554052,311.9707 M 58.100302,331.89445 C 58.100302,331.89445 65.109624,320.18312 66.455874,319.24562 L 66.768412,331.47468 C 66.768412,331.47468 58.977802,331.7182 57.455302,333.0082 L 57.847764,333.66222 M 61.381552,349.06194 C 61.381552,349.06194 63.549052,342.73194 64.017802,342.09069 C 64.486552,341.44569 69.991552,345.72069 69.991552,345.72069 C 69.991552,345.72069 67.824052,350.99694 67.355302,352.16694 C 66.886552,353.34069 61.381552,349.06194 61.381552,349.06194 M 85.872802,349.93944 L 85.227802,340.09569 L 92.375302,337.2832 C 92.375302,337.2832 91.850302,346.89444 91.906552,348.82569 L 85.872802,349.93944 M 100.16781,342.14694 C 100.16781,342.14694 92.760641,332.00532 92.760641,330.01407 L 103.86694,330.2993 C 103.86694,330.2993 101.69406,338.80945 102.04281,341.32569 L 100.16781,342.14694 M 117.33531,325.27195 C 117.33531,325.27195 109.89356,323.35699 107.48981,321.89074 L 115.2005,315.46278 C 115.2005,315.46278 117.68781,322.2832 119.62281,323.3407 L 117.33531,325.27195"
            fill="#b8860b"
            fillOpacity={0.15}
            stroke="var(--label-quaternary)"
            strokeWidth={0.5}
            strokeOpacity={0.35}
          />
          {/* SA node circles */}
          <path
            d="M 123.19326,292.66503 C 123.19326,299.61432 117.87326,305.25432 111.31826,305.25432 C 104.76326,305.25432 99.443258,299.61432 99.443258,292.66503 C 99.443258,285.71574 104.76326,280.07574 111.31826,280.07574 C 117.87326,280.07574 123.19326,285.71574 123.19326,292.66503 z M 111.31826,295.07574 C 111.31826,302.02503 105.99826,307.66503 99.443259,307.66503 C 92.888259,307.66503 87.568259,302.02503 87.568259,295.07574 C 87.568259,288.12645 92.888259,282.48645 99.443259,282.48645 C 105.99826,282.48645 111.31826,288.12645 111.31826,295.07574 z M 82.925402,335.25431 C 82.925402,342.2036 77.605402,347.8436 71.050402,347.8436 C 64.495402,347.8436 59.175402,342.2036 59.175402,335.25431 C 59.175402,328.30502 64.495402,322.66502 71.050402,322.66502 C 77.605402,322.66502 82.925402,328.30502 82.925402,335.25431 z"
            fill={c(state.sa)}
            fillOpacity={0.88}
          />
        </g>

        {/* ═══════════════════════════════════════════════
            ANIMATED IMPULSE OVERLAY PATHS
            (in transformed coordinate space — no extra transform needed)
        ═══════════════════════════════════════════════ */}

        {/* SA node ripple */}
        {state.sa === 'active' && (
          <circle cx="215" cy="128" r="13" fill="none" stroke={c('active')} strokeWidth="2.2"
            className="acls-sa-ring" />
        )}

        {/* Internodal: SA → AV node */}
        <path
          d="M 215,128 C 230,160 290,185 340,205 C 370,217 393,220 416,225"
          fill="none" stroke={c(state.raPath)} strokeWidth="5" strokeLinecap="round"
          pathLength={100} className="acls-cs-path" style={cs(state.raPath, 0)} />

        {/* AV node marker */}
        <circle cx="416" cy="225" r="9" fill={c(state.av)} opacity={0.92} />
        {state.av === 'active' && (
          <circle cx="416" cy="225" r="11" fill="none" stroke={c('active')} strokeWidth="2.2"
            className="acls-av-ring" />
        )}
        {state.av === 'blocked' && (
          <text x="416" y="217" fontSize="18" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}

        {/* Bundle of His: AV → bifurcation */}
        <path
          d="M 416,225 C 425,265 435,300 445,335"
          fill="none" stroke={c(state.his)} strokeWidth="6" strokeLinecap="round"
          pathLength={100} className="acls-cs-path" style={cs(state.his, 0.33)} />

        {/* LBB trunk: bifurcation → right */}
        <path
          d="M 445,335 C 490,310 545,295 617,285"
          fill="none" stroke={c(state.lbb)} strokeWidth="4.5" strokeLinecap="round"
          pathLength={100} className="acls-cs-path" style={cs(state.lbb, 0.44)} />
        {state.lbb === 'blocked' && (
          <text x="530" y="296" fontSize="15" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}

        {/* RBB trunk: bifurcation → lower right then curves */}
        <path
          d="M 445,335 C 470,360 520,375 599,381"
          fill="none" stroke={c(state.rbb)} strokeWidth="4.5" strokeLinecap="round"
          pathLength={100} className="acls-cs-path" style={cs(state.rbb, 0.44)} />
        {state.rbb === 'blocked' && (
          <text x="520" y="368" fontSize="15" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}

        {/* LBB Purkinje branches */}
        {on(state.lvFill) && (<>
          <path d="M 617,285 C 660,290 710,310 760,350"
            fill="none" stroke={c(state.lvFill)} strokeWidth="3" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.56s' }} />
          <path d="M 617,285 C 650,330 680,390 710,460"
            fill="none" stroke={c(state.lvFill)} strokeWidth="3" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.58s' }} />
          <path d="M 617,285 C 640,380 650,470 630,560"
            fill="none" stroke={c(state.lvFill)} strokeWidth="2.5" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.60s' }} />
          <path d="M 760,350 C 800,410 820,470 810,540"
            fill="none" stroke={c(state.lvFill)} strokeWidth="2" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.62s' }} />
        </>)}

        {/* RBB Purkinje branches */}
        {on(state.rvFill) && (<>
          <path d="M 599,381 C 600,430 590,490 560,550"
            fill="none" stroke={c(state.rvFill)} strokeWidth="3" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.56s' }} />
          <path d="M 599,381 C 550,420 500,460 450,520"
            fill="none" stroke={c(state.rvFill)} strokeWidth="3" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.58s' }} />
          <path d="M 450,520 C 400,555 360,580 310,600"
            fill="none" stroke={c(state.rvFill)} strokeWidth="2.5" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.60s' }} />
          <path d="M 560,550 C 540,590 510,620 490,650"
            fill="none" stroke={c(state.rvFill)} strokeWidth="2" strokeLinecap="round"
            pathLength={100} className="acls-cs-path" style={{ animationDelay: '0.62s' }} />
        </>)}

        {/* ══════════════════════════════════
            LABELS
        ══════════════════════════════════ */}
        <text x="215" y="106" textAnchor="middle" fontSize="13" fill="var(--label-secondary)" fontWeight="700">SA</text>
        <text x="416" y="248" textAnchor="middle" fontSize="13" fill="var(--label-secondary)" fontWeight="700">AV</text>
        <text x="450" y="320" textAnchor="middle" fontSize="11" fill="var(--label-tertiary)" fontWeight="600">His</text>
        <text x="575" y="272" textAnchor="start"  fontSize="11" fill="var(--label-tertiary)" fontWeight="600">LBB</text>
        <text x="600" y="402" textAnchor="start"  fontSize="11" fill="var(--label-tertiary)" fontWeight="600">RBB</text>

        {/* ══════════════════════════════════
            SPECIAL RHYTHM MARKERS
        ══════════════════════════════════ */}

        {/* WPW — accessory pathway arc */}
        {rhythmKey === 'wpw' && (
          <path d="M 380,195 Q 480,205 490,280" fill="none" stroke="#FF9500"
            strokeWidth="2.5" strokeDasharray="6 3" opacity={0.85} />
        )}

        {/* AF — multifocal atrial ectopic foci */}
        {rhythmKey === 'af' && (<>
          <circle cx="200" cy="128" r="6" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.85} />
          <circle cx="225" cy="150" r="5" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.78}
            style={{ animationDelay: '0.30s' }} />
          <circle cx="250" cy="120" r="5" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.82}
            style={{ animationDelay: '0.58s' }} />
          <circle cx="270" cy="160" r="4" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.72}
            style={{ animationDelay: '0.84s' }} />
          <circle cx="310" cy="195" r="4" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.65}
            style={{ animationDelay: '1.08s' }} />
        </>)}

        {/* VF / TdP — chaotic ventricular */}
        {(rhythmKey === 'vf' || rhythmKey === 'torsades') && (
          ([[470,350],[530,380],[590,420],[650,460],[710,490],[440,430],[490,480],[540,530],[600,560],[660,590]] as [number,number][]).map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill={CD_COLORS.blocked}
              className="acls-conduction-ectopic" opacity={0.45}
              style={{ animationDelay: `${i * 0.14}s` }} />
          ))
        )}

        {/* Generic ectopic focus */}
        {state.ectopicPos && rhythmKey !== 'af' && (() => {
          const ectopicCoords: Record<string, [number, number]> = {
            ra: [215, 128], la: [350, 160], rv: [480, 500], lv: [680, 450],
          };
          const [ex, ey] = ectopicCoords[state.ectopicPos] ?? [0, 0];
          return (<>
            <circle cx={ex} cy={ey} r="10" fill={CD_COLORS.ectopic}
              className="acls-conduction-ectopic" opacity={0.88} />
            {state.ectopicLabel && (
              <text x={ex} y={ey + 18} textAnchor="middle" fontSize="10"
                fill={CD_COLORS.ectopic} fontWeight="700">{state.ectopicLabel}</text>
            )}
          </>);
        })()}

      </svg>

      {/* ── Mini ECG strip with synchronized scan cursor ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8,
        marginTop: 6, background: 'var(--bg-secondary)', height: 50 }}>
        <RhythmStrip kind={rhythmKey} width={500} height={50} grid={false} />
        <div className="acls-ecg-cursor" style={{ animationDuration: '1.2s' }} />
      </div>

      {state.caption && (
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>
          {state.caption}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FlowStep
   ============================================================ */
/* ============================================================
   EkgImage — real photo strip with RhythmStrip SVG fallback
   ============================================================ */
export function EkgImage({ rhythm, style = {} }: { rhythm: Rhythm; style?: React.CSSProperties }) {
  const [status, setStatus] = React.useState('loading'); // loading | loaded | error

  if (!rhythm.imageFile) {
    return <RhythmStrip kind={rhythm.key} width={340} height={80} />;
  }

  const src = `/ekg-images/${rhythm.imageFile}`;

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
      background: 'var(--fill-quaternary)', ...style }}>

      {/* Fallback SVG saat loading atau error */}
      {status !== 'loaded' && (
        <div style={{ position: status === 'loading' ? 'absolute' : 'relative',
          inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RhythmStrip kind={rhythm.key} width={340} height={80} />
        </div>
      )}

      {/* Gambar asli */}
      <img
        src={src}
        alt={`Strip EKG ${rhythm.name}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          visibility: status === 'loaded' ? 'visible' : 'hidden',
          position: status === 'loaded' ? 'static' : 'absolute',
          objectFit: 'contain',
          background: '#ffffff',
        }}
      />

      {/* Credit label */}
      {status === 'loaded' && rhythm.imageCredit && (
        <div style={{ fontSize: '0.625rem', color: 'var(--label-tertiary)',
          padding: '3px 8px', background: 'var(--fill-quaternary)',
          textAlign: 'right' }}>
          {rhythm.imageCredit}
        </div>
      )}
    </div>
  );
}

export function FlowStep({ step, index, total, onAction, expandable = true }: { step: FlowStepType; index: number; total: number; onAction?: (result: string) => void; expandable?: boolean }) {
  const [open, setOpen] = useState(false);

  const tone = ({
    action:   { tint: "var(--accent)",      label: "Tindakan",  bg: "var(--bg-tertiary)" },
    shock:    { tint: "var(--danger)",       label: "Shock",     bg: "rgba(255,59,48,0.10)" },
    drug:     { tint: "var(--tint-drug)",    label: "Obat",      bg: "var(--bg-tertiary)" },
    note:     { tint: "var(--tint-theory)", label: "Catatan",   bg: "var(--bg-tertiary)" },
    outcome:  { tint: "var(--success)",      label: "Hasil",     bg: "rgba(52,199,89,0.10)" },
    decision: { tint: "var(--warning)",      label: "Keputusan", bg: "var(--bg-tertiary)" },
  } as Record<string, { tint: string; label: string; bg: string }>)[step.kind] || { tint: "var(--accent)", label: "Langkah", bg: "var(--bg-tertiary)" };

  // Decision step — tidak berubah dari versi asli
  if (step.kind === "decision") {
    return (
      <div className="flow-step decision">
        <div className="flow-tag" style={{ background: "rgba(255,149,0,0.14)", color: "var(--warning)" }}>Keputusan</div>
        <div className="t-headline" style={{ marginTop: 2 }}>{step.title}</div>
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{step.q}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => onAction && onAction("yes")}
            style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "rgba(255,59,48,0.10)", color: step.yes.tint, boxShadow: "inset 0 0 0 0.5px " + step.yes.tint + "40", border: 0, cursor: "pointer" }}
          >
            <div className="t-caption-2">YES</div>
            <div className="t-subheadline" style={{ fontWeight: 600, marginTop: 1 }}>{step.yes.label}</div>
          </button>
          <button
            onClick={() => onAction && onAction("no")}
            style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "rgba(0,122,255,0.08)", color: step.no.tint, boxShadow: "inset 0 0 0 0.5px " + step.no.tint + "40", border: 0, cursor: "pointer" }}
          >
            <div className="t-caption-2">NO</div>
            <div className="t-subheadline" style={{ fontWeight: 600, marginTop: 1 }}>{step.no.label}</div>
          </button>
        </div>
      </div>
    );
  }

  // Non-decision: expandable pearls
  const hasPearls = !!step.pearls && expandable;

  return (
    <div
      className="flow-step"
      style={{
        background: tone.bg,
        boxShadow: "0 0 0 0.5px " + tone.tint + "30, var(--shadow-1)",
        cursor: hasPearls ? "pointer" : "default",
      }}
      onClick={hasPearls ? () => setOpen(o => !o) : undefined}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="flow-tag" style={{ background: tone.tint + "1F", color: tone.tint }}>{tone.label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="t-caption-2" style={{ color: "var(--label-tertiary)" }}>{index + 1} / {total}</span>
          {hasPearls && (
            <span style={{
              fontSize: '1rem',
              color: tone.tint,
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
              lineHeight: 1,
              userSelect: "none",
            }}>›</span>
          )}
        </div>
      </div>

      {/* Title + sub — selalu tampil */}
      <div className="t-headline" style={{ marginTop: 6 }}>{step.title}</div>
      {step.sub && (
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{step.sub}</div>
      )}

      {/* Pearls — hanya tampil saat expandable=false (desktop inline) atau saat open=true (mobile expand) */}
      {step.pearls && !expandable && (
        <div className="t-caption-1" style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "var(--fill-quaternary)", color: "var(--label-secondary)", lineHeight: 1.4 }}>
          {Array.isArray(step.pearls)
            ? (step.pearls as string[]).map((p: string, pi: number) => <div key={pi} style={{ marginBottom: pi < (step.pearls as string[]).length - 1 ? 4 : 0 }}>· {p}</div>)
            : step.pearls}
        </div>
      )}

      {hasPearls && open && (
        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "var(--fill-quaternary)", animation: "acls-fade-in 150ms ease both" }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: "0.06em", color: tone.tint, marginBottom: 6 }}>CATATAN KLINIS</div>
          {Array.isArray(step.pearls)
            ? (step.pearls as string[]).map((p: string, pi: number) => (
                <div key={pi} className="t-caption-1" style={{ color: "var(--label-secondary)", lineHeight: 1.5, marginBottom: pi < (step.pearls as string[]).length - 1 ? 4 : 0 }}>· {p}</div>
              ))
            : <div className="t-caption-1" style={{ color: "var(--label-secondary)", lineHeight: 1.5 }}>{step.pearls}</div>
          }
        </div>
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
export function BottomNav({ active, onChange, fabShape = "circle", onFabClick, accent, fabOpen, moreActive = false, onMore }: { active: string; onChange: (key: string) => void; fabShape?: string; onFabClick: () => void; accent?: string; fabOpen: boolean; moreActive?: boolean; onMore?: () => void }) {
  const fabRadius = fabShape === "circle" ? 30 : fabShape === "squircle" ? 18 : 30;
  const fabWidth = fabShape === "pill" ? 90 : 60;

  return (
    <div className="acls-bottomnav">
      {[
        { key: "home",  label: "Beranda",  icon: Icons.house,    iconFill: Icons.houseFill },
        { key: "algo",  label: "Algoritma",icon: Icons.algo,     iconFill: Icons.algoFill },
        { key: null,    label: "",         icon: null },
        { key: "drugs", label: "Obat",     icon: Icons.pill,     iconFill: Icons.pillFill },
        { key: "more",  label: "Lainnya",  icon: Icons.grid,     iconFill: Icons.gridFill },
      ].map((t, i) => {
        if (!t.icon) return <div key={i} />;
        if (t.key === "more") {
          const isActive = moreActive;
          const I = isActive ? t.iconFill : t.icon;
          return (
            <button key="more" className={"nav-btn " + (isActive ? "active" : "")} onClick={onMore}>
              <I size={24} />
              <span>{t.label}</span>
            </button>
          );
        }
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
export function BottomSheet({ open, onClose, title, children, height }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; height?: string }) {
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
const VF_STEPS: FlowStepType[] = [
  { kind:'shock', title:'Shock pertama (AHA Step 3)',         sub:'120–200J bifasik · 360J monofasik · pastikan semua menjauh',  cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit + IV/IO access (Step 4)',sub:'Bag-mask + O₂ · pasang IV/IO · pantau EtCO₂ · 100–120/mnt',  auto:true   },
  { kind:'shock', title:'Shock kedua (AHA Step 5)',           sub:'120–200J bifasik · 360J monofasik',                            cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit (Step 6)',               sub:'Epi 1mg q3–5 mnt · pertimbangkan intubasi/SGA · capnografi',   auto:true,  actions:['epi','amio','airway'], amioOnlyIfUsed:true },
  { kind:'shock', title:'Shock ketiga (AHA Step 7)',          sub:'120–200J bifasik · 360J monofasik',                            cta:'shock' },
  { kind:'cpr',   title:'CPR 2 menit (Step 8)',               sub:'Amiodarone IV/IO bolus · cari & atasi Hs & Ts',                auto:true,  actions:['amio','epi'] },
  // Setelah index 5: rhythm check → VF → wrap ke index 2 (Shock = Step 5)
];

// AHA 2025: PEA/Asistol path — Epi ASAP pertama, 3 langkah, loop ke index 1 (CPR = Step 10)
const PEA_STEPS: FlowStepType[] = [
  { kind:'drug',  title:'Epinefrin ASAP (Step 9)',             sub:'1 mg IV/IO sesegera mungkin — prioritas pertama sebelum CPR 2 mnt', cta:'epi', urgent:true },
  { kind:'cpr',   title:'CPR 2 menit + IV/IO access (Step 10)',sub:'Epi 1mg q3–5 mnt · pertimbangkan intubasi/SGA · capnografi',        auto:true,  actions:['epi','airway'] },
  { kind:'cpr',   title:'CPR 2 menit (Step 11)',               sub:'Cari & atasi penyebab reversibel · Hs & Ts · Epi q3–5 mnt',          auto:true,  actions:['epi'] },
  // Setelah index 2: rhythm check → no ROSC → wrap ke index 1 (CPR = Step 10)
];

function useMetronome(active: boolean) {
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
const AWAIT_STEPS: FlowStepType[] = [
  { kind:'cpr', title:'CPR berkualitas tinggi (AHA Box 1)', sub:'100–120/mnt · kedalaman 5–6 cm · BVM + O₂ · rasio 30:2', auto:true },
  { kind:'cpr', title:'Pasang monitor/defibrilator', sub:'Tempel pad anterior-lateral · jangan tunda CPR — pemasangan paralel', auto:true },
  { kind:'opt', title:'Akses IV/IO', sub:'Sambil CPR berlangsung · siapkan jalur untuk obat', auto:true },
];


function StepCard({ step, idx }: { step: FlowStepType; idx: number }) {
  const colMap: Record<string, string> = { shock:'var(--danger)', drug:'var(--warning)', opt:'var(--label-tertiary)', cpr:'var(--info)' };
  const lblMap: Record<string, string> = { shock:'Shock', drug:'Obat', opt:'Opsional', cpr:'CPR Aktif' };
  const color = colMap[step.kind] || 'var(--accent)';
  return (
    <div className="acls-step-card">
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

export function CPRTimer({ onClose, isMobile = true, initialRhythm }: { onClose: () => void; isMobile?: boolean; initialRhythm?: CprRhythm }) {
  const [phase, setPhase] = useState("setup");
  const [rhythm, setRhythm] = useState(null);

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [epiDoses, setEpiDoses] = useState(0);
  const [epiNextMs, setEpiNextMs] = useState(null);
  const [shocks, setShocks] = useState(0);
  const [amio, setAmio] = useState(0);
  const [lidocaine, setLidocaine] = useState(0);
  const [intubated, setIntubated] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('acls_sound_enabled') === '1'; } catch { return false; }
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [everShockable, setEverShockable] = useState(() => initialRhythm === 'shockable');
  const [stopAlsOpen, setStopAlsOpen] = useState(false);
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

  const [log, setLog] = useState<LogEntry[]>([]);

  const startCPR = (selected: string) => {
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

  const fmtMs = (ms: number) => {
    const total = Math.floor(ms / 10);
    const m = Math.floor(total / 6000);
    const s = Math.floor(total % 6000 / 100);
    const c = total % 100;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
  };
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const addLog = (action: string, tone: LogEntry['tone'] = "info") => setLog(l => [...l, { t: elapsed, wall: nowWall(elapsedMs), action, tone }]);

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

  // Track apakah VF/pVT pernah terdeteksi — relevan untuk pertimbangan terminasi ALS
  useEffect(() => {
    if (rhythm === 'shockable') setEverShockable(true);
  }, [rhythm]);

  const handleStopALS = () => {
    addLog('Resusitasi dihentikan — keputusan tim', 'danger');
    addLog(`Durasi total: ${fmt(elapsed)} · Epi: ${epiDoses} dosis · Shock: ${shocks}x`, 'info');
    setRunning(false);
    setStopAlsOpen(false);
  };

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
  const confirmRhythmFromUnknown = (selectedRhythm: string) => {
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
      const tSec = wallStartRef.current ? Math.floor((now.getTime() - wallStartRef.current.getTime()) / 1000) : 0;
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
  const handleLidocaine = () => {
    const dose = lidocaine === 0 ? '1–1,5 mg/kg' : '0,5–0,75 mg/kg';
    setLidocaine(l => l + 1);
    addLog(`Lidokain ${dose} IV/IO bolus`, 'info');
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

  const handleRhythmResult = (result: string) => {
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
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: '0.9375rem' }}>
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
              const tc = ({ info:"var(--label-primary)", warn:"var(--warning)", danger:"var(--danger)", success:"var(--success)" } as Record<string, string>)[e.tone];
              return (
                <div key={i} className="t-footnote" style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"8px 12px", borderRadius:8, background:"var(--fill-quaternary)" }}>
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
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: '0.9375rem' }}>
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

            {elapsed >= 600 && (
              <button onClick={() => setStopAlsOpen(true)}
                style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(142,142,147,0.10)", boxShadow: "0 0 0 1px rgba(142,142,147,0.3)", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--label-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icons.cross size={20} stroke={2.4} style={{ color: "#fff" }}/>
                </div>
                <div>
                  <div className="t-headline" style={{ color: "var(--label-primary)" }}>Pertimbangkan Menghentikan ALS</div>
                  <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>Evaluasi kriteria terminasi · durasi {fmt(elapsed)}</div>
                </div>
              </button>
            )}
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

        {/* Stop ALS confirmation modal */}
        {stopAlsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom,0)" }}>
            <div style={{ width: "100%", maxWidth: 480, background: "var(--bg-secondary)", borderRadius: "20px 20px 0 0", boxShadow: "var(--shadow-2), 0 0 0 0.5px var(--separator)", overflow: "hidden", animation: "acls-sheet-in 260ms var(--ease-out) both" }}>
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--fill-tertiary)" }}/>
              </div>

              <div style={{ padding: "4px 20px 20px", overflowY: "auto", maxHeight: "80vh" }}>
                <div className="t-title-2" style={{ marginBottom: 4 }}>Pertimbangkan Menghentikan ALS</div>
                <div className="t-footnote" style={{ color: "var(--label-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                  Keputusan tim — dokumentasikan waktu dan alasan penghentian.
                </div>

                {/* Ringkasan */}
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--fill-quaternary)", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, marginBottom: 2 }}>RINGKASAN RESUSITASI</div>
                  {[
                    ["Durasi total", fmt(elapsed)],
                    ["Irama selama resusitasi", everShockable ? "Pernah VF/pVT" : "Tidak pernah shockable (Asistol/PEA)"],
                    ["Epinefrin diberikan", `${epiDoses} dosis`],
                    ["Defibrilasi", `${shocks}×`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="t-footnote" style={{ color: "var(--label-secondary)" }}>{label}</span>
                      <span className="t-footnote" style={{ fontWeight: 600, color: "var(--label-primary)", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Warning jika pernah VF/pVT */}
                {everShockable && (
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,196,0,0.12)", boxShadow: "inset 0 0 0 0.5px rgba(255,196,0,0.45)", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>⚠️</span>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.5 }}>
                      <strong>VF/pVT pernah terdeteksi</strong> selama resusitasi. Pada irama shockable, pertimbangkan upaya lebih lanjut sebelum menghentikan ALS.
                    </span>
                  </div>
                )}

                {/* Kriteria AHA */}
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,122,255,0.07)", boxShadow: "inset 0 0 0 0.5px rgba(0,122,255,0.25)", marginBottom: 20 }}>
                  <div className="t-caption-2" style={{ color: "var(--info)", fontWeight: 700, marginBottom: 8 }}>KRITERIA TERMINASI AHA 2025</div>
                  {[
                    "CPR berkualitas tinggi telah dilakukan sepanjang resusitasi",
                    "Semua penyebab reversibel (Hs & Ts) telah dievaluasi dan dikoreksi",
                    "Tidak ada respons terhadap intervensi ALS yang adekuat",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginTop: i > 0 ? 7 : 0, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--info)", fontWeight: 700, flexShrink: 0, fontSize: '0.8125rem' }}>✓</span>
                      <span className="t-footnote" style={{ color: "var(--label-secondary)", lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={handleStopALS}
                    style={{ width: "100%", height: 50, borderRadius: 14, background: "var(--label-primary)", color: "var(--bg-primary)", border: 0, cursor: "pointer", fontSize: '1rem', fontWeight: 700 }}>
                    Akhiri Resusitasi
                  </button>
                  <button onClick={() => setStopAlsOpen(false)}
                    style={{ width: "100%", height: 44, borderRadius: 14, background: "var(--fill-tertiary)", color: "var(--label-primary)", border: 0, cursor: "pointer", fontSize: '0.9375rem', fontWeight: 600 }}>
                    Lanjutkan ALS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
            <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: 'var(--label-secondary)', fontSize: '0.9375rem' }}>
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
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
                {soundOn ? `♩ ${CPR_BPM} BPM` : 'SENYAP'}
              </span>
            </button>
          </div>

          {/* 2-column body */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
            {/* LEFT: timer + actions + step */}
            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Timer block */}
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--fill-quaternary)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>SIKLUS 2 MNT</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: cycleRemainingMs < 15000 ? 'var(--danger)' : 'var(--label-primary)', lineHeight: 1.1, fontFeatureSettings: '"tnum"', marginTop: 1, letterSpacing: '-0.02em' }}>
                      {fmtMs(cycleRemainingMs)}
                    </div>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>tersisa · siklus {cycles}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>TOTAL</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 1 }}>{fmt(elapsed)}</div>
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
                <button className="ios-btn gray sm" style={{ height: 40, flex: 1 }} onClick={() => { setElapsedMs(0); lastCycleRef.current = 1; setLidocaine(0); }}>
                  <Icons.reset size={14}/> Reset
                </button>
              </div>

              <StepCard step={curStep} idx={safeIdx}/>

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
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>Epi {fmt(Math.ceil(epiRemainMs / 1000))}</span>
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
                    {curStep.actions?.includes('amio') && amio < 2 && (!curStep.amioOnlyIfUsed || amio > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          className="cpr-action midaz"
                          style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(150deg,#5856D6,#3B39B8)' }}
                          onClick={handleAmio}
                        >
                          <Icons.syringe size={22} stroke={2}/>
                          <div style={{ textAlign: 'left' }}>
                            <div className="t-headline" style={{ color: '#fff' }}>
                              Amiodarone {amio === 0 ? '300 mg' : '150 mg'} IV/IO
                            </div>
                            <div className="t-caption-2" style={{ opacity: 0.85 }}>
                              {amio === 0 ? 'Dosis 1 · bolus dalam D5%' : 'Dosis 2 · 150 mg bolus'}
                            </div>
                          </div>
                        </button>
                        {lidocaine < 2 && (
                          <button
                            className="cpr-action"
                            style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, padding: '10px 16px', background: 'linear-gradient(150deg,#2C2C2E,#1C1C1E)', opacity: amio > 0 ? 0.6 : 1 }}
                            onClick={handleLidocaine}
                          >
                            <Icons.syringe size={20} stroke={2}/>
                            <div style={{ textAlign: 'left' }}>
                              <div className="t-headline" style={{ color: '#fff' }}>
                                Lidokain {lidocaine === 0 ? '1–1,5 mg/kg' : '0,5–0,75 mg/kg'} IV/IO
                              </div>
                              <div className="t-caption-2" style={{ opacity: 0.85 }}>
                                {lidocaine === 0 ? 'Alternatif amio · dosis 1 · bolus' : 'Dosis 2 · maintenance 1–4 mg/mnt'}
                                {amio > 0 ? ' · tidak disarankan setelah amio' : ''}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
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
                  const tc = ({ info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' } as Record<string, string>)[e.tone];
                  return (
                    <div key={i} className="t-footnote" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--fill-quaternary)' }}>
                      <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                      <span style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum"', textAlign: 'right', flexShrink: 0, lineHeight: 1.25 }}>
                        <div style={{ color: 'var(--label-secondary)', fontWeight: 600 }}>{e.wall}</div>
                        <div style={{ fontSize: '0.625rem', opacity: 0.85 }}>+{fmt(e.t)}</div>
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 700, color: pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>{pulseCountdown ?? 0}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--label-tertiary)', marginTop: 2 }}>dtk</div>
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
                  style={{ height: 40, width: '100%', borderRadius: 10, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: '0.8125rem', fontWeight: 600, border: 0, cursor: 'pointer' }}>
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
                    style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--fill-tertiary)', border: 0, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--label-secondary)' }}>
                    Tutup
                  </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...log].reverse().map((e, i) => {
                  const tc = ({ info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' } as Record<string, string>)[e.tone];
                  return (
                    <div key={i} className="t-footnote" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)' }}>
                      <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                      <span style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum"', textAlign: 'right', flexShrink: 0, lineHeight: 1.25 }}>
                        <div style={{ color: 'var(--label-secondary)', fontWeight: 600 }}>{e.wall}</div>
                        <div style={{ fontSize: '0.625rem', opacity: 0.85 }}>+{fmt(e.t)}</div>
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
          <button onClick={onClose} className="ios-btn plain" style={{ height: 32, padding: 0, color: "var(--label-secondary)", fontSize: '0.9375rem' }}>
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
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
              {soundOn ? `♩ ${CPR_BPM} BPM` : 'SENYAP'}
            </span>
          </button>
        </div>

        <div style={{ padding: "4px 16px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
            <div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>SIKLUS 2 MNT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: '2rem', fontWeight: 700, color: cycleRemainingMs < 15000 ? "var(--danger)" : "var(--label-primary)", lineHeight: 1.1, fontFeatureSettings: '"tnum"', marginTop: 1, letterSpacing: "-0.02em" }}>
                {fmtMs(cycleRemainingMs)}
              </div>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 2 }}>tersisa · siklus {cycles}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>TOTAL</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: '1.125rem', fontWeight: 600, fontFeatureSettings: '"tnum"', marginTop: 1 }}>{fmt(elapsed)}</div>
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
          <button className="ios-btn gray sm" style={{ height: 36, flex: 1 }} onClick={() => { setElapsedMs(0); lastCycleRef.current = 1; setLidocaine(0); }}>
            <Icons.reset size={13}/> Reset
          </button>
        </div>

        <StepCard step={curStep} idx={safeIdx} />
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>Epi {fmt(Math.ceil(epiRemainMs / 1000))}</span>
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

            {/* Amiodarone + Lidokain — selama step yang butuh amio; dosis 2 hanya setelah dosis 1 */}
            {curStep.actions?.includes('amio') && amio < 2 && (!curStep.amioOnlyIfUsed || amio > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  className="cpr-action midaz"
                  style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(150deg,#5856D6,#3B39B8)' }}
                  onClick={handleAmio}
                >
                  <Icons.syringe size={22} stroke={2}/>
                  <div style={{ textAlign: 'left' }}>
                    <div className="t-headline" style={{ color: '#fff' }}>
                      Amiodarone {amio === 0 ? '300 mg' : '150 mg'} IV/IO
                    </div>
                    <div className="t-caption-2" style={{ opacity: 0.85 }}>
                      {amio === 0 ? 'Dosis 1 · bolus dalam D5%' : 'Dosis 2 · 150 mg bolus'}
                    </div>
                  </div>
                </button>
                {lidocaine < 2 && (
                  <button
                    className="cpr-action"
                    style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, padding: '10px 16px', background: 'linear-gradient(150deg,#2C2C2E,#1C1C1E)', opacity: amio > 0 ? 0.6 : 1 }}
                    onClick={handleLidocaine}
                  >
                    <Icons.syringe size={20} stroke={2}/>
                    <div style={{ textAlign: 'left' }}>
                      <div className="t-headline" style={{ color: '#fff' }}>
                        Lidokain {lidocaine === 0 ? '1–1,5 mg/kg' : '0,5–0,75 mg/kg'} IV/IO
                      </div>
                      <div className="t-caption-2" style={{ opacity: 0.85 }}>
                        {lidocaine === 0 ? 'Alternatif amio · dosis 1 · bolus' : 'Dosis 2 · maintenance 1–4 mg/mnt'}
                        {amio > 0 ? ' · tidak disarankan setelah amio' : ''}
                      </div>
                    </div>
                  </button>
                )}
              </div>
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
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', padding: '2px 0' }}>
              Tampilkan semua ({log.length})
            </button>
          )}
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[...log].reverse().slice(0, 6).map((e, i) => {
            const tc = ({ info: "var(--label-primary)", warn: "var(--warning)", danger: "var(--danger)", success: "var(--success)" } as Record<string, string>)[e.tone];
            return (
              <div key={i} className="t-footnote" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderRadius: 8, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)" }}>
                <span style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                <span style={{ color: "var(--label-tertiary)", fontFamily: "var(--font-mono)", fontFeatureSettings: '"tnum"', textAlign: "right", flexShrink: 0, lineHeight: 1.25 }}>
                  <div style={{ color: "var(--label-secondary)", fontWeight: 600 }}>{e.wall}</div>
                  <div style={{ fontSize: '0.625rem', opacity: 0.85 }}>+{fmt(e.t)}</div>
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 700, color: pulseCountdown > 3 ? 'var(--success)' : pulseCountdown > 0 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>{pulseCountdown ?? 0}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--label-tertiary)', marginTop: 2 }}>dtk</div>
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
              style={{ height: 40, width: '100%', borderRadius: 10, background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: '0.8125rem', fontWeight: 600, border: 0, cursor: 'pointer' }}>
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
                style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--fill-tertiary)', border: 0, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--label-secondary)' }}>
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
                    <div style={{ fontSize: '0.625rem', opacity: 0.85 }}>+{fmt(e.t)}</div>
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
