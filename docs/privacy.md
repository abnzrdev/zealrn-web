# ZealRN Web Privacy

ZealRN Web is a static, local-first browser application.

## Data that stays in the browser

- Page-linked learning notes
- Appearance preferences
- Offline application caches
- Bundled starter documentation metadata

The app does not create an account, use analytics, upload notes, or send note content to a server. The Web Playground runs inside a sandboxed, unique-origin iframe with a restrictive Content Security Policy. Its preview cannot access ZealRN Web IndexedDB data.

## Hosting

GitHub Pages serves the static HTML, CSS, JavaScript, images, and documentation assets. GitHub may process normal web request information according to its own privacy statement. ZealRN Web does not add cookies or third-party trackers.

## User responsibility

Browser site data can be removed by explicit browser cleanup, storage pressure, profile deletion, or device loss. Requesting persistent storage may reduce automatic eviction but is not a backup. Export JSON or ZIP backups regularly and store them somewhere you control.

Resetting browser data inside ZealRN Web requires confirmation and warns the user to export first. Clearing the application cache does not delete IndexedDB notes.
