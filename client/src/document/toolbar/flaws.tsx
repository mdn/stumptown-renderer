import React, { useEffect, useReducer, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { annotate, annotationGroup } from "rough-notation";
import { RoughAnnotation } from "rough-notation/lib/model";

import { humanizeFlawName } from "../../flaw-utils";
import { Doc } from "../types";
import "./flaws.scss";

interface FlatFlaw {
  name: string;
  flaws: string[];
  count: number;
}

const FLAWS_HASH = "#_flaws";
export function ToggleDocumentFlaws({ flaws }: Pick<Doc, "flaws">) {
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
    <div id={FLAWS_HASH.slice(1)} ref={rootElement}>
      {flatFlaws.length > 0 ? (
        <button type="submit" onClick={toggle}>
          {show
            ? "Hide flaws"
            : `Show flaws (${flatFlaws.map((flaw) => flaw.count).join(" + ")})`}
        </button>
      ) : (
        <p>
          No known flaws at the moment
          <span role="img" aria-label="yay!">
            🍾
          </span>
        </p>
      )}

      {show ? (
        <Flaws flaws={flatFlaws} />
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

interface FlawCheck {
  count: number;
  name: string;
  flaws: any[]; // XXX fixme!
}

function Flaws({ flaws }: { flaws: FlawCheck[] }) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This shouldn't be used in non-development builds");
  }
  return (
    <div id="document-flaws">
      {flaws.map((flaw) => {
        switch (flaw.name) {
          case "broken_links":
            return <BrokenLinks key="broken_links" urls={flaw.flaws} />;
          case "bad_bcd_queries":
            return (
              <BadBCDQueries key="bad_bcd_queries" messages={flaw.flaws} />
            );
          case "macros":
            return <Macros key="macros" messages={flaw.flaws} />;
          default:
            throw new Error(`Unknown flaw check '${flaw.name}'`);
        }
      })}
    </div>
  );
}

function BrokenLinks({ urls }: { urls: string[] }) {
  const { data, error } = useSWR(
    `/_redirects`,
    async (url) => {
      try {
        const response = await fetch(url, {
          method: "post",
          body: JSON.stringify({ urls }),
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`${response.status} on ${url}`);
        }
        return await response.json();
      } catch (err) {
        throw err;
      }
    },
    {
      // The chances of redirects to have changed since first load is
      // just too small to justify using 'revalidateOnFocus'.
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    // 'data' will be 'undefined' until the server has had a chance to
    // compute all the redirects. Don't bother until we have that data.
    if (!data) {
      return;
    }
    const annotations: RoughAnnotation[] = [];
    // If the anchor already had a title, put it into this map.
    // That way, when we restore the titles, we know what it used to be.
    const originalTitles = new Map();
    for (const anchor of [
      ...document.querySelectorAll<HTMLAnchorElement>("div.content a[href]"),
    ]) {
      const hrefURL = new URL(anchor.href);
      const { pathname, hash } = hrefURL;
      if (pathname in data.redirects) {
        // Trouble! But is it a redirect?
        let correctURI = data.redirects[pathname];
        let annotationColor = "red";
        originalTitles.set(anchor.href, anchor.title);
        if (correctURI) {
          if (hash) {
            correctURI += hash;
          }
          // It can be fixed!
          annotationColor = "orange";
          anchor.title = `Consider fixing! It's actually a redirect to ${correctURI}`;
        } else {
          anchor.title = "Broken link! Links to a page that will not be found";
        }
        annotations.push(
          annotate(anchor, {
            type: "box",
            color: annotationColor,
            animationDuration: 300,
          })
        );
      }
    }
    const ag = annotationGroup(annotations);
    ag.show();

    return () => {
      ag.hide();

      // Now, restore any 'title' attributes that were overridden.
      for (const anchor of Array.from(
        document.querySelectorAll<HTMLAnchorElement>(`div.content a`)
      )) {
        // Only look at anchors that were bothered with at all in the
        // beginning of the effect.
        if (originalTitles.has(anchor.href)) {
          const currentTitle = anchor.title;
          const originalTitle = originalTitles.get(anchor.href);
          if (currentTitle !== originalTitle) {
            anchor.title = originalTitle;
          }
        }
      }
    };
  }, [data, urls]);

  return (
    <div className="flaw flaw__broken_links">
      <h3>Broken Links</h3>
      {!data && !error && (
        <p>
          <i>Checking all URLs for redirects...</i>
        </p>
      )}
      {error && (
        <div className="error-message fetch-error">
          <p>Error checking for redirects:</p>
          <pre>{error.toString()}</pre>
        </div>
      )}
      <ol>
        {urls.map((url) => (
          <li key={url}>
            <code>{url}</code>
            {data && data.redirects[url] && (
              <span>
                Actually a redirect to... <code>{data.redirects[url]}</code>
              </span>
            )}{" "}
            <span
              role="img"
              aria-label="Click to highlight broken link"
              title="Click to highlight broken link anchor"
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                // Keep it simple! Clicking this little thing will scroll
                // the FIRST such anchor element in the DOM into view.
                // We COULD be fancy and remember which "n'th" one you clicked
                // so that clicking again will scroll the next one into view.
                // Perhaps another day.
                const annotations: RoughAnnotation[] = [];
                let firstOne = true;
                for (const anchor of [
                  ...document.querySelectorAll<HTMLAnchorElement>(
                    "div.content a[href]"
                  ),
                ]) {
                  const { pathname } = new URL(anchor.href);
                  if (pathname === url) {
                    if (firstOne) {
                      anchor.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      firstOne = false;
                    }
                    if (anchor.parentElement) {
                      annotations.push(
                        annotate(anchor, {
                          type: "circle",
                          color: "purple",
                          animationDuration: 500,
                          strokeWidth: 2,
                          padding: 6,
                        })
                      );
                    }
                  }
                }
                if (annotations.length) {
                  const ag = annotationGroup(annotations);
                  ag.show();
                  // Only show this extra highlight temporarily
                  window.setTimeout(() => {
                    ag.hide();
                  }, 2000);
                }
              }}
            >
              👀
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BadBCDQueries({ messages }) {
  return (
    <div className="flaw flaw__bad_bcd_queries">
      <h3>{humanizeFlawName("bad_bcd_queries")}</h3>
      <ul>
        {messages.map((message) => (
          <li key={message}>
            <code>{message}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface MacroErrorMessage {
  name: string;
  error: {
    path?: string;
  };
  errorMessage: string;
  line: number;
  column: number;
  filepath: string;
  sourceContext: string;
  macroName: string;
}

function Macros({ messages }: { messages: MacroErrorMessage[] }) {
  const [opening, setOpening] = React.useState<string | null>(null);
  useEffect(() => {
    let unsetOpeningTimer: ReturnType<typeof setTimeout>;
    if (opening) {
      unsetOpeningTimer = setTimeout(() => {
        setOpening(null);
      }, 3000);
    }
    return () => {
      if (unsetOpeningTimer) {
        clearTimeout(unsetOpeningTimer);
      }
    };
  }, [opening]);

  function openInEditor(msg: MacroErrorMessage, key: string) {
    const sp = new URLSearchParams();
    sp.set("filepath", msg.filepath);
    sp.set("line", `${msg.line}`);
    sp.set("column", `${msg.column}`);
    console.log(
      `Going to try to open ${msg.filepath}:${msg.line}:${msg.column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`);
  }
  return (
    <div className="flaw flaw__macros">
      <h3>{humanizeFlawName("macros")}</h3>
      {messages.map((msg) => {
        const key = `${msg.filepath}:${msg.line}:${msg.column}`;

        return (
          <details key={key}>
            <summary>
              <a
                href={`file://${msg.filepath}`}
                onClick={(event: React.MouseEvent) => {
                  event.preventDefault();
                  openInEditor(msg, key);
                }}
              >
                <code>{msg.name}</code> from <code>{msg.macroName}</code> in
                line {msg.line}:{msg.column}
              </a>{" "}
              {opening && opening === key && <small>Opening...</small>}
            </summary>
            <b>Context:</b>
            <pre>{msg.sourceContext}</pre>
            <b>Original error message:</b>
            <pre>{msg.errorMessage}</pre>
            <b>Filepath:</b>
            <br />
            <code>{msg.filepath}</code>
          </details>
        );
      })}
    </div>
  );
}
