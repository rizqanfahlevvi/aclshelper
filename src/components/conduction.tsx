import React, { useState, useEffect } from 'react';

/* ============================================================
   EkgConductionPanel + diagram sistem konduksi jantung.
   Diekstrak dari screens/theory agar tidak menarik seluruh layar
   Teori (3567 baris) ke chunk utama saat dipakai di detail Pustaka
   EKG (mobile & desktop). Hanya bergantung pada React.
   ============================================================ */

/* ---- Types & Colors --------------------------------------- */
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
  active:'#1E8E3E', blocked:'#BA1A1A', ectopic:'#FFA000', inactive:'#8E8E93', dim:'#8E8E93',
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

/* ---- SVG path constants (viewBox 0 0 300 240) ------------- */
const P_SA_AV='M258,39 C228,52 195,66 150,79';
const P_HIS='M150,83 L150,112';
const P_LBB='M150,112 L92,152';
const P_RBB='M150,112 L208,152';
const P_LBB_P1='M92,152 L66,202';
const P_LBB_P2='M92,152 L100,208';
const P_RBB_P1='M208,152 L222,202';
const P_RBB_P2='M208,152 L234,207';
const P_ACCESS='M258,39 Q286,95 268,140 Q258,162 208,152';

/* ---- Beat-synced dot -------------------------------------- */
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

/* ---- Conduction SVG diagram ------------------------------- */
function ConductionSVG({ state,beatKey }:{
  state:ConductionState;beatKey:number;
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

/* ---- EkgConductionPanel (dipakai di detail Pustaka EKG) --- */
export function EkgConductionPanel({ rhythmKey }: { rhythmKey: string }) {
  const state = CONDUCTION_MAP[rhythmKey];
  const [beatKey, setBeatKey] = useState(0);
  // Remount setiap ~8 siklus untuk mencegah drift animasi
  useEffect(() => {
    if (!state || state.beatMs <= 0) return;
    const id = setInterval(() => setBeatKey(k => k + 1), state.beatMs * 8 + 500);
    return () => clearInterval(id);
  }, [state]);
  if (!state) return null;
  return (
    <div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 10px 8px',
        boxShadow: '0 0 0 0.5px var(--separator-opaque)' }}>
        <ConductionSVG state={state} beatKey={beatKey}/>
        {/* Legend inline */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, paddingTop: 8,
          borderTop: '0.5px solid var(--separator)' }}>
          {([['#1E8E3E','Aktif'],['#BA1A1A','Blok'],['#FFA000','Ektopik'],['#8E8E93','Inaktif']] as const).map(([col,label])=>(
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
