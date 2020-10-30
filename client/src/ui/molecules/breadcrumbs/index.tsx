import React from "react";

import { DocParent } from "../../../document/types";
import { PreloadingDocumentLink } from "../../../document/preloading";

import "./index.scss";

export function Breadcrumbs({ parents }: { parents: DocParent[] }) {
  if (!parents.length) {
    throw new Error("Empty parents array");
  }

  return (
    <nav className="breadcrumbs">
      <ol
        typeof="BreadcrumbList"
        vocab="https://schema.org/"
        aria-label="breadcrumbs"
      >
        {parents.map((parent, i) => {
          const currentCrumb = i + 1;
          const isLast = currentCrumb === parents.length;
          const isPrevious = currentCrumb === parents.length - 1;

          if (!isLast) {
            return (
              <li key={parent.uri} property="itemListElement" typeof="ListItem">
                <PreloadingDocumentLink
                  to={parent.uri}
                  className={isPrevious ? "breadcrumb-previous" : "breadcrumb"}
                  property="item"
                  typeof="WebPage"
                >
                  <span property="name">{parent.title}</span>
                </PreloadingDocumentLink>
                <meta property="position" content={`${i + 1}`} />
              </li>
            );
          } else {
            return (
              <li key={parent.uri} property="itemListElement" typeof="ListItem">
                <PreloadingDocumentLink
                  to={parent.uri}
                  className="breadcrumb-current-page"
                  property="item"
                  typeof="WebPage"
                >
                  <span property="name">{parent.title}</span>
                </PreloadingDocumentLink>
                <meta property="position" content={`${i + 1}`} />
              </li>
            );
          }
        })}
      </ol>
    </nav>
  );
}
