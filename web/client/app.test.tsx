import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter } from "react-router-dom";

import { App } from "./app";

it("renders without crashing", () => {
  const app = (
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const div = document.createElement("div");
  ReactDOM.render(app, div);
  ReactDOM.unmountComponentAtNode(div);
});
