import { useSyncExternalStore } from 'react';

/* ============================================================
   ACLS Helper — Settings store (native, tanpa zustand)
   Store reaktif minimal berbasis useSyncExternalStore + localStorage.
   Menggantikan settingsStore.ts (zustand) dari ICU Helper agar tidak
   menambah dependency. Menjadi SATU sumber kebenaran untuk tema, font,
   bw-mode, reading-mode, dan haptics — menggantikan state useState yang
   dulu tersebar di App.tsx.
   ============================================================ */

export type FontFamily =
  | 'lexend' | 'inter' | 'roboto' | 'jetbrains' | 'system'
  | 'poppins' | 'montserrat' | 'plus-jakarta' | 'outfit'
  | 'space-grotesk' | 'fira-code' | 'quicksand';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  fontFamily: FontFamily;
  fontScale: number;    // 0.8 – 1.5
  fontWeight: number;   // offset -300 … +400 (kelipatan 50)
  themeMode: ThemeMode;
  bwMode: boolean;      // mode kontras tinggi (hitam-putih)
  readingMode: boolean; // mode baca serif (hanya di halaman teori/algoritma)
  haptics: boolean;     // feedback getaran
}

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: 'lexend',
  fontScale: 1,
  fontWeight: 0,
  themeMode: 'system',
  bwMode: false,
  readingMode: false,
  haptics: true,
};

export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.5;
export const FONT_WEIGHT_MIN = -300;
export const FONT_WEIGHT_MAX = 400;

const KEY = 'acls-helper-settings';

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return sanitize({ ...DEFAULT_SETTINGS, ...parsed });
    }
  } catch { /* abaikan, jatuh ke migrasi/­default */ }

  /* Migrasi dari key lama (Fase 1 & 4) agar setting pengguna tidak hilang. */
  const migrated: Settings = { ...DEFAULT_SETTINGS };
  const fs = parseFloat(localStorage.getItem('acls_font_scale') || '');
  if (!isNaN(fs)) migrated.fontScale = fs;
  if (localStorage.getItem('acls_bw_mode') === '1') migrated.bwMode = true;
  /* Tema lama tidak dipersist di ACLS, jadi tetap 'system'. */
  return sanitize(migrated);
}

function sanitize(s: Settings): Settings {
  return {
    ...s,
    fontScale: clamp(Number(s.fontScale) || 1, FONT_SCALE_MIN, FONT_SCALE_MAX),
    fontWeight: clamp(Math.round((Number(s.fontWeight) || 0) / 50) * 50, FONT_WEIGHT_MIN, FONT_WEIGHT_MAX),
  };
}

let state: Settings = load();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage penuh/diblokir */ }
}

function emit() { listeners.forEach(l => l()); }

export function getSettings(): Settings {
  return state;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  const next = sanitize({ ...state, [key]: value });
  if (next[key] === state[key] && JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  persist();
  emit();
}

export function resetSettings(): void {
  state = { ...DEFAULT_SETTINGS };
  persist();
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Hook reaktif — mengembalikan seluruh objek Settings (referensi stabil selama tidak berubah). */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** Feedback getaran ringan; no-op jika haptics dimatikan atau tidak didukung. */
export function haptic(ms = 30): void {
  if (state.haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch { /* diabaikan */ }
  }
}
