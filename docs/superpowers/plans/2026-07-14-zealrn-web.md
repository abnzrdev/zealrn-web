# ZealRN Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the static, offline-capable ZealRN Web trial with starter documentation, local page-linked notes, and an isolated web playground.

**Architecture:** A hash-addressed React SPA reads bundled original guides and seeds them into versioned IndexedDB. Feature modules isolate documentation, notes, playground, and PWA/storage behavior; `vite-plugin-pwa` generates the service worker and GitHub Actions deploys only static build output.

**Tech Stack:** React 19.2.7, TypeScript 6.0.3, Vite 8.1.4, CodeMirror 6, idb 8.0.3, fflate 0.8.3, Vitest 4.1.10, Playwright 1.61.1.

## Global Constraints

- Production base path is exactly `/zealrn-web/`.
- No backend, CDN, analytics, accounts, cookies, secrets, terminal, shell, compiler, Python runtime, or package execution.
- Starter documentation is original CC BY 4.0 content with official source links.
- Application code is GPL-3.0-or-later and preserves Zeal/ZealRN attribution.
- Notes stay in browser IndexedDB and are never silently overwritten or deleted.
- The playground iframe has no same-origin capability and blocks external network access with CSP.

---

### Task 1: Initialize The Static Application

**Files:** Create `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `public/icons/*`, `LICENSE`, `.gitignore`.

**Interfaces:** Produces `View` navigation type, `ThemePreference`, global CSS tokens, and build/test scripts used by every later task.

- [ ] Pin dependencies and generate the lockfile with `npm install`.
- [ ] Configure Vite base `/zealrn-web/`, React, Vitest, and PWA manifest metadata.
- [ ] Add a responsive three-pane shell, hash navigation, mobile bottom navigation, first-run trial dialog, and theme preference.
- [ ] Write a theme/hash navigation test first, run it red, implement, then run it green.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
- [ ] Commit `chore: initialize zealrn web`.

### Task 2: Add The Starter Documentation Library

**Files:** Create `src/docs/types.ts`, `src/docs/library.ts`, `src/docs/search.ts`, `src/docs/Library.tsx`, `src/docs/Reader.tsx`, `src/docs/manifest.ts`, `CONTENT_LICENSE.md`, `public/attribution.json`.

**Interfaces:** Produces `DocumentGuide`, `DocumentPage`, `documents`, `findPage(documentId, pagePath)`, and `searchPages(query)`.

- [ ] Write failing tests for page lookup, search, navigation order, and manifest completeness.
- [ ] Author compact HTML, CSS, JavaScript, Git, and Python guides with original prose, runnable examples, official source URLs, license, attribution, fixed build timestamp, and generated content hashes.
- [ ] Render semantic document content, internal links, code copy buttons, previous/next controls, and the starter-library limitation.
- [ ] Run focused tests and production build.
- [ ] Commit `feat: add documentation trial`.

### Task 3: Add Versioned Browser Storage And Learning Notes

**Files:** Create `src/storage/db.ts`, `src/storage/notes.ts`, `src/storage/preferences.ts`, `src/notes/types.ts`, `src/notes/identity.ts`, `src/notes/selection.ts`, `src/notes/LearningNotes.tsx`, `src/notes/AllNotes.tsx`; tests beside modules.

**Interfaces:** Produces `openZealrnDb()`, `noteIdentity(documentId, pagePath)`, `saveNote`, `getNoteForPage`, `searchNotes`, `deleteNote`, and `formatSelection`.

- [ ] Write red tests with `fake-indexeddb` for schema version 1, seed migration, CRUD, one-note-per-page, Unicode, page switching, failed-save recovery, and search.
- [ ] Implement normalized identity that strips leading slash/query/fragment, collapses dot segments, and rejects traversal.
- [ ] Implement the page panel with 1,000 ms identity-bound autosave, Save, Ctrl+S, status live region, Delete confirmation, and failure retention.
- [ ] Implement reader-only selection capture as Markdown blockquotes with immediate duplicate rejection.
- [ ] Implement All Notes search/edit/delete/reopen behavior.
- [ ] Run focused tests and build.
- [ ] Commit `feat: add browser learning notes`.

### Task 4: Add The Isolated Web Playground

**Files:** Create `src/playground/CodeEditor.tsx`, `src/playground/compose.ts`, `src/playground/console.ts`, `src/playground/export.ts`, `src/playground/WebPlayground.tsx`; tests beside modules.

**Interfaces:** Produces `PlaygroundFiles`, `STARTER_FILES`, `composePreview(files, runId)`, `boundedConsole`, and `exportProjectZip`.

- [ ] Write red tests for Unicode, closing script/style tags, CSP, network blocking, run-ID validation, console cap 500, reset state, and ZIP entries.
- [ ] Create three independent CodeMirror 6 editors with history, search, line numbers, bracket matching, language support, and live theme compartments.
- [ ] Compose a base64-safe iframe document with `sandbox="allow-scripts"`, restrictive CSP, console/error forwarding, and no same-origin access.
- [ ] Add Run, 600 ms optional Auto Run, Reset, Clear Console, and project ZIP export.
- [ ] Run tests and build without `node_modules` runtime references.
- [ ] Commit `feat: add web playground`.

### Task 5: Add Backup, Import, Print, And Storage Management

**Files:** Create `src/notes/export.ts`, `src/notes/import.ts`, `src/notes/ImportDialog.tsx`, `src/storage/StorageView.tsx`, `src/pwa/storage.ts`; tests beside modules.

**Interfaces:** Produces versioned web backup types, desktop note adapter, import preview/conflict result, Markdown/JSON/ZIP downloads, and storage reset actions.

- [ ] Write red tests for Markdown, desktop-compatible JSON, all-notes ZIP, safe filenames, web/desktop imports, invalid entries, and conflict preview.
- [ ] Implement single-note Markdown/JSON/print and all-note JSON/ZIP exports.
- [ ] Implement import preview with explicit skip/replace conflict choice and no silent overwrite.
- [ ] Implement quota/persistence/cache/note/guide reporting and persistence request.
- [ ] Require explicit typed confirmation before reset and offer backup first.
- [ ] Commit `feat: add note backup and import`.

### Task 6: Complete PWA Lifecycle And Product Pages

**Files:** Create `src/pwa/usePwa.ts`, `src/components/Settings.tsx`, `src/components/GetDesktop.tsx`, `public/offline.html`; modify `vite.config.ts`, `src/App.tsx`, `src/styles.css`.

**Interfaces:** Produces install prompt, online state, update-ready state, reload action, and same-origin cache clearing.

- [ ] Add PWA registration and an update-ready reload banner.
- [ ] Precache app assets and starter guides, add navigation fallback, and exclude third-party runtime caching.
- [ ] Add offline status, install action when supported, System/Light/Dark settings, and Desktop trial comparison with “Desktop alpha download coming soon.”
- [ ] Verify service-worker updates do not touch IndexedDB.
- [ ] Commit `feat: add offline pwa support`.

### Task 7: Acceptance, Accessibility, And Documentation

**Files:** Create `playwright.config.ts`, `e2e/app.spec.ts`, `README.md`, `PRIVACY.md`, `THIRD_PARTY_LICENSES.md`; update test configuration.

**Interfaces:** Produces reproducible local checks and user/developer documentation.

- [ ] Add Playwright desktop/mobile flows for docs, persisted notes, selection, playground, backup import, offline reload, theme, iframe restrictions, and responsive navigation.
- [ ] Run Axe against primary Docs, Notes, Playground, Storage, Settings, and Desktop views with no serious/critical violations.
- [ ] Run an offline/PWA acceptance check for manifest, service-worker control, cached navigation, and installability signals.
- [ ] Document trial limits, browsers, local storage risk, privacy, PWA install, backup, development, build, deployment, licenses, and Desktop relationship.
- [ ] Run `npm ci`, lint, typecheck, unit tests, build, and Playwright.
- [ ] Commit `test: add pwa acceptance coverage`, then `docs: document zealrn web` if documentation review warrants a separate commit.

### Task 8: Deploy GitHub Pages

**Files:** Create `.github/workflows/pages.yml`.

**Interfaces:** Pushes `main` to `origin` and deploys only validated `dist/` to GitHub Pages.

- [ ] Configure official Pages actions with `contents: read`, `pages: write`, `id-token: write`, deployment concurrency, push/manual triggers, and no secrets.
- [ ] Run all local checks, review staged files explicitly, and confirm no browser data, archives, screenshots, videos, or secrets are staged.
- [ ] Commit `build: deploy to github pages` and push only `origin main`.
- [ ] Configure repository Pages build type to workflow, monitor the run, and fix actual failures.
- [ ] Verify the live URL online, then use Playwright offline mode after the first successful load.
