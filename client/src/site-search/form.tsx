import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import LANGUAGES_RAW from "../languages.json";
import { SiteSearchQuery } from "./types";

const LANGUAGES = new Map(
  Object.entries(LANGUAGES_RAW).map(([locale, data]) => {
    return [locale.toLowerCase(), data];
  })
);

export default function SiteSearchForm({
  query,
  locale,
  onSubmit,
}: {
  query: SiteSearchQuery;
  locale: string;
  onSubmit: (query: SiteSearchQuery) => void;
}) {
  // // Return true if the advanced search options should be visible on page load.
  // // Normally, it requires that you press the button to reveal, but if you have
  // // various advanced options in your current URL query string that couldn't
  // // have been there unless you used the advanced search at some point, in that
  // // case show the advanced options by default.
  // function showAdancedOptionsDefault() {
  //   if (query.sort && query.sort !== "best" && query.sort !== "") {
  //     return true;
  //   }
  //   if (
  //     query.locale &&
  //     (query.locale.length > 1 ||
  //       query.locale[0].toLowerCase() !== locale.toLowerCase())
  //   ) {
  //     return true;
  //   }
  //   return false;
  // }
  // const [showAdvancedOptions, toggleShowAdvancedOptions] = React.useReducer(
  //   (state) => !state,
  //   showAdancedOptionsDefault()
  // );
  const [newQuery, setNewQuery] = React.useState(Object.assign({}, query));

  return (
    <form
      action={`/${locale}/search`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(newQuery);
      }}
    >
      <pre>{JSON.stringify(newQuery)}</pre>
      <input
        type="search"
        name="q"
        value={newQuery.q}
        onChange={(event) => {
          setNewQuery(Object.assign({}, newQuery, { q: event.target.value }));
        }}
      />{" "}
      <button type="submit">Search</button>{" "}
      {/* <button
        type="button"
        onClick={() => {
          toggleShowAdvancedOptions();
        }}
      >
        Advanced search options
      </button> */}
      <AdvancedOptions
        locale={locale}
        query={newQuery}
        updateQuery={(queryUpdates: SiteSearchQuery) => {
          const newQuery = Object.assign({}, query, queryUpdates);
          setNewQuery(newQuery);
        }}
      />
    </form>
  );
}

function AdvancedOptions({
  query,
  locale,
  updateQuery,
}: {
  query: SiteSearchQuery;
  locale: string;
  updateQuery: (query: SiteSearchQuery) => void;
}) {
  const [searchParams] = useSearchParams();

  function makeNewQuery(overrides: Partial<SiteSearchQuery>) {
    const sp = new URLSearchParams(searchParams);
    Object.entries(overrides).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        for (const each of value) {
          sp.append(key, each);
        }
      } else if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
    });
    return sp.toString();
  }

  const SORT_OPTIONS = [
    ["best", "Best"],
    ["relevance", "Relevance"],
    ["popularity", "Popularity"],
  ];

  console.log(query);

  return (
    <div className="advanced-options">
      {/* Language only applies if you're browsing in, say, French
      and want to search in English too. */}
      {locale !== "en-US" && (
        <div className="advanced-option">
          <label htmlFor="id_locale">Language</label>
          <select
            id="id_locale"
            value={query.locale.length === 2 ? "both" : query.locale[0]}
            onChange={(event) => {
              const { value } = event.target;
              // Note, changing language should reset the `page`.
              // For example, if you're on page 3 of "fr" and change to "en-us"
              // there might, now, not be a page 3.
              if (value === "both") {
                updateQuery({
                  q: query.q,
                  locale: ["en-us", locale],
                  page: "",
                });
              } else {
                updateQuery({ q: query.q, locale: [value], page: "" });
              }
            }}
          >
            <option value={locale.toLowerCase()}>
              {LANGUAGES.get(locale.toLowerCase())?.native} (
              {LANGUAGES.get(locale.toLowerCase())?.English})
            </option>

            <option value="en-us">{LANGUAGES.get("en-us")?.native})</option>
            <option value="both">Both</option>
          </select>
        </div>
      )}

      {/*
        Rank choice. There's no point showing this unless you have a query.
        TODO: It might be worth knowing if the search found anything.
       */}
      {query.q && (
        <p className="advanced-option">
          <b>Sort:</b>{" "}
          {SORT_OPTIONS.map(([key, label], i) => {
            return (
              <React.Fragment key={key}>
                {key === (query.sort || "best") ? (
                  <i>{label}</i>
                ) : (
                  <Link to={`?${makeNewQuery({ sort: key })}`}>{label}</Link>
                )}
                {i < SORT_OPTIONS.length - 1 ? " | " : ""}
              </React.Fragment>
            );
          })}
          {/* <label htmlFor="id_sort">Sort</label>
          <select
            id="id_sort"
            value={query.sort ? query.sort : "best"}
            onChange={(event) => {
              const { value } = event.target;
              updateQuery({ q: query.q, locale: query.locale, sort: value });
            }}
          >
            <option value="best">Best</option>
            <option value="relevance">Relevance</option>
            <option value="popularity">Popularity</option>
          </select> */}
        </p>
      )}
    </div>
  );
}
