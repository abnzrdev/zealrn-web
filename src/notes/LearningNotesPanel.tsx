import { Download, NotebookTabs, Quote, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { appendSelection } from './note-utils';
import {
  getNotesRepository,
  pageIdentity,
  type LearningNote,
  type NotePage,
  type NotesRepository,
} from './storage';

type SaveStatus = 'New note' | 'Unsaved' | 'Saving…' | 'Saved' | 'Failed';

interface Draft {
  identity: string;
  page: NotePage;
  content: string;
  dirty: boolean;
}

interface LearningNotesPanelProps {
  page: NotePage;
  onOpenAllNotes: () => void;
  repository?: NotesRepository;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function LearningNotesPanel({ page, onOpenAllNotes, repository: suppliedRepository, mobileOpen = false, onCloseMobile }: LearningNotesPanelProps) {
  const [repository, setRepository] = useState(suppliedRepository);
  const [note, setNote] = useState<LearningNote>();
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>('New note');
  const [loading, setLoading] = useState(true);
  const activeIdentity = useRef('');
  const draft = useRef<Draft | undefined>(undefined);
  const autosaveTimer = useRef<number | undefined>(undefined);
  const currentPage = useMemo<NotePage>(() => ({ ...page }), [page.documentId, page.documentTitle, page.pagePath, page.pageTitle]);
  const identity = pageIdentity(currentPage.documentId, currentPage.pagePath);

  useEffect(() => {
    if (suppliedRepository) {
      setRepository(suppliedRepository);
      return;
    }
    let active = true;
    void getNotesRepository().then((value) => active && setRepository(value));
    return () => { active = false; };
  }, [suppliedRepository]);

  const persist = useCallback(async (snapshot: Draft) => {
    if (!repository || !snapshot.dirty) return;
    if (activeIdentity.current === snapshot.identity) setStatus('Saving…');
    try {
      const saved = await repository.save(snapshot.page, snapshot.content);
      snapshot.dirty = false;
      if (activeIdentity.current === snapshot.identity) {
        setNote(saved);
        setStatus('Saved');
      }
    } catch {
      if (activeIdentity.current === snapshot.identity) setStatus('Failed');
    }
  }, [repository]);

  useEffect(() => {
    if (!repository) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    const previous = draft.current;
    activeIdentity.current = identity;
    if (previous?.dirty && previous.identity !== identity) void persist(previous);

    let current = true;
    setLoading(true);
    setContent('');
    setNote(undefined);
    setStatus('New note');
    void repository.load(currentPage).then((saved) => {
      if (!current || activeIdentity.current !== identity) return;
      const nextContent = saved?.content ?? '';
      setNote(saved);
      setContent(nextContent);
      setStatus(saved ? 'Saved' : 'New note');
      setLoading(false);
      draft.current = { identity, page: currentPage, content: nextContent, dirty: false };
    }).catch(() => {
      if (!current || activeIdentity.current !== identity) return;
      setStatus('Failed');
      setLoading(false);
      draft.current = { identity, page: currentPage, content: '', dirty: false };
    });
    return () => { current = false; };
  }, [currentPage, identity, persist, repository]);

  useEffect(() => () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    if (draft.current?.dirty) void repository?.save(draft.current.page, draft.current.content);
  }, [repository]);

  const changeContent = (nextContent: string) => {
    setContent(nextContent);
    setStatus('Unsaved');
    const snapshot: Draft = { identity, page: currentPage, content: nextContent, dirty: true };
    draft.current = snapshot;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => void persist(snapshot), 1_000);
  };

  const saveNow = () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    if (draft.current) void persist(draft.current);
  };

  const addSelection = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    if (!selection || selection.isCollapsed || !element?.closest('[data-document-reader]')) return;
    changeContent(appendSelection(content, selection.toString()));
  };

  const deleteNote = async () => {
    if (!note || !window.confirm('Delete this note? This cannot be undone.')) return;
    await repository?.remove(note.id);
    setNote(undefined);
    setContent('');
    setStatus('New note');
    draft.current = { identity, page: currentPage, content: '', dirty: false };
  };

  return (
    <aside className={mobileOpen ? 'notes-pane learning-notes mobile-open' : 'notes-pane learning-notes'} aria-label="Learning Notes">
      <div className="pane-heading"><span>Learning Notes</span><button className="icon-button notes-close" type="button" aria-label="Close Learning Notes" onClick={onCloseMobile}><X /></button><span className={`save-status status-${status.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`}>{status}</span></div>
      <div className="note-context"><strong>{currentPage.documentTitle}</strong><span>{currentPage.pageTitle}</span><code>{currentPage.pagePath}</code></div>
      <div className="notes-actions" aria-label="Note actions">
        <button type="button" onClick={saveNow} disabled={loading || status === 'Saving…'}><Save aria-hidden="true" /> Save</button>
        <button type="button" onClick={addSelection} disabled={loading}><Quote aria-hidden="true" /> Add Selection</button>
        <button type="button" onClick={onOpenAllNotes}><NotebookTabs aria-hidden="true" /> All Notes</button>
        <button type="button" disabled title="Note export is added in the backup phase"><Download aria-hidden="true" /> Export</button>
        <button className="danger-action" type="button" onClick={() => void deleteNote()} disabled={!note}><Trash2 aria-hidden="true" /><span className="sr-only">Delete note</span></button>
      </div>
      <textarea
        aria-label="Note for current page"
        value={content}
        disabled={loading}
        placeholder="Write what you learned from this page…"
        onChange={(event) => changeContent(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveNow();
          }
        }}
      />
      <p className="notes-local-copy">Stored only in this browser. Export backups before clearing site data.</p>
    </aside>
  );
}
