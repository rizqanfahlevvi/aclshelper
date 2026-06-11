import React, { useState } from 'react';
import { Icons } from '../../components/base';
import type { Nav } from '../../types';

const CREATOR_PHOTO = '/about/rizqan.png';

const LINKEDIN_URL = 'https://www.linkedin.com/in/rizqanfahlevvi';

const MDKIT_APPS = [
  { name: 'ICU Helper',    sub: 'Panduan tata laksana ICU',          url: 'https://icuhelper.mdkit.app/',      icon: '🏥', available: true  },
  { name: 'ResNeo Helper', sub: 'Resusitasi neonatus',                url: 'https://resneohelper.mdkit.app/',   icon: '👶', available: true  },
  { name: 'PICNIC Helper', sub: 'Dalam pengembangan',                 url: null,                                icon: '🧒', available: false },
];

const CHANGELOG: { version: string; label: string; date: string; current: boolean; items: string[] }[] = [
  {
    version: '2.0', label: 'Saat ini', date: '2025', current: true,
    items: [
      'Animasi CPR — ikon tangan PUSH & paru BREATHE per ketukan',
      '19 tab Teori interaktif (E-C Coupling, Otonom, Vasopressor, Post-Arrest, Ventilasi Mekanik, dan lainnya)',
      'Diagram konduksi jantung per ritme EKG (ConductionDiagram)',
      'Sistem favorit / bookmark di semua konten',
      'Kalkulator ABG (Asidosis-Alkalosis) & RSI Intubasi',
      'URL hash routing — setiap halaman bisa di-bookmark & dibagikan',
      'Desktop layout dua kolom penuh',
      'Dark mode',
      'PWA — bisa diinstall & digunakan offline',
    ],
  },
  {
    version: '1.0', label: 'Rilis Awal', date: '2024', current: false,
    items: [
      'Algoritma ACLS lengkap (VF/pVT, PEA/Asistol, Bradikardi, Takikardi, dan lainnya)',
      'Pustaka 25 obat emergensi dengan dosis & cara pemberian',
      'Pustaka 16 ritme EKG dengan fitur, mekanisme, dan tata laksana',
      'CPR Workspace dengan timer siklus 2 menit',
      'Kalkulator klinis (CHADS₂, CHA₂DS₂-VASc, TIMI, GRACE, dll.)',
      'Hs & Ts — referensi penyebab reversibel henti jantung',
    ],
  },
];

interface AboutProps { isMobile?: boolean; nav?: Nav; onFeedback?: () => void; }

export function AboutScreen({ isMobile = true, nav, onFeedback }: AboutProps) {
  const [openVer, setOpenVer] = useState('2.0');
  const [photoErr, setPhotoErr] = useState(false);

  const content = (
    <div style={{ maxWidth: isMobile ? undefined : 600 }}>

      {/* App header */}
      <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 22,
          background: 'var(--danger)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, boxShadow: '0 8px 28px rgba(255,59,48,0.30)' }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#fff">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em',
          color: 'var(--label-primary)' }}>ACLS Helper</div>
        <div style={{ display: 'inline-block', margin: '6px 0',
          background: 'rgba(255,59,48,0.12)', color: 'var(--danger)',
          fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em',
          padding: '3px 12px', borderRadius: 8 }}>V2.0</div>
        <div style={{ fontSize: '0.9375rem', color: 'var(--label-secondary)',
          fontStyle: 'italic', marginTop: 2 }}>
          Ur Daily Cardiac Problem Companion
        </div>
      </div>

      {/* Tentang */}
      <div style={{ padding: '0 16px 16px' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 4px 6px' }}>TENTANG</div>
        <div style={{ padding: '16px', borderRadius: 14, background: 'var(--bg-tertiary)',
          boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontSize: '0.9375rem', color: 'var(--label-primary)', lineHeight: 1.65 }}>
            ACLS Helper merupakan bagian dari{' '}
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MD Kit</span>
            , cheatsheet interaktif problem kegawatdaruratan kardiovaskular. Dibuat sebagai alat bantu
            sejawat dalam menentukan keputusan klinis secara bedside.
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid var(--separator)',
            fontSize: '0.8125rem', color: 'var(--label-tertiary)', fontStyle: 'italic' }}>
            Ur bedside clinical companion
          </div>
        </div>
      </div>

      {/* Dibuat oleh */}
      <div style={{ padding: '0 16px 16px' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 4px 6px' }}>DIBUAT OLEH</div>
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-tertiary)',
            boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(10,102,194,0.12)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!photoErr ? (
                <img src={CREATOR_PHOTO} alt="Rizqan"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setPhotoErr(true)}/>
              ) : (
                <Icons.user size={24} stroke={2} style={{ color: '#0A66C2' }}/>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--label-primary)' }}>Rizqan</div>
              <div style={{ fontSize: '0.8125rem', color: '#0A66C2', marginTop: 2 }}>Lihat profil LinkedIn →</div>
            </div>
            <Icons.chevR size={16} stroke={2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
          </div>
        </a>
      </div>

      {/* MD Kit */}
      <div style={{ padding: '0 16px 16px' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 4px 6px' }}>
          MD KIT — KUNJUNGI HELPER LAINNYA
        </div>
        <div style={{ borderRadius: 14, background: 'var(--bg-tertiary)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          {MDKIT_APPS.map((app, i) => (
            <React.Fragment key={app.name}>
              {i > 0 && <div style={{ height: 0.5, background: 'var(--separator)', marginLeft: 64 }}/>}
              {app.url ? (
                <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--fill-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem', flexShrink: 0 }}>{app.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--label-primary)' }}>{app.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--label-secondary)', marginTop: 2 }}>{app.sub}</div>
                    </div>
                    <Icons.chevR size={14} stroke={2} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}/>
                  </div>
                </a>
              ) : (
                <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.5 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--fill-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', flexShrink: 0 }}>{app.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--label-primary)' }}>{app.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--label-secondary)', marginTop: 2 }}>{app.sub}</div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--label-tertiary)',
                    background: 'var(--fill-tertiary)', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
                    Segera
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Feedback & Support */}
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={onFeedback}
          style={{ padding: '14px 12px', borderRadius: 14, background: 'var(--accent-tint)',
            border: '0.5px solid rgba(48,176,199,0.25)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.chat size={18} stroke={2} style={{ color: '#fff' }}/>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Feedback</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 2, lineHeight: 1.4 }}>Bug, saran, atau komentar</div>
          </div>
        </button>
        <a href="https://saweria.co/rizqanfahlevvi" target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: 'none', padding: '14px 12px', borderRadius: 14,
            background: 'rgba(255,149,0,0.10)', border: '0.5px solid rgba(255,149,0,0.25)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#FF9500,#E67300)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.coffee size={18} stroke={2} style={{ color: '#fff' }}/>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--label-primary)' }}>Dukung</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 2, lineHeight: 1.4 }}>Saweria — traktir kopi ☕</div>
          </div>
        </a>
      </div>

      {/* Changelog */}
      <div style={{ padding: '0 16px 40px' }}>
        <div className="t-caption-2" style={{ color: 'var(--label-secondary)', padding: '0 4px 6px' }}>CHANGELOG</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHANGELOG.map(ver => (
            <div key={ver.version} style={{ borderRadius: 14, background: 'var(--bg-tertiary)',
              boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
              <button onClick={() => setOpenVer(openVer === ver.version ? '' : ver.version)}
                style={{ width: '100%', padding: '14px 16px', background: 'none', border: 0,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: ver.current ? 'rgba(255,59,48,0.12)' : 'var(--fill-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800,
                    color: ver.current ? 'var(--danger)' : 'var(--label-secondary)' }}>v{ver.version}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--label-primary)',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
                    Versi {ver.version}
                    {ver.current && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--success)',
                        background: 'rgba(52,199,89,0.12)', padding: '1px 7px', borderRadius: 6 }}>
                        Saat ini
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--label-secondary)', marginTop: 1 }}>
                    {ver.label} · {ver.date}
                  </div>
                </div>
                <Icons.chevDown size={16} stroke={2.2}
                  style={{ color: 'var(--label-tertiary)', flexShrink: 0,
                    transform: openVer === ver.version ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms' }}/>
              </button>
              {openVer === ver.version && (
                <div style={{ padding: '2px 16px 14px', borderTop: '0.5px solid var(--separator)' }}>
                  {ver.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0',
                      borderBottom: i < ver.items.length - 1 ? '0.5px solid var(--separator-transparent, rgba(60,60,67,0.08))' : 'none' }}>
                      <span style={{ color: ver.current ? 'var(--danger)' : 'var(--label-tertiary)',
                        flexShrink: 0, marginTop: 3, fontSize: '0.625rem' }}>●</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--label-primary)', lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderBottom: '0.5px solid var(--separator)', flexShrink: 0,
          background: 'var(--bg-primary)' }}>
          <button onClick={() => nav?.pop()}
            style={{ height: 32, padding: '0 4px', background: 'none', border: 0,
              cursor: 'pointer', color: 'var(--label-secondary)', display: 'flex',
              alignItems: 'center', gap: 2, fontSize: '1rem' }}>
            <Icons.chevL size={18}/><span style={{ marginLeft: -2 }}>Kembali</span>
          </button>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--label-primary)' }}>Tentang</span>
          <div style={{ flex: 1 }}/>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {content}
    </div>
  );
}
