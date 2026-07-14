import { Download, MonitorCog, ShieldCheck } from 'lucide-react';

import type { ThemePreference } from '../app-state';

interface SettingsViewProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function SettingsView({ theme, onThemeChange, canInstall, onInstall }: SettingsViewProps) {
  return (
    <main className="settings-view" id="main-content">
      <p className="eyebrow">Browser preferences</p><h1>Settings</h1>
      <section className="settings-section"><div><MonitorCog aria-hidden="true" /><h2>Appearance</h2><p>Follow your system or choose a fixed theme.</p></div><label htmlFor="appearance">Color scheme<select id="appearance" value={theme} onChange={(event) => onThemeChange(event.target.value as ThemePreference)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></section>
      <section className="settings-section"><div><Download aria-hidden="true" /><h2>Install app</h2><p>Install ZealRN Web from a supported browser for a standalone window and quick launch.</p></div><button className="secondary-button" type="button" disabled={!canInstall} onClick={onInstall}><Download aria-hidden="true" /> {canInstall ? 'Install ZealRN Web' : 'Use your browser install menu'}</button></section>
      <section className="settings-section privacy-copy"><div><ShieldCheck aria-hidden="true" /><h2>Privacy</h2></div><p>No account. No analytics. No note uploads. Notes stay in this browser unless you export them. Clearing site data may remove notes, so keep regular backups.</p></section>
    </main>
  );
}
