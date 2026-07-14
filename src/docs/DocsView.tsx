import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Copy,
  Library as LibraryIcon,
  Maximize2,
  Minimize2,
  NotebookPen,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';

import { LearningNotesPanel } from '../notes/LearningNotesPanel';
import { setPreference } from '../notes/storage';
import {
  DEFAULT_NOTES_WIDTH,
  MIN_NOTES_WIDTH,
  normalizeNotesWidth,
  readNotesLayout,
  writeNotesCollapsed,
  writeNotesWidth,
} from './layout-preferences';
import { documents, findPage, searchPages } from './library';
import type { DocumentGuide, DocumentPage } from './types';

interface DocsViewProps {
  documentId: string;
  pagePath: string;
  onNavigate: (documentId: string, pagePath: string) => void;
  onOpenAllNotes: () => void;
}

interface ReaderProps {
  document: DocumentGuide;
  page: DocumentPage;
  focusMode: boolean;
  onNavigate: (documentId: string, pagePath: string) => void;
  onOpenLibrary: () => void;
  onOpenNotes: () => void;
  onToggleFocus: () => void;
}

function Reader({ document, page, focusMode, onNavigate, onOpenLibrary, onOpenNotes, onToggleFocus }: ReaderProps) {
  const [copied, setCopied] = useState<string>();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const reader = useRef<HTMLElement>(null);
  const pageIndex = document.pages.findIndex((candidate) => candidate.pagePath === page.pagePath);
  const previous = document.pages[pageIndex - 1];
  const next = document.pages[pageIndex + 1];
  const scrollKey = `zealrn-web:reader-scroll:${document.id}:${page.pagePath}`;

  useLayoutEffect(() => {
    const saved = Number(sessionStorage.getItem(scrollKey));
    const scrollTop = Number.isFinite(saved) && saved > 0 ? saved : 0;
    if (reader.current) reader.current.scrollTop = scrollTop;
    setShowScrollTop(scrollTop > 360);
  }, [scrollKey]);

  const copyCode = async (source: string, key: string) => {
    await navigator.clipboard.writeText(source);
    setCopied(key);
    window.setTimeout(() => setCopied(undefined), 1_500);
  };

  return (
    <main
      className="reader-pane"
      id="main-content"
      ref={reader}
      onScroll={(event) => {
        const scrollTop = event.currentTarget.scrollTop;
        sessionStorage.setItem(scrollKey, String(scrollTop));
        setShowScrollTop(scrollTop > 360);
      }}
    >
      <article className="document-page" data-document-reader>
        <div className="reader-tools">
          <div className="mobile-reader-actions">
            <button className="secondary-button mobile-library-trigger" type="button" onClick={onOpenLibrary}><LibraryIcon aria-hidden="true" /> Library</button>
            <button className="secondary-button mobile-notes-trigger" type="button" onClick={onOpenNotes}><NotebookPen aria-hidden="true" /> Notes</button>
          </div>
          <button className="secondary-button focus-reading-trigger" type="button" aria-pressed={focusMode} onClick={onToggleFocus}>
            {focusMode ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            {focusMode ? 'Exit Focus Mode' : 'Focus Reading'}
          </button>
        </div>
        <p className="breadcrumb">{document.title} / {page.title}</p>
        <h1>{page.title}</h1>
        <p className="lede">{page.summary}</p>
        {page.sections.map((section, sectionIndex) => (
          <section className="guide-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
            {section.code && (
              <div className="code-block">
                <div className="code-toolbar">
                  <span>{section.code.language}</span>
                  <button type="button" onClick={() => void copyCode(section.code!.source, `${sectionIndex}`)}>
                    {copied === `${sectionIndex}` ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {copied === `${sectionIndex}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre tabIndex={0} aria-label={`${section.code.language} code example`}><code>{section.code.source}</code></pre>
              </div>
            )}
          </section>
        ))}
        <aside className="source-note">
          <strong>Source and license</strong>
          <p>{document.attribution} This original guide is licensed under CC BY 4.0.</p>
          <a href={document.sourceUrl} target="_blank" rel="noreferrer">Open the official reference</a>
        </aside>
        <nav className="page-navigation" aria-label="Guide pages">
          {previous ? <button type="button" onClick={() => onNavigate(document.id, previous.pagePath)}><ArrowLeft /> <span><small>Previous</small>{previous.title}</span></button> : <span />}
          {next && <button type="button" onClick={() => onNavigate(document.id, next.pagePath)}><span><small>Next</small>{next.title}</span> <ArrowRight /></button>}
        </nav>
      </article>
      {showScrollTop && (
        <button
          className="reader-scroll-top icon-button"
          type="button"
          aria-label="Scroll documentation to top"
          onClick={() => reader.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
        >
          <ArrowUp aria-hidden="true" />
        </button>
      )}
    </main>
  );
}

interface ResizeHandleProps {
  container: RefObject<HTMLDivElement | null>;
  width: number;
  onResize: (width: number) => void;
  onCommit: (width: number) => void;
}

function NotesResizeHandle({ container, width, onResize, onCommit }: ResizeHandleProps) {
  const drag = useRef<{ x: number; width: number; latest: number } | undefined>(undefined);
  const maximum = () => Math.max(MIN_NOTES_WIDTH, Math.floor((container.current?.clientWidth ?? 1_024) * 0.48));
  const fit = (nextWidth: number) => Math.min(maximum(), normalizeNotesWidth(nextWidth));

  return (
    <div
      className="notes-resize-handle"
      role="separator"
      tabIndex={0}
      aria-label="Resize Learning Notes"
      aria-orientation="vertical"
      aria-valuemin={MIN_NOTES_WIDTH}
      aria-valuemax={maximum()}
      aria-valuenow={Math.round(fit(width))}
      onDoubleClick={() => {
        onResize(DEFAULT_NOTES_WIDTH);
        onCommit(DEFAULT_NOTES_WIDTH);
      }}
      onKeyDown={(event) => {
        let next: number;
        const step = event.shiftKey ? 48 : 16;
        if (event.key === 'ArrowLeft') next = fit(width + step);
        else if (event.key === 'ArrowRight') next = fit(width - step);
        else if (event.key === 'Home') next = MIN_NOTES_WIDTH;
        else if (event.key === 'End') next = maximum();
        else return;
        event.preventDefault();
        onResize(next);
        onCommit(next);
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, width, latest: width };
      }}
      onPointerMove={(event) => {
        if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const next = fit(drag.current.width + drag.current.x - event.clientX);
        drag.current.latest = next;
        onResize(next);
      }}
      onPointerUp={(event) => {
        if (!drag.current) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        onCommit(drag.current.latest);
        drag.current = undefined;
      }}
      onPointerCancel={() => { drag.current = undefined; }}
    />
  );
}

export function DocsView({ documentId, pagePath, onNavigate, onOpenAllNotes }: DocsViewProps) {
  const [query, setQuery] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesLayout, setNotesLayout] = useState(readNotesLayout);
  const [focusMode, setFocusMode] = useState(() => sessionStorage.getItem('zealrn-web:focus-mode') === 'true');
  const layout = useRef<HTMLDivElement>(null);
  const document = documents.find((candidate) => candidate.id === documentId) ?? documents[0]!;
  const page = findPage(document.id, pagePath) ?? document.pages[0]!;
  const results = useMemo(() => searchPages(query), [query]);

  useEffect(() => {
    sessionStorage.setItem('zealrn-web:focus-mode', String(focusMode));
  }, [focusMode]);

  useEffect(() => {
    const exitFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusMode) setFocusMode(false);
    };
    window.addEventListener('keydown', exitFocus);
    return () => window.removeEventListener('keydown', exitFocus);
  }, [focusMode]);

  const choosePage = (nextDocumentId: string, nextPath: string) => {
    onNavigate(nextDocumentId, nextPath);
    setLibraryOpen(false);
  };

  const commitWidth = (width: number) => {
    writeNotesWidth(width);
    void setPreference('layout.notesWidth', width);
  };

  const toggleNotes = () => {
    const collapsed = !notesLayout.collapsed;
    setNotesLayout((current) => ({ ...current, collapsed }));
    writeNotesCollapsed(collapsed);
    void setPreference('layout.notesCollapsed', collapsed);
  };

  return (
    <div
      className={`docs-layout${notesLayout.collapsed ? ' notes-collapsed' : ''}${focusMode ? ' focus-mode' : ''}`}
      ref={layout}
      style={{ '--notes-width': `${notesLayout.width}px` } as CSSProperties}
    >
      <aside className={libraryOpen ? 'library-pane mobile-open' : 'library-pane'} aria-label="Starter library">
        <div className="library-header">
          <div className="pane-heading">
            <span>Library</span>
            <button className="icon-button library-close" type="button" aria-label="Close library" onClick={() => setLibraryOpen(false)}><X /></button>
            <span className="count">{documents.length} guides</span>
          </div>
          <label className="library-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search starter documentation</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides" />
          </label>
        </div>
        <div className="library-scroll">
          {query ? (
            <div className="search-results" aria-live="polite">
              <p className="result-count">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
              {results.map((result) => (
                <button key={`${result.documentId}:${result.pagePath}`} type="button" onClick={() => choosePage(result.documentId, result.pagePath)}>
                  <strong>{result.title}</strong><span>{result.documentTitle}</span>
                </button>
              ))}
              {results.length === 0 && <p className="empty-copy">No matching pages.</p>}
            </div>
          ) : documents.map((guide) => (
            <div className="guide-group" key={guide.id}>
              <button className={guide.id === document.id ? 'library-item active' : 'library-item'} type="button" onClick={() => choosePage(guide.id, guide.pages[0]!.pagePath)}>
                <span className="doc-mark">{guide.shortLabel}</span><span>{guide.title}</span>
              </button>
              {guide.id === document.id && (
                <div className="page-list">
                  {guide.pages.map((guidePage) => (
                    <button className={guidePage.pagePath === page.pagePath ? 'active' : ''} key={guidePage.pagePath} type="button" onClick={() => choosePage(guide.id, guidePage.pagePath)}>
                      {guidePage.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="library-note"><BookOpen aria-hidden="true" /> ZealRN Web contains a small starter library. ZealRN Desktop supports the full downloadable docset catalog.</p>
        </div>
      </aside>
      <Reader
        document={document}
        page={page}
        focusMode={focusMode}
        onNavigate={onNavigate}
        onOpenLibrary={() => { setFocusMode(false); setLibraryOpen(true); }}
        onOpenNotes={() => { setFocusMode(false); setNotesOpen(true); }}
        onToggleFocus={() => setFocusMode((current) => !current)}
      />
      <NotesResizeHandle
        container={layout}
        width={notesLayout.width}
        onResize={(width) => setNotesLayout((current) => ({ ...current, width }))}
        onCommit={commitWidth}
      />
      <LearningNotesPanel
        page={{ documentId: document.id, documentTitle: document.title, pagePath: page.pagePath, pageTitle: page.title }}
        onOpenAllNotes={onOpenAllNotes}
        mobileOpen={notesOpen}
        onCloseMobile={() => setNotesOpen(false)}
        collapsed={notesLayout.collapsed}
        onToggleCollapsed={toggleNotes}
      />
    </div>
  );
}
