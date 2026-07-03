import type React from 'react';
import { Icons } from '../components/base';

/* ============================================================
   Sumber tunggal untuk menu navigasi non-tab (drawer mobile &
   sidebar desktop). SEBELUMNYA ini terduplikasi di 2+ array
   terpisah (SIDEBAR_NAV di desktop, MOBILE_MENU + grid "Lainnya"
   di App.tsx) yang gampang out-of-sync — Defibrilasi & Pediatrik
   pernah hilang dari 2 dari 3 tempat sekaligus karena itu.
   Kunci tiap item cocok dengan DeskScreen & argumen yang diterima
   mobileNavFromSidebar/desktopPick, jadi konsumen tinggal panggil
   onNavigate(item.key) apa adanya.
   ============================================================ */

export interface NavItem {
  key: string;
  label: string;
  desc: string;
  icon: (props: { size?: number; stroke?: number; style?: React.CSSProperties }) => React.ReactElement;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { key: 'home', label: 'Beranda', desc: 'Ikhtisar & akses cepat', icon: Icons.house },
    ],
  },
  {
    title: 'KONTEN',
    items: [
      { key: 'algo',   label: 'Algoritma',   desc: '14 protokol ACLS',        icon: Icons.algo },
      { key: 'drugs',  label: 'Obat',        desc: '25 obat emergensi',       icon: Icons.pill },
      { key: 'ekg',    label: 'Pustaka EKG', desc: '16 ritme kardiologi',     icon: Icons.ekg },
      { key: 'theory', label: 'Teori',       desc: 'Sistem konduksi jantung', icon: Icons.activity },
      { key: 'hsts',   label: 'Hs & Ts',     desc: '10 penyebab reversibel',  icon: Icons.clipboard },
    ],
  },
  {
    title: 'ALAT',
    items: [
      { key: 'calc',  label: 'Kalkulator',  desc: '11 kalkulator + vasopressor',   icon: Icons.calculator },
      { key: 'defib', label: 'Defibrilasi', desc: 'Panduan energi & kardioversi',  icon: Icons.bolt },
      { key: 'peds',  label: 'Pediatrik',   desc: 'Referensi PALS & Broselow',     icon: Icons.heart },
    ],
  },
  {
    title: 'LAINNYA',
    items: [
      { key: 'about',    label: 'Tentang',    desc: 'Versi & changelog',      icon: Icons.info },
      { key: 'settings', label: 'Pengaturan', desc: 'Tampilan, font & cache', icon: Icons.settings },
    ],
  },
];
