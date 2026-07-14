export function formatSelection(selection: string): string {
  const text = selection.trim();
  if (!text) return '';
  return text.split('\n').map((line) => `> ${line.trimEnd()}`).join('\n');
}

export function appendSelection(content: string, selection: string): string {
  const quote = formatSelection(selection);
  if (!quote || content.trimEnd().endsWith(quote)) return content;
  return content.trimEnd() ? `${content.trimEnd()}\n\n${quote}` : quote;
}
