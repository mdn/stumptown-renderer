import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// we include our base SASS here to ensure it is loaded
// and applied before any component specific style
import "./app.scss";

import { CRUD_MODE, ENABLE_PLUS } from "./constants";
import { Homepage } from "./homepage";
import { Document } from "./document";
import { A11yNav } from "./ui/molecules/a11y-nav";
import { Footer } from "./ui/organisms/footer";
import { Header } from "./ui/organisms/header";
import { SiteSearch } from "./site-search";
import { Loading } from "./ui/atoms/loading";
import { PageContentContainer } from "./ui/atoms/page-content";
import { PageNotFound } from "./page-not-found";
// import { Banner } from "./banners";
import { SignIn, SignUp } from "./auth";
import { Settings } from "./settings";
import { Plus } from "./plus";

const AllFlaws = React.lazy(() => import("./flaws"));
const AllTraits = React.lazy(() => import("./traits"));
const AllTranslations = React.lazy(() => import("./translations"));
const DocumentEdit = React.lazy(() => import("./document/forms/edit"));
const DocumentCreate = React.lazy(() => import("./document/forms/create"));
const DocumentManage = React.lazy(() => import("./document/forms/manage"));
const WritersHomepage = React.lazy(() => import("./writers-homepage"));
const Sitemap = React.lazy(() => import("./sitemap"));

const isServer = typeof window === "undefined";

function Layout({ pageType, children }) {
  return (
    <>
      <A11yNav />
      {/* Commented out for now. Kept as a record/reminder of how we implement
       banners. As of May 27, 2021 we don't have any banners to show. At all.

       Note, if you do uncomment banners again (because there's one to possible
       display), remember to go to
       */}
      {/* {!isServer && <Banner />} */}
      <div className={`page-wrapper ${pageType}`}>
        <Header />
        {children}
      </div>
      <Footer />

      {/* Shown on mobile when main navigation is expanded to provide a clear distinction between the foreground menu and the page content */}
      <div className="page-overlay hidden"></div>
    </>
  );
}

function StandardLayout({ children }) {
  return <Layout pageType="standard-page">{children}</Layout>;
}
function DocumentLayout({ children }) {
  return <Layout pageType="document-page">{children}</Layout>;
}

/** This component exists so you can dynamically change which sub-component to
 * render depending on the conditions. In particular, we need to be able to
 * render the <PageNotFound> component, in server-side rendering, if told to do
 * so. But if the client then changes the location (by clicking a <Link>
 * or a react-router navigate() call) we need to ignore the fact that it was
 * originally not found. Perhaps, this new location that the client is
 * requesting is going to work.
 */
function PageOrPageNotFound({ pageNotFound, children }) {
  // It's true by default if the SSR rendering says so.
  const [notFound, setNotFound] = React.useState<boolean>(!!pageNotFound);
  const { pathname } = useLocation();
  const initialPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (initialPathname.current && initialPathname.current !== pathname) {
      setNotFound(false);
    }
  }, [pathname]);

  return notFound ? (
    <StandardLayout>
      <PageNotFound />
    </StandardLayout>
  ) : (
    children
  );
}

function LoadingFallback({ message }: { message?: string }) {
  return (
    <StandardLayout>
      <PageContentContainer>
        {/* This extra minHeight is just so that the footer doesn't flicker
          in and out as the fallback appears. */}
        <Loading minHeight={800} message={message || "Loading…"} />
      </PageContentContainer>
    </StandardLayout>
  );
}

export function App(appProps) {
  // When preparing a build for use in the NPM package, CRUD_MODE is always true.
  // But if the App is loaded from the code that builds the SPAs, then `isServer`
  // is true. So you have to have `isServer && CRUD_MODE` at the same time.
  const homePage =
    !isServer && CRUD_MODE ? (
      <Layout pageType="standard-page">
        <WritersHomepage />
      </Layout>
    ) : (
      <PageOrPageNotFound pageNotFound={appProps.pageNotFound}>
        <Layout pageType="standard-page">
          <Homepage {...appProps} />
        </Layout>
      </PageOrPageNotFound>
    );

  const routes = (
    <Routes>
      {/*
        Note, this can only happen in local development.
        In production, all traffic at `/` is redirected to at least
        having a locale. So it'll be `/en-US` (for example) by the
        time it hits any React code.
       */}
      <Route path="/" element={homePage} />
      <Route
        path="/:locale/*"
        element={
          <Routes>
            {CRUD_MODE && (
              <>
                <Route
                  path="/_flaws"
                  element={
                    <StandardLayout>
                      <AllFlaws />
                    </StandardLayout>
                  }
                />
                <Route
                  path="/_translations"
                  element={
                    <StandardLayout>
                      <AllTranslations />
                    </StandardLayout>
                  }
                />
                <Route
                  path="/_traits/*"
                  element={
                    <StandardLayout>
                      <AllTraits />
                    </StandardLayout>
                  }
                />
                <Route
                  path="/_edit/*"
                  element={
                    <StandardLayout>
                      <DocumentEdit />
                    </StandardLayout>
                  }
                />

                {/* The following two are not "enabled". I.e. no link to them.
                    See https://github.com/mdn/yari/issues/1614
                 */}
                <Route
                  path="/_create/*"
                  element={
                    <StandardLayout>
                      <DocumentCreate />
                    </StandardLayout>
                  }
                />
                <Route
                  path="/_manage/*"
                  element={
                    <StandardLayout>
                      <DocumentManage />
                    </StandardLayout>
                  }
                />

                {/*
                This route exclusively exists for development on the <PageNotFound>
                component itself.
                Because it's impossible to trigger a 404 when using the React dev
                server, the one on localhost:3000, you can use this endpoint
                to simulate it.
                 */}
                <Route
                  path="/_404/*"
                  element={
                    <StandardLayout>
                      <PageNotFound />
                    </StandardLayout>
                  }
                />

                {/*
                This route exclusively exists for development on the <Homepage>
                component itself.
                Normally, you get to the home page by NOT being in CRUD_MODE, but
                if you want to use the hot-reloading app, it might be convenient
                to be able to run it locally
                 */}
                <Route
                  path="/_homepage/*"
                  element={
                    <StandardLayout>
                      <Homepage />
                    </StandardLayout>
                  }
                />

                <Route
                  path="/_sitemap/*"
                  element={
                    <StandardLayout>
                      <Sitemap />
                    </StandardLayout>
                  }
                />
              </>
            )}
            <Route path="/" element={homePage} />
            <Route
              path="/search"
              element={
                <StandardLayout>
                  <SiteSearch />
                </StandardLayout>
              }
            />
            <Route
              path="/signin"
              element={
                <StandardLayout>
                  <SignIn />
                </StandardLayout>
              }
            />
            <Route
              path="/signup"
              element={
                <StandardLayout>
                  <SignUp />
                </StandardLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <StandardLayout>
                  <Settings {...appProps} />
                </StandardLayout>
              }
            />
            {ENABLE_PLUS && (
              <Route
                path="/plus"
                element={
                  <StandardLayout>
                    <Plus />
                  </StandardLayout>
                }
              />
            )}
            <Route
              path="/docs/*"
              element={
                <PageOrPageNotFound pageNotFound={appProps.pageNotFound}>
                  <DocumentLayout>
                    <Document {...appProps} />
                  </DocumentLayout>
                </PageOrPageNotFound>
              }
            />
            <Route
              path="*"
              element={
                <StandardLayout>
                  <PageNotFound />
                </StandardLayout>
              }
            />
          </Routes>
        }
      />
    </Routes>
  );
  /* This might look a bit odd but it's actually quite handy.
   * This way, when rendering client-side, we wrap all the routes in
   * <React.Suspense> but in server-side rendering that goes away.
   */
  return isServer ? (
    routes
  ) : (
    <React.Suspense fallback={<LoadingFallback />}>{routes}</React.Suspense>
  );
}
