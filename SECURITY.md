# Security Policy

## Supported versions

Security fixes are provided for the currently deployed ZealRN Web version and the current `main` branch.

## Reporting a vulnerability

Do not disclose an active vulnerability in a public issue. Use [GitHub private vulnerability reporting](https://github.com/abnzrdev/zealrn-web/security/advisories/new) with the affected browser/version, impact, and reproducible steps.

The project will validate the report, assess severity, coordinate a fix, and credit the reporter when requested. Please allow time for the corrected static site and service worker to deploy before public disclosure.

## Scope

In scope:

- the deployed ZealRN Web application and service worker;
- IndexedDB notes, backup import/export, and storage reset behavior;
- the sandboxed HTML/CSS/JavaScript playground;
- GitHub Pages deployment workflows and committed dependencies.

Out of scope:

- ZealRN Desktop and upstream Zeal, which have separate security policies;
- browser or GitHub Pages vulnerabilities not caused by this application;
- user code intentionally run in the isolated playground;
- denial-of-service reports without a product-specific flaw.

There is no bug bounty program. Do not test against systems or data you do not own or have permission to use.
