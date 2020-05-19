export interface Source {
  github_url: string;
  folder: string;
}

export interface Doc {
  title: string;
  mdn_url: string;
  sidebarHTML: string;
  body: string;
  modified: string;
  flaws: object;
  other_translations?: object[];
  translation_of?: string;
  parents?: Doc[];
  source: Source;
  contributors: string[];
}
