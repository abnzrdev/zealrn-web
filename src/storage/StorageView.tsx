import { Archive, Database, Download, FileUp, HardDrive, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { documents } from '../docs/library';
import { createJsonBackup, createNotesZip, downloadFile, MAX_IMPORT_BYTES, parseNotesImport, planNotesImport, type ImportPlan } from '../notes/backup';
import { getNotesRepository, resetApplicationDatabase, type LearningNote, type NotesRepository } from '../notes/storage';

interface StorageStats {
  usage?: number;
  quota?: number;
  persistent: boolean;
  notes: number;
  caches: number;
}

function formatBytes(value?: number): string {
  if (value === undefined) return 'Unavailable';
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

export function StorageView({ repository: suppliedRepository }: { repository?: NotesRepository }) {
  const [repository, setRepository] = useState<NotesRepository | undefined>(suppliedRepository);
  const [stats, setStats] = useState<StorageStats>({ persistent: false, notes: 0, caches: 0 });
  const [message, setMessage] = useState('');
  const [pendingNotes, setPendingNotes] = useState<LearningNote[]>([]);
  const [importPlan, setImportPlan] = useState<ImportPlan>();
  const [replaceConflicts, setReplaceConflicts] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (notesRepository: NotesRepository) => {
    const estimate = await navigator.storage?.estimate?.();
    const persistent = await navigator.storage?.persisted?.() ?? false;
    const cacheNames = 'caches' in window ? await caches.keys() : [];
    setStats({ usage: estimate?.usage, quota: estimate?.quota, persistent, notes: await notesRepository.count(), caches: cacheNames.length });
  }, []);

  useEffect(() => {
    if (suppliedRepository) {
      setRepository(suppliedRepository);
      void refresh(suppliedRepository);
      return;
    }
    let active = true;
    void getNotesRepository().then((value) => {
      if (!active) return;
      setRepository(value);
      void refresh(value);
    });
    return () => { active = false; };
  }, [refresh, suppliedRepository]);

  const allNotes = () => repository?.search('') ?? Promise.resolve([]);
  const exportJson = async () => downloadFile(`${JSON.stringify(createJsonBackup(await allNotes()), null, 2)}\n`, 'zealrn-web-notes-backup.json', 'application/json');
  const exportZip = async () => downloadFile(createNotesZip(await allNotes()), 'zealrn-web-notes.zip', 'application/zip');

  const chooseImport = async (file?: File) => {
    if (!file || !repository) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('The notes backup is too large.');
      const incoming = parseNotesImport(await file.text());
      const plan = planNotesImport(incoming, await repository.search(''));
      setPendingNotes(incoming);
      setImportPlan(plan);
      setReplaceConflicts(false);
      setMessage('Review the import summary before continuing.');
    } catch (error) {
      setImportPlan(undefined);
      setMessage(error instanceof Error ? error.message : 'Could not read this backup.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const applyImport = async () => {
    if (!repository || !importPlan) return;
    const selected = [...importPlan.newNotes, ...(replaceConflicts ? importPlan.conflicts : [])];
    try {
      for (const note of selected) await repository.save(note, note.content);
      setMessage(`Imported ${selected.length} notes. ${replaceConflicts ? 0 : importPlan.conflicts.length} conflicts skipped.`);
      setImportPlan(undefined);
      setPendingNotes([]);
      await refresh(repository);
    } catch {
      setMessage('Import stopped because browser storage could not save a note. Existing notes were not deleted.');
    }
  };

  const requestPersistence = async () => {
    const granted = await navigator.storage?.persist?.() ?? false;
    setMessage(granted ? 'Persistent storage is enabled.' : 'The browser did not grant persistent storage. Backups are still recommended.');
    if (repository) await refresh(repository);
  };

  const clearCache = async () => {
    if (!window.confirm('Clear cached application files? Your notes will not be deleted.')) return;
    if ('caches' in window) await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
    setMessage('Application caches cleared. Reload while online to prepare offline use again.');
    if (repository) await refresh(repository);
  };

  const resetAll = async () => {
    if (!window.confirm('Reset all ZealRN Web browser data? This deletes every note and preference. Export a backup first.')) return;
    if ('caches' in window) await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
    await resetApplicationDatabase();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <main className="storage-view" id="main-content">
      <header className="view-heading"><div><p className="eyebrow">Local-first by design</p><h1>Offline Storage</h1></div><span className={stats.persistent ? 'storage-badge persistent' : 'storage-badge'}><ShieldCheck aria-hidden="true" /> {stats.persistent ? 'Persistent storage' : 'Best-effort storage'}</span></header>
      <div className="storage-metrics">
        <article><HardDrive aria-hidden="true" /><span>Used</span><strong>{formatBytes(stats.usage)}</strong><small>of {formatBytes(stats.quota)}</small></article>
        <article><Database aria-hidden="true" /><span>Learning notes</span><strong>{stats.notes}</strong><small>IndexedDB schema v1</small></article>
        <article><Archive aria-hidden="true" /><span>Starter guides</span><strong>{documents.length}</strong><small>Bundled for offline use</small></article>
        <article><Download aria-hidden="true" /><span>Application caches</span><strong>{stats.caches}</strong><small>ZealRN Web 0.1.0</small></article>
      </div>
      <div className="storage-sections">
        <section>
          <h2>Protect your notes</h2><p>Browser site data can be cleared by you, the browser, or device cleanup. Export backups regularly.</p>
          <div className="storage-actions"><button className="primary-button" type="button" onClick={() => void exportJson()}><Download /> Export JSON backup</button><button className="secondary-button" type="button" onClick={() => void exportZip()}><Archive /> Export Markdown ZIP</button></div>
          <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><FileUp /> Import notes</button>
          <input className="sr-only" ref={fileInput} type="file" aria-label="Import notes backup" accept="application/json,.json" onChange={(event) => void chooseImport(event.target.files?.[0])} />
          {importPlan && <div className="import-review" role="status"><h3>Import review</h3><dl><div><dt>Total notes</dt><dd>{pendingNotes.length}</dd></div><div><dt>New notes</dt><dd>{importPlan.newNotes.length}</dd></div><div><dt>Conflicts</dt><dd>{importPlan.conflicts.length}</dd></div><div><dt>Invalid entries</dt><dd>0</dd></div><div><dt>Skipped entries</dt><dd>{replaceConflicts ? 0 : importPlan.conflicts.length}</dd></div></dl>{importPlan.conflicts.length > 0 && <label><input type="checkbox" checked={replaceConflicts} onChange={(event) => setReplaceConflicts(event.target.checked)} /> Replace conflicting page notes</label>}<button className="primary-button" type="button" onClick={() => void applyImport()}>Import reviewed notes</button></div>}
        </section>
        <section>
          <h2>Offline application</h2><p>The five starter guides ship with the application shell. They cannot be removed individually in this trial.</p>
          <div className="bundled-docs">{documents.map((document) => <span key={document.id}>{document.shortLabel} {document.title}<small>Built in</small></span>)}</div>
          <div className="storage-actions"><button className="secondary-button" type="button" onClick={() => void requestPersistence()}><ShieldCheck /> Request persistent storage</button><button className="secondary-button" type="button" onClick={() => void clearCache()}><Trash2 /> Clear application cache</button></div>
        </section>
        <section className="danger-zone">
          <h2>Reset browser data</h2><p>This removes notes, preferences, and cached application files from this browser. Export a backup first. It does not affect ZealRN Desktop.</p>
          <button className="secondary-button danger-action" type="button" onClick={() => void resetAll()}><Trash2 /> Reset all browser data</button>
        </section>
      </div>
      <p className="storage-message" role="status">{message}</p>
    </main>
  );
}
