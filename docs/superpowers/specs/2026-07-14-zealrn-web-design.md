# ZealRN Web Design

## Product

ZealRN Web is a static, installable trial of ZealRN Desktop. It lets people read a small original starter library, keep page-linked notes locally, experiment with HTML/CSS/JavaScript, work offline after the first complete visit, and export their data. It does not imitate desktop-only capabilities such as the full docset catalog, large docset management, terminals, compilers, or native filesystem integration.

The first screen is the working documentation reader, not a marketing landing page. A compact first-run dialog explains local storage, offline setup, backup responsibility, and trial limits.

## Approaches Considered

1. **Recommended: static React SPA with IndexedDB and generated PWA assets.** A small state-based hash router avoids GitHub Pages deep-link failures. `idb` keeps IndexedDB transactions readable, `vite-plugin-pwa` precaches build output, and `fflate` creates browser-side ZIP exports. This is the smallest maintainable implementation that covers every required browser capability.
2. **Hand-written service worker and raw IndexedDB.** This saves dependencies but adds substantial lifecycle, transaction, and generated-asset bookkeeping. The extra code is harder to test and easier to break during upgrades.
3. **Backend-backed documentation and notes.** This would simplify cross-device data but directly violates the privacy, cost, authentication, and offline requirements.

The application does not mirror public documentation sites. Five compact guides are original ZealRN Web content with official source links and a CC BY 4.0 content license. Application code is GPL-3.0-or-later to remain compatible with the desktop project whose identity, starter example, and interaction model informed this work.

## Stack And Delivery

- React 19.2.7 and TypeScript 6.0.3
- Vite 8.1.4 with production base `/zealrn-web/`
- CodeMirror 6 packages pinned exactly in `package-lock.json`
- IndexedDB schema version 1 through `idb` 8.0.3
- `vite-plugin-pwa` 1.3.0 using Workbox-generated precaching
- Vitest 4.1.10 and Playwright 1.61.1
- Static GitHub Pages deployment from `dist/`

There is no runtime Node.js, CDN, API server, analytics, account, cookie, or secret.

## Application Structure

`App` owns only top-level navigation, current document/page, appearance, install/update prompts, and global status. Focused feature modules own data and behavior:

- `docs/`: immutable guide source, manifest, page search, and reader components.
- `storage/`: versioned IndexedDB opening, seed migration, notes CRUD/search, preferences, and metadata.
- `notes/`: page editor, autosave state machine, selection capture, all-notes view, and exports/imports.
- `playground/`: three CodeMirror views, sandboxed preview, console bridge, starter reset, and project ZIP.
- `pwa/`: service-worker registration, install prompt, online state, persistence request, and storage screen.

Navigation uses URL hashes such as `#/docs/html/structure` and `#/notes`. The stable note identity is `${documentId}:${normalizePagePath(pagePath)}`. Normalization removes query/fragment data, collapses `.` segments, rejects traversal, strips leading slashes, and preserves case.

## Interface

Desktop keeps the product layout:

`Library | Documentation Reader | Learning Notes`

The documentation pane is the flexible center. Library and Notes have restrained fixed widths and can be hidden on narrower screens. Mobile uses full-screen views with a five-item bottom navigation for Docs, Notes, Playground, Storage, and Settings. Get Desktop remains in the top overflow/menu.

The visual language reuses ZealRN's paper/ink surfaces, red accent, compact rules, serif document headings, sans-serif controls, and small radii. System, Light, and Dark are CSS-token modes. User playground output is never recolored.

All interactive controls have accessible names, visible focus, minimum mobile target sizes, keyboard behavior, and live regions for save/network/update status. Dialogs restore focus and support Escape.

## Starter Documentation

The bundled library contains original guides for HTML, CSS, JavaScript, Git, and Python basics. Each guide has three to four pages with explanations, examples, official links, previous/next navigation, and copy-code controls.

`manifest.ts` records document ID, title, version, official source URL, content license, attribution, build timestamp, and SHA-256 content hash. Build-time source is bundled and seeded into IndexedDB; the service worker precaches the resulting application chunks. Search is a case-insensitive in-memory scan over titles, summaries, headings, and plain text because the trial corpus is intentionally small.

## IndexedDB

Database: `zealrn-web`, schema version 1.

Stores:

- `notes`, key `id`, unique index `pageIdentity`, indexes `updatedAt` and `documentId`.
- `documents`, key `id`.
- `documentPages`, key `identity`, index `documentId`.
- `preferences`, key `key`.
- `offlineMetadata`, key `key`.

A note contains `id`, `documentId`, `documentTitle`, `pageKey`, `pagePath`, `pageTitle`, `content`, `createdAt`, and `updatedAt`. One note exists per page. Autosave waits 1,000 ms, captures the page identity with the queued content, and cancels before navigation. Explicit Save and Ctrl+S flush immediately. Failures retain editor text and expose retry.

Migrations run in the IndexedDB upgrade transaction. Failure blocks data-dependent screens with an actionable error and never resets the database automatically.

## Learning Notes

The right panel shows page context, status, Save, Add Selection, All Notes, Export, and Delete. Add Selection accepts only DOM selection inside the reader, converts lines to Markdown blockquotes, rejects an immediate exact duplicate, and never evaluates content.

All Notes searches title, document, path, and content, newest first. A selected result is editable and can reopen its source. Deletion always confirms.

Single-note exports are Markdown, desktop-compatible version-1 JSON, and a print view. All-notes export is a ZIP with `README.md`, `index.json`, and deterministic Markdown files. Import accepts the ZealRN Web backup or desktop single-note JSON, validates every field, previews new/conflict/invalid counts, and requires an explicit conflict strategy.

## Playground Isolation

Three CodeMirror instances preserve independent documents and history while tabs switch. Run writes a generated `srcdoc` to a sandboxed iframe with `sandbox="allow-scripts"` only. The document includes a restrictive CSP: no default network, connections, frames, forms, popups, or navigation; inline user CSS/script and data/blob images are the only required allowances.

User HTML, CSS, and JavaScript are base64-encoded before composition so closing tags, Unicode, quotes, and template literals cannot break the host shell. A bootstrap script decodes content, installs console/error forwarding through `postMessage`, then executes the JavaScript. The parent accepts messages only from the current iframe window and run ID. Console history is capped at 500 entries.

Auto Run is off by default and debounced 600 ms. Reset confirms only when content differs. Export creates a ZIP containing `index.html`, `style.css`, and `script.js`.

## Offline And Storage

The generated service worker precaches the application shell, local fonts/icons, CodeMirror chunks, and starter guides. Navigation falls back to the cached app entry. Runtime caching is same-origin only; third-party requests are never cached. New service-worker versions prompt the user to reload. Cache cleanup never touches IndexedDB.

The Storage screen reports `navigator.storage.estimate()`, persistence state, application version, guide count, and note count. Users can request persistence, clear application caches, export a backup, or reset browser data. Reset requires explicit typed confirmation and presents backup first. Persistence denial is non-fatal.

## Error Handling And Privacy

Network/offline, IndexedDB, clipboard, download, import, and service-worker failures appear as concise inline alerts or dialogs while preserving user input. The app makes no note upload requests and has no telemetry. The README warns that clearing browser/site data can remove notes and recommends regular exports.

## Testing And Deployment

Vitest covers pure identity, storage migrations/CRUD, autosave helpers, search, selection formatting, imports/exports, console limits, and theme persistence. Playwright covers desktop/mobile navigation, persistence after refresh, playground execution, iframe restrictions, offline reload, theme switching, and accessibility with Axe.

GitHub Actions runs install, lint, typecheck, unit tests, and production build before deploying only `dist/` with official Pages actions and minimum permissions. The live path is `https://abnzrdev.github.io/zealrn-web/`.

## Non-Goals

No full docset catalog, documentation scraper, remote sync, accounts, terminal, shell, Python execution, compilers, package managers, React/Vue/Angular user projects, PDF renderer, or native filesystem integration.
