export interface PlaygroundSource {
  html: string;
  css: string;
  javascript: string;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleEntry {
  id: number;
  level: ConsoleLevel;
  message: string;
  timestamp: string;
  line?: number;
  source?: string;
}

export function appendConsoleEntry(entries: ConsoleEntry[], entry: ConsoleEntry): ConsoleEntry[] {
  return [...entries, entry].slice(-500);
}

export function projectFiles(source: PlaygroundSource): Record<'index.html' | 'style.css' | 'script.js', string> {
  return {
    'index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ZealRN Web project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${source.html}
  <script src="script.js"></script>
</body>
</html>
`,
    'style.css': source.css,
    'script.js': source.javascript,
  };
}
