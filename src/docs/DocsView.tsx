import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Library as LibraryIcon, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { documents, findPage, searchPages } from './library';
import type { DocumentGuide, DocumentPage } from './types';

interface DocsViewProps {
  documentId: string;
  pagePath: string;
  onNavigate: (documentId: string, pagePath: string) => void;
  notesPanel?: React.ReactNode;
}

interface ReaderProps {
  document: DocumentGuide;
  page: DocumentPage;
  onNavigate: (documentId: string, pagePath: string) => void;
  onOpenLibrary: () => void;
}

function Reader({ document, page, onNavigate, onOpenLibrary }: ReaderProps) {
  const [copied, setCopied] = useState<string>();
  const pageIndex = document.pages.findIndex((candidate) => candidate.pagePath === page.pagePath);
  const previous = document.pages[pageIndex - 1];
  const next = document.pages[pageIndex + 1];

  const copyCode = async (source: string, key: string) => {
    await navigator.clipboard.writeText(source);
    setCopied(key);
    window.setTimeout(() => setCopied(undefined), 1_500);
  };

  return (
    <main className="reader-pane" id="main-content">
      <article className="document-page" data-document-reader>
        <button className="secondary-button mobile-library-trigger" type="button" onClick={onOpenLibrary}>
          <LibraryIcon aria-hidden="true" /> Library
        </button>
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
                <pre><code>{section.code.source}</code></pre>
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
    </main>
  );
}

export function DocsView({ documentId, pagePath, onNavigate, notesPanel }: DocsViewProps) {
  const [query, setQuery] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const document = documents.find((candidate) => candidate.id === documentId) ?? documents[0]!;
  const page = findPage(document.id, pagePath) ?? document.pages[0]!;
  const results = useMemo(() => searchPages(query), [query]);

  const choosePage = (nextDocumentId: string, nextPath: string) => {
    onNavigate(nextDocumentId, nextPath);
    setLibraryOpen(false);
  };

  return (
    <div className="docs-layout">
      <aside className={libraryOpen ? 'library-pane mobile-open' : 'library-pane'} aria-label="Starter library">
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
      </aside>
      <Reader document={document} page={page} onNavigate={onNavigate} onOpenLibrary={() => setLibraryOpen(true)} />
      {notesPanel ?? (
        <aside className="notes-pane" aria-label="Learning Notes">
          <div className="pane-heading"><span>Learning Notes</span><span className="status-dot">New note</span></div>
          <div className="note-context"><strong>{document.title}</strong><span>{page.title}</span><code>{page.pagePath}</code></div>
          <textarea aria-label="Note for current page" placeholder="Write what you learned from this page…" />
          <button className="primary-button" type="button" disabled>Save note</button>
        </aside>
      )}
    </div>
  );
}
