import { strToU8, zipSync } from 'fflate';

import { pageIdentity, type LearningNote } from './storage';

export const BACKUP_FORMAT = 'zealrn-web-notes';
export const BACKUP_VERSION = 1;
export const APP_VERSION = '0.1.0';
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_NOTES = 10_000;
const MAX_METADATA_LENGTH = 4096;
const MAX_NOTE_CONTENT_LENGTH = 1024 * 1024;

export interface NotesBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  appVersion: string;
  exportedAt: string;
  notes: LearningNote[];
}

export interface ImportPlan {
  newNotes: LearningNote[];
  conflicts: LearningNote[];
}

export function safeFilename(value: string): string {
  return value
    .replaceAll('/', ' - ')
    .replace(/[<>:"\\|?*\p{Cc}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '') || 'note';
}

export function noteMarkdown(note: LearningNote): string {
  return `# ${note.pageTitle}

- Document: ${note.documentTitle}
- Path: ${note.pagePath}
- Created: ${note.createdAt}
- Updated: ${note.updatedAt}

${note.content}
`;
}

export function createJsonBackup(notes: LearningNote[]): NotesBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
  };
}

function isNote(value: unknown): value is LearningNote {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<LearningNote>;
  const metadata = [note.id, note.documentId, note.documentTitle, note.pagePath, note.pageTitle];
  return metadata.every((field) => typeof field === 'string' && field.length <= MAX_METADATA_LENGTH)
    && typeof note.content === 'string'
    && note.content.length <= MAX_NOTE_CONTENT_LENGTH
    && typeof note.createdAt === 'string'
    && Number.isFinite(Date.parse(note.createdAt))
    && typeof note.updatedAt === 'string'
    && Number.isFinite(Date.parse(note.updatedAt));
}

function desktopNote(value: Record<string, unknown>): LearningNote | undefined {
  const documentId = value.docset_id;
  const documentTitle = value.docset_name;
  const pagePath = value.page_path;
  const pageTitle = value.page_title;
  const content = value.content;
  const createdAt = value.created_at;
  const updatedAt = value.updated_at;
  if (![documentId, documentTitle, pagePath, pageTitle, content, createdAt, updatedAt].every((field) => typeof field === 'string')) return undefined;
  const note: LearningNote = {
    id: `desktop-${String(value.note_id ?? crypto.randomUUID())}`,
    documentId: documentId as string,
    documentTitle: documentTitle as string,
    pageIdentity: pageIdentity(documentId as string, pagePath as string),
    pagePath: pagePath as string,
    pageTitle: pageTitle as string,
    content: content as string,
    createdAt: createdAt as string,
    updatedAt: updatedAt as string,
  };
  return isNote(note) ? note : undefined;
}

export function parseNotesImport(json: string): LearningNote[] {
  if (new Blob([json]).size > MAX_IMPORT_BYTES) throw new Error('The notes backup is too large.');
  const parsed: unknown = JSON.parse(json);
  if (parsed && typeof parsed === 'object' && (parsed as Partial<NotesBackup>).format === BACKUP_FORMAT) {
    const backup = parsed as Partial<NotesBackup>;
    if (backup.version !== BACKUP_VERSION || !Array.isArray(backup.notes)) throw new Error('Unsupported ZealRN Web backup version.');
    if (backup.notes.length > MAX_IMPORT_NOTES) throw new Error('The backup contains too many notes.');
    const notes = backup.notes.filter(isNote).map((note) => ({ ...note, pageIdentity: pageIdentity(note.documentId, note.pagePath) }));
    if (notes.length !== backup.notes.length) throw new Error('The backup contains invalid note records.');
    const identities = new Set(notes.map((note) => note.pageIdentity));
    if (identities.size !== notes.length) throw new Error('The backup contains duplicate page notes.');
    return notes;
  }
  if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).format_version === 1) {
    const note = desktopNote(parsed as Record<string, unknown>);
    if (note) return [note];
    throw new Error('The desktop export contains an invalid note record.');
  }
  throw new Error('This file is not a supported ZealRN notes backup.');
}

export function planNotesImport(incoming: LearningNote[], existing: LearningNote[]): ImportPlan {
  const identities = new Set(existing.map((note) => note.pageIdentity));
  return {
    newNotes: incoming.filter((note) => !identities.has(note.pageIdentity)),
    conflicts: incoming.filter((note) => identities.has(note.pageIdentity)),
  };
}

export function createNotesZip(notes: LearningNote[]): Uint8Array {
  const usedNames = new Set<string>();
  const files: Record<string, Uint8Array> = {
    'README.md': strToU8('ZealRN Web notes export\n\nEach Markdown file is page-linked. index.json is a complete versioned backup.\n'),
    'index.json': strToU8(`${JSON.stringify(createJsonBackup(notes), null, 2)}\n`),
  };
  for (const note of notes) {
    const base = safeFilename(`${note.documentTitle} - ${note.pageTitle}`);
    let name = base;
    let suffix = 2;
    while (usedNames.has(name.toLocaleLowerCase())) name = `${base}-${suffix++}`;
    usedNames.add(name.toLocaleLowerCase());
    files[`notes/${name}.md`] = strToU8(noteMarkdown(note));
  }
  return zipSync(files);
}

export function downloadFile(contents: string | Uint8Array, filename: string, type: string): void {
  const blobPart = typeof contents === 'string' ? contents : new Uint8Array(contents);
  const url = URL.createObjectURL(new Blob([blobPart], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportNoteMarkdown(note: LearningNote): void {
  downloadFile(noteMarkdown(note), `${safeFilename(`${note.documentTitle} - ${note.pageTitle}`)}.md`, 'text/markdown;charset=utf-8');
}

export function exportNoteJson(note: LearningNote): void {
  downloadFile(`${JSON.stringify(createJsonBackup([note]), null, 2)}\n`, `${safeFilename(`${note.documentTitle} - ${note.pageTitle}`)}.json`, 'application/json');
}

function escaped(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function printNote(note: LearningNote): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) throw new Error('Allow popups to open the print view.');
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escaped(note.pageTitle)}</title><style>body{max-width:48rem;margin:3rem auto;padding:0 1rem;font:12pt/1.6 system-ui;color:#111}h1{font-family:serif}dl{color:#555}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>${escaped(note.pageTitle)}</h1><dl><dt>Document</dt><dd>${escaped(note.documentTitle)}</dd><dt>Path</dt><dd>${escaped(note.pagePath)}</dd></dl><pre>${escaped(note.content)}</pre></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
