export interface Document {
  mdn_url: string;
  modified: string;
  title: string;
  popularity: number;
  flaws: {
    [key: string]: string[];
  };
  normalizedMacrosCount: {
    [key: string]: number;
  };
}

export interface MacroInfo {
  sourceName: string;
  normalizedName: string;
  totalCount: number;
}

type Metadata = {
  tookSeconds: number;
  count: number;
};

export interface Data {
  documents: Document[];
  metadata: Metadata;
  allMacros: MacroInfo[];
}

export interface PastQuery {
  query: string;
  results: number;
}
