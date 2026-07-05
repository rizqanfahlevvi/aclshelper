import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
  active:   '#1E8E3E',
  blocked:  '#BA1A1A',
  ectopic:  '#FFA000',
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

/* SVG1 path data — extracted from Heart_and_electrical_conduction_system.svg (g5805) */
const S1_LBB          = 'M535.06314,311.55716c4.48047,8.79492,9.47324,19.90014,15.28125,32.84375-7.63339-6.47181-12.11-8.94092-13.4375-7.28125-1.16162,1.6593,1.31915,4.46655,7.625,8.78125,4.14856,2.98693,7.14337,5.63574,8.96875,8.125,2.987,4.64636,5.96021,12.30725,8.78125,23.09375,5.47614,20.74267,9.28995,37.33325,11.28125,49.28125-34.848-28.04432-54.09924-43.4795-57.75-45.96875-3.4848-2.48926-5.79745-3.49805-7.125-3-1.16159.66369-.15292,2.15722,3,4.8125,3.31888,2.48913,6.79862,5.4934,10.78125,8.8125,3.81668,3.31872,8.27387,7.12512,13.75,11.9375,6.13992,5.31,6.64423,6.46752,1.5,3.8125a178.43314,178.43314,0,0,1-15.75-9.96875c-5.31018-3.81665-7.31787-4.47754-6.15625-1.65625,1.32755,2.65515,4.98511,6.14233,11.125,10.125a190.13392,190.13392,0,0,0,25.5625,13.625q16.17948,7.46722,21.40625,18.40625c3.65073,7.30151,5.81467,13.77392,6.3125,19.25.49783,2.98706.82437,7.305,1.15625,12.78125a145.43487,145.43487,0,0,1,.5,15.28125c-4.31454-8.96106-8.29428-14.11976-11.28125-15.28125-3.15292-1.16163-2.3436,2.32763,2.46875,10.625,4.64642,8.29711,6.32755,14.93762,5,19.75a6.23571,6.23571,0,0,1-1,2.8125c-1.82538,2.98706-3.319,4.82653-4.8125,5.65625-1.32754.66369-4.98294.8103-10.625.3125a47.48148,47.48148,0,0,1-16.75-4.46875c-5.31018-2.48926-11.96036-5.82019-19.59375-9.96875-12.27978-6.6377-33.02463-23.55689-62.5625-50.9375,9.6247,1.65942,14.764,1.83715,15.59375.34375.82971-1.65955-1.47323-2.5-7.28125-2.5a25.599,25.599,0,0,1-15.4375-4.96875,164.14006,164.14006,0,0,1-15.09375-13.4375c-5.47613-5.64209-10.457-10.46668-14.9375-14.78125,3.15292.82971,4.805.67334,5.46875-.15625.66376-.99573-.32336-1.65857-2.8125-2.15625a12.2592,12.2592,0,0,1-6.65625-3c-2.15726-1.82532-7.62314-6.62854-16.75-14.59375-9.29278-8.13135-17.941-16.45276-25.90625-24.75,4.81238,1.32763,7.3028,1.01513,7.46875-.3125.16589-1.49341-1.49579-2.49268-5.3125-3.15625-3.65076-.82984-8.45166-3.32019-14.09375-7.46875a5.51022,5.51022,0,0,0-1-1c-.17871-.14893-.47363-.44043-.65625-.59375v9.28125c5.85748,5.40612,12.08411,11.42675,18.90625,18.53125q1.24457,1.4934,60.25,58.40625c1.16162,1.16162,9.30542,8.4552,24.40625,22.0625s30.0123,26.05944,44.78125,37.34375a82.23957,82.23957,0,0,0,11.625,7.625c3.81671,1.99121,6.29529,4.83947,7.125,8.65625a48.91967,48.91967,0,0,1,1.1875,13.9375c-.33188,5.8081.6337,7.28015,2.625,4.625,2.15726-2.48914,2.83188-9.4347,2.5-20.71875,14.10516,10.78625,22.57553,19.55944,25.5625,26.03125a23.4813,23.4813,0,0,1,1.65625,8.625,90.5943,90.5943,0,0,1-1.15625,10.8125,48.44808,48.44808,0,0,1-1.65625,8.28125c-1.16159,4.64624-1.181,6.64221.3125,5.8125,3.4848-2.48926,6.32117-11.28394,8.3125-26.21875,6.96961,6.30578,11.26621,8.96435,12.59375,7.96875,1.49347-1.16175,1.6713-2.16065.34375-3.15625a96.01065,96.01065,0,0,1-6.96875-6.625,55.0272,55.0272,0,0,1-7.96875-10.8125,104.7434,104.7434,0,0,0-7.78125-11.28125c9.45874-.166,16.89887-4.48633,22.375-13.28125,5.47614-8.62915,7.30383-21.06946,5.3125-37-.49783-4.31446-1.96991-12.605-4.625-24.71875-2.32324-11.782-3.64654-18.26624-3.8125-19.59375-1.16159-10.95215-2.00217-18.91614-2.5-23.5625q-.99568-11.94782,1-17.90625c2.987-9.95667,4.30063-16.4292,3.96875-19.25-.33188-2.98706-1.3287-2.83851-2.65625.8125a110.84127,110.84127,0,0,0-4.46875,12.78125c-1.4935,4.81237-3.14337,4.67309-4.96875-.96875-1.82538-5.80823-3.485-10.12842-4.8125-13.28125-1.99133-4.31446-3.65307-8.81055-5.3125-13.125a330.10206,330.10206,0,0,0-16.09375-37.15625Zm-76.125,10.9375c-.006,0,18.72922,21.72045,11.40625,26.71875l1.71875-.8125c-.216.16638-.43548.3385-.65625.5-2.11136,2.26294-.63275-1.34156-2.46875-1.53125-3.64142,2.50293-4.118,7.78552-6.65625,11.375q-2.97858,2.81616-5.78125,5.8125c1.141-14.60059-8.39383-31.19214-13.34375-34.5-4.8808-3.26172,14.70783,28.35241,10.71875,37.40625-.92984,1.04565-1.82413,2.09558-2.71875,3.15625-.94742,1.20251-6.1799,5.89025-4.28125,1.5625-.3006-3.02393-2.93637-.27686-4.40625,1.65625,1.42047-16.8982-10.8775-39.17579-13.21875-39.6875-2.858-.62464,14.65955,32.03344,10.65625,42.21875l-4.5,3.25c1.8197-17.48987-10.40854-38.87317-13.125-40.75-2.78351-1.9231,15.54376,33.93249,10.28125,43.0625a56.255,56.255,0,0,1-5.59375,3.375,68.21632,68.21632,0,0,1-17.28125,6.59375l4.81693,4.48437c.78244-.035,1.10437-.66736,1.87057-.82812,7.45-1.96558,13.82822-6.56458,20.53125-10.1875,1.27408-.58362,2.53885-1.22193,3.78125-1.90625,11.06354,13.56372,32.46472,19.6737,38,19.4375,5.527-.23584-27.30963-11.84717-34.51349-21.46875a27.44607,27.44607,0,0,0,5.451-4.25,21.68281,21.68281,0,0,1,3.875-3.125c9.29053,9.30676,29.18311,14.46777,31.8125,13.4375,2.6825-1.05115-22.89819-8.38733-29.43756-15.16517,2.75186-1.627,4.63852-2.0736,7.31256-3.99108,3.47394-.32325,2.53781-5.69288-.625-3.625.14557-.96582,4.42929-5.35669,6.8125-7,.05991-.05506-1.32272-.75525.1875-.15625,1.38385.54895,17.02854,15.93188,21.21875,14.15625,4.19022-1.77576-14.45654-11.24244-19.01791-15.88392a81.32426,81.32426,0,0,0,10.48666-11.86608c1.481-1.89966,5.95252-8.0846,1.53125-8.25a85.25326,85.25326,0,0,1-9.59375,10.90625C475.70087,336.37271,465.84207,324.99429,458.93814,322.49466Z';
const S1_RBB          = 'M343.96939,369.61966c3.416,3.44274,6.72485,6.73352,8.40625,8.15625a17.8291,17.8291,0,0,1,3.65625,3.96875c5.80805,7.13549,8.9375,13.10339,8.9375,17.75.166,4.64624.82868,5.98156,2.15625,4.15625,1.32752-1.65943,1.32752-6.31177,0-13.28125,3.98261,3.31884,8.79541,7.46875,14.4375,12.28125a50.14089,50.14089,0,0,1,6.96875,7.65625c4.64642,6.47155,6.98062,11.77917,7.3125,16.09375.16593,4.48046.819,5.80395,2.3125,3.8125,1.4935-1.82532,1.01071-6.49158-1.3125-14.125,11.94791,9.95654,21.2276,18.59509,28.03125,26.0625,6.96961,7.30151,10.12283,14.94091,9.625,22.90625-.33188,7.6333.16275,9.2832,1.65625,4.96875a54.15837,54.15837,0,0,0,2.84375-15.09375c6.63773,7.6333,12.94415,15.10473,19.25,22.40625a80.2068,80.2068,0,0,1,19.25,24.71875c4.81235,9.45874,7.44937,16.08947,7.78125,19.90625.33191,3.81665-.65524,8.303-2.8125,13.28125a21.93443,21.93443,0,0,1-9.125,10.78125,23.80612,23.80612,0,0,1-12.28125,3.15625c-4.48044,0-7.64337-1.165-9.46875-3.15625a103.72273,103.72273,0,0,0-8.28125-7.46875c-3.4848-2.98706-6.30179-4.457-8.625-4.125-2.15726.3319-1.49448,1.63574,2.15625,4.125a36.53939,36.53939,0,0,1,8.4375,8.3125,3.98879,3.98879,0,0,1-1.46875-.15625c-13.44141-2.821-24.05627-5.00647-32.1875-6.5s-15.11981-2.48279-21.09375-3.3125c-3.65076-.6637-9.46039-1.32654-17.09375-2.15625-10.1225-11.94788-16.09271-18.58863-18.25-19.75-1.99133-1.32752-1.66693.35144.65625,4.5,2.48914,4.14856,5.15961,8.4569,8.3125,12.9375-13.60736-.49793-25.73523-1.18006-36.6875-1.84375-10.78631-.82972-19.40106-3.62525-25.375-8.4375-5.97394-4.81238-10.11432-8.46045-12.4375-11.28125-2.48913-2.65516-3.16376-2.16272-2.5,1.15625.82965,3.31872,2.8277,6.64025,6.3125,10.125a23.69082,23.69082,0,0,1-6.96875-1.5c-10.45441-3.65076-18.59827-6.63367-24.40625-8.625a69.92279,69.92279,0,0,1-12.4375-5.3125,26.71,26.71,0,0,1-7.625-7.46875c-2.65509-3.48487-4.999-5.8169-7.15625-6.8125-1.99133-.82984-2.306.15954-.8125,3.3125,1.49347,2.98706,3.15308,5.99145,4.8125,8.8125-3.65076-1.16175-6.804-2.17029-9.625-3-4.31451-1.32764-8.48608-2.64124-12.46875-3.96875-23.72986-8.46314-37.48395-16.45057-40.96875-24.25-.64618-1.29225-3.6722-5.71951-9.34385-13.45523a14.56125,14.56125,0,0,0-.99786-1.21656l-6.936-7.57593a.54634.54634,0,0,0-.9145.56081l2.13615,5.6947a22.012,22.012,0,0,0,3.36263,5.97012,118.57956,118.57956,0,0,1,10.19343,14.83459c-11.65013-4.81544-21.06729-11.89541-29.34987-19.21618a25.78886,25.78886,0,0,0-3.60535-2.68075l-10.14472-6.21231a.19192.19192,0,0,0-.24228.29272l10.17511,11.2a31.175,31.175,0,0,0,4.32474,3.96207,253.04323,253.04323,0,0,0,69.34237,37.217,62.73416,62.73416,0,0,1,6.8125,2.65625,37.16583,37.16583,0,0,0-14.9375,4.65625c-5.14422,2.821-6.63788,4.47082-4.8125,4.96875,1.99127.3319,5.61762-.33094,11.09375-2.15625,5.31018-2.15723,12.8031-2.49573,22.59375-1.5,9.4588.99572,24.53839,5.818,45.28125,14.28125,14.10516,4.81225,25.066,7.81665,33.03125,8.8125a53.22909,53.22909,0,0,1,6.46875,1.65625c-7.63336,1.82544-13.10895,4.31579-16.59375,7.46875-3.4848,3.15283-2.99988,3.98376,1.8125,2.65625,4.97827-1.16175,10.13916-2.653,15.78125-4.3125a45.40915,45.40915,0,0,1,15.75-2.34375c4.97827.3319,10.622.49023,17.09375.65625a169.45014,169.45014,0,0,1,18.4375.84375c5.974.66381,12.11981,1.48278,18.09375,2.3125q8.712,1.24439,20.90625,3.5c4.14859.82971,9.12949,1.65075,14.9375,2.8125-6.47177,2.32312-10.9602,5.46447-13.78125,9.28125q-3.98263,5.725,4.46875,1a59.70335,59.70335,0,0,1,11.96875-5.3125,25.24609,25.24609,0,0,1,12.09375-.96875c3.98261.66381,8.303,1.31445,13.28125,1.8125,4.9783.49768,11.46253-.17688,19.59375-2.5,5.31018-1.32752,9.943-4.62745,13.59375-9.9375,4.14859-5.80811,5.79846-12.79676,4.96875-21.09375a58.81733,58.81733,0,0,0-9.4375-26.875c7.13556,2.32324,11.60025,2.50317,13.09375.84375,1.65946-1.82544-.00015-3.01416-4.8125-3.84375-4.64639-.82972-9.2717-3.14234-14.25-7.125a69.25643,69.25643,0,0,1-12.78125-13.28125c-3.65076-4.9784-16.1224-17.74537-37.03125-38.15625-10.78631-10.62037-30.69058-27.87574-60.0625-51.9375-4.91119-4.09266-9.30786-8.03956-13.25-11.96875Z';
const S1_AV           = 'M239.56314,304.96341a9.30921,9.30921,0,0,0-1.25-.84375,13.62826,13.62826,0,0,0-2.71875-.5c.72809,2.18774,1.3811,4.3258,2.28125,6.625-2.32324,0-4.82336.30285-7.3125.46875-.055-2.4198.03943-4.792.09369-7.1875-.72235.078-1.36359.042-2.125.1875-.56128.10705-1.20062.35717-1.78125.5-.27234,4.05786-.17364,2.79248-.5,7.6875a36.69236,36.69236,0,0,0-14.28125,6.625c-7.79932,6.13989-12.93866,9.12719-15.59375,9.625-1.74054.23205-4.02258.274-6.25.34375-.417.45251-.90887.8894-1.3125,1.34375-.60614.68225-1.08093,1.37744-1.65625,2.0625,1.75269.142,3.54022.40625,5.25.40625a17.54026,17.54026,0,0,1,3.46875-.1875,87.78635,87.78635,0,0,0-11.78125,11.78125c-1.14893-1.40418-1.97906-2.45874-3.0625-3.78125-.66,1.00756-1.41711,2.03845-2,3.03125-.16235.27661-.25.53735-.40625.8125.84155,1.09387,1.7735,2.20275,2.5,3.28125-2.41736,6.04345-5.15961,10.3883-8.15625,13.46875-.005.01.005.026,0,.031a13.56322,13.56322,0,0,0,.59375,4.4375,9.09164,9.09164,0,0,0,5.4375,5.75,13.60435,13.60435,0,0,0,4.125.78125,76.97447,76.97447,0,0,0,20.90625-10.375c7.79932-5.64209,15.74377-15.08984,23.875-28.53125a34.39249,34.39249,0,0,1,15.84375-14.5,23.72353,23.72353,0,0,0,.5625-3.96875,13.59378,13.59378,0,0,0-.5625-4.28125h-2.0625c-.81952-1.63916-1.43719-3.38818-2.125-5.09375Z';
const S1_HIS_BUNDLE   = 'M343.96939,369.61966h9.25c-.05377-.054-.13385-.10254-.1875-.15625-11.94787-11.94788-19.42145-23.40345-22.90625-34.6875,8.5603,2.97229,20.38562,11.46386,35.1875,25.125v-9.28125c-3.88739-3.26758-8.54632-7.4281-14.09375-12.5a59.89632,59.89632,0,0,0-17.4375-11.78125c-5.97394-2.48926-8.94934-3.98279-9.28125-4.8125-5.808-8.62891-16.7785-12.62281-32.875-12.125-18.58557.82971-34.189.988-46.46875.65625h-1.3125c-.03607,0-.05829-.00025-.09369,0a13.59253,13.59253,0,0,1,.5625,4.28125,23.72194,23.72194,0,0,1-.5625,3.96875q9.66093-4.24659,23-2.78125c17.92182,1.82531,28.54645,3.4945,32.03125,4.65625,3.65076,1.32739,6.13153,2.97961,7.625,5.46875a7.54739,7.54739,0,0,0,6.3125,3.5c2.4892,0,5.13587,1.80835,7.625,5.625a164.71961,164.71961,0,0,1,9.78125,17.09375c2.48914,5.31,6.32453,10.29321,11.46875,15.4375,1.09815,1.13464,1.40821,1.33813,2.375,2.3125Z';
const S1_SA           = 'M134.31314,182.65091a36.1,36.1,0,0,0-3.0625-2.375,45.58947,45.58947,0,0,0-4.09375-2.15625c-22.63861,1.80957-37.586,5.38293-44.4375,10.8125-7.76489,6.00695-12.94208,15.82507-15.90625,28.84375.86029.66,1.61194,1.39343,2.5625,2a45.53489,45.53489,0,0,0,6.46875,3.40625c1.43872.62023,3.04028,1.0841,4.59375,1.59375.16919-.38965.25922-.76636.4375-1.15625a81.05942,81.05942,0,0,0,11.28125-1.6875,47.39655,47.39655,0,0,0-5.15625,4.5625c1.49292.30627,2.94208.67138,4.5.875.5556.073,1.1557.066,1.71875.125,5.866-5.34485,13.248-10.15662,22.1875-14.6875a81.55826,81.55826,0,0,1,27.96875-8.4375,18.10292,18.10292,0,0,0,.6875-4.34375c0-.17041-.05768-.33033-.0625-.5a84.90775,84.90775,0,0,0-17.15625,3.1875l1.15625-14.9375a84.83715,84.83715,0,0,0,15.53125,8.75,18.72829,18.72829,0,0,0-.34375-2.125,20.84071,20.84071,0,0,0-1.03125-2.09375,62.59063,62.59063,0,0,1-13.8125-9.34375C130.18558,182.81411,132.38327,182.7709,134.31314,182.65091Z';
const S1_INTERNODAL_B = 'M93.21939,227.49466c-.56305-.059-1.16315-.052-1.71875-.125-1.55792-.20362-3.00708-.56873-4.5-.875-1.21344,1.21972-2.39209,2.45788-3.46875,3.75a91.50808,91.50808,0,0,0-7.625,10.28125,58.43257,58.43257,0,0,1,4.53125-15.75c-1.55347-.50965-3.155-.97339-4.59375-1.59375a45.53489,45.53489,0,0,1-6.46875-3.40625c-.95056-.60657-1.70221-1.34-2.5625-2-.39319,1.727-.87652,3.30993-1.1875,5.15625-2.32318,13.77331-1.34576,25.22863,2.96875,34.6875-2.32318,8.96106-3.3103,24.72265-2.8125,47.125.166,22.2362,6.79675,39.343,19.90625,51.125,12.77759,11.61608,25.912,18.23474,39.1875,19.5625a214.70431,214.70431,0,0,0,41.3125,0,81.56757,81.56757,0,0,0,16.9375-3.71875,13.59706,13.59706,0,0,1-4.125-.78125,9.09164,9.09164,0,0,1-5.4375-5.75,13.56169,13.56169,0,0,1-.59375-4.4375,16.02126,16.02126,0,0,1-7.625,4.75c-5.14422,1.16149-11.77722,1.81457-20.40625,2.3125a126.51869,126.51869,0,0,1-31.03125-2.65625c-8.96094-2.15735-15.762-5.45716-20.90625-9.9375-.9956-.66382-4.6532-4.99158-11.125-12.625-8.46307-9.95655-12.4353-27.8844-11.9375-53.9375a121.635,121.635,0,0,1,2.3125-24.375c7.13556,10.45434,20.42841,20.74255,39.84375,31.03125,33.08252,17.46875,55.0708,33.76,66.53125,48.65625.15625-.27515.2439-.53589.40625-.8125.58289-.9928,1.34-2.02369,2-3.03125-3.14166-3.835-6.28381-7.63721-8.875-10.96875a68.89027,68.89027,0,0,0,15,2.75c.57532-.68506,1.05011-1.38025,1.65625-2.0625.40363-.45435.89551-.89136,1.3125-1.34375-.958.03-1.63946.15625-2.6875.15625-3.65076-.166-8.97009-1.50342-16.4375-4.65625a112.67635,112.67635,0,0,1-20.75-11.78125c-6.47174-4.97828-18.41974-12.0918-35.84375-21.21875-19.41534-10.28858-32.51849-20.76441-39.15625-31.21875-.33191-.82972-.82434-1.66065-1.15625-2.65625a.60354.60354,0,0,1,.15625-.5c2.32318-8.13123,6.64356-15.75135,13.28125-23.21875A59.01644,59.01644,0,0,1,93.21939,227.49466Zm-22.625-4.71875a26.72,26.72,0,0,0,6.65625,1,62.33061,62.33061,0,0,0-4.65625,23.21875,27.14947,27.14947,0,0,0-1.5,3.15625c-1.99127-7.63343-2.31567-16.41846-.65625-26.375C70.6041,223.60989,70.59439,223.10781,70.59439,222.77591Z';
const S1_INTERNODAL_A = 'M142.15689,192.30716a20.84071,20.84071,0,0,1,1.03125,2.09375,18.72829,18.72829,0,0,1,.34375,2.125c1.82349.8396,3.38178,1.70654,5.40625,2.53125-1.67932.036-3.28674.32287-4.9375.46875.005.16967.0625.32959.0625.5a18.101,18.101,0,0,1-.6875,4.34375,76.101,76.101,0,0,1,9.375-.5,272.92955,272.92955,0,0,1,40.3125,2.96875c11.78192,1.65942,21.0907,8.79235,27.5625,20.90625,5.974,11.61584,8.9353,25.22558,8.4375,41.15625,0,1.09021-1.06146,16.67175-2.3125,35.3125.58063-.14283,1.22-.39295,1.78125-.5.76141-.14515,1.40265-.10938,2.125-.1875.10968-4.83252.3515-9.64966.90625-14.53125a124.12023,124.12023,0,0,0,4.03125,14.625,13.61973,13.61973,0,0,1,2.71875.5,9.28664,9.28664,0,0,1,1.25.84375c-4.18689-10.38208-6.07013-21.93628-5.5-34.90625.99567-16.76026-1.98944-31.51563-9.125-44.625-7.30145-13.77344-17.77734-21.73719-31.21875-23.5625a261.40151,261.40151,0,0,0-34.34375-2.8125A99.86286,99.86286,0,0,1,142.15689,192.30716Z';
const S1_BACHMANN     = 'M359.46939,115.58841q-17.46679-1.01514-58.875,15.75-55.0101,22.40222-70.1875,27.5625c-9.61631,3.46819-14.89589,5.12381-15.82665,5.56528a1.70393,1.70393,0,0,1-.23208.09655c-24.5115,7.44419-46.70469,11.57232-66.25377,12.40067-5.84235.16689-11.17523.45063-16.21317.802a1.36275,1.36275,0,0,0-.63058,2.51047v0a27.47776,27.47776,0,0,1,2.65106,2.04213,1.35015,1.35015,0,0,0,.93979.3c4.32518-.26976,8.60875-.54294,13.40915-.6546,21.40662-.82959,47.14209-6.3053,77.34375-16.59375,16.09644-5.64222,33.34-12.44324,51.59375-20.90632q72.43415-33.35457,90.625-22.59375a46.22027,46.22027,0,0,1,7.78125,6.00007,39.47573,39.47573,0,0,1,6.15625,6.96868c1.65943,2.48908,1.82758,8.11121.5,16.90632a141.52738,141.52738,0,0,1-7.3125,26.90625c-3.31891,9.29284-4.47412,14.09375-3.3125,14.09375.99567.16577,2.64337-2.81922,4.46875-9.125,1.0487-3.23347,2.10192-6.28479,3.17914-9.0792a1.35326,1.35326,0,0,1,2.6114.56876c-.14724,2.68449-.31434,5.63111-.478,8.82294-.4978,6.4718-.15192,10.12695.84375,10.625.82971.66357,1.471-2.82361,1.96875-10.125.33191-7.46741.5-13.26966.5-17.75-.15734-4.407.29889-13.43566,1.62056-27.23883a1.356,1.356,0,0,1,2.10585-.99991c2.81453,1.89442,5.90523,3.80493,9.55484,5.83242,5.97562,3.31891,10.96838,6.15522,15.28125,8.31257a18.81094,18.81094,0,0,1,9.28125,9.9375c2.15726,4.48034,2.49567,9.96777,1.5,16.9375-.99567,6.63769-.99567,8.63354,0,5.8125,1.32755-3.153,1.82437-6.81055,2.15625-11.125a51.79716,51.79716,0,0,0-.90318-10.8809,1.35659,1.35659,0,0,1,2.249-1.23241c4.68444,4.29382,7.14038,8.9113,7.2792,13.76956q0,13.19256,1.5,0c1.16159-8.79505-5.98108-17.08545-20.75-24.71875q-22.4023-11.45015-28.375-17.4375c-3.98266-3.98273-10.28693-9.10041-18.75-15.40625C366.35361,116.70968,363.35092,115.814,359.46939,115.58841Z';

export function ConductionDiagram({ rhythmKey }: { rhythmKey: string }): React.ReactElement | null {
  const state = CONDUCTION_MAP[rhythmKey];
  if (!state) return null;
  const c = (s: NodeState) => CD_COLORS[s];
  const on = (s: NodeState) => s === 'active' || s === 'ectopic';
  const cs = (s: NodeState, delay: number): React.CSSProperties =>
    on(s) ? { animationDelay: `${delay}s` } : { display: 'none' };

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 14, padding: '12px 14px 8px', boxShadow: 'var(--shadow-1)' }}>
      <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8 }}>
        SISTEM KONDUKSI JANTUNG
      </div>
      <svg viewBox="0 0 615.51631 607.96356" width="100%" style={{ display: 'block' }}>
        <image href="/heart-anatomy.svg" width="615.51631" height="607.96356" opacity={0.65} />
        {/* SA node (path5632, orange, upper-left ~105,203) */}
        <path d={S1_SA} fill={c(state.sa)} opacity={0.85} />
        {state.sa === 'active' && (
          <circle cx="105" cy="200" r="22" fill="none" stroke={c('active')} strokeWidth="2.5"
            className="acls-sa-ring" />
        )}
        {/* Internodal tracts + Bachmann (red, raPath) */}
        <path d={S1_INTERNODAL_A} fill={c(state.raPath)} opacity={0.30} />
        <path d={S1_INTERNODAL_A} fill="none" stroke={c(state.raPath)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.raPath, 0)} />
        <path d={S1_INTERNODAL_B} fill={c(state.raPath)} opacity={0.30} />
        <path d={S1_INTERNODAL_B} fill="none" stroke={c(state.raPath)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.raPath, 0.15)} />
        <path d={S1_BACHMANN} fill={c(state.raPath)} opacity={0.25} />
        <path d={S1_BACHMANN} fill="none" stroke={c(state.raPath)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.raPath, 0.28)} />
        {/* AV node (path5583, blue, ~208,337) */}
        <path d={S1_AV} fill={c(state.av)} opacity={0.85} />
        {state.av === 'active' && (
          <circle cx="208" cy="337" r="16" fill="none" stroke={c('active')} strokeWidth="2.5"
            className="acls-av-ring" />
        )}
        {state.av === 'blocked' && (
          <text x="208" y="337" fontSize="22" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}
        {/* His bundle (path5585, gradient, ~305,340) */}
        <path d={S1_HIS_BUNDLE} fill={c(state.his)} opacity={0.35} />
        <path d={S1_HIS_BUNDLE} fill="none" stroke={c(state.his)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.his, 0.38)} />
        {/* Right bundle branch (path5590, yellow, ~313,466) */}
        <path d={S1_RBB} fill={c(state.rbb)} opacity={0.35} />
        <path d={S1_RBB} fill="none" stroke={c(state.rbb)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.rbb, 0.55)} />
        {/* Left bundle branch + Purkinje (path5592, yellow, ~478,441) */}
        <path d={S1_LBB} fill={c(state.lbb)} opacity={0.45} />
        <path d={S1_LBB} fill="none" stroke={c(state.lbb)} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" pathLength={100}
          className="acls-cs-path" style={cs(state.lbb, 0.55)} />
        {state.lbb === 'blocked' && (
          <text x="480" y="430" fontSize="22" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}
        {state.rbb === 'blocked' && (
          <text x="315" y="455" fontSize="22" fill={CD_COLORS.blocked} fontWeight="800"
            textAnchor="middle" dominantBaseline="middle">✕</text>
        )}
        {/* Labels */}
        <text x="45"  y="200" textAnchor="end"   fontSize="14" fill="var(--label-primary)"  fontWeight="700">SA</text>
        <text x="140" y="390" textAnchor="end"   fontSize="14" fill="var(--label-primary)"  fontWeight="700">AV</text>
        <text x="375" y="340" textAnchor="start" fontSize="12" fill="var(--label-tertiary)" fontWeight="600">His</text>
        <text x="545" y="325" textAnchor="start" fontSize="12" fill="var(--label-tertiary)" fontWeight="600">LBB</text>
        <text x="120" y="385" textAnchor="start" fontSize="12" fill="var(--label-tertiary)" fontWeight="600">RBB</text>
        {/* WPW accessory pathway — from SA area bypassing AV node to ventricle */}
        {rhythmKey === 'wpw' && (
          <path d="M135,225 Q60,295 115,350 Q150,385 208,360" fill="none" stroke="#FFA000"
            strokeWidth="3" strokeDasharray="8 4" opacity={0.85} />
        )}
        {/* AF — multi-focal ectopics in right atrium (left side of SVG = patient right) */}
        {rhythmKey === 'af' && (<>
          <circle cx="80"  cy="260" r="7" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.85} />
          <circle cx="100" cy="285" r="6" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.78} style={{ animationDelay: '0.30s' }} />
          <circle cx="65"  cy="290" r="6" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.82} style={{ animationDelay: '0.58s' }} />
          <circle cx="90"  cy="315" r="5" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.72} style={{ animationDelay: '0.84s' }} />
          <circle cx="115" cy="270" r="5" fill={CD_COLORS.ectopic} className="acls-conduction-ectopic" opacity={0.65} style={{ animationDelay: '1.08s' }} />
        </>)}
        {/* VF/TdP — chaotic across both ventricles */}
        {(rhythmKey === 'vf' || rhythmKey === 'torsades') && (
          ([[100,400],[160,440],[90,480],[175,385],[140,515],[460,400],[490,445],[425,478],[535,420],[475,515],[295,465],[340,405]] as [number,number][]).map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill={CD_COLORS.blocked}
              className="acls-conduction-ectopic" opacity={0.45}
              style={{ animationDelay: `${i * 0.14}s` }} />
          ))
        )}
        {/* Generic ectopic focus */}
        {state.ectopicPos && rhythmKey !== 'af' && (() => {
          const ectopicCoords: Record<string, [number, number]> = {
            ra: [100, 270], la: [450, 205], rv: [130, 500], lv: [490, 500],
          };
          const [ex, ey] = ectopicCoords[state.ectopicPos ?? ''] ?? [0, 0];
          return (<>
            <circle cx={ex} cy={ey} r="12" fill={CD_COLORS.ectopic}
              className="acls-conduction-ectopic" opacity={0.88} />
            {state.ectopicLabel && (
              <text x={ex} y={ey + 22} textAnchor="middle" fontSize="13"
                fill={CD_COLORS.ectopic} fontWeight="700">{state.ectopicLabel}</text>
            )}
          </>);
        })()}
      </svg>
      {/* Mini ECG strip with scan cursor */}
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
    shock:    { tint: "var(--danger)",       label: "Shock",     bg: "color-mix(in srgb, var(--danger) 10%, transparent)" },
    drug:     { tint: "var(--tint-drug)",    label: "Obat",      bg: "var(--bg-tertiary)" },
    note:     { tint: "var(--tint-theory)", label: "Catatan",   bg: "var(--bg-tertiary)" },
    outcome:  { tint: "var(--success)",      label: "Hasil",     bg: "color-mix(in srgb, var(--success) 10%, transparent)" },
    decision: { tint: "var(--warning)",      label: "Keputusan", bg: "var(--bg-tertiary)" },
  } as Record<string, { tint: string; label: string; bg: string }>)[step.kind] || { tint: "var(--accent)", label: "Langkah", bg: "var(--bg-tertiary)" };

  // Decision step — tidak berubah dari versi asli
  if (step.kind === "decision") {
    return (
      <div className="flow-step decision">
        <div className="flow-tag" style={{ background: "color-mix(in srgb, var(--warning) 14%, transparent)", color: "var(--warning)" }}>Keputusan</div>
        <div className="t-headline" style={{ marginTop: 2 }}>{step.title}</div>
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{step.q}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => onAction && onAction("yes")}
            style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: step.yes.tint, boxShadow: "inset 0 0 0 0.5px " + step.yes.tint + "40", border: 0, cursor: "pointer" }}
          >
            <div className="t-caption-2">YES</div>
            <div className="t-subheadline" style={{ fontWeight: 600, marginTop: 1 }}>{step.yes.label}</div>
          </button>
          <button
            onClick={() => onAction && onAction("no")}
            style={{ padding: "10px 12px", borderRadius: 10, textAlign: "left", background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: step.no.tint, boxShadow: "inset 0 0 0 0.5px " + step.no.tint + "40", border: 0, cursor: "pointer" }}
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
        { key: "home",  label: "Beranda",   icon: Icons.house,    iconFill: Icons.houseFill },
        { key: "algo",  label: "Algoritma", icon: Icons.algo,     iconFill: Icons.algoFill },
        { key: null,    label: "",          icon: null },
        { key: "drugs", label: "Obat",      icon: Icons.pill,     iconFill: Icons.pillFill },
        { key: "more",  label: "Lainnya",   icon: Icons.grid,     iconFill: Icons.gridFill },
      ].map((t, i) => {
        if (!t.icon) return <div key={i} />;
        if (t.key === "more") {
          const isActive = moreActive;
          const I = isActive ? t.iconFill : t.icon;
          return (
            <button key="more" className={"nav-btn " + (isActive ? "active" : "")} onClick={onMore} aria-label={t.label}>
              <I size={24} />
            </button>
          );
        }
        const isActive = active === t.key;
        const I = isActive ? t.iconFill : t.icon;
        return (
          <button key={t.key} className={"nav-btn " + (isActive ? "active" : "")} onClick={() => onChange(t.key)} aria-label={t.label}>
            <I size={24} />
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
  const sheet = (
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
  return ReactDOM.createPortal(sheet, document.body);
}
/* CPRTimer + seluruh klaster CPR (metronom, animasi, decision tree)
   dipindah ke src/components/cpr.tsx agar file ini fokus ke komponen
   EKG/flow/nav. Di-re-export untuk stabilitas API. */
export { CPRTimer } from '../cpr';
