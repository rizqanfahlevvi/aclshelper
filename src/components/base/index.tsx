import React, { useState, useEffect, useRef } from 'react';

/* ------------------------------------------------------------
   ICONS — Lucide-style SVG glyphs
   ------------------------------------------------------------ */
interface IconBaseProps {
  d?: string;
  size?: number;
  stroke?: number;
  fill?: string;
  children?: React.ReactNode;
  paths?: string[];
  style?: React.CSSProperties;
  [key: string]: unknown;
}

interface IconProps {
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
}

const Icon = ({ d, size = 24, stroke = 1.75, fill = "none", children, paths, ...rest }: IconBaseProps) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    {...rest}>
    {paths && paths.map((p, i) => <path key={i} d={p} />)}
    {d && <path d={d} />}
    {children}
  </svg>
);

export const Icons = {
  house:        ({size, stroke}) => <Icon size={size} stroke={stroke} d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>,
  houseFill:    ({size}) => <Icon size={size} fill="currentColor" stroke={0} d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>,
  calculator:   ({size, stroke}) => <Icon size={size} stroke={stroke}><rect x="4" y="2" width="16" height="20" rx="3"/><path d="M8 6h8M8 10h2M12 10h4M8 14h2M12 14h4M8 18h2M12 18h4"/></Icon>,
  droplet:      ({size, stroke}) => <Icon size={size} stroke={stroke} d="M12 3c-3 5-7 7-7 12a7 7 0 0 0 14 0c0-5-4-7-7-12z"/>,
  dropletFill:  ({size}) => <Icon size={size} fill="currentColor" stroke={0} d="M12 3c-3 5-7 7-7 12a7 7 0 0 0 14 0c0-5-4-7-7-12z"/>,
  pill:         ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/></Icon>,
  clipboard:    ({size, stroke}) => <Icon size={size} stroke={stroke}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 12h6M9 16h6"/></Icon>,
  book:         ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>,
  activity:     ({size, stroke}) => <Icon size={size} stroke={stroke} d="M3 12h3l2-5 4 10 2-5h7"/>,
  lungs:        ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M12 4v8M9 6h6"/><path d="M6 9c-1.5 0-3 1-3 4v4a4 4 0 0 0 7 3l1-3V9c0-1-1-2-2-2S6 8 6 9zM18 9c1.5 0 3 1 3 4v4a4 4 0 0 1-7 3l-1-3V9c0-1 1-2 2-2s3 1 3 2z"/></Icon>,
  syringe:      ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M18 2l4 4M16 4l4 4M13 7l4 4-9 9-4-4z"/><path d="M5 13L2 16l6 6 3-3"/></Icon>,
  arrowDown:    ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M12 5v14M5 12l7 7 7-7"/></Icon>,
  search:       ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></Icon>,
  chevR:        ({size, stroke}) => <Icon size={size} stroke={stroke || 2} d="M9 6l6 6-6 6"/>,
  chevL:        ({size, stroke}) => <Icon size={size} stroke={stroke || 2.4} d="M15 6l-6 6 6 6"/>,
  chevDown:     ({size, stroke}) => <Icon size={size} stroke={stroke} d="M6 9l6 6 6-6"/>,
  check:        ({size, stroke}) => <Icon size={size} stroke={stroke || 2.4} d="M20 6 9 17l-5-5"/>,
  plus:         ({size, stroke}) => <Icon size={size} stroke={stroke || 2} d="M12 5v14M5 12h14"/>,
  ellipsis:     ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="5" cy="12" r="0.5"/><circle cx="12" cy="12" r="0.5"/><circle cx="19" cy="12" r="0.5"/></Icon>,
  info:         ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16v.5"/></Icon>,
  warning:      ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17v.5"/></Icon>,
  share:        ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></Icon>,
  star:         ({size, stroke}) => <Icon size={size} stroke={stroke} d="m12 2 3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.13 2 9.26l6.91-1z"/>,
  starFill:     ({size}) => <Icon size={size} fill="currentColor" stroke={0} d="m12 2 3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.13 2 9.26l6.91-1z"/>,
  heart:        ({size, stroke}) => <Icon size={size} stroke={stroke} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  settings:     ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  clock:        ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  bookmark:     ({size, stroke}) => <Icon size={size} stroke={stroke} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  user:         ({size, stroke}) => <Icon size={size} stroke={stroke}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Icon>,
  coffee:       ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3"/></Icon>,
  scale:        ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M6 18 2 9h8zM18 18l4-9h-8zM12 3v18M6 21h12"/></Icon>,
  brain:        ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15A2.5 2.5 0 0 1 9.5 22a2.5 2.5 0 0 1-2.5-2.5C5.3 19.5 4 18 4 16c0-.7.4-1.4 1-2-.6-.6-1-1.3-1-2 0-1.7 1.3-3 3-3v0c0-1.4 1-2.5 2.5-2.5z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5c1.7-.5 3-2 3-4 0-.7-.4-1.4-1-2 .6-.6 1-1.3 1-2 0-1.7-1.3-3-3-3v0c0-1.4-1-2.5-2.5-2.5z"/></Icon>,
  kidney:       ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M7 22c0-5 4-8 4-12C11 5 9 3 7 3S3 5 3 10c0 4 4 7 4 12zM17 22c0-5 4-8 4-12 0-5-2-7-4-7s-4 2-4 7c0 4 4 7 4 12z"/></Icon>,
  trending:     ({size, stroke}) => <Icon size={size} stroke={stroke}><path d="M22 7 13 16l-4-4-7 7"/><path d="M16 7h6v6"/></Icon>,
  battery:      ({size}) => <Icon size={size} stroke={0}>
    <rect x="1" y="6" width="20" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="2.5" y="7.5" width="13" height="9" rx="1.5" fill="currentColor"/>
    <rect x="22" y="10" width="1.5" height="4" rx="0.5" fill="currentColor"/>
  </Icon>,
  wifi:         ({size}) => <Icon size={size} stroke={1.6}><path d="M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0M12 19v.5"/></Icon>,
  cellular:     ({size}) => <Icon size={size} stroke={0}>
    <rect x="2" y="13" width="3" height="5" rx="0.5" fill="currentColor"/>
    <rect x="7" y="10" width="3" height="8" rx="0.5" fill="currentColor"/>
    <rect x="12" y="6" width="3" height="12" rx="0.5" fill="currentColor"/>
    <rect x="17" y="2" width="3" height="16" rx="0.5" fill="currentColor"/>
  </Icon>,
  // ACLS-specific icons
  heartPulse: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12h3l2-4 3 8 2-4h7" />
    </svg>,
  bolt: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>,
  boltFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>,
  heartFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.5C5.5 17 1.5 13 1.5 8.5 1.5 5.2 4.2 2.5 7.5 2.5c1.9 0 3.6 1 4.5 2.5 1-1.5 2.6-2.5 4.5-2.5 3.3 0 6 2.7 6 6 0 4.5-4 8.5-10.5 13z"/>
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M12 5.5c0-1.5 1-2.5 2.5-2.5s2 1 2 2"/>
    </svg>,
  timer: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6M19 5l2 2" />
    </svg>,
  flatline: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20" />
    </svg>,
  slow: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h4l2-3 2 6 2-3h10" />
    </svg>,
  fast: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2l1-3 1 6 1-5 1 4 1-2h2l1-3 1 6 1-5 1 4 1-2h6" />
    </svg>,
  shock: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h6l-2 7h4l-7 9 2-8H8z" />
    </svg>,
  flowArrow: ({ size = 20, stroke = 2 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v15M6 13l6 6 6-6" />
    </svg>,
  play: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z" /></svg>,
  pause: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>,
  reset: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3.5-7.1M21 3v6h-6" />
    </svg>,
  algo: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" /><path d="M6 9v3h12V9M12 12v3" />
    </svg>,
  algoFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="6" height="6" rx="1.4" /><rect x="15" y="3" width="6" height="6" rx="1.4" />
      <rect x="9" y="15" width="6" height="6" rx="1.4" />
    </svg>,
  tools: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 1 0 3 3l-5 5-3 3-1.5-1.5 3-3 5-5z" />
      <path d="m9 14-5.5 5.5a1.5 1.5 0 0 0 2 2L11 16" />
    </svg>,
  ekg: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3l1-3 2 8 2-12 2 8 1-1h7" />
    </svg>,
  ekgFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3l1-3 2 8 2-12 2 8 1-1h7" />
    </svg>,
  pillFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 1 1 7 7zM8.5 8.5l7 7" />
    </svg>,
  toolsFill: ({ size = 24 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.7 6.3a4 4 0 1 0 3 3l-5 5-3 3-1.5-1.5 3-3 5-5zM9 14l-5.5 5.5a1.5 1.5 0 0 0 2 2L11 16z" />
    </svg>,
  cross: ({ size = 24, stroke = 1.75 }) =>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>,
};

/* ------------------------------------------------------------
   StatusBar
   ------------------------------------------------------------ */
export const StatusBar = ({ time = "9:41", dark }) => (
  <div className="ios-statusbar" style={{ color: dark ? "#fff" : "#000" }}>
    <span>{time}</span>
    <div className="right icons">
      <Icons.cellular size={17}/>
      <Icons.wifi size={17}/>
      <Icons.battery size={26}/>
    </div>
  </div>
);

/* ------------------------------------------------------------
   NavBar
   ------------------------------------------------------------ */
interface NavBarProps {
  title?: React.ReactNode;
  back?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}
export const NavBar = ({ title, back, onBack, right, large }: NavBarProps) => (
  <div className="ios-navbar" style={{ minHeight: 44 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 0, flex: 1, zIndex: 2 }}>
      {back && (
        <button className="nb-btn back" onClick={onBack}>
          <Icons.chevL size={20}/>
          <span style={{ marginLeft: -2 }}>{back}</span>
        </button>
      )}
    </div>
    {!large && title && <div className="nb-title">{title}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 2 }}>
      {right}
    </div>
  </div>
);

export const LargeTitle = ({ children, right }: { children?: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ padding: "4px 20px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
    <h1 className="t-large-title" style={{ margin: 0 }}>{children}</h1>
    {right}
  </div>
);

export const SearchField = ({ placeholder = "Cari", value = "", onChange, onFocus }) => (
  <div className="ios-search" style={{ cursor: "text" }}>
    <Icons.search size={17} stroke={2} style={{ flexShrink: 0, color: "var(--label-tertiary)" }}/>
    <input
      type="search"
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      style={{
        flex: 1, border: "none", background: "transparent", outline: "none",
        font: "inherit", color: "var(--label-primary)", fontSize: 17,
        letterSpacing: "-0.022em", WebkitAppearance: "none", appearance: "none",
        minWidth: 0,
      }}
    />
    {value && (
      <button onClick={() => onChange && onChange("")}
        style={{ background: "none", border: 0, cursor: "pointer", color: "var(--label-tertiary)", padding: "0 2px", display: "inline-flex", alignItems: "center" }}>
        <Icons.cross size={14} stroke={2.4}/>
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------
   TabBar
   ------------------------------------------------------------ */
export const TabBar = ({ tabs, active, onChange }) => (
  <div className="ios-tabbar">
    {tabs.map(t => (
      <button key={t.key} className={"tab " + (active === t.key ? "active" : "")} onClick={() => onChange(t.key)}>
        {t.icon({ size: 26, stroke: active === t.key ? 0 : 1.6, fill: active === t.key ? "currentColor" : "none" })}
        <span>{t.label}</span>
      </button>
    ))}
    <div className="ios-home-indicator" style={{ background: "currentColor", opacity: 0.85, color: "var(--label-primary)" }}/>
  </div>
);

/* ------------------------------------------------------------
   List / Row
   ------------------------------------------------------------ */
export const SectionHeader = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "22px 32px 6px 32px" }}>
    <span className="t-footnote" style={{ color: "var(--label-secondary)", textTransform: "uppercase", letterSpacing: "-0.005em" }}>{children}</span>
    {action && <span className="t-footnote" style={{ color: "var(--accent)" }}>{action}</span>}
  </div>
);

export const SectionFooter = ({ children }) => (
  <div style={{ padding: "8px 32px 14px", fontSize: 13, color: "var(--label-secondary)", letterSpacing: "-0.005em" }}>{children}</div>
);

export const List = ({ children, style }) => (
  <div className="ios-list" style={style}>{children}</div>
);

export const GlyphTile = ({ tint, children, size = 29, radius = 7, style }) => (
  <span style={{ width: size, height: size, borderRadius: radius, background: tint, color: "#fff", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 14, ...style }}>{children}</span>
);

export const Row = ({ glyph, tint, label, sub, value, valueColor, chev = true, onClick, right }) => (
  <button className="ios-row" style={{ border: 0, width: "100%", textAlign: "left" }} onClick={onClick}>
    {glyph && <GlyphTile tint={tint}>{glyph}</GlyphTile>}
    <div className="label">
      {label}
      {sub && <span className="sub">{sub}</span>}
    </div>
    {right ?? (value && <span className="value" style={{ color: valueColor }}>{value}</span>)}
    {chev && onClick && <span className="chev"><Icons.chevR size={14} stroke={2.4}/></span>}
  </button>
);

/* ------------------------------------------------------------
   Form controls
   ------------------------------------------------------------ */
export const Field = ({ label, value, onChange, unit, type = "text", placeholder, options }) => (
  <div className="ios-field" style={{ borderBottom: "0.5px solid var(--separator)" }}>
    <label>{label}</label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ color: "var(--accent)", fontWeight: 400, appearance: "none", direction: "rtl", padding: 0 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value ?? ""} placeholder={placeholder}
        onChange={e => onChange(type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}/>
    )}
    {unit && <span className="unit">{unit}</span>}
  </div>
);

export const Switch = ({ on, onChange }) => (
  <button className={"ios-switch " + (on ? "on" : "")} onClick={() => onChange && onChange(!on)} aria-pressed={on}/>
);

export const Segmented = ({ value, onChange, options }) => (
  <div className="ios-segmented">
    {options.map(o => (
      <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

export const Stepper = ({ value, min = 0, max = 99, onChange }) => (
  <div className="ios-stepper">
    <button onClick={() => onChange(Math.max(min, value - 1))}>−</button>
    <button onClick={() => onChange(Math.min(max, value + 1))}>+</button>
  </div>
);

export const Pill = ({ tone = "blue", children }) => (
  <span className={"ios-tag " + tone}>{children}</span>
);

export const Button = ({ kind = "primary", size, block, children, onClick }) => {
  const cls = ["ios-btn"];
  if (kind === "tinted") cls.push("tinted");
  if (kind === "gray") cls.push("gray");
  if (kind === "plain") cls.push("plain");
  if (kind === "destructive") cls.push("destructive");
  if (size === "sm") cls.push("sm");
  if (block) cls.push("block");
  return <button className={cls.join(" ")} onClick={onClick}>{children}</button>;
};

export const Alert = ({ kind = "info", title, children, icon }) => {
  const map = {
    info:   { color: "var(--info)",    Icon: Icons.info },
    warn:   { color: "var(--warning)", Icon: Icons.warning },
    danger: { color: "var(--danger)",  Icon: Icons.warning },
  }[kind];
  const I = icon || map.Icon;
  return (
    <div className={"ios-alert " + kind}>
      <span className="icon" style={{ color: map.color, marginTop: 2 }}><I size={22} stroke={2}/></span>
      <div style={{ flex: 1 }}>
        {title && <div className="title">{title}</div>}
        <div className="body">{children}</div>
      </div>
    </div>
  );
};

export const ResultTile = ({ label, value, sub, tint = "var(--tint-fluid)" }) => (
  <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--r-card)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2, boxShadow: "var(--shadow-1)" }}>
    <div className="t-caption-2" style={{ color: "var(--label-secondary)" }}>{label}</div>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: tint, fontFeatureSettings: '"tnum"' }}>{value}</div>
    {sub && <div className="t-caption-1" style={{ color: "var(--label-tertiary)" }}>{sub}</div>}
  </div>
);
