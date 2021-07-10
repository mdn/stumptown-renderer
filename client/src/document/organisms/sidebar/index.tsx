import { Link } from "react-router-dom";

import "./index.scss";
import { Doc, RelatedContent } from "../../types";
import React from "react";

const isServer = typeof window === "undefined";

function SidebarContainer({ children }: { children: React.ReactNode }) {
  return (
    <nav id="sidebar-quicklinks" className="sidebar">
      {children}
    </nav>
  );
}

export function RenderSideBar({ doc }: { doc: Doc }) {
  if (doc.related_content) {
    return (
      <SidebarContainer>
        <h4>Related Topics</h4>
        {doc.related_content.map((node) => {
          return <SidebarLeaf key={node.url || node.title} parent={node} />;
        })}
      </SidebarContainer>
    );
  }
  if (doc.sidebarHTML) {
    return (
      <SidebarContainer>
        <h4>Related Topics</h4>
        <div
          dangerouslySetInnerHTML={{
            __html: `${doc.sidebarHTML}`,
          }}
        />
      </SidebarContainer>
    );
  }
  return null;
}

function SidebarLeaf({ parent }: { parent: RelatedContent }) {
  return (
    <>
      <h5>
        {parent.url ? <a href={parent.url}>{parent.title}</a> : parent.title}
      </h5>
      <ol>
        {parent.content.map((node) => {
          if (node.content) {
            return (
              <li key={node.url || node.title} className="toggle">
                <SidebarLeaflets node={node} />
              </li>
            );
          } else {
            return (
              <li
                key={node.url}
                className={node.isActive ? "active" : undefined}
              >
                <a
                  title={
                    node.fallback
                      ? `Currently only available in ${node.fallback}`
                      : undefined
                  }
                  href={node.url}
                >
                  {node.title}
                </a>{" "}
                {node.fallback && <small>({node.fallback})</small>}
              </li>
            );
          }
        })}
      </ol>
    </>
  );
}

function SidebarLeaflets({ node }: { node: RelatedContent }) {
  return (
    <details open={node.containsActive}>
      <summary>
        {node.url ? <Link to={node.url}>{node.title}</Link> : node.title}
      </summary>
      {/* When server-side rendering, the HTML doesn't need to include all
        <details> content because it's not open by default. This makes the SSR
        HTML smaller for initial load. When React hydrates, it overrides that
        so that all `<details>` nodes are expanded.
       */}
      {(!isServer || node.containsActive) && (
        <ol>
          {node.content.map((childNode) => {
            if (childNode.content) {
              return (
                <li key={childNode.url || childNode.title}>
                  <SidebarLeaflets node={childNode} />
                </li>
              );
            } else {
              return (
                <li
                  key={childNode.url}
                  className={childNode.isActive ? "active" : undefined}
                >
                  <Hyperlink
                    url={childNode.url}
                    text={childNode.title}
                    fallback={childNode.fallback}
                    notFound={childNode.notFound}
                  />
                </li>
              );
            }
          })}
        </ol>
      )}
    </details>
  );
}

function Hyperlink({
  url,
  text,
  fallback,
  notFound,
}: {
  url: string;
  text: string;
  fallback?: string;
  notFound?: boolean;
}) {
  if (url.startsWith("http")) {
    return (
      <a href={url} className="external">
        {text}
      </a>
    );
  }

  if (notFound) {
    return (
      <span
        className="page-not-created"
        // XXX Would be nice to localize this using `macros/L10n-Common.json`
        title="The documentation about this has not yet been written; please consider contributing!"
      >
        {text}
      </span>
    );
  }

  // XXX
  // Figure out how to set 'aria-current'
  // https://reactrouter.com/web/api/NavLink/aria-current-string

  return (
    <>
      <a
        title={fallback ? `Currently only available in ${fallback}` : undefined}
        className={fallback ? "only-in-en-us" : undefined}
        href={url}
      >
        {text}
      </a>{" "}
      {fallback && <small>({fallback})</small>}
    </>
  );
}
