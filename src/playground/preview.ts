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

function encodePayload(source: PlaygroundSource): string {
  const bytes = new TextEncoder().encode(JSON.stringify(source));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function createPreviewDocument(source: PlaygroundSource, channel: string): string {
  const payload = encodePayload(source);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'">
  <title>ZealRN Web preview</title>
</head>
<body>
  <div id="playground-root"></div>
  <script>
    (() => {
      const channel = ${JSON.stringify(channel)};
      const post = (level, values, line, source) => parent.postMessage({ channel, type: 'console', level, message: values.map((value) => {
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value); } catch { return String(value); }
      }).join(' '), line, source }, '*');
      for (const level of ['log', 'info', 'warn', 'error']) {
        const original = console[level];
        console[level] = (...values) => { post(level, values); original.apply(console, values); };
      }
      addEventListener('error', (event) => post('error', [event.message], event.lineno, event.filename));
      addEventListener('unhandledrejection', (event) => post('error', ['Unhandled promise rejection:', event.reason]));
      const bytes = Uint8Array.from(atob(${JSON.stringify(payload)}), (character) => character.charCodeAt(0));
      const source = JSON.parse(new TextDecoder().decode(bytes));
      document.querySelector('#playground-root').innerHTML = source.html;
      const style = document.createElement('style');
      style.textContent = source.css;
      document.head.append(style);
      const script = document.createElement('script');
      script.textContent = source.javascript + '\\n//# sourceURL=zealrn-playground.js';
      document.body.append(script);
    })();
  </script>
</body>
</html>`;
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
