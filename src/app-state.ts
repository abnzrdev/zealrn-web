export type ThemePreference = 'system' | 'light' | 'dark';
export type View = 'docs' | 'notes' | 'playground' | 'storage' | 'settings' | 'desktop';

export type Route =
  | { view: 'docs'; documentId: string; pagePath: string }
  | { view: Exclude<View, 'docs'> };

const defaultRoute: Route = { view: 'docs', documentId: 'html', pagePath: 'introduction' };
const views = new Set<View>(['notes', 'playground', 'storage', 'settings', 'desktop']);

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'docs' && parts[1] && parts[2]) {
    return { view: 'docs', documentId: parts[1], pagePath: parts.slice(2).join('/') };
  }
  if (parts[0] && views.has(parts[0] as View)) {
    return { view: parts[0] as Exclude<View, 'docs'> };
  }
  return defaultRoute;
}

export function hashFor(route: Route): string {
  if (route.view !== 'docs') return `#/${route.view}`;
  return `#/docs/${encodeURIComponent(route.documentId)}/${route.pagePath.split('/').map(encodeURIComponent).join('/')}`;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}
