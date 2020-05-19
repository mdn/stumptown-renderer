import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  lazy,
  useReducer,
  Suspense,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { Doc } from "./types";

// Ingredients
import { Prose, ProseWithHeading } from "./ingredients/prose";
import { InteractiveExample } from "./ingredients/interactive-example";
import { Attributes } from "./ingredients/attributes";
import { Examples } from "./ingredients/examples";
import { LinkList, LinkLists } from "./ingredients/link-lists";
import { Specifications } from "./ingredients/specifications";
import { BrowserCompatibilityTable } from "./ingredients/browser-compatibility-table";

// Misc
import { humanizeFlawName } from "../flaw-utils";

// Sub-components
import { DocumentTranslations } from "./languages";
import { EditThisPage } from "./editthispage";

import styles from "./index.module.scss";

// Lazy sub-components
const DocumentSpy = lazy(() => import("./spy"));
const DocumentFlaws = lazy(() => import("./flaws"));

export function Document(props /* TODO: define a TS interface for this */) {
  const router = useRouter();
  const { locale, slug } = router.query;

  const [doc, setDoc] = useState<Doc | null>(props.doc || null);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<null | Error | Response>(
    null
  );

  useEffect(() => {
    if (doc) {
      document.title = doc.title;
      if (loading) {
        setLoading(false);
      }
      if (loadingError) {
        setLoadingError(null);
      }
    }
  }, [doc, loading, loadingError]);

  useEffect(() => {
    setLoading(false);
  }, [loadingError]);

  const getCurrentDocumentUri = useCallback(() => {
    let pathname = `/${locale}/docs/${
      Array.isArray(slug) ? slug.join("/") : ""
    }`;
    // If you're in local development Express will force the trailing /
    // on any URL. We can't keep that if we're going to compare the current
    // pathname with the document's mdn_url.
    if (pathname.endsWith("/")) {
      pathname = pathname.substring(0, pathname.length - 1);
    }
    return pathname;
  }, [slug, locale]);

  const fetchDocument = useCallback(async () => {
    let url = getCurrentDocumentUri();
    url += "/index.json";
    console.log("OPENING", url);
    let response: Response;
    try {
      response = await fetch("/api/docs" + url);
    } catch (ex) {
      setLoadingError(ex);
      return;
    }
    if (!response.ok) {
      console.warn(response);
      setLoadingError(response);
    } else {
      if (response.redirected) {
        // Fetching that data required a redirect!
        // XXX perhaps do a route redirect here in React?
        console.warn(`${url} was redirected to ${response.url}`);
      }
      const data = await response.json();
      setDoc(data.doc);
    }
  }, [getCurrentDocumentUri]);

  // There are 2 reasons why you'd want to call fetchDocument():
  // - The slug/locale combo has *changed*
  // - The page started with no props.doc
  useEffect(() => {
    if (
      !props.doc ||
      getCurrentDocumentUri().toLowerCase() !== props.doc.mdn_url.toLowerCase()
    ) {
      setLoading(true);
      fetchDocument();
    }
  }, [slug, locale, props.doc, getCurrentDocumentUri, fetchDocument]);

  function onMessage(data) {
    if (data.documentUri === getCurrentDocumentUri()) {
      // The recently edited document is the one we're currently looking at!
      fetchDocument();
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }
  if (loadingError) {
    // Was it because of a 404?
    if (
      typeof window !== "undefined" &&
      loadingError instanceof Response &&
      loadingError.status === 404
    ) {
      //TODO: NoMatch
      return null;
    } else {
      return <LoadingError error={loadingError} />;
    }
  }
  if (!doc) {
    return null;
  }

  const translations = [...(doc.other_translations || [])];
  if (doc.translation_of) {
    translations.unshift({
      locale: "en-US",
      slug: doc.translation_of,
    });
  }
  return (
    <>
      <h1 className="page-title">{doc.title}</h1>
      {translations && !!translations.length && (
        <DocumentTranslations translations={translations} />
      )}
      <div className="main">
        <nav>{doc.parents && <Breadcrumbs parents={doc.parents} />}</nav>

        <div className="sidebar">
          <RenderSideBar doc={doc} />
        </div>
        <div className="content">
          <RenderDocumentBody doc={doc} />
          <hr />
          {false && process.env.NODE_ENV === "development" && (
            <ToggleDocumentFlaws doc={doc} />
          )}
          <EditThisPage source={doc.source} />
          {doc.contributors && <Contributors contributors={doc.contributors} />}
        </div>
      </div>

      {process.env.NODE_ENV === "development" && (
        <Suspense
          fallback={
            <p className={styles.loadingDocumentSpy}>Loading document spy</p>
          }
        >
          <DocumentSpy onMessage={onMessage} />
        </Suspense>
      )}
    </>
  );
}

function Breadcrumbs({ parents }) {
  if (!parents.length) {
    throw new Error("Empty parents array");
  }
  return (
    <ol
      typeof="BreadcrumbList"
      vocab="https://schema.org/"
      aria-label="breadcrumbs"
    >
      {parents.map((parent, i) => {
        const isLast = i + 1 === parents.length;
        return (
          <li key={parent.uri} property="itemListElement" typeof="ListItem">
            <Link href={parent.uri}>
              <a
                className={isLast ? "crumb-current-page" : "breadcrumb-chevron"}
                property="item"
                typeof="WebPage"
              >
                <span property="name">{parent.title}</span>
              </a>
            </Link>
            <meta property="position" content={i + 1} />
          </li>
        );
      })}
    </ol>
  );
}

function RenderSideBar({ doc }) {
  if (!doc.related_content) {
    if (doc.sidebarHTML) {
      return <div dangerouslySetInnerHTML={{ __html: doc.sidebarHTML }} />;
    }
    return null;
  }
  return doc.related_content.map((node) => (
    <SidebarLeaf key={node.title} parent={node} />
  ));
}

function SidebarLeaf({ parent }) {
  return (
    <div>
      <h3>{parent.title}</h3>
      <ul>
        {parent.content.map((node) => {
          if (node.content) {
            return (
              <li key={node.title}>
                <SidebarLeaflets node={node} />
              </li>
            );
          } else {
            return (
              <li key={node.uri}>
                <Link href={node.uri}>{node.title}</Link>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}

function SidebarLeaflets({ node }) {
  return (
    <details open={node.open}>
      <summary>
        {node.uri ? <Link href={node.uri}>{node.title}</Link> : node.title}
      </summary>
      <ol>
        {node.content.map((childNode) => {
          if (childNode.content) {
            return (
              <li key={childNode.title}>
                <SidebarLeaflets node={childNode} />
              </li>
            );
          } else {
            return (
              <li
                key={childNode.uri}
                className={childNode.isActive && "active"}
              >
                <Link href={childNode.uri}>{childNode.title}</Link>
              </li>
            );
          }
        })}
      </ol>
    </details>
  );
}

/** These prose sections should be rendered WITHOUT a heading. */
const PROSE_NO_HEADING = ["short_description", "overview"];

function RenderDocumentBody({ doc }) {
  return doc.body.map((section, i) => {
    if (section.type === "prose") {
      // Only exceptional few should use the <Prose/> component,
      // as opposed to <ProseWithHeading/>.
      if (!section.value.id || PROSE_NO_HEADING.includes(section.value.id)) {
        return (
          <Prose
            key={section.value.id || `prose${i}`}
            section={section.value}
          />
        );
      } else {
        return (
          <ProseWithHeading
            key={section.value.id}
            id={section.value.id}
            section={section.value}
          />
        );
      }
    } else if (section.type === "interactive_example") {
      return (
        <InteractiveExample
          key={section.value.url}
          url={section.value.url}
          height={section.value.height}
          title={doc.title}
        />
      );
    } else if (section.type === "attributes") {
      return <Attributes key={`attributes${i}`} attributes={section.value} />;
    } else if (section.type === "specifications") {
      return (
        <Specifications
          key={`specifications${i}`}
          specifications={section.value}
        />
      );
    } else if (section.type === "browser_compatibility") {
      return (
        <BrowserCompatibilityTable
          key={`browser_compatibility${i}`}
          {...section.value}
        />
      );
    } else if (section.type === "examples") {
      return <Examples key={`examples${i}`} examples={section.value} />;
    } else if (section.type === "info_box") {
      // XXX Unfinished!
      // https://github.com/mdn/stumptown-content/issues/106
      console.warn("Don't know how to deal with info_box!");
      return null;
    } else if (
      section.type === "class_constructor" ||
      section.type === "static_methods" ||
      section.type === "instance_methods"
    ) {
      return (
        <LinkList
          key={`${section.type}${i}`}
          title={section.value.title}
          links={section.value.content}
        />
      );
    } else if (section.type === "link_lists") {
      return <LinkLists key={`linklists${i}`} lists={section.value} />;
    } else {
      console.warn(section);
      throw new Error(`No idea how to handle a '${section.type}' section`);
    }
  });
}

function Contributors({ contributors }) {
  return (
    <div>
      <b>Contributors to this page:</b>
      <span dangerouslySetInnerHTML={{ __html: contributors }} />
    </div>
  );
}

function LoadingError({ error }) {
  return (
    <div className="loading-error">
      <h3>Loading Error</h3>
      {error instanceof window.Response ? (
        <p>
          <b>{error.status}</b> on <b>{error.url}</b>
          <br />
          <small>{error.statusText}</small>
        </p>
      ) : (
        <p>
          <code>{error.toString()}</code>
        </p>
      )}
      <p>
        <a href=".">Try reloading the page</a>
      </p>
    </div>
  );
}

interface FlatFlaw {
  name: string;
  flaws: string[];
  count: number;
}

const FLAWS_HASH = "#_flaws";
function ToggleDocumentFlaws({ doc }: { doc: Doc }) {
  const { flaws } = doc;
  const location = useLocation();
  const navigate = useNavigate();
  const [show, toggle] = useReducer((v) => !v, location.hash === FLAWS_HASH);
  const rootElement = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current && show && rootElement.current) {
      rootElement.current.scrollIntoView({ behavior: "smooth" });
    }
    isInitialRender.current = false;
  }, [show]);

  useEffect(() => {
    const hasShowHash = window.location.hash === FLAWS_HASH;
    if (show && !hasShowHash) {
      navigate(location.pathname + location.search + FLAWS_HASH);
    } else if (!show && hasShowHash) {
      navigate(location.pathname + location.search);
    }
  }, [location, navigate, show]);

  const flatFlaws: FlatFlaw[] = Object.entries(flaws)
    .map(([name, actualFlaws]) => ({
      name,
      flaws: actualFlaws,
      count: actualFlaws.length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div id={FLAWS_HASH.slice(1)} className="toggle-flaws" ref={rootElement}>
      {flatFlaws.length > 0 ? (
        <button type="submit" onClick={toggle}>
          {show
            ? "Hide flaws"
            : `Show flaws (${flatFlaws.map((flaw) => flaw.count).join(" + ")})`}
        </button>
      ) : (
        <p className="no-flaws">
          No known flaws at the moment
          <span role="img" aria-label="yay!">
            🍾
          </span>
        </p>
      )}

      {show ? (
        <Suspense fallback={<div>Loading document flaws...</div>}>
          <DocumentFlaws flaws={flatFlaws} />
        </Suspense>
      ) : (
        <small>
          {/* a one-liner about all the flaws */}
          {flatFlaws
            .map((flaw) => `${humanizeFlawName(flaw.name)}: ${flaw.count}`)
            .join(" + ")}
        </small>
      )}
    </div>
  );
}
