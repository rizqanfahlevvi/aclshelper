import React, { useState, useEffect } from 'react';
import { ACLS_RHYTHMS } from '../../data';
import { NavBar } from '../../components/base';
import type { Nav } from '../../types';

/* ============================================================
   Types
   ============================================================ */
type NodeState = 'active' | 'blocked' | 'ectopic' | 'inactive' | 'dim';

interface EctopicSite {
  x: number;
  y: number;
  label?: string;
  delay?: number;
}

interface ConductionState {
  sa: NodeState;
  av: NodeState;
  his: NodeState;
  lbb: NodeState;
  rbb: NodeState;
  lv: NodeState;
  rv: NodeState;
  ra: NodeState;
  la: NodeState;
  ectopicSites?: EctopicSite[];
  showAccessory?: boolean;
  caption: string;
  beatMs: number;
}

/* ============================================================
   Colors
   ============================================================ */
const COL: Record<NodeState, string> = {
  active:   '#34C759',
  blocked:  '#FF3B30',
  ectopic:  '#FF9500',
  inactive: '#8E8E93',
  dim:      '#8E8E93',
};

/* ============================================================
   Conduction map
   ============================================================ */
const CONDUCTION_MAP: Record<string, ConductionState> = {
  nsr: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    caption:'SA node memulai impuls → konduksi internodal → AV node (delay 120–200 ms) → Bundle of His → LBB + RBB → kedua ventrikel secara bersamaan.',
    beatMs: 820,
  },
  af: {
    sa:'inactive', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'ectopic', la:'inactive',
    ectopicSites: [
      { x: 200, y: 42, delay: 0   },
      { x: 232, y: 55, delay: 180 },
      { x: 215, y: 30, delay: 360 },
      { x: 248, y: 45, delay: 540 },
      { x: 205, y: 62, delay: 720 },
    ],
    caption:'SA node inaktif. Banyak fokus ektopik di RA memicu fibrilasi atrium. AV node memfilter impuls secara ireguler → irama ventrikel ireguler.',
    beatMs: 600,
  },
  flutter: {
    sa:'inactive', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'ectopic', la:'inactive',
    ectopicSites: [{ x: 228, y: 45, label: 'Reentry', delay: 0 }],
    caption:'Sirkuit reentry makro di RA (cavotrikuspid isthmus). Frekuensi atrium 300×/mnt. AV konduksi 2:1 → HR ventrikel ~150/mnt.',
    beatMs: 500,
  },
  svt: {
    sa:'inactive', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'inactive', la:'inactive',
    ectopicSites: [{ x: 150, y: 76, label: 'Reentry', delay: 0 }],
    caption:'Sirkuit reentry di dalam atau di sekitar AV node. QRS sempit, reguler, cepat (150–250/mnt). Gelombang P tersembunyi di QRS.',
    beatMs: 380,
  },
  av3: {
    sa:'active', av:'blocked', his:'inactive', lbb:'inactive', rbb:'inactive',
    lv:'inactive', rv:'ectopic', ra:'active', la:'active',
    ectopicSites: [{ x: 222, y: 185, label: 'Escape IDV', delay: 0 }],
    caption:'SA node aktif (gelombang P reguler) tetapi impuls terblokir total di AV node. Ventrikel dipacu oleh fokus escape idioventrikular (lebar, lambat, 20–40/mnt).',
    beatMs: 1500,
  },
  vt: {
    sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
    lv:'ectopic', rv:'inactive', ra:'inactive', la:'inactive',
    ectopicSites: [{ x: 72, y: 190, label: 'Fokus VT', delay: 0 }],
    caption:'Fokus ektopik di LV memicu takikardi ventrikel monomorfik. Tidak ada aktivitas SA/AV. QRS lebar (>120 ms), takikardi reguler.',
    beatMs: 420,
  },
  vf: {
    sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
    lv:'inactive', rv:'inactive', ra:'inactive', la:'inactive',
    ectopicSites: [
      { x: 55,  y: 165, delay: 0   },
      { x: 95,  y: 195, delay: 120 },
      { x: 115, y: 170, delay: 240 },
      { x: 75,  y: 210, delay: 80  },
      { x: 185, y: 170, delay: 60  },
      { x: 220, y: 195, delay: 200 },
      { x: 245, y: 175, delay: 340 },
      { x: 200, y: 215, delay: 160 },
    ],
    caption:'VF — aktivitas listrik chaotic di seluruh miokard ventrikel. Tidak ada konduksi terorganisir. Tidak ada output mekanik. → Defibrilasi segera.',
    beatMs: 200,
  },
  torsades: {
    sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
    lv:'inactive', rv:'inactive', ra:'inactive', la:'inactive',
    ectopicSites: [
      { x: 80,  y: 185, delay: 0   },
      { x: 120, y: 200, delay: 150 },
      { x: 200, y: 185, delay: 100 },
      { x: 240, y: 200, delay: 250 },
    ],
    caption:'Torsades de Pointes — VT polimorfik terkait pemanjangan interval QT. Konduksi normal antara episode. Risiko degenerasi ke VF.',
    beatMs: 280,
  },
  asys: {
    sa:'inactive', av:'inactive', his:'inactive', lbb:'inactive', rbb:'inactive',
    lv:'inactive', rv:'inactive', ra:'inactive', la:'inactive',
    caption:'Asistol — tidak ada aktivitas listrik di seluruh jantung. Garis lurus di EKG. Prognosis sangat buruk kecuali penyebab reversibel segera dikoreksi.',
    beatMs: 0,
  },
  pea: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    caption:'PEA — aktivitas listrik normal (terkoordinasi), tetapi kontraksi miokard tidak menghasilkan nadi yang teraba. Cari dan koreksi Hs & Ts.',
    beatMs: 750,
  },
  lbbb: {
    sa:'active', av:'active', his:'active', lbb:'blocked', rbb:'active',
    lv:'dim', rv:'active', ra:'active', la:'active',
    caption:'LBB terblokir. Impuls melewati RBB → aktivasi RV lebih dulu → LV diaktivasi terlambat via konduksi lambat septum. QRS lebar, morfologi rsR\' / QS di V1.',
    beatMs: 900,
  },
  brugada: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'blocked',
    lv:'active', rv:'dim', ra:'active', la:'active',
    caption:'Pola Brugada — RBB abnormal + gangguan repolarisasi RV epikardial. Konduksi macroscopic normal tetapi gradien fase 2 menimbulkan risiko reentry → VF mendadak.',
    beatMs: 800,
  },
  wpw: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    showAccessory: true,
    caption:'WPW — jalur aksesori (Kent bundle) mem-bypass AV node. Pre-eksitasi ventrikel menghasilkan delta wave + interval PR pendek. Risiko konduksi antidromik.',
    beatMs: 700,
  },
  stemi: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    caption:'STEMI — konduksi listrik normal. Iskemia transmural (oklusi koroner) menyebabkan elevasi ST dan kerusakan miokard. Perlu reperfusi segera.',
    beatMs: 850,
  },
  hyperk: {
    sa:'dim', av:'dim', his:'dim', lbb:'dim', rbb:'dim',
    lv:'dim', rv:'dim', ra:'dim', la:'dim',
    caption:'Hiperkalemia — kadar K⁺ tinggi memperlambat konduksi di seluruh sistem. PR panjang, QRS melebar (sinusoidal), gelombang T lancip. Risiko VF/asistol.',
    beatMs: 1300,
  },
  wellens: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    caption:'Wellens — konduksi listrik normal. Perubahan gelombang T di V2–V3 (bifasik / inversi dalam) mencerminkan reperfusi spontan LAD proksimal. Tanda iskemia kritis pre-infark.',
    beatMs: 800,
  },
  dewinter: {
    sa:'active', av:'active', his:'active', lbb:'active', rbb:'active',
    lv:'active', rv:'active', ra:'active', la:'active',
    caption:'De Winter — konduksi normal. Upsloping ST depresi + gelombang T tinggi di prekordial = oklusi LAD proksimal akut. Setara STEMI, perlu kateterisasi segera.',
    beatMs: 800,
  },
};

/* ============================================================
   SVG path constants
   viewBox 0 0 300 240

   LA  x:12-143   y:18-85
   RA  x:157-288  y:18-85   SA:(258,36)
   LV  M12,86 L144,86 L128,226 L28,226 Z
   RV  M156,86 L288,86 L272,226 L172,226 Z

   SA node:  (258,36)
   AV node:  (150,79)
   His rect: (142,104) w16 h8
   LBB node: (92,152)
   RBB node: (208,152)
   LBB Pur1: M92,152 L66,202
   LBB Pur2: M92,152 L100,208
   RBB Pur1: M208,152 L222,202
   RBB Pur2: M208,152 L234,207
   ============================================================ */
const P_SA_AV    = 'M258,39 C228,52 195,66 150,79';
const P_HIS      = 'M150,83 L150,112';
const P_LBB      = 'M150,112 L92,152';
const P_RBB      = 'M150,112 L208,152';
const P_LBB_P1   = 'M92,152 L66,202';
const P_LBB_P2   = 'M92,152 L100,208';
const P_RBB_P1   = 'M208,152 L222,202';
const P_RBB_P2   = 'M208,152 L234,207';
const P_ACCESSOR = 'M258,39 Q286,95 268,140 Q258,162 208,152';

/* ============================================================
   Beat-synced dot — travels ONE path segment, timed to beat
   Uses beat-period duration + keyTimes/keyPoints so all dots
   share the same 'clock', giving synchronized animation.

   t0, t1: start/end time in ms (within one beat period)
   ============================================================ */
function BeatDot({ pathD, beat, t0, t1, r = 5, color = COL.active }: {
  pathD: string; beat: number; t0: number; t1: number;
  r?: number; color?: string;
}) {
  const f = (t: number) => (Math.min(t, beat) / beat).toFixed(4);
  const end = Math.min(t1, beat - 2);
  // keyTimes must be strictly ascending; add tiny epsilon after end
  const endNext = Math.min(end + 2, beat - 1);
  const kt = `0;${f(t0)};${f(end)};${f(endNext)};1`;
  const kp = '0;0;1;1;1';
  const ov = '0;0.9;0.9;0;0';
  return (
    <circle r={r} fill={color} opacity={0}>
      <animateMotion
        path={pathD}
        dur={`${beat}ms`}
        repeatCount="indefinite"
        calcMode="linear"
        keyTimes={kt}
        keyPoints={kp}
      />
      <animate
        attributeName="opacity"
        dur={`${beat}ms`}
        repeatCount="indefinite"
        values={ov}
        keyTimes={kt}
      />
    </circle>
  );
}

/* ============================================================
   Schematic SVG conduction diagram
   ============================================================ */
function ConductionSVG({ state, rhythmKey, beatKey }: {
  state: ConductionState;
  rhythmKey: string;
  beatKey: number;
}) {
  const c = (s: NodeState) => COL[s];

  const chamberC = (s: NodeState): string =>
    s === 'active' ? COL.active
    : s === 'ectopic' ? COL.ectopic
    : s === 'dim' ? COL.dim
    : COL.inactive;

  const showPath = (s: NodeState) => s === 'active' || s === 'dim';

  // Beat-synced timing (proportional to beat period)
  // SA rhythms: SA→AV 0–30% | AV delay 30–47% | His 47–55% | Branch 55–82%
  // AV rhythms: His 0–8% | Branch 8–45%
  const b = state.beatMs;
  const hasSA  = state.sa === 'active' || state.sa === 'dim';
  const hasAV  = state.av !== 'blocked' && state.av !== 'inactive';
  const hasHis = state.his !== 'inactive';
  const hasLBB = state.lbb === 'active' || state.lbb === 'dim';
  const hasRBB = state.rbb === 'active' || state.rbb === 'dim';

  // Timing anchors (ms)
  const T_SA_END   = Math.floor(b * 0.30);
  const T_HIS_0    = hasSA ? Math.floor(b * 0.47) : 0;
  const T_HIS_1    = T_HIS_0 + Math.floor(b * 0.08);
  const T_LBB_0    = T_HIS_1;
  const T_LBB_1    = T_LBB_0 + Math.floor(b * 0.15);
  const T_RBB_0    = T_HIS_1;
  const T_RBB_1    = T_RBB_0 + Math.floor(b * 0.14);
  const T_LP1_1    = Math.min(T_LBB_1 + Math.floor(b * 0.12), b - 2);
  const T_RP1_1    = Math.min(T_RBB_1 + Math.floor(b * 0.11), b - 2);

  return (
    <svg
      key={beatKey}
      viewBox="0 0 300 240"
      width="100%"
      style={{ maxWidth: 400, display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      {/* ─── CHAMBERS ─── */}
      {/* LA */}
      <rect x="12" y="18" width="130" height="66" rx="14"
        fill={chamberC(state.la)} fillOpacity={0.1}
        stroke={chamberC(state.la)} strokeOpacity={0.45} strokeWidth="1.5"/>
      {/* RA */}
      <rect x="156" y="18" width="130" height="66" rx="14"
        fill={chamberC(state.ra)} fillOpacity={0.1}
        stroke={chamberC(state.ra)} strokeOpacity={0.45} strokeWidth="1.5"/>
      {/* LV */}
      <path d="M12,86 L144,86 L128,226 L28,226 Z"
        fill={chamberC(state.lv)} fillOpacity={0.1}
        stroke={chamberC(state.lv)} strokeOpacity={0.45} strokeWidth="1.5"/>
      {/* RV */}
      <path d="M156,86 L288,86 L272,226 L172,226 Z"
        fill={chamberC(state.rv)} fillOpacity={0.1}
        stroke={chamberC(state.rv)} strokeOpacity={0.45} strokeWidth="1.5"/>

      {/* Septum dividers */}
      <line x1="148" y1="18"  x2="148" y2="86"  stroke="var(--separator)" strokeWidth="1" strokeOpacity="0.35"/>
      <line x1="148" y1="86"  x2="148" y2="230" stroke="var(--separator)" strokeWidth="1" strokeOpacity="0.35"/>

      {/* Chamber labels */}
      <text x="76"  y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill={chamberC(state.la)} fillOpacity={0.75}>LA</text>
      <text x="222" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill={chamberC(state.ra)} fillOpacity={0.75}>RA</text>
      <text x="72"  y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill={chamberC(state.lv)} fillOpacity={0.75}>LV</text>
      <text x="226" y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill={chamberC(state.rv)} fillOpacity={0.75}>RV</text>

      {/* ─── CONDUCTION PATHS ─── */}
      {/* SA → AV */}
      {showPath(state.sa) && state.av !== 'blocked' && (
        <path d={P_SA_AV} fill="none"
          stroke={c(state.sa)} strokeWidth="2"
          strokeOpacity={state.sa === 'dim' ? 0.35 : 0.65}
          strokeDasharray={state.sa === 'dim' ? '5 3' : 'none'}/>
      )}
      {/* AV → His */}
      {state.av !== 'blocked' && showPath(state.his) && (
        <path d={P_HIS} fill="none"
          stroke={c(state.his)} strokeWidth="2.5" strokeOpacity={state.his === 'dim' ? 0.35 : 0.75}/>
      )}
      {/* His → LBB */}
      {state.lbb !== 'blocked' && showPath(state.lbb) && (
        <path d={P_LBB} fill="none" stroke={c(state.lbb)} strokeWidth="2"
          strokeOpacity={state.lbb === 'dim' ? 0.35 : 0.75}/>
      )}
      {state.lbb === 'blocked' && (
        <path d={P_LBB} fill="none" stroke={COL.blocked} strokeWidth="2" strokeOpacity={0.4} strokeDasharray="4 3"/>
      )}
      {/* His → RBB */}
      {state.rbb !== 'blocked' && showPath(state.rbb) && (
        <path d={P_RBB} fill="none" stroke={c(state.rbb)} strokeWidth="2"
          strokeOpacity={state.rbb === 'dim' ? 0.35 : 0.75}/>
      )}
      {state.rbb === 'blocked' && (
        <path d={P_RBB} fill="none" stroke={COL.blocked} strokeWidth="2" strokeOpacity={0.4} strokeDasharray="4 3"/>
      )}
      {/* Purkinje LV */}
      {state.lbb !== 'blocked' && showPath(state.lv) && (
        <>
          <path d={P_LBB_P1} fill="none" stroke={c(state.lv)} strokeWidth="1.5" strokeOpacity={0.45}/>
          <path d={P_LBB_P2} fill="none" stroke={c(state.lv)} strokeWidth="1.5" strokeOpacity={0.45}/>
        </>
      )}
      {/* Purkinje RV */}
      {state.rbb !== 'blocked' && showPath(state.rv) && (
        <>
          <path d={P_RBB_P1} fill="none" stroke={c(state.rv)} strokeWidth="1.5" strokeOpacity={0.45}/>
          <path d={P_RBB_P2} fill="none" stroke={c(state.rv)} strokeWidth="1.5" strokeOpacity={0.45}/>
        </>
      )}

      {/* Blocked markers ✕ */}
      {state.lbb === 'blocked' && (
        <text x="112" y="133" fontSize="13" fill={COL.blocked} fontWeight="900" textAnchor="middle">✕</text>
      )}
      {state.rbb === 'blocked' && (
        <text x="186" y="133" fontSize="13" fill={COL.blocked} fontWeight="900" textAnchor="middle">✕</text>
      )}

      {/* WPW accessory pathway */}
      {state.showAccessory && (
        <path d={P_ACCESSOR} fill="none" stroke={COL.ectopic} strokeWidth="2.5"
          strokeDasharray="8 4" strokeOpacity={0.85}/>
      )}

      {/* ─── NODES ─── */}
      {/* SA node */}
      <circle cx="258" cy="36" r="9" fill={c(state.sa)} fillOpacity={0.9}/>
      {state.sa === 'active' && (
        <circle cx="258" cy="36" r="15" fill="none" stroke={c(state.sa)} strokeWidth="1.5" strokeOpacity={0.4}
          style={{ animation: 'acls-sa-ring 1.2s ease-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}/>
      )}
      <text x="258" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill={c(state.sa)} fillOpacity={0.85}>SA</text>

      {/* AV node */}
      <circle cx="150" cy="79" r="7" fill={c(state.av)} fillOpacity={0.9}/>
      {state.av === 'blocked' && (
        <text x="150" y="84" fontSize="11" fill="#fff" fontWeight="900" textAnchor="middle" dominantBaseline="middle">✕</text>
      )}
      <text x="132" y="79" textAnchor="end" fontSize="9" fontWeight="700" fill={c(state.av)} fillOpacity={0.85} dominantBaseline="middle">AV</text>

      {/* His bundle */}
      <rect x="142" y="112" width="16" height="8" rx="3" fill={c(state.his)} fillOpacity={0.85}/>
      <text x="163" y="120" textAnchor="start" fontSize="8" fontWeight="600" fill={c(state.his)} fillOpacity={0.85}>His</text>

      {/* LBB node */}
      {state.lbb !== 'blocked' && (
        <circle cx="92" cy="152" r="5" fill={c(state.lbb)} fillOpacity={0.9}/>
      )}
      <text x="74" y="155" textAnchor="end" fontSize="8" fontWeight="600"
        fill={c(state.lbb)} fillOpacity={0.85} dominantBaseline="middle">LBB</text>

      {/* RBB node */}
      {state.rbb !== 'blocked' && (
        <circle cx="208" cy="152" r="5" fill={c(state.rbb)} fillOpacity={0.9}/>
      )}
      <text x="226" y="155" textAnchor="start" fontSize="8" fontWeight="600"
        fill={c(state.rbb)} fillOpacity={0.85} dominantBaseline="middle">RBB</text>

      {/* ─── ECTOPIC SITES ─── */}
      {state.ectopicSites?.map((site, i) => (
        <g key={i}>
          <circle cx={site.x} cy={site.y} r="6" fill={COL.ectopic} fillOpacity={0.92}
            style={{
              animation: `acls-ectopic-pulse 0.9s ${site.delay ?? 0}ms ease-in-out infinite`,
              transformBox: 'fill-box', transformOrigin: 'center',
            }}/>
          {site.label && (
            <text x={site.x} y={site.y + 15} fontSize="8" fill={COL.ectopic}
              textAnchor="middle" fontWeight="700">{site.label}</text>
          )}
        </g>
      ))}

      {/* ─── BEAT-SYNCED PROPAGATION DOTS ─── */}
      {b > 0 && hasAV && hasHis && (
        <>
          {/* SA → AV (only if SA fires and AV not blocked) */}
          {hasSA && state.av !== 'blocked' && (
            <BeatDot pathD={P_SA_AV} beat={b} t0={0} t1={T_SA_END} r={5}/>
          )}
          {/* AV → His */}
          <BeatDot pathD={P_HIS} beat={b} t0={T_HIS_0} t1={T_HIS_1} r={4.5}/>
          {/* His → LBB */}
          {hasLBB && (
            <BeatDot pathD={P_LBB} beat={b} t0={T_LBB_0} t1={T_LBB_1} r={4.5}/>
          )}
          {/* LBB → LV Purkinje */}
          {hasLBB && (
            <BeatDot pathD={P_LBB_P1} beat={b} t0={T_LBB_1} t1={T_LP1_1} r={4}/>
          )}
          {/* His → RBB */}
          {hasRBB && (
            <BeatDot pathD={P_RBB} beat={b} t0={T_RBB_0} t1={T_RBB_1} r={4.5}/>
          )}
          {/* RBB → RV Purkinje */}
          {hasRBB && (
            <BeatDot pathD={P_RBB_P1} beat={b} t0={T_RBB_1} t1={T_RP1_1} r={4}/>
          )}
          {/* WPW: extra early dot via accessory path */}
          {state.showAccessory && (
            <BeatDot pathD={P_ACCESSOR} beat={b} t0={0} t1={Math.floor(b * 0.22)} r={4} color={COL.ectopic}/>
          )}
        </>
      )}
    </svg>
  );
}

/* ============================================================
   Legend
   ============================================================ */
function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
      {[
        { color: COL.active,   label: 'Aktif' },
        { color: COL.blocked,  label: 'Blok' },
        { color: COL.ectopic,  label: 'Ektopik' },
        { color: COL.inactive, label: 'Inaktif' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }}/>
          <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>{label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 0, borderTop: `2px dashed ${COL.ectopic}`, flexShrink: 0 }}/>
        <span className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>Jalur aksesori</span>
      </div>
    </div>
  );
}

/* ============================================================
   Shared diagram card (used in both mobile and desktop)
   ============================================================ */
function DiagramCard({ selected, rhythmKey, beatKey, state }: {
  selected: string; rhythmKey: string; beatKey: number; state: ConductionState;
}) {
  const rhythm = ACLS_RHYTHMS.find(r => r.key === rhythmKey);
  return (
    <>
      {/* Rhythm name badge */}
      <div style={{ marginBottom: 10 }}>
        <span className="t-headline" style={{ fontWeight: 600, color: rhythm?.tint || 'var(--accent)' }}>
          {rhythm?.name}
        </span>
      </div>

      {/* SVG diagram */}
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 18,
        padding: '18px 14px 12px', marginBottom: 12,
        boxShadow: '0 0 0 0.5px var(--separator-opaque), 0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <ConductionSVG state={state} rhythmKey={selected} beatKey={beatKey}/>
      </div>

      {/* Legend */}
      <Legend/>

      {/* Caption */}
      <div style={{ background: 'var(--fill-quaternary)', borderRadius: 14, padding: '13px 16px', marginBottom: 12 }}>
        <div className="t-footnote" style={{ fontWeight: 700, color: 'var(--label-secondary)', marginBottom: 6 }}>
          MEKANISME KONDUKSI
        </div>
        <div className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.65 }}>
          {state.caption}
        </div>
      </div>

      {/* Node status */}
      <div style={{ background: 'var(--fill-quaternary)', borderRadius: 14, padding: '13px 16px', marginBottom: 12 }}>
        <div className="t-footnote" style={{ fontWeight: 700, color: 'var(--label-secondary)', marginBottom: 10 }}>
          STATUS NODE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 8px' }}>
          {([
            ['SA', state.sa], ['AV', state.av], ['His', state.his],
            ['LBB', state.lbb], ['RBB', state.rbb], ['LV', state.lv],
          ] as [string, NodeState][]).map(([key, ns]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: COL[ns], flexShrink: 0 }}/>
              <span className="t-caption-2" style={{ fontWeight: 700, color: 'var(--label-primary)' }}>{key}</span>
              <span className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>
                {ns === 'active' ? 'Aktif'
                  : ns === 'blocked' ? 'Blok'
                  : ns === 'ectopic' ? 'Ektopik'
                  : ns === 'dim' ? 'Lambat'
                  : 'Inaktif'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Abbreviations */}
      <div style={{ background: 'var(--fill-quaternary)', borderRadius: 14, padding: '12px 16px' }}>
        <div className="t-footnote" style={{ fontWeight: 700, color: 'var(--label-secondary)', marginBottom: 8 }}>
          SINGKATAN
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
          {[
            ['SA', 'Sinoatrial node'],
            ['AV', 'Atrioventricular node'],
            ['His', 'Bundle of His'],
            ['LBB', 'Left Bundle Branch'],
            ['RBB', 'Right Bundle Branch'],
            ['IDV', 'Irama idioventrikular'],
          ].map(([abbr, full]) => (
            <div key={abbr} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span className="t-caption-2" style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{abbr}</span>
              <span className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>{full}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Rhythm selector pills
   ============================================================ */
function RhythmPills({ selected, onChange }: {
  selected: string;
  onChange: (key: string) => void;
}) {
  const rhythms = ACLS_RHYTHMS.filter(r => CONDUCTION_MAP[r.key]);
  return (
    <div style={{
      overflowX: 'auto', marginLeft: -20, marginRight: -20,
      paddingLeft: 20, paddingRight: 20,
      scrollbarWidth: 'none', msOverflowStyle: 'none',
    }}>
      <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 2 }}>
        {rhythms.map(r => {
          const active = selected === r.key;
          return (
            <button key={r.key} onClick={() => onChange(r.key)} style={{
              padding: '5px 13px', borderRadius: 20,
              border: `1.5px solid ${active ? r.tint : 'var(--separator-opaque)'}`,
              background: active ? r.tint + '28' : 'var(--fill-quaternary)',
              color: active ? r.tint : 'var(--label-secondary)',
              fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 150ms ease', letterSpacing: '-0.01em',
            }}>
              {r.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Mobile / shared screen
   ============================================================ */
interface TheoryScreenProps {
  nav?: Nav;
  isMobile?: boolean;
}

export function TheoryScreen({ nav, isMobile = false }: TheoryScreenProps) {
  const [selected, setSelected] = useState('nsr');
  const [beatKey, setBeatKey] = useState(0);
  useEffect(() => { setBeatKey(k => k + 1); }, [selected]);

  const state = CONDUCTION_MAP[selected];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--bg-secondary)',
    }}>
      {isMobile && nav && (
        <NavBar title="Sistem Konduksi" back="Kembali" onBack={nav.pop}/>
      )}

      {/* Header + pills */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div className="t-title-2" style={{ fontWeight: 700, marginBottom: 2 }}>Sistem Konduksi Jantung</div>
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', marginBottom: 12 }}>
          Skema jalur impuls listrik per ritme EKG
        </div>
        <RhythmPills selected={selected} onChange={k => setSelected(k)}/>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 36px' }}>
        {state && (
          <DiagramCard
            selected={selected}
            rhythmKey={selected}
            beatKey={beatKey}
            state={state}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Desktop — two-panel layout
   ============================================================ */
export function DesktopTheory() {
  const validRhythms = ACLS_RHYTHMS.filter(r => CONDUCTION_MAP[r.key]);
  const [selected, setSelected] = useState('nsr');
  const [beatKey, setBeatKey] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => { setBeatKey(k => k + 1); }, [selected]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? validRhythms.filter(r => r.name.toLowerCase().includes(q) || r.short.toLowerCase().includes(q))
    : validRhythms;

  const state = CONDUCTION_MAP[selected];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', borderRight: '0.5px solid var(--separator-opaque)',
        background: 'var(--bg-primary)',
      }}>
        {/* Search */}
        <div style={{ padding: '12px 12px 8px', flexShrink: 0 }}>
          <div className="acls-sidebar-search" style={{ margin: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari ritme…"
              style={{ flex: 1, minWidth: 0, background: 'none', border: 0, outline: 'none',
                color: 'var(--label-primary)', fontSize: '0.8125rem', fontFamily: 'inherit' }}/>
            {query && (
              <button onClick={() => setQuery('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0,
                  color: 'var(--label-tertiary)', display: 'flex', alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 14px 6px' }}>
          RITME · {filtered.length}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 10px 16px' }}>
          {filtered.map(r => (
            <button key={r.key} onClick={() => setSelected(r.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 8px', borderRadius: 10, border: 0, cursor: 'pointer',
                background: selected === r.key ? 'var(--accent-tint)' : 'transparent',
                textAlign: 'left', marginBottom: 2,
              }}>
              <span style={{ width: 6, height: 28, borderRadius: 3, background: r.tint, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-callout" style={{ fontWeight: 600, color: 'var(--label-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.short}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
        {state && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 48px' }}>
            {/* Page header */}
            <div style={{ marginBottom: 20 }}>
              <div className="t-title-2" style={{ fontWeight: 700, color: 'var(--label-primary)', marginBottom: 2 }}>
                Sistem Konduksi Jantung
              </div>
              <div className="t-footnote" style={{ color: 'var(--label-secondary)' }}>
                Skema jalur impuls listrik per ritme EKG
              </div>
            </div>

            {/* Two-column layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 440px) 1fr',
              gap: 24, alignItems: 'start',
            }}>
              {/* Diagram column */}
              <div>
                <DiagramCard
                  selected={selected}
                  rhythmKey={selected}
                  beatKey={beatKey}
                  state={state}
                />
              </div>

              {/* Info column — additional reference panel */}
              <div style={{
                background: 'var(--bg-primary)', borderRadius: 18, padding: '20px',
                boxShadow: '0 0 0 0.5px var(--separator-opaque)',
              }}>
                <div className="t-subheadline" style={{ fontWeight: 700, marginBottom: 14, color: 'var(--label-primary)' }}>
                  Urutan Konduksi Normal
                </div>
                {[
                  { node: 'SA node', desc: 'Pacu jantung primer. Frekuensi 60–100/mnt. Di RA dekat SVC.', color: COL.active },
                  { node: 'Internodal pathway', desc: 'Konduksi dari SA ke AV melalui RA (anterior, middle, posterior tract + Bachmann\'s bundle ke LA).', color: COL.active },
                  { node: 'AV node', desc: 'Delay 120–200 ms fisiologis. Filter frekuensi atrium. Di septum interatrial (segitiga Koch).', color: COL.active },
                  { node: 'Bundle of His', desc: 'Konduksi cepat ke septum interventricular. Titik percabangan ke LBB dan RBB.', color: COL.active },
                  { node: 'LBB + RBB', desc: 'Cabang kiri (2 fasikulus) dan kanan. Konduksi bersamaan → aktivasi biventrikular sinkron.', color: COL.active },
                  { node: 'Serat Purkinje', desc: 'Distribusi subendokardial ke seluruh ventrikel. Memastikan depolarisasi serentak dari apex ke basis.', color: COL.active },
                ].map(({ node, desc, color }) => (
                  <div key={node} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0, marginTop: 4 }}/>
                    <div>
                      <div className="t-footnote" style={{ fontWeight: 600, color: 'var(--label-primary)' }}>{node}</div>
                      <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
