import React, { useEffect } from "react";
import useSWR from "swr";
import { humanizeFlawName } from "../flaw-utils";
import styles from "./flaws.module.scss";

interface FlawCheck {
  count: number;
  name: string;
  flaws: any[];
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

export default Flaws;

function BrokenLinks({ urls }: { urls: string[] }) {
  // urls has repeats so turn it into a count for each
  const urlsWithCount = Array.from(
    urls
      .reduce<Map<string, number>>(
        (map, url) => map.set(url, (map.get(url) || 0) + 1),
        new Map()
      )
      .entries()
    // If we don't sort them, their visual presence isn't predictable.
  ).sort(([url1], [url2]) => url1.localeCompare(url2));

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
    for (const anchor of [
      ...document.querySelectorAll<HTMLAnchorElement>("div.content a[href]"),
    ]) {
      const hrefURL = new URL(anchor.href);
      const { pathname, hash } = hrefURL;
      if (pathname in data.redirects) {
        // Trouble! But is it a redirect?
        let correctURI = data.redirects[pathname];
        if (correctURI) {
          if (hash) {
            correctURI += hash;
          }
          // It can be fixed!
          anchor.classList.add(styles.brokenLinkRedirect);
          anchor.title = `Consider fixing! It's actually a redirect to ${correctURI}`;
        } else {
          anchor.classList.add(styles.brokenLink404);
          anchor.title = "Broken link! Links to a page that will not be found";
        }
      }
    }
    return () => {
      // Undo setting those extra classes and titles
      for (const anchor of Array.from(
        document.querySelectorAll<HTMLAnchorElement>(styles.brokenLinkRedirect)
      )) {
        anchor.classList.remove(styles.brokenLinkRedirect);
        anchor.title = "";
      }
      for (const anchor of Array.from(
        document.querySelectorAll<HTMLAnchorElement>(styles.brokenLink404)
      )) {
        anchor.classList.remove(styles.brokenLink404);
        anchor.title = "";
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
        <div className="error-message">
          <p className={styles.fetchError}>Error checking for redirects:</p>
          <pre>{error.toString()}</pre>
        </div>
      )}
      <ol>
        {urlsWithCount.map(([url, count]) => (
          <li key={url}>
            <code>{url}</code>{" "}
            <i>
              {count} {count === 1 ? "time" : "times"}
            </i>{" "}
            {data && data.redirects[url] && (
              <span>
                <b>Actually a redirect!</b> to...{" "}
                <code>{data.redirects[url]}</code>
              </span>
            )}
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
          <details key={key} className={styles.details}>
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
