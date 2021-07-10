import React, { useEffect, useReducer, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { annotate, annotationGroup } from "rough-notation";
import { RoughAnnotation } from "rough-notation/lib/model";
import { diffWords } from "diff";

import { CRUD_MODE, CRUD_MODE_HOSTNAMES } from "../../constants";
import { humanizeFlawName } from "../../flaw-utils";
import { useDocumentURL } from "../hooks";
import {
  Doc,
  BrokenLink,
  MacroErrorMessage,
  BadBCDLinkFlaw,
  ImageReferenceFlaw,
  ImageWidthFlaw,
  GenericFlaw,
  BadBCDQueryFlaw,
  BadPreTagFlaw,
  SectioningFlaw,
  HeadingLinksFlaw,
  TranslationDifferenceFlaw,
  UnsafeHTMLFlaw,
} from "../types";
import "./flaws.scss";

interface FlawCount {
  name: string;
  count: number;
}

function useAnnotations(genericFlaws: GenericFlaw[]) {
  useEffect(() => {
    const annotations: RoughAnnotation[] = [];
    const elements: HTMLElement[] = [];
    for (const flaw of genericFlaws) {
      const element = document.querySelector(
        `[data-flaw="${flaw.id}"]`
      ) as HTMLElement;
      if (!element) {
        console.warn(`Flaw ID '${flaw.id}' does not exist in the DOM`);
        continue;
      }
      elements.push(element);
      const annotationColor = flaw.suggestion ? "orange" : "red";
      element.dataset.originalTitle = element.title;

      element.title = flaw.suggestion
        ? `Flaw suggestion: ${flaw.suggestion}`
        : `Flaw explanation: ${flaw.explanation}`;
      annotations.push(
        annotate(element, {
          type: "box",
          color: annotationColor,
          animationDuration: 300,
        })
      );
    }
    const ag = annotationGroup(annotations);
    ag.show();

    return () => {
      ag.hide();

      // Now, restore any 'title' attributes that were overridden.
      for (const element of elements) {
        if (element.dataset.originalTitle !== undefined) {
          element.title = element.dataset.originalTitle;
        }
      }
    };
  }, [genericFlaws]);

  function focus(flawID: string) {
    const element = document.querySelector(
      `[data-flaw="${flawID}"]`
    ) as HTMLElement;
    if (!element) return;
    const annotations: RoughAnnotation[] = [];
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    if (element.parentElement) {
      annotations.push(
        annotate(element, {
          type: "circle",
          color: "purple",
          animationDuration: 500,
          strokeWidth: 2,
          padding: 6,
        })
      );
    }

    if (annotations.length) {
      const ag = annotationGroup(annotations);
      ag.show();
      // Only show this extra highlight temporarily
      window.setTimeout(() => {
        ag.hide();
      }, 2000);
    }
  }

  function present(flawID: string) {
    return Boolean(document.querySelector(`[data-flaw="${flawID}"]`));
  }

  return {
    focus,
    present,
  };
}

const FLAWS_HASH = "#_flaws";

export function ToggleDocumentFlaws({
  doc,
  reloadPage,
}: {
  doc: Doc;
  reloadPage: () => void;
}) {
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

  const flawsCounts = Object.entries(doc.flaws)
    .map(([name, actualFlaws]) => ({
      name,
      count: actualFlaws.length,
    }))
    .sort((a, b) => b.count - a.count);

  React.useEffect(() => {
    const el = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (el) {
      let allFixableFlaws = 0;
      let allFlaws = 0;
      Object.values(doc.flaws).forEach((flaws) => {
        allFlaws += flaws.length;
        allFixableFlaws += flaws.filter((flaw) => flaw.fixable).length;
      });
      el.href = !allFlaws
        ? "/favicon-48x48-flawless.png"
        : allFlaws === allFixableFlaws
        ? "/favicon-48x48-flaws-fixable.png"
        : "/favicon-48x48-flaws.png";
    }
  }, [doc.flaws]);

  return (
    <div
      id={FLAWS_HASH.slice(1)}
      ref={rootElement}
      className="toggle-show-flaws"
    >
      {flawsCounts.length > 0 ? (
        <button type="button" className="button" onClick={toggle}>
          {show ? "Hide flaws" : "Show flaws"} (
          {flawsCounts.reduce((acc, flaw) => flaw.count + acc, 0)})
        </button>
      ) : (
        <p>
          No known flaws at the moment
          <span role="img" aria-label="yay!">
            🍾
          </span>
        </p>
      )}{" "}
      {show ? (
        <Flaws doc={doc} flaws={flawsCounts} reloadPage={reloadPage} />
      ) : (
        <span>
          {/* a one-liner about all the flaws */}
          {flawsCounts
            .map((flaw) => `${humanizeFlawName(flaw.name)}: ${flaw.count}`)
            .join(" + ")}
        </span>
      )}
    </div>
  );
}

function Flaws({
  doc,
  flaws,
  reloadPage,
}: {
  doc: Doc;
  flaws: FlawCount[];
  reloadPage: () => void;
}) {
  if (!CRUD_MODE) {
    throw new Error("This shouldn't be used in non-development builds");
  }

  const fixableFlaws = Object.values(doc.flaws)
    .map((flaws) => {
      return flaws.filter(
        (flaw) => !flaw.fixed && (flaw.fixable || flaw.externalImage)
      );
    })
    .flat();

  const isReadOnly = !CRUD_MODE_HOSTNAMES.includes(window.location.hostname);

  // Note! This will work on Windows. The filename can be sent to
  // the server in POSIX style and the `open-editor` program will make
  // this work for Windows automatically.
  const filePath = doc.source.folder + "/" + doc.source.filename;
  return (
    <div id="document-flaws">
      {!!fixableFlaws.length && !isReadOnly && (
        <FixableFlawsAction
          count={fixableFlaws.length}
          reloadPage={reloadPage}
        />
      )}

      {flaws.map((flaw) => {
        switch (flaw.name) {
          case "broken_links":
            return (
              <BrokenLinks
                key="broken_links"
                sourceFilePath={filePath}
                links={doc.flaws.broken_links}
                isReadOnly={isReadOnly}
              />
            );
          case "bad_bcd_links":
            return (
              <BadBCDLinks
                key="bad_bcd_links"
                links={doc.flaws.bad_bcd_links}
              />
            );
          case "bad_bcd_queries":
            return (
              <BadBCDQueries
                key="bad_bcd_queries"
                flaws={doc.flaws.bad_bcd_queries}
              />
            );
          case "bad_pre_tags":
            return (
              <BadPreTag
                key="bad_pre_tags"
                sourceFilePath={filePath}
                flaws={doc.flaws.bad_pre_tags}
                isReadOnly={isReadOnly}
              />
            );
          case "macros":
            return (
              <Macros
                key="macros"
                sourceFilePath={filePath}
                flaws={doc.flaws.macros}
                isReadOnly={isReadOnly}
              />
            );
          case "images":
            return (
              <Images
                key="images"
                sourceFilePath={filePath}
                images={doc.flaws.images}
                isReadOnly={isReadOnly}
              />
            );
          case "image_widths":
            return (
              <ImageWidths
                key="image_widths"
                sourceFilePath={filePath}
                flaws={doc.flaws.image_widths}
                isReadOnly={isReadOnly}
              />
            );
          case "heading_links":
            return (
              <HeadingLinks
                key="heading_links"
                sourceFilePath={filePath}
                flaws={doc.flaws.heading_links}
                isReadOnly={isReadOnly}
              />
            );
          case "unsafe_html":
            return (
              <UnsafeHTML key="unsafe_html" flaws={doc.flaws.unsafe_html} />
            );
          case "translation_differences":
            return (
              <TranslationDifferences
                key="translation_differences"
                flaws={doc.flaws.translation_differences}
              />
            );
          case "sectioning":
            return <Sectioning key="sectioning" flaws={doc.flaws.sectioning} />;
          default:
            throw new Error(`Unknown flaw check '${flaw.name}'`);
        }
      })}
    </div>
  );
}

function FixableFlawsAction({
  count,
  reloadPage,
}: {
  count: number;
  reloadPage: () => void;
}) {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [fixingError, setFixingError] = useState<Error | null>(null);

  const documentURL = useDocumentURL();

  async function fix() {
    try {
      const response = await fetch(
        `/_document/fixfixableflaws?${new URLSearchParams({
          url: documentURL,
        }).toString()}`,
        {
          method: "PUT",
        }
      );
      if (!response.ok) {
        throw new Error(`${response.status} on ${response.url}`);
      }
      setFixed(true);
    } catch (error) {
      console.error("Error trying to fix fixable flaws");

      setFixingError(error);
    } finally {
      setFixing(false);
    }
  }

  if (!count) {
    return null;
  }
  return (
    <div>
      {fixingError && (
        <p style={{ color: "red" }}>
          <b>Error:</b> <code>{fixingError.toString()}</code>
        </p>
      )}
      <button
        type="button"
        className="button"
        disabled={fixing}
        onClick={async () => {
          setFixing((prev) => !prev);
          await fix();
          // Add a tiny delay so you get a chance to see the "Fixed!" message.
          setTimeout(() => {
            reloadPage();
          }, 1000);
        }}
      >
        {fixing ? "Fixing..." : `Fix fixable flaws (${count})`}
      </button>{" "}
      {fixed && <b style={{ color: "darkgreen" }}>Fixed!</b>}
    </div>
  );
}

function FixableFlawBadge() {
  return (
    <span title="This flaw is fixable.">
      Fixable{" "}
      <span role="img" aria-label="Thumbs up">
        👍🏼
      </span>
    </span>
  );
}

function ShowDiff({ before, after }: { before: string; after: string }) {
  const diff = diffWords(before, after);
  const bits = diff.map((part, i: number) => {
    if (part.added) {
      return <ins key={i}>{part.value}</ins>;
    } else if (part.removed) {
      return <del key={i}>{part.value}</del>;
    } else {
      return <span key={i}>{part.value}</span>;
    }
  });
  return <code>{bits}</code>;
}

function BrokenLinks({
  sourceFilePath,
  links,
  isReadOnly,
}: {
  sourceFilePath: string;
  links: BrokenLink[];
  isReadOnly: boolean;
}) {
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

  function openInEditor(key: string, line: number, column: number) {
    const sp = new URLSearchParams();
    sp.set("filepath", sourceFilePath);
    sp.set("line", `${line}`);
    sp.set("column", `${column}`);
    console.log(
      `Going to try to open ${sourceFilePath}:${line}:${column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`).catch((err) => {
      console.warn(`Error trying to _open?${sp.toString()}:`, err);
    });
  }

  const { focus } = useAnnotations(links);

  return (
    <div className="flaw flaw__broken_links">
      <h3>Broken Links</h3>
      <ol>
        {links.map((flaw, i) => {
          const key = `${flaw.href}${flaw.line}${flaw.column}`;
          return (
            <li
              key={key}
              className={flaw.fixed ? "fixed_flaw" : undefined}
              title={
                flaw.fixed
                  ? "This broken link has been automatically fixed."
                  : undefined
              }
            >
              <code>{flaw.href}</code>{" "}
              <span
                role="img"
                aria-label="Click to highlight broken link"
                title="Click to highlight broken link anchor"
                style={{ cursor: "zoom-in" }}
                onClick={() => {
                  focus(flaw.id);
                }}
              >
                👀
              </span>{" "}
              {isReadOnly ? (
                <>
                  {/* It would be cool if we can change this to a link to the line in the
                  file in GitHub's UI. */}
                  line {flaw.line}:{flaw.column}
                </>
              ) : (
                <a
                  href={`file://${sourceFilePath}`}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    openInEditor(key, flaw.line, flaw.column);
                  }}
                  title="Click to open in your editor"
                >
                  line {flaw.line}:{flaw.column}
                </a>
              )}{" "}
              {flaw.fixable && <FixableFlawBadge />}{" "}
              {opening && opening === key && <span>Opening...</span>}
              <br />
              {flaw.suggestion ? (
                <span>
                  <b>Suggestion:</b>
                  <ShowDiff before={flaw.href} after={flaw.suggestion} />
                </span>
              ) : (
                <code>{flaw.explanation}</code>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BadBCDQueries({ flaws }: { flaws: BadBCDQueryFlaw[] }) {
  return (
    <div className="flaw flaw__bad_bcd_queries">
      <h3>{humanizeFlawName("bad_bcd_queries")}</h3>
      <ul>
        {flaws.map((flaw) => (
          <li key={flaw.id}>
            <code>{flaw.explanation}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BadBCDLinks({ links }: { links: BadBCDLinkFlaw[] }) {
  return (
    <div className="flaw flaw__bad_bcd_links">
      <h3>{humanizeFlawName("bad_bcd_links")}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.slug}>
            In <code>{link.query}</code> under key <code>{link.key}</code> can't
            find document: <code>{link.slug}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sectioning({ flaws }: { flaws: SectioningFlaw[] }) {
  return (
    <div className="flaw flaw__sectioning">
      <h3>{humanizeFlawName("sectioning")}</h3>
      <ul>
        {flaws.map((flaw) => (
          <li key={flaw.id}>
            <code>{flaw.explanation}</code>
            <br />
            <small>
              Usually this means there's something in the raw content that makes
              it hard to split up the rendered HTML. Perhaps delete unnecessary
              empty divs.
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BadPreTag({
  flaws,
  sourceFilePath,
  isReadOnly,
}: {
  flaws: BadPreTagFlaw[];
  sourceFilePath: string;
  isReadOnly: boolean;
}) {
  const { focus } = useAnnotations(flaws);

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

  function openInEditor(key: string, line: number, column: number) {
    const sp = new URLSearchParams();
    sp.set("filepath", sourceFilePath);
    sp.set("line", `${line}`);
    sp.set("column", `${column}`);
    console.log(
      `Going to try to open ${sourceFilePath}:${line}:${column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`).catch((err) => {
      console.warn(`Error trying to _open?${sp.toString()}:`, err);
    });
  }

  return (
    <div className="flaw flaw__bad_pre_tags">
      <h3>{humanizeFlawName("bad_pre_tags")}</h3>
      <ul>
        {flaws.map((flaw) => (
          <li key={flaw.id}>
            {flaw.explanation}{" "}
            <span
              role="img"
              aria-label="Click to highlight broken link"
              title="Click to highlight broken link anchor"
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                focus(flaw.id);
              }}
            >
              👀
            </span>{" "}
            {flaw.line && flaw.column ? (
              isReadOnly ? (
                <>
                  line {flaw.line}:{flaw.column}
                </>
              ) : (
                <a
                  href={`file://${sourceFilePath}`}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    if (flaw.line && flaw.column)
                      openInEditor(flaw.id, flaw.line, flaw.column);
                  }}
                  title="Click to open in your editor"
                >
                  line {flaw.line}:{flaw.column}
                </a>
              )
            ) : null}{" "}
            {flaw.fixable && <FixableFlawBadge />}{" "}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Macros({
  flaws,
  sourceFilePath,
  isReadOnly,
}: {
  flaws: MacroErrorMessage[];
  sourceFilePath: string;
  isReadOnly: boolean;
}) {
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

  function openInEditor(msg: MacroErrorMessage, id: string) {
    const sp = new URLSearchParams();
    sp.set("filepath", msg.filepath);
    sp.set("line", `${msg.line}`);
    sp.set("column", `${msg.column}`);
    console.log(
      `Going to try to open ${msg.filepath}:${msg.line}:${msg.column} in your editor`
    );
    setOpening(id);
    fetch(`/_open?${sp.toString()}`);
  }

  const { focus, present } = useAnnotations(flaws);

  return (
    <div className="flaw flaw__macros">
      <h3>{humanizeFlawName("macros")}</h3>
      {flaws.map((flaw) => {
        const inPrerequisiteMacro = !flaw.filepath.includes(sourceFilePath);
        return (
          <details
            key={flaw.id}
            className={flaw.fixed ? "fixed_flaw" : undefined}
            title={
              flaw.fixed
                ? "This macro flaw has been automatically fixed."
                : undefined
            }
          >
            <summary>
              <code>{flaw.name}</code> from <code>{flaw.macroName}</code>{" "}
              <span
                role="img"
                aria-label="Click to highlight broken link"
                title="Click to highlight broken link anchor"
                style={{ cursor: "zoom-in" }}
                onClick={(event) => {
                  // Otherwise, since this is part of the `<details><summary>...`
                  // we would here also be expanding the `<details>` tag.
                  event.preventDefault();

                  // Some macros such as sidebar macros don't turn as DOM
                  // elements in the HTML so they can't be focussed in on.
                  if (present(flaw.id)) {
                    focus(flaw.id);
                  } else {
                    alert("Flaw not present in the rendered HTML.");
                  }
                }}
              >
                👀
              </span>{" "}
              {isReadOnly ? (
                <>
                  line {flaw.line}:{flaw.column}
                </>
              ) : (
                <a
                  href={`file://${flaw.filepath}`}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    openInEditor(flaw, flaw.id);
                  }}
                >
                  line {flaw.line}:{flaw.column}
                </a>
              )}{" "}
              {opening && opening === flaw.id && <span>Opening...</span>}{" "}
              {inPrerequisiteMacro && (
                <span
                  className="macro-filepath-in-prerequisite"
                  title={`This page depends on a macro expansion inside ${flaw.filepath}`}
                >
                  In prerequisite macro
                </span>
              )}{" "}
              {flaw.fixable && <FixableFlawBadge />}{" "}
            </summary>
            {flaw.fixable && flaw.suggestion && (
              <>
                <b>Suggestion:</b>
                <ShowDiff before={flaw.macroSource} after={flaw.suggestion} />
                <br />
              </>
            )}
            {flaw.explanation && (
              <>
                <b>Explanation:</b> <code>{flaw.explanation}</code>
                <br />
              </>
            )}
            <b>Context:</b>
            <pre>{flaw.sourceContext}</pre>
            <b>Original error stack:</b>
            <pre>{flaw.errorStack}</pre>
            <b>Filepath:</b>{" "}
            {inPrerequisiteMacro && (
              <i className="macro-filepath-in-prerequisite">
                Note that this is different from the page you're currently
                viewing.
              </i>
            )}
            <br />
            <code>{flaw.filepath}</code>
          </details>
        );
      })}
    </div>
  );
}

function Images({
  sourceFilePath,
  images,
  isReadOnly,
}: {
  sourceFilePath: string;
  images: ImageReferenceFlaw[];
  isReadOnly: boolean;
}) {
  // XXX rewrite to a hook
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

  function openInEditor(key: string, line: number, column: number) {
    const sp = new URLSearchParams();
    sp.set("filepath", sourceFilePath);
    sp.set("line", `${line}`);
    sp.set("column", `${column}`);
    console.log(
      `Going to try to open ${sourceFilePath}:${line}:${column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`).catch((err) => {
      console.warn(`Error trying to _open?${sp.toString()}:`, err);
    });
  }

  const { focus } = useAnnotations(images);

  return (
    <div className="flaw flaw__images">
      <h3>{humanizeFlawName("images")}</h3>
      <ul>
        {images.map((flaw, i) => {
          const key = `${flaw.src}${flaw.line}${flaw.column}`;
          return (
            <li key={key}>
              <code>{flaw.src}</code>{" "}
              <span
                role="img"
                aria-label="Click to highlight image"
                title="Click to highlight image"
                style={{ cursor: "zoom-in" }}
                onClick={() => {
                  focus(flaw.id);
                }}
              >
                👀
              </span>{" "}
              {isReadOnly ? (
                <>
                  line {flaw.line}:{flaw.column}
                </>
              ) : (
                <a
                  href={`file://${sourceFilePath}`}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    openInEditor(key, flaw.line, flaw.column);
                  }}
                  title="Click to open in your editor"
                >
                  line {flaw.line}:{flaw.column}
                </a>
              )}{" "}
              {(flaw.fixable || flaw.externalImage) && <FixableFlawBadge />}{" "}
              <br />
              {flaw.suggestion && (
                <span>
                  <b>Suggestion:</b>
                  <ShowDiff before={flaw.src} after={flaw.suggestion} />
                </span>
              )}{" "}
              <span>{flaw.explanation}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ImageWidths({
  sourceFilePath,
  flaws,
  isReadOnly,
}: {
  sourceFilePath: string;
  flaws: ImageWidthFlaw[];
  isReadOnly: boolean;
}) {
  // XXX rewrite to a hook
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

  function openInEditor(key: string, line: number, column: number) {
    const sp = new URLSearchParams();
    sp.set("filepath", sourceFilePath);
    sp.set("line", `${line}`);
    sp.set("column", `${column}`);
    console.log(
      `Going to try to open ${sourceFilePath}:${line}:${column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`).catch((err) => {
      console.warn(`Error trying to _open?${sp.toString()}:`, err);
    });
  }

  const { focus } = useAnnotations(flaws);

  return (
    <div className="flaw flaw__image_widths">
      <h3>{humanizeFlawName("image_widths")}</h3>
      <ul>
        {flaws.map((flaw, i) => {
          const key = `${flaw.style}${flaw.line}${flaw.column}`;
          return (
            <li key={key}>
              <b>{flaw.explanation}</b>{" "}
              <span
                role="img"
                aria-label="Click to highlight image"
                title="Click to highlight image"
                style={{ cursor: "zoom-in" }}
                onClick={() => {
                  focus(flaw.id);
                }}
              >
                👀
              </span>{" "}
              {isReadOnly ? (
                <>
                  line {flaw.line}:{flaw.column}
                </>
              ) : (
                <a
                  href={`file://${sourceFilePath}`}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    openInEditor(key, flaw.line, flaw.column);
                  }}
                  title="Click to open in your editor"
                >
                  line {flaw.line}:{flaw.column}
                </a>
              )}{" "}
              {(flaw.fixable || flaw.externalImage) && <FixableFlawBadge />}{" "}
              <br />
              {flaw.suggestion === "" && (
                <>
                  <b>Style:</b> <code>{flaw.style}</code>
                  <br />
                </>
              )}
              {flaw.suggestion !== null && (
                <span>
                  <b>Suggestion:</b>{" "}
                  {flaw.suggestion ? (
                    <ShowDiff before={flaw.style} after={flaw.suggestion} />
                  ) : (
                    <i>
                      delete the <code>style</code> attribute
                    </i>
                  )}
                </span>
              )}{" "}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HeadingLinks({
  sourceFilePath,
  flaws,
  isReadOnly,
}: {
  sourceFilePath: string;
  flaws: HeadingLinksFlaw[];
  isReadOnly: boolean;
}) {
  // XXX rewrite to a hook
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

  function openInEditor(key: string, line: number, column: number) {
    const sp = new URLSearchParams();
    sp.set("filepath", sourceFilePath);
    sp.set("line", `${line}`);
    sp.set("column", `${column}`);
    console.log(
      `Going to try to open ${sourceFilePath}:${line}:${column} in your editor`
    );
    setOpening(key);
    fetch(`/_open?${sp.toString()}`).catch((err) => {
      console.warn(`Error trying to _open?${sp.toString()}:`, err);
    });
  }

  return (
    <div className="flaw flaw__heading_links">
      <h3>{humanizeFlawName("heading_links")}</h3>
      <ul>
        {flaws.map((flaw, i) => {
          const key = flaw.id;
          return (
            <li key={key}>
              <b>{flaw.explanation}</b>{" "}
              {flaw.line && flaw.column ? (
                isReadOnly ? (
                  <>
                    line {flaw.line}:{flaw.column}
                  </>
                ) : (
                  <a
                    href={`file://${sourceFilePath}`}
                    onClick={(event: React.MouseEvent) => {
                      event.preventDefault();
                      openInEditor(
                        key,
                        flaw.line as number,
                        flaw.column as number
                      );
                    }}
                    title="Click to open in your editor"
                  >
                    line {flaw.line}:{flaw.column}
                  </a>
                )
              ) : null}{" "}
              {flaw.fixable && <FixableFlawBadge />} <br />
              <b>HTML:</b> <code>{flaw.html}</code> <br />
              {flaw.suggestion && flaw.before ? (
                <span>
                  <b>Suggestion:</b>{" "}
                  <ShowDiff before={flaw.before} after={flaw.suggestion} />
                </span>
              ) : (
                <i>
                  All <code>&lt;a&gt;</code> tags need to be removed
                </i>
              )}{" "}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UnsafeHTML({ flaws }: { flaws: UnsafeHTMLFlaw[] }) {
  // The UI for this flaw can be a bit "simplistic" because by default this
  // flaw will error rather than warn.
  return (
    <div className="flaw">
      <h3>⚠️ {humanizeFlawName("unsafe_html")} ⚠️</h3>
      <ul>
        {flaws.map((flaw, i) => {
          const key = flaw.id;
          return (
            <li key={key}>
              <b>{flaw.explanation}</b>{" "}
              {flaw.line && flaw.column && (
                <>
                  line {flaw.line}:{flaw.column}
                </>
              )}{" "}
              {flaw.fixable && <FixableFlawBadge />} <br />
              <b>HTML:</b>
              <pre className="example-bad">{flaw.html}</pre>
              <br />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TranslationDifferences({
  flaws,
}: {
  flaws: TranslationDifferenceFlaw[];
}) {
  return (
    <div className="flaw">
      <h3>{humanizeFlawName("translation_differences")}</h3>
      <ul>
        {flaws.map((flaw, i) => (
          <li key={flaw.id}>
            {<b>{flaw.explanation}</b>}
            {flaw.difference.explanationNotes &&
              flaw.difference.explanationNotes.length > 0 && (
                <ul className="explanation-notes">
                  {flaw.difference.explanationNotes.map(
                    (explanationNotes, i) => {
                      return (
                        <li key={`${explanationNotes}${i}`}>
                          <code>{explanationNotes}</code>
                        </li>
                      );
                    }
                  )}
                </ul>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
}
