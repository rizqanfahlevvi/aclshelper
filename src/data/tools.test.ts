import { describe, it, expect } from 'vitest';
import { PALS_DRUGS } from './tools';
import { palsDose } from '../lib/doseMath';

/* Regresi bug audit: `max` pada defibrilasi/kardioversi sebelumnya
   diisi sbg angka "J/kg" (10, 2) tapi palsDose() memperlakukan `max`
   sbg dosis ABSOLUT — akibatnya kejutan PERTAMA pada anak >5kg salah
   ditampilkan terpotong jauh di bawah nilai sebenarnya (mis. 20kg
   harusnya 40 J defib, tertampil 10 J). */
describe('PALS_DRUGS — defibrilasi & kardioversi tidak salah terpotong', () => {
  const defibrilasi = PALS_DRUGS.find(d => d.key === 'defibrilasi')!;
  const kardioversi = PALS_DRUGS.find(d => d.key === 'kardioversi')!;

  it('defibrilasi 20kg → kejutan pertama 40 J (2 J/kg), TIDAK terpotong ke 10', () => {
    const r = palsDose(defibrilasi.dosePerKg, 20, defibrilasi.min, defibrilasi.max);
    expect(r.clamped).toBe(40);
    expect(r.isClamped).toBe(false);
  });

  it('defibrilasi 40kg → kejutan pertama 80 J, TIDAK terpotong', () => {
    const r = palsDose(defibrilasi.dosePerKg, 40, defibrilasi.min, defibrilasi.max);
    expect(r.clamped).toBe(80);
  });

  it('kardioversi 20kg → dosis pertama 10 J (0.5 J/kg), TIDAK terpotong ke 2', () => {
    const r = palsDose(kardioversi.dosePerKg, 20, kardioversi.min, kardioversi.max);
    expect(r.clamped).toBe(10);
    expect(r.isClamped).toBe(false);
  });

  it('kardioversi punya secondDosePerKg=2 (dosis ke-2) utk dihitung ulang di PalsScreen', () => {
    expect(kardioversi.secondDosePerKg).toBe(2);
  });

  it('adenosin punya secondDosePerKg=0.2 & secondMax=12 (dosis ke-2)', () => {
    const adenosin = PALS_DRUGS.find(d => d.key === 'adenosin')!;
    expect(adenosin.secondDosePerKg).toBe(0.2);
    expect(adenosin.secondMax).toBe(12);
  });

  it('defibrilasi dosis ke-2 (4 J/kg, plafon ganda min(10×BB,360)) — 20kg → 80 J (belum kena plafon)', () => {
    // 4×20=80; plafon min(10×20,360)=200 → 80 belum terpotong
    const wt = 20;
    const secondRaw = defibrilasi.secondDosePerKg! * wt;
    const secondClamped = Math.min(Math.max(secondRaw, 0), Math.min(10 * wt, 360));
    expect(secondClamped).toBe(80);
  });

  it('defibrilasi dosis ke-2 — 100kg → terpotong ke 360 J (plafon absolut, bukan 10×BB=1000)', () => {
    const wt = 100;
    const defibrilasi2 = PALS_DRUGS.find(d => d.key === 'defibrilasi')!;
    const secondRaw = defibrilasi2.secondDosePerKg! * wt; // 4×100=400
    const secondClamped = Math.min(Math.max(secondRaw, 0), Math.min(10 * wt, 360)); // min(1000,360)=360
    expect(secondClamped).toBe(360);
  });
});
