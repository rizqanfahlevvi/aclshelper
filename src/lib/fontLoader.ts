/* ============================================================
   ACLS Helper — Font loader
   Inject <link> Google Fonts on-demand. Lexend & JetBrains Mono
   sudah dimuat dari colors-and-type.css, jadi tidak diulang di sini.
   ============================================================ */

const FONT_URLS: Record<string, string> = {
  inter:           'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  roboto:          'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
  poppins:         'https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800;900&display=swap',
  montserrat:      'https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap',
  'plus-jakarta':  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap',
  outfit:          'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap',
  'space-grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap',
  'fira-code':     'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap',
  quicksand:       'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap',
};

/* lexend, jetbrains, dan system tidak butuh <link> tambahan. */
const loadedFonts = new Set<string>(['lexend', 'jetbrains', 'system']);

/**
 * Inject <link> Google Fonts untuk fontId. No-op jika sudah dimuat atau
 * tidak butuh file remote.
 */
export function loadFont(fontId: string): void {
  if (loadedFonts.has(fontId)) return;
  const url = FONT_URLS[fontId];
  if (!url) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
  loadedFonts.add(fontId);
}

/** CSS font-family stack per fontId — dipakai UI preview & efek global --font-sans. */
export function fontFamilyStack(fontId: string): string {
  const map: Record<string, string> = {
    lexend:          '"Lexend", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    inter:           '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    roboto:          '"Roboto", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    jetbrains:       '"JetBrains Mono", ui-monospace, monospace',
    system:          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    poppins:         '"Poppins", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    montserrat:      '"Montserrat", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    'plus-jakarta':  '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    outfit:          '"Outfit", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    'space-grotesk': '"Space Grotesk", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    'fira-code':     '"Fira Code", ui-monospace, monospace',
    quicksand:       '"Quicksand", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  };
  return map[fontId] || map.system;
}
