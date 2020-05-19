import React from "react";

export function Prose({ section }) {
  return <div dangerouslySetInnerHTML={{ __html: section.content }} />;
}

export function ProseWithHeading({ id, section }) {
  return (
    <>
      <h2 id={id}>{section.title}</h2>
      <Prose section={section} />
    </>
  );
}
