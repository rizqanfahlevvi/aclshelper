# Slot Gambar Teori

Letakkan gambar Anda di folder ini. Format yang didukung: `.png`, `.svg`, `.jpg`, `.webp`
(urutan prioritas: png → svg → jpg → webp).

Jika file tidak ada, diagram SVG bawaan tetap tampil sebagai fallback.

## Daftar Slot

### Tab: Aksi Potensial
| Nama file              | Diagram                                   |
|------------------------|-------------------------------------------|
| `ap-ventricular.*`     | Aksi potensial kardiomiosit ventrikel     |
| `ap-sa-node.*`         | Aksi potensial SA node (pacu jantung)     |

### Tab: E-C Coupling
| Nama file          | Diagram                                         |
|--------------------|-------------------------------------------------|
| `ec-coupling.*`    | Overview CICR: DHPR → RyR2 → Ca²⁺ spark        |
| `ec-relaxation.*`  | Relaksasi: SERCA2a reuptake + NCX ekstrusi      |

### Tab: Hemodinamik
| Nama file              | Diagram                                   |
|------------------------|-------------------------------------------|
| `frank-starling.*`     | Kurva Frank-Starling (SV vs EDV)          |

### Tab: Sistem Saraf Otonom
| Nama file              | Diagram                                         |
|------------------------|-------------------------------------------------|
| `ans-overview.*`       | SNS vs PNS cardiac innervation                  |
| `ans-baroreceptor.*`   | Baroreceptor reflex arc (NTS → vagal output)    |

### Tab: Farmakologi Vasopressor
| Nama file                  | Diagram                                     |
|----------------------------|---------------------------------------------|
| `vasopressor-receptors.*`  | Receptor subtype location diagram (α1/β1…)  |
| `vasopressor-profiles.*`   | Drug comparison chart (6 drug profiles)     |

### Tab: Mekanisme Aritmia
| Nama file                  | Diagram                               |
|----------------------------|---------------------------------------|
| `arrhythmia-reentry.*`     | Sirkuit reentry (AVNRT / AFL / VT)    |
| `arrhythmia-automaticity.*`| Perbandingan slope automatisitas      |
| `arrhythmia-triggered.*`   | EAD dan DAD triggered activity        |

### Tab: Patofisiologi ACS
| Nama file          | Diagram                               |
|--------------------|---------------------------------------|
| `acs-1-endotel.*`  | Disfungsi endotel                     |
| `acs-2-plak.*`     | Pembentukan plak aterosklerosis       |
| `acs-3-ruptur.*`   | Ruptur plak                           |
| `acs-4-trombus.*`  | Trombosis koroner akut                |
| `acs-5-iskemia.*`  | Zona nekrosis / injury / iskemia      |

### Tab: Post-Arrest
| Nama file                    | Diagram                                              |
|------------------------------|------------------------------------------------------|
| `pcas-overview.*`            | 4-domain PCAS diagram                                |
| `cerebral-autoregulation.*`  | Kurva autoregulasi serebral (CBF vs MAP)             |
| `ttm-mechanism.*`            | Mekanisme neuroproteksi TTM (32–36°C)                |

## Cara Mengganti Diagram

1. Simpan gambar dengan nama sesuai tabel di atas ke folder `public/theory/`
2. Commit ke repository: `git add public/theory/ && git commit -m "Tambah gambar teori"`
3. Push ke main — gambar langsung tampil di app

## Tips
- Gunakan latar belakang transparan (PNG/SVG) untuk tampil di dark mode
- Resolusi disarankan: 800×600px atau lebih tinggi
- SVG dianjurkan untuk diagram garis (tajam di semua ukuran layar)
