# Graph Report - aclshelper  (2026-11-07)

## Corpus Check
- 55 files · ~142,361 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 3, (none) 2)

## Summary
- 752 nodes · 1764 edges · 62 communities (29 shown, 33 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4846c8b7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- desktop/index.tsx
- theory/index.tsx
- AdminPage.tsx
- tools/index.tsx
- calc/index.tsx
- settings/index.tsx
- App.tsx
- package.json
- acls/index.tsx
- acls/index.tsx
- TheoryScreen
- compilerOptions
- ACLS Helper — panduan untuk Claude
- tweaks/index.tsx
- NaHypoResultCard — hyponatremia correction card
- acls-helper package manifest
- ACLS_FLOW_ARREST (main arrest algorithm)
- ArrhythmiaMechanismTab
- PWA Icon 192px — red squircle, white lightning-bolt/shock symbol (maskable)
- ActionPotentialTab
- CardiacCycleTab
- FeedbackModal
- ICU Helper cacheUtils.ts (source adapted from)
- index.html entry document
- Firebase app/auth/firestore init
- vite-env.d.ts
- AppTopBar
- Hash routing (stateToHash/hashToNav)
- MobileSidebar
- SessionFeedbackPopup
- Icons registry
- NavBar / SectionHeader / List primitives
- electrolytes.ts
- Rizqan Profile Photo (About Screen) — stylized illustration, lab coat, circular avatar frame
- Atrial Fibrillation EKG Strip — irregularly irregular, no P waves, narrow QRS
- Asystole EKG Strip — flat baseline, no organized activity (ACLS non-shockable)
- Third-Degree (Complete) AV Block EKG Strip — AV dissociation, wide escape QRS
- Brugada Pattern Reference (Types 1-3) — coved/saddleback ST elevation V1-V2
- De Winter T-wave Pattern (lead V3) — upsloping ST depression into tall symmetric T, STEMI-equivalent
- Atrial Flutter EKG Strip — sawtooth flutter waves, variable AV block annotated
- Hypokalemia vs Hyperkalemia EKG Changes (two-panel comparison, Life in the Fastlane sourced)
- LBBB EKG Strip — classic WiLLiaM mnemonic (V1 'W', V6 'M')
- Normal Sinus Rhythm EKG Strip — regular, uniform P-QRS-T
- PEA Reference EKG Strip — organized rhythm without pulse (clinical diagnosis, not a distinct morphology)
- STEMI Reference 12-lead EKG — anterior/anterolateral ST elevation V3-V6
- Supraventricular Tachycardia EKG Strip — regular narrow-complex tachycardia, ~150-180 bpm
- Torsades de Pointes EKG Strip — polymorphic VT, twisting QRS amplitude/axis
- Ventricular Fibrillation EKG Strip — chaotic irregular waveform, no QRS (ACLS shockable)
- Ventricular Tachycardia EKG Strip — regular monomorphic wide-complex tachycardia ~180-200 bpm
- Wellens' Syndrome EKG Strip (V2/V3) — deep symmetric T-wave inversion, critical LAD warning
- Wolff-Parkinson-White 12-lead EKG — short PR, possible delta wave slurring
- Shared TS types (Nav, Algorithm, Drug, Rhythm, FlowStep)
- sfx — Web Audio synthesized sound effects
- tsconfig.json compiler config
- vite-env.d.ts type declarations
- EKG image naming convention doc
- conduction.tsx
- search/index.tsx
- Icons
- ElektroNatrium.tsx
- base/index.tsx
- MobileEkgDetail

## God Nodes (most connected - your core abstractions)
1. `App()` - 51 edges
2. `fw()` - 40 edges
3. `react` - 30 edges
4. `HypoNa()` - 25 edges
5. `TheoryScreen()` - 22 edges
6. `NatriumCalc()` - 21 edges
7. `HypoK()` - 21 edges
8. `HyperNa()` - 20 edges
9. `DesktopTheory()` - 20 edges
10. `RefBlock()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `index.html entry document` --references--> `App bootstrap (ReactDOM root, SW register)`  [EXTRACTED]
  index.html → src/main.tsx
- `Theory image slots README` --references--> `TheoryImage — extension-fallback image slot`  [EXTRACTED]
  public/theory/README.md → src/screens/theory/index.tsx
- `Heart Anatomy Illustration — gradient-shaded base layer under animated SA/AV conduction overlay in ConductionDiagram` --shares_data_with--> `ConductionDiagram + CONDUCTION_MAP`  [EXTRACTED]
  public/heart-anatomy.svg → src/components/acls/index.tsx
- `haptic()` --semantically_similar_to--> `haptic object — named vibration patterns (shock/epi/amio...)`  [INFERRED] [semantically similar]
  src/lib/settings.ts → src/utils/haptic.ts
- `ConductionDiagram + CONDUCTION_MAP` --semantically_similar_to--> `EkgConductionPanel()`  [INFERRED] [semantically similar]
  src/components/acls/index.tsx → src/components/conduction.tsx

## Import Cycles
- None detected.

## Communities (62 total, 33 thin omitted)

### Community 0 - "desktop/index.tsx"
Cohesion: 0.12
Nodes (33): ACLS_ALGORITHMS, ACLS_CPR_PROMPTS, ACLS_DRUGS, ACLS_FLOW_ANAPHYLAXIS, ACLS_FLOW_ARREST, ACLS_FLOW_BHJD, ACLS_FLOW_BRADY, ACLS_FLOW_DROWNING (+25 more)

### Community 1 - "theory/index.tsx"
Cohesion: 0.03
Nodes (69): Antzelevitch C, Burashnikov A (2011) — Overview of basic mechanisms of cardiac arrhythmia, Bers DM (2002) — Cardiac excitation-contraction coupling, Nature, Braunwald E et al. — Heart Disease: A Textbook of Cardiovascular Medicine, 11th ed., Grant AO (2009) — Cardiac ion channels, Guyton & Hall — Textbook of Medical Physiology, 14th ed., Katz AM — Physiology of the Heart, 5th ed., Mines GR (1914) — On circulating excitations in heart muscles, Priori SG et al. (2015) — ESC Guidelines for ventricular arrhythmias (+61 more)

### Community 2 - "AdminPage.tsx"
Cohesion: 0.07
Nodes (39): App (root component), firebase, lucide-react, react-dom, AdminPage, AdminPage(), AdminPageProps, ROLE_OPTIONS (+31 more)

### Community 3 - "tools/index.tsx"
Cohesion: 0.08
Nodes (48): doseMath.test.ts suite, vitest, DEFIB_REFERENCES, defibrilasi/kardioversi max-clamp bugfix, PALS_ALGORITHMS, PALS_DRUGS, PALS_REFERENCES, PalsAlgo (+40 more)

### Community 4 - "calc/index.tsx"
Cohesion: 0.09
Nodes (43): calculators.test.ts suite, ACLS_ALGORITHMS catalog, react, SearchModal — global search overlay, BreakdownItem, CalcStep, CalcSteps(), CalcStepsProps (+35 more)

### Community 5 - "settings/index.tsx"
Cohesion: 0.06
Nodes (51): ICU Helper (MD Kit sibling app), PICNIC Helper (MD Kit sibling app, in development), ResNeo Helper (MD Kit sibling app), SettingsScreen component, SettingsScreen, formatBytes(), getStorageEstimate(), performHardReset() (+43 more)

### Community 6 - "App.tsx"
Cohesion: 0.09
Nodes (38): ACCENT, App(), AppTopBar(), AppTopBarProps, DesktopTheory, FeedbackModal(), FeedbackModalProps, FeedbackType (+30 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (30): dependencies, firebase, lucide-react, react, react-dom, devDependencies, playwright, @types/react (+22 more)

### Community 8 - "acls/index.tsx"
Cohesion: 0.12
Nodes (17): BottomNav(), BottomSheet(), CD_COLORS, CONDUCTION_MAP, ConductionState, FlowStep, NodeState, CprRhythm (+9 more)

### Community 9 - "acls/index.tsx"
Cohesion: 0.11
Nodes (22): AWAIT_STEPS, CprAnimator(), CPRTimer(), PEA_STEPS, RHYTHM_OPTS, SETUP_OPTS, StepCard(), useCompCounter() (+14 more)

### Community 10 - "TheoryScreen"
Cohesion: 0.30
Nodes (22): ACSPathophysTab(), ANSTab(), AntiarrhythmicPharmTab(), Cite(), DesktopTheory(), ECCouplingTab(), Ekg12LeadTab(), ElectrolyteTab() (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 12 - "ACLS Helper — panduan untuk Claude"
Cohesion: 0.50
Nodes (3): ACLS Helper — panduan untuk Claude, graphify (knowledge graph repo ini), Setiap kali diminta fitur, perbaikan, atau eksekusi

### Community 13 - "tweaks/index.tsx"
Cohesion: 0.25
Nodes (5): TweakColor(), TweakRadio(), TweakRow(), TwkCheck(), __twkIsLight()

### Community 14 - "NaHypoResultCard — hyponatremia correction card"
Cohesion: 0.33
Nodes (6): NaHypoResultCard — hyponatremia correction card, Adrogué & Madias (2000) — hyponatremia correction formula, Adrogué/Tucker/Madias JAMA (2022) — hyponatremia management, Spasovski (2014) — hyponatremia severity/symptom grading, Sterns (2015) — hyponatremia correction limitations, Verbalis (2013) — ODS plateau & rescue therapy

### Community 15 - "acls-helper package manifest"
Cohesion: 0.33
Nodes (6): firebase (dependency), lucide-react (dependency), playwright (dev dependency), vite-plugin-pwa (dev dependency), vitest (dev dependency), acls-helper package manifest

### Community 16 - "ACLS_FLOW_ARREST (main arrest algorithm)"
Cohesion: 0.50
Nodes (4): FlowStep renderer, ACLS_FLOW_ARREST (main arrest algorithm), PEA_STEPS (AHA 2025 PEA/Asystole sequence), VF_STEPS (AHA 2025 VF/pVT sequence)

### Community 17 - "ArrhythmiaMechanismTab"
Cohesion: 0.50
Nodes (4): ArrhythmiaMechanismTab(), AutomaticitySVG(), ReentrySVG(), TriggeredSVG()

### Community 18 - "PWA Icon 192px — red squircle, white lightning-bolt/shock symbol (maskable)"
Cohesion: 1.00
Nodes (3): PWA Icon 192px — red squircle, white lightning-bolt/shock symbol (maskable), PWA App Icon 512px — same design as icon-192.svg, scaled up, ACLS Helper App Icon (favicon.svg) — red rounded-square, white lightning-bolt/defib-flash glyph

### Community 19 - "ActionPotentialTab"
Cohesion: 0.67
Nodes (3): ActionPotentialTab(), SANodeAP(), VentricularAP()

### Community 20 - "CardiacCycleTab"
Cohesion: 0.67
Nodes (3): CardiacCycleTab(), SimulationModal(), WiggersDiagramAnimated()

### Community 32 - "electrolytes.ts"
Cohesion: 0.09
Nodes (41): CA_GLUCONATE_ELEMENTAL_MG_PER_ML, caGluconateInfusion(), caMgdlToMmol(), NA_BASE, correctedCalcium(), HyperCaSeverity, hyperCaSeverity(), HyperKSeverity (+33 more)

### Community 55 - "EKG image naming convention doc"
Cohesion: 0.67
Nodes (3): EKG image naming convention doc, Theory image slots README, TheoryImage — extension-fallback image slot

### Community 56 - "conduction.tsx"
Cohesion: 0.29
Nodes (7): BeatDot(), COL, CONDUCTION_MAP, ConductionState, ConductionSVG(), EctopicSite, NodeState

### Community 57 - "search/index.tsx"
Cohesion: 0.40
Nodes (5): GROUPS, Result, search(), SearchModal(), SearchModalProps

### Community 58 - "Icons"
Cohesion: 0.40
Nodes (4): Icons, NAV_SECTIONS, NavItem, NavSection

### Community 60 - "ElektroNatrium.tsx"
Cohesion: 0.09
Nodes (80): Accordion(), Disclaimer(), glucoseMgdlToMmol(), hyperKSeverity(), hypoKSeverity(), NaResult, rangeWarning(), weightPlausibilityWarning() (+72 more)

### Community 61 - "base/index.tsx"
Cohesion: 0.12
Nodes (22): FlowConnector, Alert(), GlyphTile(), IconBaseProps, IconProps, LargeTitle(), List(), NavBar() (+14 more)

### Community 62 - "MobileEkgDetail"
Cohesion: 0.28
Nodes (9): ConductionDiagram + CONDUCTION_MAP, RhythmStrip (inline SVG ECG waveform), Heart Anatomy Illustration — gradient-shaded base layer under animated SA/AV conduction overlay in ConductionDiagram, ConductionDiagram, EkgImage, RhythmStrip, EkgConductionPanel(), DesktopEkg() (+1 more)

## Ambiguous Edges - Review These
- `CPRTimer()` → `App (root component)`  [AMBIGUOUS]
  src/App.tsx · relation: calls
- `about/index.tsx` → `PICNIC Helper (MD Kit sibling app, in development)`  [AMBIGUOUS]
  src/screens/about/index.tsx · relation: references
- `App (root component)` → `TweaksPanel / useTweaks (edit-mode overlay)`  [AMBIGUOUS]
  src/components/tweaks/index.tsx · relation: conceptually_related_to

## Knowledge Gaps
- **81 isolated node(s):** `playwright`, `@types/react`, `@types/react-dom`, `typescript`, `Antzelevitch C, Burashnikov A (2011) — Overview of basic mechanisms of cardiac arrhythmia` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 324 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `calc/index.tsx` to `desktop/index.tsx`, `theory/index.tsx`, `AdminPage.tsx`, `tools/index.tsx`, `settings/index.tsx`, `App.tsx`, `package.json`, `acls/index.tsx`, `acls/index.tsx`, `tweaks/index.tsx`, `conduction.tsx`, `search/index.tsx`, `Icons`, `ElektroNatrium.tsx`, `base/index.tsx`?**
  _High betweenness centrality (0.306) - this node is a cross-community bridge._
- **What connects `playwright`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `desktop/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Why does `CALCULATORS` connect `calc/index.tsx` to `desktop/index.tsx`, `search/index.tsx`, `tools/index.tsx`, `App.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `theory/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.02857142857142857 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `CPRTimer()` and `App (root component)`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **What is the exact relationship between `about/index.tsx` and `PICNIC Helper (MD Kit sibling app, in development)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._