import { describe, expect, it } from 'vitest';

import { appendSelection, formatSelection } from './note-utils';

describe('documentation selection capture', () => {
  it('formats multiline Unicode text as a Markdown blockquote', () => {
    expect(formatSelection('  café\nsecond line  ')).toBe('> café\n> second line');
  });

  it('adds a separated quote to existing note content', () => {
    expect(appendSelection('Remember this.', 'Selected text')).toBe('Remember this.\n\n> Selected text');
  });

  it('rejects an immediate duplicate capture', () => {
    const content = 'Remember this.\n\n> Selected text';
    expect(appendSelection(content, 'Selected text')).toBe(content);
  });

  it('ignores an empty selection', () => {
    expect(appendSelection('Existing', '   ')).toBe('Existing');
  });
});
