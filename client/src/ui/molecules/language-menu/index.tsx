import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import LANGUAGES_RAW from "../../../languages.json";
import { Translation } from "../../../document/types";

import "./index.scss";

const LANGUAGES = new Map(
  Object.entries(LANGUAGES_RAW).map(([locale, data]) => {
    return [locale.toLowerCase(), data];
  })
);

export default function LanguageMenu({
  locale,
  translations,
}: {
  locale: string;
  translations: Translation[];
}) {
  const navigate = useNavigate();
  const [localeURL, setLocaleURL] = useState(locale);

  // For the menu label, we want to use the name of the document language.
  // We need a special case for English because English documents can
  // appear in pages for other locales, and in that case we need a
  // translation for the word "English". In all other cases, the
  // locale of the page and the locale of the document should match
  // and we can just use the document language string without translation.
  const verbose = LANGUAGES.get(locale.toLowerCase());

  return (
    <form
      className="language-menu"
      onSubmit={(event) => {
        event.preventDefault();
        // The default is the current locale itself. If that's what's chosen,
        // don't bother redirecting.
        if (localeURL !== locale) {
          navigate(localeURL);
        }
      }}
    >
      <label htmlFor="select_language" className="visually-hidden">
        Select your preferred language
      </label>{" "}
      <select
        id="select_language"
        name="language"
        value={localeURL}
        onChange={(event) => {
          const { value } = event.target;
          setLocaleURL(value);
        }}
      >
        {/*
          This option is alway there and always first.
          The reason it doesn't have the `disabled` attribute is because it
          might not render when viewing the select un-opened and instead what
          you see is the second option.
          The onChange callback is a protection for doing nothing if the
          already current locale is chosen.
         */}
        <option value={locale}>{verbose ? verbose.native : locale}</option>
        {translations.map((t) => {
          const verbose = LANGUAGES.get(t.locale.toLowerCase());
          const url = `/${t.locale}/docs/${t.slug}`;
          return (
            <option key={url} value={url}>
              {verbose ? verbose.native : t.locale}
            </option>
          );
        })}
      </select>{" "}
      <button type="submit" className="button minimal">
        Change language
      </button>
    </form>
  );
}
