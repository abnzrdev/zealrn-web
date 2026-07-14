import { describe, expect, it } from 'vitest';

import { parseHash, resolveTheme } from './app-state';

describe('parseHash', () => {
  it('uses the starter HTML page for an empty hash', () => {
    expect(parseHash('')).toEqual({ view: 'docs', documentId: 'html', pagePath: 'introduction' });
  });

  it('parses a documentation page without accepting unknown views', () => {
    expect(parseHash('#/docs/css/flexbox')).toEqual({ view: 'docs', documentId: 'css', pagePath: 'flexbox' });
    expect(parseHash('#/unknown')).toEqual({ view: 'docs', documentId: 'html', pagePath: 'introduction' });
  });
});

describe('resolveTheme', () => {
  it('resolves system preference without changing explicit choices', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
});
