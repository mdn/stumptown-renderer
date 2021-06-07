import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-sql";

// Necessary hack due to https://github.com/agershun/alasql/issues/930
// import alasql from "alasql";
import alasql from "../../../node_modules/alasql/dist/alasql.min.js";

import { Document, PastQuery } from "./types";
import "./sql-table.scss";

// These are temporary things because you can't currently import types from
// alasql. See above hack and link to issue
type FauxAlaSQLStatementColumn = {
  columnid: string;
  as?: string;
};
type FauxAlaSQLStatementFrom = {
  tableid: string;
  as?: string;
};
type FauxAlaSQLStatement = {
  columns: FauxAlaSQLStatementColumn[];
  from: FauxAlaSQLStatementFrom[];
  order?: any[];
  limit?: any[];
};

const DEFAULT_QUERY = "SELECT title FROM ? ORDER BY popularity DESC LIMIT 10";
const ADVANCED_QUERIES: string[] = [];
ADVANCED_QUERIES.push(`SELECT mdn_url, normalizedMacrosCount -> jsxref, popularity
FROM ?
WHERE normalizedMacrosCount -> jsxref > 5
ORDER BY popularity desc
LIMIT 25`);
ADVANCED_QUERIES.push(`SELECT title->length AS len, title, mdn_url
FROM ?
ORDER BY len DESC
LIMIT 100`);
ADVANCED_QUERIES.push(`SELECT mdn_url, title, wordCount, fileSize
FROM ?
WHERE mdn_url like '%/Web/http%'
ORDER BY fileSize desc
LIMIT 25`);
ADVANCED_QUERIES.push(`SELECT mdn_url, tags
FROM ?
WHERE "Experimental" in tags
ORDER BY popularity DESC LIMIT 10`);
ADVANCED_QUERIES.push(`SELECT mdn_url, tags
FROM ?
WHERE "Experimental" in tags
ORDER BY popularity DESC LIMIT 10`);

function storageDump(key: string, value: any, session = false) {
  const storage = session ? window.sessionStorage : window.localStorage;
  storage.setItem(key, JSON.stringify(value));
}

function storageLoad<T>(key: string, fallback: T, session = false): T {
  const storage = session ? window.sessionStorage : window.localStorage;
  const past = storage.getItem(key);
  if (past) {
    return JSON.parse(past) as T;
  }
  return fallback;
}

export function SQLTable({ documents }: { documents: Document[] }) {
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryDraft, setQueryDraft] = useState(
    searchParams.get("query") || storageLoad("query", DEFAULT_QUERY, true)
  );
  const [pastQueries, setPastQueries] = useState<PastQuery[]>(
    storageLoad("past-queries", [])
  );
  const [result, setResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPastQueries, setShowPastQueries] = useState(false);
  const [showSQLParserError, setShowSQLParserError] = useState(false);

  const [sqlParserError, setSQLParserError] = useState<Error | null>(null);

  const [queryDraftDebounced] = useDebounce(queryDraft, 1000);

  useEffect(() => {
    setShowHelp(false);
    setShowSQLParserError(false);
    setShowPastQueries(false);
  }, [query]);

  useEffect(() => {
    storageDump("past-queries", pastQueries);
  }, [pastQueries]);
  useEffect(() => {
    storageDump("query", queryDraftDebounced, true);
  }, [queryDraftDebounced]);

  useEffect(() => {
    if (searchParams.get("query")) {
      // If it's been edited since, it doesn't make sense to keep it there
      if (queryDraftDebounced !== searchParams.get("query")) {
        setSearchParams({});
      }
    }
  }, [queryDraftDebounced, searchParams, setSearchParams]);

  useEffect(() => {
    if (query) {
      try {
        const res = alasql(query, [documents]);
        setResult(res);
        setPastQueries((state: PastQuery[]) =>
          [
            { query, results: res.length },
            ...state.filter((q) => q.query !== query),
          ].slice(0, 50)
        );
        setQueryError(null);
      } catch (error) {
        setQueryError(error);
      }
    } else {
      setResult(null);
    }
  }, [query, documents]);

  const [parsedStatement, setParsedStatement] =
    useState<FauxAlaSQLStatement | null>(null);

  useEffect(() => {
    if (queryDraftDebounced) {
      try {
        const parsed = alasql.parse(queryDraftDebounced);
        setParsedStatement(parsed.statements[0]);
        setSQLParserError(null);
      } catch (err) {
        setSQLParserError(err);
      }
    }
  }, [queryDraftDebounced]);

  const [statementWarnings, setStatementWarnings] = useState<string[]>([]);
  useEffect(() => {
    const newWarnings: string[] = [];
    if (parsedStatement !== null) {
      const document = documents[0];
      const knownKeysLC = Object.keys(document).map((x) => x.toLowerCase());
      for (const column of parsedStatement.columns) {
        if (
          column.columnid &&
          !knownKeysLC.includes(column.columnid.toLowerCase())
        ) {
          newWarnings.push(
            `Column '${column.columnid}' is probably not in any document.`
          );
        }
      }
      if (!parsedStatement.from) {
        newWarnings.push(`Missing the 'FROM ?' part of the query.`);
      } else {
        if (
          !parsedStatement.from.find(
            (table) => table.as && table.as === "default"
          )
        ) {
          newWarnings.push(`Probably the 'FROM ?' part of the query.`);
        }
      }
    }
    setStatementWarnings(newWarnings);
  }, [parsedStatement, documents]);

  return (
    <div className="sql-table">
      <form
        className="query"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(queryDraft.trim());
        }}
      >
        {/* <textarea
          value={queryDraft}
          className={sqlParserError ? "has-sql-error" : ""}
          onChange={(event) => setQueryDraft(event.target.value)}
          rows={Math.max(5, queryDraft.split("\n").length + 1)}
          spellCheck={false}
        ></textarea> */}
        <Editor
          value={queryDraft}
          onValueChange={(code) => setQueryDraft(code)}
          highlight={(code) => highlight(code, languages.sql)}
          textareaClassName={sqlParserError ? "has-sql-error" : ""}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            backgroundColor: "#efefef",
          }}
        />
        {!sqlParserError && !!statementWarnings.length && (
          <div className="query-statement-warnings">
            <p>Warnings</p>
            <ul>
              {statementWarnings.map((warning) => {
                return (
                  <li key={warning}>
                    <code>{warning}</code>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="query-buttons">
          {showSQLParserError && sqlParserError && (
            <div className="sql-error">
              <pre>{sqlParserError.toString()}</pre>
            </div>
          )}
          {queryError && (
            <div className="query-error">
              <h4>Query error</h4>
              <code>{queryError.toString()}</code>
            </div>
          )}
          <button
            type="submit"
            className="button button-inline-small"
            disabled={!!((result && queryDraft === query) || sqlParserError)}
          >
            Run query
          </button>
          <button
            type="button"
            className="button button-inline-small"
            onClick={() => {
              setShowHelp((s) => !s);
              setShowPastQueries(false);
            }}
          >
            {showHelp ? "Close help" : "Show help"}
          </button>
          <button
            type="button"
            className="button button-inline-small"
            onClick={() => {
              setShowPastQueries((s) => !s);
              setShowHelp(false);
            }}
          >
            {showPastQueries
              ? "Close past queries"
              : `Show past queries (${pastQueries.length})`}
          </button>
          <button
            type="button"
            className="button button-inline-small"
            disabled={!sqlParserError}
            onClick={() => {
              setShowSQLParserError((s) => !s);
            }}
            style={
              sqlParserError && !showSQLParserError
                ? { color: "red" }
                : undefined
            }
          >
            {showSQLParserError && sqlParserError
              ? "Close error"
              : `SQL error${sqlParserError ? "!" : ""}`}
          </button>
        </div>
      </form>

      {showHelp && (
        <ShowHelp
          document={documents[0]}
          loadQuery={(q) => {
            setQueryDraft(q);
            const formElement = document.querySelector("form.query");
            if (formElement) {
              formElement.scrollIntoView({ behavior: "smooth" });
            }
            setShowHelp(false);
          }}
        />
      )}
      {showPastQueries && (
        <ShowPastQueries
          queries={pastQueries}
          loadQuery={(q) => {
            setQueryDraft(q);
            const formElement = document.querySelector("form.query");
            if (formElement) {
              formElement.scrollIntoView({ behavior: "smooth" });
            }
            setShowPastQueries(false);
          }}
          resetPastQueries={() => {
            setPastQueries([]);
            setShowPastQueries(false);
          }}
        />
      )}

      {result && <Results rows={result} />}
    </div>
  );
}

function ShowHelp({
  document,
  loadQuery,
}: {
  document: Document;
  loadQuery: (s: string) => void;
}) {
  console.log(document);

  return (
    <div className="help">
      <h4>List of keys you can select from</h4>
      <ul>
        {Object.keys(document).map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
      <h4>Sample queries</h4>
      <div>
        <pre>
          <code
            dangerouslySetInnerHTML={{
              __html: highlight(DEFAULT_QUERY, languages.sql),
            }}
          ></code>
        </pre>
        <button
          type="button"
          className="button button-inline-small"
          onClick={() => loadQuery(DEFAULT_QUERY)}
        >
          Load
        </button>
      </div>
      {ADVANCED_QUERIES.map((query) => {
        return (
          <div key={query}>
            <pre>
              <code
                dangerouslySetInnerHTML={{
                  __html: highlight(query, languages.sql),
                }}
              ></code>
            </pre>
            <button
              type="button"
              className="button button-inline-small"
              onClick={() => loadQuery(query)}
            >
              Load
            </button>
          </div>
        );
      })}

      <h4>
        Whatever <code>alasql</code> does
      </h4>
      <p>
        The SQL parser is based on{" "}
        <a
          href="https://github.com/agershun/alasql/wiki"
          target="_blank"
          rel="noopener noreferrer"
        >
          AlaSQL
        </a>
        . See its documentation for how to make queries. For example{" "}
        <a
          href="https://github.com/agershun/alasql/wiki/Data-manipulation"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data manipulation Q&amp;A
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/agershun/alasql/wiki/JSON"
          target="_blank"
          rel="noopener noreferrer"
        >
          Search in JSON arrays and objects
        </a>
      </p>
    </div>
  );
}

function ShowPastQueries({
  queries,
  loadQuery,
  resetPastQueries,
}: {
  queries: any[];
  loadQuery: (s: string) => void;
  resetPastQueries: () => void;
}) {
  return (
    <div className="past-queries">
      <h3>Past queries</h3>
      <button
        type="button"
        className="button button-inline-small"
        onClick={() => resetPastQueries()}
      >
        Clear past queries
      </button>
      <table>
        <thead>
          <tr>
            <th>Results</th>
            <th>Query</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query) => (
            <tr key={query.query}>
              <td>{query.results.toLocaleString()}</td>

              <td>
                <pre>
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlight(query.query, languages.sql),
                    }}
                  ></code>
                </pre>
              </td>
              <td>
                <button
                  type="button"
                  className="button button-inline-small"
                  onClick={() => {
                    loadQuery(query.query);
                  }}
                >
                  Load again
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Results = React.memo(({ rows }: { rows: any[] }) => {
  function triggerJSONDownload() {
    const blob = new Blob([JSON.stringify(rows, undefined, 2)], {
      type: "application/json",
    });
    // create hidden link, just force a click on it and then remove it from the DOM.
    const element = document.createElement("a");
    document.body.appendChild(element);
    element.setAttribute("href", window.URL.createObjectURL(blob));
    element.setAttribute("download", "results.json");
    element.style.display = "none";
    element.click();
    document.body.removeChild(element);
  }

  if (!rows.length) {
    return (
      <p className="no-results">
        <i>Nothing found.</i>
      </p>
    );
  }

  const keys = Object.keys(rows[0]);

  const MAX_ROWS = 1000;

  return (
    <div className="results">
      <p>
        <span className="results-count">
          <b>{rows.length.toLocaleString()}</b> results.
        </span>{" "}
        <button
          type="button"
          className="button button-inline-small"
          title="Click to start downloading as a .json file"
          onClick={() => {
            triggerJSONDownload();
          }}
        >
          Download as JSON
        </button>
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            {keys.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, MAX_ROWS).map((row, i) => {
            const key = row.mdn_url || `${row[keys[0]]}:${i}`;
            return (
              <tr key={key}>
                <td>{i + 1}</td>
                {keys.map((key) => {
                  const value = row[key];

                  return (
                    <td key={key}>
                      {key === "mdn_url" && value ? (
                        <Link to={value} target="_blank">
                          {value}
                        </Link>
                      ) : typeof value === "object" ? (
                        JSON.stringify(value)
                      ) : typeof value === "number" ? (
                        value.toLocaleString()
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <div className="too-many-to-display">
          <p>
            Only displaying the first {MAX_ROWS.toLocaleString()} rows in the
            table.
          </p>
        </div>
      )}
    </div>
  );
});
