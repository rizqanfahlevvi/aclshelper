// Navigation
export type Tab = 'home' | 'algo' | 'drugs' | 'tools';
export type DeskScreen = 'dashboard' | 'algo' | 'drugs' | 'ekg' | 'hsts' | 'calc' | 'pals' | 'vaso' | 'rosc';
export type NavFrame =
  | { screen: 'home' }
  | { screen: 'algoList' }
  | { screen: 'algo'; id: string }
  | { screen: 'drugList' }
  | { screen: 'drug'; id: string }
  | { screen: 'ekgList' }
  | { screen: 'ekg'; id: string }
  | { screen: 'hsts' }
  | { screen: 'calcList' }
  | { screen: 'calc'; id: string }
  | { screen: 'pals' }
  | { screen: 'vaso' }
  | { screen: 'rosc' };
export type DeskView = { screen: DeskScreen; id?: string };
export type NavStack = Record<Tab, NavFrame[]>;
export interface Nav {
  push: (frame: NavFrame) => void;
  pop: () => void;
}

// Data — Algorithm flow steps
export type FlowStepKind = 'action' | 'decision' | 'shock' | 'drug' | 'note' | 'outcome' | 'cpr' | 'opt';
export interface FlowStep {
  kind: FlowStepKind;
  title: string;
  sub?: string;
  pearls?: string | string[];
  q?: string;
  yes?: { label: string; tint: string; targetIndex?: number };
  no?: { label: string; tint: string; targetIndex?: number };
  cta?: string;
  urgent?: boolean;
  auto?: boolean;
  actions?: string[];
  amioOnlyIfUsed?: boolean;
}

export interface Algorithm {
  key: string;
  label: string;
  sub: string;
  tint: string;
  tag: string;
  source: string;
}

export interface Drug {
  key: string;
  name: string;
  altName?: string;
  category: string;
  class: string;
  tint: string;
  indication: string;
  dose: string;
  repeat: string;
  prep: string;
  pearls: string | string[];
  contra: string;
  source: string;
}

export interface RhythmMorphology {
  rate?: string;
  rhythm?: string;
  pWave?: string;
  prInterval?: string;
  qrsDuration?: string;
  stT?: string;
  [key: string]: string | undefined;
}

export interface Rhythm {
  key: string;
  name: string;
  short: string;
  severity: string;
  tint: string;
  imageFile?: string;
  imageCredit?: string;
  features: string;
  action: string;
  definition?: string;
  mechanism?: string;
  morphology?: RhythmMorphology;
  criteria?: string[];
  ddx?: string[];
  management?: {
    immediate: string[];
    drugs?: string[];
    notes: string[];
  };
  pitfalls?: string[];
  references?: Array<{ text: string; url?: string }>;
  conductionSystem?: Array<Record<string, string>>;
  waveCorrelations?: Array<Record<string, string>>;
}

// CPR Workspace
export type CprRhythm = 'shockable' | 'nonshockable' | 'awaiting';
export type LogTone = 'info' | 'warn' | 'danger' | 'success';
export interface LogEntry {
  t: number;
  wall: string;
  action: string;
  tone: LogTone;
}
