import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { Breadcrumbs } from "../../ui/molecules/breadcrumbs";
import { Header } from "../../ui/organisms/header";
import LanguageMenu from "../../ui/molecules/language-menu";
import { Titlebar } from "../../ui/molecules/titlebar";
import { TOC } from "../../ui/molecules/toc";

import { breadcrumbParents } from "../mocks/breadcrumbs";
import { languageMenuData } from "../mocks/language-menu";
import { toc } from "../mocks/toc";

export default {
  title: "Organisms/Page Header",
};

export const pageHeader = () => (
  <>
    <Router>
      <div className={`page-wrapper reference-page`}>
        <Header />

        <Titlebar docTitle="Type selectors" />

        <div className="breadcrumb-container">
          <Breadcrumbs parents={breadcrumbParents} />
        </div>

        <div className="locale-container">
          <LanguageMenu
            translations={languageMenuData.translations}
            locale={languageMenuData.locale}
          />
        </div>
        <div className="page-content-container">
          <TOC toc={toc.toc} />
        </div>
      </div>
    </Router>
    <div className="page-overlay hidden"></div>
  </>
);
