export interface CodeExample {
  language: string;
  source: string;
}

export interface DocumentSection {
  heading: string;
  paragraphs: string[];
  code?: CodeExample;
  points?: string[];
}

export interface DocumentPage {
  pagePath: string;
  title: string;
  summary: string;
  sections: DocumentSection[];
}

export interface DocumentGuide {
  id: string;
  title: string;
  shortLabel: string;
  version: string;
  sourceUrl: string;
  license: 'CC-BY-4.0';
  attribution: string;
  pages: DocumentPage[];
}

export interface DocumentManifestEntry {
  documentId: string;
  title: string;
  version: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  buildTimestamp: string;
  contentHash: string;
}

export interface PageSearchResult extends DocumentPage {
  documentId: string;
  documentTitle: string;
}
