import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AllNotesView } from './AllNotesView';
import type { LearningNote, NotesRepository } from './storage';

const note: LearningNote = {
  id: 'note-1',
  documentId: 'git',
  documentTitle: 'Git',
  pageIdentity: 'git:commits',
  pagePath: 'commits',
  pageTitle: 'Create commits',
  content: 'A commit records a snapshot.',
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T11:00:00.000Z',
};

function repository(): NotesRepository {
  return {
    load: vi.fn(async () => note),
    save: vi.fn(async (page, content) => ({ ...note, ...page, content })),
    search: vi.fn(async (query) => query.toLowerCase().includes('missing') ? [] : [note]),
    remove: vi.fn(async () => undefined),
    count: vi.fn(async () => 1),
    close: vi.fn(),
  };
}

describe('AllNotesView', () => {
  it('lists, edits, and reopens a source page', async () => {
    const notes = repository();
    const openPage = vi.fn();
    render(<AllNotesView repository={notes} onOpenPage={openPage} />);

    fireEvent.click(await screen.findByRole('button', { name: /Create commits/ }));
    const editor = screen.getByLabelText('Selected note content');
    fireEvent.change(editor, { target: { value: 'Updated snapshot note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(notes.save).toHaveBeenCalledWith(expect.objectContaining({ documentId: 'git', pagePath: 'commits' }), 'Updated snapshot note'));

    fireEvent.click(screen.getByRole('button', { name: 'Open documentation' }));
    expect(openPage).toHaveBeenCalledWith('git', 'commits');
  });

  it('shows a clear empty search state', async () => {
    render(<AllNotesView repository={repository()} onOpenPage={() => undefined} />);
    fireEvent.change(screen.getByLabelText('Search notes'), { target: { value: 'missing' } });
    expect(await screen.findByText('No notes match your search.')).toBeInTheDocument();
  });
});
