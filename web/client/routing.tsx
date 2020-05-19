import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

export function NoMatch() {
  const pathname = useParams()["*"];
  const message = "";
  useEffect(() => {
    document.title = "Page Not Found";
  });
  return (
    <div>
      <h3>Page Not Found</h3>
      <p>{message ? message : `Sorry, no document for ${pathname}.`}</p>
      <p>
        <Link to="/">Go back to the home page</Link>
      </p>
    </div>
  );
}
