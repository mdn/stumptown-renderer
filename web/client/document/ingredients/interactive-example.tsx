import React from "react";

export function InteractiveExample({ title, url, height }) {
  return (
    <div>
      <iframe
        title={`Interactive example for ${title}`}
        className="interactive-example"
        frameBorder={0}
        height={height}
        src={url}
        width="100%"
      />
    </div>
  );
}
