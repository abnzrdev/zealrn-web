import { ArrowUpRight, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getNotesRepository, type LearningNote, type NotesRepository } from './storage';

interface AllNotesViewProps {
  onOpenPage: (documentId: string, pagePath: string) => void;
  repository?: NotesRepository;
}

export function AllNotesView({ onOpenPage, repository: suppliedRepository }: AllNotesViewProps) {
  const [repository, setRepository] = useState(suppliedRepository);
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [selected, setSelected] = useState<LearningNote>();
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('Loading notes…');

  useEffect(() => {
    if (suppliedRepository) {
      setRepository(suppliedRepository);
      return;
    }
    let active = true;
    void getNotesRepository().then((value) => active && setRepository(value));
    return () => { active = false; };
  }, [suppliedRepository]);

  useEffect(() => {
    if (!repository) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void repository.search(query).then((results) => {
        if (!active) return;
        setNotes(results);
        setMessage(results.length === 0 ? (query ? 'No notes match your search.' : 'No notes yet. Open a guide and write what you learn.') : '');
        setSelected((current) => {
          const next = results.find((note) => note.id === current?.id) ?? results[0];
          setContent(next?.content ?? '');
          return next;
        });
      }).catch(() => active && setMessage('Could not load notes from browser storage.'));
    }, query ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, repository]);

  const choose = (note: LearningNote) => {
    setSelected(note);
    setContent(note.content);
  };

  const save = async () => {
    if (!selected || !repository) return;
    try {
      const saved = await repository.save(selected, content);
      setSelected(saved);
      setNotes((current) => current.map((note) => note.id === saved.id ? saved : note));
      setMessage('Saved');
    } catch {
      setMessage('Save failed. Your edited text is still here.');
    }
  };

  const remove = async () => {
    if (!selected || !repository || !window.confirm(`Delete the note for “${selected.pageTitle}”?`)) return;
    try {
      await repository.remove(selected.id);
      const remaining = notes.filter((note) => note.id !== selected.id);
      setNotes(remaining);
      setSelected(remaining[0]);
      setContent(remaining[0]?.content ?? '');
      setMessage(remaining.length ? '' : 'No notes yet. Open a guide and write what you learn.');
    } catch {
      setMessage('Could not delete the note.');
    }
  };

  return (
    <main className="all-notes-view" id="main-content">
      <header className="view-heading">
        <div><p className="eyebrow">Your local learning archive</p><h1>All Notes</h1></div>
        <label className="notes-search"><Search aria-hidden="true" /><span className="sr-only">Search notes</span><input aria-label="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, guide, path, or content" /></label>
      </header>
      <div className="all-notes-layout">
        <section className="notes-list" aria-label="Saved notes">
          <div className="pane-heading"><span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span><span>Newest first</span></div>
          {notes.map((note) => (
            <button className={selected?.id === note.id ? 'note-list-item active' : 'note-list-item'} type="button" key={note.id} onClick={() => choose(note)}>
              <strong>{note.pageTitle}</strong><span>{note.documentTitle} · {note.pagePath}</span><p>{note.content.slice(0, 120) || 'Empty note'}</p><time>{new Date(note.updatedAt).toLocaleString()}</time>
            </button>
          ))}
          {notes.length === 0 && <p className="empty-copy">{message}</p>}
        </section>
        <section className="note-detail" aria-label="Selected note">
          {selected ? (
            <>
              <div className="note-detail-heading"><div><p className="breadcrumb">{selected.documentTitle} / {selected.pagePath}</p><h2>{selected.pageTitle}</h2></div><button className="secondary-button" type="button" onClick={() => onOpenPage(selected.documentId, selected.pagePath)}><ArrowUpRight aria-hidden="true" /> Open documentation</button></div>
              <textarea aria-label="Selected note content" value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); } }} />
              <div className="note-detail-actions"><button className="primary-button" type="button" onClick={() => void save()}><Save aria-hidden="true" /> Save changes</button><button className="secondary-button danger-action" type="button" onClick={() => void remove()}><Trash2 aria-hidden="true" /> Delete</button><span role="status">{message}</span></div>
            </>
          ) : <div className="empty-detail"><strong>Select a note</strong><p>Choose a saved note to read or edit it.</p></div>}
        </section>
      </div>
    </main>
  );
}
