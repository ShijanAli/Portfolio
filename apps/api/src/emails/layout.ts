import { env } from '@/config/env';
import { escapeHtml } from '@/common/utils/html';

interface LayoutOptions {
  heading: string;
  /** Trusted HTML: escape any user-provided text before passing it in. */
  body: string;
  cta?: { label: string; url: string };
  /** Small print under the card, e.g. an unsubscribe link. */
  footer?: string;
}

const button = ({ label, url }: { label: string; url: string }) => `
  <p style="margin:28px 0 8px">
    <a href="${escapeHtml(url)}" style="background:#7c5cff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(label)}</a>
  </p>`;

/** One HTML shell for every email the site sends. */
export function renderLayout({ heading, body, cta, footer }: LayoutOptions): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2330">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td style="font-size:15px;line-height:1.6">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${escapeHtml(heading)}</h1>
            ${body}
            ${cta ? button(cta) : ''}
          </td></tr>
        </table>
        <p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#7b8194">
          ${footer ?? escapeHtml(env.MAIL_FROM_NAME)}
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export const paragraph = (text: string) => `<p style="margin:0 0 12px">${escapeHtml(text)}</p>`;

/** A label/value list, e.g. booking details. Values are escaped. */
export const detailList = (rows: Array<[label: string, value: string | null | undefined]>) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;font-size:14px">
    ${rows
      .filter(([, value]) => value)
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#7b8194;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(String(value)).replace(/\n/g, '<br>')}</td></tr>`,
      )
      .join('')}
  </table>`;
