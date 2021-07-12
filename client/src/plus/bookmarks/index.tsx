import React from "react";
import useSWR, { mutate } from "swr";
import {
  createSearchParams,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Loading } from "../../ui/atoms/loading";
import { useUserData } from "../../user-context";
import { useLocale } from "../../hooks";
import "./index.scss";

dayjs.extend(relativeTime);

interface Breadcrumb {
  uri: string;
  title: string;
}

interface BookmarkData {
  id: number;
  url: string;
  title: string;
  parents: Breadcrumb[];
  created: string;
}

interface BookmarksMetadata {
  page: number;
  total: number;
  per_page: number;
}

interface BookmarksData {
  items: BookmarkData[];
  metadata: BookmarksMetadata;
  csrfmiddlewaretoken: string;
}

const API_BASE = "/api/v1/plus/bookmarks/";

export default function Bookmarks() {
  const userData = useUserData();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageTitle = "Your bookmarks";
  React.useEffect(() => {
    document.title = pageTitle;
  }, []);

  const isSubscriber =
    userData && userData.isAuthenticated && userData.isSubscriber;

  const apiURL = isSubscriber ? `${API_BASE}?${searchParams.toString()}` : null;

  const { data, error } = useSWR<BookmarksData | null, Error | null>(
    apiURL,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} on ${response.url}`);
      }
      const data = (await response.json()) as BookmarksData;
      return data;
    }
  );

  React.useEffect(() => {
    if (data && data.metadata.total > 0) {
      let newTitle = `${pageTitle} (${data.metadata.total})`;
      if (data.metadata.page > 1) {
        newTitle += ` Page ${data.metadata.page}`;
      }
      document.title = newTitle;
    }
  }, [data]);

  React.useEffect(() => {
    if (data) {
      // If you're on ?page=3 and the per_page number is 10 and you have
      // 31 bookmarks. If you delete the only bookmark there on page 3,
      // it no longer makes sense to be on that page. So we force a
      // change to `?page={3 - 1}`.
      if (data.metadata.page > 1 && data.items.length === 0) {
        const newSearchParams = createSearchParams(searchParams);
        if (data.metadata.page === 2) {
          newSearchParams.delete("page");
        } else {
          newSearchParams.set("page", `${data.metadata.page - 1}`);
        }
        setSearchParams(newSearchParams);
      }
    }
  }, [data, setSearchParams, searchParams]);

  async function saveBookmarked(url: string) {
    const sp = new URLSearchParams({
      url,
    });
    const apiPostURL = `${API_BASE}bookmarked/?${sp.toString()}`;
    if (!data) {
      return false;
    }
    const response = await fetch(apiPostURL, {
      method: "POST",
      headers: {
        "X-CSRFToken": data.csrfmiddlewaretoken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!response.ok) {
      throw new Error(`${response.status} on ${response.url}`);
    }
    mutate(apiURL);
    return true;
  }

  if (!userData) {
    return <Loading message="Waiting for authentication" />;
  } else if (!userData.isAuthenticated) {
    return <NotSignedIn />;
  } else if (!userData.isSubscriber) {
    return <NotSubscriber />;
  }

  if (error) {
    return <DataError error={error} />;
  } else if (!data) {
    return <Loading message="Waiting for data" />;
  }
  return <DisplayData data={data} saveBookmarked={saveBookmarked} />;
}

function DisplayData({
  data,
  saveBookmarked,
}: {
  data: BookmarksData;
  saveBookmarked: (url: string) => Promise<boolean>;
}) {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const [toggleError, setToggleError] = React.useState<Error | null>(null);
  const [unbookmarked, setUnbookmarked] = React.useState<BookmarkData | null>(
    null
  );

  React.useEffect(() => {
    let mounted = true;
    if (unbookmarked) {
      setTimeout(() => {
        if (mounted) {
          setUnbookmarked(null);
        }
      }, 5000);
    }
    return () => {
      mounted = false;
    };
  }, [unbookmarked]);

  const maxPage = Math.ceil(data.metadata.total / data.metadata.per_page);
  const nextPage =
    data.metadata.page + 1 <= maxPage ? data.metadata.page + 1 : 0;
  const previousPage = data.metadata.page - 1 > 0 ? data.metadata.page - 1 : 0;

  function getPaginationURL(page: number) {
    const sp = createSearchParams(searchParams);
    if (page === 1) {
      sp.delete("page");
    } else {
      sp.set("page", `${page}`);
    }
    if (sp.toString()) {
      return `${pathname}?${sp.toString()}`;
    }
    return pathname;
  }

  return (
    <section>
      <h3>
        Your bookmarks ({data.metadata.total.toLocaleString()}){" "}
        {data.metadata.page > 1 && <small>Page {data.metadata.page}</small>}
      </h3>

      {data.metadata.total === 0 && (
        <p className="nothing-bookmarked">
          Nothing bookmarked yet. Go out there an explore!
        </p>
      )}

      {toggleError && (
        <div className="notecard negative">
          <h3>Server error</h3>
          <p>Unable to save your bookmark toggle on the server.</p>
          <p>
            <code>{toggleError.toString()}</code>
          </p>
          <a href={window.location.pathname}>Reload this page and try again.</a>
        </div>
      )}

      {unbookmarked && (
        <div className="notecard unbookmark">
          <p>
            Bookmark removed{" "}
            <button
              type="button"
              onClick={async () => {
                try {
                  await saveBookmarked(unbookmarked.url);
                  setUnbookmarked(null);
                  if (toggleError) {
                    setToggleError(null);
                  }
                } catch (err) {
                  setToggleError(err);
                }
              }}
            >
              Undo
            </button>
          </p>
        </div>
      )}

      {data.items.map((bookmark) => {
        return (
          <Bookmark
            key={bookmark.id}
            bookmark={bookmark}
            toggle={async () => {
              try {
                await saveBookmarked(bookmark.url);
                setUnbookmarked(bookmark);
                if (toggleError) {
                  setToggleError(null);
                }
              } catch (err) {
                setToggleError(err);
              }
            }}
          />
        );
      })}
      {(nextPage !== 0 || previousPage !== 0) && (
        <div className="pagination">
          {previousPage !== 0 && (
            <Link to={getPaginationURL(previousPage)}>Page {previousPage}</Link>
          )}{" "}
          {nextPage !== 0 && (
            <Link to={getPaginationURL(nextPage)}>Page {nextPage}</Link>
          )}
        </div>
      )}
    </section>
  );
}

function Bookmark({
  bookmark,
  toggle,
}: {
  bookmark: BookmarkData;
  toggle: () => Promise<void>;
}) {
  const created = dayjs(bookmark.created);
  const [doomed, setDoomed] = React.useState(false);

  let className = "bookmark";
  if (doomed) {
    className += " doomed";
  }

  return (
    <div key={bookmark.id} className={className}>
      {bookmark.parents.length > 0 && (
        <Breadcrumbs parents={bookmark.parents} />
      )}
      <h4>
        <a href={bookmark.url}>{bookmark.title}</a>
      </h4>
      <p>
        <small>{created.fromNow()}</small>{" "}
        <button
          type="button"
          className="remove-bookmark"
          title="Click to remove this bookmark"
          onClick={async () => {
            setDoomed(true);
            try {
              await toggle();
            } catch (error) {
              setDoomed(false);
            }
          }}
        >
          <span>☆</span>
        </button>
      </p>
    </div>
  );
}

function Breadcrumbs({ parents }: { parents: Breadcrumb[] }) {
  return (
    <ol className="breadcrumbs">
      {parents.map((parent, i) => {
        return (
          <li
            key={parent.uri}
            className={i + 1 === parents.length ? "last" : undefined}
          >
            <a href={parent.uri}>{parent.title}</a>
          </li>
        );
      })}
    </ol>
  );
}

function DataError({ error }: { error: Error }) {
  return (
    <div className="notecard negative">
      <h3>Server error</h3>
      <p>A server error occurred trying to get your bookmarks.</p>
      <p>
        <code>{error.toString()}</code>
      </p>
      <a href={window.location.pathname}>Reload this page and try again.</a>
    </div>
  );
}

function NotSignedIn() {
  const locale = useLocale();
  const sp = new URLSearchParams();
  sp.set("next", window.location.pathname);

  return (
    <>
      <h2>You have not signed in</h2>
      <Link to={`/${locale}/signin?${sp.toString()}`}>
        Please sign in to continue
      </Link>
    </>
  );
}

function NotSubscriber() {
  const locale = useLocale();
  return (
    <>
      <h2>You are signed in but not an active subscriber</h2>
      <Link to={`/${locale}/plus`}>Go to the MDN Plus home page</Link>
    </>
  );
}
