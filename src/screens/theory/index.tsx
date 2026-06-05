import React, { useState, useEffect, useRef } from 'react';
import { ACLS_RHYTHMS } from '../../data';
import { NavBar, Icons } from '../../components/base';
import type { Nav } from '../../types';

/* ============================================================
   Types & Colors — Conduction System
   ============================================================ */
type NodeState = 'active' | 'blocked' | 'ectopic' | 'inactive' | 'dim';
interface EctopicSite { x: number; y: number; label?: string; delay?: number; }
interface ConductionState {
  sa: NodeState; av: NodeState; his: NodeState;
  lbb: NodeState; rbb: NodeState;
  lv: NodeState; rv: NodeState; ra: NodeState; la: NodeState;
  ectopicSites?: EctopicSite[];
  showAccessory?: boolean;
  caption: string;
  beatMs: number;
}
const COL: Record<NodeState, string> = {
  active:'#34C759', blocked:'#FF3B30', ectopic:'#FF9500', inactive:'#8E8E93', dim:'#8E8E93',
};
const CONDUCTION_MAP: Record<string, ConductionState> = {
  nsr:      { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', caption:'SA node memulai impuls → AV node (delay 120–200 ms) → His → LBB + RBB → kedua ventrikel bersamaan.', beatMs:820 },
  af:       { sa:'inactive',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'ectopic',la:'inactive', ectopicSites:[{x:200,y:42,delay:0},{x:232,y:55,delay:180},{x:215,y:30,delay:360},{x:248,y:45,delay:540},{x:205,y:62,delay:720}], caption:'SA node inaktif. Banyak fokus ektopik di RA memicu fibrilasi atrium. AV node memfilter impuls secara ireguler.', beatMs:600 },
  flutter:  { sa:'inactive',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'ectopic',la:'inactive', ectopicSites:[{x:228,y:45,label:'Reentry',delay:0}], caption:'Sirkuit reentry makro di RA. Frekuensi atrium 300×/mnt. AV konduksi 2:1 → HR ventrikel ~150/mnt.', beatMs:500 },
  svt:      { sa:'inactive',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'inactive',la:'inactive', ectopicSites:[{x:150,y:76,label:'Reentry',delay:0}], caption:'Sirkuit reentry di dalam atau di sekitar AV node. QRS sempit, reguler, cepat (150–250/mnt).', beatMs:380 },
  av3:      { sa:'active',av:'blocked',his:'inactive',lbb:'inactive',rbb:'inactive',lv:'inactive',rv:'ectopic',ra:'active',la:'active', ectopicSites:[{x:222,y:185,label:'Escape IDV',delay:0}], caption:'SA node aktif (gelombang P reguler) tetapi impuls terblokir total di AV node. Escape idioventrikular lebar, lambat (20–40/mnt).', beatMs:1500 },
  vt:       { sa:'inactive',av:'inactive',his:'inactive',lbb:'inactive',rbb:'inactive',lv:'ectopic',rv:'inactive',ra:'inactive',la:'inactive', ectopicSites:[{x:72,y:190,label:'Fokus VT',delay:0}], caption:'Fokus ektopik di LV memicu VT monomorfik. Tidak ada aktivitas SA/AV. QRS lebar (>120 ms).', beatMs:420 },
  vf:       { sa:'inactive',av:'inactive',his:'inactive',lbb:'inactive',rbb:'inactive',lv:'inactive',rv:'inactive',ra:'inactive',la:'inactive', ectopicSites:[{x:55,y:165,delay:0},{x:95,y:195,delay:120},{x:115,y:170,delay:240},{x:75,y:210,delay:80},{x:185,y:170,delay:60},{x:220,y:195,delay:200},{x:245,y:175,delay:340},{x:200,y:215,delay:160}], caption:'VF — aktivitas listrik chaotic di seluruh ventrikel. Tidak ada konduksi terorganisir. Defibrilasi segera.', beatMs:200 },
  torsades: { sa:'inactive',av:'inactive',his:'inactive',lbb:'inactive',rbb:'inactive',lv:'inactive',rv:'inactive',ra:'inactive',la:'inactive', ectopicSites:[{x:80,y:185,delay:0},{x:120,y:200,delay:150},{x:200,y:185,delay:100},{x:240,y:200,delay:250}], caption:'Torsades de Pointes — VT polimorfik terkait QT panjang. Risiko degenerasi ke VF.', beatMs:280 },
  asys:     { sa:'inactive',av:'inactive',his:'inactive',lbb:'inactive',rbb:'inactive',lv:'inactive',rv:'inactive',ra:'inactive',la:'inactive', caption:'Asistol — tidak ada aktivitas listrik. Garis lurus di EKG.', beatMs:0 },
  pea:      { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', caption:'PEA — konduksi listrik normal, tetapi kontraksi mekanik tidak menghasilkan nadi. Cari dan koreksi Hs & Ts.', beatMs:750 },
  lbbb:     { sa:'active',av:'active',his:'active',lbb:'blocked',rbb:'active',lv:'dim',rv:'active',ra:'active',la:'active', caption:'LBB terblokir. RBB → RV lebih dulu → LV diaktivasi lambat via septum. QRS lebar, rsR\' / QS di V1.', beatMs:900 },
  brugada:  { sa:'active',av:'active',his:'active',lbb:'active',rbb:'blocked',lv:'active',rv:'dim',ra:'active',la:'active', caption:'Pola Brugada — RBB abnormal + gangguan repolarisasi RV epikardial. Risiko VF mendadak.', beatMs:800 },
  wpw:      { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', showAccessory:true, caption:'WPW — jalur aksesori (Kent bundle) mem-bypass AV node. Delta wave + PR pendek. Risiko antidromik.', beatMs:700 },
  stemi:    { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', caption:'STEMI — konduksi listrik normal. Iskemia transmural menyebabkan elevasi ST. Perlu reperfusi segera.', beatMs:850 },
  hyperk:   { sa:'dim',av:'dim',his:'dim',lbb:'dim',rbb:'dim',lv:'dim',rv:'dim',ra:'dim',la:'dim', caption:'Hiperkalemia — konduksi melambat di seluruh sistem. PR panjang, QRS melebar, gelombang T lancip. Risiko VF/asistol.', beatMs:1300 },
  wellens:  { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', caption:'Wellens — konduksi normal. Perubahan gelombang T di V2–V3 mencerminkan reperfusi LAD proksimal.', beatMs:800 },
  dewinter: { sa:'active',av:'active',his:'active',lbb:'active',rbb:'active',lv:'active',rv:'active',ra:'active',la:'active', caption:'De Winter — konduksi normal. ST depresi upsloping + T tinggi = oklusi LAD proksimal akut.', beatMs:800 },
};

/* ============================================================
   SVG path constants  (viewBox 0 0 300 240)
   ============================================================ */
const P_SA_AV='M258,39 C228,52 195,66 150,79';
const P_HIS='M150,83 L150,112';
const P_LBB='M150,112 L92,152';
const P_RBB='M150,112 L208,152';
const P_LBB_P1='M92,152 L66,202';
const P_LBB_P2='M92,152 L100,208';
const P_RBB_P1='M208,152 L222,202';
const P_RBB_P2='M208,152 L234,207';
const P_ACCESS='M258,39 Q286,95 268,140 Q258,162 208,152';

/* ============================================================
   Beat-synced dot (dur = full beat, keyTimes controls motion)
   ============================================================ */
function BeatDot({ pathD,beat,t0,t1,r=5,color=COL.active }: {
  pathD:string;beat:number;t0:number;t1:number;r?:number;color?:string;
}) {
  const f=(t:number)=>(Math.min(t,beat)/beat).toFixed(4);
  const end=Math.min(t1,beat-2);
  const endN=Math.min(end+2,beat-1);
  const kt=`0;${f(t0)};${f(end)};${f(endN)};1`;
  return (
    <circle r={r} fill={color} opacity={0}>
      <animateMotion path={pathD} dur={`${beat}ms`} repeatCount="indefinite"
        calcMode="linear" keyTimes={kt} keyPoints="0;0;1;1;1"/>
      <animate attributeName="opacity" dur={`${beat}ms`} repeatCount="indefinite"
        values="0;0.9;0.9;0;0" keyTimes={kt}/>
    </circle>
  );
}

/* ============================================================
   Conduction SVG diagram
   ============================================================ */
function ConductionSVG({ state,rhythmKey,beatKey }:{
  state:ConductionState;rhythmKey:string;beatKey:number;
}) {
  const c=(s:NodeState)=>COL[s];
  const cc=(s:NodeState)=>s==='active'?COL.active:s==='ectopic'?COL.ectopic:s==='dim'?COL.dim:COL.inactive;
  const sp=(s:NodeState)=>s==='active'||s==='dim';
  const b=state.beatMs;
  const hasSA=state.sa==='active'||state.sa==='dim';
  const hasAV=state.av!=='blocked'&&state.av!=='inactive';
  const hasHis=state.his!=='inactive';
  const hasLBB=state.lbb==='active'||state.lbb==='dim';
  const hasRBB=state.rbb==='active'||state.rbb==='dim';
  const T_SA=Math.floor(b*0.30),T_H0=hasSA?Math.floor(b*0.47):0,T_H1=T_H0+Math.floor(b*0.08);
  const T_L1=T_H1+Math.floor(b*0.15),T_R1=T_H1+Math.floor(b*0.14);
  const T_LP=Math.min(T_L1+Math.floor(b*0.12),b-2),T_RP=Math.min(T_R1+Math.floor(b*0.11),b-2);
  return (
    <svg key={beatKey} viewBox="0 0 300 240" width="100%"
      style={{maxWidth:400,display:'block',margin:'0 auto',overflow:'visible'}}>
      {/* Chambers */}
      <rect x="12" y="18" width="130" height="66" rx="14" fill={cc(state.la)} fillOpacity={0.1} stroke={cc(state.la)} strokeOpacity={0.45} strokeWidth="1.5"/>
      <rect x="156" y="18" width="130" height="66" rx="14" fill={cc(state.ra)} fillOpacity={0.1} stroke={cc(state.ra)} strokeOpacity={0.45} strokeWidth="1.5"/>
      <path d="M12,86 L144,86 L128,226 L28,226 Z" fill={cc(state.lv)} fillOpacity={0.1} stroke={cc(state.lv)} strokeOpacity={0.45} strokeWidth="1.5"/>
      <path d="M156,86 L288,86 L272,226 L172,226 Z" fill={cc(state.rv)} fillOpacity={0.1} stroke={cc(state.rv)} strokeOpacity={0.45} strokeWidth="1.5"/>
      <line x1="148" y1="18" x2="148" y2="86"  stroke="var(--separator)" strokeWidth="1" strokeOpacity="0.3"/>
      <line x1="148" y1="86" x2="148" y2="230" stroke="var(--separator)" strokeWidth="1" strokeOpacity="0.3"/>
      <text x="76"  y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill={cc(state.la)} fillOpacity={0.75}>LA</text>
      <text x="222" y="62" textAnchor="middle" fontSize="11" fontWeight="700" fill={cc(state.ra)} fillOpacity={0.75}>RA</text>
      <text x="72"  y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill={cc(state.lv)} fillOpacity={0.75}>LV</text>
      <text x="226" y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill={cc(state.rv)} fillOpacity={0.75}>RV</text>
      {/* Conduction paths */}
      {sp(state.sa)&&state.av!=='blocked'&&<path d={P_SA_AV} fill="none" stroke={c(state.sa)} strokeWidth="2" strokeOpacity={state.sa==='dim'?0.35:0.65} strokeDasharray={state.sa==='dim'?'5 3':'none'}/>}
      {state.av!=='blocked'&&sp(state.his)&&<path d={P_HIS} fill="none" stroke={c(state.his)} strokeWidth="2.5" strokeOpacity={state.his==='dim'?0.35:0.75}/>}
      {state.lbb!=='blocked'&&sp(state.lbb)&&<path d={P_LBB} fill="none" stroke={c(state.lbb)} strokeWidth="2" strokeOpacity={0.75}/>}
      {state.lbb==='blocked'&&<path d={P_LBB} fill="none" stroke={COL.blocked} strokeWidth="2" strokeOpacity={0.4} strokeDasharray="4 3"/>}
      {state.rbb!=='blocked'&&sp(state.rbb)&&<path d={P_RBB} fill="none" stroke={c(state.rbb)} strokeWidth="2" strokeOpacity={0.75}/>}
      {state.rbb==='blocked'&&<path d={P_RBB} fill="none" stroke={COL.blocked} strokeWidth="2" strokeOpacity={0.4} strokeDasharray="4 3"/>}
      {state.lbb!=='blocked'&&sp(state.lv)&&<><path d={P_LBB_P1} fill="none" stroke={c(state.lv)} strokeWidth="1.5" strokeOpacity={0.45}/><path d={P_LBB_P2} fill="none" stroke={c(state.lv)} strokeWidth="1.5" strokeOpacity={0.45}/></>}
      {state.rbb!=='blocked'&&sp(state.rv)&&<><path d={P_RBB_P1} fill="none" stroke={c(state.rv)} strokeWidth="1.5" strokeOpacity={0.45}/><path d={P_RBB_P2} fill="none" stroke={c(state.rv)} strokeWidth="1.5" strokeOpacity={0.45}/></>}
      {state.lbb==='blocked'&&<text x="112" y="133" fontSize="13" fill={COL.blocked} fontWeight="900" textAnchor="middle">✕</text>}
      {state.rbb==='blocked'&&<text x="186" y="133" fontSize="13" fill={COL.blocked} fontWeight="900" textAnchor="middle">✕</text>}
      {state.showAccessory&&<path d={P_ACCESS} fill="none" stroke={COL.ectopic} strokeWidth="2.5" strokeDasharray="8 4" strokeOpacity={0.85}/>}
      {/* Nodes */}
      <circle cx="258" cy="36" r="9" fill={c(state.sa)} fillOpacity={0.9}/>
      {state.sa==='active'&&<circle cx="258" cy="36" r="15" fill="none" stroke={c(state.sa)} strokeWidth="1.5" strokeOpacity={0.4} style={{animation:'acls-sa-ring 1.2s ease-out infinite',transformBox:'fill-box',transformOrigin:'center'}}/>}
      <text x="258" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill={c(state.sa)} fillOpacity={0.85}>SA</text>
      <circle cx="150" cy="79" r="7" fill={c(state.av)} fillOpacity={0.9}/>
      {state.av==='blocked'&&<text x="150" y="84" fontSize="11" fill="#fff" fontWeight="900" textAnchor="middle" dominantBaseline="middle">✕</text>}
      <text x="132" y="79" textAnchor="end" fontSize="9" fontWeight="700" fill={c(state.av)} fillOpacity={0.85} dominantBaseline="middle">AV</text>
      <rect x="142" y="112" width="16" height="8" rx="3" fill={c(state.his)} fillOpacity={0.85}/>
      <text x="163" y="120" textAnchor="start" fontSize="8" fontWeight="600" fill={c(state.his)} fillOpacity={0.85}>His</text>
      {state.lbb!=='blocked'&&<circle cx="92" cy="152" r="5" fill={c(state.lbb)} fillOpacity={0.9}/>}
      <text x="74" y="155" textAnchor="end" fontSize="8" fontWeight="600" fill={c(state.lbb)} fillOpacity={0.85} dominantBaseline="middle">LBB</text>
      {state.rbb!=='blocked'&&<circle cx="208" cy="152" r="5" fill={c(state.rbb)} fillOpacity={0.9}/>}
      <text x="226" y="155" textAnchor="start" fontSize="8" fontWeight="600" fill={c(state.rbb)} fillOpacity={0.85} dominantBaseline="middle">RBB</text>
      {/* Ectopic sites */}
      {state.ectopicSites?.map((s,i)=>(
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="6" fill={COL.ectopic} fillOpacity={0.92}
            style={{animation:`acls-ectopic-pulse 0.9s ${s.delay??0}ms ease-in-out infinite`,transformBox:'fill-box',transformOrigin:'center'}}/>
          {s.label&&<text x={s.x} y={s.y+15} fontSize="8" fill={COL.ectopic} textAnchor="middle" fontWeight="700">{s.label}</text>}
        </g>
      ))}
      {/* Propagation dots */}
      {b>0&&hasAV&&hasHis&&(
        <>
          {hasSA&&state.av!=='blocked'&&<BeatDot pathD={P_SA_AV} beat={b} t0={0} t1={T_SA} r={5}/>}
          <BeatDot pathD={P_HIS} beat={b} t0={T_H0} t1={T_H1} r={4.5}/>
          {hasLBB&&<><BeatDot pathD={P_LBB} beat={b} t0={T_H1} t1={T_L1} r={4.5}/><BeatDot pathD={P_LBB_P1} beat={b} t0={T_L1} t1={T_LP} r={4}/></>}
          {hasRBB&&<><BeatDot pathD={P_RBB} beat={b} t0={T_H1} t1={T_R1} r={4.5}/><BeatDot pathD={P_RBB_P1} beat={b} t0={T_R1} t1={T_RP} r={4}/></>}
          {state.showAccessory&&<BeatDot pathD={P_ACCESS} beat={b} t0={0} t1={Math.floor(b*0.22)} r={4} color={COL.ectopic}/>}
        </>
      )}
    </svg>
  );
}

/* ============================================================
   EkgConductionPanel — digunakan di detail Pustaka EKG
   ============================================================ */
export function EkgConductionPanel({ rhythmKey }: { rhythmKey: string }) {
  const state = CONDUCTION_MAP[rhythmKey];
  if (!state) return null;
  const [beatKey, setBeatKey] = useState(0);
  // Remount setiap ~8 siklus untuk mencegah drift animasi
  useEffect(() => {
    if (state.beatMs <= 0) return;
    const id = setInterval(() => setBeatKey(k => k + 1), state.beatMs * 8 + 500);
    return () => clearInterval(id);
  }, [state.beatMs]);
  return (
    <div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 10px 8px',
        boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
        <ConductionSVG state={state} rhythmKey={rhythmKey} beatKey={beatKey}/>
        {/* Legend inline */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, paddingTop: 8,
          borderTop: '0.5px solid var(--separator)' }}>
          {([['#34C759','Aktif'],['#FF3B30','Blok'],['#FF9500','Ektopik'],['#8E8E93','Inaktif']] as const).map(([col,label])=>(
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:4, background:col, flexShrink:0 }}/>
              <span className="t-caption-2" style={{ color:'var(--label-secondary)' }}>{label}</span>
            </div>
          ))}
          {state.showAccessory && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:18, height:0, borderTop:`2px dashed ${COL.ectopic}`, flexShrink:0 }}/>
              <span className="t-caption-2" style={{ color:'var(--label-secondary)' }}>Aksesori</span>
            </div>
          )}
        </div>
      </div>
      <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:8, lineHeight:1.55, padding:'0 2px' }}>
        {state.caption}
      </div>
    </div>
  );
}

/* ============================================================
   THEORY PAGE CONTENT
   ============================================================ */

/* ---- 1. Siklus Jantung ----------------------------------- */
function CardiacCycleSVG() {
  // viewBox 0 0 360 155
  // Phases: Atrial kick (0-30), IC (30-58), Ejection (58-175), IR (175-205), Rapid fill (205-275), Diastasis (275-360)
  return (
    <svg viewBox="0 0 360 155" width="100%" style={{ display:'block' }}>
      {/* Phase background bands */}
      <rect x="0"   y="12" width="30"  height="80" fill="#FF9500" opacity={0.18} rx="0"/>
      <rect x="30"  y="12" width="28"  height="80" fill="#FF6B6B" opacity={0.22} rx="0"/>
      <rect x="58"  y="12" width="117" height="80" fill="#FF3B30" opacity={0.15} rx="0"/>
      <rect x="175" y="12" width="30"  height="80" fill="#FF6B6B" opacity={0.22} rx="0"/>
      <rect x="205" y="12" width="70"  height="80" fill="#30B0C7" opacity={0.18} rx="0"/>
      <rect x="275" y="12" width="85"  height="80" fill="#30B0C7" opacity={0.10} rx="0"/>
      {/* Baseline */}
      <line x1="0" y1="92" x2="360" y2="92" stroke="var(--separator)" strokeWidth="0.5"/>
      {/* LV Pressure curve */}
      <path d="M0,87 C8,87 22,83 30,79 C40,72 52,45 58,36 C72,18 112,8 140,9 C160,10 168,25 175,36 C182,47 196,82 205,87 L360,87"
        fill="none" stroke="#FF3B30" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Aortic pressure (dashed) */}
      <path d="M58,48 C72,18 112,8 140,9 C160,10 168,25 175,36 C177,40 178,37 180,38 C188,44 215,50 360,50"
        fill="none" stroke="#30B0C7" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" strokeOpacity={0.7}/>
      {/* Valve events — dashed vertical lines */}
      <line x1="30"  y1="12" x2="30"  y2="92" stroke="var(--separator-opaque)" strokeWidth="1" strokeDasharray="3 2"/>
      <line x1="58"  y1="12" x2="58"  y2="92" stroke="var(--separator-opaque)" strokeWidth="1" strokeDasharray="3 2"/>
      <line x1="175" y1="12" x2="175" y2="92" stroke="var(--separator-opaque)" strokeWidth="1" strokeDasharray="3 2"/>
      <line x1="205" y1="12" x2="205" y2="92" stroke="var(--separator-opaque)" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Phase labels */}
      <text x="15"  y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#FF9500">Kick</text>
      <text x="44"  y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#FF3B30">IC</text>
      <text x="116" y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#FF3B30">Ejeksi</text>
      <text x="190" y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#FF3B30">IR</text>
      <text x="240" y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#30B0C7">Pengisian Cepat</text>
      <text x="317" y="8" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#30B0C7">Diastasis</text>
      {/* SISTOLE / DIASTOLE bracket labels */}
      <text x="116" y="104" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FF3B30" opacity={0.8}>— SISTOLE —</text>
      <text x="282" y="104" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#30B0C7" opacity={0.8}>— DIASTOLE —</text>
      {/* ECG trace */}
      <path d="M0,140 L22,140 C24,140 26,133 28,130 C30,127 31,143 33,140 L35,140 L37,122 L40,150 L42,140 L58,140 L175,140 L178,140 C183,140 188,132 195,128 C200,125 205,143 210,140 L240,140 C248,140 254,128 260,125 C266,122 268,138 272,140 L360,140"
        fill="none" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* ECG labels */}
      <text x="26"  y="118" textAnchor="middle" fontSize="7" fill="#34C759" opacity={0.8}>P</text>
      <text x="40"  y="118" textAnchor="middle" fontSize="7" fill="#34C759" opacity={0.8}>QRS</text>
      <text x="258" y="118" textAnchor="middle" fontSize="7" fill="#34C759" opacity={0.8}>T</text>
      {/* Legend */}
      <circle cx="10" cy="150" r="3" fill="#FF3B30" opacity={0.7}/>
      <text x="16" y="153" fontSize="7" fill="var(--label-secondary)">LV</text>
      <line x1="38" y1="150" x2="50" y2="150" stroke="#30B0C7" strokeWidth="1.5" strokeDasharray="4 2"/>
      <text x="53" y="153" fontSize="7" fill="var(--label-secondary)">Ao</text>
      <circle cx="72" cy="150" r="3" fill="#34C759" opacity={0.7}/>
      <text x="78" y="153" fontSize="7" fill="var(--label-secondary)">ECG</text>
    </svg>
  );
}

const CYCLE_PHASES = [
  { name:'Atrial Contraction', abbr:'Kick', color:'#FF9500', mmhg:'~8 mmHg', desc:'Atrium berkontraksi → atrial kick mengisi LV 15–25%. Sesuai gelombang P di EKG.' },
  { name:'Isovolumetric Contraction', abbr:'IC', color:'#FF6B6B', mmhg:'5→80 mmHg', desc:'MV & AoV tertutup. LV berkontraksi, tekanan naik cepat. Volume konstan. Setelah QRS.' },
  { name:'Ejection', abbr:'Ejeksi', color:'#FF3B30', mmhg:'80→120 mmHg', desc:'AoV terbuka saat LV > Ao. LV memompa darah ke aorta. Stroke Volume = EDV − ESV.' },
  { name:'Isovolumetric Relaxation', abbr:'IR', color:'#FF6B6B', mmhg:'120→5 mmHg', desc:'AoV & MV tertutup. LV relaksasi, tekanan turun cepat. Volume konstan. Setelah T wave.' },
  { name:'Rapid Filling', abbr:'Pengisian Cepat', color:'#30B0C7', mmhg:'~5 mmHg', desc:'MV terbuka saat LA > LV. 70% volume pengisian diastol terjadi di fase ini.' },
  { name:'Diastasis', abbr:'Diastasis', color:'#5AC8FA', mmhg:'~3 mmHg', desc:'Pengisian lambat. Aliran minimum. Frekuensi tinggi memperpendek fase ini.' },
];

/* ---- Simulation Modal ------------------------------------ */
const SIM_TABS = [
  { key:'wiggers',  label:'Wiggers Diagram',  url:'https://humanbiomedia.org/simulations/circulatory-system/cardiac-cycle/interactive-display.html' },
  { key:'phase',    label:'Analisis Fase',    url:'https://humanbiomedia.org/simulations/circulatory-system/cardiac-cycle/phase-analysis.html' },
  { key:'heart',    label:'Struktur Jantung', url:'https://humanbiomedia.org/simulations/circulatory-system/cardiac-cycle/heart-structures.html' },
  { key:'sequence', label:'Urutan Fase',      url:'https://humanbiomedia.org/simulations/circulatory-system/cardiac-cycle/phase-sequence.html' },
];

function SimulationModal({ onClose }: { onClose: () => void }) {
  const [simTab, setSimTab] = useState('wiggers');
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const current = SIM_TABS.find(t => t.key === simTab)!;

  const checkBlocked = () => {
    try {
      // If cross-origin blocked, contentDocument is null or throws
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.body?.innerHTML === '') setBlocked(true);
    } catch {
      setBlocked(true);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', flexDirection:'column',
      background:'var(--bg-secondary)', animation:'acls-overlay-in 250ms var(--ease-out) both' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', flexShrink:0,
        background:'var(--bg-primary)', borderBottom:'0.5px solid var(--separator-opaque)',
        boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
        <button onClick={onClose}
          style={{ width:32, height:32, borderRadius:10, border:0, cursor:'pointer', flexShrink:0,
            background:'var(--fill-secondary)', color:'var(--label-primary)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icons.chevL size={18} stroke={2.5}/>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="t-callout" style={{ fontWeight:700 }}>Simulasi Siklus Jantung</div>
          <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>Human Bio Media</div>
        </div>
        <a href="https://www.humanbiomedia.org/cardiac-cycle-simulation/" target="_blank" rel="noopener noreferrer"
          style={{ padding:'6px 12px', borderRadius:8, background:'var(--fill-quaternary)',
            color:'var(--accent)', fontSize:'0.8125rem', fontWeight:600, textDecoration:'none',
            display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          Buka ↗
        </a>
      </div>

      {/* Sim tab bar */}
      <div style={{ display:'flex', background:'var(--bg-primary)', borderBottom:'0.5px solid var(--separator-opaque)',
        overflowX:'auto', flexShrink:0, WebkitOverflowScrolling:'touch' } as React.CSSProperties}>
        {SIM_TABS.map(t => (
          <button key={t.key} onClick={() => { setSimTab(t.key); setBlocked(false); }}
            style={{ padding:'10px 14px', border:0, cursor:'pointer', background:'transparent', whiteSpace:'nowrap',
              borderBottom: simTab===t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: simTab===t.key ? 'var(--accent)' : 'var(--label-secondary)',
              fontWeight: simTab===t.key ? 700 : 400, fontSize:'0.8125rem' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Iframe area */}
      <div style={{ flex:1, overflow:'hidden', position:'relative', background:'#fff' }}>
        {blocked ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            height:'100%', gap:14, padding:24, textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'var(--fill-quaternary)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icons.activity size={28} stroke={1.5} style={{ color:'var(--label-tertiary)' }}/>
            </div>
            <div>
              <div className="t-callout" style={{ fontWeight:700, marginBottom:6 }}>Simulasi tidak dapat dimuat</div>
              <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.6, maxWidth:280 }}>
                Server memblokir embedding dari aplikasi ini. Buka langsung di browser untuk pengalaman penuh.
              </div>
            </div>
            <a href="https://www.humanbiomedia.org/cardiac-cycle-simulation/" target="_blank" rel="noopener noreferrer"
              style={{ padding:'12px 24px', borderRadius:12, background:'var(--accent)', color:'#fff',
                fontWeight:700, textDecoration:'none', fontSize:'0.9375rem' }}>
              Buka di Browser ↗
            </a>
          </div>
        ) : (
          <>
            <iframe
              key={simTab}
              ref={iframeRef}
              src={current.url}
              width="100%" height="100%"
              style={{ border:'none', display:'block' }}
              onLoad={checkBlocked}
              title={current.label}
              allow="scripts"
            />
            <div style={{ position:'absolute', bottom:12, right:12 }}>
              <a href={current.url} target="_blank" rel="noopener noreferrer"
                style={{ padding:'5px 10px', borderRadius:8, background:'rgba(0,0,0,0.55)',
                  color:'#fff', fontSize:'0.6875rem', fontWeight:600, textDecoration:'none',
                  backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' } as React.CSSProperties}>
                Tidak muat? Buka ↗
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardiacCycleTab() {
  const [showSim, setShowSim] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Simulation launch button */}
      <button onClick={() => setShowSim(true)} style={{
        display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:16, border:'none',
        cursor:'pointer', textAlign:'left', width:'100%',
        background:'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(48,176,199,0.10))',
        boxShadow:'0 0 0 1px rgba(0,122,255,0.3), 0 4px 16px rgba(0,122,255,0.12)',
      }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          boxShadow:'0 4px 12px rgba(0,122,255,0.3)' }}>
          <Icons.activity size={22} stroke={2} style={{ color:'#fff' }}/>
        </div>
        <div style={{ flex:1 }}>
          <div className="t-callout" style={{ fontWeight:700, color:'var(--accent)', marginBottom:3 }}>
            Lihat Simulasi Interaktif
          </div>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)' }}>
            Wiggers Diagram · Analisis Fase · Struktur Jantung · Urutan Fase
          </div>
        </div>
        <Icons.chevR size={18} stroke={2} style={{ color:'var(--accent)', flexShrink:0 }}/>
      </button>
      {showSim && <SimulationModal onClose={() => setShowSim(false)}/>}
      <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-footnote" style={{ fontWeight:700, color:'var(--label-secondary)', marginBottom:12 }}>TEKANAN LV vs WAKTU · 1 SIKLUS JANTUNG</div>
        <CardiacCycleSVG/>
      </div>
      <div style={{ background:'var(--bg-primary)', borderRadius:16, overflow:'hidden',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        {CYCLE_PHASES.map((ph, i) => (
          <div key={ph.abbr} style={{ display:'flex', gap:12, padding:'11px 16px',
            borderTop: i>0 ? '0.5px solid var(--separator)' : 'none', alignItems:'flex-start' }}>
            <div style={{ width:6, height:42, borderRadius:3, background:ph.color, flexShrink:0, marginTop:2 }}/>
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:3 }}>
                <span className="t-callout" style={{ fontWeight:700, color:'var(--label-primary)' }}>{ph.abbr}</span>
                <span className="t-caption-2" style={{ color:ph.color, fontWeight:600 }}>{ph.mmhg}</span>
              </div>
              <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{ph.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--fill-quaternary)', borderRadius:14, padding:'13px 16px' }}>
        <div className="t-footnote" style={{ fontWeight:700, color:'var(--label-secondary)', marginBottom:8 }}>KORELASI EKG–MEKANIK</div>
        {[
          ['Gelombang P','Depolarisasi atrium → atrial contraction (kick)'],
          ['Interval PR','Konduksi AV node (delay fisiologis 120–200 ms)'],
          ['Kompleks QRS','Depolarisasi ventrikel → awal sistol (IC + ejeksi)'],
          ['Segmen ST','Plateau aksi potensial ventrikel (plateau phase 2)'],
          ['Gelombang T','Repolarisasi ventrikel → relaksasi (IR + awal diastol)'],
        ].map(([wave,desc])=>(
          <div key={wave} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
            <span className="t-caption-1" style={{ fontWeight:700, color:'#34C759', flexShrink:0, minWidth:100 }}>{wave}</span>
            <span className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
      {/* References */}
      <div style={{ marginTop: 24, paddingTop: 14, borderTop: '0.5px solid var(--separator)' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8, letterSpacing: '0.06em' }}>REFERENSI</div>
        {[
          { text: 'Guyton AC, Hall JE. Textbook of Medical Physiology. 14th ed. Philadelphia: Elsevier; 2021. Chapters 9–10.' },
          { text: 'Katz AM. Physiology of the Heart. 5th ed. Philadelphia: Lippincott Williams & Wilkins; 2010.' },
          { text: 'Wiggers CJ. Pressure Pulses in the Cardiovascular System. London: Longmans, Green; 1928.' },
        ].map((r, i) => (
          <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', lineHeight: 1.55, paddingLeft: 10, borderLeft: '2px solid var(--fill-secondary)', marginBottom: 4 }}>
            {r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- 2. Aksi Potensial ----------------------------------- */
function VentricularAP() {
  return (
    <svg viewBox="0 0 220 120" width="100%" style={{ display:'block' }}>
      {/* Grid */}
      <line x1="20" y1="10" x2="20" y2="100" stroke="var(--separator)" strokeWidth="0.5"/>
      <line x1="20" y1="100" x2="210" y2="100" stroke="var(--separator)" strokeWidth="0.5"/>
      {/* Phase 4 resting */}
      <line x1="20" y1="92" x2="40" y2="92" stroke="var(--label-quaternary)" strokeWidth="0.5" strokeDasharray="3 2"/>
      {/* AP curve */}
      <path d="M20,92 L40,92 C41,92 42,88 43,20 C44,12 47,10 52,12 L55,25 L120,25 C130,25 140,65 145,88 C148,94 152,92 210,92"
        fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round"/>
      {/* Phase labels */}
      <text x="30" y="106" textAnchor="middle" fontSize="8" fill="var(--label-tertiary)">4</text>
      <text x="43" y="9"   textAnchor="middle" fontSize="8" fill="var(--label-secondary)" fontWeight="700">0</text>
      <text x="55" y="20"  textAnchor="middle" fontSize="8" fill="var(--label-secondary)">1</text>
      <text x="87" y="20"  textAnchor="middle" fontSize="8" fill="var(--label-secondary)">2 (plateau)</text>
      <text x="143" y="60" textAnchor="middle" fontSize="8" fill="var(--label-secondary)">3</text>
      <text x="185" y="106" textAnchor="middle" fontSize="8" fill="var(--label-tertiary)">4</text>
      {/* Y-axis labels */}
      <text x="18" y="93" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">−90</text>
      <text x="18" y="22" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">+20</text>
      <text x="18" y="58" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">0</text>
      <line x1="19" y1="55" x2="21" y2="55" stroke="var(--separator)" strokeWidth="0.5"/>
      {/* Title */}
      <text x="115" y="10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FF9500">Kardiomiosit Ventrikel</text>
    </svg>
  );
}

function SANodeAP() {
  return (
    <svg viewBox="0 0 220 120" width="100%" style={{ display:'block' }}>
      <line x1="20" y1="10" x2="20" y2="100" stroke="var(--separator)" strokeWidth="0.5"/>
      <line x1="20" y1="100" x2="210" y2="100" stroke="var(--separator)" strokeWidth="0.5"/>
      {/* SA node AP — spontaneous depolarization (phase 4 slope) */}
      <path d="M20,85 C35,83 55,78 68,68 C78,60 83,18 88,12 C93,6 97,10 100,18 C108,38 118,70 125,82 C130,87 138,86 155,83 C170,80 188,75 210,65"
        fill="none" stroke="#30B0C7" strokeWidth="2" strokeLinecap="round"/>
      {/* Labels */}
      <text x="40" y="106" textAnchor="middle" fontSize="8" fill="var(--label-secondary)">4 (spontan)</text>
      <text x="86" y="9"   textAnchor="middle" fontSize="8" fill="var(--label-secondary)" fontWeight="700">0</text>
      <text x="112" y="40" textAnchor="middle" fontSize="8" fill="var(--label-secondary)">3</text>
      {/* Threshold line */}
      <line x1="20" y1="70" x2="85" y2="70" stroke="var(--separator)" strokeWidth="0.5" strokeDasharray="3 2"/>
      <text x="18" y="71" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">th</text>
      <text x="18" y="86" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">−60</text>
      <text x="18" y="22" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">+20</text>
      <text x="115" y="10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#30B0C7">SA Node (Pacu Jantung)</text>
    </svg>
  );
}

function ActionPotentialTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'14px 12px',
          boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
          <VentricularAP/>
        </div>
        <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'14px 12px',
          boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
          <SANodeAP/>
        </div>
      </div>
      <div style={{ background:'var(--bg-primary)', borderRadius:16, overflow:'hidden',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        {[
          { phase:'Fase 0', name:'Depolarisasi Cepat', color:'#FF3B30', desc:'Kanal Na⁺ cepat terbuka → upstroke. Hanya kardiomiosit cepat (tidak ada di SA node).' },
          { phase:'Fase 1', name:'Repolarisasi Awal',  color:'#FF9500', desc:'Kanal Na⁺ inaktif, K⁺ keluar (Ito). Takik kecil pada puncak.' },
          { phase:'Fase 2', name:'Plateau',            color:'#34C759', desc:'Kanal Ca²⁺ tipe-L masuk = kanal K⁺ keluar. Sesuai segmen ST. Khas jantung.' },
          { phase:'Fase 3', name:'Repolarisasi',       color:'#30B0C7', desc:'K⁺ dominan, Ca²⁺ tutup. Membran kembali ke −90 mV. Sesuai gelombang T.' },
          { phase:'Fase 4', name:'Istirahat / Spontan',color:'#8E8E93', desc:'SA node: depolarisasi spontan lambat (If, ICa) → pacu jantung. Ventrikel: flat.' },
        ].map((r,i)=>(
          <div key={r.phase} style={{ display:'flex', gap:12, padding:'10px 16px',
            borderTop:i>0?'0.5px solid var(--separator)':'none', alignItems:'flex-start' }}>
            <div style={{ minWidth:56, flexShrink:0 }}>
              <div className="t-caption-2" style={{ fontWeight:700, color:r.color }}>{r.phase}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)', fontWeight:400 }}>{r.name}</div>
            </div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--fill-quaternary)', borderRadius:14, padding:'13px 16px' }}>
        <div className="t-footnote" style={{ fontWeight:700, color:'var(--label-secondary)', marginBottom:8 }}>RELEVANSI KLINIS</div>
        {[
          ['Hiperkalemia','Menginaktivasi kanal Na⁺ → fase 0 lambat → konduksi melambat → LBBB → asistol'],
          ['Antiaritmia Kelas I','Blok kanal Na⁺ (lidokain, prokainamid) → memperlambat konduksi'],
          ['Antiaritmia Kelas III','Blok kanal K⁺ (amiodaron) → memperpanjang fase 3 → QT panjang'],
          ['Kalsium antagonis','Blok Ca²⁺ → menekan SA/AV node (verapamil) atau ventrikel (nifedipin)'],
        ].map(([drug, desc])=>(
          <div key={drug} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
            <span className="t-caption-1" style={{ fontWeight:700, color:'var(--accent)', flexShrink:0, minWidth:115 }}>{drug}</span>
            <span className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
      {/* References */}
      <div style={{ marginTop: 24, paddingTop: 14, borderTop: '0.5px solid var(--separator)' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8, letterSpacing: '0.06em' }}>REFERENSI</div>
        {[
          { text: 'Bers DM. Cardiac excitation–contraction coupling. Nature. 2002;415:198–205.', url: 'https://doi.org/10.1038/415198a' },
          { text: 'Grant AO. Cardiac ion channels. Circ Arrhythm Electrophysiol. 2009;2(2):185–194.', url: 'https://doi.org/10.1161/CIRCEP.108.789081' },
          { text: 'Katz AM. Physiology of the Heart. 5th ed. Philadelphia: Lippincott Williams & Wilkins; 2010. Chapter 14.' },
        ].map((r, i) => (
          <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', lineHeight: 1.55, paddingLeft: 10, borderLeft: '2px solid var(--fill-secondary)', marginBottom: 4 }}>
            {r.url
              ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{r.text}</a>
              : r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- 3. Hemodinamik ------------------------------------- */
function HemodynamicsTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* CO Formula */}
      <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'18px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)', textAlign:'center' }}>
        <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginBottom:10 }}>CARDIAC OUTPUT</div>
        <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-mono)',
          color:'var(--label-primary)', letterSpacing:'-0.02em', marginBottom:6 }}>
          CO = HR × SV
        </div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)' }}>
          Normal: 4–8 L/mnt &nbsp;·&nbsp; CI = CO / BSA (normal 2.5–4 L/mnt/m²)
        </div>
      </div>
      {/* SV determinants */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'Preload', icon:'↑', color:'#30B0C7', desc:'Volume EDV. Hk. Frank-Starling: EDV↑ → kontraksi lebih kuat.', clinical:'Cairan IV, PCWP, CVP' },
          { label:'Afterload', icon:'↓', color:'#FF9500', desc:'Resistansi terhadap ejeksi (SVR). Afterload↑ → SV↓ (jantung gagal).', clinical:'Vasodilator, AoV stenosis' },
          { label:'Kontraktilitas', icon:'⚡', color:'#34C759', desc:'Inotropi intrinsik. Independen dari preload/afterload.', clinical:'Dobutamin, Ca²⁺, iskemia' },
        ].map(({ label, icon, color, desc, clinical }) => (
          <div key={label} style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 12px',
            boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:color+'22',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.1rem', color:color, fontWeight:700, flexShrink:0 }}>{icon}</div>
              <span className="t-subheadline" style={{ fontWeight:700, color:'var(--label-primary)' }}>{label}</span>
            </div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5, marginBottom:8 }}>{desc}</div>
            <div className="t-caption-2" style={{ color:color, fontWeight:600 }}>{clinical}</div>
          </div>
        ))}
      </div>
      {/* Frank-Starling */}
      <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-footnote" style={{ fontWeight:700, color:'var(--label-secondary)', marginBottom:10 }}>HUKUM FRANK-STARLING</div>
        <svg viewBox="0 0 280 100" width="100%" style={{ display:'block', marginBottom:10 }}>
          {/* Axes */}
          <line x1="30" y1="10" x2="30" y2="85" stroke="var(--label-tertiary)" strokeWidth="1"/>
          <line x1="30" y1="85" x2="270" y2="85" stroke="var(--label-tertiary)" strokeWidth="1"/>
          <text x="28" y="50" textAnchor="end" fontSize="8" fill="var(--label-tertiary)" transform="rotate(-90,28,50)">Stroke Volume</text>
          <text x="150" y="96" textAnchor="middle" fontSize="8" fill="var(--label-tertiary)">EDV / Preload</text>
          {/* Normal curve */}
          <path d="M30,82 C60,75 90,55 120,35 C145,20 175,16 240,15"
            fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round"/>
          {/* Heart failure curve (lower) */}
          <path d="M30,82 C60,78 90,70 120,58 C145,50 175,46 240,44"
            fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3"/>
          {/* Labels */}
          <text x="195" y="12" fontSize="8" fill="#34C759" fontWeight="600">Normal</text>
          <text x="195" y="42" fontSize="8" fill="#FF3B30" fontWeight="600">Gagal Jantung</text>
        </svg>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
          Jantung memompa semua darah yang masuk (tanpa akumulasi vena).
          EDV↑ → sarkomer lebih panjang → tumpang tindih aktin-miosin lebih baik → kontraksi lebih kuat.
          Pada gagal jantung: kurva bergeser ke bawah.
        </div>
      </div>
      {/* MAP formula */}
      <div style={{ background:'var(--fill-quaternary)', borderRadius:14, padding:'13px 16px' }}>
        <div className="t-caption-2" style={{ fontWeight:700, color:'var(--label-secondary)', marginBottom:10 }}>FORMULA PENTING</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 14px' }}>
          {[
            ['MAP', 'DBP + ⅓(PP)', '70–100 mmHg'],
            ['PP', 'SBP − DBP', '~40 mmHg'],
            ['SVR', '(MAP − CVP)/CO × 80', '800–1200 dyn·s/cm⁵'],
            ['DO₂', 'CO × CaO₂', 'O₂ delivery ke jaringan'],
          ].map(([name, formula, normal])=>(
            <div key={name} style={{ background:'var(--bg-primary)', borderRadius:10, padding:'10px 12px',
              boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
              <div className="t-caption-2" style={{ fontWeight:700, color:'var(--accent)', marginBottom:3 }}>{name}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.8125rem', fontWeight:600,
                color:'var(--label-primary)', marginBottom:3 }}>{formula}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>{normal}</div>
            </div>
          ))}
        </div>
      </div>
      {/* References */}
      <div style={{ marginTop: 24, paddingTop: 14, borderTop: '0.5px solid var(--separator)' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8, letterSpacing: '0.06em' }}>REFERENSI</div>
        {[
          { text: 'Starling EH. The Linacre Lecture on the Law of the Heart. London: Longmans, Green; 1918.' },
          { text: 'Katz AM. Physiology of the Heart. 5th ed. Philadelphia: Lippincott Williams & Wilkins; 2010. Chapter 12.' },
          { text: 'Braunwald E, et al. Heart Disease: A Textbook of Cardiovascular Medicine. 11th ed. Philadelphia: Elsevier; 2018.' },
        ].map((r, i) => (
          <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', lineHeight: 1.55, paddingLeft: 10, borderLeft: '2px solid var(--fill-secondary)', marginBottom: 4 }}>
            {r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Theory Screen — shared mobile + desktop layout
   ============================================================ */
const THEORY_TABS = [
  { key:'cycle',  label:'Siklus Jantung' },
  { key:'ap',     label:'Aksi Potensial' },
  { key:'hemo',   label:'Hemodinamik' },
];

interface TheoryScreenProps { nav?: Nav; isMobile?: boolean; }

export function TheoryScreen({ nav, isMobile = false }: TheoryScreenProps) {
  const [tab, setTab] = useState('cycle');
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'var(--bg-secondary)' }}>
      {isMobile && nav && (
        <NavBar title="Teori Jantung" back="Kembali" onBack={nav.pop}/>
      )}
      {/* Header */}
      <div style={{ padding:'16px 20px 0', flexShrink:0 }}>
        <div className="t-title-2" style={{ fontWeight:700, marginBottom:2 }}>Teori Jantung</div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)', marginBottom:12 }}>
          Fisiologi kardiovaskular esensial untuk ACLS
        </div>
        {/* Tab selector */}
        <div style={{ display:'flex', gap:6 }}>
          {THEORY_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
              background: tab===t.key ? 'var(--accent)' : 'var(--fill-quaternary)',
              color: tab===t.key ? '#fff' : 'var(--label-secondary)',
              fontSize:'0.8125rem', fontWeight: tab===t.key ? 600 : 400,
              transition:'all 150ms ease',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 40px' }}>
        {tab==='cycle' && <CardiacCycleTab/>}
        {tab==='ap'    && <ActionPotentialTab/>}
        {tab==='hemo'  && <HemodynamicsTab/>}
      </div>
    </div>
  );
}

/* ============================================================
   Desktop version — two column
   ============================================================ */
export function DesktopTheory() {
  const [tab, setTab] = useState('cycle');
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left nav */}
      <div style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden',
        borderRight:'0.5px solid var(--separator-opaque)', background:'var(--bg-primary)',
        padding:'20px 12px' }}>
        <div className="t-title-3" style={{ fontWeight:700, marginBottom:4, padding:'0 4px' }}>Teori Jantung</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginBottom:14, padding:'0 4px' }}>
          Fisiologi kardiovaskular
        </div>
        {THEORY_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 10px',
              borderRadius:10, border:'none', cursor:'pointer', textAlign:'left', marginBottom:2,
              background: tab===t.key ? 'var(--accent-tint)' : 'transparent',
              color: tab===t.key ? 'var(--accent)' : 'var(--label-primary)',
              fontWeight: tab===t.key ? 600 : 400, fontSize:'0.9rem',
            }}>
            <span style={{ width:4, height:24, borderRadius:2, flexShrink:0,
              background: tab===t.key ? 'var(--accent)' : 'transparent' }}/>
            {t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', background:'var(--bg-secondary)', padding:'28px 36px 48px' }}>
        <div style={{ maxWidth:820 }}>
          {tab==='cycle' && <CardiacCycleTab/>}
          {tab==='ap'    && <ActionPotentialTab/>}
          {tab==='hemo'  && <HemodynamicsTab/>}
        </div>
      </div>
    </div>
  );
}
