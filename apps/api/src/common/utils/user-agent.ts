export interface ParsedUserAgent {
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

type Rule = [pattern: RegExp, name: string];

// Order matters: Edge and Opera also contain "Chrome", Chrome also contains "Safari".
const BROWSERS: Rule[] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser/, 'Samsung Internet'],
  [/Firefox|FxiOS/, 'Firefox'],
  [/Chrome|CriOS/, 'Chrome'],
  [/Safari/, 'Safari'],
];

// Android reports "Linux" too, and iPadOS can report "Mac OS X".
const SYSTEMS: Rule[] = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|scrape|fetch|curl|wget|python|axios|node|postman|http-client|facebookexternalhit|whatsapp/i;

const match = (rules: Rule[], userAgent: string) =>
  rules.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Other';

function deviceOf(userAgent: string): ParsedUserAgent['device'] {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

/** Coarse classification for analytics. Deliberately not a full fingerprint. */
export const parseUserAgent = (userAgent: string): ParsedUserAgent => ({
  device: deviceOf(userAgent),
  browser: match(BROWSERS, userAgent),
  os: match(SYSTEMS, userAgent),
});

/** Crawlers, link previews, monitoring and scripts are not visitors. */
export const isBot = (userAgent: string | undefined) => !userAgent || BOT_PATTERN.test(userAgent);
