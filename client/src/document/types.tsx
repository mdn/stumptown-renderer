export interface Source {
  folder: string;
  github_url: string;
  last_commit_url: string;
  filename: string;
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

export interface HeadingLinksFlaw extends GenericFlaw {
  html: string;
  before: string | null;
  line: number | null;
  column: number | null;
}

export interface UnsafeHTMLFlaw extends GenericFlaw {
  html: string;
  line: number | null;
  column: number | null;
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

export interface TranslationDifferenceFlaw extends GenericFlaw {
  difference: {
    explanation: string;
    type: string;
    name: string;
    explanationNotes: string[];
  };
}

type Flaws = {
  broken_links: BrokenLink[];
  macros: MacroErrorMessage[];
  bad_bcd_queries: BadBCDQueryFlaw[];
  bad_bcd_links: BadBCDLinkFlaw[];
  images: ImageReferenceFlaw[];
  bad_pre_tags: BadPreTagFlaw[];
  sectioning: SectioningFlaw[];
  image_widths: ImageWidthFlaw[];
  heading_links: HeadingLinksFlaw[];
  translation_differences: TranslationDifferenceFlaw[];
  unsafe_html: UnsafeHTMLFlaw[];
};

export type Translation = {
  locale: string;
  native: string;
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
  locale: string;
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
  isActive: boolean;
  popularity: number;
  popularityRanking?: number;
}
