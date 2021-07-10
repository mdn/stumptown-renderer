import React from "react";
import { useLocation } from "react-router-dom";

import { PageContentContainer } from "../ui/atoms/page-content";
import "./index.scss";

const FallbackLink = React.lazy(() => import("./fallback-link"));

// NOTE! To hack on this component, you have to use a trick to even get to this
// unless you use the Express server on localhost:5000.
// To get here, use http://localhost:3000/en-US/_404/Whatever/you/like
// Now hot-reloading works and you can iterate faster.
// Otherwise, you can use http://localhost:5000/en-US/docs/Whatever/you/like
// (note the :5000 port) and that'll test it a bit more realistically.

export function PageNotFound() {
  const location = useLocation();
  const [url, setURL] = React.useState("");

  React.useEffect(() => {
    // If we're in a useEffect, this means we're in a client-side rendering
    // and in that case the current window.location is realistic.
    // When it's server-side rendered, the URL is "fake" just to generate
    // the "empty template" page.
    setURL(location.pathname);
  }, [location]);

  return (
    <div className="page-not-found">
      <PageContentContainer>
        {/* This string should match the `pageTitle` set in ssr/render.js */}
        <h1>Page not found</h1>

        {url && (
          <p className="sorry-message">
            Sorry, the page <code>{url}</code> could not be found.
          </p>
        )}

        {url && (
          <React.Suspense fallback={null}>
            <FallbackLink url={url} />
          </React.Suspense>
        )}

        <p>
          You've followed a link to a page that doesn't exist.
          <br />
          The page might not have been written yet or may have been deleted. It
          is also possible that the link URL is incorrect. We recommend
          searching for similar topics on MDN.
          <br />
          You can file an issue about this on{" "}
          <a href="https://github.com/mdn/content/issues" className="external">
            MDN's issue tracker
          </a>
          .<br />
          If you'd like to fix it yourself, please follow the contribution
          instructions on the{" "}
          <a href="https://github.com/mdn/content/issues" className="external">
            MDN content repo's README
          </a>
          .
        </p>
        <p>
          <a href="/">Go back to the home page</a>
        </p>
      </PageContentContainer>
    </div>
  );
}
