export const DEFAULT_NOTES_WIDTH = 304;
export const MIN_NOTES_WIDTH = 280;

const widthKey = 'zealrn-web:notes-width';
const collapsedKey = 'zealrn-web:notes-collapsed';

export function normalizeNotesWidth(value: number) {
  return Number.isFinite(value) ? Math.max(MIN_NOTES_WIDTH, Math.round(value)) : DEFAULT_NOTES_WIDTH;
}

export function readNotesLayout(storage: Storage = localStorage) {
  const storedWidth = Number(storage.getItem(widthKey));
  const storedCollapsed = storage.getItem(collapsedKey);
  return {
    width: storage.getItem(widthKey) === null ? DEFAULT_NOTES_WIDTH : normalizeNotesWidth(storedWidth),
    collapsed: storedCollapsed === 'true',
  };
}

export function writeNotesWidth(width: number, storage: Storage = localStorage) {
  storage.setItem(widthKey, String(normalizeNotesWidth(width)));
}

export function writeNotesCollapsed(collapsed: boolean, storage: Storage = localStorage) {
  storage.setItem(collapsedKey, String(collapsed));
}
