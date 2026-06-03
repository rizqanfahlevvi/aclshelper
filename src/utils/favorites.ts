import { useState, useEffect } from 'react';

export interface FavEntry { type: string; key: string; }

export function useFavorites() {
  const [favs, setFavs] = useState<FavEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('acls_favorites') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const sync = () => {
      try { setFavs(JSON.parse(localStorage.getItem('acls_favorites') || '[]')); } catch {}
    };
    window.addEventListener('acls-favorites-changed', sync);
    return () => window.removeEventListener('acls-favorites-changed', sync);
  }, []);

  const isFav = (type: string, key: string) =>
    favs.some(f => f.type === type && f.key === key);

  const toggle = (type: string, key: string) => {
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
