import { describe, it, expect } from 'vitest';
import { CALCULATORS } from './calculators';

/* Helper: ambil kalkulator by key, panggil compute dengan nilai. */
const calc = (key: string) => {
  const c = CALCULATORS.find(x => x.key === key);
  if (!c) throw new Error(`Kalkulator '${key}' tidak ditemukan`);
  return c.compute;
};

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

describe('ABG interpreter', () => {
  const f = calc('abg');
  it('normal', () => expect(f({ ph: 7.40, pco2: 40, hco3: 24 }).label).toMatch(/Normal/));
  it('asidosis metabolik (DKA)', () => {
    const r = f({ ph: 7.20, pco2: 25, hco3: 10 });
    expect(r.label).toMatch(/Asidosis Metabolik/);
    expect(r.detail).toMatch(/Winter/);
  });
  it('asidosis respiratorik', () => {
    expect(f({ ph: 7.28, pco2: 60, hco3: 26 }).label).toMatch(/Asidosis Respiratorik/);
  });
  it('anion gap dihitung', () => {
    expect(f({ ph: 7.20, pco2: 25, hco3: 10, na: 140, cl: 100 }).detail).toMatch(/AG =/);
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
  it('dosis rokuronil 1.2 mg/kg (70kg → 84mg)', () => {
    expect(f({ weight: 70 }).detail).toMatch(/Rokuronil: 84 mg/);
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
});

describe('Resusitasi cairan', () => {
  const f = calc('fluid');
  it('Parkland 70kg 20% → 5600mL/24j', () => {
    expect(f({ mode: 'parkland', weight: 70, tbsa: 20 }).score).toBe('5600 mL / 24 jam');
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

describe('Koreksi Elektrolit', () => {
  const f = calc('lyte-correct');
  it('Ca 7.0 albumin 2.0 → terkoreksi 8.6', () => {
    // 7.0 + 0.8×(4-2) = 8.6
    expect(f({ mode: 'calcium', ca: 7.0, albumin: 2.0 }).score).toBe('8.6 mg/dL');
  });
  it('Na 130 glukosa 400 → terkoreksi ~134.8 (faktor 1.6)', () => {
    // 130 + 1.6×3 = 134.8
    expect(f({ mode: 'sodium', na: 130, glucose: 400 }).score).toBe('134.8 mEq/L');
  });
  it('Na glukosa >400 pakai faktor 2.4', () => {
    // 130 + 2.4×((500-100)/100)=130+9.6=139.6
    expect(f({ mode: 'sodium', na: 130, glucose: 500 }).score).toBe('139.6 mEq/L');
  });
  it('K 6.0 pH 7.20 → estimasi K pada 7.40 lebih rendah', () => {
    // 6.0 + 0.6×((7.20-7.40)/0.1)=6.0-1.2=4.8
    expect(f({ mode: 'potassium', k: 6.0, ph: 7.20 }).score).toBe('4.8 mEq/L');
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

describe('Koreksi Natrium (hiponatremia)', () => {
  const f = calc('na-correction');
  it('Na118 70kg L target6 → laju NaCl 3% ~27 mL/jam', () => {
    // TBW=42, ΔNa/L=(513-118)/43=9.19; V=6/9.19=0.653L; rate=653/24≈27
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 6, highRisk: false });
    expect(r.score).toBe('27 mL/jam');
    expect(r.detail).toMatch(/≤ 8 mEq\/L/);
  });
  it('risiko tinggi → batas 6 mEq/L', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 6, highRisk: true });
    expect(r.detail).toMatch(/≤ 6 mEq\/L/);
  });
  it('target melebihi batas aman → dibatasi + peringatan', () => {
    const r = f({ currentNa: 118, weight: 70, sex: 'male', targetRise: 12, highRisk: false });
    expect(r.detail).toMatch(/dibatasi ke 8/);
  });
  it('Na <120 → warna merah (berat)', () => {
    expect(f({ currentNa: 115 }).color).toBe('#BA1A1A');
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
