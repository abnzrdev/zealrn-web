import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import {
  createJsonBackup,
  createNotesZip,
  noteMarkdown,
  parseNotesImport,
  planNotesImport,
  safeFilename,
} from './backup';
import type { LearningNote } from './storage';

const note: LearningNote = {
  id: 'note-1',
  documentId: 'html',
  documentTitle: 'HTML',
  pageIdentity: 'html:forms',
  pagePath: 'forms',
  pageTitle: 'Forms: names / values?',
  content: 'Use a label.\n\nUnicode: café',
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T11:00:00.000Z',
};

describe('note backup and import', () => {
  it('creates readable Markdown and safe deterministic filenames', () => {
    expect(noteMarkdown(note)).toContain('# Forms: names / values?');
    expect(noteMarkdown(note)).toContain('Use a label.');
    expect(safeFilename('HTML - Forms: names / values?')).toBe('HTML - Forms names - values');
  });

  it('round-trips a versioned ZealRN Web JSON backup', () => {
    const backup = createJsonBackup([note]);
    expect(backup.format).toBe('zealrn-web-notes');
    expect(backup.version).toBe(1);
    expect(parseNotesImport(JSON.stringify(backup))).toEqual([note]);
  });

  it('imports a compatible desktop single-note JSON export', () => {
    const desktop = {
      format_version: 1,
      note_id: 42,
      docset_id: 'git',
      docset_name: 'Git',
      page_key: 'commits',
      page_path: 'commits',
      page_title: 'Create commits',
      content: 'Snapshot note',
      created_at: '2026-07-14T10:00:00.000Z',
      updated_at: '2026-07-14T11:00:00.000Z',
    };
    expect(parseNotesImport(JSON.stringify(desktop))[0]).toMatchObject({ documentId: 'git', pagePath: 'commits', content: 'Snapshot note' });
    expect(() => parseNotesImport(JSON.stringify({ ...desktop, content: 'x'.repeat(1024 * 1024 + 1) })))
      .toThrow(/invalid note/i);
  });

  it('reports conflicts instead of overwriting silently', () => {
    const incoming = [note, { ...note, id: 'note-2', documentId: 'css', pageIdentity: 'css:grid', pagePath: 'grid' }];
    const plan = planNotesImport(incoming, [note]);
    expect(plan.newNotes).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(1);
  });

  it('rejects oversized imports and note content', () => {
    expect(() => parseNotesImport(' '.repeat(5 * 1024 * 1024 + 1))).toThrow(/too large/i);
    const backup = createJsonBackup([{ ...note, content: 'x'.repeat(1024 * 1024 + 1) }]);
    expect(() => parseNotesImport(JSON.stringify(backup))).toThrow(/invalid note/i);
  });

  it('rejects excessive note counts', () => {
    const backup = createJsonBackup(Array.from({ length: 10_001 }, (_, index) => ({
      ...note,
      id: `note-${index}`,
      pagePath: `page-${index}`,
      pageIdentity: `html:page-${index}`,
    })));
    expect(() => parseNotesImport(JSON.stringify(backup))).toThrow(/too many notes/i);
  });

  it('rejects duplicate page identities inside one backup', () => {
    const backup = createJsonBackup([note, { ...note, id: 'note-duplicate' }]);
    expect(() => parseNotesImport(JSON.stringify(backup))).toThrow(/duplicate page/i);
  });

  it('creates a ZIP with a JSON index and unique Markdown notes', () => {
    const duplicateName = { ...note, id: 'note-2', documentId: 'css', pageIdentity: 'css:forms', content: 'CSS note' };
    const files = unzipSync(createNotesZip([note, duplicateName]));
    const names = Object.keys(files).sort();
    expect(names).toContain('README.md');
    expect(names).toContain('index.json');
    expect(names.filter((name) => name.startsWith('notes/'))).toHaveLength(2);
    expect(strFromU8(files['index.json']!)).toContain('zealrn-web-notes');
  });
});
