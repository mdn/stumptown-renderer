import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Source } from "./types";

import styles from "./editthispage.module.scss";

export function EditThisPage({ source }: { source: Source }) {
  const [opening, setOpening] = useState(false);
  const [editorOpeningError, setEditorOpeningError] = useState<Error | null>(
    null
  );

  useEffect(() => {
    let unsetOpeningTimer: ReturnType<typeof setTimeout>;
    if (opening) {
      unsetOpeningTimer = setTimeout(() => {
        setOpening(false);
      }, 3000);
    }
    return () => {
      if (unsetOpeningTimer) {
        clearTimeout(unsetOpeningTimer);
      }
    };
  }, [opening]);

  const { github_url, folder } = source;

  async function openInEditorHandler(event: React.MouseEvent) {
    event.preventDefault();

    const filepath = folder + "/index.html";
    console.log(`Going to try to open ${filepath} in your editor`);
    setOpening(true);
    try {
      const response = await fetch(`/_open?filepath=${filepath}`);
      if (!response.ok) {
        if (response.status >= 500) {
          setEditorOpeningError(
            new Error(`${response.status}: ${response.statusText}`)
          );
        } else {
          const body = await response.text();
          setEditorOpeningError(new Error(`${response.status}: ${body}`));
        }
      }
    } catch (err) {
      setEditorOpeningError(err);
    }
  }
  if (!source) {
    return null;
  }

  return (
    <div className={styles.root}>
      <a
        href={github_url}
        title={`Folder: ${folder}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Edit this page in <b>GitHub</b>
      </a>
      {process.env.NODE_ENV === "development" && (
        <>
          {" "}
          Edit this page{" "}
          <Link href={window.location.pathname.replace("/docs/", "/_edit/")}>
            <a>
              in your <b>browser</b>
            </a>
          </Link>{" "}
          <button title={`Folder: ${folder}`} onClick={openInEditorHandler}>
            in your <b>editor</b>
          </button>
          <br />
          {editorOpeningError ? (
            <p className={`error-message ${styles.openingError}`}>
              <b>Error opening page in your editor!</b>
              <br />
              <code>{editorOpeningError.toString()}</code>
            </p>
          ) : (
            opening && <small>Trying to your editor now...</small>
          )}
        </>
      )}
    </div>
  );
}
