import React, { useState, useEffect, useRef } from 'react';
import { ACLS_RHYTHMS } from '../../data';
import { NavBar, Icons } from '../../components/base';
import { BottomSheet } from '../../components/acls';
import { haptic } from '../../utils/haptic';
import type { Nav } from '../../types';

/* ============================================================
   TheoryImage — slot gambar yang bisa diganti pengguna.
   Coba urutan ekstensi; jika semua gagal → tampil SVG fallback.
   Letakkan gambar di: public/theory/<name>.<ext>
   ============================================================ */
function TheoryImage({ name, alt, fallback }: {
  name: string; alt: string; fallback: React.ReactNode;
}) {
  const EXTS = ['.png', '.svg', '.jpg', '.webp'] as const;
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setIdx(0); setLoaded(false); }, [name]);
  if (idx >= EXTS.length) return <>{fallback}</>;
  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 10, overflow: 'hidden',
      minHeight: loaded ? 0 : 120 }}>
      {!loaded && <div className="theory-img-skeleton"/>}
      <img
        key={name + EXTS[idx]}
        src={`/theory/${name}${EXTS[idx]}`}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(false); setIdx(i => i + 1); }}
        style={{ width: '100%', height: 'auto', display: loaded ? 'block' : 'none',
          borderRadius: 10, maxHeight: 200, objectFit: 'contain' }}
      />
    </div>
  );
}

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
          <TheoryImage name="ap-ventricular" alt="Aksi Potensial Kardiomiosit Ventrikel" fallback={<VentricularAP/>}/>
        </div>
        <div style={{ background:'var(--bg-primary)', borderRadius:16, padding:'14px 12px',
          boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
          <TheoryImage name="ap-sa-node" alt="Aksi Potensial SA Node" fallback={<SANodeAP/>}/>
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
        <TheoryImage name="frank-starling" alt="Kurva Frank-Starling" fallback={
          <svg viewBox="0 0 280 100" width="100%" style={{ display:'block', marginBottom:10 }}>
            <line x1="30" y1="10" x2="30" y2="85" stroke="var(--label-tertiary)" strokeWidth="1"/>
            <line x1="30" y1="85" x2="270" y2="85" stroke="var(--label-tertiary)" strokeWidth="1"/>
            <text x="28" y="50" textAnchor="end" fontSize="8" fill="var(--label-tertiary)" transform="rotate(-90,28,50)">Stroke Volume</text>
            <text x="150" y="96" textAnchor="middle" fontSize="8" fill="var(--label-tertiary)">EDV / Preload</text>
            <path d="M30,82 C60,75 90,55 120,35 C145,20 175,16 240,15" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round"/>
            <path d="M30,82 C60,78 90,70 120,58 C145,50 175,46 240,44" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3"/>
            <text x="195" y="12" fontSize="8" fill="#34C759" fontWeight="600">Normal</text>
            <text x="195" y="42" fontSize="8" fill="#FF3B30" fontWeight="600">Gagal Jantung</text>
          </svg>
        }/>
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
          <TheoryImage name="arrhythmia-reentry" alt="Sirkuit Reentry AVNRT" fallback={<ReentrySVG/>}/>
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
          <TheoryImage name="arrhythmia-automaticity" alt="Automatisitas Abnormal" fallback={<AutomaticitySVG/>}/>
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
          <TheoryImage name="arrhythmia-triggered" alt="Triggered Activity EAD dan DAD" fallback={<TriggeredSVG/>}/>
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
      svgContent: <TheoryImage name="acs-1-endotel" alt="Disfungsi Endotel" fallback={
        <svg viewBox="0 0 200 80" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="30" width="180" height="28" rx="14" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="30" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <text x="100" y="49" textAnchor="middle" fontSize="9" fill="var(--label-secondary)">Lumen arteri koroner</text>
          <text x="100" y="25" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FF9500">Endotel Normal → Disfungsi</text>
          <text x="100" y="70" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">LDL oksidasi, hipertensi, merokok, DM → endotel rusak</text>
        </svg>
      }/>,
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Aterosklerosis dimulai dari disfungsi endotel akibat faktor risiko (hipertensi, LDL-C tinggi, merokok, DM).<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.122.049915"/> LDL teroksidasi masuk ke subendotel → memicu respons inflamasi. Monosit berdiferensiasi menjadi makrofag → menelan LDL teroksidasi → <em>foam cells</em>.
        </div>
      ),
    },
    {
      title: '2. Pembentukan Plak',
      color: '#FF9500',
      svgContent: <TheoryImage name="acs-2-plak" alt="Pembentukan Plak Aterosklerosis" fallback={
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <ellipse cx="100" cy="39" rx="38" ry="12" fill="#FF9500" opacity={0.75}/>
          <text x="100" y="43" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">Plak (lipid core)</text>
          <text x="100" y="54" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Lumen menyempit</text>
          <text x="100" y="75" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FF9500">Fibrous cap ← Stabilitas plak!</text>
        </svg>
      }/>,
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Akumulasi lipid, sel busa, dan sel T membentuk <em>lipid-rich necrotic core</em>.<Cite n={3} href="https://doi.org/10.1056/NEJMra1216063"/> <em>Fibrous cap</em> (jaringan ikat + sel otot polos) menutup core ini. <strong>Plak rentan</strong> (<em>vulnerable plaque</em>) memiliki fibrous cap tipis dan core lipid besar. Stenosis &gt;50% baru menimbulkan gejala angina stabil.
        </div>
      ),
    },
    {
      title: '3. Ruptur Plak',
      color: '#FF6B35',
      svgContent: <TheoryImage name="acs-3-ruptur" alt="Ruptur Plak" fallback={
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <ellipse cx="100" cy="38" rx="38" ry="12" fill="#FF9500" opacity={0.65}/>
          <path d="M80,32 L88,26 L96,33" fill="none" stroke="#FF3B30" strokeWidth="2.5"/>
          <text x="70" y="20" fontSize="8" fill="#FF3B30" fontWeight="700">Ruptur!</text>
          <text x="100" y="54" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Lipid core terekspos</text>
          <text x="100" y="75" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Trigger: shear stress, spasme, inflamasi</text>
        </svg>
      }/>,
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Fibrous cap yang tipis dapat ruptur karena shear stress atau spasme.<Cite n={4} href="https://doi.org/10.1136/hrt.50.2.127"/> Ruptur mengekspos <em>tissue factor</em> dan kolagen subendotel ke aliran darah. ~70% MI terjadi pada stenosis &lt;50% sebelum ruptur — yaitu plak <em>non-flow limiting</em> yang rentan.<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.122.049915"/>
        </div>
      ),
    },
    {
      title: '4. Trombosis Akut',
      color: '#FF3B30',
      svgContent: <TheoryImage name="acs-4-trombus" alt="Trombosis Koroner Akut" fallback={
        <svg viewBox="0 0 200 90" width="100%" style={{ display: 'block' }}>
          <rect x="10" y="32" width="180" height="30" rx="15" fill="none" stroke="#30B0C7" strokeWidth="1.5" opacity={0.7}/>
          <rect x="10" y="32" width="180" height="7" rx="7" fill="#30B0C7" opacity={0.35}/>
          <ellipse cx="100" cy="38" rx="38" ry="12" fill="#FF9500" opacity={0.5}/>
          <ellipse cx="95" cy="37" rx="22" ry="10" fill="#FF3B30" opacity={0.8}/>
          <text x="95" y="41" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">Trombus</text>
          <text x="100" y="58" textAnchor="middle" fontSize="7.5" fill="var(--label-secondary)">Oklusi koroner akut</text>
          <text x="100" y="75" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Platelet + fibrin → trombus merah</text>
        </svg>
      }/>,
      desc: (
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.65 }}>
          Ekposur kolagen → aktivasi platelet (adhesi, agregasi) → aktivasi kaskade koagulasi → trombus.<Cite n={3} href="https://doi.org/10.1056/NEJMra1216063"/> <strong>STEMI</strong>: oklusi total (<em>red thrombus</em> dominan fibrin). <strong>NSTEMI/UA</strong>: oklusi parsial atau embolisasi distal (<em>white thrombus</em> dominan platelet). Inilah basis perbedaan strategi antiplatelet dan antikoagulan.
        </div>
      ),
    },
    {
      title: '5. Iskemia & Infark',
      color: '#FF3B30',
      svgContent: <TheoryImage name="acs-5-iskemia" alt="Zona Iskemia Infark" fallback={
        <svg viewBox="0 0 200 95" width="100%" style={{ display: 'block' }}>
          <path d="M100,80 C70,60 30,40 30,20 C30,8 42,5 52,10 C62,15 72,25 100,50 C128,25 138,15 148,10 C158,5 170,8 170,20 C170,40 130,60 100,80Z"
            fill="none" stroke="var(--separator-opaque)" strokeWidth="1.5"/>
          <circle cx="80" cy="38" r="12" fill="#FF3B30" opacity={0.9}/>
          <circle cx="80" cy="38" r="18" fill="none" stroke="#FF9500" strokeWidth="2" opacity={0.7}/>
          <circle cx="80" cy="38" r="24" fill="none" stroke="#FFCC00" strokeWidth="1.5" opacity={0.5}/>
          <text x="80" y="42" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff">Nekrosis</text>
          <text x="108" y="28" fontSize="7" fill="#FF9500" fontWeight="600">Injury</text>
          <text x="115" y="18" fontSize="7" fill="#FFCC00" fontWeight="600">Iskemia</text>
          <text x="100" y="88" textAnchor="middle" fontSize="7.5" fill="var(--label-tertiary)">Nekrosis → Injury → Iskemia (EKG)</text>
        </svg>
      }/>,
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
    co:'↓', svr:'↑', pcwp:'↔',
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
   EC Coupling Tab
   ============================================================ */
const EC_REFS = [
  { n:1, text:'Bers DM. Cardiac excitation-contraction coupling. Nature. 2002;415:198–205.', url:'https://doi.org/10.1038/415198a' },
  { n:2, text:'Katz AM. Physiology of the Heart. 5th ed. 2010. Ch. 7–8.' },
  { n:3, text:'Bhatt DL, et al. Braunwald\'s Heart Disease. 12th ed. 2022. Ch. 19.' },
];

const EC_STEPS = [
  {
    title: 'Depolarisasi & Masuknya Ca²⁺',
    color: '#007AFF',
    content: 'Aksi potensial menyebar dari sel ke sel via gap junction. Depolarisasi membran aktivasi kanal L-type Ca²⁺ (DHPR) di membran T-tubulus. Masuknya sejumlah kecil Ca²⁺ ekstraseluler (trigger Ca²⁺) — cukup untuk mengaktifkan mekanisme amplifikasi.',
    clinical: 'Verapamil/diltiazem memblok L-type Ca²⁺ → kronotropik negatif, inotropik negatif.',
    svgContent: (
      <svg viewBox="0 0 260 120" style={{ width:'100%', maxHeight:120 }}>
        <rect x="0" y="0" width="260" height="120" fill="none"/>
        {/* T-tubule */}
        <rect x="110" y="10" width="16" height="80" rx="4" fill="#007AFF22" stroke="#007AFF" strokeWidth="1.5"/>
        <text x="118" y="7" textAnchor="middle" fontSize="9" fill="#007AFF" fontWeight="700">T-tubulus</text>
        {/* DHPR channel */}
        <rect x="113" y="30" width="10" height="20" rx="3" fill="#007AFF" opacity="0.9"/>
        <text x="118" y="24" textAnchor="middle" fontSize="8" fill="#007AFF">DHPR</text>
        {/* Ca arrow in */}
        <path d="M60,42 L110,42" stroke="#FF9500" strokeWidth="2" markerEnd="url(#arr)" fill="none"/>
        <text x="82" y="38" textAnchor="middle" fontSize="9" fill="#FF9500">Ca²⁺ in</text>
        <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#FF9500"/></marker></defs>
        {/* SR */}
        <ellipse cx="180" cy="55" rx="55" ry="35" fill="#34C75918" stroke="#34C759" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="180" y="50" textAnchor="middle" fontSize="9" fill="#34C759" fontWeight="700">SR</text>
        <text x="180" y="63" textAnchor="middle" fontSize="8" fill="#34C759">Ca²⁺ store</text>
        {/* Trigger arrow to RyR */}
        <path d="M125,45 L148,50" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
        <text x="136" y="43" textAnchor="middle" fontSize="8" fill="#FF9500">trigger</text>
      </svg>
    ),
  },
  {
    title: 'CICR — Ca²⁺-Induced Ca²⁺ Release',
    color: '#FF9500',
    content: 'Trigger Ca²⁺ mengaktifkan reseptor ryanodine (RyR2) di membran SR. RyR2 terbuka → Ca²⁺ di dalam SR terlepas dalam jumlah besar (CICR = Ca²⁺-Induced Ca²⁺ Release). Konsentrasi Ca²⁺ sitosolik naik dari ~100 nM → ~1 µM (10× lipat) dalam milidetik.',
    clinical: 'Digoksin: inhibisi Na⁺/K⁺-ATPase → Na⁺ intraseluler↑ → NCX terbalik → Ca²⁺ intraseluler↑ → inotropik positif. Overdosis: Ca²⁺ overload → aritmia (DAD → VT).',
    svgContent: (
      <svg viewBox="0 0 260 120" style={{ width:'100%', maxHeight:120 }}>
        <ellipse cx="140" cy="55" rx="70" ry="38" fill="#FF950015" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="140" y="35" textAnchor="middle" fontSize="9" fill="#FF9500" fontWeight="700">SR</text>
        {/* RyR channel */}
        <rect x="108" y="64" width="12" height="14" rx="3" fill="#FF9500" opacity="0.85"/>
        <text x="114" y="61" textAnchor="middle" fontSize="8" fill="#FF9500">RyR2</text>
        {/* Ca sparks out */}
        {[0,1,2,3,4].map(i => (
          <circle key={i} cx={95 + i*18} cy={92 + (i%2)*10} r="4" fill="#FF9500" opacity="0.6 "/>
        ))}
        <text x="140" y="118" textAnchor="middle" fontSize="9" fill="#FF9500">Ca²⁺ sparks → cytosol↑</text>
        {/* Troponin */}
        <rect x="192" y="44" width="52" height="24" rx="8" fill="#34C75918" stroke="#34C759" strokeWidth="1"/>
        <text x="218" y="54" textAnchor="middle" fontSize="8" fill="#34C759" fontWeight="700">Troponin C</text>
        <text x="218" y="64" textAnchor="middle" fontSize="7" fill="#34C759">↑ Ca²⁺ binding</text>
        <path d="M163,80 L192,56" stroke="#FF9500" strokeWidth="1.5" fill="none" markerEnd="url(#arr2)"/>
        <defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#FF9500"/></marker></defs>
      </svg>
    ),
  },
  {
    title: 'Kontraksi — Aktomiosin Cross-Bridge',
    color: '#FF3B30',
    content: 'Ca²⁺ berikatan dengan troponin C → perubahan konformasi troponin I → tropomiosin bergeser → situs aktif aktin terbuka. Kepala miosin berikatan dengan aktin → power stroke (menggunakan ATP) → sarkomer memendek. Siklus cross-bridge berulang selama Ca²⁺ tersedia.',
    clinical: 'Dobutamin (β1): ↑ cAMP → PKA aktivasi → fosforilasi kanal Ca²⁺ & troponin I → kontraksi lebih kuat dan relaksasi lebih cepat (lusitropi positif).',
    svgContent: (
      <svg viewBox="0 0 260 120" style={{ width:'100%', maxHeight:120 }}>
        {/* Actin filaments */}
        <line x1="20" y1="40" x2="240" y2="40" stroke="#007AFF" strokeWidth="5" strokeLinecap="round"/>
        <line x1="20" y1="80" x2="240" y2="80" stroke="#007AFF" strokeWidth="5" strokeLinecap="round"/>
        <text x="14" y="38" textAnchor="end" fontSize="9" fill="#007AFF">Aktin</text>
        {/* Myosin */}
        <line x1="40" y1="55" x2="220" y2="55" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round"/>
        <line x1="40" y1="65" x2="220" y2="65" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round"/>
        <text x="246" y="63" textAnchor="start" fontSize="9" fill="#FF3B30">Miosin</text>
        {/* Cross bridges */}
        {[70,110,150,190].map(x => (
          <g key={x}>
            <line x1={x} y1="55" x2={x-10} y2="43" stroke="#FF3B30" strokeWidth="2"/>
            <circle cx={x-10} cy="43" r="4" fill="#FF3B30"/>
            <line x1={x} y1="65" x2={x+10} y2="78" stroke="#FF3B30" strokeWidth="2"/>
            <circle cx={x+10} cy="78" r="4" fill="#FF3B30"/>
          </g>
        ))}
        {/* Arrows showing shortening */}
        <path d="M30,100 L80,100" stroke="#FF3B30" strokeWidth="2" markerEnd="url(#arrR)"/>
        <path d="M230,100 L180,100" stroke="#FF3B30" strokeWidth="2" markerEnd="url(#arrL)"/>
        <text x="130" y="113" textAnchor="middle" fontSize="9" fill="#FF3B30">Sarkomer memendek</text>
        <defs>
          <marker id="arrR" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#FF3B30"/></marker>
          <marker id="arrL" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M5,0 L0,2.5 L5,5 Z" fill="#FF3B30"/></marker>
        </defs>
      </svg>
    ),
  },
  {
    title: 'Relaksasi — SERCA & NCX',
    color: '#34C759',
    content: 'Repolarisasi → Ca²⁺ tidak lagi masuk. SERCA2a (SR Ca²⁺-ATPase) memompa Ca²⁺ kembali ke SR — dikontrol oleh phospholamban (PLB). NCX (Na⁺/Ca²⁺ exchanger) mengekstrusi Ca²⁺ ke ekstraseluler. Ca²⁺ sitosolik turun → troponin C melepas Ca²⁺ → kontraksi berhenti → relaksasi aktif (lusitropi).',
    clinical: 'Phospholamban yang terfosforilasi (via PKA → β1 stimulasi) → SERCA2a lebih aktif → relaksasi lebih cepat → pengisian diastolik lebih baik. Disfungsi SERCA2a berkontribusi pada gagal jantung.',
    svgContent: (
      <svg viewBox="0 0 260 120" style={{ width:'100%', maxHeight:120 }}>
        {/* SR */}
        <ellipse cx="80" cy="55" rx="60" ry="38" fill="#34C75912" stroke="#34C759" strokeWidth="1.5" strokeDasharray="4,3"/>
        <text x="80" y="52" textAnchor="middle" fontSize="9" fill="#34C759" fontWeight="700">SR</text>
        {/* SERCA pump */}
        <rect x="48" y="82" width="12" height="16" rx="3" fill="#34C759"/>
        <text x="54" y="78" textAnchor="middle" fontSize="7.5" fill="#34C759" fontWeight="700">SERCA2a</text>
        {/* PLB */}
        <rect x="65" y="84" width="28" height="12" rx="4" fill="#34C75930" stroke="#34C759" strokeWidth="0.8"/>
        <text x="79" y="92" textAnchor="middle" fontSize="7" fill="#34C759">PLB (−inh)</text>
        {/* Ca arrow into SR */}
        <path d="M54,82 L62,64" stroke="#34C759" strokeWidth="1.5" fill="none" markerEnd="url(#arrG)"/>
        <text x="48" y="73" textAnchor="middle" fontSize="8" fill="#34C759">Ca²⁺↑</text>
        {/* NCX */}
        <rect x="170" y="38" width="14" height="32" rx="4" fill="#007AFF" opacity="0.8"/>
        <text x="177" y="35" textAnchor="middle" fontSize="8" fill="#007AFF" fontWeight="700">NCX</text>
        <path d="M163,60 L170,55" stroke="#007AFF" strokeWidth="1.5" fill="none"/>
        <path d="M184,55 L220,55" stroke="#007AFF" strokeWidth="1.5" fill="none" markerEnd="url(#arrB)"/>
        <text x="220" y="50" textAnchor="start" fontSize="8" fill="#007AFF">Ca²⁺ out</text>
        {/* cytosol Ca drops */}
        <text x="130" y="100" textAnchor="middle" fontSize="9" fill="var(--label-secondary)">[Ca²⁺]i ↓ → relaksasi</text>
        <defs>
          <marker id="arrG" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#34C759"/></marker>
          <marker id="arrB" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#007AFF"/></marker>
        </defs>
      </svg>
    ),
  },
];

function ECCouplingTab() {
  const [step, setStep] = useState(0);
  const s = EC_STEPS[step];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Eksitasi-kontraksi (E-C) coupling adalah proses yang mengubah sinyal listrik (aksi potensial) menjadi kontraksi mekanik miosit jantung melalui kalsium sebagai messenger kedua.<Cite n={1} href="https://doi.org/10.1038/415198a"/>
      </div>
      {/* Step selector */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
        {EC_STEPS.map((st, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding:'8px 4px', borderRadius:12, border:'none', cursor:'pointer', textAlign:'center',
            background: step===i ? st.color+'18' : 'var(--bg-primary)',
            boxShadow: step===i ? `0 0 0 1.5px ${st.color}` : '0 0 0 0.5px var(--separator-opaque)',
            transition:'all 150ms ease',
          }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background: step===i ? st.color : 'var(--fill-tertiary)',
              color:'#fff', fontSize:'0.7rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 4px' }}>{i+1}</div>
            <div className="t-caption-2" style={{ fontWeight: step===i ? 700 : 400, color: step===i ? st.color : 'var(--label-secondary)', lineHeight:1.3 }}>
              {st.title.split('—')[0].trim().split(' ').slice(0,2).join(' ')}
            </div>
          </button>
        ))}
      </div>
      {/* Step detail */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'16px',
        boxShadow:`0 0 0 1.5px ${s.color}40` }}>
        <div className="t-callout" style={{ fontWeight:700, color:s.color, marginBottom:8 }}>
          Langkah {step+1}: {s.title}
        </div>
        <div style={{ marginBottom:12, borderRadius:10, overflow:'hidden', background:'var(--fill-quaternary)', padding:'8px' }}>
          <TheoryImage name={step < 2 ? 'ec-coupling' : 'ec-relaxation'}
            alt={s.title}
            fallback={s.svgContent}/>
        </div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.65, marginBottom:10 }}>
          {s.content}
        </div>
        <div style={{ background:s.color+'12', borderRadius:10, padding:'10px 12px',
          boxShadow:`0 0 0 1px ${s.color}30` }}>
          <div className="t-caption-2" style={{ color:s.color, fontWeight:700, marginBottom:3 }}>KLINIS</div>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>{s.clinical}</div>
        </div>
      </div>
      {/* Navigation */}
      <div style={{ display:'flex', gap:10 }}>
        <button disabled={step===0} onClick={() => setStep(s => s-1)} style={{
          flex:1, padding:'11px', borderRadius:12, border:'none', cursor:step===0?'default':'pointer',
          background: step===0 ? 'var(--fill-quaternary)' : 'var(--fill-tertiary)',
          color: step===0 ? 'var(--label-quaternary)' : 'var(--label-primary)',
          fontWeight:600, fontSize:'0.875rem',
        }}>← Sebelumnya</button>
        <button disabled={step===EC_STEPS.length-1} onClick={() => setStep(s => s+1)} style={{
          flex:1, padding:'11px', borderRadius:12, border:'none', cursor:step===EC_STEPS.length-1?'default':'pointer',
          background: step===EC_STEPS.length-1 ? 'var(--fill-quaternary)' : s.color,
          color: step===EC_STEPS.length-1 ? 'var(--label-quaternary)' : '#fff',
          fontWeight:600, fontSize:'0.875rem',
        }}>Selanjutnya →</button>
      </div>
      {/* Frank-Starling link note */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px 14px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:6 }}>FRANK-STARLING & E-C COUPLING</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.6 }}>
          Peregangan sarkomer (EDV↑) meningkatkan sensitivitas troponin C terhadap Ca²⁺ dan jumlah cross-bridge yang terbentuk — inilah dasar molekuler hukum Frank-Starling.<Cite n={2}/> Pada gagal jantung, disfungsi SERCA2a menyebabkan Ca²⁺ overload SR dan kontraksi melemah.<Cite n={3}/>
        </div>
      </div>
      <RefBlock items={EC_REFS}/>
    </div>
  );
}

/* ============================================================
   ANS Tab
   ============================================================ */
const ANS_REFS = [
  { n:1, text:'Dampney RA. Functional organization of central pathways regulating the cardiovascular system. Physiol Rev. 1994;74(2):323–364.', url:'https://doi.org/10.1152/physrev.1994.74.2.323' },
  { n:2, text:'Karemaker JM. An introduction into autonomic nervous function. Physiol Meas. 2017;38:R89–R118.', url:'https://doi.org/10.1088/1361-6579/aa6782' },
  { n:3, text:'Goldberger AL, et al. Clinical Electrocardiography. 9th ed. 2017.' },
];

type ANSMode = 'sns' | 'pns';

const ANS_EFFECTS: Record<string, { sns: string; snsColor: string; pns: string; pnsColor: string; label: string }> = {
  hr:        { label:'Laju Jantung (HR)',      sns:'↑ (takikardia)',        snsColor:'#FF3B30', pns:'↓ (bradikardia)',       pnsColor:'#34C759' },
  av:        { label:'Konduksi AV',            sns:'↑ dromotropy',          snsColor:'#FF3B30', pns:'↓ (AV delay↑)',         pnsColor:'#34C759' },
  inotropy:  { label:'Kontraktilitas',         sns:'↑ (inotropi +)',        snsColor:'#FF3B30', pns:'↓ (atrium saja)',       pnsColor:'#007AFF' },
  lusitropy: { label:'Relaksasi Diastolik',    sns:'↑ (lusitropi +)',       snsColor:'#FF3B30', pns:'Minimal efek',          pnsColor:'var(--label-tertiary)' },
  vessels:   { label:'Pembuluh Darah',         sns:'Vasokonstriksi (α1)',   snsColor:'#FF9500', pns:'Vasodilatasi (lokal)',  pnsColor:'#34C759' },
  nt:        { label:'Neurotransmiter',        sns:'Norepinefrin (NE)',      snsColor:'#FF3B30', pns:'Asetilkolin (ACh)',     pnsColor:'#34C759' },
};

function ANSTab() {
  const [mode, setMode] = useState<ANSMode>('sns');
  const isSns = mode === 'sns';
  const color = isSns ? '#FF3B30' : '#34C759';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Sistem saraf otonom (ANS) memodulasi fungsi kardiovaskular melalui dua divisi antagonis: simpatis (SNS) dan parasimpatis (PNS/vagal). Keseimbangan keduanya menentukan laju jantung, konduksi AV, kontraktilitas, dan tonus vaskular.<Cite n={2} href="https://doi.org/10.1088/1361-6579/aa6782"/>
      </div>
      {/* Toggle SNS / PNS */}
      <div style={{ display:'flex', background:'var(--fill-tertiary)', borderRadius:14, padding:4, gap:4 }}>
        {(['sns','pns'] as ANSMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:'10px', borderRadius:11, border:'none', cursor:'pointer',
            background: mode===m ? (m==='sns' ? '#FF3B30' : '#34C759') : 'transparent',
            color: mode===m ? '#fff' : 'var(--label-secondary)',
            fontWeight: mode===m ? 700 : 400, fontSize:'0.9rem', transition:'all 150ms ease',
          }}>
            {m==='sns' ? '⚡ Simpatis (SNS)' : '🧘 Parasimpatis (PNS)'}
          </button>
        ))}
      </div>
      {/* Diagram */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px', boxShadow:`0 0 0 1.5px ${color}40` }}>
        <TheoryImage name={isSns ? 'ans-overview' : 'ans-baroreceptor'}
          alt={isSns ? 'SNS cardiac innervation' : 'Baroreceptor reflex arc'}
          fallback={
            <svg viewBox="0 0 280 130" style={{ width:'100%', maxHeight:130 }}>
              {/* Brain/medulla */}
              <ellipse cx="140" cy="22" rx="40" ry="18" fill={color+'18'} stroke={color} strokeWidth="1.5"/>
              <text x="140" y="19" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{isSns ? 'Medulla / RVLM' : 'NTS / DMN'}</text>
              <text x="140" y="30" textAnchor="middle" fontSize="8" fill={color}>{isSns ? '(rostral VLM)' : '(dorsal vagal nucleus)'}</text>
              {/* Nerve down to heart */}
              <line x1="140" y1="40" x2="140" y2="65" stroke={color} strokeWidth="2" strokeDasharray="4,3"/>
              {/* Ganglion */}
              <circle cx="140" cy="70" r="10" fill={color+'30'} stroke={color} strokeWidth="1.5"/>
              <text x="140" y="74" textAnchor="middle" fontSize="8" fill={color}>{isSns ? 'Gang.' : 'n.X'}</text>
              {/* Heart */}
              <path d="M100,100 C95,88 80,83 80,95 C80,108 100,118 140,130 C180,118 200,108 200,95 C200,83 185,88 180,100 C172,88 158,83 140,90 C122,83 108,88 100,100 Z"
                fill={color+'20'} stroke={color} strokeWidth="1.5"/>
              <text x="140" y="112" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">Jantung</text>
              {/* Arrows */}
              <path d="M140,80 L140,88" stroke={color} strokeWidth="1.5" fill="none" markerEnd="url(#arrANS)"/>
              <defs><marker id="arrANS" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill={color}/></marker></defs>
              {/* Labels */}
              {isSns ? (
                <>
                  <text x="30" y="80" textAnchor="middle" fontSize="8" fill="#FF9500">α1: vasokonstriksi</text>
                  <text x="30" y="91" textAnchor="middle" fontSize="8" fill="#FF3B30">β1: HR↑ / inotropy↑</text>
                </>
              ) : (
                <>
                  <text x="242" y="80" textAnchor="middle" fontSize="8" fill="#34C759">M2: HR↓</text>
                  <text x="242" y="91" textAnchor="middle" fontSize="8" fill="#34C759">AV delay↑</text>
                </>
              )}
            </svg>
          }
        />
      </div>
      {/* Effects table */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, overflow:'hidden',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div style={{ padding:'10px 14px', background:color+'12', borderBottom:`1px solid ${color}30` }}>
          <div className="t-caption-2" style={{ color, fontWeight:700 }}>
            {isSns ? 'EFEK SIMPATIS (SNS) — Norepinefrin/Epinefrin' : 'EFEK PARASIMPATIS (PNS) — Asetilkolin'}
          </div>
        </div>
        {Object.values(ANS_EFFECTS).map((row, i) => (
          <div key={i} style={{ display:'flex', padding:'9px 14px', alignItems:'center',
            borderBottom: i < Object.keys(ANS_EFFECTS).length-1 ? '0.5px solid var(--separator-opaque)' : 'none',
            background: i%2===0 ? 'transparent' : 'var(--fill-quaternary)' }}>
            <div className="t-caption-1" style={{ flex:1, fontWeight:600, color:'var(--label-primary)' }}>{row.label}</div>
            <div className="t-caption-1" style={{ fontWeight:700,
              color: isSns ? row.snsColor : row.pnsColor }}>
              {isSns ? row.sns : row.pns}
            </div>
          </div>
        ))}
      </div>
      {/* Vagal maneuver explanation */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>MANUVER VAGAL & AVNRT</div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.65 }}>
          Valsalva (mengejan), pijat karotis, dan cold water immersion meningkatkan tonus vagal (PNS) secara akut.<Cite n={3}/> Efek: konduksi AV node melambat → memutus sirkuit reentry di AVNRT. Inilah mengapa manuver vagal dapat menghentikan SVT tanpa obat.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10 }}>
          {[
            { name:'Valsalva', detail:'Tekanan intrathoraks↑ → baroreceptor stretch → vagal↑' },
            { name:'Pijat Karotis', detail:'Karotid sinus stretch → NTS → vagal↑ → AV node blok' },
            { name:'Adenosin', detail:'A1 receptor AV node → hiperpolarisasi → konduksi blok sementara' },
          ].map(m => (
            <div key={m.name} style={{ background:'var(--fill-quaternary)', borderRadius:10, padding:'10px 10px' }}>
              <div className="t-caption-2" style={{ fontWeight:700, color:'#34C759', marginBottom:4 }}>{m.name}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)', lineHeight:1.4 }}>{m.detail}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Baroreflex arc */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>BARORECEPTOR REFLEX</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[
            { step:'①', text:'Tekanan darah naik → dinding aorta/arteri karotis meregang', color:'#007AFF' },
            { step:'②', text:'Baroreseptor (n.IX & n.X) → sinyal ke NTS di medulla oblongata', color:'#007AFF' },
            { step:'③', text:'NTS → aktivasi nukleus vagal → PNS↑, inhibisi RVLM → SNS↓', color:'#34C759' },
            { step:'④', text:'Hasil: HR↓, AV konduksi↓, vasodilatasi → TD turun kembali', color:'#34C759' },
          ].map(r => (
            <div key={r.step} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:r.color+'20', border:`1.5px solid ${r.color}`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.8rem', fontWeight:700, color:r.color }}>
                {r.step}
              </div>
              <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5, paddingTop:2 }}>{r.text}</div>
            </div>
          ))}
        </div>
        <div className="t-caption-1" style={{ color:'var(--label-tertiary)', marginTop:10, lineHeight:1.5 }}>
          Atropin memblok reseptor M2 muskarinik → menghilangkan tonus vagal → HR↑. Mekanisme ini digunakan pada bradikardia simptomatik.<Cite n={1} href="https://doi.org/10.1152/physrev.1994.74.2.323"/>
        </div>
      </div>
      <RefBlock items={ANS_REFS}/>
    </div>
  );
}

/* ============================================================
   Vasopressor Pharmacology Tab
   ============================================================ */
const VASO_REFS = [
  { n:1, text:'Hollenberg SM. Vasoactive drugs in circulatory shock. Am J Respir Crit Care Med. 2011;183(7):847–855.', url:'https://doi.org/10.1164/rccm.201006-0972CI' },
  { n:2, text:'De Backer D, et al. Dopamine versus norepinephrine in septic shock. NEJM. 2010;362:779–789.', url:'https://doi.org/10.1056/NEJMoa0907118' },
  { n:3, text:'AHA ACLS Guidelines 2020. Circulation. 2020;142(16 suppl 2).', url:'https://doi.org/10.1161/CIR.0000000000000916' },
];

type VasoKey = 'epi' | 'ne' | 'dopa' | 'dobu' | 'vaso' | 'phe';

interface VasoDrug {
  name: string; fullName: string; color: string;
  alpha1: number; beta1: number; beta2: number; da: number; v1: number;
  indication: string; dose: string; notes: string[];
  warning?: string;
}

const VASO_MAP: Record<VasoKey, VasoDrug> = {
  epi:  { name:'Epinefrin', fullName:'Epinephrine', color:'#FF3B30',
    alpha1:3, beta1:3, beta2:2, da:0, v1:0,
    indication:'Henti jantung (VF/pVT/PEA/Asistol), anafilaksis berat, syok refrakter',
    dose:'Henti jantung: 1 mg IV tiap 3–5 mnt\nAnafilaksis: 0.3–0.5 mg IM\nSyok: 0.01–0.5 mcg/kg/mnt infus',
    notes:['Dosis rendah: β dominan (HR↑, vasodilasi)',
           'Dosis tinggi: α dominan (vasokonstriksi kuat)',
           'Lini pertama anafilaksis (IM, paha lateral)'],
    warning:'Dapat menyebabkan aritmia ventrikel dan iskemia miokard pada dosis tinggi' },
  ne:   { name:'Norepinefrin', fullName:'Norepinephrine', color:'#FF6B35',
    alpha1:3, beta1:2, beta2:0, da:0, v1:0,
    indication:'Syok septik dan distributif lainnya (vasopresor lini pertama)',
    dose:'0.01–3 mcg/kg/mnt infus IV (titrasi ke MAP ≥65 mmHg)',
    notes:['Vasokonstriksi kuat (α1) + inotropi ringan (β1)',
           'Tidak ada efek β2 → tidak menyebabkan vasodilatasi perifer',
           'Lini pertama syok septik (kelas I, SSC 2021)'],
    warning:'Hindari sebagai vasopresor tunggal pada syok kardiogenik dengan CO sangat rendah' },
  dopa: { name:'Dopamin', fullName:'Dopamine', color:'#FF9500',
    alpha1:2, beta1:3, beta2:1, da:3, v1:0,
    indication:'Syok kardiogenik dengan bradikardia; backup vasopresor jika NE tidak tersedia',
    dose:'Low (renal): 1–5 mcg/kg/mnt\nCardiac: 5–10 mcg/kg/mnt\nVasopressor: >10 mcg/kg/mnt',
    notes:['DA1 dosis rendah: vasodilatasi renal/splanknik (manfaat klinis tidak terbukti)',
           'β1 dosis menengah: CO↑',
           'α1 dosis tinggi: vasokonstriksi'],
    warning:'Lebih banyak aritmia vs norepinefrin (De Backer NEJM 2010) — bukan lini pertama sepsis' },
  dobu: { name:'Dobutamin', fullName:'Dobutamine', color:'#34C759',
    alpha1:1, beta1:3, beta2:2, da:0, v1:0,
    indication:'Syok kardiogenik dengan CO rendah; dekompensasi HF akut',
    dose:'2.5–20 mcg/kg/mnt infus IV (titrasi ke CO/SvO₂)',
    notes:['Inotropik positif murni (β1+++)',
           'Vasodilatasi perifer ringan (β2) → afterload↓',
           'Tidak meningkatkan MAP secara langsung — kombinasi dengan NE jika hipotensi'],
    warning:'Dapat menyebabkan takikardia dan aritmia; hindari pada kardiomiopati obstruktif' },
  vaso: { name:'Vasopressin', fullName:'Vasopressin (ADH)', color:'#5856D6',
    alpha1:0, beta1:0, beta2:0, da:0, v1:3,
    indication:'Syok septik refrakter sebagai tambahan NE; syok kardiogenik refrakter',
    dose:'0.03–0.04 unit/mnt infus IV (fixed dose — tidak dititrasi)',
    notes:['Non-adrenergik — bekerja melalui reseptor V1 VSMC',
           'Vasokonstriksi kuat tanpa efek jantung langsung',
           'Efektif pada vasodilatory shock refrakter terhadap katekolamin'],
    warning:'Dapat menyebabkan iskemia splanknik, digital, dan koroner pada dosis tinggi' },
  phe:  { name:'Fenilefrin', fullName:'Phenylephrine', color:'#007AFF',
    alpha1:3, beta1:0, beta2:0, da:0, v1:0,
    indication:'Syok vasodilatasi tanpa disfungsi jantung; hipotensi ringan perioperatif',
    dose:'50–200 mcg bolus IV atau 0.5–6 mcg/kg/mnt infus',
    notes:['Pure α1 agonist — vasokonstriksi tanpa efek jantung langsung',
           'Dapat meningkatkan afterload LV → hindari pada CO rendah',
           'Berguna jika takikardia merupakan masalah (tidak menyebabkan HR↑)'],
    warning:'Refleks bradikardia mungkin terjadi (baroreceptor merespons peningkatan TD)' },
};

function ReceptorBar({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
        <span className="t-caption-2" style={{ fontWeight:700 }}>{label}</span>
        <span className="t-caption-2" style={{ color:'var(--label-tertiary)' }}>{'●'.repeat(value)}{'○'.repeat(3-value)}</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:'var(--fill-tertiary)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(value/3)*100}%`, background:color, borderRadius:3, transition:'width 300ms ease' }}/>
      </div>
    </div>
  );
}

function VasopressorPharmTab() {
  const [drug, setDrug] = useState<VasoKey>('epi');
  const d = VASO_MAP[drug];
  const DRUGS: Array<{ key:VasoKey; name:string; color:string }> = [
    { key:'epi',  name:'Epinefrin',    color:'#FF3B30' },
    { key:'ne',   name:'Norepinefrin', color:'#FF6B35' },
    { key:'dopa', name:'Dopamin',      color:'#FF9500' },
    { key:'dobu', name:'Dobutamin',    color:'#34C759' },
    { key:'vaso', name:'Vasopressin',  color:'#5856D6' },
    { key:'phe',  name:'Fenilefrin',   color:'#007AFF' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Vasopresor dan inotropik bekerja pada reseptor adrenergik (α1, β1, β2), dopaminergik (DA1), dan vasopressin (V1). Pemahaman profil reseptor tiap obat memandu pemilihan yang tepat berdasarkan jenis syok.<Cite n={1} href="https://doi.org/10.1164/rccm.201006-0972CI"/>
      </div>
      {/* Receptor subtype legend */}
      <div style={{ background:'var(--bg-primary)', borderRadius:12, padding:'10px 14px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:6 }}>SUBTIPE RESEPTOR</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {[
            { r:'α1', loc:'Arteriol → vasokonstriksi', c:'#FF3B30' },
            { r:'β1', loc:'Jantung → HR↑, inotropy↑', c:'#FF9500' },
            { r:'β2', loc:'Bronkus/arteriol → bronkodilasi/vasodilatasi', c:'#34C759' },
            { r:'DA1', loc:'Renal/splanknik → vasodilatasi', c:'#007AFF' },
            { r:'V1', loc:'VSMC → vasokonstriksi (non-adrenergik)', c:'#5856D6' },
          ].map(r => (
            <div key={r.r} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <div style={{ width:26, height:18, borderRadius:5, background:r.c+'20', border:`1px solid ${r.c}`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'0.65rem', fontWeight:800, color:r.c }}>{r.r}</span>
              </div>
              <span className="t-caption-2" style={{ color:'var(--label-secondary)', lineHeight:1.3 }}>{r.loc}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Drug grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
        {DRUGS.map(dr => (
          <button key={dr.key} onClick={() => setDrug(dr.key)} style={{
            padding:'10px 6px', borderRadius:12, border:'none', cursor:'pointer', textAlign:'center',
            background: drug===dr.key ? dr.color+'18' : 'var(--bg-primary)',
            boxShadow: drug===dr.key ? `0 0 0 1.5px ${dr.color}` : '0 0 0 0.5px var(--separator-opaque)',
            transition:'all 150ms ease',
          }}>
            <div className="t-caption-1" style={{ fontWeight:700, color: drug===dr.key ? dr.color : 'var(--label-primary)' }}>
              {dr.name}
            </div>
          </button>
        ))}
      </div>
      {/* Diagram */}
      <TheoryImage name="vasopressor-receptors" alt="Receptor subtype diagram"
        fallback={
          <div style={{ background:'var(--bg-primary)', borderRadius:12, padding:'10px',
            boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
            <TheoryImage name="vasopressor-profiles" alt="Drug comparison" fallback={<></>}/>
          </div>
        }
      />
      {/* Drug detail card */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:`0 0 0 1.5px ${d.color}40` }}>
        <div className="t-callout" style={{ fontWeight:700, color:d.color, marginBottom:10 }}>
          {d.name} <span style={{ fontSize:'0.8rem', fontWeight:400, color:'var(--label-secondary)' }}>({d.fullName})</span>
        </div>
        {/* Receptor bars */}
        <div style={{ marginBottom:12 }}>
          <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>PROFIL RESEPTOR</div>
          <ReceptorBar label="α1" value={d.alpha1} color="#FF3B30"/>
          <ReceptorBar label="β1" value={d.beta1} color="#FF9500"/>
          <ReceptorBar label="β2" value={d.beta2} color="#34C759"/>
          <ReceptorBar label="DA1" value={d.da} color="#007AFF"/>
          <ReceptorBar label="V1" value={d.v1} color="#5856D6"/>
        </div>
        {/* Indication */}
        <div style={{ marginBottom:10 }}>
          <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:4 }}>INDIKASI</div>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>{d.indication}</div>
        </div>
        {/* Dose */}
        <div style={{ background:'var(--fill-quaternary)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
          <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:4 }}>DOSIS</div>
          <div className="t-caption-1" style={{ color:'var(--label-primary)', fontFamily:'monospace', lineHeight:1.7, whiteSpace:'pre-line' }}>{d.dose}</div>
        </div>
        {/* Notes */}
        <div style={{ marginBottom: d.warning ? 10 : 0 }}>
          <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:6 }}>CATATAN KLINIS</div>
          {d.notes.map((n, i) => (
            <div key={i} style={{ display:'flex', gap:7, marginBottom:4 }}>
              <div style={{ width:5, height:5, borderRadius:2.5, background:d.color, flexShrink:0, marginTop:4 }}/>
              <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.45 }}>{n}</div>
            </div>
          ))}
        </div>
        {d.warning && (
          <div style={{ background:'rgba(255,59,48,0.08)', borderRadius:10, padding:'10px 12px',
            boxShadow:'0 0 0 1px rgba(255,59,48,0.2)' }}>
            <div className="t-caption-2" style={{ color:'#FF3B30', fontWeight:700, marginBottom:3 }}>⚠ PERHATIAN</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{d.warning}</div>
          </div>
        )}
      </div>
      {/* Shock matching */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>PILIHAN VASOPRESOR PER JENIS SYOK</div>
        {[
          { shock:'Septik / Distributif', first:'Norepinefrin', second:'+ Vasopressin 0.03 U/mnt jika refrakter', color:'#FF9500' },
          { shock:'Kardiogenik (CO rendah)', first:'Dobutamin ± NE (jika hipotensi)', second:'Epinefrin dosis rendah sebagai alternatif', color:'#FF3B30' },
          { shock:'Henti Jantung', first:'Epinefrin 1 mg tiap 3–5 mnt', second:'Vasopressin 40 U (alternatif dosis 1/2)', color:'#FF3B30' },
          { shock:'Anafilaksis', first:'Epinefrin 0.5 mg IM (paha lateral)', second:'Infus Epinefrin jika refrakter', color:'#FF6B35' },
        ].map(r => (
          <div key={r.shock} style={{ marginBottom:10 }}>
            <div className="t-caption-2" style={{ fontWeight:700, color:r.color, marginBottom:3 }}>{r.shock}</div>
            <div className="t-caption-2" style={{ color:'var(--label-primary)', marginBottom:1 }}>Lini 1: {r.first}</div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>Lini 2: {r.second}</div>
          </div>
        ))}
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', lineHeight:1.5 }}>
          Norepinefrin terbukti lebih aman vs dopamin pada syok septik (aritmia lebih sedikit, mortalitas tidak lebih buruk).<Cite n={2} href="https://doi.org/10.1056/NEJMoa0907118"/> Panduan AHA ACLS 2020 merekomendasikan epinefrin lini pertama henti jantung tanpa memandang irama.<Cite n={3} href="https://doi.org/10.1161/CIR.0000000000000916"/>
        </div>
      </div>
      <RefBlock items={VASO_REFS}/>
    </div>
  );
}

/* ============================================================
   Post-Arrest Tab
   ============================================================ */
const PA_REFS = [
  { n:1, text:'Neumar RW, et al. Post-Cardiac Arrest Syndrome. Circulation. 2008;118(23):2452–2483.', url:'https://doi.org/10.1161/CIRCULATIONAHA.108.190652' },
  { n:2, text:'Callaway CW, et al. Part 8: Post-Cardiac Arrest Care. Circulation. 2015;132:S465–S482.', url:'https://doi.org/10.1161/CIR.0000000000000262' },
  { n:3, text:'Donnino MW, et al. Temperature Management After Cardiac Arrest. Circulation. 2015;132(25):2448–2456.', url:'https://doi.org/10.1161/CIR.0000000000000313' },
  { n:4, text:'Geocadin RG, et al. Standards for Studies of Neurological Prognostication in Comatose Survivors of Cardiac Arrest. Resuscitation. 2014;85(3):e11–e15.' },
];

const PA_TIMELINE = [
  {
    time: '0–20 mnt',
    title: 'ROSC & Stabilisasi Awal',
    color: '#FF3B30',
    tasks: [
      'Konfirmasi ROSC: SpO₂, ETCO₂, tekanan darah (arterial line)',
      'Airway: ETT placement — cegah hyperventilasi (ETCO₂ 35–45 mmHg)',
      'Oksigen: SpO₂ 94–98% — hindari hyperoxia (ROS↑)',
      'EKG 12 lead: identifikasi STEMI → cath lab segera',
      'Target MAP ≥65–70 mmHg: vasopresor/inotropik sesuai etiologi',
      'Glukosa: cek GDS → target 140–180 mg/dL',
    ],
  },
  {
    time: '20–60 mnt',
    title: 'Evaluasi Etiologi & TTM Initiation',
    color: '#FF9500',
    tasks: [
      'Angiografi koroner: STEMI → segera; non-STEMI tanpa STEMI → stratifikasi',
      'CT kepala: singkirkan perdarahan intrakranial sebagai penyebab arrest',
      'Echo: fungsi ventrikel, tamponade, efusi, wall motion abnormality',
      'Lab: troponin, ABG, laktat, elektrolit, koagulasi, CBC',
      'TTM: mulai pendinginan ke target 32–36°C jika koma pasca-ROSC',
      'Sedasi + analgesia: fentanyl + propofol/midazolam selama pendinginan',
    ],
  },
  {
    time: '1–6 jam',
    title: 'TTM & Monitoring ICU',
    color: '#5856D6',
    tasks: [
      'Pertahankan suhu target (32–36°C) selama 24 jam — hindari demam',
      'Monitoring hemodinamik: arterial line + CVP + ScvO₂ atau PAC/echo serial',
      'Ventilasi protektif: VT 6 mL/kgBBI, PEEP 5–8, FiO₂ untuk SpO₂ 94–98%',
      'Antikonvulsan profilaksis tidak direkomendasikan rutin — pantau EEG jika ada indikasi',
      'Hindari hipoglikemia (target GDS 140–180 mg/dL, cek tiap 1–2 jam)',
      'Koreksi elektrolit: K⁺ 4–4.5 mEq/L, Mg²⁺ ≥1 mEq/L',
    ],
  },
  {
    time: '6–24 jam',
    title: 'Rewarming & Kontrol Demam',
    color: '#34C759',
    tasks: [
      'Rewarming bertahap: 0.25°C/jam hingga normotermia (36–37°C)',
      'Hindari rebound hipertermia — demam pasca-TTM memperburuk outcome neurologis',
      'Pertahankan normotermia (≤37.5°C) hingga 72 jam post-ROSC',
      'Pantau tanda post-cardiac arrest myocardial dysfunction (PAMD)',
      'Pertimbangkan EEG kontinyu pada koma — deteksi status epileptikus non-konvulsif',
    ],
  },
  {
    time: '24–72 jam',
    title: 'Neuroprognostikasi',
    color: '#007AFF',
    tasks: [
      'Waktu minimal neuroprognostikasi: ≥72 jam post-ROSC (atau ≥72 jam post-TTM)',
      'Pemeriksaan neurologis: pupil, corneal reflex, motor response (GCS-M)',
      'EEG: burst-suppression, status epileptikus, atau reaktivitas EEG',
      'SSEP (Somatosensory Evoked Potentials): N20 bilateral absent = prognosis sangat buruk',
      'CT/MRI kepala: edema serebri difus (ratio gray-white matter)',
      'Biomarker: NSE >60 µg/L (48–72 jam) berkorelasi dengan outcome buruk',
    ],
  },
];

function PostArrestTab() {
  const [step, setStep] = useState(0);
  const s = PA_TIMELINE[step];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Post-Cardiac Arrest Syndrome (PCAS) mencakup 4 domain: cedera otak pasca-arrest, disfungsi miokard, respons iskemia-reperfusi sistemik, dan penyebab primer arrest. Tatalaksana terstruktur dalam 72 jam pertama menentukan outcome neurologis jangka panjang.<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.108.190652"/>
      </div>
      {/* PCAS 4 domains */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>4 DOMAIN PCAS</div>
        <TheoryImage name="pcas-overview" alt="PCAS 4 domain diagram"
          fallback={
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { d:'Cedera Otak', c:'#FF3B30', txt:'Anoxia, excitotoxicity, edema, apoptosis — paling menentukan outcome' },
                { d:'Disfungsi Miokard', c:'#FF9500', txt:'Stunning pasca-arrest — reversibel dalam 48–72 jam dengan dukungan inotropik' },
                { d:'Respons I/R Sistemik', c:'#5856D6', txt:'ROS burst, Ca²⁺ overload, inflamasi, koagulopati — mirip sepsis' },
                { d:'Penyebab Primer', c:'#007AFF', txt:'ACS, PE, hipoksia, elektrolit — koreksi penyebab memperbaiki outcome' },
              ].map(r => (
                <div key={r.d} style={{ background:r.c+'10', borderRadius:10, padding:'10px 10px',
                  boxShadow:`0 0 0 1px ${r.c}30` }}>
                  <div className="t-caption-2" style={{ fontWeight:700, color:r.c, marginBottom:4 }}>{r.d}</div>
                  <div className="t-caption-2" style={{ color:'var(--label-secondary)', lineHeight:1.4 }}>{r.txt}</div>
                </div>
              ))}
            </div>
          }
        />
      </div>
      {/* TTM mechanism */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:6 }}>MEKANISME TTM (32–36°C)</div>
        <TheoryImage name="ttm-mechanism" alt="TTM neuroprotection mechanism"
          fallback={
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { mech:'Metabolisme serebri↓', detail:'Setiap 1°C ↓ → CMR O₂ ↓ ~6–7% → kebutuhan oksigen berkurang', c:'#5856D6' },
                { mech:'Excitotoxicity↓', detail:'Glutamat release↓, NMDA activation↓ → Ca²⁺ influx minimal', c:'#007AFF' },
                { mech:'ROS burst↓', detail:'Reactive oxygen species produksi↓ → kerusakan membran sel berkurang', c:'#34C759' },
                { mech:'Apoptosis↓', detail:'Caspase activation↓ → sel yang terancam dapat bertahan', c:'#FF9500' },
              ].map(r => (
                <div key={r.mech} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:r.c, flexShrink:0, marginTop:3 }}/>
                  <div>
                    <span className="t-caption-1" style={{ fontWeight:700, color:r.c }}>{r.mech}: </span>
                    <span className="t-caption-1" style={{ color:'var(--label-secondary)' }}>{r.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          }
        />
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginTop:8, lineHeight:1.5 }}>
          Target suhu 32–36°C selama 24 jam (TTM trial 2013, HYPERION 2019).<Cite n={3} href="https://doi.org/10.1161/CIR.0000000000000313"/> Elemen paling penting: hindari demam (&gt;37.7°C) dalam 72 jam post-ROSC.
        </div>
      </div>
      {/* Timeline stepper */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:10 }}>TIMELINE TATA LAKSANA POST-ROSC</div>
        {/* Time selector */}
        <div style={{ display:'flex', overflowX:'auto', gap:6, marginBottom:12, paddingBottom:4 }}>
          {PA_TIMELINE.map((t, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding:'7px 11px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap',
              background: step===i ? t.color : 'var(--fill-quaternary)',
              color: step===i ? '#fff' : 'var(--label-secondary)',
              fontWeight: step===i ? 700 : 400, fontSize:'0.775rem', transition:'all 150ms ease',
              flexShrink:0,
            }}>
              {t.time}
            </button>
          ))}
        </div>
        {/* Step detail */}
        <div style={{ borderLeft:`3px solid ${s.color}`, paddingLeft:12 }}>
          <div className="t-callout" style={{ fontWeight:700, color:s.color, marginBottom:8 }}>{s.title}</div>
          {s.tasks.map((task, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:s.color+'15',
                border:`1px solid ${s.color}40`, display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, fontSize:'0.65rem', fontWeight:700, color:s.color }}>{i+1}</div>
              <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5, paddingTop:2 }}>{task}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Cerebral autoregulation */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>AUTOREGULASI SEREBRAL PASCA-ROSC</div>
        <TheoryImage name="cerebral-autoregulation" alt="Cerebral autoregulation curve"
          fallback={
            <svg viewBox="0 0 280 130" style={{ width:'100%', maxHeight:130 }}>
              {/* Axes */}
              <line x1="30" y1="110" x2="260" y2="110" stroke="var(--label-tertiary)" strokeWidth="1.5"/>
              <line x1="30" y1="10" x2="30" y2="110" stroke="var(--label-tertiary)" strokeWidth="1.5"/>
              <text x="145" y="125" textAnchor="middle" fontSize="9" fill="var(--label-secondary)">MAP (mmHg)</text>
              <text x="12" y="65" textAnchor="middle" fontSize="9" fill="var(--label-secondary)" transform="rotate(-90,12,65)">CBF</text>
              {/* Autoregulation curve */}
              <path d="M30,100 L70,100 Q85,100 90,60 L160,60 Q165,60 170,100 L260,100"
                stroke="#007AFF" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* Plateau zone */}
              <rect x="90" y="55" width="70" height="10" fill="#34C75930" rx="3"/>
              <text x="125" y="48" textAnchor="middle" fontSize="8" fill="#34C759" fontWeight="700">Plateau (autoregulasi)</text>
              {/* MAP target line */}
              <line x1="110" y1="10" x2="110" y2="110" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="4,3"/>
              <text x="112" y="20" textAnchor="start" fontSize="8" fill="#FF9500">MAP 65–70</text>
              {/* Labels */}
              <text x="70" y="108" textAnchor="middle" fontSize="7" fill="var(--label-tertiary)">50</text>
              <text x="125" y="108" textAnchor="middle" fontSize="7" fill="var(--label-tertiary)">100</text>
              <text x="170" y="108" textAnchor="middle" fontSize="7" fill="var(--label-tertiary)">150</text>
            </svg>
          }
        />
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.6, marginTop:8 }}>
          Pasca-ROSC, autoregulasi serebral sering terganggu — CBF (cerebral blood flow) menjadi pressure-passive. Target MAP ≥65–70 mmHg kritis untuk mencegah secondary brain injury.<Cite n={2} href="https://doi.org/10.1161/CIR.0000000000000262"/> Beberapa studi mengevaluasi MAP target lebih tinggi (80–100 mmHg) pada pasien tertentu.
        </div>
      </div>
      {/* Neuroprognostication checklist */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px',
        boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>NEUROPROGNOSTIKASI — MODALITAS (≥72 JAM)</div>
        {[
          { mod:'Pemeriksaan Neurologis', detail:'GCS-M ≤2 bilateral (tidak ada gerakan bertujuan), pupil fixed', bad:'Bilateral absent pupillary reflex', c:'#FF3B30' },
          { mod:'EEG', detail:'Burst-suppression, status epileptikus, reaktivitas EEG (ada/tidak ada)', bad:'Non-reaktif, burst-suppression persisten', c:'#FF9500' },
          { mod:'SSEP', detail:'N20 bilateral — diukur setelah ≥24 jam', bad:'N20 bilateral absent = prognosis sangat buruk (spesifisitas >99%)', c:'#5856D6' },
          { mod:'CT / MRI Kepala', detail:'Rasio gray-white matter (GWR) pada CT; DWI ADC pada MRI', bad:'GWR <1.2 atau difus ADC rendah', c:'#007AFF' },
          { mod:'Biomarker NSE', detail:'Neuron-specific enolase (NSE) pada 48–72 jam', bad:'NSE >60 µg/L berkorelasi dengan outcome buruk', c:'#34C759' },
        ].map(r => (
          <div key={r.mod} style={{ marginBottom:10, padding:'10px 12px', background:'var(--fill-quaternary)', borderRadius:10 }}>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:r.c, flexShrink:0 }}/>
              <div className="t-caption-1" style={{ fontWeight:700, color:'var(--label-primary)' }}>{r.mod}</div>
            </div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginBottom:3 }}>{r.detail}</div>
            <div className="t-caption-2" style={{ color:r.c, fontWeight:600 }}>⚠ Buruk: {r.bad}</div>
          </div>
        ))}
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', lineHeight:1.5 }}>
          Tidak ada satu modalitas yang cukup — kombinasi ≥2 modalitas diperlukan.<Cite n={4}/> Jangan prognostikasi sebelum efek sedasi/TTM benar-benar habis.
        </div>
      </div>
      <RefBlock items={PA_REFS}/>
    </div>
  );
}

/* ============================================================
   Electrolyte & EKG Tab
   ============================================================ */
const ELEC_REFS = [
  { n:1, text:'Mattu A, Brady WJ, Robinson DA. Electrocardiographic manifestations of hyperkalemia. Am J Emerg Med. 2000;18(6):721–729.', url:'https://doi.org/10.1053/ajem.2000.7344' },
  { n:2, text:'Slovis C, Jenkins R. ABC of clinical electrocardiography: Conditions not primarily affecting the heart. BMJ. 2002;324:1320–1323.', url:'https://doi.org/10.1136/bmj.324.7349.1320' },
  { n:3, text:'Panchal AR, et al. Part 3: Adult Basic and Advanced Life Support. AHA Guidelines. Circulation. 2020;142(16 suppl 2).', url:'https://doi.org/10.1161/CIR.0000000000000916' },
  { n:4, text:'El-Sherif N, Turitto G. Electrolyte disorders and arrhythmogenesis. Cardiol J. 2011;18(3):233–245.' },
];

type ElecKey = 'hyperk' | 'hypok' | 'hyperca' | 'hypoca' | 'hypomg';

interface ElecDisorder {
  name: string; range: string; color: string;
  ekg: string[]; mechanism: string; management: string[]; pearl: string;
}

const ELEC_MAP: Record<ElecKey, ElecDisorder> = {
  hyperk: { name:'Hiperkalemia', range:'K⁺ >5.5 mEq/L', color:'#FF3B30',
    ekg:['T tinggi & runcing (peaked, K⁺ 5.5–6.5)','PR memanjang, P mendatar/hilang (6.5–7.5)','QRS melebar (>7.5)','Pola sine-wave → VF/asistol (terminal)'],
    mechanism:'K⁺ ekstraseluler↑ → potensial membran istirahat kurang negatif → inaktivasi kanal Na⁺ → konduksi melambat & eksitabilitas menurun progresif. Repolarisasi lebih cepat → T peaked.',
    management:['Kalsium glukonat 10% 10–30 mL IV (stabilisasi membran — bekerja <3 mnt)','Insulin 10 U + D40% 25 g IV (shift intraseluler)','Salbutamol nebul 10–20 mg (shift)','Natrium bikarbonat (jika asidosis)','Eliminasi: furosemid, resin (patiromer), dialisis'],
    pearl:'Kalsium TIDAK menurunkan K⁺ — hanya menstabilkan membran. Tetap perlu terapi shift + eliminasi. Pada henti jantung curiga hiperkalemia: CaCl₂ + bikarbonat empiris.' },
  hypok:  { name:'Hipokalemia', range:'K⁺ <3.5 mEq/L', color:'#FF9500',
    ekg:['T mendatar / inversi','Gelombang U menonjol (setelah T)','ST depresi','QT (sebenarnya QU) memanjang → risiko TdP'],
    mechanism:'K⁺ ekstraseluler↓ → hiperpolarisasi & repolarisasi memanjang → afterdepolarization → aritmia. Memperberat toksisitas digoksin.',
    management:['KCl IV 10–20 mEq/jam via vena sentral (perifer maks 10 mEq/jam)','Koreksi Mg²⁺ bersamaan (hipoMg menghambat koreksi K⁺)','Target K⁺ ≥4.0 pada pasien jantung','Monitoring EKG kontinyu saat koreksi cepat'],
    pearl:'Hipokalemia refrakter sering disebabkan hipomagnesemia — selalu koreksi Mg²⁺ bersamaan.' },
  hyperca: { name:'Hiperkalsemia', range:'Ca²⁺ >10.5 mg/dL', color:'#5856D6',
    ekg:['QT memendek (ST segment pendek/hilang)','Gelombang Osborn (J wave) pada kasus berat','Bradikardia, AV block (berat)'],
    mechanism:'Ca²⁺↑ → fase 2 (plateau) lebih cepat → repolarisasi lebih cepat → QT pendek. Penyebab: hiperparatiroid, keganasan.',
    management:['Hidrasi NaCl 0.9% agresif (200–300 mL/jam)','Kalsitonin 4 U/kg (cepat tapi tachyphylaxis)','Bifosfonat (asam zoledronat) — onset 2–4 hari','Dialisis jika berat/gagal ginjal'],
    pearl:'QT pendek dengan ST segment yang nyaris hilang adalah petunjuk klasik hiperkalsemia.' },
  hypoca:  { name:'Hipokalsemia', range:'Ca²⁺ <8.5 mg/dL', color:'#30B0C7',
    ekg:['QT memanjang (ST segment memanjang)','T relatif normal (beda dari hipoK)','Risiko TdP'],
    mechanism:'Ca²⁺↓ → fase 2 plateau memanjang → repolarisasi lambat → QT panjang. Penyebab: hipoparatiroid, transfusi masif (sitrat), pankreatitis.',
    management:['Kalsium glukonat 10% 10–20 mL IV lambat (simptomatik)','Kalsium klorida bila akses sentral','Koreksi Mg²⁺ jika rendah','Cari penyebab (PTH, vitamin D)'],
    pearl:'Transfusi masif → sitrat mengikat Ca²⁺ → hipokalsemia + koagulopati. Pertimbangkan kalsium empiris.' },
  hypomg:  { name:'Hipomagnesemia', range:'Mg²⁺ <1.5 mg/dL', color:'#34C759',
    ekg:['QT memanjang','Pelebaran QRS & PR (berat)','Predisposisi TdP & aritmia atrial/ventrikel'],
    mechanism:'Mg²⁺ adalah kofaktor Na⁺/K⁺-ATPase. Defisit → hipokalemia & hipokalsemia refrakter → instabilitas listrik & TdP.',
    management:['MgSO₄ 1–2 g IV selama 15 mnt (TdP / aritmia)','MgSO₄ 2 g IV bolus pada TdP (lini pertama, walau Mg normal)','Koreksi K⁺ dan Ca²⁺ bersamaan','Infus lambat jika asimptomatik'],
    pearl:'Magnesium sulfat adalah terapi lini pertama Torsades de Pointes — diberikan bahkan saat kadar Mg normal.' },
};

function ElectrolyteTab() {
  const [el, setEl] = useState<ElecKey>('hyperk');
  const d = ELEC_MAP[el];
  const TYPES: Array<{ key: ElecKey; label: string; color: string }> = [
    { key:'hyperk',  label:'Hiper-K⁺',  color:'#FF3B30' },
    { key:'hypok',   label:'Hipo-K⁺',   color:'#FF9500' },
    { key:'hyperca', label:'Hiper-Ca²⁺', color:'#5856D6' },
    { key:'hypoca',  label:'Hipo-Ca²⁺',  color:'#30B0C7' },
    { key:'hypomg',  label:'Hipo-Mg²⁺',  color:'#34C759' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Gangguan elektrolit mengubah potensial membran dan repolarisasi miosit → manifestasi EKG khas dan risiko aritmia.<Cite n={2} href="https://doi.org/10.1136/bmj.324.7349.1320"/> Pengenalan pola EKG memungkinkan terapi empiris sebelum hasil lab tersedia — penting pada henti jantung (Hs & Ts).<Cite n={3} href="https://doi.org/10.1161/CIR.0000000000000916"/>
      </div>
      {/* Selector */}
      <div style={{ display:'flex', overflowX:'auto', gap:6, paddingBottom:4 }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setEl(t.key)} style={{
            padding:'8px 13px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            background: el===t.key ? t.color : 'var(--fill-quaternary)',
            color: el===t.key ? '#fff' : 'var(--label-secondary)',
            fontWeight: el===t.key ? 700 : 400, fontSize:'0.8125rem', transition:'all 150ms ease',
          }}>{t.label}</button>
        ))}
      </div>
      {/* Header + range */}
      <div style={{ background:d.color+'10', borderRadius:14, padding:'12px 16px', boxShadow:`0 0 0 1px ${d.color}40` }}>
        <div className="t-callout" style={{ fontWeight:700, color:d.color }}>{d.name}</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', fontFamily:'monospace', marginTop:2 }}>{d.range}</div>
      </div>
      {/* EKG diagram */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>PERUBAHAN EKG</div>
        <TheoryImage name={`elec-${el}`} alt={`EKG ${d.name}`}
          fallback={
            <svg viewBox="0 0 280 90" style={{ width:'100%', maxHeight:90 }}>
              <line x1="0" y1="60" x2="280" y2="60" stroke="var(--separator-opaque)" strokeWidth="0.5"/>
              {el==='hyperk' && (
                <path d="M0,60 L30,60 L36,52 L40,60 L70,60 L82,18 L94,60 L110,60 L116,52 L120,60 L150,60 L162,18 L174,60 L280,60"
                  stroke={d.color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
              )}
              {el==='hypok' && (
                <path d="M0,60 L24,60 L30,40 L40,55 L46,60 L58,57 L70,60 L120,60 L126,40 L136,55 L142,60 L154,57 L166,60 L280,60"
                  stroke={d.color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
              )}
              {el==='hyperca' && (
                <path d="M0,60 L40,60 L46,30 L52,60 L56,48 L66,60 L120,60 L126,30 L132,60 L136,48 L146,60 L280,60"
                  stroke={d.color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
              )}
              {(el==='hypoca'||el==='hypomg') && (
                <path d="M0,60 L36,60 L42,28 L48,60 L92,60 L100,46 L112,60 L160,60 L166,28 L172,60 L216,60 L224,46 L236,60 L280,60"
                  stroke={d.color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
              )}
              <text x="140" y="84" textAnchor="middle" fontSize="9" fill="var(--label-tertiary)">
                {el==='hyperk' ? 'T peaked / QRS lebar' : el==='hypok' ? 'T datar + gelombang U' : el==='hyperca' ? 'QT memendek' : 'QT memanjang'}
              </text>
            </svg>
          }
        />
        {d.ekg.map((e, i) => (
          <div key={i} style={{ display:'flex', gap:7, marginTop:6 }}>
            <div style={{ width:5, height:5, borderRadius:2.5, background:d.color, flexShrink:0, marginTop:4 }}/>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.45 }}>{e}</div>
          </div>
        ))}
      </div>
      {/* Mechanism */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>MEKANISME</div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.65 }}>{d.mechanism}<Cite n={4}/></div>
      </div>
      {/* Management */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>TATA LAKSANA</div>
        {d.management.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:7, marginBottom:5 }}>
            <div style={{ width:18, height:18, borderRadius:'50%', background:'#34C75915', border:'1px solid #34C75940',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.6rem', fontWeight:700, color:'#34C759' }}>{i+1}</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.45, paddingTop:1 }}>{m}</div>
          </div>
        ))}
      </div>
      {/* Pearl */}
      <div style={{ background:d.color+'10', borderRadius:14, padding:'12px 16px', boxShadow:`0 0 0 1px ${d.color}30` }}>
        <div className="t-caption-2" style={{ color:d.color, fontWeight:700, marginBottom:4 }}>💡 MUTIARA KLINIS</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>{d.pearl}</div>
      </div>
      {el==='hyperk' && (
        <div style={{ background:'rgba(255,59,48,0.06)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 1px rgba(255,59,48,0.2)' }}>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.6 }}>
            Hiperkalemia adalah salah satu dari <span style={{ fontWeight:700, color:'#FF3B30' }}>Hs &amp; Ts</span> (penyebab reversibel henti jantung). Pertimbangkan pada gagal ginjal, asidosis, rabdomiolisis, atau EKG dengan QRS lebar progresif.<Cite n={1} href="https://doi.org/10.1053/ajem.2000.7344"/>
          </div>
        </div>
      )}
      <RefBlock items={ELEC_REFS}/>
    </div>
  );
}

/* ============================================================
   12-Lead EKG Tab
   ============================================================ */
const EKG12_REFS = [
  { n:1, text:'Wagner GS, et al. AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the ECG: Part VI. Circulation. 2009;119:e235–e240.', url:'https://doi.org/10.1161/CIRCULATIONAHA.108.191095' },
  { n:2, text:'Thygesen K, et al. Fourth Universal Definition of Myocardial Infarction (2018). Circulation. 2018;138:e618–e651.', url:'https://doi.org/10.1161/CIR.0000000000000617' },
  { n:3, text:'Surawicz B, Knilans T. Chou\'s Electrocardiography in Clinical Practice. 6th ed. 2008.' },
];

type TerrKey = 'anterior' | 'septal' | 'lateral' | 'inferior' | 'posterior' | 'rv';

interface Territory {
  name: string; color: string; leads: string; artery: string;
  reciprocal: string; notes: string;
}

const TERR_MAP: Record<TerrKey, Territory> = {
  septal:   { name:'Septal', color:'#FF9500', leads:'V1–V2', artery:'LAD (cabang septal)',
    reciprocal:'—', notes:'Sering bergabung dengan anterior (antero-septal). Q di V1–V2.' },
  anterior: { name:'Anterior', color:'#FF3B30', leads:'V3–V4', artery:'LAD (left anterior descending)',
    reciprocal:'Inferior (II, III, aVF)', notes:'STEMI anterior luas (V1–V6) → oklusi LAD proksimal, prognosis buruk, risiko syok kardiogenik.' },
  lateral:  { name:'Lateral', color:'#34C759', leads:'I, aVL, V5–V6', artery:'LCx atau diagonal LAD',
    reciprocal:'Inferior (II, III, aVF)', notes:'High lateral (I, aVL) → diagonal/LCx. Resiprokal inferior membantu konfirmasi.' },
  inferior: { name:'Inferior', color:'#007AFF', leads:'II, III, aVF', artery:'RCA (80%) atau LCx (20%)',
    reciprocal:'I, aVL', notes:'STEMI inferior → selalu cek lead kanan (V4R) untuk infark RV. Hati-hati nitrat & bradikardia.' },
  posterior:{ name:'Posterior', color:'#5856D6', leads:'V7–V9 (ST elevasi)', artery:'LCx atau RCA',
    reciprocal:'V1–V3 (ST depresi + R tinggi)', notes:'Tampak sebagai ST depresi V1–V3 dengan R dominan — "STEMI ekuivalen". Rekam V7–V9.' },
  rv:       { name:'Ventrikel Kanan', color:'#30B0C7', leads:'V4R (ST elevasi)', artery:'RCA proksimal',
    reciprocal:'—', notes:'Menyertai 30–50% STEMI inferior. Hipotensi sensitif terhadap preload — hindari nitrat, beri cairan.' },
};

function Ekg12LeadTab() {
  const [terr, setTerr] = useState<TerrKey>('anterior');
  const d = TERR_MAP[terr];
  const TYPES: Array<{ key: TerrKey; label: string }> = [
    { key:'septal',    label:'Septal' },
    { key:'anterior',  label:'Anterior' },
    { key:'lateral',   label:'Lateral' },
    { key:'inferior',  label:'Inferior' },
    { key:'posterior', label:'Posterior' },
    { key:'rv',        label:'RV' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        EKG 12 sadapan memetakan aktivitas listrik jantung dari 12 sudut pandang. Pengelompokan sadapan berdasarkan teritori koroner memungkinkan lokalisasi iskemia/infark dan identifikasi arteri penyebab.<Cite n={1} href="https://doi.org/10.1161/CIRCULATIONAHA.108.191095"/>
      </div>
      {/* Lead group reference */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>12 SADAPAN</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <div className="t-caption-2" style={{ fontWeight:700, marginBottom:3, color:'var(--label-primary)' }}>Ekstremitas (frontal)</div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>I, II, III (bipolar)<br/>aVR, aVL, aVF (augmented)</div>
          </div>
          <div>
            <div className="t-caption-2" style={{ fontWeight:700, marginBottom:3, color:'var(--label-primary)' }}>Prekordial (horizontal)</div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>V1–V2: septal<br/>V3–V4: anterior<br/>V5–V6: lateral</div>
          </div>
        </div>
      </div>
      {/* Territory selector */}
      <div style={{ display:'flex', overflowX:'auto', gap:6, paddingBottom:4 }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setTerr(t.key)} style={{
            padding:'8px 13px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            background: terr===t.key ? TERR_MAP[t.key].color : 'var(--fill-quaternary)',
            color: terr===t.key ? '#fff' : 'var(--label-secondary)',
            fontWeight: terr===t.key ? 700 : 400, fontSize:'0.8125rem', transition:'all 150ms ease',
          }}>{t.label}</button>
        ))}
      </div>
      {/* Territory diagram */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px', boxShadow:`0 0 0 1.5px ${d.color}40` }}>
        <TheoryImage name={`ekg12-${terr}`} alt={`Teritori ${d.name}`}
          fallback={
            <svg viewBox="0 0 280 120" style={{ width:'100%', maxHeight:120 }}>
              {/* Heart outline */}
              <path d="M140,30 C120,10 80,15 80,55 C80,90 140,110 140,110 C140,110 200,90 200,55 C200,15 160,10 140,30 Z"
                fill="var(--fill-quaternary)" stroke="var(--separator-opaque)" strokeWidth="1"/>
              {/* Highlighted region */}
              {terr==='septal' && <ellipse cx="140" cy="60" rx="14" ry="35" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5"/>}
              {terr==='anterior' && <ellipse cx="120" cy="50" rx="26" ry="28" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5"/>}
              {terr==='lateral' && <ellipse cx="90" cy="60" rx="18" ry="30" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5"/>}
              {terr==='inferior' && <ellipse cx="140" cy="95" rx="40" ry="14" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5"/>}
              {terr==='posterior' && <ellipse cx="165" cy="65" rx="22" ry="30" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5" strokeDasharray="3,2"/>}
              {terr==='rv' && <ellipse cx="180" cy="55" rx="18" ry="28" fill={d.color+'40'} stroke={d.color} strokeWidth="1.5"/>}
              <text x="140" y="118" textAnchor="middle" fontSize="9" fill={d.color} fontWeight="700">Teritori {d.name}</text>
            </svg>
          }
        />
      </div>
      {/* Detail */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        {([['Sadapan terlibat', d.leads], ['Arteri penyebab', d.artery], ['Resiprokal', d.reciprocal]] as const).map(([k, v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'7px 0',
            borderBottom:'0.5px solid var(--separator-opaque)' }}>
            <span className="t-caption-1" style={{ color:'var(--label-secondary)' }}>{k}</span>
            <span className="t-caption-1" style={{ fontWeight:700, color:'var(--label-primary)', textAlign:'right' }}>{v}</span>
          </div>
        ))}
        <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.6, marginTop:10 }}>{d.notes}</div>
      </div>
      {/* STEMI criteria */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>KRITERIA ST-ELEVASI (Universal Definition of MI 2018)</div>
        {[
          'Elevasi ST baru pada J point ≥2 sadapan kontigu',
          '≥1 mm di semua sadapan kecuali V2–V3',
          'V2–V3: ≥2 mm (pria ≥40 th), ≥2.5 mm (pria <40 th), ≥1.5 mm (wanita)',
          'LBBB baru / Sgarbossa positif = STEMI ekuivalen',
        ].map((c, i) => (
          <div key={i} style={{ display:'flex', gap:7, marginBottom:5 }}>
            <div style={{ width:5, height:5, borderRadius:2.5, background:'#FF3B30', flexShrink:0, marginTop:4 }}/>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.45 }}>{c}</div>
          </div>
        ))}
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', lineHeight:1.5, marginTop:6 }}>
          Sumber: Fourth Universal Definition of MI.<Cite n={2} href="https://doi.org/10.1161/CIR.0000000000000617"/>
        </div>
      </div>
      {/* Systematic approach */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>PENDEKATAN SISTEMATIS</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.7 }}>
          <strong>1. Laju</strong> (300/jumlah kotak besar) · <strong>2. Irama</strong> (reguler? P sebelum tiap QRS?) · <strong>3. Aksis</strong> (I & aVF) · <strong>4. Interval</strong> (PR 120–200ms, QRS &lt;120ms, QTc) · <strong>5. Morfologi</strong> (P, QRS, ST-T per teritori).<Cite n={3}/>
        </div>
      </div>
      <RefBlock items={EKG12_REFS}/>
    </div>
  );
}

/* ============================================================
   POCUS Tab
   ============================================================ */
const POCUS_REFS = [
  { n:1, text:'Perera P, et al. The RUSH exam: Rapid Ultrasound in SHock in the evaluation of the critically ill. Emerg Med Clin North Am. 2010;28(1):29–56.', url:'https://doi.org/10.1016/j.emc.2009.09.010' },
  { n:2, text:'Atkinson P, et al. International Federation for Emergency Medicine Consensus Statement: Sonography in hypotension and cardiac arrest (SHoC). CJEM. 2017;19(6):459–470.', url:'https://doi.org/10.1017/cem.2016.394' },
  { n:3, text:'Breitkreutz R, et al. Focused echocardiographic evaluation in life support and peri-resuscitation (FEEL). Resuscitation. 2010;81(11):1527–1533.', url:'https://doi.org/10.1016/j.resuscitation.2010.06.012' },
];

type PocusKey = 'pump' | 'tank' | 'pipes' | 'arrest';

interface PocusSection {
  name: string; color: string; subtitle: string;
  views: Array<{ view: string; finding: string }>;
  pearl: string;
}

const POCUS_MAP: Record<PocusKey, PocusSection> = {
  pump: { name:'Pump (Jantung)', color:'#FF3B30', subtitle:'Evaluasi fungsi & cairan perikardial',
    views:[
      { view:'Subxiphoid 4-chamber', finding:'Efusi perikardial / tamponade (kolaps RA/RV diastolik)' },
      { view:'Parasternal long-axis', finding:'Kontraktilitas LV (global), efusi, ukuran ruang' },
      { view:'Apical 4-chamber', finding:'Rasio RV:LV (>1 → strain RV / PE), fungsi global' },
    ],
    pearl:'Pada henti jantung: cardiac standstill (tidak ada gerakan dinding) berkorelasi dengan prognosis sangat buruk. Tamponade → perikardiosentesis segera.' },
  tank: { name:'Tank (Volume)', color:'#007AFF', subtitle:'Status volume & kebocoran',
    views:[
      { view:'IVC (subxiphoid)', finding:'Diameter & kolapsibilitas → status preload/volume responsiveness' },
      { view:'FAST (Morrison, splenorenal, pelvis)', finding:'Cairan bebas intraabdomen (perdarahan)' },
      { view:'Toraks (B-lines)', finding:'Edema paru / kongesti (≥3 B-line per lapang)' },
      { view:'Pleura', finding:'Efusi pleura, pneumotoraks (hilangnya lung sliding)' },
    ],
    pearl:'IVC kecil & kolaps total → hipovolemia / volume responsive. IVC plethoric (besar, tidak kolaps) → tamponade, PE, atau gagal jantung kanan.' },
  pipes: { name:'Pipes (Pembuluh)', color:'#34C759', subtitle:'Arteri & vena',
    views:[
      { view:'Aorta (suprasternal–bifurkasio)', finding:'Aneurisma aorta abdominal (AAA >3 cm), diseksi' },
      { view:'Vena femoralis/poplitea', finding:'DVT (vena tidak kompresibel) → sumber PE' },
    ],
    pearl:'AAA yang ruptur dapat menyebabkan syok hipovolemik. DVT + RV strain mendukung diagnosis PE pada syok obstruktif.' },
  arrest: { name:'Henti Jantung', color:'#5856D6', subtitle:'Protokol FEEL / SHoC — sebab reversibel',
    views:[
      { view:'Cardiac standstill', finding:'Tidak ada aktivitas → prognosis buruk; bantu keputusan terminasi' },
      { view:'Tamponade', finding:'Efusi besar + kolaps ruang → perikardiosentesis' },
      { view:'RV dilatasi (D-sign)', finding:'PE masif → pertimbangkan trombolisis' },
      { view:'LV hiperdinamik + IVC kolaps', finding:'Hipovolemia → resusitasi cairan/darah' },
    ],
    pearl:'Lakukan hanya selama jeda pulse-check (≤10 detik) agar tidak mengganggu kompresi. FEEL terintegrasi dalam algoritma ALS untuk mengidentifikasi 4H/4T yang dapat ditangani.' },
};

function PocusTab() {
  const [sec, setSec] = useState<PocusKey>('pump');
  const d = POCUS_MAP[sec];
  const TYPES: Array<{ key: PocusKey; label: string }> = [
    { key:'pump',   label:'Pump' },
    { key:'tank',   label:'Tank' },
    { key:'pipes',  label:'Pipes' },
    { key:'arrest', label:'Henti Jantung' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="t-footnote" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
        Point-of-Care Ultrasound (POCUS) mempercepat diagnosis syok dan henti jantung di samping tempat tidur. Protokol RUSH (Rapid Ultrasound in SHock) menggunakan kerangka <em>Pump–Tank–Pipes</em> untuk evaluasi sistematis.<Cite n={1} href="https://doi.org/10.1016/j.emc.2009.09.010"/>
      </div>
      {/* RUSH framework note */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>KERANGKA RUSH</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { n:'Pump', d:'Jantung', c:'#FF3B30' },
            { n:'Tank', d:'Volume', c:'#007AFF' },
            { n:'Pipes', d:'Pembuluh', c:'#34C759' },
          ].map(r => (
            <div key={r.n} style={{ textAlign:'center', background:r.c+'12', borderRadius:10, padding:'10px 6px', boxShadow:`0 0 0 1px ${r.c}30` }}>
              <div className="t-caption-1" style={{ fontWeight:700, color:r.c }}>{r.n}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>{r.d}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Section selector */}
      <div style={{ display:'flex', overflowX:'auto', gap:6, paddingBottom:4 }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setSec(t.key)} style={{
            padding:'8px 13px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            background: sec===t.key ? POCUS_MAP[t.key].color : 'var(--fill-quaternary)',
            color: sec===t.key ? '#fff' : 'var(--label-secondary)',
            fontWeight: sec===t.key ? 700 : 400, fontSize:'0.8125rem', transition:'all 150ms ease',
          }}>{t.label}</button>
        ))}
      </div>
      {/* Header */}
      <div style={{ background:d.color+'10', borderRadius:14, padding:'12px 16px', boxShadow:`0 0 0 1px ${d.color}40` }}>
        <div className="t-callout" style={{ fontWeight:700, color:d.color }}>{d.name}</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:2 }}>{d.subtitle}</div>
      </div>
      {/* Diagram */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'12px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <TheoryImage name={`pocus-${sec}`} alt={`POCUS ${d.name}`}
          fallback={
            <svg viewBox="0 0 200 110" style={{ width:'100%', maxHeight:110 }}>
              {/* Ultrasound probe sector */}
              <path d="M100,8 L40,100 L160,100 Z" fill="#0a0a0a" stroke={d.color} strokeWidth="1.5"/>
              <circle cx="100" cy="8" r="4" fill={d.color}/>
              {sec==='pump' && (
                <>
                  <ellipse cx="100" cy="65" rx="26" ry="20" fill="none" stroke={d.color} strokeWidth="2"/>
                  <line x1="100" y1="48" x2="100" y2="82" stroke={d.color} strokeWidth="1.5"/>
                  <text x="100" y="100" textAnchor="middle" fontSize="8" fill={d.color}>4-chamber</text>
                </>
              )}
              {sec==='tank' && (
                <>
                  <rect x="92" y="40" width="16" height="50" rx="6" fill="none" stroke={d.color} strokeWidth="2"/>
                  <text x="100" y="100" textAnchor="middle" fontSize="8" fill={d.color}>IVC</text>
                </>
              )}
              {sec==='pipes' && (
                <>
                  <circle cx="100" cy="60" r="14" fill="none" stroke={d.color} strokeWidth="2"/>
                  <circle cx="100" cy="60" r="6" fill={d.color+'40'}/>
                  <text x="100" y="100" textAnchor="middle" fontSize="8" fill={d.color}>Aorta</text>
                </>
              )}
              {sec==='arrest' && (
                <>
                  <ellipse cx="100" cy="62" rx="30" ry="22" fill="none" stroke={d.color} strokeWidth="2"/>
                  <ellipse cx="100" cy="62" rx="30" ry="22" fill="none" stroke={d.color} strokeWidth="6" opacity="0.2"/>
                  <text x="100" y="100" textAnchor="middle" fontSize="8" fill={d.color}>FEEL / SHoC</text>
                </>
              )}
            </svg>
          }
        />
      </div>
      {/* Views */}
      <div style={{ background:'var(--bg-primary)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 0.5px var(--separator-opaque)' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:8 }}>JENDELA & TEMUAN</div>
        {d.views.map((v, i) => (
          <div key={i} style={{ marginBottom:10, paddingBottom:10,
            borderBottom: i < d.views.length-1 ? '0.5px solid var(--separator-opaque)' : 'none' }}>
            <div className="t-caption-1" style={{ fontWeight:700, color:d.color, marginBottom:2 }}>{v.view}</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.45 }}>{v.finding}</div>
          </div>
        ))}
      </div>
      {/* Pearl */}
      <div style={{ background:d.color+'10', borderRadius:14, padding:'12px 16px', boxShadow:`0 0 0 1px ${d.color}30` }}>
        <div className="t-caption-2" style={{ color:d.color, fontWeight:700, marginBottom:4 }}>💡 MUTIARA KLINIS</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>{d.pearl}</div>
      </div>
      {sec==='arrest' && (
        <div style={{ background:'rgba(88,86,214,0.06)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 1px rgba(88,86,214,0.2)' }}>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.6 }}>
            Protokol <span style={{ fontWeight:700, color:'#5856D6' }}>FEEL</span> mengintegrasikan ekokardiografi terfokus ke dalam ALS untuk mendeteksi penyebab reversibel (tamponade, PE, hipovolemia) tanpa mengganggu kompresi dada.<Cite n={3} href="https://doi.org/10.1016/j.resuscitation.2010.06.012"/> Konsensus SHoC merekomendasikan pencitraan jantung, paru, dan IVC selama resusitasi.<Cite n={2} href="https://doi.org/10.1017/cem.2016.394"/>
          </div>
        </div>
      )}
      <RefBlock items={POCUS_REFS}/>
    </div>
  );
}

/* ============================================================
   Tab: Ventilasi Mekanik
   ============================================================ */
type VentMode = 'vc'|'pc'|'simv'|'ps';
const VENT_MODE_DATA: Record<VentMode, {
  name: string; full: string; desc: string; tint: string;
  settings: string[]; pros: string; cons: string;
}> = {
  vc: {
    name:'VCV', full:'Volume Control Ventilation', tint:'#007AFF',
    desc:'Volume tidal tetap diberikan tiap siklus — pressure berubah menyesuaikan compliance paru.',
    settings:['Vt 6–8 mL/kg IBW','RR 12–20 /min','PEEP 5 cmH₂O','FiO₂ titrasi SpO₂ ≥94%','I:E 1:2'],
    pros:'Volume tidal terjamin → PaCO₂ prediktabel.',
    cons:'Pressure bisa tak terbatas → barotrauma jika compliance buruk.'
  },
  pc: {
    name:'PCV', full:'Pressure Control Ventilation', tint:'#FF9500',
    desc:'Pressure inspirasi tetap — volume tidal berubah sesuai compliance & resistensi.',
    settings:['PC 15–20 cmH₂O (di atas PEEP)','RR 12–20 /min','PEEP 5 cmH₂O','FiO₂ titrasi','Ti 0.8–1.2 s'],
    pros:'Pressure terbatas → safer pada paru kaku.',
    cons:'Volume tidal tidak terjamin → hipoventilasi jika compliance berubah.'
  },
  simv: {
    name:'SIMV', full:'Synchronized IMV', tint:'#34C759',
    desc:'Ventilator memberi napas wajib tersinkron; pasien bisa bernafas spontan di antaranya.',
    settings:['RR mandatory 8–14/min','Vt mandatory 6–8 mL/kg','PS support napas spontan','PEEP 5 cmH₂O'],
    pros:'Latihan otot napas; WOB bertahap diturunkan.',
    cons:'Auto-PEEP, patient-ventilator dyssynchrony lebih sering.'
  },
  ps: {
    name:'PSV', full:'Pressure Support Ventilation', tint:'#AF52DE',
    desc:'Setiap napas pasien mendapat dorongan pressure; pasien kendalikan RR & Ti.',
    settings:['PS 5–15 cmH₂O','PEEP 5 cmH₂O','Apnea backup diperlukan'],
    pros:'Nyaman, otot napas aktif, ideal untuk weaning.',
    cons:'Tidak ada backup RR (apnea berbahaya).'
  },
};

const RSBI_TIPS = [
  { label:'RSBI < 80', ok:true,  text:'Sangat mungkin berhasil ekstubasi' },
  { label:'RSBI 80–105', ok:null, text:'Zona abu-abu — nilai klinis lain penting' },
  { label:'RSBI > 105', ok:false, text:'Kemungkinan tinggi gagal weaning' },
];

const VENT_REFS: RefItem[] = [
  { n:1, text:'Slutsky AS, Ranieri VM. Ventilator-induced lung injury. N Engl J Med. 2013;369:2126–36.', url:'https://doi.org/10.1056/NEJMra1208707' },
  { n:2, text:'ARDS Network. Ventilation with lower tidal volumes. N Engl J Med. 2000;342:1301–8.', url:'https://doi.org/10.1056/NEJM200005043421801' },
  { n:3, text:'Boles JM, et al. Weaning from mechanical ventilation. Eur Respir J. 2007;29:1033–56.', url:'https://doi.org/10.1183/09031936.00010206' },
];

function VentMekTab() {
  const [mode, setMode] = useState<VentMode>('vc');
  const d = VENT_MODE_DATA[mode];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Mode selector */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {(Object.keys(VENT_MODE_DATA) as VentMode[]).map(k => {
          const m = VENT_MODE_DATA[k];
          const active = mode === k;
          return (
            <button key={k} onClick={() => setMode(k)} style={{
              border:'none', cursor:'pointer', borderRadius:14,
              padding:'12px 14px', textAlign:'left',
              background: active ? m.tint+'18' : 'var(--fill-tertiary)',
              boxShadow: active ? `0 0 0 1.5px ${m.tint}` : '0 0 0 1px var(--separator)'
            }}>
              <div className="t-callout" style={{ color: active ? m.tint : 'var(--label-primary)', fontWeight:700 }}>{m.name}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginTop:2 }}>{m.full}</div>
            </button>
          );
        })}
      </div>
      {/* Detail card */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px', boxShadow:`0 0 0 1px ${d.tint}30` }}>
        <div className="t-subhead" style={{ color:d.tint, fontWeight:700, marginBottom:6 }}>{d.name} — {d.full}</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55, marginBottom:10 }}>{d.desc}</div>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:600, marginBottom:4 }}>SETTING AWAL</div>
        {d.settings.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <div style={{ width:6, height:6, borderRadius:3, background:d.tint, flexShrink:0 }}/>
            <div className="t-caption-1" style={{ color:'var(--label-primary)' }}>{s}</div>
          </div>
        ))}
        <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ background:'rgba(52,199,89,0.08)', borderRadius:10, padding:'8px 10px' }}>
            <div className="t-caption-2" style={{ color:'#34C759', fontWeight:700 }}>✓ KELEBIHAN</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:3, lineHeight:1.4 }}>{d.pros}</div>
          </div>
          <div style={{ background:'rgba(255,59,48,0.08)', borderRadius:10, padding:'8px 10px' }}>
            <div className="t-caption-2" style={{ color:'#FF3B30', fontWeight:700 }}>✗ KETERBATASAN</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:3, lineHeight:1.4 }}>{d.cons}</div>
          </div>
        </div>
      </div>
      {/* ARDSNet targets */}
      <div style={{ background:'rgba(0,122,255,0.06)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 1px rgba(0,122,255,0.2)' }}>
        <div className="t-caption-2" style={{ color:'#007AFF', fontWeight:700, marginBottom:8 }}>TARGET LUNG-PROTECTIVE (ARDSNet)<Cite n={2} href="https://doi.org/10.1056/NEJM200005043421801"/></div>
        {[
          ['Vt','4–6 mL/kg IBW'],['Pplat','≤ 30 cmH₂O'],['Driving pressure','≤ 15 cmH₂O'],
          ['SpO₂','88–95% (toleransi hipoksemia relatif)'],['pH','7.30–7.45'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'0.5px solid var(--separator)' }}>
            <span className="t-caption-1" style={{ color:'var(--label-secondary)' }}>{k}</span>
            <span className="t-caption-1" style={{ color:'var(--label-primary)', fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Weaning / RSBI */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:8 }}>WEANING — RSBI<Cite n={3} href="https://doi.org/10.1183/09031936.00010206"/></div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginBottom:8, lineHeight:1.5 }}>
          <strong>RSBI = RR / Vt (L)</strong>. Hitung selama 1 menit SBT tanpa support (T-piece atau CPAP 5 cmH₂O).
        </div>
        {RSBI_TIPS.map((r,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:10, height:10, borderRadius:5, flexShrink:0,
              background: r.ok === true ? '#34C759' : r.ok === false ? '#FF3B30' : '#FF9500' }}/>
            <div>
              <span className="t-caption-1" style={{ fontWeight:700, color:'var(--label-primary)' }}>{r.label}</span>
              <span className="t-caption-1" style={{ color:'var(--label-secondary)' }}> — {r.text}</span>
            </div>
          </div>
        ))}
      </div>
      <RefBlock items={VENT_REFS}/>
    </div>
  );
}

/* ============================================================
   Tab: Sedasi & Analgesia
   ============================================================ */
type SedasiGroup = 'analgesik'|'sedatif'|'nmba';
const SEDASI_DRUGS: Record<SedasiGroup, Array<{
  name: string; class: string; dose: string; onset: string;
  duration: string; note: string; tint: string;
}>> = {
  analgesik: [
    { name:'Fentanyl', class:'Opioid', dose:'0.5–1.5 mcg/kg IV bolus; 25–200 mcg/h infus', onset:'1–2 min', duration:'30–60 min', note:'Pilihan utama ICU; histamine release minimal.', tint:'#007AFF' },
    { name:'Morfin', class:'Opioid', dose:'2–4 mg IV q2–4h', onset:'5–10 min', duration:'3–5 h', note:'Histamine release → hindari pada bronkospasme.', tint:'#5856D6' },
    { name:'Remifentanil', class:'Opioid', dose:'0.05–0.2 mcg/kg/min', onset:'<1 min', duration:'3–5 min', note:'Metabolisme ester plasma → titrasi presisi.', tint:'#30B0C7' },
  ],
  sedatif: [
    { name:'Propofol', class:'Alkylphenol', dose:'5–50 mcg/kg/min', onset:'1–2 min', duration:'5–10 min', note:'Cepat bangun, ideal neurologi; awasi PRIS (>4 mg/kg/h >48h).', tint:'#FF9500' },
    { name:'Dexmedetomidine', class:'α2-agonis', dose:'0.2–1.5 mcg/kg/h', onset:'5–10 min', duration:'1–2 h', note:'Sedasi "kooperatif", analgetik ringan, tidak depresi napas.', tint:'#34C759' },
    { name:'Midazolam', class:'Benzodiazepin', dose:'0.02–0.1 mg/kg/h', onset:'2–5 min', duration:'2–6 h', note:'Metabolit aktif → akumulasi di ginjal/hati. Hindari jangka panjang.', tint:'#FF3B30' },
    { name:'Ketamin', class:'NMDA antagonis', dose:'0.1–0.5 mg/kg/h analgesia; 1–2 mg/kg induksi', onset:'1–2 min', duration:'15–30 min', note:'Bronkodilatasi, bronkospasme, tidak depresi napas. Ideal pada asma.', tint:'#AF52DE' },
  ],
  nmba: [
    { name:'Cisatracurium', class:'Non-depolarisasi', dose:'0.15–0.2 mg/kg bolus; 1–3 mcg/kg/min', onset:'2–3 min', duration:'40–60 min', note:'Eliminasi Hofmann → aman gagal organ. Pilihan ARDS berat.', tint:'#FF2D55' },
    { name:'Rokuronum', class:'Non-depolarisasi', dose:'1.2 mg/kg RSI; 0.6 mg/kg maintenance', onset:'60 s', duration:'30–60 min', note:'Reversibel dengan Sugammadex (16 mg/kg emergensi).', tint:'#FF6B35' },
    { name:'Suksinilkolin', class:'Depolarisasi', dose:'1.5 mg/kg RSI', onset:'45–60 s', duration:'10–12 min', note:'Kontraindikasi: hiperkalemia, denervasi, luka bakar >24h.', tint:'#FF9500' },
  ],
};

const RASS_SCALE = [
  { score:+4, label:'Combative', desc:'Agresif, bahaya langsung ke staf', color:'#FF2D55' },
  { score:+3, label:'Very Agitated', desc:'Menarik atau mencabut tube/kateter, agresif', color:'#FF3B30' },
  { score:+2, label:'Agitated', desc:'Gerakan sering tanpa tujuan, melawan ventilator', color:'#FF6B35' },
  { score:+1, label:'Restless', desc:'Gelisah tapi gerakan tidak agresif', color:'#FF9500' },
  { score:0,  label:'Alert & Calm', desc:'Sadar dan tenang', color:'#34C759' },
  { score:-1, label:'Drowsy', desc:'Tidak sepenuhnya waspada, ada eye contact >10s', color:'#30B0C7' },
  { score:-2, label:'Light Sedation', desc:'Eye contact <10s terhadap suara', color:'#007AFF' },
  { score:-3, label:'Moderate Sedation', desc:'Gerakan atau buka mata tapi tidak eye contact', color:'#5856D6' },
  { score:-4, label:'Deep Sedation', desc:'Tidak respons suara, respons stimulasi fisik', color:'#AF52DE' },
  { score:-5, label:'Unarousable', desc:'Tidak respons suara maupun stimulasi fisik', color:'#8E8E93' },
];

const SEDASI_REFS: RefItem[] = [
  { n:1, text:'Devlin JW, et al. Clinical Practice Guidelines for the Prevention and Management of Pain, Agitation/Sedation, Delirium, Immobility, and Sleep Disruption in Adult Patients in the ICU. Crit Care Med. 2018;46(9):e825–e873.', url:'https://doi.org/10.1097/CCM.0000000000003299' },
  { n:2, text:'Barr J, et al. Clinical practice guidelines for the management of pain, agitation, and delirium in adult patients in the intensive care unit. Crit Care Med. 2013;41:263–306.', url:'https://doi.org/10.1097/CCM.0b013e3182783b72' },
];

function SedasiTab() {
  const [group, setGroup] = useState<SedasiGroup>('analgesik');
  const [drugIdx, setDrugIdx] = useState(0);
  const drugs = SEDASI_DRUGS[group];
  const d = drugs[Math.min(drugIdx, drugs.length-1)];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Group selector */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {([['analgesik','Analgesik','#007AFF'],['sedatif','Sedatif','#34C759'],['nmba','NMBA','#FF2D55']] as const).map(([k,lbl,c]) => (
          <button key={k} onClick={() => { setGroup(k as SedasiGroup); setDrugIdx(0); }} style={{
            border:'none', cursor:'pointer', borderRadius:12, padding:'10px 8px',
            background: group===k ? c+'18' : 'var(--fill-tertiary)',
            boxShadow: group===k ? `0 0 0 1.5px ${c}` : '0 0 0 1px var(--separator)'
          }}>
            <div className="t-caption-1" style={{ fontWeight:700, color: group===k ? c : 'var(--label-primary)' }}>{lbl}</div>
          </button>
        ))}
      </div>
      {/* Drug pills */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {drugs.map((drug,i) => (
          <button key={i} onClick={() => setDrugIdx(i)} style={{
            border:'none', cursor:'pointer', borderRadius:20, padding:'6px 14px',
            background: drugIdx===i ? drug.tint+'18' : 'var(--fill-tertiary)',
            boxShadow: drugIdx===i ? `0 0 0 1.5px ${drug.tint}` : '0 0 0 1px var(--separator)'
          }}>
            <span className="t-caption-1" style={{ fontWeight:600, color: drugIdx===i ? drug.tint : 'var(--label-primary)' }}>{drug.name}</span>
          </button>
        ))}
      </div>
      {/* Drug detail */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px', boxShadow:`0 0 0 1px ${d.tint}30` }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <div className="t-subhead" style={{ fontWeight:700, color:d.tint }}>{d.name}</div>
          <div className="t-caption-2" style={{ color:'var(--label-tertiary)', background:'var(--fill-secondary)', borderRadius:8, padding:'2px 8px' }}>{d.class}</div>
        </div>
        {[['Dosis',d.dose],['Onset',d.onset],['Durasi',d.duration]].map(([k,v]) => (
          <div key={k} style={{ display:'flex', gap:8, marginBottom:5 }}>
            <span className="t-caption-2" style={{ color:'var(--label-tertiary)', width:56, flexShrink:0, fontWeight:600 }}>{k}</span>
            <span className="t-caption-1" style={{ color:'var(--label-secondary)' }}>{v}</span>
          </div>
        ))}
        <div style={{ background:d.tint+'10', borderRadius:10, padding:'8px 10px', marginTop:8 }}>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>💡 {d.note}</div>
        </div>
      </div>
      {/* RASS Scale */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:10 }}>RASS — Richmond Agitation-Sedation Scale<Cite n={1} href="https://doi.org/10.1097/CCM.0000000000003299"/></div>
        <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginBottom:8 }}>Target ICU umum: <strong style={{color:'#30B0C7'}}>RASS -1 hingga 0</strong> (kecuali indikasi NMBA: -3 s/d -5)</div>
        {RASS_SCALE.map(r => (
          <div key={r.score} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:6 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:r.color+'20', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="t-caption-2" style={{ fontWeight:800, color:r.color }}>
                {r.score > 0 ? '+'+r.score : r.score}
              </span>
            </div>
            <div>
              <div className="t-caption-1" style={{ fontWeight:700, color:'var(--label-primary)' }}>{r.label}</div>
              <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <RefBlock items={SEDASI_REFS}/>
    </div>
  );
}

/* ============================================================
   Tab: Toksikologi Kardiovaskular
   ============================================================ */
type ToksikoKey = 'bb'|'ccb'|'dig'|'tca'|'cocaine';
const TOKSIKO_DATA: Record<ToksikoKey, {
  name: string; tint: string; ekgPattern: string;
  mechanism: string; manifestations: string[];
  treatment: string[]; antidote?: string;
}> = {
  bb: {
    name:'Beta-Blocker', tint:'#007AFF',
    ekgPattern:'Bradikardi sinus, PR memanjang, AV blok derajat tinggi',
    mechanism:'Blokade reseptor β₁ → ↓ cAMP → ↓ HR, ↓ kontraktilitas, konduksi AV melambat.',
    manifestations:['Bradikardi berat','Hipotensi','Bronkospasme (non-kardioselektif)','Hipoglikemia (pediatrik)'],
    treatment:['Atropin 0.5–1 mg IV (sering tidak cukup)','Glucagon 3–10 mg IV bolus → 3–5 mg/h infus (bypass β-reseptor)','Kalsium IV (CCa²⁺ sinergis)','High-Dose Insulin (HDI) 1 unit/kg/h + Glukosa','Lipid Emulsion Therapy (LET) jika refrakter','Pacu Jantung Transvenous'],
    antidote:'Glucagon (bypass adenilat siklase langsung)'
  },
  ccb: {
    name:'Ca Channel Blocker', tint:'#FF9500',
    ekgPattern:'Bradikardi, PR memanjang, AV blok, QRS lebar (dihidropiridin: takikardi refleks)',
    mechanism:'Blokade L-type Ca²⁺ → ↓ HR (SA/AV node), ↓ kontraktilitas, vasodilatasi.',
    manifestations:['Bradikardi & AV blok (non-DHP)','Hipotensi','Hiperglikemia (blokir sekresi insulin)','Edema paru'],
    treatment:['Kalsium Glukonat 3 g IV atau CaCl₂ 1 g IV (kompetisi reseptor)','HDI 1 unit/kg/h + glukosa','Glukagon 3–10 mg IV','Vasopressor: NE/Epi','LET','ECMO jika refrakter'],
    antidote:'Kalsium IV (kompetisi langsung di kanal L-type)'
  },
  dig: {
    name:'Digoksin', tint:'#34C759',
    ekgPattern:'Bidirectional VT, downsloping ST (digitalis effect), AV blok, bradikardi, takiaritmia',
    mechanism:'Inhibisi Na⁺/K⁺-ATPase → ↑ Ca²⁺ intrasel → inotropik +; pada toksisitas: afterdepolarization, triggered activity.',
    manifestations:['Mual/muntah (GI awal)','Bidirectional VT (patognomonik)','AV blok + irama junctional','Hiperkalemia (marker severity)'],
    treatment:['Hentikan digoksin','Koreksi hipokalemia/hipomagnesemia (permissive)','Atropin bradikardi','Lidokain atau fenitoin (VT — hindari amiodarone)','Digoxin-Specific Fab Fragments (DigiFab)'],
    antidote:'DigiFab — Fab antibodi spesifik digoksin'
  },
  tca: {
    name:'Antidepresan Trisiklik', tint:'#AF52DE',
    ekgPattern:'QRS lebar >100 ms, R wave tinggi di aVR, RBBB-like, QTc panjang, sinus takikardi',
    mechanism:'Blokade fast Na⁺ (QRS ↑), blokade K⁺ (QT ↑), blokade α1 (hipotensi), antikolinergik, blokade H1.',
    manifestations:['Takikardi & hipotensi','QRS ≥120 ms → seizure/aritmia','Antikolinergik: delirium, retensi urin, midriasis','Status epileptikus'],
    treatment:['NaHCO₃ 1–2 mEq/kg IV → alkalinisasi (target pH 7.50–7.55, narrow QRS)','Intubasi & hiperventilasi jika perlu','Benzodiazepin untuk seizure','Hindari Ia & Ic antiaritmia'],
    antidote:'Natrium Bikarbonat (alkalinisasi serum)'
  },
  cocaine: {
    name:'Kokain / Stimulan', tint:'#FF2D55',
    ekgPattern:'ST elevasi (vasospasme), sinus takikardi, QRS/QTc normal atau sedikit memanjang',
    mechanism:'Blokade reuptake NE/DA → simpatomimetik; blokade Na⁺ channel → efek membran lokal.',
    manifestations:['Vasospasme koroner → STEMI tanpa plak','Hipertensi krisis','Aortic dissection','Kardiomiopati'],
    treatment:['Benzodiazepine (first-line semua komplikasi)','Nitrogliserin / CCB untuk vasospasme','Aspirin jika komponen trombosis','HINDARI β-blocker (beta-blockade unmasks α → paradoks vasokonstriksi)'],
  },
};

const TOKSIKO_REFS: RefItem[] = [
  { n:1, text:'Holstege CP, et al. Toxicologic Emergencies. Rosen\'s Emergency Medicine. 9th ed. 2018.', url:'https://doi.org/10.1016/B978-0-323-35479-3.00147-8' },
  { n:2, text:'Engebretsen KM, et al. High-dose insulin therapy in beta-blocker and calcium channel-blocker poisoning. Clin Toxicol. 2011;49(4):277–83.', url:'https://doi.org/10.3109/15563650.2011.582471' },
  { n:3, text:'Taboulet P, et al. Cardiovascular repercussions of seizures during cyclic antidepressant poisoning. J Toxicol Clin Toxicol. 1995;33(3):205–11.', url:'https://doi.org/10.3109/15563659509000468' },
];

function ToksikoTab() {
  const [key, setKey] = useState<ToksikoKey>('bb');
  const d = TOKSIKO_DATA[key];
  const pills: [ToksikoKey, string][] = [['bb','β-Blocker'],['ccb','CCB'],['dig','Digoksin'],['tca','TCA'],['cocaine','Kokain']];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Pill selector */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {pills.map(([k,lbl]) => {
          const t = TOKSIKO_DATA[k].tint;
          return (
            <button key={k} onClick={() => setKey(k)} style={{
              border:'none', cursor:'pointer', borderRadius:20, padding:'7px 16px',
              background: key===k ? t+'18' : 'var(--fill-tertiary)',
              boxShadow: key===k ? `0 0 0 1.5px ${t}` : '0 0 0 1px var(--separator)'
            }}>
              <span className="t-caption-1" style={{ fontWeight:600, color: key===k ? t : 'var(--label-primary)' }}>{lbl}</span>
            </button>
          );
        })}
      </div>
      {/* EKG Pattern */}
      <div style={{ background:d.tint+'10', borderRadius:14, padding:'12px 16px', boxShadow:`0 0 0 1px ${d.tint}30` }}>
        <div className="t-caption-2" style={{ color:d.tint, fontWeight:700, marginBottom:4 }}>EKG PATTERN</div>
        <div className="t-caption-1" style={{ color:'var(--label-primary)', lineHeight:1.5 }}>{d.ekgPattern}</div>
      </div>
      {/* Mechanism */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'12px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:4 }}>MEKANISME</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>{d.mechanism}</div>
      </div>
      {/* Manifestations */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'12px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:6 }}>MANIFESTASI KLINIS</div>
        {d.manifestations.map((m,i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5 }}>
            <div style={{ width:6, height:6, borderRadius:3, background:d.tint, flexShrink:0, marginTop:5 }}/>
            <div className="t-caption-1" style={{ color:'var(--label-primary)', lineHeight:1.5 }}>{m}</div>
          </div>
        ))}
      </div>
      {/* Treatment */}
      <div style={{ background:'rgba(52,199,89,0.06)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 1px rgba(52,199,89,0.2)' }}>
        <div className="t-caption-2" style={{ color:'#34C759', fontWeight:700, marginBottom:6 }}>TATALAKSANA</div>
        {d.treatment.map((t,i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5 }}>
            <div className="t-caption-2" style={{ color:'#34C759', fontWeight:700, flexShrink:0, width:16 }}>{i+1}.</div>
            <div className="t-caption-1" style={{ color:'var(--label-primary)', lineHeight:1.5 }}>{t}</div>
          </div>
        ))}
        {d.antidote && (
          <div style={{ background:'rgba(52,199,89,0.12)', borderRadius:10, padding:'8px 10px', marginTop:8 }}>
            <div className="t-caption-2" style={{ color:'#34C759', fontWeight:700 }}>ANTIDOT SPESIFIK</div>
            <div className="t-caption-1" style={{ color:'var(--label-primary)', marginTop:2 }}>{d.antidote}</div>
          </div>
        )}
      </div>
      <RefBlock items={TOKSIKO_REFS}/>
    </div>
  );
}

/* ============================================================
   Tab: Koagulasi & Antikoagulan
   ============================================================ */
const CASCADE_STEPS = [
  { label:'Jalur Ekstrinsik', items:['TF + VIIa → Xa + IXa'], color:'#FF9500' },
  { label:'Jalur Intrinsik', items:['XII → XI → IX → IXa'], color:'#007AFF' },
  { label:'Jalur Bersama', items:['Xa + Va → Protrombin → Trombin'], color:'#AF52DE' },
  { label:'Fibrin', items:['Trombin: Fibrinogen → Fibrin','XIII → Fibrin cross-linked (clot)'], color:'#34C759' },
];

type AKKey = 'heparin'|'lmwh'|'warfarin'|'noac';
const ANTICOAG_DATA: Record<AKKey, {
  name: string; tint: string; target: string;
  monitor: string; onset: string; reversal: string; indication: string;
}> = {
  heparin: {
    name:'Heparin UFH', tint:'#007AFF',
    target:'AT-III → inhibisi trombin (IIa) + Xa',
    monitor:'aPTT 60–100 s (1.5–2.5× normal)',
    onset:'Immediat IV',
    reversal:'Protamine sulfate 1 mg per 100 unit heparin',
    indication:'ACS, PE/DVT akut, bypass, ECMO'
  },
  lmwh: {
    name:'LMWH (Enoxaparin)', tint:'#34C759',
    target:'AT-III → inhibisi Xa > IIa',
    monitor:'Anti-Xa (jika perlu: obesitas, gagal ginjal)',
    onset:'1–2 jam SC',
    reversal:'Protamine ~50% efektif',
    indication:'ACS, tromboprofilaksis, DVT/PE'
  },
  warfarin: {
    name:'Warfarin', tint:'#FF9500',
    target:'Inhibisi vitamin K epoksida reduktase → ↓ II, VII, IX, X',
    monitor:'INR (target 2–3; 2.5–3.5 katup prostetik)',
    onset:'2–5 hari',
    reversal:'4F-PCC (Prothrombinex) + Vit K IV; FFP jika PCC tidak ada',
    indication:'AF, tromboprofilaksis jangka panjang, katup mekanik'
  },
  noac: {
    name:'NOAC (Rivaroxaban / Apixaban / Dabigatran)', tint:'#AF52DE',
    target:'Direct Xa inhibitor (Rivaroxaban, Apixaban) atau Direct trombin inhibitor (Dabigatran)',
    monitor:'Tidak rutin (PT/aPTT tidak reliabel)',
    onset:'1–4 jam',
    reversal:'Andexanet alfa (anti-Xa); Idarucizumab (Dabigatran); PCC 4F jika tidak ada',
    indication:'AF non-valvular, DVT/PE (prevention & treatment)'
  },
};

const KOAGULASI_REFS: RefItem[] = [
  { n:1, text:'Levi M, Hunt BJ. A critical appraisal of point-of-care coagulation testing in critically ill patients. J Thromb Haemost. 2015;13(11):1960–7.', url:'https://doi.org/10.1111/jth.13151' },
  { n:2, text:'Piran S, Schulman S. Management of anticoagulant-associated bleeding. Thromb Res. 2012;130(S1):S29–S31.', url:'https://doi.org/10.1016/j.thromres.2012.08.264' },
  { n:3, text:'Connolly SJ, et al. Andexanet Alfa for Acute Major Bleeding Associated with Factor Xa Inhibitors. N Engl J Med. 2019;380:1326–35.', url:'https://doi.org/10.1056/NEJMoa1814051' },
];

function KoagulasiTab() {
  const [akKey, setAkKey] = useState<AKKey>('heparin');
  const d = ANTICOAG_DATA[akKey];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Coagulation cascade visual */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:10 }}>KASKADE KOAGULASI</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {CASCADE_STEPS.map((s,i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:4, alignSelf:'stretch', borderRadius:2, background:s.color, flexShrink:0 }}/>
              <div>
                <div className="t-caption-2" style={{ color:s.color, fontWeight:700, marginBottom:2 }}>{s.label}</div>
                {s.items.map((item,j) => (
                  <div key={j} className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, background:'rgba(52,199,89,0.06)', borderRadius:10, padding:'8px 12px' }}>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>
            <strong style={{color:'#34C759'}}>Lab:</strong> PT/INR (ekstrinsik + bersama), aPTT (intrinsik + bersama), TT (fibrin step), fibrinogen (Clauss).
          </div>
        </div>
      </div>
      {/* Anticoagulant selector */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {(Object.keys(ANTICOAG_DATA) as AKKey[]).map(k => {
          const item = ANTICOAG_DATA[k];
          const active = akKey === k;
          return (
            <button key={k} onClick={() => setAkKey(k)} style={{
              border:'none', cursor:'pointer', borderRadius:14, padding:'10px 12px', textAlign:'left',
              background: active ? item.tint+'18' : 'var(--fill-tertiary)',
              boxShadow: active ? `0 0 0 1.5px ${item.tint}` : '0 0 0 1px var(--separator)'
            }}>
              <div className="t-caption-1" style={{ fontWeight:700, color: active ? item.tint : 'var(--label-primary)' }}>{item.name}</div>
            </button>
          );
        })}
      </div>
      {/* Anticoagulant detail */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px', boxShadow:`0 0 0 1px ${d.tint}30` }}>
        <div className="t-subhead" style={{ color:d.tint, fontWeight:700, marginBottom:8 }}>{d.name}</div>
        {([['Target',d.target],['Monitor',d.monitor],['Onset',d.onset],['Indikasi',d.indication]] as [string,string][]).map(([k,v]) => (
          <div key={k} style={{ marginBottom:7 }}>
            <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700 }}>{k}</div>
            <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>{v}</div>
          </div>
        ))}
        <div style={{ background:'rgba(255,59,48,0.08)', borderRadius:10, padding:'10px 12px', marginTop:4, boxShadow:'0 0 0 1px rgba(255,59,48,0.2)' }}>
          <div className="t-caption-2" style={{ color:'#FF3B30', fontWeight:700, marginBottom:3 }}>REVERSAL / ANTIDOT</div>
          <div className="t-caption-1" style={{ color:'var(--label-primary)', lineHeight:1.5 }}>{d.reversal}</div>
        </div>
      </div>
      {/* DIC quick note */}
      <div style={{ background:'rgba(255,45,85,0.06)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 1px rgba(255,45,85,0.2)' }}>
        <div className="t-caption-2" style={{ color:'#FF2D55', fontWeight:700, marginBottom:4 }}>DIC — Disseminated Intravascular Coagulation</div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.55 }}>
          Aktivasi koagulasi sistemik (sepsis, trauma, obstetri) → konsumsi faktor → perdarahan + trombosis mikrovaskular.
          Lab: ↓ fibrinogen, ↓ platelet, ↑ PT/aPTT, ↑ D-dimer.
          Terapi: atasi penyebab + FFP + kriopresipitat + platelet.
        </div>
      </div>
      <RefBlock items={KOAGULASI_REFS}/>
    </div>
  );
}

/* ============================================================
   Tab: Respirasi & Oksigenasi
   ============================================================ */
const HYPOXIA_TYPES: Array<{
  key: string; name: string; tint: string;
  mechanism: string; pao2: string; sao2: string; cao2: string; example: string;
}> = [
  { key:'hypoxic', name:'Hipoksik', tint:'#FF3B30',
    mechanism:'↓ PaO₂ — pengiriman O₂ ke alveolus tidak cukup atau V/Q mismatch',
    pao2:'↓', sao2:'↓', cao2:'↓',
    example:'Pneumonia, PE, ARDS, dataran tinggi, hipoventilasi' },
  { key:'anemic', name:'Anemik', tint:'#FF9500',
    mechanism:'↓ [Hb] — pembawa O₂ kurang meski PaO₂ normal',
    pao2:'N', sao2:'N', cao2:'↓',
    example:'Anemia berat, perdarahan akut, CO poisoning' },
  { key:'circulatory', name:'Sirkulasi', tint:'#AF52DE',
    mechanism:'↓ CO — DO₂ turun meski CaO₂ normal (demand > supply)',
    pao2:'N', sao2:'N', cao2:'N',
    example:'Syok kardiogenik, PEA, gagal jantung berat' },
  { key:'histotoxic', name:'Histotoksik', tint:'#34C759',
    mechanism:'Sel tidak mampu menggunakan O₂ — mitokondria dihambat',
    pao2:'N', sao2:'N', cao2:'N',
    example:'Sianida, keracunan CO₂ tinggi, sepsis berat' },
];

const OXY_CURVE_POINTS = [
  { po2:10, sat:13 },{ po2:20, sat:35 },{ po2:27, sat:50 },{ po2:40, sat:75 },
  { po2:50, sat:83 },{ po2:60, sat:89 },{ po2:80, sat:95 },{ po2:100, sat:98 },
  { po2:150, sat:99 },
];

const RESP_REFS: RefItem[] = [
  { n:1, text:'West JB. Respiratory Physiology: The Essentials. 10th ed. Wolters Kluwer; 2016.', url:'https://doi.org/10.1097/00005373-197405000-00008' },
  { n:2, text:'Barcroft J. The Respiratory Function of the Blood. Cambridge UP; 1914. (Classic: 4 types of hypoxia)' },
  { n:3, text:'Marino PL. The ICU Book. 4th ed. Lippincott Williams & Wilkins; 2014. Ch. 1–4.' },
];

function RespirasiTab() {
  const [hType, setHType] = useState(0);
  const ht = HYPOXIA_TYPES[hType];
  const W = 260; const H = 130; const PAD = 20;
  const toX = (po2: number) => PAD + (po2/160)*(W - PAD*2);
  const toY = (sat: number) => H - PAD - (sat/100)*(H - PAD*2);
  const pathD = OXY_CURVE_POINTS.map((p,i) => `${i===0?'M':'L'}${toX(p.po2).toFixed(1)},${toY(p.sat).toFixed(1)}`).join(' ');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* DO2 equation */}
      <div style={{ background:'rgba(0,122,255,0.06)', borderRadius:14, padding:'14px 16px', boxShadow:'0 0 0 1px rgba(0,122,255,0.2)' }}>
        <div className="t-caption-2" style={{ color:'#007AFF', fontWeight:700, marginBottom:6 }}>PERSAMAAN DO₂ (Oxygen Delivery)<Cite n={1} href="https://doi.org/10.1097/00005373-197405000-00008"/></div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--label-primary)', marginBottom:8, lineHeight:1.7 }}>
          DO₂ = CO × CaO₂ × 10<br/>
          CaO₂ = (Hb × 1.34 × SaO₂) + (PaO₂ × 0.0031)
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          {[['Normal DO₂','950–1150 mL/min'],['VO₂ konsumsi','200–250 mL/min'],['EO₂ ratio','~25%']].map(([k,v]) => (
            <div key={k} style={{ background:'var(--fill-tertiary)', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
              <div className="t-caption-2" style={{ color:'var(--label-tertiary)' }}>{k}</div>
              <div className="t-caption-1" style={{ color:'var(--label-primary)', fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Oxyhemoglobin curve */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:8 }}>KURVA DISOSIASI OKSIHEMOGLOBIN</div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
          {/* Grid lines */}
          {[25,50,75,100].map(s => (
            <line key={s} x1={PAD} x2={W-PAD} y1={toY(s)} y2={toY(s)} stroke="var(--separator)" strokeWidth="0.5"/>
          ))}
          {[40,80,120,160].map(p => (
            <line key={p} x1={toX(p)} x2={toX(p)} y1={PAD} y2={H-PAD} stroke="var(--separator)" strokeWidth="0.5"/>
          ))}
          {/* Curve */}
          <path d={pathD} fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* P50 marker */}
          <circle cx={toX(27)} cy={toY(50)} r={4} fill="#FF9500"/>
          <text x={toX(27)+6} y={toY(50)-5} fontSize="9" fill="#FF9500" fontWeight="bold">P50=27</text>
          {/* SpO2 90% marker */}
          <circle cx={toX(60)} cy={toY(90)} r={3} fill="#34C759"/>
          <text x={toX(60)+5} y={toY(90)-4} fontSize="8" fill="#34C759">SpO₂90%@PO₂60</text>
          {/* Axes labels */}
          <text x={W/2} y={H-2} fontSize="9" fill="var(--label-tertiary)" textAnchor="middle">PaO₂ (mmHg)</text>
          <text x={8} y={H/2} fontSize="9" fill="var(--label-tertiary)" textAnchor="middle" transform={`rotate(-90,8,${H/2})`}>SaO₂ (%)</text>
        </svg>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
          <div style={{ background:'rgba(255,59,48,0.08)', borderRadius:10, padding:'8px 10px' }}>
            <div className="t-caption-2" style={{ color:'#FF3B30', fontWeight:700 }}>Kurva KANAN (↓ afinitas)</div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>↑ Temp, ↑ CO₂, ↑ 2,3-DPG, ↓ pH → O₂ mudah lepas ke jaringan</div>
          </div>
          <div style={{ background:'rgba(0,122,255,0.08)', borderRadius:10, padding:'8px 10px' }}>
            <div className="t-caption-2" style={{ color:'#007AFF', fontWeight:700 }}>Kurva KIRI (↑ afinitas)</div>
            <div className="t-caption-2" style={{ color:'var(--label-secondary)' }}>↓ Temp, ↓ CO₂, ↓ 2,3-DPG, ↑ pH, CO poisoning → O₂ terikat kuat</div>
          </div>
        </div>
      </div>
      {/* Barcroft 4 types of hypoxia */}
      <div style={{ background:'var(--fill-tertiary)', borderRadius:14, padding:'14px 16px' }}>
        <div className="t-caption-2" style={{ color:'var(--label-tertiary)', fontWeight:700, marginBottom:8 }}>4 TIPE HIPOKSIA (Barcroft)<Cite n={2}/></div>
        {/* Type selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          {HYPOXIA_TYPES.map((h,i) => (
            <button key={h.key} onClick={() => setHType(i)} style={{
              border:'none', cursor:'pointer', borderRadius:10, padding:'8px 12px', textAlign:'left',
              background: hType===i ? h.tint+'18' : 'var(--fill-secondary)',
              boxShadow: hType===i ? `0 0 0 1.5px ${h.tint}` : '0 0 0 1px var(--separator)'
            }}>
              <div className="t-caption-1" style={{ fontWeight:700, color: hType===i ? h.tint : 'var(--label-primary)' }}>{h.name}</div>
            </button>
          ))}
        </div>
        {/* Selected type detail */}
        <div style={{ background:ht.tint+'08', borderRadius:12, padding:'12px 14px' }}>
          <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginBottom:8, lineHeight:1.5 }}>{ht.mechanism}</div>
          {/* PaO2/SaO2/CaO2 indicator */}
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            {[['PaO₂',ht.pao2],['SaO₂',ht.sao2],['CaO₂',ht.cao2]].map(([k,v]) => (
              <div key={k} style={{ flex:1, background:'var(--fill-tertiary)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                <div className="t-caption-2" style={{ color:'var(--label-tertiary)' }}>{k}</div>
                <div className="t-callout" style={{ fontWeight:800, color: v==='↓' ? '#FF3B30' : v==='↑' ? '#34C759' : 'var(--label-secondary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="t-caption-2" style={{ color:ht.tint, fontWeight:600 }}>Contoh: {ht.example}</div>
        </div>
      </div>
      {/* A-a gradient */}
      <div style={{ background:'rgba(48,176,199,0.06)', borderRadius:14, padding:'12px 16px', boxShadow:'0 0 0 1px rgba(48,176,199,0.2)' }}>
        <div className="t-caption-2" style={{ color:'#30B0C7', fontWeight:700, marginBottom:4 }}>A-a GRADIENT</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--label-primary)', marginBottom:6 }}>
          PAO₂ = FiO₂×(Patm−PH₂O) − PaCO₂/RQ<br/>
          A-a = PAO₂ − PaO₂ (normal &lt;15 mmHg)
        </div>
        <div className="t-caption-1" style={{ color:'var(--label-secondary)', lineHeight:1.5 }}>
          A-a ↑ → shunt, V/Q mismatch, difusi terganggu (pneumonia, ARDS, PE).
          A-a normal → hipoventilasi murni, FiO₂ rendah.
        </div>
      </div>
      <RefBlock items={RESP_REFS}/>
    </div>
  );
}

/* ============================================================
   Theory Screen — shared mobile + desktop layout
   ============================================================ */
const THEORY_TABS = [
  { key:'cycle',      label:'Siklus Jantung',    sub:'Sistol, diastol, tekanan',          tint:'#FF3B30' },
  { key:'ap',         label:'Aksi Potensial',    sub:'Fase 0–4, ion channel',             tint:'#FF9500' },
  { key:'ec',         label:'E-C Coupling',      sub:'Kalsium, troponin, cross-bridge',   tint:'#FF6B35' },
  { key:'hemo',       label:'Hemodinamik',       sub:'CO, SVR, preload, afterload',       tint:'#007AFF' },
  { key:'ans',        label:'Otonom',            sub:'SNS/PNS, baroreflex, vagal',        tint:'#34C759' },
  { key:'vasopress',  label:'Vasopressor',       sub:'Reseptor α/β, profil obat',         tint:'#30B0C7' },
  { key:'arrhythmia', label:'Mekanisme Aritmia', sub:'Reentry, ektopik, otomatisitas',    tint:'#AF52DE' },
  { key:'pharm',      label:'Farmakologi',       sub:'Antiaritmia kelas I–IV',            tint:'#5856D6' },
  { key:'acs',        label:'Patofisiologi ACS', sub:'Plak, trombosis, STEMI vs NSTEMI',  tint:'#FF2D55' },
  { key:'shock',      label:'Jenis Syok',        sub:'Distributif, kardiogenik, obstruktif', tint:'#FF3B30' },
  { key:'electrolyte',label:'Elektrolit & EKG',  sub:'K⁺, Ca²⁺, Mg²⁺, Na⁺',            tint:'#00C7BE' },
  { key:'ekg12',      label:'EKG 12-Sadapan',   sub:'Sadapan, aksis, morfologi',         tint:'#34C759' },
  { key:'pocus',      label:'POCUS',             sub:'Eko bedside, 4 views',             tint:'#007AFF' },
  { key:'postarrest', label:'Post-Arrest',       sub:'PCAS, TTM, neuroproteksi',          tint:'#FF9500' },
  { key:'ventmek',   label:'Ventilasi Mekanik', sub:'Mode, setting, weaning',             tint:'#5856D6' },
  { key:'sedasi',    label:'Sedasi & Analgesia', sub:'RASS, propofol, dexmed, NMBA',      tint:'#AF52DE' },
  { key:'toksiko',   label:'Toksikologi Kardio', sub:'BB/CCB/digoksin overdosis',         tint:'#FF2D55' },
  { key:'koagulasi', label:'Koagulasi & Antikoagulan', sub:'Heparin, warfarin, NOAC, reversal', tint:'#FF9500' },
  { key:'respirasi', label:'Respirasi & Oksigenasi', sub:'DO₂, hipoksia, kurva disosiasi Hb', tint:'#30B0C7' },
];

interface TheoryScreenProps { nav?: Nav; isMobile?: boolean; }

export function TheoryScreen({ nav, isMobile = false }: TheoryScreenProps) {
  const [tab, setTab] = useState('cycle');
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeTab = THEORY_TABS.find(t => t.key === tab) || THEORY_TABS[0];
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectTab = (key: string) => {
    haptic.monitorOn();
    setTab(key);
    setSheetOpen(false);
    // Reset scroll to top so new content is visible from beginning
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }), 0);
  };

  const TheoryContent = () => (
    <>
      {tab==='cycle'      && <CardiacCycleTab/>}
      {tab==='ap'         && <ActionPotentialTab/>}
      {tab==='ec'         && <ECCouplingTab/>}
      {tab==='hemo'       && <HemodynamicsTab/>}
      {tab==='ans'        && <ANSTab/>}
      {tab==='vasopress'  && <VasopressorPharmTab/>}
      {tab==='arrhythmia' && <ArrhythmiaMechanismTab/>}
      {tab==='pharm'      && <AntiarrhythmicPharmTab/>}
      {tab==='acs'        && <ACSPathophysTab/>}
      {tab==='shock'      && <ShockTypesTab/>}
      {tab==='electrolyte'&& <ElectrolyteTab/>}
      {tab==='ekg12'      && <Ekg12LeadTab/>}
      {tab==='pocus'      && <PocusTab/>}
      {tab==='postarrest' && <PostArrestTab/>}
      {tab==='ventmek'    && <VentMekTab/>}
      {tab==='sedasi'     && <SedasiTab/>}
      {tab==='toksiko'    && <ToksikoTab/>}
      {tab==='koagulasi'  && <KoagulasiTab/>}
      {tab==='respirasi'  && <RespirasiTab/>}
    </>
  );

  if (isMobile) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'var(--bg-secondary)' }}>
        {nav && <NavBar title="Teori Jantung" back="Kembali" onBack={nav.pop}/>}

        {/* Single scroll container — sticky header lives INSIDE so it actually sticks */}
        <div ref={scrollRef} style={{ flex:1, overflowY:'auto' }}>
          {/* Sticky header with dropdown trigger */}
          <div style={{ position:'sticky', top:0, zIndex:10, background:'var(--bg-primary)', borderBottom:'0.5px solid var(--separator)', padding:'10px 16px 12px' }}>
            <div className="t-caption-2" style={{ color:'var(--label-tertiary)', marginBottom:6 }}>
              TOPIK TEORI · {THEORY_TABS.indexOf(activeTab) + 1} / {THEORY_TABS.length}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%',
                background:'var(--fill-quaternary)', border:'none', borderRadius:14,
                padding:'11px 14px', cursor:'pointer', textAlign:'left',
                boxShadow:'inset 0 0 0 0.5px var(--separator)',
              }}
            >
              <span style={{ width:10, height:10, borderRadius:5, background:activeTab.tint, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="t-callout" style={{ fontWeight:700, color:'var(--label-primary)' }}>{activeTab.label}</div>
                <div className="t-caption-2" style={{ color:'var(--label-secondary)', marginTop:1 }}>{activeTab.sub}</div>
              </div>
              <Icons.chevDown size={16} stroke={2.5} style={{ color:'var(--label-tertiary)', flexShrink:0 }}/>
            </button>
          </div>

          {/* Content */}
          <div style={{ padding:'14px 16px 40px' }}>
            <TheoryContent/>
          </div>
        </div>

        {/* Bottom sheet picker */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Pilih Topik" height="82%">
          <div style={{ padding:'0 16px 32px', display:'flex', flexDirection:'column', gap:4 }}>
            {THEORY_TABS.map((t, i) => {
              const isActive = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => selectTab(t.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'13px 14px',
                    borderRadius:14, border:'none', cursor:'pointer', textAlign:'left',
                    background: isActive ? t.tint + '18' : 'var(--fill-quaternary)',
                    boxShadow: isActive ? `inset 0 0 0 1px ${t.tint}55` : 'inset 0 0 0 0.5px var(--separator)',
                    transition:'background 120ms',
                  }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:t.tint + '20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ width:10, height:10, borderRadius:5, background:t.tint }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.9375rem', fontWeight: isActive ? 700 : 500, color: isActive ? t.tint : 'var(--label-primary)', lineHeight:1.3 }}>{t.label}</div>
                    <div className="t-caption-1" style={{ color:'var(--label-secondary)', marginTop:2 }}>{t.sub}</div>
                  </div>
                  {isActive && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.tint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  <span style={{ fontSize:'0.75rem', color:'var(--label-quaternary)', flexShrink:0 }}>{i + 1}</span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'var(--bg-secondary)' }}>
      {/* Non-mobile: horizontal tab strip (used by TheoryScreen in non-mobile context if ever) */}
      <div style={{ padding:'16px 20px 0', flexShrink:0 }}>
        <div className="t-title-2" style={{ fontWeight:700, marginBottom:2 }}>Teori Jantung</div>
        <div className="t-footnote" style={{ color:'var(--label-secondary)', marginBottom:12 }}>
          Fisiologi kardiovaskular esensial untuk ACLS
        </div>
        <div className="theory-tab-strip">
          {THEORY_TABS.map(t => (
            <button key={t.key} onClick={() => selectTab(t.key)} style={{
              padding:'0 16px', borderRadius:20, border:'none', cursor:'pointer',
              background: tab===t.key ? 'var(--accent)' : 'var(--fill-quaternary)',
              color: tab===t.key ? '#fff' : 'var(--label-secondary)',
              fontSize:'0.8125rem', fontWeight: tab===t.key ? 600 : 400,
              transition:'background 150ms ease, color 150ms ease',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 40px' }}>
        <TheoryContent/>
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
          <button key={t.key} onClick={() => { haptic.monitorOn(); setTab(t.key); }}
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
          {tab==='ec'         && <ECCouplingTab/>}
          {tab==='hemo'       && <HemodynamicsTab/>}
          {tab==='ans'        && <ANSTab/>}
          {tab==='vasopress'  && <VasopressorPharmTab/>}
          {tab==='arrhythmia' && <ArrhythmiaMechanismTab/>}
          {tab==='pharm'      && <AntiarrhythmicPharmTab/>}
          {tab==='acs'        && <ACSPathophysTab/>}
          {tab==='shock'      && <ShockTypesTab/>}
          {tab==='electrolyte'&& <ElectrolyteTab/>}
          {tab==='ekg12'      && <Ekg12LeadTab/>}
          {tab==='pocus'      && <PocusTab/>}
          {tab==='postarrest' && <PostArrestTab/>}
          {tab==='ventmek'    && <VentMekTab/>}
          {tab==='sedasi'     && <SedasiTab/>}
          {tab==='toksiko'    && <ToksikoTab/>}
          {tab==='koagulasi'  && <KoagulasiTab/>}
          {tab==='respirasi'  && <RespirasiTab/>}
        </div>
      </div>
    </div>
  );
}
