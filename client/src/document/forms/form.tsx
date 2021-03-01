import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";

import "./form.scss";

type DocumentFormData = {
  rawHTML: string;
  metadata: { title: string; slug: string };
};

// Same as DocumentFormData but metadata also includes the locale
export type DocumentOutData = DocumentFormData & {
  metadata: DocumentFormData["metadata"] & { locale: string };
};

export function DocumentForm({
  onSave,
  doc,
  isSaving,
  savingError,
}: {
  onSave: (doc: DocumentOutData) => unknown;
  doc: DocumentFormData;
  isSaving?: boolean;
  savingError?: null | Error;
}) {
  const { locale } = useParams();

  const [revisions, setRevisions] = React.useState<DocumentOutData[]>([]);

  async function onSaveWrapper(doc: DocumentOutData) {
    await onSave(doc);
    console.log("AFTER SAVE", doc);
    function isDifferentDoc(previousDoc: DocumentOutData): boolean {
      return (
        previousDoc.rawHTML !== doc.rawHTML ||
        previousDoc.metadata.title !== doc.metadata.title
      );
    }
    if (!revisions.length || isDifferentDoc(revisions[revisions.length - 1])) {
      setRevisions([...revisions, Object.assign({}, doc)]);
    }
  }

  const [title, setTitle] = useState(doc.metadata.title);
  const [rawHTML, setRawHtml] = useState(doc.rawHTML);

  const autosaveEnabled = true;

  // In auto-save mode inputs should still be changeable during saving
  const disableInputs = !autosaveEnabled && isSaving;

  const { callback: debounceCallback } = useDebouncedCallback(
    onSaveWrapper,
    600
  );

  useEffect(() => {
    if (autosaveEnabled) {
      debounceCallback({
        rawHTML,
        metadata: { title, locale, slug: doc.metadata.slug },
      });
    }
  }, [autosaveEnabled, debounceCallback, title, rawHTML, locale]);

  return (
    <form
      className="document-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSaveWrapper({
          rawHTML,
          metadata: { title, locale, slug: doc.metadata.slug },
        });
      }}
    >
      <p>
        <label>
          Title
          <input
            disabled={disableInputs}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ width: "100%" }}
          />
        </label>
      </p>

      <textarea
        disabled={disableInputs}
        value={rawHTML}
        onChange={(event) => setRawHtml(event.target.value)}
        style={{ width: "100%", minHeight: 700 }}
      />
      {savingError && (
        <div className="error-message submission-error">
          <p>Error saving document</p>
          <pre>{savingError.toString()}</pre>
        </div>
      )}
      {revisions.length > 1 && (
        <p>
          {revisions.length - 1} edit{revisions.length - 1 === 1 ? "" : "s"}
        </p>
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
