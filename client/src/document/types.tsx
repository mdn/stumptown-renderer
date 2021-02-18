export interface Source {
  folder: string;
  github_url: string;
  last_commit_url: string;
}

export interface GenericFlaw {
  id: string;
  explanation: string;
  suggestion: string | null;
  fixable?: boolean;
  fixed?: true;
  externalImage?: boolean;
}

export interface BrokenLink extends GenericFlaw {
  href: string;
  line: number;
  column: number;
}

export interface BadBCDLinkFlaw extends GenericFlaw {
  slug: string;
  query: string | null;
  key: string;
}

export interface ImageReferenceFlaw extends GenericFlaw {
  src: string;
  line: number;
  column: number;
}

export interface ImageWidthFlaw extends GenericFlaw {
  style: string;
  line: number;
  column: number;
}

export interface BadBCDQueryFlaw extends GenericFlaw {}

export interface SectioningFlaw extends GenericFlaw {}

enum BadPreTagType {
  PreWithHTML = "pre_with_html",
}

export interface BadPreTagFlaw extends GenericFlaw {
  html: string;
  line?: number;
  column?: number;
  type: BadPreTagType;
}

export interface NotPrettierFlaw extends GenericFlaw {
  before: string;
  error?: string;
  line?: number;
  column?: number;
}

export interface MacroErrorMessage extends GenericFlaw {
  name: string;
  error: {
    path?: string;
  };
  errorStack: string;
  explanation: string;
  line: number;
  column: number;
  filepath: string;
  sourceContext: string;
  macroSource: string;
  macroName: string;
  fixed?: true;
}

type Flaws = {
  broken_links: BrokenLink[];
  macros: MacroErrorMessage[];
  bad_bcd_queries: BadBCDQueryFlaw[];
  bad_bcd_links: BadBCDLinkFlaw[];
  images: ImageReferenceFlaw[];
  bad_pre_tags: BadPreTagFlaw[];
  sectioning: SectioningFlaw[];
  not_prettier: NotPrettierFlaw[];
  image_widths: ImageWidthFlaw[];
};

export type Translation = {
  locale: string;
  url: string;
};

export type DocParent = {
  uri: string;
  title: string;
};

export type Toc = {
  id: string;
  text: string;
};

export interface Doc {
  title: string;
  pageTitle: string;
  mdn_url: string;
  sidebarHTML: string;
  toc: Toc[];
  body: string;
  modified: string;
  flaws: Flaws;
  other_translations?: Translation[];
  translation_of?: string;
  parents?: DocParent[];
  source: Source;
  contributors: string[];
  isArchive: boolean;
  isTranslated: boolean;
}
