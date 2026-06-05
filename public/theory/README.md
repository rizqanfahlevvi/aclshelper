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

### Tab: Hemodinamik
| Nama file              | Diagram                                   |
|------------------------|-------------------------------------------|
| `frank-starling.*`     | Kurva Frank-Starling (SV vs EDV)          |

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

## Cara Mengganti Diagram

1. Simpan gambar dengan nama sesuai tabel di atas ke folder `public/theory/`
2. Commit ke repository: `git add public/theory/ && git commit -m "Tambah gambar teori"`
3. Push ke main — gambar langsung tampil di app

## Tips
- Gunakan latar belakang transparan (PNG/SVG) untuk tampil di dark mode
- Resolusi disarankan: 800×600px atau lebih tinggi
- SVG dianjurkan untuk diagram garis (tajam di semua ukuran layar)
