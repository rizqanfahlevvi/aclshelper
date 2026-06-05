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
function WiggersDiagramAnimated() {
  // viewBox 0 0 360 155
  // Phase x-fractions: Kick 0–0.083 | IC 0.083–0.161 | Ejection 0.161–0.486
  //                    IR 0.486–0.569 | Rapid Fill 0.569–0.764 | Diastasis 0.764–1.0
  const DUR = "1.3s";
  const LV_PATH = "M0,87 C8,87 22,83 30,79 C40,72 52,45 58,36 C72,18 112,8 140,9 C160,10 168,25 175,36 C182,47 196,82 205,87 L360,87";
  const ECG_PATH = "M0,140 L22,140 C24,140 26,133 28,130 C30,127 31,143 33,140 L35,140 L37,122 L40,150 L42,140 L58,140 L175,140 L178,140 C183,140 188,132 195,128 C200,125 205,143 210,140 L240,140 C248,140 254,128 260,125 C266,122 268,138 272,140 L360,140";
  return (
    <svg viewBox="0 0 360 155" width="100%" style={{ display:'block' }}>
      {/* Phase backgrounds — discrete highlight follows cursor */}
      <rect x="0" y="12" width="30" height="80" fill="#FF9500">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.28;0.10;0.10" keyTimes="0;0.083;1"/>
      </rect>
      <rect x="30" y="12" width="28" height="80" fill="#FF6B6B">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.10;0.28;0.10;0.10" keyTimes="0;0.083;0.161;1"/>
      </rect>
      <rect x="58" y="12" width="117" height="80" fill="#FF3B30">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.10;0.28;0.10;0.10" keyTimes="0;0.161;0.486;1"/>
      </rect>
      <rect x="175" y="12" width="30" height="80" fill="#FF6B6B">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.10;0.28;0.10;0.10" keyTimes="0;0.486;0.569;1"/>
      </rect>
      <rect x="205" y="12" width="70" height="80" fill="#30B0C7">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.10;0.28;0.10;0.10" keyTimes="0;0.569;0.764;1"/>
      </rect>
      <rect x="275" y="12" width="85" height="80" fill="#30B0C7">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" calcMode="discrete"
          values="0.10;0.28;0.28" keyTimes="0;0.764;1"/>
      </rect>
      {/* Baseline */}
      <line x1="0" y1="92" x2="360" y2="92" stroke="var(--separator)" strokeWidth="0.5"/>
      {/* LV Pressure curve */}
      <path d={LV_PATH} fill="none" stroke="#FF3B30" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Aortic pressure (dashed) */}
      <path d="M58,48 C72,18 112,8 140,9 C160,10 168,25 175,36 C177,40 178,37 180,38 C188,44 215,50 360,50"
        fill="none" stroke="#30B0C7" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" strokeOpacity={0.7}/>
      {/* Valve events — dashed verticals */}
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
      {/* SISTOLE / DIASTOLE */}
      <text x="116" y="104" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FF3B30" opacity={0.8}>— SISTOLE —</text>
      <text x="282" y="104" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#30B0C7" opacity={0.8}>— DIASTOLE —</text>
      {/* ECG trace */}
      <path d={ECG_PATH} fill="none" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      {/* ── ANIMATED CURSOR ── sweeps left→right synced with phase highlights */}
      <line x1="0" y1="10" x2="0" y2="110" stroke="var(--label-secondary)" strokeWidth="1.2" opacity="0.4">
        <animate attributeName="x1" from="0" to="360" dur={DUR} repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="x2" from="0" to="360" dur={DUR} repeatCount="indefinite" calcMode="linear"/>
      </line>
      {/* ── ANIMATED DOT — LV Pressure curve ── */}
      <circle r="4.5" fill="#FF3B30" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"
        style={{ filter:'drop-shadow(0 0 5px rgba(255,59,48,0.85))' }}>
        <animateMotion path={LV_PATH} dur={DUR} repeatCount="indefinite"/>
      </circle>
      {/* ── ANIMATED DOT — ECG trace ── */}
      <circle r="3.5" fill="#34C759" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2"
        style={{ filter:'drop-shadow(0 0 4px rgba(52,199,89,0.85))' }}>
        <animateMotion path={ECG_PATH} dur={DUR} repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

/* ---- Citation helpers ---------------------------------------- */
function Cite({ n, href }: { n: number; href?: string }) {
  const s: React.CSSProperties = {
    color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 700, textDecoration: 'none',
  };
  return (
    <sup style={{ lineHeight: 0 }}>
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" style={s}>[{n}]</a>
        : <span style={s}>[{n}]</span>
      }
    </sup>
  );
}

interface RefItem { n: number; text: string; url?: string; }
function RefBlock({ items }: { items: RefItem[] }) {
  return (
    <div style={{ marginTop: 24, paddingTop: 14, borderTop: '0.5px solid var(--separator)' }}>
      <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8, letterSpacing: '0.06em' }}>
        REFERENSI
      </div>
      {items.map(r => (
        <div key={r.n} style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)', lineHeight: 1.55,
          paddingLeft: 10, borderLeft: '2px solid var(--fill-secondary)', marginBottom: 5 }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 5 }}>[{r.n}]</span>
          {r.url
            ? <a href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}>{r.text}</a>
            : r.text}
        </div>
      ))}
    </div>
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
        <WiggersDiagramAnimated/>
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

/* ---- 4. Mekanisme Aritmia ------------------------------------ */
type ArrMech = 'reentry' | 'auto' | 'triggered';
const ARRHYTHMIA_REFS: RefItem[] = [
  { n:1, text:'Antzelevitch C, Burashnikov A. Overview of basic mechanisms of cardiac arrhythmia. Card Electrophysiol Clin. 2011;3(1):23–45.', url:'https://doi.org/10.1016/j.ccep.2010.10.012' },
  { n:2, text:'Mines GR. On circulating excitations in heart muscles. Trans R Soc Can. 1914;4:43–52.' },
  { n:3, text:'Wit AL, Rosen MR. Pathophysiologic mechanisms of cardiac arrhythmias. Am Heart J. 1983;106(4):798–811.', url:'https://doi.org/10.1016/0002-8703(83)90003-4' },
  { n:4, text:'Stevenson WG. Ventricular scars and ventricular tachycardia. Trans Am Clin Climatol Assoc. 2009;120:403–12.' },
  { n:5, text:'Priori SG, et al. 2015 ESC Guidelines for the management of patients with ventricular arrhythmias. Eur Heart J. 2015;36(41):2793–2867.', url:'https://doi.org/10.1093/eurheartj/ehv316' },
];

function ReentrySVG() {
  return (
    <svg viewBox="0 0 220 140" width="100%" style={{ display: 'block' }}>
      {/* Dual pathway schematic */}
      {/* AV node */}
      <ellipse cx="110" cy="22" rx="22" ry="12" fill="#FF3B30" opacity={0.85}/>
      <text x="110" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">AV Node</text>
      {/* Fast pathway left — blocked antegrade */}
      <path d="M96,34 L62,90" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeDasharray="6 3"/>
      <text x="54" y="58" fontSize="8" fill="#FF3B30" fontWeight="700">Fast</text>
      {/* Block symbol on fast pathway */}
      <line x1="70" y1="70" x2="60" y2="78" stroke="#FF3B30" strokeWidth="2.5"/>
      <line x1="60" y1="70" x2="70" y2="78" stroke="#FF3B30" strokeWidth="2.5"/>
      {/* Slow pathway right — conducts antegrade */}
      <path d="M124,34 L158,90" fill="none" stroke="#34C759" strokeWidth="2.5"/>
      <text x="150" y="58" fontSize="8" fill="#34C759" fontWeight="700">Slow</text>
      {/* His bundle junction */}
      <ellipse cx="110" cy="95" rx="18" ry="9" fill="#FF9500" opacity={0.85}/>
      <text x="110" y="99" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">His</text>
      {/* Retrograde up fast pathway */}
      <path d="M92,90 L74,48" fill="none" stroke="#FF9500" strokeWidth="2" strokeDasharray="4 2"/>
      <polygon points="73,48 69,58 79,55" fill="#FF9500"/>
      <text x="46" y="82" fontSize="7.5" fill="#FF9500" fontWeight="600">Retrograd</text>
      {/* Antegrade arrow on slow */}
      <polygon points="158,90 152,80 162,80" fill="#34C759"/>
      {/* Labels */}
      <text x="110" y="120" textAnchor="middle" fontSize="8" fill="var(--label-secondary)">Sirkuit AVNRT</text>
      <rect x="2" y="60" width="50" height="14" rx="4" fill="#FF3B30" opacity={0.12}/>
      <text x="27" y="70" textAnchor="middle" fontSize="7" fill="#FF3B30" fontWeight="600">Blok unidireksional</text>
      {/* Excitable gap annotation */}
      <text x="110" y="133" textAnchor="middle" fontSize="7" fill="var(--label-tertiary)">
        Reentry = blok unidireksional + konduksi lambat + excitable gap
      </text>
    </svg>
  );
}

function AutomaticitySVG() {
  return (
    <svg viewBox="0 0 240 115" width="100%" style={{ display: 'block' }}>
      {/* Axes */}
      <line x1="22" y1="10" x2="22" y2="90" stroke="var(--label-tertiary)" strokeWidth="1"/>
      <line x1="22" y1="90" x2="225" y2="90" stroke="var(--label-tertiary)" strokeWidth="1"/>
      <text x="20" y="95" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">−90</text>
      <text x="20" y="38" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">−40</text>
      <text x="20" y="18" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">0 mV</text>
      {/* Threshold line */}
      <line x1="22" y1="38" x2="225" y2="38" stroke="var(--separator)" strokeWidth="0.75" strokeDasharray="4 3"/>
      <text x="228" y="41" fontSize="7" fill="var(--label-tertiary)">ambang</text>
      {/* Normal SA — gentle slope */}
      <path d="M22,83 C50,80 78,70 98,38 C104,22 110,16 118,16 C128,18 134,35 140,55 C148,72 160,83 185,83 C208,80 225,76 238,70"
        fill="none" stroke="#30B0C7" strokeWidth="2" strokeLinecap="round"/>
      <text x="46" y="105" fontSize="7.5" fill="#30B0C7" fontWeight="600">SA normal (60/mnt)</text>
      {/* Enhanced automaticity — steeper slope */}
      <path d="M22,83 C35,78 52,55 62,38 C68,22 74,16 82,16 C92,18 98,35 104,55 C110,72 120,83 145,83"
        fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round"/>
      <text x="100" y="105" fontSize="7.5" fill="#FF9500" fontWeight="600">Ektopik (automatisitas ↑)</text>
      {/* Arrows showing slope */}
      <path d="M34,74 L55,44" fill="none" stroke="#30B0C7" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#arr)"/>
      <path d="M28,78 L44,44" fill="none" stroke="#FF9500" strokeWidth="1" strokeDasharray="3 2"/>
      <text x="112" y="10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FF9500">Slope ↑ → laju ↑</text>
    </svg>
  );
}

function TriggeredSVG() {
  return (
    <svg viewBox="0 0 240 120" width="100%" style={{ display: 'block' }}>
      {/* Axes */}
      <line x1="18" y1="10" x2="18" y2="95" stroke="var(--label-tertiary)" strokeWidth="1"/>
      <line x1="18" y1="95" x2="230" y2="95" stroke="var(--label-tertiary)" strokeWidth="1"/>
      <text x="16" y="98" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">−90</text>
      <text x="16" y="20" textAnchor="end" fontSize="7" fill="var(--label-tertiary)">+20</text>
      {/* Normal AP */}
      <path d="M18,88 L40,88 C42,88 44,82 46,16 C48,8 52,8 56,14 L60,28 L120,28 C130,28 138,68 142,85 C144,88 148,88 160,88 L230,88"
        fill="none" stroke="var(--label-quaternary)" strokeWidth="1.5" strokeDasharray="5 3"/>
      <text x="93" y="10" fontSize="7.5" fill="var(--label-quaternary)">Normal AP</text>
      {/* EAD — hump on phase 2 */}
      <path d="M18,88 L38,88 C40,88 42,82 44,16 C46,8 50,8 54,14 L58,28 C62,28 70,22 78,18 C84,14 88,20 90,28 L120,28 C130,28 138,68 142,85 C144,88 148,88"
        fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"/>
      {/* EAD label */}
      <text x="78" y="10" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#FF3B30">EAD</text>
      <line x1="78" y1="12" x2="78" y2="20" stroke="#FF3B30" strokeWidth="1" strokeDasharray="2 1"/>
      <text x="8" y="45" fontSize="7" fill="#FF3B30" transform="rotate(-90,8,45)">Fase 2/3</text>
      {/* DAD — small depol after resting */}
      <path d="M160,88 C170,88 178,82 182,78 C186,74 188,80 190,88 L230,88"
        fill="none" stroke="#AF52DE" strokeWidth="2" strokeLinecap="round"/>
      <text x="185" y="70" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#AF52DE">DAD</text>
      <text x="175" y="110" textAnchor="middle" fontSize="7" fill="#AF52DE">Fase 4 (Ca²⁺ overload)</text>
      <text x="68" y="110" textAnchor="middle" fontSize="7" fill="#FF3B30">EAD → QT panjang → TdP</text>
    </svg>
  );
}

function ArrhythmiaMechanismTab() {
  const [mech, setMech] = useState<ArrMech>('reentry');
  const MECHS: Array<{ key: ArrMech; label: string; color: string; sub: string }> = [
    { key: 'reentry',   label: 'Reentry',           color: '#FF3B30', sub: 'VT, AVNRT, AFL, AVRT' },
    { key: 'auto',      label: 'Automatisitas ↑',   color: '#FF9500', sub: 'AIVR, JT, Fokal AT' },
    { key: 'triggered', label: 'Triggered Activity', color: '#AF52DE', sub: 'TdP, Digitalis, CPVT' },
  ];
  const detail: Record<ArrMech, React.ReactNode> = {
    reentry: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 12px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <ReentrySVG/>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <div className="t-callout" style={{ fontWeight: 700, marginBottom: 8 }}>Mekanisme Reentry</div>
          <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
            Reentry terjadi ketika impuls berputar dalam sirkuit tertutup, mengeksitasi ulang jaringan yang baru saja terdepolarisasi.<Cite n={1} href="https://doi.org/10.1016/j.ccep.2010.10.012"/> Tiga syarat wajib:<Cite n={2}/>
          </div>
          {[
            ['Blok unidireksional', 'Salah satu jalur terblokir satu arah (biasanya akibat perbedaan periode refrakter).'],
            ['Konduksi lambat', 'Impuls merambat cukup lambat melalui jalur alternatif (mis. jaringan parut, jnc AV lambat).'],
            ['Excitable gap', 'Jaringan proksimal sudah pulih (tidak refrakter) saat impuls tiba dari jalur lambat.'],
          ].map(([t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#FF3B30', flexShrink: 0, marginTop: 4 }}/>
              <div>
                <span className="t-callout" style={{ fontWeight: 700 }}>{t}</span>
                <span className="t-footnote" style={{ color: 'var(--label-secondary)' }}> — {d}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, background: 'var(--fill-quaternary)', borderRadius: 10, padding: '10px 12px' }}>
            <div className="t-caption-2" style={{ fontWeight: 700, color: '#FF3B30', marginBottom: 6 }}>CONTOH KLINIS</div>
            {[
              ['AVNRT', 'Reentry mikro di dual pathway AV node. HR 150–250/mnt, QRS sempit.'],
              ['AFL', 'Reentry makro di RA (cavotricuspid isthmus). Atrium 300×/mnt, AV 2:1 → HR ~150/mnt.'],
              ['VT Skar', <span key="vt">Reentry di jaringan parut pasca-MI (heterogeneous conduction). QRS lebar, monomorfik.<Cite n={4}/></span>],
            ].map(([t, d], i) => (
              <div key={String(t)} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <span className="t-caption-1" style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: 60 }}>{t}</span>
                <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    auto: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 12px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <AutomaticitySVG/>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <div className="t-callout" style={{ fontWeight: 700, marginBottom: 8 }}>Automatisitas Abnormal</div>
          <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
            Sel non-pacemaker (atrium, ventrikel) dapat mengembangkan depolarisasi spontan fase 4 jika kondisi berubah.<Cite n={3} href="https://doi.org/10.1016/0002-8703(83)90003-4"/> Trigger utama:
          </div>
          {[
            ['Iskemia', 'ATP↓ → kanal K-ATP terbuka → depolarisasi spontan.'],
            ['Hipoksia', 'Gangguan pompa Na⁺/K⁺ → akumulasi Na⁺ intrasel → slope fase 4 ↑.'],
            ['Katekolamin', 'β1-stimulasi → If (funny current) ↑ → laju pacemaker ↑. Relevan pada VT storm.'],
            ['Digitalis toksik', 'Inhibisi Na⁺/K⁺-ATPase → Ca²⁺ overload intrasel → automatisitas ↑ (AIVR, JT).'],
          ].map(([t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#FF9500', flexShrink: 0, marginTop: 4 }}/>
              <div>
                <span className="t-callout" style={{ fontWeight: 700 }}>{t}</span>
                <span className="t-footnote" style={{ color: 'var(--label-secondary)' }}> — {d}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, background: 'var(--fill-quaternary)', borderRadius: 10, padding: '10px 12px' }}>
            <div className="t-caption-2" style={{ fontWeight: 700, color: '#FF9500', marginBottom: 6 }}>CONTOH KLINIS</div>
            {[
              ['AIVR', 'Accelerated Idioventricular Rhythm — otomatisitas ventrikel, 40–100/mnt. Sering pasca-reperfusi.'],
              ['JT', 'Junctional Tachycardia — fokus AV junction. Pasca-operasi jantung atau digitalis toksik.'],
              ['Fokal AT', 'Fokus ektopik atrium tunggal. Dapat disebabkan hipoksia, teofilin, kopi berlebih.'],
            ].map(([t, d], i) => (
              <div key={t} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                <span className="t-caption-1" style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0, minWidth: 60 }}>{t}</span>
                <span className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    triggered: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 12px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <TriggeredSVG/>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <div className="t-callout" style={{ fontWeight: 700, marginBottom: 8 }}>Triggered Activity</div>
          <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
            Aktivitas dipicu oleh afterdepolarization — osilasi voltase yang muncul setelah AP utama.<Cite n={3} href="https://doi.org/10.1016/0002-8703(83)90003-4"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            {[
              { type: 'EAD', color: '#FF3B30', timing: 'Fase 2 atau 3', mechanism: 'QT panjang → plateau berkepanjangan → kanal Ca²⁺ re-aktivasi', example: 'Torsades de Pointes', drug: 'Amiodaron, Sotalol, QT-prolonging drugs' },
              { type: 'DAD', color: '#AF52DE', timing: 'Fase 4', mechanism: 'Ca²⁺ overload SR → spontaneous Ca²⁺ release → NCX aktif → depolarisasi', example: 'CPVT, Digitalis toxicity', drug: 'Digoxin, Katekolamin' },
            ].map(item => (
              <div key={item.type} style={{ background: 'var(--fill-quaternary)', borderRadius: 10, padding: '12px' }}>
                <div className="t-subheadline" style={{ fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.type}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 3 }}>TIMING</div>
                <div className="t-caption-1" style={{ fontWeight: 600, marginBottom: 6 }}>{item.timing}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 3 }}>MEKANISME</div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4, marginBottom: 6 }}>{item.mechanism}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 3 }}>CONTOH</div>
                <div className="t-caption-1" style={{ fontWeight: 600, color: item.color }}>{item.example}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 3 }}>{item.drug}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, background: 'rgba(175,82,222,0.08)', borderRadius: 10, padding: '10px 12px',
            boxShadow: '0 0 0 1px rgba(175,82,222,0.3)' }}>
            <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.55 }}>
              <span style={{ fontWeight: 700, color: '#AF52DE' }}>CPVT (Catecholaminergic Polymorphic VT)</span> — mutasi RyR2 atau CASQ2 menyebabkan Ca²⁺ leak dari SR saat stres → DAD → VT bidireksional/polimorfik. Risiko SCD pada anak/dewasa muda saat olahraga.<Cite n={5} href="https://doi.org/10.1093/eurheartj/ehv316"/>
            </div>
          </div>
        </div>
      </div>
    ),
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {MECHS.map(m => (
          <button key={m.key} onClick={() => setMech(m.key)} style={{
            padding: '12px 8px', borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'center',
            background: mech === m.key ? m.color + '18' : 'var(--bg-primary)',
            boxShadow: mech === m.key ? `0 0 0 1.5px ${m.color}` : '0 0 0 0.5px var(--separator-opaque)',
            transition: 'all 150ms ease',
          }}>
            <div className="t-caption-1" style={{ fontWeight: 700, color: mech === m.key ? m.color : 'var(--label-primary)', marginBottom: 3 }}>{m.label}</div>
            <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', lineHeight: 1.3 }}>{m.sub}</div>
          </button>
        ))}
      </div>
      {detail[mech]}
      <RefBlock items={ARRHYTHMIA_REFS}/>
    </div>
  );
}

/* ---- 5. Farmakologi Antiaritmia ------------------------------ */
type VWClass = 'IA' | 'IB' | 'IC' | 'II' | 'III' | 'IV' | 'other';
const PHARM_REFS: RefItem[] = [
  { n:1, text:'Vaughan Williams EM. Classification of antiarrhythmic drugs. Pharmacol Ther B. 1975;1(1):115–138.', url:'https://doi.org/10.1016/0306-039X(75)90019-7' },
  { n:2, text:'January CT, et al. 2014 AHA/ACC/HRS Guideline for Atrial Fibrillation. JACC. 2014;64(21):e1–76.', url:'https://doi.org/10.1016/j.jacc.2014.03.022' },
  { n:3, text:'Zimetbaum P. Antiarrhythmic Drug Therapy for Atrial Fibrillation. Circulation. 2012;125:381–389.', url:'https://doi.org/10.1161/CIRCULATIONAHA.111.019927' },
  { n:4, text:'Lähteenmäki R, et al. Amiodarone pharmacology in clinical context. Ann Med. 2023;55(1):499–514.', url:'https://doi.org/10.1080/07853890.2023.2173748' },
  { n:5, text:'AHA ACLS Guidelines 2020. Part 7: Adult Advanced Cardiovascular Life Support. Circulation. 2020;142(16_suppl_2):S366–S468.', url:'https://doi.org/10.1161/CIR.0000000000000916' },
];

interface VWData {
  color: string; label: string; channel: string; drugs: string[];
  mechanism: string; uses: string[]; contra: string; acls: boolean;
}
const VW_MAP: Record<VWClass, VWData> = {
  IA:    { color:'#FF6B35', label:'Kelas IA', channel:'Na⁺ (moderat) + K⁺',
           drugs:['Quinidine','Prokainamid','Disopiramid'],
           mechanism:'Memblok kanal Na⁺ (disasosiasi sedang) + kanal K⁺ → memperlambat konduksi + memperpanjang repolarisasi. QRS melebar + QT memanjang.',
           uses:['AF/AFL (konversi ritme)','SVT','VT (lini kedua)'], contra:'QT panjang, Blok AV, HF berat', acls:true },
  IB:    { color:'#FF9500', label:'Kelas IB', channel:'Na⁺ (cepat, selektif iskemia)',
           drugs:['Lidokain','Meksiletin','Fenitoin'],
           mechanism:'Blok kanal Na⁺ dengan disosiasi cepat — selektif untuk jaringan yang sering depolarisasi (jaringan iskemia, ventrikel). Tidak memperpanjang QT.',
           uses:['VT/VF (lini kedua pasca-amiodaron)','VT pasca-MI'], contra:'Bradikardi, Blok AV derajat tinggi', acls:true },
  IC:    { color:'#FFCC00', label:'Kelas IC', channel:'Na⁺ (kuat, disasosiasi lambat)',
           drugs:['Flekainid','Propafenon'],
           mechanism:'Blok kuat kanal Na⁺, disasosiasi sangat lambat → konduksi melambat signifikan di atrium dan ventrikel. QRS melebar. Proaritmia tinggi pada pasca-MI.',
           uses:['AF/AFL (Pill in the pocket)','SVT tanpa penyakit jantung struktural'], contra:'Penyakit jantung struktural, Post-MI, HF', acls:false },
  II:    { color:'#34C759', label:'Kelas II', channel:'β1-adrenoreseptor',
           drugs:['Metoprolol','Atenolol','Esmolol','Karvedilol'],
           mechanism:'Blok β1 → cAMP↓ → If↓, ICa↓ → menekan otomatisitas SA node + memperlambat konduksi AV. Efektif kontrol laju pada AF/AFL.',
           uses:['Kontrol laju AF/AFL','AVNRT','VT storm (storm katekholaminergik)','SVT'], contra:'Asma berat, Blok AV derajat 2–3, Bradikardi', acls:true },
  III:   { color:'#007AFF', label:'Kelas III', channel:'K⁺ (repolarisasi)',
           drugs:['Amiodaron','Sotalol','Ibutilid','Dronedarone'],
           mechanism:'Blok kanal K⁺ (IKr, IKs) → fase 3 memanjang → QT memanjang → periode refrakter ↑. Amiodaron juga memblok Na⁺, Ca²⁺, dan β-reseptor (kelas I–IV campuran).',
           uses:['VF/pVT (amiodaron — AHA 2020 lini pertama)','AF/AFL (konversi + pemeliharaan ritme)','VT'], contra:'QT panjang (kecuali amiodaron), Bradikardi, Hipertiroid (amiodaron)', acls:true },
  IV:    { color:'#30B0C7', label:'Kelas IV', channel:'Ca²⁺ tipe-L',
           drugs:['Verapamil','Diltiazem'],
           mechanism:'Blok kanal Ca²⁺ tipe-L di SA node dan AV node → otomatisitas SA↓ + konduksi AV↓. Efektif untuk aritmia tergantung nodus (AVNRT, kontrol laju AF).',
           uses:['Kontrol laju AF/AFL','AVNRT','SVT stabil'], contra:'WPW + AF (risiko VF), HF berat, VT, Blok AV', acls:true },
  other: { color:'#AF52DE', label:'Lainnya', channel:'Berbeda-beda',
           drugs:['Adenosin','Digoksin','Magnesium','Atropin'],
           mechanism:'Di luar klasifikasi VW. Adenosin: agonis A1 → blok AV transien → terminasi AVNRT/AVRT. Magnesium: stabilisasi membran → efektif untuk TdP dan VT terkait hipomagnesemia.',
           uses:['Adenosin: AVNRT/AVRT (dosis 6–12 mg IV bolus cepat)','Magnesium: TdP, VF hipomagnesemia','Atropin: bradikardi simtomatik','Digoksin: kontrol laju AF/HF (lini ketiga)'], contra:'Adenosin: WPW. Digoksin: blok AV, WPW', acls:true },
};

function AntiarrhythmicPharmTab() {
  const [cls, setCls] = useState<VWClass>('III');
  const CLASSES: VWClass[] = ['IA','IB','IC','II','III','IV','other'];
  const d = VW_MAP[cls];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.55 }}>
        Klasifikasi Vaughan-Williams (1975)<Cite n={1} href="https://doi.org/10.1016/0306-039X(75)90019-7"/> membagi obat antiaritmia berdasarkan mekanisme elektrofisiologis. Amiodaron (Kelas III) adalah antiaritmia lini pertama di ACLS untuk VF/pVT.<Cite n={5} href="https://doi.org/10.1161/CIR.0000000000000916"/>
      </div>
      {/* Class selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {CLASSES.map(c => (
          <button key={c} onClick={() => setCls(c)} style={{
            padding: '7px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            background: cls === c ? VW_MAP[c].color : 'var(--fill-quaternary)',
            color: cls === c ? '#fff' : 'var(--label-secondary)',
            fontWeight: cls === c ? 700 : 400, fontSize: '0.8125rem',
            transition: 'all 150ms ease',
          }}>
            {c === 'other' ? 'Lainnya' : c}
          </button>
        ))}
      </div>
      {/* Detail card */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden',
        boxShadow: `0 0 0 1.5px ${d.color}40` }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 12px', background: d.color + '12',
          borderBottom: '0.5px solid var(--separator-opaque)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: '4px 12px', borderRadius: 20, background: d.color,
              color: '#fff', fontSize: '0.8125rem', fontWeight: 700 }}>{d.label}</div>
            <div style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--fill-quaternary)',
              color: 'var(--label-secondary)', fontSize: '0.75rem' }}>Target: {d.channel}</div>
            {d.acls && <div style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(52,199,89,0.15)',
              color: '#34C759', fontSize: '0.75rem', fontWeight: 600 }}>ACLS</div>}
          </div>
          <div className="t-callout" style={{ fontWeight: 700, marginBottom: 4 }}>Obat</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.drugs.map(drug => (
              <span key={drug} style={{ padding: '3px 10px', borderRadius: 8, background: d.color + '20',
                color: d.color, fontWeight: 600, fontSize: '0.8125rem' }}>{drug}</span>
            ))}
          </div>
        </div>
        {/* Mechanism */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator)' }}>
          <div className="t-caption-2" style={{ fontWeight: 700, color: 'var(--label-tertiary)', marginBottom: 6 }}>MEKANISME</div>
          <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.6 }}>{d.mechanism}</div>
        </div>
        {/* Uses */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator)' }}>
          <div className="t-caption-2" style={{ fontWeight: 700, color: 'var(--label-tertiary)', marginBottom: 6 }}>INDIKASI</div>
          {d.uses.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: 2.5, background: d.color, flexShrink: 0, marginTop: 5 }}/>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>{u}</div>
            </div>
          ))}
        </div>
        {/* Contra */}
        <div style={{ padding: '12px 16px' }}>
          <div className="t-caption-2" style={{ fontWeight: 700, color: 'var(--label-tertiary)', marginBottom: 6 }}>KONTRAINDIKASI</div>
          <div className="t-caption-1" style={{ color: '#FF3B30', lineHeight: 1.5 }}>{d.contra}</div>
        </div>
      </div>
      {/* Amiodaron note for Class III */}
      {cls === 'III' && (
        <div style={{ background: 'rgba(0,122,255,0.08)', borderRadius: 14, padding: '13px 16px',
          boxShadow: '0 0 0 1px rgba(0,122,255,0.25)' }}>
          <div className="t-caption-2" style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>AMIODARON DI ACLS</div>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.6 }}>
            AHA 2020<Cite n={5} href="https://doi.org/10.1161/CIR.0000000000000916"/>: Amiodaron <strong>300 mg IV</strong> bolus untuk VF/pVT refrakter. Dosis kedua 150 mg jika diperlukan. Mekanisme multi-kelas (I–IV) menjadikannya paling efektif namun juga paling banyak efek samping jangka panjang (tiroid, paru, hati).<Cite n={4} href="https://doi.org/10.1080/07853890.2023.2173748"/>
          </div>
        </div>
      )}
      <RefBlock items={PHARM_REFS}/>
    </div>
  );
}

/* ---- 6. Patofisiologi ACS ------------------------------------ */
const ACS_REFS: RefItem[] = [
  { n:1, text:'Libby P, et al. Pathophysiology of coronary artery disease. Circulation. 2023;148(2):149–171.', url:'https://doi.org/10.1161/CIRCULATIONAHA.122.049915' },
  { n:2, text:'Thygesen K, et al. Fourth universal definition of myocardial infarction (2018). Eur Heart J. 2019;40(3):237–269.', url:'https://doi.org/10.1093/eurheartj/ehy462' },
  { n:3, text:'Libby P. Mechanisms of acute coronary syndromes and their implications for therapy. N Engl J Med. 2013;368:2004–2013.', url:'https://doi.org/10.1056/NEJMra1216063' },
  { n:4, text:'Falk E. Plaque rupture with severe pre-existing stenosis precipitating coronary thrombosis. Br Heart J. 1983;50:127–134.', url:'https://doi.org/10.1136/hrt.50.2.127' },
  { n:5, text:'Neumann FJ, et al. 2018 ESC/EACTS Guidelines on myocardial revascularization. Eur Heart J. 2019;40(2):87–165.', url:'https://doi.org/10.1093/eurheartj/ehy394' },
];

interface ACSStep { title: string; color: string; svgContent: React.ReactNode; desc: React.ReactNode; }
function ACSPathophysTab() {
  const [step, setStep] = useState(0);
  const steps: ACSStep[] = [
    {
      title: '1. Disfungsi Endotel',
      color: '#FF9500',
      svgContent: (
        <svg viewBox="0 0 200 80" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="30" width="180" height="28" rx="14" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="30" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <text x="100" y="49" textAnchor="middle" fontSize="9" fill="var(--label-secondary)">Lumen arteri koroner</text>
          <text x="100" y="25" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FF9500">Endotel Normal → Disfungsi</text>
          <text x="100" y="70" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">LDL oksidasi, hipertensi, merokok, DM → endotel rusak</text>
        </svg>
      ),
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Aterosklerosis dimulai dari disfungsi endotel akibat faktor risiko (hipertensi, LDL-C tinggi, merokok, DM).<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.122.049915"/> LDL teroksidasi masuk ke subendotel → memicu respons inflamasi. Monosit berdiferensiasi menjadi makrofag → menelan LDL teroksidasi → <em>foam cells</em>.
        </div>
      ),
    },
    {
      title: '2. Pembentukan Plak',
      color: '#FF9500',
      svgContent: (
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          {/* Plaque */}
          <ellipse cx="100" cy="39" rx="38" ry="12" fill="#FF9500" opacity={0.75}/>
          <text x="100" y="43" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">Plak (lipid core)</text>
          <text x="100" y="54" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Lumen menyempit</text>
          <text x="100" y="75" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FF9500">Fibrous cap ← Stabilitas plak!</text>
        </svg>
      ),
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Akumulasi lipid, sel busa, dan sel T membentuk <em>lipid-rich necrotic core</em>.<Cite n={3} href="https://doi.org/10.1056/NEJMra1216063"/> <em>Fibrous cap</em> (jaringan ikat + sel otot polos) menutup core ini. <strong>Plak rentan</strong> (<em>vulnerable plaque</em>) memiliki fibrous cap tipis dan core lipid besar. Stenosis &gt;50% baru menimbulkan gejala angina stabil.
        </div>
      ),
    },
    {
      title: '3. Ruptur Plak',
      color: '#FF6B35',
      svgContent: (
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <ellipse cx="100" cy="38" rx="38" ry="12" fill="#FF9500" opacity={0.65}/>
          {/* Rupture */}
          <path d="M80,32 L88,26 L96,33" fill="none" stroke="#FF3B30" strokeWidth="2.5"/>
          <text x="70" y="20" fontSize="8" fill="#FF3B30" fontWeight="700">Ruptur!</text>
          <text x="100" y="54" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Lipid core terekspos</text>
          <text x="100" y="75" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Trigger: shear stress, spasme, inflamasi</text>
        </svg>
      ),
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Fibrous cap yang tipis dapat ruptur karena shear stress atau spasme.<Cite n={4} href="https://doi.org/10.1136/hrt.50.2.127"/> Ruptur mengekspos <em>tissue factor</em> dan kolagen subendotel ke aliran darah. ~70% MI terjadi pada stenosis &lt;50% sebelum ruptur — yaitu plak <em>non-flow limiting</em> yang rentan.<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.122.049915"/>
        </div>
      ),
    },
    {
      title: '4. Trombosis Akut',
      color: '#FF3B30',
      svgContent: (
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <ellipse cx="100" cy="38" rx="38" ry="12" fill="#FF9500" opacity={0.5}/>
          {/* Thrombus */}
          <ellipse cx="95" cy="37" rx="22" ry="10" fill="#FF3B30" opacity={0.8}/>
          <text x="95" y="41" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">Trombus</text>
          <text x="100" y="58" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Oklusi koroner akut</text>
          <text x="100" y="75" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Platelet + fibrin → trombus merah</text>
        </svg>
      ),
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Ekposur kolagen → aktivasi platelet (adhesi, agregasi) → aktivasi kaskade koagulasi → trombus.<Cite n={3} href="https://doi.org/10.1056/NEJMra1216063"/> <strong>STEMI</strong>: oklusi total (<em>red thrombus</em> dominan fibrin). <strong>NSTEMI/UA</strong>: oklusi parsial atau embolisasi distal (<em>white thrombus</em> dominan platelet). Inilah basis perbedaan strategi antiplatelet dan antikoagulan.
        </div>
      ),
    },
    {
      title: '5. Iskemia & Infark',
      color: '#FF3B30',
      svgContent: (
        <svg viewBox="0 0 200 95" width="100%" style={{ display: 'block' }}>
          {/* Heart outline */}
          <path d="M100,80 C70,60 30,40 30,20 C30,8 42,5 52,10 C62,15 72,25 100,50 C128,25 138,15 148,10 C158,5 170,8 170,20 C170,40 130,60 100,80Z"
            fill="none" stroke="var(--separator-opaque)" strokeWidth="1.5"/>
          {/* Zones */}
          <circle cx="80" cy="38" r="12" fill="#FF3B30" opacity={0.9}/>
          <circle cx="80" cy="38" r="18" fill="none" stroke="#FF9500" strokeWidth="2" opacity={0.7}/>
          <circle cx="80" cy="38" r="24" fill="none" stroke="#FFCC00" strokeWidth="1.5" opacity={0.5}/>
          <text x="80" y="42" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff">Nekrosis</text>
          <text x="108" y="28" fontSize="7" fill="#FF9500" fontWeight="600">Injury</text>
          <text x="115" y="18" fontSize="7" fill="#FFCC00" fontWeight="600">Iskemia</text>
          <text x="100" y="88" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Nekrosis → Injury → Iskemia (EKG)</text>
        </svg>
      ),
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Iskemia &gt;20 menit → infark transmural.<Cite n={2} href="https://doi.org/10.1093/eurheartj/ehy462"/> EKG mencerminkan zona: <strong>Nekrosis</strong> (QS wave), <strong>Injury</strong> (ST elevasi), <strong>Iskemia</strong> (inversi gelombang T). Biomarker: troponin I/T naik dalam 1–3 jam, puncak 18–24 jam. <em>Door-to-balloon &lt;90 menit</em> target reperfusi STEMI.<Cite n={5} href="https://doi.org/10.1093/eurheartj/ehy394"/>
        </div>
      ),
    },
  ];
  const cur = steps[step];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Step progress bar */}
      <div style={{ display: 'flex', gap: 4 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            flex: 1, height: 4, borderRadius: 2, border: 'none', cursor: 'pointer',
            background: i <= step ? s.color : 'var(--fill-tertiary)',
            transition: 'background 200ms ease',
          }}/>
        ))}
      </div>
      {/* Current step */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
        <div style={{ padding: '14px 16px 10px', background: cur.color + '12',
          borderBottom: '0.5px solid var(--separator-opaque)' }}>
          <div className="t-callout" style={{ fontWeight: 700, color: cur.color }}>{cur.title}</div>
        </div>
        <div style={{ padding: '12px 12px 6px' }}>{cur.svgContent}</div>
        <div style={{ padding: '6px 16px 14px' }}>{cur.desc}</div>
      </div>
      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
          flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: step === 0 ? 'default' : 'pointer',
          background: step === 0 ? 'var(--fill-quaternary)' : 'var(--fill-secondary)',
          color: step === 0 ? 'var(--label-quaternary)' : 'var(--label-primary)',
          fontWeight: 600, fontSize: '0.9rem',
        }}>← Sebelumnya</button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{
          flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: step === steps.length - 1 ? 'default' : 'pointer',
          background: step === steps.length - 1 ? 'var(--fill-quaternary)' : cur.color,
          color: step === steps.length - 1 ? 'var(--label-quaternary)' : '#fff',
          fontWeight: 600, fontSize: '0.9rem',
        }}>Selanjutnya →</button>
      </div>
      {/* STEMI vs NSTEMI comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { type: 'STEMI', color: '#FF3B30', kel: 'Oklusi total', ecg: 'ST elevasi ≥2mm (V1–V4), ≥1mm (II,III,aVF)', bio: 'Troponin ↑↑↑ (naik dalam 1–3 jam)', rx: 'PCI primer <90 menit / fibrinolisis <30 menit jika PCI tidak tersedia' },
          { type: 'NSTEMI/UA', color: '#FF9500', kel: 'Oklusi parsial', ecg: 'ST depresi atau T inversi (atau normal)', bio: 'NSTEMI: Troponin ↑. UA: Troponin normal', rx: 'Antiplatelet + antikoagulan. PCI early (<24 jam) jika risiko tinggi' },
        ].map(item => (
          <div key={item.type} style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '12px',
            boxShadow: `0 0 0 1px ${item.color}40` }}>
            <div className="t-subheadline" style={{ fontWeight: 800, color: item.color, marginBottom: 8 }}>{item.type}</div>
            {[['Lesi', item.kel], ['EKG', item.ecg], ['Biomarker', item.bio], ['Tata Laksana', item.rx]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 2 }}>{k}</div>
                <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <RefBlock items={ACS_REFS}/>
    </div>
  );
}

/* ---- 7. Jenis Syok ------------------------------------------ */
type ShockType = 'cardio' | 'distrib' | 'hypo' | 'obstruct';
const SHOCK_REFS: RefItem[] = [
  { n:1, text:'Vincent JL, De Backer D. Circulatory shock. N Engl J Med. 2013;369:1726–1734.', url:'https://doi.org/10.1056/NEJMra1208943' },
  { n:2, text:'Standl T, et al. The nomenclature, definition and distinction of types of shock. Dtsch Arztebl Int. 2018;115(45):757–768.', url:'https://doi.org/10.3238/arztebl.2018.0757' },
  { n:3, text:'Vahdatpour C, et al. Cardiogenic shock. J Am Heart Assoc. 2019;8(8):e011991.', url:'https://doi.org/10.1161/JAHA.119.011991' },
  { n:4, text:'Hollenberg SM. Vasoactive drugs in circulatory shock. Am J Respir Crit Care Med. 2011;183(7):847–855.', url:'https://doi.org/10.1164/rccm.201006-0972CI' },
  { n:5, text:'Evans L, et al. Surviving Sepsis Campaign: International Guidelines 2021. Intensive Care Med. 2021;47:1181–1247.', url:'https://doi.org/10.1007/s00134-021-06506-y' },
];

interface ShockData {
  label: string; color: string; co: '↑' | '↓' | '↔'; svr: '↑' | '↓' | '↔'; pcwp: '↑' | '↓' | '↔';
  mechanism: string; examples: string[]; management: string[]; vasopressor: string;
}
const SHOCK_MAP: Record<ShockType, ShockData> = {
  cardio:   { label:'Kardiogenik', color:'#FF3B30',
    co:'↓', svr:'↑', pcwp:'↑',
    mechanism:'Gagal pompa (disfungsi sistolik/diastolik/mekanik) → CO↓ → kompensasi vasokonstriksi (SVR↑) → backward failure (PCWP↑) → edema paru.',
    examples:['MI luas (RV atau LV)','Gagal jantung akut dekompensata','Miokarditis fulminan','Tamponade jantung (overlap obstruktif)'],
    management:['Revaskularisasi segera (STEMI → PCI)','Dobutamin (inotropik, hindari jika MAP <65)','Norepinefrin jika hipotensi berat','IABP / Impella / VA-ECMO jika refrakter','Kurangi preload jika edema paru (furosemid hati-hati)'],
    vasopressor:'Dobutamin 2–20 mcg/kg/mnt ± Norepinefrin' },
  distrib:  { label:'Distributif', color:'#FF9500',
    co:'↑', svr:'↓', pcwp:'↓',
    mechanism:'Vasodilatasi masif → SVR↓ → MAP↓ → kompensasi CO↑ (awal/hangat). Syok sepsis: sitokin (TNF-α, IL-1) → NO↑ → vasodilatasi. Terjadi maldistribusi aliran (shunting).',
    examples:['Sepsis (paling sering — Sepsis-3: 2021)','Syok anafilaksis (IgE → histamin, bradikinin)','Syok neurogenik (cedera medula spinalis)','Insufisiensi adrenal'],
    management:['Resusitasi cairan 30 mL/kg kristaloid (sepsis)','Norepinefrin lini pertama (MAP target ≥65)','Vasopressin 0.03 unit/mnt lini kedua','Kortikosteroid jika refrakter (hidrokortison 200 mg/hari)','Epinefrin (anafilaksis): 0.5 mg IM segera'],
    vasopressor:'Norepinefrin 0.01–3 mcg/kg/mnt (lini 1)' },
  hypo:     { label:'Hipovolemik', color:'#30B0C7',
    co:'↓', svr:'↑', pcwp:'↓',
    mechanism:'Kehilangan volume intravaskular (perdarahan, dehidrasi, luka bakar) → preload↓ → CO↓ → kompensasi SVR↑ (vasokonstriksi simpatetik). PCWP rendah mencerminkan preload rendah.',
    examples:['Perdarahan akut (trauma, ruptur aorta, GI atas)','Dehidrasi berat (diare, muntah)','Luka bakar luas','Peritonitis (third spacing)'],
    management:['Hentikan perdarahan (source control)','Resusitasi kristaloid vs produk darah (PRBCs, FFP, platelets)','Damage control resuscitation: 1:1:1 ratio','Hindari vasopressor sebelum volume adekuat','Asam traneksamat <3 jam (perdarahan trauma)'],
    vasopressor:'Norepinefrin jika hipotensi refrakter post-resusitasi' },
  obstruct: { label:'Obstruktif', color:'#AF52DE',
    co:'↓', svr:'↑', pcwp:'↑ atau ↓',
    mechanism:'Obstruksi mekanik pada aliran darah: PE masif → RV afterload↑ → RV failure → LV underfilling → CO↓. Tamponade: tekanan perikardial↑ → kompresi semua ruang → CO↓. Tension PTX: tekanan intrathoraks↑ → kink vena cava → preload↓.',
    examples:['PE masif (RV strain, syok)','Tamponade jantung (Beck triad: hipotensi, JVD, suara jantung menjauh)','Tension pneumotoraks','Sindrom kompartemen abdominal'],
    management:['PE masif: trombolisis sistemik (alteplase 100 mg) atau embolektomi','Tamponade: perikardiosentesis segera','Tension PTX: dekompresi jarum sela 2 ICS MCL → chest tube','Target: hilangkan obstruksi sesegera mungkin'],
    vasopressor:'Norepinefrin (bridge ke tindakan definitif)' },
};

function ShockTypesTab() {
  const [shk, setShk] = useState<ShockType>('cardio');
  const TYPES: Array<{ key: ShockType; label: string; color: string }> = [
    { key:'cardio',   label:'Kardiogenik', color:'#FF3B30' },
    { key:'distrib',  label:'Distributif', color:'#FF9500' },
    { key:'hypo',     label:'Hipovolemik', color:'#30B0C7' },
    { key:'obstruct', label:'Obstruktif',  color:'#AF52DE' },
  ];
  const d = SHOCK_MAP[shk];
  const arrowColor = (a: '↑' | '↓' | '↔') => a === '↑' ? '#FF3B30' : a === '↓' ? '#30B0C7' : '#FF9500';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.55 }}>
        Syok didefinisikan sebagai ketidakcukupan perfusi jaringan yang mengancam jiwa, menyebabkan hipoksia seluler.<Cite n={1} href="https://doi.org/10.1056/NEJMra1208943"/> Klasifikasi berdasarkan mekanisme hemodinamik memandu pemilihan vasopresor dan terapi definitif.<Cite n={2} href="https://doi.org/10.3238/arztebl.2018.0757"/>
      </div>
      {/* Type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setShk(t.key)} style={{
            padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'center',
            background: shk === t.key ? t.color + '18' : 'var(--bg-primary)',
            boxShadow: shk === t.key ? `0 0 0 1.5px ${t.color}` : '0 0 0 0.5px var(--separator-opaque)',
            transition: 'all 150ms ease',
          }}>
            <div className="t-callout" style={{ fontWeight: 700, color: shk === t.key ? t.color : 'var(--label-primary)' }}>{t.label}</div>
          </button>
        ))}
      </div>
      {/* Hemodynamic profile */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
        boxShadow: `0 0 0 1px ${d.color}40` }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 10 }}>PROFIL HEMODINAMIK</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {([['CO', 'Cardiac Output', d.co], ['SVR', 'Systemic Vascular Resistance', d.svr], ['PCWP', 'Pulmonary Capillary Wedge Pressure', d.pcwp]] as const).map(([k, full, val]) => (
            <div key={k} style={{ textAlign: 'center', background: 'var(--fill-quaternary)', borderRadius: 10, padding: '10px 8px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: arrowColor(val) }}>{val}</div>
              <div className="t-caption-2" style={{ fontWeight: 700, marginBottom: 2 }}>{k}</div>
              <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', lineHeight: 1.3 }}>{full}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Mechanism */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8 }}>MEKANISME</div>
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>{d.mechanism}</div>
      </div>
      {/* Examples + Management grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '12px 14px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8 }}>ETIOLOGI</div>
          {d.examples.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: 2.5, background: d.color, flexShrink: 0, marginTop: 4 }}/>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{e}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '12px 14px',
          boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
          <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', marginBottom: 8 }}>TATA LAKSANA</div>
          {d.management.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: 2.5, background: '#34C759', flexShrink: 0, marginTop: 4 }}/>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.4 }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Vasopressor highlight */}
      <div style={{ background: d.color + '10', borderRadius: 14, padding: '12px 16px',
        boxShadow: `0 0 0 1px ${d.color}40` }}>
        <div className="t-caption-2" style={{ color: d.color, fontWeight: 700, marginBottom: 4 }}>VASOPRESOR / INOTROPIK</div>
        <div className="t-callout" style={{ fontWeight: 600, color: 'var(--label-primary)' }}>{d.vasopressor}</div>
      </div>
      {/* Cross-shock comparison note */}
      {shk === 'cardio' && (
        <div style={{ background: 'rgba(255,59,48,0.06)', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 0 0 1px rgba(255,59,48,0.2)' }}>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: '#FF3B30' }}>Syok kardiogenik</span> memiliki mortalitas 40–50% jika tidak ditangani.<Cite n={3} href="https://doi.org/10.1161/JAHA.119.011991"/> Identifikasi penyebab (MI akut vs HF dekompensata vs mekanik) menentukan strategi: revaskularisasi untuk MI, MCS (mechanical circulatory support) untuk refrakter.
          </div>
        </div>
      )}
      {shk === 'distrib' && (
        <div style={{ background: 'rgba(255,149,0,0.06)', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 0 0 1px rgba(255,149,0,0.2)' }}>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: '#FF9500' }}>Sepsis</span> (Sepsis-3, 2016): disfungsi organ yang mengancam jiwa akibat respons host yang disregulasi terhadap infeksi. <em>Septic shock</em> = sepsis + vasopressor untuk MAP ≥65 + laktat &gt;2 mmol/L. Bundle Sepsis-1 jam: kultur, lakteat, antibiotik, 30 mL/kg kristaloid.<Cite n={5} href="https://doi.org/10.1007/s00134-021-06506-y"/>
          </div>
        </div>
      )}
      <RefBlock items={SHOCK_REFS}/>
    </div>
  );
}

/* ============================================================
   Theory Screen — shared mobile + desktop layout
   ============================================================ */
const THEORY_TABS = [
  { key:'cycle',      label:'Siklus Jantung' },
  { key:'ap',         label:'Aksi Potensial' },
  { key:'hemo',       label:'Hemodinamik' },
  { key:'arrhythmia', label:'Mekanisme Aritmia' },
  { key:'pharm',      label:'Farmakologi' },
  { key:'acs',        label:'Patofisiologi ACS' },
  { key:'shock',      label:'Jenis Syok' },
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
        <div style={{ display:'flex', gap:6, overflowX:'auto', flexShrink:0, paddingBottom:4, WebkitOverflowScrolling:'touch' } as React.CSSProperties}>
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
        {tab==='cycle'      && <CardiacCycleTab/>}
        {tab==='ap'         && <ActionPotentialTab/>}
        {tab==='hemo'       && <HemodynamicsTab/>}
        {tab==='arrhythmia' && <ArrhythmiaMechanismTab/>}
        {tab==='pharm'      && <AntiarrhythmicPharmTab/>}
        {tab==='acs'        && <ACSPathophysTab/>}
        {tab==='shock'      && <ShockTypesTab/>}
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
          {tab==='cycle'      && <CardiacCycleTab/>}
          {tab==='ap'         && <ActionPotentialTab/>}
          {tab==='hemo'       && <HemodynamicsTab/>}
          {tab==='arrhythmia' && <ArrhythmiaMechanismTab/>}
          {tab==='pharm'      && <AntiarrhythmicPharmTab/>}
          {tab==='acs'        && <ACSPathophysTab/>}
          {tab==='shock'      && <ShockTypesTab/>}
        </div>
      </div>
    </div>
  );
}
