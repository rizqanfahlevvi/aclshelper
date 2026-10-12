# ACLS Helper — panduan untuk Claude

## graphify (knowledge graph repo ini)

Repo ini punya knowledge graph di `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, dan `cache/semantic/` — ter-commit) berisi komponen inti, komunitas modul, dan relasi lintas file. Pakai graph untuk memahami kode lebih cepat, tetapi perlakukan sebagai peta, bukan sumber kebenaran.

### Setiap kali diminta fitur, perbaikan, atau eksekusi

1. **Pastikan CLI tersedia** — container cloud selalu dimulai dari clone baru:
   `command -v graphify || pip install graphifyy -q --break-system-packages`
2. **Segarkan graph** (AST-only, tanpa biaya API, beberapa detik): `graphify update .`
3. **Petakan area yang terdampak lewat graph dulu**, sebelum membuka file mentah:
   - `graphify affected "<simbol>"` — apa saja yang ikut terdampak bila simbol ini diubah (dengan file:baris)
   - `graphify explain "<simbol>"` — relasi masuk/keluar satu node
   - `graphify path "<A>" "<B>"` — jalur keterkaitan dua konsep
   - `graphify query "<pertanyaan>"` — penelusuran luas; outputnya bisa besar, pakai istilah yang spesifik
   - `graphify-out/GRAPH_REPORT.md` — hanya untuk tinjauan arsitektur menyeluruh
4. **Verifikasi di kode sumber sebelum mengedit.** Ekstraksi semantik hanya membaca sebagian file besar (`src/screens/theory/index.tsx`, `src/data/calculators.ts`, `src/data/index.ts`), dan relasi bertanda INFERRED/AMBIGUOUS belum tentu benar. Untuk nilai klinis (dosis, ambang, rumus), rujukannya selalu kode dan test — bukan graph.
5. **Setelah mengubah kode**, jalankan lagi `graphify update .` lalu commit perubahan di `graphify-out/` dalam commit yang sama dengan perubahan kodenya.
6. **Bila menambah/mengubah dokumen atau gambar** (mis. strip EKG baru di `public/ekg-images/`), `graphify update` tidak menangkapnya. Jalankan `/graphify . --update` (ekstraksi semantik via subagent) dan beri tahu user lebih dulu karena memakai banyak token.

`graphify-out/obsidian/`, `graph.html`, `manifest.json`, `cost.json`, `cache/ast/`, `cache/stat-index.json`, dan `cache/last_query_stamp` sengaja tidak di-commit — bisa dibuat ulang atau terikat ke mesin/versi. Tanpa perubahan kode, `graphify update .` di clone baru tidak mengubah file ter-commit apa pun.
