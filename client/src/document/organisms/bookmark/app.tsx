import React from "react";
import useSWR, { mutate } from "swr";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Doc } from "../../types";

dayjs.extend(relativeTime);

interface BookmarkedData {
  bookmarked: string | null;
  csrfmiddlewaretoken: string;
}
const API_BASE = "/api/v1/plus/bookmarks/";

export default function App({ doc }: { doc: Doc }) {
  const apiURL = `${API_BASE}bookmarked/?${new URLSearchParams({
    url: doc.mdn_url,
  }).toString()}`;
  const { data, error } = useSWR<BookmarkedData>(
    apiURL,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} on ${url}: ${text}`);
      }
      return await response.json();
    },
    {
      revalidateOnFocus: true,
    }
  );

  async function saveBookmarked() {
    if (!data) {
      return;
    }
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "X-CSRFToken": data.csrfmiddlewaretoken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!response.ok) {
      throw new Error(`${response.status} on ${response.url}`);
    }
  }

  const [hideLoadingError, setHideLoadingError] = React.useState(false);

  const [toggleError, setToggleError] = React.useState<Error | null>(null);

  // This is an optimization. When you view this page for the very first time
  // there is no way of knowing if the user has previously bookmarked it. All
  // you can do is patiently wait for the XHR to come in.
  // If this local state is NOT undefined, we can use it while waiting for
  // the data from the XHR request.
  const [localBookmarked, setLocalBookmarked] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (data && !error) {
      setLocalBookmarked(data.bookmarked);
    }
  }, [data, error]);

  const [isSaving, setSaving] = React.useState(false);

  const loading = !data;

  return (
    <div>
      {error && !hideLoadingError ? (
        <ShowLoadingError
          error={error}
          clear={() => {
            setHideLoadingError(true);
          }}
        />
      ) : (
        toggleError && (
          <ShowToggleError
            error={toggleError}
            clear={() => {
              setToggleError(null);
            }}
          />
        )
      )}
      <Button
        bookmarked={localBookmarked}
        loading={loading}
        disabled={error || toggleError || isSaving}
        toggle={async () => {
          // The first thing we do when the user has toggled it is to store it
          // in local state so that the UI feels responsive.
          // Once this is done, we can take care of sending the local state to
          // the server.
          setLocalBookmarked((before) =>
            before ? null : new Date().toString()
          );

          // Ultra-basic throttle to prevent multiple calls to saveBookmarked()
          setSaving(true);
          try {
            await saveBookmarked();
            if (toggleError) {
              setToggleError(null);
            }
            mutate(apiURL);
            return true;
          } catch (err) {
            setToggleError(err);
            return false;
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

function ShowToggleError({
  error,
  clear,
}: {
  error: Error;
  clear: () => void;
}) {
  const style = {
    backgroundColor: "white",
    border: "1px solid #ccc",
    padding: 20,
    position: "absolute",
    bottom: 20,
    right: 20,
  } as React.CSSProperties;
  return (
    <div style={style}>
      <button type="button" onClick={() => clear()}>
        X
      </button>
      <p>
        <b>Bookmark toggle error</b>
      </p>
      <p>
        <code>{error.toString()}</code>
      </p>
    </div>
  );
}

function ShowLoadingError({
  error,
  clear,
}: {
  error: Error;
  clear: () => void;
}) {
  const style = {
    backgroundColor: "white",
    border: "1px solid #ccc",
    padding: 20,
    position: "absolute",
    bottom: 20,
    right: 20,
  } as React.CSSProperties;
  return (
    <div style={style}>
      <button type="button" onClick={() => clear()}>
        X
      </button>
      <p>
        <b>Bookmark loading error</b>
      </p>
      <p>
        <code>{error.toString()}</code>
      </p>
    </div>
  );
}

function Button({
  bookmarked,
  loading,
  toggle,
  disabled,
}: {
  bookmarked: string | null;
  loading: boolean;
  toggle: () => void;
  disabled: boolean;
}) {
  const style: { [key: string]: string | number } = {
    cursor: "pointer",
    border: "0",
  };

  let title = "Not been bookmarked";
  if (disabled) {
    title = "Disabled";
  } else if (bookmarked) {
    title = `Bookmarked ${dayjs(bookmarked).fromNow()}`;
    style.color = "orange";
  } else if (loading) {
    title = "Loading";
    style.opacity = 0.5;
  }
  return (
    <button
      style={style}
      title={title}
      onClick={toggle}
      disabled={disabled || loading}
    >
      {/* Note! We're displaying the state as if you have NOT bookmarked
      it even if we still don't know yet. */}
      {!bookmarked || loading ? "☆" : "★"}
    </button>
  );
}
