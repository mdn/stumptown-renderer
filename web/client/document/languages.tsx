import React from "react";
import Link from "next/link";

import "./languages.module.css";

export function DocumentTranslations({ translations }) {
  const [showChoices, setShowChoices] = React.useState(false);
  function toggleOnHandler(event) {
    event.preventDefault();
    setShowChoices(true);
  }
  function toggleOffHandler(event) {
    event.preventDefault();
    setShowChoices(false);
  }

  return (
    <div className="document-languages">
      {showChoices ? (
        <div className="choices">
          <a href="." onClick={toggleOffHandler}>
            <b>Close ⨂</b>
          </a>
          <ShowTranslations translations={translations} />
        </div>
      ) : (
        <a href="." onClick={toggleOnHandler}>
          Change language
        </a>
      )}
    </div>
  );
}

function ShowTranslations({ translations }) {
  return (
    <div className="translations">
      <ul>
        {translations.map((translation) => {
          const { slug, locale } = translation;
          const uri = `/${locale}/docs/${slug}`;
          return (
            <li key={uri}>
              <Link href={uri}>{locale}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
