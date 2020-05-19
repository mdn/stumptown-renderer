import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { debounce } from "throttle-debounce";

// Sub-components
import { Document } from "./";

import "./edit.scss";

function DocumentEdit(props) {
  return null;
  const { slug, locale } = props;

  const sp = new URLSearchParams();
  const url = `/${locale}/docs/${slug}`;
  sp.append("url", url);
  const fetchUrl = `/_document?${sp.toString()}`;
  const { data, error } = useSWR(fetchUrl, async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${response.status} on ${url}`);
    }
    return await response.json();
  });

  return (
    <div className="document-edit">
      <h2>
        Edit view
        <Link href={url}>
          <a className="close">close</a>
        </Link>
      </h2>

      {!data && !error && <p>Loading source data...</p>}
      {error && (
        <div>
          <h3>Error loading source</h3>
          <code>{error.toString()}</code>
        </div>
      )}
      {data && <EditForm data={data} url={url} />}
      <div className="document-edited">
        <Document />
      </div>
    </div>
  );
}

export default DocumentEdit;

function EditForm({ data, url }) {
  const [title, setTitle] = useState(data.metadata.title);
  const [summary, setSummary] = useState(data.metadata.summary);
  const [html, setHtml] = useState(data.html);
  const [loading, setLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  const [autosaveEnabled, setAutoSaveEnabled] = useLocalStorage(
    "autosaveEdit",
    false
  );
  function toggleAutoSave() {
    setAutoSaveEnabled(!autosaveEnabled);
  }

  const putDocumentDebounced = debounce(1000, putDocument);

  useEffect(() => {
    if (autosaveEnabled) {
      putDocumentDebounced({ title, summary, html });
    }
  }, [title, summary, html, autosaveEnabled]);

  function onSubmitHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    putDocument({ title, summary, html });
  }

  async function putDocument({ html, summary, title }) {
    if (!autosaveEnabled) setLoading(true);
    try {
      const response = await fetch(
        `/_document?url=${encodeURIComponent(url)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, summary, html }),
        }
      );
      if (!response.ok) {
        throw new Error(`${response.status} on ${url}`);
      }
    } catch (err) {
      setSubmissionError(err);
    }
    if (!autosaveEnabled) setLoading(false);
  }

  return (
    <form onSubmit={onSubmitHandler}>
      <p>
        <label htmlFor="id_title">Title</label>
        <input
          disabled={loading}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </p>

      <textarea
        disabled={loading}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Summary"
        rows={2}
        style={{ width: "100%" }}
      />

      <textarea
        disabled={loading}
        value={html}
        onChange={(event) => setHtml(event.target.value)}
        rows={30}
        style={{ width: "100%" }}
      />
      <p>
        <button type="submit" disabled={loading}>
          Save
        </button>

        <span className="action-options">
          <input
            type="checkbox"
            id="enable_autosave"
            checked={autosaveEnabled}
            onChange={toggleAutoSave}
          />
          <label htmlFor="enable_autosave">Enable autosave</label>
        </span>
      </p>
      {submissionError && (
        <div className="error-message submission-error">
          <p>Error saving document</p>
          <pre>{submissionError.toString()}</pre>
        </div>
      )}
    </form>
  );
}

/**
 * From https://usehooks.com/useLocalStorage/
 */
function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
}
