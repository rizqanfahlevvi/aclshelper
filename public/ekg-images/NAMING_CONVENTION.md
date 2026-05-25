# Konvensi Nama File EKG

Semua file gambar EKG disimpan di folder ini.
Format: `[key].jpg` atau `[key].png` — nama harus sesuai dengan field `imageFile` di `src/data/index.js`.

Folder ini dikosongkan di repositori (hanya `.gitkeep`).
Tempatkan file gambar secara lokal atau via deployment asset pipeline.

## Daftar File yang Diharapkan

| Key       | imageFile          | Nama Ritme                        | Sumber Gambar   |
|-----------|--------------------|-----------------------------------|-----------------|
| nsr       | nsr.jpg            | Normal Sinus Rhythm               | LITFL           |
| vf        | vf.jpg             | Fibrilasi Ventrikel               | LITFL           |
| vt        | vt.jpg             | Takikardi Ventrikel Monomorfik    | LITFL           |
| torsades  | torsades.jpg       | Torsade de Pointes                | LITFL           |
| svt       | svt.jpg            | Supraventricular Tachycardia      | LITFL           |
| asys      | asys.jpg           | Asistol                           | LITFL           |
| pea       | pea.jpg            | Pulseless Electrical Activity     | LITFL           |
| av3       | av3.jpg            | AV Block Derajat 3 (CHB)         | LITFL           |
| stemi     | stemi.jpg          | Anterior STEMI                    | LITFL           |
| hyperk    | hyperk.jpg         | EKG Hiperkalemia                  | LITFL           |
| af        | af.jpg             | Fibrilasi Atrium                  | LITFL           |
| flutter   | flutter.jpg        | Flutter Atrium                    | LITFL           |
| wellens   | wellens.jpg        | Sindrom Wellens                   | LITFL           |
| dewinter  | dewinter.jpg       | De Winter T-wave                  | LITFL           |
| brugada   | brugada.jpg        | Pola Brugada Tipe 1               | LITFL           |
| wpw       | wpw.jpg            | WPW — Wolff-Parkinson-White       | LITFL           |
| lbbb      | lbbb.jpg           | LBBB Baru                         | LITFL           |

## Perilaku Jika File Tidak Ada

Komponen `EkgImage` (src/components/acls/index.jsx) akan otomatis menampilkan
strip SVG ilustratif (`RhythmStrip`) sebagai fallback jika:
- File gambar tidak ditemukan (HTTP 404)
- File gagal dimuat karena alasan lain

Fallback berjalan tanpa error — aplikasi tetap berfungsi penuh tanpa file gambar.

## Hak Cipta

Gambar dari LITFL (Life in the Fast Lane) dilisensikan di bawah CC BY-NC-SA.
Lihat: https://litfl.com/ecg-library/
