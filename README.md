# ZealRN Web

ZealRN Web is a free browser trial of [ZealRN Desktop](https://github.com/abnzrdev/zealrn):

**Read documentation → write page-linked notes → test HTML/CSS/JavaScript → work offline → export a backup.**

Live app: <https://abnzrdev.github.io/zealrn-web/>

## Trial scope

The web app includes five compact, original starter guides for HTML, CSS, JavaScript, Git, and Python basics. It stores notes in the current browser and provides an isolated HTML/CSS/JavaScript playground.

ZealRN Desktop adds the full downloadable docset catalog, large offline libraries, native SQLite and filesystem integration, Linux and Windows packages, and external-terminal integration. ZealRN Web does not provide a terminal, compilers, package execution, Python execution, accounts, sync, or a backend.

## Install and offline use

1. Open the live app once while online and wait for the “ready to use offline” notice.
2. Use the browser’s install button or **Settings → Install app** when available.
3. Reopen the installed app or website without a network connection.

The service worker caches the application shell, CodeMirror, icons, and all starter guides. IndexedDB notes are separate from service-worker caches and survive application updates. Browser storage is not a permanent backup: clearing site data can remove notes.

Supported targets are current Chromium, Firefox, and Safari releases. PWA installation behavior varies by browser and operating system. The automated acceptance suite runs on Chromium.

## Notes and backups

- One main note is stored per `documentId + normalized pagePath`.
- Notes autosave after one second; `Ctrl+S` saves immediately.
- **Add Selection** appends selected guide text as a Markdown blockquote.
- All Notes searches titles, guides, paths, and content.
- Individual notes export as Markdown, versioned JSON, or a print view suitable for browser “Save as PDF.”
- Offline Storage exports all notes as JSON or a ZIP of Markdown files plus `index.json`.
- Import supports ZealRN Web JSON backups and compatible single-note ZealRN Desktop JSON exports. Conflicts are reviewed before replacement.

## Privacy

ZealRN Web has no account, analytics, advertising, or note uploads. Notes remain in the browser unless the user exports them. GitHub Pages serves static application files and may retain standard infrastructure request logs under GitHub’s policies. See [docs/privacy.md](docs/privacy.md).

## Development

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
npm run dev
```

The development URL is normally <http://localhost:5173/zealrn-web/>.

Run all local checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Preview the production service worker build:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

## Deployment

Vite uses the production base path `/zealrn-web/`. Pushing `main` runs the GitHub Pages workflow, which installs locked dependencies, runs all checks, builds the static `dist/` directory, and deploys only that directory with GitHub’s official Pages actions. No deployment secret or backend is required.

## Documentation and licenses

The application is licensed under GPL-3.0; see [LICENSE](LICENSE). The starter learning guides are original ZealRN Web content under CC BY 4.0. Their source references, attribution, content hashes, and build timestamp are recorded in [CONTENT_LICENSE.md](CONTENT_LICENSE.md) and [public/attribution.json](public/attribution.json).

Third-party runtime notices are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). ZealRN Web is a separate browser project related to ZealRN Desktop and preserves attribution to the Zeal project from which the desktop application originated.
