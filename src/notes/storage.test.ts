import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createNotesRepository,
  deleteZealDatabase,
  openZealDatabase,
  pageIdentity,
  seedStarterDocuments,
  type NotePage,
} from './storage';

const databaseName = 'zealrn-web-notes-test';
const page: NotePage = {
  documentId: 'javascript',
  documentTitle: 'JavaScript',
  pagePath: 'dom/events',
  pageTitle: 'DOM events',
};

beforeEach(async () => deleteZealDatabase(databaseName));
afterEach(async () => deleteZealDatabase(databaseName));

describe('notes database', () => {
  it('creates the version 1 stores and indexes', async () => {
    const database = await openZealDatabase(databaseName);
    expect(database.version).toBe(1);
    expect(Array.from(database.objectStoreNames)).toEqual([
      'documentPages',
      'documents',
      'notes',
      'offlineMetadata',
      'preferences',
    ]);
    expect(Array.from(database.transaction('notes').store.indexNames)).toEqual([
      'by-document',
      'by-page',
      'by-updated',
    ]);
    database.close();
  });

  it('normalizes stable page identities without merging documents', () => {
    expect(pageIdentity('html', '/elements/../forms?mode=trial#name')).toBe('html:forms');
    expect(pageIdentity('css', 'forms')).toBe('css:forms');
    expect(pageIdentity('html', 'forms/')).toBe('html:forms');
  });

  it('seeds the bundled document and page metadata idempotently', async () => {
    const database = await openZealDatabase(databaseName);
    await seedStarterDocuments(database);
    await seedStarterDocuments(database);

    expect(await database.count('documents')).toBe(5);
    expect(await database.count('documentPages')).toBe(15);
    database.close();
  });

  it('inserts and updates one Unicode note per page', async () => {
    const repository = createNotesRepository(await openZealDatabase(databaseName));
    const first = await repository.save(page, 'First note: café');
    const updated = await repository.save(page, 'Updated note: Привет');

    expect(updated.id).toBe(first.id);
    expect(updated.createdAt).toBe(first.createdAt);
    expect(await repository.load(page)).toMatchObject({ content: 'Updated note: Привет' });
    expect(await repository.count()).toBe(1);
    repository.close();
  });

  it('searches title, document, path, and content, newest first', async () => {
    const repository = createNotesRepository(await openZealDatabase(databaseName));
    await repository.save(page, 'Listen for click events');
    await repository.save({ ...page, documentId: 'git', documentTitle: 'Git', pagePath: 'commits', pageTitle: 'Create commits' }, 'Record a snapshot');

    expect((await repository.search('CLICK')).map((note) => note.documentId)).toEqual(['javascript']);
    expect((await repository.search('git')).map((note) => note.documentId)).toEqual(['git']);
    expect(await repository.search('missing')).toEqual([]);
    expect(await repository.search('')).toHaveLength(2);
    repository.close();
  });

  it('deletes notes without affecting another page', async () => {
    const repository = createNotesRepository(await openZealDatabase(databaseName));
    const first = await repository.save(page, 'Keep the other note');
    await repository.save({ ...page, pagePath: 'syntax', pageTitle: 'Syntax' }, 'Second note');
    await repository.remove(first.id);

    expect(await repository.load(page)).toBeUndefined();
    expect(await repository.count()).toBe(1);
    repository.close();
  });
});
