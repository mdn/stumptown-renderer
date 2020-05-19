import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.scss";
import "typeface-zilla-slab";
import { App } from "./app";
// import * as serviceWorker from './serviceWorker';

const container = document.getElementById("root");
if (!container) {
  throw new Error("missing root element");
}
let docData = null;
const documentDataElement = document.getElementById("documentdata");
if (documentDataElement) {
  docData = JSON.parse(documentDataElement.textContent || "");
}
const app = (
  <React.StrictMode>
    <Router>
      <App doc={docData} />
    </Router>
  </React.StrictMode>
);
if (container.firstElementChild) {
  ReactDOM.hydrate(app, container);
} else {
  ReactDOM.render(app, container);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
