import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Icons, NavBar, LargeTitle, SearchField,
  SectionHeader, SectionFooter, List, Row, Pill, Alert,
} from '../../components/base';
import { RhythmStrip, FlowStep, FlowConnector, BottomSheet, EkgImage } from '../../components/acls';
import {
  ACLS_ALGORITHMS, ACLS_DRUGS, ACLS_RHYTHMS, ACLS_HS_TS,
  ACLS_QUICK_ACTIONS, ACLS_FLOW_ARREST, ACLS_FLOW_BRADY,
  ACLS_FLOW_TACHY, ACLS_FLOW_BHJD, ACLS_FLOW_SKA, ACLS_FLOW_ROSC,
  ACLS_FLOW_OPIOID, ACLS_FLOW_ANAPHYLAXIS, ACLS_FLOW_PREGNANCY,
  ACLS_FLOW_DROWNING, ACLS_FLOW_HYPOTHERMIA,
} from '../../data';

/* ============================================================
   FAVORITES
   ============================================================ */
function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('acls_favorites') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const sync = () => {
      try { setFavs(JSON.parse(localStorage.getItem('acls_favorites') || '[]')); } catch {}
    };
    window.addEventListener('acls-favorites-changed', sync);
    return () => window.removeEventListener('acls-favorites-changed', sync);
  }, []);

  const isFav = (type, key) => favs.some(f => f.type === type && f.key === key);

  const toggle = (type, key) => {
    setFavs(prev => {
      const exists = prev.some(f => f.type === type && f.key === key);
      const next = exists
        ? prev.filter(f => !(f.type === type && f.key === key))
        : [...prev, { type, key }];
      try { localStorage.setItem('acls_favorites', JSON.stringify(next)); } catch {}
      window.dispatchEvent(new Event('acls-favorites-changed'));
      return next;
    });
  };

  return { favs, isFav, toggle };
}

/* ============================================================
   INSTALL POPUP
   ============================================================ */
export function InstallPopup({ deferredPrompt, onClose, onDismiss }) {
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const [platform, setPlatform] = useState(isIOS ? 'ios' : 'android');

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    outcome === 'accepted' ? onDismiss() : onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,0.52)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
      animation: 'acls-overlay-in 280ms var(--ease-out) both',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg-secondary)',
        borderRadius: 24,
        boxShadow: 'var(--shadow-2), 0 0 0 0.5px var(--separator)',
        overflow: 'hidden',
      }}>
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 14px 0' }}>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 15, border: 0, cursor: 'pointer',
            background: 'var(--fill-tertiary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--label-secondary)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Icon + title */}
        <div style={{ textAlign: 'center', padding: '6px 24px 20px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'var(--danger)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255,59,48,0.35)',
            marginBottom: 14,
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="#fff">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div className="t-title-2" style={{ marginBottom: 6 }}>Install ACLS Helper</div>
          <div className="t-footnote" style={{ color: 'var(--label-secondary)', lineHeight: 1.5 }}>
            Akses algoritma &amp; obat resusitasi secara offline —<br/>langsung dari layar utama perangkat Anda.
          </div>
        </div>

        {/* Platform toggle */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            display: 'flex', background: 'var(--fill-tertiary)',
            borderRadius: 12, padding: 3,
          }}>
            {[
              { k: 'android', label: 'Android / Chrome' },
              { k: 'ios',     label: 'iPhone / iPad' },
            ].map(({ k, label }) => (
              <button key={k} onClick={() => setPlatform(k)} style={{
                flex: 1, height: 32, borderRadius: 9, border: 0, cursor: 'pointer',
                background: platform === k ? 'var(--bg-secondary)' : 'transparent',
                color: platform === k ? 'var(--label-primary)' : 'var(--label-secondary)',
                fontWeight: platform === k ? 600 : 400,
                fontSize: 13,
                boxShadow: platform === k ? 'var(--shadow-1)' : 'none',
                transition: 'background 160ms, color 160ms, box-shadow 160ms',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Android content */}
        {platform === 'android' && (
          <div style={{ padding: '0 20px 20px' }}>
            {deferredPrompt ? (
              <>
                <div className="t-callout" style={{
                  color: 'var(--label-secondary)', marginBottom: 14, lineHeight: 1.5,
                }}>
                  Ketuk tombol di bawah untuk menginstal aplikasi ini ke layar utama perangkat Anda.
                </div>
                <button onClick={handleInstall} className="ios-btn block" style={{
                  background: 'var(--danger)', color: '#fff',
                  height: 50, borderRadius: 14, fontSize: 16, fontWeight: 700,
                }}>
                  Install Sekarang
                </button>
              </>
            ) : (
              <div className="t-callout" style={{
                color: 'var(--label-secondary)', lineHeight: 1.5,
                padding: '12px 14px', background: 'var(--fill-quaternary)', borderRadius: 12,
              }}>
                Buka di <strong>Chrome</strong>, lalu ketuk menu (⋮) dan pilih <strong>"Tambahkan ke Layar Utama"</strong>.
              </div>
            )}
          </div>
        )}

        {/* iOS content */}
        {platform === 'ios' && (
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              <>Pastikan membuka di <strong>Safari</strong> (bukan Chrome / Firefox)</>,
              <>Ketuk ikon <strong>Bagikan</strong> <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginInline: 2 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></span> di toolbar Safari</>,
              <>Pilih <strong>"Tambah ke Layar Utama"</strong> (Add to Home Screen)</>,
              <>Ketuk <strong>"Tambah"</strong> di pojok kanan atas</>,
            ].map((text, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 12px', background: 'var(--fill-quaternary)', borderRadius: 10,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                  background: 'var(--danger)', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>{i + 1}</span>
                <span className="t-footnote" style={{ color: 'var(--label-primary)', lineHeight: 1.55 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dismiss */}
        <div style={{ borderTop: '0.5px solid var(--separator)', padding: '12px 20px 16px', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 40, borderRadius: 12, border: 0, cursor: 'pointer',
            background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: 14,
          }}>
            Nanti
          </button>
          <button onClick={onDismiss} style={{
            flex: 1, height: 40, borderRadius: 12, border: 0, cursor: 'pointer',
            background: 'var(--fill-tertiary)', color: 'var(--label-secondary)', fontSize: 14,
          }}>
            Jangan tampilkan lagi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */
const STAT_CARDS = [
  { value: '14',   label: 'Algoritma', color: 'var(--danger)',  screen: 'algoList' },
  { value: '25',   label: 'Obat',      color: 'var(--warning)', screen: 'drugList' },
  { value: '16',   label: 'EKG',       color: 'var(--info)',    screen: 'ekgList' },
  { value: '2025', label: 'Panduan',   color: 'var(--success)', screen: null },
];

export function MobileHome({ nav, openCPR }) {
  const [query, setQuery] = useState('');
  const [spotlight, setSpotlight] = useState(0);
  const [dir, setDir] = useState('right');
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);
  const { favs } = useFavorites();

  const favItems = useMemo(() => favs.map(f => {
    if (f.type === 'algo') {
      const a = ACLS_ALGORITHMS.find(x => x.key === f.key);
      return a ? { ...f, label: a.label, sub: a.sub, tint: a.tint } : null;
    }
    if (f.type === 'drug') {
      const d = ACLS_DRUGS.find(x => x.key === f.key);
      return d ? { ...f, label: d.name, sub: d.category || d.class, tint: d.tint } : null;
    }
    const r = ACLS_RHYTHMS.find(x => x.key === f.key);
    return r ? { ...f, label: r.name, sub: r.short || r.severity, tint: r.tint } : null;
  }).filter(Boolean), [favs]);

  const switchTo = (idx, direction = 'right') => {
    setDir(direction);
    setSpotlight(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDir('right');
      setSpotlight(s => (s + 1) % 2);
    }, 7000);
  };
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDir('right');
      setSpotlight(s => (s + 1) % 2);
    }, 7000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) switchTo((spotlight + 1) % 2, delta < 0 ? 'right' : 'left');
    touchStartX.current = null;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...ACLS_ALGORITHMS.filter(a =>
        (a.label + ' ' + a.sub).toLowerCase().includes(q)
      ).map(a => ({ type: 'algo', key: a.key, label: a.label, sub: a.sub, tint: a.tint })),
      ...ACLS_DRUGS.filter(d =>
        (d.name + ' ' + (d.altName || '') + ' ' + (d.category || '')).toLowerCase().includes(q)
      ).map(d => ({ type: 'drug', key: d.key, label: d.name, sub: d.category || d.class, tint: d.tint })),
      ...ACLS_RHYTHMS.filter(r =>
        (r.name + ' ' + (r.short || '')).toLowerCase().includes(q)
      ).map(r => ({ type: 'rhythm', key: r.key, label: r.name, sub: r.short, tint: r.tint })),
    ].slice(0, 8);
  }, [query]);

  const iconFor = (type) => {
    if (type === 'algo') return <Icons.algo size={16} stroke={2.4}/>;
    if (type === 'drug') return <Icons.pill size={16} stroke={2.4}/>;
    return <Icons.ekg size={16} stroke={2.4}/>;
  };

  return (
    <>
      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,59,48,0.10)', borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)',
            letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your daily Cardiac Problem Companion
          </span>
        </div>
        <div style={{ fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 8 }}>
          <span style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #FF6830 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontSize: 'clamp(36px, 11vw, 48px)' }}>
            ACLS
          </span>
          {' '}
          <span style={{ color: 'var(--label-primary)', fontSize: 'clamp(26px, 8vw, 36px)' }}>Helper</span>
        </div>
        <div className="t-footnote" style={{ color: 'var(--label-secondary)', marginBottom: 16 }}>
          Alat bantu kognitif cepat untuk ACLS, code blue, dan manajemen irama emergensi.
        </div>
        <a href="https://id.linkedin.com/in/rizqanfahlevvi/"
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10,
            textDecoration: 'none' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#0A66C2',
            letterSpacing: '0.06em', textTransform: 'uppercase' }}>Made by Rizqanfahlevvi</span>
        </a>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {STAT_CARDS.map((c) => (
            <button key={c.label}
              onClick={() => c.screen && nav.push({ screen: c.screen })}
              style={{ flex: 1, background: 'var(--fill-secondary)',
                borderRadius: 14, padding: '10px 8px', textAlign: 'center',
                border: 0, cursor: c.screen ? 'pointer' : 'default',
                transition: 'opacity 120ms',
              }}
              onMouseEnter={e => { if (c.screen) e.currentTarget.style.opacity = '0.75'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 10, color: 'var(--label-secondary)', marginTop: 3 }}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      <SearchField placeholder="Cari algoritma, obat, EKG…" value={query} onChange={setQuery}/>

      {query ? (
        <div style={{ padding: "8px 16px" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--label-secondary)" }}>
              <div className="t-headline" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
              <div className="t-footnote">Coba kata kunci lain</div>
            </div>
          ) : (
            <List>
              {results.map(r => (
                <Row key={r.type + r.key}
                  glyph={iconFor(r.type)} tint={r.tint}
                  label={r.label} sub={r.sub}
                  onClick={() => {
                    setQuery('');
                    if (r.type === 'algo') nav.push({ screen: 'algo', id: r.key });
                    else if (r.type === 'drug') nav.push({ screen: 'drug', id: r.key });
                    else nav.push({ screen: 'ekg', id: r.key });
                  }}
                />
              ))}
            </List>
          )}
        </div>
      ) : (
        <>
          <div style={{ padding: '0 16px 4px' }}>
            <div style={{ overflow: 'hidden', borderRadius: 16 }}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {spotlight === 0
                ? <button key="cb" onClick={openCPR}
                    style={{ width: '100%', borderRadius: 16,
                      background: 'linear-gradient(135deg, var(--danger), #c81e10)', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                      boxShadow: '0 8px 24px rgba(255,59,48,0.30)',
                      border: 0, cursor: 'pointer',
                      animation: `acls-slide-from-${dir} 280ms var(--ease-out) both` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.20)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icons.boltFill size={22}/>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>Aktifkan Code Blue</div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Ketuk untuk masuk CPR Workspace · timer aktif</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                : <a key="sw" href="https://saweria.co/rizqanfahlevvi" target="_blank" rel="noopener noreferrer"
                    style={{ width: '100%', borderRadius: 16,
                      background: 'linear-gradient(135deg, #FF9500, #E67300)', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                      boxShadow: '0 8px 24px rgba(255,149,0,0.30)',
                      border: 0, cursor: 'pointer', textDecoration: 'none',
                      animation: `acls-slide-from-${dir} 280ms var(--ease-out) both` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.20)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icons.coffee size={22} stroke={2}/>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>Dukung Pengembangan</div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>saweria.co/rizqanfahlevvi</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </a>
              }
            </div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
              {[0, 1].map(i => (
                <div key={i} onClick={() => switchTo(i, i > spotlight ? 'right' : 'left')}
                  style={{
                    width: spotlight === i ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                    background: spotlight === i
                      ? (i === 0 ? 'var(--danger)' : '#FF9500')
                      : 'var(--fill-tertiary)',
                    transition: 'width 200ms var(--ease-out), background 200ms'
                  }}/>
              ))}
            </div>
          </div>

          {favItems.length > 0 && (
            <>
              <SectionHeader>Favorit</SectionHeader>
              <List>
                {favItems.map(f => (
                  <Row
                    key={f.type + f.key}
                    glyph={
                      f.type === 'algo' ? <Icons.algo size={16} stroke={2.4}/> :
                      f.type === 'drug' ? <Icons.pill size={16} stroke={2.4}/> :
                      <Icons.ekg size={16} stroke={2.4}/>
                    }
                    tint={f.tint}
                    label={f.label}
                    sub={f.sub}
                    right={<Icons.starFill size={13} style={{ color: 'var(--warning)', flexShrink: 0 }}/>}
                    onClick={() => {
                      if (f.type === 'algo') nav.push({ screen: 'algo', id: f.key });
                      else if (f.type === 'drug') nav.push({ screen: 'drug', id: f.key });
                      else nav.push({ screen: 'ekg', id: f.key });
                    }}
                  />
                ))}
              </List>
            </>
          )}

          <SectionHeader>Akses Cepat</SectionHeader>
          <div style={{ padding: '0 16px 12px', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { key: 'vfvt',  label: 'VF / pVT',       sub: 'Shockable',     tint: 'var(--danger)',     icon: <Icons.boltFill size={20}/> },
              { key: 'pea',   label: 'PEA / Asystole',  sub: 'Non-shockable', tint: 'var(--info)',       icon: <Icons.flatline size={20} stroke={2.2}/> },
              { key: 'brady', label: 'Bradikardi',       sub: 'HR < 50',       tint: 'var(--warning)',    icon: <Icons.slow size={20} stroke={2.2}/> },
              { key: 'tachy', label: 'Takikardi',        sub: 'HR > 150',      tint: 'var(--tint-neuro)', icon: <Icons.fast size={20} stroke={2.2}/> },
            ].map(c => (
              <button key={c.key} onClick={() => nav.push({ screen: 'algo', id: c.key })}
                style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--bg-tertiary)',
                  boxShadow: 'var(--shadow-1)', textAlign: 'left', display: 'flex', flexDirection: 'row',
                  alignItems: 'center', gap: 12, border: 0, cursor: 'pointer',
                  transition: 'transform 160ms, box-shadow 160ms' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.tint, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 2 }}>{c.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <SectionHeader>Algoritma</SectionHeader>
          <List>
            {ACLS_ALGORITHMS.slice(0, 6).map(a => (
              <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
            ))}
          </List>

          <SectionHeader>Alat</SectionHeader>
          <List>
            <Row glyph={<Icons.timer size={16} stroke={2.4}/>} tint="var(--success)" label="CPR Workspace" sub="Resusitasi aktif · siklus 2 menit" onClick={openCPR}/>
            <Row glyph={<Icons.ekg size={16} stroke={2.4}/>} tint="var(--tint-resp)" label="Pustaka EKG" sub="VF · VT · TdP · SVT · STEMI" onClick={() => nav.push({ screen: "ekgList" })}/>
            <Row glyph={<Icons.pill size={16} stroke={2.4}/>} tint="var(--tint-drug)" label="Obat ACLS" sub="18 obat · PERKI 2021" onClick={() => nav.push({ screen: "drugList" })}/>
            <Row glyph={<Icons.clipboard size={16} stroke={2.4}/>} tint="var(--tint-theory)" label="Hs &amp; Ts" sub="10 penyebab reversibel" onClick={() => nav.push({ screen: "hsts" })}/>
          </List>

          <SectionFooter>
            ACLS Helper · v1.2 · 2026 · Bagian dari ekosistem MDKit<br/>
            Mengikuti PERKI 2021 (BHJL &amp; BHJD) + AHA 2025 — penilaian klinis tetap diperlukan.
          </SectionFooter>
          <div style={{ height: 24 }}/>
        </>
      )}
    </>
  );
}

/* ============================================================
   ALGORITHM LIST
   ============================================================ */
export function MobileAlgoList({ nav }) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = ACLS_ALGORITHMS.filter(a =>
    (a.label + ' ' + a.sub).toLowerCase().includes(q.toLowerCase())
  );

  const toggleSearch = () => {
    setSearchOpen(o => !o);
    setQ('');
  };

  return (
    <>
      <NavBar right={
        <button className="nb-btn glyph" onClick={toggleSearch} style={{
          background: searchOpen ? 'var(--accent-tint)' : 'transparent',
          color: searchOpen ? 'var(--accent)' : 'inherit',
          borderRadius: 10,
          transition: 'background 200ms var(--ease-out), color 200ms',
        }}>
          <span key={String(searchOpen)} style={{ display: 'inline-flex', animation: 'acls-fade-in 150ms var(--ease-out) both' }}>
            {searchOpen ? <Icons.cross size={18} stroke={2.4}/> : <Icons.search size={18} stroke={2}/>}
          </span>
        </button>
      }/>
      <LargeTitle>Algoritma</LargeTitle>
      {searchOpen ? (
        <>
          <div style={{ animation: 'acls-search-in 220ms var(--ease-out) both' }}>
            <SearchField placeholder="Cari algoritma…" value={q} onChange={setQ}/>
          </div>
          <div style={{ padding: "0 16px 12px", animation: 'acls-fadeslide 260ms 60ms var(--ease-out) both' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--label-secondary)" }}>
                <div className="t-headline" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
                <div className="t-footnote">Coba kata kunci lain</div>
              </div>
            ) : (
              <List>
                {filtered.map(a => (
                  <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
                ))}
              </List>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill tone="red">Code Blue</Pill><Pill tone="blue">Non-shockable</Pill>
            <Pill tone="orange">Bradikardi</Pill><Pill tone="purple">Takikardi</Pill>
          </div>
          <SectionHeader>Algoritma utama</SectionHeader>
          <List>
            {ACLS_ALGORITHMS.filter(a => ["bhjd","arrest","vfvt","pea"].includes(a.key)).map(a => (
              <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
            ))}
          </List>
          <SectionHeader>Peri-arrest</SectionHeader>
          <List>
            {ACLS_ALGORITHMS.filter(a => ["brady","tachy","ska","rosc"].includes(a.key)).map(a => (
              <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
            ))}
          </List>
          <SectionHeader>Keadaan Khusus</SectionHeader>
          <List>
            {ACLS_ALGORITHMS.filter(a => ["opioid","anaphylaxis","pregnancy","drowning","hypothermia"].includes(a.key)).map(a => (
              <Row key={a.key} glyph={<Icons.algo size={16} stroke={2.4}/>} tint={a.tint} label={a.label} sub={a.sub} onClick={() => nav.push({ screen: "algo", id: a.key })}/>
            ))}
          </List>
          <SectionHeader>Diferensial</SectionHeader>
          <List>
            <Row glyph={<Icons.clipboard size={16} stroke={2.4}/>} tint="var(--tint-theory)" label="Hs &amp; Ts" sub="10 penyebab reversibel" onClick={() => nav.push({ screen: "hsts" })}/>
          </List>
          <SectionFooter>Mengikuti AHA 2025 + PERKI 2021 (BHJL &amp; BHJD).</SectionFooter>
          <div style={{ height: 24 }}/>
        </>
      )}
    </>
  );
}

/* ============================================================
   ALGORITHM DETAIL
   ============================================================ */
export function MobileAlgorithmDetail({ nav, id }) {
  const flow =
    id === "brady"       ? ACLS_FLOW_BRADY :
    id === "tachy"       ? ACLS_FLOW_TACHY :
    id === "bhjd"        ? ACLS_FLOW_BHJD :
    id === "ska"         ? ACLS_FLOW_SKA :
    id === "rosc"        ? ACLS_FLOW_ROSC :
    id === "opioid"      ? ACLS_FLOW_OPIOID :
    id === "anaphylaxis" ? ACLS_FLOW_ANAPHYLAXIS :
    id === "pregnancy"   ? ACLS_FLOW_PREGNANCY :
    id === "drowning"    ? ACLS_FLOW_DROWNING :
    id === "hypothermia" ? ACLS_FLOW_HYPOTHERMIA :
    ACLS_FLOW_ARREST;

  const algo = ACLS_ALGORITHMS.find(a => a.key === id) || ACLS_ALGORITHMS[0];

  const [activeStep, setActiveStep] = useState(null);
  const stepRefs = useRef([]);

  const scrollToStep = (idx) => {
    const clamped = Math.max(0, Math.min(idx, flow.length - 1));
    setActiveStep(clamped);
    setTimeout(() => {
      stepRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleAction = (step, index, dir) => {
    if (dir === "yes") {
      const target = step.yes?.targetIndex ?? Math.min(index + 1, flow.length - 1);
      scrollToStep(target);
    } else {
      const target = step.no?.targetIndex ?? Math.min(index + 2, flow.length - 1);
      scrollToStep(target);
    }
  };

  const { isFav: isFavAlgo, toggle: toggleAlgo } = useFavorites();

  return (
    <>
      <NavBar
        back="Algoritma"
        onBack={nav.pop}
        right={
          <button className="nb-btn glyph"
            onClick={() => toggleAlgo('algo', id)}
            style={{ color: isFavAlgo('algo', id) ? 'var(--warning)' : undefined }}>
            {isFavAlgo('algo', id)
              ? <Icons.starFill size={18}/>
              : <Icons.star size={18} stroke={2}/>}
          </button>
        }
      />
      <div style={{ padding: "0 20px 12px" }}>
        <div className="t-title-2">{algo.label}</div>
        <div className="t-footnote" style={{ color: "var(--label-secondary)", marginTop: 4 }}>
          {algo.sub} · ketuk langkah untuk detail
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill tone="red">{algo.tag}</Pill>
          <Pill tone="gray">{algo.source || "AHA 2025"}</Pill>
        </div>
      </div>

      <div style={{ padding: "8px 16px 18px" }}>
        {flow.map((step, i) => (
          <React.Fragment key={i}>
            <div
              ref={el => { stepRefs.current[i] = el; }}
              style={
                activeStep === i
                  ? { outline: "2px solid var(--accent)", borderRadius: 14, transition: "outline 200ms" }
                  : undefined
              }
            >
              <FlowStep
                step={step}
                index={i}
                total={flow.length}
                expandable={true}
                onAction={step.kind === "decision" ? (dir) => handleAction(step, i, dir) : undefined}
              />
            </div>
            {i < flow.length - 1 && <FlowConnector />}
          </React.Fragment>
        ))}
      </div>

      <SectionFooter>Untuk panduan klinis — bukan pengganti penilaian klinis.</SectionFooter>
      <div style={{ height: 24 }} />
    </>
  );
}

/* ============================================================
   DRUG LIST
   ============================================================ */
const DRUG_FILTERS = [
  { v: "all",        label: "Semua" },
  { v: "vaso",       label: "Vasopresor" },
  { v: "arrhythmia", label: "Antiaritmia" },
  { v: "thrombo",    label: "Antitrombotik" },
  { v: "antidot",    label: "Antidot" },
];

function DrugCard({ d, onPress }) {
  return (
    <button onClick={onPress}
      style={{ padding: "12px 14px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start", border: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: d.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icons.pill size={20} stroke={2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className="t-headline">{d.name}</div>
          <Icons.chevR size={14} stroke={2.4} style={{ color: "var(--label-tertiary)", marginTop: 4 }}/>
        </div>
        <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 1 }}>{d.class}{d.altName ? " · " + d.altName : ""}</div>
        <div className="t-footnote" style={{ marginTop: 6, padding: "6px 8px", background: "var(--fill-quaternary)", borderRadius: 6, color: "var(--label-primary)", fontFamily: "var(--font-mono)" }}>{d.dose}</div>
      </div>
    </button>
  );
}

export function MobileDrugList({ nav }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearch = () => { setSearchOpen(o => !o); setQ(''); };

  const categoryDrugs = ACLS_DRUGS.filter(d => {
    if (filter === "all") return true;
    if (filter === "vaso") return (d.category || "").match(/Vasopresor|Inotropik/);
    if (filter === "arrhythmia") return (d.category || "").match(/Antiaritmia|Bradiaritmia/);
    if (filter === "thrombo") return (d.category || "").includes("Antitrombotik");
    if (filter === "antidot") return (d.category || "").includes("Antidot");
    return true;
  });

  const searchDrugs = ACLS_DRUGS.filter(d =>
    !q.trim() || (d.name + ' ' + (d.altName || '') + ' ' + (d.class || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <NavBar right={
        <button className="nb-btn glyph" onClick={toggleSearch} style={{
          background: searchOpen ? 'var(--accent-tint)' : 'transparent',
          color: searchOpen ? 'var(--accent)' : 'inherit',
          borderRadius: 10,
          transition: 'background 200ms var(--ease-out), color 200ms',
        }}>
          <span key={String(searchOpen)} style={{ display: 'inline-flex', animation: 'acls-fade-in 150ms var(--ease-out) both' }}>
            {searchOpen ? <Icons.cross size={18} stroke={2.4}/> : <Icons.search size={18} stroke={2}/>}
          </span>
        </button>
      }/>
      <LargeTitle>Obat ACLS</LargeTitle>
      {searchOpen ? (
        <>
          <div style={{ animation: 'acls-search-in 220ms var(--ease-out) both' }}>
            <SearchField placeholder="Cari obat…" value={q} onChange={setQ}/>
          </div>
          <div style={{ padding: "0 16px 12px", animation: 'acls-fadeslide 260ms 60ms var(--ease-out) both' }}>
            {searchDrugs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--label-secondary)" }}>
                <div className="t-headline" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
                <div className="t-footnote">Coba kata kunci lain</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searchDrugs.map(d => <DrugCard key={d.key} d={d} onPress={() => nav.push({ screen: "drug", id: d.key })}/>)}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="chips-scroll" style={{ padding: "0 16px 8px", display: "flex", gap: 6, overflowX: "auto" }}>
            {DRUG_FILTERS.map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)} className="ios-btn sm pill"
                style={{ background: filter === f.v ? "var(--accent)" : "var(--fill-tertiary)", color: filter === f.v ? "var(--accent-fg)" : "var(--label-primary)", fontSize: 13, height: 30, padding: "0 14px", flexShrink: 0 }}>
                {f.label}
              </button>
            ))}
          </div>
          <SectionHeader>{categoryDrugs.length} obat · PERKI 2021 · AHA 2025</SectionHeader>
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryDrugs.map(d => <DrugCard key={d.key} d={d} onPress={() => nav.push({ screen: "drug", id: d.key })}/>)}
          </div>
        </>
      )}
      <SectionFooter>Sumber: PERKI 2021 · AHA 2025 · verifikasi dosis dengan apoteker / pharmacopoeia setempat.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   DRUG DETAIL
   ============================================================ */
export function MobileDrugDetail({ nav, id }) {
  const d = ACLS_DRUGS.find(x => x.key === id) || ACLS_DRUGS[0];
  const { isFav: isFavDrug, toggle: toggleDrug } = useFavorites();
  return (
    <>
      <NavBar back="Obat" onBack={nav.pop} right={
        <button className="nb-btn glyph"
          onClick={() => toggleDrug('drug', id)}
          style={{ color: isFavDrug('drug', id) ? 'var(--warning)' : undefined }}>
          {isFavDrug('drug', id)
            ? <Icons.starFill size={18}/>
            : <Icons.star size={18} stroke={2}/>}
        </button>
      }/>
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: d.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.pill size={32} stroke={2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-title-2">{d.name}</div>
          {d.altName && <div className="t-footnote" style={{ color: "var(--label-tertiary)", marginTop: 1 }}>juga: {d.altName}</div>}
          <div className="t-subheadline" style={{ color: "var(--label-secondary)", marginTop: 2 }}>{d.class}</div>
        </div>
      </div>
      <SectionHeader>Indikasi</SectionHeader>
      <div style={{ padding: "0 16px 12px" }}>
        <div className="t-body" style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", lineHeight: 1.4 }}>{d.indication}</div>
      </div>
      <SectionHeader>Dosis</SectionHeader>
      <div style={{ padding: "0 16px" }}>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(180deg, " + d.tint + "14, " + d.tint + "06)", boxShadow: "inset 0 0 0 0.5px " + d.tint + "33" }}>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>Dosis awal</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: d.tint, marginTop: 2 }}>{d.dose}</div>
          <div className="t-caption-2" style={{ color: "var(--label-secondary)", marginTop: 12 }}>Pengulangan</div>
          <div className="t-callout" style={{ marginTop: 2 }}>{d.repeat}</div>
        </div>
      </div>
      <SectionHeader>Persiapan</SectionHeader>
      <List><Row label="Cara persiapan" sub={d.prep} chev={false}/></List>
      <SectionHeader>Catatan klinis</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {d.pearls.map((p, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 10, background: "var(--accent-tint)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{i + 1}</span>
            <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.4 }}>{p}</span>
          </div>
        ))}
      </div>
      <SectionHeader>Kontraindikasi &amp; perhatian</SectionHeader>
      <div style={{ padding: "0 16px 16px" }}>
        <Alert kind="warn" title="Perhatian">{d.contra}</Alert>
      </div>
      <SectionFooter>{d.source ? d.source + " · " : ""}Verifikasi dosis dengan apoteker · konfirmasi compatibility (Y-site).</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   ECG LIST
   ============================================================ */
const EKG_SEV_FILTERS = [
  { v: 'all',           label: 'Semua' },
  { v: 'shockable',     label: 'Shockable' },
  { v: 'non-shockable', label: 'Non-shock' },
  { v: 'stable',        label: 'Stabil' },
];

export function MobileEkgList({ nav }) {
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearch = () => { setSearchOpen(o => !o); setQ(''); };

  const sevRhythms = sev === 'all' ? ACLS_RHYTHMS : ACLS_RHYTHMS.filter(r => r.severity === sev);

  const searchRhythms = ACLS_RHYTHMS.filter(r =>
    !q.trim() || (r.name + ' ' + (r.short || '')).toLowerCase().includes(q.toLowerCase())
  );

  const RhythmCard = ({ r }) => (
    <button onClick={() => nav.push({ screen: "ekg", id: r.key })}
      style={{ padding: "10px 12px 12px", borderRadius: 14, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", border: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div>
          <div className="t-headline">{r.name}</div>
          <div className="t-caption-1" style={{ color: "var(--label-secondary)", marginTop: 1 }}>{r.short}</div>
        </div>
        <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>{r.severity}</span>
      </div>
      <RhythmStrip kind={r.key} width={320} height={48} color={r.tint}/>
    </button>
  );

  return (
    <>
      <NavBar right={
        <button className="nb-btn glyph" onClick={toggleSearch} style={{
          background: searchOpen ? 'var(--accent-tint)' : 'transparent',
          color: searchOpen ? 'var(--accent)' : 'inherit',
          borderRadius: 10,
          transition: 'background 200ms var(--ease-out), color 200ms',
        }}>
          <span key={String(searchOpen)} style={{ display: 'inline-flex', animation: 'acls-fade-in 150ms var(--ease-out) both' }}>
            {searchOpen ? <Icons.cross size={18} stroke={2.4}/> : <Icons.search size={18} stroke={2}/>}
          </span>
        </button>
      }/>
      <LargeTitle>Pustaka EKG</LargeTitle>
      {searchOpen ? (
        <>
          <div style={{ animation: 'acls-search-in 220ms var(--ease-out) both' }}>
            <SearchField placeholder="Cari irama EKG…" value={q} onChange={setQ}/>
          </div>
          <div style={{ padding: "0 16px 12px", animation: 'acls-fadeslide 260ms 60ms var(--ease-out) both' }}>
            {searchRhythms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--label-secondary)" }}>
                <div className="t-headline" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
                <div className="t-footnote">Coba kata kunci lain</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searchRhythms.map(r => <RhythmCard key={r.key} r={r}/>)}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="chips-scroll" style={{ padding: "6px 16px 10px", display: "flex", gap: 6, overflowX: "auto" }}>
            {EKG_SEV_FILTERS.map(f => (
              <button key={f.v} onClick={() => setSev(f.v)} className={`ios-btn sm pill${sev === f.v ? ' active' : ''}`}
                style={{ fontSize: 13, height: 30, padding: "0 14px", flexShrink: 0 }}>
                {f.label}
              </button>
            ))}
          </div>
          <SectionHeader>Irama · {sevRhythms.length}</SectionHeader>
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {sevRhythms.map(r => <RhythmCard key={r.key} r={r}/>)}
          </div>
        </>
      )}
      <SectionFooter>Strip ilustratif · selalu konfirmasi dengan 12-lead EKG.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   ECG DETAIL
   ============================================================ */
const EKG_SEV_LABEL = { shockable: 'Shockable', 'non-shockable': 'Non-Shockable', stable: 'Stabil', unstable: 'Tidak Stabil', critical: 'Kritis', normal: 'Normal' };
const MORPH_FIELDS = [
  { key: 'rate',        label: 'Rate' },
  { key: 'rhythm',      label: 'Irama' },
  { key: 'pWave',       label: 'Gel. P' },
  { key: 'prInterval',  label: 'Interval PR' },
  { key: 'qrsDuration', label: 'Durasi QRS' },
  { key: 'stT',         label: 'ST / T' },
];

export function MobileEkgDetail({ nav, id }) {
  const r = ACLS_RHYTHMS.find(x => x.key === id) || ACLS_RHYTHMS[0];
  const hasMorph = r.morphology && Object.values(r.morphology).some(v => v);
  const hasMgmt  = r.management && (r.management.immediate?.length || r.management.drugs?.length || r.management.notes?.length);
  const { isFav: isFavEkg, toggle: toggleEkg } = useFavorites();

  return (
    <>
      {/* [1] Header */}
      <NavBar back="EKG" onBack={nav.pop} right={
        <button className="nb-btn glyph"
          onClick={() => toggleEkg('ekg', id)}
          style={{ color: isFavEkg('ekg', id) ? 'var(--warning)' : undefined }}>
          {isFavEkg('ekg', id)
            ? <Icons.starFill size={18}/>
            : <Icons.star size={18} stroke={2}/>}
        </button>
      }/>
      <div style={{ padding: "4px 20px 10px" }}>
        <div className="t-title-2">{r.name}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <span className="ios-tag" style={{ background: r.tint + "22", color: r.tint, textTransform: "uppercase" }}>
            {EKG_SEV_LABEL[r.severity] || r.severity}
          </span>
        </div>
      </div>

      {/* [2] EKG Image */}
      <div style={{ padding: "0 16px 12px" }}>
        <EkgImage rhythm={r} style={{ minHeight: 80 }} />
      </div>

      {/* [3] Definisi */}
      {r.definition ? (
        <>
          <SectionHeader>Definisi</SectionHeader>
          <div style={{ padding: "0 16px 12px" }}>
            <div className="t-body" style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", lineHeight: 1.5 }}>
              {r.definition}
            </div>
          </div>
        </>
      ) : null}

      {/* [4] Ciri Pengenalan */}
      <SectionHeader>Ciri Pengenalan</SectionHeader>
      <div style={{ padding: "0 16px 12px" }}>
        <div className="t-body" style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", lineHeight: 1.4 }}>
          {r.features}
        </div>
      </div>

      {/* [5] Morfologi */}
      {hasMorph ? (
        <>
          <SectionHeader>Morfologi EKG</SectionHeader>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", overflow: "hidden" }}>
              {MORPH_FIELDS.filter(f => r.morphology[f.key]).map((f, i) => (
                <div key={f.key} style={{ display: "flex", gap: 10, padding: "9px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                  <span className="t-caption-2" style={{ color: "var(--label-secondary)", minWidth: 88, flexShrink: 0, paddingTop: 1, fontWeight: 600 }}>{f.label}</span>
                  <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{r.morphology[f.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* [6] Kriteria Diagnostik */}
      {r.criteria?.length > 0 ? (
        <>
          <SectionHeader>Kriteria Diagnostik</SectionHeader>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", overflow: "hidden" }}>
              {r.criteria.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "9px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                  <span style={{ color: r.tint, fontWeight: 700, flexShrink: 0, fontSize: 13, marginTop: 1 }}>✓</span>
                  <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* [7] Tatalaksana */}
      {hasMgmt ? (
        <>
          <SectionHeader>Tatalaksana</SectionHeader>
          <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            {r.management.immediate?.length > 0 && (
              <div style={{ background: r.tint + "10", borderRadius: 12, border: "0.5px solid " + r.tint + "40", padding: "12px 14px" }}>
                <div className="t-caption-2" style={{ color: r.tint, fontWeight: 700, marginBottom: 8 }}>TINDAKAN SEGERA</div>
                {r.management.immediate.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginTop: i > 0 ? 7 : 0, alignItems: "flex-start" }}>
                    <span className="t-footnote" style={{ color: r.tint, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {r.management.drugs?.length > 0 && (
              <div style={{ background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", padding: "12px 14px" }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, marginBottom: 8 }}>OBAT-OBATAN</div>
                {r.management.drugs.map((drug, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginTop: i > 0 ? 7 : 0, alignItems: "flex-start" }}>
                    <span className="t-footnote" style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>💊</span>
                    <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{drug}</span>
                  </div>
                ))}
              </div>
            )}
            {r.management.notes?.length > 0 && (
              <div style={{ background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", padding: "12px 14px" }}>
                <div className="t-caption-2" style={{ color: "var(--label-secondary)", fontWeight: 700, marginBottom: 8 }}>CATATAN KLINIS</div>
                {r.management.notes.map((note, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginTop: i > 0 ? 7 : 0, alignItems: "flex-start" }}>
                    <span className="t-footnote" style={{ color: "var(--label-tertiary)", flexShrink: 0, marginTop: 1 }}>•</span>
                    <span className="t-footnote" style={{ color: "var(--label-secondary)", lineHeight: 1.45 }}>{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* [8] Diagnosis Banding */}
      {r.ddx?.length > 0 ? (
        <>
          <SectionHeader>Diagnosis Banding</SectionHeader>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "var(--bg-tertiary)", borderRadius: 12, boxShadow: "var(--shadow-1)", overflow: "hidden" }}>
              {r.ddx.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "9px 14px", borderTop: i > 0 ? "0.5px solid var(--separator)" : "none", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--label-tertiary)", flexShrink: 0, fontSize: 14, marginTop: 1 }}>↔</span>
                  <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* [9] Pitfalls */}
      {r.pitfalls?.length > 0 ? (
        <>
          <SectionHeader>Pitfalls &amp; Pearls</SectionHeader>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "rgba(255,196,0,0.10)", borderRadius: 12, border: "0.5px solid rgba(255,196,0,0.45)", padding: "12px 14px" }}>
              {r.pitfalls.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginTop: i > 0 ? 8 : 0, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, fontSize: 13 }}>⚠️</span>
                  <span className="t-footnote" style={{ color: "var(--label-primary)", lineHeight: 1.45 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* [10] Referensi */}
      {r.references?.length > 0 ? (
        <>
          <SectionHeader>Referensi</SectionHeader>
          <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            {r.references.map((ref, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--label-tertiary)", lineHeight: 1.5, paddingLeft: 10, borderLeft: "2px solid var(--fill-secondary)" }}>
                {ref.url
                  ? <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{ref.text}</a>
                  : ref.text}
              </div>
            ))}
          </div>
        </>
      ) : null}

      <SectionFooter>Lihat algoritma terkait untuk langkah lengkap.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   Hs & Ts
   ============================================================ */
export function MobileHsTs({ nav }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggle = (key) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const renderItem = (c, letter) => {
    const open = expanded.has(c.key);
    return (
      <button key={c.key} onClick={() => toggle(c.key)}
        style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-tertiary)", boxShadow: "var(--shadow-1)", textAlign: "left", border: open ? "0.5px solid " + c.tint + "55" : "0.5px solid transparent", display: "flex", flexDirection: "column", gap: open ? 8 : 0, transition: "border-color var(--dur-fast)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: c.tint, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{letter}</span>
          <span className="t-headline" style={{ flex: 1 }}>{c.name}</span>
          <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform var(--dur-fast)", color: "var(--label-tertiary)" }}><Icons.chevDown size={16} stroke={2}/></span>
        </div>
        {open && (
          <div style={{ paddingLeft: 38, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="t-footnote" style={{ color: "var(--label-secondary)" }}><strong style={{ color: "var(--label-primary)" }}>Clue:</strong> {c.clue}</div>
            <div className="t-footnote" style={{ color: "var(--label-secondary)" }}><strong style={{ color: c.tint }}>Rx:</strong> {c.rx}</div>
          </div>
        )}
      </button>
    );
  };
  return (
    <>
      <NavBar back="Algoritma" onBack={nav.pop} title="Hs &amp; Ts"/>
      <LargeTitle>Hs &amp; Ts</LargeTitle>
      <div style={{ padding: "0 20px 12px" }}>
        <div className="t-footnote" style={{ color: "var(--label-secondary)" }}>10 penyebab reversibel · cari sistematis selama resusitasi · ketuk untuk tatalaksana.</div>
      </div>
      <SectionHeader>5 Hs</SectionHeader>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ACLS_HS_TS.filter(x => x.group === "H").map(c => renderItem(c, "H"))}
      </div>
      <SectionHeader>5 Ts</SectionHeader>
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ACLS_HS_TS.filter(x => x.group === "T").map(c => renderItem(c, "T"))}
      </div>
      <SectionFooter>Cari sistematis tiap rhythm check pada cardiac arrest.</SectionFooter>
      <div style={{ height: 24 }}/>
    </>
  );
}

/* ============================================================
   Speed Dial FAB
   ============================================================ */
const SPEED_DIAL_ITEMS = [
  { key: 'shockable',    label: 'VF / pVT',       sub: 'Irama shockable',    icon: (s) => <Icons.boltFill size={s}/>,              tint: 'var(--danger)' },
  { key: 'nonshockable', label: 'PEA / Asistol',  sub: 'Irama non-shockable', icon: (s) => <Icons.flatline size={s} stroke={2.2}/>, tint: 'var(--info)' },
  { key: 'awaiting',     label: 'Belum terpasang', sub: 'Box 1 — pasang monitor', icon: (s) => <Icons.heart size={s} stroke={2}/>,   tint: 'var(--label-tertiary)' },
];

export function SpeedDial({ onClose, onPick }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 160,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      padding: '0 20px 106px',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.48)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}/>

      {/* Action items — rendered top-to-bottom (CPR nearest FAB) */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end' }}>
        {SPEED_DIAL_ITEMS.map((item, i) => (
          <button key={item.key} onClick={() => onPick(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'none', border: 0, cursor: 'pointer', padding: 0,
              animation: `acls-speeddial-item 240ms ${i * 45}ms var(--ease-spring) both`,
            }}>
            {/* Label pill */}
            <div style={{
              background: 'var(--bg-elevated)',
              color: 'var(--label-primary)',
              padding: '8px 14px',
              borderRadius: 12,
              boxShadow: 'var(--shadow-1), 0 0 0 0.5px var(--separator)',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 11, color: 'var(--label-secondary)', marginTop: 2 }}>{item.sub}</div>}
            </div>
            {/* Icon circle */}
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: item.tint, color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
            }}>
              {item.icon(20)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
