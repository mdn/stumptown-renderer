import { DisplayH2, DisplayH3 } from "./utils";

export function SpecificationSection({
  id,
  title,
  isH3,
  specifications,
  query,
}: {
  id: string;
  title: string;
  isH3: boolean;
  specifications: Array<{
    title: string;
    bcdSpecificationURL: string;
    shortTitle: string;
  }>;
  query: string;
}) {
  function TableRow(props) {
    const spec = props.specification;

    let shortTitle = "";
    if (spec.title !== spec.shortTitle) {
      shortTitle = `(${spec.shortTitle})`;
    }

    let anchor;
    const hasAnchor = spec.bcdSpecificationURL.includes("#");
    if (hasAnchor) {
      anchor = (
        <span>
          {" "}
          <br />{" "}
          <small> # {`${spec.bcdSpecificationURL.split("#")[1]}`} </small>{" "}
        </span>
      );
    }

    return (
      <tr key={spec.bcdSpecificationURL}>
        <td>
          <a href={spec.bcdSpecificationURL}>
            {spec.title} {shortTitle} {anchor}
          </a>
        </td>
      </tr>
    );
  }

  return (
    <>
      {title && !isH3 && <DisplayH2 id={id} title={title} />}
      {title && isH3 && <DisplayH3 id={id} title={title} />}

      {specifications.length > 0 ? (
        <table className="standard-table">
          <thead>
            <tr>
              <th scope="col">Specification</th>
            </tr>
          </thead>
          <tbody>
            {specifications.map((specification) => (
              <TableRow specification={specification} />
            ))}
          </tbody>
        </table>
      ) : (
        <div className="notecard warning">
          <h4>No specification found</h4>
          <p>
            No specification data found for <code>{query}</code>.<br />
            <a href="#on-github">Check for problems with this page</a> or
            contribute a missing <code>spec_url</code> to{" "}
            <a href="https://github.com/mdn/browser-compat-data">
              mdn/browser-compat-data
            </a>
            . Also make sure the specification is included in{" "}
            <a href="https://github.com/w3c/browser-specs">w3c/browser-specs</a>
            .
          </p>
        </div>
      )}
    </>
  );
}
