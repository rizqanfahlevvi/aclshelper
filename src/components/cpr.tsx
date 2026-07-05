import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './base';
import { sfx } from '../utils/sfx';
import { haptic } from '../utils/haptic';
import type { FlowStep as FlowStepType, CprRhythm, LogEntry, Rhythm } from '../types';

/* ============================================================
   CPRTimer — full-screen workspace with AHA decision tree
   ============================================================ */

const CPR_BPM_CONT = 110;  // continuous (airway definitif terpasang)
const CPR_BPM_RATIO = 100; // rasio 30:2 (tanpa airway definitif)

// Hook: visual compression counter for 30:2 mode (independent of audio)
function useCompCounter(active: boolean): { count: number; venting: boolean } {
  const [count, setCount] = useState(0);
  const [venting, setVenting] = useState(false);

  useEffect(() => {
    if (!active) { setCount(0); setVenting(false); return; }
    let c = 0;
    let ventTimer: ReturnType<typeof setTimeout> | null = null;
    let compTimer: ReturnType<typeof setInterval> | null = null;

    const startCompressing = () => {
      compTimer = setInterval(() => {
        c = (c % 30) + 1;
        setCount(c);
        if (c === 30) {
          if (compTimer) clearInterval(compTimer);
          compTimer = null;
          setVenting(true);
          ventTimer = setTimeout(() => {
            setVenting(false);
            c = 0;
            startCompressing();
          }, 3000);
        }
      }, Math.round(60000 / CPR_BPM_RATIO)); // 600ms @ 100 BPM
    };

    startCompressing();
    return () => {
      if (compTimer) clearInterval(compTimer);
      if (ventTimer) clearTimeout(ventTimer);
    };
  }, [active]);

  return { count, venting };
}

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

// Returns incrementing key each interval — use as key={} prop to restart CSS animation
function usePushFlash(active: boolean, intervalMs: number): number {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setKey(k => k + 1), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return key;
}

function useVentPulse(active: boolean): number {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setKey(k => k + 1), 6000);
    return () => clearInterval(id);
  }, [active]);
  return key;
}

function useMetronome(active: boolean, intubated: boolean) {
  const ctxRef = useRef<AudioContext|null>(null);
  const schedRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const nextRef = useRef(0);
  const tickRef = useRef(0);      // compression count for 30:2
  const ventUntilRef = useRef(0); // audio time when vent pause ends

  const stop = () => {
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null; }
    tickRef.current = 0;
    ventUntilRef.current = 0;
  };

  useEffect(() => {
    if (!active) { stop(); return; }
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const bpm = intubated ? CPR_BPM_CONT : CPR_BPM_RATIO;
      const interval = 60 / bpm;
      nextRef.current = ctx.currentTime + 0.05;
      tickRef.current = 0;
      ventUntilRef.current = 0;

      const schedule = () => {
        const ctx2 = ctxRef.current;
        if (!ctx2) return;
        while (nextRef.current < ctx2.currentTime + 0.3) {
          // In ventilation pause — jump ahead to end of pause
          if (!intubated && nextRef.current < ventUntilRef.current) {
            nextRef.current = ventUntilRef.current;
            tickRef.current = 0;
          }
          try {
            const osc = ctx2.createOscillator();
            const gain = ctx2.createGain();
            osc.connect(gain); gain.connect(ctx2.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(1.0, nextRef.current);
            gain.gain.exponentialRampToValueAtTime(0.001, nextRef.current + 0.09);
            osc.start(nextRef.current); osc.stop(nextRef.current + 0.10);
          } catch(_) {}
          nextRef.current += interval;
          if (!intubated) {
            tickRef.current++;
            if (tickRef.current >= 30) {
              ventUntilRef.current = nextRef.current + 3.0;
              nextRef.current += 3.0;
              tickRef.current = 0;
            }
          }
        }
      };
      schedule();
      schedRef.current = setInterval(schedule, 100);
    } catch(_) {}
    return stop;
  }, [active, intubated]);
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

function CprAnimator({
  intubated, cprCount, cprVenting, pushKey30, pushKeyAsync, ventKey
}: {
  intubated: boolean; cprCount: number; cprVenting: boolean;
  pushKey30: number; pushKeyAsync: number; ventKey: number;
}) {
  if (!intubated) {
    if (cprVenting) {
      const lungPath = (
        <>
          <path d="M12 4v7M9.5 6h5"/>
          <path d="M6 9.5C4.5 9.5 3 10.7 3 14v3a3.5 3.5 0 0 0 6.5 1.8l.5-2.3V9.5C10 8.5 9 8 8.5 8S6 9 6 9.5z"/>
          <path d="M18 9.5C19.5 9.5 21 10.7 21 14v3a3.5 3.5 0 0 1-6.5 1.8L14 16.5V9.5C14 8.5 15 8 15.5 8S18 9 18 9.5z"/>
        </>
      );
      return (
        <div style={{ borderRadius: 14, padding: '14px 16px', background: 'color-mix(in srgb, var(--success) 10%, transparent)', boxShadow: 'inset 0 0 0 1.5px color-mix(in srgb, var(--success) 40%, transparent)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E8E3E', letterSpacing: '0.10em', marginBottom: 10 }}>
            VENTILASI 2×
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 10 }}>
            {/* Napas ke-1 — langsung */}
            <div style={{ textAlign: 'center' }}>
              <svg className="acls-lung-vent" width="52" height="52" viewBox="0 0 24 24" fill="none"
                stroke="#1E8E3E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {lungPath}
              </svg>
              <div className="t-caption-2" style={{ color: '#1E8E3E', fontWeight: 700, marginTop: 2 }}>1</div>
            </div>
            {/* Napas ke-2 — delay 1.4 detik */}
            <div style={{ textAlign: 'center' }}>
              <svg className="acls-lung-vent" width="52" height="52" viewBox="0 0 24 24" fill="none"
                stroke="#1E8E3E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                style={{ animationDelay: '1.4s', opacity: 0.35 }}>
                {lungPath}
              </svg>
              <div className="t-caption-2" style={{ color: '#1E8E3E', fontWeight: 700, marginTop: 2 }}>2</div>
            </div>
          </div>
          <div className="t-caption-1" style={{ color: 'var(--label-secondary)' }}>
            ~1 detik tiap napas · dada tampak mengembang
          </div>
        </div>
      );
    }
    return (
      <div style={{ borderRadius: 14, padding: '14px 16px', background: 'var(--fill-quaternary)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '3.25rem', fontWeight: 900,
          color: cprCount >= 25 ? 'var(--warning)' : 'var(--label-primary)',
          lineHeight: 1, marginBottom: 2, transition: 'color 200ms',
          fontFeatureSettings: '"tnum"' }}>
          {cprCount || 0}
        </div>
        <svg key={pushKey30} className="acls-push-hands" width="58" height="58" viewBox="0 0 24 24"
          fill="none" stroke="var(--danger)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          style={{ margin: '4px auto 8px' }}>
          <path d="M12 3v2.5"/>
          <rect x="4.5" y="6" width="15" height="4.5" rx="2.2"/>
          <rect x="4.5" y="11" width="15" height="4.5" rx="2.2"/>
          <path d="M12 16.5v3.5M9.5 18.5l2.5 2.5 2.5-2.5"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--fill-tertiary)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3,
              width: (cprCount / 30 * 100) + '%',
              background: cprCount >= 25 ? 'var(--warning)' : 'var(--info)',
              transition: 'width 120ms ease-out, background 200ms'
            }}/>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
            color: cprCount >= 25 ? 'var(--warning)' : 'var(--label-secondary)', flexShrink: 0 }}>
            {cprCount}/30
          </span>
        </div>
      </div>
    );
  }

  // Async mode (airway definitif terpasang)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', borderRadius: 14, background: 'var(--fill-quaternary)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 12px', textAlign: 'center' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', letterSpacing: '0.06em', marginBottom: 4 }}>KOMPRESI</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg key={pushKeyAsync} className="acls-push-hands" width="44" height="44" viewBox="0 0 24 24"
            fill="none" stroke="var(--danger)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v2.5"/>
            <rect x="4.5" y="6" width="15" height="4.5" rx="2.2"/>
            <rect x="4.5" y="11" width="15" height="4.5" rx="2.2"/>
            <path d="M12 16.5v3.5M9.5 18.5l2.5 2.5 2.5-2.5"/>
          </svg>
        </div>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 4 }}>110 / mnt</div>
      </div>
      <div style={{ width: 1, background: 'var(--separator)', margin: '10px 0' }}/>
      <div style={{ padding: '14px 12px', textAlign: 'center' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-tertiary)', letterSpacing: '0.06em', marginBottom: 6 }}>VENTILASI</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <svg key={ventKey} className="acls-lung-breathe" width="44" height="44" viewBox="0 0 24 24" fill="none"
            stroke="var(--info)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v7M9.5 6h5"/>
            <path d="M6 9.5C4.5 9.5 3 10.7 3 14v3a3.5 3.5 0 0 0 6.5 1.8l.5-2.3V9.5C10 8.5 9 8 8.5 8S6 9 6 9.5z"/>
            <path d="M18 9.5C19.5 9.5 21 10.7 21 14v3a3.5 3.5 0 0 1-6.5 1.8L14 16.5V9.5C14 8.5 15 8 15.5 8S18 9 18 9.5z"/>
          </svg>
        </div>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)' }}>10 / mnt · /6 dtk</div>
      </div>
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
  // ALS Termination of Resuscitation (AHA 2025) — 2 kriteria yang butuh input tim;
  // 2 kriteria lain (No ROSC, No shock) diturunkan otomatis dari state resusitasi.
  const [torNotWitnessed, setTorNotWitnessed] = useState(false);
  const [torNoBystander, setTorNoBystander] = useState(false);
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

  useMetronome(soundOn && running, intubated);

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
    setPhase('terminated');
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
  // 30:2 counter — aktif selama CPR running, airway belum definitif
  const { count: cprCount, venting: cprVenting } = useCompCounter(
    running && !intubated
  );
  const pushKey30    = usePushFlash(running && !intubated && !cprVenting, 600);
  const pushKeyAsync = usePushFlash(running && intubated, Math.round(60000 / CPR_BPM_CONT));
  const ventKey      = useVentPulse(running && intubated);
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

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--warning) 8%, transparent)", boxShadow: "inset 0 0 0 0.5px color-mix(in srgb, var(--warning) 30%, transparent)" }}>
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
            <button onClick={() => setSoundOn(s => !s)} style={{ display:'inline-flex', alignItems:'center', gap:4, height:28, padding:'0 10px', borderRadius:8, background:soundOn?'color-mix(in srgb, var(--danger) 15%, transparent)':'var(--fill-tertiary)', border:0, cursor:'pointer', flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn?'var(--danger)':'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {soundOn?<><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>:<><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
              </svg>
              <span style={{ fontSize:11, fontWeight:600, color:soundOn?'var(--danger)':'var(--label-secondary)', whiteSpace:'nowrap' }}>
                {soundOn ? `♩ ${intubated ? CPR_BPM_CONT : CPR_BPM_RATIO} BPM` : 'SENYAP'}
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
            {running && (
              <div style={{ marginTop:10 }}>
                <CprAnimator intubated={intubated} cprCount={cprCount} cprVenting={cprVenting}
                  pushKey30={pushKey30} pushKeyAsync={pushKeyAsync} ventKey={ventKey}/>
              </div>
            )}
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
            style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:16, background:'linear-gradient(135deg,var(--info),#003C7E)', color:'#fff', border:0, cursor:'pointer', boxShadow:'0 6px 18px color-mix(in srgb, var(--accent) 30%, transparent)', minHeight:70 }}>
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
            <div style={{ padding:'8px 12px', borderRadius:10, background:'color-mix(in srgb, var(--success) 10%, transparent)', boxShadow:'0 0 0 0.5px color-mix(in srgb, var(--success) 40%, transparent)', display:'flex', alignItems:'center', gap:8 }}>
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

        <div style={{ padding:'4px 16px 20px' }}>
          <button onClick={() => setLogModalOpen(true)}
            style={{ width:'100%', height:44, borderRadius:12, background:'var(--fill-tertiary)', border:'0.5px solid var(--separator)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Icons.clipboard size={15} stroke={2}/>
            <span className="t-caption-1" style={{ fontWeight:600, color:'var(--label-secondary)' }}>Log Kejadian · {log.length} item</span>
            <Icons.chevR size={14} stroke={2} style={{ color:'var(--label-tertiary)' }}/>
          </button>
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
                style={{ padding:'14px 18px', borderRadius:14, background:'color-mix(in srgb, var(--success) 12%, transparent)', boxShadow:'0 0 0 1px color-mix(in srgb, var(--success) 50%, transparent)', border:0, cursor:'pointer', display:'flex', alignItems:'center', gap:12, textAlign:'left' }}>
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

  /* === TERMINATED PHASE — resusitasi selesai === */
  if (phase === 'terminated') {
    return (
      <div className="cpr-workspace" style={{ justifyContent: 'flex-start' }}>
        <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--separator)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--label-quaternary)' }}/>
            <span className="t-caption-2" style={{ color: 'var(--label-secondary)', letterSpacing: 0.5 }}>RESUSITASI SELESAI</span>
          </div>
          <button onClick={onClose} className="ios-btn plain" style={{ height: 28, padding: '0 8px', fontSize: '0.875rem', color: 'var(--label-secondary)' }}>
            Tutup
          </button>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status banner */}
          <div style={{ padding: '18px 20px', borderRadius: 16, background: 'color-mix(in srgb, var(--label-tertiary) 10%, transparent)', boxShadow: '0 0 0 0.5px color-mix(in srgb, var(--label-tertiary) 30%, transparent)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--label-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icons.cross size={22} stroke={2.4} style={{ color: '#fff' }}/>
            </div>
            <div>
              <div className="t-title-3" style={{ color: 'var(--label-primary)' }}>Resusitasi Dihentikan</div>
              <div className="t-caption-1" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>Keputusan tim · ALS TOR Rule (AHA 2025)</div>
            </div>
          </div>

          {/* Ringkasan numerik */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Durasi', value: fmt(elapsed) },
              { label: 'Epinefrin', value: `${epiDoses}×` },
              { label: 'Defibrilasi', value: `${shocks}×` },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 10px', borderRadius: 12, background: 'var(--fill-tertiary)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--label-primary)', lineHeight: 1 }}>{value}</div>
                <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Log ringkasan — 3 entri terakhir */}
          <div>
            <div className="t-caption-2" style={{ color: 'var(--label-secondary)', marginBottom: 8, paddingLeft: 2 }}>LOG TERAKHIR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...log].slice(-4).reverse().map((e, i) => {
                const tc = ({ info: 'var(--label-primary)', warn: 'var(--warning)', danger: 'var(--danger)', success: 'var(--success)' } as Record<string, string>)[e.tone];
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--fill-quaternary)' }}>
                    <span className="t-footnote" style={{ color: tc, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.action}</span>
                    <span className="t-caption-2" style={{ color: 'var(--label-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{e.wall}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={onClose}
            style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--fill-secondary)', boxShadow: '0 0 0 0.5px var(--separator)', border: 0, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: 'var(--label-primary)', marginTop: 4 }}>
            Selesai
          </button>
        </div>
      </div>
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
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "color-mix(in srgb, var(--danger) 8%, transparent)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--danger) 25%, transparent)", marginBottom: 20 }}>
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
              style={{ padding: "16px 18px", borderRadius: 14, background: "color-mix(in srgb, var(--success) 10%, transparent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--success) 40%, transparent)", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--success)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.check size={22} stroke={2.6} style={{ color: "#fff" }}/>
              </div>
              <div>
                <div className="t-headline" style={{ color: "var(--success)" }}>ROSC — Ada nadi</div>
                <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>Hentikan resusitasi · mulai post-cardiac arrest care</div>
              </div>
            </button>

            <button onClick={() => setStopAlsOpen(true)}
              style={{ padding: "16px 18px", borderRadius: 14, background: "color-mix(in srgb, var(--label-tertiary) 10%, transparent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--label-tertiary) 30%, transparent)", textAlign: "left", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--label-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icons.cross size={20} stroke={2.4} style={{ color: "#fff" }}/>
              </div>
              <div>
                <div className="t-headline" style={{ color: "var(--label-primary)" }}>Pertimbangkan Menghentikan ALS</div>
                <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 2 }}>Evaluasi kriteria terminasi · durasi {fmt(elapsed)}</div>
              </div>
            </button>
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--accent) 7%, transparent)", boxShadow: "inset 0 0 0 0.5px color-mix(in srgb, var(--accent) 25%, transparent)" }}>
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
            <div style={{ width: "100%", maxWidth: 480, background: "var(--bg-secondary)", borderRadius: "20px 20px 0 0", boxShadow: "var(--shadow-2), 0 0 0 0.5px var(--glass-border)", overflow: "hidden", animation: "acls-sheet-in 260ms var(--ease-out) both" }}>
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--fill-tertiary)" }}/>
              </div>

              <div style={{ padding: "4px 20px 20px", overflowY: "auto", maxHeight: "80vh" }}>
                <div className="t-title-2" style={{ marginBottom: 4 }}>Pertimbangkan Menghentikan ALS</div>
                <div className="t-footnote" style={{ color: "var(--label-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                  Berdasarkan aturan <strong>ALS Termination of Resuscitation</strong> (AHA 2025). Keputusan tetap milik tim.
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

                {/* Kriteria ALS TOR (AHA 2025) — checklist interaktif */}
                {(() => {
                  const torCriteria = [
                    { key: 'witnessed', label: 'Henti jantung tidak disaksikan', sub: 'Tidak ada yang menyaksikan saat pasien kolaps', met: torNotWitnessed, toggle: () => setTorNotWitnessed(v => !v), auto: false },
                    { key: 'bystander', label: 'Tidak ada CPR oleh penolong awam', sub: 'Tidak ada bystander CPR sebelum tim tiba', met: torNoBystander, toggle: () => setTorNoBystander(v => !v), auto: false },
                    { key: 'rosc',      label: 'Tidak ada ROSC', sub: 'Belum pernah kembali sirkulasi spontan', met: true, auto: true, autoText: 'Otomatis · resusitasi masih berlangsung' },
                    { key: 'shock',     label: 'Tidak ada syok yang diberikan', sub: 'Belum pernah defibrilasi sepanjang resusitasi', met: shocks === 0, auto: true, autoText: shocks === 0 ? `Otomatis · ${shocks} syok` : `Tidak terpenuhi · sudah ${shocks} syok` },
                  ];
                  const allMet = torCriteria.every(c => c.met);

                  return (
                    <>
                      <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--fill-quaternary)", boxShadow: "inset 0 0 0 0.5px var(--separator)", marginBottom: 14 }}>
                        <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, marginBottom: 4 }}>KRITERIA ALS TERMINATION OF RESUSCITATION</div>
                        <div className="t-caption-1" style={{ color: "var(--label-tertiary)", lineHeight: 1.5, marginBottom: 10 }}>
                          Ketuk untuk menandai kriteria yang terpenuhi. Pertimbangkan terminasi hanya bila <strong>semua</strong> kriteria terpenuhi (AHA 2025).
                        </div>
                        {torCriteria.map((c, i) => (
                          <button key={c.key} onClick={c.auto ? undefined : c.toggle} disabled={c.auto}
                            style={{ width: "100%", display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left",
                              padding: "9px 10px", marginTop: i > 0 ? 6 : 0, borderRadius: 10, border: 0,
                              cursor: c.auto ? "default" : "pointer",
                              background: c.met ? "color-mix(in srgb, var(--success) 10%, transparent)" : "var(--bg-tertiary)",
                              boxShadow: c.met ? "inset 0 0 0 0.5px color-mix(in srgb, var(--success) 40%, transparent)" : "inset 0 0 0 0.5px var(--separator)" }}>
                            <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                              background: c.met ? "var(--success)" : "var(--fill-tertiary)",
                              display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              {c.met
                                ? <Icons.check size={13} stroke={3} style={{ color: "#fff" }}/>
                                : <Icons.cross size={12} stroke={2.6} style={{ color: "var(--label-tertiary)" }}/>}
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span className="t-footnote" style={{ display: "block", fontWeight: 600, color: "var(--label-primary)", lineHeight: 1.35 }}>{c.label}</span>
                              <span className="t-caption-2" style={{ display: "block", color: c.auto ? (c.met ? "var(--success)" : "var(--danger)") : "var(--label-secondary)", marginTop: 1, lineHeight: 1.35 }}>
                                {c.auto ? c.autoText : c.sub}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Verdict per alur ALS TOR */}
                      {allMet ? (
                        <div style={{ padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--warning) 10%, transparent)", boxShadow: "inset 0 0 0 0.5px color-mix(in srgb, var(--warning) 40%, transparent)", marginBottom: 20, display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>⚠️</span>
                          <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.5 }}>
                            <strong>Semua kriteria terpenuhi.</strong> Pertimbangkan terminasi resusitasi. Keputusan tetap milik tim — dokumentasikan waktu dan alasan.
                          </span>
                        </div>
                      ) : (
                        <div style={{ padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--accent) 7%, transparent)", boxShadow: "inset 0 0 0 0.5px color-mix(in srgb, var(--accent) 25%, transparent)", marginBottom: 20, display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>ℹ️</span>
                          <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.5 }}>
                            <strong>Ada kriteria belum terpenuhi.</strong> Lanjutkan resusitasi dan pertimbangkan transport ke fasilitas yang sesuai.
                          </span>
                        </div>
                      )}

                      {/* Actions — emphasis mengikuti verdict */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button onClick={handleStopALS}
                          style={{ width: "100%", height: 50, borderRadius: 14,
                            background: allMet ? "var(--danger)" : "var(--fill-tertiary)",
                            color: allMet ? "#fff" : "var(--label-secondary)", border: 0, cursor: "pointer", fontSize: '1rem', fontWeight: 700 }}>
                          Akhiri Resusitasi
                        </button>
                        <button onClick={() => setStopAlsOpen(false)}
                          style={{ width: "100%", height: 50, borderRadius: 14,
                            background: allMet ? "var(--fill-tertiary)" : "var(--success)",
                            color: allMet ? "var(--label-primary)" : "#fff", border: 0, cursor: "pointer", fontSize: '0.9375rem', fontWeight: 700 }}>
                          Lanjutkan Resusitasi
                        </button>
                      </div>
                    </>
                  );
                })()}
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
            <button onClick={() => setSoundOn(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 8, background: soundOn ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'var(--fill-tertiary)', border: 0, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn ? 'var(--danger)' : 'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {soundOn ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
              </svg>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
                {soundOn ? `♩ ${intubated ? CPR_BPM_CONT : CPR_BPM_RATIO} BPM` : 'SENYAP'}
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

                {/* CprAnimator (desktop) — selalu tampil saat running */}
                {running && (
                  <div style={{ marginTop: 10 }}>
                    <CprAnimator intubated={intubated} cprCount={cprCount} cprVenting={cprVenting}
                      pushKey30={pushKey30} pushKeyAsync={pushKeyAsync} ventKey={ventKey}/>
                  </div>
                )}
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
                          style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(150deg,#5B4FD0,#3A2FA0)' }}
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
                      <div style={{ padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--success) 10%, transparent)', boxShadow: '0 0 0 0.5px color-mix(in srgb, var(--success) 40%, transparent)', display: 'flex', alignItems: 'center', gap: 8 }}>
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

                {/* Terminasi — akses langsung tanpa menunggu rhythm check */}
                <button onClick={() => setStopAlsOpen(true)}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'color-mix(in srgb, var(--label-tertiary) 8%, transparent)', boxShadow: '0 0 0 0.5px color-mix(in srgb, var(--label-tertiary) 25%, transparent)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.cross size={14} stroke={2.2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
                  <span className="t-caption-1" style={{ color: 'var(--label-secondary)', fontWeight: 600, flex: 1, textAlign: 'left' }}>Pertimbangkan Menghentikan ALS</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)' }}>▸</span>
                </button>
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
                  style={{ padding: '14px 18px', borderRadius: 14, background: 'color-mix(in srgb, var(--success) 12%, transparent)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--success) 50%, transparent)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
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
          <button onClick={() => setSoundOn(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 8, background: soundOn ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'var(--fill-tertiary)', border: 0, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={soundOn ? 'var(--danger)' : 'var(--label-secondary)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {soundOn ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
            </svg>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: soundOn ? 'var(--danger)' : 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
              {soundOn ? `♩ ${intubated ? CPR_BPM_CONT : CPR_BPM_RATIO} BPM` : 'SENYAP'}
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

          {/* CPR Animator — selalu tampil saat running */}
          {running && (
            <div style={{ marginTop: 10 }}>
              <CprAnimator intubated={intubated} cprCount={cprCount} cprVenting={cprVenting}
                pushKey30={pushKey30} pushKeyAsync={pushKeyAsync} ventKey={ventKey}/>
            </div>
          )}
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
                  style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: '10px 16px', background: 'linear-gradient(150deg,#5B4FD0,#3A2FA0)' }}
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
              <div style={{ padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--success) 10%, transparent)', boxShadow: '0 0 0 0.5px color-mix(in srgb, var(--success) 40%, transparent)', display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Terminasi — akses langsung tanpa menunggu rhythm check */}
        <button onClick={() => setStopAlsOpen(true)}
          style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'color-mix(in srgb, var(--label-tertiary) 8%, transparent)', boxShadow: '0 0 0 0.5px color-mix(in srgb, var(--label-tertiary) 25%, transparent)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.cross size={14} stroke={2.2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
          <span className="t-caption-1" style={{ color: 'var(--label-secondary)', fontWeight: 600, flex: 1, textAlign: 'left' }}>Pertimbangkan Menghentikan ALS</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--label-tertiary)' }}>▸</span>
        </button>

      </div>

      <div style={{ padding:'4px 16px 20px' }}>
        <button onClick={() => setLogModalOpen(true)}
          style={{ width:'100%', height:44, borderRadius:12, background:'var(--fill-tertiary)', border:'0.5px solid var(--separator)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Icons.clipboard size={15} stroke={2}/>
          <span className="t-caption-1" style={{ fontWeight:600, color:'var(--label-secondary)' }}>Log Kejadian · {log.length} item</span>
          <Icons.chevR size={14} stroke={2} style={{ color:'var(--label-tertiary)' }}/>
        </button>
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
              style={{ padding: '14px 18px', borderRadius: 14, background: 'color-mix(in srgb, var(--success) 12%, transparent)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--success) 50%, transparent)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
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

