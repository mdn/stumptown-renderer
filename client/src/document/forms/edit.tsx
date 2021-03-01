import React from "react";
import { useNavigate } from "react-router-dom";
import useSWR, { mutate } from "swr";
import Modal from "react-modal";

import { Document } from "../index";
import { useDocumentURL } from "../hooks";
import { DocumentForm, DocumentOutData } from "./form";

import "./edit.scss";
import "./modal.scss";

Modal.setAppElement("#root");

export default function DocumentEdit() {
  const navigate = useNavigate();
  const documentURL = useDocumentURL();
  const fetchURL = `/_document?${new URLSearchParams({
    url: documentURL,
  }).toString()}`;
  const { data, error } = useSWR(fetchURL, async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${response.status} on ${url}`);
    }
    return await response.json();
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [savingError, setSavingError] = React.useState<Error | null>(null);
  const [updated, setUpdated] = React.useState<Date | null>(null);
  async function handleSave(data: DocumentOutData) {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/_document?url=${encodeURIComponent(documentURL)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        setSavingError(new Error(`${response.status} on ${response.url}`));
        return;
      }
      mutate(fetchURL);
      setUpdated(new Date());
    } catch (err) {
      setSavingError(err);
    } finally {
      setIsSaving(false);
    }
  }

  React.useEffect(() => {
    function escapeMaybe(event) {
      if (event.code === "Escape") {
        // Unless you're in the middle of an input, redirect out.
        if (
          !(
            event.target &&
            (event.target.tagName === "INPUT" ||
              event.target.tagName === "TEXTAREA")
          )
        ) {
          navigate(documentURL);
        }
      }
    }
    document.addEventListener("keyup", escapeMaybe);
    return () => {
      document.removeEventListener("keyup", escapeMaybe);
    };
  }, [documentURL, navigate]);

  return (
    <>
      <Modal
        isOpen={true}
        overlayClassName="modal-overlay"
        className="edit-modal"
      >
        <button
          id="close-modal"
          className="close-modal"
          onClick={() => {
            navigate(documentURL);
          }}
        >
          <span>Close modal</span>
        </button>

        {!data && !error && <p>Loading source data...</p>}
        {error && (
          <div className="attention">
            <h3>Error loading source</h3>
            <code>{error.toString()}</code>
          </div>
        )}

        <div className="document-edit-forms">
          {data && (
            <DocumentForm
              doc={data}
              {...{ isSaving, savingError }}
              onSave={handleSave}
            />
          )}
        </div>
      </Modal>

      <Document isPreview={true} updated={updated} />
    </>
  );
}
