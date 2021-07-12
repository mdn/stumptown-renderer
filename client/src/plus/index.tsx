import React from "react";
import { Routes, Route } from "react-router-dom";

import { Loading } from "../ui/atoms/loading";
import { PageContentContainer } from "../ui/atoms/page-content";
import { PageNotFound } from "../page-not-found";
const App = React.lazy(() => import("./app"));
const Bookmarks = React.lazy(() => import("./bookmarks"));

export function Plus() {
  const pageTitle = "MDN Plus";
  React.useEffect(() => {
    document.title = pageTitle;
  }, []);
  const isServer = typeof window === "undefined";

  const routes = (
    <Routes>
      <Route
        path="/"
        element={
          <React.Suspense
            fallback={<Loading minHeight={800} message={"Loading plus…"} />}
          >
            <App />
          </React.Suspense>
        }
      />
      <Route
        path="bookmarks"
        element={
          <React.Suspense
            fallback={
              <Loading minHeight={800} message={"Loading bookmarks app…"} />
            }
          >
            <div className="bookmarks">
              <Bookmarks />
            </div>
          </React.Suspense>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );

  return (
    <PageContentContainer extraClasses="plus">
      {!isServer && routes}
    </PageContentContainer>
  );
}
