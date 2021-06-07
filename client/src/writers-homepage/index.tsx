import React from "react";
import { Link } from "react-router-dom";
import { PageContentContainer } from "../ui/atoms/page-content";
import { Search } from "../ui/molecules/search";
import { useLocale } from "../hooks";
import "./index.scss";

// Lazy sub-components
const ViewedDocuments = React.lazy(() => import("./viewed-documents"));

export default function WritersHomepage() {
  const isServer = typeof window === "undefined";
  const locale = useLocale();

  return (
    <PageContentContainer>
      <div id="writers-homepage">
        <h2>Writer's home page</h2>

        <Search />

        {!isServer && (
          <React.Suspense fallback={null}>
            <ViewedDocuments />
          </React.Suspense>
        )}

        <h3>Sample pages</h3>
        <ul>
          <li>
            <Link to="/en-US/docs/MDN/Kitchensink">
              The Kitchensink (en-US)
            </Link>
          </li>
          <li>
            <Link to={`/${locale}/docs/Web/HTML`}>Web/HTML index</Link>
            <ul>
              <li>
                <Link to={`/${locale}/docs/Web/HTML/Element/video`}>
                  HTML/video
                </Link>
              </li>
            </ul>
          </li>

          <li>
            <Link to={`/${locale}/docs/Web/API`}>Web/API index</Link>
            <ul>
              <li>
                <Link to={`/${locale}/docs/Web/API/Fetch_API/Using_Fetch`}>
                  Using Fetch API
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link to={`/${locale}/docs/Web/CSS`}>Web/CSS index</Link>
            <ul>
              <li>
                <Link to={`/${locale}/docs/Web/CSS/Specificity`}>
                  CSS Specificity
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link to={`/${locale}/docs/Web/JavaScript`}>
              Web/JavaScript index
            </Link>
            <ul>
              <li>
                <Link
                  to={`/${locale}/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach`}
                >
                  Array.prototype.forEach()
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link
              to={`/${locale}/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs`}
            >
              Page with lots of BCD tables
            </Link>
          </li>
          <li>
            <Link
              to={`/${locale}/docs/Web/API/Document/#Browser_compatibility`}
            >
              Largest BCD table
            </Link>
          </li>
        </ul>
        <h3>Tools</h3>
        <ul>
          <li>
            <Link to={`/${locale}/_translations`}>Translations</Link>
          </li>
          <li>
            <Link to={`/${locale}/_sitemap`}>Sitemap</Link>
          </li>
          <li>
            <Link to={`/${locale}/_flaws`}>Flaws Dashboard</Link>
          </li>
          <li>
            <Link to={`/${locale}/_traits`}>All Documents Traits</Link>
          </li>
        </ul>
      </div>
    </PageContentContainer>
  );
}
