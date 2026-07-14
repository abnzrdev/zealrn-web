import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';

import { documents } from '../docs/library';

export const NOTES_DATABASE_NAME = 'zealrn-web';
export const NOTES_DATABASE_VERSION = 1;

export interface NotePage {
  documentId: string;
  documentTitle: string;
  pagePath: string;
  pageTitle: string;
}

export interface LearningNote extends NotePage {
  id: string;
  pageIdentity: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface KeyValueRecord {
  key: string;
  value: unknown;
}

interface StoredDocument {
  id: string;
  title: string;
  version: string;
}

interface StoredDocumentPage {
  identity: string;
  documentId: string;
  pagePath: string;
  title: string;
}

interface ZealDatabase extends DBSchema {
  notes: {
    key: string;
    value: LearningNote;
    indexes: {
      'by-document': string;
      'by-page': string;
      'by-updated': string;
    };
  };
  documents: { key: string; value: StoredDocument };
  documentPages: {
    key: string;
    value: StoredDocumentPage;
    indexes: { 'by-document': string };
  };
  preferences: { key: string; value: KeyValueRecord };
  offlineMetadata: { key: string; value: KeyValueRecord };
}

export interface NotesRepository {
  load(page: NotePage): Promise<LearningNote | undefined>;
  save(page: NotePage, content: string): Promise<LearningNote>;
  search(query: string): Promise<LearningNote[]>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
  close(): void;
}

function decoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizePagePath(pagePath: string): string {
  const cleanPath = pagePath.trim().split(/[?#]/, 1)[0] ?? '';
  const segments: string[] = [];
  for (const rawSegment of cleanPath.replaceAll('\\', '/').split('/')) {
    const segment = decoded(rawSegment);
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments.join('/');
}

export function pageIdentity(documentId: string, pagePath: string): string {
  return `${documentId.trim().toLowerCase()}:${normalizePagePath(pagePath)}`;
}

export async function openZealDatabase(name = NOTES_DATABASE_NAME): Promise<IDBPDatabase<ZealDatabase>> {
  return openDB<ZealDatabase>(name, NOTES_DATABASE_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion >= 1) return;

      const notes = database.createObjectStore('notes', { keyPath: 'id' });
      notes.createIndex('by-document', 'documentId');
      notes.createIndex('by-page', 'pageIdentity', { unique: true });
      notes.createIndex('by-updated', 'updatedAt');

      database.createObjectStore('documents', { keyPath: 'id' });
      const pages = database.createObjectStore('documentPages', { keyPath: 'identity' });
      pages.createIndex('by-document', 'documentId');
      database.createObjectStore('preferences', { keyPath: 'key' });
      database.createObjectStore('offlineMetadata', { keyPath: 'key' });
    },
  });
}

export async function deleteZealDatabase(name = NOTES_DATABASE_NAME): Promise<void> {
  await deleteDB(name);
}

export async function getPreference<T>(key: string, name = NOTES_DATABASE_NAME): Promise<T | undefined> {
  const database = await openZealDatabase(name);
  const record = await database.get('preferences', key);
  database.close();
  return record?.value as T | undefined;
}

export async function setPreference(key: string, value: unknown, name = NOTES_DATABASE_NAME): Promise<void> {
  const database = await openZealDatabase(name);
  await database.put('preferences', { key, value });
  database.close();
}

export async function seedStarterDocuments(database: IDBPDatabase<ZealDatabase>): Promise<void> {
  const transaction = database.transaction(['documents', 'documentPages'], 'readwrite');
  for (const document of documents) {
    await transaction.objectStore('documents').put({ id: document.id, title: document.title, version: document.version });
    for (const page of document.pages) {
      await transaction.objectStore('documentPages').put({
        identity: pageIdentity(document.id, page.pagePath),
        documentId: document.id,
        pagePath: page.pagePath,
        title: page.title,
      });
    }
  }
  await transaction.done;
}

export function createNotesRepository(database: IDBPDatabase<ZealDatabase>): NotesRepository {
  return {
    async load(page) {
      return database.getFromIndex('notes', 'by-page', pageIdentity(page.documentId, page.pagePath));
    },

    async save(page, content) {
      const transaction = database.transaction('notes', 'readwrite');
      const identity = pageIdentity(page.documentId, page.pagePath);
      const existing = await transaction.store.index('by-page').get(identity);
      const now = new Date().toISOString();
      const note: LearningNote = {
        ...page,
        id: existing?.id ?? crypto.randomUUID(),
        pageIdentity: identity,
        content,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await transaction.store.put(note);
      await transaction.done;
      return note;
    },

    async search(query) {
      const terms = query.trim().toLocaleLowerCase();
      const notes = await database.getAll('notes');
      return notes
        .filter((note) => !terms || [note.pageTitle, note.documentTitle, note.pagePath, note.content]
          .some((value) => value.toLocaleLowerCase().includes(terms)))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async remove(id) {
      await database.delete('notes', id);
    },

    async count() {
      return database.count('notes');
    },

    close() {
      database.close();
    },
  };
}

let applicationRepository: Promise<NotesRepository> | undefined;

export function getNotesRepository(): Promise<NotesRepository> {
  applicationRepository ??= openZealDatabase().then(async (database) => {
    await seedStarterDocuments(database);
    return createNotesRepository(database);
  });
  return applicationRepository;
}

export async function resetApplicationDatabase(): Promise<void> {
  if (applicationRepository) {
    const repository = await applicationRepository;
    repository.close();
    applicationRepository = undefined;
  }
  await deleteZealDatabase();
}
