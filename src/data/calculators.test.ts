import { describe, it, expect } from 'vitest';
import { CALCULATORS } from './calculators';

/* Helper: ambil kalkulator by key, panggil compute dengan nilai. */
const calc = (key: string) => {
  const c = CALCULATORS.find(x => x.key === key);
  if (!c) throw new Error(`Kalkulator '${key}' tidak ditemukan`);
  return c.compute;
};

describe('Kontribusi skor (breakdown)', () => {
  const scoringKeys = ['chads2vasc', 'hasbled', 'heart', 'grace', 'timi-ua', 'timi-stemi', 'wells-pe'];
  it('setiap skoring punya breakdown yang jumlahnya = skor total', () => {
    for (const k of scoringKeys) {
      const c = CALCULATORS.find(x => x.key === k)!;
      // uji beberapa kombinasi input default + sebagian aktif
      const r = c.compute({ chf: true, hypertension: true, stroke: true, dm_htn: true, sbpLow: true, dvtSigns: true, altDx: true, history: 2, ekg: 1, age: 65, hr: 90, sbp: 90, creatinine: 2, killip: 2, cardiacArrest: true });
      expect(r.breakdown, `${k} harus punya breakdown`).toBeDefined();
      const sum = r.breakdown!.reduce((s, it) => s + it.points, 0);
      expect(sum, `${k}: Σ kontribusi harus = skor`).toBe(Number(r.score));
    }
  });
});

describe('Integritas daftar kalkulator', () => {
  it('setiap kalkulator punya key unik', () => {
    const keys = CALCULATORS.map(c => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('setiap kalkulator punya compute() yang mengembalikan score & label', () => {
    for (const c of CALCULATORS) {
      const r = c.compute({});
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('label');
      expect(typeof r.color).toBe('string');
    }
  });
});

describe('CHA₂DS₂-VASc', () => {
  const f = calc('chads2vasc');
  it('skor 0 → risiko rendah', () => {
    expect(f({}).score).toBe(0);
    expect(f({}).label).toMatch(/Rendah/);
  });
  it('perempuan saja (skor 1) → risiko rendah', () => {
    const r = f({ female: true });
    expect(r.score).toBe(1);
    expect(r.label).toMatch(/Rendah/);
  });
  it('laki-laki skor 1 → risiko sedang', () => {
    expect(f({ chf: true }).label).toMatch(/Sedang/);
  });
  it('perempuan skor 2 (1 dari gender) → risiko sedang, bukan tinggi', () => {
    const r = f({ female: true, chf: true });
    expect(r.score).toBe(2);
    expect(r.label).toMatch(/Sedang/); // setara laki-laki skor 1
  });
  it('perempuan skor 3 (2 nyata + gender) → risiko tinggi', () => {
    const r = f({ female: true, chf: true, hypertension: true });
    expect(r.score).toBe(3);
    expect(r.label).toMatch(/Tinggi/);
  });
  it('CHF+HTN+usia≥75 (skor 4) → risiko tinggi', () => {
    const r = f({ chf: true, hypertension: true, age75: true });
    expect(r.score).toBe(4);
    expect(r.label).toMatch(/Tinggi/);
  });
});

describe('HAS-BLED', () => {
  const f = calc('hasbled');
  it('skor 0 → risiko rendah', () => expect(f({}).label).toMatch(/Rendah/));
  it('skor 2 → risiko sedang', () => {
    expect(f({ hypertension: true, stroke: true }).score).toBe(2);
    expect(f({ hypertension: true, stroke: true }).label).toMatch(/Sedang/);
  });
  it('skor 3 → risiko tinggi', () => {
    expect(f({ hypertension: true, stroke: true, elderly: true }).label).toMatch(/Tinggi/);
  });
});

describe('HEART Score', () => {
  const f = calc('heart');
  it('semua 0 → risiko rendah (MACE <2%)', () => {
    expect(f({ history: 0, ekg: 0, age: 0, riskfactors: 0, troponin: 0 }).score).toBe(0);
    expect(f({}).label).toMatch(/Rendah/);
  });
  it('skor 6 → risiko sedang', () => {
    expect(f({ history: 2, ekg: 2, age: 2, riskfactors: 0, troponin: 0 }).score).toBe(6);
    expect(f({ history: 2, ekg: 2, age: 2 }).label).toMatch(/Sedang/);
  });
  it('skor 10 → risiko tinggi', () => {
    expect(f({ history: 2, ekg: 2, age: 2, riskfactors: 2, troponin: 2 }).score).toBe(10);
    expect(f({ history: 2, ekg: 2, age: 2, riskfactors: 2, troponin: 2 }).label).toMatch(/Tinggi/);
  });
});

describe('GRACE Score', () => {
  const f = calc('grace');
  it('pasien muda & stabil → risiko rendah', () => {
    const r = f({ age: 25, hr: 60, sbp: 150, creatinine: 0.9, killip: 0 });
    expect(Number(r.score)).toBeLessThanOrEqual(108);
    expect(r.label).toMatch(/Rendah/);
  });
  it('pasien tua + henti jantung + Killip IV → risiko tinggi', () => {
    const r = f({ age: 85, hr: 160, sbp: 70, creatinine: 3, killip: 3, cardiacArrest: true, stDeviation: true, enzymes: true });
    expect(Number(r.score)).toBeGreaterThan(140);
    expect(r.label).toMatch(/Tinggi/);
  });
});

describe('MAP', () => {
  const f = calc('map');
  it('120/80 → MAP 93.3', () => expect(f({ sbp: 120, dbp: 80 }).score).toBe('93.3'));
  it('MAP <60 → hipoperfusi', () => expect(f({ sbp: 70, dbp: 40 }).label).toMatch(/Hipoperfusi/));
});

describe('Shock Index', () => {
  const f = calc('si');
  it('HR80/SBP120 → 0.67 normal-tinggi', () => {
    expect(f({ hr: 80, sbp: 120 }).score).toBe('0.67');
  });
  it('HR140/SBP80 → syok berat (SI≥1.5)', () => {
    expect(f({ hr: 140, sbp: 80 }).label).toMatch(/Berat/);
  });
});

describe('CrCl Cockcroft-Gault', () => {
  const f = calc('crcl');
  it('laki 65th 70kg Cr1.0 → ~76 mL/min', () => {
    // ((140-65)*70)/(72*1.0) = 72.9
    expect(f({ age: 65, weight: 70, creatinine: 1.0 }).score).toBe('73 mL/min');
  });
  it('perempuan faktor 0.85 diterapkan', () => {
    const male = parseInt(String(f({ age: 65, weight: 70, creatinine: 1.0 }).score));
    const female = parseInt(String(f({ age: 65, weight: 70, creatinine: 1.0, female: true }).score));
    expect(female).toBeLessThan(male);
  });
  it('basis IBW pada obesitas < basis aktual', () => {
    const actual = parseInt(String(f({ age: 65, weight: 120, height: 165, creatinine: 1.0, weightBasis: 'actual' }).score));
    const ideal = parseInt(String(f({ age: 65, weight: 120, height: 165, creatinine: 1.0, weightBasis: 'ideal' }).score));
    expect(ideal).toBeLessThan(actual);
  });
});

describe('Fibrinolisis STEMI', () => {
  const f = calc('fibrinolytic');
  it('inklusi tidak lengkap → tidak memenuhi', () => {
    expect(f({ stemiDiagnosis: true }).label).toMatch(/Tidak Terpenuhi/);
  });
  it('inklusi lengkap tanpa kontraindikasi → dapat diberikan', () => {
    expect(f({ stemiDiagnosis: true, onsetLt12h: true, noPci: true }).label).toMatch(/DAPAT DIBERIKAN/);
  });
  it('kontraindikasi absolut → tidak boleh', () => {
    expect(f({ stemiDiagnosis: true, onsetLt12h: true, noPci: true, activeBleeding: true }).label).toMatch(/ABSOLUT/);
  });
});

describe('ABG interpreter — verifikasi rumus kompensasi (Pemeriksaan 2)', () => {
  const f = calc('abg');
  it('normal (7.40/40/24)', () => expect(f({ ph: 7.40, pco2: 40, hco3: 24 }).label).toMatch(/Normal/));

  it('DKA: HAGMA, Winter adekuat, delta ratio ~1.3 (murni)', () => {
    // AG = 140-(100+10)=30; Winter exp pCO2 = 1.5×10+8 = 23 ±2 → 25 adekuat
    // Δratio = (30-12)/(24-10)=18/14=1.29 → HAGMA murni
    const r = f({ ph: 7.20, pco2: 25, hco3: 10, na: 140, cl: 100 });
    expect(r.label).toMatch(/Asidosis Metabolik/);
    expect(r.detail).toMatch(/AG = .*30/);
    expect(r.detail).toMatch(/ADEKUAT/);
    expect(r.detail).toMatch(/High AG Metabolic Acidosis murni/);
  });

  it('asidosis metabolik dgn kompensasi KURANG → mixed resp acidosis', () => {
    // hco3 10 → Winter exp 21-25; pco2 35 > 25 → kompensasi kurang
    const r = f({ ph: 7.10, pco2: 35, hco3: 10 });
    expect(r.detail).toMatch(/KURANG|Mixed Respiratory Acidosis/);
  });

  it('asidosis respiratorik AKUT (7.28/60/26)', () => {
    // exp HCO3 akut = 24+(60-40)/10 = 26 → cocok akut
    const r = f({ ph: 7.28, pco2: 60, hco3: 26 });
    expect(r.label).toMatch(/Asidosis Respiratorik/);
    expect(r.detail).toMatch(/AKUT/);
  });

  it('asidosis respiratorik KRONIK (7.34/60/31)', () => {
    // exp HCO3 kronik = 24+3.5×2 = 31 → cocok kronik
    expect(f({ ph: 7.34, pco2: 60, hco3: 31 }).detail).toMatch(/KRONIK/);
  });

  it('alkalosis metabolik (7.50/45/34) kompensasi adekuat', () => {
    // exp pCO2 = 0.7×(34-24)+40 = 47 ±5 → 45 adekuat
    const r = f({ ph: 7.50, pco2: 45, hco3: 34 });
    expect(r.label).toMatch(/Alkalosis Metabolik/);
    expect(r.detail).toMatch(/ADEKUAT/);
  });

  it('alkalosis respiratorik AKUT (7.50/28/22)', () => {
    // exp HCO3 akut = 24-(40-28)/5 = 21.6 → ~22 cocok akut
    const r = f({ ph: 7.50, pco2: 28, hco3: 22 });
    expect(r.label).toMatch(/Alkalosis Respiratorik/);
    expect(r.detail).toMatch(/AKUT/);
  });

  it('anion gap normal (8-12) tidak ditandai tinggi', () => {
    // Na 140, Cl 108, HCO3 20 → AG = 12 (normal)
    expect(f({ ph: 7.30, pco2: 30, hco3: 20, na: 140, cl: 108 }).detail).toMatch(/Normal 8/);
  });

  it('delta-delta hanya muncul saat AG tinggi', () => {
    const lowAG = f({ ph: 7.30, pco2: 30, hco3: 20, na: 140, cl: 108 });
    expect(lowAG.detail).not.toMatch(/Delta ratio/);
  });
});

describe('RSI', () => {
  const f = calc('rsi');
  it('70kg rutin → etomidat + suksinilkolin', () => {
    const r = f({ weight: 70, context: 'routine', suxContra: false });
    expect(r.label).toMatch(/Etomidat/);
    expect(r.label).toMatch(/Suksinilkolin/);
  });
  it('hemodinamik tidak stabil → ketamin', () => {
    expect(f({ weight: 70, context: 'hemodynamic' }).label).toMatch(/Ketamin/);
  });
  it('sux kontraindikasi → rokuronil', () => {
    expect(f({ weight: 70, suxContra: true }).label).toMatch(/Rokuronil/);
  });
  it('paralitik selalu dari BB AKTUAL (70kg default → rokuronil 84mg)', () => {
    expect(f({ weight: 70 }).detail).toMatch(/Rokuronil \(BB aktual\): 84 mg/);
  });
  it('BB default 70kg/170cm TIDAK dianggap obesitas (hanya sedikit di atas IBW 66kg, <120%) → agen induksi tetap BB aktual', () => {
    // IBW(170cm,L)=50+0.91×(170-152.4)=66.0; ambang obesitas=66.0×1.2=79.2; 70<79.2 → bukan obesitas
    const r = f({ weight: 70 });
    expect(r.detail).not.toMatch(/IBW dipakai/);
    expect(r.detail).toMatch(/Fentanyl pretreatment: 210 mcg/); // 3×70=210 (BB aktual)
  });
  it('obesitas jelas (150kg, tinggi 160cm, L, >120% IBW) → agen induksi pakai IBW 56.9kg', () => {
    // IBW=50+0.91×(160-152.4)=56.916; ambang=68.3; 150>68.3 → obesitas
    const r = f({ weight: 150, height: 160, sex: 'male' });
    expect(r.detail).toMatch(/IBW dipakai utk agen induksi: 56\.9 kg/);
    expect(r.detail).toMatch(/Fentanyl pretreatment: 171 mcg/); // 3×56.916=170.7→171
    expect(r.detail).toMatch(/Suksinilkolin \(BB aktual\): 225 mg/); // 1.5×150=225, TETAP BB aktual
  });
  it('BB di bawah IBW (50kg, tinggi 170cm) → agen induksi pakai BB aktual', () => {
    const r = f({ weight: 50, height: 170, sex: 'male' });
    expect(r.detail).not.toMatch(/IBW dipakai/);
    expect(r.detail).toMatch(/Fentanyl pretreatment: 150 mcg/); // 3×50=150 (BB aktual, bukan IBW 66kg)
  });
  it('konteks hemodinamik → peringatan shock-dose muncul di detail', () => {
    expect(f({ weight: 70, context: 'hemodynamic' }).detail).toMatch(/Instabilitas hemodinamik/);
  });
  it('konteks rutin → TIDAK ada peringatan shock-dose', () => {
    expect(f({ weight: 70, context: 'routine' }).detail).not.toMatch(/Instabilitas hemodinamik/);
  });
});

describe('TIMI UA/NSTEMI', () => {
  const f = calc('timi-ua');
  it('skor 0 → 5%', () => expect(f({}).risk).toMatch(/5%/));
  it('skor 7 → 41%', () => {
    const r = f({ age65: true, riskFactor: true, stenosis: true, stChange: true, angina2: true, aspirin: true, marker: true });
    expect(r.score).toBe(7);
    expect(r.risk).toMatch(/41%/);
  });
});

describe('TIMI STEMI (regresi bug off-by-one)', () => {
  const f = calc('timi-stemi');
  // Morrow 2000 / InTIME II — benchmark per skor
  const expected: Record<number, string> = {
    0: '0.8%', 1: '1.6%', 2: '2.2%', 3: '4.4%', 4: '7.3%', 5: '12.4%',
  };
  it('skor 0 → 0.8%', () => expect(f({}).risk).toMatch(/0\.8%/));
  it('skor 1 (DM/HTN) → 1.6% (bukan 0.8%)', () => {
    const r = f({ dm_htn: true });
    expect(r.score).toBe(1);
    expect(r.risk).toMatch(/1\.6%/);
  });
  it('skor 3 (SBP<100) → 4.4%', () => {
    expect(f({ sbpLow: true }).score).toBe(3);
    expect(f({ sbpLow: true }).risk).toMatch(/4\.4%/);
  });
  it('skor 5 → 12.4% (bukan 7.3%)', () => {
    const r = f({ sbpLow: true, hrHigh: true }); // 3+2 = 5
    expect(r.score).toBe(5);
    expect(r.risk).toMatch(/12\.4%/);
  });
  it('usia ≥75 memberi 3 poin', () => {
    expect(f({ age: 'gte75' }).score).toBe(3);
  });
});

describe('Wells PE', () => {
  const f = calc('wells-pe');
  it('skor 0 → PE unlikely', () => expect(f({}).label).toMatch(/Unlikely/));
  it('skor >4 → PE likely, CT-PA', () => {
    const r = f({ dvtSigns: true, altDx: true }); // 3+3 = 6
    expect(r.score).toBe(6);
    expect(r.label).toMatch(/Likely/);
  });
});

describe('Ventilasi ARDSnet', () => {
  const f = calc('vent');
  it('laki 170cm → PBW 66kg, Vt6 ~396mL', () => {
    const r = f({ sex: 'male', height: 170 });
    expect(r.detail).toMatch(/PBW = 66/);
    expect(r.score).toBe('396 mL');
  });
  it('P/F <100 → ARDS berat', () => {
    expect(f({ sex: 'male', height: 170, pao2: 60, fio2: 80 }).label).toMatch(/Berat/);
  });
});

describe('Heparin drip', () => {
  const f = calc('heparin');
  it('VTE 70kg → bolus 5600U, 1260U/jam', () => {
    const r = f({ weight: 70, indication: 'vte' });
    expect(r.detail).toMatch(/5600 unit/);
    expect(r.detail).toMatch(/1260 unit\/jam/);
  });
  it('ACS bolus dibatasi 4000U pada 70kg (60×70=4200)', () => {
    expect(f({ weight: 70, indication: 'acs' }).detail).toMatch(/4000 unit/);
  });
  it('VTE BB besar (200kg) → laju TIDAK dibatasi (18×200=3600) TAPI muncul peringatan verifikasi', () => {
    const r = f({ weight: 200, indication: 'vte' });
    expect(r.detail).toMatch(/3600 unit\/jam/);
    expect(r.detail).toMatch(/TIDAK punya plafon laju infus mutlak/);
  });
  it('ACS TIDAK menampilkan peringatan "tanpa plafon" (memang ada plafon 1000 U/jam)', () => {
    expect(f({ weight: 200, indication: 'acs' }).detail).not.toMatch(/TIDAK punya plafon/);
  });
});

describe('Resusitasi cairan', () => {
  const f = calc('fluid');
  it('Parkland 70kg 20%, default (tanpa pilih faktor) → tetap Klasik 4 mL/kg/%TBSA = 5600mL/24j', () => {
    // Default TIDAK berubah — faktor default harus tetap 'classic' (4), bukan diam-diam pindah ke 2
    const r = f({ mode: 'parkland', weight: 70, tbsa: 20 });
    expect(r.score).toBe('5600 mL / 24 jam');
    expect(r.detail).toMatch(/Faktor dipakai: 4 mL\/kg\/%TBSA \(Klasik\)/);
  });
  it('Parkland 70kg 20%, faktor Konsensus Modern (2 mL/kg/%TBSA) → 2800mL/24j', () => {
    const r = f({ mode: 'parkland', weight: 70, tbsa: 20, parklandFactor: 'modern' });
    expect(r.score).toBe('2800 mL / 24 jam');
    expect(r.detail).toMatch(/Faktor dipakai: 2 mL\/kg\/%TBSA \(Konsensus Modern\)/);
  });
  it('sepsis 70kg → 2100mL bolus', () => {
    expect(f({ mode: 'sepsis', weight: 70 }).score).toBe('2100 mL bolus');
  });
  it('maintenance 25kg → 65 mL/jam (Holliday-Segar 4-2-1)', () => {
    // 40 + 20 + 5 = 65
    expect(f({ mode: 'maintenance', weight: 25 }).score).toBe('65 mL/jam');
  });
});

describe('CPP', () => {
  const f = calc('cpp');
  it('120/80 ICP10 → MAP93, CPP83 adekuat', () => {
    const r = f({ sbp: 120, dbp: 80, icp: 10 });
    expect(r.score).toBe('83 mmHg');
    expect(r.label).toMatch(/Adekuat/);
  });
  it('CPP <50 → kritis', () => {
    expect(f({ sbp: 80, dbp: 50, icp: 25 }).label).toMatch(/Kritis/);
  });
});

describe('QTc', () => {
  const f = calc('qtc');
  it('QT400 HR60 → Bazett 400ms (RR=1) normal', () => {
    const r = f({ qt: 400, hr: 60, female: false });
    expect(r.score).toBe('400 ms');
    expect(r.label).toMatch(/Normal/);
  });
  it('QT480 HR75 → memanjang', () => {
    // RR=0.8, Bazett=480/√0.8≈537 → sangat panjang
    expect(f({ qt: 480, hr: 75 }).label).toMatch(/Panjang|Memanjang/);
  });
  it('QTc ≥500 → risiko Torsades', () => {
    expect(f({ qt: 520, hr: 60 }).risk).toMatch(/Torsades/);
  });
  it('ambang perempuan lebih tinggi (470 vs 450)', () => {
    // QT426 HR70 → Bazett≈460: memanjang utk L (>450), normal utk P (<470)
    const male = f({ qt: 426, hr: 70, female: false });
    const female = f({ qt: 426, hr: 70, female: true });
    expect(male.label).toMatch(/Memanjang/);
    expect(female.label).toMatch(/Normal/);
  });
});

describe('Koreksi Kalium (defisit, batas laju, protokol hiperK)', () => {
  const f = calc('k-correction');

  it('K3.0 70kg → defisit 50–100 mEq (estimasi kasar)', () => {
    // (3.5-3.0)×100–200×(70/70) = 50–100
    const r = f({ currentK: 3.0, weight: 70 });
    expect(r.score).toBe('50–100 mEq');
    expect(r.risk).toMatch(/perifer ≤10.*sentral ≤20/);
  });

  it('defisit diskalakan oleh berat badan (140kg → 2×)', () => {
    const r = f({ currentK: 3.0, weight: 140 });
    expect(r.score).toBe('100–200 mEq');
  });

  it('K <2.5 → warna merah (berat)', () => {
    const r = f({ currentK: 2.0, weight: 70 });
    expect(r.score).toBe('150–300 mEq');
    expect(r.color).toBe('#BA1A1A');
  });

  it('pH-adjustment: asidosis (pH7.20) menurunkan estimasi K sebenarnya', () => {
    // 4.0 + 0.6×((7.20-7.40)/0.1) = 4.0 - 1.2 = 2.80
    const r = f({ currentK: 4.0, ph: 7.20 });
    const step = r.steps!.find(s => s.label.includes('Penyesuaian efek pH'))!;
    expect(step.formula).toMatch(/2\.80/);
    expect(step.note).toMatch(/PERINGATAN/);
  });

  it('hiperkalemia berat (K6.5) → label & warna merah', () => {
    const r = f({ currentK: 6.5 });
    expect(r.score).toBe('6.5 mEq/L');
    expect(r.label).toBe('Hiperkalemia Berat');
    expect(r.color).toBe('#BA1A1A');
  });

  it('hiperkalemia GDS≥126 → tanpa dekstrosa lanjutan', () => {
    const r = f({ currentK: 5.5, gds: 150 });
    const step = r.steps!.find(s => s.label.includes('Insulin'))!;
    expect(step.formula).toMatch(/GDS = 150.*≥126/);
    expect(step.formula).not.toMatch(/WAJIB Dekstrosa/);
  });

  it('hiperkalemia GDS<126 → WAJIB dekstrosa lanjutan (cegah hipoglikemia)', () => {
    const r = f({ currentK: 5.5, gds: 90 });
    const step = r.steps!.find(s => s.label.includes('Insulin'))!;
    expect(step.formula).toMatch(/GDS = 90.*<126/);
    expect(step.formula).toMatch(/WAJIB Dekstrosa 10%/);
  });

  it('K normal (4.0, tanpa pH) → label Normal', () => {
    const r = f({ currentK: 4.0 });
    expect(r.label).toBe('Kalium Normal');
    expect(r.steps).toBeUndefined();
  });
});

describe('Koreksi Kalsium (albumin, ionized, protokol)', () => {
  const f = calc('ca-correction');

  it('Ca7.0 albumin2.0 → terkoreksi 8.6 mg/dL (Payne)', () => {
    // 7.0 + 0.8×(4-2) = 8.6
    expect(f({ ca: 7.0, albumin: 2.0 }).score).toBe('8.6 mg/dL');
  });

  it('Ca8.0 albumin4.0 (hipo) → ionized ≈ 1.00 mmol/L (×0.125)', () => {
    // corr=8.0 (tanpa perubahan albumin); ionized=8.0×0.125=1.0
    const r = f({ ca: 8.0, albumin: 4.0 });
    expect(r.label).toBe('Hipokalsemia (terkoreksi)');
    expect(r.risk).toMatch(/1\.00 mmol\/L/);
  });

  it('penyesuaian pH pada ionized (asidosis menaikkan ionized)', () => {
    // ionizedBase=1.0; pH7.20 → +（7.40-7.20)×0.5=+0.1 → 1.10
    const r = f({ ca: 8.0, albumin: 4.0, ph: 7.20 });
    const step = r.steps!.find(s => s.label.includes('Langkah 2b'))!;
    expect(step.formula).toMatch(/1\.000/);
    expect(step.formula).toMatch(/1\.100/);
    expect(r.risk).toMatch(/1\.10 mmol\/L/);
  });

  it('hipokalsemia berat (Ca5.0,alb2.0, corr6.6) → merah', () => {
    expect(f({ ca: 5.0, albumin: 2.0 }).color).toBe('#BA1A1A');
  });

  it('hiperkalsemia (Ca12.0,alb4.0) → label & protokol', () => {
    const r = f({ ca: 12.0, albumin: 4.0 });
    expect(r.label).toBe('Hiperkalsemia (terkoreksi)');
    expect(r.targetInfo?.bullets.join(' ')).toMatch(/Kalsitonin/);
  });

  it('hiperkalsemia berat (Ca15.0) → merah', () => {
    expect(f({ ca: 15.0, albumin: 4.0 }).color).toBe('#BA1A1A');
  });
});

describe('Koreksi Magnesium (dosis tetap per keparahan)', () => {
  const f = calc('mg-correction');

  it('Mg1.5 asimtomatik → dosis 1–2 g (bukan formula per-kg)', () => {
    const r = f({ mg: 1.5 });
    expect(r.score).toBe('1–2 g IV');
    expect(r.risk).toMatch(/50–100 mL/);
    expect(r.label).toBe('Hipomagnesemia');
    expect(r.color).toBe('#FFA000');
  });

  it('Mg1.2 simtomatik berat → dosis 2g bolus lambat, warna merah', () => {
    const r = f({ mg: 1.2, symptomatic: true });
    expect(r.score).toBe('2 g IV');
    expect(r.risk).toMatch(/[Bb]olus lambat/);
    expect(r.color).toBe('#BA1A1A');
  });

  it('eGFR <30 → penyesuaian dosis 50% + monitoring', () => {
    const r = f({ mg: 1.5, egfr: 20 });
    const step = r.steps!.find(s => s.label.includes('Langkah 3'))!;
    expect(step.formula).toMatch(/turunkan dosis ~50%/);
    expect(r.risk).toMatch(/eGFR <30/);
  });

  it('Mg normal (2.0) → label Normal', () => {
    const r = f({ mg: 2.0 });
    expect(r.label).toBe('Magnesium Normal');
    expect(r.score).toBe('2.0 mg/dL');
  });
});

describe('VIS', () => {
  const f = calc('vis');
  it('tanpa obat → 0', () => {
    expect(f({}).score).toBe('0');
    expect(f({}).label).toMatch(/Tanpa Vasoaktif/);
  });
  it('norepi 0.1 → VIS 10 (sedang)', () => {
    const r = f({ norepinephrine: 0.1 });
    expect(r.score).toBe('10');
    expect(r.label).toMatch(/Sedang/);
  });
  it('epi 0.15 + dopamin 5 → VIS 20 (tinggi)', () => {
    // 100×0.15 + 5 = 20
    const r = f({ epinephrine: 0.15, dopamine: 5 });
    expect(r.score).toBe('20');
    expect(r.label).toMatch(/Tinggi/);
  });
});

describe('Konverter Infus', () => {
  const f = calc('infusion');
  it('norepi 0.1 mcg/kg/min, 70kg, 4mg/50mL → ~5.25 mL/jam', () => {
    // conc = 4000/50 = 80 mcg/mL; rate = 0.1×70×60/80 = 5.25
    expect(f({ dose: 0.1, weight: 70, amount: 4, volume: 50 }).score).toBe('5.3 mL/jam');
  });
});

describe('Koreksi Natrium (hipo & hipernatremia, dua metode)', () => {
  const f = calc('na-correction');

  it('Na118 70kg L target6, tanpa gejala → koreksi lanjutan tetap dihitung (491–653 mL)', () => {
    // TBW=42; defisit: d=6, mEq=252, vol=252/513*1000=491.2mL, rate=20.5
    // AM: perL=(513-118)/43=9.186, vol=(6/9.186)*1000=653.2mL, rate=27.2
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 6, highRisk: false });
    expect(r.doseRange!.rangeLabel).toBe('491 – 653 mL');
    expect(r.steps).toBeDefined();
    const laju = r.steps!.find(s => s.label.includes('Langkah 5'));
    expect(laju!.formula).toMatch(/491.*653/);
  });

  it('risiko tinggi ODS (manual) membatasi ke batas bawah (6, bukan 8)', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 8, highRisk: true });
    const step2 = r.steps!.find(s => s.label.includes('Langkah 2'))!;
    expect(step2.note).toMatch(/dibatasi ke 6 mEq\/L/);
  });

  it('target melebihi batas aman kronik (12) → dibatasi ke 8', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 12, highRisk: false });
    const step2 = r.steps!.find(s => s.label.includes('Langkah 2'))!;
    expect(step2.note).toMatch(/dibatasi ke 8 mEq\/L/);
  });

  it('onset akut → batas lebih longgar (10–12 vs 6–8)', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 12, onset: 'akut', highRisk: false });
    const step2 = r.steps!.find(s => s.label.includes('Langkah 2'))!;
    expect(step2.formula).toMatch(/10–12 mEq\/L/);
  });

  it('Na<120 TANPA gejala → TIDAK lagi otomatis merah/berat (indikasi ikuti gejala, bukan angka)', () => {
    const r = f({ currentNa: 115 });
    expect(r.color).toBe('#1E8E3E');
    expect(r.naHypoCard!.severity).toBe('ringan');
    expect(r.naHypoCard!.primary.title).toMatch(/TIDAK Rutin Diindikasikan/);
    expect(r.label).not.toMatch(/Berat/);
  });

  it('Na115 + gejala BERAT (kejang) → bolus 150mL/20menit, merah', () => {
    const r = f({ currentNa: 115, sxSeizure: true });
    expect(r.color).toBe('#BA1A1A');
    expect(r.naHypoCard!.severity).toBe('berat');
    expect(r.naHypoCard!.primary.title).toMatch(/Bolus/);
    expect(r.score).toBe('150 mL / 20 menit (≈450 mL/jam)');
  });

  it('Na115 + gejala SEDANG (mual) tanpa gejala berat → infus tunggal, amber', () => {
    const r = f({ currentNa: 115, sxNausea: true });
    expect(r.color).toBe('#FFA000');
    expect(r.naHypoCard!.severity).toBe('sedang');
    expect(r.naHypoCard!.primary.title).toMatch(/Infus Tunggal/);
  });

  it('gejala berat mengalahkan gejala sedang yang juga tercentang (severity live, bukan dibekukan)', () => {
    const r = f({ currentNa: 115, sxNausea: true, sxComaGcs8: true });
    expect(r.naHypoCard!.severity).toBe('berat');
  });

  it('Na≤105 tanpa gejala → autoHighRisk otomatis, plafon batas bawah', () => {
    const r = f({ currentNa: 104, weight: 70, sex: 'male', targetRise: 8 });
    expect(r.naHypoCard!.autoHighRisk).toBe(true);
    expect(r.naHypoCard!.highRiskFinal).toBe(true);
    expect(r.targetInfo!.bullets.some(b => b.includes('OTOMATIS'))).toBe(true);
    const step2 = r.steps!.find(s => s.label.includes('Langkah 2'))!;
    expect(step2.note).toMatch(/dibatasi ke 6 mEq\/L/);
  });

  it('Na>105 tanpa faktor manual → autoHighRisk false', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male' });
    expect(r.naHypoCard!.autoHighRisk).toBe(false);
    expect(r.naHypoCard!.highRiskFinal).toBe(false);
  });

  it('gejala ringan + penurunan akut >10 terdokumentasi → pengecualian infus tunggal', () => {
    const r = f({ currentNa: 115, acuteDrop10: true });
    expect(r.naHypoCard!.severity).toBe('ringan');
    expect(r.naHypoCard!.acuteExceptionApplied).toBe(true);
    expect(r.naHypoCard!.primary.title).toMatch(/Pengecualian/);
    expect(r.naHypoCard!.collapseSlowCorrection).toBe(false);
  });

  it('ringan tanpa pengecualian → koreksi lanjutan di-collapse', () => {
    const r = f({ currentNa: 115 });
    expect(r.naHypoCard!.collapseSlowCorrection).toBe(true);
  });

  it('hipernatremia Na160 70kg L → defisit air bebas 6.0 L, laju 125 mL/jam', () => {
    // TBW=42; FWD=42×(160/140−1)=6.0L; rate=6000/48=125
    const r = f({ currentNa: 160, weight: 70, sex: 'male' });
    expect(r.score).toBe('125 mL/jam');
    expect(r.label).toMatch(/Hipernatremia|Defisit Air/);
    const step = r.steps!.find(s => s.formula?.includes('Na/140'));
    expect(step).toBeDefined();
  });

  it('hipernatremia berat (Na>160) → warna merah', () => {
    expect(f({ currentNa: 165, weight: 70 }).color).toBe('#BA1A1A');
  });

  it('Na normal (138) → label Normal', () => {
    const r = f({ currentNa: 138 });
    expect(r.label).toBe('Natrium Normal');
    expect(r.score).toBe('138.0 mEq/L');
  });

  it('hiperglikemia glukosa 500 (faktor 2.4) mengoreksi Na masuk rentang normal', () => {
    // calcN = 130 + 2.4×(500-100)/100 = 130 + 9.6 = 139.6 → normal
    const r = f({ currentNa: 130, glucose: 500 });
    expect(r.label).toBe('Natrium Normal');
    expect(r.steps![0].formula).toMatch(/2\.4/);
    expect(r.steps![0].formula).toMatch(/139\.6/);
  });

  it('hiperglikemia glukosa 300 (faktor 1.6, ≤400)', () => {
    const r = f({ currentNa: 125, glucose: 300 });
    expect(r.steps![0].formula).toMatch(/\+ 1\.6 ×/);
  });
});

describe('ETT Pediatrik', () => {
  const f = calc('ett-peds');
  it('usia 4 → ETT tanpa balon 5.0 mm', () => {
    // 4/4 + 4 = 5.0
    expect(f({ age: 4 }).score).toBe('5.0 mm');
    expect(f({ age: 4 }).detail).toMatch(/5\.0 mm/);
  });
  it('usia 8 → kedalaman 16 cm, ETT 6.0', () => {
    // 8/4+4=6.0 ; 8/2+12=16
    const r = f({ age: 8 });
    expect(r.score).toBe('6.0 mm');
    expect(r.detail).toMatch(/16\.0 cm/);
  });
});
