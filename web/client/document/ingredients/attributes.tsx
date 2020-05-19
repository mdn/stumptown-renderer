import React from "react";

function RenderValues({ values }) {
  return (
    <ul>
      {values.map((value) => {
        return (
          <li key={value.value}>
            <p>
              <code>{value.value}</code>
            </p>
            <div dangerouslySetInnerHTML={{ __html: value.description }} />
          </li>
        );
      })}
    </ul>
  );
}

function RenderAttributes({ attributes }) {
  if (attributes.length === 0) {
    return (
      <p>
        This element only supports the{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes">
          global attributes
        </a>
        .
      </p>
    );
  } else {
    return (
      <>
        <p>
          This element supports the{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes">
            global attributes
          </a>{" "}
          as well as the following element-specific attributes:
        </p>
        <dl>
          {attributes.map((attribute) => {
            return (
              <React.Fragment key={attribute.name}>
                <dt>
                  <p>
                    <code>{attribute.name}</code>: <i>{attribute.type}</i>
                  </p>
                </dt>
                <dd>
                  {/* XXX a div tag in the middle of a dd tag!
                  See https://github.com/mdn/yari/issues/5
                  */}
                  <div
                    dangerouslySetInnerHTML={{ __html: attribute.description }}
                  />
                  {attribute.values && attribute.values.length && (
                    <RenderValues values={attribute.values} />
                  )}
                </dd>
              </React.Fragment>
            );
          })}
        </dl>
      </>
    );
  }
}

export function Attributes({ attributes }) {
  return (
    <>
      <h2>Attributes</h2>
      <RenderAttributes attributes={attributes} />
    </>
  );
}
