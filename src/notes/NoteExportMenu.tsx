import { Download, FileJson, FileText, Printer } from 'lucide-react';

import { exportNoteJson, exportNoteMarkdown, printNote } from './backup';
import type { LearningNote } from './storage';

interface NoteExportMenuProps {
  note?: LearningNote;
}

export function NoteExportMenu({ note }: NoteExportMenuProps) {
  const print = () => {
    if (!note) return;
    try {
      printNote(note);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not open the print view.');
    }
  };

  return (
    <details className="export-menu">
      <summary aria-disabled={!note}><Download aria-hidden="true" /> Export</summary>
      <div>
        <button type="button" disabled={!note} onClick={() => note && exportNoteMarkdown(note)}><FileText aria-hidden="true" /> Markdown</button>
        <button type="button" disabled={!note} onClick={() => note && exportNoteJson(note)}><FileJson aria-hidden="true" /> JSON</button>
        <button type="button" disabled={!note} onClick={print}><Printer aria-hidden="true" /> Print / PDF</button>
      </div>
    </details>
  );
}
