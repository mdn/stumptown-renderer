export interface Source {
  github_url: string;
  folder: string;
}

export interface Link {
  href: string;
  line: number;
  column: number;
  suggestion: string | null;
}

export interface BadBCDLink {
  slug: string;
  suggestion: string | null;
  query: string | null;
  key: string;
}

type Flaws = {
  broken_links: Link[];
  macros: MacroErrorMessage[];
  bad_bcd_queries: string[];
  bad_bcd_links: BadBCDLink[];
};

export interface Doc {
  title: string;
  mdn_url: string;
  sidebarHTML: string;
  body: string;
  modified: string;
  flaws: Flaws;
  other_translations?: object[];
  translation_of?: string;
  parents?: Doc[];
  source: Source;
  contributors: string[];
}

export interface MacroErrorMessage {
  name: string;
  error: {
    path?: string;
  };
  errorMessage: string;
  line: number;
  column: number;
  filepath: string;
  sourceContext: string;
  macroName: string;
}
