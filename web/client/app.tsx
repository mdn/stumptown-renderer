import React, { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";

import { NoMatch } from "./routing";
import { SearchWidget } from "./search";
const AllFlaws = lazy(() => import("./flaws"));
const DocumentEdit = lazy(() => import("./document/edit"));

export function App(appProps) {
  const routes = (
    <Routes>
      <Route path="/" element={<Homepage />} />
      {process.env.NODE_ENV === "development" && (
        <Route path="/:locale/_flaws" element={<AllFlaws />} />
      )}
      {process.env.NODE_ENV === "development" && (
        <Route path="/:locale/_edit/*" element={<DocumentEdit />} />
      )}
      <Route path="/:locale/docs/*" element={<Document {...appProps} />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
  const isServer = typeof window === "undefined";
  return (
    <div>
      <Header />

      <section className="section">
        {/* This might look a bit odd but it's actually quite handy.
        This way, when rendering client-side, we wrap all the routes in
        <Suspense> but in server-side rendering that goes away.
         */}
        {isServer ? (
          routes
        ) : (
          <Suspense fallback={<div>Loading...</div>}>{routes}</Suspense>
        )}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1>
        <Link to="/">MDN Web Docs</Link>
      </h1>
      <SearchWidget />
    </header>
  );
}
