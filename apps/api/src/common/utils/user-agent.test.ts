import { describe, expect, it } from 'vitest';
import { isBot, parseUserAgent } from './user-agent';

const UA = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroidPhone:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  chromeAndroidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

describe('parseUserAgent', () => {
  it.each([
    [UA.chromeWindows, { device: 'desktop', browser: 'Chrome', os: 'Windows' }],
    [UA.edgeWindows, { device: 'desktop', browser: 'Edge', os: 'Windows' }],
    [UA.safariMac, { device: 'desktop', browser: 'Safari', os: 'macOS' }],
    [UA.safariIphone, { device: 'mobile', browser: 'Safari', os: 'iOS' }],
    [UA.chromeAndroidPhone, { device: 'mobile', browser: 'Chrome', os: 'Android' }],
    [UA.chromeAndroidTablet, { device: 'tablet', browser: 'Chrome', os: 'Android' }],
    [UA.firefoxLinux, { device: 'desktop', browser: 'Firefox', os: 'Linux' }],
  ])('classifies %s', (userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toEqual(expected);
  });
});

describe('isBot', () => {
  it('flags crawlers, scripts and missing user agents', () => {
    expect(isBot(UA.googlebot)).toBe(true);
    expect(isBot('curl/8.5.0')).toBe(true);
    expect(isBot(undefined)).toBe(true);
  });

  it('lets real browsers through', () => {
    expect(isBot(UA.chromeWindows)).toBe(false);
    expect(isBot(UA.safariIphone)).toBe(false);
  });
});
