import React from "react";

// import { LanguageMenu } from "../../../ui/molecules/language-menu";
// import { OnGitHubLink } from "../../on-github";

import "./index.scss";

import "../../../ui/molecules/language-menu/index.scss";
const LanguageMenu = React.lazy(
  () => import("../../../ui/molecules/language-menu")
);
const OnGitHubLink = React.lazy(() => import("../../on-github"));

function LastModified({ value, locale }) {
  if (!value) {
    return <span>Last modified date not known</span>;
  }
  const date = new Date(value);
  // Justification for these is to match historically
  const dateStringOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return (
    <>
      <b>Last modified:</b>{" "}
      <time dateTime={value}>
        {date.toLocaleString(locale, dateStringOptions)}
      </time>
    </>
  );
}

export function Metadata({ doc, locale }) {
  const translations = doc.other_translations || [];
  const { native } = doc;
  const isServer = typeof window === "undefined";

  return (
    <aside className="metadata">
      <div className="metadata-content-container">
        {!isServer && doc.isActive && (
          <React.Suspense fallback={<p>Loading...</p>}>
            <OnGitHubLink doc={doc} />
          </React.Suspense>
        )}
        <p className="last-modified-date">
          <LastModified value={doc.modified} locale={locale} />,{" "}
          <a href={`${doc.mdn_url}/contributors.txt`}>by MDN contributors</a>
        </p>
        {!isServer && translations && !!translations.length && (
          <React.Suspense fallback={null}>
            <LanguageMenu
              translations={translations}
              native={native}
              locale={locale}
            />
          </React.Suspense>
        )}
      </div>
    </aside>
  );
}
