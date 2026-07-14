import type { DocumentGuide, DocumentManifestEntry, PageSearchResult } from './types';

export const documents: DocumentGuide[] = [
  {
    id: 'html', title: 'HTML', shortLabel: 'HT', version: '2026.1',
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML', license: 'CC-BY-4.0',
    attribution: 'Original ZealRN Web guide. Technical references link to MDN Web Docs.',
    pages: [
      {
        pagePath: 'introduction', title: 'HTML gives content structure',
        summary: 'Use semantic elements to describe the purpose and hierarchy of a page.',
        sections: [
          { heading: 'Start with meaning', paragraphs: ['HTML is the document layer of the web. Elements identify headings, paragraphs, navigation, controls, and regions so browsers and assistive technology can understand them.', 'Choose an element for what the content is, not for how it should look. CSS handles appearance later.'], code: { language: 'html', source: '<main>\n  <h1>Field notes</h1>\n  <p>One clear idea per paragraph.</p>\n</main>' } },
          { heading: 'A dependable document', paragraphs: ['Declare the language and character encoding early. A viewport declaration keeps the page usable on narrow screens.'], code: { language: 'html', source: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>Field notes</title>\n  </head>\n  <body></body>\n</html>' } },
        ],
      },
      {
        pagePath: 'semantics', title: 'Semantic regions and headings',
        summary: 'Build an outline with landmarks and a logical heading order.',
        sections: [
          { heading: 'Landmarks help navigation', paragraphs: ['Use header, nav, main, aside, and footer when those roles match the content. Most pages should have one main region.'], points: ['Keep heading levels in a logical order.', 'Give navigation groups an accessible label.', 'Use article for self-contained material.'] },
          { heading: 'Structure a learning page', paragraphs: ['A short article can carry its own heading and metadata while remaining inside the main page region.'], code: { language: 'html', source: '<main>\n  <article>\n    <h1>CSS Grid notes</h1>\n    <p>Updated <time datetime="2026-07-14">July 14</time></p>\n  </article>\n</main>' } },
        ],
      },
      {
        pagePath: 'forms', title: 'Forms that explain themselves',
        summary: 'Associate every control with a useful label and native input behavior.',
        sections: [
          { heading: 'Use native controls first', paragraphs: ['Native inputs provide keyboard, validation, and mobile behavior without reimplementing them. Labels increase the clickable area and give the control a name.'], code: { language: 'html', source: '<label for="topic">Topic</label>\n<input id="topic" name="topic" required>\n<button type="submit">Save</button>' } },
          { heading: 'Errors need context', paragraphs: ['Explain what went wrong next to the field, connect the message with aria-describedby, and move focus only when that helps recovery.'], points: ['Do not rely on color alone.', 'Keep entered values after validation fails.', 'Use button elements for commands.'] },
        ],
      },
    ],
  },
  {
    id: 'css', title: 'CSS', shortLabel: 'CS', version: '2026.1',
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS', license: 'CC-BY-4.0',
    attribution: 'Original ZealRN Web guide. Technical references link to MDN Web Docs.',
    pages: [
      {
        pagePath: 'cascade', title: 'The cascade chooses the winning rule',
        summary: 'Understand source order, specificity, inheritance, and reusable custom properties.',
        sections: [
          { heading: 'Prefer predictable selectors', paragraphs: ['A small class-based selector is easier to reuse and override than a deeply nested selector. Source order resolves ties after origin, importance, and specificity.'], code: { language: 'css', source: ':root { --accent: #b4322b; }\n\n.notice {\n  border-inline-start: 3px solid var(--accent);\n  padding: 1rem;\n}' } },
          { heading: 'Inheritance carries text styles', paragraphs: ['Text color and fonts commonly inherit. Layout properties usually do not. Use inherit, initial, or unset only when the normal behavior is not what you need.'] },
        ],
      },
      {
        pagePath: 'flexbox', title: 'Flexbox for one-dimensional layouts',
        summary: 'Distribute items along one primary axis while handling flexible space.',
        sections: [
          { heading: 'Choose the main axis', paragraphs: ['flex-direction establishes the main axis. justify-content works along that axis, while align-items works across it.'], code: { language: 'css', source: '.toolbar {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n\n.toolbar__status { margin-inline-start: auto; }' } },
          { heading: 'Let items shrink safely', paragraphs: ['Flexible children with long content may need min-width: 0 so they can shrink inside the container. Use wrapping when controls should move to another row.'], points: ['Use gap instead of child margins.', 'Avoid fixed widths for translated labels.', 'Test keyboard focus at narrow widths.'] },
        ],
      },
      {
        pagePath: 'grid', title: 'Grid for two-dimensional layout',
        summary: 'Define rows and columns together for page regions and repeated items.',
        sections: [
          { heading: 'Describe available space', paragraphs: ['fr units share remaining space. minmax prevents repeated columns from becoming unusably narrow.'], code: { language: 'css', source: '.library {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));\n  gap: 1rem;\n}' } },
          { heading: 'Keep reading order logical', paragraphs: ['Grid changes visual placement, not DOM order. Keep source order meaningful for keyboard and screen-reader users.'] },
        ],
      },
    ],
  },
  {
    id: 'javascript', title: 'JavaScript', shortLabel: 'JS', version: '2026.1',
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', license: 'CC-BY-4.0',
    attribution: 'Original ZealRN Web guide. Technical references link to MDN Web Docs.',
    pages: [
      {
        pagePath: 'values', title: 'Values, bindings, and decisions',
        summary: 'Use const by default, compare deliberately, and keep transformations small.',
        sections: [
          { heading: 'Bindings name values', paragraphs: ['const prevents reassignment of the binding, while let represents a value that must change. Objects bound with const can still contain mutable properties.'], code: { language: 'javascript', source: 'const topics = ["HTML", "CSS", "JavaScript"];\nconst visible = topics.filter((topic) => topic.includes("S"));\nconsole.log(visible);' } },
          { heading: 'Prefer explicit comparisons', paragraphs: ['Strict equality avoids implicit type conversion. Handle missing values intentionally with optional chaining and nullish coalescing.'] },
        ],
      },
      {
        pagePath: 'dom', title: 'Respond to the DOM',
        summary: 'Select elements, listen for events, and update the smallest necessary state.',
        sections: [
          { heading: 'Events connect behavior', paragraphs: ['Query the element once when possible, then attach a named or focused callback. Do not encode behavior in inline HTML attributes.'], code: { language: 'javascript', source: 'const button = document.querySelector("#hello");\nbutton?.addEventListener("click", () => {\n  document.querySelector("#message").textContent = "Hello from ZealRN";\n});' } },
          { heading: 'Treat text as text', paragraphs: ['Use textContent for user-provided text. Avoid assigning untrusted strings to innerHTML because markup can execute or alter the page.'] },
        ],
      },
      {
        pagePath: 'async', title: 'Asynchronous work without blocking',
        summary: 'Promises represent future results while async functions keep control flow readable.',
        sections: [
          { heading: 'Handle both outcomes', paragraphs: ['Await pauses only the async function, not the browser. Wrap expected failures so the interface can recover and preserve user input.'], code: { language: 'javascript', source: 'async function loadGuide(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(`HTTP ${response.status}`);\n    return await response.json();\n  } catch (error) {\n    console.error("Guide unavailable", error);\n    return null;\n  }\n}' } },
          { heading: 'Cancel stale work', paragraphs: ['When navigation starts a newer request, AbortController can stop an older fetch and prevent stale data from replacing the current page.'] },
        ],
      },
    ],
  },
  {
    id: 'git', title: 'Git', shortLabel: 'GI', version: '2026.1',
    sourceUrl: 'https://git-scm.com/docs', license: 'CC-BY-4.0',
    attribution: 'Original ZealRN Web guide. Command references link to the official Git documentation.',
    pages: [
      {
        pagePath: 'working-tree', title: 'Read the working tree before changing it',
        summary: 'Use status and diff to understand tracked, staged, and untracked work.',
        sections: [
          { heading: 'Start with evidence', paragraphs: ['git status summarizes the working tree and index. git diff shows unstaged changes; git diff --cached shows what the next commit would contain.'], code: { language: 'shell', source: 'git status --short\ngit diff\ngit diff --cached' } },
          { heading: 'Protect work you did not create', paragraphs: ['Do not discard unfamiliar changes. Identify ownership and intent before using restore, reset, or clean.'] },
        ],
      },
      {
        pagePath: 'commits', title: 'Commits record one coherent change',
        summary: 'Stage deliberately, inspect the patch, then write a message about behavior.',
        sections: [
          { heading: 'Make the boundary reviewable', paragraphs: ['A focused commit can be reverted or reviewed independently. Stage exact paths, inspect the cached diff, and commit only when tests pass.'], code: { language: 'shell', source: 'git add src/notes.ts src/notes.test.ts\ngit diff --cached --check\ngit commit -m "feat: save page-linked notes"' } },
          { heading: 'Messages explain intent', paragraphs: ['Use an imperative summary that says what changes for users or maintainers. The diff already shows the line-by-line mechanics.'] },
        ],
      },
      {
        pagePath: 'branches', title: 'Branches isolate a line of work',
        summary: 'Create a branch from a known base and integrate only after verification.',
        sections: [
          { heading: 'Know the base', paragraphs: ['Fetch the remote state, inspect the current branch, then create a named branch. Avoid rewriting shared history without agreement.'], code: { language: 'shell', source: 'git fetch origin\ngit switch main\ngit pull --ff-only\ngit switch -c feature/learning-notes' } },
          { heading: 'Publish intentionally', paragraphs: ['Confirm the destination remote before pushing. A fork should keep origin pointed to your repository and upstream pointed to the source project.'] },
        ],
      },
    ],
  },
  {
    id: 'python', title: 'Python basics', shortLabel: 'PY', version: '3.x / 2026.1',
    sourceUrl: 'https://docs.python.org/3/tutorial/', license: 'CC-BY-4.0',
    attribution: 'Original ZealRN Web guide. Language references link to the official Python tutorial.',
    pages: [
      {
        pagePath: 'values', title: 'Names, values, and collections',
        summary: 'Bind values to clear names and choose a collection for the operations you need.',
        sections: [
          { heading: 'Lists preserve order', paragraphs: ['Python names refer to objects. Lists are mutable ordered collections; tuples are immutable ordered collections; dictionaries map unique keys to values.'], code: { language: 'python', source: 'topics = ["html", "css", "javascript"]\nlengths = {topic: len(topic) for topic in topics}\nprint(lengths)' } },
          { heading: 'Iteration reads naturally', paragraphs: ['Iterate directly over values when you do not need an index. Use enumerate when the position is part of the result.'] },
        ],
      },
      {
        pagePath: 'functions', title: 'Functions package one idea',
        summary: 'Give inputs and outputs clear boundaries, with defaults only when they are unsurprising.',
        sections: [
          { heading: 'Return a result', paragraphs: ['A function should either return a useful value or perform a clear side effect. Type hints document intent but do not enforce types at runtime.'], code: { language: 'python', source: 'def page_key(document_id: str, path: str) -> str:\n    clean_path = path.strip("/")\n    return f"{document_id}:{clean_path}"\n\nprint(page_key("html", "/forms"))' } },
          { heading: 'Keep scope narrow', paragraphs: ['Small functions are easier to test. Pass dependencies as arguments rather than reading hidden global state.'] },
        ],
      },
      {
        pagePath: 'errors', title: 'Errors are part of the interface',
        summary: 'Catch exceptions where recovery is possible and preserve the original context.',
        sections: [
          { heading: 'Catch specific failures', paragraphs: ['A broad except can hide programming errors. Catch the exception you can handle and let unexpected failures remain visible.'], code: { language: 'python', source: 'from pathlib import Path\n\ndef read_note(path: Path) -> str:\n    try:\n        return path.read_text(encoding="utf-8")\n    except FileNotFoundError:\n        return ""' } },
          { heading: 'Clean up with context managers', paragraphs: ['The with statement closes files and releases resources even when an exception occurs.'] },
        ],
      },
    ],
  },
];

const hashes: Record<string, string> = {
  html: '4875da1b05782b159364a56d9051f68268ff427a6ea4aba843244d0d9480ae9a',
  css: 'a198f1a53def6fe1e1253e25e771791f0fcbe0a293c73cbe289c68ae19db4fc5',
  javascript: 'eaf199153ad507e4f4d7aac3a79fec3b0739cdf68883f990ca6e1e16442fa647',
  git: '7aefc08f088c1dcfcd97f8ebf2ef5e46b1acb0338d4f00412ccec65d7361f4e8',
  python: '1ce15906fae3b8839465a426323c49aa061042fbd14f396dbfa65c20b83a077b',
};

export function canonicalDocumentContent(document: DocumentGuide): string {
  return JSON.stringify(document.pages);
}

export const manifest: DocumentManifestEntry[] = documents.map((document) => ({
  documentId: document.id,
  title: document.title,
  version: document.version,
  sourceUrl: document.sourceUrl,
  license: document.license,
  attribution: document.attribution,
  buildTimestamp: '2026-07-14T00:00:00.000Z',
  contentHash: hashes[document.id] ?? '',
}));

export function findPage(documentId: string, pagePath: string) {
  return documents.find((document) => document.id === documentId)?.pages.find((page) => page.pagePath === pagePath);
}

export function searchPages(query: string): PageSearchResult[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return documents.flatMap((document) => document.pages
    .filter((page) => JSON.stringify(page).toLocaleLowerCase().includes(needle))
    .map((page) => ({ ...page, documentId: document.id, documentTitle: document.title })));
}
