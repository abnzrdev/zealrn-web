import { describe, expect, it } from 'vitest';

import { appendConsoleEntry, projectFiles, type ConsoleEntry } from './preview';

describe('playground preview', () => {
  it('creates a standalone three-file project', () => {
    const files = projectFiles({ html: '<main>Hello</main>', css: 'main { color: red; }', javascript: 'console.log("ready")' });
    expect(files['index.html']).toContain('<link rel="stylesheet" href="style.css">');
    expect(files['index.html']).toContain('<script src="script.js"></script>');
    expect(files['style.css']).toBe('main { color: red; }');
    expect(files['script.js']).toBe('console.log("ready")');
  });

  it('retains at most 500 console entries', () => {
    let entries: ConsoleEntry[] = [];
    for (let index = 0; index < 510; index += 1) {
      entries = appendConsoleEntry(entries, { id: index, level: 'log', message: `${index}`, timestamp: '12:00:00' });
    }
    expect(entries).toHaveLength(500);
    expect(entries[0]?.message).toBe('10');
  });
});
