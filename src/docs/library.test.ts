import { describe, expect, it } from 'vitest';

import { canonicalDocumentContent, documents, findPage, manifest, searchPages } from './library';

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('starter documentation library', () => {
  it('contains the five licensed trial guides', async () => {
    expect(documents.map((document) => document.id)).toEqual(['html', 'css', 'javascript', 'git', 'python']);
    expect(documents.every((document) => document.pages.length >= 3)).toBe(true);
    expect(manifest.every((entry) => entry.license === 'CC-BY-4.0')).toBe(true);
    expect(manifest.every((entry) => /^[a-f0-9]{64}$/.test(entry.contentHash))).toBe(true);
    for (const document of documents) {
      const expected = await sha256(canonicalDocumentContent(document));
      expect(manifest.find((entry) => entry.documentId === document.id)?.contentHash).toBe(expected);
    }
  });

  it('finds pages by stable document and relative path', () => {
    expect(findPage('css', 'flexbox')?.title).toBe('Flexbox for one-dimensional layouts');
    expect(findPage('css', 'missing')).toBeUndefined();
  });

  it('searches titles and prose case-insensitively', () => {
    const matches = searchPages('COMMIT');
    expect(matches.some((page) => page.documentId === 'git' && page.pagePath === 'commits')).toBe(true);
  });
});
