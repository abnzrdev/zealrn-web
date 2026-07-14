import { Download, Play, RotateCcw, Trash2 } from 'lucide-react';
import { strToU8, zipSync } from 'fflate';
import { useEffect, useRef, useState } from 'react';

import { CodeEditor, type EditorLanguage } from './CodeEditor';
import {
  appendConsoleEntry,
  createPreviewDocument,
  projectFiles,
  type ConsoleEntry,
  type PlaygroundSource,
} from './preview';

export const starterSource: PlaygroundSource = {
  html: `<div class="card">
  <h1>Hello ZealRN</h1>
  <p>Edit the code and click Run.</p>
  <button id="hello">Click me</button>
</div>`,
  css: `body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
}

.card {
  max-width: 32rem;
  padding: 2rem;
  border: 1px solid #8884;
  border-radius: 0.75rem;
}`,
  javascript: `document.querySelector("#hello").addEventListener("click", () => {
  console.log("Hello from ZealRN");
});`,
};

const editorTabs: Array<{ id: EditorLanguage; label: string }> = [
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'javascript', label: 'JavaScript' },
];

function downloadProject(source: PlaygroundSource) {
  const files = projectFiles(source);
  const archive = zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, strToU8(value)])));
  const blob = new Blob([archive], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'zealrn-web-project.zip';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WebPlayground() {
  const [source, setSource] = useState(starterSource);
  const [activeEditor, setActiveEditor] = useState<EditorLanguage>('html');
  const [outputTab, setOutputTab] = useState<'preview' | 'console'>('preview');
  const [autoRun, setAutoRun] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [channel, setChannel] = useState('');
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const iframe = useRef<HTMLIFrameElement>(null);
  const messageId = useRef(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const run = () => {
    const nextChannel = crypto.randomUUID();
    setConsoleEntries([]);
    setChannel(nextChannel);
    setPreview(createPreviewDocument(source, nextChannel));
    setOutputTab('preview');
  };

  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setTimeout(run, 600);
    return () => window.clearTimeout(timer);
  }, [autoRun, source.html, source.css, source.javascript]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.channel !== channel || event.data?.type !== 'console') return;
      const level = ['log', 'info', 'warn', 'error'].includes(event.data.level) ? event.data.level : 'log';
      const entry: ConsoleEntry = {
        id: messageId.current++,
        level,
        message: String(event.data.message ?? ''),
        timestamp: new Date().toLocaleTimeString(),
        line: Number.isFinite(event.data.line) ? event.data.line : undefined,
        source: typeof event.data.source === 'string' ? event.data.source.split('/').at(-1) : undefined,
      };
      setConsoleEntries((current) => appendConsoleEntry(current, entry));
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [channel]);

  const updateSource = (language: EditorLanguage, value: string) => setSource((current) => ({ ...current, [language]: value }));
  const changed = source.html !== starterSource.html || source.css !== starterSource.css || source.javascript !== starterSource.javascript;

  const reset = () => {
    if (changed && !window.confirm('Reset all editors to the starter example?')) return;
    setSource(starterSource);
    setPreview(undefined);
    setConsoleEntries([]);
  };

  return (
    <main className="playground-view" id="main-content">
      <header className="playground-heading">
        <div><p className="eyebrow">Offline browser lab</p><h1>Web Playground</h1></div>
        <div className="playground-controls">
          <button className="primary-button" type="button" onClick={run}><Play aria-hidden="true" /> Run</button>
          <label className="auto-run"><input type="checkbox" checked={autoRun} onChange={(event) => setAutoRun(event.target.checked)} /> Auto Run</label>
          <button className="secondary-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Reset</button>
          <button className="secondary-button" type="button" onClick={() => downloadProject(source)}><Download aria-hidden="true" /> Export Project</button>
        </div>
      </header>
      <p className="security-warning">Code runs locally in an isolated browser preview. Do not run untrusted code.</p>
      <div className="playground-layout">
        <section className="editor-workspace" aria-label="Code editors">
          <div className="workspace-tabs" role="tablist" aria-label="Editor language">
            {editorTabs.map((tab) => <button role="tab" aria-selected={activeEditor === tab.id} className={activeEditor === tab.id ? 'active' : ''} type="button" key={tab.id} onClick={() => setActiveEditor(tab.id)}>{tab.label}</button>)}
          </div>
          {editorTabs.map((tab) => <div className={activeEditor === tab.id ? 'editor-panel active' : 'editor-panel'} role="tabpanel" key={tab.id}><CodeEditor label={`${tab.label} editor`} language={tab.id} value={source[tab.id]} theme={theme} onChange={(value) => updateSource(tab.id, value)} /></div>)}
        </section>
        <section className="output-workspace" aria-label="Playground output">
          <div className="workspace-tabs output-tabs" role="tablist" aria-label="Output view">
            <button role="tab" aria-selected={outputTab === 'preview'} className={outputTab === 'preview' ? 'active' : ''} type="button" onClick={() => setOutputTab('preview')}>Preview</button>
            <button role="tab" aria-selected={outputTab === 'console'} className={outputTab === 'console' ? 'active' : ''} type="button" onClick={() => setOutputTab('console')}>Console <span>{consoleEntries.length}</span></button>
            <button className="clear-console" type="button" onClick={() => setConsoleEntries([])}><Trash2 aria-hidden="true" /> Clear Console</button>
          </div>
          <div className={outputTab === 'preview' ? 'output-panel active' : 'output-panel'} role="tabpanel">
            {preview ? <iframe ref={iframe} title="Playground preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview} /> : <div className="preview-empty"><Play aria-hidden="true" /><strong>Ready to run</strong><span>Edit the example, then click Run.</span></div>}
          </div>
          <div className={outputTab === 'console' ? 'output-panel active' : 'output-panel'} role="tabpanel">
            <div className="console-output" role="log" aria-label="JavaScript console">
              {consoleEntries.map((entry) => <div className={`console-entry ${entry.level}`} key={entry.id}><time>{entry.timestamp}</time><strong>{entry.level}</strong><span>{entry.message}</span>{entry.line && <small>{entry.source ?? 'playground'}:{entry.line}</small>}</div>)}
              {consoleEntries.length === 0 && <p>No console messages.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
