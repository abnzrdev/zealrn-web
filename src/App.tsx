import {
  BookOpen,
  Code2,
  Download,
  HardDrive,
  Menu,
  NotebookTabs,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { hashFor, parseHash, resolveTheme, type Route, type ThemePreference, type View } from './app-state';
import { DocsView } from './docs/DocsView';
import { AllNotesView } from './notes/AllNotesView';

const navigation: Array<{ view: View; label: string; icon: typeof BookOpen }> = [
  { view: 'docs', label: 'Docs', icon: BookOpen },
  { view: 'notes', label: 'All Notes', icon: NotebookTabs },
  { view: 'playground', label: 'Web Playground', icon: Code2 },
  { view: 'storage', label: 'Offline Storage', icon: HardDrive },
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
  { view: 'desktop', label: 'Get Desktop', icon: Download },
];

function navigate(route: Route) {
  window.location.hash = hashFor(route);
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="placeholder-view" aria-labelledby="placeholder-title">
      <p className="eyebrow">ZealRN Web trial</p>
      <h1 id="placeholder-title">{title}</h1>
      <p>{text}</p>
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem('zealrn-web:intro') !== 'seen');
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const value = localStorage.getItem('zealrn-web:theme');
    return value === 'light' || value === 'dark' ? value : 'system';
  });
  const systemDark = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) navigate(route);
    return () => window.removeEventListener('hashchange', onHash);
  }, [route]);

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme', resolveTheme(theme, systemDark.matches));
    apply();
    systemDark.addEventListener('change', apply);
    localStorage.setItem('zealrn-web:theme', theme);
    return () => systemDark.removeEventListener('change', apply);
  }, [systemDark, theme]);

  useEffect(() => {
    const setConnected = () => setOnline(navigator.onLine);
    window.addEventListener('online', setConnected);
    window.addEventListener('offline', setConnected);
    return () => {
      window.removeEventListener('online', setConnected);
      window.removeEventListener('offline', setConnected);
    };
  }, []);

  const activeView = route.view;
  const selectView = (view: View) => {
    navigate(view === 'docs' ? { view: 'docs', documentId: 'html', pagePath: 'introduction' } : { view });
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <button className="icon-button menu-button" type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
          <Menu aria-hidden="true" />
        </button>
        <button className="brand" type="button" onClick={() => selectView('docs')} aria-label="ZealRN Web home">
          <img src={`${import.meta.env.BASE_URL}icons/zealrn-web.svg`} alt="" />
          <span>ZealRN <b>Web</b></span>
          <small>Trial</small>
        </button>
        <nav className={menuOpen ? 'topnav open' : 'topnav'} aria-label="Primary navigation">
          <div className="mobile-nav-heading">
            <strong>Navigate</strong>
            <button className="icon-button" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X /></button>
          </div>
          {navigation.map(({ view, label, icon: Icon }) => (
            <button className={activeView === view ? 'nav-button active' : 'nav-button'} key={view} type="button" onClick={() => selectView(view)}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className={online ? 'connection online' : 'connection offline'} role="status">
          {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
          <span>{online ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {route.view === 'docs' && <DocsView documentId={route.documentId} pagePath={route.pagePath} onNavigate={(documentId, pagePath) => navigate({ view: 'docs', documentId, pagePath })} onOpenAllNotes={() => selectView('notes')} />}
      {activeView === 'notes' && <AllNotesView onOpenPage={(documentId, pagePath) => navigate({ view: 'docs', documentId, pagePath })} />}
      {activeView === 'playground' && <Placeholder title="Web Playground" text="Experiment with local HTML, CSS, and JavaScript in an isolated preview." />}
      {activeView === 'storage' && <Placeholder title="Offline Storage" text="Review cached guides, note backups, and browser storage protection." />}
      {activeView === 'settings' && (
        <section className="settings-view" id="main-content">
          <p className="eyebrow">Preferences</p><h1>Settings</h1>
          <label htmlFor="appearance">Appearance</label>
          <select id="appearance" value={theme} onChange={(event) => setTheme(event.target.value as ThemePreference)}>
            <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </section>
      )}
      {activeView === 'desktop' && (
        <section className="desktop-view" id="main-content">
          <p className="eyebrow">The complete offline workspace</p>
          <h1>Get ZealRN Desktop</h1>
          <p>Desktop adds the full docset catalog, large offline libraries, native SQLite storage, Linux and Windows packages, and external-terminal integration.</p>
          <div className="callout"><strong>Desktop alpha download coming soon.</strong><span>Follow development on GitHub.</span></div>
          <a className="primary-button link-button" href="https://github.com/abnzrdev/zealrn" rel="noreferrer">View ZealRN Desktop</a>
        </section>
      )}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 5).map(({ view, label, icon: Icon }) => (
          <button className={activeView === view ? 'active' : ''} key={view} type="button" onClick={() => selectView(view)}>
            <Icon aria-hidden="true" /><span>{label === 'Web Playground' ? 'Playground' : label}</span>
          </button>
        ))}
      </nav>

      {showIntro && (
        <div className="dialog-backdrop" role="presentation">
          <section className="intro-dialog" role="dialog" aria-modal="true" aria-labelledby="intro-title">
            <img src={`${import.meta.env.BASE_URL}icons/zealrn-web.svg`} alt="" />
            <p className="eyebrow">Free browser trial</p>
            <h1 id="intro-title">Learn documentation your way</h1>
            <p>Read compact starter guides, attach notes to pages, and test web code. After the first complete visit, the app can work offline.</p>
            <ul><li>No account or analytics</li><li>Notes stay in this browser</li><li>Export backups before clearing site data</li></ul>
            <button className="primary-button" type="button" autoFocus onClick={() => { localStorage.setItem('zealrn-web:intro', 'seen'); setShowIntro(false); }}>
              Start learning
            </button>
            <button className="text-button" type="button" onClick={() => selectView('desktop')}>Compare with Desktop</button>
          </section>
        </div>
      )}
    </div>
  );
}
