import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LearningNotesPanel } from './LearningNotesPanel';
import type { LearningNote, NotePage, NotesRepository } from './storage';

const page: NotePage = {
  documentId: 'html',
  documentTitle: 'HTML',
  pagePath: 'introduction',
  pageTitle: 'Introduction',
};

function noteFor(currentPage: NotePage, content: string): LearningNote {
  return {
    ...currentPage,
    id: `${currentPage.documentId}-${currentPage.pagePath}`,
    pageIdentity: `${currentPage.documentId}:${currentPage.pagePath}`,
    content,
    createdAt: '2026-07-14T10:00:00.000Z',
    updatedAt: '2026-07-14T10:00:00.000Z',
  };
}

function repository(initial?: LearningNote): NotesRepository {
  return {
    load: vi.fn(async (currentPage) => initial?.pageIdentity === `${currentPage.documentId}:${currentPage.pagePath}` ? initial : undefined),
    save: vi.fn(async (currentPage, content) => noteFor(currentPage, content)),
    search: vi.fn(async () => []),
    remove: vi.fn(async () => undefined),
    count: vi.fn(async () => 0),
    close: vi.fn(),
  };
}

afterEach(() => vi.useRealTimers());

describe('LearningNotesPanel', () => {
  it('loads the current page note and saves edits after one second', async () => {
    vi.useFakeTimers();
    const notes = repository(noteFor(page, 'Existing note'));
    render(<LearningNotesPanel page={page} repository={notes} onOpenAllNotes={() => undefined} />);

    await act(async () => Promise.resolve());
    const editor = screen.getByLabelText('Note for current page');
    expect(editor).toHaveValue('Existing note');

    fireEvent.change(editor, { target: { value: 'Updated note' } });
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(notes.save).toHaveBeenCalledWith(page, 'Updated note');
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('keeps editor text and reports failure when saving fails', async () => {
    const notes = repository();
    vi.mocked(notes.save).mockRejectedValueOnce(new Error('storage unavailable'));
    render(<LearningNotesPanel page={page} repository={notes} onOpenAllNotes={() => undefined} />);
    await waitFor(() => expect(screen.getByLabelText('Note for current page')).toBeEnabled());

    fireEvent.change(screen.getByLabelText('Note for current page'), { target: { value: 'Do not lose this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Failed')).toBeInTheDocument());
    expect(screen.getByLabelText('Note for current page')).toHaveValue('Do not lose this');
  });

  it('flushes a dirty note before loading another page', async () => {
    const notes = repository();
    const { rerender } = render(<LearningNotesPanel page={page} repository={notes} onOpenAllNotes={() => undefined} />);
    await waitFor(() => expect(screen.getByLabelText('Note for current page')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Note for current page'), { target: { value: 'HTML note' } });

    const nextPage = { ...page, documentId: 'css', documentTitle: 'CSS', pagePath: 'selectors', pageTitle: 'Selectors' };
    rerender(<LearningNotesPanel page={nextPage} repository={notes} onOpenAllNotes={() => undefined} />);

    await waitFor(() => expect(notes.save).toHaveBeenCalledWith(page, 'HTML note'));
    expect(notes.load).toHaveBeenCalledWith(nextPage);
  });

  it('adds only text selected inside the documentation reader', async () => {
    const notes = repository();
    render(<><article data-document-reader><p>Selected café text</p></article><LearningNotesPanel page={page} repository={notes} onOpenAllNotes={() => undefined} /></>);
    await waitFor(() => expect(screen.getByLabelText('Note for current page')).toBeEnabled());

    const text = screen.getByText('Selected café text').firstChild!;
    const range = document.createRange();
    range.selectNodeContents(text);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    fireEvent.click(screen.getByRole('button', { name: 'Add Selection' }));

    expect(screen.getByLabelText('Note for current page')).toHaveValue('> Selected café text');
  });
});
