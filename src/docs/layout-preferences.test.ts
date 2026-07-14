import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_NOTES_WIDTH,
  MIN_NOTES_WIDTH,
  readNotesLayout,
  writeNotesCollapsed,
  writeNotesWidth,
} from './layout-preferences';

describe('documentation layout preferences', () => {
  beforeEach(() => localStorage.clear());

  it('uses safe defaults for missing or invalid values', () => {
    localStorage.setItem('zealrn-web:notes-width', 'not-a-number');
    localStorage.setItem('zealrn-web:notes-collapsed', 'invalid');

    expect(readNotesLayout()).toEqual({ width: DEFAULT_NOTES_WIDTH, collapsed: false });
  });

  it('persists a valid width and collapsed state', () => {
    writeNotesWidth(412);
    writeNotesCollapsed(true);

    expect(readNotesLayout()).toEqual({ width: 412, collapsed: true });
  });

  it('clamps a stored width to the desktop minimum', () => {
    writeNotesWidth(120);

    expect(readNotesLayout().width).toBe(MIN_NOTES_WIDTH);
  });
});
