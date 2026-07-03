/* ============================================================
   ACLS Helper — Cache & storage utilities
   Estimasi penyimpanan, refresh cache/SW, dan hard reset.
   Diadaptasi dari cacheUtils.ts ICU Helper — TANPA clearPatientDb
   karena ACLS Helper tidak memakai database pasien IndexedDB.
   ============================================================ */

export interface StorageEstimateInfo {
  used: string;       // human readable
  quota: string;      // human readable
  percentage: number;
}

/** Format byte ke ukuran manusiawi (KB/MB/GB). */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/** Estimasi penggunaan storage via StorageManager API, fallback ke localStorage. */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedValue = estimate.usage || 0;
      const quotaValue = estimate.quota || 1024 * 1024 * 100; // 100MB fallback
      return {
        used: formatBytes(usedValue),
        quota: formatBytes(quotaValue),
        percentage: quotaValue > 0 ? Math.round((usedValue / quotaValue) * 100) : 0,
      };
    } catch (e) {
      console.warn('Gagal mengambil estimasi storage:', e);
    }
  }

  let localStorageSize = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (const k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
          localStorageSize += ((localStorage[k] || '').length + k.length) * 2;
        }
      }
    } catch (e) {
      console.warn('Gagal menghitung ukuran localStorage:', e);
    }
  }

  return {
    used: formatBytes(localStorageSize),
    quota: '10 MB (Local)',
    percentage: Math.min(100, Math.round((localStorageSize / (10 * 1024 * 1024)) * 100)),
  };
}

/**
 * Refresh cache & reload: unregister service worker, hapus Cache Storage
 * (aset PWA), lalu reload. TIDAK menghapus localStorage/preferensi.
 */
export async function refreshCacheAndReload(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (navigator.serviceWorker) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) await registration.unregister();
    } catch (e) {
      console.warn('Gagal unregister ServiceWorker:', e);
    }
  }

  if (window.caches) {
    try {
      const keys = await window.caches.keys();
      for (const key of keys) await window.caches.delete(key);
    } catch (e) {
      console.warn('Gagal menghapus Caches:', e);
    }
  }

  window.location.reload();
}

/**
 * Hard reset: bersihkan cache + SW, hapus semua localStorage, lalu kembali
 * ke beranda. (ACLS Helper tidak punya database pasien untuk dihapus.)
 */
export async function performHardReset(): Promise<void> {
  if (typeof window === 'undefined') return;

  await refreshCacheAndReload();
  try { localStorage.clear(); } catch { /* diabaikan */ }
  window.location.href = '/';
}
