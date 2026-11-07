import { describe, it, expect } from 'vitest';
import { tbwFactor, totalBodyWater, freeWaterDeficit, adrogueDeltaNaPerLiter } from './sodium';

describe('Sodium / hypernatremia utils', () => {
  it('tbwFactor age & sex stratified', () => {
    expect(tbwFactor('m', 40)).toBe(0.6);
    expect(tbwFactor('m', 70)).toBe(0.5);
    expect(tbwFactor('f', 40)).toBe(0.5);
    expect(tbwFactor('f', 70)).toBe(0.45);
    expect(tbwFactor('m', NaN)).toBe(0.6); // usia kosong → dewasa
  });
  it('freeWaterDeficit: 70kg pria, Na 160 → ~6.0 L', () => {
    const tbw = totalBodyWater(70, 'm', 40); // 42 L
    expect(tbw).toBeCloseTo(42, 5);
    expect(freeWaterDeficit(tbw, 160)).toBeCloseTo(6.0, 3);
  });
  it('Adrogué ΔNa/L negatif utk cairan bebas-Na (menurunkan Na)', () => {
    const tbw = 42;
    expect(adrogueDeltaNaPerLiter(0, 160, tbw)).toBeCloseTo(-160 / 43, 4);   // D5W
    expect(adrogueDeltaNaPerLiter(77, 160, tbw)).toBeCloseTo(-83 / 43, 4);   // NaCl 0.45%
  });
  it('NaCl 0.9% tidak menurunkan Na bila Na < 154 (ΔNa/L positif)', () => {
    expect(adrogueDeltaNaPerLiter(154, 150, 42)).toBeGreaterThan(0);
  });
});
