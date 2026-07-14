import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createJsonBackup } from '../notes/backup';
import type { LearningNote, NotesRepository } from '../notes/storage';
import { StorageView } from './StorageView';

const existing: LearningNote = {
  id: 'existing',
  documentId: 'html',
  documentTitle: 'HTML',
  pageIdentity: 'html:introduction',
  pagePath: 'introduction',
  pageTitle: 'Introduction',
  content: 'Existing note',
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T11:00:00.000Z',
};

function repository(): NotesRepository {
  return {
    load: vi.fn(async () => existing),
    save: vi.fn(async (page, content) => ({ ...existing, ...page, content })),
    search: vi.fn(async () => [existing]),
    remove: vi.fn(async () => undefined),
    count: vi.fn(async () => 1),
    close: vi.fn(),
  };
}

describe('StorageView', () => {
  it('reviews new notes and conflicts before importing', async () => {
    const notes = repository();
    render(<StorageView repository={notes} />);
    const incoming = [existing, { ...existing, id: 'new', documentId: 'css', documentTitle: 'CSS', pageIdentity: 'css:grid', pagePath: 'grid', pageTitle: 'Grid' }];
    const file = new File([JSON.stringify(createJsonBackup(incoming))], 'backup.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Import notes backup'), { target: { files: [file] } });

    await screen.findByRole('heading', { name: 'Import review' });
    expect(screen.getByText('New notes').nextSibling).toHaveTextContent('1');
    expect(screen.getByText('Conflicts').nextSibling).toHaveTextContent('1');
    expect(notes.save).not.toHaveBeenCalled();
  });

  it('requires confirmation before resetting browser data', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StorageView repository={repository()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset all browser data' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.stringContaining('deletes every note')));
    confirm.mockRestore();
  });
});
