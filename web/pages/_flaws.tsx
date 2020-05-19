import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSearchParams,
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";
import useSWR from "swr";

import "../client/flaws/index.scss";

import { humanizeFlawName } from "../client/flaw-utils";

// XXX This component should also import DocumentSpy so that it can
// know to automatically refresh when there's new document edits
// because their flaws might have changed.

interface DocumentPopularity {
  value: number;
  ranking: number;
}

interface Document {
  mdn_url: string;
  modified: string;
  title: string;
  popularity: DocumentPopularity;
  folder: string;
  flaws: {
    [key: string]: string[];
  };
}

interface Counts {
  found: number;
  possible: number;
  built: number;
  pages: number;
}

interface Times {
  built: number;
}

interface FlawLevel {
  name: string;
  level: string;
  ignored: boolean;
}

interface Data {
  counts: Counts;
  documents: Document[];
  times: Times;
  flawLevels: FlawLevel[];
}

interface Filters {
  mdn_url: string;
  title: string;
  popularity: string;
  flaws: string[];
  page: number;
  sort_by: string;
  sort_reverse: boolean;
}

const defaultFilters: Filters = Object.freeze({
  mdn_url: "",
  title: "",
  popularity: "",
  flaws: [],
  page: 1,
  sort_by: "popularity",
  sort_reverse: false,
});

function withoutDefaultFilters(filters: Filters): Partial<Filters> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        JSON.stringify(defaultFilters[key]) !== JSON.stringify(value)
    )
  );
}

/**
 * Returns an array where
 * first element is the currently set (or default) filters
 * second element is a function to update a given set of partial filters.
 * NOTE: This only changes the given filters, and doesn't reset what is missing
 */
function useFiltersURL(): [Filters, (filters: Partial<Filters>) => void] {
  const [searchParams, setSearchParams] = (useSearchParams as any)();

  const filters = useMemo(() => {
    const searchParamsObject = Object.fromEntries(searchParams);
    if (searchParamsObject.page) {
      searchParamsObject.page = parseInt(searchParamsObject.page);
    }
    return { ...defaultFilters, ...searchParamsObject };
  }, [searchParams]);

  const updateFiltersURL = useCallback(
    (partialFilters: Partial<Filters>) => {
      setSearchParams(withoutDefaultFilters({ ...filters, ...partialFilters }));
    },
    [filters, setSearchParams]
  );

  return [filters, updateFiltersURL];
}

export default function AllFlaws() {
  return null;
  const { locale } = useParams();
  const [filters] = useFiltersURL();
  const [lastData, setLastData] = useState<Data | null>(null);

  useEffect(() => {
    let title = "Documents with flaws";
    if (lastData) {
      title = `(${lastData.counts.found.toLocaleString()} found) ${title}`;
    }
    document.title = title;
  }, [lastData]);

  const getAPIUrl = useCallback(() => {
    const { sort_by, sort_reverse, page, ...restFilters } = filters;
    const params = createSearchParams({
      ...restFilters,
      page: String(page),
      locale,
      sort: sort_by,
      reverse: JSON.stringify(sort_reverse),
    });
    return `/_flaws?${params.toString()}`;
  }, [locale, filters]);

  const { data, error, isValidating } = useSWR<Data, Error>(
    getAPIUrl(),
    async (url) => {
      let response;
      try {
        response = await fetch(url);
      } catch (ex) {
        throw ex;
      }
      if (!response.ok) {
        throw new Error(`${response.status} on ${url}`);
      }
      if (!response.headers.get("content-type").includes("application/json")) {
        throw new Error(
          `Response is not JSON (${response.headers.get("content-type")})`
        );
      }
      // Always return a promise!
      return response.json();
    },
    {
      // revalidateOnFocus: false
    }
  );

  useEffect(() => {
    if (data) {
      setLastData(data);
    }
  }, [data]);

  // XXX there's something weird about this logic
  let loading: React.ReactNode = <small>&nbsp;</small>;
  if (!data && !error) {
    if (lastData) {
      loading = <small>Reloading...</small>;
    } else {
      loading = <small>Loading...</small>;
    }
  } else if (isValidating) {
    loading = <small>Reloading...</small>;
  }

  const { page } = filters;
  const pageCount = lastData ? lastData.counts.pages : 0;
  return (
    <div id="all-flaws">
      {loading}
      {error && <ShowSearchError error={error} />}
      {lastData && (
        <div className="filter-documents">
          <FilterControls flawLevels={lastData.flawLevels} />
          <DocumentsTable
            locale={locale}
            counts={lastData.counts}
            documents={lastData.documents}
          />
          {pageCount > 1 && (
            <p className="pagination">
              <PageLink number={1} disabled={page === 1}>
                First page
              </PageLink>{" "}
              {page > 2 && (
                <PageLink number={page - 1}>
                  Previous page ({page - 1})
                </PageLink>
              )}{" "}
              <PageLink number={page + 1} disabled={page + 1 > pageCount}>
                Next page ({page + 1})
              </PageLink>
            </p>
          )}
        </div>
      )}
      {data && <BuildTimes times={data.times} />}
    </div>
  );
}

function ShowSearchError({ error }) {
  return (
    <div className="error-message search-error">
      <h3>Search error</h3>
      <pre>{error.toString()}</pre>
    </div>
  );
}

function BuildTimes({ times }: { times: Times }) {
  function format(ms: number) {
    if (ms > 1000) {
      const s = ms / 1000;
      return `${s.toFixed(1)} seconds`;
    } else {
      return `${Math.trunc(ms)} milliseconds`;
    }
  }
  return (
    <div className="search-times">
      <p>Time to find built documents {format(times.built)}</p>
    </div>
  );
}

function FilterControls({ flawLevels }: { flawLevels: FlawLevel[] }) {
  const [initialFilters, updateFiltersURL] = useFiltersURL();
  const [filters, setFilters] = useState(initialFilters);

  function refreshFilters() {
    updateFiltersURL(filters);
  }

  let hasFilters = !equalObjects(defaultFilters, filters);

  function resetFilters(event: React.MouseEvent) {
    event.preventDefault();
    setFilters(defaultFilters);
    updateFiltersURL(defaultFilters);
  }

  return (
    <div className="filters">
      <h3>Filters</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          refreshFilters();
        }}
      >
        <div>
          <h4>Document</h4>
          <input
            type="search"
            placeholder="Filter by document URI"
            value={filters.mdn_url}
            onChange={(event) => {
              setFilters({ ...filters, mdn_url: event.target.value });
            }}
            onBlur={refreshFilters}
          />
          <input
            type="search"
            placeholder="Filter by document title"
            value={filters.title}
            onChange={(event) => {
              setFilters({ ...filters, title: event.target.value });
            }}
            onBlur={refreshFilters}
          />
        </div>

        <div>
          <h4>Popularity</h4>
          <input
            type="search"
            placeholder="E.g. < 100"
            value={filters.popularity || ""}
            onChange={(event) => {
              setFilters({ ...filters, popularity: event.target.value });
            }}
            onBlur={refreshFilters}
          />
        </div>
        <div>
          <h4>Flaws</h4>
          <select
            multiple={true}
            value={filters.flaws}
            onChange={(event) => {
              const flaws = [...event.target.selectedOptions].map(
                (opt) => opt.value
              );
              setFilters({ ...filters, flaws });
            }}
          >
            {flawLevels &&
              flawLevels.map((flawLevel) => {
                return (
                  <option key={flawLevel.name} value={flawLevel.name}>
                    {humanizeFlawName(flawLevel.name)}{" "}
                    {flawLevel.ignored && "(ignored)"}
                  </option>
                );
              })}
          </select>
        </div>

        <div>
          <h4>&nbsp;</h4>
          <button type="submit">Filter now</button>
          {hasFilters && (
            <button type="button" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function equalObjects(obj1: object, obj2: object) {
  const keys1 = new Set(Object.keys(obj1));
  const keys2 = new Set(Object.keys(obj2));
  if (keys1.size !== keys2.size) {
    return false;
  }
  for (const key of keys1) {
    if (!keys2.has(key)) {
      return false;
    }
  }

  return Object.entries(obj1).every(([key, value]) => {
    const value2 = obj2[key];
    if (typeof value !== typeof value2) {
      return false;
    }
    if (Array.isArray(value)) {
      return (
        value.length === value2.length && value.every((v, i) => v === value2[i])
      );
    } else {
      return value === value2;
    }
  });
}

function DocumentsTable({
  locale,
  counts,
  documents,
}: {
  locale: string;
  counts: Counts;
  documents: any;
}) {
  const [filters, updateFiltersURL] = useFiltersURL();

  function setSort(key: string): void {
    updateFiltersURL(
      filters.sort_by === key
        ? { sort_reverse: !filters.sort_reverse }
        : { sort_by: key }
    );
  }
  // https://gist.github.com/jlbruno/1535691/db35b4f3af3dcbb42babc01541410f291a8e8fac
  function getGetOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function summarizeFlaws(flaws) {
    // Return a one-liner about all the flaws
    const bits = flaws.map((flaw) => {
      return `${humanizeFlawName(flaw.name)}: ${flaw.value}`;
    });
    return bits.join(", ");
  }

  function TH({ id, title }: { id: string; title: string }) {
    return (
      <th onClick={() => setSort(id)} className="sortable">
        {title}{" "}
        {filters.sort_by === id ? (filters.sort_reverse ? "🔽" : "🔼") : null}
      </th>
    );
  }

  function getHighlightedText(text: string, highlight: string) {
    // Split on highlight term and include term into parts, ignore case
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {" "}
        {parts.map((part, i) => (
          <span
            key={i}
            style={
              part.toLowerCase() === highlight.toLowerCase()
                ? { fontWeight: "bold" }
                : {}
            }
          >
            {part}
          </span>
        ))}{" "}
      </span>
    );
  }

  function showBriefURL(uri: string) {
    const [left, right] = uri.split(/\/docs\//, 2);
    return (
      <>
        <span className="url-prefix">{left}/docs/</span>
        <span className="url-slug">
          {filters.mdn_url ? getHighlightedText(right, filters.mdn_url) : right}
        </span>
      </>
    );
  }

  return (
    <div className="documents">
      <h3>
        Documents with flaws found ({counts.found.toLocaleString()}){" "}
        {filters.page > 1 && <span className="page">page {filters.page}</span>}
      </h3>
      {!counts.built ? (
        <WarnAboutNothingBuilt />
      ) : (
        <h4 className="subheader">
          {counts.built.toLocaleString()} documents built out of a possible{" "}
          {counts.possible.toLocaleString()} ({locale})
        </h4>
      )}

      <table>
        <thead>
          <tr>
            <TH id="mdn_url" title="Document" />
            <TH id="popularity" title="Popularity" />
            <TH id="flaws" title="Flaws" />
          </tr>
        </thead>
        <tbody>
          {documents.map((doc: Document) => {
            return (
              <tr key={doc.mdn_url}>
                <td>
                  <Link
                    to={`${doc.mdn_url}#_flaws`}
                    title={doc.title}
                    target="_blank"
                  >
                    {showBriefURL(doc.mdn_url)}
                  </Link>
                  <span className="document-title-preview">
                    {filters.title
                      ? getHighlightedText(doc.title, filters.title)
                      : doc.title}
                  </span>
                </td>
                <td
                  title={
                    doc.popularity.ranking
                      ? `Meaning there are ${
                          doc.popularity.ranking - 1
                        } more popular pages than this`
                      : "Meaning it has no ranking. Most likely a very rare (or new) document"
                  }
                >
                  {!doc.popularity.ranking
                    ? "n/a"
                    : `${getGetOrdinal(doc.popularity.ranking)}`}
                </td>
                <td>{summarizeFlaws(doc.flaws)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PageLink({
  number,
  disabled,
  children,
}: {
  number: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [filters] = useFiltersURL();
  // Unfortunately TS's Partial<T> is not quite the right return type of this function,
  // as it implies the object could have keys set to undefined, which isn't true here.
  // Hence we have to use type coercion (any)
  const newFilters = withoutDefaultFilters({ ...filters, page: number }) as any;
  if (newFilters.page) {
    newFilters.page = String(newFilters.page);
  }
  return (
    <Link
      to={"?" + createSearchParams(newFilters).toString()}
      className={disabled ? "disabled" : ""}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}

function WarnAboutNothingBuilt() {
  return (
    <div className="attention document-warnings">
      <h4>No documents have been built, so no flaws can be found</h4>
      <p>
        At the moment, you have to use the command line tools to build documents
        that we can analyze.
      </p>
    </div>
  );
}
