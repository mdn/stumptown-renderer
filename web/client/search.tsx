// @ts-nocheck
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FlexSearch from "flexsearch";
import FuzzySearch from "./fuzzy-search";
import "./search.scss";

function isMobileUserAgent() {
  return (
    typeof window !== "undefined" &&
    (typeof window.orientation !== "undefined" ||
      navigator.userAgent.indexOf("IEMobile") !== -1)
  );
}

export function SearchWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <SearchWidgetClass
      pathname={pathname}
      onRedirect={(uri) => {
        navigate(uri);
      }}
    />
  );
}

const ACTIVE_PLACEHOLDER = "Go ahead. Type your search...";
const INITIALIZING_PLACEHOLDER = "Initializing search...";
// Make this one depend on figuring out if you're on a mobile device
// because there you can't really benefit from keyboard shortcuts.
const INACTIVE_PLACEHOLDER = isMobileUserAgent()
  ? "Site search..."
  : 'Site search... (Press "/" to focus)';

// TODO the only reason exporting this, for now, is to make
// jest tests pass until https://github.com/mdn/yari/pull/494
// is resolved.
export class SearchWidgetClass extends React.Component {
  state = {
    highlitResult: null,
    initialized: null, // null=not started, false=started, true=finished
    q: "",
    searchResults: [],
    serverError: null,
    showSearchResults: true,
  };

  inFocus = false;

  focusOnSearchMaybe = (event) => {
    if (event.code === "Slash") {
      // Don't do this if the current event target is a widget
      if (!["TEXTAREA", "INPUT"].includes(event.target.tagName)) {
        if (!this.inFocus) {
          event.preventDefault();
          this.inputRef.current.focus();
        }
      }
    }
  };

  getCurrentLocale = () => {
    return (
      (this.props.pathname && this.props.pathname.split("/")[1]) || "en-US"
    );
  };

  componentDidMount() {
    document.addEventListener("keydown", this.focusOnSearchMaybe);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pathname !== this.props.pathname) {
      // Hide search results if you changed page.
      if (this.state.showSearchResults || this.state.q) {
        this.setState({
          highlitResult: null,
          q: "",
          showSearchResults: false,
          locale: this.props.pathname.split("/")[1] || "en-US",
        });
      }
    }
  }

  componentWillUnmount() {
    this.dismounted = true;
    document.removeEventListener("keydown", this.focusOnSearchMaybe);
  }

  initializeIndex = () => {
    if (this.state.initialized !== null) {
      // Been initialized, or started to, at least once before.
      return;
    }

    this.setState({ initialized: false }, async () => {
      // Always do the XHR network request (hopefully good HTTP caching
      // will make this pleasant for the client) but localStorage is
      // always faster than XHR even with localStorage's flaws.
      const localStorageCacheKey = `${this.getCurrentLocale()}-titles`;
      const storedTitlesRaw = localStorage.getItem(localStorageCacheKey);
      if (storedTitlesRaw) {
        let storedTitles = null;
        try {
          storedTitles = JSON.parse(storedTitlesRaw);
        } catch (ex) {
          console.warn(ex);
        }
        // XXX Could check the value of 'storedTitles._fetchDate'.
        // For example if `new Date().getTime() - storedTitles._fetchDate`
        // is a really small number, it probably just means the page was
        // refreshed very recently.
        if (storedTitles) {
          this.indexTitles(storedTitles);
          this.setState({ initialized: true });
        }
      }

      let response;
      try {
        response = await fetch(`/${this.getCurrentLocale()}/titles.json`);
      } catch (ex) {
        if (this.dismounted) return;
        return this.setState({ serverError: ex, showSearchResults: true });
      }
      if (this.dismounted) return;
      if (!response.ok) {
        return this.setState({
          serverError: response,
          showSearchResults: true,
        });
      }
      const { titles } = await response.json();
      this.indexTitles(titles);
      this.setState({ initialized: true });

      // So we can keep track of how old the data is when stored
      // in localStorage.
      titles._fetchDate = new Date().getTime();
      try {
        localStorage.setItem(
          `${this.getCurrentLocale()}-titles`,
          JSON.stringify(titles)
        );
      } catch (ex) {
        console.warn(
          ex,
          `Unable to store a ${JSON.stringify(titles).length} string`
        );
      }
    });
  };

  indexTitles = (titles) => {
    // NOTE! See search-experimentation.js to play with different settings.
    this.index = new FlexSearch({
      suggest: true,
      // tokenize: "reverse",
      tokenize: "forward",
    });
    this._map = titles;

    const urisSorted = [];
    Object.entries(titles)
      .sort((a, b) => b[1].popularity - a[1].popularity)
      .forEach(([uri, info]) => {
        // XXX investigate if it's faster to add all at once
        // https://github.com/nextapps-de/flexsearch/#addupdateremove-documents-tofrom-the-index
        this.index.add(uri, info.title);
        urisSorted.push(uri);
      });
    this.fuzzySearcher = new FuzzySearch(urisSorted);
  };

  searchHandler = (event) => {
    this.setState({ q: event.target.value }, this.updateSearch);
  };

  updateSearch = () => {
    const q = this.state.q.trim();
    if (!q) {
      if (this.state.showSearchResults) {
        this.setState({ showSearchResults: false });
      }
    } else if (!this.index) {
      // This can happen if the initialized hasn't completed yet or
      // completed un-successfully.
      return;
    } else {
      // The iPhone X series is 812px high.
      // If the window isn't very high, show fewer matches so that the
      // overlaying search results don't trigger a scroll.
      const limit = window.innerHeight < 850 ? 5 : 10;

      if (q.startsWith("/") && !/\s/.test(q)) {
        // Fuzzy-String search on the URI

        if (q === "/") {
          this.setState({
            highlitResult: null,
            searchResults: [],
            showSearchResults: true,
          });
        } else {
          const fuzzyResults = this.fuzzySearcher.search(q, { limit });
          const results = fuzzyResults.map((fuzzyResult) => {
            return {
              title: this._map[fuzzyResult.needle].title,
              uri: fuzzyResult.needle,
              substrings: fuzzyResult.substrings,
            };
          });
          this.setState({
            highlitResult: results.length ? 0 : null,
            searchResults: results,
            showSearchResults: true,
          });
        }
      } else {
        // Full-Text search
        const indexResults = this.index.search(q, {
          limit,
          // bool: "or",
          suggest: true, // This can give terrible result suggestions
        });

        const results = indexResults.map((uri) => {
          return {
            title: this._map[uri].title,
            uri,
            popularity: this._map[uri].popularity,
          };
        });
        this.setState({
          highlitResult: results.length ? 0 : null,
          searchResults: results,
          showSearchResults: true,
        });
      }
    }
  };

  keyDownHandler = (event) => {
    if (event.key === "Escape") {
      if (this.state.showSearchResults) {
        this.setState({ showSearchResults: false });
      }
    } else if (event.key === "ArrowDown" || event.key === "Tab") {
      // Increment 'highlitResult' if possible.
      const { highlitResult, searchResults } = this.state;
      if (highlitResult === null) {
        if (searchResults.length) {
          event.preventDefault();
          this.setState({ highlitResult: 0 });
        }
      } else if (highlitResult < searchResults.length - 1) {
        event.preventDefault();
        this.setState({ highlitResult: highlitResult + 1 });
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      // Decrement 'highlitResult' if possible.
      const { highlitResult } = this.state;
      if (highlitResult > 0) {
        this.setState({ highlitResult: highlitResult - 1 });
      } else {
        this.setState({ highlitResult: 0 });
      }
    }
  };

  focusHandler = () => {
    this.inFocus = true;

    // If it hasn't been done already, do this now. It's idempotent.
    this.initializeIndex();

    // Perhaps the blur closed the search results
    const { q, searchResults, showSearchResults } = this.state;
    if (!showSearchResults && searchResults.length && q) {
      this.setState({ showSearchResults: true });
    }

    // If you're on a mobile, scroll down a little bit so that the search
    // bar is at the top of your screen. That allows maximum height space
    // usage to fix the input widget, the search result suggestions, and
    // the keyboard.
    const isSmallerScreen = isMobileUserAgent() && window.innerHeight < 850;
    if (isSmallerScreen && !this._hasScrolledDown) {
      if (this.inputRef.current) {
        this.inputRef.current.scrollIntoView();
      }
      // Don't bother a second time.
      this._hasScrolledDown = true;
    }
  };

  blurHandler = () => {
    this.inFocus = false;
    // The reason we have a slight delay before hiding search results
    // is so that any onClick on the results get a chance to fire.
    this.hideSoon = window.setTimeout(() => {
      if (!this.dismounted) {
        this.setState({ showSearchResults: false });
      }
    }, 100);
  };

  submitHandler = (event) => {
    event.preventDefault();
    const { onRedirect } = this.props;
    const { highlitResult, searchResults } = this.state;
    if (searchResults.length === 1) {
      onRedirect(searchResults[0].uri);
    } else if (searchResults.length && highlitResult !== null) {
      onRedirect(searchResults[highlitResult].uri);
    } else {
      return;
    }
    this.setState({
      showSearchResults: false,
    });
  };

  redirect = (uri) => {
    const { onRedirect } = this.props;
    onRedirect(uri);
  };

  // This exists to avoid having to use 'document.querySelector(...)'
  // to get to the DOM element.
  inputRef = React.createRef();

  render() {
    const {
      highlitResult,
      q,
      searchResults,
      serverError,
      showSearchResults,
      initialized,
    } = this.state;

    // The fuzzy search is engaged if the search term starts with a '/'
    // and does not have any spaces in it.
    const isFuzzySearch = q.startsWith("/") && !/\s/.test(q);

    // Compute this once so it can be used as a conditional
    // and a prop.
    // Nothing found means there was an attempt to find stuff but it
    // came back empty.
    const nothingFound =
      (q && !searchResults.length && !isFuzzySearch) ||
      (isFuzzySearch && q !== "/" && !searchResults.length);

    // This boolean determines if we should bother to show the search
    // results div at all.
    // It's best to know this BEFORE instead of letting
    // the <ShowSearchResults/> component return a null.
    // By knowing it in advance we can use it as a hint to the input widget
    // so it can know to draw a bottom border or not.
    const show =
      !serverError &&
      showSearchResults &&
      (nothingFound || searchResults.length || isFuzzySearch);

    return (
      <form className="search-widget" onSubmit={this.submitHandler}>
        <input
          className={show ? "has-search-results" : null}
          onBlur={this.blurHandler}
          onChange={this.searchHandler}
          onFocus={this.focusHandler}
          onKeyDown={this.keyDownHandler}
          onMouseOver={this.initializeIndex}
          placeholder={
            initialized === null
              ? INACTIVE_PLACEHOLDER
              : initialized
              ? ACTIVE_PLACEHOLDER
              : INITIALIZING_PLACEHOLDER
          }
          ref={this.inputRef}
          type="search"
          value={q}
        />
        {serverError && (
          <p className="server-error">
            {/* XXX Could be smarter here and actually *look* at the serverError object */}
            Server error trying to initialize index
          </p>
        )}
        {show ? (
          <ShowSearchResults
            highlitResult={highlitResult}
            nothingFound={nothingFound}
            q={q}
            redirect={this.redirect}
            results={searchResults}
            isFuzzySearch={isFuzzySearch}
          />
        ) : null}
      </form>
    );
  }
}

function ShowSearchResults({
  redirect,
  highlitResult,
  isFuzzySearch,
  nothingFound,
  q,
  results,
}) {
  function redirectHandler(result) {
    redirect(result.uri);
  }

  return (
    <div className="search-results">
      {nothingFound && <div className="nothing-found">nothing found</div>}
      {results.map((result, i) => {
        return (
          <div
            className={i === highlitResult ? "highlit" : null}
            key={result.uri}
            onClick={() => redirectHandler(result)}
          >
            <HighlightMatch title={result.title} q={q} />
            <br />
            <BreadcrumbURI uri={result.uri} substrings={result.substrings} />
          </div>
        );
      })}
      {isFuzzySearch && (
        <div className="fuzzy-engaged">Fuzzy searching by URI</div>
      )}
    </div>
  );
}

function HighlightMatch({ title, q }) {
  // FlexSearch doesn't support finding out which "typo corrections"
  // were done unfortunately.
  // See https://github.com/nextapps-de/flexsearch/issues/99

  // Split on higlight term and include term into parts, ignore case.
  const words = q.trim().toLowerCase().split(/[ ,]+/);

  // $& means the whole matched string
  const regexWords = words.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = `\\b(${regexWords.join("|")})`;
  const parts = title.split(new RegExp(regex, "gi"));
  return (
    <b>
      {parts.map((part, i) => {
        const key = `${part}:${i}`;
        if (words.includes(part.toLowerCase())) {
          return <mark key={key}>{part}</mark>;
        } else {
          return <span key={key}>{part}</span>;
        }
      })}
    </b>
  );
}

function BreadcrumbURI({ uri, substrings }) {
  if (substrings) {
    return (
      <small>
        {substrings.map((part, i) => {
          const key = `${part.str}:${i}`;
          if (part.match) {
            return <mark key={key}>{part.str}</mark>;
          } else {
            return <span key={key}>{part.str}</span>;
          }
        })}
      </small>
    );
  }
  const keep = uri
    .split("/")
    .slice(1)
    .filter((p) => p !== "docs");
  return <small>{keep.join(" / ")}</small>;
}
