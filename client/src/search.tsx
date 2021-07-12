import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCombobox } from "downshift";
import FlexSearch from "flexsearch";
import useSWR from "swr";

import { Doc, FuzzySearch, Substring } from "./fuzzy-search";
import { preload, preloadSupported } from "./document/preloading";

import { useLocale } from "./hooks";
import { getPlaceholder, SearchProps, useFocusOnSlash } from "./search-utils";

const PRELOAD_WAIT_MS = 500;
const SHOW_INDEXING_AFTER_MS = 500;

type Item = {
  url: string;
  title: string;
};

type SearchIndex = {
  flex: any;
  fuzzy: FuzzySearch;
  items: null | Item[];
};

type ResultItem = {
  title: string;
  url: string;
  substrings: Substring[];
};

function useSearchIndex(): readonly [
  null | SearchIndex,
  null | Error,
  () => void
] {
  const [shouldInitialize, setShouldInitialize] = useState(false);
  const [searchIndex, setSearchIndex] = useState<null | SearchIndex>(null);
  const { locale } = useParams();

  // Default to 'en-US' if you're on the home page without the locale prefix.
  const url = `/${locale || "en-US"}/search-index.json`;

  const { error, data } = useSWR<null | Item[]>(
    shouldInitialize ? url : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!data || searchIndex) {
      return;
    }

    const flex = FlexSearch.create({ tokenize: "forward" });
    data!.forEach(({ title }, i) => {
      flex.add(i, title);
    });
    const fuzzy = new FuzzySearch(data as Doc[]);

    setSearchIndex({ flex, fuzzy, items: data! });
  }, [searchIndex, shouldInitialize, data]);

  return useMemo(
    () => [searchIndex, error, () => setShouldInitialize(true)],
    [searchIndex, error, setShouldInitialize]
  );
}

// The fuzzy search is engaged if the search term starts with a '/'
// and does not have any spaces in it.
function isFuzzySearchString(str: string) {
  return str.startsWith("/") && !/\s/.test(str);
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

type InnerSearchNavigateWidgetProps = SearchProps & {
  onResultPicked?: () => void;
  defaultSelection: [number, number];
};

function useHasNotChangedFor(value: string, ms: number) {
  const [hasNotChanged, setHasNotChanged] = useState(false);
  const previousValue = useRef(value);
  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }
    previousValue.current = value;
    setHasNotChanged(false);
    // while timeouts are not accurate for counting time there error is only
    // upwards, meaning they might trigger after more time than specified,
    // which is fine in this case
    const timeout = setTimeout(() => {
      setHasNotChanged(true);
    }, ms);
    return () => {
      clearTimeout(timeout);
    };
  }, [value, ms]);

  return hasNotChanged;
}

function InnerSearchNavigateWidget(props: InnerSearchNavigateWidgetProps) {
  const {
    inputValue,
    onChangeInputValue,
    isFocused,
    onChangeIsFocused,
    onResultPicked,
    defaultSelection,
  } = props;

  const navigate = useNavigate();
  const locale = useLocale();

  const [searchIndex, searchIndexError, initializeSearchIndex] =
    useSearchIndex();

  const inputRef = useRef<null | HTMLInputElement>(null);
  const formRef = useRef<null | HTMLFormElement>(null);
  const isSelectionInitialized = useRef(false);

  const showIndexing = useHasNotChangedFor(inputValue, SHOW_INDEXING_AFTER_MS);

  useEffect(() => {
    if (!inputRef.current || isSelectionInitialized.current) {
      return;
    }
    if (isFocused) {
      inputRef.current.selectionStart = defaultSelection[0];
      inputRef.current.selectionEnd = defaultSelection[1];
    }
    isSelectionInitialized.current = true;
  }, [isFocused, defaultSelection]);

  const resultItems: ResultItem[] = useMemo(() => {
    if (!searchIndex || !inputValue || searchIndexError) {
      // This can happen if the initialized hasn't completed yet or
      // completed un-successfully.
      return [];
    }

    // The iPhone X series is 812px high.
    // If the window isn't very high, show fewer matches so that the
    // overlaying search results don't trigger a scroll.
    const limit = window.innerHeight < 850 ? 5 : 10;

    if (isFuzzySearchString(inputValue)) {
      if (inputValue === "/") {
        return [];
      } else {
        const fuzzyResults = searchIndex.fuzzy.search(inputValue, { limit });
        return fuzzyResults.map((fuzzyResult) => ({
          url: fuzzyResult.url,
          title: fuzzyResult.title,
          substrings: fuzzyResult.substrings,
        }));
      }
    } else {
      // Full-Text search
      const indexResults = searchIndex.flex.search(inputValue, {
        limit,
        suggest: true, // This can give terrible result suggestions
      });

      return indexResults.map((index) => (searchIndex.items || [])[index]);
    }
  }, [inputValue, searchIndex, searchIndexError]);

  const formAction = `/${locale}/search`;
  const searchPath = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("q", inputValue.trim());
    return `${formAction}?${sp.toString()}`;
  }, [formAction, inputValue]);

  const nothingFoundItem = useMemo(
    () => ({ url: searchPath, title: "", substrings: [] }),
    [searchPath]
  );

  const {
    getInputProps,
    getItemProps,
    getMenuProps,
    getComboboxProps,

    highlightedIndex,
    isOpen,

    reset,
    toggleMenu,
  } = useCombobox({
    items: resultItems.length === 0 ? [nothingFoundItem] : resultItems,
    inputValue,
    defaultIsOpen: isFocused,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        navigate(selectedItem.url);
        onChangeInputValue("");
        reset();
        toggleMenu();
        inputRef.current?.blur();
        if (onResultPicked) {
          onResultPicked();
        }
      }
    },
  });

  useFocusOnSlash(inputRef);

  useEffect(() => {
    if (isFocused) {
      initializeSearchIndex();
    }
  }, [initializeSearchIndex, isFocused]);

  useEffect(() => {
    const item = resultItems[highlightedIndex];
    if (item && preloadSupported()) {
      const timeout = setTimeout(() => {
        preload(`${item.url}/index.json`);
      }, PRELOAD_WAIT_MS);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [highlightedIndex, resultItems]);

  const searchResults = (() => {
    if (!isOpen || !inputValue.trim()) {
      return null;
    }

    if (searchIndexError) {
      return (
        <div className="searchindex-error">Error initializing search index</div>
      );
    }

    if (!searchIndex) {
      return showIndexing ? (
        <div className="indexing-warning">
          <em>Initializing index</em>
        </div>
      ) : null;
    }

    return (
      <>
        {resultItems.length === 0 && inputValue !== "/" ? (
          <div
            {...getItemProps({
              className:
                "nothing-found result-item " +
                (highlightedIndex === 0 ? "highlight" : ""),
              item: nothingFoundItem,
              index: 0,
            })}
          >
            No document titles found.
            <br />
            <Link to={searchPath}>
              Site search for <code>{inputValue}</code>
            </Link>
          </div>
        ) : (
          resultItems.map((item, i) => (
            <div
              {...getItemProps({
                key: item.url,
                className:
                  "result-item " + (i === highlightedIndex ? "highlight" : ""),
                item,
                index: i,
              })}
            >
              <HighlightMatch title={item.title} q={inputValue} />
              <br />
              <BreadcrumbURI uri={item.url} substrings={item.substrings} />
            </div>
          ))
        )}
        {isFuzzySearchString(inputValue) && (
          <div className="fuzzy-engaged">Fuzzy searching by URI</div>
        )}
      </>
    );
  })();

  return (
    <form
      action={formAction}
      {...getComboboxProps({
        ref: formRef as any, // downshift's types hardcode it as a div
        className: "search-form search-widget",
        id: "nav-main-search",
        role: "search",
        onSubmit: (e) => {
          // This comes into effect if the input is completely empty and the
          // user hits Enter, which triggers the native form submission.
          // When something *is* entered, the onKeyDown event is triggered
          // on the <input> and within that handler you can
          // access `event.key === 'Enter'` as a signal to submit the form.
          e.preventDefault();
        },
      })}
    >
      <label htmlFor="main-q" className="visually-hidden">
        Search MDN
      </label>

      <input
        {...getInputProps({
          type: "search",
          className: isOpen
            ? "has-search-results search-input-field"
            : "search-input-field",
          id: "main-q",
          name: "q",
          placeholder: getPlaceholder(isFocused),
          onMouseOver: initializeSearchIndex,
          onFocus: () => {
            onChangeIsFocused(true);
          },
          onBlur: () => onChangeIsFocused(false),
          onKeyDown(event) {
            if (event.key === "Escape" && inputRef.current) {
              inputRef.current.blur();
            } else if (
              event.key === "Enter" &&
              inputValue.trim() &&
              highlightedIndex === -1
            ) {
              inputRef.current!.blur();
              formRef.current!.submit();
            }
          },
          onChange(event) {
            if (event.target instanceof HTMLInputElement) {
              onChangeInputValue(event.target.value);
            }
          },
          ref: (input) => {
            inputRef.current = input;
          },
        })}
      />

      <input
        type="submit"
        className="ghost search-button"
        value=""
        aria-label="Search"
      />

      <div {...getMenuProps()}>
        {searchResults && <div className="search-results">{searchResults}</div>}
      </div>
    </form>
  );
}

class SearchErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    console.error("There was an error while trying to render search", error);
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? (
      <div>Error while rendering search. Check console for details.</div>
    ) : (
      this.props.children
    );
  }
}

export default function SearchNavigateWidget(props) {
  return (
    <SearchErrorBoundary>
      <InnerSearchNavigateWidget {...props} />
    </SearchErrorBoundary>
  );
}
