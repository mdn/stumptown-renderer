import React, {
  Suspense,
  lazy,
  useState,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useSearchParams } from "react-router-dom";

import { useLocale } from "../../../hooks";

import "./index.scss";

import "./basic-search-widget.scss";
import {
  getPlaceholder,
  SearchProps,
  useFocusOnSlash,
} from "../../../search-utils";
const LazySearchNavigateWidget = lazy(() => import("../../../search"));

function useQueryParamState() {
  const [searchParams] = useSearchParams();
  const queryState = searchParams.get("q") || "";
  const [value, setValue] = useState(queryState);

  // The site-search page might trigger an update to the current
  // `?q=...` value and if that happens we want to be reflected in the search inputs
  React.useEffect(() => {
    setValue(queryState);
  }, [setValue, queryState]);

  return [value, setValue] as const;
}

export function Search(props) {
  const [value, setValue] = useQueryParamState();
  const [isFocused, setIsFocused] = useState(false);
  const [defaultSelection, setDefaultSelection] = useState([0, 0] as const);
  const [shouldUpgradeSearch, setShouldUpgradeSearch] = useState(false);

  const searchProps = useMemo(
    () => ({
      inputValue: value,
      onChangeInputValue: (value) => setValue(value),
      isFocused,
      onChangeIsFocused: (isFocused) => setIsFocused(isFocused),
      defaultSelection,
      onChangeSelection: (selection) => setDefaultSelection(selection),
      onMouseEnter: () => setShouldUpgradeSearch(true),
    }),
    [value, isFocused, defaultSelection, setValue]
  );

  useEffect(() => {
    if (isFocused) {
      setShouldUpgradeSearch(true);
    }
  }, [isFocused, setShouldUpgradeSearch]);

  return (
    <div className="header-search">
      {shouldUpgradeSearch ? (
        <Suspense fallback={<BasicSearchWidget {...searchProps} />}>
          <LazySearchNavigateWidget {...searchProps} {...props} />
        </Suspense>
      ) : (
        <BasicSearchWidget {...searchProps} />
      )}
    </div>
  );
}

export function BasicSearchWidget({
  isFocused,
  onChangeIsFocused,
  inputValue,
  onChangeInputValue,
  onChangeSelection,
  onMouseEnter,
}: SearchProps & {
  onChangeSelection: (selection: [number, number]) => void;
  onMouseEnter: () => void;
}) {
  const locale = useLocale();
  const inputRef = useRef<null | HTMLInputElement>(null);

  useFocusOnSlash(inputRef);

  return (
    <form
      action={`/${locale}/search`}
      className="search-form search-widget"
      role="search"
    >
      <label htmlFor="main-q" className="visually-hidden">
        Search MDN
      </label>
      <input
        ref={inputRef}
        type="search"
        name="q"
        id="main-q"
        className="search-input-field"
        placeholder={getPlaceholder(isFocused)}
        pattern="(.|\s)*\S(.|\s)*"
        required
        value={inputValue}
        onMouseEnter={onMouseEnter}
        onChange={(e) => {
          onChangeInputValue(e.target.value);
        }}
        autoFocus={isFocused}
        onFocus={() => onChangeIsFocused(true)}
        onBlur={() => onChangeIsFocused(false)}
        onSelect={(event) => {
          if (event.target instanceof HTMLInputElement) {
            onChangeSelection([
              event.target.selectionStart!,
              event.target.selectionEnd!,
            ]);
          }
        }}
      />
      <input
        type="submit"
        className="ghost search-button"
        value=""
        aria-label="Search"
      />
    </form>
  );
}
