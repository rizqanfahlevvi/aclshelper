import type { ComponentType } from 'react';
import { KaliumCalc } from './ElektroKalium';
import { NatriumCalc } from './ElektroNatrium';
import { KalsiumCalc } from './ElektroKalsium';
import { MagnesiumCalc } from './ElektroMagnesium';

/* Kalkulator Koreksi Elektrolit dengan modul UI tersendiri (port ICU Helper).
   Entri di CALCULATORS tetap ada untuk menu/favorit; layar detail merender
   modul ini sebagai ganti field + compute() generik. */
export const ELEKTRO_MODULES: Record<string, ComponentType> = {
  'k-correction': KaliumCalc,
  'na-correction': NatriumCalc,
  'ca-correction': KalsiumCalc,
  'mg-correction': MagnesiumCalc,
};

export const isElektroModule = (key: string) => key in ELEKTRO_MODULES;

export function ElektroModule({ calcKey }: { calcKey: string }) {
  const Mod = ELEKTRO_MODULES[calcKey];
  return Mod ? <Mod /> : null;
}
