import React from "react";

function RenderSources({ sources }) {
  return (
    <>
      {sources.html && <h4>HTML</h4>}
      {sources.html && (
        <pre>
          {sources.html_html && (
            <code dangerouslySetInnerHTML={{ __html: sources.html_html }} />
          )}
          {!sources.html_html && <code>{sources.html}</code>}
        </pre>
      )}

      {sources.css && <h4>CSS</h4>}
      {sources.css && (
        <pre>
          {sources.css_html && (
            <code dangerouslySetInnerHTML={{ __html: sources.css_html }} />
          )}
          {!sources.css_html && <code>{sources.css}</code>}
        </pre>
      )}

      {sources.js && <h4>JavaScript</h4>}
      {sources.js && (
        <pre>
          {sources.js_html && (
            <code dangerouslySetInnerHTML={{ __html: sources.js_html }} />
          )}
          {!sources.js_html && <code>{sources.js}</code>}
        </pre>
      )}
    </>
  );
}

function RenderLiveSample({ example }) {
  const srcdoc = `<html>
  <head>
      <meta charset="utf-8">
      <style type="text/css">${example.sources.css}</style>
      <title>${example.description.title}</title>
  </head>
  <body>${example.sources.html}
      <script>${example.sources.js || ""}</script>
  </body>
</html>`;
  return (
    <>
      <h4>Result</h4>
      <iframe
        className="live-sample-frame"
        srcDoc={srcdoc}
        title={example.description.title || "Live sample"}
        width={example.description.width || "100%"}
        height={example.description.height}
        frameBorder={0}
      />
    </>
  );
}

function Example({ example }) {
  return (
    <>
      {example.description.title && <h3>{example.description.title}</h3>}

      {example.description.content && (
        <div
          dangerouslySetInnerHTML={{ __html: example.description.content }}
        />
      )}

      <RenderSources sources={example.sources} />

      {/* At the moment the author implicitly signals that an example is live
        by including width and height values for the iframe */}
      {example.description.height && <RenderLiveSample example={example} />}
    </>
  );
}

export function Examples({ examples }) {
  return (
    <>
      {examples.title && (
        <h2 id={examples.id && examples.id}>{examples.title}</h2>
      )}
      {examples.examples.map((example, i) => (
        <Example key={i} example={example} />
      ))}
    </>
  );
}
