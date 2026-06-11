import { useState, useEffect, useRef } from 'react';
import { ACLS_ALGORITHMS, ACLS_DRUGS, ACLS_RHYTHMS } from '../../data';
import { CALCULATORS } from '../../data/calculators';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (type: string, id: string) => void;
}

interface Result {
  type: string;
  id: string;
  name: string;
  sub: string;
  tint: string;
}

const GROUPS = [
  { key: 'algo',  label: 'ALGORITMA' },
  { key: 'drug',  label: 'OBAT' },
  { key: 'ekg',   label: 'EKG' },
  { key: 'calc',  label: 'KALKULATOR' },
];

function search(q: string): Record<string, Result[]> {
  const lq = q.toLowerCase();
  const algo: Result[] = ACLS_ALGORITHMS
    .filter(a => a.label.toLowerCase().includes(lq) || a.sub.toLowerCase().includes(lq) || a.tag.toLowerCase().includes(lq))
    .slice(0, 5)
    .map(a => ({ type: 'algo', id: a.key, name: a.label, sub: a.sub, tint: a.tint }));

  const drug: Result[] = ACLS_DRUGS
    .filter(d => d.name.toLowerCase().includes(lq) || d.category.toLowerCase().includes(lq) || d.class.toLowerCase().includes(lq) || (d.altName || '').toLowerCase().includes(lq))
    .slice(0, 5)
    .map(d => ({ type: 'drug', id: d.key, name: d.name, sub: d.category + ' — ' + d.class, tint: d.tint }));

  const ekg: Result[] = ACLS_RHYTHMS
    .filter(r => r.name.toLowerCase().includes(lq) || r.short.toLowerCase().includes(lq) || r.severity.toLowerCase().includes(lq))
    .slice(0, 5)
    .map(r => ({ type: 'ekg', id: r.key, name: r.name, sub: r.severity, tint: r.tint }));

  const calc: Result[] = CALCULATORS
    .filter(c => c.name.toLowerCase().includes(lq) || c.category.toLowerCase().includes(lq) || (c.short || '').toLowerCase().includes(lq))
    .slice(0, 5)
    .map(c => ({ type: 'calc', id: c.key, name: c.name, sub: c.category, tint: c.tint }));

  return { algo, drug, ekg, calc };
}

export function SearchModal({ open, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = query.trim() ? search(query.trim()) : null;
  const hasResults = results && Object.values(results).some(r => r.length > 0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'acls-fadein 160ms ease both',
      }}/>

      {/* Modal */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 301,
        display: 'flex', justifyContent: 'center',
        padding: '64px 20px 20px',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 560,
          background: 'var(--bg-primary)',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 0 0 0.5px var(--separator)',
          overflow: 'hidden',
          pointerEvents: 'auto',
          animation: 'acls-fadeslide 200ms var(--ease-out) both',
        }}>
          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px',
            borderBottom: '0.5px solid var(--separator)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--label-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari algoritma, obat, ritme EKG, atau kalkulator…"
              style={{
                flex: 1, background: 'none', border: 0, outline: 'none',
                fontSize: '1rem', color: 'var(--label-primary)',
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{
                background: 'var(--fill-tertiary)', border: 0, borderRadius: 6,
                padding: '2px 8px', cursor: 'pointer',
                color: 'var(--label-secondary)', fontSize: '0.75rem', fontWeight: 600,
              }}>✕</button>
            )}
            <button onClick={onClose} style={{
              background: 'var(--fill-tertiary)', border: 0, borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer',
              color: 'var(--label-secondary)', fontSize: '0.75rem', fontWeight: 600,
            }}>Esc</button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {!query.trim() && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--label-tertiary)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <div style={{ fontSize: '0.875rem' }}>Mulai ketik untuk mencari</div>
              </div>
            )}

            {query.trim() && !hasResults && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--label-tertiary)', fontSize: '0.875rem' }}>
                Tidak ada hasil untuk &ldquo;<strong style={{ color: 'var(--label-secondary)' }}>{query}</strong>&rdquo;
              </div>
            )}

            {results && GROUPS.map(group => {
              const items = results[group.key];
              if (!items?.length) return null;
              return (
                <div key={group.key}>
                  <div className="t-caption-2" style={{
                    color: 'var(--label-secondary)', padding: '10px 16px 4px',
                    letterSpacing: '0.05em',
                  }}>{group.label}</div>
                  {items.map(item => (
                    <button key={item.id}
                      onClick={() => { onNavigate(item.type, item.id); onClose(); }}
                      style={{
                        width: '100%', padding: '10px 16px',
                        background: 'none', border: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--fill-quaternary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: item.tint, flexShrink: 0,
                      }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--label-primary)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--label-secondary)', marginTop: 1 }}>
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
